// lib/cat/verbalAdapter.ts
import { TextQuestion } from "@/lib/types/question";

// Shape of a raw row coming back from Supabase's `questions` table
interface SupabaseQuestionRow {
  id: string;
  domain: string;
  subdomain: string;
  difficulty: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export function adaptVerbalQuestion(row: SupabaseQuestionRow): TextQuestion {
  return {
    format: "text",
    domain: "verbal",
    subdomain: row.subdomain,
    difficulty: row.difficulty,
    question_text: row.question_text,
    options: row.options,
    correct_answer: row.correct_answer,
    explanation: row.explanation,
    sourceId: row.id,
  };
}