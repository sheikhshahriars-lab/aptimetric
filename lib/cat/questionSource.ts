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

// Fetches one random verbal question at the given difficulty from Supabase,
// excluding questions already seen in the current session.
async function fetchVerbalQuestion(
  difficulty: number,
  askedSourceIds: Set<string>
): Promise<CATQuestion> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("difficulty", difficulty)
    .limit(200);

  if (error || !data || data.length === 0) {
    throw new Error(
      `Failed to fetch verbal question at difficulty ${difficulty}: ${error?.message ?? "no rows"}`
    );
  }

  const fresh = data.filter((row) => !askedSourceIds.has(row.id));
  const pool = fresh.length > 0 ? fresh : data;

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