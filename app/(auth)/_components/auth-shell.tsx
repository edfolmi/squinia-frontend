import { SquiniaBrandLockup } from "@/app/_components/squinia-brand";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="grid min-h-[100dvh] bg-[var(--background)] text-[#111111] lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
      <section className="hidden border-r border-[var(--rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f4f7f0_58%,#e8f2e8_100%)] px-10 py-10 lg:flex lg:flex-col lg:justify-between">
        <SquiniaBrandLockup href="/" />
        <div className="max-w-xl pb-8">
          <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#0f6f34]">Simulation intelligence</p>
          <h2 className="mt-4 max-w-lg text-4xl font-semibold text-[#0b2014]">
            Practice the conversation before it becomes the moment.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-[var(--muted)]">
            Squinia turns real workplace pressure into measurable reps, feedback, and confidence.
          </p>
        </div>
        <p className="max-w-sm text-[12px] leading-6 text-[var(--faint)]">
          Built for teams that expect learning tools to feel as sharp as the product stack they already use.
        </p>
      </section>

      <main className="flex min-h-[100dvh] flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
          <SquiniaBrandLockup href="/" orientation="inline" className="justify-center lg:hidden" />
          <div className="mt-8 rounded-lg border border-[var(--rule)] bg-[var(--surface)] p-6 shadow-[0_18px_60px_-42px_rgba(11,32,20,0.35)] sm:p-8 lg:mt-0">
            <h1 className="text-center text-2xl font-semibold text-[#111111]">{title}</h1>
            {subtitle ? (
              <p className="mt-2 text-center text-[14px] leading-relaxed text-[var(--muted)]">{subtitle}</p>
            ) : null}
            <div className="mt-8">{children}</div>
          </div>
          {footer ? <div className="mt-8 text-center text-[13px] text-[var(--muted)]">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
