/**
 * LevelValidator.ts
 * Validation logic for UGC levels in the BlockJam puzzle game.
 *
 * Ensures that user-created levels are structurally valid, within bounds,
 * and have a reasonable chance of being solvable before they are published.
 */

import { BLOCK_COLORS } from './BlockTypes';
import type { BlockColor } from './BlockTypes';
import type { Grid, GridSize } from './GridLogic';
import type { SerializedLevel, SparseCell, LevelMeta } from './LevelSerializer';
import { deserializeLevel } from './LevelSerializer';

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

export interface ValidationError {
  code: string;
  message: string;
  /** Optional detail about which field / cell caused the error. */
  detail?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface SolvabilityResult {
  solvable: boolean;
  reason: string;
  /** Maximum lines that could theoretically be cleared. */
  maxPossibleLines: number;
}

// -------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------

const VALID_GRID_SIZES: GridSize[] = [6, 8, 10];
const VALID_COLORS: Set<string> = new Set(BLOCK_COLORS);
const MAX_NAME_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 256;
const MIN_TARGET_LINES = 1;
const MIN_TARGET_MOVES = 1;
const MAX_TARGET_MOVES = 999;

// -------------------------------------------------------------------
// Main validation
// -------------------------------------------------------------------

/**
 * Validates a serialized level for structural correctness, bounds,
 * colour validity, and metadata completeness.
 *
 * @param levelData  The serialized level payload.
 * @returns          A result object with `valid`, `errors`, and `warnings`.
 */
export function validateLevel(levelData: SerializedLevel): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // --- Version ---
  if (levelData.version == null || levelData.version < 1) {
    errors.push({
      code: 'INVALID_VERSION',
      message: 'Level version must be a positive integer.',
      detail: `Got: ${levelData.version}`,
    });
  }

  // --- Grid size ---
  if (!(VALID_GRID_SIZES as number[]).includes(levelData.gridSize)) {
    errors.push({
      code: 'INVALID_GRID_SIZE',
      message: `Grid size must be one of ${VALID_GRID_SIZES.join(', ')}.`,
      detail: `Got: ${levelData.gridSize}`,
    });
  }

  // --- Cells ---
  if (!Array.isArray(levelData.cells)) {
    errors.push({
      code: 'INVALID_CELLS',
      message: 'Cells must be an array.',
    });
  } else {
    const seenPositions = new Set<string>();

    for (let i = 0; i < levelData.cells.length; i++) {
      const cell = levelData.cells[i]!;
      const cellErrors = validateCell(cell, levelData.gridSize, i);
      errors.push(...cellErrors);

      // Check for duplicate positions
      const key = `${cell.row},${cell.col}`;
      if (seenPositions.has(key)) {
        errors.push({
          code: 'DUPLICATE_CELL',
          message: `Duplicate cell at position (${cell.row}, ${cell.col}).`,
          detail: `Cell index: ${i}`,
        });
      }
      seenPositions.add(key);
    }

    // Warn if the grid is very full
    const maxCells = levelData.gridSize * levelData.gridSize;
    const fillRatio = levelData.cells.length / maxCells;
    if (fillRatio > 0.85) {
      warnings.push(
        `Grid is ${Math.round(fillRatio * 100)}% filled. This may make the level extremely difficult or impossible.`,
      );
    }

    if (levelData.cells.length === 0) {
      warnings.push('Grid has no pre-filled cells. Consider adding some for a more interesting level.');
    }
  }

  // --- Meta ---
  const metaErrors = validateMeta(levelData.meta);
  errors.push(...metaErrors);

  // --- Meta-level consistency warnings ---
  if (levelData.meta) {
    if (levelData.meta.targetLines > levelData.gridSize * 2) {
      warnings.push(
        `Target lines (${levelData.meta.targetLines}) exceeds twice the grid size (${levelData.gridSize * 2}). This may be very challenging.`,
      );
    }
    if (levelData.meta.targetMoves < levelData.meta.targetLines) {
      warnings.push(
        'Target moves is less than target lines. Players typically need at least one move per line.',
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// -------------------------------------------------------------------
// Cell validation
// -------------------------------------------------------------------

function validateCell(
  cell: SparseCell,
  gridSize: GridSize,
  index: number,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (cell.row == null || !Number.isInteger(cell.row)) {
    errors.push({
      code: 'INVALID_CELL_ROW',
      message: `Cell ${index}: row must be an integer.`,
      detail: `Got: ${cell.row}`,
    });
  } else if (cell.row < 0 || cell.row >= gridSize) {
    errors.push({
      code: 'CELL_ROW_OUT_OF_BOUNDS',
      message: `Cell ${index}: row ${cell.row} is out of bounds for grid size ${gridSize}.`,
    });
  }

  if (cell.col == null || !Number.isInteger(cell.col)) {
    errors.push({
      code: 'INVALID_CELL_COL',
      message: `Cell ${index}: col must be an integer.`,
      detail: `Got: ${cell.col}`,
    });
  } else if (cell.col < 0 || cell.col >= gridSize) {
    errors.push({
      code: 'CELL_COL_OUT_OF_BOUNDS',
      message: `Cell ${index}: col ${cell.col} is out of bounds for grid size ${gridSize}.`,
    });
  }

  if (!VALID_COLORS.has(cell.color)) {
    errors.push({
      code: 'INVALID_CELL_COLOR',
      message: `Cell ${index}: color "${cell.color}" is not a valid block color.`,
      detail: `Valid colors: ${BLOCK_COLORS.join(', ')}`,
    });
  }

  return errors;
}

// -------------------------------------------------------------------
// Meta validation
// -------------------------------------------------------------------

function validateMeta(meta: LevelMeta): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!meta) {
    errors.push({
      code: 'MISSING_META',
      message: 'Level metadata is required.',
    });
    return errors;
  }

  // Name
  if (!meta.name || typeof meta.name !== 'string' || meta.name.trim().length === 0) {
    errors.push({
      code: 'MISSING_NAME',
      message: 'Level name is required and must be a non-empty string.',
    });
  } else if (meta.name.length > MAX_NAME_LENGTH) {
    errors.push({
      code: 'NAME_TOO_LONG',
      message: `Level name must be at most ${MAX_NAME_LENGTH} characters.`,
      detail: `Got: ${meta.name.length} characters`,
    });
  }

  // Creator ID
  if (!meta.creatorId || typeof meta.creatorId !== 'string' || meta.creatorId.trim().length === 0) {
    errors.push({
      code: 'MISSING_CREATOR_ID',
      message: 'Creator ID is required.',
    });
  }

  // Target lines
  if (meta.targetLines == null || !Number.isInteger(meta.targetLines)) {
    errors.push({
      code: 'INVALID_TARGET_LINES',
      message: 'Target lines must be a positive integer.',
    });
  } else if (meta.targetLines < MIN_TARGET_LINES) {
    errors.push({
      code: 'TARGET_LINES_TOO_LOW',
      message: `Target lines must be at least ${MIN_TARGET_LINES}.`,
    });
  }

  // Target moves
  if (meta.targetMoves == null || !Number.isInteger(meta.targetMoves)) {
    errors.push({
      code: 'INVALID_TARGET_MOVES',
      message: 'Target moves must be a positive integer.',
    });
  } else if (meta.targetMoves < MIN_TARGET_MOVES) {
    errors.push({
      code: 'TARGET_MOVES_TOO_LOW',
      message: `Target moves must be at least ${MIN_TARGET_MOVES}.`,
    });
  } else if (meta.targetMoves > MAX_TARGET_MOVES) {
    errors.push({
      code: 'TARGET_MOVES_TOO_HIGH',
      message: `Target moves must be at most ${MAX_TARGET_MOVES}.`,
    });
  }

  // Target score
  if (meta.targetScore == null || typeof meta.targetScore !== 'number') {
    errors.push({
      code: 'INVALID_TARGET_SCORE',
      message: 'Target score must be a number.',
    });
  } else if (meta.targetScore < 0) {
    errors.push({
      code: 'TARGET_SCORE_NEGATIVE',
      message: 'Target score must be non-negative.',
    });
  }

  // Difficulty
  const validDifficulties: string[] = ['easy', 'medium', 'hard', 'expert'];
  if (!validDifficulties.includes(meta.difficulty)) {
    errors.push({
      code: 'INVALID_DIFFICULTY',
      message: `Difficulty must be one of: ${validDifficulties.join(', ')}.`,
      detail: `Got: ${meta.difficulty}`,
    });
  }

  // Optional description length
  if (
    meta.description != null &&
    typeof meta.description === 'string' &&
    meta.description.length > MAX_DESCRIPTION_LENGTH
  ) {
    errors.push({
      code: 'DESCRIPTION_TOO_LONG',
      message: `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters.`,
    });
  }

  return errors;
}

// -------------------------------------------------------------------
// Solvability check
// -------------------------------------------------------------------

/**
 * Performs a simplified solvability check: verifies that the level's
 * target number of line clears is achievable given the grid size,
 * pre-filled cells, and the number of moves allowed.
 *
 * This is NOT a full search / simulation. It computes an upper bound
 * on the number of lines that could possibly be cleared and compares
 * that to the target.
 *
 * Heuristic upper bound:
 *  - Each move places at most ~5 cells (largest piece).
 *  - Each time a row or column fills up, it clears.
 *  - Maximum lines per move is (gridSize rows + gridSize cols) but
 *    practically limited.
 *  - We estimate: each move can contribute to at most 2 line clears
 *    on average (generous). So maxLines ~ moves * 2.
 *  - We also check that there are enough empty cells to allow the
 *    required placements.
 *
 * @param levelData  The serialized level to check.
 * @returns          Whether the level is considered solvable.
 */
export function checkSolvability(levelData: SerializedLevel): SolvabilityResult {
  const { grid, gridSize } = deserializeLevel(levelData);
  const targetLines = levelData.meta.targetLines;
  const targetMoves = levelData.meta.targetMoves;

  // Count empty cells
  let emptyCells = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r]![c] === null) {
        emptyCells++;
      }
    }
  }

  // If there are no empty cells, no pieces can be placed at all
  if (emptyCells === 0) {
    // But there might be complete lines already in the prefilled grid
    const prefilledLines = countCompleteLinesInGrid(grid, gridSize);
    if (prefilledLines >= targetLines) {
      return {
        solvable: true,
        reason: 'Pre-filled grid already meets the target.',
        maxPossibleLines: prefilledLines,
      };
    }
    return {
      solvable: false,
      reason: 'Grid is completely full with no room to place pieces, and pre-filled lines are insufficient.',
      maxPossibleLines: prefilledLines,
    };
  }

  // Count how many lines are already almost complete (need <= 5 cells)
  const _almostCompleteRows = countAlmostCompleteLines(grid, gridSize, 'row');
  const _almostCompleteCols = countAlmostCompleteLines(grid, gridSize, 'col');

  // Upper bound estimate:
  // - Lines that are already complete in prefilled grid
  const prefilledComplete = countCompleteLinesInGrid(grid, gridSize);
  // - Each move can potentially complete at most a few lines
  //   Conservative generous estimate: each move can clear at most
  //   (number of almost-complete lines it touches + 1).
  //   We use a simpler bound: totalMoves * 2 + prefilledComplete
  //   Also bounded by total possible lines = gridSize (rows) + gridSize (cols)
  // Lines can be cleared repeatedly (they refill after clearing),
  // so over many moves, total clears can exceed gridSize * 2.
  // Upper bound: targetMoves * maxLinesPerMove (generous = 2 per move on average)
  const maxLinesPerMove = 2;
  const maxPossibleLines = prefilledComplete + targetMoves * maxLinesPerMove;

  if (targetLines > maxPossibleLines) {
    return {
      solvable: false,
      reason: `Target of ${targetLines} lines likely exceeds what is achievable in ${targetMoves} moves (estimated max: ${maxPossibleLines}).`,
      maxPossibleLines,
    };
  }

  // Check that there are enough empty cells for at least the minimum number
  // of piece placements needed. The smallest piece is 1 cell, so in theory
  // you need at least 1 empty cell per move. But pieces occupy 1-25 cells,
  // and cleared lines free up space. So we only fail if there are literally
  // zero empty cells and no complete lines to clear first.
  // (Already handled above for emptyCells === 0 case.)

  // Additional check: if the grid is so full that even the smallest piece
  // can't be placed, the level is unsolvable (unless prefilled lines exist
  // that would free space, but that requires placing 0 pieces first which
  // isn't how the game works).
  if (emptyCells < 1 && prefilledComplete === 0) {
    return {
      solvable: false,
      reason: 'No empty cells and no complete lines to clear.',
      maxPossibleLines: 0,
    };
  }

  return {
    solvable: true,
    reason: `Level appears solvable. Estimated max achievable lines: ${maxPossibleLines}.`,
    maxPossibleLines,
  };
}

// -------------------------------------------------------------------
// Grid integrity
// -------------------------------------------------------------------

/**
 * Validates that a reconstructed grid matches the expected grid size
 * and all cell values are either null or valid BlockColors.
 *
 * @param grid      The grid to validate.
 * @param gridSize  The expected grid dimension.
 * @returns         A validation result.
 */
export function validateGridIntegrity(
  grid: Grid,
  gridSize: GridSize,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Check row count
  if (grid.length !== gridSize) {
    errors.push({
      code: 'GRID_ROW_COUNT_MISMATCH',
      message: `Expected ${gridSize} rows, got ${grid.length}.`,
    });
    return { valid: false, errors, warnings };
  }

  for (let r = 0; r < gridSize; r++) {
    const row = grid[r]!;
    // Check column count per row
    if (row.length !== gridSize) {
      errors.push({
        code: 'GRID_COL_COUNT_MISMATCH',
        message: `Row ${r}: expected ${gridSize} columns, got ${row.length}.`,
      });
      continue;
    }

    for (let c = 0; c < gridSize; c++) {
      const cell = row[c];
      if (cell !== null && cell !== undefined && !VALID_COLORS.has(cell)) {
        errors.push({
          code: 'INVALID_GRID_CELL',
          message: `Cell (${r}, ${c}) has invalid color "${String(cell)}".`,
          detail: `Valid colors: ${BLOCK_COLORS.join(', ')}`,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// -------------------------------------------------------------------
// Internal helpers
// -------------------------------------------------------------------

/**
 * Counts how many complete (fully-filled) rows and columns exist in the grid.
 */
function countCompleteLinesInGrid(grid: Grid, gridSize: GridSize): number {
  let count = 0;

  // Rows
  for (let r = 0; r < gridSize; r++) {
    let full = true;
    for (let c = 0; c < gridSize; c++) {
      if (grid[r]![c] === null) {
        full = false;
        break;
      }
    }
    if (full) count++;
  }

  // Columns
  for (let c = 0; c < gridSize; c++) {
    let full = true;
    for (let r = 0; r < gridSize; r++) {
      if (grid[r]![c] === null) {
        full = false;
        break;
      }
    }
    if (full) count++;
  }

  return count;
}

/**
 * Counts lines (rows or columns) that are "almost complete" -- need
 * at most `threshold` cells to be filled.
 */
function countAlmostCompleteLines(
  grid: Grid,
  gridSize: GridSize,
  direction: 'row' | 'col',
  threshold: number = 5,
): number {
  let count = 0;

  if (direction === 'row') {
    for (let r = 0; r < gridSize; r++) {
      let empty = 0;
      for (let c = 0; c < gridSize; c++) {
        if (grid[r]![c] === null) empty++;
      }
      if (empty > 0 && empty <= threshold) count++;
    }
  } else {
    for (let c = 0; c < gridSize; c++) {
      let empty = 0;
      for (let r = 0; r < gridSize; r++) {
        if (grid[r]![c] === null) empty++;
      }
      if (empty > 0 && empty <= threshold) count++;
    }
  }

  return count;
}
