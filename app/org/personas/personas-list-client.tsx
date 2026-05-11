"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ProductPageHeader, StatusBadge } from "@/app/_components/product-ui";
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
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ProductPageHeader
        eyebrow="Scenario studio"
        title="Agent personas"
        description="Create reusable people for scenarios so learners meet a consistent name, role, voice, and avatar."
        action={
          <Link href="/org/personas/new" className="sim-btn-accent shrink-0 self-start px-5 py-2.5 text-center font-mono text-[10px] uppercase sm:self-auto">
            New persona
          </Link>
        }
      />

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
        <ul className="grid gap-4 lg:grid-cols-2">
          {items.map((p) => (
            <li key={p.id}>
              <div className="flex h-full flex-col gap-5 rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
                <div className="flex min-w-0 items-center gap-4">
                  <PersonaAvatar name={p.name} src={p.avatar_url} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#111111]">{p.name}</h2>
                      {p.is_default ? <StatusBadge tone="success">Default</StatusBadge> : null}
                    </div>
                    <p className="mt-1 text-[14px] text-[var(--muted)]">{p.title || "Simulation partner"}</p>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                      {p.gender?.replace("_", " ").toLowerCase() || "unspecified"} voice profile
                    </p>
                  </div>
                </div>
                <div className="mt-auto flex justify-end border-t border-[var(--rule)] pt-4">
                  <Link
                    href={`/org/personas/${p.id}/edit`}
                    className="sim-transition shrink-0 rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-center text-[12px] font-semibold text-[var(--muted)] hover:bg-[var(--field)] hover:text-[var(--foreground)]"
                  >
                    Edit persona
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
