import { Suspense } from "react";

import { AuthShell } from "../_components/auth-shell";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token ?? "";

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Paste the token from your reset email if it is not already in the URL."
      footer={null}
    >
      <Suspense fallback={<p className="text-center text-[14px] text-[var(--muted)]">Loading…</p>}>
        <ResetPasswordForm initialToken={token} />
      </Suspense>
    </AuthShell>
  );
}
