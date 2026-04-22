"use client";

import Link from "next/link";

import type { OrgSkillDimension } from "../_lib/org-mock-data";
import { ORG_SKILL_TARGETS, SKILL_LABELS } from "../_lib/org-mock-data";

const DIMS: OrgSkillDimension[] = ["clarity", "structure", "tone", "policy", "presence"];

function heatColor(gap: number): string {
  if (gap <= 4) return "rgba(50, 168, 82, 0.22)";
  if (gap <= 10) return "rgba(234, 179, 8, 0.28)";
  return "rgba(220, 38, 38, 0.22)";
}

export type HeatmapCohort = { id: string; name: string; avgScore: number | null };

type Props = {
  drillBasePath?: string;
  cohorts: HeatmapCohort[];
};

/** Rows = skill dimensions, columns = cohorts. Cell = target − cohort avg score (synthetic gap from overview). */
export function SkillGapHeatmap({ drillBasePath = "/org/analytics", cohorts }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--rule)] bg-[var(--surface)]">
      <table className="w-full min-w-[480px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-[var(--rule)] bg-[var(--field)]/60 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--faint)]">
            <th className="px-3 py-2 font-medium">Skill</th>
            {cohorts.map((c) => (
              <th key={c.id} className="px-3 py-2 font-medium">
                <Link href={`${drillBasePath}?cohort=${c.id}`} className="text-[#111111] underline-offset-2 hover:underline">
                  {c.name}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DIMS.map((d) => (
            <tr key={d} className="border-b border-[var(--rule)] last:border-0">
              <td className="px-3 py-2.5 font-medium text-[#111111]">{SKILL_LABELS[d]}</td>
              {cohorts.map((c) => {
                const target = ORG_SKILL_TARGETS[d];
                const avg = c.avgScore ?? 70;
                const gap = Math.max(0, Math.round(target - avg));
                return (
                  <td key={c.id} className="px-3 py-2.5">
                    <div
                      className="rounded-lg px-2 py-2 text-center font-mono text-[12px] tabular-nums text-[#111111]"
                      style={{ backgroundColor: heatColor(gap) }}
                      title={`Target ${target} − cohort avg ${avg}`}
                    >
                      {gap}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-[var(--rule)] px-3 py-2 text-[11px] text-[var(--muted)]">
        Synthetic gap vs program target using cohort average score from analytics overview. Click a cohort header to
        filter analytics.
      </p>
    </div>
  );
}
