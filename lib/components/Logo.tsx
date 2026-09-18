// lib/components/Logo.tsx
export default function Logo({
  size = 36,
  className = "",
  subtitle = true,
}: {
  size?: number;
  className?: string;
  subtitle?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span
        className="rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 grid place-items-center shadow-lg shadow-indigo-500/25"
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 3v18M3 12h18M7 7l10 10M17 7L7 17" stroke="white" strokeWidth={1.8} strokeLinecap="round" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="font-display font-bold text-lg tracking-tight">
          aptimetric<span className="text-indigo-400">.org</span>
        </span>
        {subtitle && (
          <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-medium mt-1">
            Cognitive Labs
          </span>
        )}
      </span>
    </span>
  );
}