/** Parse FastAPI `{ success, data, error, meta }` JSON responses. */

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; message: string; status?: number };
export type ApiResult<T> = ApiOk<T> | ApiErr;

function validationDetail(details: unknown): string {
  if (!Array.isArray(details) || details.length === 0) return "";
  const first = details[0] as { field?: unknown; message?: unknown; msg?: unknown } | undefined;
  const message = typeof first?.message === "string" ? first.message : typeof first?.msg === "string" ? first.msg : "";
  const field = typeof first?.field === "string" ? first.field : "";
  if (!message) return "";
  return field ? `${field}: ${message}` : message;
}

export function extractApiErrorMessage(json: Record<string, unknown>, fallback: string): string {
  const err = json.error;
  if (err && typeof err === "object" && err !== null) {
    const body = err as { message?: unknown; details?: unknown };
    const msg = body.message;
    if (typeof msg === "string" && msg.length > 0) {
      const detail = validationDetail(body.details);
      return detail ? `${msg}: ${detail}` : msg;
    }
  }
  if (typeof json.message === "string" && json.message.length > 0) return json.message;
  if (typeof json.detail === "string") return json.detail;
  const detail = validationDetail(json.detail);
  if (detail) return detail;
  return fallback || "Request failed";
}

export function parseApiJson<T>(res: Response, raw: Record<string, unknown>): ApiResult<T> {
  if (!res.ok) {
    return { ok: false, message: extractApiErrorMessage(raw, res.statusText), status: res.status };
  }
  if (raw.success === true && "data" in raw) {
    return { ok: true, data: raw.data as T };
  }
  return { ok: false, message: extractApiErrorMessage(raw, "Unexpected response from Squinia services."), status: res.status };
}
