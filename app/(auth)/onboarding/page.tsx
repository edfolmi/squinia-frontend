import { Suspense } from "react";

import { AuthShell } from "../_components/auth-shell";
import { OnboardingWizard } from "./onboarding-wizard";

export default function OnboardingPage() {
  return (
    <AuthShell
      title="Welcome to Squinia"
      subtitle="First-time setup — takes under a minute."
      footer={null}
    >
      <Suspense fallback={<p className="text-center text-[14px] text-[var(--muted)]">Loading…</p>}>
        <OnboardingWizard />
      </Suspense>
    </AuthShell>
  );
}
