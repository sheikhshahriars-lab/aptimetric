// lib/irt/itemParams.ts
// Central mapping between the visible difficulty scale (1-12) and the IRT
// latent-trait scale (theta, ~standard normal). Keeping this in one file means
// generators, the CAT engine, and the scoring engine all agree on what a
// "level 6" question means.
//
// Mapping chosen so that:
//   difficulty 1  -> b = -2.8  (very easy, almost everyone gets it right)
//   difficulty 6  -> b ~ -0.25 (slightly easy for the average person)
//   difficulty 7  -> b ~ +0.25 (slightly hard for the average person)
//   difficulty 12 -> b = +2.8  (very hard)

export const DIFFICULTY_MIN = 1;
export const DIFFICULTY_MAX = 12;
export const DIFFICULTY_START = 6;

// Theta bounds used by the difficulty mapping.
export const THETA_SPREAD = 2.8;

// Discrimination (a) and guessing floor (c) used for every item. Generators
// always produce 4 options, so 1/4 is the chance-level floor.
export const ITEM_A = 1.0;
export const ITEM_C = 0.25;

export function clampDifficulty(difficulty: number): number {
  return Math.round(Math.min(DIFFICULTY_MAX, Math.max(DIFFICULTY_MIN, difficulty)));
}

// difficulty (1-12) -> item location b on the theta scale
export function difficultyToB(difficulty: number): number {
  const d = clampDifficulty(difficulty);
  const span = THETA_SPREAD * 2;
  return -THETA_SPREAD + ((d - DIFFICULTY_MIN) * span) / (DIFFICULTY_MAX - DIFFICULTY_MIN);
}

// theta -> nearest difficulty level (inverse of difficultyToB)
export function thetaToDifficulty(theta: number): number {
  const span = THETA_SPREAD * 2;
  const normalized = (theta + THETA_SPREAD) / span; // 0..1
  const raw = DIFFICULTY_MIN + normalized * (DIFFICULTY_MAX - DIFFICULTY_MIN);
  return clampDifficulty(raw);
}