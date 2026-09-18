// lib/types/catSession.ts
import { Domain, CATQuestion } from "@/lib/types/question";

// One answered question, kept for scoring/history
export interface AnsweredQuestion {
  question: CATQuestion;
  userAnswer: string;
  correct: boolean;
  timeMs: number;
}

// Live state of a test in progress. This will be held in React state
// on the assessment page (Session 7) and updated after every answer.
export interface CATSession {
  // Current difficulty per domain, 1-5. Starts at 3 (medium) for each.
  difficultyByDomain: Record<Domain, number>;

  // How many questions have been asked per domain so far.
  countByDomain: Record<Domain, number>;

  // Full answer history, in order asked.
  history: AnsweredQuestion[];

  // Running total answered across all domains.
  totalAnswered: number;

  // Set to true once the stopping rule (Step to come) says we're done.
  isComplete: boolean;
}

// Starting state for a brand new test session.
export function createInitialSession(): CATSession {
  const domains: Domain[] = [
    "verbal",
    "quantitative",
    "working_memory",
    "processing_speed",
    "fluid_reasoning",
    "visual_spatial",
  ];

  const difficultyByDomain = {} as Record<Domain, number>;
  const countByDomain = {} as Record<Domain, number>;
  for (const d of domains) {
    difficultyByDomain[d] = 3;
    countByDomain[d] = 0;
  }

  return {
    difficultyByDomain,
    countByDomain,
    history: [],
    totalAnswered: 0,
    isComplete: false,
  };
}