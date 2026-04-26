import { getApiBase } from "@/app/(auth)/_lib/auth-config";

import type { ApiResult } from "@/app/_lib/api-envelope";
import { v1 } from "@/app/_lib/v1-client";

import { scenarioIdForSessionApi } from "./demo-backend-scenario-ids";

/** True when `sessionId` is a persisted Squinia `simulation_sessions.id` (not `scenario__attempt`). */
export function isBackendSessionId(sessionId: string): boolean {
  return (
    !sessionId.includes("__") &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)
  );
}

export type BackendSessionStart = {
  session_id: string;
  scenario_snapshot: unknown;
};

export async function startBackendSimulationSession(input: {
  scenarioId: string;
  mode: "TEXT" | "VOICE" | "VIDEO";
  cohortId?: string | null;
}): Promise<BackendSessionStart | null> {
  const res = await v1.post<BackendSessionStart>("sessions", {
    scenario_id: scenarioIdForSessionApi(input.scenarioId),
    cohort_id: input.cohortId || undefined,
    mode: input.mode,
  });
  if (!res.ok) return null;
  return res.data;
}

export type SessionOpeningResponse = {
  assistant_content: string;
  assistant_turn: number;
};

export type SessionChatResponse = {
  assistant_content: string;
  user_turn: number;
  assistant_turn: number;
};

export async function postTextSimulationOpening(
  sessionId: string,
): Promise<ApiResult<SessionOpeningResponse>> {
  return v1.post<SessionOpeningResponse>(`sessions/${sessionId}/opening`, {});
}

export async function postTextSimulationChat(
  sessionId: string,
  text: string,
): Promise<ApiResult<SessionChatResponse>> {
  return v1.post<SessionChatResponse>(`sessions/${sessionId}/chat`, { text });
}

export type LiveKitConnection = {
  server_url: string;
  room_name: string;
  participant_token: string;
};

const liveKitConnectionCache = new Map<string, LiveKitConnection>();
const liveKitConnectionInFlight = new Map<string, Promise<LiveKitConnection | null>>();

export async function issueLiveKitConnection(sessionId: string): Promise<LiveKitConnection | null> {
  const cached = liveKitConnectionCache.get(sessionId);
  if (cached) return cached;

  const inFlight = liveKitConnectionInFlight.get(sessionId);
  if (inFlight) return inFlight;

  const request = (async () => {
    const res = await v1.post<LiveKitConnection>(`sessions/${sessionId}/livekit-token`, {});
    if (!res.ok) return null;
    if (!res.data?.server_url || !res.data?.participant_token || !res.data?.room_name) {
      return null;
    }
    liveKitConnectionCache.set(sessionId, res.data);
    return res.data;
  })();

  liveKitConnectionInFlight.set(sessionId, request);
  try {
    return await request;
  } finally {
    liveKitConnectionInFlight.delete(sessionId);
  }
}

export type LiveTranscriptIngestItem = {
  role: "USER" | "ASSISTANT";
  text: string;
  segment_id?: string;
  participant_identity?: string;
  participant_name?: string;
  offset_ms?: number;
  is_final?: boolean;
};

type TranscriptIngestResponse = {
  accepted: number;
  skipped: number;
  turn_count: number;
};

export async function ingestLiveTranscript(
  sessionId: string,
  items: LiveTranscriptIngestItem[],
): Promise<TranscriptIngestResponse | null> {
  if (items.length === 0) return { accepted: 0, skipped: 0, turn_count: 0 };
  const res = await v1.post<TranscriptIngestResponse>(`sessions/${sessionId}/transcript`, { items });
  if (!res.ok) return null;
  return res.data;
}

export type BackendSessionMessage = {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  content_type: string;
  meta: Record<string, unknown>;
  turn_number: number;
  created_at: string;
};

export type BackendEvaluationScore = {
  criterion: string;
  score: number;
  max_score: number;
  rationale?: string | null;
  summary?: string | null;
  example_quote?: string | null;
  improvement?: string | null;
};

export type BackendEvaluationDetail = {
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  overall_score?: number;
  feedback_summary?: string;
  strengths?: string | null;
  improvements?: string | null;
  scores?: BackendEvaluationScore[];
};

export type BackendSessionDetail = {
  id: string;
  mode: "TEXT" | "VOICE" | "VIDEO";
  started_at?: string | null;
  ended_at?: string | null;
  scenario_snapshot?: unknown;
  messages: BackendSessionMessage[];
  evaluation?: BackendEvaluationDetail | null;
};

export async function getBackendSessionDetail(sessionId: string): Promise<BackendSessionDetail | null> {
  const res = await v1.get<{ session: BackendSessionDetail }>(`sessions/${sessionId}`);
  if (!res.ok) return null;
  return res.data.session;
}

export async function getBackendSessionEvaluation(sessionId: string): Promise<{
  status: string;
  evaluation: BackendEvaluationDetail | null;
} | null> {
  const res = await v1.get<{ status: string; evaluation: BackendEvaluationDetail | null }>(
    `sessions/${sessionId}/evaluation`,
  );
  if (!res.ok) return null;
  return res.data;
}

export async function endBackendSimulationSession(sessionId: string): Promise<boolean> {
  const res = await v1.post(`sessions/${sessionId}/end`, {});
  return res.ok;
}

export function isApiBaseConfigured(): boolean {
  return Boolean(getApiBase());
}
