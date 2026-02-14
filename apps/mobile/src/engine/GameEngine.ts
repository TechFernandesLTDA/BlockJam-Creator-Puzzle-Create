/**
 * GameEngine.ts
 * Main game engine for the BlockJam puzzle game.
 *
 * Manages game state transitions using pure functions.
 * Every handler returns a new GameState — nothing is mutated.
 */

import type { BlockColor, PieceDefinition } from './BlockTypes';
import { getRandomPieces } from './BlockTypes';
import type { Grid, GridSize } from './GridLogic';
import {
  canAnyPieceFit,
  canPlacePiece,
  clearLines,
  countEmptyCells,
  createEmptyGrid,
  findCompletedLines,
  placePiece,
} from './GridLogic';
import { countClearedCells } from './GridLogic';
import { calculateCombo, calculateScore, calculateStarRating } from './ScoreCalculator';

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

/** A piece the player can drag onto the board. */
export interface GamePiece {
  definition: PieceDefinition;
  color: BlockColor;
  /** Whether this piece has already been placed in the current turn. */
  placed: boolean;
}

/** Optional level data for UGC / campaign levels. */
export interface LevelData {
  gridSize: GridSize;
  /** Pre-filled cells as {row, col, color} tuples. */
  prefilledCells: Array<{ row: number; col: number; color: BlockColor }>;
  /** Objective: clear this many lines. */
  targetLines: number;
  /** Objective: within this many moves (piece placements). */
  targetMoves: number;
  /** Score needed for 3 stars. */
  targetScore: number;
  /** Human-readable name. */
  name: string;
  /** Creator's user ID. */
  creatorId?: string;
}

export type GameMode = 'endless' | 'level';

export interface GameState {
  grid: Grid;
  gridSize: GridSize;
  /** The 3 current pieces (some may be marked as placed). */
  pieces: GamePiece[];
  score: number;
  /** Total number of individual lines cleared during the session. */
  linesCleared: number;
  /** Total piece-placement moves made. */
  movesMade: number;
  /** Highest combo achieved in the session. */
  bestCombo: number;
  /** Game mode. */
  mode: GameMode;
  /** Level data for 'level' mode. */
  levelData: LevelData | null;
  /** Is the game over? */
  gameOver: boolean;
  /** Has the level objective been met? */
  levelComplete: boolean;
  /** Star rating when level is complete (0-3). */
  starRating: 0 | 1 | 2 | 3;
  /** Info about the most recent clear event (useful for UI animations). */
  lastClear: {
    rows: number[];
    cols: number[];
    cellsCleared: number;
    comboLevel: number;
    pointsAwarded: number;
  } | null;
}

// -------------------------------------------------------------------
// State creation
// -------------------------------------------------------------------

/**
 * Creates a brand-new game state.
 *
 * @param gridSize  The board dimension (6, 8, or 10).
 * @param levelData Optional level configuration for UGC/campaign mode.
 * @returns         A fresh GameState ready for play.
 */
export function createGameState(
  gridSize: GridSize,
  levelData?: LevelData,
): GameState {
  let grid = createEmptyGrid(gridSize);

  // If we have level data, apply pre-filled cells
  if (levelData) {
    for (const cell of levelData.prefilledCells) {
      if (
        cell.row >= 0 &&
        cell.row < gridSize &&
        cell.col >= 0 &&
        cell.col < gridSize
      ) {
        grid[cell.row]![cell.col] = cell.color;
      }
    }
  }

  const randomPieces = getRandomPieces(3);
  const pieces: GamePiece[] = randomPieces.map((p) => ({
    definition: p.definition,
    color: p.color,
    placed: false,
  }));

  return {
    grid,
    gridSize,
    pieces,
    score: 0,
    linesCleared: 0,
    movesMade: 0,
    bestCombo: 0,
    mode: levelData ? 'level' : 'endless',
    levelData: levelData ?? null,
    gameOver: false,
    levelComplete: false,
    starRating: 0,
    lastClear: null,
  };
}

// -------------------------------------------------------------------
// Core turn handler
// -------------------------------------------------------------------

/**
 * Result returned from handlePiecePlacement so the caller can inspect
 * what happened without diffing the entire state.
 */
export interface PlacementResult {
  state: GameState;
  success: boolean;
  /** Reason for failure, if success is false. */
  failReason?: 'invalid_piece' | 'cannot_place' | 'game_over' | 'level_complete';
}

/**
 * Handles the player placing a piece on the grid.
 *
 * Flow:
 *  1. Validate that the piece index is valid and not already placed.
 *  2. Check that the piece fits at (row, col).
 *  3. Place the piece.
 *  4. Detect completed lines and clear them.
 *  5. Update score.
 *  6. If all 3 pieces are placed, generate new ones.
 *  7. Check for game over or level completion.
 *
 * @param state       Current game state.
 * @param pieceIndex  Index (0-2) of the piece being placed.
 * @param row         Target row on the grid.
 * @param col         Target column on the grid.
 * @returns           The new state and metadata about the placement.
 */
export function handlePiecePlacement(
  state: GameState,
  pieceIndex: number,
  row: number,
  col: number,
): PlacementResult {
  // Reject if game is already over or level already complete
  if (state.gameOver) {
    return { state, success: false, failReason: 'game_over' };
  }
  if (state.levelComplete) {
    return { state, success: false, failReason: 'level_complete' };
  }

  // Validate piece index
  if (pieceIndex < 0 || pieceIndex >= state.pieces.length) {
    return { state, success: false, failReason: 'invalid_piece' };
  }

  const piece = state.pieces[pieceIndex]!;
  if (piece.placed) {
    return { state, success: false, failReason: 'invalid_piece' };
  }

  // Can the piece be placed?
  if (!canPlacePiece(state.grid, piece.definition.shape, row, col)) {
    return { state, success: false, failReason: 'cannot_place' };
  }

  // --- Place the piece ---
  let newGrid = placePiece(
    state.grid,
    piece.definition.shape,
    row,
    col,
    piece.color,
  );

  // --- Detect and clear completed lines ---
  const completed = findCompletedLines(newGrid);
  const totalLinesNow = completed.rows.length + completed.cols.length;
  const comboLevel = calculateCombo(totalLinesNow);
  let cellsCleared = 0;
  let pointsAwarded = 0;

  if (totalLinesNow > 0) {
    cellsCleared = countClearedCells(newGrid, completed.rows, completed.cols);
    pointsAwarded = calculateScore(cellsCleared, comboLevel);
    newGrid = clearLines(newGrid, completed.rows, completed.cols);
  }

  // --- Build updated pieces array ---
  const newPieces = state.pieces.map((p, i) =>
    i === pieceIndex ? { ...p, placed: true } : { ...p },
  );

  // --- Update counters ---
  const newScore = state.score + pointsAwarded;
  const newLinesCleared = state.linesCleared + totalLinesNow;
  const newMovesMade = state.movesMade + 1;
  const newBestCombo = Math.max(state.bestCombo, comboLevel);

  // --- Check level completion (before generating new pieces) ---
  let levelComplete = false;
  let starRating: 0 | 1 | 2 | 3 = 0;
  if (state.mode === 'level' && state.levelData) {
    if (newLinesCleared >= state.levelData.targetLines) {
      levelComplete = true;
      starRating = calculateStarRating(newScore, state.levelData.targetScore);
    }
  }

  // --- Generate new pieces if all 3 have been placed ---
  let finalPieces = newPieces;
  const allPlaced = newPieces.every((p) => p.placed);
  if (allPlaced && !levelComplete) {
    const fresh = getRandomPieces(3);
    finalPieces = fresh.map((p) => ({
      definition: p.definition,
      color: p.color,
      placed: false,
    }));
  }

  // --- Check game over ---
  const unplacedPieces = finalPieces.filter((p) => !p.placed);
  let gameOver = false;
  if (!levelComplete && unplacedPieces.length > 0) {
    const fittable = canAnyPieceFit(
      newGrid,
      unplacedPieces.map((p) => ({ shape: p.definition.shape })),
    );
    if (!fittable) {
      gameOver = true;
    }
  }

  // In level mode, running out of moves also ends the game
  if (
    state.mode === 'level' &&
    state.levelData &&
    !levelComplete &&
    newMovesMade >= state.levelData.targetMoves
  ) {
    // Allow the current move's clears to count, but game is over after
    if (!levelComplete) {
      gameOver = true;
    }
  }

  const lastClear =
    totalLinesNow > 0
      ? {
          rows: completed.rows,
          cols: completed.cols,
          cellsCleared,
          comboLevel,
          pointsAwarded,
        }
      : null;

  const newState: GameState = {
    grid: newGrid,
    gridSize: state.gridSize,
    pieces: finalPieces,
    score: newScore,
    linesCleared: newLinesCleared,
    movesMade: newMovesMade,
    bestCombo: newBestCombo,
    mode: state.mode,
    levelData: state.levelData,
    gameOver,
    levelComplete,
    starRating,
    lastClear,
  };

  return { state: newState, success: true };
}

// -------------------------------------------------------------------
// Helpers exposed for external use
// -------------------------------------------------------------------

/**
 * Generates 3 new random pieces, replacing the current set.
 * Typically called automatically by handlePiecePlacement when all
 * pieces have been used, but exposed here for manual use.
 */
export function generateNewPieces(state: GameState): GameState {
  const fresh = getRandomPieces(3);
  const pieces: GamePiece[] = fresh.map((p) => ({
    definition: p.definition,
    color: p.color,
    placed: false,
  }));

  return { ...state, pieces };
}

/**
 * Checks whether the level's objective has been reached.
 */
export function isLevelComplete(state: GameState): boolean {
  if (state.mode !== 'level' || !state.levelData) return false;
  return state.linesCleared >= state.levelData.targetLines;
}

/**
 * Checks whether the game is over (no remaining piece can fit).
 */
export function isGameOver(state: GameState): boolean {
  const unplaced = state.pieces.filter((p) => !p.placed);
  if (unplaced.length === 0) return false; // all placed — new pieces incoming
  return !canAnyPieceFit(
    state.grid,
    unplaced.map((p) => ({ shape: p.definition.shape })),
  );
}
