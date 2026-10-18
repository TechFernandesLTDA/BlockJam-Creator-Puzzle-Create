import type { Difficulty, GridCell, GridSize } from './game';

export interface LevelMeta {
  name: string;
  creatorId: string;
  createdAt: string;
  gridSize: GridSize;
  difficulty: Difficulty;
  targetLines: number;
  maxMoves: number;
  thumbnail: string;
}

export interface LevelGrid {
  cells: GridCell[];
}

export interface LevelPieceEntry {
  shape: number;
  color: number;
}

export interface LevelValidation {
  isSolvable: boolean;
  minMoves: number;
  checksum: string;
}

export interface LevelData {
  version: 1;
  meta: LevelMeta;
  grid: LevelGrid;
  pieces?: {
    sequence: LevelPieceEntry[];
  };
  validation: LevelValidation;
}

export interface LevelSummary {
  id: string;
  name: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string | null;
  gridSize: GridSize;
  difficulty: Difficulty;
  likesCount: number;
  playsCount: number;
  completionRate: number;
  thumbnailUrl: string | null;
  isOfficial: boolean;
  isFeatured: boolean;
  isLiked: boolean;
  createdAt: string;
}
