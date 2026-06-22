"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const supabase = createClient();

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <>
      <div className="aurora" />
      <div className="noise" />
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <a href="/" className="flex items-center justify-center gap-3 mb-8">
            <div className="size-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 grid place-items-center shadow-lg shadow-indigo-500/25">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 3v18M3 12h18M7 7l10 10M17 7L7 17" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="font-display font-bold text-lg tracking-tight">
              aptimetric<span className="text-indigo-400">.org</span>
            </div>
          </a>

          <div className="glass rounded-[2rem] p-8 shadow-2xl">
            <h1 className="font-display font-bold text-2xl tracking-tight text-center">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-400 text-center">Sign in to view your results dashboard.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 focus:border-indigo-500 outline-none text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 focus:border-indigo-500 outline-none text-white"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 font-bold text-white shadow-xl shadow-indigo-500/25 hover:opacity-95 transition disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Don&apos;t have an account?{" "}
              <a href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}