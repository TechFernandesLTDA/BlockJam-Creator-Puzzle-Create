import { ValidationError } from '../utils/errors.js';

interface GridCellData {
  r: number;
  c: number;
  color: number;
}

interface LevelDataPayload {
  version: number;
  meta: {
    name: string;
    creatorId: string;
    createdAt: string;
    gridSize: number;
    difficulty: string;
    targetLines: number;
    maxMoves: number;
    thumbnail: string;
  };
  grid: {
    cells: GridCellData[];
  };
  pieces?: {
    sequence: Array<{ shape: number; color: number }>;
  };
  validation: {
    isSolvable: boolean;
    minMoves: number;
    checksum: string;
  };
}

/**
 * Validates that all cell positions fall within the grid boundaries.
 */
export function checkGridBounds(cells: GridCellData[], gridSize: number): boolean {
  for (const cell of cells) {
    if (cell.r < 0 || cell.r >= gridSize || cell.c < 0 || cell.c >= gridSize) {
      return false;
    }
  }
  return true;
}

/**
 * Checks for duplicate cell positions in the grid.
 */
function hasDuplicatePositions(cells: GridCellData[]): boolean {
  const seen = new Set<string>();
  for (const cell of cells) {
    const key = `${cell.r},${cell.c}`;
    if (seen.has(key)) {
      return true;
    }
    seen.add(key);
  }
  return false;
}

/**
 * Validates the complete level data structure on the server side.
 * Performs structural checks beyond what Zod schema validation does.
 *
 * Throws ValidationError if the data is invalid.
 */
export function validateLevelData(data: unknown): LevelDataPayload {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Level data must be an object');
  }

  const levelData = data as Record<string, unknown>;

  // Check version
  if (levelData.version !== 1) {
    throw new ValidationError('Level data version must be 1');
  }

  // Check meta
  const meta = levelData.meta as Record<string, unknown> | undefined;
  if (!meta || typeof meta !== 'object') {
    throw new ValidationError('Level data must include meta');
  }

  if (typeof meta.name !== 'string' || meta.name.length === 0) {
    throw new ValidationError('Level meta must include a non-empty name');
  }

  if (meta.name.length > 30) {
    throw new ValidationError('Level name must be 30 characters or fewer');
  }

  const gridSize = meta.gridSize;
  if (gridSize !== 6 && gridSize !== 8 && gridSize !== 10) {
    throw new ValidationError('Grid size must be 6, 8, or 10');
  }

  const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
  if (typeof meta.difficulty !== 'string' || !validDifficulties.includes(meta.difficulty)) {
    throw new ValidationError('Difficulty must be easy, medium, hard, or expert');
  }

  if (typeof meta.targetLines !== 'number' || meta.targetLines < 1 || meta.targetLines > 20) {
    throw new ValidationError('Target lines must be between 1 and 20');
  }

  if (typeof meta.maxMoves !== 'number' || meta.maxMoves < 1 || meta.maxMoves > 100) {
    throw new ValidationError('Max moves must be between 1 and 100');
  }

  // Check grid
  const grid = levelData.grid as Record<string, unknown> | undefined;
  if (!grid || typeof grid !== 'object') {
    throw new ValidationError('Level data must include grid');
  }

  const cells = grid.cells;
  if (!Array.isArray(cells)) {
    throw new ValidationError('Grid must include cells array');
  }

  // Validate each cell
  for (const cell of cells) {
    if (!cell || typeof cell !== 'object') {
      throw new ValidationError('Each cell must be an object');
    }

    const c = cell as Record<string, unknown>;
    if (typeof c.r !== 'number' || typeof c.c !== 'number' || typeof c.color !== 'number') {
      throw new ValidationError('Each cell must have numeric r, c, and color fields');
    }

    if (c.color < 0 || c.color > 7) {
      throw new ValidationError('Cell color must be between 0 and 7');
    }
  }

  // Check grid bounds
  if (!checkGridBounds(cells as GridCellData[], gridSize as number)) {
    throw new ValidationError(
      `All cells must be within grid bounds (0 to ${(gridSize as number) - 1})`,
    );
  }

  // Check for duplicate positions
  if (hasDuplicatePositions(cells as GridCellData[])) {
    throw new ValidationError('Grid contains duplicate cell positions');
  }

  // Check validation field
  const validation = levelData.validation as Record<string, unknown> | undefined;
  if (!validation || typeof validation !== 'object') {
    throw new ValidationError('Level data must include validation');
  }

  if (typeof validation.isSolvable !== 'boolean') {
    throw new ValidationError('Validation must include isSolvable boolean');
  }

  if (typeof validation.minMoves !== 'number') {
    throw new ValidationError('Validation must include minMoves number');
  }

  if (typeof validation.checksum !== 'string') {
    throw new ValidationError('Validation must include checksum string');
  }

  return data as LevelDataPayload;
}
