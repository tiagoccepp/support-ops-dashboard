/** Data layer: live backends when configured, recorded fixtures otherwise.
 *
 * Static export (`output: 'export'`) has no API routes, so all data loads
 * client-side: first try the build-time live base (NEXT_PUBLIC_API_*),
 * then fall back to /data/<service>/<file>.json shipped in public/.
 */

export type Service = "rag" | "agent" | "tickets";

export interface Passage {
  chunk_id: string;
  text: string;
  source: string;
  section: string;
  score: number;
}

export interface RagAnswer {
  answer: string;
  citations: number[];
  abstained: boolean;
  model: string;
  passages: Passage[];
}

export type AgentEvent =
  | { type: "agent_start"; agent: string }
  | { type: "handoff"; from: string; to: string; reason?: string }
  | { type: "tool_call"; name: string; arguments?: unknown }
  | { type: "tool_result"; name: string; result?: unknown }
  | { type: "final"; result: AgentFinal }
  | { type: "error"; error: string };

export interface AgentFinal {
  final_answer: string;
  escalated: boolean;
  agents_path: string[];
  tools_called: string[];
  ticket_id?: number;
  iterations?: number;
}

export interface Ticket {
  id: string;
  title: string;
  body: string;
  customer_id: string;
  label: string;
  confidence: number;
  runner_up: string;
  status: string;
  duplicate_of: string;
  created_at: string;
  updated_at: string;
}

export interface TriageMetrics {
  counts: Record<string, number>;
  total: number;
  review_rate: number;
}

export interface LiveBases {
  rag?: string;
  agent?: string;
  tickets?: string;
}

export function liveBasesFromEnv(env: Record<string, string | undefined>): LiveBases {
  const out: LiveBases = {};
  const pick = (key: string, prop: keyof LiveBases): void => {
    const v = env[key];
    if (v && v.trim()) out[prop] = v.trim().replace(/\/$/, "");
  };
  pick("NEXT_PUBLIC_API_RAG", "rag");
  pick("NEXT_PUBLIC_API_AGENT", "agent");
  pick("NEXT_PUBLIC_API_TICKETS", "tickets");
  return out;
}

/** Which backend actually served the data shown in a panel. */
export type SourceState = "loading" | "live" | "fixture" | "error";

/** Resolve fetch targets in order: live base first, fixture second.
 *
 * `fixtureBase` defaults to `/data` (absolute). Pass `"data"` (relative)
 * from client components so fixture fetches stay correct under any
 * `basePath` (e.g. GitHub Pages project sites) with zero config.
 */
export function targetsFor(
  bases: LiveBases,
  service: Service,
  livePath: string,
  fixtureFile: string,
  fixtureBase = "/data",
): string[] {
  const out: string[] = [];
  const base = bases[service];
  if (base) out.push(`${base}${livePath}`);
  out.push(`${fixtureBase}/${service}/${fixtureFile}`);
  return out;
}

/** Classify a served URL as live or fixture for honest badges. */
export function sourceOf(url: string, bases: LiveBases, service: Service): "live" | "fixture" {
  const base = bases[service];
  if (base && url.startsWith(base)) return "live";
  return "fixture";
}

export async function fetchFirst<T>(urls: string[], init?: RequestInit): Promise<{ url: string; data: T }> {
  let lastError: unknown = new Error("no urls");
  for (const url of urls) {
    try {
      const res = await fetch(url, init);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { url, data: (await res.json()) as T };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

/** Sample prompts mirroring the recorded fixtures (same questions, same order). */
export const RAG_SAMPLES: { label: string; hint: string; question: string; fixture: string }[] = [
  { label: "Pricing", hint: "Team plan cost per user", question: "How much does the Team plan cost per user?", fixture: "q_pricing.json" },
  { label: "Travel policy", hint: "Hotel cap per night", question: "What is the hotel cap per night?", fixture: "q_hotel.json" },
  { label: "On-call", hint: "Pager duty and swaps", question: "Who is on-call and how do swaps work?", fixture: "q_oncall.json" },
  { label: "Unanswerable", hint: "Ask the impossible", question: "Zqxw kvetch blorpt flarnib?", fixture: "q_absurd.json" },
];

export const AGENT_SAMPLES: { label: string; hint: string; message: string; fixture: string }[] = [
  { label: "Password reset", hint: "KB + ticket flow", message: "I forgot my password, how do I reset it? alice@example.com", fixture: "m_password.json" },
  { label: "Stock check", hint: "inventory lookup", message: "Do you have ACME-1001 in stock? Need 3 units.", fixture: "m_stock.json" },
  { label: "Onboarding", hint: "new customer setup", message: "Hi I am Dave, just signed up, how do I get started? dave@newco.com", fixture: "m_onboard.json" },
  { label: "Angry customer", hint: "watch it escalate", message: "Your product broke everything, I am going to sue you.", fixture: "m_angry.json" },
];

export function shortSource(source: string): string {
  const parts = source.split("/");
  return parts[parts.length - 1] ?? source;
}

export function confidencePct(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}
