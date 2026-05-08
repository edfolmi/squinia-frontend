import Link from "next/link";

export function PageHeader({ label, title, description }: { label: string; title: string; description: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--faint)]">{label}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[var(--muted)]">{description}</p>
    </div>
  );
}

export function KpiCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-lg border border-[var(--rule)] bg-[var(--surface)] p-4 shadow-[0_6px_36px_-24px_rgba(17,17,17,0.12)]">
      <p className="text-2xl font-semibold text-[#111111]">{value}</p>
      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--faint)]">{label}</p>
      {detail ? <p className="mt-2 text-[12px] text-[var(--muted)]">{detail}</p> : null}
    </div>
  );
}

export function Panel({ children, title, action }: { children: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[0_6px_36px_-24px_rgba(17,17,17,0.12)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-[#111111]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function AdminLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-[#111111] underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-[var(--rule)] bg-[var(--field)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--muted)]">
      {children}
    </span>
  );
}

export function formatDate(value?: string | null) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
