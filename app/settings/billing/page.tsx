import { OrgAdminGate, SimulateAdminToggle } from "../_components/org-admin-gate";
import { BillingStubPanel } from "./billing-stub-panel";
import { MOCK_ORG } from "../_lib/settings-mock-data";

export default function SettingsBillingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Billing</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Plan, seat usage, and renewal. MVP stub — connect Stripe or your billing provider when you go live.
        </p>
      </div>
      <SimulateAdminToggle />
      <OrgAdminGate>
        <BillingStubPanel org={MOCK_ORG} />
      </OrgAdminGate>
    </div>
  );
}
