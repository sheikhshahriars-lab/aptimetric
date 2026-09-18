// lib/generators/visualSpatial.ts

export type ShapeType = "arrow" | "flag" | "bolt" | "hook";
export type ShapeSpec = {
  type: ShapeType;
  rotation: 0 | 90 | 180 | 270;
  filled: boolean;
  mirrored?: boolean;
};

export type GeneratedVisualQuestion = {
  domain: string;
  subdomain: string;
  difficulty: number;
  question_text: string;
  question_grid?: (ShapeSpec | null)[];
  question_shape?: ShapeSpec;
  options: string[];
  optionShapes: Record<string, ShapeSpec>;
  correct_answer: string;
  explanation: string;
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SHAPE_TYPES: ShapeType[] = ["arrow", "flag", "bolt", "hook"];
const ROTATIONS: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];

function specKey(s: ShapeSpec): string {
  return `${s.type}-${s.rotation}-${s.filled}-${s.mirrored ? "m" : "n"}`;
}

function randomType(): ShapeType {
  return SHAPE_TYPES[randInt(0, SHAPE_TYPES.length - 1)];
}

function randomRotation(): 0 | 90 | 180 | 270 {
  return ROTATIONS[randInt(0, 3)];
}

function addRotation(r: number, step: number): 0 | 90 | 180 | 270 {
  return (((r + step) % 360) + 360) % 360 as 0 | 90 | 180 | 270;
}

function randomShape(): ShapeSpec {
  return { type: randomType(), rotation: randomRotation(), filled: Math.random() < 0.5 };
}

// Build a set of 3 unique-keyed distractors plus the correct shape, return shuffled options
function buildOptions(correct: ShapeSpec, candidates: ShapeSpec[]): { options: string[]; optionShapes: Record<string, ShapeSpec>; correct_answer: string } {
  const optionShapes: Record<string, ShapeSpec> = {};
  const correctId = specKey(correct);
  optionShapes[correctId] = correct;

  for (const c of candidates) {
    const key = specKey(c);
    if (key !== correctId && !optionShapes[key]) optionShapes[key] = c;
    if (Object.keys(optionShapes).length >= 4) break;
  }
  // Fallback fill with random shapes if we didn't get enough unique distractors
  while (Object.keys(optionShapes).length < 4) {
    const c = randomShape();
    const key = specKey(c);
    if (!optionShapes[key]) optionShapes[key] = c;
  }

  const ids = shuffle(Object.keys(optionShapes));
  return { options: ids, optionShapes, correct_answer: correctId };
}

// --- Subdomain: pattern_completion ---
function generatePatternCompletion(difficulty: number): GeneratedVisualQuestion {
  const steps = difficulty <= 2 ? [90] : difficulty <= 4 ? [90, 180] : [90, 180, 270];
  const step = steps[randInt(0, steps.length - 1)];
  const type = randomType();
  const filled = Math.random() < 0.5;
  const r0 = randomRotation();

  const cell0: ShapeSpec = { type, rotation: r0, filled };
  const cell1: ShapeSpec = { type, rotation: addRotation(r0, step), filled };
  const cell2: ShapeSpec = { type, rotation: addRotation(r0, step * 2), filled };
  const correct: ShapeSpec = { type, rotation: addRotation(r0, step * 3), filled };

  const candidates: ShapeSpec[] = [
    { type, rotation: addRotation(r0, step * 3 + 90), filled },
    { type, rotation: addRotation(r0, step * 3 - 90), filled },
    { type, rotation: addRotation(r0, step * 3), filled: !filled },
    { type: randomType() === type ? SHAPE_TYPES[(SHAPE_TYPES.indexOf(type) + 1) % 4] : randomType(), rotation: addRotation(r0, step * 3), filled },
  ];

  const { options, optionShapes, correct_answer } = buildOptions(correct, candidates);

  return {
    domain: "visual_spatial",
    subdomain: "pattern_completion",
    difficulty,
    question_text: `The shapes below follow a rotation pattern. Which option completes the sequence?`,
    question_grid: [cell0, cell1, cell2, null],
    options,
    optionShapes,
    correct_answer,
    explanation: `Each shape rotates ${step}° from the one before it. The missing shape continues that pattern.`,
  };
}

// --- Subdomain: rotation_match ---
function generateRotationMatch(difficulty: number): GeneratedVisualQuestion {
  const degreeOptions = difficulty <= 2 ? [90] : difficulty <= 4 ? [90, 180] : [90, 180, 270];
  const askedDegrees = degreeOptions[randInt(0, degreeOptions.length - 1)];
  const base = randomShape();
  const correct: ShapeSpec = { type: base.type, rotation: addRotation(base.rotation, askedDegrees), filled: base.filled };

  const candidates: ShapeSpec[] = [
    { type: base.type, rotation: addRotation(base.rotation, askedDegrees + 90), filled: base.filled },
    { type: base.type, rotation: addRotation(base.rotation, askedDegrees - 90), filled: base.filled },
    { ...correct, mirrored: true },
    { type: SHAPE_TYPES[(SHAPE_TYPES.indexOf(base.type) + 1) % 4], rotation: correct.rotation, filled: base.filled },
  ];

  const { options, optionShapes, correct_answer } = buildOptions(correct, candidates);

  return {
    domain: "visual_spatial",
    subdomain: "rotation_match",
    difficulty,
    question_text: `Imagine rotating the shape below ${askedDegrees}° clockwise. Which option shows the result?`,
    question_shape: base,
    options,
    optionShapes,
    correct_answer,
    explanation: `Rotating the original shape ${askedDegrees}° clockwise gives the shape with rotation ${correct.rotation}°.`,
  };
}

// --- Subdomain: reflection_match ---
function generateReflectionMatch(difficulty: number): GeneratedVisualQuestion {
  const base = randomShape();
  const correct: ShapeSpec = { ...base, mirrored: true };

  const candidates: ShapeSpec[] = [
    { ...base, mirrored: false },
    { type: base.type, rotation: addRotation(base.rotation, 90), filled: base.filled, mirrored: true },
    { type: base.type, rotation: addRotation(base.rotation, 180), filled: base.filled, mirrored: true },
    { type: SHAPE_TYPES[(SHAPE_TYPES.indexOf(base.type) + 2) % 4], rotation: base.rotation, filled: base.filled, mirrored: true },
  ];

  const { options, optionShapes, correct_answer } = buildOptions(correct, candidates);

  return {
    domain: "visual_spatial",
    subdomain: "reflection_match",
    difficulty,
    question_text: `Which option shows the MIRROR IMAGE (flipped left-right) of the shape below?`,
    question_shape: base,
    options,
    optionShapes,
    correct_answer,
    explanation: `The mirror image flips the shape horizontally while keeping its rotation and fill the same.`,
  };
}

// --- Subdomain: shape_analogy ---
type Rule = { apply: (s: ShapeSpec) => ShapeSpec; desc: string };
const RULES: Rule[] = [
  { apply: (s) => ({ ...s, rotation: addRotation(s.rotation, 90) }), desc: "rotate 90° clockwise" },
  { apply: (s) => ({ ...s, rotation: addRotation(s.rotation, 180) }), desc: "rotate 180°" },
  { apply: (s) => ({ ...s, filled: !s.filled }), desc: "toggle fill (filled ↔ outline)" },
  { apply: (s) => ({ ...s, mirrored: !s.mirrored }), desc: "mirror horizontally" },
];

function generateShapeAnalogy(difficulty: number): GeneratedVisualQuestion {
  const availableRules = difficulty <= 3 ? RULES.slice(0, 2) : RULES;
  const rule = availableRules[randInt(0, availableRules.length - 1)];

  const shapeA = randomShape();
  const shapeB = rule.apply(shapeA);
  const shapeC = randomShape();
  const correct = rule.apply(shapeC);

  const wrongRules = RULES.filter((r) => r.desc !== rule.desc);
  const candidates: ShapeSpec[] = wrongRules.slice(0, 3).map((r) => r.apply(shapeC));
  candidates.push(rule.apply(shapeA));

  const { options, optionShapes, correct_answer } = buildOptions(correct, candidates);

  return {
    domain: "visual_spatial",
    subdomain: "shape_analogy",
    difficulty,
    question_text: `The first shape relates to the second the same way the third relates to the missing fourth. Which option completes it?`,
    question_grid: [shapeA, shapeB, shapeC, null],
    options,
    optionShapes,
    correct_answer,
    explanation: `The rule is: ${rule.desc}. Applying it to the third shape gives the correct answer.`,
  };
}

// --- Main entry point ---
const generators = [generatePatternCompletion, generateRotationMatch, generateReflectionMatch, generateShapeAnalogy];

export function generateVisualSpatialQuestion(difficulty: number = 3): GeneratedVisualQuestion {
  const clamped = Math.min(5, Math.max(1, difficulty));
  const generator = generators[randInt(0, generators.length - 1)];
  return generator(clamped);
}