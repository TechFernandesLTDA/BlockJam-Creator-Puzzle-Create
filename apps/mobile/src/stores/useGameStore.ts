import { create } from 'zustand';
import type {
  BlockColor,
  GridSize,
  Piece,
  LevelData,
} from '@blockjam/shared';
import {
  createEmptyGrid,
  canPlacePiece,
  placePiece as placePieceOnGrid,
  findCompletedLines,
  clearLines,
  canAnyPieceFit,
  countClearedCells,
} from '@/engine/GridLogic';
import { getRandomPieces } from '@/engine/BlockTypes';
import { calculateScore, calculateCombo } from '@/engine/ScoreCalculator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GameStoreState {
  /** The current grid of placed blocks (null = empty cell). */
  grid: (BlockColor | null)[][];
  /** Current grid dimensions. */
  gridSize: GridSize;
  /** The pieces available for the player to place this turn. */
  currentPieces: Piece[];
  /** Index of the piece the player has tapped / selected, or null. */
  selectedPieceIndex: number | null;
  /** Accumulated score for this play session. */
  score: number;
  /** Current consecutive-line-clear combo counter. */
  combo: number;
  /** Remaining moves (null = unlimited / endless mode). */
  movesLeft: number | null;
  /** Lines the player must clear to beat the level (null = endless). */
  targetLines: number | null;
  /** Total lines cleared so far. */
  linesCleared: number;
  /** Whether the game has ended (no valid placements remaining). */
  isGameOver: boolean;
  /** Whether the level-complete condition has been met. */
  isLevelComplete: boolean;
}

interface GameStoreActions {
  /**
   * Initialise (or re-initialise) the game.
   * @param gridSize - Board dimensions.
   * @param levelData - Optional level data for community / campaign levels.
   */
  initGame: (gridSize: GridSize, levelData?: LevelData) => void;

  /**
   * Attempt to place the piece at `pieceIndex` starting at the given row/col.
   * Handles line-clearing, scoring, combo tracking, game-over and
   * level-complete checks, and piece refills.
   */
  placePiece: (pieceIndex: number, row: number, col: number) => void;

  /** Mark a piece as the currently-selected piece. */
  selectPiece: (index: number | null) => void;

  /** Reset the store back to a blank slate. */
  resetGame: () => void;

  /**
   * Continue playing after a game-over (e.g. after watching a rewarded ad).
   * Generates a fresh set of pieces and un-flags the game-over state.
   */
  continueAfterGameOver: () => void;
}

type GameStore = GameStoreState & GameStoreActions;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate 3 random pieces and map them to the shared `Piece` interface.
 */
function generatePieces(): Piece[] {
  const raw = getRandomPieces(3);
  return raw.map((p) => ({
    id: p.definition.id,
    shape: p.definition.shape,
    color: p.color,
    isPlaced: false,
  }));
}

/**
 * Reconstruct a `(BlockColor | null)[][]` grid from persisted `LevelData`.
 */
function buildGridFromLevelData(
  levelData: LevelData,
  gridSize: GridSize,
): (BlockColor | null)[][] {
  const grid = createEmptyGrid(gridSize);

  for (const cell of levelData.grid.cells) {
    if (cell.r >= 0 && cell.r < gridSize && cell.c >= 0 && cell.c < gridSize) {
      // cell.color is a number index; map it to a BlockColor string
      const BLOCK_COLORS: BlockColor[] = [
        'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan', 'pink',
      ];
      grid[cell.r]![cell.c] = BLOCK_COLORS[cell.color] ?? null;
    }
  }

  return grid;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_GRID_SIZE: GridSize = 8;

const initialState: GameStoreState = {
  grid: createEmptyGrid(DEFAULT_GRID_SIZE),
  gridSize: DEFAULT_GRID_SIZE,
  currentPieces: [],
  selectedPieceIndex: null,
  score: 0,
  combo: 0,
  movesLeft: null,
  targetLines: null,
  linesCleared: 0,
  isGameOver: false,
  isLevelComplete: false,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  // -- Actions ---------------------------------------------------------------

  initGame: (gridSize: GridSize, levelData?: LevelData) => {
    const grid = levelData
      ? buildGridFromLevelData(levelData, gridSize)
      : createEmptyGrid(gridSize);

    const pieces = generatePieces();

    set({
      grid,
      gridSize,
      currentPieces: pieces,
      selectedPieceIndex: null,
      score: 0,
      combo: 0,
      movesLeft: levelData?.meta.maxMoves ?? null,
      targetLines: levelData?.meta.targetLines ?? null,
      linesCleared: 0,
      isGameOver: false,
      isLevelComplete: false,
    });
  },

  placePiece: (pieceIndex: number, row: number, col: number) => {
    const state = get();

    const piece = state.currentPieces[pieceIndex];
    if (!piece || piece.isPlaced) return;

    if (!canPlacePiece(state.grid, piece.shape, row, col)) return;

    // 1. Place piece on grid
    const gridAfterPlace = placePieceOnGrid(
      state.grid,
      piece.shape,
      row,
      col,
      piece.color,
    );

    // 2. Find and clear completed lines
    const completed = findCompletedLines(gridAfterPlace);
    const newLines = completed.rows.length + completed.cols.length;
    const gridAfterClear =
      newLines > 0
        ? clearLines(gridAfterPlace, completed.rows, completed.cols)
        : gridAfterPlace;

    // 3. Calculate score
    const combo = newLines > 0 ? state.combo + 1 : 0;
    const comboLevel = calculateCombo(newLines);
    const cellsCleared =
      newLines > 0
        ? countClearedCells(gridAfterPlace, completed.rows, completed.cols)
        : 0;
    const pointsEarned = cellsCleared > 0 ? calculateScore(cellsCleared, comboLevel) : 0;
    const totalLinesCleared = state.linesCleared + newLines;

    // 4. Mark piece as placed
    const updatedPieces = state.currentPieces.map((p, i) =>
      i === pieceIndex ? { ...p, isPlaced: true } : p,
    );

    // 5. Decrement moves if applicable
    const movesLeft =
      state.movesLeft !== null
        ? Math.max(state.movesLeft - 1, 0)
        : null;

    // 6. Refill pieces if all have been placed
    const allPlaced = updatedPieces.every((p) => p.isPlaced);
    const nextPieces = allPlaced ? generatePieces() : updatedPieces;

    // 7. Check win / lose conditions
    const isLevelComplete =
      state.targetLines !== null && totalLinesCleared >= state.targetLines;

    const unplacedPieces = nextPieces.filter((p) => !p.isPlaced);
    const isGameOver =
      !isLevelComplete &&
      (movesLeft === 0 ||
        (unplacedPieces.length > 0 &&
          !canAnyPieceFit(
            gridAfterClear,
            unplacedPieces.map((p) => ({ shape: p.shape })),
          )));

    set({
      grid: gridAfterClear,
      currentPieces: nextPieces,
      selectedPieceIndex: null,
      score: state.score + pointsEarned,
      combo,
      movesLeft,
      linesCleared: totalLinesCleared,
      isGameOver,
      isLevelComplete,
    });
  },

  selectPiece: (index: number | null) => {
    set({ selectedPieceIndex: index });
  },

  resetGame: () => {
    set({ ...initialState, grid: createEmptyGrid(DEFAULT_GRID_SIZE) });
  },

  continueAfterGameOver: () => {
    const state = get();
    const pieces = generatePieces();

    set({
      currentPieces: pieces,
      selectedPieceIndex: null,
      isGameOver: false,
      // Give a few extra moves when continuing via ad
      movesLeft: state.movesLeft !== null ? 5 : null,
    });
  },
}));
