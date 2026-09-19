// lib/types/question.ts

export type Domain =
  | "verbal"
  | "quantitative"
  | "working_memory"
  | "processing_speed"
  | "fluid_reasoning"
  | "visual_spatial";

// A plain text-based question (verbal + 4 of the 5 generators)
export interface TextQuestion {
  format: "text";
  domain: Domain;
  subdomain: string;
  difficulty: number; // 1-12
  question_text: string;
  options: string[]; // always 4
  correct_answer: string;
  explanation?: string;
  // Stable identifier for dedup within a session (verbal bank items only).
  sourceId?: string;
}

// A shape-based question (visual_spatial only)
export type ShapeType = "arrow" | "flag" | "bolt" | "hook";
export type ShapeSpec = {
  type: ShapeType;
  rotation: 0 | 90 | 180 | 270;
  filled: boolean;
  mirrored?: boolean;
};

export interface VisualQuestion {
  format: "visual";
  domain: "visual_spatial";
  subdomain: string;
  difficulty: number; // 1-12
  question_text: string;
  question_grid?: (ShapeSpec | null)[];
  question_shape?: ShapeSpec;
  options: string[];
  optionShapes: Record<string, ShapeSpec>;
  correct_answer: string;
  explanation?: string;
  sourceId?: string;
}

// The CAT engine will only ever deal with this combined type
export type CATQuestion = TextQuestion | VisualQuestion;