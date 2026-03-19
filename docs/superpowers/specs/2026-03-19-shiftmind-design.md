# ShiftMind — Design Specification

AI-powered workforce scheduling application for Sunrise Senior Living.

---

## 1. Architecture Overview

### Approach

Aria (AI assistant) and the frontend are both consumers of the same service layer. No business logic duplication.

```
Browser → React → REST API ← Aria (via tool_use)
                      ↓
                   SQLite (better-sqlite3 + Drizzle ORM)
```

### Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Express + TypeScript
- **Database:** SQLite via better-sqlite3 with Drizzle ORM
- **AI:** Anthropic SDK (claude-sonnet-4-6) for Aria chat
- **Monorepo:** `/client` and `/server` under single root
- **Dev command:** `npm run dev` (concurrently runs both)
- **Setup command:** `npm run setup` (migrate + seed, idempotent)

### Project Structure

```
shift-mind/
├── package.json              # Root — concurrently runs client + server
├── .env.example              # ANTHROPIC_API_KEY placeholder
├── client/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── public/
│   │   ├── logo-white.svg    # White logo for dark backgrounds
│   │   ├── logo-dark.svg     # Dark green logo for light backgrounds
│   │   └── aria-avatar.png   # Optional custom Aria avatar image
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/              # Typed fetch wrappers
│   │   ├── components/       # Shared UI (Badge, Tooltip, EmptySlot, etc.)
│   │   ├── features/
│   │   │   ├── auth/         # LoginPage, RegisterPage
│   │   │   ├── calendar/     # WeekGrid, ShiftRow, DayCell, WorkerChip
│   │   │   ├── chat/         # AriaPanel, MessageBubble, TypingIndicator
│   │   │   ├── workers/      # WorkersPage, WorkerRow
│   │   │   ├── templates/    # TemplatesPage, TemplateDetail
│   │   │   └── sidebar/      # Sidebar, NavItem, AppLogo
│   │   ├── hooks/            # useWeek, useChat, useSchedule, useSession
│   │   ├── types/            # Shared TS types
│   │   └── styles/           # Global CSS, font imports, palette tokens
│   └── tailwind.config.ts
├── server/
│   ├── package.json
│   ├── src/
│   │   ├── index.ts          # Express app bootstrap
│   │   ├── db/
│   │   │   ├── schema.ts     # Drizzle table definitions
│   │   │   ├── migrate.ts    # Migration runner
│   │   │   └── seed.ts       # 50+ workers, templates, 2 weeks of assignments
│   │   ├── services/         # Business logic (scheduling, autofill, scoring)
│   │   ├── routes/           # Express route handlers
│   │   └── aria/
│   │       ├── tools.ts      # Tool definitions for Claude
│   │       ├── system-prompt.ts
│   │       └── handler.ts    # Chat endpoint, manages conversation + tool execution
│   └── drizzle.config.ts
└── README.md
```

---

## 2. Database Schema

### workers

| Column | Type | Notes |
|--------|------|-------|
| id | integer PK | auto-increment |
| name | text | full name |
| role | text | RN, CNA, MED_TECH, ACTIVITIES, KITCHEN, HOUSEKEEPING, SECURITY, SUPERVISOR |
| avatar_seed | text | random string for consistent UI avatars |
| is_active | integer | boolean, default 1 |
| is_part_time | integer | boolean, default 0 |
| hire_date | text | ISO date |
| phone | text | |
| notes | text | nullable |

### availability

Weekly recurring pattern.

| Column | Type | Notes |
|--------|------|-------|
| id | integer PK | |
| worker_id | integer FK | → workers |
| day_of_week | integer | 0=Sun, 6=Sat |
| is_available | integer | default 1 |

### availability_overrides

Specific date overrides (vacation, sick days).

| Column | Type | Notes |
|--------|------|-------|
| id | integer PK | |
| worker_id | integer FK | → workers |
| date | text | ISO date |
| is_available | integer | 0=unavailable |
| reason | text | nullable (vacation, sick, etc.) |

### schedule_templates

| Column | Type | Notes |
|--------|------|-------|
| id | integer PK | |
| name | text | e.g. "Standard Weekday" |
| day_type | text | weekday / weekend / holiday |

### template_slots

| Column | Type | Notes |
|--------|------|-------|
| id | integer PK | |
| template_id | integer FK | → schedule_templates |
| role | text | matches worker role enum |
| shift | text | morning / afternoon / night |
| required_count | integer | |

### assignments

| Column | Type | Notes |
|--------|------|-------|
| id | integer PK | |
| worker_id | integer FK | → workers |
| date | text | ISO date |
| shift | text | morning / afternoon / night |
| role | text | |
| created_at | text | ISO timestamp |

Unique constraint: `(worker_id, date, shift)` — prevents double-booking at the database level.

---

## 3. Seed Data

53 workers with realistic names distributed as:

- 8 RNs (some part-time)
- 14 CNAs
- 6 Med Techs
- 4 Activities Coordinators
- 8 Kitchen Staff
- 6 Housekeeping
- 4 Security
- 3 Supervisors

20% of workers have random days off during the current month via availability_overrides.

Pre-filled assignments for 2 weeks (last week + current week) using the weekday/weekend templates so the app opens with data on the calendar.

3 schedule templates seeded: Standard Weekday, Standard Weekend, Holiday.

---

## 4. Auto-Fill Algorithm — Weighted Scoring

When filling a slot (role + shift + date), eligible workers are scored:

```
score = (0.5 × fairness) + (0.3 × fulltime) + (0.2 × seniority)
```

- **fairness:** `1 - (shifts_this_week / max_shifts_this_week)` — fewer shifts = higher score. If no workers have shifts yet (start of week), all get fairness = 1.0
- **fulltime:** 1.0 if full-time, 0.3 if part-time
- **seniority:** normalized by hire date — longest tenure = 1.0, newest = 0.0

A worker is **eligible** if:
1. Active (`is_active = 1`)
2. Qualified for the role
3. Available that day (weekly pattern + no blocking override)
4. Not already assigned to that shift+date (no double-booking)

Highest-scoring eligible worker is assigned. If no eligible worker exists, the slot is flagged as a gap.

---

## 5. REST API

### Error Response Format

All error responses use: `{ error: string }` with appropriate HTTP status codes (400 bad request, 404 not found, 409 conflict for double-booking, 500 internal).

### Workers

Register `/available` before `/:id` to avoid Express route conflict.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/workers` | List all active workers. Query: `?role=CNA` |
| GET | `/api/workers/available` | Query: `?date=...&shift=...&role=...` — **register before /:id** |
| GET | `/api/workers/:id` | Single worker with availability |

### Schedule Templates

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/templates` | List all templates |
| GET | `/api/templates/:id` | Template with its slots |
| PATCH | `/api/templates/:id/slots` | `{role, shift, requiredCount}` — update a slot's required count |

### Assignments

Unique constraint on `(worker_id, date, shift)` enforced at database level.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/assignments` | Query: `?startDate=...&endDate=...` (required) |
| POST | `/api/assignments` | Create single assignment |
| DELETE | `/api/assignments/:id` | Remove assignment, returns gap info |

### Availability

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/workers/:id/availability` | Get worker's weekly pattern + overrides |
| POST | `/api/workers/:id/availability-overrides` | `{date, isAvailable, reason?}` — add override |
| DELETE | `/api/availability-overrides/:id` | Remove an override |

### Scheduling Actions

`templateId` is optional in all scheduling endpoints. When omitted, the system auto-selects the appropriate template per date based on `day_type` (weekday Mon-Fri → weekday template, Sat-Sun → weekend template).

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/schedule/auto-fill` | `{startDate, endDate, templateId?}` — fills all open slots |
| POST | `/api/schedule/fill-gap` | `{date, shift, role}` — finds best replacement for single gap |
| GET | `/api/schedule/gaps` | `?startDate=...&endDate=...` — returns unfilled slots (auto-selects templates per date) |

### Chat

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/chat` | See chat request/response format below |

Chat request: `{ message: string, conversationHistory: Array<{role: "user"|"assistant", content: string}> }`

Chat response: `{ reply: string, actions: Array<{type: string, summary: string}> }`

The `actions` array tells the frontend which data changed (e.g. `{type: "assignments_changed", summary: "Filled 3 slots"}`) so it knows to refetch calendar data.

### Session

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/session` | Returns `{ name: "Demo Manager", role: "manager" }` |

No authentication backend. Demo-only access via localStorage flag on the frontend.

### CORS / Proxy

In development, Vite proxies `/api` requests to the Express server on :3001 via `vite.config.ts`. No CORS configuration needed.

---

## 6. Aria — AI Chat Interface

### System Prompt

Aria is the AI scheduling assistant for Sunrise Senior Living. She is conversational, concise, and always confirms before making changes. When she can't fulfill a request (no available workers), she says so directly and suggests alternatives.

### Confirmation Flow

Mutations (auto-fill, remove worker, fill gap, adjust template) require a two-step flow:
1. Aria describes what she's about to do and asks for confirmation
2. User confirms → Aria executes and reports results
3. Frontend refreshes calendar data after any mutation

### Tool Definitions

```typescript
tools = [
  { name: "get_schedule",             input: { startDate, endDate } },
  { name: "get_workers_on_shift",     input: { date, shift } },
  { name: "get_available_workers",    input: { date, shift, role } },
  { name: "auto_fill_schedule",       input: { startDate, endDate, templateId? } },
  { name: "remove_worker_from_shift", input: { workerName, date, shift } },
  { name: "fill_gap",                 input: { date, shift, role } },
  { name: "get_gaps",                 input: { startDate, endDate } },
  { name: "adjust_template_requirement", input: { dayType, shift, role, requiredCount } }
]
```

Each tool calls the same service functions used by the REST API handlers.

**Note on `remove_worker_from_shift`:** Uses `workerName` because users type names in chat. The tool implementation first looks up the worker by name. If multiple matches exist, Aria asks for clarification before proceeding.

---

## 7. Frontend Design

### Brand Identity

ShiftMind has official logos — a circular arrow icon + wordmark in two variants:
- **White on dark** — `logo-white.svg` for sidebar, login page
- **Dark green on light** — `logo-dark.svg` for light contexts

Aria has a configurable avatar at `client/public/aria-avatar.png` with a gradient fallback circle.

### Color Palette — Forest & Warm Stone

| Token | Hex | Usage |
|-------|-----|-------|
| primary | #2D5A3D | CTA buttons, active states, primary accent |
| primary-light | #5B8A72 | Links, hover states, secondary accents |
| base | #F8F6F3 | Main content background |
| surface | #FFFFFF | Cards, calendar cells |
| sidebar | #1A1A1A | Sidebar background |
| text-primary | #1A1A1A | Headings, primary text |
| text-secondary | #888888 | Supporting text |
| border | #E0DCD5 | Dividers, card borders |
| border-light | #F0EDE6 | Subtle row separators |
| today-bg | #F0EDE6 | Today column highlight |
| gap-border | #D4A07A | Unfilled slot dashed border |
| gap-bg | #FFF8F0 | Unfilled slot background |
| gap-text | #B8860B | Unfilled slot warning text |

### Role Badge Colors

| DB Enum | Display Name | Hex | Badge Abbrev |
|---------|-------------|-----|--------------|
| RN | Registered Nurse | #2D5A3D | RN |
| CNA | Nursing Assistant | #8B6E4E | CNA |
| MED_TECH | Med Tech | #4A6FA5 | Med |
| ACTIVITIES | Activities Coord. | #7A6298 | Act |
| KITCHEN | Kitchen Staff | #C17C4E | Kitchen |
| HOUSEKEEPING | Housekeeping | #5B8A72 | Hsk |
| SECURITY | Security | #6B7280 | Sec |
| SUPERVISOR | Supervisor | #BE4B4B | Sup |

### Typography

- **Headings:** DM Sans — personality, geometric, modern
- **Body / Data:** IBM Plex Sans — legible, neutral, designed for data
- Load from Google Fonts

### Pages

#### Login Page
- Full-bleed dark canvas (#111110)
- Faint 7x3 schedule grid + ghostly role-colored chips in background
- Radial green glow behind centered glassmorphic card
- White ShiftMind logo top-left
- Form fields (email + password) + "Sign In" button
- "Sign In" click → form fades out, replaced by friendly inline message: "Almost there — credential login isn't available yet. Jump into the demo below."
- Sign In button goes disabled; Demo User button gets highlighted
- "Enter as Demo User" → sets `localStorage.setItem('shiftmind_session', 'demo')` → navigates to `/`
- "Create an account" link → navigates to register page

#### Register Page
- Same dark canvas aesthetic, centered glassmorphic card
- Lucide user-plus icon in green-tinted box
- "We're not quite ready yet" heading
- "Contact your facility administrator or try the demo" copy
- "Notify Me" email field (cosmetic)
- "Try the Demo Instead" button → same demo session flow
- "Back to Sign In" link

#### Schedule Page (Main View)
- Left sidebar (220px, dark): ShiftMind white logo, nav items (Schedule/Workers/Templates), active state = left border accent
- Top bar: week navigator (prev/today/next), date range display, "Ask Aria" toggle button
- Calendar grid: 7 day columns, 3 shift rows (Morning/Afternoon/Night)
- Day headers with date, today highlighted
- Worker chips: role-colored pills with "Role · Name" format
- Empty slots: dashed amber border, "Role · Unfilled" label, clickable → sends pre-formatted message to Aria
- Aria panel (320px right, toggleable): slide-in/out with transform transition

#### Workers Page
- Table with avatar initials, name, role badge, status, weekly availability dots (green=on, gray=off)
- Search + role filter in top bar
- Vacation/override status shown inline
- "View" button per row (detail view)

#### Templates Page
- Tab navigation: Weekday / Weekend / Holiday
- 3-column breakdown per template: Morning / Afternoon / Night
- Each column lists roles with required_count
- Totals at bottom of each column
- "Edit Template" button

### Component Tree

```
App
├── LoginPage / RegisterPage (when no session)
└── AppShell (when session exists)
    ├── Sidebar
    │   ├── AppLogo (white variant)
    │   ├── NavItem[] (Schedule, Workers, Templates)
    │   └── UserBadge ("Demo Manager")
    ├── TopBar
    │   ├── WeekNavigator
    │   └── AriaToggle
    ├── MainContent (route-based)
    │   ├── SchedulePage
    │   │   └── CalendarGrid
    │   │       ├── DayHeaders
    │   │       └── ShiftRow[]
    │   │           └── DayCell[]
    │   │               ├── WorkerChip[]
    │   │               └── EmptySlot
    │   ├── WorkersPage
    │   └── TemplatesPage
    └── AriaPanel
        ├── PanelHeader
        ├── MessageList
        │   ├── AriaMessage (avatar + bubble)
        │   ├── UserMessage (green bubble)
        │   └── TypingIndicator
        └── ChatInput
```

### State Management

React Context + useReducer. No Redux.

- **ScheduleContext** — current week's assignments, loading state, refetch trigger
- **ChatContext** — conversation history, panel open/closed state
- **WeekContext** — current week start date, navigation functions
- **SessionContext** — demo session flag, user display info

### Micro-interactions

- **Auto-fill shimmer:** CSS keyframe pulse on cells being filled before resolving
- **Aria typing:** 3 dots with staggered opacity animation
- **Panel slide:** `transform: translateX` + `transition: 300ms ease`
- **Worker chip hover:** Tooltip with full name, role, phone, shift time
- **Empty slot click:** Pre-formatted Aria message
- **Login "Sign In" click:** Form fields fade out, info message fades in (CSS transition)

---

## 8. Developer Experience

- `npm run dev` starts client (:5173) + server (:3001) via concurrently
- `npm run setup` runs migrations + seeds (idempotent)
- `.env.example` with `ANTHROPIC_API_KEY=your_key_here`
- README.md documents: setup (3 steps), architecture decisions, Aria tool_use explanation, auto-fill algorithm

### Architecture Decisions (for README)

1. **SQLite** — zero config, single file, perfect for demo; no external DB dependency
2. **Drizzle ORM** — type-safe, lightweight, great DX with SQLite
3. **Aria tool_use** — 8 tools registered mapping to service functions; Claude chains tools for complex operations
4. **Auto-fill scoring** — weighted fairness (50%) + full-time preference (30%) + seniority (20%)
5. **No real auth** — demo product; localStorage flag for session, no JWT overhead

---

## 9. Quality Bar

- Zero TypeScript errors on build
- API errors handled gracefully (Aria says "I ran into an issue" — never crashes)
- No console.log in production code
- Consistent code style throughout
- Lucide icons only — no emojis as UI elements
- WCAG contrast compliance on all text
