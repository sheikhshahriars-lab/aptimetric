// lib/generators/fluidReasoning.ts
// Fluid Reasoning bank — 12-point difficulty scale (1..12).
// Difficulty grows through longer/harder rule combinations in letter series,
// larger alphabet shifts, and multi-premise syllogisms.

export type GeneratedQuestion = {
  domain: string;
  subdomain: string;
  difficulty: number;
  question_text: string;
  options: string[];
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

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function letterAt(index: number): string {
  return ALPHABET[((index % 26) + 26) % 26];
}

function makeLetterOptions(answer: string): { options: string[]; correct_answer: string } {
  const wrongSet = new Set<string>();
  const offsets = [1, -1, 2, -2, 3, -3, 4, -4];
  for (const o of offsets) {
    if (wrongSet.size >= 3) break;
    const candidate = letterAt(ALPHABET.indexOf(answer) + o);
    if (candidate !== answer) wrongSet.add(candidate);
  }
  return { options: shuffle([answer, ...Array.from(wrongSet)]), correct_answer: answer };
}

const SERIES_LENGTHS = [3, 4, 4, 5, 5, 5, 6, 6, 6, 6, 7, 7];
const SERIES_MAX_SKIP = [1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8];

// --- Subdomain: letter_series ---
function generateLetterSeries(difficulty: number): GeneratedQuestion {
  const d = difficulty;
  const length = SERIES_LENGTHS[d - 1];
  const maxSkip = SERIES_MAX_SKIP[d - 1];

  const startIndex = randInt(0, 25);
  let seqCodes: number[];

  if (d <= 2) {
    const skip = randInt(1, maxSkip);
    seqCodes = [];
    let cur = startIndex;
    for (let i = 0; i < length; i++) {
      seqCodes.push(cur);
      cur += skip;
    }
    const next = cur;
    const { options, correct_answer } = makeLetterOptions(letterAt(next));
    return {
      domain: "fluid_reasoning",
      subdomain: "letter_series",
      difficulty,
      question_text: `What letter comes next in this series?\n\n${seqCodes.map((c) => letterAt(c)).join(" - ")} - ?`,
      options,
      correct_answer,
      explanation: `Each letter advances ${skip} positions through the alphabet. Next: ${correct_answer}.`,
    };
  }

  const skipA = randInt(1, maxSkip);
  let skipB = randInt(1, maxSkip);
  while (skipB === skipA) skipB = randInt(1, maxSkip);

  seqCodes = [startIndex];
  for (let i = 1; i < length; i++) {
    const skip = i % 2 === 1 ? skipA : skipB;
    seqCodes.push(seqCodes[i - 1] + skip);
  }
  const nextSkip = length % 2 === 1 ? skipA : skipB;
  const nextCode = seqCodes[length - 1] + nextSkip;

  const { options, correct_answer } = makeLetterOptions(letterAt(nextCode));
  return {
    domain: "fluid_reasoning",
    subdomain: "letter_series",
    difficulty,
    question_text: `What letter comes next in this series?\n\n${seqCodes.map((c) => letterAt(c)).join(" - ")} - ?`,
    options,
    correct_answer,
    explanation: `The series alternates two skip patterns (+${skipA} and +${skipB} through the alphabet). The next letter is ${correct_answer}.`,
  };
}

const TRANSFORM_LENGTHS = [3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6];
const TRANSFORM_SHIFTS = [2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20];

// --- Subdomain: symbolic_transformation ---
function generateSymbolicTransformation(difficulty: number): GeneratedQuestion {
  const wordLength = TRANSFORM_LENGTHS[difficulty - 1];
  const shift = randInt(1, TRANSFORM_SHIFTS[difficulty - 1]);

  const wordIndices: number[] = [];
  for (let i = 0; i < wordLength; i++) wordIndices.push(randInt(0, 25));
  const word = wordIndices.map((c) => letterAt(c)).join("");
  const shifted = wordIndices.map((c) => letterAt(c + shift)).join("");

  function shiftBy(n: number): string {
    return wordIndices.map((c) => letterAt(c + n)).join("");
  }

  const distractorShifts = [shift + 1, shift - 1, shift + 2, shift - 2, shift + 3];
  const distractors = new Set<string>();
  for (const s of distractorShifts) {
    if (distractors.size >= 3) break;
    const candidate = shiftBy(s);
    if (candidate !== shifted) distractors.add(candidate);
  }

  return {
    domain: "fluid_reasoning",
    subdomain: "symbolic_transformation",
    difficulty,
    question_text: `If each letter shifts forward by ${shift} position(s) in the alphabet (A→B→C…, wrapping from Z back to A), what does "${word}" become?`,
    options: shuffle([shifted, ...Array.from(distractors)]).slice(0, 4),
    correct_answer: shifted,
    explanation: `Shifting each letter of "${word}" forward by ${shift} gives "${shifted}".`,
  };
}

// --- Subdomain: logical_deduction ---
const NONSENSE_WORDS = [
  "Blips", "Zorks", "Trunds", "Fenneks", "Gorpies", "Lorxes",
  "Manties", "Quibbs", "Sarnels", "Twindles", "Vexors", "Wumples",
];

function generateLogicalDeduction(difficulty: number): GeneratedQuestion {
  const d = difficulty;
  const pool = shuffle([...NONSENSE_WORDS]).slice(0, 3);
  const [A, B, C] = pool;

  let premise: string;
  let correct: string;
  let distractors: string[];
  let explanation: string;

  if (d <= 5) {
    premise = `All ${A} are ${B}. All ${B} are ${C}.`;
    correct = `All ${A} are ${C}.`;
    distractors = [
      `All ${C} are ${A}.`,
      `All ${B} are ${A}.`,
      `No ${A} are ${C}.`,
    ];
    explanation = `Since all ${A} are ${B}, and all ${B} are ${C}, it follows that all ${A} are ${C}.`;
  } else if (d <= 7) {
    premise = `All ${A} are ${B}. No ${B} are ${C}.`;
    correct = `No ${A} are ${C}.`;
    distractors = [
      `All ${A} are ${C}.`,
      `Some ${A} are ${C}.`,
      `No ${C} are ${B}.`,
    ];
    explanation = `Since all ${A} are ${B}, and no ${B} are ${C}, no ${A} can be ${C} either.`;
  } else {
    premise = `All ${A} are ${B}. No ${C} are ${B}.`;
    correct = `No ${A} are ${C}.`;
    distractors = [
      `No ${B} are ${A}.`,
      `All ${C} are ${A}.`,
      `Some ${A} are ${C}.`,
    ];
    explanation = `All ${A} are inside ${B}, and ${C} is entirely outside ${B}, so ${A} and ${C} cannot overlap.`;
  }

  return {
    domain: "fluid_reasoning",
    subdomain: "logical_deduction",
    difficulty,
    question_text: `${premise}\n\nWhich conclusion logically follows?`,
    options: shuffle([correct, ...distractors]),
    correct_answer: correct,
    explanation,
  };
}

// --- Subdomain: analogy_completion ---
type Relation = { fn: (x: number) => number; desc: string };
// Progressively harder relation pool, released as difficulty grows.
const RELATION_POOL: { rel: Relation; fromLevel: number }[] = [
  { rel: { fn: (x) => x + 2, desc: "add 2" }, fromLevel: 1 },
  { rel: { fn: (x) => x + 5, desc: "add 5" }, fromLevel: 1 },
  { rel: { fn: (x) => x * 2, desc: "double" }, fromLevel: 3 },
  { rel: { fn: (x) => x * 3, desc: "triple" }, fromLevel: 5 },
  { rel: { fn: (x) => x - 3, desc: "subtract 3" }, fromLevel: 7 },
  { rel: { fn: (x) => x + 10, desc: "add 10" }, fromLevel: 8 },
  { rel: { fn: (x) => x * 5, desc: "multiply by 5" }, fromLevel: 9 },
  { rel: { fn: (x) => x * x, desc: "square" }, fromLevel: 10 },
];

function generateAnalogyCompletion(difficulty: number): GeneratedQuestion {
  const available = RELATION_POOL.filter((r) => r.fromLevel <= difficulty);
  let relation = available[randInt(0, available.length - 1)].rel;

  let a = 0;
  let c = 0;
  let b = 0;
  let d = 0;
  let valid = false;
  for (let attempt = 0; attempt < 40 && !valid; attempt++) {
    const isSquare = relation.desc === "square";
    const base = isSquare ? 9 : 3 + difficulty * 2;
    a = randInt(2, base);
    c = randInt(2, base);
    if (c === a) continue;
    b = relation.fn(a);
    d = relation.fn(c);
    valid = Number.isInteger(b) && Number.isInteger(d) && b > 0 && d > 0;
  }
  if (!valid) {
    // Relation could not yield two positive terms — use a safe additive relation.
    relation = RELATION_POOL[0].rel;
    a = randInt(2, 3 + difficulty * 2);
    c = randInt(2, 3 + difficulty * 2);
    while (c === a) c = randInt(2, 3 + difficulty * 2);
    b = relation.fn(a);
    d = relation.fn(c);
  }

  const distractors = new Set<number>();
  for (const other of RELATION_POOL) {
    if (other.rel.desc === relation.desc) continue;
    const candidate = other.rel.fn(c);
    if (Number.isInteger(candidate) && candidate !== d && candidate > 0) {
      distractors.add(candidate);
    }
    if (distractors.size >= 3) break;
  }

  return {
    domain: "fluid_reasoning",
    subdomain: "analogy_completion",
    difficulty,
    question_text: `${a} is to ${b} as ${c} is to ?`,
    options: shuffle([d.toString(), ...Array.from(distractors).slice(0, 3).map((n) => n.toString())]),
    correct_answer: d.toString(),
    explanation: `The rule is: ${relation.desc} the first number. ${a} → ${b}, so ${c} → ${d}.`,
  };
}

// --- Main entry point ---
const generators = [
  generateLetterSeries,
  generateSymbolicTransformation,
  generateLogicalDeduction,
  generateAnalogyCompletion,
];

export function generateFluidReasoningQuestion(difficulty: number = 6): GeneratedQuestion {
  const clamped = Math.min(12, Math.max(1, difficulty));
  const generator = generators[randInt(0, generators.length - 1)];
  return generator(clamped);
}