import { Suspense } from "react";

import { AuthShell } from "../_components/auth-shell";
import { AcceptInviteForm } from "./accept-invite-form";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; org?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token ?? "";
  const orgName = sp.org ? decodeURIComponent(sp.org) : "Your organization";

  return (
    <AuthShell
      title="Accept invitation"
      subtitle="Join your team’s workspace on Squinia."
      footer={null}
    >
      <Suspense fallback={<p className="text-center text-[14px] text-[var(--muted)]">Loading…</p>}>
        <AcceptInviteForm initialToken={token} orgName={orgName} />
      </Suspense>
    </AuthShell>
  );
}
