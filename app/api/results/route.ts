// app/api/results/route.ts
// Server-side result submission. The IRT score is ALWAYS recomputed here
// (the client can never post a score), retakes are limited by a cooldown,
// and the row is written under the caller's own id via RLS.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { scoreTest, type AnswerSummary, DOMAIN_LABELS } from "@/lib/irt/scoring";

export const runtime = "nodejs";

const VALID_DOMAINS = Object.keys(DOMAIN_LABELS);
const RETEST_COOLDOWN_DAYS = 90;

interface Payload {
  answers?: AnswerSummary[];
  tabSwitches?: number;
  suspicious?: number;
  durationMs?: number;
  invitationToken?: string | null;
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const answers = normalizeAnswers(payload.answers);
  if (answers.length < 8) {
    return NextResponse.json({ error: "Too few answered questions" }, { status: 422 });
  }

  // ---- retake cooldown ------------------------------------------------
  const { data: last, error: lastErr } = await supabase
    .from("assessment_results")
    .select("completed_at")
    .not("status", "eq", "void")
    .order("completed_at", { ascending: false })
    .limit(1);

  if (!lastErr && last && last.length > 0) {
    const lastDate = new Date(last[0].completed_at).getTime();
    const hours = (Date.now() - lastDate) / 3_600_000;
    if (hours < RETEST_COOLDOWN_DAYS * 24) {
      const remainingDays = Math.ceil((RETEST_COOLDOWN_DAYS * 24 - hours) / 24);
      return NextResponse.json(
        {
          error: "Retake cooldown",
          message: `You can retake the assessment in ${remainingDays} day${remainingDays === 1 ? "" : "s"}.`,
          cooldownDays: remainingDays,
        },
        { status: 423 }
      );
    }
  }

  // ---- score (server-side, authoritative) ------------------------------
  const score = scoreTest(answers);

  const tabSwitches = clampInt(payload.tabSwitches, 0, 1000);
  const suspicious = clampInt(payload.suspicious, 0, 1000);
  const durationMs = clampInt(payload.durationMs, 0, 3_600_000 * 6);

  const domains: Record<string, unknown> = {};
  for (const [key, est] of Object.entries(score.domains)) {
    domains[key] = {
      iq: est.iq,
      theta: est.theta,
      sem: est.sem,
      percentile: est.percentile,
      ciLow: est.ciLow,
      ciHigh: est.ciHigh,
    };
  }

  const { data: row, error } = await supabase
    .from("assessment_results")
    .insert({
      user_id: user.id,
      iq_score: score.overall.iq,
      iq_ci_lower: score.overall.ciLow,
      iq_ci_upper: score.overall.ciHigh,
      percentile: score.overall.percentile,
      overall_theta: score.overall.theta,
      overall_sem: score.overall.sem,
      classification: score.classification,
      domains,
      answers: score.answers,
      domain_counts: score.domainCounts,
      duration_ms: durationMs,
      tab_switches: tabSwitches,
      suspicious: suspicious,
      status: suspicious >= 3 ? "flagged" : "completed",
      invitation_token: payload.invitationToken || null,
    })
    .select("id, iq_score, percentile, iq_ci_lower, iq_ci_upper, completed_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ result: row }, { status: 201 });
}

function normalizeAnswers(raw: unknown): AnswerSummary[] {
  if (!Array.isArray(raw)) return [];
  const out: AnswerSummary[] = [];
  for (const item of raw as AnswerSummary[]) {
    if (!item || typeof item !== "object") continue;
    const difficulty = Number(item.difficulty);
    const correct = Boolean(item.correct);
    if (!VALID_DOMAINS.includes(item.domain)) continue;
    if (!Number.isFinite(difficulty) || difficulty < 1 || difficulty > 5) continue;
    out.push({
      domain: item.domain,
      subdomain: String(item.subdomain ?? ""),
      difficulty,
      correct,
      timeMs: Math.max(0, Math.min(3_600_000, Number(item.timeMs) || 0)),
    });
  }
  return out.slice(0, 60);
}

function clampInt(v: unknown, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}