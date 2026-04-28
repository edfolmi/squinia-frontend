import Link from "next/link";

type StatusTone = "neutral" | "warning" | "danger";

const toneClasses: Record<StatusTone, string> = {
  neutral: "border-[var(--rule)] bg-[var(--surface)] text-[var(--muted)]",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-red-200 bg-red-50 text-red-900",
};

export function StatusBanner({
  title,
  message,
  tone = "warning",
  action,
}: {
  title?: string;
  message: string;
  tone?: StatusTone;
  action?: { href: string; label: string };
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-[14px] ${toneClasses[tone]}`} role={tone === "neutral" ? "status" : "alert"}>
      {title ? <p className="font-semibold text-[#111111]">{title}</p> : null}
      <p className={title ? "mt-1" : ""}>
        {message}
        {action ? (
          <>
            {" "}
            <Link href={action.href} className="font-semibold text-[#111111] underline underline-offset-2">
              {action.label}
            </Link>
          </>
        ) : null}
      </p>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--rule-strong)] bg-[var(--field)]/35 px-4 py-8 text-center">
      <p className="text-[15px] font-semibold text-[#111111]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-[var(--muted)]">{message}</p>
      {action ? (
        <Link href={action.href} className="sim-btn-accent mt-5 inline-flex px-5 py-2.5 font-mono text-[10px] uppercase">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
