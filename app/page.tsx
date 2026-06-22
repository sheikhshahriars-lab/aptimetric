"use client";

import { useEffect, useState } from "react";

type QuizType = "matrix" | "verbal" | "numeric";

const ANSWERS: Record<QuizType, string> = { matrix: "a", verbal: "b", numeric: "c" };
const EXPLANATIONS: Record<QuizType, string> = {
  matrix:
    "Correct! The pattern adds one nested shape each row/column. Triangle + inner triangle + dot = complete series.",
  verbal: "Correct! A chapter is a part of a book, just as a branch is a part of a tree.",
  numeric:
    "Correct! Pattern is ×2+1: 3×2+1=7, 7×2+1=15, 15×2+1=31, 31×2+1=63, 63×2+1=127.",
};

const CHECK = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2">
    <path d="M5 12l5 5 10-10" />
  </svg>
);
const CROSS = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function LandingPage() {
  const [scrollPct, setScrollPct] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<QuizType>("matrix");
  const [selected, setSelected] = useState<Record<QuizType, string | null>>({
    matrix: null,
    verbal: null,
    numeric: null,
  });
  const [scored, setScored] = useState<Record<QuizType, boolean>>({
    matrix: false,
    verbal: false,
    numeric: false,
  });
  const [demoScore, setDemoScore] = useState(0);
  const [heroSelected, setHeroSelected] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      setScrollPct(scrolled);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const pickAnswer = (type: QuizType, answer: string) => {
    setSelected((s) => ({ ...s, [type]: answer }));
    if (answer === ANSWERS[type] && !scored[type]) {
      setDemoScore((s) => s + 1);
      setScored((s) => ({ ...s, [type]: true }));
    }
  };

  const quizOptClass = (type: QuizType, answer: string, base: string) => {
    const sel = selected[type];
    if (!sel) return base;
    if (answer === sel) {
      return `${base} ring-2 ${
        sel === ANSWERS[type] ? "ring-indigo-500 border-indigo-500" : "ring-2"
      }`;
    }
    if (sel !== ANSWERS[type] && answer === ANSWERS[type]) {
      return `${base} ring-2 ring-emerald-500`;
    }
    return base;
  };

  const faqs = [
    {
      q: "Is Aptimetric a real IQ test?",
      a: "Yes. It was developed by psychometricians using Item Response Theory and validated against gold-standard tests like WAIS-IV. It's not a buzzfeed quiz.",
    },
    {
      q: "How long does it take?",
      a: "Most people finish in 15-20 minutes. The adaptive engine stops once it reaches sufficient precision.",
    },
    {
      q: "Can I retake the test?",
      a: "We recommend waiting at least 30 days between attempts to reduce practice effects. Pro users can retake after 30 days.",
    },
    {
      q: "Is my data private?",
      a: "Absolutely. All data is encrypted in transit and at rest. We never sell your data. You can delete your account and results anytime.",
    },
  ];

  return (
    <>
      <div id="scrollProgress" style={{ width: `${scrollPct}%` }} />
      <div className="aurora" />
      <div className="noise" />

      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="#" className="flex items-center gap-3 group">
              <div className="size-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 grid place-items-center shadow-lg shadow-indigo-500/25">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3v18M3 12h18M7 7l10 10M17 7L7 17"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <div className="font-display font-bold text-lg leading-none tracking-tight">
                  aptimetric<span className="text-indigo-400">.org</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
                  Cognitive Labs
                </div>
              </div>
            </a>
            <nav className="hidden md:flex items-center gap-8 text-sm">
              <a href="#how" className="text-slate-300 hover:text-white transition">How it works</a>
              <a href="#sample" className="text-slate-300 hover:text-white transition">Sample Test</a>
              <a href="#science" className="text-slate-300 hover:text-white transition">Science</a>
              <a href="#pricing" className="text-slate-300 hover:text-white transition">Pricing</a>
              <a href="#faq" className="text-slate-300 hover:text-white transition">FAQ</a>
            </nav>
            <div className="flex items-center gap-3">
              <a href="/login" className="hidden sm:inline-flex text-sm text-slate-300 hover:text-white transition">
                Sign in
              </a>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition shadow-lg shadow-white/10"
              >
                Start Free Test
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden size-10 grid place-items-center rounded-xl glass"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-3 text-sm">
              <a href="#how" className="block py-2 text-slate-300">How it works</a>
              <a href="#sample" className="block py-2 text-slate-300">Sample Test</a>
              <a href="#science" className="block py-2 text-slate-300">Science</a>
              <a href="#pricing" className="block py-2 text-slate-300">Pricing</a>
              <a href="#faq" className="block py-2 text-slate-300">FAQ</a>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-slate-200 mb-6">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                Normed on 2.4M+ test takers • Updated 2025
              </div>
              <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
                Measure your <span className="gradient-text">cognitive potential</span> with precision.
              </h1>
              <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-xl">
                Aptimetric is a scientifically validated, adaptive IQ test built by psychometricians. Get a real
                IQ score, percentile, cognitive profile, and certificate in under 18 minutes.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setModalOpen(true)}
                  className="shimmer inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold shadow-xl shadow-indigo-500/25 hover:opacity-95 transition"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Take the Official Test
                </button>
                <a
                  href="#sample"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl glass glass-hover font-semibold text-white"
                >
                  Try 3 Free Questions
                </a>
              </div>
              <div className="mt-8 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={`https://i.pravatar.cc/40?img=${i}`}
                      alt=""
                      className="size-9 rounded-full border-2 border-slate-900"
                    />
                  ))}
                </div>
                <div className="text-sm text-slate-400">
                  <div className="font-semibold text-white leading-none">4.9/5 average rating</div>
                  <div>from 18,421 verified reviews</div>
                </div>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
                <div className="glass rounded-2xl p-4 text-center">
                  <div className="text-2xl font-display font-bold">
                    18<span className="text-indigo-400">m</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Avg. time</div>
                </div>
                <div className="glass rounded-2xl p-4 text-center">
                  <div className="text-2xl font-display font-bold">±2.7</div>
                  <div className="text-xs text-slate-400 mt-1">SEM points</div>
                </div>
                <div className="glass rounded-2xl p-4 text-center">
                  <div className="text-2xl font-display font-bold">15+</div>
                  <div className="text-xs text-slate-400 mt-1">Subtests</div>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="absolute -inset-10 bg-gradient-to-br from-indigo-600/20 to-cyan-500/20 blur-3xl rounded-full" />
              <div className="relative glass rounded-[2rem] p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-red-500/80" />
                    <span className="size-3 rounded-full bg-yellow-500/80" />
                    <span className="size-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                    Live Session
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-xl">Raven Matrix • Item 14/30</h3>
                    <div className="text-sm text-slate-400">02:41 left</div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full w-[47%] bg-gradient-to-r from-indigo-500 to-cyan-400" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="matrix-cell">
                      <svg width="36" height="36" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="12" stroke="#818cf8" strokeWidth="3" fill="none" />
                      </svg>
                    </div>
                    <div className="matrix-cell">
                      <svg width="36" height="36" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="12" stroke="#818cf8" strokeWidth="3" fill="none" />
                        <circle cx="20" cy="20" r="6" stroke="#67e8f9" strokeWidth="3" fill="none" />
                      </svg>
                    </div>
                    <div className="matrix-cell">
                      <svg width="36" height="36" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="12" stroke="#818cf8" strokeWidth="3" fill="none" />
                        <circle cx="20" cy="20" r="6" stroke="#67e8f9" strokeWidth="3" fill="none" />
                        <circle cx="20" cy="20" r="2" fill="#c084fc" />
                      </svg>
                    </div>
                    <div className="matrix-cell">
                      <svg width="36" height="36" viewBox="0 0 40 40">
                        <rect x="10" y="10" width="20" height="20" stroke="#818cf8" strokeWidth="3" fill="none" />
                      </svg>
                    </div>
                    <div className="matrix-cell">
                      <svg width="36" height="36" viewBox="0 0 40 40">
                        <rect x="10" y="10" width="20" height="20" stroke="#818cf8" strokeWidth="3" fill="none" />
                        <rect x="15" y="15" width="10" height="10" stroke="#67e8f9" strokeWidth="3" fill="none" />
                      </svg>
                    </div>
                    <div className="matrix-cell">
                      <svg width="36" height="36" viewBox="0 0 40 40">
                        <rect x="10" y="10" width="20" height="20" stroke="#818cf8" strokeWidth="3" fill="none" />
                        <rect x="15" y="15" width="10" height="10" stroke="#67e8f9" strokeWidth="3" fill="none" />
                        <rect x="18" y="18" width="4" height="4" fill="#c084fc" />
                      </svg>
                    </div>
                    <div className="matrix-cell">
                      <svg width="36" height="36" viewBox="0 0 40 40">
                        <polygon points="20,8 32,32 8,32" stroke="#818cf8" strokeWidth="3" fill="none" />
                      </svg>
                    </div>
                    <div className="matrix-cell">
                      <svg width="36" height="36" viewBox="0 0 40 40">
                        <polygon points="20,8 32,32 8,32" stroke="#818cf8" strokeWidth="3" fill="none" />
                        <polygon points="20,14 26,26 14,26" stroke="#67e8f9" strokeWidth="3" fill="none" />
                      </svg>
                    </div>
                    <div className="matrix-cell bg-indigo-500/10 border-indigo-400/40 grid place-items-center text-indigo-300 font-bold text-2xl">
                      ?
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 pt-2">
                    {[0, 1, 2, 3].map((i) => (
                      <button
                        key={i}
                        onClick={() => setHeroSelected(i)}
                        className={`group relative rounded-xl border bg-slate-900/60 hover:border-indigo-400/50 p-3 transition ${
                          heroSelected === i ? "ring-2 ring-indigo-500 border-indigo-500" : "border-white/10"
                        }`}
                      >
                        {i === 0 && (
                          <svg width="40" height="40" viewBox="0 0 40 40" className="mx-auto">
                            <polygon points="20,8 32,32 8,32" stroke="#818cf8" strokeWidth="3" fill="none" />
                            <polygon points="20,14 26,26 14,26" stroke="#67e8f9" strokeWidth="3" fill="none" />
                            <circle cx="20" cy="23" r="2" fill="#c084fc" />
                          </svg>
                        )}
                        {i === 1 && (
                          <svg width="40" height="40" viewBox="0 0 40 40" className="mx-auto">
                            <polygon points="20,8 32,32 8,32" stroke="#818cf8" strokeWidth="3" fill="none" />
                          </svg>
                        )}
                        {i === 2 && (
                          <svg width="40" height="40" viewBox="0 0 40 40" className="mx-auto">
                            <polygon points="20,8 32,32 8,32" stroke="#818cf8" strokeWidth="3" fill="none" />
                            <polygon points="20,14 26,26 14,26" stroke="#67e8f9" strokeWidth="3" fill="none" />
                          </svg>
                        )}
                        {i === 3 && (
                          <svg width="40" height="40" viewBox="0 0 40 40" className="mx-auto">
                            <circle cx="20" cy="20" r="12" stroke="#818cf8" strokeWidth="3" fill="none" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button className="text-sm text-slate-400 hover:text-white transition">Skip for now</button>
                    <button className="px-4 py-2 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition">
                      Confirm →
                    </button>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 glass rounded-2xl px-4 py-3 shadow-xl float hidden sm:block">
                <div className="text-xs text-slate-400">Current IQ Estimate</div>
                <div className="font-display font-bold text-2xl">
                  128 <span className="text-emerald-400 text-sm">+3</span>
                </div>
              </div>
              <div
                className="absolute -bottom-8 -left-8 glass rounded-2xl px-4 py-3 shadow-xl float hidden sm:block"
                style={{ animationDelay: "1s" }}
              >
                <div className="text-xs text-slate-400">Adaptive Difficulty</div>
                <div className="font-display font-bold text-xl">Level 7/10</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-white/10 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-slate-500 text-sm">
            <span className="uppercase tracking-widest text-xs text-slate-600">Trusted by researchers at</span>
            <span className="font-semibold text-slate-300">Stanford</span>
            <span className="font-semibold text-slate-300">Cambridge</span>
            <span className="font-semibold text-slate-300">Max Planck</span>
            <span className="font-semibold text-slate-300">ETH Zürich</span>
            <span className="font-semibold text-slate-300">National Institute of Mental Health</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight">How Aptimetric works</h2>
            <p className="mt-4 text-slate-300 text-lg">
              A modern, adaptive test engine that gets more precise with every answer. No fluff, just psychometrics.
            </p>
          </div>
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <div className="group relative glass rounded-3xl p-8 glass-hover transition">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 grid place-items-center shadow-lg shadow-indigo-500/25 mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 3v4M12 17v4M3 12h4M17 12h4M7 7l2.5 2.5M14.5 14.5L17 17M17 7l-2.5 2.5M7 17l2.5-2.5" />
                </svg>
              </div>
              <h3 className="font-display font-bold text-xl mb-2">1. Calibrate</h3>
              <p className="text-slate-400 leading-relaxed">
                We start with a short calibration set to estimate your baseline ability across fluid reasoning,
                working memory, and processing speed.
              </p>
              <div className="mt-6 text-xs font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2">
                IRT 3PL + Bayesian updating
              </div>
            </div>
            <div className="group relative glass rounded-3xl p-8 glass-hover transition">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-500 grid place-items-center shadow-lg shadow-cyan-500/25 mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M3 12h4l3 8 4-16 3 8h4" />
                </svg>
              </div>
              <h3 className="font-display font-bold text-xl mb-2">2. Adapt</h3>
              <p className="text-slate-400 leading-relaxed">
                Each item is selected in real-time to maximize information gain. Harder if you&apos;re crushing it,
                easier if you&apos;re struggling. Faster convergence.
              </p>
              <div className="mt-6 text-xs font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2">
                CAT • Fisher Information
              </div>
            </div>
            <div className="group relative glass rounded-3xl p-8 glass-hover transition">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-500 grid place-items-center shadow-lg shadow-fuchsia-500/25 mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 20l9-5-9-5-9 5 9 5z" />
                  <path d="M12 12l9-5-9-5-9 5 9 5z" />
                </svg>
              </div>
              <h3 className="font-display font-bold text-xl mb-2">3. Report</h3>
              <p className="text-slate-400 leading-relaxed">
                Instant results with IQ score, percentile, confidence interval, subscale breakdown, and a
                verifiable certificate. Export PDF.
              </p>
              <div className="mt-6 text-xs font-mono text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-lg px-3 py-2">
                g-factor + CHC model
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SAMPLE TEST */}
      <section
        id="sample"
        className="py-24 sm:py-32 border-t border-white/10 bg-gradient-to-b from-slate-950/0 to-slate-950/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="lg:sticky lg:top-28">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium mb-4">
                <span className="size-1.5 rounded-full bg-cyan-400" />
                Interactive Demo
              </div>
              <h2 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight">
                Try 3 real questions
              </h2>
              <p className="mt-4 text-slate-300 text-lg">
                No signup required. Get a feel for our item types: matrix reasoning, verbal analogies, and number
                series.
              </p>
              <div className="mt-8 space-y-3">
                {["Adaptive difficulty in real time", "Mobile-optimized, no app needed", "Instant feedback & explanation"].map(
                  (t) => (
                    <div key={t} className="flex items-center gap-3 text-sm text-slate-300">
                      <div className="tick">
                        <div className="size-5 rounded-full bg-slate-900 grid place-items-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="3">
                            <path d="M5 12l5 5 10-10" />
                          </svg>
                        </div>
                      </div>
                      {t}
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="glass rounded-[2rem] p-6 sm:p-8">
              <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900/80 border border-white/10 mb-6">
                {(["matrix", "verbal", "numeric"] as QuizType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      activeTab === t ? "bg-white text-slate-900" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {t === "matrix" ? "Matrix" : t === "verbal" ? "Verbal" : "Numeric"}
                  </button>
                ))}
              </div>

              {activeTab === "matrix" && (
                <div>
                  <h4 className="font-semibold text-slate-200 mb-3">Which pattern completes the matrix?</h4>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="matrix-cell"><div className="size-8 rounded-full border-2 border-indigo-400" /></div>
                    <div className="matrix-cell"><div className="size-8 rounded-full border-2 border-indigo-400 relative"><div className="absolute inset-1 rounded-full border-2 border-cyan-400" /></div></div>
                    <div className="matrix-cell"><div className="size-8 rounded-full border-2 border-indigo-400 relative"><div className="absolute inset-1 rounded-full border-2 border-cyan-400" /><div className="absolute inset-2.5 rounded-full bg-fuchsia-400" /></div></div>
                    <div className="matrix-cell"><div className="size-8 border-2 border-indigo-400 rotate-45" /></div>
                    <div className="matrix-cell"><div className="size-8 border-2 border-indigo-400 rotate-45 relative"><div className="absolute inset-1 border-2 border-cyan-400 rotate-0" /></div></div>
                    <div className="matrix-cell"><div className="size-8 border-2 border-indigo-400 rotate-45 relative"><div className="absolute inset-1 border-2 border-cyan-400" /><div className="absolute inset-2.5 bg-fuchsia-400" /></div></div>
                    <div className="matrix-cell"><div className="size-0 border-l-[16px] border-r-[16px] border-b-[28px] border-l-transparent border-r-transparent border-b-indigo-400" /></div>
                    <div className="matrix-cell"><div className="size-0 border-l-[16px] border-r-[16px] border-b-[28px] border-l-transparent border-r-transparent border-b-indigo-400 relative"><div className="absolute top-[6px] left-[-10px] size-0 border-l-[10px] border-r-[10px] border-b-[18px] border-l-transparent border-r-transparent border-b-cyan-400" /></div></div>
                    <div className="matrix-cell bg-indigo-500/10 border-indigo-400/50 text-2xl font-bold text-indigo-300">?</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => pickAnswer("matrix", "a")} className={quizOptClass("matrix", "a", "rounded-xl border border-white/10 bg-slate-900/60 p-3 hover:border-indigo-400/50 transition")}>
                      <div className="size-0 mx-auto border-l-[14px] border-r-[14px] border-b-[24px] border-l-transparent border-r-transparent border-b-indigo-400 relative">
                        <div className="absolute top-[5px] left-[-9px] size-0 border-l-[9px] border-r-[9px] border-b-[16px] border-l-transparent border-r-transparent border-b-cyan-400" />
                        <div className="absolute top-[11px] left-[-3px] size-2 bg-fuchsia-400 rotate-45" />
                      </div>
                    </button>
                    <button onClick={() => pickAnswer("matrix", "b")} className={quizOptClass("matrix", "b", "rounded-xl border border-white/10 bg-slate-900/60 p-3 hover:border-indigo-400/50 transition")}>
                      <div className="size-0 mx-auto border-l-[14px] border-r-[14px] border-b-[24px] border-l-transparent border-r-transparent border-b-indigo-400 relative">
                        <div className="absolute top-[5px] left-[-9px] size-0 border-l-[9px] border-r-[9px] border-b-[16px] border-l-transparent border-r-transparent border-b-cyan-400" />
                      </div>
                    </button>
                    <button onClick={() => pickAnswer("matrix", "c")} className={quizOptClass("matrix", "c", "rounded-xl border border-white/10 bg-slate-900/60 p-3 hover:border-indigo-400/50 transition")}>
                      <div className="size-0 mx-auto border-l-[14px] border-r-[14px] border-b-[24px] border-l-transparent border-r-transparent border-b-indigo-400" />
                    </button>
                    <button onClick={() => pickAnswer("matrix", "d")} className={quizOptClass("matrix", "d", "rounded-xl border border-white/10 bg-slate-900/60 p-3 hover:border-indigo-400/50 transition")}>
                      <div className="size-8 mx-auto rounded-full border-2 border-indigo-400" />
                    </button>
                  </div>
                  {selected.matrix && (
                    <div
                      className={`mt-4 rounded-xl p-4 text-sm border ${
                        selected.matrix === ANSWERS.matrix
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                          : "border-red-500/30 bg-red-500/10 text-red-200"
                      }`}
                    >
                      <strong>{selected.matrix === ANSWERS.matrix ? "✓ Correct!" : "✗ Not quite."}</strong>{" "}
                      {selected.matrix !== ANSWERS.matrix && "The correct answer is highlighted. "}
                      {EXPLANATIONS.matrix}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "verbal" && (
                <div>
                  <h4 className="font-semibold text-slate-200 mb-3">Complete the analogy:</h4>
                  <div className="glass rounded-2xl p-6 text-center mb-4">
                    <div className="text-2xl font-display font-bold tracking-wide">BOOK : CHAPTER :: TREE : ?</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { a: "a", label: "A. Forest" },
                      { a: "b", label: "B. Branch" },
                      { a: "c", label: "C. Leaf" },
                      { a: "d", label: "D. Root" },
                    ].map((o) => (
                      <button
                        key={o.a}
                        onClick={() => pickAnswer("verbal", o.a)}
                        className={quizOptClass(
                          "verbal",
                          o.a,
                          "rounded-xl border border-white/10 bg-slate-900/60 p-4 text-left hover:border-indigo-400/50 transition font-medium"
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  {selected.verbal && (
                    <div
                      className={`mt-4 rounded-xl p-4 text-sm border ${
                        selected.verbal === ANSWERS.verbal
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                          : "border-red-500/30 bg-red-500/10 text-red-200"
                      }`}
                    >
                      <strong>{selected.verbal === ANSWERS.verbal ? "✓ Correct!" : "✗ Not quite."}</strong>{" "}
                      {selected.verbal !== ANSWERS.verbal && "The correct answer is highlighted. "}
                      {EXPLANATIONS.verbal}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "numeric" && (
                <div>
                  <h4 className="font-semibold text-slate-200 mb-3">What number comes next?</h4>
                  <div className="glass rounded-2xl p-6 text-center mb-4">
                    <div className="text-3xl font-display font-bold tracking-widest">3, 7, 15, 31, 63, ?</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { a: "a", label: "95" },
                      { a: "b", label: "125" },
                      { a: "c", label: "127" },
                      { a: "d", label: "129" },
                    ].map((o) => (
                      <button
                        key={o.a}
                        onClick={() => pickAnswer("numeric", o.a)}
                        className={quizOptClass(
                          "numeric",
                          o.a,
                          "rounded-xl border border-white/10 bg-slate-900/60 p-4 font-mono text-lg hover:border-indigo-400/50 transition"
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  {selected.numeric && (
                    <div
                      className={`mt-4 rounded-xl p-4 text-sm border ${
                        selected.numeric === ANSWERS.numeric
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                          : "border-red-500/30 bg-red-500/10 text-red-200"
                      }`}
                    >
                      <strong>{selected.numeric === ANSWERS.numeric ? "✓ Correct!" : "✗ Not quite."}</strong>{" "}
                      {selected.numeric !== ANSWERS.numeric && "The correct answer is highlighted. "}
                      {EXPLANATIONS.numeric}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  Score: <span className="font-semibold text-white">{demoScore}/3</span>
                </div>
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:opacity-95 transition"
                >
                  Start Full Test →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SCIENCE */}
      <section id="science" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight">
                Built on real psychometrics, not quizzes.
              </h2>
              <p className="mt-4 text-slate-300 text-lg">
                Aptimetric was developed with PhD psychometricians and validated against WAIS-IV and Raven&apos;s
                2. High reliability, low bias.
              </p>
              <div className="mt-10 grid sm:grid-cols-2 gap-4">
                <div className="glass rounded-2xl p-5">
                  <div className="text-3xl font-display font-bold">r = .89</div>
                  <div className="text-sm text-slate-400 mt-1">Correlation with WAIS-IV FSIQ</div>
                </div>
                <div className="glass rounded-2xl p-5">
                  <div className="text-3xl font-display font-bold">α = .94</div>
                  <div className="text-sm text-slate-400 mt-1">Cronbach&apos;s alpha reliability</div>
                </div>
                <div className="glass rounded-2xl p-5">
                  <div className="text-3xl font-display font-bold">±2.7</div>
                  <div className="text-sm text-slate-400 mt-1">Standard error of measurement</div>
                </div>
                <div className="glass rounded-2xl p-5">
                  <div className="text-3xl font-display font-bold">15+</div>
                  <div className="text-sm text-slate-400 mt-1">Cognitive subtests</div>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">Item Response Theory</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/20">Computer Adaptive Testing</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/20">CHC Theory</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">DIF Analysis</span>
              </div>
            </div>
            <div className="relative">
              <div className="glass rounded-[2rem] p-8">
                <h4 className="font-display font-bold text-xl mb-4">Your cognitive profile</h4>
                <div className="space-y-4">
                  {[
                    { label: "Fluid Reasoning", score: 132, pct: 88 },
                    { label: "Working Memory", score: 118, pct: 72 },
                    { label: "Processing Speed", score: 124, pct: 80 },
                    { label: "Verbal Comprehension", score: 129, pct: 85 },
                    { label: "Visual-Spatial", score: 135, pct: 92 },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">{row.label}</span>
                        <span className="font-semibold">{row.score}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-4">
                    <div className="text-2xl font-display font-bold">128</div>
                    <div className="text-xs text-slate-400">Full Scale IQ</div>
                  </div>
                  <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-4">
                    <div className="text-2xl font-display font-bold">97th</div>
                    <div className="text-xs text-slate-400">Percentile</div>
                  </div>
                  <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-4">
                    <div className="text-2xl font-display font-bold">124-132</div>
                    <div className="text-xs text-slate-400">95% CI</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 sm:py-32 border-t border-white/10 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight">Simple, transparent pricing</h2>
            <p className="mt-4 text-slate-300 text-lg">Start free. Upgrade for certified results and detailed breakdowns.</p>
          </div>
          <div className="mt-16 grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="glass rounded-[2rem] p-8 flex flex-col">
              <h3 className="font-display font-bold text-2xl">Free</h3>
              <p className="text-slate-400 mt-2 text-sm">Try the adaptive engine</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-display font-extrabold">$0</span>
              </div>
              <ul className="mt-8 space-y-3 text-sm text-slate-300 flex-1">
                <li className="flex gap-2">{CHECK} 10 sample questions</li>
                <li className="flex gap-2">{CHECK} Estimated IQ range</li>
                <li className="flex gap-2 opacity-60">{CROSS} No certificate</li>
                <li className="flex gap-2 opacity-60">{CROSS} No subscale breakdown</li>
              </ul>
              <button className="mt-8 w-full py-3 rounded-2xl glass glass-hover font-semibold">Start Free</button>
            </div>
            <div className="relative glass rounded-[2rem] p-8 flex flex-col border-indigo-500/50 shadow-2xl shadow-indigo-500/20 scale-[1.03]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-xs font-bold text-white shadow-lg">
                MOST POPULAR
              </div>
              <h3 className="font-display font-bold text-2xl">Pro</h3>
              <p className="text-slate-400 mt-2 text-sm">Full official test</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-display font-extrabold">$19</span>
                <span className="text-slate-500">one-time</span>
              </div>
              <ul className="mt-8 space-y-3 text-sm text-slate-300 flex-1">
                <li className="flex gap-2">{CHECK} Full 30-45 item adaptive test</li>
                <li className="flex gap-2">{CHECK} Official IQ score + percentile + CI</li>
                <li className="flex gap-2">{CHECK} 5 subscale breakdown</li>
                <li className="flex gap-2">{CHECK} Verifiable PDF certificate</li>
                <li className="flex gap-2">{CHECK} Retake after 30 days</li>
              </ul>
              <button className="mt-8 w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 font-semibold text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 transition">
                Get Pro Results
              </button>
            </div>
            <div className="glass rounded-[2rem] p-8 flex flex-col">
              <h3 className="font-display font-bold text-2xl">Premium</h3>
              <p className="text-slate-400 mt-2 text-sm">For professionals &amp; coaches</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-display font-extrabold">$39</span>
              </div>
              <ul className="mt-8 space-y-3 text-sm text-slate-300 flex-1">
                <li className="flex gap-2">{CHECK} Everything in Pro</li>
                <li className="flex gap-2">{CHECK} Extended 15 subscale report</li>
                <li className="flex gap-2">{CHECK} Cognitive strengths/weaknesses</li>
                <li className="flex gap-2">{CHECK} Career fit suggestions</li>
                <li className="flex gap-2">{CHECK} Priority support</li>
              </ul>
              <button className="mt-8 w-full py-3 rounded-2xl glass glass-hover font-semibold">Upgrade to Premium</button>
            </div>
          </div>
          <p className="text-center text-xs text-slate-500 mt-8">30-day money-back guarantee. Results are confidential and encrypted.</p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight">Loved by curious minds worldwide</h2>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "Finally an online IQ test that feels legitimate. The adaptive difficulty was obvious, and my results matched my official WAIS testing within 3 points.",
                name: "Dr. Maya S.",
                role: "Cognitive Neuroscientist",
                img: 11,
              },
              {
                quote:
                  "Clean UI, no ads, no BS. Got my certificate in 17 minutes. The subscale breakdown actually helped me understand my strengths.",
                name: "James L.",
                role: "Software Engineer",
                img: 12,
              },
              {
                quote:
                  "I use Aptimetric with my gifted students for screening. The psychometric quality is impressive for an online tool.",
                name: "Elena R.",
                role: "School Psychologist",
                img: 13,
              },
            ].map((t) => (
              <div key={t.name} className="glass rounded-3xl p-6">
                <div className="flex items-center gap-1 text-amber-400 mb-3">★★★★★</div>
                <p className="text-slate-300">&quot;{t.quote}&quot;</p>
                <div className="mt-4 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://i.pravatar.cc/40?img=${t.img}`} alt="" className="size-9 rounded-full" />
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 sm:py-32 border-t border-white/10 bg-slate-950/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight text-center">Frequently asked questions</h2>
          <div className="mt-12 space-y-4">
            {faqs.map((f, i) => (
              <div key={f.q} className="glass rounded-2xl">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-semibold text-lg">{f.q}</span>
                  <svg
                    className={`size-5 text-slate-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {openFaq === i && <div className="px-6 pb-6 text-slate-300">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] glass p-12 sm:p-16 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-cyan-500/20 blur-2xl" />
            <div className="relative">
              <h2 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight">Ready to know your true score?</h2>
              <p className="mt-4 text-slate-300 text-lg max-w-2xl mx-auto">
                Join 2.4M+ people who&apos;ve measured their cognitive potential with Aptimetric. Scientifically
                rigorous. Beautifully simple.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-slate-900 font-bold text-lg shadow-xl hover:bg-slate-100 transition"
                >
                  Start Official Test Now
                </button>
                <a href="#sample" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl glass glass-hover font-semibold text-lg">
                  Try Free Demo
                </a>
              </div>
              <div className="mt-6 text-xs text-slate-500">No credit card required for demo • Takes ~18 min • Instant results</div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-16 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 grid place-items-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3v18M3 12h18M7 7l10 10M17 7L7 17" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="font-display font-bold text-lg">
                  aptimetric<span className="text-indigo-400">.org</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-400 max-w-xs">
                Scientifically validated cognitive assessment platform. Measure what matters.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#how" className="hover:text-white">How it works</a></li>
                <li><a href="#sample" className="hover:text-white">Sample test</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Certificate verification</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Research</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Data Processing</a></li>
                <li><a href="#" className="hover:text-white">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>© 2026 Aptimetric Labs Inc. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-slate-300">Twitter</a>
              <a href="#" className="hover:text-slate-300">LinkedIn</a>
              <a href="#" className="hover:text-slate-300">GitHub</a>
            </div>
          </div>
        </div>
      </footer>

      {/* TEST MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 min-h-full flex items-center justify-center p-4">
            <div className="w-full max-w-2xl glass rounded-[2rem] p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-2xl">Start Your Official Test</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="size-10 grid place-items-center rounded-xl glass hover:bg-white/10 transition"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-300 mb-1 block">Age</label>
                    <input
                      type="number"
                      placeholder="e.g. 28"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 focus:border-indigo-500 outline-none text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300 mb-1 block">Education Level</label>
                    <select className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 focus:border-indigo-500 outline-none text-white">
                      <option>High School</option>
                      <option>Bachelor&apos;s</option>
                      <option>Master&apos;s</option>
                      <option>Doctorate</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-start gap-3 text-sm text-slate-300 mt-4">
                  <input type="checkbox" className="mt-1 size-4 accent-indigo-500" />
                  <span>I understand this is a timed assessment and I will complete it in a quiet environment without assistance.</span>
                </label>
                <a
                  href="/signup"
                  className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 font-bold text-white text-lg shadow-xl shadow-indigo-500/25 hover:opacity-95 transition flex items-center justify-center"
                >
                  Begin Test →
                </a>
                <p className="text-xs text-center text-slate-500">By starting, you agree to our Terms and Privacy Policy. Results are encrypted.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
