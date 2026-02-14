import { create } from 'zustand';
import type { BlockColor, GridSize, LevelData } from '@blockjam/shared';
import { BLOCK_COLORS } from '@blockjam/shared';
import {
  createEmptyGrid,
  canPlacePiece,
  placePiece as placeOnGrid,
  findCompletedLines,
  clearLines,
  canAnyPieceFit,
  countClearedCells,
} from '@/engine/GridLogic';
import { getRandomPieces } from '@/engine/BlockTypes';
import type { PieceDefinition } from '@/engine/BlockTypes';
import { calculateScore, calculateCombo } from '@/engine/ScoreCalculator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StorePiece {
  id: string;
  shape: boolean[][];
  color: BlockColor;
  isPlaced: boolean;
}

interface GameStoreState {
  grid: (BlockColor | null)[][];
  gridSize: GridSize;
  currentPieces: StorePiece[];
  selectedPieceIndex: number | null;
  score: number;
  combo: number;
  movesLeft: number | null;
  targetLines: number | null;
  linesCleared: number;
  isGameOver: boolean;
  isLevelComplete: boolean;
}

interface GameStoreActions {
  initGame: (gridSize: GridSize, levelData?: LevelData) => void;
  placePiece: (pieceIndex: number, row: number, col: number) => void;
  selectPiece: (index: number | null) => void;
  resetGame: () => void;
  continueAfterGameOver: () => void;
}

type GameStore = GameStoreState & GameStoreActions;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_GRID_SIZE: GridSize = 8;

function toStorePieces(
  enginePieces: Array<{ definition: PieceDefinition; color: BlockColor }>,
): StorePiece[] {
  return enginePieces.map((p, i) => ({
    id: `${p.definition.id}-${Date.now()}-${i}`,
    shape: p.definition.shape,
    color: p.color,
    isPlaced: false,
  }));
}

function makeNewPieces(): StorePiece[] {
  return toStorePieces(getRandomPieces(3));
}

function buildGridFromLevelData(
  levelData: LevelData,
  gridSize: GridSize,
): (BlockColor | null)[][] {
  const grid = createEmptyGrid(gridSize);
  for (const cell of levelData.grid.cells) {
    if (cell.r >= 0 && cell.r < gridSize && cell.c >= 0 && cell.c < gridSize) {
      const color: BlockColor | undefined = BLOCK_COLORS[cell.color];
      if (color !== undefined) {
        const row = grid[cell.r];
        if (row) {
          row[cell.c] = color;
        }
      }
    }
  }
  return grid;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

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

  initGame: (gridSize: GridSize, levelData?: LevelData) => {
    const grid = levelData
      ? buildGridFromLevelData(levelData, gridSize)
      : createEmptyGrid(gridSize);

    const pieces = makeNewPieces();

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

    // 1. Validate placement using the piece's shape (boolean[][])
    if (!canPlacePiece(state.grid, piece.shape, row, col)) return;

    // 2. Place piece on grid
    const gridAfterPlace = placeOnGrid(
      state.grid,
      piece.shape,
      row,
      col,
      piece.color,
    );

    // 3. Find and clear completed lines
    const completed = findCompletedLines(gridAfterPlace);
    const totalLinesNow = completed.rows.length + completed.cols.length;
    const comboLevel = calculateCombo(totalLinesNow);

    let gridAfterClear = gridAfterPlace;
    let pointsEarned = 0;

    if (totalLinesNow > 0) {
      const cellsCleared = countClearedCells(
        gridAfterPlace,
        completed.rows,
        completed.cols,
      );
      pointsEarned = calculateScore(cellsCleared, comboLevel);
      gridAfterClear = clearLines(
        gridAfterPlace,
        completed.rows,
        completed.cols,
      );
    }

    const combo = totalLinesNow > 0 ? state.combo + 1 : 0;
    const totalLinesCleared = state.linesCleared + totalLinesNow;

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
    const nextPieces = allPlaced ? makeNewPieces() : updatedPieces;

    // 7. Check level complete
    const isLevelComplete =
      state.targetLines !== null && totalLinesCleared >= state.targetLines;

    // 8. Check game over: no pieces fit OR ran out of moves
    const unplaced = nextPieces.filter((p) => !p.isPlaced);
    const noFit =
      unplaced.length > 0 &&
      !canAnyPieceFit(
        gridAfterClear,
        unplaced.map((p) => ({ shape: p.shape })),
      );
    const isGameOver =
      !isLevelComplete && (movesLeft === 0 || noFit);

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
    const pieces = makeNewPieces();

    set({
      currentPieces: pieces,
      selectedPieceIndex: null,
      isGameOver: false,
      movesLeft: state.movesLeft !== null ? 5 : null,
    });
  },
}));
