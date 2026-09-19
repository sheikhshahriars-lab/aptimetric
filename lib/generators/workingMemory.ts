// lib/generators/workingMemory.ts
// Working Memory bank — 12-point difficulty scale (1..12).
// Difficulty is driven by the length of the sequence the user must hold
// in mind (digit/letter span) or the number of items they must sum.

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

function randomDigits(length: number): number[] {
  const digits: number[] = [];
  for (let i = 0; i < length; i++) digits.push(randInt(0, 9));
  return digits;
}

const LETTERS = ["B", "C", "D", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "V", "W", "X", "Y", "Z"];

function randomLetters(length: number): string[] {
  return shuffle(LETTERS).slice(0, length);
}

// 12 evenly spaced difficulty levels -> sequence length shown to the user.
const SPAN_LENGTHS = [3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9];
const BACKWARD_LENGTHS = [3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8];
const RUNNING_LENGTHS = [3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8];

function ordinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

// --- Subdomain: digit_span ---
function generateDigitSpan(difficulty: number): GeneratedQuestion {
  const length = SPAN_LENGTHS[difficulty - 1];
  const digits = randomDigits(length);
  const sequenceText = digits.join(" - ");

  const askPosition = randInt(0, length - 1);
  const positionLabel =
    askPosition === 0 ? "first" : askPosition === length - 1 ? "last" : `${ordinal(askPosition + 1)}`;
  const answer = digits[askPosition].toString();

  const distractors = new Set<string>();
  while (distractors.size < 3) {
    const d = randInt(0, 9).toString();
    if (d !== answer) distractors.add(d);
  }

  return {
    domain: "working_memory",
    subdomain: "digit_span",
    difficulty,
    question_text: `Memorize this sequence of digits:\n\n${sequenceText}\n\nWhat was the ${positionLabel} digit?`,
    options: shuffle([answer, ...Array.from(distractors)]),
    correct_answer: answer,
    explanation: `The sequence was ${sequenceText}. The ${positionLabel} digit is ${answer}.`,
  };
}

// --- Subdomain: letter_span ---
function generateLetterSpan(difficulty: number): GeneratedQuestion {
  const length = SPAN_LENGTHS[difficulty - 1];
  const letters = randomLetters(length);
  const sequenceText = letters.join(" - ");

  const askPosition = randInt(0, length - 1);
  const positionLabel =
    askPosition === 0 ? "first" : askPosition === length - 1 ? "last" : `${ordinal(askPosition + 1)}`;
  const answer = letters[askPosition];

  const usedLetters = new Set(letters);
  const distractors = new Set<string>();
  while (distractors.size < 3) {
    const candidate = LETTERS[randInt(0, LETTERS.length - 1)];
    if (candidate !== answer && !usedLetters.has(candidate)) distractors.add(candidate);
  }

  return {
    domain: "working_memory",
    subdomain: "letter_span",
    difficulty,
    question_text: `Memorize this sequence of letters:\n\n${sequenceText}\n\nWhat was the ${positionLabel} letter?`,
    options: shuffle([answer, ...Array.from(distractors)]),
    correct_answer: answer,
    explanation: `The sequence was ${sequenceText}. The ${positionLabel} letter is ${answer}.`,
  };
}

// --- Subdomain: backward_recall ---
function generateBackwardRecall(difficulty: number): GeneratedQuestion {
  const length = BACKWARD_LENGTHS[difficulty - 1];
  const digits = randomDigits(length);
  const sequenceText = digits.join(" - ");
  const reversed = [...digits].reverse().join("");

  const distractors = new Set<string>();
  let guard = 0;
  while (distractors.size < 3 && guard < 60) {
    guard++;
    const shuffled = shuffle([...digits]).join("");
    if (shuffled !== reversed) distractors.add(shuffled);
  }
  // Repeated digits can leave too few unique permutations — perturb one digit.
  while (distractors.size < 3) {
    const chars = reversed.split("");
    const pos = randInt(0, chars.length - 1);
    const original = chars[pos];
    let replacement = randInt(0, 9).toString();
    while (replacement === original) replacement = randInt(0, 9).toString();
    chars[pos] = replacement;
    const candidate = chars.join("");
    if (candidate !== reversed) distractors.add(candidate);
  }

  return {
    domain: "working_memory",
    subdomain: "backward_recall",
    difficulty,
    question_text: `Memorize this sequence of digits:\n\n${sequenceText}\n\nWhich option shows the sequence in REVERSE order?`,
    options: shuffle([reversed, ...Array.from(distractors)]),
    correct_answer: reversed,
    explanation: `The original sequence was ${sequenceText}. Reversed, it becomes ${reversed}.`,
  };
}

// --- Subdomain: running_total ---
function generateRunningTotal(difficulty: number): GeneratedQuestion {
  const length = RUNNING_LENGTHS[difficulty - 1];
  const span = difficulty <= 3 ? 5 : difficulty <= 7 ? 9 : 15;
  const numbers = Array.from({ length }, () => randInt(1, span));
  const sequenceText = numbers.join(" - ");

  const lastCount = difficulty <= 2 ? 2 : 3;
  const lastK = numbers.slice(-lastCount);
  const answer = lastK.reduce((a, b) => a + b, 0);

  const distractors = new Set<number>();
  while (distractors.size < 3) {
    const offset = randInt(-4, 4);
    const wrong = answer + offset;
    if (offset !== 0 && wrong > 0 && wrong !== answer) distractors.add(wrong);
  }

  return {
    domain: "working_memory",
    subdomain: "running_total",
    difficulty,
    question_text: `Memorize this sequence of numbers:\n\n${sequenceText}\n\nWhat is the SUM of the last ${lastCount} numbers shown?`,
    options: shuffle([answer.toString(), ...Array.from(distractors).map((n) => n.toString())]),
    correct_answer: answer.toString(),
    explanation: `The last ${lastCount} numbers were ${lastK.join(", ")}. Their sum is ${lastK.join(" + ")} = ${answer}.`,
  };
}

// --- Main entry point ---
const generators = [generateDigitSpan, generateLetterSpan, generateBackwardRecall, generateRunningTotal];

export function generateWorkingMemoryQuestion(difficulty: number = 6): GeneratedQuestion {
  const clamped = Math.min(12, Math.max(1, difficulty));
  const generator = generators[randInt(0, generators.length - 1)];
  return generator(clamped);
}