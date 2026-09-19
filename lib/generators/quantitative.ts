// lib/generators/quantitative.ts
// Quantitative Reasoning bank — 12-point difficulty scale (1..12).
// Each subdomain uses difficulty-gated templates so that higher levels mean
// genuinely harder computation, not just bigger numbers.

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

function gcd(a: number, b: number): number {
  while (b !== 0) [a, b] = [b, a % b];
  return a;
}

function makeOptions(
  correctNumber: number,
  spread: number
): { options: string[]; correct_answer: string } {
  const correct = Math.round(correctNumber);
  // Percentages, counts and ratios are never negative; arithmetic can be.
  const lowerBound = correct > 0 ? 1 : -Infinity;
  const wrongSet = new Set<number>();
  let guard = 0;
  while (wrongSet.size < 3 && guard < 150) {
    guard++;
    const offset = randInt(-spread, spread);
    if (offset === 0) continue;
    const w = correct + offset;
    if (w !== correct && w >= lowerBound && !wrongSet.has(w)) wrongSet.add(w);
  }
  if (wrongSet.size < 3) {
    const deltas = [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 8, -8, 10, -10];
    for (const d of deltas) {
      if (wrongSet.size >= 3) break;
      const w = correct + d;
      if (w !== correct && w >= lowerBound && !wrongSet.has(w)) wrongSet.add(w);
    }
  }
  const options = shuffle([correct, ...Array.from(wrongSet)]);
  return { options: options.map(String), correct_answer: String(correct) };
}

// --- Subdomain: arithmetic ---
function generateArithmetic(difficulty: number): GeneratedQuestion {
  const d = difficulty;
  let answer: number;
  let expression: string;
  let working: string;

  if (d <= 2) {
    const a = randInt(3, 12);
    const b = randInt(2, 9);
    if (Math.random() < 0.5) {
      answer = a + b;
      expression = `${a} + ${b}`;
      working = expression;
    } else {
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      answer = big - small;
      expression = `${big} - ${small}`;
      working = expression;
    }
  } else if (d <= 4) {
    const style = randInt(0, d >= 4 ? 2 : 1);
    if (style === 2) {
      const a = randInt(4, 15);
      const b = randInt(3, 9);
      answer = a * b;
      expression = `${a} × ${b}`;
      working = expression;
    } else if (style === 1) {
      const a = randInt(20, 99);
      const b = randInt(20, 99);
      answer = a + b;
      expression = `${a} + ${b}`;
      working = expression;
    } else {
      const a = randInt(30, 99);
      const b = randInt(11, 49);
      answer = a - b;
      expression = `${a} - ${b}`;
      working = expression;
    }
  } else if (d <= 6) {
    const style = randInt(0, d >= 6 ? 2 : 1);
    if (style === 2) {
      const a = randInt(12, 30);
      const b = randInt(12, 19);
      answer = a * b;
      expression = `${a} × ${b}`;
      working = expression;
    } else if (style === 1) {
      const a = randInt(100, 999);
      const b = randInt(100, 999);
      answer = a + b;
      expression = `${a} + ${b}`;
      working = expression;
    } else {
      const a = randInt(300, 999);
      const b = randInt(111, 299);
      answer = a - b;
      expression = `${a} - ${b}`;
      working = expression;
    }
  } else if (d <= 9) {
    const addOp = Math.random() < 0.6;
    const a = randInt(d >= 9 ? 12 : 4, d >= 9 ? 40 : 15);
    const b = randInt(3, d >= 9 ? 12 : 8);
    const c = randInt(1, d >= 9 ? 200 : 60);
    const product = a * b;
    if (!addOp && c > product) {
      answer = product + c;
      expression = `${a} × ${b} + ${c}`;
      working = `${a} × ${b} + ${c}`;
    } else {
      answer = addOp ? product + c : product - c;
      expression = `${a} × ${b} ${addOp ? "+" : "-"} ${c}`;
      working = `${a} × ${b} ${addOp ? "then " : "then minus "}${c}`;
    }
  } else {
    const a = randInt(10, 30);
    const b = randInt(10, 30);
    const c = randInt(2, 6);
    answer = (a + b) * c;
    expression = `(${a} + ${b}) × ${c}`;
    working = expression;
  }

  const spread = Math.max(4, Math.round(Math.abs(answer) * 0.1));
  const { options, correct_answer } = makeOptions(answer, spread);

  return {
    domain: "quantitative",
    subdomain: "arithmetic",
    difficulty,
    question_text: `Compute: ${expression} = ?`,
    options,
    correct_answer,
    explanation: `${working} = ${answer}.`,
  };
}

// --- Subdomain: percentages ---
function generatePercentage(difficulty: number): GeneratedQuestion {
  const d = difficulty;

  if (d <= 2) {
    const percents = [10, 20, 25, 50];
    const bases = [100, 200, 300, 400];
    const p = percents[randInt(0, percents.length - 1)];
    const base = bases[randInt(0, bases.length - 1)];
    const answer = (p / 100) * base;
    const { options, correct_answer } = makeOptions(answer, Math.max(4, base * 0.08));
    return {
      domain: "quantitative",
      subdomain: "percentages",
      difficulty,
      question_text: `What is ${p}% of ${base}?`,
      options,
      correct_answer,
      explanation: `${p}% of ${base} = (${p}/100) × ${base} = ${answer}.`,
    };
  }

  if (d <= 4) {
    const percents = [5, 12, 15, 20, 25, 30, 35, 45, 60, 75];
    const p = percents[randInt(0, percents.length - 1)];
    const denom = 100 / gcd(p, 100);
    const base = denom * randInt(denom === 100 ? 1 : 2, 12);
    const answer = (p / 100) * base;
    const { options, correct_answer } = makeOptions(answer, Math.max(4, answer * 0.25));
    return {
      domain: "quantitative",
      subdomain: "percentages",
      difficulty,
      question_text: `What is ${p}% of ${base}?`,
      options,
      correct_answer,
      explanation: `${p}% of ${base} = (${p}/100) × ${base} = ${answer}.`,
    };
  }

  if (d <= 6) {
    const up = Math.random() < 0.5;
    const percents = [10, 20, 25, 30, 40, 50, 60, 75];
    const p = percents[randInt(0, percents.length - 1)];
    const denom = 100 / gcd(p, 100);
    const base = denom * randInt(2, 12);
    const change = (p / 100) * base;
    const answer = up ? base + change : base - change;
    const { options, correct_answer } = makeOptions(answer, Math.max(4, answer * 0.2));
    return {
      domain: "quantitative",
      subdomain: "percentages",
      difficulty,
      question_text: `An item costs $${base}. Its price ${up ? "increases" : "decreases"} by ${p}%. What is the new price?`,
      options,
      correct_answer,
      explanation: `${p}% of $${base} = $${change}. New price = $${base} ${up ? "+" : "-"} $${change} = $${answer}.`,
    };
  }

  if (d <= 8) {
    const percents = [10, 20, 25, 40, 50, 60, 75];
    const p = percents[randInt(0, percents.length - 1)];
    const denom = 100 / gcd(p, 100);
    const total = denom * randInt(2, 15);
    const part = (p / 100) * total;
    const { options, correct_answer } = makeOptions(p, 15);
    return {
      domain: "quantitative",
      subdomain: "percentages",
      difficulty,
      question_text: `In a group of ${total} people, ${part} are left-handed. What percentage of the group is left-handed?`,
      options,
      correct_answer,
      explanation: `${part}/${total} = ${((part / total) * 100).toFixed(0)}%.`,
    };
  }

  if (d <= 10) {
    const percents = [10, 15, 20, 25, 30, 40, 50, 60];
    const p = percents[randInt(0, percents.length - 1)];
    const denom = 100 / gcd(p, 100);
    const base = denom * randInt(3, 15);
    const delta = (p / 100) * base;
    const final = base + delta;
    const { options, correct_answer } = makeOptions(p, 8);
    return {
      domain: "quantitative",
      subdomain: "percentages",
      difficulty,
      question_text: `A share price rose from $${base} to $${final}. What is the percentage increase?`,
      options,
      correct_answer,
      explanation: `Increase = $${final} - $${base} = $${delta}. ${delta}/${base} × 100 = ${p}%.`,
    };
  }

  // d 11-12: two-step percentage adjustments (final value rounded to nearest $).
  {
    const p1 = [10, 20, 25, 30][randInt(0, 3)];
    const p2 = [5, 10, 15, 20][randInt(0, 3)];
    const base = randInt(100, 500);
    const after1 = Math.round(base + (base * p1) / 100);
    const answer = Math.round(after1 + (after1 * p2) / 100);
    const { options, correct_answer } = makeOptions(answer, Math.max(10, answer * 0.1));
    return {
      domain: "quantitative",
      subdomain: "percentages",
      difficulty,
      question_text: `A product costs $${base}. The price first increases by ${p1}%, then by ${p2}% of the new price. What is the final price? (round to nearest dollar)`,
      options,
      correct_answer,
      explanation: `After +${p1}%: ≈$${after1}. After +${p2}% of $${after1}: ≈$${answer}.`,
    };
  }
}

// --- Subdomain: ratios_proportions ---
function generateRatio(difficulty: number): GeneratedQuestion {
  const d = difficulty;

  const ratioA = randInt(2, 9);
  let ratioB = randInt(2, 9);

  if (d <= 2) {
    const scale = randInt(2, 5);
    const a = ratioA * scale;
    const b = ratioB * scale;
    const answer = b;
    const { options, correct_answer } = makeOptions(answer, Math.max(3, b * 0.4));
    return {
      domain: "quantitative",
      subdomain: "ratios_proportions",
      difficulty,
      question_text: `If the ratio of A to B is ${ratioA}:${ratioB}, and A = ${a}, what is B?`,
      options,
      correct_answer,
      explanation: `Scale factor = ${a} ÷ ${ratioA} = ${scale}. So B = ${ratioB} × ${scale} = ${answer}.`,
    };
  }

  if (d <= 4) {
    const scale = randInt(4, 10);
    const reverse = Math.random() < 0.5;
    const a = ratioA * scale;
    const b = ratioB * scale;
    const { options, correct_answer } = makeOptions(reverse ? a : b, Math.max(4, (reverse ? a : b) * 0.4));
    return {
      domain: "quantitative",
      subdomain: "ratios_proportions",
      difficulty,
      question_text: reverse
        ? `If the ratio of A to B is ${ratioA}:${ratioB}, and B = ${b}, what is A?`
        : `If the ratio of A to B is ${ratioA}:${ratioB}, and A = ${a}, what is B?`,
      options,
      correct_answer,
      explanation: `Ratio parts sum to ${ratioA + ratioB}. Knowing one part, scale = ${reverse ? b : a} ÷ ${reverse ? ratioB : ratioA} = ${scale}. So ${reverse ? "A" : "B"} = ${reverse ? a : b}.`,
    };
  }

  if (d <= 6) {
    const scale = randInt(3, 8);
    const total = (ratioA + ratioB) * scale;
    const aVal = ratioA * scale;
    const bVal = ratioB * scale;
    const smaller = Math.min(aVal, bVal);
    const larger = Math.max(aVal, bVal);
    const askSmaller = Math.random() < 0.5;
    const answer = askSmaller ? smaller : larger;
    const { options, correct_answer } = makeOptions(answer, Math.max(4, answer * 0.35));
    return {
      domain: "quantitative",
      subdomain: "ratios_proportions",
      difficulty,
      question_text: `Two numbers are in the ratio ${ratioA}:${ratioB} and their sum is ${total}. What is the ${askSmaller ? "smaller" : "larger"} number?`,
      options,
      correct_answer,
      explanation: `Each ratio unit = ${total} ÷ ${ratioA + ratioB} = ${scale}. So the ${askSmaller ? "smaller" : "larger"} number is ${answer}.`,
    };
  }

  if (d <= 8) {
    // given difference, find the larger value
    while (ratioB === ratioA) ratioB = randInt(2, 9);
    const scale = randInt(4, 10);
    const diff = Math.abs(ratioA - ratioB) * scale;
    const larger = Math.max(ratioA, ratioB) * scale;
    const { options, correct_answer } = makeOptions(larger, Math.max(6, larger * 0.3));
    return {
      domain: "quantitative",
      subdomain: "ratios_proportions",
      difficulty,
      question_text: `Two numbers are in the ratio ${ratioA}:${ratioB} and their difference is ${diff}. What is the larger number?`,
      options,
      correct_answer,
      explanation: `Each ratio unit = ${diff} ÷ ${Math.abs(ratioA - ratioB)} = ${scale}. Larger = ${Math.max(ratioA, ratioB)} × ${scale} = ${larger}.`,
    };
  }

  if (d <= 10) {
    const scale = randInt(5, 12);
    const total = (ratioA + ratioB) * scale;
    const a = ratioA * scale;
    const { options, correct_answer } = makeOptions(a, Math.max(6, a * 0.3));
    return {
      domain: "quantitative",
      subdomain: "ratios_proportions",
      difficulty,
      question_text: `A recipe mixes sugar and flour in the ratio ${ratioA}:${ratioB}. A batch uses ${total} grams in total. How many grams of sugar are used?`,
      options,
      correct_answer,
      explanation: `Each ratio unit = ${total} ÷ ${ratioA + ratioB} = ${scale}. Sugar = ${ratioA} × ${scale} = ${a}.`,
    };
  }

  // d 11-12: ratio given via two parts and find remaining part difference.
  {
    const scale = randInt(6, 14);
    const total = (ratioA + ratioB) * scale;
    const diff = Math.abs(ratioA - ratioB) * scale
    const { options, correct_answer } = makeOptions(diff, Math.max(6, diff * 0.3));
    return {
      domain: "quantitative",
      subdomain: "ratios_proportions",
      difficulty,
      question_text: `Two investments pay in the ratio ${ratioA}:${ratioB}, and together pay $${total}. How much more does the larger share pay than the smaller?`,
      options,
      correct_answer,
      explanation: `Unit value = ${total} ÷ ${ratioA + ratioB} = ${scale}. Difference = (${Math.max(ratioA, ratioB)} - ${Math.min(ratioA, ratioB)}) × ${scale} = ${diff}.`,
    };
  }
}

// --- Subdomain: number_sequences ---
function generateSequence(difficulty: number): GeneratedQuestion {
  const d = difficulty;
  const seq: number[] = [];
  let answer: number;
  let desc: string;

  if (d <= 2) {
    const s = randInt(2, 4);
    let cur = randInt(1, 20);
    for (let i = 0; i < 5; i++) {
      seq.push(cur);
      cur += s;
    }
    answer = cur;
    desc = `Each term increases by ${s}.`;
  } else if (d <= 4) {
    if (Math.random() < 0.5) {
      const s = randInt(5, 9);
      let cur = randInt(1, 30);
      for (let i = 0; i < 5; i++) {
        seq.push(cur);
        cur += s;
      }
      answer = cur;
      desc = `Each term increases by ${s}.`;
    } else {
      let cur = randInt(1, 8);
      for (let i = 0; i < 5; i++) {
        seq.push(cur);
        cur *= 2;
      }
      answer = cur;
      desc = "Each term doubles.";
    }
  } else if (d <= 6) {
    if (Math.random() < 0.5) {
      const s1 = randInt(2, 6);
      let s2 = randInt(2, 6);
      while (s2 === s1) s2 = randInt(2, 6);
      let cur = randInt(1, 10);
      seq.push(cur);
      for (let i = 1; i < 5; i++) {
        cur += i % 2 === 1 ? s1 : s2;
        seq.push(cur);
      }
      answer = cur + (5 % 2 === 1 ? s1 : s2);
      desc = `Terms alternate between +${s1} and +${s2}.`;
    } else {
      let cur = randInt(1, 9);
      for (let i = 0; i < 5; i++) {
        seq.push(cur);
        cur *= 3;
      }
      answer = cur;
      desc = "Each term multiplies by 3.";
    }
  } else if (d <= 8) {
    const s1 = randInt(4, 8);
    const s2 = randInt(2, 3);
    const cur0 = randInt(30, 60);
    seq.push(cur0);
    let cur = cur0;
    for (let i = 1; i < 5; i++) {
      cur += i % 2 === 1 ? s1 : -s2;
      seq.push(cur);
    }
    answer = cur + (5 % 2 === 1 ? s1 : -s2);
    desc = `Terms alternate between +${s1} and −${s2}.`;
  } else if (d <= 10) {
    let cur = randInt(2, 10);
    seq.push(cur);
    for (let i = 1; i < 5; i++) {
      cur += 2 * i;
      seq.push(cur);
    }
    answer = cur + 10;
    desc = "The gaps between terms grow by 2 each step (2, 4, 6, 8, …).";
  } else {
    const p = randInt(3, 7);
    const q = randInt(8, 14);
    const a0 = randInt(1, 9);
    const b0 = randInt(60, 90);
    seq.push(a0, b0);
    for (let i = 1; i < 3; i++) {
      seq.push(a0 + p * i);
      seq.push(b0 - q * i);
    }
    answer = a0 + p * 3;
    desc = `Odd terms add ${p}; even terms subtract ${q}.`;
  }

  const spread = Math.max(3, Math.round(Math.abs(answer) * 0.2) + 2);
  const { options, correct_answer } = makeOptions(answer, spread);
  return {
    domain: "quantitative",
    subdomain: "number_sequences",
    difficulty,
    question_text: `What number comes next in the sequence?\n\n${seq.join(", ")}, …`,
    options,
    correct_answer,
    explanation: `${desc} So the next term is ${answer}.`,
  };
}

// --- Subdomain: word_problems ---
function generateWordProblem(difficulty: number): GeneratedQuestion {
  const d = difficulty;

  if (d <= 3) {
    const price = randInt(2, 12);
    const qty = randInt(2, 10);
    const answer = price * qty;
    const { options, correct_answer } = makeOptions(answer, Math.max(3, answer * 0.35));
    return {
      domain: "quantitative",
      subdomain: "word_problems",
      difficulty,
      question_text: `A shop sells notebooks for $${price} each. Someone buys ${qty} notebooks. How much do they pay in total?`,
      options,
      correct_answer,
      explanation: `${price} × ${qty} = ${answer}.`,
    };
  }

  if (d <= 5) {
    const price = randInt(4, 20);
    const qty = randInt(2, 6);
    const fee = randInt(2, 10);
    const answer = price * qty + fee;
    const { options, correct_answer } = makeOptions(answer, Math.max(4, answer * 0.25));
    return {
      domain: "quantitative",
      subdomain: "word_problems",
      difficulty,
      question_text: `A delivery costs a flat fee of $${fee}, plus $${price} per package. A customer ships ${qty} packages. What is the total cost?`,
      options,
      correct_answer,
      explanation: `Packages cost ${price} × ${qty} = ${price * qty}, plus the $${fee} fee = ${answer}.`,
    };
  }

  if (d <= 7) {
    const total = randInt(40, 160);
    const percents = [20, 25, 40, 50, 60];
    const p = percents[randInt(0, percents.length - 1)];
    const denom = 100 / gcd(p, 100);
    const stock = total * denom;
    const red = (p / 100) * stock;
    const { options, correct_answer } = makeOptions(red, Math.max(4, red * 0.3));
    return {
      domain: "quantitative",
      subdomain: "word_problems",
      difficulty,
      question_text: `A clothing store has ${stock} shirts, and ${p}% of them are red. How many red shirts are there?`,
      options,
      correct_answer,
      explanation: `${p}% of ${stock} = (${p}/100) × ${stock} = ${red}.`,
    };
  }

  if (d <= 9) {
    const price = randInt(40, 200);
    const percents = [10, 20, 25, 30, 50];
    const p = percents[randInt(0, percents.length - 1)];
    const denom = 100 / gcd(p, 100);
    const base = price * denom;
    const discount = (p / 100) * base;
    const { options, correct_answer } = makeOptions(discount, Math.max(5, discount * 0.25));
    return {
      domain: "quantitative",
      subdomain: "word_problems",
      difficulty,
      question_text: `A jacket costs $${base}. It is on sale with a ${p}% discount. How much money does the discount save?`,
      options,
      correct_answer,
      explanation: `${p}% of $${base} = ${discount}. That's the discount amount.`,
    };
  }

  // d 10-12: rates
  {
    const hours = randInt(2, 8);
    const speed = randInt(20, 60);
    const distance = speed * hours;
    const { options, correct_answer } = makeOptions(speed, Math.max(4, speed * 0.35));
    return {
      domain: "quantitative",
      subdomain: "word_problems",
      difficulty,
      question_text: `A car covers ${distance} miles in ${hours} hours at a constant speed. What is its average speed in miles per hour?`,
      options,
      correct_answer,
      explanation: `Speed = distance ÷ time = ${distance} ÷ ${hours} = ${speed} mph.`,
    };
  }
}

// --- Main entry point ---
const generators = [
  generateArithmetic,
  generatePercentage,
  generateRatio,
  generateSequence,
  generateWordProblem,
];

export function generateQuantitativeQuestion(difficulty: number = 6): GeneratedQuestion {
  const clamped = Math.min(12, Math.max(1, difficulty));
  const generator = generators[randInt(0, generators.length - 1)];
  return generator(clamped);
}