import Link from "next/link";
import type { ReactNode } from "react";
import { formatPrice } from "@/lib/format";

/* -------------------------------------------------------------------------- */
/* Layout pieces                                                              */
/* -------------------------------------------------------------------------- */

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="animate-rise flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`glass animate-rise rounded-2xl p-5 sm:p-6 ${className}`}
    >
      {title || action ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-xs leading-5 text-muted-soft">
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={title || action ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

export function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="shrink-0 text-sm font-semibold text-accent transition-colors hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {children}
    </Link>
  );
}

const toneClasses = {
  accent: "bg-accent-soft text-accent ring-accent-border",
  info: "bg-info-soft text-info ring-info-border",
  warning: "bg-warning-soft text-warning ring-warning-border",
  danger: "bg-danger-soft text-danger ring-danger-border",
  shipped: "bg-shipped-soft text-shipped ring-shipped-border",
} as const;

export type Tone = keyof typeof toneClasses;

export function StatCard({
  label,
  value,
  detail,
  icon,
  href,
  tone = "accent",
}: {
  label: string;
  value: string;
  detail?: string;
  icon: ReactNode;
  href?: string;
  tone?: Tone;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-soft">{label}</p>
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 [&>svg]:h-[1.1rem] [&>svg]:w-[1.1rem] ${toneClasses[tone]}`}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 truncate text-2xl font-bold tracking-tight text-foreground sm:text-[1.7rem]">
        {value}
      </p>
      {detail ? (
        <p className="mt-1 truncate text-xs text-muted-soft">{detail}</p>
      ) : null}
    </>
  );
  const base =
    "glass animate-rise block rounded-2xl p-5 transition duration-300";

  if (href) {
    return (
      <Link
        href={href}
        className={`${base} hover:-translate-y-0.5 hover:border-accent-border hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
      >
        {body}
      </Link>
    );
  }

  return <div className={base}>{body}</div>;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong bg-surface-muted/60 px-6 py-12 text-center">
      <span
        className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface text-accent shadow-sm ring-1 ring-accent-border [&>svg]:h-5 [&>svg]:w-5"
        aria-hidden="true"
      >
        {icon}
      </span>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-muted">
        {description}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function DashboardSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div aria-hidden="true">
      <div className="h-3 w-24 animate-pulse rounded-full bg-surface-subtle" />
      <div className="mt-3 h-8 w-64 animate-pulse rounded-full bg-surface-subtle" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }, (_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl bg-surface-subtle" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="h-72 animate-pulse rounded-2xl bg-surface-subtle" />
        <div className="h-72 animate-pulse rounded-2xl bg-surface-subtle" />
      </div>
    </div>
  );
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/* -------------------------------------------------------------------------- */
/* Charts (pure SVG, no dependency)                                           */
/* -------------------------------------------------------------------------- */

export type BarDatum = { label: string; value: number; title?: string };

/**
 * Responsive bar chart. `money` formats the axis and tooltips as currency
 * (values are cents). Every bar carries a <title> so values are available to
 * hover and to assistive technology.
 */
export function BarChart({
  data,
  money = false,
  emptyMessage,
  ariaLabel,
}: {
  data: BarDatum[];
  money?: boolean;
  emptyMessage: string;
  ariaLabel: string;
}) {
  const max = Math.max(0, ...data.map((entry) => entry.value));

  if (data.length === 0 || max === 0) {
    return (
      <p className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface-muted/60 px-4 text-center text-sm text-muted">
        {emptyMessage}
      </p>
    );
  }

  const width = 640;
  const height = 220;
  const padLeft = 8;
  const padRight = 8;
  const padTop = 12;
  const padBottom = 28;
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;
  const slot = innerWidth / data.length;
  const barWidth = Math.max(3, Math.min(34, slot * 0.62));
  const labelEvery = Math.ceil(data.length / 8);
  const format = (value: number) => (money ? formatPrice(value) : String(value));

  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="h-auto w-full"
      >
        {[0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = padTop + innerHeight - innerHeight * fraction;

          return (
            <line
              key={fraction}
              x1={padLeft}
              x2={width - padRight}
              y1={y}
              y2={y}
              stroke="var(--border)"
              strokeDasharray="3 4"
            />
          );
        })}
        {data.map((entry, index) => {
          const barHeight = (entry.value / max) * innerHeight;
          const x = padLeft + slot * index + (slot - barWidth) / 2;
          const y = padTop + innerHeight - barHeight;

          return (
            <g key={`${entry.label}-${index}`}>
              <title>{entry.title ?? `${entry.label}: ${format(entry.value)}`}</title>
              <rect
                x={x}
                y={entry.value > 0 ? y : padTop + innerHeight - 1}
                width={barWidth}
                height={entry.value > 0 ? barHeight : 1}
                rx={Math.min(5, barWidth / 2)}
                fill={entry.value > 0 ? "var(--accent-bright)" : "var(--border)"}
                opacity={entry.value > 0 ? 0.92 : 1}
              />
              {index % labelEvery === 0 ? (
                <text
                  x={x + barWidth / 2}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--muted-soft)"
                >
                  {entry.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1 text-right text-xs text-muted-soft">
        Peak: {format(max)}
      </figcaption>
    </figure>
  );
}

export type DonutSegment = { label: string; value: number; color: string };

export function DonutChart({
  segments,
  centerLabel,
  emptyMessage,
}: {
  segments: DonutSegment[];
  centerLabel: string;
  emptyMessage: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total === 0) {
    return (
      <p className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface-muted/60 px-4 text-center text-sm text-muted">
        {emptyMessage}
      </p>
    );
  }

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const visible = segments.filter((segment) => segment.value > 0);
  const arcs = visible.map((segment, index) => ({
    segment,
    length: (segment.value / total) * circumference,
    offset: visible
      .slice(0, index)
      .reduce((sum, previous) => sum + (previous.value / total) * circumference, 0),
  }));

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <svg
        viewBox="0 0 140 140"
        role="img"
        aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}
        className="h-36 w-36 shrink-0 -rotate-90"
      >
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--border)" strokeWidth="16" />
        {arcs.map(({ segment, length, offset }) => (
          <circle
            key={segment.label}
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth="16"
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-offset}
          >
            <title>{`${segment.label}: ${segment.value}`}</title>
          </circle>
        ))}
        <g transform="rotate(90 70 70)">
          <text x="70" y="68" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--foreground)">
            {total}
          </text>
          <text x="70" y="86" textAnchor="middle" fontSize="9" fill="var(--muted-soft)">
            {centerLabel}
          </text>
        </g>
      </svg>
      <ul className="w-full min-w-0 flex-1 space-y-1.5 text-sm">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-muted-strong">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: segment.color }}
              />
              <span className="truncate">{segment.label}</span>
            </span>
            <span className="font-semibold text-foreground">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const STATUS_COLORS = {
  pending: "var(--warning)",
  confirmed: "var(--info)",
  processing: "var(--accent-bright)",
  shipped: "var(--shipped)",
  delivered: "var(--accent)",
  cancelled: "var(--danger)",
} as const;
