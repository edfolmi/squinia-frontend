"use client";

import { getApiBase } from "@/app/(auth)/_lib/auth-config";
import { parseApiJson, type ApiResult } from "@/app/_lib/api-envelope";
import { v1Path, v1Request } from "@/app/_lib/v1-client";
import type { LiveKitConnection } from "@/app/simulation/_lib/backend-simulation";

export type VettingMode = "TEXT" | "VOICE" | "VIDEO";

export type VettingBranding = {
  logo_url?: string | null;
  primary_color?: string | null;
};

export type VettingAssessment = {
  id: string;
  title: string;
  instructions?: string | null;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  public_slug?: string;
  public_url?: string;
  scenario_id?: string;
  mode: VettingMode;
  pass_score: number;
  time_limit_minutes?: number | null;
  branding?: VettingBranding | null;
  settings?: Record<string, unknown> | null;
  attempt_count?: number;
  organization_name?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type VettingAttempt = {
  id: string;
  assessment_id?: string;
  assessment?: VettingAssessment;
  candidate_name: string;
  candidate_email: string;
  external_candidate_id?: string | null;
  external_application_id?: string | null;
  source?: string;
  locked_candidate_fields?: boolean;
  status: "INVITED" | "IN_PROGRESS" | "COMPLETED" | "EVALUATED" | "ABANDONED" | "EXPIRED";
  session_id?: string | null;
  attempt_token?: string | null;
  attempt_url?: string | null;
  score?: number | null;
  passed?: boolean | null;
  result_summary?: string | null;
  result_snapshot?: VettingResultSnapshot | null;
  created_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
  evaluated_at?: string | null;
  expires_at?: string | null;
};

export type VettingScore = {
  criterion: string;
  score: number;
  max_score?: number | null;
  rationale?: string | null;
  summary?: string | null;
  example_quote?: string | null;
  improvement?: string | null;
};

export type VettingResultSnapshot = {
  event?: string;
  attempt_id?: string;
  assessment_id?: string;
  status?: string;
  overall_score?: number;
  pass_score?: number;
  passed?: boolean;
  feedback_summary?: string | null;
  strengths?: string | null;
  improvements?: string | null;
  scores?: VettingScore[];
  report_url?: string | null;
  completed_at?: string | null;
};

export type VettingApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  raw_key?: string;
  last_used_at?: string | null;
  revoked_at?: string | null;
  created_at?: string;
};

export type VettingWebhookEndpoint = {
  id: string;
  url: string;
  description?: string | null;
  events?: string[];
  is_active: boolean;
  signing_secret?: string;
  created_at?: string;
};

export type ItemsData<T> = {
  items: T[];
  total?: number;
  page?: number;
  limit?: number;
};

export type VettingStartResponse = {
  attempt: VettingAttempt;
  session_id: string;
  scenario_snapshot?: unknown;
  mode: VettingMode;
};

export type VettingOpeningResponse = {
  assistant_content: string;
  assistant_turn: number;
};

export type VettingChatResponse = {
  assistant_content: string;
  user_turn: number;
  assistant_turn: number;
};

export type VettingEvaluationResponse = {
  status: string;
  evaluation: {
    status: string;
    overall_score?: number | null;
    feedback_summary?: string | null;
    strengths?: string | null;
    improvements?: string | null;
    scores?: VettingScore[];
  } | null;
};

export type VettingRecording = {
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

type VettingRecordingUploadIntent = {
  recording: VettingRecording;
  upload_url: string;
  upload_method: "PUT" | string;
  upload_headers: Record<string, string>;
  expires_at: string;
};

export type LiveTranscriptIngestItem = {
  role: "USER" | "ASSISTANT";
  text: string;
  segment_id?: string;
  participant_identity?: string;
  participant_name?: string;
  offset_ms?: number;
  is_final?: boolean;
};

function publicRequest<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  return v1Request<T>(method, v1Path(path), { body, auth: false });
}

function serviceUnavailableMessage(): string {
  return "We could not reach Squinia services. Please refresh the page or try again in a moment.";
}

export function isPublicApiConfigured(): boolean {
  return Boolean(getApiBase());
}

export const vettingPublic = {
  getAssessment: (publicSlug: string) =>
    publicRequest<{ assessment: VettingAssessment }>("GET", `vetting/public/${encodeURIComponent(publicSlug)}`),
  createAttempt: (
    publicSlug: string,
    body: {
      candidate_name: string;
      candidate_email: string;
      external_candidate_id?: string | null;
      external_application_id?: string | null;
    },
  ) =>
    publicRequest<{ attempt: VettingAttempt; attempt_token: string; attempt_url: string }>(
      "POST",
      `vetting/public/${encodeURIComponent(publicSlug)}/attempts`,
      body,
    ),
  getAttempt: (attemptToken: string) =>
    publicRequest<{ attempt: VettingAttempt }>("GET", `vetting/public/attempts/${encodeURIComponent(attemptToken)}`),
  startAttempt: (attemptToken: string) =>
    publicRequest<VettingStartResponse>("POST", `vetting/public/attempts/${encodeURIComponent(attemptToken)}/start`, {}),
  postOpening: (attemptToken: string) =>
    publicRequest<VettingOpeningResponse>("POST", `vetting/public/attempts/${encodeURIComponent(attemptToken)}/opening`, {}),
  sendChat: (attemptToken: string, text: string) =>
    publicRequest<VettingChatResponse>("POST", `vetting/public/attempts/${encodeURIComponent(attemptToken)}/chat`, { text }),
  issueLiveKitConnection: async (attemptToken: string): Promise<LiveKitConnection | null> => {
    const res = await publicRequest<LiveKitConnection>(
      "POST",
      `vetting/public/attempts/${encodeURIComponent(attemptToken)}/livekit-token`,
      {},
    );
    if (!res.ok) return null;
    return res.data;
  },
  ingestTranscript: (attemptToken: string, items: LiveTranscriptIngestItem[]) =>
    publicRequest<{ accepted: number; skipped: number; turn_count: number }>(
      "POST",
      `vetting/public/attempts/${encodeURIComponent(attemptToken)}/transcript`,
      { items },
    ),
  endAttempt: (attemptToken: string) =>
    publicRequest<{ attempt: VettingAttempt; session?: unknown }>(
      "POST",
      `vetting/public/attempts/${encodeURIComponent(attemptToken)}/end`,
      {},
    ),
  getEvaluation: (attemptToken: string) =>
    publicRequest<VettingEvaluationResponse>("GET", `vetting/public/attempts/${encodeURIComponent(attemptToken)}/evaluation`),
};

export async function uploadVettingRecording(input: {
  attemptToken: string;
  blob: Blob;
  mode: VettingMode;
  durationMs?: number | null;
}): Promise<ApiResult<{ recording: VettingRecording }>> {
  const base = getApiBase();
  if (!base) return { ok: false, message: serviceUnavailableMessage() };

  let url: string;
  try {
    const origin = base.replace(/\/+$/, "");
    const path = v1Path(`vetting/public/attempts/${encodeURIComponent(input.attemptToken)}/recording`);
    url = new URL(path.replace(/^\//, ""), `${origin}/`).href;
  } catch {
    return { ok: false, message: serviceUnavailableMessage() };
  }

  const form = new FormData();
  const ext = input.mode === "VIDEO" ? "webm" : "webm";
  form.set("recording", input.blob, `vetting-${input.mode.toLowerCase()}.${ext}`);
  form.set("mode", input.mode);
  if (input.durationMs != null) form.set("duration_ms", String(input.durationMs));

  try {
    const res = await fetch(url, {
      method: "POST",
      body: form,
      credentials: "include",
    });
    const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return parseApiJson<{ recording: VettingRecording }>(res, raw);
  } catch {
    return { ok: false, message: "We could not upload the assessment recording. The session can still be evaluated from transcript data." };
  }
}

async function createVettingRecordingUploadIntent(input: {
  attemptToken: string;
  blob: Blob;
  mode: VettingMode;
  durationMs?: number | null;
}): Promise<VettingRecordingUploadIntent | null> {
  const res = await publicRequest<VettingRecordingUploadIntent>(
    "POST",
    `vetting/public/attempts/${encodeURIComponent(input.attemptToken)}/recording/upload-intent`,
    {
      mode: input.mode,
      mime_type: input.blob.type || (input.mode === "VIDEO" ? "video/webm" : "audio/webm"),
      size_bytes: input.blob.size,
      duration_ms:
        typeof input.durationMs === "number" && Number.isFinite(input.durationMs)
          ? Math.max(0, Math.round(input.durationMs))
          : undefined,
    },
  );
  if (!res.ok) return null;
  return res.data;
}

async function completeVettingRecordingUpload(input: {
  attemptToken: string;
  recordingId: string;
  blob: Blob;
  durationMs?: number | null;
}): Promise<VettingRecording | null> {
  const res = await publicRequest<{ recording: VettingRecording }>(
    "POST",
    `vetting/public/attempts/${encodeURIComponent(input.attemptToken)}/recording/${encodeURIComponent(input.recordingId)}/complete`,
    {
      mime_type: input.blob.type || "application/octet-stream",
      size_bytes: input.blob.size,
      duration_ms:
        typeof input.durationMs === "number" && Number.isFinite(input.durationMs)
          ? Math.max(0, Math.round(input.durationMs))
          : undefined,
    },
  );
  if (!res.ok) return null;
  return res.data.recording;
}

async function markVettingRecordingUploadFailed(attemptToken: string, recordingId: string, message: string) {
  await publicRequest(
    "POST",
    `vetting/public/attempts/${encodeURIComponent(attemptToken)}/recording/${encodeURIComponent(recordingId)}/failed`,
    { error_message: message || "Recording upload failed." },
  );
}

const inFlightVettingUploads = new Map<string, Promise<VettingRecording | null>>();

export function startBackgroundVettingRecordingUpload(
  attemptToken: string,
  blob: Blob | null | undefined,
  options: { mode: VettingMode; durationMs?: number | null },
): Promise<VettingRecording | null> | null {
  if (!blob || blob.size <= 0 || options.mode === "TEXT") return null;
  const key = `${attemptToken}:${options.mode}:${blob.size}:${options.durationMs ?? ""}`;
  const existing = inFlightVettingUploads.get(key);
  if (existing) return existing;

  const task = (async () => {
    let recordingId: string | null = null;
    try {
      const intent = await createVettingRecordingUploadIntent({
        attemptToken,
        blob,
        mode: options.mode,
        durationMs: options.durationMs,
      });
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
      return await completeVettingRecordingUpload({
        attemptToken,
        recordingId: intent.recording.id,
        blob,
        durationMs: options.durationMs,
      });
    } catch (error) {
      const fallback = await uploadVettingRecording({
        attemptToken,
        blob,
        mode: options.mode,
        durationMs: options.durationMs,
      }).catch(() => null);
      if (fallback?.ok) return fallback.data.recording;
      if (recordingId) {
        await markVettingRecordingUploadFailed(
          attemptToken,
          recordingId,
          error instanceof Error ? error.message : "Recording upload failed.",
        ).catch(() => undefined);
      }
      return null;
    } finally {
      inFlightVettingUploads.delete(key);
    }
  })();

  inFlightVettingUploads.set(key, task);
  return task;
}
