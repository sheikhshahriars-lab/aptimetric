// lib/cat/generatorAdapter.ts
import { TextQuestion, Domain } from "@/lib/types/question";

// Matches the GeneratedQuestion shape used by quantitative, working_memory,
// processing_speed, and fluid_reasoning generators
interface GeneratedQuestion {
  domain: string;
  subdomain: string;
  difficulty: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export function adaptGeneratedQuestion(raw: GeneratedQuestion): TextQuestion {
  return {
    format: "text",
    domain: raw.domain as Domain,
    subdomain: raw.subdomain,
    difficulty: raw.difficulty,
    question_text: raw.question_text,
    options: raw.options,
    correct_answer: raw.correct_answer,
    explanation: raw.explanation,
  };
}