"use client";

import { useMemo } from "react";

export type RubricItem = { id: string; label: string; description: string; weight: number; order: number; maxScore?: number };

type Props = {
  items: RubricItem[];
  onChange: (next: RubricItem[]) => void;
};

function reorder(list: RubricItem[], from: number, to: number): RubricItem[] {
  const copy = [...list].sort((a, b) => a.order - b.order);
  const [removed] = copy.splice(from, 1);
  if (!removed) return list;
  copy.splice(to, 0, removed);
  return copy.map((item, order) => ({ ...item, order }));
}

export function RubricEditor({ items, onChange }: Props) {
  const sorted = useMemo(() => [...items].sort((a, b) => a.order - b.order), [items]);
  const totalWeight = sorted.reduce((s, r) => s + r.weight, 0) || 1;

  function update(id: string, patch: Partial<RubricItem>) {
    onChange(items.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function remove(id: string) {
    const next = items.filter((r) => r.id !== id).map((r, i) => ({ ...r, order: i }));
    onChange(next);
  }

  function add() {
    const id = `r-${Date.now().toString(36)}`;
    onChange([...items, { id, label: "New criterion", description: "", weight: 10, order: items.length }]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">Rubric</h3>
        <p className="font-mono text-[11px] text-[var(--muted)]">
          Total weight <span className="tabular-nums text-[#111111]">{totalWeight}</span>
        </p>
      </div>
      <ul className="space-y-3">
        {sorted.map((r, idx) => {
          const pct = Math.round((r.weight / totalWeight) * 100);
          return (
            <li key={r.id} className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/40 p-4">
              <div className="flex flex-wrap items-start gap-2">
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => onChange(reorder(sorted, idx, idx - 1))}
                    className="rounded border border-[var(--rule-strong)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)] hover:bg-[var(--surface)] disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={idx === sorted.length - 1}
                    onClick={() => onChange(reorder(sorted, idx, idx + 1))}
                    className="rounded border border-[var(--rule-strong)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)] hover:bg-[var(--surface)] disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    value={r.label}
                    onChange={(e) => update(r.id, { label: e.target.value })}
                    className="w-full rounded-lg border border-[var(--rule-strong)] bg-[var(--surface)] px-3 py-2 text-[14px] font-medium text-[#111111] outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)]"
                    placeholder="Criterion title"
                  />
                  <textarea
                    value={r.description}
                    onChange={(e) => update(r.id, { description: e.target.value })}
                    rows={2}
                    className="w-full resize-y rounded-lg border border-[var(--rule-strong)] bg-[var(--surface)] px-3 py-2 text-[13px] leading-relaxed text-[var(--muted)] outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)]"
                    placeholder="What evaluators look for"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 font-mono text-[11px] text-[var(--muted)]">
                      Weight
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={r.weight}
                        onChange={(e) => update(r.id, { weight: Number(e.target.value) || 1 })}
                        className="w-20 rounded-lg border border-[var(--rule-strong)] bg-[var(--surface)] px-2 py-1.5 text-[13px] tabular-nums outline-none"
                      />
                    </label>
                    <span className="text-[11px] text-[var(--faint)]">~{pct}% of total</span>
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      className="ml-auto text-[12px] font-medium text-[#b45309] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={add}
        className="rounded-xl border border-dashed border-[var(--rule-strong)] px-4 py-2.5 text-[13px] font-medium text-[var(--muted)] hover:border-[var(--accent)] hover:text-[#111111]"
      >
        Add rubric item
      </button>
    </div>
  );
}
