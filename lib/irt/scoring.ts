// lib/irt/scoring.ts
// Statistically grounded IRT (Item Response Theory) scoring engine.
//
// Model: 3-parameter logistic (3PL). For every answered item:
//   P(correct | theta) = c + (1 - c) * 1 / (1 + exp(-1.702 * a * (theta - b)))
//
// Item parameters are derived from the platform's difficulty scale (1-5):
//   b (difficulty location)  = (difficulty - 3) * 0.9   -> centered-ish on -1.8..1.8
//   a (discrimination)       = 1.0
//   c (guessing floor)       = 0.25  (four options, one right)
//
// Ability theta is estimated with EAP (expected a posteriori): a unit-normal
// prior over a theta grid, so scores are stable for short tests and shrink
// toward the population mean when evidence is weak.
//
// IQ = 100 + 15*theta (Wechsler convention). Percentile = P(Z < theta).

export interface AnswerSummary {
  domain: string;
  subdomain: string;
  difficulty: number; // 1-5
  correct: boolean;
  timeMs: number;
}

interface Item {
  b: number;
  a: number;
  c: number;
  correct: boolean;
}

export interface ThetaEstimate {
  theta: number; // ability on the standard-normal scale
  sem: number; // standard error of measurement in theta units
  iq: number;
  ciLow: number; // 95% CI in IQ points
  ciHigh: number;
  percentile: number; // 0-100
  standardErrorIq: number;
}

export interface ScoreResult {
  overall: ThetaEstimate;
  domains: Record<string, ThetaEstimate>;
  domainCounts: Record<string, number>;
  classification: string;
  answers: AnswerSummary[];
}

const THETA_MIN = -3.6;
const THETA_MAX = 3.6;
const THETA_STEP = 0.05;
const GRID = buildGrid();
const GRID_PRIOR = GRID.map((t) => unitNormalPdf(t));

function buildGrid(): number[] {
  const out: number[] = [];
  for (let t = THETA_MIN; t <= THETA_MAX; t += THETA_STEP) out.push(Math.round(t * 1000) / 1000);
  return out;
}

function unitNormalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// Abramowitz & Stegun 7.1.26 approximation of the error function.
export function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

export function iqToPercentile(iq: number): number {
  return Math.round(normalCdf((iq - 100) / 15) * 1000) / 10;
}

function itemFromSummary(summary: AnswerSummary): Item {
  return {
    b: (Math.max(1, Math.min(5, summary.difficulty)) - 3) * 0.9,
    a: 1.0,
    c: 0.25,
    correct: summary.correct,
  };
}

// EAP estimate: posterior = prior * likelihood, over the theta grid.
export function eapEstimate(items: Item[]): ThetaEstimate {
  if (items.length === 0) {
    return blankEstimate();
  }

  // Posterior = prior * likelihood over the theta grid.
  const post = GRID.map((theta, i) => GRID_PRIOR[i] * likelihoodAtTheta(items, theta));

  let total = 0;
  for (const p of post) total += p;
  if (total <= 0 || !isFinite(total)) return blankEstimate();

  let mean = 0;
  let meanSq = 0;
  for (let i = 0; i < GRID.length; i++) {
    const w = post[i] / total;
    mean += GRID[i] * w;
    meanSq += GRID[i] * GRID[i] * w;
  }

  const variance = Math.max(0, meanSq - mean * mean);
  const sem = Math.sqrt(variance);
  const iq = 100 + 15 * mean;
  const ciMargin = 1.96 * 15 * sem;
  const percentile = Math.round(normalCdf(mean) * 1000) / 10;

  return {
    theta: Math.round(mean * 1000) / 1000,
    sem: Math.round(sem * 1000) / 1000,
    iq: Math.round(iq * 10) / 10,
    ciLow: Math.round((iq - ciMargin) * 10) / 10,
    ciHigh: Math.round((iq + ciMargin) * 10) / 10,
    percentile,
    standardErrorIq: Math.round(15 * sem * 10) / 10,
  };
}

function likelihoodAtTheta(items: Item[], theta: number): number {
  let logLik = 0;
  for (const it of items) {
    const z = 1.702 * it.a * (theta - it.b);
    const logistic = 1 / (1 + Math.exp(-z));
    const p = it.c + (1 - it.c) * logistic;
    const prob = it.correct ? p : 1 - p;
    logLik += Math.log(Math.max(prob, 1e-9));
  }
  return Math.exp(logLik);
}

function blankEstimate(): ThetaEstimate {
  return {
    theta: 0,
    sem: 1,
    iq: 100,
    ciLow: 70.6,
    ciHigh: 129.4,
    percentile: 50,
    standardErrorIq: 15,
  };
}

export function iqClassification(iq: number): string {
  if (iq >= 145) return "Genius or near genius";
  if (iq >= 130) return "Very Superior";
  if (iq >= 120) return "Superior";
  if (iq >= 110) return "High Average";
  if (iq >= 90) return "Average";
  if (iq >= 80) return "Low Average";
  if (iq >= 70) return "Borderline";
  return "Extremely Low";
}

export const IQ_BANDS: { label: string; min: number; max: number }[] = [
  { label: "Extremely Low", min: 0, max: 69 },
  { label: "Borderline", min: 70, max: 79 },
  { label: "Low Average", min: 80, max: 89 },
  { label: "Average", min: 90, max: 109 },
  { label: "High Average", min: 110, max: 119 },
  { label: "Superior", min: 120, max: 129 },
  { label: "Very Superior", min: 130, max: 144 },
  { label: "Genius or near genius", min: 145, max: 999 },
];

// Score a full test from its answer summary. Pure function — same input from
// client or server produces identical results (score is computed server-side
// in /api/results, this module is shared).
export function scoreTest(answerSummaries: AnswerSummary[]): ScoreResult {
  const items = answerSummaries.map(itemFromSummary);

  const domains: Record<string, ThetaEstimate> = {};
  const domainCounts: Record<string, number> = {};
  const byDomain = new Map<string, AnswerSummary[]>();

  for (const s of answerSummaries) {
    const list = byDomain.get(s.domain) ?? [];
    list.push(s);
    byDomain.set(s.domain, list);
    domainCounts[s.domain] = (domainCounts[s.domain] ?? 0) + 1;
  }

  for (const [domain, list] of byDomain.entries()) {
    domains[domain] = eapEstimate(list.map(itemFromSummary));
  }

  const overall = eapEstimate(items);

  return {
    overall,
    domains,
    domainCounts,
    classification: iqClassification(overall.iq),
    answers: answerSummaries,
  };
}

export const DOMAIN_LABELS: Record<string, string> = {
  verbal: "Verbal Reasoning",
  quantitative: "Quantitative Reasoning",
  working_memory: "Working Memory",
  processing_speed: "Processing Speed",
  fluid_reasoning: "Fluid Reasoning",
  visual_spatial: "Visual-Spatial Ability",
};