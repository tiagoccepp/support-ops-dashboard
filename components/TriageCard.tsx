"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveBases, Service, SourceState, Ticket, TriageMetrics } from "../lib/data";
import { confidencePct, fetchFirst, sourceOf, targetsFor } from "../lib/data";
import { Card, Notice, SectionLabel, Skeleton, SourceBadge } from "./ui";

interface QueuePayload {
  tickets: Ticket[];
}

interface HealthPayload {
  status?: string;
  labels?: string;
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : "unknown error";
}

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 10)}…` : id;
}

export default function TriageCard({
  bases,
  onSource,
}: {
  bases: LiveBases;
  onSource: (service: Service, state: SourceState) => void;
}) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [metrics, setMetrics] = useState<TriageMetrics | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [source, setSource] = useState<SourceState>("loading");
  const runId = useRef(0);

  const load = useCallback(async () => {
    const id = ++runId.current;
    setLoading(true);
    setError(null);
    setNotice(null);
    setSource("loading");
    onSource("tickets", "loading");
    try {
      const [queue, stats] = await Promise.all([
        fetchFirst<QueuePayload>(targetsFor(bases, "tickets", "/review-queue", "queue.json", "data")),
        fetchFirst<TriageMetrics>(targetsFor(bases, "tickets", "/metrics", "metrics.json", "data")),
      ]);
      if (id !== runId.current) return;
      if (!Array.isArray(queue.data.tickets)) throw new Error("queue payload is not a ticket list");
      setTickets(queue.data.tickets);
      setMetrics(stats.data);
      const src = sourceOf(queue.url, bases, "tickets");
      setSource(src);
      onSource("tickets", src);
      if (bases.tickets && src === "fixture") {
        setNotice("Live backend unreachable — showing recorded queue.");
      }
      const initial: Record<string, string> = {};
      for (const t of queue.data.tickets) initial[t.id] = t.label;
      setPicks(initial);
    } catch (err) {
      if (id !== runId.current) return;
      setError(`Could not load review queue (${errMsg(err)}).`);
      setSource("error");
      onSource("tickets", "error");
    } finally {
      if (id === runId.current) setLoading(false);
    }

    try {
      const { data } = await fetchFirst<HealthPayload>(
        targetsFor(bases, "tickets", "/health", "health.json", "data"),
      );
      if (id !== runId.current) return;
      if (data.labels) {
        setLabels(data.labels.split(",").map((l) => l.trim()).filter(Boolean));
      }
    } catch {
      if (id !== runId.current) return;
      setTickets((prev) => {
        setLabels((cur) => (cur.length > 0 ? cur : [...new Set(prev.map((t) => t.label))]));
        return prev;
      });
    }
  }, [bases, onSource]);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (ticket: Ticket, decision: "approve" | "override") => {
    const label = picks[ticket.id] ?? ticket.label;
    if (decision === "override" && !label) return;
    setActing(ticket.id);
    setError(null);
    const liveBase = bases.tickets;
    if (liveBase && source === "live") {
      try {
        const res = await fetch(`${liveBase}/review/${ticket.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision,
            label: decision === "override" ? label : null,
            reviewer: "ops-dashboard",
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        setError(`Review failed (${errMsg(err)}) — ticket untouched.`);
        setActing(null);
        return;
      }
    } else if (source === "fixture") {
      setNotice("Fixture mode — review applied locally, nothing sent anywhere.");
    }
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket.id
          ? { ...t, status: "reviewed", label: decision === "override" ? label : t.label }
          : t,
      ),
    );
    setActing(null);
  };

  const needsReview = tickets.filter((t) => t.status === "needs_review" || t.status === "abstained").length;

  return (
    <Card
      service="tickets"
      title="Ticket triage"
      blurb="Review queue · approve or override"
      badge={<SourceBadge state={source} label="TRIAGE" />}
      enter="enter-3"
    >
      {notice && <Notice tone="dim">{notice}</Notice>}
      {error && <Notice tone="alarm">{error}</Notice>}
      {loading && tickets.length === 0 && <Skeleton lines={4} />}
      {metrics && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.72rem] text-muted">
          <span>
            <span className="font-display text-base font-bold text-text">{metrics.total}</span> tickets
          </span>
          <span>
            <span className="text-tickets">{Math.round(metrics.review_rate * 100)}%</span> review rate
          </span>
          <span>
            <span className="text-tickets">{needsReview}</span> need review
          </span>
        </div>
      )}
      {tickets.length > 0 && (
        <div className="flex min-w-0 flex-col gap-2">
          <SectionLabel>Queue</SectionLabel>
          <ol className="flex flex-col gap-2">
            {tickets.map((t) => (
              <li
                key={t.id}
                className="flex min-w-0 flex-col gap-2 rounded-lg border border-line bg-ink px-3 py-2.5"
              >
                <div className="flex min-w-0 items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{t.title || "(untitled)"}</p>
                  <span className="shrink-0 font-mono text-[0.7rem] text-faint">{shortId(t.id)}</span>
                </div>
                <p className="line-clamp-2 text-sm text-muted">{t.body}</p>
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[0.7rem]">
                  <span className="rounded border border-tickets/40 px-1.5 py-0.5 text-tickets">
                    {t.label}
                  </span>
                  <span className="text-muted">{confidencePct(t.confidence)}</span>
                  <span
                    className={`rounded border px-1.5 py-0.5 ${
                      t.status === "reviewed" ? "border-agent/40 text-agent" : "border-line text-muted"
                    }`}
                  >
                    {t.status}
                  </span>
                  {t.runner_up && <span className="text-faint">runner-up {t.runner_up}</span>}
                </div>
                {t.status !== "reviewed" ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={acting === t.id}
                      onClick={() => void review(t, "approve")}
                      className="lift cursor-pointer rounded-md border border-agent/40 px-2.5 py-1 font-mono text-[0.7rem] font-semibold text-agent hover:bg-agent/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {acting === t.id ? "…" : "APPROVE"}
                    </button>
                    <select
                      value={picks[t.id] ?? t.label}
                      onChange={(e) =>
                        setPicks((prev) => ({ ...prev, [t.id]: e.target.value }))
                      }
                      aria-label={`Override label for ${shortId(t.id)}`}
                      className="min-w-0 max-w-40 cursor-pointer rounded-md border border-line bg-panel px-2 py-1 font-mono text-[0.7rem] text-muted focus:border-faint focus:outline-none"
                    >
                      {(labels.length > 0 ? labels : [t.label]).map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={acting === t.id}
                      onClick={() => void review(t, "override")}
                      className="lift cursor-pointer rounded-md border border-line px-2.5 py-1 font-mono text-[0.7rem] font-semibold text-muted hover:border-faint hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      OVERRIDE
                    </button>
                  </div>
                ) : (
                  <p className="font-mono text-[0.7rem] text-agent">✓ reviewed</p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </Card>
  );
}
