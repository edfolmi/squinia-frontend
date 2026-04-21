"use client";

type OrgBilling = {
  planName: string;
  planSeats: number;
  seatsUsed: number;
  billingEmail: string;
  renewsAt: string;
};

export function BillingStubPanel({ org }: { org: OrgBilling }) {
  const pct = Math.min(100, Math.round((org.seatsUsed / org.planSeats) * 100));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Current plan</h2>
        <p className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[#111111]">{org.planName}</p>
        <p className="mt-2 text-[14px] text-[var(--muted)]">
          Billed annually · renews{" "}
          {new Date(org.renewsAt).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Seat usage</h2>
        <div className="mt-4">
          <div className="flex justify-between font-mono text-[12px] text-[var(--muted)]">
            <span>Assigned</span>
            <span className="tabular-nums text-[#111111]">
              {org.seatsUsed} / {org.planSeats}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--field)]">
            <div className="h-full rounded-full bg-[var(--accent)] transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-[12px] text-[var(--faint)]">{pct}% of purchased seats in use (preview numbers).</p>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Billing contact</h2>
        <p className="mt-3 text-[15px] text-[#111111]">{org.billingEmail}</p>
        <button
          type="button"
          className="mt-4 rounded-xl border border-[var(--rule-strong)] px-4 py-2 text-[12px] font-medium text-[var(--muted)] hover:bg-[var(--field)] hover:text-[#111111]"
        >
          Update email (stub)
        </button>
      </section>

      <section className="rounded-2xl border border-dashed border-[var(--rule-strong)] bg-[var(--field)]/40 p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Payment method</h2>
        <p className="mt-3 text-[14px] text-[var(--muted)]">
          No card on file in this preview. Add Stripe Customer Portal or Elements here for self-serve updates.
        </p>
        <button type="button" className="sim-btn-accent mt-4 px-5 py-2.5 font-mono text-[10px] uppercase opacity-60" disabled>
          Manage payment (coming soon)
        </button>
      </section>
    </div>
  );
}
