"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveBases, RagAnswer, Service, SourceState } from "../lib/data";
import { RAG_SAMPLES, fetchFirst, shortSource, targetsFor } from "../lib/data";
import { renderMiniMarkdown } from "../lib/md";
import { AskRow, Card, Chip, Notice, SectionLabel, Skeleton, SourceBadge } from "./ui";

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : "unknown error";
}

export default function RagCard({
  bases,
  onSource,
}: {
  bases: LiveBases;
  onSource: (service: Service, state: SourceState) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<RagAnswer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [source, setSource] = useState<SourceState>("loading");
  const runId = useRef(0);

  const load = useCallback(
    async (sampleIndex: number, question: string, fixture: string) => {
      const id = ++runId.current;
      setIndex(sampleIndex);
      setLoading(true);
      setError(null);
      setNotice(null);
      setSource("loading");
      onSource("rag", "loading");

      const liveBase = bases.rag;
      if (liveBase) {
        try {
          const res = await fetch(`${liveBase}/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, top_k: 5 }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as RagAnswer;
          if (id !== runId.current) return;
          setAnswer(data);
          setSource("live");
          onSource("rag", "live");
          setLoading(false);
          return;
        } catch (err) {
          if (id !== runId.current) return;
          setNotice(`Live backend unreachable (${errMsg(err)}) — showing recorded fixture.`);
        }
      }

      try {
        const { data } = await fetchFirst<RagAnswer>(targetsFor({}, "rag", "/query", fixture, "data"));
        if (id !== runId.current) return;
        setAnswer(data);
        setSource("fixture");
        onSource("rag", "fixture");
      } catch (err) {
        if (id !== runId.current) return;
        setError(`Could not load answer (${errMsg(err)}).`);
        setSource("error");
        onSource("rag", "error");
      } finally {
        if (id === runId.current) setLoading(false);
      }
    },
    [bases.rag, onSource],
  );

  useEffect(() => {
    const first = RAG_SAMPLES[0];
    if (first) void load(0, first.question, first.fixture);
  }, [load]);

  const askCustom = (): void => {
    const q = input.trim();
    if (!q) return;
    if (bases.rag) {
      void load(-1, q, "q_pricing.json");
      return;
    }
    const norm = q.toLowerCase();
    const hit = RAG_SAMPLES.findIndex(
      (s) => s.question.toLowerCase() === norm || (norm.length > 12 && s.question.toLowerCase().includes(norm)),
    );
    if (hit >= 0) {
      const s = RAG_SAMPLES[hit];
      if (s) void load(hit, s.question, s.fixture);
    } else {
      setNotice("Recorded demo — pick a sample above. Set NEXT_PUBLIC_API_RAG at build time for free ask.");
    }
  };

  return (
    <Card
      service="rag"
      title="RAG answers"
      blurb="Docs assistant · citations + passage scores"
      badge={<SourceBadge state={source} label="RAG" />}
      enter="enter-1"
    >
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Sample questions">
        {RAG_SAMPLES.map((s, i) => (
          <Chip key={s.fixture} active={i === index} title={s.hint} onClick={() => void load(i, s.question, s.fixture)}>
            {s.label}
          </Chip>
        ))}
      </div>
      <AskRow
        value={input}
        onChange={setInput}
        onSubmit={askCustom}
        placeholder={bases.rag ? "Ask the docs…" : "Pick a sample — free ask needs a live backend"}
        busy={loading}
        accent="border-rag/40 text-rag hover:bg-rag/10"
      />
      {notice && <Notice tone="dim">{notice}</Notice>}
      {error && <Notice tone="alarm">{error}</Notice>}
      {loading && !answer && <Skeleton lines={4} />}
      {answer && (
        <div className="flex min-w-0 flex-col gap-3">
          {answer.abstained && (
            <Notice tone="alarm">Abstained — no reliable passage found in the docs.</Notice>
          )}
          <p
            className="max-w-[72ch] text-[0.95rem] leading-relaxed [&_strong]:font-semibold [&_strong]:text-rag"
            dangerouslySetInnerHTML={{ __html: renderMiniMarkdown(answer.answer) }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[0.72rem] text-faint">model {answer.model}</span>
            {answer.citations.map((c) => (
              <span key={c} className="rounded border border-rag/40 px-1.5 py-0.5 font-mono text-[0.7rem] text-rag">
                [{c}]
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <SectionLabel>Passages</SectionLabel>
            {answer.passages.map((p) => (
              <details key={p.chunk_id} className="rounded-lg border border-line bg-ink px-3 py-2">
                <summary className="cursor-pointer font-mono text-[0.72rem] text-muted">
                  <span className="text-rag">{p.score.toFixed(3)}</span> · {shortSource(p.source)} · {p.section}
                </summary>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.text}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
