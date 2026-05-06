import { v1 } from "@/app/_lib/v1-client";

export type DurableSessionRecording = {
  id: string;
  session_id: string;
  mode: "VOICE" | "VIDEO" | string;
  mime_type: string;
  size_bytes: number;
  duration_ms?: number | null;
  playback_url: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

function filenameFor(blob: Blob, mode: "VOICE" | "VIDEO"): string {
  const mime = blob.type || (mode === "VIDEO" ? "video/webm" : "audio/webm");
  const ext = mime.includes("mp4") ? "mp4" : mime.includes("wav") ? "wav" : "webm";
  return `squinia-${mode.toLowerCase()}-recording.${ext}`;
}

export async function uploadSessionRecording(
  sessionId: string,
  blob: Blob,
  options: { mode: "VOICE" | "VIDEO"; durationMs?: number | null },
): Promise<DurableSessionRecording | null> {
  if (!blob || blob.size <= 0) return null;
  const form = new FormData();
  form.set("recording", blob, filenameFor(blob, options.mode));
  form.set("mode", options.mode);
  if (typeof options.durationMs === "number" && Number.isFinite(options.durationMs)) {
    form.set("duration_ms", String(Math.max(0, Math.round(options.durationMs))));
  }
  const res = await v1.upload<{ recording: DurableSessionRecording }>(`sessions/${sessionId}/recording`, form);
  if (!res.ok) return null;
  return res.data.recording;
}

export async function getSessionRecording(sessionId: string): Promise<DurableSessionRecording | null> {
  const res = await v1.get<{ recording: DurableSessionRecording }>(`sessions/${sessionId}/recording`);
  if (!res.ok) return null;
  return res.data.recording;
}
