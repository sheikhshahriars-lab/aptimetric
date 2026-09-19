// lib/cat/engine.ts
import { Domain } from "@/lib/types/question";
import { CATSession, AnsweredQuestion } from "@/lib/types/catSession";
import { scoreTest, AnswerSummary } from "@/lib/irt/scoring";
import { clampDifficulty, thetaToDifficulty } from "@/lib/irt/itemParams";

// How many questions each domain gets before it's considered "done".
// 6 domains × 10 = 60 total questions per test.
export const QUESTIONS_PER_DOMAIN = 10;

export const ALL_DOMAINS: Domain[] = [
  "verbal",
  "quantitative",
  "working_memory",
  "processing_speed",
  "fluid_reasoning",
  "visual_spatial",
];

// Domains administered under a strict time limit (assessed as speed of recall).
export const TIMED_DOMAINS: Domain[] = ["processing_speed", "working_memory"];

// Per-item time budget (ms) for timed subtests.
const TIME_LIMITS_MS: Record<Domain, number | null> = {
  verbal: null,
  quantitative: null,
  working_memory: 30_000,
  processing_speed: 20_000,
  fluid_reasoning: null,
  visual_spatial: null,
};

export function isTimedDomain(domain: Domain): boolean {
  return TIME_LIMITS_MS[domain] !== null;
}

export function timeLimitForDomain(domain: Domain): number | null {
  return TIME_LIMITS_MS[domain];
}

// Picks the next domain to test: the domain with the fewest questions
// asked so far that hasn't hit its quota yet. Ties broken by list order,
// which keeps things round-robin in practice.
export function selectNextDomain(session: CATSession): Domain | null {
  const eligible = ALL_DOMAINS.filter(
    (d) => session.countByDomain[d] < QUESTIONS_PER_DOMAIN
  );

  if (eligible.length === 0) return null; // all domains done

  return eligible.reduce((lowest, d) =>
    session.countByDomain[d] < session.countByDomain[lowest] ? d : lowest
  );
}

function summarizeAnswered(a: AnsweredQuestion): AnswerSummary {
  return {
    domain: a.question.domain,
    subdomain: a.question.subdomain,
    difficulty: a.question.difficulty,
    correct: a.correct,
    timeMs: a.timeMs,
    timedOut: a.timedOut,
  };
}

// Ability-targeted next difficulty for a domain.
//
// First few items act as a warm-up (step ±1 from the current level). Once
// there's enough evidence, we estimate ability from the whole test and aim the
// next item at the level closest to that estimate, but never move more than 2
// levels per step so the session doesn't lurch across the whole scale.
export function nextTargetDifficulty(
  session: CATSession,
  domain: Domain,
  answered: AnsweredQuestion
): number {
  const current = session.difficultyByDomain[domain];
  const combined = [...session.history, answered];

  if (combined.length < 4) {
    return clampDifficulty(current + (answered.correct ? 1 : -1));
  }

  const score = scoreTest(combined.map(summarizeAnswered));
  const desired = thetaToDifficulty(score.overall.theta);
  const step = Math.max(current - 2, Math.min(desired, current + 2));
  return clampDifficulty(step);
}

// Call this after the user answers a question. Returns a brand-new
// session object (never mutates the one passed in) with counts,
// difficulty, and history updated.
export function updateSessionAfterAnswer(
  session: CATSession,
  domain: Domain,
  answered: AnsweredQuestion
): CATSession {
  const newDifficulty = nextTargetDifficulty(session, domain, answered);

  const updated: CATSession = {
    ...session,
    difficultyByDomain: {
      ...session.difficultyByDomain,
      [domain]: newDifficulty,
    },
    countByDomain: {
      ...session.countByDomain,
      [domain]: session.countByDomain[domain] + 1,
    },
    history: [...session.history, answered],
    totalAnswered: session.totalAnswered + 1,
  };

  updated.isComplete = selectNextDomain(updated) === null;

  return updated;
}