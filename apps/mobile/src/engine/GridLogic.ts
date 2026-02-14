/**
 * GridLogic.ts
 * Core grid operations for the BlockJam puzzle game.
 * All functions are pure — they return new grids rather than mutating in place.
 */

import type { BlockColor } from './BlockTypes';

export type GridSize = 6 | 8 | 10;

/**
 * Each cell is either null (empty) or a BlockColor string.
 */
export type CellValue = BlockColor | null;

/**
 * The grid is a 2D array indexed as grid[row][col].
 */
export type Grid = CellValue[][];

/**
 * Describes which rows and columns are fully filled and should be cleared.
 */
export interface CompletedLines {
  rows: number[];
  cols: number[];
}

// -------------------------------------------------------------------
// Grid creation
// -------------------------------------------------------------------

/**
 * Creates a square grid of the given size, filled with null (empty) cells.
 */
export function createEmptyGrid(size: GridSize): Grid {
  const grid: Grid = [];
  for (let r = 0; r < size; r++) {
    const row: CellValue[] = [];
    for (let c = 0; c < size; c++) {
      row.push(null);
    }
    grid.push(row);
  }
  return grid;
}

// -------------------------------------------------------------------
// Piece placement checks
// -------------------------------------------------------------------

/**
 * Returns true if every occupied cell of `shape` fits on the grid
 * at the anchor position (row, col) and every target cell is empty.
 */
export function canPlacePiece(
  grid: Grid,
  shape: boolean[][],
  row: number,
  col: number,
): boolean {
  const gridRows = grid.length;
  if (gridRows === 0) return false;
  const gridCols = grid[0]!.length;
  const shapeRows = shape.length;
  if (shapeRows === 0) return false;
  const shapeCols = shape[0]!.length;

  // Quick bounds check for the bounding box of the shape
  if (row < 0 || col < 0) return false;
  if (row + shapeRows > gridRows) return false;
  if (col + shapeCols > gridCols) return false;

  for (let sr = 0; sr < shapeRows; sr++) {
    for (let sc = 0; sc < shapeCols; sc++) {
      if (shape[sr]![sc]) {
        const targetRow = row + sr;
        const targetCol = col + sc;
        if (grid[targetRow]![targetCol] !== null) {
          return false;
        }
      }
    }
  }

  return true;
}

// -------------------------------------------------------------------
// Piece placement
// -------------------------------------------------------------------

/**
 * Returns a **new** grid with the piece placed at (row, col).
 * Does NOT validate — call canPlacePiece first.
 */
export function placePiece(
  grid: Grid,
  shape: boolean[][],
  row: number,
  col: number,
  color: BlockColor,
): Grid {
  // Deep-copy the grid
  const newGrid: Grid = grid.map((r) => [...r]);

  const shapeRows = shape.length;
  const shapeCols = shape[0]!.length;

  for (let sr = 0; sr < shapeRows; sr++) {
    for (let sc = 0; sc < shapeCols; sc++) {
      if (shape[sr]![sc]) {
        newGrid[row + sr]![col + sc] = color;
      }
    }
  }

  return newGrid;
}

// -------------------------------------------------------------------
// Line completion detection
// -------------------------------------------------------------------

/**
 * Scans the grid and returns the indices of every fully-filled row
 * and every fully-filled column.
 */
export function findCompletedLines(grid: Grid): CompletedLines {
  const gridRows = grid.length;
  if (gridRows === 0) return { rows: [], cols: [] };
  const gridCols = grid[0]!.length;

  const completedRows: number[] = [];
  const completedCols: number[] = [];

  // Check rows
  for (let r = 0; r < gridRows; r++) {
    let full = true;
    for (let c = 0; c < gridCols; c++) {
      if (grid[r]![c] === null) {
        full = false;
        break;
      }
    }
    if (full) {
      completedRows.push(r);
    }
  }

  // Check columns
  for (let c = 0; c < gridCols; c++) {
    let full = true;
    for (let r = 0; r < gridRows; r++) {
      if (grid[r]![c] === null) {
        full = false;
        break;
      }
    }
    if (full) {
      completedCols.push(c);
    }
  }

  return { rows: completedRows, cols: completedCols };
}

// -------------------------------------------------------------------
// Line clearing
// -------------------------------------------------------------------

/**
 * Returns a **new** grid with the specified rows and columns cleared
 * (set to null). Cells at the intersection of a completed row AND
 * column are cleared once (no double-counting needed for the grid itself).
 */
export function clearLines(
  grid: Grid,
  rows: number[],
  cols: number[],
): Grid {
  const newGrid: Grid = grid.map((r) => [...r]);
  if (newGrid.length === 0) return newGrid;
  const gridCols = newGrid[0]!.length;
  const gridRows = newGrid.length;

  // Clear completed rows
  for (const r of rows) {
    for (let c = 0; c < gridCols; c++) {
      newGrid[r]![c] = null;
    }
  }

  // Clear completed columns
  for (const c of cols) {
    for (let r = 0; r < gridRows; r++) {
      newGrid[r]![c] = null;
    }
  }

  return newGrid;
}

// -------------------------------------------------------------------
// Fitness checks
// -------------------------------------------------------------------

/**
 * Returns true if at least one of the given piece shapes can be placed
 * somewhere on the grid. Used for game-over detection.
 */
export function canAnyPieceFit(
  grid: Grid,
  pieces: Array<{ shape: boolean[][] }>,
): boolean {
  const gridRows = grid.length;
  if (gridRows === 0) return false;
  const gridCols = grid[0]!.length;

  for (const piece of pieces) {
    const shapeRows = piece.shape.length;
    if (shapeRows === 0) continue;
    const shapeCols = piece.shape[0]!.length;

    for (let r = 0; r <= gridRows - shapeRows; r++) {
      for (let c = 0; c <= gridCols - shapeCols; c++) {
        if (canPlacePiece(grid, piece.shape, r, c)) {
          return true;
        }
      }
    }
  }

  return false;
}

// -------------------------------------------------------------------
// Utility
// -------------------------------------------------------------------

/**
 * Counts the number of empty (null) cells in the grid.
 */
export function countEmptyCells(grid: Grid): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell === null) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Counts the number of cells that would be cleared if the given rows
 * and columns were removed. Cells at intersections are counted only once.
 */
export function countClearedCells(
  _grid: Grid,
  rows: number[],
  cols: number[],
): number {
  if (_grid.length === 0) return 0;
  const gridCols = _grid[0]!.length;
  const gridRows = _grid.length;

  // Total cells in cleared rows
  const rowCells = rows.length * gridCols;
  // Total cells in cleared columns
  const colCells = cols.length * gridRows;
  // Subtract intersection cells (counted in both)
  const intersections = rows.length * cols.length;

  return rowCells + colCells - intersections;
}
