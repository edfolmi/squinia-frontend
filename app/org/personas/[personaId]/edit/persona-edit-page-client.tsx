"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { v1 } from "@/app/_lib/v1-client";

import { AgentPersonaForm } from "../../../_components/agent-persona-form";
import type { AgentPersonaApi } from "../../../_lib/agent-personas";

export function PersonaEditPageClient() {
  const params = useParams<{ personaId: string }>();
  const personaId = params.personaId;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState<AgentPersonaApi | null>(null);

  const load = useCallback(async () => {
    if (!personaId) return;
    setLoading(true);
    setError(null);
    const res = await v1.get<{ persona: AgentPersonaApi }>(`agent-personas/${personaId}`);
    if (!res.ok) {
      setError(res.message);
      setInitial(null);
    } else {
      setInitial(res.data.persona);
    }
    setLoading(false);
  }, [personaId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  if (!personaId) return <p className="text-[14px] text-[var(--muted)]">Missing persona id.</p>;
  if (loading) return <p className="mx-auto max-w-3xl text-[14px] text-[var(--muted)]">Loading...</p>;
  if (!initial) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <p className="text-amber-900">{error ?? "Persona not found."}</p>
        <Link href="/org/personas" className="underline">
          Back to personas
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/org/personas"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
        >
          Personas
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Edit persona</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">{initial.name}</p>
      </div>
      <AgentPersonaForm mode="edit" initial={initial} />
    </div>
  );
}
