"use client";

import { useEffect, useState } from "react";

import { StatusBanner } from "@/app/_components/status-block";
import { v1 } from "@/app/_lib/v1-client";

import { AdminLink, PageHeader, Panel, Pill, formatDate } from "../_components/admin-ui";

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  account_kind: string;
  is_active: boolean;
  owner?: { email: string; full_name: string } | null;
  staff_count: number;
  student_count: number;
  session_count: number;
  created_at?: string | null;
};

type TenantList = { items: TenantRow[]; total: number; page: number; limit: number };

export function AdminOrganizationsClient() {
  const [data, setData] = useState<TenantList | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      const res = await v1.get<TenantList>("platform/tenants", { page: 1, limit: 50, search: query || undefined, account_kind: kind || undefined });
      if (res.ok) setData(res.data);
      else setError(res.message);
      setLoading(false);
    })();
  }, [query, kind]);

  return (
    <div className="space-y-7">
      <PageHeader label="Tenancy" title="Organizations" description="Inspect organization, individual learner, and platform catalog tenants from a platform-owner view." />
      {error ? <StatusBanner message={error} /> : null}
      <Panel
        title={`${data?.total ?? 0} tenants`}
        action={
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(search.trim());
            }}
            className="flex flex-wrap gap-2"
          >
            <select value={kind} onChange={(event) => setKind(event.target.value)} className="rounded-lg border border-[var(--rule-strong)] bg-[var(--field)] px-3 py-2 text-[13px]">
              <option value="">All kinds</option>
              <option value="organization">Organization</option>
              <option value="individual">Individual</option>
              <option value="platform_catalog">Catalog</option>
              <option value="personal_bootstrap">Bootstrap</option>
            </select>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tenants" className="w-48 rounded-lg border border-[var(--rule-strong)] bg-[var(--field)] px-3 py-2 text-[13px]" />
            <button type="submit" className="sim-btn-accent px-4 py-2 font-mono text-[10px] uppercase">Search</button>
          </form>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-[13px]">
            <thead className="border-b border-[var(--rule)] font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--faint)]">
              <tr>
                <th className="py-3 pr-4 font-medium">Tenant</th>
                <th className="py-3 pr-4 font-medium">Kind</th>
                <th className="py-3 pr-4 font-medium">Owner</th>
                <th className="py-3 pr-4 font-medium">Staff</th>
                <th className="py-3 pr-4 font-medium">Students</th>
                <th className="py-3 pr-4 font-medium">Sessions</th>
                <th className="py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule)]">
              {loading ? (
                <tr><td colSpan={7} className="py-6 text-[var(--muted)]">Loading tenants...</td></tr>
              ) : data?.items.length ? (
                data.items.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="py-3 pr-4">
                      <AdminLink href={`/admin/organizations/${tenant.id}`}>{tenant.name}</AdminLink>
                      <p className="mt-0.5 text-[12px] text-[var(--muted)]">{tenant.slug} - {tenant.plan}</p>
                    </td>
                    <td className="py-3 pr-4"><Pill>{tenant.account_kind}</Pill></td>
                    <td className="py-3 pr-4 text-[var(--muted)]">{tenant.owner?.email ?? "--"}</td>
                    <td className="py-3 pr-4 text-[var(--muted)]">{tenant.staff_count}</td>
                    <td className="py-3 pr-4 text-[var(--muted)]">{tenant.student_count}</td>
                    <td className="py-3 pr-4 text-[var(--muted)]">{tenant.session_count}</td>
                    <td className="py-3 text-[var(--muted)]">{formatDate(tenant.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="py-6 text-[var(--muted)]">No tenants found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
