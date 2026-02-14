import { create } from 'zustand';
import type { BlockColor, Difficulty, GridSize } from '@blockjam/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EditorTool = 'paint' | 'erase' | 'fill';

interface LevelMeta {
  levelName: string;
  difficulty: Difficulty;
  targetLines: number;
  maxMoves: number;
}

interface EditorStoreState {
  /** The editor grid. Each cell is either a `BlockColor` or `null` (empty). */
  grid: (BlockColor | null)[][];
  /** Current grid dimensions. */
  gridSize: GridSize;
  /** The colour that the paint / fill tools will apply. */
  selectedColor: BlockColor;
  /** The active editing tool. */
  selectedTool: EditorTool;
  /** Human-readable name for the level being created. */
  levelName: string;
  /** Difficulty tag assigned by the creator. */
  difficulty: Difficulty;
  /** Number of lines the player must clear to complete the level. */
  targetLines: number;
  /** Maximum number of moves allowed (0 = unlimited). */
  maxMoves: number;
}

interface EditorStoreActions {
  /** Create a fresh, empty grid of the given size and reset editor state. */
  initEditor: (gridSize: GridSize) => void;

  /**
   * Apply the current tool at (row, col).
   * - paint: set the cell to `selectedColor`
   * - erase: clear the cell
   * - fill: fill the cell with `selectedColor` (same as paint for single-cell)
   */
  setCell: (row: number, col: number) => void;

  /** Explicitly clear a single cell regardless of the active tool. */
  clearCell: (row: number, col: number) => void;

  /** Fill every cell in the grid with the supplied colour. */
  fillAll: (color: BlockColor) => void;

  /** Clear every cell in the grid. */
  clearAll: () => void;

  /** Switch the active tool. */
  setTool: (tool: EditorTool) => void;

  /** Switch the active paint colour. */
  setColor: (color: BlockColor) => void;

  /** Update one or more pieces of level metadata at once. */
  setLevelMeta: (meta: Partial<LevelMeta>) => void;
}

type EditorStore = EditorStoreState & EditorStoreActions;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createEmptyEditorGrid = (size: GridSize): (BlockColor | null)[][] =>
  Array.from({ length: size }, () => Array.from<BlockColor | null>({ length: size }).fill(null));

const cloneGrid = (grid: (BlockColor | null)[][]): (BlockColor | null)[][] =>
  grid.map((row) => [...row]);

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_GRID_SIZE: GridSize = 8;

const initialState: EditorStoreState = {
  grid: createEmptyEditorGrid(DEFAULT_GRID_SIZE),
  gridSize: DEFAULT_GRID_SIZE,
  selectedColor: 'blue',
  selectedTool: 'paint',
  levelName: '',
  difficulty: 'medium',
  targetLines: 3,
  maxMoves: 20,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...initialState,

  // -- Actions ---------------------------------------------------------------

  initEditor: (gridSize: GridSize) => {
    set({
      grid: createEmptyEditorGrid(gridSize),
      gridSize,
      selectedColor: 'blue',
      selectedTool: 'paint',
      levelName: '',
      difficulty: 'medium',
      targetLines: 3,
      maxMoves: 20,
    });
  },

  setCell: (row: number, col: number) => {
    const { grid, gridSize, selectedTool, selectedColor } = get();
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return;

    const next = cloneGrid(grid);

    switch (selectedTool) {
      case 'paint':
        next[row][col] = selectedColor;
        break;
      case 'erase':
        next[row][col] = null;
        break;
      case 'fill':
        next[row][col] = selectedColor;
        break;
    }

    set({ grid: next });
  },

  clearCell: (row: number, col: number) => {
    const { grid, gridSize } = get();
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return;

    const next = cloneGrid(grid);
    next[row][col] = null;
    set({ grid: next });
  },

  fillAll: (color: BlockColor) => {
    const { gridSize } = get();
    const next: (BlockColor | null)[][] = Array.from({ length: gridSize }, () =>
      Array.from<BlockColor>({ length: gridSize }).fill(color),
    );
    set({ grid: next });
  },

  clearAll: () => {
    const { gridSize } = get();
    set({ grid: createEmptyEditorGrid(gridSize) });
  },

  setTool: (tool: EditorTool) => {
    set({ selectedTool: tool });
  },

  setColor: (color: BlockColor) => {
    set({ selectedColor: color });
  },

  setLevelMeta: (meta: Partial<LevelMeta>) => {
    const updates: Partial<EditorStoreState> = {};

    if (meta.levelName !== undefined) updates.levelName = meta.levelName;
    if (meta.difficulty !== undefined) updates.difficulty = meta.difficulty;
    if (meta.targetLines !== undefined) updates.targetLines = meta.targetLines;
    if (meta.maxMoves !== undefined) updates.maxMoves = meta.maxMoves;

    set(updates);
  },
}));
