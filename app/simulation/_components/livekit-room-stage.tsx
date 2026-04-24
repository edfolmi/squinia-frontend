"use client";

import { useEffect, useState } from "react";

import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import { VideoConference } from "@livekit/components-react/prefabs";

import { issueLiveKitConnection } from "../_lib/backend-simulation";

type Props = {
  sessionId: string;
  /** Voice (phone) uses audio-only; video uses bundled conference UI. */
  mode: "audio" | "video";
  className?: string;
};

/**
 * Joins the LiveKit room for a **persisted** simulation session (`POST /api/v1/sessions` UUID).
 * Requires `NEXT_PUBLIC_USE_BACKEND_SESSIONS` and LiveKit env on the API.
 */
export function LiveKitRoomStage({ sessionId, mode, className }: Props) {
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
      setUrl(conn.server_url);
      setToken(conn.participant_token);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (error) {
    return (
      <div className={`rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-3 text-center text-[13px] text-amber-50 ${className ?? ""}`}>
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

  return (
    <div className={className}>
      <LiveKitRoom serverUrl={url} token={token} connect audio video={mode === "video"}>
        {mode === "video" ? (
          <div className="h-[min(420px,50vh)] w-full max-w-3xl overflow-hidden rounded-2xl bg-black/40">
            <VideoConference />
          </div>
        ) : (
          <RoomAudioRenderer />
        )}
      </LiveKitRoom>
    </div>
  );
}
