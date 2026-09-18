// lib/components/ShapeSVG.tsx
import { ShapeSpec } from "@/lib/generators/visualSpatial";

const PATHS: Record<string, string> = {
  arrow: "M50 10 L90 60 L65 60 L65 90 L35 90 L35 60 L10 60 Z",
  flag: "M20 10 L20 90 M20 10 L85 25 L20 45",
  bolt: "M55 5 L20 55 L45 55 L40 95 L80 40 L52 40 Z",
  hook: "M25 15 A35 35 0 1 0 75 60 L75 40",
};

export default function ShapeSVG({ shape, size = 90 }: { shape: ShapeSpec | null; size?: number }) {
  if (!shape) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <rect x="2" y="2" width="96" height="96" rx="8" fill="none" stroke="#999" strokeDasharray="6 6" />
        <text x="50" y="58" fontSize="40" textAnchor="middle" fill="#999">?</text>
      </svg>
    );
  }

  const path = PATHS[shape.type];
  const scaleX = shape.mirrored ? -1 : 1;
  const transform = `translate(50,50) rotate(${shape.rotation}) scale(${scaleX},1) translate(-50,-50)`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect x="2" y="2" width="96" height="96" rx="8" fill="none" stroke="#ccc" />
      <path
        d={path}
        transform={transform}
        fill={shape.filled ? "#333" : "none"}
        stroke="#333"
        strokeWidth={4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}