import Link from "next/link";

import { ASSIGNMENTS, assignmentSimulationKindLabel } from "../_lib/student-mock-data";

function statusLabel(s: (typeof ASSIGNMENTS)[0]["status"]) {
  switch (s) {
    case "pending":
      return "Pending";
    case "submitted":
      return "Submitted";
    case "graded":
      return "Graded";
    default:
      return s;
  }
}

function statusClass(s: (typeof ASSIGNMENTS)[0]["status"]) {
  switch (s) {
    case "pending":
      return "bg-amber-50 text-[#a16207]";
    case "submitted":
      return "bg-[var(--field)] text-[var(--muted)]";
    case "graded":
      return "bg-[#e6f4ea] text-[#166534]";
    default:
      return "bg-[var(--field)] text-[var(--muted)]";
  }
}

export default function AssignmentsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">
          Assigned simulations
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Each row is a simulation your instructor assigned — run the room by the due date, then complete any
          follow-up on the detail page. Preview data only.
        </p>
      </div>

      <ul className="space-y-3">
        {ASSIGNMENTS.map((a) => (
          <li key={a.id}>
            <Link
              href={`/assignments/${a.id}`}
              className="flex flex-col gap-3 rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-4 shadow-[0_4px_24px_-16px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_8px_32px_-16px_rgba(0,0,0,0.1)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-[#111111]">{a.title}</p>
                  <span className="rounded-full border border-[var(--rule)] bg-[var(--field)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--muted)]">
                    {assignmentSimulationKindLabel(a.kind)}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-[var(--muted)]">{a.cohort}</p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                  Due{" "}
                  <time dateTime={a.dueAt}>
                    {new Date(a.dueAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </time>{" "}
                  · {a.points} pts · max {a.maxAttempts} attempts · min score {a.minScorePercent}%
                </p>
              </div>
              <span
                className={`self-start rounded-full px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] sm:self-auto ${statusClass(a.status)}`}
              >
                {statusLabel(a.status)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
