"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { SimulationTeamFeedbackDialog } from "../../_components/team-feedback-dialog";
import { buildStoredPhoneReport, saveSessionReport } from "../../_lib/session-report";
import { usePhoneSimulationAudio } from "./hooks/use-phone-simulation-audio";

type Phase = "prepare" | "micTest" | "loading" | "live";

const MIC_OPTIONS = [
  "Microphone Array (Realtek Audio)",
  "Built-in microphone",
  "USB headset microphone",
];

const SPEAKER_OPTIONS = [
  "Default — Speakers / Headphones (Realtek Audio)",
  "Speakers (Realtek Audio)",
  "Headphones",
];

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

function IconHeadset({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 18v-3a9 9 0 1118 0v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M21 18a3 3 0 01-3 3h-1v-6h1a3 3 0 013 3zM3 18a3 3 0 003 3h1v-6H6a3 3 0 00-3 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconFlag() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 22V4a1 1 0 011-1h14a1 1 0 011 1v10a1 1 0 01-1 1H6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMic() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zM19 10v1a7 7 0 01-14 0v-1M12 18v4M8 22h8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconFocus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 5V3M12 21v-2M5 12H3M21 12h-2M6.34 6.34L4.93 4.93M19.07 19.07l-1.41-1.41M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMore() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function SimArcUnderline({ active }: { active: boolean }) {
  const stroke = active ? "#111111" : "var(--rule-strong)";
  return (
    <svg
      className="mt-0.5"
      width="76"
      height="9"
      viewBox="0 0 76 9"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 6 Q38 1.5 73 6"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[13px] font-medium tracking-[-0.01em] text-[#111111]"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sim-transition w-full cursor-pointer appearance-none rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] py-3.5 pl-4 pr-10 text-[14px] text-[#111111] outline-none transition-shadow duration-200 focus-visible:border-[var(--rule-strong)] focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        >
          {options.map((opt, i) => (
            <option key={i} value={String(i)}>
              {opt}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}

function VolumeMeter({ level }: { level: number }) {
  const total = 12;
  return (
    <div className="flex gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-colors duration-150 ${
            i < level ? "bg-[#3a3a3a]" : "bg-[var(--rule)]"
          }`}
        />
      ))}
    </div>
  );
}

export function PhoneSimulationScreen({
  sessionId,
  scenarioTitle = "Voice check-in with leadership",
  callerName,
  callerNumber,
  learnerName,
  scorecardLabel = "Behavioral capstone",
}: {
  sessionId: string;
  scenarioTitle?: string;
  callerName: string;
  callerNumber: string;
  learnerName: string;
  scorecardLabel?: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("prepare");
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [micIndex, setMicIndex] = useState(0);
  const [speakerIndex, setSpeakerIndex] = useState(0);
  const [callElapsed, setCallElapsed] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(4);
  const [muted, setMuted] = useState(false);
  const [savingReport, setSavingReport] = useState(false);

  const audio = usePhoneSimulationAudio();

  useEffect(() => {
    if (phase !== "live") return;
    let cancelled = false;
    void (async () => {
      await audio.startPipeline();
      if (cancelled) audio.resetPipeline();
    })();
    return () => {
      cancelled = true;
      audio.resetPipeline();
    };
  }, [phase, audio.startPipeline, audio.resetPipeline]);

  useEffect(() => {
    const t = audio.micStream?.getAudioTracks()[0];
    if (!t) return;
    t.enabled = !muted;
  }, [muted, audio.micStream]);

  useEffect(() => {
    if (phase !== "micTest") return;
    const id = window.setInterval(() => {
      setVolumeLevel(1 + Math.floor(Math.random() * 10));
    }, 450);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "loading") return;
    const t = window.setTimeout(() => {
      setPhase("live");
      setCallElapsed(0);
    }, 2000);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "live") return;
    const id = window.setInterval(() => setCallElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  function formatCallTime(totalSec: number) {
    const m = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  async function requestEndSimulation() {
    const ok = window.confirm(
      "End this simulation? Your microphone capture will stop and your session report will open with audio replay when available.",
    );
    if (!ok) return;
    setSavingReport(true);
    try {
      const blob = phase === "live" ? await audio.finalizeRecording() : null;
      audio.resetPipeline();
      const payload = buildStoredPhoneReport({
        sessionId,
        scenarioTitle,
        learnerName,
        callerName,
        callerSubtitle: callerNumber,
        callElapsedSec: phase === "live" ? callElapsed : 0,
        scorecardLabel,
        recording: blob,
        recordingMime: blob?.type,
      });
      try {
        await saveSessionReport(payload);
      } catch {
        await saveSessionReport({
          ...payload,
          recording: undefined,
          recordingMime: undefined,
        });
      }
      router.push(`/simulation/${sessionId}/report?kind=phone`);
    } finally {
      setSavingReport(false);
    }
  }

  function requestEndCall() {
    const ok = window.confirm("End this call?");
    if (!ok) return;
    audio.resetPipeline();
    setPhase("prepare");
    setCallElapsed(0);
  }

  const showOverlay = phase === "prepare" || phase === "micTest" || phase === "loading";

  const sessionShort = useMemo(
    () => (sessionId.length > 10 ? `${sessionId.slice(0, 6)}…` : sessionId),
    [sessionId],
  );

  return (
    <div className="sim-root flex min-h-full flex-col bg-[var(--background)] text-[#111111]">
      <header className="relative z-10 mx-2 mt-2 flex h-[52px] shrink-0 items-center gap-2 rounded-2xl border border-[var(--rule)] bg-[var(--surface)] px-2 shadow-[0_6px_28px_-20px_rgba(17,17,17,0.14)] sm:mx-3 sm:px-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="sim-transition flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[var(--rule)] bg-transparent transition-colors duration-200 hover:bg-[var(--field)]"
            aria-label="Back"
          >
            <IconBack />
          </button>
          <button
            type="button"
            onClick={() => setInfoPanelOpen(true)}
            className="cursor-pointer rounded-lg px-2 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:bg-[var(--field)] hover:text-[#111111] hover:underline sm:hidden"
          >
            View info
          </button>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 flex items-center justify-center">
          <div className="pointer-events-auto flex flex-col items-center justify-center gap-0.5">
            <span className="sr-only">Phone call simulation</span>
            <span className="-mb-px inline-flex" aria-hidden>
              <IconHeadset
                className={phase === "live" ? "text-[#111111]" : "text-[var(--muted)]"}
              />
            </span>
            <span className="font-mono text-[10px] uppercase leading-none tracking-[0.26em] text-[var(--faint)]">
              {phase === "live" ? "Live" : "Room"}
            </span>
            <SimArcUnderline active={phase === "live"} />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="sim-transition flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-transparent text-[var(--muted)] hover:border-[var(--rule)] hover:text-[#111111]"
            title="Flag for team — send feedback"
            aria-label="Flag for team — send feedback"
          >
            <IconFlag />
          </button>
          <button
            type="button"
            onClick={() => setInfoPanelOpen(true)}
            className="sim-transition hidden cursor-pointer rounded-xl border border-[var(--rule)] px-3 py-2 text-[12px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--field)] sm:inline"
          >
            View info
          </button>
          <button
            type="button"
            disabled={savingReport}
            onClick={() => void requestEndSimulation()}
            className="sim-btn-accent rounded-xl px-4 py-2.5 font-mono text-[10px] uppercase sm:px-5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingReport ? "Saving…" : "End simulation"}
          </button>
        </div>
      </header>

      <div className="mx-3 mb-3 mt-2 flex min-h-0 flex-1 flex-col sm:mx-4">
        <div
          className={`relative flex min-h-[min(560px,calc(100vh-6rem))] flex-1 flex-col overflow-hidden rounded-[2rem] bg-[#1e1e1e] text-white shadow-[0_24px_60px_-32px_rgba(0,0,0,0.35)] ${phase === "live" ? "sim-live-panel" : ""}`}
        >
          <button
            type="button"
            className="sim-transition absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
            aria-label="More options"
          >
            <IconMore />
          </button>

          {showOverlay ? (
            <div className="sim-fade-in flex flex-1 flex-col items-center justify-center px-4 py-10">
              {phase === "prepare" ? (
                <div
                  className="relative w-full max-w-md rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-6 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.2)] sm:p-8"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="phone-prepare-title"
                >
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--field)]"
                    aria-label="Close"
                  >
                    <IconClose />
                  </button>
                  <h1
                    id="phone-prepare-title"
                    className="pr-10 text-xl font-semibold tracking-[-0.02em] text-[#111111] sm:text-2xl"
                  >
                    Get ready for your phone simulation
                  </h1>
                  <div className="mt-6 flex items-start gap-3 rounded-xl bg-[var(--field)]/80 px-3 py-3 text-[14px] leading-snug text-[var(--muted)]">
                    <IconFocus />
                    <span>Find a space to focus</span>
                  </div>
                  <div className="mt-8 space-y-6">
                    <SelectField
                      id="phone-mic"
                      label="Microphone"
                      value={String(micIndex)}
                      onChange={(v) => setMicIndex(Number(v))}
                      options={MIC_OPTIONS}
                    />
                    <SelectField
                      id="phone-spk"
                      label="Speakers"
                      value={String(speakerIndex)}
                      onChange={(v) => setSpeakerIndex(Number(v))}
                      options={SPEAKER_OPTIONS}
                    />
                  </div>
                  <div className="mt-10 flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setPhase("micTest")}
                      className="sim-transition rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-5 py-3 text-[12px] font-semibold tracking-wide text-[#111111] transition-colors hover:bg-[var(--field)]"
                    >
                      Test audio setup
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhase("loading")}
                      className="sim-btn-accent rounded-xl px-6 py-3 text-[12px] font-semibold uppercase tracking-wide"
                    >
                      Start
                    </button>
                  </div>
                  <p className="mt-6 font-mono text-[10px] tracking-[0.12em] text-[var(--faint)]">
                    Session {sessionId.length > 14 ? `${sessionId.slice(0, 8)}…` : sessionId}
                  </p>
                </div>
              ) : null}

              {phase === "micTest" ? (
                <div
                  className="relative w-full max-w-md rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-6 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.2)] sm:p-8"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="mic-test-title"
                >
                  <button
                    type="button"
                    onClick={() => setPhase("prepare")}
                    className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--field)]"
                    aria-label="Close"
                  >
                    <IconClose />
                  </button>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">
                    1 of 2
                  </p>
                  <h2
                    id="mic-test-title"
                    className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[#111111] sm:text-2xl"
                  >
                    Mic test
                  </h2>
                  <div className="mt-8">
                    <SelectField
                      id="mic-test-select"
                      label="Microphone"
                      value={String(micIndex)}
                      onChange={(v) => setMicIndex(Number(v))}
                      options={MIC_OPTIONS}
                    />
                    <p className="mt-4 text-[13px] leading-relaxed text-[var(--muted)]">
                      When you speak, you should see the volume bar below rise.
                    </p>
                    <div className="mt-4">
                      <VolumeMeter level={volumeLevel} />
                    </div>
                  </div>
                  <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--rule)] pt-6">
                    <button
                      type="button"
                      onClick={() => setPhase("prepare")}
                      className="cursor-pointer text-[13px] font-medium text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
                    >
                      Go back
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhase("loading")}
                      className="sim-btn-accent rounded-xl px-6 py-3 text-[12px] font-semibold uppercase tracking-wide"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : null}

              {phase === "loading" ? (
                <div
                  className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-white/10 bg-white/95 px-8 py-12 text-[#111111] shadow-xl"
                  role="status"
                  aria-live="polite"
                >
                  <div
                    className="h-9 w-9 rounded-full border-2 border-[var(--rule-strong)] border-t-[#32a852] animate-spin"
                    aria-hidden
                  />
                  <p className="mt-6 text-[15px] font-medium tracking-[-0.01em]">
                    Starting simulation
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {phase === "live" ? (
            <>
              <div className="flex flex-1 flex-col items-center justify-center px-6 pb-28 pt-12 text-center">
                <p className="font-mono text-[2rem] font-medium tabular-nums tracking-tight text-white sm:text-[2.25rem]">
                  {formatCallTime(callElapsed)}
                </p>
                <p className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                  {callerName}
                </p>
                <p className="mt-2 text-[15px] text-white/70">{callerNumber}</p>
                {muted ? (
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                    Muted
                  </p>
                ) : null}
                {audio.recording ? (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300/90">
                    Recording your line
                  </p>
                ) : null}
                <p className="mt-4 max-w-sm text-[12px] leading-relaxed text-white/45">
                  Your microphone is captured in-browser for replay after you end the simulation.
                </p>
              </div>

              <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center gap-3 px-4 pb-10 pt-4">
                {audio.errorMessage ? (
                  <div
                    className="max-w-md rounded-xl border border-amber-400/30 bg-amber-500/15 px-3 py-2 text-center text-[12px] text-amber-50"
                    role="alert"
                  >
                    {audio.errorMessage}{" "}
                    <button
                      type="button"
                      onClick={() => audio.clearError()}
                      className="font-medium text-white underline underline-offset-2"
                    >
                      Dismiss
                    </button>
                  </div>
                ) : null}
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setMuted((m) => !m)}
                    className={`sim-transition flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl border transition-colors ${
                      muted
                        ? "border-amber-400/50 bg-amber-500/20 text-amber-100"
                        : "border-white/15 bg-white text-[#1e1e1e] hover:bg-white/90"
                    }`}
                    aria-pressed={muted}
                    aria-label={muted ? "Unmute" : "Mute"}
                  >
                    <IconMic />
                  </button>
                  <button
                    type="button"
                    onClick={requestEndCall}
                    className="sim-transition cursor-pointer rounded-2xl bg-[#dc2626] px-8 py-3.5 text-[13px] font-semibold tracking-wide text-white shadow-[0_8px_24px_-8px_rgba(220,38,38,0.5)] hover:bg-[#b91c1c]"
                  >
                    End call
                  </button>
                </div>
              </div>

              <p className="pointer-events-none absolute bottom-10 right-10 text-[14px] font-semibold text-white/90">
                {learnerName}
              </p>
            </>
          ) : null}
        </div>
      </div>

      {infoPanelOpen ? (
        <div
          className="fixed inset-0 z-30"
          role="dialog"
          aria-modal="true"
          aria-labelledby="phone-info-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#111111]/25 backdrop-blur-[1px]"
            aria-label="Close info panel"
            onClick={() => setInfoPanelOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(100%,24rem)] flex-col border-l border-[var(--rule)] bg-[var(--surface)] shadow-[0_0_48px_-12px_rgba(0,0,0,0.18)]">
            <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-[var(--rule)] px-4">
              <span
                id="phone-info-title"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]"
              >
                View info
              </span>
              <button
                type="button"
                onClick={() => setInfoPanelOpen(false)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-[var(--muted)] hover:bg-[var(--field)] hover:text-[#111111]"
                aria-label="Close"
              >
                <IconClose />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-8">
              <section className="rounded-2xl bg-[var(--field)]/65 px-4 py-4 ring-1 ring-[var(--rule)]/90">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--faint)]">
                  Scenario
                </p>
                <p className="mt-2.5 text-[1.125rem] font-medium leading-snug tracking-[-0.024em] text-[#111111] lg:text-[1.2rem]">
                  {scenarioTitle}
                </p>
              </section>
              <section className="mt-10">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--faint)]">
                  Call
                </p>
                <p className="mt-3 text-[15px] font-medium tracking-[-0.01em] text-[#111111]">
                  {callerName}
                </p>
                <p className="mt-1 font-mono text-[13px] text-[var(--muted)]">{callerNumber}</p>
                <p className="mt-6 text-[14px] leading-relaxed text-[var(--muted)]">
                  You are signed in as{" "}
                  <span className="font-medium text-[#111111]">{learnerName}</span>. While live, your
                  microphone is recorded in this browser for the session report; speaker checks stay
                  local until you wire device APIs.
                </p>
              </section>
              <p className="mt-10 font-mono text-[10px] tracking-[0.14em] text-[var(--faint)]">
                Session {sessionShort}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <SimulationTeamFeedbackDialog
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        kind="phone"
        sessionId={sessionId}
      />
    </div>
  );
}
