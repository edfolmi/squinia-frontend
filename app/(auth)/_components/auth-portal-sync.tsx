"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { ensureAuthSessionCookie, getAccessToken } from "../_lib/auth-tokens";

/**
 * Keeps the session cookie in sync with localStorage and sends already-signed-in users
 * away from sign-in / sign-up when they land there (including after middleware redirect).
 */
export function AuthPortalSync() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!getAccessToken()) return;
    ensureAuthSessionCookie();

    if (pathname === "/login" || pathname === "/register") {
      const next = new URLSearchParams(window.location.search).get("next");
      const safe =
        next && next.startsWith("/") && !next.startsWith("//") && !next.includes(":") ? next : "/dashboard";
      router.replace(safe);
    }
  }, [pathname, router]);

  return null;
}
