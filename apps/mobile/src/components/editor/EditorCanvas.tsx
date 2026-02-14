import React, { useMemo } from 'react';
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors } from '@/theme/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EditorCanvasProps {
  /** 2D grid where each cell is a block color name (string) or null (empty). */
  grid: (string | null)[][];
  /** Board dimension (e.g. 6, 8, or 10). */
  gridSize: number;
  /** Callback when the player taps a cell. */
  onCellPress: (row: number, col: number) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_OUTER_PADDING = 24; // horizontal page padding (left + right)
const GRID_INNER_PADDING = 8;
const CELL_GAP = 2;
const CELL_BORDER_RADIUS = 6;

/**
 * Maps a block colour key to the concrete hex value from the theme.
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

const EditorCanvas: React.FC<EditorCanvasProps> = ({
  grid,
  gridSize,
  onCellPress,
}) => {
  // Auto-calculate cell size from available screen width.
  const cellSize = useMemo(() => {
    const availableWidth =
      SCREEN_WIDTH - GRID_OUTER_PADDING - GRID_INNER_PADDING * 2;
    // Account for gaps between cells: (gridSize - 1) gaps of CELL_GAP
    return Math.floor(
      (availableWidth - (gridSize - 1) * CELL_GAP) / gridSize,
    );
  }, [gridSize]);

  return (
    <View style={styles.gridContainer}>
      {grid.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((cell, colIndex) => {
            const fillColor = cell ? blockColorMap[cell] : null;
            const isLastCol = colIndex === gridSize - 1;
            const isLastRow = rowIndex === gridSize - 1;

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
                    marginRight: isLastCol ? 0 : CELL_GAP,
                    marginBottom: isLastRow ? 0 : CELL_GAP,
                  },
                  fillColor
                    ? { backgroundColor: fillColor }
                    : styles.emptyCell,
                ]}
              >
                {/* Inner shine effect for filled cells */}
                {fillColor != null && <View style={styles.cellShine} />}
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
  gridContainer: {
    alignSelf: 'center',
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    padding: GRID_INNER_PADDING,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderRadius: CELL_BORDER_RADIUS,
    overflow: 'hidden',
  },
  emptyCell: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  cellShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    borderTopLeftRadius: CELL_BORDER_RADIUS,
    borderTopRightRadius: CELL_BORDER_RADIUS,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});

export default React.memo(EditorCanvas);
