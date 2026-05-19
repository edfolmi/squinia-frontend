"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MemoLiveKitRoomStage } from "@/app/simulation/_components/livekit-room-stage";
import { finalizeLiveKitRecording } from "@/app/simulation/_lib/livekit-session-recording";
import type { LiveKitConnection } from "@/app/simulation/_lib/backend-simulation";

import { LoadingAssessment, VettingPublicShell, modeLabel } from "../../_components/vetting-public-ui";
import {
  type LiveTranscriptIngestItem,
  type VettingAttempt,
  type VettingMode,
  startBackgroundVettingRecordingUpload,
  vettingPublic,
} from "../../_lib/vetting-client";

type Line = {
  id: string;
  role: "ai" | "user";
  text: string;
};

function formatClock(totalSec: number) {
  const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function VettingSessionClient({ attemptToken }: { attemptToken: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<VettingAttempt | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mode, setMode] = useState<VettingMode>("TEXT");
  const [lines, setLines] = useState<Line[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ending, setEnding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number>(Date.now());
  const openingPostedRef = useRef(false);

  const assessment = attempt?.assessment ?? null;
  const liveMode = mode === "VOICE" || mode === "VIDEO";

  const start = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await vettingPublic.startAttempt(attemptToken);
    if (!res.ok) {
      setError(res.message);
      setLoading(false);
      return;
    }
    setAttempt(res.data.attempt);
    setSessionId(res.data.session_id);
    setMode(res.data.mode);
    startedAtRef.current = Date.now();
    setLoading(false);
  }, [attemptToken]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void start();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [start]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000)));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (loading || mode !== "TEXT" || openingPostedRef.current) return;
    openingPostedRef.current = true;
    setBusy(true);
    void (async () => {
      const res = await vettingPublic.postOpening(attemptToken);
      if (res.ok) {
        setLines([
          {
            id: crypto.randomUUID(),
            role: "ai",
            text: res.data.assistant_content,
          },
        ]);
      } else {
        setError(res.message);
      }
      setBusy(false);
    })();
  }, [attemptToken, loading, mode]);

  const connectionLoader = useCallback(
    async (_sessionId: string): Promise<LiveKitConnection | null> => {
      return vettingPublic.issueLiveKitConnection(attemptToken);
    },
    [attemptToken],
  );

  const elapsedLabel = useMemo(() => formatClock(elapsed), [elapsed]);

  async function sendMessage(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    setLines((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text }]);
    setDraft("");
    const res = await vettingPublic.sendChat(attemptToken, text);
    if (!res.ok) {
      setError(res.message);
      setBusy(false);
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "ai",
        text: res.data.assistant_content,
      },
    ]);
    setBusy(false);
  }

  async function onTranscriptFinal(entry: {
    role: "USER" | "ASSISTANT";
    text: string;
    segmentId?: string;
    participantIdentity?: string;
    participantName?: string;
    receivedAtMs: number;
  }) {
    const item: LiveTranscriptIngestItem = {
      role: entry.role,
      text: entry.text,
      segment_id: entry.segmentId,
      participant_identity: entry.participantIdentity,
      participant_name: entry.participantName,
      offset_ms: Math.max(0, entry.receivedAtMs - startedAtRef.current),
      is_final: true,
    };
    await vettingPublic.ingestTranscript(attemptToken, [item]);
  }

  async function end() {
    if (ending) return;
    setEnding(true);
    setError(null);
    if (liveMode && sessionId) {
      const durationMs = Math.max(0, Date.now() - startedAtRef.current);
      void finalizeLiveKitRecording(sessionId)
        .then((blob) => {
          void startBackgroundVettingRecordingUpload(attemptToken, blob, {
            mode,
            durationMs,
          });
        })
        .catch(() => undefined);
    }
    const res = await vettingPublic.endAttempt(attemptToken);
    if (!res.ok) {
      setError(res.message);
      setEnding(false);
      return;
    }
    router.push(`/vetting/attempt/${encodeURIComponent(attemptToken)}?completed=1`);
  }

  if (loading) {
    return (
      <VettingPublicShell assessment={assessment}>
        <LoadingAssessment />
      </VettingPublicShell>
    );
  }

  if (!attempt || !assessment || !sessionId) {
    return (
      <VettingPublicShell assessment={assessment}>
        <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-[var(--warning-soft)] px-5 py-4 text-[14px] leading-6 text-amber-950">
          {error || "We could not start this vetting session."}
        </div>
      </VettingPublicShell>
    );
  }

  return (
    <VettingPublicShell assessment={assessment}>
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">
              {modeLabel(mode)} room
            </p>
            <h1 className="mt-2 truncate text-2xl font-semibold tracking-[-0.035em] text-[var(--foreground)] sm:text-3xl">
              {assessment.title}
            </h1>
            <p className="mt-2 text-[13px] text-[var(--muted)]">
              Candidate: {attempt.candidate_name} | {elapsedLabel}
            </p>
          </div>
          <button
            type="button"
            disabled={ending}
            onClick={() => void end()}
            className="sim-btn-accent px-5 py-3 font-mono text-[10px] uppercase"
          >
            {ending ? "Submitting" : "End assessment"}
          </button>
        </div>

        {error ? (
          <p className="rounded-xl border border-amber-200 bg-[var(--warning-soft)] px-4 py-3 text-[13px] leading-5 text-amber-950">
            {error}
          </p>
        ) : null}

        {mode === "TEXT" ? (
          <section className="flex min-h-[66dvh] flex-col rounded-2xl border border-[var(--rule)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <ol className="space-y-5">
                {lines.map((line) => (
                  <li key={line.id} className={`flex ${line.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[min(100%,40rem)] rounded-2xl px-4 py-3 text-[15px] leading-7 ${
                        line.role === "user"
                          ? "bg-[var(--accent)] text-white"
                          : "border border-[var(--rule)] bg-[var(--field)]/55 text-[var(--foreground)]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{line.text}</p>
                    </div>
                  </li>
                ))}
                {busy ? (
                  <li className="text-[13px] text-[var(--muted)]" aria-live="polite">
                    Interviewer is responding...
                  </li>
                ) : null}
              </ol>
            </div>
            <form onSubmit={(event) => void sendMessage(event)} className="border-t border-[var(--rule)] bg-[var(--field)]/45 p-3 sm:p-4">
              <label htmlFor="vetting-reply" className="sr-only">
                Your reply
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <textarea
                  id="vetting-reply"
                  rows={3}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  disabled={busy || ending}
                  className="squinia-input min-h-[5.25rem] flex-1 resize-none px-3 py-3 text-[15px]"
                  placeholder="Type your response..."
                />
                <button
                  type="submit"
                  disabled={busy || ending || !draft.trim()}
                  className="sim-btn-accent px-6 py-3 font-mono text-[10px] uppercase sm:self-end"
                >
                  Send
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section className="min-h-[68dvh] overflow-hidden rounded-2xl border border-[#20252a] bg-[#090b0f] shadow-[0_28px_80px_-48px_rgba(0,0,0,0.55)]">
            <div className="flex min-h-[68dvh] flex-col">
              <div className="border-b border-white/10 px-4 py-3 text-white sm:px-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
                  Live {modeLabel(mode)}
                </p>
              </div>
              <MemoLiveKitRoomStage
                sessionId={sessionId}
                mode={mode === "VIDEO" ? "video" : "audio"}
                connectionLoader={connectionLoader}
                remoteName="Squinia interviewer"
                remoteRole="Assessment facilitator"
                learnerName={attempt.candidate_name}
                elapsedLabel={elapsedLabel}
                onTranscriptFinal={(entry) => void onTranscriptFinal(entry)}
              />
            </div>
          </section>
        )}
      </div>
    </VettingPublicShell>
  );
}
