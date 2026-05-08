"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { v1, type ItemsData } from "@/app/_lib/v1-client";

import { SkillGapHeatmap, type HeatmapCohort } from "../_components/skill-gap-heatmap";

import { AnalyticsDashboard, type MemberLite, type SkillMap } from "./analytics-dashboard";

type CohortRow = { id: string; name: string; description?: string | null };

type Overview = {
  total_members?: number;
  avg_score?: number | null;
  completion_rate?: number;
  sessions_this_week?: number;
  completed_sessions?: number;
  total_sessions?: number;
  active_learners_this_week?: number;
  inactive_learners?: number;
  ready_learners?: number;
  at_risk_learners?: number;
  avg_attempts_per_learner?: number;
  avg_improvement?: number | null;
  top_skill_gaps?: string[];
};

type Intervention = {
  user_id: string;
  full_name?: string | null;
  email?: string | null;
  risk_level: string;
  reasons: string[];
  latest_score?: number | null;
  last_activity_at?: string | null;
  incomplete_sessions: number;
  weak_criteria: string[];
};

type ProgressSeries = { dates: string[]; series: Array<{ key: string; name: string; data: Array<number | null> }> };
type MemberItem = { user_id: string; full_name?: string | null; email?: string | null };

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function skillAverages(skillMap?: SkillMap): Record<string, number> {
  if (!skillMap) return {};
  const out: Record<string, number> = {};
  for (const criterion of skillMap.criteria) {
    const vals = skillMap.members
      .map((m) => m[criterion])
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const avg = average(vals);
    if (avg != null) out[criterion] = Math.round(avg);
  }
  return out;
}

export function AnalyticsPageClient() {
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [stats, setStats] = useState<Record<string, Overview>>({});
  const [skillMaps, setSkillMaps] = useState<Record<string, SkillMap>>({});
  const [interventions, setInterventions] = useState<Record<string, Intervention[]>>({});
  const [progress, setProgress] = useState<Record<string, ProgressSeries>>({});
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await v1.get<ItemsData<CohortRow>>("cohorts", { limit: 50, page: 1 });
    if (!res.ok) {
      setError(res.message);
      setCohorts([]);
      setLoading(false);
      return;
    }

    const items = res.data.items ?? [];
    const nextStats: Record<string, Overview> = {};
    const nextSkills: Record<string, SkillMap> = {};
    const nextInterventions: Record<string, Intervention[]> = {};
    const nextProgress: Record<string, ProgressSeries> = {};
    const nextMembers: MemberLite[] = [];

    await Promise.all(
      items.map(async (c) => {
        const [overviewRes, skillRes, interventionRes, progressRes, memberRes] = await Promise.all([
          v1.get<{ overview: Overview }>(`analytics/cohorts/${c.id}/overview`),
          v1.get<{ skill_map: SkillMap }>(`analytics/cohorts/${c.id}/skill-map`),
          v1.get<{ interventions: Intervention[] }>(`analytics/cohorts/${c.id}/interventions`),
          v1.get<{ progress: ProgressSeries }>(`analytics/cohorts/${c.id}/progress-over-time`),
          v1.get<ItemsData<MemberItem>>(`cohorts/${c.id}/members`, { limit: 200, page: 1 }),
        ]);
        if (overviewRes.ok) nextStats[c.id] = overviewRes.data.overview;
        if (skillRes.ok) nextSkills[c.id] = skillRes.data.skill_map;
        if (interventionRes.ok) nextInterventions[c.id] = interventionRes.data.interventions ?? [];
        if (progressRes.ok) nextProgress[c.id] = progressRes.data.progress;
        if (memberRes.ok) {
          for (const m of memberRes.data.items ?? []) {
            nextMembers.push({
              id: m.user_id,
              name: m.full_name || `Learner ${m.user_id.slice(0, 8)}`,
              email: m.email || m.user_id,
              cohortId: c.id,
            });
          }
        }
      }),
    );

    setCohorts(items);
    setStats(nextStats);
    setSkillMaps(nextSkills);
    setInterventions(nextInterventions);
    setProgress(nextProgress);
    setMembers(nextMembers);
    setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const cohortStatsForDashboard = cohorts.map((c) => {
    const o = stats[c.id];
    return {
      id: c.id,
      name: c.name,
      avg: o?.avg_score != null ? Math.round(o.avg_score) : null,
      completion: o?.completion_rate != null ? Math.round(o.completion_rate * 100) : 0,
      ready: o?.ready_learners ?? 0,
      atRisk: o?.at_risk_learners ?? 0,
      active: o?.active_learners_this_week ?? 0,
      members: o?.total_members ?? 0,
    };
  });

  const allCriteria = useMemo(() => {
    const seen = new Set<string>();
    for (const map of Object.values(skillMaps)) {
      for (const criterion of map.criteria) seen.add(criterion);
    }
    return Array.from(seen).slice(0, 8);
  }, [skillMaps]);

  const cohortSummaries: HeatmapCohort[] = cohorts.map((c) => ({
    id: c.id,
    name: c.name,
    avgScore: stats[c.id]?.avg_score != null ? Math.round(stats[c.id].avg_score as number) : null,
    skills: skillAverages(skillMaps[c.id]),
  }));

  const totals = cohortStatsForDashboard.reduce(
    (acc, c) => ({
      members: acc.members + c.members,
      ready: acc.ready + c.ready,
      atRisk: acc.atRisk + c.atRisk,
      active: acc.active + c.active,
    }),
    { members: 0, ready: 0, atRisk: 0, active: 0 },
  );
  const avgScores = cohortStatsForDashboard.map((c) => c.avg).filter((v): v is number => v != null);
  const orgAvg = average(avgScores);
  const allInterventions = cohorts.flatMap((c) =>
    (interventions[c.id] ?? []).map((row) => ({ ...row, cohortId: c.id, cohortName: c.name })),
  );

  const momentum = useMemo(() => {
    const byDate = new Map<string, { scores: number[]; completed: number; active: number }>();
    for (const p of Object.values(progress)) {
      p.dates.forEach((date, index) => {
        const row = byDate.get(date) ?? { scores: [], completed: 0, active: 0 };
        const avgSeries = p.series.find((s) => s.key === "avg_score")?.data[index];
        const completedSeries = p.series.find((s) => s.key === "completed_sessions")?.data[index];
        const activeSeries = p.series.find((s) => s.key === "active_learners")?.data[index];
        if (typeof avgSeries === "number") row.scores.push(avgSeries);
        if (typeof completedSeries === "number") row.completed += completedSeries;
        if (typeof activeSeries === "number") row.active += activeSeries;
        byDate.set(date, row);
      });
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([date, row]) => ({ date, avg: average(row.scores), completed: row.completed, active: row.active }));
  }, [progress]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Analytics Command Center</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
          Readiness, risk, skill gaps, and intervention signals across your cohorts.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-[14px] text-[var(--muted)]">Loading analytics...</p>
      ) : cohorts.length === 0 ? (
        <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-8">
          <h2 className="text-lg font-semibold text-[#111111]">No cohort analytics yet</h2>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--muted)]">
            Create a cohort, invite learners, and complete scored simulations to unlock readiness, risk, and skill trends.
          </p>
        </section>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile label="Org avg score" value={orgAvg != null ? `${Math.round(orgAvg)}%` : "-"} detail="Completed evaluations" tone="green" />
            <KpiTile label="Ready learners" value={`${totals.ready}`} detail={`${totals.members} enrolled`} tone="green" />
            <KpiTile label="At risk" value={`${totals.atRisk}`} detail="Need staff attention" tone={totals.atRisk ? "red" : "green"} />
            <KpiTile label="Active this week" value={`${totals.active}`} detail="Unique learners" tone="neutral" />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Cohort readiness</h2>
                <span className="text-[12px] text-[var(--muted)]">{cohorts.length} cohorts</span>
              </div>
              <div className="mt-4 space-y-3">
                {cohortStatsForDashboard.map((c) => (
                  <a
                    key={c.id}
                    href={`/org/cohorts/${c.id}`}
                    className="block rounded-xl border border-[var(--rule)] px-4 py-3 hover:bg-[var(--field)]/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-[#111111]">{c.name}</p>
                        <p className="mt-1 text-[12px] text-[var(--muted)]">
                          {c.ready} ready / {c.atRisk} at risk / {c.active} active this week
                        </p>
                      </div>
                      <div className="font-mono text-[13px] tabular-nums text-[#166534]">{c.avg != null ? `${c.avg}%` : "-"}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Intervention queue</h2>
              {allInterventions.length ? (
                <ul className="mt-4 space-y-3">
                  {allInterventions.slice(0, 6).map((item) => (
                    <li key={`${item.cohortId}-${item.user_id}`} className="rounded-xl border border-[var(--rule)] px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-medium text-[#111111]">{item.full_name || item.email || item.user_id}</p>
                          <p className="mt-0.5 text-[11px] text-[var(--faint)]">{item.cohortName}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 font-mono text-[9px] uppercase ${item.risk_level === "high" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                          {item.risk_level}
                        </span>
                      </div>
                      <p className="mt-2 text-[12px] text-[var(--muted)]">{item.reasons[0]}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-[14px] text-[var(--muted)]">No learners currently need intervention.</p>
              )}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-3">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Skill gap heatmap</h2>
              {cohortSummaries.length ? <SkillGapHeatmap cohorts={cohortSummaries} criteria={allCriteria} /> : null}
            </div>
            <div className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Weekly momentum</h2>
              {momentum.length ? (
                <div className="mt-5 space-y-3">
                  {momentum.map((row) => (
                    <div key={row.date} className="grid grid-cols-[86px_1fr_64px] items-center gap-3 text-[12px]">
                      <span className="font-mono text-[var(--faint)]">{row.date.slice(5)}</span>
                      <div className="h-2 rounded-full bg-[var(--field)]">
                        <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, row.avg ?? 0)}%` }} />
                      </div>
                      <span className="text-right font-mono text-[#111111]">{row.avg != null ? `${Math.round(row.avg)}%` : "-"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-[14px] text-[var(--muted)]">Complete scored sessions to see weekly trends.</p>
              )}
            </div>
          </section>

          <Suspense fallback={<p className="text-[14px] text-[var(--muted)]">Loading drill-down...</p>}>
            <AnalyticsDashboard cohortSummaries={cohortStatsForDashboard} members={members} skillMaps={skillMaps} />
          </Suspense>
        </>
      )}
    </div>
  );
}

function KpiTile({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "green" | "red" | "neutral" }) {
  const valueColor = tone === "red" ? "text-red-700" : tone === "green" ? "text-[#166534]" : "text-[#111111]";
  return (
    <div className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">{label}</p>
      <p className={`mt-3 text-3xl font-semibold tracking-[-0.03em] ${valueColor}`}>{value}</p>
      <p className="mt-1 text-[12px] text-[var(--muted)]">{detail}</p>
    </div>
  );
}
