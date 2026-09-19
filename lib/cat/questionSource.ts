// lib/cat/questionSource.ts
import { createClient } from "@/lib/supabase";
import { Domain, CATQuestion } from "@/lib/types/question";
import { adaptVerbalQuestion } from "@/lib/cat/verbalAdapter";
import { adaptGeneratedQuestion } from "@/lib/cat/generatorAdapter";
import { adaptVisualQuestion } from "@/lib/cat/visualAdapter";

import { generateQuantitativeQuestion } from "@/lib/generators/quantitative";
import { generateWorkingMemoryQuestion } from "@/lib/generators/workingMemory";
import { generateProcessingSpeedQuestion } from "@/lib/generators/processingSpeed";
import { generateFluidReasoningQuestion } from "@/lib/generators/fluidReasoning";
import { generateVisualSpatialQuestion } from "@/lib/generators/visualSpatial";

// Fetches one random verbal question near the target difficulty from Supabase,
// excluding questions already seen in the current session. If no question
// exists at the exact level (sparse bank after a rescale), it widens to ±1.
async function fetchVerbalQuestion(
  difficulty: number,
  askedSourceIds: Set<string>
): Promise<CATQuestion> {
  const supabase = createClient();

  const selectAll = supabase.from("questions").select("*");

  const exact = await selectAll.eq("difficulty", difficulty).order("id").limit(100);
  if (exact.error) {
    throw new Error(
      `Failed to fetch verbal question: ${exact.error.message}`
    );
  }

  let poolRows = exact.data ?? [];
  if (poolRows.length === 0) {
    const near = await selectAll
      .gte("difficulty", Math.max(1, difficulty - 1))
      .lte("difficulty", Math.min(12, difficulty + 1))
      .order("id")
      .limit(200);
    if (near.error) {
      throw new Error(
        `Failed to fetch verbal question (near ${difficulty}): ${near.error.message}`
      );
    }
    poolRows = near.data ?? [];
  }

  if (poolRows.length === 0) {
    throw new Error(`Failed to fetch verbal question at difficulty ${difficulty}: no rows`);
  }

  const fresh = poolRows.filter((row) => !askedSourceIds.has(row.id));
  const pool = fresh.length > 0 ? fresh : poolRows;

  const randomRow = pool[Math.floor(Math.random() * pool.length)];
  return adaptVerbalQuestion(randomRow);
}

// Returns one ready-to-display question for the given domain and difficulty.
export async function getQuestionForDomain(
  domain: Domain,
  difficulty: number,
  askedSourceIds: Set<string> = new Set()
): Promise<CATQuestion> {
  switch (domain) {
    case "verbal":
      return fetchVerbalQuestion(difficulty, askedSourceIds);
    case "quantitative":
      return adaptGeneratedQuestion(generateQuantitativeQuestion(difficulty));
    case "working_memory":
      return adaptGeneratedQuestion(generateWorkingMemoryQuestion(difficulty));
    case "processing_speed":
      return adaptGeneratedQuestion(generateProcessingSpeedQuestion(difficulty));
    case "fluid_reasoning":
      return adaptGeneratedQuestion(generateFluidReasoningQuestion(difficulty));
    case "visual_spatial":
      return adaptVisualQuestion(generateVisualSpatialQuestion(difficulty));
  }
}