// lib/components/Certificate.tsx
import { DOMAIN_LABELS } from "@/lib/irt/scoring";

export interface CertificateData {
  fullName: string;
  iq: number;
  percentile: number;
  classification: string;
  ciLow: number;
  ciHigh: number;
  completedAt: string;
  certificateId: string;
  domainIq: Record<string, number>;
}

export default function Certificate({ data }: { data: CertificateData }) {
  const date = new Date(data.completedAt);
  const dateLabel = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="print-area">
      <div className="certificate-sheet" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
        <div className="certificate-frame" />

        <div className="relative flex flex-col h-full">
          {/* header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 grid place-items-center shadow-lg shadow-indigo-500/30">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 3v18M3 12h18M7 7l10 10M17 7L7 17" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div className="leading-none">
                <div className="font-display font-bold text-lg tracking-tight text-white">
                  aptimetric<span className="text-indigo-400">.org</span>
                </div>
                <div className="text-[9px] uppercase tracking-widest text-slate-400 font-medium mt-0.5">
                  Cognitive Labs · Measure What Matters
                </div>
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed">
              Certificate of<br />Cognitive Assessment
            </div>
          </div>

          {/* seal */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center opacity-95">
            <div className="tick p-[3px]">
              <div className="size-24 rounded-full bg-[#0b1224] grid place-items-center">
                <div className="text-center">
                  <div className="font-display font-bold text-2xl text-cyan-300">{Math.round(data.iq)}</div>
                  <div className="text-[8px] uppercase tracking-widest text-slate-400 -mt-0.5">IQ · Verified</div>
                </div>
              </div>
            </div>
          </div>

          {/* body */}
          <div className="flex-1 flex flex-col items-center justify-center text-center pt-4">
            <div className="text-xs uppercase tracking-[0.35em] text-indigo-300 font-semibold mb-2">This certifies that</div>
            <div className="font-display font-bold text-4xl sm:text-5xl text-white tracking-tight max-w-xl leading-tight">
              {data.fullName || "Aptimetric Candidate"}
            </div>
            <div className="mt-4 h-px w-24 bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
            <div className="mt-4 text-sm text-slate-300 max-w-md leading-relaxed">
              has completed the official Aptimetric adaptive cognitive assessment and scored at the{" "}
              <span className="text-cyan-300 font-semibold">{data.classification}</span> level,
              outperforming <span className="text-cyan-300 font-semibold">{data.percentile}%</span> of the general population.
            </div>
            <div className="mt-5 flex items-center gap-6 text-xs text-slate-400">
              <span>
                IQ Score <span className="text-white font-semibold">{Math.round(data.iq)}</span>
              </span>
              <span className="size-1 rounded-full bg-slate-600" />
              <span>
                95% CI <span className="text-white font-semibold">{data.ciLow}–{data.ciHigh}</span>
              </span>
            </div>

            {/* domain strip */}
            <div className="mt-6 flex gap-2 flex-wrap justify-center">
              {Object.entries(DOMAIN_LABELS)
                .filter(([k]) => data.domainIq[k])
                .map(([k, label]) => (
                  <div key={k} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5">
                    <div className="text-[9px] uppercase tracking-wider text-slate-400">{label}</div>
                    <div className="font-display font-bold text-sm text-white mt-0.5">{Math.round(data.domainIq[k])}</div>
                  </div>
                ))}
            </div>
          </div>

          {/* footer */}
          <div className="flex items-end justify-between text-[10px] text-slate-400">
            <div className="leading-relaxed">
              <div className="uppercase tracking-widest text-slate-300 text-[10px] font-semibold mb-1">Certification ID</div>
              <span className="font-mono">{data.certificateId.slice(0, 13).toUpperCase()}</span>
              <div className="mt-2 text-slate-500">Issued {dateLabel}</div>
            </div>
            <div className="leading-relaxed text-right">
              <div className="uppercase tracking-widest text-slate-500 text-[9px] mb-1">Psychometric Engine</div>
              <div className="font-display text-slate-200">IRT · EAP Scoring · 6 Domains</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}