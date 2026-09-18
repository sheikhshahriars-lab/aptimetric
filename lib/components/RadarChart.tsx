// lib/components/RadarChart.tsx
// Dependency-free SVG radar chart for the 6 cognitive domains.

export interface RadarDatum {
  key: string;
  label: string;
  iq: number;
}

const ANGLE_START = -90; // 12 o'clock
const MIN_IQ = 70;
const MAX_IQ = 145;

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

export default function RadarChart({
  data,
  size = 340,
  animate = true,
}: {
  data: RadarDatum[];
  size?: number;
  animate?: boolean;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.34;
  const n = data.length;
  const path = data
    .map((d, i) => {
      const angle = ANGLE_START + i * (360 / n);
      const r = R * clamp((d.iq - MIN_IQ) / (MAX_IQ - MIN_IQ), 0.08, 1);
      const p = polarToCartesian(cx, cy, r, angle);
      return `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    })
    .join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Cognitive domain radar chart">
      {/* rings */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={polygonPoints(n, cx, cy, R * f)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}
      {/* spokes */}
      {data.map((d, i) => {
        const angle = ANGLE_START + i * (360 / n);
        const end = polarToCartesian(cx, cy, R, angle);
        return (
          <line
            key={`spoke-${d.key}`}
            x1={cx}
            y1={cy}
            x2={end.x}
            y2={end.y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        );
      })}
      {/* value area */}
      <polygon
        points={path}
        fill="rgba(99,102,241,0.22)"
        stroke="url(#radarGradient)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        style={animate ? { transformOrigin: "center", animation: "pop-in 0.6s cubic-bezier(0.22,1,0.36,1) both" } : undefined}
      />
      {/* vertex dots */}
      {data.map((d, i) => {
        const angle = ANGLE_START + i * (360 / n);
        const r = R * clamp((d.iq - MIN_IQ) / (MAX_IQ - MIN_IQ), 0.08, 1);
        const p = polarToCartesian(cx, cy, r, angle);
        return <circle key={`dot-${d.key}`} cx={p.x} cy={p.y} r="4" fill="#67e8f9" />;
      })}
      {/* labels */}
      {data.map((d, i) => {
        const angle = ANGLE_START + i * (360 / n);
        const p = polarToCartesian(cx, cy, R + 24, angle);
        const anchor =
          Math.abs(p.x - cx) < 2 ? "middle" : p.x > cx ? "start" : "end";
        return (
          <text
            key={`label-${d.key}`}
            x={p.x}
            y={p.y + 4}
            textAnchor={anchor}
            fontSize="11.5"
            fill="rgba(226,232,240,0.85)"
          >
            {d.label}
          </text>
        );
      })}
      <defs>
        <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function polygonPoints(n: number, cx: number, cy: number, R: number): string {
  return Array.from({ length: n }, (_, i) => {
    const angle = ANGLE_START + i * (360 / n);
    const p = polarToCartesian(cx, cy, R, angle);
    return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  }).join(" ");
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}