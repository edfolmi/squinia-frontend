"use client";

import { useEffect, useState } from "react";

import { StatusBanner } from "@/app/_components/status-block";
import { v1 } from "@/app/_lib/v1-client";

import { KpiCard, PageHeader, Panel, Pill, formatDate } from "../../_components/admin-ui";

type TenantDetail = {
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    account_kind: string;
    is_active: boolean;
    billing_email?: string | null;
    owner?: { email: string; full_name: string } | null;
    branding?: { logo_url?: string | null; primary_color?: string | null };
    created_at?: string | null;
  };
  summary: Record<string, number>;
  cohorts: { id: string; name: string; status: string; created_at?: string | null }[];
  scenarios: { id: string; title: string; status: string; difficulty: string; created_at?: string | null }[];
  recent_sessions: { id: string; status: string; mode: string; created_at?: string | null; ended_at?: string | null }[];
};

export function AdminOrganizationDetailClient({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<TenantDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await v1.get<TenantDetail>(`platform/tenants/${tenantId}`);
      if (res.ok) setData(res.data);
      else setError(res.message);
    })();
  }, [tenantId]);

  return (
    <div className="space-y-7">
      <PageHeader label="Tenant detail" title={data?.tenant.name ?? "Loading tenant"} description={data?.tenant.slug ?? "Inspect tenant health, content, and activity."} />
      {error ? <StatusBanner message={error} /> : null}
      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Cohorts" value={data.summary.cohorts ?? 0} />
            <KpiCard label="Scenarios" value={data.summary.scenarios ?? 0} detail={`${data.summary.published_scenarios ?? 0} published`} />
            <KpiCard label="Completed sessions" value={data.summary.completed_sessions ?? 0} />
            <KpiCard label="Evaluations" value={data.summary.completed_evaluations ?? 0} />
          </div>
          <Panel title="Tenant profile">
            <div className="grid gap-4 text-[13px] text-[var(--muted)] sm:grid-cols-2">
              <p><span className="font-medium text-[#111111]">Kind:</span> <Pill>{data.tenant.account_kind}</Pill></p>
              <p><span className="font-medium text-[#111111]">Plan:</span> {data.tenant.plan}</p>
              <p><span className="font-medium text-[#111111]">Owner:</span> {data.tenant.owner?.email ?? "--"}</p>
              <p><span className="font-medium text-[#111111]">Billing:</span> {data.tenant.billing_email ?? "--"}</p>
              <p><span className="font-medium text-[#111111]">Active:</span> {data.tenant.is_active ? "Yes" : "No"}</p>
              <p><span className="font-medium text-[#111111]">Created:</span> {formatDate(data.tenant.created_at)}</p>
            </div>
          </Panel>
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Recent cohorts">
              <SimpleList items={data.cohorts.map((c) => ({ title: c.name, detail: `${c.status} - ${formatDate(c.created_at)}` }))} empty="No cohorts." />
            </Panel>
            <Panel title="Recent scenarios">
              <SimpleList items={data.scenarios.map((s) => ({ title: s.title, detail: `${s.status} - ${s.difficulty}` }))} empty="No scenarios." />
            </Panel>
          </div>
          <Panel title="Recent sessions">
            <SimpleList items={data.recent_sessions.map((s) => ({ title: s.id, detail: `${s.mode} - ${s.status} - ${formatDate(s.created_at)}` }))} empty="No sessions." />
          </Panel>
        </>
      ) : null}
    </div>
  );
}

function SimpleList({ items, empty }: { items: { title: string; detail: string }[]; empty: string }) {
  if (!items.length) return <p className="text-[14px] text-[var(--muted)]">{empty}</p>;
  return (
    <ul className="divide-y divide-[var(--rule)]">
      {items.map((item) => (
        <li key={`${item.title}-${item.detail}`} className="py-3 first:pt-0">
          <p className="truncate text-[14px] font-medium text-[#111111]">{item.title}</p>
          <p className="mt-0.5 text-[12px] text-[var(--muted)]">{item.detail}</p>
        </li>
      ))}
    </ul>
  );
}
