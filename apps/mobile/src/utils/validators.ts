import type { Difficulty, GridSize } from '@blockjam/shared';
import { LEVEL_NAME_MAX_LENGTH } from '@blockjam/shared';

// ---------------------------------------------------------------------------
// Client-side validators
//
// These are lightweight checks that run synchronously on the device so the
// UI can give instant feedback.  The server performs its own authoritative
// validation on every request; these are purely for UX.
// ---------------------------------------------------------------------------

/** Pattern that rejects "special" characters.  Allows letters, digits,
 *  spaces, hyphens, underscores, and basic punctuation (.,!?'). */
const VALID_NAME_PATTERN = /^[a-zA-Z0-9 _\-.,!?']+$/;

/**
 * Validate a level name.
 *
 * Rules:
 * - Must be between 1 and 30 characters (inclusive).
 * - Must not contain special characters outside the allowed set.
 */
export function isValidLevelName(name: string): boolean {
  if (!name || name.length === 0) return false;
  if (name.length > LEVEL_NAME_MAX_LENGTH) return false;
  return VALID_NAME_PATTERN.test(name);
}

/** The set of grid sizes the game supports. */
const ALLOWED_GRID_SIZES: readonly number[] = [6, 8, 10];

/**
 * Validate a grid size.
 *
 * Accepted values: 6, 8, or 10.
 */
export function isValidGridSize(size: number): size is GridSize {
  return ALLOWED_GRID_SIZES.includes(size);
}

/** The set of difficulty levels the game recognises. */
const ALLOWED_DIFFICULTIES: readonly string[] = [
  'easy',
  'medium',
  'hard',
  'expert',
];

/**
 * Validate a difficulty string.
 *
 * Accepted values: `"easy"`, `"medium"`, `"hard"`, `"expert"`.
 */
export function isValidDifficulty(d: string): d is Difficulty {
  return ALLOWED_DIFFICULTIES.includes(d);
}

/**
 * Validate a max-moves value for a level.
 *
 * Must be an integer between 1 and 100 (inclusive).
 */
export function isValidMoves(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= 100;
}

/**
 * Validate a target-lines value for a level.
 *
 * Must be an integer between 1 and 20 (inclusive).
 */
export function isValidTargetLines(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= 20;
}
