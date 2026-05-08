"use client";

import { useEffect, useState } from "react";

import { StatusBanner } from "@/app/_components/status-block";
import { v1 } from "@/app/_lib/v1-client";

import { AdminLink, PageHeader, Panel, Pill, formatDate } from "../_components/admin-ui";

type PlatformUser = {
  id: string;
  email: string;
  full_name: string;
  platform_role: string;
  is_active: boolean;
  is_verified: boolean;
  memberships_count: number;
  last_login_at?: string | null;
  created_at?: string | null;
};

type UserList = { items: PlatformUser[]; total: number; page: number; limit: number };

export function AdminUsersClient() {
  const [data, setData] = useState<UserList | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      const res = await v1.get<UserList>("platform/users", { page: 1, limit: 50, search: query || undefined });
      if (res.ok) setData(res.data);
      else setError(res.message);
      setLoading(false);
    })();
  }, [query]);

  return (
    <div className="space-y-7">
      <PageHeader label="Identity" title="Users" description="Search platform accounts and inspect memberships without exposing sensitive credentials." />
      {error ? <StatusBanner message={error} /> : null}
      <Panel
        title={`${data?.total ?? 0} users`}
        action={
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(search.trim());
            }}
            className="flex gap-2"
          >
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users"
              className="w-48 rounded-lg border border-[var(--rule-strong)] bg-[var(--field)] px-3 py-2 text-[13px] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
            <button type="submit" className="sim-btn-accent px-4 py-2 font-mono text-[10px] uppercase">
              Search
            </button>
          </form>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-[13px]">
            <thead className="border-b border-[var(--rule)] font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--faint)]">
              <tr>
                <th className="py-3 pr-4 font-medium">User</th>
                <th className="py-3 pr-4 font-medium">Role</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium">Memberships</th>
                <th className="py-3 pr-4 font-medium">Last login</th>
                <th className="py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule)]">
              {loading ? (
                <tr><td colSpan={6} className="py-6 text-[var(--muted)]">Loading users...</td></tr>
              ) : data?.items.length ? (
                data.items.map((user) => (
                  <tr key={user.id}>
                    <td className="py-3 pr-4">
                      <AdminLink href={`/admin/users/${user.id}`}>{user.full_name}</AdminLink>
                      <p className="mt-0.5 text-[12px] text-[var(--muted)]">{user.email}</p>
                    </td>
                    <td className="py-3 pr-4"><Pill>{user.platform_role}</Pill></td>
                    <td className="py-3 pr-4 text-[var(--muted)]">{user.is_active ? "Active" : "Inactive"} / {user.is_verified ? "Verified" : "Unverified"}</td>
                    <td className="py-3 pr-4 text-[var(--muted)]">{user.memberships_count}</td>
                    <td className="py-3 pr-4 text-[var(--muted)]">{formatDate(user.last_login_at)}</td>
                    <td className="py-3 text-[var(--muted)]">{formatDate(user.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="py-6 text-[var(--muted)]">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
