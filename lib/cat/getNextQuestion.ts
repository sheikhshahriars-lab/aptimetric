// lib/cat/getNextQuestion.ts
import { CATSession } from "@/lib/types/catSession";
import { Domain } from "@/lib/types/question";
import { CATQuestion } from "@/lib/types/question";
import { selectNextDomain } from "@/lib/cat/engine";
import { getQuestionForDomain } from "@/lib/cat/questionSource";

export interface NextQuestionResult {
  question: CATQuestion;
  domain: Domain;
}

// The one function the assessment page (Session 7) calls after every
// answer. Returns null when the test is complete (no domains left).
export async function getNextQuestion(
  session: CATSession
): Promise<NextQuestionResult | null> {
  const domain = selectNextDomain(session);

  if (domain === null) {
    return null; // test is finished
  }

  const difficulty = session.difficultyByDomain[domain];

  const askedSourceIds = new Set(
    session.history
      .map((h) => h.question.sourceId)
      .filter((id): id is string => Boolean(id))
  );

  const question = await getQuestionForDomain(domain, difficulty, askedSourceIds);

  return { question, domain };
}