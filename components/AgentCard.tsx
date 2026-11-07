"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentEvent, AgentFinal, LiveBases, Service, SourceState } from "../lib/data";
import { AGENT_SAMPLES, fetchFirst, targetsFor } from "../lib/data";
import { feedSse } from "../lib/sse";
import { AskRow, Card, Chip, Notice, SectionLabel, Skeleton, SourceBadge } from "./ui";

const REPLAY_MS = 340;

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : "unknown error";
}

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function summarize(value: unknown): string {
  if (value === undefined || value === null) return "";
  const s = typeof value === "string" ? value : JSON.stringify(value);
  return s.length > 140 ? `${s.slice(0, 140)}…` : s;
}

export default function AgentCard({
  bases,
  onSource,
}: {
  bases: LiveBases;
  onSource: (service: Service, state: SourceState) => void;
}) {
  const [index, setIndex] = useState(0);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [visible, setVisible] = useState(0);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [source, setSource] = useState<SourceState>("loading");
  const runId = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopReplay = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => stopReplay, [stopReplay]);

  const replay = useCallback(
    (list: AgentEvent[]) => {
      stopReplay();
      setEvents(list);
      if (reducedMotion()) {
        setVisible(list.length);
        return;
      }
      setVisible(0);
      timer.current = setInterval(() => {
        setVisible((v) => {
          if (v >= list.length) {
            stopReplay();
            return v;
          }
          return v + 1;
        });
      }, REPLAY_MS);
    },
    [stopReplay],
  );

  const loadFixture = useCallback(
    async (id: number, fixture: string) => {
      try {
        const { data } = await fetchFirst<AgentEvent[]>(targetsFor({}, "agent", "/chat/stream", fixture, "data"));
        if (!Array.isArray(data)) throw new Error("fixture is not an event list");
        if (id !== runId.current) return;
        replay(data);
        setSource("fixture");
        onSource("agent", "fixture");
      } catch (err) {
        if (id !== runId.current) return;
        setError(`Could not load trajectory (${errMsg(err)}).`);
        setSource("error");
        onSource("agent", "error");
      } finally {
        if (id === runId.current) {
          setLoading(false);
          setStreaming(false);
        }
      }
    },
    [onSource, replay],
  );

  const load = useCallback(
    async (sampleIndex: number, message: string, fixture: string) => {
      const id = ++runId.current;
      stopReplay();
      setIndex(sampleIndex);
      setEvents([]);
      setVisible(0);
      setLoading(true);
      setStreaming(false);
      setError(null);
      setNotice(null);
      setSource("loading");
      onSource("agent", "loading");

      const liveBase = bases.agent;
      if (liveBase) {
        try {
          const res = await fetch(`${liveBase}/chat/stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
          });
          if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
          if (id !== runId.current) return;
          setSource("live");
          onSource("agent", "live");
          setLoading(false);
          setStreaming(true);
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let rest = "";
          const live: AgentEvent[] = [];
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            const fed = feedSse(rest, decoder.decode(value, { stream: true }));
            rest = fed.rest;
            for (const payload of fed.events) {
              try {
                live.push(JSON.parse(payload) as AgentEvent);
              } catch {
                /* skip malformed frames */
              }
            }
            if (id !== runId.current) {
              void reader.cancel();
              return;
            }
            setEvents([...live]);
            setVisible(live.length);
          }
          setStreaming(false);
          return;
        } catch (err) {
          if (id !== runId.current) return;
          setNotice(`Live backend unreachable (${errMsg(err)}) — replaying recorded fixture.`);
        }
      }
      await loadFixture(id, fixture);
    },
    [bases.agent, loadFixture, onSource, stopReplay],
  );

  useEffect(() => {
    const first = AGENT_SAMPLES[0];
    if (first) void load(0, first.message, first.fixture);
  }, [load]);

  const askCustom = (): void => {
    const m = input.trim();
    if (!m) return;
    if (bases.agent) {
      void load(-1, m, "m_password.json");
      return;
    }
    const norm = m.toLowerCase();
    const hit = AGENT_SAMPLES.findIndex(
      (s) => s.message.toLowerCase() === norm || (norm.length > 12 && s.message.toLowerCase().includes(norm)),
    );
    if (hit >= 0) {
      const s = AGENT_SAMPLES[hit];
      if (s) void load(hit, s.message, s.fixture);
    } else {
      setNotice("Recorded demo — pick a sample above. Set NEXT_PUBLIC_API_AGENT at build time for live runs.");
    }
  };

  const shown = events.slice(0, visible);
  const final = events.find((e) => e.type === "final");
  const finalResult: AgentFinal | null = final && final.type === "final" ? final.result : null;

  return (
    <Card
      service="agent"
      title="Agent trajectories"
      blurb="Support loop · 340ms event replay"
      badge={<SourceBadge state={source} label="AGENT" />}
      enter="enter-2"
    >
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Sample messages">
        {AGENT_SAMPLES.map((s, i) => (
          <Chip key={s.fixture} active={i === index} title={s.hint} onClick={() => void load(i, s.message, s.fixture)}>
            {s.label}
          </Chip>
        ))}
      </div>
      <AskRow
        value={input}
        onChange={setInput}
        onSubmit={askCustom}
        placeholder={bases.agent ? "Message the agent…" : "Pick a sample — live runs need a backend"}
        busy={loading || streaming}
        accent="border-agent/40 text-agent hover:bg-agent/10"
      />
      {notice && <Notice tone="dim">{notice}</Notice>}
      {error && <Notice tone="alarm">{error}</Notice>}
      {loading && events.length === 0 && <Skeleton lines={4} />}
      {events.length > 0 && (
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <SectionLabel>Trajectory</SectionLabel>
            <span className="font-mono text-[0.7rem] text-faint">
              {visible}/{events.length} events{streaming ? " · streaming" : ""}
            </span>
          </div>
          <ol className="flex flex-col gap-1.5">
            {shown.map((e, i) => (
              <li key={i} className="replay-row">
                <EventRow event={e} />
              </li>
            ))}
          </ol>
          {finalResult && visible >= events.length && <FinalPanel result={finalResult} />}
        </div>
      )}
    </Card>
  );
}

function EventRow({ event }: { event: AgentEvent }) {
  const row = "flex flex-col gap-0.5 rounded-lg border border-line bg-ink px-3 py-2 font-mono text-[0.72rem]";
  switch (event.type) {
    case "agent_start":
      return (
        <div className={row}>
          <span className="text-agent">▶ agent {event.agent}</span>
        </div>
      );
    case "handoff":
      return (
        <div className={row}>
          <span className="text-text">
            {event.from} <span className="text-agent">→</span> {event.to}
          </span>
          {event.reason && <span className="text-muted">{event.reason}</span>}
        </div>
      );
    case "tool_call":
      return (
        <div className={row}>
          <span className="text-text">⚙ {event.name}</span>
          {event.arguments !== undefined && (
            <span className="break-all text-faint">{summarize(event.arguments)}</span>
          )}
        </div>
      );
    case "tool_result":
      return (
        <div className={row}>
          <span className="text-muted">✓ {event.name}</span>
          {event.result !== undefined && <span className="break-all text-faint">{summarize(event.result)}</span>}
        </div>
      );
    case "final":
      return (
        <div className={`${row} border-agent/40`}>
          <span className="text-agent">■ final · {event.result.escalated ? "escalated" : "resolved"}</span>
        </div>
      );
    case "error":
      return (
        <div className={`${row} border-alarm/40`}>
          <span className="text-alarm">✖ {event.error}</span>
        </div>
      );
  }
}

function FinalPanel({ result }: { result: AgentFinal }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-agent/30 bg-ink px-3 py-2.5">
      {result.escalated ? (
        <Notice tone="alarm">Escalated to a human specialist.</Notice>
      ) : null}
      <p className="text-[0.95rem] leading-relaxed">{result.final_answer}</p>
      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[0.7rem]">
        <span className="text-faint">path</span>
        {result.agents_path.map((a) => (
          <span key={a} className="rounded border border-line px-1.5 py-0.5 text-muted">
            {a}
          </span>
        ))}
        <span className="text-faint">tools</span>
        {result.tools_called.length > 0 ? (
          result.tools_called.map((t) => (
            <span key={t} className="rounded border border-agent/40 px-1.5 py-0.5 text-agent">
              {t}
            </span>
          ))
        ) : (
          <span className="text-faint">none</span>
        )}
      </div>
      <p className="font-mono text-[0.7rem] text-faint">
        iterations {result.iterations ?? "—"} · ticket {result.ticket_id ?? "—"}
      </p>
    </div>
  );
}
