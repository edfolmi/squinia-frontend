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

export async function issueLiveKitConnection(sessionId: string): Promise<LiveKitConnection | null> {
  const res = await v1.post<LiveKitConnection>(`sessions/${sessionId}/livekit-token`, {});
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
