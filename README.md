# ShiftMind

AI-powered workforce scheduling for senior care facilities. Built for **Sunrise Senior Living** as a production-ready demo featuring intelligent shift management, gap detection, and a conversational AI assistant.

## Screenshots

The app features a weekly calendar view with shift-based scheduling, a worker management panel with availability filtering, and an AI chat assistant (Aria) that can manage the schedule through natural language.

## Quick Start

**Prerequisites:** Node.js 18+, npm 9+

```bash
# 1. Clone and install dependencies
git clone <repo-url> && cd shift-mind
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and add your Anthropic API key

# 3. Initialize database (creates SQLite DB, runs migrations, seeds demo data)
npm run setup

# 4. Start development servers (frontend + backend)
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

Click **"Enter as Demo User"** on the login page to access the app.

## Project Structure

```
shift-mind/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── api/             # API client functions
│       ├── components/      # Shared UI (Toast, MarkdownText, RoleBadge, etc.)
│       ├── contexts/        # React contexts (Schedule, Chat)
│       ├── features/        # Feature modules
│       │   ├── auth/        # Login & registration pages
│       │   ├── calendar/    # Weekly schedule grid
│       │   ├── chat/        # Aria AI assistant panel
│       │   ├── sidebar/     # Navigation sidebar
│       │   ├── templates/   # Staffing template editor
│       │   └── workers/     # Worker management (CRUD, filtering)
│       ├── hooks/           # Custom hooks (useSchedule, useChat, useWeek)
│       ├── lib/             # Utilities (roles config, date helpers)
│       ├── styles/          # Global CSS with Tailwind v4 theme
│       └── types/           # TypeScript type definitions
├── server/                  # Express backend
│   └── src/
│       ├── aria/            # AI chat handler with tool_use
│       ├── db/              # Database schema, migrations, seed data
│       ├── routes/          # REST API routes
│       └── services/        # Business logic layer
├── .env.example             # Environment template
└── package.json             # Monorepo root (npm workspaces)
```

## Features

### Schedule Management
- **Weekly calendar** with morning, afternoon, and night shifts
- **Auto-fill algorithm** using weighted scoring: fairness (50%), full-time preference (30%), seniority (20%)
- **Gap detection** highlighting unfilled slots vs. template requirements
- **Click-to-chat** — click any empty slot to ask Aria to fill it

### Worker Management
- **Full CRUD** — add, edit, and manage worker profiles
- **Role-based filtering** across 8 roles (RN, CNA, Med Tech, Activities, Kitchen, Housekeeping, Security, Supervisor)
- **Multi-select availability filter** — find workers available on specific days (AND logic: e.g., available on Mon AND Thu AND Sat)
- **Weekly availability patterns** with per-date overrides (vacation, sick leave, etc.)

### AI Assistant (Aria)
Aria is a conversational AI powered by Claude that manages the schedule through natural language. Uses Claude's `tool_use` capability with 10 specialized tools:

| Tool | Description |
|------|-------------|
| `get_schedule` | View assignments for a date range |
| `get_workers_on_shift` | See who's working a specific shift |
| `get_available_workers` | Find eligible workers for a slot |
| `get_gaps` | Show unfilled slots vs. template requirements |
| `auto_fill_schedule` | Fill all open slots using scoring algorithm |
| `fill_gap` | Find best replacement for a single gap (supports exclusions) |
| `assign_worker_to_shift` | Assign a specific worker to a shift by name |
| `remove_worker_from_shift` | Remove a worker from a shift |
| `clear_schedule` | Bulk-clear all assignments in a date range |
| `adjust_template_requirement` | Change staffing requirements |

Example prompts:
- *"Show me who's working Monday morning"*
- *"Fill all gaps for next week"*
- *"Remove Sarah from Tuesday night shift and find a replacement"*
- *"Clear the schedule for March 23-29 and auto-fill it"*
- *"Assign John to the morning RN shift on Wednesday"*
- *"We need 3 CNAs on weekends instead of 2"*

### Schedule Templates
- Define staffing requirements per day type: **Weekday**, **Weekend**, **Holiday**
- Editable required staff count per role per shift (with +/- controls)
- Templates drive gap detection and auto-fill

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS v4 |
| **Routing** | React Router v7 |
| **Icons** | Lucide React |
| **Backend** | Express 5, TypeScript |
| **Database** | SQLite (better-sqlite3) with WAL mode |
| **ORM** | Drizzle ORM (schema-first, type-safe) |
| **AI** | Anthropic SDK (Claude Sonnet) with tool_use |
| **Fonts** | DM Sans (headings), IBM Plex Sans (body) |
| **Monorepo** | npm workspaces + concurrently |

## Design System

- **Color palette:** Forest & Warm Stone — primary `#2D5A3D`, base `#F8F6F3`, sidebar `#1A1A1A`
- **Typography:** DM Sans for headings, IBM Plex Sans for body text and data
- **Icons:** Lucide icon set (no emojis)
- **Theme:** Defined via Tailwind CSS v4 `@theme` directives in CSS (no `tailwind.config.ts`)

## Architecture Decisions

1. **SQLite** — Zero-config, file-based database. WAL mode for read concurrency. Perfect for single-server demo.
2. **Drizzle ORM** — Type-safe SQL with zero runtime overhead. Schema-first with inferred TypeScript types.
3. **Aria tool_use** — Claude's native tool calling for structured scheduling operations. Up to 10 tool iterations per message with mutation tracking and honest failure reporting.
4. **Auto-fill scoring** — Weighted algorithm balancing fairness (even workload distribution), full-time preference, and seniority across workers.
5. **No real auth** — Demo-only access via localStorage session flag. Login page with graceful messaging.
6. **Tailwind CSS v4** — Theme-in-CSS via `@theme` directives. All design tokens defined in `globals.css`.
7. **Monorepo with npm workspaces** — Shared scripts, single `npm install`, parallel dev servers via `concurrently`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies (client + server) |
| `npm run setup` | Run database migrations and seed demo data |
| `npm run dev` | Start both frontend and backend dev servers |
| `npm run build` | Build both client and server for production |

## Demo Data

The seed script creates a realistic dataset so the app is immediately usable:
- **53 workers** across 8 roles with diverse names and varied hire dates (2020-2025)
- **3 schedule templates** (weekday, weekend, holiday) with realistic staffing requirements
- **2 weeks of assignments** (March 9-22, 2026) with round-robin distribution
- **20 availability overrides** — vacations, sick leave, personal days scattered through March

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key for Aria AI assistant |
