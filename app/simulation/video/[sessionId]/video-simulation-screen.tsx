"use client";

/**
 * Video simulation — SolidRoad-style flow (prepare → mic test → loading → live),
 * auto camera + auto recording in the live room, optional screen share.
 * Chrome matches phone simulation (header, dark stage, controls).
 */

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MemoLiveKitRoomStage } from "../../_components/livekit-room-stage";
import { SimulationTeamFeedbackDialog } from "../../_components/team-feedback-dialog";
import {
  endBackendSimulationSession,
  getBackendSessionDetail,
  ingestLiveTranscript,
  isBackendSessionId,
  type LiveTranscriptIngestItem,
} from "../../_lib/backend-simulation";
import {
  disposeLiveKitRecording,
  finalizeLiveKitRecording,
} from "../../_lib/livekit-session-recording";
import { PersonaAvatar, personaFromScenarioLike, type RuntimePersona } from "../../_lib/persona-runtime";
import { startBackgroundSessionRecordingUpload } from "../../_lib/session-recordings";
import { buildStoredVideoReport, saveSessionReport } from "../../_lib/session-report";
import { useVideoSimulationMedia } from "./hooks/use-video-simulation-media";

type Phase = "prepare" | "micTest" | "loading" | "live";

const MIC_OPTIONS = [
  "Microphone Array (Realtek Audio)",
  "Built-in microphone",
  "USB headset microphone",
];

const CAM_OPTIONS = [
  "Integrated Webcam",
  "USB camera",
  "External camera",
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

function IconVideo({ className }: { className?: string }) {
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
        d="M15 10l4-2v8l-4-2V10zM4 8h9a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
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

function IconMonitor() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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

export function VideoSimulationScreen({
  sessionId,
  scenarioTitle: initialScenarioTitle,
  remoteName: initialRemoteName,
  remoteRole: initialRemoteRole,
  learnerName,
  personaBlurb: initialPersonaBlurb,
  scorecardLabel = "Behavioral capstone",
}: {
  sessionId: string;
  scenarioTitle: string;
  remoteName: string;
  remoteRole?: string;
  learnerName: string;
  personaBlurb?: string;
  scorecardLabel?: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("prepare");
  const [infoOpen, setInfoOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [backendDeviceError, setBackendDeviceError] = useState<string | null>(null);
  const [runtimeScenarioTitle, setRuntimeScenarioTitle] = useState(initialScenarioTitle);
  const [runtimePersona, setRuntimePersona] = useState<RuntimePersona>({
    name: initialRemoteName,
    title: initialRemoteRole || "Interviewer",
    avatarUrl: "",
    blurb: initialPersonaBlurb || "",
  });
  const [micIndex, setMicIndex] = useState(0);
  const [camIndex, setCamIndex] = useState(0);
  const [speakerIndex, setSpeakerIndex] = useState(0);
  const [callElapsed, setCallElapsed] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(4);
  const [cameraBusy, setCameraBusy] = useState(false);

  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const recordKickRef = useRef(false);
  const transcriptQueueRef = useRef<LiveTranscriptIngestItem[]>([]);
  const transcriptTimerRef = useRef<number | null>(null);
  const transcriptSendingRef = useRef(false);
  const callElapsedRef = useRef(0);

  const media = useVideoSimulationMedia();

  const sessionShort = useMemo(
    () => (sessionId.length > 10 ? `${sessionId.slice(0, 6)}…` : sessionId),
    [sessionId],
  );

  const useBackendLiveKit = useMemo(
    () => process.env.NEXT_PUBLIC_USE_BACKEND_SESSIONS === "1" && isBackendSessionId(sessionId),
    [sessionId],
  );

  useEffect(() => {
    if (!useBackendLiveKit) return;
    let cancelled = false;
    void (async () => {
      const detail = await getBackendSessionDetail(sessionId);
      if (cancelled || !detail?.scenario_snapshot) return;
      const snap = detail.scenario_snapshot as Record<string, unknown>;
      setRuntimePersona(personaFromScenarioLike(snap));
      if (typeof snap.title === "string" && snap.title.trim()) {
        setRuntimeScenarioTitle(snap.title.trim());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, useBackendLiveKit]);

  useEffect(() => {
    if (phase !== "micTest") return;
    const id = window.setInterval(() => {
      setVolumeLevel(1 + Math.floor(Math.random() * 10));
    }, 450);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "live") return;
    const id = window.setInterval(() => setCallElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    callElapsedRef.current = callElapsed;
  }, [callElapsed]);

  const requestBackendCameraMicAccess = useCallback(async (): Promise<boolean> => {
    setBackendDeviceError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setBackendDeviceError("This browser could not request camera and microphone access.");
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setBackendDeviceError("Camera or microphone access was denied. Allow it and try again.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setBackendDeviceError("No camera or microphone was found on this device.");
      } else {
        setBackendDeviceError("Could not start camera and microphone for this call.");
      }
      return false;
    }
  }, []);

  useEffect(() => {
    if (phase !== "loading") return;
    let cancelled = false;
    void (async () => {
      if (useBackendLiveKit) {
        const ok = await requestBackendCameraMicAccess();
        if (!ok || cancelled) return;
      } else {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 2000);
        });
        if (cancelled) return;
      }
      setPhase("live");
      setCallElapsed(0);
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, requestBackendCameraMicAccess, useBackendLiveKit]);

  /** After loading, enter live and prompt for camera + mic once. */
  useEffect(() => {
    if (useBackendLiveKit) return;
    if (phase !== "live") return;
    let cancelled = false;
    void (async () => {
      setCameraBusy(true);
      try {
        await media.startCamera();
      } finally {
        if (!cancelled) setCameraBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, useBackendLiveKit, media.startCamera]);

  /** Restart recording whenever live, not already recording, and capture tracks exist (e.g. after screen share toggles). */
  useEffect(() => {
    if (useBackendLiveKit) {
      recordKickRef.current = false;
      return;
    }
    if (phase !== "live") {
      recordKickRef.current = false;
      return;
    }
    if (media.recording) return;
    if (!media.cameraStream && !media.screenStream) return;
    if (media.error === "record_failed" || media.error === "record_not_supported") return;

    let cancelled = false;
    const t = window.setTimeout(() => {
      if (cancelled || media.recording || recordKickRef.current) return;
      recordKickRef.current = true;
      void media.startRecording().finally(() => {
        recordKickRef.current = false;
      });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [
    phase,
    useBackendLiveKit,
    media.cameraStream,
    media.screenStream,
    media.recording,
    media.error,
    media.startRecording,
  ]);

  useEffect(() => {
    if (useBackendLiveKit) return;
    const main = mainVideoRef.current;
    const pip = pipVideoRef.current;
    if (phase !== "live") {
      if (main) main.srcObject = null;
      if (pip) pip.srcObject = null;
      return;
    }
    if (media.screenStream && main) {
      main.srcObject = media.screenStream;
      main.muted = true;
      main.playsInline = true;
      void main.play().catch(() => {});
    } else if (main) {
      main.srcObject = null;
    }
    if (media.cameraStream && pip) {
      pip.srcObject = media.cameraStream;
      pip.muted = true;
      pip.playsInline = true;
      void pip.play().catch(() => {});
    } else if (pip) {
      pip.srcObject = null;
    }
  }, [phase, useBackendLiveKit, media.screenStream, media.cameraStream]);

  useEffect(() => {
    return () => {
      if (transcriptTimerRef.current) {
        window.clearTimeout(transcriptTimerRef.current);
      }
    };
  }, []);

  async function flushTranscriptQueue(drain = false) {
    if (!useBackendLiveKit || transcriptSendingRef.current) return;
    transcriptSendingRef.current = true;
    try {
      do {
        const batch = transcriptQueueRef.current.splice(0, 40);
        if (batch.length === 0) break;
        const accepted = await ingestLiveTranscript(sessionId, batch);
        if (!accepted) {
          transcriptQueueRef.current = [...batch, ...transcriptQueueRef.current].slice(0, 200);
          break;
        }
      } while (drain && transcriptQueueRef.current.length > 0);
    } finally {
      transcriptSendingRef.current = false;
    }
  }

  const queueTranscript = useCallback((item: LiveTranscriptIngestItem) => {
    if (!useBackendLiveKit) return;
    transcriptQueueRef.current.push(item);
    if (transcriptTimerRef.current !== null) return;
    transcriptTimerRef.current = window.setTimeout(() => {
      transcriptTimerRef.current = null;
      void flushTranscriptQueue(false);
    }, 700);
  }, [useBackendLiveKit]);

  const handleTranscriptFinal = useCallback(
    (entry: {
      role: "USER" | "ASSISTANT";
      text: string;
      segmentId?: string;
      participantIdentity?: string;
      participantName?: string;
      receivedAtMs: number;
    }) => {
      queueTranscript({
        role: entry.role,
        text: entry.text,
        segment_id: entry.segmentId,
        participant_identity: entry.participantIdentity,
        participant_name: entry.participantName,
        offset_ms: callElapsedRef.current * 1000,
        is_final: true,
      });
    },
    [queueTranscript],
  );

  function formatCallTime(totalSec: number) {
    const m = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  const videoOn = Boolean(media.cameraStream?.getVideoTracks()[0]?.enabled);
  const micOn = Boolean(media.cameraStream?.getAudioTracks()[0]?.enabled);

  async function requestEndSimulation() {
    if (
      !window.confirm(
        "End this simulation? Capture will stop and your session report will open with replay and downloads.",
      )
    ) {
      return;
    }
    setSavingReport(true);
    try {
      if (useBackendLiveKit && phase === "live") {
        const blob = await finalizeLiveKitRecording(sessionId);
        console.info("[simulation-report] video finalize", {
          sessionId,
          hasBlob: Boolean(blob && blob.size > 0),
          size: blob?.size ?? 0,
          type: blob?.type ?? null,
        });
        await flushTranscriptQueue(true);
        await endBackendSimulationSession(sessionId);
        const payload = buildStoredVideoReport({
          sessionId,
          scenarioTitle: runtimeScenarioTitle,
          learnerName,
          remoteName: runtimePersona.name,
          remoteRole: runtimePersona.title,
          callElapsedSec: callElapsed,
          scorecardLabel,
          recording: blob,
          recordingMime: blob?.type,
        });
        let reportToPersist = payload;
        try {
          await saveSessionReport(payload);
        } catch {
          console.error("[simulation-report] video save with recording failed", { sessionId });
          reportToPersist = {
            ...payload,
            recording: undefined,
            recordingMime: undefined,
          };
          await saveSessionReport(reportToPersist);
        }
        if (blob && blob.size > 0 && isBackendSessionId(sessionId)) {
          void startBackgroundSessionRecordingUpload(sessionId, blob, {
            mode: "VIDEO",
            durationMs: callElapsed * 1000,
          })?.then((remote) => {
            if (!remote?.playback_url) return;
            return saveSessionReport({
              ...reportToPersist,
              recordingUrl: remote.playback_url,
              recordingRemoteId: remote.id,
              recordingExpiresAt: remote.expires_at ?? undefined,
              recordingMime: remote.mime_type || reportToPersist.recordingMime,
            }).catch(() => undefined);
          });
        }
        void disposeLiveKitRecording(sessionId).catch(() => undefined);
        router.push(`/simulation/${sessionId}/report?kind=video`);
        return;
      }
      const blob = useBackendLiveKit ? null : await media.finalizeRecording();
      media.stopScreen();
      media.stopCamera();
      const payload = buildStoredVideoReport({
        sessionId,
        scenarioTitle: runtimeScenarioTitle,
        learnerName,
        remoteName: runtimePersona.name,
        remoteRole: runtimePersona.title,
        callElapsedSec: phase === "live" ? callElapsed : 0,
        scorecardLabel,
        recording: blob,
        recordingMime: blob?.type,
      });
      let reportToPersist = payload;
      try {
        await saveSessionReport(payload);
      } catch {
        reportToPersist = {
          ...payload,
          recording: undefined,
          recordingMime: undefined,
        };
        await saveSessionReport(reportToPersist);
      }
      if (blob && blob.size > 0 && isBackendSessionId(sessionId)) {
        void startBackgroundSessionRecordingUpload(sessionId, blob, {
          mode: "VIDEO",
          durationMs: (phase === "live" ? callElapsed : 0) * 1000,
        })?.then((remote) => {
          if (!remote?.playback_url) return;
          return saveSessionReport({
            ...reportToPersist,
            recordingUrl: remote.playback_url,
            recordingRemoteId: remote.id,
            recordingExpiresAt: remote.expires_at ?? undefined,
            recordingMime: remote.mime_type || reportToPersist.recordingMime,
          }).catch(() => undefined);
        });
      }
      setPhase("prepare");
      router.push(`/simulation/${sessionId}/report?kind=video`);
    } finally {
      setSavingReport(false);
    }
  }

  async function requestEndCall() {
    if (!window.confirm("End this call? Recording will stop and capture will end.")) return;
    if (useBackendLiveKit) {
      await disposeLiveKitRecording(sessionId);
      await flushTranscriptQueue(true);
      await endBackendSimulationSession(sessionId);
    }
    media.stopRecording();
    media.stopScreen();
    media.stopCamera();
    setPhase("prepare");
    setCallElapsed(0);
  }

  const showOverlay = phase === "prepare" || phase === "micTest" || phase === "loading";
  const live = phase === "live";
  const showPip = live && Boolean(media.cameraStream);

  return (
    <div className="sim-root flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-[var(--background)] text-[#111111]">
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
            onClick={() => setInfoOpen(true)}
            className="cursor-pointer rounded-lg px-2 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:bg-[var(--field)] hover:text-[#111111] hover:underline sm:hidden"
          >
            View info
          </button>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 flex items-center justify-center">
          <div className="pointer-events-auto flex flex-col items-center justify-center gap-0.5">
            <span className="sr-only">Video call simulation</span>
            <span className="-mb-px inline-flex" aria-hidden>
              <IconVideo className={live ? "text-[#111111]" : "text-[var(--muted)]"} />
            </span>
            <span className="font-mono text-[10px] uppercase leading-none tracking-[0.26em] text-[var(--faint)]">
              {live ? "Live" : "Room"}
            </span>
            <SimArcUnderline active={live} />
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
            onClick={() => setInfoOpen(true)}
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
          className={`relative flex min-h-[min(560px,calc(100vh-6rem))] flex-1 flex-col overflow-hidden rounded-[2rem] bg-[#1e1e1e] text-white shadow-[0_24px_60px_-32px_rgba(0,0,0,0.35)] ${live ? "sim-live-panel" : ""}`}
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
                  aria-labelledby="video-prepare-title"
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
                    id="video-prepare-title"
                    className="pr-10 text-xl font-semibold tracking-[-0.02em] text-[#111111] sm:text-2xl"
                  >
                    Get ready for your video simulation
                  </h1>
                  <div className="mt-6 flex items-start gap-3 rounded-xl bg-[var(--field)]/80 px-3 py-3 text-[14px] leading-snug text-[var(--muted)]">
                    <IconFocus />
                    <span>Find a space to focus</span>
                  </div>
                  <div className="mt-8 space-y-6">
                    <SelectField
                      id="video-mic"
                      label="Microphone"
                      value={String(micIndex)}
                      onChange={(v) => setMicIndex(Number(v))}
                      options={MIC_OPTIONS}
                    />
                    <SelectField
                      id="video-cam"
                      label="Camera"
                      value={String(camIndex)}
                      onChange={(v) => setCamIndex(Number(v))}
                      options={CAM_OPTIONS}
                    />
                    <SelectField
                      id="video-spk"
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
                  aria-labelledby="video-mic-test-title"
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
                    id="video-mic-test-title"
                    className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[#111111] sm:text-2xl"
                  >
                    Mic test
                  </h2>
                  <div className="mt-8">
                    <SelectField
                      id="video-mic-test-select"
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
                  {backendDeviceError ? (
                    <p className="mt-4 text-center text-[13px] leading-relaxed text-[#8a1c1c]">
                      {backendDeviceError}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {live ? (
            <>
              <div className="relative min-h-0 flex-1">
                {useBackendLiveKit ? (
                  <div className="absolute inset-0 z-20 flex min-h-0 flex-col bg-[#1e1e1e]">
                    <MemoLiveKitRoomStage
                      sessionId={sessionId}
                      mode="video"
                      className="flex min-h-0 flex-1 flex-col"
                      remoteName={runtimePersona.name}
                      remoteRole={runtimePersona.title}
                      remoteAvatarUrl={runtimePersona.avatarUrl}
                      learnerName={learnerName}
                      onTranscriptFinal={handleTranscriptFinal}
                    />
                  </div>
                ) : null}
                {media.screenStream ? (
                  <video
                    ref={mainVideoRef}
                    className="h-full w-full object-contain"
                    playsInline
                    muted
                    autoPlay
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-6 pb-36 pt-10 text-center">
                    {cameraBusy ? (
                      <div className="flex flex-col items-center gap-3 text-white/70">
                        <div
                          className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin"
                          aria-hidden
                        />
                        <p className="text-[14px] font-medium">Connecting camera…</p>
                      </div>
                    ) : null}
                    {!cameraBusy ? (
                      <>
                        <div className="relative flex h-32 w-32 items-center justify-center sm:h-36 sm:w-36">
                          <div
                            className="absolute inset-0 rounded-full bg-violet-500/15 blur-xl"
                            aria-hidden
                          />
                          <div
                            className="absolute inset-2 rounded-full border border-violet-400/25"
                            aria-hidden
                          />
                          <div
                            className="absolute inset-0 rounded-full border border-violet-300/20"
                            aria-hidden
                          />
                          <PersonaAvatar
                            persona={runtimePersona}
                            className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 text-2xl font-semibold text-white shadow-inner ring-2 ring-white/10 sm:h-32 sm:w-32 sm:text-3xl"
                          />
                        </div>
                        <p className="mt-10 font-mono text-[2rem] font-medium tabular-nums tracking-tight text-white sm:text-[2.25rem]">
                          {formatCallTime(callElapsed)}
                        </p>
                        <p className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                          {runtimePersona.name}
                        </p>
                        <p className="mt-2 max-w-md text-[15px] text-white/65">{runtimePersona.title}</p>
                      </>
                    ) : null}
                  </div>
                )}

                {showPip ? (
                  <div className="absolute bottom-28 right-5 z-10 w-[min(42%,220px)] overflow-hidden rounded-2xl border border-white/15 bg-black/80 shadow-lg ring-1 ring-white/10 sm:right-8 sm:w-56">
                    <div className="relative aspect-video w-full">
                      <video
                        ref={pipVideoRef}
                        className="h-full w-full object-cover"
                        playsInline
                        muted
                        autoPlay
                      />
                      <span
                        className={`absolute right-2 top-2 h-2 w-2 rounded-full ${
                          videoOn ? "bg-emerald-400" : "bg-zinc-500"
                        }`}
                        title={videoOn ? "Camera on" : "Camera off"}
                        aria-hidden
                      />
                      <p className="absolute bottom-2 left-2 text-[11px] font-semibold text-white/95">
                        {learnerName}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {media.errorMessage ? (
                <div
                  className="shrink-0 border-t border-amber-400/25 bg-amber-500/10 px-4 py-2.5 text-[13px] text-amber-50"
                  role="alert"
                >
                  {media.errorMessage}
                  <button
                    type="button"
                    onClick={() => media.clearError()}
                    className="ml-3 font-medium text-white underline underline-offset-2"
                  >
                    Dismiss
                  </button>
                </div>
              ) : null}

              <div
                className={`absolute bottom-0 left-0 right-0 flex flex-col items-center gap-2 px-4 pb-8 pt-4 ${
                  useBackendLiveKit ? "z-30" : "z-10"
                }`}
              >
                <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/45 px-2 py-2 backdrop-blur-sm sm:gap-2 sm:px-3">
                  <button
                    type="button"
                    disabled={useBackendLiveKit || !media.cameraStream}
                    onClick={() => media.toggleCameraVideo()}
                    className={`sim-transition flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      videoOn
                        ? "border-white/15 bg-white text-[#1e1e1e] hover:bg-white/90"
                        : "border-amber-400/50 bg-amber-500/20 text-amber-100"
                    }`}
                    aria-pressed={videoOn}
                    aria-label={videoOn ? "Turn camera off" : "Turn camera on"}
                  >
                    <IconVideo />
                  </button>
                  <button
                    type="button"
                    disabled={useBackendLiveKit || !media.cameraStream}
                    onClick={() => media.toggleCameraMic()}
                    className={`sim-transition flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      micOn
                        ? "border-white/15 bg-white text-[#1e1e1e] hover:bg-white/90"
                        : "border-amber-400/50 bg-amber-500/20 text-amber-100"
                    }`}
                    aria-pressed={micOn}
                    aria-label={micOn ? "Mute" : "Unmute"}
                  >
                    <IconMic />
                  </button>
                  {!useBackendLiveKit ? (
                    !media.screenStream ? (
                      <button
                        type="button"
                        onClick={() => void media.startScreenShare()}
                        className="sim-transition flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/15"
                        aria-label="Share screen"
                      >
                        <IconMonitor />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => media.stopScreen()}
                        className="sim-transition flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-sky-400/50 bg-sky-600 text-white shadow-[0_0_0_2px_rgba(14,165,233,0.35)]"
                        aria-label="Stop sharing"
                      >
                        <IconMonitor />
                      </button>
                    )
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void requestEndCall()}
                    className="sim-transition cursor-pointer rounded-xl bg-[#dc2626] px-5 py-3 text-[12px] font-semibold tracking-wide text-white shadow-[0_8px_24px_-8px_rgba(220,38,38,0.5)] hover:bg-[#b91c1c] sm:px-6"
                  >
                    End call
                  </button>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  {media.recording ? (
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rose-300/90">
                      Recording
                    </p>
                  ) : null}
                  <p className="max-w-xs font-mono text-[10px] uppercase leading-snug tracking-[0.14em] text-white/40">
                    End simulation to open your report — replay and downloads are there.
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
                    Session {sessionShort} · {learnerName}
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {infoOpen ? (
        <div
          className="fixed inset-0 z-30"
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-info-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#111111]/25 backdrop-blur-[1px]"
            aria-label="Close info panel"
            onClick={() => setInfoOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(100%,24rem)] flex-col border-l border-[var(--rule)] bg-[var(--surface)] shadow-[0_0_48px_-12px_rgba(0,0,0,0.18)]">
            <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-[var(--rule)] px-4">
              <span
                id="video-info-title"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]"
              >
                View info
              </span>
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
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
                  {runtimeScenarioTitle}
                </p>
              </section>
              <section className="mt-10">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--faint)]">
                  Persona
                </p>
                <p className="mt-3 text-[15px] font-medium tracking-[-0.01em] text-[#111111]">
                  {runtimePersona.name}
                </p>
                <p className="mt-1 text-[14px] leading-relaxed text-[var(--muted)]">{runtimePersona.title}</p>
                {runtimePersona.blurb ? (
                  <p className="mt-6 text-[14px] leading-[1.65] text-[var(--muted)]">{runtimePersona.blurb}</p>
                ) : (
                  <p className="mt-6 text-[14px] leading-[1.65] text-[var(--muted)]">
                    This room uses your real camera, microphone, and optional screen capture. Recording
                    runs automatically while you are in the call; when you end the simulation, open your
                    report to replay and download.
                  </p>
                )}
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
        kind="video"
        sessionId={sessionId}
      />
    </div>
  );
}
