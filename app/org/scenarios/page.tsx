import Link from "next/link";

import { ORG_SCENARIOS } from "../_lib/org-mock-data";

export default function OrgScenariosPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Scenario library</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
            Author simulations with roles, difficulty, room config, and weighted rubrics. Operators curate what
            learners see per tenant.
          </p>
        </div>
        <Link
          href="/org/scenarios/new"
          className="sim-btn-accent shrink-0 self-start px-5 py-2.5 text-center font-mono text-[10px] uppercase sm:self-auto"
        >
          New scenario
        </Link>
      </div>

      <ul className="space-y-3">
        {ORG_SCENARIOS.map((s) => (
          <li key={s.id}>
            <div className="flex flex-col gap-3 rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[0_4px_24px_-16px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#111111]">{s.title}</h2>
                  <span className="rounded-full border border-[var(--rule)] bg-[var(--field)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--muted)]">
                    {s.kind}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] ${
                      s.published ? "bg-[#e6f4ea] text-[#166534]" : "bg-amber-50 text-[#a16207]"
                    }`}
                  >
                    {s.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="mt-1 text-[14px] text-[var(--muted)]">{s.summary}</p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                  {s.difficulty} · {s.estMinutes} min · {s.rubric.length} rubric items · updated{" "}
                  {new Date(s.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <Link
                href={`/org/scenarios/${s.id}/edit`}
                className="shrink-0 rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-center text-[12px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--field)] hover:text-[#111111]"
              >
                Edit
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
