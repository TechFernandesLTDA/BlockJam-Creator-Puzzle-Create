import React, { useCallback, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useGameStore } from '@/stores/useGameStore';
import { useTutorialStore } from '@/stores/useTutorialStore';
import { canPlacePiece } from '@/engine/GridLogic';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HINT_DISPLAY_MS = 3000;
const COOLDOWN_MS = 10000;

// ---------------------------------------------------------------------------
// Hint calculation
// ---------------------------------------------------------------------------

/**
 * Count how many cells in the given row/col are already filled.
 * Higher = the row/col is closer to being completed.
 */
function lineFullness(
  grid: (string | null)[][],
  gridSize: number,
): { rowFullness: number[]; colFullness: number[] } {
  const rowFullness = new Array<number>(gridSize).fill(0);
  const colFullness = new Array<number>(gridSize).fill(0);

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r]![c] !== null) {
        rowFullness[r]!++;
        colFullness[c]!++;
      }
    }
  }
  return { rowFullness, colFullness };
}

/**
 * Score a placement position: higher = better.
 * Prefers positions near almost-complete lines and near the centre.
 */
function scorePlacement(
  row: number,
  col: number,
  shape: boolean[][],
  gridSize: number,
  rowFullness: number[],
  colFullness: number[],
): number {
  let lineScore = 0;
  const shapeRows = shape.length;
  const shapeCols = shape[0]?.length ?? 0;

  for (let sr = 0; sr < shapeRows; sr++) {
    for (let sc = 0; sc < shapeCols; sc++) {
      if (shape[sr]![sc]) {
        const r = row + sr;
        const c = col + sc;
        lineScore += rowFullness[r]! + colFullness[c]!;
      }
    }
  }

  // Prefer centre-ish positions (minor tiebreaker)
  const centre = (gridSize - 1) / 2;
  const centreRow = row + (shapeRows - 1) / 2;
  const centreCol = col + (shapeCols - 1) / 2;
  const distFromCentre =
    Math.abs(centreRow - centre) + Math.abs(centreCol - centre);
  const centreBonus = gridSize - distFromCentre; // higher when closer

  return lineScore * 10 + centreBonus;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface HintButtonProps {
  /** Whether to disable the button (e.g. during tutorial). */
  disabled?: boolean;
}

const HintButton: React.FC<HintButtonProps> = ({ disabled }) => {
  const lastUsedRef = useRef(0);

  const handlePress = useCallback(() => {
    const now = Date.now();
    if (now - lastUsedRef.current < COOLDOWN_MS) return;

    const {
      selectedPieceIndex,
      currentPieces,
      grid,
      gridSize,
    } = useGameStore.getState();
    const { showTip, showHint, clearHint } = useTutorialStore.getState();

    if (selectedPieceIndex === null) {
      showTip('hint_no_piece', 'Selecione uma peça primeiro!');
      return;
    }

    const piece = currentPieces[selectedPieceIndex];
    if (!piece || piece.isPlaced) return;

    const shape = piece.shape;
    const shapeRows = shape.length;
    const shapeCols = shape[0]?.length ?? 0;
    const { rowFullness, colFullness } = lineFullness(grid, gridSize);

    let bestScore = -Infinity;
    let bestRow = -1;
    let bestCol = -1;

    for (let r = 0; r <= gridSize - shapeRows; r++) {
      for (let c = 0; c <= gridSize - shapeCols; c++) {
        if (canPlacePiece(grid, shape, r, c)) {
          const s = scorePlacement(r, c, shape, gridSize, rowFullness, colFullness);
          if (s > bestScore) {
            bestScore = s;
            bestRow = r;
            bestCol = c;
          }
        }
      }
    }

    if (bestRow < 0) return; // no valid position (shouldn't happen if game is alive)

    // Build cells to highlight
    const cells: { row: number; col: number }[] = [];
    for (let sr = 0; sr < shapeRows; sr++) {
      for (let sc = 0; sc < shapeCols; sc++) {
        if (shape[sr]![sc]) {
          cells.push({ row: bestRow + sr, col: bestCol + sc });
        }
      }
    }

    lastUsedRef.current = now;
    showHint(cells);

    setTimeout(() => {
      clearHint();
    }, HINT_DISPLAY_MS);
  }, []);

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={disabled}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      <Text style={styles.buttonText}>?</Text>
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: colors.ui.accent,
  },
});

export default React.memo(HintButton);
