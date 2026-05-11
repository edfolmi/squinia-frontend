"use client";

import Link from "next/link";
import { useState } from "react";

import { LineChart } from "@/app/_components/product-ui";
import { parseAttemptSessionId } from "../../simulation/_lib/attempt-id";
import { simulationReportHref } from "@/app/_lib/simulation-mappers";

import { type RecentSessionRow } from "../_lib/student-mock-data";
import { groupRecentSessionsByScenario } from "./group-recent-sessions";

type Props = {
  rows: RecentSessionRow[];
};

export function SessionsTable({ rows }: Props) {
  const groups = groupRecentSessionsByScenario(rows);
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--rule)] bg-[var(--surface)] shadow-[0_6px_36px_-18px_rgba(17,17,17,0.08)]">
      <table className="w-full text-left text-[14px]">
        <thead>
          <tr className="border-b border-[var(--rule)] bg-[var(--field)]/60 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
            <th className="px-4 py-3 font-medium">Scenario</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">Type</th>
            <th className="px-4 py-3 font-medium">Latest</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">Last ended</th>
            <th className="px-4 py-3 font-medium"> </th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const latest = g.attempts[0];
            const isOpen = openKey === g.groupKey;
            const scores = g.attempts.map((a) => a.score).filter((s): s is number => s != null);
            const best = scores.length ? Math.max(...scores) : 0;

            return (
              <SessionGroupRows
                key={g.groupKey}
                groupKey={g.groupKey}
                scenarioTitle={g.scenarioTitle}
                kind={g.kind}
                latest={latest}
                best={best}
                attemptCount={g.attempts.length}
                isOpen={isOpen}
                onToggle={() => setOpenKey(isOpen ? null : g.groupKey)}
                attempts={g.attempts}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SessionGroupRows({
  groupKey,
  scenarioTitle,
  kind,
  latest,
  best,
  attemptCount,
  isOpen,
  onToggle,
  attempts,
}: {
  groupKey: string;
  scenarioTitle: string;
  kind: RecentSessionRow["kind"];
  latest: RecentSessionRow | undefined;
  best: number;
  attemptCount: number;
  isOpen: boolean;
  onToggle: () => void;
  attempts: RecentSessionRow[];
}) {
  return (
    <>
      <tr className="border-b border-[var(--rule)] last:border-0">
        <td className="px-4 py-4">
          <button
            type="button"
            onClick={onToggle}
            className="group flex w-full max-w-[min(100%,28rem)] items-start gap-2 rounded-lg text-left transition-colors hover:bg-[var(--field)]/80 -mx-1 px-1 py-0.5"
            aria-expanded={isOpen}
            aria-controls={`session-attempts-${safeDomId(groupKey)}`}
            id={`session-trigger-${safeDomId(groupKey)}`}
          >
            <Chevron
              className={`mt-0.5 shrink-0 text-[var(--faint)] transition-transform group-hover:text-[var(--muted)] ${isOpen ? "rotate-90" : ""}`}
            />
            <span className="min-w-0">
              <span className="font-medium text-[#111111]">{scenarioTitle}</span>
              <span className="mt-1 block font-mono text-[10px] text-[var(--faint)]">
                {attemptCount} attempt{attemptCount === 1 ? "" : "s"}
                {attemptCount > 1 && latest?.score != null && best !== latest.score ? ` · best ${best}` : null}
              </span>
              <p className="mt-0.5 font-mono text-[10px] text-[var(--faint)] sm:hidden">{kind}</p>
            </span>
          </button>
        </td>
        <td className="hidden px-4 py-4 capitalize text-[var(--muted)] sm:table-cell">{kind}</td>
        <td className="px-4 py-4 font-mono tabular-nums text-[#166534]">
          {latest?.score != null ? latest.score : "—"}
        </td>
        <td className="hidden px-4 py-4 text-[var(--muted)] md:table-cell">
          {latest
            ? new Date(latest.endedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—"}
        </td>
        <td className="px-4 py-4 text-right align-top">
          {latest ? (
            <Link
              href={simulationReportHref(latest.sessionId, latest.kind)}
              onClick={(e) => e.stopPropagation()}
              className="inline-block rounded-xl border border-[var(--rule-strong)] px-3 py-1.5 text-[12px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--field)] hover:text-[#111111]"
            >
              Latest report
            </Link>
          ) : null}
        </td>
      </tr>
      {isOpen ? (
        <tr className="border-b border-[var(--rule)] bg-[var(--field)]/40 last:border-0">
          <td colSpan={5} className="px-4 pb-4 pt-0">
            <div
              id={`session-attempts-${safeDomId(groupKey)}`}
              role="region"
              aria-labelledby={`session-trigger-${safeDomId(groupKey)}`}
              className="ml-7 border-l border-[var(--rule)] pl-4"
            >
              <p className="pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--faint)]">
                Score progression
              </p>
              <div className="mb-4 rounded-xl border border-[var(--rule)] bg-[var(--surface)] px-3 py-3">
                <LineChart
                  points={[...attempts].reverse().map((row, index) => ({
                    label: `Attempt ${index + 1}`,
                    value: row.score,
                  }))}
                  ariaLabel={`Score progression for ${scenarioTitle}`}
                  height={130}
                />
              </div>
              <p className="pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--faint)]">
                Reports
              </p>
              <ul className="space-y-2">
                {attempts.map((row, idx) => {
                  const attempt = parseAttemptSessionId(row.sessionId);
                  const attemptShort = attempt.attemptToken?.slice(-8) ?? "—";
                  const label =
                    attempt.attemptToken == null
                      ? `Attempt ${attempts.length - idx}`
                      : `Attempt · ${attemptShort}`;
                  return (
                    <li
                      key={row.sessionId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--rule)] bg-[var(--surface)] px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] text-[#111111]">{label}</p>
                        <p className="mt-0.5 text-[12px] text-[var(--muted)]">
                          Score{" "}
                          <span className="font-mono tabular-nums text-[#166534]">
                            {row.score != null ? row.score : "—"}
                          </span>
                          <span className="mx-1.5 text-[var(--faint)]">·</span>
                          {new Date(row.endedAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Link
                        href={simulationReportHref(row.sessionId, row.kind)}
                        className="shrink-0 rounded-lg border border-[var(--rule-strong)] px-3 py-1.5 text-[12px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--field)] hover:text-[#111111]"
                      >
                        Open report
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function safeDomId(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
