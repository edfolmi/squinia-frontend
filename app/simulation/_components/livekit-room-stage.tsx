"use client";

import { memo, useEffect, useState } from "react";

import type { TrackReference } from "@livekit/components-core";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  VideoTrack,
  useAudioPlayback,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { Participant, RoomEvent, type TranscriptionSegment } from "livekit-client";

import { issueLiveKitConnection } from "../_lib/backend-simulation";

type Props = {
  sessionId: string;
  /** Voice (phone): publish/listen audio only. Video: local camera pip + remote audio + avatar (training layout). */
  mode: "audio" | "video";
  className?: string;
  /** Video layout: interviewer / opponent shown as initials avatar (remote is audio-only from agent). */
  remoteName?: string;
  remoteRole?: string;
  learnerName?: string;
  /** Call timer label, e.g. ``00:12`` — matches the non-LiveKit video stage. */
  elapsedLabel?: string;
  onTranscriptFinal?: (entry: {
    role: "USER" | "ASSISTANT";
    text: string;
    segmentId?: string;
    participantIdentity?: string;
    participantName?: string;
    receivedAtMs: number;
  }) => void;
};

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  const a = p[0]?.[0] ?? "?";
  const b = p.length > 1 ? p[p.length - 1]?.[0] : p[0]?.[1];
  return `${a}${b ?? ""}`.toUpperCase();
}

function LiveKitAudioGate() {
  const { canPlayAudio } = useAudioPlayback();

  if (canPlayAudio) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-30 flex justify-center px-4">
      <StartAudio
        label="Tap to hear the agent"
        className="pointer-events-auto rounded-xl border border-white/20 bg-black/70 px-4 py-2 text-[13px] font-medium text-white shadow-lg backdrop-blur-sm"
      />
    </div>
  );
}

/**
 * Remote participant is expected to be **audio-only** (LiveKit agent). Learner publishes camera + mic.
 * Mirrors the original video simulation: large persona avatar + timer, small self-view pip.
 */
function VideoTrainingLiveKitLayout({
  remoteName,
  remoteRole,
  learnerName,
  elapsedLabel,
}: {
  remoteName: string;
  remoteRole?: string;
  learnerName: string;
  elapsedLabel?: string;
}) {
  const { localParticipant, cameraTrack } = useLocalParticipant();

  const trackRef: TrackReference | undefined =
    cameraTrack && cameraTrack.track
      ? {
          participant: localParticipant,
          publication: cameraTrack,
          source: cameraTrack.source,
        }
      : undefined;

  return (
    <div className="relative flex h-full min-h-[280px] w-full flex-col">
      <RoomAudioRenderer />

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-40 pt-10 text-center">
        <div className="relative flex h-32 w-32 items-center justify-center sm:h-36 sm:w-36">
          <div className="absolute inset-0 rounded-full bg-violet-500/15 blur-xl" aria-hidden />
          <div className="absolute inset-2 rounded-full border border-violet-400/25" aria-hidden />
          <div className="absolute inset-0 rounded-full border border-violet-300/20" aria-hidden />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 text-2xl font-semibold text-white shadow-inner ring-2 ring-white/10 sm:h-32 sm:w-32 sm:text-3xl">
            {initials(remoteName)}
          </div>
        </div>

        {elapsedLabel ? (
          <p className="mt-10 font-mono text-[2rem] font-medium tabular-nums tracking-tight text-white sm:text-[2.25rem]">
            {elapsedLabel}
          </p>
        ) : null}

        <p className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">{remoteName}</p>
        {remoteRole ? <p className="mt-2 max-w-md text-[15px] text-white/65">{remoteRole}</p> : null}
        <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-white/45">
          Training partner is audio-only over LiveKit. Your camera is shown in the preview below.
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-28 right-5 z-10 w-[min(42%,220px)] sm:right-8 sm:w-56">
        <div className="pointer-events-auto overflow-hidden rounded-2xl border border-white/15 bg-black/80 shadow-lg ring-1 ring-white/10">
          <div className="relative aspect-video w-full bg-zinc-900">
            {trackRef ? (
              <VideoTrack trackRef={trackRef} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full min-h-[120px] items-center justify-center px-3 text-center text-[12px] text-white/50">
                Starting camera…
              </div>
            )}
            <span
              className={`absolute right-2 top-2 h-2 w-2 rounded-full ${
                cameraTrack && !cameraTrack.isMuted ? "bg-emerald-400" : "bg-zinc-500"
              }`}
              title={cameraTrack && !cameraTrack.isMuted ? "Camera on" : "Camera off"}
              aria-hidden
            />
            <p className="absolute bottom-2 left-2 text-[11px] font-semibold text-white/95">{learnerName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Joins the LiveKit room for a **persisted** simulation session (`POST /api/v1/sessions` UUID).
 * Requires `NEXT_PUBLIC_USE_BACKEND_SESSIONS` and LiveKit env on the API.
 */
export function LiveKitRoomStage({
  sessionId,
  mode,
  className,
  remoteName = "Interviewer",
  remoteRole,
  learnerName = "You",
  elapsedLabel,
  onTranscriptFinal,
}: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setError(null);
      setUrl(null);
      setToken(null);
      const conn = await issueLiveKitConnection(sessionId);
      if (cancelled) return;
      if (!conn) {
        setError("Could not get LiveKit credentials from the API.");
        return;
      }
      if (!conn.server_url || !conn.participant_token) {
        setError("API returned incomplete LiveKit credentials.");
        return;
      }
      console.info("[livekit] credentials received", {
        room: conn.room_name,
        hasServerUrl: Boolean(conn.server_url),
        hasParticipantToken: Boolean(conn.participant_token),
      });
      setUrl(conn.server_url);
      setToken(conn.participant_token);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (error) {
    return (
      <div
        className={`rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-3 text-center text-[13px] text-amber-50 ${className ?? ""}`}
      >
        {error}
      </div>
    );
  }

  if (!url || !token) {
    return (
      <div className={`flex items-center justify-center py-8 text-[13px] text-white/60 ${className ?? ""}`}>
        Connecting to LiveKit…
      </div>
    );
  }

  const publishVideo = mode === "video";

  return (
    <div className={`min-h-0 flex-1 ${className ?? ""}`}>
      <LiveKitRoom
        serverUrl={url}
        token={token}
        connect
        audio
        video={publishVideo}
        onConnected={() => {
          console.info("[livekit] connected", { sessionId, mode, serverUrl: url });
          setError(null);
        }}
        onDisconnected={(reason) => {
          console.warn("[livekit] disconnected", { sessionId, reason });
        }}
        onError={(err) => {
          const message = err instanceof Error ? err.message : "LiveKit connection failed.";
          console.error("[livekit] error", { sessionId, message, err });
          setError(message);
        }}
      >
        <LiveKitAudioGate />
        <LiveKitTranscriptBridge onTranscriptFinal={onTranscriptFinal} />
        {mode === "video" ? (
          <VideoTrainingLiveKitLayout
            remoteName={remoteName}
            remoteRole={remoteRole}
            learnerName={learnerName}
            elapsedLabel={elapsedLabel}
          />
        ) : (
          <RoomAudioRenderer />
        )}
      </LiveKitRoom>
    </div>
  );
}

export const MemoLiveKitRoomStage = memo(LiveKitRoomStage);

function LiveKitTranscriptBridge({
  onTranscriptFinal,
}: {
  onTranscriptFinal?: Props["onTranscriptFinal"];
}) {
  const room = useRoomContext();

  useEffect(() => {
    if (!onTranscriptFinal) return;
    const handler = (segments: TranscriptionSegment[], participant?: Participant) => {
      const localIdentity = room.localParticipant?.identity;
      const participantIdentity = participant?.identity;
      const participantName = participant?.name;
      const role: "USER" | "ASSISTANT" =
        participantIdentity && participantIdentity === localIdentity ? "USER" : "ASSISTANT";

      for (const seg of segments) {
        const text = (seg.text || "").trim();
        if (!text || !seg.final) continue;
        onTranscriptFinal({
          role,
          text,
          segmentId: seg.id,
          participantIdentity,
          participantName,
          receivedAtMs: Date.now(),
        });
      }
    };

    room.on(RoomEvent.TranscriptionReceived, handler);
    return () => {
      room.off(RoomEvent.TranscriptionReceived, handler);
    };
  }, [room, onTranscriptFinal]);

  return null;
}
