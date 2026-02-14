/**
 * BlockTypes.ts
 * Defines all piece shapes as boolean[][] matrices and provides
 * random piece generation utilities for the BlockJam game.
 */

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

export interface PieceDefinition {
  id: string;
  name: string;
  shape: boolean[][];
  rarityWeight: number;
}

// -------------------------------------------------------------------
// Piece shape matrices
// true = occupied cell, false = empty cell
// -------------------------------------------------------------------

const SHAPE_1x1: boolean[][] = [[true]];

const SHAPE_1x2: boolean[][] = [[true, true]];

const SHAPE_1x3: boolean[][] = [[true, true, true]];

const SHAPE_1x4: boolean[][] = [[true, true, true, true]];

const SHAPE_1x5: boolean[][] = [[true, true, true, true, true]];

const SHAPE_2x1: boolean[][] = [[true], [true]];

const SHAPE_3x1: boolean[][] = [[true], [true], [true]];

const SHAPE_4x1: boolean[][] = [[true], [true], [true], [true]];

const SHAPE_5x1: boolean[][] = [[true], [true], [true], [true], [true]];

const SHAPE_2x2: boolean[][] = [
  [true, true],
  [true, true],
];

const SHAPE_3x3: boolean[][] = [
  [true, true, true],
  [true, true, true],
  [true, true, true],
];

// L-shapes (4 rotations)
const SHAPE_L_UP_RIGHT: boolean[][] = [
  [true, false],
  [true, false],
  [true, true],
];

const SHAPE_L_UP_LEFT: boolean[][] = [
  [false, true],
  [false, true],
  [true, true],
];

const SHAPE_L_DOWN_RIGHT: boolean[][] = [
  [true, true],
  [true, false],
  [true, false],
];

const SHAPE_L_DOWN_LEFT: boolean[][] = [
  [true, true],
  [false, true],
  [false, true],
];

// T-shapes (4 rotations)
const SHAPE_T_UP: boolean[][] = [
  [true, true, true],
  [false, true, false],
];

const SHAPE_T_DOWN: boolean[][] = [
  [false, true, false],
  [true, true, true],
];

const SHAPE_T_LEFT: boolean[][] = [
  [true, false],
  [true, true],
  [true, false],
];

const SHAPE_T_RIGHT: boolean[][] = [
  [false, true],
  [true, true],
  [false, true],
];

// Z / S shapes (2 rotations each)
const SHAPE_Z_HORIZONTAL: boolean[][] = [
  [true, true, false],
  [false, true, true],
];

const SHAPE_Z_VERTICAL: boolean[][] = [
  [false, true],
  [true, true],
  [true, false],
];

const SHAPE_S_HORIZONTAL: boolean[][] = [
  [false, true, true],
  [true, true, false],
];

const SHAPE_S_VERTICAL: boolean[][] = [
  [true, false],
  [true, true],
  [false, true],
];

// -------------------------------------------------------------------
// Full piece definitions list
// -------------------------------------------------------------------

export const PIECE_DEFINITIONS: PieceDefinition[] = [
  // Single cell
  { id: 'dot', name: '1x1 Dot', shape: SHAPE_1x1, rarityWeight: 10 },

  // Horizontal bars
  { id: 'h2', name: '1x2 Bar', shape: SHAPE_1x2, rarityWeight: 9 },
  { id: 'h3', name: '1x3 Bar', shape: SHAPE_1x3, rarityWeight: 8 },
  { id: 'h4', name: '1x4 Bar', shape: SHAPE_1x4, rarityWeight: 5 },
  { id: 'h5', name: '1x5 Bar', shape: SHAPE_1x5, rarityWeight: 3 },

  // Vertical bars
  { id: 'v2', name: '2x1 Bar', shape: SHAPE_2x1, rarityWeight: 9 },
  { id: 'v3', name: '3x1 Bar', shape: SHAPE_3x1, rarityWeight: 8 },
  { id: 'v4', name: '4x1 Bar', shape: SHAPE_4x1, rarityWeight: 5 },
  { id: 'v5', name: '5x1 Bar', shape: SHAPE_5x1, rarityWeight: 3 },

  // Squares
  { id: 'sq2', name: '2x2 Square', shape: SHAPE_2x2, rarityWeight: 7 },
  { id: 'sq3', name: '3x3 Square', shape: SHAPE_3x3, rarityWeight: 2 },

  // L-shapes
  { id: 'l_ur', name: 'L Up-Right', shape: SHAPE_L_UP_RIGHT, rarityWeight: 6 },
  { id: 'l_ul', name: 'L Up-Left', shape: SHAPE_L_UP_LEFT, rarityWeight: 6 },
  { id: 'l_dr', name: 'L Down-Right', shape: SHAPE_L_DOWN_RIGHT, rarityWeight: 6 },
  { id: 'l_dl', name: 'L Down-Left', shape: SHAPE_L_DOWN_LEFT, rarityWeight: 6 },

  // T-shapes
  { id: 't_up', name: 'T Up', shape: SHAPE_T_UP, rarityWeight: 5 },
  { id: 't_down', name: 'T Down', shape: SHAPE_T_DOWN, rarityWeight: 5 },
  { id: 't_left', name: 'T Left', shape: SHAPE_T_LEFT, rarityWeight: 5 },
  { id: 't_right', name: 'T Right', shape: SHAPE_T_RIGHT, rarityWeight: 5 },

  // Z / S shapes
  { id: 'z_h', name: 'Z Horizontal', shape: SHAPE_Z_HORIZONTAL, rarityWeight: 4 },
  { id: 'z_v', name: 'Z Vertical', shape: SHAPE_Z_VERTICAL, rarityWeight: 4 },
  { id: 's_h', name: 'S Horizontal', shape: SHAPE_S_HORIZONTAL, rarityWeight: 4 },
  { id: 's_v', name: 'S Vertical', shape: SHAPE_S_VERTICAL, rarityWeight: 4 },
];

/**
 * Returns a random BlockColor from the available palette.
 */
export function getRandomColor(): BlockColor {
  const index = Math.floor(Math.random() * BLOCK_COLORS.length);
  return BLOCK_COLORS[index] ?? 'red';
}

/**
 * Selects `count` random pieces from PIECE_DEFINITIONS using weighted
 * random selection (pieces with higher rarityWeight appear more often).
 * Each returned piece is an independent copy with a freshly assigned color.
 */
export function getRandomPieces(
  count: number,
): Array<{ definition: PieceDefinition; color: BlockColor }> {
  const totalWeight = PIECE_DEFINITIONS.reduce(
    (sum, def) => sum + def.rarityWeight,
    0,
  );

  const pieces: Array<{ definition: PieceDefinition; color: BlockColor }> = [];

  for (let i = 0; i < count; i++) {
    let roll = Math.random() * totalWeight;
    // PIECE_DEFINITIONS is guaranteed to be non-empty (defined above)
    let chosen: PieceDefinition = PIECE_DEFINITIONS[0]!;

    for (const def of PIECE_DEFINITIONS) {
      roll -= def.rarityWeight;
      if (roll <= 0) {
        chosen = def;
        break;
      }
    }

    pieces.push({
      definition: {
        ...chosen,
        shape: chosen.shape.map((row) => [...row]),
      },
      color: getRandomColor(),
    });
  }

  return pieces;
}
