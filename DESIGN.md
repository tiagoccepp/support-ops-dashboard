# DESIGN.md — support-ops-dashboard

Ops-console dashboard unifying the 3 AI support backends (RAG docs, agent
trajectories, ticket triage) in Next.js + TypeScript + Tailwind. Same visual
language as the per-project demo UIs; zero-config via fixture fallback.

## Palette (OKLCH-able, dark ops console)

- `--ink: #0B0F14` (page bg, dominant)
- `--panel: #10161D` (cards)
- `--raised: #151D26` (hovers, wells)
- `--line: rgba(232,237,242,.09)` (borders)
- `--text: #E8EDF2`, `--muted: #93A1B0`, `--faint: #5D6B7A`
- Accents per service (ONE per surface): RAG amber `#E5A13D`, agent green
  `#34C77B`, tickets blue `#4CC3FF`, churn teal `#2DD4BF` (link card only).

## Type roles

- Display: Sora 800 (page titles, stat numerals), 700 (card titles).
- Body: Public Sans 400/600.
- Labels/data: JetBrains Mono 400/600 (badges, scores, timestamps, code).
- Scale: hero 2rem → section .78rem caps → body .95rem → mono .72rem.
- Line length ≤ 72ch in answer prose. Self-hosted woff2, `font-display: swap`.

## Layout

One-sentence concept: airport departures board for support ops — status strip
on top, three service rails below, evidence always one click away.

```
┌─ header: mark + title + LIVE/FIXTURE badges per service ─────┐
│ OVERVIEW                                    [tickets] [ask]… │
│ ┌ RAG card ────┐ ┌ Agent card ──┐ ┌ Triage card ─┐ ┌ Churn ─┐ │
│ │ ask box      │ │ trajectory   │ │ queue +      │ │ link   │ │
│ │ answer+cite  │ │ replay       │ │ approve/ovrd │ │ out    │ │
└──────────────────────────────────────────────────────────────┘
```

Unconventional section: the overview IS the product — every service works
inline on `/` (ask, replay, triage) instead of dead cards linking elsewhere.
Dedicated routes exist but add depth (history, full queue), not permission.

## Motion vocabulary (≤6)

- Skeleton shimmer on data load (≤600ms typical, local JSON).
- Staggered card entrance on first paint (CSS only, 3 steps).
- Trajectory replay: timed event reveal (340ms/step, honors recorded order).
- Gauge sweep on churn link card hover; color hovers ≥.5s.
- `prefers-reduced-motion`: instant reveals, no shimmer.

## Principles (what makes THIS page different)

1. Honest data badges: every panel shows LIVE (backend URL) or FIXTURE
   (recorded beam-free) — never a fake "live" glow.
2. Same evidence contract as the FastAPI UIs: citations, scores, abstention.
3. Zero-config deploy: `output: 'export'` → GitHub Pages; live backends are
   build-time env (`NEXT_PUBLIC_API_*`), absent = fixtures, no code change.
4. No global store: route-level fetch + props; fixtures are static JSON.

## Ban-list self-check

- Fonts: Sora/PublicSans/JetBrainsMono (rotation vs prior demos documented;
  shared ops-console family is intentional — same product suite, not median).
- No indigo, no gradients-as-decoration, no SaaS-card kit (varied radii,
  flat surfaces, hairline borders).
- Copy: real fixture content only; no invented metrics anywhere.
