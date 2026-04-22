/** Parse FastAPI ``{ success, data, error, meta }`` JSON responses. */

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; message: string; status?: number };
export type ApiResult<T> = ApiOk<T> | ApiErr;

export function extractApiErrorMessage(json: Record<string, unknown>, fallback: string): string {
  const err = json.error;
  if (err && typeof err === "object" && err !== null) {
    const body = err as { message?: unknown; details?: unknown };
    const msg = body.message;
    if (typeof msg === "string" && msg.length > 0) {
      const details = body.details;
      if (Array.isArray(details) && details.length > 0) {
        const d0 = details[0] as { field?: unknown; message?: unknown } | undefined;
        const dm = typeof d0?.message === "string" ? d0.message : "";
        const df = typeof d0?.field === "string" ? d0.field : "";
        if (dm) {
          return df ? `${msg} — ${df}: ${dm}` : `${msg} — ${dm}`;
        }
      }
      return msg;
    }
  }
  if (typeof json.message === "string" && json.message.length > 0) return json.message;
  if (typeof json.detail === "string") return json.detail;
  if (Array.isArray(json.detail)) {
    const first = json.detail[0] as { msg?: unknown } | undefined;
    if (first && typeof first.msg === "string") return first.msg;
  }
  return fallback || "Request failed";
}

export function parseApiJson<T>(res: Response, raw: Record<string, unknown>): ApiResult<T> {
  if (!res.ok) {
    return { ok: false, message: extractApiErrorMessage(raw, res.statusText), status: res.status };
  }
  if (raw.success === true && "data" in raw) {
    return { ok: true, data: raw.data as T };
  }
  return { ok: false, message: extractApiErrorMessage(raw, "Unexpected response from API"), status: res.status };
}
