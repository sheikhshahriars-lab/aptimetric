"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Question = {
  id: string;
  domain: string;
  subdomain: string;
  difficulty: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
};

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState("all");

  useEffect(() => {
    async function fetchQuestions() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("difficulty", { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setQuestions(data as Question[]);
      }
      setLoading(false);
    }

    fetchQuestions();
  }, []);

  const filteredQuestions =
    domainFilter === "all"
      ? questions
      : questions.filter((q) => q.domain === domainFilter);

  const uniqueDomains = Array.from(new Set(questions.map((q) => q.domain)));

  if (loading) {
    return <div className="p-8 text-white">Loading questions...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-400">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white p-8">
      <h1 className="font-display text-3xl mb-2">Question Bank Admin</h1>
      <p className="text-white/60 mb-6">
        Total questions: {questions.length}
      </p>

      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setDomainFilter("all")}
          className={`px-4 py-2 rounded-lg border ${
            domainFilter === "all"
              ? "bg-indigo-500 border-indigo-400"
              : "border-white/20"
          }`}
        >
          All
        </button>
        {uniqueDomains.map((domain) => (
          <button
            key={domain}
            onClick={() => setDomainFilter(domain)}
            className={`px-4 py-2 rounded-lg border capitalize ${
              domainFilter === domain
                ? "bg-indigo-500 border-indigo-400"
                : "border-white/20"
            }`}
          >
            {domain}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredQuestions.map((q) => (
          <div
            key={q.id}
            className="glass rounded-xl p-4 border border-white/10"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs uppercase tracking-wide text-cyan-400">
                {q.domain} / {q.subdomain}
              </span>
              <span className="text-xs bg-white/10 px-2 py-1 rounded">
                Difficulty: {q.difficulty}
              </span>
            </div>
            <p className="font-medium mb-2">{q.question_text}</p>
            <ul className="text-sm text-white/70 space-y-1">
              {q.options.map((opt, i) => (
                <li
                  key={i}
                  className={
                    opt === q.correct_answer ? "text-green-400" : ""
                  }
                >
                  {opt === q.correct_answer ? "✓ " : "• "}
                  {opt}
                </li>
              ))}
            </ul>
            {q.explanation && (
              <p className="text-xs text-white/40 mt-2 italic">
                {q.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}