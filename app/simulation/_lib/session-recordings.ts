import { v1 } from "@/app/_lib/v1-client";

export type DurableSessionRecording = {
  id: string;
  session_id: string;
  mode: "VOICE" | "VIDEO" | string;
  status: "PENDING_UPLOAD" | "UPLOADING" | "READY" | "FAILED" | string;
  mime_type: string;
  size_bytes: number;
  duration_ms?: number | null;
  playback_url?: string | null;
  expires_at?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
};

type UploadIntent = {
  recording: DurableSessionRecording;
  upload_url: string;
  upload_method: "PUT" | string;
  upload_headers: Record<string, string>;
  expires_at: string;
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

export async function createSessionRecordingUploadIntent(
  sessionId: string,
  blob: Blob,
  options: { mode: "VOICE" | "VIDEO"; durationMs?: number | null },
): Promise<UploadIntent | null> {
  if (!blob || blob.size <= 0) return null;
  const res = await v1.post<UploadIntent>(`sessions/${sessionId}/recording/upload-intent`, {
    mode: options.mode,
    mime_type: blob.type || (options.mode === "VIDEO" ? "video/webm" : "audio/webm"),
    size_bytes: blob.size,
    duration_ms:
      typeof options.durationMs === "number" && Number.isFinite(options.durationMs)
        ? Math.max(0, Math.round(options.durationMs))
        : undefined,
  });
  if (!res.ok) return null;
  return res.data;
}

export async function completeSessionRecordingUpload(
  sessionId: string,
  recordingId: string,
  blob: Blob,
  options: { durationMs?: number | null },
): Promise<DurableSessionRecording | null> {
  const res = await v1.post<{ recording: DurableSessionRecording }>(
    `sessions/${sessionId}/recording/${recordingId}/complete`,
    {
      mime_type: blob.type || "application/octet-stream",
      size_bytes: blob.size,
      duration_ms:
        typeof options.durationMs === "number" && Number.isFinite(options.durationMs)
          ? Math.max(0, Math.round(options.durationMs))
          : undefined,
    },
  );
  if (!res.ok) return null;
  return res.data.recording;
}

export async function markSessionRecordingUploadFailed(
  sessionId: string,
  recordingId: string,
  message: string,
): Promise<void> {
  await v1.post(`sessions/${sessionId}/recording/${recordingId}/failed`, {
    error_message: message || "Recording upload failed.",
  });
}

const inFlightUploads = new Map<string, Promise<DurableSessionRecording | null>>();

export function startBackgroundSessionRecordingUpload(
  sessionId: string,
  blob: Blob | null | undefined,
  options: { mode: "VOICE" | "VIDEO"; durationMs?: number | null },
): Promise<DurableSessionRecording | null> | null {
  if (!blob || blob.size <= 0) return null;
  const key = `${sessionId}:${options.mode}:${blob.size}:${options.durationMs ?? ""}`;
  const existing = inFlightUploads.get(key);
  if (existing) return existing;

  const task = (async () => {
    let recordingId: string | null = null;
    try {
      const intent = await createSessionRecordingUploadIntent(sessionId, blob, options);
      if (!intent) return null;
      recordingId = intent.recording.id;
      const upload = await fetch(intent.upload_url, {
        method: intent.upload_method || "PUT",
        headers: intent.upload_headers,
        body: blob,
      });
      if (!upload.ok) {
        throw new Error(`Cloud upload failed with status ${upload.status}`);
      }
      return await completeSessionRecordingUpload(sessionId, intent.recording.id, blob, {
        durationMs: options.durationMs,
      });
    } catch (error) {
      const fallback = await uploadSessionRecording(sessionId, blob, options).catch(() => null);
      if (fallback?.playback_url) return fallback;
      if (recordingId) {
        await markSessionRecordingUploadFailed(
          sessionId,
          recordingId,
          error instanceof Error ? error.message : "Recording upload failed.",
        ).catch(() => undefined);
      }
      return null;
    } finally {
      inFlightUploads.delete(key);
    }
  })();

  inFlightUploads.set(key, task);
  return task;
}

export async function getSessionRecording(sessionId: string): Promise<DurableSessionRecording | null> {
  const res = await v1.get<{ recording: DurableSessionRecording }>(`sessions/${sessionId}/recording`);
  if (!res.ok) return null;
  return res.data.recording;
}
