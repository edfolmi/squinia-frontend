"use client";

import { useEffect, useState } from "react";

import { LineChart, MetricCard, ProductCard, SectionHeading, type LineChartPoint } from "@/app/_components/product-ui";
import { StatusBanner } from "@/app/_components/status-block";
import { v1 } from "@/app/_lib/v1-client";

import { PageHeader, Panel, formatDate } from "./_components/admin-ui";

type Overview = {
  metrics: Record<string, number>;
  recent_activity: { kind: string; label: string; description?: string | null; created_at?: string | null }[];
};

function buildPlatformActivityTrend(metrics: Record<string, number>): LineChartPoint[] {
  const completed = metrics.completed_sessions ?? 0;
  const active = metrics.active_users ?? 0;
  const users = metrics.total_users ?? active;
  const labels = ["T-5", "T-4", "T-3", "T-2", "T-1", "Now"];
  return labels.map((label, index) => {
    const progress = labels.length === 1 ? 1 : index / (labels.length - 1);
    return {
      label,
      value: Math.round(completed * (0.58 + progress * 0.42)),
      secondary: Math.round(Math.max(active, users * 0.16) * (0.7 + progress * 0.3)),
    };
  });
}

export function AdminOverviewClient() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await v1.get<Overview>("platform/overview");
      if (res.ok) setData(res.data);
      else setError(res.message);
      setLoading(false);
    })();
  }, []);

  const metrics = data?.metrics ?? {};

  return (
    <div className="space-y-7">
      <PageHeader
        label="Platform operations"
        title="Owner command center"
        description="Monitor users, tenants, learner activity, and platform catalog readiness from one read-only surface."
      />
      {error ? <StatusBanner message={error} /> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Users" value={loading ? "--" : metrics.total_users ?? 0} detail={`${metrics.active_users ?? 0} active`} />
        <MetricCard label="Organizations" value={loading ? "--" : metrics.organizations ?? 0} detail={`${metrics.total_tenants ?? 0} total tenants`} />
        <MetricCard label="Individual learners" value={loading ? "--" : metrics.individual_learners ?? 0} detail={`${metrics.cohort_students ?? 0} cohort students`} />
        <MetricCard label="Completed evaluations" value={loading ? "--" : metrics.completed_evaluations ?? 0} detail={`${metrics.completed_sessions ?? 0} completed sessions`} tone="success" />
      </div>
      <ProductCard>
        <SectionHeading
          eyebrow="Platform pulse"
          title="Usage and completion trend"
          description="Deterministic trend projection from aggregate metrics until platform time-series metrics are exposed."
        />
        <div className="mt-5">
          <LineChart
            points={buildPlatformActivityTrend(metrics)}
            ariaLabel="Platform completed sessions and active users trend"
            height={180}
            valueSuffix=""
            secondaryLabel="Active users"
          />
        </div>
      </ProductCard>
      <Panel title="Recent platform activity">
        {loading ? (
          <p className="text-[14px] text-[var(--muted)]">Loading activity...</p>
        ) : data?.recent_activity.length ? (
          <ul className="divide-y divide-[var(--rule)]">
            {data.recent_activity.map((item, index) => (
              <li key={`${item.kind}-${item.label}-${index}`} className="flex items-center justify-between gap-4 py-3 first:pt-0">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-[#111111]">{item.label}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                    {item.kind} {item.description ? `- ${item.description}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-[12px] text-[var(--muted)]">{formatDate(item.created_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] text-[var(--muted)]">No recent activity yet.</p>
        )}
      </Panel>
    </div>
  );
}
