"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MetricCard, ProductPageHeader, StatusBadge } from "@/app/_components/product-ui";
import { v1 } from "@/app/_lib/v1-client";
import type { ItemsData, VettingAssessment } from "@/app/vetting/_lib/vetting-client";
import { formatDateTime, modeLabel } from "@/app/vetting/_components/vetting-public-ui";

function statusTone(status?: string): "success" | "warning" | "neutral" {
  if (status === "PUBLISHED") return "success";
  if (status === "DRAFT") return "warning";
  return "neutral";
}

export function OrgVettingDashboardClient() {
  const [items, setItems] = useState<VettingAssessment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await v1.get<ItemsData<VettingAssessment>>("vetting/assessments", { limit: 100, page: 1 });
    if (!res.ok) {
      setError(res.message);
      setItems([]);
    } else {
      setItems(res.data.items ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const stats = useMemo(() => {
    const published = items.filter((item) => item.status === "PUBLISHED").length;
    const attempts = items.reduce((sum, item) => sum + (item.attempt_count ?? 0), 0);
    const avgPass = items.length ? Math.round(items.reduce((sum, item) => sum + (item.pass_score ?? 70), 0) / items.length) : 0;
    return { published, attempts, avgPass };
  }, [items]);

  async function copyLink(item: VettingAssessment) {
    if (item.status !== "PUBLISHED" || !item.public_url || typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(item.public_url);
    setCopiedId(item.id);
    window.setTimeout(() => setCopiedId(null), 1600);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ProductPageHeader
        eyebrow="Squinia Vetting"
        title="Soft-skill screening"
        description="Create branded candidate assessments, send public links, and connect pass/fail results to partner workflows."
        action={
          <Link href="/org/vetting/new" className="sim-btn-accent shrink-0 px-5 py-2.5 text-center font-mono text-[10px] uppercase">
            New assessment
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Assessments" value={loading ? "--" : items.length} detail={`${stats.published} published`} />
        <MetricCard label="Attempts" value={loading ? "--" : stats.attempts} detail="Candidate links created" tone="success" />
        <MetricCard label="Avg pass score" value={loading ? "--" : `${stats.avgPass || 70}`} detail="Across vetting scenarios" />
      </section>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-[var(--warning-soft)] px-4 py-3 text-[14px] text-amber-950">{error}</p>
      ) : null}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="squinia-card p-5">
              <div className="squinia-skeleton h-5 w-56 rounded-lg" />
              <div className="squinia-skeleton mt-3 h-4 w-4/5 rounded-lg" />
              <div className="squinia-skeleton mt-5 h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--rule-strong)] bg-[var(--surface)] p-8">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">No vetting assessments yet</h2>
          <p className="mt-2 max-w-xl text-[14px] leading-6 text-[var(--muted)]">
            Wrap a published scenario with vetting settings, branding, pass score, and candidate delivery.
          </p>
          <Link href="/org/vetting/new" className="sim-btn-accent mt-5 inline-flex px-5 py-2.5 font-mono text-[10px] uppercase">
            Create assessment
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <div className="flex h-full flex-col rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold tracking-[-0.02em] text-[var(--foreground)]">{item.title}</h2>
                      <StatusBadge tone={statusTone(item.status)}>{item.status ?? "Draft"}</StatusBadge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[14px] leading-6 text-[var(--muted)]">
                      {item.instructions || "No candidate instructions added yet."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[var(--rule)] pt-5 text-[12px]">
                  <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/35 px-3 py-2">
                    <p className="font-mono uppercase tracking-[0.12em] text-[var(--faint)]">Mode</p>
                    <p className="mt-1 font-semibold text-[var(--foreground)]">{modeLabel(item.mode)}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/35 px-3 py-2">
                    <p className="font-mono uppercase tracking-[0.12em] text-[var(--faint)]">Pass</p>
                    <p className="mt-1 font-semibold text-[var(--foreground)]">{item.pass_score}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/35 px-3 py-2">
                    <p className="font-mono uppercase tracking-[0.12em] text-[var(--faint)]">Attempts</p>
                    <p className="mt-1 font-semibold text-[var(--foreground)]">{item.attempt_count ?? 0}</p>
                  </div>
                </div>

                <div className="mt-5 text-[12px] text-[var(--muted)]">Updated {formatDateTime(item.updated_at)}</div>

                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    disabled={item.status !== "PUBLISHED" || !item.public_url}
                    onClick={() => void copyLink(item)}
                    className="sim-transition rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-center text-[12px] font-semibold text-[var(--muted)] hover:bg-[var(--field)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {item.status !== "PUBLISHED" ? "Publish first" : copiedId === item.id ? "Copied" : "Copy link"}
                  </button>
                  <Link
                    href={`/org/vetting/${item.id}`}
                    className="sim-transition rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-center text-[12px] font-semibold text-[var(--muted)] hover:bg-[var(--field)] hover:text-[var(--foreground)]"
                  >
                    Open
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
