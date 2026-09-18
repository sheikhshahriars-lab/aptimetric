// lib/generators/quantitative.ts

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

function makeOptions(correct: number, spread: number): { options: string[]; correct_answer: string } {
  const wrongSet = new Set<number>();
  while (wrongSet.size < 3) {
    const offset = randInt(-spread, spread);
    const wrong = correct + offset;
    if (offset !== 0 && wrong !== correct && !wrongSet.has(wrong)) {
      wrongSet.add(wrong);
    }
  }
  const options = shuffle([correct, ...Array.from(wrongSet)]).map((n) => n.toString());
  return { options, correct_answer: correct.toString() };
}

// --- Subdomain: arithmetic ---
function generateArithmetic(difficulty: number): GeneratedQuestion {
  const ranges = [10, 25, 50, 100, 500];
  const range = ranges[difficulty - 1];
  const ops = difficulty <= 2 ? ["+", "-"] : ["+", "-", "×"];
  const op = ops[randInt(0, ops.length - 1)];

  let a = randInt(1, range);
  let b = randInt(1, range);
  let answer: number;
  let text: string;

  if (op === "+") {
    answer = a + b;
    text = `${a} + ${b} = ?`;
  } else if (op === "-") {
    if (b > a) [a, b] = [b, a];
    answer = a - b;
    text = `${a} - ${b} = ?`;
  } else {
    a = randInt(2, Math.min(20, range));
    b = randInt(2, Math.min(12, range));
    answer = a * b;
    text = `${a} × ${b} = ?`;
  }

  const spread = Math.max(3, Math.round(answer * 0.15));
  const { options, correct_answer } = makeOptions(answer, spread);

  return {
    domain: "quantitative",
    subdomain: "arithmetic",
    difficulty,
    question_text: text,
    options,
    correct_answer,
    explanation: `${text.replace(" = ?", "")} = ${answer}.`,
  };
}

// --- Subdomain: percentages ---
function generatePercentage(difficulty: number): GeneratedQuestion {
  const bases = [100, 200, 400, 750, 1200];
  const percents = [10, 20, 25, 15, 35, 40, 60, 75, 12, 18];
  const base = bases[difficulty - 1];
  const percent = percents[randInt(0, percents.length - 1)];
  const answer = Math.round((percent / 100) * base);

  const text = `What is ${percent}% of ${base}?`;
  const spread = Math.max(5, Math.round(answer * 0.2));
  const { options, correct_answer } = makeOptions(answer, spread);

  return {
    domain: "quantitative",
    subdomain: "percentages",
    difficulty,
    question_text: text,
    options,
    correct_answer,
    explanation: `${percent}% of ${base} = (${percent}/100) × ${base} = ${answer}.`,
  };
}

// --- Subdomain: ratios_proportions ---
function generateRatio(difficulty: number): GeneratedQuestion {
  const multiplierRanges = [3, 5, 8, 12, 20];
  const mult = multiplierRanges[difficulty - 1];

  const ratioA = randInt(2, 9);
  const ratioB = randInt(2, 9);
  const scale = randInt(2, mult);
  const totalA = ratioA * scale;
  const totalB = ratioB * scale;

  const text = `If the ratio of A to B is ${ratioA}:${ratioB}, and A = ${totalA}, what is B?`;
  const answer = totalB;
  const spread = Math.max(3, Math.round(answer * 0.25));
  const { options, correct_answer } = makeOptions(answer, spread);

  return {
    domain: "quantitative",
    subdomain: "ratios_proportions",
    difficulty,
    question_text: text,
    options,
    correct_answer,
    explanation: `Scale factor = ${totalA} ÷ ${ratioA} = ${scale}. So B = ${ratioB} × ${scale} = ${answer}.`,
  };
}

// --- Subdomain: number_sequences ---
function generateSequence(difficulty: number): GeneratedQuestion {
  const stepRanges = [3, 5, 8, 12, 20];
  const step = randInt(2, stepRanges[difficulty - 1]);
  const start = randInt(1, 20);
  const isArithmetic = difficulty <= 3 || Math.random() < 0.6;

  const seq: number[] = [start];
  for (let i = 1; i < 5; i++) {
    if (isArithmetic) {
      seq.push(seq[i - 1] + step);
    } else {
      seq.push(seq[i - 1] * 2 + randInt(-1, 1));
    }
  }

  const answer = isArithmetic ? seq[4] + step : seq[4] * 2;
  const text = `What comes next in the sequence: ${seq.join(", ")}, ?`;
  const spread = Math.max(3, Math.round(Math.abs(answer) * 0.2) + 2);
  const { options, correct_answer } = makeOptions(answer, spread);

  return {
    domain: "quantitative",
    subdomain: "number_sequences",
    difficulty,
    question_text: text,
    options,
    correct_answer,
    explanation: isArithmetic
      ? `Each term increases by ${step}, so the next term is ${answer}.`
      : `Each term roughly doubles, so the next term is ${answer}.`,
  };
}

// --- Subdomain: word_problems ---
function generateWordProblem(difficulty: number): GeneratedQuestion {
  const priceRanges = [10, 20, 40, 80, 150];
  const pricePerItem = randInt(2, priceRanges[difficulty - 1]);
  const quantity = randInt(2, 12);
  const answer = pricePerItem * quantity;

  const text = `A shop sells notebooks for $${pricePerItem} each. If someone buys ${quantity} notebooks, how much do they pay in total?`;
  const spread = Math.max(5, Math.round(answer * 0.2));
  const { options, correct_answer } = makeOptions(answer, spread);

  return {
    domain: "quantitative",
    subdomain: "word_problems",
    difficulty,
    question_text: text,
    options,
    correct_answer,
    explanation: `${pricePerItem} × ${quantity} = ${answer}.`,
  };
}

// --- Main entry point ---
const generators = [
  generateArithmetic,
  generatePercentage,
  generateRatio,
  generateSequence,
  generateWordProblem,
];

export function generateQuantitativeQuestion(difficulty: number = 3): GeneratedQuestion {
  const clamped = Math.min(5, Math.max(1, difficulty));
  const generator = generators[randInt(0, generators.length - 1)];
  return generator(clamped);
}