"use client";

import { useCallback, useMemo, useState } from "react";
import type { LiveBases, Service, SourceState } from "../lib/data";
import { liveBasesFromEnv } from "../lib/data";
import AgentCard from "../components/AgentCard";
import ChurnCard from "../components/ChurnCard";
import RagCard from "../components/RagCard";
import StatusStrip from "../components/StatusStrip";
import TriageCard from "../components/TriageCard";

const ENV = process.env;

export default function Overview() {
  const bases: LiveBases = useMemo(
    () =>
      liveBasesFromEnv({
        NEXT_PUBLIC_API_RAG: ENV["NEXT_PUBLIC_API_RAG"],
        NEXT_PUBLIC_API_AGENT: ENV["NEXT_PUBLIC_API_AGENT"],
        NEXT_PUBLIC_API_TICKETS: ENV["NEXT_PUBLIC_API_TICKETS"],
      }),
    [],
  );

  const [statuses, setStatuses] = useState<Record<Service, SourceState>>({
    rag: "loading",
    agent: "loading",
    tickets: "loading",
  });

  const handleSource = useCallback((service: Service, state: SourceState) => {
    setStatuses((prev) => (prev[service] === state ? prev : { ...prev, [service]: state }));
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[0.72rem] tracking-[0.2em] text-faint uppercase">Support ops</p>
          <h1 className="font-display mt-1 text-[2rem] leading-none font-extrabold">Overview</h1>
          <nav className="font-mono mt-2 flex gap-3 text-[0.72rem] text-faint" aria-label="Sections">
            <a href="#rag" className="lift hover:text-rag">
              ask
            </a>
            <a href="#agent" className="lift hover:text-agent">
              replay
            </a>
            <a href="#triage" className="lift hover:text-tickets">
              queue
            </a>
          </nav>
        </div>
        <StatusStrip statuses={statuses} bases={bases} />
      </header>

      <main className="flex flex-col gap-4">
        <div className="grid items-start gap-4 xl:grid-cols-3">
          <div id="rag" className="min-w-0 scroll-mt-4">
            <RagCard bases={bases} onSource={handleSource} />
          </div>
          <div id="agent" className="min-w-0 scroll-mt-4">
            <AgentCard bases={bases} onSource={handleSource} />
          </div>
          <div id="triage" className="min-w-0 scroll-mt-4">
            <TriageCard bases={bases} onSource={handleSource} />
          </div>
        </div>
        <ChurnCard />
      </main>

      <footer className="font-mono text-[0.7rem] leading-relaxed text-faint">
        Fixtures are recorded beam-free backend outputs — every number on this page comes from them
        unless a LIVE badge says otherwise. Build with NEXT_PUBLIC_API_RAG / NEXT_PUBLIC_API_AGENT /
        NEXT_PUBLIC_API_TICKETS to point at real backends.
      </footer>
    </div>
  );
}
