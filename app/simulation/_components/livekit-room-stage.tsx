"use client";

import { memo, useEffect, useRef, useState } from "react";

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
import { Participant, RoomEvent, Track, type TranscriptionSegment } from "livekit-client";

import { issueLiveKitConnection } from "../_lib/backend-simulation";
import {
  registerLiveKitRecordingController,
  unregisterLiveKitRecordingController,
} from "../_lib/livekit-session-recording";
import { PersonaAvatar } from "../_lib/persona-runtime";

type Props = {
  sessionId: string;
  mode: "audio" | "video";
  className?: string;
  remoteName?: string;
  remoteRole?: string;
  remoteAvatarUrl?: string;
  learnerName?: string;
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

function LiveKitAudioGate() {
  const { canPlayAudio } = useAudioPlayback();

  if (canPlayAudio) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-30 flex justify-center px-4">
      <StartAudio
        label="Tap to hear the call"
        className="pointer-events-auto rounded-xl border border-white/20 bg-black/70 px-4 py-2 text-[13px] font-medium text-white shadow-lg backdrop-blur-sm"
      />
    </div>
  );
}

function pickRecorderMime(mode: Props["mode"]): string | undefined {
  const candidates =
    mode === "video"
      ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
      : ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return undefined;
}

function LiveKitSessionRecorder({ sessionId, mode }: Pick<Props, "sessionId" | "mode">) {
  const room = useRoomContext();

  useEffect(() => {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      return;
    }

    const AudioContextCtor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    const audioContext = new AudioContextCtor();
    const destination = audioContext.createMediaStreamDestination();
    const mime = pickRecorderMime(mode);
    const chunks: Blob[] = [];
    const localInputs = new Map<string, MediaStreamAudioSourceNode>();
    const remoteInputs = new Map<string, MediaStreamAudioSourceNode>();
    const stopWaiters = new Set<() => void>();

    let recorder: MediaRecorder | null = null;
    let videoClone: MediaStreamTrack | null = null;
    let recordedBlob: Blob | null = null;
    let finalized = false;
    let disposed = false;
    let discardBlob = false;

    function resolveStopWaiters() {
      for (const resolve of stopWaiters) resolve();
      stopWaiters.clear();
    }

    async function ensureAudioContextReady() {
      if (audioContext.state === "suspended") {
        try {
          await audioContext.resume();
        } catch {
          /* ignore */
        }
      }
    }

    function waitForRecorderStop() {
      return new Promise<void>((resolve) => {
        if (!recorder) {
          resolve();
          return;
        }
        stopWaiters.add(resolve);
      });
    }

    function disconnectInputs(inputs: Map<string, MediaStreamAudioSourceNode>) {
      inputs.forEach((node) => {
        try {
          node.disconnect();
        } catch {
          /* ignore */
        }
      });
      inputs.clear();
    }

    function syncAudioInputs(
      nextTracks: Map<string, MediaStreamTrack>,
      target: Map<string, MediaStreamAudioSourceNode>,
    ) {
      for (const [key, node] of target.entries()) {
        if (nextTracks.has(key)) continue;
        try {
          node.disconnect();
        } catch {
          /* ignore */
        }
        target.delete(key);
      }

      for (const [key, track] of nextTracks.entries()) {
        if (target.has(key)) continue;
        try {
          const source = audioContext.createMediaStreamSource(new MediaStream([track]));
          source.connect(destination);
          target.set(key, source);
        } catch {
          /* ignore */
        }
      }
    }

    function syncLocalTracks() {
      const nextAudio = new Map<string, MediaStreamTrack>();
      const micTrack =
        room.localParticipant.getTrackPublication(Track.Source.Microphone)?.track?.mediaStreamTrack ??
        null;
      if (micTrack) {
        nextAudio.set("local-microphone", micTrack);
      }
      syncAudioInputs(nextAudio, localInputs);
    }

    function syncRemoteTracks() {
      const nextAudio = new Map<string, MediaStreamTrack>();
      for (const participant of room.remoteParticipants.values()) {
        for (const publication of participant.trackPublications.values()) {
          const mediaTrack = publication.track?.mediaStreamTrack;
          if (!mediaTrack || publication.kind !== Track.Kind.Audio) continue;
          nextAudio.set(publication.trackSid || `${participant.identity}:${publication.source}`, mediaTrack);
        }
      }
      syncAudioInputs(nextAudio, remoteInputs);
    }

    function getLocalCameraTrack() {
      return room.localParticipant.getTrackPublication(Track.Source.Camera)?.track?.mediaStreamTrack ?? null;
    }

    async function maybeStartRecorder() {
      if (disposed || recorder) return;

      const output = new MediaStream();
      if (mode === "video") {
        const cameraTrack = getLocalCameraTrack();
        if (!cameraTrack) return;
        videoClone = cameraTrack.clone();
        output.addTrack(videoClone);
      }

      const mixedAudioTrack = destination.stream.getAudioTracks()[0];
      if (mixedAudioTrack) {
        output.addTrack(mixedAudioTrack);
      }

      if (output.getTracks().length === 0) return;

      await ensureAudioContextReady();

      try {
        recorder =
          mime !== undefined
            ? new MediaRecorder(output, { mimeType: mime })
            : new MediaRecorder(output);
      } catch {
        output.getTracks().forEach((track) => track.stop());
        videoClone = null;
        return;
      }

      console.info("[livekit-recording] started", {
        sessionId,
        mode,
        trackCount: output.getTracks().length,
        mime: mime ?? recorder.mimeType,
      });

      recorder.ondataavailable = (event) => {
        if (event.data?.size) {
          chunks.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blobType =
          mime?.split(";")[0] || recorder?.mimeType || (mode === "video" ? "video/webm" : "audio/webm");

        recorder = null;
        if (videoClone) {
          videoClone.stop();
          videoClone = null;
        }
        output.getTracks().forEach((track) => {
          if (track.readyState === "live") {
            track.stop();
          }
        });

        if (discardBlob) {
          recordedBlob = null;
          chunks.length = 0;
        } else {
          recordedBlob = new Blob(chunks, { type: blobType });
          chunks.length = 0;
        }

        console.info("[livekit-recording] stopped", {
          sessionId,
          mode,
          discarded: discardBlob,
          size: recordedBlob?.size ?? 0,
          type: recordedBlob?.type ?? blobType,
        });

        resolveStopWaiters();
      };
      recorder.start(250);
    }

    async function finalizeRecording() {
      finalized = true;
      discardBlob = false;
      await maybeStartRecorder();
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          recorder = null;
        }
      }
      await waitForRecorderStop();
      console.info("[livekit-recording] finalized", {
        sessionId,
        mode,
        size: recordedBlob?.size ?? 0,
        hasBlob: Boolean(recordedBlob && recordedBlob.size > 0),
      });
      return recordedBlob && recordedBlob.size > 0 ? recordedBlob : null;
    }

    async function disposeRecording(options?: { discard?: boolean }) {
      disposed = true;
      discardBlob = options?.discard ?? false;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          recorder = null;
        }
        await waitForRecorderStop();
      }
      disconnectInputs(localInputs);
      disconnectInputs(remoteInputs);
      if (videoClone) {
        videoClone.stop();
        videoClone = null;
      }
      if (audioContext.state !== "closed") {
        try {
          await audioContext.close();
        } catch {
          /* ignore */
        }
      }
    }

    function handleTrackChange() {
      syncLocalTracks();
      syncRemoteTracks();
      if (!finalized) {
        void maybeStartRecorder();
      }
    }

    syncLocalTracks();
    syncRemoteTracks();
    void maybeStartRecorder();

    const controller = {
      finalize: finalizeRecording,
      dispose: disposeRecording,
    };

    registerLiveKitRecordingController(sessionId, controller);
    room.on(RoomEvent.TrackSubscribed, handleTrackChange);
    room.on(RoomEvent.TrackUnsubscribed, handleTrackChange);
    room.on(RoomEvent.ParticipantConnected, handleTrackChange);
    room.on(RoomEvent.ParticipantDisconnected, handleTrackChange);
    room.on(RoomEvent.LocalTrackPublished, handleTrackChange);
    room.on(RoomEvent.LocalTrackUnpublished, handleTrackChange);

    return () => {
      room.off(RoomEvent.TrackSubscribed, handleTrackChange);
      room.off(RoomEvent.TrackUnsubscribed, handleTrackChange);
      room.off(RoomEvent.ParticipantConnected, handleTrackChange);
      room.off(RoomEvent.ParticipantDisconnected, handleTrackChange);
      room.off(RoomEvent.LocalTrackPublished, handleTrackChange);
      room.off(RoomEvent.LocalTrackUnpublished, handleTrackChange);
      unregisterLiveKitRecordingController(sessionId, controller);
      void disposeRecording({ discard: true });
    };
  }, [mode, room, sessionId]);

  return null;
}

function VideoTrainingLiveKitLayout({
  remoteName,
  remoteRole,
  remoteAvatarUrl,
  learnerName,
  elapsedLabel,
}: {
  remoteName: string;
  remoteRole?: string;
  remoteAvatarUrl?: string;
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
          <PersonaAvatar
            persona={{ name: remoteName, avatarUrl: remoteAvatarUrl ?? "" }}
            className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 text-2xl font-semibold text-white shadow-inner ring-2 ring-white/10 sm:h-32 sm:w-32 sm:text-3xl"
          />
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
                Starting camera...
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

export function LiveKitRoomStage({
  sessionId,
  mode,
  className,
  remoteName = "Interviewer",
  remoteRole,
  remoteAvatarUrl,
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
        setError("We could not start the call. Please try again.");
        return;
      }
      if (!conn.server_url || !conn.participant_token) {
        setError("The call could not be prepared. Please refresh and try again.");
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
        Connecting to call...
      </div>
    );
  }

  return (
    <div className={`min-h-0 flex-1 ${className ?? ""}`}>
      <LiveKitRoom
        serverUrl={url}
        token={token}
        connect
        audio
        video={mode === "video"}
        onConnected={() => {
          console.info("[livekit] connected", { sessionId, mode, serverUrl: url });
          setError(null);
        }}
        onDisconnected={(reason) => {
          console.warn("[livekit] disconnected", { sessionId, reason });
        }}
        onError={(err) => {
          const message = err instanceof Error ? err.message : "The call connection failed.";
          console.error("[livekit] error", { sessionId, message, err });
          setError("The call connection was interrupted. Please try joining again.");
        }}
      >
        <LiveKitAudioGate />
        <LiveKitSessionRecorder sessionId={sessionId} mode={mode} />
        <LiveKitTranscriptBridge onTranscriptFinal={onTranscriptFinal} />
        {mode === "video" ? (
          <VideoTrainingLiveKitLayout
            remoteName={remoteName}
            remoteRole={remoteRole}
            remoteAvatarUrl={remoteAvatarUrl}
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
  const onTranscriptFinalRef = useRef(onTranscriptFinal);

  useEffect(() => {
    onTranscriptFinalRef.current = onTranscriptFinal;
  }, [onTranscriptFinal]);

  useEffect(() => {
    const handler = (segments: TranscriptionSegment[], participant?: Participant) => {
      const callback = onTranscriptFinalRef.current;
      if (!callback) return;

      const localIdentity = room.localParticipant?.identity;
      const participantIdentity = participant?.identity;
      const participantName = participant?.name;
      const role: "USER" | "ASSISTANT" =
        participantIdentity && participantIdentity === localIdentity ? "USER" : "ASSISTANT";

      for (const segment of segments) {
        const text = (segment.text || "").trim();
        if (!text || !segment.final) continue;
        callback({
          role,
          text,
          segmentId: segment.id,
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
  }, [room]);

  return null;
}
