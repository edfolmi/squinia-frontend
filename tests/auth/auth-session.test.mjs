import assert from "node:assert/strict";
import test from "node:test";

import {
  getJwtExpirySeconds,
  isJwtExpired,
  sessionCookieMaxAgeSeconds,
} from "../../app/(auth)/_lib/auth-token-expiry.mjs";
import { loginRedirectPath } from "../../app/(auth)/_lib/auth-redirect.mjs";

function jwt(payload) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64url");
  return `header.${encoded}.signature`;
}

test("JWT expiry is read from the access token payload", () => {
  const token = jwt({ exp: 1_900_000_000 });
  assert.equal(getJwtExpirySeconds(token), 1_900_000_000);
});

test("expired or nearly expired access tokens are treated as signed out", () => {
  const nowMs = 1_700_000_000_000;
  assert.equal(isJwtExpired(jwt({ exp: 1_699_999_999 }), nowMs), true);
  assert.equal(isJwtExpired(jwt({ exp: 1_700_000_020 }), nowMs), true);
  assert.equal(isJwtExpired(jwt({ exp: 1_700_000_120 }), nowMs), false);
});

test("session cookie lifetime is capped to the access token lifetime", () => {
  const nowMs = 1_700_000_000_000;
  assert.equal(sessionCookieMaxAgeSeconds(jwt({ exp: 1_700_000_120 }), nowMs), 90);
  assert.equal(sessionCookieMaxAgeSeconds(jwt({ exp: 1_699_999_999 }), nowMs), 0);
});

test("login redirects preserve the protected route as next", () => {
  assert.equal(loginRedirectPath("/dashboard?tab=sessions"), "/login?next=%2Fdashboard%3Ftab%3Dsessions");
  assert.equal(loginRedirectPath("/login"), "/login");
});
