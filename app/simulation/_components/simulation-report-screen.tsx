"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { parseAttemptSessionId } from "../_lib/attempt-id";
import {
  getBackendSessionDetail,
  getBackendSessionEvaluation,
  isBackendSessionId,
  type BackendSessionDetail,
  type BackendSessionMessage,
} from "../_lib/backend-simulation";
import {
  type CompetencyBlock,
  type SessionReportStored,
  type SimulationReportKind,
  buildEvaluation,
  downloadEvaluationJson,
  formatClock,
  formatMetricDuration,
  loadSessionReport,
} from "../_lib/session-report";

function IconBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconKebab() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="5" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="12" cy="19" r="1.75" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4v12m0 0l4-4m-4 4l-4-4M5 20h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChecklist() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 11l2 2 4-4M5 5h4M5 12h4M5 19h4M13 5h6M13 12h6M13 19h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function normalizeKind(v: string | undefined): SimulationReportKind {
  if (v === "phone" || v === "video" || v === "chat") return v;
  return "chat";
}

function backendModeToKind(
  mode: BackendSessionDetail["mode"] | undefined,
  fallback: SimulationReportKind,
): SimulationReportKind {
  if (mode === "TEXT") return "chat";
  if (mode === "VIDEO") return "video";
  if (mode === "VOICE") return fallback === "video" ? "video" : "phone";
  return fallback;
}

function secondsFromTimestamps(start?: string | null, end?: string | null): number {
  if (!start || !end) return 0;
  const s = Date.parse(start);
  const e = Date.parse(end);
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return 0;
  return Math.max(0, Math.round((e - s) / 1000));
}

function toTranscript(
  messages: BackendSessionMessage[],
  learnerName: string,
  interviewerName: string,
): SessionReportStored["transcript"] {
  const usable = messages.filter((m) => m.role === "USER" || m.role === "ASSISTANT");
  const startedAt = usable.length > 0 ? Date.parse(usable[0].created_at) : 0;
  return usable.map((m) => {
    const ts = Date.parse(m.created_at);
    const offsetSec =
      Number.isFinite(ts) && Number.isFinite(startedAt) && ts >= startedAt
        ? Math.round((ts - startedAt) / 1000)
        : 0;
    return {
      id: m.id,
      role: m.role === "USER" ? ("learner" as const) : ("interviewer" as const),
      name: m.role === "USER" ? learnerName : interviewerName,
      title: undefined,
      text: m.content,
      offsetSec,
    };
  });
}

function fromBackendDetail(
  detail: BackendSessionDetail,
  sessionId: string,
  hint: SimulationReportKind,
): SessionReportStored {
  const kind = backendModeToKind(detail.mode, hint);
  const learnerName = "You";
  const interviewerName = "AI Interviewer";
  const transcript = toTranscript(detail.messages || [], learnerName, interviewerName);
  const elapsedSec = secondsFromTimestamps(detail.started_at, detail.ended_at);
  const scorecardLabel = "Simulation scorecard";
  const backendEval = detail.evaluation;

  const competencies: CompetencyBlock[] =
    backendEval?.scores?.map((s, idx) => {
      const tone: CompetencyBlock["tone"] =
        s.max_score > 0 && s.score / s.max_score >= 0.8
          ? "success"
          : s.max_score > 0 && s.score / s.max_score >= 0.6
            ? "neutral"
            : "warn";
      return {
        id: `backend-${idx}-${s.criterion}`,
        title: s.criterion,
        score: s.score,
        max: s.max_score || 5,
        label: tone === "success" ? "Strong" : tone === "neutral" ? "Average" : "Developing",
        tone,
        summary: s.rationale || "Performance summary captured by evaluator.",
        example: s.rationale || "No specific example provided.",
        improvement: s.rationale || "No specific improvement provided.",
      };
    }) || [];

  const fallbackEval = buildEvaluation(kind, elapsedSec, transcript.length, scorecardLabel);
  const overallMax =
    competencies.length > 0
      ? competencies.reduce((acc, c) => acc + c.max, 0)
      : fallbackEval.overallMax;
  const overallScore =
    typeof backendEval?.overall_score === "number"
      ? backendEval.overall_score
      : fallbackEval.overallScore;
  const band: SessionReportStored["evaluation"]["band"] =
    overallScore >= 82 ? "Great" : overallScore >= 68 ? "Solid" : "Growing";

  return {
    version: 1,
    sessionId,
    kind,
    scenarioTitle: "Simulation session",
    learnerName,
    learnerInitials: "YO",
    interviewerName,
    interviewerTitle: detail.mode === "VIDEO" ? "Video interviewer" : "Voice interviewer",
    endedAt: detail.ended_at || new Date().toISOString(),
    metrics: {
      handlingTimeSec: elapsedSec,
      handlingDeltaSec: 0,
      frtSec: 0,
      artSec: 0,
      transferRatePct: 0,
      lastMessageSec: transcript.length > 0 ? transcript[transcript.length - 1].offsetSec : 0,
    },
    transcript,
    evaluation: {
      overallScore,
      overallMax,
      band,
      summary:
        backendEval?.feedback_summary ||
        "Evaluation is being finalized. Refresh shortly if detailed feedback is still processing.",
      scorecardLabel,
      competencies: competencies.length > 0 ? competencies : fallbackEval.competencies,
    },
  };
}

async function loadBackendReportWithPolling(
  sessionId: string,
  kindHint: SimulationReportKind,
): Promise<SessionReportStored | null> {
  const detail = await getBackendSessionDetail(sessionId);
  if (!detail) return null;

  let latest = detail;
  if (!latest.evaluation || latest.evaluation.status !== "COMPLETED") {
    for (let i = 0; i < 12; i++) {
      const ev = await getBackendSessionEvaluation(sessionId);
      if (ev?.evaluation) {
        latest = { ...latest, evaluation: ev.evaluation };
      }
      if (ev?.status === "COMPLETED" && ev.evaluation) {
        break;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 1500));
    }
  }
  return fromBackendDetail(latest, sessionId, kindHint);
}

function ScoreRing({ score, max, tone }: { score: number; max: number; tone: "success" | "warn" | "neutral" }) {
  const pct = Math.min(1, score / max);
  const stroke =
    tone === "success" ? "#16a34a" : tone === "warn" ? "#ca8a04" : "#71717a";
  const r = 16;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  return (
    <svg width="40" height="40" viewBox="0 0 44 44" className="shrink-0" aria-hidden>
      <circle cx="22" cy="22" r={r} fill="none" stroke="var(--rule)" strokeWidth="3" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
      />
    </svg>
  );
}

function CompetencyCard({
  block,
  openKey,
  onToggle,
}: {
  block: CompetencyBlock;
  openKey: string | null;
  onToggle: (key: string) => void;
}) {
  const exId = `${block.id}-example`;
  const imId = `${block.id}-improve`;
  return (
    <article className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] px-5 py-5 shadow-[0_4px_24px_-16px_rgba(0,0,0,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">{block.title}</h3>
        <div className="flex items-center gap-2">
          <ScoreRing score={block.score} max={block.max} tone={block.tone} />
          <p className="text-right text-[14px] font-medium text-[#111111]">
            <span
              className={
                block.tone === "success"
                  ? "text-[#166534]"
                  : block.tone === "warn"
                    ? "text-[#a16207]"
                    : "text-[var(--muted)]"
              }
            >
              {block.score}/{block.max} ({block.label})
            </span>
          </p>
        </div>
      </div>
      <p className="mt-4 text-[14px] leading-relaxed text-[var(--muted)]">{block.summary}</p>
      <div className="mt-5 space-y-2 border-t border-[var(--rule)] pt-4">
        <button
          type="button"
          onClick={() => onToggle(exId)}
          className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-[13px] font-medium text-[#111111] hover:bg-[var(--field)]"
        >
          <span>{openKey === exId ? "▼" : "▶"} See example</span>
        </button>
        {openKey === exId ? (
          <p className="rounded-xl bg-[var(--field)]/80 px-3 py-3 text-[13px] leading-relaxed text-[var(--muted)]">
            {block.example}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => onToggle(imId)}
          className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-[13px] font-medium text-[#111111] hover:bg-[var(--field)]"
        >
          <span>{openKey === imId ? "▼" : "▶"} Show improvement</span>
        </button>
        {openKey === imId ? (
          <p className="rounded-xl bg-[var(--field)]/80 px-3 py-3 text-[13px] leading-relaxed text-[var(--muted)]">
            {block.improvement}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function SimulationReportScreen({
  sessionId,
  kindHint,
}: {
  sessionId: string;
  kindHint?: string;
}) {
  const router = useRouter();
  const [report, setReport] = useState<SessionReportStored | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accordion, setAccordion] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const kind = normalizeKind(kindHint);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        let data = await loadSessionReport(sessionId);
        if (!data && isBackendSessionId(sessionId)) {
          data = await loadBackendReportWithPolling(sessionId, kind);
        }
        if (cancelled) return;
        setReport(data);
        setLoadError(null);
      } catch (e) {
        if (!cancelled) {
          setReport(null);
          setLoadError(e instanceof Error ? e.message : "Could not load report");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, kind]);

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const recordingUrl = useMemo(() => {
    if (!report?.recording || report.recording.size === 0) return null;
    return URL.createObjectURL(report.recording);
  }, [report]);

  useEffect(() => {
    return () => {
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    };
  }, [recordingUrl]);

  const effectiveReport = report && report.version === 1 ? report : null;
  const displayKind = effectiveReport?.kind ?? kind;

  const title = effectiveReport?.scenarioTitle ?? "Simulation report";
  const titleShort =
    title.length > 36 ? `${title.slice(0, 33).trimEnd()}…` : title;

  const attemptLabel = useMemo(() => {
    const { attemptToken } = parseAttemptSessionId(sessionId);
    if (!attemptToken) return null;
    return `Attempt · ${attemptToken.slice(0, 14)}`;
  }, [sessionId]);

  const endedLabel = useMemo(() => {
    if (!effectiveReport?.endedAt) return "";
    try {
      return new Date(effectiveReport.endedAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }, [effectiveReport]);

  const downloadRecording = useCallback(() => {
    if (!effectiveReport?.recording || !recordingUrl) return;
    const a = document.createElement("a");
    a.href = recordingUrl;
    const mime = effectiveReport.recordingMime ?? effectiveReport.recording.type ?? "";
    const ext = mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "m4a" : "webm";
    a.download = `squinia-${displayKind}-${sessionId.slice(0, 8)}.${ext}`;
    a.click();
  }, [effectiveReport, recordingUrl, displayKind, sessionId]);

  const downloadJson = useCallback(() => {
    if (!effectiveReport) return;
    const base = `squinia-${displayKind}-${sessionId.slice(0, 8)}`;
    downloadEvaluationJson(effectiveReport, base);
    setMenuOpen(false);
  }, [effectiveReport, displayKind, sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--background)] text-[var(--muted)]">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em]">Loading report…</p>
      </div>
    );
  }

  if (!effectiveReport) {
    return (
      <div className="sim-root mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center gap-6 bg-[var(--background)] px-6 py-16 text-[#111111]">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">No report for this session</h1>
        <p className="text-[15px] leading-relaxed text-[var(--muted)]">
          {loadError ??
            "Finish a simulation and choose “End simulation” to generate a report. If you refreshed this page, open the report again from your last session."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="sim-btn-accent self-start px-6 py-3 font-mono text-[11px] uppercase"
        >
          Go home
        </button>
      </div>
    );
  }

  const m = effectiveReport.metrics;
  const ev = effectiveReport.evaluation;
  const bandClass =
    ev.band === "Great"
      ? "bg-[#e6f4ea] text-[#166534]"
      : ev.band === "Solid"
        ? "bg-[var(--field)] text-[#166534]"
        : "bg-amber-50 text-[#a16207]";

  return (
    <div className="sim-root min-h-[100dvh] bg-[var(--background)] text-[#111111]">
      <header className="sticky top-0 z-20 flex h-[52px] shrink-0 items-center gap-3 border-b border-[var(--rule)] bg-[var(--surface)]/95 px-3 backdrop-blur-sm sm:px-5">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="sim-transition flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[var(--rule)] bg-transparent hover:bg-[var(--field)]"
          aria-label="Back"
        >
          <IconBack />
        </button>
        <div className="min-w-0 flex-1 truncate text-center">
          <h1 className="truncate text-[14px] font-medium tracking-[-0.02em] sm:text-[15px]">{titleShort}</h1>
          {attemptLabel ? (
            <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--faint)]">
              {attemptLabel}
            </p>
          ) : null}
        </div>
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="sim-transition flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-transparent text-[var(--muted)] hover:border-[var(--rule)] hover:text-[#111111]"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="More options"
          >
            <IconKebab />
          </button>
          {menuOpen ? (
            <div
              className="absolute right-0 top-full z-30 mt-1 w-48 rounded-xl border border-[var(--rule)] bg-[var(--surface)] py-1 shadow-lg"
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                onClick={downloadJson}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium hover:bg-[var(--field)]"
              >
                <IconDownload />
                Download evaluation
              </button>
              {recordingUrl ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    downloadRecording();
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium hover:bg-[var(--field)]"
                >
                  <IconDownload />
                  Download recording
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto grid max-w-[1200px] gap-0 lg:grid-cols-[1fr_1fr] lg:gap-0">
        <section className="min-h-0 border-[var(--rule)] lg:border-r">
          <div className="border-b border-[var(--rule)] px-5 py-4 sm:px-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--faint)]">Simulation</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#111111] font-mono text-[11px] font-medium text-[var(--accent-fg)]"
                aria-hidden
              >
                {effectiveReport.learnerInitials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[16px] font-semibold tracking-[-0.02em]">
                  {effectiveReport.learnerName}
                </p>
                <p className="mt-0.5 text-[13px] text-[var(--muted)]">{endedLabel}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <MetricPill
                label="Handling time"
                value={formatMetricDuration(m.handlingTimeSec)}
                badge={
                  m.handlingDeltaSec <= 0
                    ? `-${formatMetricDuration(Math.abs(m.handlingDeltaSec))}`
                    : `+${formatMetricDuration(m.handlingDeltaSec)}`
                }
                badgeTone={m.handlingDeltaSec <= 0 ? "good" : "warn"}
              />
              <MetricPill label="FRT" value={formatMetricDuration(m.frtSec)} />
              <MetricPill label="ART" value={formatMetricDuration(m.artSec)} />
              <MetricPill label="TR" value={`${m.transferRatePct}%`} />
              <MetricPill label="LM" value={formatMetricDuration(m.lastMessageSec)} />
            </div>
          </div>

          <div className="px-5 py-4 sm:px-6">
            <p className="inline-block border-b-2 border-[#111111] pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#111111]">
              Transcript
            </p>
          </div>

          {displayKind === "video" && recordingUrl ? (
            <div className="px-5 pb-6 sm:px-6">
              <div className="relative overflow-hidden rounded-2xl border border-[var(--rule)] bg-black shadow-inner">
                <video
                  src={recordingUrl}
                  className="aspect-video w-full object-contain"
                  controls
                  playsInline
                  preload="metadata"
                />
              </div>
            </div>
          ) : displayKind === "video" ? (
            <div className="mx-5 mb-6 rounded-2xl border border-dashed border-[var(--rule)] bg-[var(--field)]/50 px-4 py-8 text-center text-[14px] text-[var(--muted)] sm:mx-6">
              No recording was captured for this session (permission denied or recorder unsupported).
            </div>
          ) : displayKind === "phone" && recordingUrl ? (
            <div className="px-5 pb-6 sm:px-6">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                Session recording · your microphone
              </p>
              <div className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-4 shadow-inner">
                <audio src={recordingUrl} controls className="w-full" preload="metadata" />
              </div>
            </div>
          ) : displayKind === "phone" ? (
            <div className="mx-5 mb-4 rounded-2xl border border-[var(--rule)] bg-[var(--field)]/40 px-4 py-6 text-center text-[13px] text-[var(--muted)] sm:mx-6">
              No microphone capture for this session (permission denied or recorder unsupported).
            </div>
          ) : (
            <div className="mx-5 mb-4 rounded-2xl border border-[var(--rule)] bg-[var(--field)]/40 px-4 py-6 text-center text-[13px] text-[var(--muted)] sm:mx-6">
              Recording is available after phone and video simulations. Chat transcripts are below.
            </div>
          )}

          <div className="max-h-[min(52vh,640px)] min-h-[200px] overflow-y-auto overscroll-y-contain px-5 pb-12 sm:px-6">
            <ul className="space-y-0">
              {effectiveReport.transcript.map((line, i) => (
                <li key={line.id}>
                  {i > 0 ? <div className="my-6 h-px bg-[var(--rule)]" aria-hidden /> : null}
                  <div className="flex gap-4">
                    <div
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-medium ${
                        line.role === "interviewer"
                          ? "bg-[#111111] text-[var(--accent-fg)]"
                          : "border border-[var(--rule-strong)] text-[var(--muted)]"
                      }`}
                      aria-hidden
                    >
                      {line.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-[13px] font-semibold text-[#111111]">
                          {line.name}
                          {line.title ? (
                            <span className="font-normal text-[var(--muted)]"> · {line.title}</span>
                          ) : null}
                        </p>
                        <p className="font-mono text-[11px] tabular-nums text-[var(--muted)]">
                          {formatClock(line.offsetSec)}
                        </p>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--muted)]">
                        {line.text}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="min-h-0 border-t border-[var(--rule)] lg:border-t-0">
          <div className="flex items-center justify-between border-b border-[var(--rule)] px-5 py-4 sm:px-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--faint)]">Feedback</p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--rule)] bg-[var(--field)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]">
              <IconChecklist />
              {ev.scorecardLabel}
            </span>
          </div>

          <div className="min-h-0 overflow-y-auto overscroll-y-contain px-5 py-6 sm:px-6">
            <div className={`rounded-2xl px-5 py-6 ${bandClass}`}>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <p className="text-[2.25rem] font-semibold leading-none tracking-[-0.04em]">
                  {ev.overallScore}
                  <span className="text-[1.1rem] font-medium text-[var(--muted)]"> / {ev.overallMax}</span>
                </p>
                <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#166534] shadow-sm">
                  {ev.band}
                </span>
              </div>
              <p className="mt-5 text-[14px] leading-relaxed text-[#111111]/85">{ev.summary}</p>
            </div>

            <div className="mt-8 space-y-5">
              {ev.competencies.map((c) => (
                <CompetencyCard
                  key={c.id}
                  block={c}
                  openKey={accordion}
                  onToggle={(key) => setAccordion((prev) => (prev === key ? null : key))}
                />
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3 border-t border-[var(--rule)] pt-8">
              <button
                type="button"
                onClick={downloadJson}
                className="sim-transition rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-5 py-3 text-[12px] font-semibold text-[#111111] hover:bg-[var(--field)]"
              >
                Download evaluation (JSON)
              </button>
              {recordingUrl ? (
                <button
                  type="button"
                  onClick={downloadRecording}
                  className="sim-btn-accent rounded-xl px-5 py-3 text-[12px] font-semibold uppercase"
                >
                  Download recording
                </button>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricPill({
  label,
  value,
  badge,
  badgeTone,
}: {
  label: string;
  value: string;
  badge?: string;
  badgeTone?: "good" | "warn";
}) {
  return (
    <div className="rounded-xl border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 shadow-sm">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--faint)]">{label}</p>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px] font-semibold tabular-nums text-[#111111]">
        {value}
        {badge ? (
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.06em] ${
              badgeTone === "good"
                ? "bg-[#e6f4ea] text-[#166534]"
                : "bg-amber-50 text-[#a16207]"
            }`}
          >
            {badge}
          </span>
        ) : null}
      </p>
    </div>
  );
}
