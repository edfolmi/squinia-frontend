"use client";

import { useEffect, useState } from "react";

import { StatusBanner } from "@/app/_components/status-block";
import { v1 } from "@/app/_lib/v1-client";

import { KpiCard, PageHeader, Panel, Pill, formatDate } from "../_components/admin-ui";

type CatalogStatus = {
  catalog_exists: boolean;
  catalog_tenants: { id: string; name: string; slug: string; is_active: boolean; created_at?: string | null }[];
  published_scenarios: number;
  by_difficulty: Record<string, number>;
  missing_rubric_count: number;
  missing_content_count: number;
};

export function AdminCatalogClient() {
  const [data, setData] = useState<CatalogStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await v1.get<CatalogStatus>("platform/catalog/status");
      if (res.ok) setData(res.data);
      else setError(res.message);
    })();
  }, []);

  return (
    <div className="space-y-7">
      <PageHeader
        label="Squinia catalog"
        title="Catalog readiness"
        description="Read-only view of the platform scenario catalog that powers individual learner recommendations."
      />
      {error ? <StatusBanner message={error} /> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Catalog tenant" value={data ? (data.catalog_exists ? "Ready" : "Missing") : "--"} detail={`${data?.catalog_tenants.length ?? 0} catalog tenants`} />
        <KpiCard label="Published scenarios" value={data?.published_scenarios ?? "--"} />
        <KpiCard label="Missing rubric" value={data?.missing_rubric_count ?? "--"} />
        <KpiCard label="Missing content" value={data?.missing_content_count ?? "--"} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Published scenarios by difficulty">
          {data ? (
            <ul className="space-y-3">
              {Object.entries(data.by_difficulty).map(([difficulty, count]) => (
                <li key={difficulty} className="flex items-center justify-between rounded-lg border border-[var(--rule)] bg-[var(--field)]/40 px-4 py-3">
                  <Pill>{difficulty}</Pill>
                  <span className="text-[14px] font-semibold">{count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-[var(--muted)]">Loading catalog status...</p>
          )}
        </Panel>
        <Panel title="Catalog tenants">
          {data?.catalog_tenants.length ? (
            <ul className="divide-y divide-[var(--rule)]">
              {data.catalog_tenants.map((tenant) => (
                <li key={tenant.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <div>
                    <p className="font-medium text-[#111111]">{tenant.name}</p>
                    <p className="text-[12px] text-[var(--muted)]">{tenant.slug} - {formatDate(tenant.created_at)}</p>
                  </div>
                  <Pill>{tenant.is_active ? "active" : "inactive"}</Pill>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] leading-6 text-[var(--muted)]">
              No `platform_catalog` tenant exists yet. The next milestone should add catalog authoring and seeding.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
