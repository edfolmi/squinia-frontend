"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { v1 } from "@/app/_lib/v1-client";

import type { RubricItem } from "./rubric-editor";
import { RubricEditor } from "./rubric-editor";
import type { RubricBoardApi } from "../_lib/rubrics";
import { sortedRubricItems } from "../_lib/rubrics";

type Props = {
  mode: "new" | "edit";
  initial?: RubricBoardApi | null;
};

type SaveResult = { rubric: RubricBoardApi };

function defaultItems(): RubricItem[] {
  return [
    { id: "r1", label: "Objective framing", description: "", weight: 25, order: 0 },
    { id: "r2", label: "Evidence use", description: "", weight: 25, order: 1 },
    { id: "r3", label: "Tone and clarity", description: "", weight: 25, order: 2 },
    { id: "r4", label: "Next steps", description: "", weight: 25, order: 3 },
  ];
}

function toFormItems(board?: RubricBoardApi | null): RubricItem[] {
  if (!board?.items?.length) return defaultItems();
  return sortedRubricItems(board.items).map((item, index) => ({
    id: item.id,
    label: item.criterion,
    description: item.description ?? "",
    weight: item.weight,
    order: typeof item.sort_order === "number" ? item.sort_order : index,
  }));
}

function toPayloadItems(items: RubricItem[]) {
  return [...items]
    .sort((a, b) => a.order - b.order)
    .map((item, sort_order) => ({
      criterion: item.label,
      description: item.description || undefined,
      max_score: 10,
      weight: item.weight,
      sort_order,
    }));
}

export function RubricBoardForm({ mode, initial }: Props) {
  const router = useRouter();
  const base = useMemo(() => initial ?? null, [initial]);
  const [name, setName] = useState(base?.name ?? "");
  const [description, setDescription] = useState(base?.description ?? "");
  const [isDefault, setIsDefault] = useState(Boolean(base?.is_default));
  const [items, setItems] = useState<RubricItem[]>(toFormItems(base));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const payload = {
      name,
      description: description || undefined,
      is_default: isDefault,
      items: toPayloadItems(items),
    };
    try {
      const res =
        mode === "new"
          ? await v1.post<SaveResult>("rubrics", payload)
          : await v1.patch<SaveResult>(`rubrics/${base?.id}`, payload);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      if (mode === "new") {
        router.push(`/org/rubrics/${res.data.rubric.id}/edit`);
      } else {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">{error}</p>
      ) : null}

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="rubricName" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Name
            </label>
            <input
              id="rubricName"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Leadership communication rubric"
              className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-3 self-end pb-3">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="h-4 w-4 rounded border-[var(--rule-strong)]" />
            <span className="text-[14px] text-[var(--muted)]">Use as default for new scenarios</span>
          </label>
          <div className="sm:col-span-2">
            <label htmlFor="rubricDescription" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Description
            </label>
            <textarea
              id="rubricDescription"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="When this rubric should be used."
              className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[14px] leading-relaxed text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <RubricEditor items={items} onChange={setItems} />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={submitting} className="sim-btn-accent px-6 py-3 font-mono text-[10px] uppercase disabled:opacity-50">
          {submitting ? "Saving..." : mode === "new" ? "Create rubric" : "Save changes"}
        </button>
        {saved ? <p className="text-[13px] text-[#166534]">Changes saved.</p> : null}
      </div>
    </form>
  );
}
