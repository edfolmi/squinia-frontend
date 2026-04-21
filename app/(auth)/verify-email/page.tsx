import { Suspense } from "react";

import { AuthShell } from "../_components/auth-shell";
import { VerifyEmailClient } from "./verify-email-client";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; sent?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token ?? "";
  const sent = sp.sent === "1";

  return (
    <AuthShell
      title="Verify your email"
      subtitle="Confirm you control the address you used to register."
      footer={null}
    >
      <Suspense
        fallback={<p className="text-center text-[14px] text-[var(--muted)]">Loading…</p>}
      >
        <VerifyEmailClient initialToken={token} sent={sent} />
      </Suspense>
    </AuthShell>
  );
}
