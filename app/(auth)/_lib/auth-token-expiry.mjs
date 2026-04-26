const CLOCK_SKEW_SECONDS = 30;

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  if (typeof atob === "function") return atob(padded);
  const bufferCtor = globalThis.Buffer;
  if (bufferCtor) return bufferCtor.from(padded, "base64").toString("binary");
  throw new Error("No base64 decoder available");
}

export function getJwtExpirySeconds(token) {
  const [, payload] = String(token || "").split(".");
  if (!payload) return null;
  try {
    const parsed = JSON.parse(decodeBase64Url(payload));
    return typeof parsed.exp === "number" && Number.isFinite(parsed.exp) ? parsed.exp : null;
  } catch {
    return null;
  }
}

export function isJwtExpired(token, nowMs = Date.now()) {
  const exp = getJwtExpirySeconds(token);
  if (exp === null) return false;
  return exp <= Math.floor(nowMs / 1000) + CLOCK_SKEW_SECONDS;
}

export function sessionCookieMaxAgeSeconds(token, nowMs = Date.now()) {
  const exp = getJwtExpirySeconds(token);
  if (exp === null) return 604800;
  return Math.max(0, exp - Math.floor(nowMs / 1000) - CLOCK_SKEW_SECONDS);
}
