/**
 * ScoreCalculator.ts
 * Scoring logic for the BlockJam puzzle game.
 *
 * Scoring rules:
 *  - Base score = 10 points per cell cleared
 *  - Combo multiplier applied when multiple lines clear simultaneously
 *      1 line  = 1x (no combo)
 *      2 lines = 2x
 *      3 lines = 3x
 *      4 lines = 4x
 *      5+ lines = 5x (capped)
 *  - Star rating for UGC levels is based on score vs target
 */

/** Maximum combo multiplier */
const MAX_COMBO = 5;

/** Points awarded per cleared cell before multiplier */
const POINTS_PER_CELL = 10;

/** Star thresholds as fractions of targetScore */
const STAR_THRESHOLDS = {
  one: 0.5,   // >= 50% of target  => 1 star
  two: 0.75,  // >= 75% of target  => 2 stars
  three: 1.0, // >= 100% of target => 3 stars
};

// -------------------------------------------------------------------
// Public API
// -------------------------------------------------------------------

/**
 * Calculates the score for a single clear event.
 *
 * @param cellsCleared  Total number of cells that were removed from the grid.
 * @param comboLevel    The combo multiplier (1-5).
 * @returns             The points earned for this clear.
 */
export function calculateScore(
  cellsCleared: number,
  comboLevel: number,
): number {
  const clampedCombo = Math.max(1, Math.min(comboLevel, MAX_COMBO));
  return cellsCleared * POINTS_PER_CELL * clampedCombo;
}

/**
 * Determines the combo multiplier from the number of lines cleared
 * simultaneously (rows + columns combined).
 *
 * @param linesCleared  Number of rows + columns cleared at once.
 * @returns             Combo multiplier (1-5).
 */
export function calculateCombo(linesCleared: number): number {
  if (linesCleared <= 0) return 1;
  if (linesCleared >= MAX_COMBO) return MAX_COMBO;
  return linesCleared;
}

/**
 * Returns a 1-3 star rating based on the player's score relative to
 * a target score. Used for UGC/campaign levels.
 *
 * @param score        The player's current score.
 * @param targetScore  The level's target score for 3 stars.
 * @returns            1, 2, or 3 stars (0 if below 1-star threshold).
 */
export function calculateStarRating(
  score: number,
  targetScore: number,
): 0 | 1 | 2 | 3 {
  if (targetScore <= 0) return 3; // trivial target is always 3 stars

  const ratio = score / targetScore;

  if (ratio >= STAR_THRESHOLDS.three) return 3;
  if (ratio >= STAR_THRESHOLDS.two) return 2;
  if (ratio >= STAR_THRESHOLDS.one) return 1;
  return 0;
}
