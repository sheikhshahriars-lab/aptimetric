// app/test/page.tsx
"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createInitialSession, CATSession, AnsweredQuestion } from "@/lib/types/catSession";
import { getNextQuestion, NextQuestionResult } from "@/lib/cat/getNextQuestion";
import { updateSessionAfterAnswer, QUESTIONS_PER_DOMAIN } from "@/lib/cat/engine";
import { DOMAIN_LABELS } from "@/lib/irt/scoring";
import type { AnswerSummary } from "@/lib/irt/scoring";
import { createClient } from "@/lib/supabase";
import { useProctor } from "@/lib/hooks/useProctor";
import ShapeSVG from "@/lib/components/ShapeSVG";
import Logo from "@/lib/components/Logo";

const TOTAL_QUESTIONS = QUESTIONS_PER_DOMAIN * 6;
const STORAGE_KEY = "aptimetric:test";

type Phase = "intro" | "running" | "saving" | "cooldown" | "error";

interface StoredState {
  session: CATSession;
  answers: AnswerSummary[];
  startedAt: number;
}

async function fetchFirstQuestion(session: CATSession): Promise<NextQuestionResult | null> {
  return getNextQuestion(session);
}

export default function TestPage() {
  return (
    <Suspense fallback={<div className="aurora" />}>
      <TestRunner />
    </Suspense>
  );
}

function TestRunner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token");

  const [phase, setPhase] = useState<Phase>("intro");
  const [session, setSession] = useState<CATSession | null>(null);
  const [current, setCurrent] = useState<NextQuestionResult | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [hasSaved] = useState(() => {
    // A test interrupted by a refresh can be resumed from localStorage.
    if (typeof window === "undefined") return false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const stored = JSON.parse(raw) as StoredState;
      return Boolean(stored.session?.history?.length);
    } catch {
      return false;
    }
  });

  const answersRef = useRef<AnswerSummary[]>([]);
  const startedAtRef = useRef<number>(0);
  const questionStartRef = useRef<number>(0);
  const proctor = useProctor();

  useEffect(() => {
    if (!inviteToken) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("get_invitation", { p_token: inviteToken });
      if (data?.length > 0) setOrgName(data[0].org_name);
    })();
  }, [inviteToken]);

  const persist = useCallback((s: CATSession, answers: AnswerSummary[]) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ session: s, answers, startedAt: startedAtRef.current })
      );
    } catch {
      /* storage may be full or blocked */
    }
  }, []);

  const clearStored = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const beginFresh = useCallback(async () => {
    clearStored();
    const s = createInitialSession();
    answersRef.current = [];
    startedAtRef.current = Date.now();
    setSession(s);
    setCurrent(null);
    setSelected(null);
    setPhase("running");
    setFetching(true);
    const next = await fetchFirstQuestion(s);
    setFetching(false);
    if (next) {
      setCurrent(next);
      questionStartRef.current = Date.now();
    }
  }, [clearStored]);

  const submit = useCallback(
    async () => {
      setPhase("saving");
      const payload = {
        answers: answersRef.current,
        tabSwitches: proctor.tabSwitches,
        suspicious: proctor.suspicious,
        durationMs: Date.now() - startedAtRef.current,
        invitationToken: inviteToken ?? null,
      };

      try {
        const res = await fetch("/api/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.status === 423) {
          const body = await res.json();
          setMessage(body.message ?? "You have already taken the assessment recently.");
          setPhase("cooldown");
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setMessage(body.error ?? "We could not save your results. Please try again.");
          setPhase("error");
          return;
        }

        const body = await res.json();
        localStorage.removeItem(STORAGE_KEY);

        if (inviteToken) {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          const { data: ok } = await supabase.rpc("complete_invitation", {
            p_token: inviteToken,
            p_user_email: user?.email ?? "",
            p_result_id: body.result.id,
            p_iq: body.result.iq_score,
          });
          router.replace(`/results?id=${body.result.id}&invited=${ok ? "1" : "0"}`);
        } else {
          router.replace(`/results?id=${body.result.id}`);
        }
      } catch {
        setMessage("Network error — please check your connection and try again.");
        setPhase("error");
      }
    },
    [inviteToken, proctor.tabSwitches, proctor.suspicious, router]
  );

  const resume = useCallback(async () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as StoredState;
      const s = stored.session as CATSession;
      answersRef.current = stored.answers;
      startedAtRef.current = stored.startedAt;
      setSession(s);
      setSelected(null);
      setPhase("running");
      setFetching(true);
      const next = await getNextQuestion(s);
      setFetching(false);
      if (next) {
        setCurrent(next);
        questionStartRef.current = Date.now();
      } else {
        submit();
      }
    } catch {
      beginFresh();
    }
  }, [beginFresh, submit]);

  const onSelect = useCallback(
    (optId: string) => {
      if (!session || !current || selected) return;
      const timeMs = Date.now() - questionStartRef.current;
      proctor.reportAnswer(timeMs);

      const correct = optId === current.question.correct_answer;
      const answered: AnsweredQuestion = {
        question: current.question,
        userAnswer: optId,
        correct,
        timeMs,
      };

      const updated = updateSessionAfterAnswer(session, current.domain, answered);
      const summary: AnswerSummary = {
        domain: current.domain,
        subdomain: current.question.subdomain,
        difficulty: current.question.difficulty,
        correct,
        timeMs,
      };
      answersRef.current = [...answersRef.current, summary];

      setSession(updated);
      setSelected(optId);
      persist(updated, answersRef.current);
    },
    [session, current, selected, persist, proctor]
  );

  const onContinue = useCallback(async () => {
    if (!session) return;
    if (session.isComplete) {
      submit();
      return;
    }
    setSelected(null);
    setFetching(true);
    const next = await getNextQuestion(session);
    setFetching(false);
    if (next) {
      setCurrent(next);
      questionStartRef.current = Date.now();
    } else {
      submit();
    }
  }, [session, submit]);

  const answeredCount = session?.history.length ?? 0;
  const progressPct = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);

  const question = current?.question;

  return (
    <>
      <div className="aurora" />
      <div className="noise" />

      {proctor.tabSwitches > 0 && (
        <div className="fixed top-0 inset-x-0 z-[60] bg-amber-500/15 backdrop-blur border-b border-amber-500/30 text-amber-200 text-sm text-center px-4 py-2">
          Focus warning: leaving the test window may mark your result as suspicious.
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        <header className="flex items-center justify-between mb-8">
          <Link href="/" aria-label="Aptimetric home">
            <Logo size={32} subtitle={false} />
          </Link>
          {phase === "running" && (
            <div className="text-xs text-slate-400 tabular-nums">
              {answeredCount} / {TOTAL_QUESTIONS}
            </div>
          )}
        </header>

        {phase === "intro" && (
          <div className="glass rounded-[2rem] p-6 sm:p-10 fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-slate-200 mb-6">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              Official Aptimetric Assessment
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight">
              The <span className="gradient-text">Adaptive Cognitive Assessment</span>
            </h1>
            <p className="mt-4 text-slate-300 max-w-xl">
              About 48 questions across 6 cognitive domains. The test adapts to you —
              harder when you&apos;re doing well, easier when you&apos;re not. Takes around 18 minutes.
            </p>

            {orgName && (
              <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                You&apos;re taking this assessment on behalf of <strong>{orgName}</strong>. Your score will be shared with the organization.
              </div>
            )}

            <div className="mt-8 grid sm:grid-cols-3 gap-3 text-sm">
              {[
                { icon: "◐", title: "Adaptive difficulty", text: "Questions tune to your ability in real time." },
                { icon: "⏱", title: "Answer honestly", text: "No time limit per question — accuracy matters." },
                { icon: "🔒", title: "One sitting", text: "Don't close or switch tabs. Results are final." },
              ].map((f) => (
                <div key={f.title} className="glass rounded-2xl p-4">
                  <div className="text-lg">{f.icon}</div>
                  <div className="font-semibold mt-2">{f.title}</div>
                  <div className="text-slate-400 mt-1 text-xs leading-relaxed">{f.text}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => beginFresh()}
                className="shimmer inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold shadow-xl shadow-indigo-500/25 hover:opacity-95 transition"
              >
                Start the test
              </button>
              {hasSaved && (
                <button
                  onClick={resume}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl glass glass-hover text-white font-semibold transition"
                >
                  Resume your previous test
                </button>
              )}
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Signing in is required so we can save and return your score.
            </p>
          </div>
        )}

        {phase === "running" && (
          <>
            {/* progress */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Progress</span>
                <span className="tabular-nums">{progressPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 bar-fill"
                  style={{ width: `${Math.max(progressPct, 2)}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {session &&
                  Object.entries(DOMAIN_LABELS).map(([key, label]) => (
                    <span
                      key={key}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                        session.countByDomain[key as keyof typeof session.countByDomain] >= QUESTIONS_PER_DOMAIN
                          ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/20"
                          : "glass text-slate-300"
                      }`}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {label}
                    </span>
                  ))}
              </div>
            </div>

            {fetching && (
              <div className="glass rounded-[2rem] p-10 flex items-center justify-center text-slate-300">
                Loading next question…
              </div>
            )}

            {!fetching && current && question && (
              <div key={answeredCount} className="glass rounded-[2rem] p-5 sm:p-8 fade-up">
                <div className="flex items-center justify-between mb-6">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-slate-300">
                    {DOMAIN_LABELS[question.domain]}
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-slate-400 capitalize">
                    <span className="size-1.5 rounded-full bg-indigo-400" />
                    {question.subdomain.replace(/_/g, " ")}
                    <span className="text-slate-500">· level {question.difficulty}</span>
                  </span>
                </div>

                <p className="font-display font-semibold text-lg sm:text-2xl text-white leading-snug">
                  {question.question_text}
                </p>

                {question.format === "visual" && question.question_grid && (
                  <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
                    {question.question_grid.map((shape, i) => (
                      <ShapeSVG key={i} shape={shape} size={84} />
                    ))}
                  </div>
                )}
                {question.format === "visual" && question.question_shape && (
                  <div className="mt-6 flex justify-center">
                    <ShapeSVG shape={question.question_shape} size={96} />
                  </div>
                )}

                <div
                  className={`mt-8 grid ${
                    question.format === "visual" ? "grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4" : "gap-3"
                  }`}
                >
                  {question.options.map((optId) => {
                    const isVisual = question.format === "visual";
                    const isCorrect = optId === question.correct_answer;
                    const isPicked = optId === selected;
                    const reveal = selected !== null;

                    return (
                      <button
                        key={optId}
                        onClick={() => onSelect(optId)}
                        disabled={reveal}
                        aria-label={`Option ${optId}`}
                        className={`group rounded-2xl transition-all duration-200 ${
                          isVisual ? "p-3 sm:p-4" : "px-5 py-4 text-left"
                        } border ${
                          reveal && isCorrect
                            ? "border-emerald-400/70 bg-emerald-400/10"
                            : reveal && isPicked
                            ? "border-rose-400/70 bg-rose-400/10"
                            : !reveal
                            ? "glass glass-hover border-white/10 hover:-translate-y-0.5"
                            : "border-white/5 opacity-60"
                        }`}
                      >
                        {isVisual ? (
                          <ShapeSVG shape={question.optionShapes[optId]} size={72} />
                        ) : (
                          <span className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300 group-hover:bg-slate-700">
                              {String.fromCharCode(65 + question.options.indexOf(optId))}
                            </span>
                            <span
                              className={`font-medium ${
                                reveal && isCorrect ? "text-emerald-200" : reveal && isPicked ? "text-rose-200" : "text-slate-100"
                              }`}
                            >
                              {optId}
                            </span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selected && (
                  <div className="mt-6 pop-in">
                    <div
                      className={`rounded-2xl border px-4 py-3 text-sm ${
                        selected === question.correct_answer
                          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                          : "border-rose-400/30 bg-rose-400/10 text-rose-100"
                      }`}
                    >
                      {selected === question.correct_answer ? "Correct — well done." : `Not quite — the correct answer was: ${question.correct_answer}`}
                    </div>
                    {question.explanation && (
                      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300 leading-relaxed">
                        {question.explanation}
                      </div>
                    )}
                    <div className="mt-5 flex justify-end">
                      <button
                        onClick={onContinue}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:opacity-95 transition"
                      >
                        {session?.isComplete ? "Score my results" : "Continue"}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {phase === "saving" && (
          <div className="glass rounded-[2rem] p-12 text-center fade-up">
            <div className="mx-auto mb-6 size-12 rounded-full border-2 border-indigo-500/30 border-t-cyan-400 animate-spin" />
            <h2 className="font-display font-bold text-2xl">Scoring your results</h2>
            <p className="mt-2 text-slate-400 text-sm">Running the psychometric engine — one moment…</p>
          </div>
        )}

        {(phase === "cooldown" || phase === "error") && (
          <div className="glass rounded-[2rem] p-10 text-center fade-up max-w-lg mx-auto">
            <div className="text-4xl mb-4">{phase === "cooldown" ? "⏳" : "⚠️"}</div>
            <h2 className="font-display font-bold text-2xl">
              {phase === "cooldown" ? "Already tested" : "Something went wrong"}
            </h2>
            <p className="mt-3 text-slate-300 text-sm">{message}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-3 rounded-2xl glass glass-hover text-white font-semibold transition"
              >
                Back to dashboard
              </button>
              {phase === "error" && session && (
                <button
                  onClick={() => submit()}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold transition"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}