"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LoadingAssessment, VettingPublicShell, formatDateTime, modeLabel } from "../../_components/vetting-public-ui";
import { type VettingAttempt, vettingPublic } from "../../_lib/vetting-client";

function resultTone(attempt: VettingAttempt): string {
  if (attempt.status === "COMPLETED" || attempt.status === "EVALUATED") {
    return "border-[#b8e8c4] bg-[var(--accent-soft)] text-[#166534]";
  }
  if (attempt.status === "IN_PROGRESS") return "border-amber-200 bg-[var(--warning-soft)] text-amber-950";
  return "border-[var(--rule)] bg-[var(--field)] text-[var(--muted)]";
}

export function VettingAttemptClient({
  attemptToken,
  completed,
}: {
  attemptToken: string;
  completed: boolean;
}) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<VettingAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const assessment = attempt?.assessment ?? null;
  const done = attempt?.status === "EVALUATED" || attempt?.status === "COMPLETED" || completed;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await vettingPublic.getAttempt(attemptToken);
    if (!res.ok) {
      setError(res.message);
      setAttempt(null);
    } else {
      setAttempt(res.data.attempt);
    }
    setLoading(false);
  }, [attemptToken]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const statusLabel = useMemo(() => {
    if (!attempt) return "Pending";
    if (attempt.status === "EVALUATED" || attempt.status === "COMPLETED") return "Submitted";
    if (attempt.status === "IN_PROGRESS") return "In progress";
    return attempt.status.toLowerCase().replace(/_/g, " ");
  }, [attempt]);

  async function start() {
    setStarting(true);
    setError(null);
    const res = await vettingPublic.startAttempt(attemptToken);
    if (!res.ok) {
      setError(res.message);
      setStarting(false);
      return;
    }
    router.push(`/vetting/session/${encodeURIComponent(attemptToken)}`);
  }

  if (loading) {
    return (
      <VettingPublicShell assessment={assessment}>
        <LoadingAssessment />
      </VettingPublicShell>
    );
  }

  if (!attempt || !assessment) {
    return (
      <VettingPublicShell>
        <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-[var(--warning-soft)] px-5 py-4 text-[14px] leading-6 text-amber-950">
          {error || "This vetting attempt is not available."}
        </div>
      </VettingPublicShell>
    );
  }

  return (
    <VettingPublicShell assessment={assessment}>
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">
                {modeLabel(assessment.mode)} assessment
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[var(--foreground)] sm:text-3xl">
                {assessment.title}
              </h1>
              <p className="mt-3 max-w-2xl text-[14px] leading-6 text-[var(--muted)]">
                {assessment.instructions || "Complete the scenario in one sitting. The organisation will receive the scored result."}
              </p>
            </div>
            <span className={`rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${resultTone(attempt)}`}>
              {statusLabel}
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/35 px-3 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">Candidate</p>
              <p className="mt-1 truncate text-[14px] font-semibold text-[var(--foreground)]">{attempt.candidate_name}</p>
            </div>
            <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/35 px-3 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">Email</p>
              <p className="mt-1 truncate text-[14px] font-semibold text-[var(--foreground)]">{attempt.candidate_email}</p>
            </div>
            <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/35 px-3 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">Expires</p>
              <p className="mt-1 truncate text-[14px] font-semibold text-[var(--foreground)]">{formatDateTime(attempt.expires_at)}</p>
            </div>
          </div>

          {done ? (
            <div className="mt-7 rounded-2xl border border-[var(--rule)] bg-[var(--surface-soft)] p-5">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">
                Completion
              </p>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-2xl font-semibold tracking-[-0.035em] text-[var(--foreground)]">Assessment submitted</p>
                  <p className="mt-1 text-[13px] text-[var(--muted)]">
                    Your response has been sent to the organisation. You can close this page.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--rule)] pt-6">
              <p className="max-w-md text-[13px] leading-6 text-[var(--muted)]">
                {attempt.locked_candidate_fields
                  ? "Your details were provided by the organisation, so you can go straight into the assessment."
                  : "Your candidate details are attached to this attempt."}
              </p>
              <button
                type="button"
                disabled={starting}
                onClick={() => void start()}
                className="sim-btn-accent px-6 py-3 font-mono text-[10px] uppercase"
              >
                {starting ? "Starting" : attempt.status === "IN_PROGRESS" ? "Resume" : "Start"}
              </button>
            </div>
          )}

          {error ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-[var(--warning-soft)] px-3 py-2 text-[13px] leading-5 text-amber-950">
              {error}
            </p>
          ) : null}
        </section>
      </div>
    </VettingPublicShell>
  );
}
