"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { v1 } from "@/app/_lib/v1-client";

import { RubricBoardForm } from "../../../_components/rubric-board-form";
import type { RubricBoardApi } from "../../../_lib/rubrics";

export function RubricEditPageClient() {
  const params = useParams<{ rubricId: string }>();
  const rubricId = params.rubricId;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState<RubricBoardApi | null>(null);

  const load = useCallback(async () => {
    if (!rubricId) return;
    setLoading(true);
    setError(null);
    const res = await v1.get<{ rubric: RubricBoardApi }>(`rubrics/${rubricId}`);
    if (!res.ok) {
      setError(res.message);
      setInitial(null);
    } else {
      setInitial(res.data.rubric);
    }
    setLoading(false);
  }, [rubricId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  if (!rubricId) return <p className="text-[14px] text-[var(--muted)]">Missing rubric id.</p>;
  if (loading) return <p className="mx-auto max-w-3xl text-[14px] text-[var(--muted)]">Loading...</p>;
  if (!initial) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <p className="text-amber-900">{error ?? "Rubric board not found."}</p>
        <Link href="/org/rubrics" className="underline">
          Back to rubrics
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/org/rubrics"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
        >
          Rubrics
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Edit rubric board</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">{initial.name}</p>
      </div>
      <RubricBoardForm mode="edit" initial={initial} />
    </div>
  );
}
