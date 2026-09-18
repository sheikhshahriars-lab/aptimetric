// lib/cat/visualAdapter.ts
import { VisualQuestion, ShapeSpec } from "@/lib/types/question";

// Matches the GeneratedVisualQuestion shape from lib/generators/visualSpatial.ts
interface GeneratedVisualQuestion {
  domain: string;
  subdomain: string;
  difficulty: number;
  question_text: string;
  question_grid?: (ShapeSpec | null)[];
  question_shape?: ShapeSpec;
  options: string[];
  optionShapes: Record<string, ShapeSpec>;
  correct_answer: string;
  explanation: string;
}

export function adaptVisualQuestion(raw: GeneratedVisualQuestion): VisualQuestion {
  return {
    format: "visual",
    domain: "visual_spatial",
    subdomain: raw.subdomain,
    difficulty: raw.difficulty,
    question_text: raw.question_text,
    question_grid: raw.question_grid,
    question_shape: raw.question_shape,
    options: raw.options,
    optionShapes: raw.optionShapes,
    correct_answer: raw.correct_answer,
    explanation: raw.explanation,
  };
}