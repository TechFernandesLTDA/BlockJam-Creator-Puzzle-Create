export type BlockColor =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'cyan'
  | 'pink';

export const BLOCK_COLORS: BlockColor[] = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
  'cyan',
  'pink',
];

export type GridSize = 6 | 8 | 10;

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface CellPosition {
  r: number;
  c: number;
}

export interface GridCell {
  r: number;
  c: number;
  color: number; // index in BLOCK_COLORS
}

export interface Piece {
  id: string;
  shape: boolean[][];
  color: BlockColor;
  isPlaced: boolean;
}

export interface GameState {
  grid: (BlockColor | null)[][];
  gridSize: GridSize;
  currentPieces: Piece[];
  score: number;
  combo: number;
  movesLeft: number | null;
  targetLines: number | null;
  linesCleared: number;
  isGameOver: boolean;
  isLevelComplete: boolean;
}
