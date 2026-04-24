"use client";

type OrgBilling = {
  planName: string;
  billingEmail: string;
};

export function BillingStubPanel({ org }: { org: OrgBilling }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Current plan</h2>
        <p className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[#111111]">{org.planName}</p>
      </section>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Billing contact</h2>
        <p className="mt-3 text-[15px] text-[#111111]">{org.billingEmail}</p>
      </section>

      <section className="rounded-2xl border border-dashed border-[var(--rule-strong)] bg-[var(--field)]/40 p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Payment method</h2>
        <p className="mt-3 text-[14px] text-[var(--muted)]">
          Payment method management will be available soon. Contact support for billing changes.
        </p>
      </section>
    </div>
  );
}
