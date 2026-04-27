"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { v1, type ItemsData } from "@/app/_lib/v1-client";

import { PersonaAvatar } from "../_components/persona-avatar";
import type { AgentPersonaApi } from "../_lib/agent-personas";

export function PersonasListClient() {
  const [items, setItems] = useState<AgentPersonaApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await v1.get<ItemsData<AgentPersonaApi>>("agent-personas");
    if (!res.ok) {
      setError(res.message);
      setItems([]);
    } else {
      setItems(res.data.items ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Agent personas</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
            Create reusable people for scenarios so learners meet a consistent name, role, voice, and avatar.
          </p>
        </div>
        <Link href="/org/personas/new" className="sim-btn-accent shrink-0 self-start px-5 py-2.5 text-center font-mono text-[10px] uppercase sm:self-auto">
          New persona
        </Link>
      </div>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-[14px] text-[var(--muted)]">Loading...</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-6">
          <p className="text-[14px] text-[var(--muted)]">No personas yet. Create one and reuse it across scenarios.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((p) => (
            <li key={p.id}>
              <div className="flex flex-col gap-4 rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[0_4px_24px_-16px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex min-w-0 items-center gap-4">
                  <PersonaAvatar name={p.name} src={p.avatar_url} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#111111]">{p.name}</h2>
                      {p.is_default ? (
                        <span className="rounded-full bg-[#e6f4ea] px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[#166534]">
                          Default
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[14px] text-[var(--muted)]">{p.title || "Simulation partner"}</p>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                      {p.gender?.replace("_", " ").toLowerCase() || "unspecified"} voice profile
                    </p>
                  </div>
                </div>
                <Link
                  href={`/org/personas/${p.id}/edit`}
                  className="shrink-0 rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-center text-[12px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--field)] hover:text-[#111111]"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
