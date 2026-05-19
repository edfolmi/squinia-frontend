"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { LoadingAssessment, PublicLogo, VettingPublicShell, modeLabel } from "../_components/vetting-public-ui";
import { type VettingAssessment, vettingPublic } from "../_lib/vetting-client";

export function VettingLandingClient({ publicSlug }: { publicSlug: string }) {
  const router = useRouter();
  const [assessment, setAssessment] = useState<VettingAssessment | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await vettingPublic.getAssessment(publicSlug);
    if (!res.ok) {
      setError(res.message);
      setAssessment(null);
    } else {
      setAssessment(res.data.assessment);
    }
    setLoading(false);
  }, [publicSlug]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assessment) return;
    setSubmitting(true);
    setError(null);
    const res = await vettingPublic.createAttempt(publicSlug, {
      candidate_name: candidateName,
      candidate_email: candidateEmail,
    });
    if (!res.ok) {
      setError(res.message);
      setSubmitting(false);
      return;
    }
    const token = res.data.attempt_token || res.data.attempt.attempt_token;
    if (!token) {
      setError("The attempt was created, but Squinia did not return a launch token. Please try again.");
      setSubmitting(false);
      return;
    }
    router.push(`/vetting/attempt/${encodeURIComponent(token)}`);
  }

  if (loading) {
    return (
      <VettingPublicShell assessment={assessment}>
        <LoadingAssessment />
      </VettingPublicShell>
    );
  }

  if (!assessment) {
    return (
      <VettingPublicShell>
        <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-[var(--warning-soft)] px-5 py-4 text-[14px] leading-6 text-amber-950">
          {error || "This vetting assessment is not available."}
        </div>
      </VettingPublicShell>
    );
  }

  return (
    <VettingPublicShell assessment={assessment}>
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <section className="min-w-0">
          <div className="flex items-center gap-3">
            <PublicLogo assessment={assessment} className="h-14 w-14 rounded-2xl" />
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">
                Candidate assessment
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-4xl">
                {assessment.title}
              </h1>
            </div>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            <span className="rounded-full border border-[var(--rule)] bg-[var(--surface)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
              {modeLabel(assessment.mode)}
            </span>
            <span className="rounded-full border border-[var(--rule)] bg-[var(--surface)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
              Pass score {assessment.pass_score}
            </span>
            {assessment.time_limit_minutes ? (
              <span className="rounded-full border border-[var(--rule)] bg-[var(--surface)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                {assessment.time_limit_minutes} min
              </span>
            ) : null}
          </div>
          <div className="mt-8 max-w-2xl text-[15px] leading-7 text-[var(--muted)]">
            {assessment.instructions ? (
              <p className="whitespace-pre-wrap">{assessment.instructions}</p>
            ) : (
              <p>
                You will complete a realistic workplace scenario. Answer naturally and treat the exchange as the assessment room.
              </p>
            )}
          </div>
        </section>

        <form onSubmit={(event) => void submit(event)} className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">
            Candidate details
          </p>
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-[13px] font-semibold text-[var(--foreground)]">Name</span>
              <input
                required
                value={candidateName}
                onChange={(event) => setCandidateName(event.target.value)}
                className="squinia-input mt-2 px-3 py-3 text-[14px]"
                placeholder="Ada Lovelace"
                autoComplete="name"
              />
            </label>
            <label className="block">
              <span className="text-[13px] font-semibold text-[var(--foreground)]">Email</span>
              <input
                required
                type="email"
                value={candidateEmail}
                onChange={(event) => setCandidateEmail(event.target.value)}
                className="squinia-input mt-2 px-3 py-3 text-[14px]"
                placeholder="ada@example.com"
                autoComplete="email"
              />
            </label>
          </div>
          {error ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-[var(--warning-soft)] px-3 py-2 text-[13px] leading-5 text-amber-950">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="sim-btn-accent mt-6 w-full px-5 py-3 font-mono text-[10px] uppercase"
          >
            {submitting ? "Preparing" : "Continue"}
          </button>
        </form>
      </div>
    </VettingPublicShell>
  );
}
