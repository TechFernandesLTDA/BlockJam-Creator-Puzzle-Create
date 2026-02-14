import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LevelSummary } from '@blockjam/shared';
import { BLOCK_COLORS } from '@blockjam/shared';
import { colors } from '@/theme/colors';
import { CreatorBadge } from './CreatorBadge';
import { DifficultyTag } from './DifficultyTag';
import { LikeButton } from './LikeButton';

interface FeedCardProps {
  level: LevelSummary;
  onPress: () => void;
  onLike: () => void;
}

// ---------------------------------------------------------------------------
// Mini Grid Preview
// ---------------------------------------------------------------------------

const PREVIEW_SIZE = 4;

/**
 * Generates a deterministic mini grid of colored cells from the level id.
 * Uses the level id as a seed to pick pseudo-random block colors so each
 * card looks unique but stays consistent across renders.
 */
function generateMiniGrid(levelId: string, gridSize: number): (string | null)[][] {
  // Simple hash from the level id
  let hash = 0;
  for (let i = 0; i < levelId.length; i++) {
    hash = ((hash << 5) - hash + levelId.charCodeAt(i)) | 0;
  }

  const cells: (string | null)[][] = [];
  const displaySize = Math.min(PREVIEW_SIZE, gridSize);

  for (let r = 0; r < displaySize; r++) {
    const row: (string | null)[] = [];
    for (let c = 0; c < displaySize; c++) {
      // Use hash to decide if cell is filled (~60% fill rate) and which color
      const seed = Math.abs(hash + r * 7 + c * 13);
      const isFilled = seed % 10 < 6;
      if (isFilled) {
        const colorIndex = seed % BLOCK_COLORS.length;
        const colorName = BLOCK_COLORS[colorIndex] as keyof typeof colors.blocks;
        row.push(colors.blocks[colorName]);
      } else {
        row.push(null);
      }
    }
    cells.push(row);
  }

  return cells;
}

const MiniGridPreview: React.FC<{ levelId: string; gridSize: number }> = ({
  levelId,
  gridSize,
}) => {
  const grid = useMemo(() => generateMiniGrid(levelId, gridSize), [levelId, gridSize]);
  const cellCount = grid.length;
  const cellSize = 100 / cellCount; // percentage

  return (
    <View style={styles.gridContainer}>
      {grid.map((row, r) => (
        <View key={r} style={styles.gridRow}>
          {row.map((cellColor, c) => (
            <View
              key={c}
              style={[
                styles.gridCell,
                {
                  width: `${cellSize}%`,
                  aspectRatio: 1,
                  backgroundColor: cellColor ?? colors.bg.surface,
                  borderRadius: 4,
                },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Feed Card
// ---------------------------------------------------------------------------

export const FeedCard: React.FC<FeedCardProps> = ({ level, onPress, onLike }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      {/* Top Section: Mini Grid Preview */}
      <View style={styles.previewSection}>
        <MiniGridPreview levelId={level.id} gridSize={level.gridSize} />
      </View>

      {/* Bottom Section: Metadata */}
      <View style={styles.infoSection}>
        {/* Creator + Difficulty Row */}
        <View style={styles.topRow}>
          <CreatorBadge name={level.creatorName} avatarUrl={level.creatorAvatar} />
          <DifficultyTag difficulty={level.difficulty} />
        </View>

        {/* Level Name */}
        <Text style={styles.levelName} numberOfLines={1}>
          {level.name}
        </Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <LikeButton
            isLiked={level.isLiked}
            count={level.likesCount}
            onPress={onLike}
          />
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>{'\u25B6'}</Text>
            <Text style={styles.statText}>{formatPlays(level.playsCount)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>{'\u2713'}</Text>
            <Text style={styles.statText}>
              {Math.round(level.completionRate * 100)}%
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

function formatPlays(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(n);
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.secondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.ui.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardPressed: {
    opacity: 0.85,
  },
  previewSection: {
    padding: 16,
    paddingBottom: 12,
    backgroundColor: colors.bg.surface,
  },
  gridContainer: {
    width: '100%',
    aspectRatio: 1,
    gap: 4,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  gridCell: {
    flex: 1,
  },
  infoSection: {
    padding: 16,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelName: {
    color: colors.ui.text,
    fontSize: 17,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    color: colors.ui.textSoft,
    fontSize: 12,
  },
  statText: {
    color: colors.ui.textSoft,
    fontSize: 13,
    fontWeight: '600',
  },
});
