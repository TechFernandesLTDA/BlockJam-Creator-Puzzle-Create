import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors } from '@/theme/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlockPieceProps {
  /** 2D boolean matrix describing the piece shape (true = block, false = empty). */
  shape: boolean[][];
  /** Hex colour string for filled blocks (e.g. '#FF3B6F'). */
  color: string;
  /** Whether this piece has already been placed on the board. */
  isPlaced: boolean;
  /** Callback when the player taps this piece. */
  onPress: () => void;
  /** Whether this piece is the currently-selected piece. */
  isSelected: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Size of each mini-block inside the piece preview. */
const MINI_BLOCK_SIZE = 28;
/** Gap between mini-blocks. */
const MINI_BLOCK_GAP = 2;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const BlockPiece: React.FC<BlockPieceProps> = ({
  shape,
  color,
  isPlaced,
  onPress,
  isSelected,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Animate scale and glow when selection state changes.
  useEffect(() => {
    if (isSelected) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.12,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isSelected, scaleAnim, glowAnim]);

  // Interpolate shadow radius for glow effect.
  const shadowRadius = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16],
  });

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  if (isPlaced) {
    // Render an invisible placeholder to preserve layout space.
    return <View style={styles.placedPlaceholder} />;
  }

  const rows = shape.length;
  const cols = shape[0]?.length ?? 0;
  const pieceWidth = cols * MINI_BLOCK_SIZE + (cols - 1) * MINI_BLOCK_GAP;
  const pieceHeight = rows * MINI_BLOCK_SIZE + (rows - 1) * MINI_BLOCK_GAP;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isPlaced}
    >
      <Animated.View
        style={[
          styles.pieceContainer,
          {
            transform: [{ scale: scaleAnim }],
            shadowColor: color,
            shadowRadius: shadowRadius as any,
            shadowOpacity: shadowOpacity as any,
            shadowOffset: { width: 0, height: 0 },
          },
          isSelected && styles.selectedBorder,
        ]}
      >
        <View style={{ width: pieceWidth, height: pieceHeight }}>
          {shape.map((row, rowIndex) => (
            <View key={`pr-${rowIndex}`} style={styles.pieceRow}>
              {row.map((filled, colIndex) => (
                <View
                  key={`pb-${rowIndex}-${colIndex}`}
                  style={[
                    styles.miniBlock,
                    {
                      width: MINI_BLOCK_SIZE,
                      height: MINI_BLOCK_SIZE,
                      marginRight:
                        colIndex < cols - 1 ? MINI_BLOCK_GAP : 0,
                      marginBottom:
                        rowIndex < rows - 1 ? MINI_BLOCK_GAP : 0,
                    },
                    filled
                      ? { backgroundColor: color }
                      : styles.emptyMiniBlock,
                  ]}
                >
                  {filled && <View style={styles.miniBlockShine} />}
                </View>
              ))}
            </View>
          ))}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  pieceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.ui.border,
    elevation: 2,
  },
  selectedBorder: {
    borderColor: colors.ui.accent,
    borderWidth: 2,
  },
  pieceRow: {
    flexDirection: 'row',
  },
  miniBlock: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  emptyMiniBlock: {
    backgroundColor: 'transparent',
  },
  miniBlockShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  placedPlaceholder: {
    width: MINI_BLOCK_SIZE * 3 + MINI_BLOCK_GAP * 2 + 16, // approximate width
    height: MINI_BLOCK_SIZE * 3 + MINI_BLOCK_GAP * 2 + 16,
    opacity: 0,
  },
});

export default React.memo(BlockPiece);
