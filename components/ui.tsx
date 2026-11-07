"use client";

import type { ReactNode } from "react";
import type { Service, SourceState } from "../lib/data";

const ACCENT: Record<Service | "churn", string> = {
  rag: "text-rag",
  agent: "text-agent",
  tickets: "text-tickets",
  churn: "text-churn",
};

export function SourceBadge({ state, label }: { state: SourceState; label: string }) {
  const base = "font-mono inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[0.7rem] tracking-wide";
  if (state === "live")
    return (
      <span className={`${base} border-agent/40 text-agent`}>
        <Dot className="bg-agent" /> LIVE · {label}
      </span>
    );
  if (state === "fixture")
    return (
      <span className={`${base} border-line text-muted`}>
        <Dot className="bg-faint" /> FIXTURE · {label}
      </span>
    );
  if (state === "error")
    return (
      <span className={`${base} border-alarm/40 text-alarm`}>
        <Dot className="bg-alarm" /> ERROR · {label}
      </span>
    );
  return (
    <span className={`${base} border-line text-faint`}>
      <Dot className="bg-faint" /> LOADING
    </span>
  );
}

function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${className}`} aria-hidden />;
}

export function Card({
  service,
  title,
  blurb,
  badge,
  children,
  enter,
}: {
  service: Service | "churn";
  title: string;
  blurb: string;
  badge: ReactNode;
  children: ReactNode;
  enter: string;
}) {
  return (
    <section
      className={`enter ${enter} flex min-w-0 flex-col rounded-xl border border-line bg-panel`}
      aria-label={title}
    >
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-5 pt-4 pb-3">
        <div>
          <h2 className={`font-display text-lg font-bold ${ACCENT[service]}`}>{title}</h2>
          <p className="mt-0.5 text-sm text-muted">{blurb}</p>
        </div>
        {badge}
      </header>
      <div className="flex min-w-0 flex-1 flex-col gap-3 px-5 py-4">{children}</div>
    </section>
  );
}

export function Chip({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`lift cursor-pointer rounded-full border px-3 py-1 font-mono text-[0.72rem] ${
        active ? "border-current bg-raised text-text" : "border-line text-muted hover:border-faint hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[0.72rem] tracking-[0.14em] text-faint uppercase">{children}</p>;
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton h-4 rounded" style={{ width: `${100 - i * 12}%` }} />
      ))}
    </div>
  );
}

export function Notice({ tone, children }: { tone: "alarm" | "dim"; children: ReactNode }) {
  const cls =
    tone === "alarm" ? "border-alarm/40 bg-alarm/10 text-text" : "border-line bg-raised text-muted";
  return <p className={`rounded-lg border px-3 py-2 text-sm ${cls}`}>{children}</p>;
}

export function AskRow({
  value,
  onChange,
  onSubmit,
  placeholder,
  busy,
  accent,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  busy: boolean;
  accent: string;
}) {
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text placeholder:text-faint focus:border-faint focus:outline-none"
      />
      <button
        type="submit"
        disabled={busy || value.trim().length === 0}
        className={`lift shrink-0 cursor-pointer rounded-lg border px-4 py-2 font-mono text-[0.75rem] font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${accent}`}
      >
        {busy ? "…" : "ASK"}
      </button>
    </form>
  );
}
