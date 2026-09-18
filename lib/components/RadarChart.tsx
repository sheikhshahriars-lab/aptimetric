// lib/components/RadarChart.tsx
// Dependency-free SVG radar chart for the 6 cognitive domains.
// Axis labels are anchored to their own vertices and never overlap.

"use client";

import { useEffect, useRef, useState } from "react";

export interface RadarDatum {
  key: string;
  label: string;
  iq: number;
}

const ANGLE_START = -90; // 12 o'clock
const MIN_IQ = 70;
const MAX_IQ = 150;
const LABEL_GAP = 14; // px between a vertex and its label

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function splitLabel(label: string): [string, string | null] {
  const idx = label.indexOf(" ");
  if (idx <= 0) return [label, null];
  return [label.slice(0, idx), label.slice(idx + 1)];
}

function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(340);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}

export default function RadarChart({
  data,
  animate = true,
}: {
  data: RadarDatum[];
  animate?: boolean;
}) {
  const { ref, width } = useContainerWidth();
  const size = Math.max(240, Math.min(width, 400));

  const cx = size / 2;
  const cy = size / 2;
  // Shrink the web enough that side labels always have room next to vertices.
  const R = Math.max(52, Math.min(size * 0.3, (cx - 96) / 0.87));
  const n = data.length;

  const radiusFor = (iq: number) =>
    R * clamp((iq - MIN_IQ) / (MAX_IQ - MIN_IQ), 0.08, 1);

  const path = data
    .map((d, i) => {
      const angle = ANGLE_START + i * (360 / n);
      const p = polarToCartesian(cx, cy, radiusFor(d.iq), angle);
      return `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    })
    .join(" ") + " Z";

  // The ring corresponding to IQ = 100, drawn dashed as a reference.
  const meanRing = clamp((100 - MIN_IQ) / (MAX_IQ - MIN_IQ), 0, 1);

  return (
    <div ref={ref} className="w-full">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Cognitive domain radar chart"
        className="mx-auto"
      >
        {/* rings */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon
            key={f}
            points={polygonPoints(n, cx, cy, R * f)}
            fill="none"
            stroke="rgba(148,163,184,0.22)"
            strokeWidth="1"
          />
        ))}
        {/* average (IQ 100) reference ring */}
        <polygon
          points={polygonPoints(n, cx, cy, R * meanRing)}
          fill="none"
          stroke="rgba(148,163,184,0.5)"
          strokeWidth="1"
          strokeDasharray="5,5"
        />
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
              stroke="rgba(148,163,184,0.16)"
              strokeWidth="1"
            />
          );
        })}
        {/* value area */}
        <polygon
          points={path}
          fill="rgba(99,102,241,0.28)"
          stroke="url(#radarGradient)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          style={animate ? { transformOrigin: "center", animation: "pop-in 0.6s cubic-bezier(0.22,1,0.36,1) both" } : undefined}
        />
        {/* vertex dots */}
        {data.map((d, i) => {
          const angle = ANGLE_START + i * (360 / n);
          const p = polarToCartesian(cx, cy, radiusFor(d.iq), angle);
          return (
            <circle
              key={`dot-${d.key}`}
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill="#67e8f9"
              stroke="#0b1120"
              strokeWidth="1.5"
            />
          );
        })}
        {/* labels — each anchored to its own vertex, outside the web */}
        {data.map((d, i) => {
          const angle = ANGLE_START + i * (360 / n);
          const end = polarToCartesian(cx, cy, R, angle);
          const dx = end.x - cx;
          const dy = end.y - cy;
          const nearVertical = Math.abs(dx) < 8;
          const isTop = nearVertical && dy < 0;
          const isBottom = nearVertical && dy > 0;
          const isLeft = !nearVertical && dx < 0;

          const [word1, word2] = splitLabel(d.label);
          const anchor = isTop || isBottom ? "middle" : isLeft ? "end" : "start";
          let labelX = cx;
          let labelY: number;
          if (isTop) {
            labelY = Math.max(14, end.y - LABEL_GAP - 6);
          } else if (isBottom) {
            labelY = Math.min(size - 6, end.y + LABEL_GAP + 4);
          } else if (isLeft) {
            labelX = Math.max(4, end.x - LABEL_GAP);
            labelY = end.y + 4;
          } else {
            labelX = Math.min(size - 4, end.x + LABEL_GAP);
            labelY = end.y + 4;
          }

          return (
            <text
              key={`label-${d.key}`}
              x={labelX}
              y={labelY}
              textAnchor={anchor}
              fontSize="12"
              fill="rgba(241,245,249,0.92)"
              fontWeight="600"
            >
              <tspan x={labelX} dy="0">{word1}</tspan>
              {word2 ? <tspan x={labelX} dy="14">{word2}</tspan> : null}
              <tspan
                x={labelX}
                dy={word2 ? 14 : 0}
                fontSize="10.5"
                fill="#67e8f9"
                fontWeight="700"
              >
                {Math.round(d.iq)}
              </tspan>
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
    </div>
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