// lib/cat/engine.ts
import { Domain } from "@/lib/types/question";
import { CATSession, AnsweredQuestion } from "@/lib/types/catSession";

// How many questions each domain gets before it's considered "done".
// 6 domains × 8 = 48 total questions per test. Adjustable later.
export const QUESTIONS_PER_DOMAIN = 8;

export const ALL_DOMAINS: Domain[] = [
  "verbal",
  "quantitative",
  "working_memory",
  "processing_speed",
  "fluid_reasoning",
  "visual_spatial",
];

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

// Moves difficulty up after a correct answer, down after a wrong one.
// Clamped to the 1-5 range used throughout the generators/question bank.
export function adjustDifficulty(currentDifficulty: number, wasCorrect: boolean): number {
  const next = wasCorrect ? currentDifficulty + 1 : currentDifficulty - 1;
  return Math.min(5, Math.max(1, next));
}

// Call this after the user answers a question. Returns a brand-new
// session object (never mutates the one passed in) with counts,
// difficulty, and history updated.
export function updateSessionAfterAnswer(
  session: CATSession,
  domain: Domain,
  answered: AnsweredQuestion
): CATSession {
  const newDifficulty = adjustDifficulty(
    session.difficultyByDomain[domain],
    answered.correct
  );

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