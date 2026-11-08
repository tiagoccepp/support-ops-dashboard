# Support Ops Dashboard — One Console for RAG, Agents & Triage

> Airport-departures board for support ops: RAG answers, agent trajectory replay, and ticket triage — all inline on one page, with honest LIVE/FIXTURE badges.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tests](https://img.shields.io/badge/tests-14_Vitest-brightgreen)

**🔴 LIVE DEMO:** https://tiagoccepp.github.io/support-ops-dashboard/ — works with zero config (recorded fixtures ship in `public/data/`).

## What it does

Unifies three AI support backends on a single overview page — every service works inline instead of linking elsewhere:

| Panel | What you can do |
|---|---|
| **RAG card** | Ask questions, read answers with citations + abstention handling |
| **Agent card** | Replay recorded agent trajectories step by step (handoffs, tool calls, finals) |
| **Triage card** | Browse the ticket queue with labels, confidence scores, approve/override |
| **Status strip** | LIVE vs FIXTURE badge per service — never a fake "live" glow |
| **Churn card** | Links out to the companion churn-prediction demo |

Data layer (`lib/data.ts`): tries build-time live backends first (`NEXT_PUBLIC_API_RAG` / `NEXT_PUBLIC_API_AGENT` / `NEXT_PUBLIC_API_TICKETS`), falls back to recorded JSON fixtures under `public/data/<service>/`. Absent env = fixtures, no code change. Static export (`output: 'export'`) deploys straight to GitHub Pages.

## Quickstart

```bash
pnpm install
pnpm dev        # http://localhost:3000 — fixture mode, zero config
pnpm test       # 14 tests: data layer, markdown, SSE parsing
```

Point at real backends: set `NEXT_PUBLIC_API_RAG`, `NEXT_PUBLIC_API_AGENT`, `NEXT_PUBLIC_API_TICKETS` at build time.

## Stack

Next.js 16 (static export) · React 19 · TypeScript · Tailwind 4 · Vitest · self-hosted fonts (Sora / Public Sans / JetBrains Mono) · dark ops-console palette, `prefers-reduced-motion` respected.

## Repo map

```
app/page.tsx        overview: status strip + 3 service rails + churn card
components/         RagCard, AgentCard, TriageCard, StatusStrip, ChurnCard, ui
lib/data.ts         live-first / fixture-fallback fetch + source badges
lib/md.ts, sse.ts   markdown + SSE parsing helpers
public/data/        recorded fixtures: rag (6) + agent (5) + tickets (6)
DESIGN.md           palette, type roles, layout, motion vocabulary
```

## License

MIT — portfolio demo by Tiago Colo. (LICENSE file to be added.)
