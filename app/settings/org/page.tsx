import { OrgAdminGate, SimulateAdminToggle } from "../_components/org-admin-gate";
import { OrgSettingsForm } from "./org-settings-form";
import { MOCK_ORG } from "../_lib/settings-mock-data";

export default function SettingsOrgPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Organization</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Workspace name, branding, and plan summary. In production, restrict this page to org admins.
        </p>
      </div>
      <SimulateAdminToggle />
      <OrgAdminGate>
        <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
          <OrgSettingsForm
            initial={{
              name: MOCK_ORG.name,
              slug: MOCK_ORG.slug,
              logoUrl: MOCK_ORG.logoUrl,
              primaryColor: MOCK_ORG.primaryColor,
              planName: MOCK_ORG.planName,
              planSeats: MOCK_ORG.planSeats,
              seatsUsed: MOCK_ORG.seatsUsed,
              renewsAt: MOCK_ORG.renewsAt,
            }}
          />
        </section>
      </OrgAdminGate>
    </div>
  );
}
