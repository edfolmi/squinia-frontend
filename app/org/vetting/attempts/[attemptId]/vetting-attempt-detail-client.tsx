"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MetricCard, ProductPageHeader, StatusBadge } from "@/app/_components/product-ui";
import { v1 } from "@/app/_lib/v1-client";
import type { VettingAttempt, VettingRecording, VettingResultSnapshot, VettingScore } from "@/app/vetting/_lib/vetting-client";
import { formatDateTime } from "@/app/vetting/_components/vetting-public-ui";

function passTone(value?: boolean | null): "success" | "danger" | "warning" | "neutral" {
  if (value === true) return "success";
  if (value === false) return "danger";
  return "neutral";
}

function snapshotScores(snapshot?: VettingResultSnapshot | null): VettingScore[] {
  return Array.isArray(snapshot?.scores) ? snapshot.scores : [];
}

export function VettingAttemptDetailClient({ attemptId }: { attemptId: string }) {
  const [attempt, setAttempt] = useState<VettingAttempt | null>(null);
  const [recording, setRecording] = useState<VettingRecording | null>(null);
  const [recordingLoading, setRecordingLoading] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await v1.get<{ attempt: VettingAttempt }>(`vetting/attempts/${attemptId}`);
    if (!res.ok) {
      setError(res.message);
      setAttempt(null);
      setRecording(null);
    } else {
      setAttempt(res.data.attempt);
      if (res.data.attempt.session_id) {
        setRecordingLoading(true);
        setRecordingError(null);
        const recordingRes = await v1.get<{ recording: VettingRecording }>(`vetting/attempts/${attemptId}/recording`);
        if (recordingRes.ok) {
          setRecording(recordingRes.data.recording);
        } else {
          setRecording(null);
          setRecordingError(recordingRes.message);
        }
        setRecordingLoading(false);
      } else {
        setRecording(null);
        setRecordingError(null);
      }
    }
    setLoading(false);
  }, [attemptId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const snapshot = attempt?.result_snapshot ?? null;
  const scores = useMemo(() => snapshotScores(snapshot), [snapshot]);
  const assessmentId = attempt?.assessment_id ?? snapshot?.assessment_id;

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="squinia-skeleton h-8 w-72 rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="squinia-skeleton h-32 rounded-2xl" />
          <div className="squinia-skeleton h-32 rounded-2xl" />
          <div className="squinia-skeleton h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-[var(--warning-soft)] px-5 py-4 text-[14px] leading-6 text-amber-950">
        {error || "Attempt not found."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <ProductPageHeader
        eyebrow="Vetting result"
        title={attempt.candidate_name}
        description={attempt.candidate_email}
        action={
          <Link
            href={assessmentId ? `/org/vetting/${assessmentId}` : "/org/vetting"}
            className="rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-[12px] font-semibold text-[var(--muted)] hover:bg-[var(--field)] hover:text-[var(--foreground)]"
          >
            Back
          </Link>
        }
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge tone={attempt.status === "EVALUATED" ? passTone(attempt.passed) : "neutral"}>{attempt.status}</StatusBadge>
          {attempt.source ? <StatusBadge>{attempt.source}</StatusBadge> : null}
        </div>
      </ProductPageHeader>

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Score" value={attempt.score ?? snapshot?.overall_score ?? "--"} detail={`Pass score ${snapshot?.pass_score ?? "--"}`} tone={passTone(attempt.passed)} />
        <MetricCard label="Decision" value={attempt.passed == null ? "--" : attempt.passed ? "Pass" : "Review"} detail="Vetting threshold result" tone={passTone(attempt.passed)} />
        <MetricCard label="Completed" value={formatDateTime(attempt.completed_at || snapshot?.completed_at)} detail={`Evaluated ${formatDateTime(attempt.evaluated_at)}`} />
      </section>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">Candidate context</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/35 px-3 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">External candidate</p>
            <p className="mt-1 break-all text-[14px] font-semibold text-[var(--foreground)]">{attempt.external_candidate_id || "--"}</p>
          </div>
          <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/35 px-3 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">External application</p>
            <p className="mt-1 break-all text-[14px] font-semibold text-[var(--foreground)]">{attempt.external_application_id || "--"}</p>
          </div>
          <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/35 px-3 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">Started</p>
            <p className="mt-1 text-[14px] font-semibold text-[var(--foreground)]">{formatDateTime(attempt.started_at)}</p>
          </div>
          <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/35 px-3 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">Session</p>
            <p className="mt-1 break-all font-mono text-[12px] text-[var(--muted)]">{attempt.session_id || "--"}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">Assessment recording</p>
            <p className="mt-2 text-[13px] leading-5 text-[var(--muted)]">Private S3 playback link for voice and video vetting sessions.</p>
          </div>
          {recording?.status ? <StatusBadge tone={recording.status === "READY" ? "success" : recording.status === "FAILED" ? "danger" : "warning"}>{recording.status}</StatusBadge> : null}
        </div>
        <div className="mt-5">
          {recordingLoading ? (
            <div className="squinia-skeleton h-44 rounded-2xl" />
          ) : recording?.playback_url ? (
            recording.mode === "VIDEO" || recording.mime_type.startsWith("video/") ? (
              <video src={recording.playback_url} controls preload="metadata" className="aspect-video w-full rounded-xl border border-[var(--rule)] bg-black" />
            ) : (
              <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/35 p-4">
                <audio src={recording.playback_url} controls preload="metadata" className="w-full" />
              </div>
            )
          ) : recording?.status === "PENDING_UPLOAD" || recording?.status === "UPLOADING" ? (
            <p className="rounded-xl border border-amber-200 bg-[var(--warning-soft)] px-4 py-3 text-[13px] leading-5 text-amber-950">
              The candidate submitted the assessment. Recording upload is still processing.
            </p>
          ) : recording?.status === "FAILED" ? (
            <p className="rounded-xl border border-red-200 bg-[var(--danger-soft)] px-4 py-3 text-[13px] leading-5 text-[var(--danger-strong)]">
              {recording.error_message || "Recording upload failed."}
            </p>
          ) : (
            <p className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/35 px-4 py-3 text-[13px] leading-5 text-[var(--muted)]">
              {recordingError || "No recording is available yet. Text-only assessments do not produce a media recording."}
            </p>
          )}
          {recording ? (
            <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-[var(--muted)]">
              <span>{recording.mime_type}</span>
              <span>{Math.round((recording.size_bytes || 0) / 1024)} KB</span>
              {recording.expires_at ? <span>Playback URL expires {formatDateTime(recording.expires_at)}</span> : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">Evaluation summary</p>
        {snapshot?.feedback_summary ? (
          <p className="mt-4 text-[15px] leading-7 text-[var(--foreground)]">{snapshot.feedback_summary}</p>
        ) : (
          <p className="mt-4 text-[14px] leading-6 text-[var(--muted)]">No evaluation summary has been produced yet.</p>
        )}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <h2 className="text-[13px] font-semibold text-[var(--foreground)]">Strengths</h2>
            <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6 text-[var(--muted)]">{snapshot?.strengths || "--"}</p>
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-[var(--foreground)]">Improvements</h2>
            <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6 text-[var(--muted)]">{snapshot?.improvements || "--"}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">Rubric scores</p>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-[13px]">
            <thead className="border-b border-[var(--rule)] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
              <tr>
                <th className="py-3 pr-4">Criterion</th>
                <th className="py-3 pr-4">Score</th>
                <th className="py-3 pr-4">Evidence</th>
                <th className="py-3">Improvement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule)]">
              {scores.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-[var(--muted)]">No rubric evidence yet.</td>
                </tr>
              ) : (
                scores.map((score, index) => (
                  <tr key={`${score.criterion}-${index}`}>
                    <td className="py-3 pr-4 font-semibold text-[var(--foreground)]">{score.criterion}</td>
                    <td className="py-3 pr-4 font-semibold text-[var(--foreground)]">
                      {score.score}
                      {score.max_score ? ` / ${score.max_score}` : ""}
                    </td>
                    <td className="max-w-md py-3 pr-4 text-[var(--muted)]">{score.summary || score.rationale || score.example_quote || "--"}</td>
                    <td className="max-w-md py-3 text-[var(--muted)]">{score.improvement || "--"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
