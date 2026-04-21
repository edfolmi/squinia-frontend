import { MOCK_PROFILE } from "../_lib/settings-mock-data";
import { ProfileSettingsForm } from "./profile-settings-form";

export default function SettingsProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Profile</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Your name and sign-in email. Password changes apply to this workspace only once your auth API is wired.
        </p>
      </div>
      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <ProfileSettingsForm initial={MOCK_PROFILE} />
      </section>
    </div>
  );
}
