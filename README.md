# ShiftMind

AI-powered workforce scheduling for senior care facilities.

## Quick Start

1. Clone and install: `npm install`
2. Add your Anthropic API key: `cp .env.example .env` and edit
3. Setup database: `npm run setup`
4. Run: `npm run dev`

Open http://localhost:5173 and click "Enter as Demo User".

## Features

- Weekly calendar with shift-based scheduling (morning, afternoon, night)
- AI assistant (Aria) for natural language schedule management
- Auto-fill with weighted scoring algorithm (fairness 50%, full-time 30%, seniority 20%)
- Gap detection and smart replacement
- Worker availability management with weekly patterns and overrides
- Schedule templates for weekday, weekend, and holiday staffing

## Architecture Decisions

1. **SQLite** — Zero-config, file-based database for demo simplicity. WAL mode enabled for read concurrency.
2. **Drizzle ORM** — Type-safe SQL with zero runtime overhead. Schema-first with inferred types.
3. **Aria tool_use** — Claude's native tool calling for structured scheduling operations. 8 tools covering queries and mutations.
4. **Auto-fill scoring** — Weighted algorithm balancing fairness (even distribution), full-time preference, and seniority.
5. **No real auth** — Demo-only access via localStorage flag. Login page shows graceful "not available yet" message.
6. **Tailwind CSS v4** — Theme-in-CSS via @theme directives. No config file needed.
7. **Monorepo** — npm workspaces with `concurrently` for parallel dev servers.

## Aria's Tools

| Tool | Description |
|------|-------------|
| `get_schedule` | View assignments for a date range |
| `get_workers_on_shift` | See who's working a specific shift |
| `get_available_workers` | Find eligible workers for a slot |
| `auto_fill_schedule` | Fill all open slots using scoring algorithm |
| `remove_worker_from_shift` | Remove a worker from a shift |
| `fill_gap` | Find best replacement for a single gap |
| `get_gaps` | Show unfilled slots vs. template requirements |
| `adjust_template_requirement` | Change staffing requirements |

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS v4, React Router, Lucide icons
- **Backend:** Express, TypeScript, better-sqlite3, Drizzle ORM
- **AI:** Anthropic SDK (Claude Sonnet) with tool_use
- **Fonts:** DM Sans (headings), IBM Plex Sans (body/data)
