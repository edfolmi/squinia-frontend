import type { ReactNode } from "react";

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

type Tone = "neutral" | "success" | "warning" | "danger" | "info";
type IconProps = {
  className?: string;
  "aria-hidden"?: boolean;
};

const badgeTone: Record<Tone, string> = {
  neutral: "border-[var(--rule)] bg-[var(--field)] text-[var(--muted)]",
  success: "border-[#b8e8c4] bg-[var(--accent-soft)] text-[#166534]",
  warning: "border-amber-200 bg-[var(--warning-soft)] text-[var(--warning-strong)]",
  danger: "border-red-200 bg-[var(--danger-soft)] text-[var(--danger-strong)]",
  info: "border-blue-200 bg-[var(--info-soft)] text-[var(--info-strong)]",
};

export function AiSparkIcon({ className, "aria-hidden": ariaHidden = true }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={ariaHidden}
    >
      <path d="M12 2L14.43 8.61L21 11L14.43 13.39L12 20L9.57 13.39L3 11L9.57 8.61L12 2Z" fill="currentColor" />
      <path d="M19 3L19.72 4.96L21.68 5.68L19.72 6.4L19 8.36L18.28 6.4L16.32 5.68L18.28 4.96L19 3Z" fill="currentColor" />
      <path d="M5 16L5.72 17.96L7.68 18.68L5.72 19.4L5 21.36L4.28 19.4L2.32 18.68L4.28 17.96L5 16Z" fill="currentColor" />
    </svg>
  );
}

export function ProductPageHeader({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--faint)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[var(--foreground)] sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[var(--muted)]">{description}</p>
        ) : null}
        {children}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function ProductCard({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return <section className={cx("squinia-card", padded && "p-5 sm:p-6", className)}>{children}</section>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-lg font-semibold tracking-[-0.025em] text-[var(--foreground)]">{title}</h2>
        {description ? <p className="mt-1 text-[13px] leading-6 text-[var(--muted)]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.1em]",
        badgeTone[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  tone = "neutral",
  delta,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: Tone;
  delta?: ReactNode;
}) {
  const valueColor =
    tone === "danger"
      ? "text-[var(--danger-strong)]"
      : tone === "warning"
        ? "text-[var(--warning-strong)]"
        : tone === "success"
          ? "text-[#166534]"
          : "text-[var(--foreground)]";
  return (
    <div className="squinia-card-soft p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--faint)]">
          {label}
        </p>
        {delta ? <span className="text-[12px] font-medium text-[var(--muted)]">{delta}</span> : null}
      </div>
      <p className={cx("mt-3 text-3xl font-semibold tracking-[-0.04em] tabular-nums", valueColor)}>
        {value}
      </p>
      {detail ? <p className="mt-1 text-[12px] leading-5 text-[var(--muted)]">{detail}</p> : null}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cx("squinia-skeleton rounded-xl", className)} aria-hidden />;
}

export type LineChartPoint = {
  label: string;
  value: number | null;
  secondary?: number | null;
};

function roundedMax(values: number[]): number {
  if (!values.length) return 100;
  const max = Math.max(...values, 10);
  if (max <= 100) return 100;
  return Math.ceil(max / 10) * 10;
}

function pathFor(points: Array<{ x: number; y: number }>): string {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function chartSegments(
  points: LineChartPoint[],
  key: "value" | "secondary",
  xFor: (index: number) => number,
  yFor: (value: number) => number,
): Array<Array<{ x: number; y: number; label: string; value: number }>> {
  const segments: Array<Array<{ x: number; y: number; label: string; value: number }>> = [];
  let current: Array<{ x: number; y: number; label: string; value: number }> = [];

  points.forEach((point, index) => {
    const raw = key === "value" ? point.value : point.secondary;
    if (typeof raw !== "number" || !Number.isFinite(raw)) {
      if (current.length) segments.push(current);
      current = [];
      return;
    }
    current.push({ x: xFor(index), y: yFor(raw), label: point.label, value: raw });
  });

  if (current.length) segments.push(current);
  return segments;
}

export function LineChart({
  points,
  ariaLabel,
  height = 190,
  yMin = 0,
  yMax,
  valueSuffix = "%",
  color = "#32a852",
  secondaryColor = "#175cd3",
  secondaryLabel,
}: {
  points: LineChartPoint[];
  ariaLabel: string;
  height?: number;
  yMin?: number;
  yMax?: number;
  valueSuffix?: string;
  color?: string;
  secondaryColor?: string;
  secondaryLabel?: string;
}) {
  const width = 720;
  const pad = { top: 18, right: 18, bottom: 34, left: 42 };
  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const numeric = points.flatMap((point) =>
    [point.value, point.secondary].filter((value): value is number => typeof value === "number" && Number.isFinite(value)),
  );
  const max = yMax ?? roundedMax(numeric);
  const safeRange = Math.max(1, max - yMin);
  const xFor = (index: number) => pad.left + (points.length <= 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);
  const yFor = (value: number) => pad.top + innerHeight - ((Math.max(yMin, Math.min(max, value)) - yMin) / safeRange) * innerHeight;
  const primary = chartSegments(points, "value", xFor, yFor);
  const secondary = secondaryLabel ? chartSegments(points, "secondary", xFor, yFor) : [];
  const hasData = primary.some((segment) => segment.length > 0) || secondary.some((segment) => segment.length > 0);
  const labelStep = Math.max(1, Math.ceil(points.length / 5));

  if (!hasData) {
    return (
      <div className="grid min-h-[190px] place-items-center rounded-xl border border-dashed border-[var(--rule)] bg-[var(--field)]/35 px-4 text-center">
        <p className="max-w-sm text-[13px] leading-6 text-[var(--muted)]">Trend data will appear after scored sessions are available.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = pad.top + innerHeight * tick;
          const value = Math.round(max - safeRange * tick);
          return (
            <g key={tick}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="var(--rule)" strokeWidth="1" />
              <text x="0" y={y + 4} className="fill-[var(--faint)]" style={{ fontSize: 10, fontFamily: "var(--squinia-font-mono)" }}>
                {value}
              </text>
            </g>
          );
        })}

        {secondary.map((segment, index) => (
          <path
            key={`secondary-${index}`}
            d={pathFor(segment)}
            fill="none"
            stroke={secondaryColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="5 5"
          />
        ))}
        {primary.map((segment, index) => (
          <path
            key={`primary-${index}`}
            d={pathFor(segment)}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {primary.flat().map((point) => (
          <g key={`point-${point.label}-${point.value}`}>
            <circle cx={point.x} cy={point.y} r="4.25" fill="var(--surface)" stroke={color} strokeWidth="2.25">
              <title>{`${point.label}: ${Math.round(point.value)}${valueSuffix}`}</title>
            </circle>
          </g>
        ))}

        {points.map((point, index) =>
          index % labelStep === 0 || index === points.length - 1 ? (
            <text
              key={`label-${point.label}-${index}`}
              x={xFor(index)}
              y={height - 8}
              textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
              className="fill-[var(--faint)]"
              style={{ fontSize: 10, fontFamily: "var(--squinia-font-mono)" }}
            >
              {point.label}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}

export function LineChartCard({
  eyebrow,
  title,
  description,
  metric,
  points,
  ariaLabel,
  secondaryLabel,
  valueSuffix,
  yMax,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  metric?: ReactNode;
  points: LineChartPoint[];
  ariaLabel: string;
  secondaryLabel?: string;
  valueSuffix?: string;
  yMax?: number;
}) {
  return (
    <ProductCard>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        {metric ? <div className="text-right">{metric}</div> : null}
      </div>
      <div className="mt-5">
        <LineChart
          points={points}
          ariaLabel={ariaLabel}
          secondaryLabel={secondaryLabel}
          valueSuffix={valueSuffix}
          yMax={yMax}
        />
      </div>
      {secondaryLabel ? (
        <div className="mt-3 flex items-center gap-4 text-[12px] text-[var(--muted)]">
          <span className="inline-flex items-center gap-2">
            <span className="h-0.5 w-5 rounded-full bg-[var(--accent)]" aria-hidden />
            Score
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-0.5 w-5 rounded-full bg-[#175cd3]" aria-hidden />
            {secondaryLabel}
          </span>
        </div>
      ) : null}
    </ProductCard>
  );
}
