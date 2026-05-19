"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ProductPageHeader, StatusBadge } from "@/app/_components/product-ui";
import { v1, type ItemsData } from "@/app/_lib/v1-client";
import type { VettingAssessment, VettingMode } from "@/app/vetting/_lib/vetting-client";

type ScenarioRow = {
  id: string;
  title: string;
  status?: string;
  description?: string | null;
};

export function VettingCreateClient() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);
  const [scenarioId, setScenarioId] = useState("");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [mode, setMode] = useState<VettingMode>("TEXT");
  const [passScore, setPassScore] = useState(70);
  const [timeLimit, setTimeLimit] = useState(30);
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#32a852");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await v1.get<ItemsData<ScenarioRow>>("scenarios", { limit: 100, page: 1 });
    if (!res.ok) {
      setError(res.message);
      setScenarios([]);
    } else {
      const rows = res.data.items ?? [];
      setScenarios(rows);
      const firstPublished = rows.find((row) => (row.status || "").toUpperCase() === "PUBLISHED") ?? rows[0];
      if (firstPublished) {
        setScenarioId(firstPublished.id);
        setTitle((current) => current || firstPublished.title);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const selectedScenario = useMemo(() => scenarios.find((scenario) => scenario.id === scenarioId), [scenarioId, scenarios]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scenarioId) return;
    setSaving(true);
    setError(null);
    const res = await v1.post<{ assessment: VettingAssessment }>("vetting/assessments", {
      scenario_id: scenarioId,
      title: title.trim() || selectedScenario?.title || "Vetting assessment",
      instructions: instructions.trim() || null,
      mode,
      pass_score: passScore,
      time_limit_minutes: timeLimit || null,
      branding: {
        logo_url: logoUrl.trim() || null,
        primary_color: primaryColor || null,
      },
      settings: {},
    });
    if (!res.ok) {
      setError(res.message);
      setSaving(false);
      return;
    }
    router.push(`/org/vetting/${res.data.assessment.id}`);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <ProductPageHeader
        eyebrow="Squinia Vetting"
        title="New assessment"
        description="Choose a scenario, set the screening threshold, and prepare the branded candidate experience."
        action={
          <Link href="/org/vetting" className="rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-[12px] font-semibold text-[var(--muted)] hover:bg-[var(--field)] hover:text-[var(--foreground)]">
            Back
          </Link>
        }
      />

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-[var(--warning-soft)] px-4 py-3 text-[14px] text-amber-950">{error}</p>
      ) : null}

      {loading ? (
        <div className="squinia-card p-6">
          <div className="squinia-skeleton h-5 w-64 rounded-lg" />
          <div className="squinia-skeleton mt-5 h-12 w-full rounded-xl" />
          <div className="squinia-skeleton mt-4 h-28 w-full rounded-xl" />
        </div>
      ) : scenarios.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--rule-strong)] bg-[var(--surface)] p-8">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Create a scenario first</h2>
          <p className="mt-2 max-w-xl text-[14px] leading-6 text-[var(--muted)]">
            Vetting wraps an existing scenario and rubric, so your assessment needs scenario content before candidate links can be sent.
          </p>
          <Link href="/org/scenarios/new" className="sim-btn-accent mt-5 inline-flex px-5 py-2.5 font-mono text-[10px] uppercase">
            New scenario
          </Link>
        </div>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div className="space-y-5">
              <label className="block">
                <span className="text-[13px] font-semibold text-[var(--foreground)]">Scenario</span>
                <select
                  value={scenarioId}
                  onChange={(event) => {
                    const next = event.target.value;
                    setScenarioId(next);
                    const scenario = scenarios.find((item) => item.id === next);
                    if (scenario && !title.trim()) setTitle(scenario.title);
                  }}
                  className="squinia-input mt-2 px-3 py-3 text-[14px]"
                >
                  {scenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.title} ({scenario.status ?? "DRAFT"})
                    </option>
                  ))}
                </select>
                {selectedScenario?.status ? (
                  <span className="mt-2 inline-flex">
                    <StatusBadge tone={selectedScenario.status === "PUBLISHED" ? "success" : "warning"}>
                      {selectedScenario.status}
                    </StatusBadge>
                  </span>
                ) : null}
              </label>

              <label className="block">
                <span className="text-[13px] font-semibold text-[var(--foreground)]">Assessment title</span>
                <input
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="squinia-input mt-2 px-3 py-3 text-[14px]"
                />
              </label>

              <label className="block">
                <span className="text-[13px] font-semibold text-[var(--foreground)]">Candidate instructions</span>
                <textarea
                  rows={6}
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  className="squinia-input mt-2 resize-y px-3 py-3 text-[14px] leading-6"
                  placeholder="Explain the role, context, time expectation, and what the candidate should do."
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">Settings</p>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-[13px] font-semibold text-[var(--foreground)]">Mode</span>
                <select value={mode} onChange={(event) => setMode(event.target.value as VettingMode)} className="squinia-input mt-2 px-3 py-3 text-[14px]">
                  <option value="TEXT">Chat</option>
                  <option value="VOICE">Voice</option>
                  <option value="VIDEO">Video</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[13px] font-semibold text-[var(--foreground)]">Pass score</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={passScore}
                  onChange={(event) => setPassScore(Number(event.target.value))}
                  className="squinia-input mt-2 px-3 py-3 text-[14px]"
                />
              </label>
              <label className="block">
                <span className="text-[13px] font-semibold text-[var(--foreground)]">Time limit</span>
                <input
                  type="number"
                  min={1}
                  value={timeLimit}
                  onChange={(event) => setTimeLimit(Number(event.target.value))}
                  className="squinia-input mt-2 px-3 py-3 text-[14px]"
                />
              </label>
              <label className="block">
                <span className="text-[13px] font-semibold text-[var(--foreground)]">Logo URL</span>
                <input
                  value={logoUrl}
                  onChange={(event) => setLogoUrl(event.target.value)}
                  className="squinia-input mt-2 px-3 py-3 text-[14px]"
                  placeholder="https://..."
                />
              </label>
              <label className="block">
                <span className="text-[13px] font-semibold text-[var(--foreground)]">Primary color</span>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(event) => setPrimaryColor(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] p-1"
                />
              </label>
            </div>
            <button type="submit" disabled={saving} className="sim-btn-accent mt-6 w-full px-5 py-3 font-mono text-[10px] uppercase">
              {saving ? "Creating" : "Create assessment"}
            </button>
          </section>
        </form>
      )}
    </div>
  );
}
