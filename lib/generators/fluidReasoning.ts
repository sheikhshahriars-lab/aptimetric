// lib/generators/fluidReasoning.ts

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

// --- Subdomain: letter_series ---
function generateLetterSeries(difficulty: number): GeneratedQuestion {
  const lengths = [4, 5, 5, 6, 6];
  const maxSkip = [2, 3, 3, 4, 5];
  const length = lengths[difficulty - 1];
  const skipA = randInt(1, maxSkip[difficulty - 1]);
  let skipB = randInt(1, maxSkip[difficulty - 1]);
  while (skipB === skipA) skipB = randInt(1, maxSkip[difficulty - 1]);

  const startIndex = randInt(0, 25);
  const codes: number[] = [startIndex];
  for (let i = 1; i < length; i++) {
    const skip = i % 2 === 1 ? skipA : skipB;
    codes.push(codes[i - 1] + skip);
  }
  const nextSkip = length % 2 === 1 ? skipA : skipB;
  const nextCode = codes[length - 1] + nextSkip;

  const sequenceText = codes.map((c) => letterAt(c)).join(" - ");
  const answer = letterAt(nextCode);

  const distractors = new Set<string>();
  const offsets = [1, -1, 2, -2, 3];
  let oi = 0;
  while (distractors.size < 3 && oi < offsets.length) {
    const candidate = letterAt(nextCode + offsets[oi]);
    if (candidate !== answer) distractors.add(candidate);
    oi++;
  }

  return {
    domain: "fluid_reasoning",
    subdomain: "letter_series",
    difficulty,
    question_text: `What letter comes next in this series?\n\n${sequenceText} - ?`,
    options: shuffle([answer, ...Array.from(distractors)]),
    correct_answer: answer,
    explanation: `The series alternates two skip patterns (+${skipA} and +${skipB} through the alphabet). The next letter is ${answer}.`,
  };
}

// --- Subdomain: symbolic_transformation ---
function generateSymbolicTransformation(difficulty: number): GeneratedQuestion {
  const wordLengths = [3, 4, 4, 5, 5];
  const maxShift = [3, 4, 5, 6, 8];
  const wordLength = wordLengths[difficulty - 1];
  const shift = randInt(1, maxShift[difficulty - 1]);

  const wordIndices: number[] = [];
  for (let i = 0; i < wordLength; i++) wordIndices.push(randInt(0, 25));
  const word = wordIndices.map((c) => letterAt(c)).join("");
  const shifted = wordIndices.map((c) => letterAt(c + shift)).join("");

  function shiftBy(n: number): string {
    return wordIndices.map((c) => letterAt(c + n)).join("");
  }

  const distractors = new Set<string>();
  const wrongShifts = [shift + 1, shift - 1, shift + 2];
  for (const s of wrongShifts) {
    const candidate = shiftBy(s);
    if (candidate !== shifted) distractors.add(candidate);
  }

  return {
    domain: "fluid_reasoning",
    subdomain: "symbolic_transformation",
    difficulty,
    question_text: `If each letter shifts forward by ${shift} position(s) in the alphabet (A→B→C..., wrapping from Z back to A), what does "${word}" become?`,
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
  const pool = shuffle([...NONSENSE_WORDS]).slice(0, 3);
  const [A, B, C] = pool;
  const useNegative = difficulty >= 4;

  let premise1: string, premise2: string, correct: string, distractors: string[];

  if (!useNegative) {
    premise1 = `All ${A} are ${B}.`;
    premise2 = `All ${B} are ${C}.`;
    correct = `All ${A} are ${C}.`;
    distractors = [`All ${C} are ${A}.`, `All ${B} are ${A}.`, `No ${A} are ${C}.`];
  } else {
    premise1 = `All ${A} are ${B}.`;
    premise2 = `No ${B} are ${C}.`;
    correct = `No ${A} are ${C}.`;
    distractors = [`All ${A} are ${C}.`, `Some ${A} are ${C}.`, `No ${C} are ${B}.`];
  }

  return {
    domain: "fluid_reasoning",
    subdomain: "logical_deduction",
    difficulty,
    question_text: `${premise1} ${premise2}\n\nWhich conclusion logically follows?`,
    options: shuffle([correct, ...distractors]),
    correct_answer: correct,
    explanation: useNegative
      ? `Since all ${A} are ${B}, and no ${B} are ${C}, no ${A} can be ${C} either.`
      : `Since all ${A} are ${B}, and all ${B} are ${C}, it follows that all ${A} are ${C}.`,
  };
}

// --- Subdomain: analogy_completion ---
const RELATION_POOL: { fn: (x: number) => number; desc: string }[] = [
  { fn: (x) => x + 2, desc: "add 2" },
  { fn: (x) => x + 5, desc: "add 5" },
  { fn: (x) => x * 2, desc: "double" },
  { fn: (x) => x * 3, desc: "triple" },
  { fn: (x) => x * x, desc: "square" },
];

function generateAnalogyCompletion(difficulty: number): GeneratedQuestion {
  const available = RELATION_POOL.slice(0, Math.min(difficulty + 1, RELATION_POOL.length));
  const relation = available[randInt(0, available.length - 1)];
  const isSquare = relation.desc === "square";

  const base = isSquare ? 9 : 2 + difficulty * 3;
  const a = randInt(2, base);
  let c = randInt(2, base);
  while (c === a) c = randInt(2, base);

  const b = relation.fn(a);
  const d = relation.fn(c);

  const distractors = new Set<number>();
  for (const other of RELATION_POOL) {
    if (other.desc === relation.desc) continue;
    const candidate = other.fn(c);
    if (candidate !== d && candidate > 0) distractors.add(candidate);
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

export function generateFluidReasoningQuestion(difficulty: number = 3): GeneratedQuestion {
  const clamped = Math.min(5, Math.max(1, difficulty));
  const generator = generators[randInt(0, generators.length - 1)];
  return generator(clamped);
}