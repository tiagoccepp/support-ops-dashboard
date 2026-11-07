"use client";

import type { LiveBases, Service, SourceState } from "../lib/data";
import { SourceBadge } from "./ui";

const SERVICES: { id: Service; label: string }[] = [
  { id: "rag", label: "RAG" },
  { id: "agent", label: "AGENT" },
  { id: "tickets", label: "TRIAGE" },
];

export default function StatusStrip({
  statuses,
  bases,
}: {
  statuses: Record<Service, SourceState>;
  bases: LiveBases;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="status" aria-label="Backend status">
      {SERVICES.map(({ id, label }) => (
        <span key={id} title={bases[id] ?? "recorded fixture"}>
          <SourceBadge state={statuses[id]} label={label} />
        </span>
      ))}
      <span className="font-mono text-[0.7rem] text-faint">
        {Object.values(bases).some(Boolean) ? "live backends configured" : "zero-config fixture mode"}
      </span>
    </div>
  );
}
