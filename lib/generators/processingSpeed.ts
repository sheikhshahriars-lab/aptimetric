// lib/generators/processingSpeed.ts

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

const LETTERS = ["B", "C", "D", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "V", "W", "X", "Y", "Z"];
const SYMBOLS = ["#", "@", "%", "&", "*", "$", "+", "="];

function randomLetters(length: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < length; i++) out.push(LETTERS[randInt(0, LETTERS.length - 1)]);
  return out;
}

// --- Subdomain: symbol_counting ---
function generateSymbolCounting(difficulty: number): GeneratedQuestion {
  const lengths = [15, 20, 25, 30, 35];
  const poolSizes = [3, 4, 5, 6, 7];
  const length = lengths[difficulty - 1];
  const poolSize = poolSizes[difficulty - 1];

  const pool = shuffle([...SYMBOLS]).slice(0, poolSize);
  const target = pool[randInt(0, pool.length - 1)];

  const row: string[] = [];
  for (let i = 0; i < length; i++) row.push(pool[randInt(0, pool.length - 1)]);
  const count = row.filter((s) => s === target).length;
  const displayString = row.join(" ");

  const distractors = new Set<number>();
  while (distractors.size < 3) {
    const offset = randInt(-3, 3);
    const wrong = count + offset;
    if (offset !== 0 && wrong >= 0 && wrong !== count) distractors.add(wrong);
  }

  return {
    domain: "processing_speed",
    subdomain: "symbol_counting",
    difficulty,
    question_text: `Count how many times "${target}" appears in the string below:\n\n${displayString}`,
    options: shuffle([count.toString(), ...Array.from(distractors).map((n) => n.toString())]),
    correct_answer: count.toString(),
    explanation: `"${target}" appears ${count} time(s) in the string.`,
  };
}

// --- Subdomain: string_matching ---
function generateStringMatching(difficulty: number): GeneratedQuestion {
  const lengths = [5, 6, 7, 8, 9];
  const length = lengths[difficulty - 1];
  const target = randomLetters(length).join("");

  function makeDistractor(): string {
    const chars = target.split("");
    const pos = randInt(0, chars.length - 1);
    let newChar = LETTERS[randInt(0, LETTERS.length - 1)];
    while (newChar === chars[pos]) newChar = LETTERS[randInt(0, LETTERS.length - 1)];
    chars[pos] = newChar;
    return chars.join("");
  }

  const distractors = new Set<string>();
  while (distractors.size < 3) {
    const d = makeDistractor();
    if (d !== target) distractors.add(d);
  }

  return {
    domain: "processing_speed",
    subdomain: "string_matching",
    difficulty,
    question_text: `Which option below EXACTLY matches this string?\n\n${target}`,
    options: shuffle([target, ...Array.from(distractors)]),
    correct_answer: target,
    explanation: `The target string was ${target}. The other options each differ by one letter.`,
  };
}

// --- Subdomain: number_comparison ---
function generateNumberComparison(difficulty: number): GeneratedQuestion {
  const digitCounts = [2, 3, 4, 5, 6];
  const rangeWidths = [40, 25, 15, 8, 4];
  const digits = digitCounts[difficulty - 1];
  const rangeWidth = rangeWidths[difficulty - 1];

  const base = randInt(Math.pow(10, digits - 1), Math.pow(10, digits) - 1);
  const numbers = new Set<number>([base]);
  while (numbers.size < 4) {
    const offset = randInt(-rangeWidth, rangeWidth);
    const candidate = base + offset;
    if (candidate > 0) numbers.add(candidate);
  }
  const numArray = Array.from(numbers);
  const askLargest = Math.random() < 0.5;
  const answer = askLargest ? Math.max(...numArray) : Math.min(...numArray);

  return {
    domain: "processing_speed",
    subdomain: "number_comparison",
    difficulty,
    question_text: `Which of these numbers is the ${askLargest ? "LARGEST" : "SMALLEST"}?`,
    options: shuffle(numArray.map((n) => n.toString())),
    correct_answer: answer.toString(),
    explanation: `The numbers were ${numArray.join(", ")}. The ${askLargest ? "largest" : "smallest"} is ${answer}.`,
  };
}

// --- Subdomain: code_substitution ---
function generateCodeSubstitution(difficulty: number): GeneratedQuestion {
  const keySizes = [3, 4, 5, 6, 7];
  const seqLengths = [3, 4, 4, 5, 5];
  const keySize = keySizes[difficulty - 1];
  const seqLength = seqLengths[difficulty - 1];

  const keyLetters = shuffle([...LETTERS]).slice(0, keySize);
  const key: Record<number, string> = {};
  for (let d = 0; d < keySize; d++) key[d] = keyLetters[d];
  const keyText = Object.entries(key).map(([d, l]) => `${d}=${l}`).join(", ");

  const sequence: number[] = [];
  for (let i = 0; i < seqLength; i++) sequence.push(randInt(0, keySize - 1));
  const sequenceText = sequence.join("-");
  const correctTranslation = sequence.map((d) => key[d]).join("");

  function makeDistractor(): string {
    const letters = correctTranslation.split("");
    const pos = randInt(0, letters.length - 1);
    let newLetter = LETTERS[randInt(0, LETTERS.length - 1)];
    while (newLetter === letters[pos]) newLetter = LETTERS[randInt(0, LETTERS.length - 1)];
    letters[pos] = newLetter;
    return letters.join("");
  }

  const distractors = new Set<string>();
  while (distractors.size < 3) {
    const d = makeDistractor();
    if (d !== correctTranslation) distractors.add(d);
  }

  return {
    domain: "processing_speed",
    subdomain: "code_substitution",
    difficulty,
    question_text: `Key: ${keyText}\n\nUsing the key above, translate this sequence: ${sequenceText}\n\nWhich option shows the correct translation?`,
    options: shuffle([correctTranslation, ...Array.from(distractors)]),
    correct_answer: correctTranslation,
    explanation: `Using the key (${keyText}), the sequence ${sequenceText} translates to ${correctTranslation}.`,
  };
}

// --- Main entry point ---
const generators = [
  generateSymbolCounting,
  generateStringMatching,
  generateNumberComparison,
  generateCodeSubstitution,
];

export function generateProcessingSpeedQuestion(difficulty: number = 3): GeneratedQuestion {
  const clamped = Math.min(5, Math.max(1, difficulty));
  const generator = generators[randInt(0, generators.length - 1)];
  return generator(clamped);
}