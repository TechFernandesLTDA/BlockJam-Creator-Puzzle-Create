import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScoreBarProps {
  /** Current accumulated score. */
  score: number;
  /** Current combo multiplier (0 or 1 = no combo). */
  combo: number;
  /** Remaining moves, or null for endless / unlimited mode. */
  movesLeft: number | null;
  /** Total lines cleared so far. */
  linesCleared: number;
  /** Target lines to clear for level completion, or null for endless. */
  targetLines: number | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ScoreBar: React.FC<ScoreBarProps> = ({
  score,
  combo,
  movesLeft,
  linesCleared,
  targetLines,
}) => {
  const showCombo = combo > 1;

  return (
    <View style={styles.container}>
      {/* Left section: score */}
      <View style={styles.scoreSection}>
        <Text style={styles.scoreLabel}>SCORE</Text>
        <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
      </View>

      {/* Right section: stats */}
      <View style={styles.statsSection}>
        {/* Combo badge */}
        {showCombo && (
          <View style={styles.comboBadge}>
            <Text style={styles.comboText}>{combo}x</Text>
          </View>
        )}

        {/* Moves left */}
        {movesLeft !== null && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>MOVES</Text>
            <Text style={styles.statValue}>{movesLeft}</Text>
          </View>
        )}

        {/* Lines cleared / target */}
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>LINES</Text>
          <Text style={styles.statValue}>
            {linesCleared}
            {targetLines !== null ? `/${targetLines}` : ''}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
  },
  scoreSection: {
    alignItems: 'flex-start',
  },
  scoreLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.xs,
    color: colors.ui.textSoft,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  scoreValue: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes['2xl'],
    color: colors.ui.text,
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  comboBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.blocks.orange,
    // Fire gradient approximation -- solid orange/red background with shadow
    shadowColor: colors.blocks.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
  },
  comboText: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes.md,
    color: colors.ui.text,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.xs,
    color: colors.ui.textSoft,
    letterSpacing: 1,
    marginBottom: 2,
  },
  statValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.lg,
    color: colors.ui.text,
  },
});

export default React.memo(ScoreBar);
