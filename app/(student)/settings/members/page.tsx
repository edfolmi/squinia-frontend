import { OrgAdminGate, SimulateAdminToggle } from "../_components/org-admin-gate";
import { MembersSettingsPanel } from "./members-settings-panel";
import { MOCK_MEMBERS } from "../_lib/settings-mock-data";

export default function SettingsMembersPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Members</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Invite colleagues and manage roles. Wire your directory sync or SCIM when you outgrow manual invites.
        </p>
      </div>
      <SimulateAdminToggle />
      <OrgAdminGate>
        <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
          <MembersSettingsPanel initialMembers={MOCK_MEMBERS} />
        </section>
      </OrgAdminGate>
    </div>
  );
}
