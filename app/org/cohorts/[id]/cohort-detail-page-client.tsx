"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { v1, type ItemsData } from "@/app/_lib/v1-client";

import { CohortDetailTabs, type CohortMemberVm, type ProgressRowVm } from "./cohort-detail-tabs";

type OrgSkillProfile = { clarity: number; structure: number; tone: number; policy: number; presence: number };

type CohortApi = {
  id: string;
  name: string;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at?: string;
};

type MemberItem = {
  id: string;
  user_id: string;
  joined_at: string;
  role: string;
  sessions_completed?: number;
  avg_score?: number | null;
  email?: string | null;
  full_name?: string | null;
};

type ProgressApi = {
  members: Array<{ user_id: string; scores: Record<string, number>; completion_rate: number }>;
};

function programWeeks(c: CohortApi): number {
  if (c.starts_at && c.ends_at) {
    const a = new Date(c.starts_at).getTime();
    const b = new Date(c.ends_at).getTime();
    if (Number.isFinite(a) && Number.isFinite(b) && b > a) {
      return Math.max(1, Math.round((b - a) / (7 * 24 * 3600 * 1000)));
    }
  }
  return 8;
}

function mapMembers(items: MemberItem[]): CohortMemberVm[] {
  return items.map((m) => ({
    id: m.user_id,
    name: m.full_name || `Learner ${m.user_id.slice(0, 8)}`,
    email: m.email || m.user_id,
    invitedAt: m.joined_at,
    status: "active",
  }));
}

function mapProgress(p: ProgressApi): ProgressRowVm[] {
  return p.members.map((m) => {
    const vals = Object.values(m.scores ?? {});
    const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    return {
      memberId: m.user_id,
      scenarioTitle: "Aggregate",
      attempts: 0,
      bestScore: avg,
      completed: m.completion_rate >= 0.99,
    };
  });
}

function skillAverageFromSkillMap(skillMap: { criteria?: string[]; members?: Record<string, unknown>[] }): OrgSkillProfile | null {
  const criteria = skillMap.criteria ?? [];
  const members = skillMap.members ?? [];
  if (!criteria.length || !members.length) return null;
  const dims = ["clarity", "structure", "tone", "policy", "presence"] as const;
  const out: Partial<OrgSkillProfile> = {};
  for (let i = 0; i < Math.min(dims.length, criteria.length); i++) {
    const d = dims[i];
    let sum = 0;
    let n = 0;
    for (const row of members) {
      if (row && typeof row === "object" && d in row) {
        const v = (row as Record<string, unknown>)[d];
        if (typeof v === "number") {
          sum += v;
          n++;
        }
      }
    }
    if (n > 0) out[d] = Math.round(sum / n);
  }
  if (Object.keys(out).length === 0) return null;
  return {
    clarity: out.clarity ?? 0,
    structure: out.structure ?? 0,
    tone: out.tone ?? 0,
    policy: out.policy ?? 0,
    presence: out.presence ?? 0,
  };
}

export function CohortDetailPageClient() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const cohortId = params.id;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cohort, setCohort] = useState<CohortApi | null>(null);
  const [members, setMembers] = useState<CohortMemberVm[]>([]);
  const [progress, setProgress] = useState<ProgressRowVm[]>([]);
  const [skillAverage, setSkillAverage] = useState<OrgSkillProfile | null>(null);
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [completion, setCompletion] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!cohortId) return;
    setLoading(true);
    setError(null);

    const [cRes, mRes, pRes, oRes, sRes] = await Promise.all([
      v1.get<{ cohort: CohortApi }>(`cohorts/${cohortId}`),
      v1.get<ItemsData<MemberItem>>(`cohorts/${cohortId}/members`, { limit: 200, page: 1 }),
      v1.get<{ progress: ProgressApi }>(`cohorts/${cohortId}/progress`),
      v1.get<{ overview: { avg_score?: number | null; completion_rate?: number } }>(`analytics/cohorts/${cohortId}/overview`),
      v1.get<{ skill_map: { criteria?: string[]; members?: Record<string, unknown>[] } }>(`analytics/cohorts/${cohortId}/skill-map`),
    ]);

    if (!cRes.ok) {
      setError(cRes.message);
      setCohort(null);
      setLoading(false);
      return;
    }
    setCohort(cRes.data.cohort);
    setEditName(cRes.data.cohort.name);
    setEditDescription(cRes.data.cohort.description ?? "");

    if (mRes.ok) setMembers(mapMembers(mRes.data.items ?? []));
    else setMembers([]);

    if (pRes.ok) setProgress(mapProgress(pRes.data.progress));
    else setProgress([]);

    if (oRes.ok) {
      const o = oRes.data.overview;
      setAvgScore(o.avg_score != null ? Math.round(o.avg_score) : null);
      setCompletion(o.completion_rate != null ? Math.round(o.completion_rate * 100) : null);
    } else {
      setAvgScore(null);
      setCompletion(null);
    }

    if (sRes.ok) {
      setSkillAverage(skillAverageFromSkillMap(sRes.data.skill_map));
    } else {
      setSkillAverage(null);
    }

    setLoading(false);
  }, [cohortId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  if (!cohortId) {
    return <p className="text-[14px] text-[var(--muted)]">Missing cohort id.</p>;
  }

  if (loading) {
    return <p className="text-[14px] text-[var(--muted)]">Loading cohort...</p>;
  }

  if (!cohort) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <p className="text-amber-900">{error ?? "Cohort not found."}</p>
        <Link href="/org/cohorts" className="font-medium text-[#111111] underline">
          Back to cohorts
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link
          href="/org/cohorts"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
        >
          Cohorts
        </Link>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">{cohort.name}</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">{cohort.description ?? ""}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="rounded-xl border border-[var(--rule-strong)] px-4 py-2 text-[13px] font-medium text-[#111111] hover:bg-[var(--field)]"
            >
              {editing ? "Close" : "Edit"}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm(`Delete ${cohort.name}?`)) return;
                const res = await v1.delete(`cohorts/${cohortId}`);
                if (res.ok) router.push("/org/cohorts");
                else setError(res.message);
              }}
              className="rounded-xl border border-red-200 px-4 py-2 text-[13px] font-medium text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
        {editing ? (
          <form
            className="mt-5 space-y-3 rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              const res = await v1.patch<{ cohort: CohortApi }>(`cohorts/${cohortId}`, {
                name: editName.trim(),
                description: editDescription.trim() || null,
              });
              setSaving(false);
              if (res.ok) {
                setCohort(res.data.cohort);
                setEditing(false);
                void load();
              } else {
                setError(res.message);
              }
            }}
          >
            <div>
              <label htmlFor="cohortName" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                Cohort name
              </label>
              <input
                id="cohortName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
              />
            </div>
            <div>
              <label htmlFor="cohortDescription" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                Description
              </label>
              <textarea
                id="cohortDescription"
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
              />
            </div>
            <button type="submit" disabled={saving} className="sim-btn-accent px-5 py-2.5 font-mono text-[10px] uppercase disabled:opacity-50">
              {saving ? "Saving..." : "Save cohort"}
            </button>
          </form>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">{error}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-6 font-mono text-[12px] tabular-nums">
          <p className="text-[var(--muted)]">
            <span className="text-[var(--faint)]">Avg score</span>{" "}
            <span className="ml-1 font-medium text-[#166534]">{avgScore != null ? `${avgScore}%` : "-"}</span>
          </p>
          <p className="text-[var(--muted)]">
            <span className="text-[var(--faint)]">Completion</span>{" "}
            <span className="ml-1 font-medium text-[#111111]">{completion != null ? `${completion}%` : "-"}</span>
          </p>
          <p className="text-[var(--muted)]">
            <span className="text-[var(--faint)]">Program</span>{" "}
            <span className="ml-1 font-medium text-[#111111]">{programWeeks(cohort)} weeks</span>
          </p>
        </div>
      </div>

      <CohortDetailTabs cohortId={cohortId} members={members} progress={progress} skillAverage={skillAverage} onChanged={load} />
    </div>
  );
}
