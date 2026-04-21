"use client";

import type { OrgSkillDimension, OrgSkillProfile } from "../_lib/org-mock-data";
import { SKILL_LABELS } from "../_lib/org-mock-data";

type Props = {
  profile: OrgSkillProfile;
  /** When true, draws a second polygon for targets (faded). */
  target?: OrgSkillProfile | null;
  size?: number;
  caption?: string;
};

const DIMS: OrgSkillDimension[] = ["clarity", "structure", "tone", "policy", "presence"];

export function SkillRadarChart({ profile, target, size = 220, caption }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const rMax = size * 0.38;
  const n = DIMS.length;

  function pointFor(value: number, i: number): { x: number; y: number } {
    const v = Math.min(100, Math.max(0, value)) / 100;
    const angle = (-Math.PI / 2 + (i * 2 * Math.PI) / n) % (2 * Math.PI);
    const r = rMax * v;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const axes = DIMS.map((d, i) => {
    const p = pointFor(100, i);
    return { d, x2: p.x, y2: p.y, label: SKILL_LABELS[d] };
  });

  const polyPts = DIMS.map((d, i) => pointFor(profile[d] ?? 0, i));
  const poly = polyPts.map((p) => `${p.x},${p.y}`).join(" ");

  const targetPoly =
    target != null
      ? DIMS.map((d, i) => pointFor(target[d] ?? 0, i))
          .map((p) => `${p.x},${p.y}`)
          .join(" ")
      : null;

  return (
    <figure className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="text-[var(--rule-strong)]">
        {gridLevels.map((lv) => (
          <polygon
            key={lv}
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.35}
            points={DIMS.map((_, i) => {
              const p = pointFor(100 * lv, i);
              return `${p.x},${p.y}`;
            }).join(" ")}
          />
        ))}
        {axes.map((a) => (
          <line key={a.d} x1={cx} y1={cy} x2={a.x2} y2={a.y2} stroke="currentColor" strokeWidth={1} opacity={0.5} />
        ))}
        {targetPoly ? (
          <polygon
            fill="rgba(50, 168, 82, 0.08)"
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            points={targetPoly}
            opacity={0.9}
          />
        ) : null}
        <polygon
          fill="rgba(17, 17, 17, 0.06)"
          stroke="#111111"
          strokeWidth={1.75}
          points={poly}
          className="transition-[points] duration-300"
        />
        {axes.map((a, i) => {
          const p = pointFor(108, i);
          const tx = p.x - cx;
          const ty = p.y - cy;
          const anchor = Math.abs(tx) < 8 ? "middle" : tx > 0 ? "start" : "end";
          return (
            <text
              key={a.d}
              x={p.x}
              y={p.y}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-[var(--muted)]"
              style={{ fontSize: 9, fontFamily: "var(--font-geist-mono), monospace" }}
            >
              {a.label}
            </text>
          );
        })}
      </svg>
      {caption ? <figcaption className="max-w-xs text-center text-[12px] text-[var(--muted)]">{caption}</figcaption> : null}
    </figure>
  );
}
