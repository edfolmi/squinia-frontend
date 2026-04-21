import Link from "next/link";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--background)] px-4 py-10 text-[#111111] sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-[420px]">
        <Link
          href="/"
          className="block text-center font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--faint)] transition-colors hover:text-[var(--muted)]"
        >
          Squinia
        </Link>
        <div className="mt-8 rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-6 shadow-[0_8px_40px_-24px_rgba(17,17,17,0.12)] sm:p-8">
          <h1 className="text-center text-xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-2xl">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-center text-[14px] leading-relaxed text-[var(--muted)]">{subtitle}</p>
          ) : null}
          <div className="mt-8">{children}</div>
        </div>
        {footer ? <div className="mt-8 text-center text-[13px] text-[var(--muted)]">{footer}</div> : null}
      </div>
    </div>
  );
}
