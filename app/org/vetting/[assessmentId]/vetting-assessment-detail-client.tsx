"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MetricCard, ProductPageHeader, StatusBadge } from "@/app/_components/product-ui";
import { v1 } from "@/app/_lib/v1-client";
import type {
  ItemsData,
  VettingApiKey,
  VettingAssessment,
  VettingAttempt,
  VettingMode,
  VettingWebhookEndpoint,
} from "@/app/vetting/_lib/vetting-client";
import { formatDateTime, modeLabel } from "@/app/vetting/_components/vetting-public-ui";

function statusTone(status?: string): "success" | "warning" | "neutral" {
  if (status === "PUBLISHED") return "success";
  if (status === "DRAFT") return "warning";
  return "neutral";
}

function passTone(value?: boolean | null): "success" | "danger" | "warning" | "neutral" {
  if (value === true) return "success";
  if (value === false) return "danger";
  return "neutral";
}

export function VettingAssessmentDetailClient({ assessmentId }: { assessmentId: string }) {
  const [assessment, setAssessment] = useState<VettingAssessment | null>(null);
  const [attempts, setAttempts] = useState<VettingAttempt[]>([]);
  const [apiKeys, setApiKeys] = useState<VettingApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<VettingWebhookEndpoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState("Default vetting key");
  const [rawApiKey, setRawApiKey] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookDescription, setWebhookDescription] = useState("");
  const [signingSecret, setSigningSecret] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [mode, setMode] = useState<VettingMode>("TEXT");
  const [passScore, setPassScore] = useState(70);
  const [timeLimit, setTimeLimit] = useState(30);
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#32a852");

  const hydrateForm = useCallback((row: VettingAssessment) => {
    setTitle(row.title || "");
    setInstructions(row.instructions || "");
    setMode(row.mode || "TEXT");
    setPassScore(row.pass_score || 70);
    setTimeLimit(row.time_limit_minutes || 30);
    setLogoUrl(row.branding?.logo_url || "");
    setPrimaryColor(row.branding?.primary_color || "#32a852");
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [assessmentRes, attemptsRes, keysRes, hooksRes] = await Promise.all([
      v1.get<{ assessment: VettingAssessment }>(`vetting/assessments/${assessmentId}`),
      v1.get<ItemsData<VettingAttempt>>(`vetting/assessments/${assessmentId}/attempts`, { limit: 100, page: 1 }),
      v1.get<{ items: VettingApiKey[] }>("vetting/api-keys"),
      v1.get<{ items: VettingWebhookEndpoint[] }>("vetting/webhooks"),
    ]);
    if (!assessmentRes.ok) {
      setError(assessmentRes.message);
      setAssessment(null);
    } else {
      setAssessment(assessmentRes.data.assessment);
      hydrateForm(assessmentRes.data.assessment);
    }
    setAttempts(attemptsRes.ok ? attemptsRes.data.items ?? [] : []);
    setApiKeys(keysRes.ok ? keysRes.data.items ?? [] : []);
    setWebhooks(hooksRes.ok ? hooksRes.data.items ?? [] : []);
    if (!attemptsRes.ok || !keysRes.ok || !hooksRes.ok) {
      setNotice("Some integration details could not be loaded.");
    }
    setLoading(false);
  }, [assessmentId, hydrateForm]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const stats = useMemo(() => {
    const evaluated = attempts.filter((attempt) => attempt.status === "EVALUATED").length;
    const passed = attempts.filter((attempt) => attempt.passed === true).length;
    const avg = evaluated
      ? Math.round(attempts.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) / evaluated)
      : 0;
    return { evaluated, passed, avg };
  }, [attempts]);

  async function copyPublicLink() {
    if (assessment?.status !== "PUBLISHED" || !assessment?.public_url) return;
    await navigator.clipboard.writeText(assessment.public_url);
    setNotice("Public candidate link copied.");
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    const res = await v1.patch<{ assessment: VettingAssessment }>(`vetting/assessments/${assessmentId}`, {
      title: title.trim(),
      instructions: instructions.trim() || null,
      mode,
      pass_score: passScore,
      time_limit_minutes: timeLimit || null,
      branding: {
        logo_url: logoUrl.trim() || null,
        primary_color: primaryColor || null,
      },
    });
    if (!res.ok) {
      setError(res.message);
      setSaving(false);
      return;
    }
    setAssessment(res.data.assessment);
    hydrateForm(res.data.assessment);
    setNotice("Assessment settings saved.");
    setSaving(false);
  }

  async function publish() {
    setSaving(true);
    setError(null);
    setNotice(null);
    const res = await v1.post<{ assessment: VettingAssessment }>(`vetting/assessments/${assessmentId}/publish`, {});
    if (!res.ok) {
      setError(res.message);
      setSaving(false);
      return;
    }
    setAssessment(res.data.assessment);
    hydrateForm(res.data.assessment);
    setNotice("Assessment published.");
    setSaving(false);
  }

  async function createApiKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    const res = await v1.post<{ api_key: VettingApiKey }>("vetting/api-keys", { name: newApiKeyName.trim() || "Vetting key" });
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setRawApiKey(res.data.api_key.raw_key || null);
    setApiKeys((prev) => [res.data.api_key, ...prev]);
    setNotice("API key created.");
  }

  async function createWebhook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    const res = await v1.post<{ webhook: VettingWebhookEndpoint }>("vetting/webhooks", {
      url: webhookUrl,
      description: webhookDescription.trim() || null,
    });
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setSigningSecret(res.data.webhook.signing_secret || null);
    setWebhooks((prev) => [res.data.webhook, ...prev]);
    setWebhookUrl("");
    setWebhookDescription("");
    setNotice("Webhook endpoint created.");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="squinia-skeleton h-8 w-72 rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="squinia-skeleton h-32 rounded-2xl" />
          <div className="squinia-skeleton h-32 rounded-2xl" />
          <div className="squinia-skeleton h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-[var(--warning-soft)] px-5 py-4 text-[14px] leading-6 text-amber-950">
        {error || "Assessment not found."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ProductPageHeader
        eyebrow="Squinia Vetting"
        title={assessment.title}
        description="Manage candidate delivery, scoring threshold, branding, API access, and result webhooks."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/org/vetting" className="rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-[12px] font-semibold text-[var(--muted)] hover:bg-[var(--field)] hover:text-[var(--foreground)]">
              Back
            </Link>
            {assessment.status !== "PUBLISHED" ? (
              <button type="button" onClick={() => void publish()} disabled={saving} className="sim-btn-accent px-5 py-2.5 font-mono text-[10px] uppercase">
                Publish
              </button>
            ) : null}
          </div>
        }
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge tone={statusTone(assessment.status)}>{assessment.status ?? "Draft"}</StatusBadge>
          <StatusBadge>{modeLabel(assessment.mode)}</StatusBadge>
          <StatusBadge tone="success">Pass {assessment.pass_score}</StatusBadge>
        </div>
      </ProductPageHeader>

      {error ? <p className="rounded-xl border border-amber-200 bg-[var(--warning-soft)] px-4 py-3 text-[14px] text-amber-950">{error}</p> : null}
      {notice ? <p className="rounded-xl border border-[#b8e8c4] bg-[var(--accent-soft)] px-4 py-3 text-[14px] text-[#166534]">{notice}</p> : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Attempts" value={attempts.length} detail={`${stats.evaluated} evaluated`} />
        <MetricCard label="Passed" value={stats.passed} detail="Candidates above threshold" tone="success" />
        <MetricCard label="Average score" value={stats.evaluated ? `${stats.avg}` : "--"} detail="Evaluated attempts" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <form onSubmit={(event) => void saveSettings(event)} className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">Assessment settings</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-[13px] font-semibold text-[var(--foreground)]">Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="squinia-input mt-2 px-3 py-3 text-[14px]" />
            </label>
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
              <input type="number" min={1} max={100} value={passScore} onChange={(event) => setPassScore(Number(event.target.value))} className="squinia-input mt-2 px-3 py-3 text-[14px]" />
            </label>
            <label className="block">
              <span className="text-[13px] font-semibold text-[var(--foreground)]">Time limit</span>
              <input type="number" min={1} value={timeLimit} onChange={(event) => setTimeLimit(Number(event.target.value))} className="squinia-input mt-2 px-3 py-3 text-[14px]" />
            </label>
            <label className="block">
              <span className="text-[13px] font-semibold text-[var(--foreground)]">Primary color</span>
              <input type="color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] p-1" />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-[13px] font-semibold text-[var(--foreground)]">Logo URL</span>
              <input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} className="squinia-input mt-2 px-3 py-3 text-[14px]" placeholder="https://..." />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-[13px] font-semibold text-[var(--foreground)]">Candidate instructions</span>
              <textarea rows={6} value={instructions} onChange={(event) => setInstructions(event.target.value)} className="squinia-input mt-2 resize-y px-3 py-3 text-[14px] leading-6" />
            </label>
          </div>
          <button type="submit" disabled={saving} className="sim-btn-accent mt-5 px-5 py-3 font-mono text-[10px] uppercase">
            {saving ? "Saving" : "Save settings"}
          </button>
        </form>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">Public link</p>
            <p className="mt-3 break-all rounded-xl border border-[var(--rule)] bg-[var(--field)]/45 px-3 py-3 text-[12px] leading-5 text-[var(--muted)]">
              {assessment.status === "PUBLISHED" && assessment.public_url
                ? assessment.public_url
                : "Publish this assessment to activate the public candidate link."}
            </p>
            <button type="button" disabled={assessment.status !== "PUBLISHED" || !assessment.public_url} onClick={() => void copyPublicLink()} className="mt-3 rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-[12px] font-semibold text-[var(--muted)] hover:bg-[var(--field)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-45">
              {assessment.status === "PUBLISHED" ? "Copy link" : "Publish first"}
            </button>
          </section>

          <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">API launch</p>
            <pre className="mt-3 overflow-x-auto rounded-xl border border-[var(--rule)] bg-[#101711] p-4 text-[11px] leading-5 text-white">
{`POST /api/v1/vetting/api/assessments/${assessment.id}/attempts
Authorization: Bearer sqv_...

{
  "candidate_name": "Ada Lovelace",
  "candidate_email": "ada@example.com",
  "external_candidate_id": "cand_123",
  "external_application_id": "app_456"
}`}
            </pre>
          </section>
        </aside>
      </section>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">Attempts</p>
            <h2 className="mt-2 text-lg font-semibold text-[var(--foreground)]">Candidate results</h2>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-[13px]">
            <thead className="border-b border-[var(--rule)] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
              <tr>
                <th className="py-3 pr-4">Candidate</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Score</th>
                <th className="py-3 pr-4">Source</th>
                <th className="py-3 pr-4">Created</th>
                <th className="py-3 text-right">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule)]">
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-[var(--muted)]">No candidate attempts yet.</td>
                </tr>
              ) : (
                attempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-[var(--foreground)]">{attempt.candidate_name}</p>
                      <p className="text-[12px] text-[var(--muted)]">{attempt.candidate_email}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge tone={attempt.status === "EVALUATED" ? passTone(attempt.passed) : "neutral"}>{attempt.status}</StatusBadge>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-[var(--foreground)]">{attempt.score ?? "--"}</td>
                    <td className="py-3 pr-4 text-[var(--muted)]">{attempt.source ?? "--"}</td>
                    <td className="py-3 pr-4 text-[var(--muted)]">{formatDateTime(attempt.created_at)}</td>
                    <td className="py-3 text-right">
                      <Link href={`/org/vetting/attempts/${attempt.id}`} className="text-[12px] font-semibold text-[#0f6f34] underline-offset-4 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">API keys</p>
          <form onSubmit={(event) => void createApiKey(event)} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input value={newApiKeyName} onChange={(event) => setNewApiKeyName(event.target.value)} className="squinia-input px-3 py-3 text-[14px]" />
            <button type="submit" className="sim-btn-accent px-5 py-3 font-mono text-[10px] uppercase">Create</button>
          </form>
          {rawApiKey ? (
            <p className="mt-4 break-all rounded-xl border border-[#b8e8c4] bg-[var(--accent-soft)] px-3 py-3 font-mono text-[12px] leading-5 text-[#166534]">
              {rawApiKey}
            </p>
          ) : null}
          <ul className="mt-4 divide-y divide-[var(--rule)]">
            {apiKeys.map((key) => (
              <li key={key.id} className="py-3 text-[13px]">
                <p className="font-semibold text-[var(--foreground)]">{key.name}</p>
                <p className="font-mono text-[11px] text-[var(--muted)]">{key.key_prefix}... | Last used {formatDateTime(key.last_used_at)}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">Webhooks</p>
          <form onSubmit={(event) => void createWebhook(event)} className="mt-4 space-y-3">
            <input required type="url" value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} className="squinia-input px-3 py-3 text-[14px]" placeholder="https://example.com/squinia-webhook" />
            <input value={webhookDescription} onChange={(event) => setWebhookDescription(event.target.value)} className="squinia-input px-3 py-3 text-[14px]" placeholder="Description" />
            <button type="submit" className="sim-btn-accent px-5 py-3 font-mono text-[10px] uppercase">Add webhook</button>
          </form>
          {signingSecret ? (
            <p className="mt-4 break-all rounded-xl border border-[#b8e8c4] bg-[var(--accent-soft)] px-3 py-3 font-mono text-[12px] leading-5 text-[#166534]">
              {signingSecret}
            </p>
          ) : null}
          <ul className="mt-4 divide-y divide-[var(--rule)]">
            {webhooks.map((hook) => (
              <li key={hook.id} className="py-3 text-[13px]">
                <p className="break-all font-semibold text-[var(--foreground)]">{hook.url}</p>
                <p className="text-[12px] text-[var(--muted)]">{hook.description || "vetting.attempt.completed"} | {hook.is_active ? "Active" : "Paused"}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
