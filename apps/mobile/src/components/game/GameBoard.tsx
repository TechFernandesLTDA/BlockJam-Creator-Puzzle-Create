import React, { useMemo } from 'react';
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors } from '@/theme/colors';
import type { BlockColor } from '@blockjam/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HighlightCell {
  row: number;
  col: number;
}

interface GameBoardProps {
  /** 2D grid where each cell is a BlockColor name or null (empty). */
  grid: (string | null)[][];
  /** Board dimension (e.g. 6, 8, or 10). */
  gridSize: number;
  /** Callback when the player taps a cell. */
  onCellPress: (row: number, col: number) => void;
  /** Optional set of cells to highlight (valid placement preview). */
  highlightCells?: HighlightCell[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_PADDING = 16;
const CELL_GAP = 1;

/**
 * Maps a BlockColor key to the concrete hex value from the theme.
 */
const blockColorMap: Record<string, string> = {
  red: colors.blocks.red,
  blue: colors.blocks.blue,
  green: colors.blocks.green,
  yellow: colors.blocks.yellow,
  purple: colors.blocks.purple,
  orange: colors.blocks.orange,
  cyan: colors.blocks.cyan,
  pink: colors.blocks.pink,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const GameBoard: React.FC<GameBoardProps> = ({
  grid,
  gridSize,
  onCellPress,
  highlightCells,
}) => {
  // Calculate cell size so the board fits the screen width with padding.
  const cellSize = useMemo(() => {
    const availableWidth = SCREEN_WIDTH - BOARD_PADDING * 2;
    // Account for gaps: gridSize cells + (gridSize - 1) gaps of CELL_GAP
    return Math.floor(
      (availableWidth - (gridSize - 1) * CELL_GAP) / gridSize,
    );
  }, [gridSize]);

  // Build a fast-lookup set for highlighted cells.
  const highlightSet = useMemo(() => {
    const set = new Set<string>();
    if (highlightCells) {
      for (const cell of highlightCells) {
        set.add(`${cell.row}-${cell.col}`);
      }
    }
    return set;
  }, [highlightCells]);

  // Total board width based on calculated cell size.
  const boardWidth = cellSize * gridSize + (gridSize - 1) * CELL_GAP;

  return (
    <View style={[styles.boardContainer, { width: boardWidth }]}>
      {grid.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((cell, colIndex) => {
            const isHighlighted = highlightSet.has(
              `${rowIndex}-${colIndex}`,
            );
            const fillColor = cell ? blockColorMap[cell] ?? colors.bg.surface : null;

            return (
              <TouchableOpacity
                key={`cell-${rowIndex}-${colIndex}`}
                activeOpacity={0.7}
                onPress={() => onCellPress(rowIndex, colIndex)}
                style={[
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                    marginRight:
                      colIndex < gridSize - 1 ? CELL_GAP : 0,
                    marginBottom:
                      rowIndex < gridSize - 1 ? CELL_GAP : 0,
                  },
                  fillColor
                    ? { backgroundColor: fillColor }
                    : styles.emptyCell,
                  isHighlighted && styles.highlightedCell,
                ]}
              >
                {/* Inner shine overlay for filled cells */}
                {fillColor && <View style={styles.cellShine} />}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  boardContainer: {
    alignSelf: 'center',
    backgroundColor: colors.bg.secondary,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  emptyCell: {
    backgroundColor: colors.bg.surface,
    borderWidth: 0.5,
    borderColor: colors.ui.border,
  },
  highlightedCell: {
    borderWidth: 2,
    borderColor: colors.ui.accentGlow,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  cellShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
});

export default React.memo(GameBoard);
