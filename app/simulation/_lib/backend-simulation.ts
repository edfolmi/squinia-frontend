import { getApiBase } from "@/app/(auth)/_lib/auth-config";

import { v1 } from "@/app/_lib/v1-client";

const WS_TOKEN_STORAGE_PREFIX = "squinia:simulation:ws_token:";

/** Persist short-lived WebSocket JWT from `POST /sessions` until the session ends (sessionStorage). */
export function setSimulationWsToken(sessionId: string, token: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${WS_TOKEN_STORAGE_PREFIX}${sessionId}`, token);
  } catch {
    /* quota / private mode */
  }
}

export function getSimulationWsToken(sessionId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(`${WS_TOKEN_STORAGE_PREFIX}${sessionId}`);
  } catch {
    return null;
  }
}

export function clearSimulationWsToken(sessionId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(`${WS_TOKEN_STORAGE_PREFIX}${sessionId}`);
  } catch {
    /* ignore */
  }
}

/** `wss://host/api/v1/ws/sessions/{id}?token=…` for browser WebSocket. */
export function buildSimulationChatWsUrl(sessionId: string, wsToken: string): string | null {
  const base = getApiBase();
  if (!base) return null;
  let origin: URL;
  try {
    origin = new URL(base.endsWith("/") ? base : `${base}/`);
  } catch {
    return null;
  }
  const wsProto = origin.protocol === "https:" ? "wss:" : "ws:";
  const path = `/api/v1/ws/sessions/${encodeURIComponent(sessionId)}?token=${encodeURIComponent(wsToken)}`;
  return `${wsProto}//${origin.host}${path}`;
}

/** True when `sessionId` is a persisted Squinia `simulation_sessions.id` (not `scenario__attempt`). */
export function isBackendSessionId(sessionId: string): boolean {
  return (
    !sessionId.includes("__") &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)
  );
}

export type BackendSessionStart = {
  session_id: string;
  ws_token: string;
  scenario_snapshot: unknown;
};

export async function startBackendSimulationSession(input: {
  scenarioId: string;
  mode: "TEXT" | "VOICE" | "VIDEO";
  cohortId?: string | null;
}): Promise<BackendSessionStart | null> {
  const res = await v1.post<BackendSessionStart>("sessions", {
    scenario_id: input.scenarioId,
    cohort_id: input.cohortId || undefined,
    mode: input.mode,
  });
  if (!res.ok) return null;
  return res.data;
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
