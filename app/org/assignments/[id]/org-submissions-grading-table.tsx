"use client";

import { useState } from "react";

type Row = {
  id: string;
  memberName: string;
  submittedAt: string;
  reportScore: number | null;
  notes: string;
  gradeManual: number | null;
  status: "pending" | "graded";
};

type Props = {
  submissions: Row[];
};

export function OrgSubmissionsGradingTable({ submissions }: Props) {
  const [rows, setRows] = useState(submissions);

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--rule)]">
      <table className="w-full min-w-[720px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-[var(--rule)] bg-[var(--field)]/60 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
            <th className="px-3 py-3 font-medium">Student</th>
            <th className="px-3 py-3 font-medium">Submitted</th>
            <th className="px-3 py-3 font-medium">Report</th>
            <th className="px-3 py-3 font-medium">Manual grade</th>
            <th className="px-3 py-3 font-medium">Notes</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium"> </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s, idx) => (
            <tr key={s.id} className="border-b border-[var(--rule)] last:border-0">
              <td className="px-3 py-3 font-medium text-[#111111]">{s.memberName}</td>
              <td className="px-3 py-3 text-[var(--muted)]">
                {new Date(s.submittedAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-3 py-3 font-mono tabular-nums text-[#166534]">
                {s.reportScore != null ? `${s.reportScore}%` : "—"}
              </td>
              <td className="px-3 py-3">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={s.gradeManual ?? ""}
                  placeholder="—"
                  onChange={(e) => {
                    const v = e.target.value === "" ? null : Number(e.target.value);
                    setRows((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, gradeManual: v } : r)),
                    );
                  }}
                  className="w-20 rounded-lg border border-[var(--rule-strong)] bg-[var(--surface)] px-2 py-1.5 font-mono text-[13px] outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)]"
                />
              </td>
              <td className="px-3 py-3">
                <input
                  value={s.notes}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, notes: v } : r)));
                  }}
                  className="min-w-[140px] rounded-lg border border-[var(--rule-strong)] bg-[var(--surface)] px-2 py-1.5 text-[13px] outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)]"
                />
              </td>
              <td className="px-3 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] ${
                    s.status === "graded" ? "bg-[#e6f4ea] text-[#166534]" : "bg-amber-50 text-[#a16207]"
                  }`}
                >
                  {s.status}
                </span>
              </td>
              <td className="px-3 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setRows((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, status: "graded" as const } : r)),
                    );
                  }}
                  className="rounded-lg border border-[var(--rule-strong)] px-3 py-1.5 text-[11px] font-medium text-[var(--muted)] hover:bg-[var(--field)] hover:text-[#111111]"
                >
                  Mark graded
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-[var(--rule)] px-3 py-2 text-[11px] text-[var(--muted)]">
        Preview — grades are not sent to a server. Status chips are local only after you click Mark graded.
      </p>
    </div>
  );
}
