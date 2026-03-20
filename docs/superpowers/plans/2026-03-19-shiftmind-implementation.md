# ShiftMind Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-quality AI-powered workforce scheduling application with a weekly calendar, auto-fill algorithm, and AI chat assistant (Aria).

**Architecture:** Monorepo with Express+TypeScript backend serving REST API over SQLite/Drizzle, React+TypeScript+Vite+Tailwind frontend. Aria uses Claude tool_use calling the same service layer as the REST API. Demo-only auth via localStorage.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, Express, better-sqlite3, Drizzle ORM, Anthropic SDK, Lucide React, concurrently

**Spec:** `docs/superpowers/specs/2026-03-19-shiftmind-design.md`

---

## File Map

### Root
- `package.json` — workspace scripts (dev, setup)
- `.env.example` — ANTHROPIC_API_KEY placeholder
- `.gitignore` — node_modules, dist, .env, *.db, .superpowers
- `README.md` — setup, architecture decisions

### Server (`server/`)
- `package.json` — express, better-sqlite3, drizzle-orm, @anthropic-ai/sdk, etc.
- `tsconfig.json`
- `drizzle.config.ts` — drizzle-kit config
- `src/index.ts` — Express bootstrap, route registration
- `src/db/connection.ts` — SQLite connection singleton
- `src/db/schema.ts` — all Drizzle table definitions
- `src/db/migrate.ts` — migration runner
- `src/db/seed.ts` — 53 workers, templates, 2 weeks assignments
- `src/services/workers.ts` — worker queries, availability checks
- `src/services/templates.ts` — template queries, slot updates
- `src/services/assignments.ts` — CRUD, gap detection
- `src/services/autofill.ts` — weighted scoring, auto-fill, fill-gap
- `src/routes/workers.ts` — worker endpoints
- `src/routes/templates.ts` — template endpoints
- `src/routes/assignments.ts` — assignment endpoints
- `src/routes/schedule.ts` — auto-fill, fill-gap, gaps endpoints
- `src/routes/chat.ts` — chat endpoint (delegates to aria handler)
- `src/routes/session.ts` — session endpoint
- `src/aria/system-prompt.ts` — Aria system prompt
- `src/aria/tools.ts` — tool definitions array
- `src/aria/handler.ts` — Anthropic SDK chat handler, tool execution loop
- `src/types.ts` — shared server types

### Client (`client/`)
- `package.json` — react, react-router-dom, lucide-react, tailwindcss, etc.
- `tsconfig.json`
- `vite.config.ts` — proxy /api to :3001 + tailwind plugin
- `index.html` — Google Fonts link, root div
- `src/main.tsx` — React root render
- `src/App.tsx` — Router, session check, context providers
- `src/types/index.ts` — shared frontend types (Worker, Assignment, Shift, Role, etc.)
- `src/api/client.ts` — typed fetch wrapper with error handling
- `src/api/workers.ts` — worker API calls
- `src/api/assignments.ts` — assignment API calls
- `src/api/templates.ts` — template API calls
- `src/api/schedule.ts` — auto-fill, fill-gap, gaps calls
- `src/api/chat.ts` — chat API call
- `src/contexts/ScheduleContext.tsx` — schedule state + refetch, wraps useSchedule hook
- `src/contexts/ChatContext.tsx` — conversation state + panel visibility, accepts scheduleRefetch callback
- `src/hooks/useSession.ts` — localStorage session management (no server call — demo only)
- `src/hooks/useWeek.ts` — week navigation state
- `src/hooks/useSchedule.ts` — fetch assignments for current week
- `src/hooks/useChat.ts` — conversation state, send message
- `src/styles/globals.css` — Tailwind directives, font imports, custom classes
- `src/lib/roles.ts` — role config map (enum → display, color, abbrev)
- `src/lib/dates.ts` — date formatting helpers
- `src/components/RoleBadge.tsx` — role-colored pill
- `src/components/Tooltip.tsx` — hover tooltip
- `src/features/auth/LoginPage.tsx` — dark canvas login
- `src/features/auth/RegisterPage.tsx` — coming soon page
- `src/features/sidebar/Sidebar.tsx` — sidebar with nav
- `src/features/sidebar/NavItem.tsx` — nav link with active state
- `src/features/calendar/SchedulePage.tsx` — page wrapper, topbar
- `src/features/calendar/WeekNavigator.tsx` — prev/today/next
- `src/features/calendar/CalendarGrid.tsx` — 7x3 grid
- `src/features/calendar/ShiftRow.tsx` — single shift row
- `src/features/calendar/DayCell.tsx` — cell with chips + empty slots
- `src/features/calendar/WorkerChip.tsx` — role-colored worker pill
- `src/features/calendar/EmptySlot.tsx` — dashed unfilled slot
- `src/features/chat/AriaPanel.tsx` — slide-in panel container
- `src/features/chat/MessageBubble.tsx` — aria/user message
- `src/features/chat/TypingIndicator.tsx` — 3-dot animation
- `src/features/chat/ChatInput.tsx` — input + send button
- `src/features/workers/WorkersPage.tsx` — workers table
- `src/features/workers/WorkerRow.tsx` — single worker row
- `src/features/templates/TemplatesPage.tsx` — template viewer
- `src/features/templates/TemplateDetail.tsx` — shift columns

---

## Task 1: Project Scaffolding & Monorepo Setup

**Files:**
- Create: `package.json`, `.env.example`, `.gitignore`
- Create: `server/package.json`, `server/tsconfig.json`
- Create: `client/package.json`, `client/tsconfig.json`, `client/vite.config.ts`, `client/index.html`

- [ ] **Step 1: Initialize root package.json**

```json
{
  "name": "shift-mind",
  "private": true,
  "scripts": {
    "dev": "concurrently -n server,client -c blue,green \"npm run dev -w server\" \"npm run dev -w client\"",
    "setup": "npm run migrate -w server && npm run seed -w server",
    "build": "npm run build -w client && npm run build -w server"
  },
  "workspaces": ["server", "client"],
  "devDependencies": {
    "concurrently": "^9.1.0"
  }
}
```

- [ ] **Step 2: Create .env.example**

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
dist/
.env
*.db
.superpowers/
```

- [ ] **Step 4: Initialize server package.json with dependencies**

```json
{
  "name": "shift-mind-server",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "migrate": "tsx src/db/migrate.ts",
    "seed": "tsx src/db/seed.ts"
  },
  "dependencies": {
    "express": "^4.21.0",
    "better-sqlite3": "^11.6.0",
    "drizzle-orm": "^0.36.0",
    "@anthropic-ai/sdk": "^0.39.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/better-sqlite3": "^7.6.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "drizzle-kit": "^0.28.0"
  }
}
```

Create `server/tsconfig.json` with `"module": "nodenext"`, `"outDir": "dist"`, strict mode.

- [ ] **Step 5: Create client package.json manually**

Do NOT use `npm create vite` inside a workspace — it causes install conflicts. Instead, manually create `client/package.json`:

```json
{
  "name": "shift-mind-client",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.0",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0"
  }
}
```

Create `client/tsconfig.json` and `client/tsconfig.app.json` for React+Vite with strict mode.

- [ ] **Step 6: Configure Vite proxy**

`client/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
```

- [ ] **Step 7: Set up Tailwind with custom theme**

`client/src/styles/globals.css`:
```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

@theme {
  --color-primary: #2D5A3D;
  --color-primary-light: #5B8A72;
  --color-base: #F8F6F3;
  --color-surface: #FFFFFF;
  --color-sidebar: #1A1A1A;
  --color-border: #E0DCD5;
  --color-border-light: #F0EDE6;
  --color-today: #F0EDE6;
  --color-gap-border: #D4A07A;
  --color-gap-bg: #FFF8F0;
  --color-gap-text: #B8860B;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #888888;

  --font-heading: 'DM Sans', sans-serif;
  --font-body: 'IBM Plex Sans', sans-serif;
}
```

- [ ] **Step 8: Set up index.html and create asset placeholders**

Create `client/index.html` with title "ShiftMind". Import globals.css from main.tsx.

Create SVG placeholder logos in `client/public/`:
- `logo-white.svg` — simple "ShiftMind" text in white (placeholder until user provides real logo)
- `logo-dark.svg` — same in dark green (#2D5A3D)

These will be replaced by the user's actual logo files. The components should reference these paths and render gracefully if the files are missing (use an `onError` fallback to text).

- [ ] **Step 9: Install all dependencies**

```bash
npm install
```

- [ ] **Step 10: Verify dev server starts**

```bash
npm run dev
```

Both client (:5173) and server (:3001) should start without errors. Server will crash on missing files — that's expected for now.

- [ ] **Step 11: Commit**

```bash
git add -A && git commit -m "feat: project scaffolding with monorepo, Vite, Express, Tailwind"
```

---

## Task 2: Database Schema & Migrations

**Files:**
- Create: `server/src/db/connection.ts`
- Create: `server/src/db/schema.ts`
- Create: `server/src/db/migrate.ts`
- Create: `server/drizzle.config.ts`
- Create: `server/src/types.ts`

- [ ] **Step 1: Create SQLite connection singleton**

`server/src/db/connection.ts` — creates/opens `shiftmind.db` in server root, exports `db` (drizzle instance) and raw `sqlite` connection.

- [ ] **Step 2: Define all tables in schema.ts**

`server/src/db/schema.ts` — define all 6 tables (workers, availability, availability_overrides, schedule_templates, template_slots, assignments) using Drizzle's `sqliteTable`. Include the unique constraint on assignments `(worker_id, date, shift)`.

Enums as TypeScript union types:
```typescript
export const ROLES = ['RN', 'CNA', 'MED_TECH', 'ACTIVITIES', 'KITCHEN', 'HOUSEKEEPING', 'SECURITY', 'SUPERVISOR'] as const;
export type Role = typeof ROLES[number];

export const SHIFTS = ['morning', 'afternoon', 'night'] as const;
export type Shift = typeof SHIFTS[number];

export const DAY_TYPES = ['weekday', 'weekend', 'holiday'] as const;
export type DayType = typeof DAY_TYPES[number];
```

- [ ] **Step 3: Create drizzle.config.ts**

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: { url: './shiftmind.db' }
});
```

- [ ] **Step 4: Create migrate.ts**

`server/src/db/migrate.ts` — uses direct SQL `CREATE TABLE IF NOT EXISTS` statements for each table. This is the simplest approach for SQLite in a demo app — no need for drizzle-kit generate/migrate workflow. Import the `sqlite` connection from `connection.ts` and execute each CREATE TABLE statement. This keeps migrations idempotent and avoids the drizzle-kit migration folder complexity.

- [ ] **Step 5: Create shared server types**

`server/src/types.ts` — re-export schema types, define service input/output types.

- [ ] **Step 6: Run migration**

```bash
npm run migrate -w server
```

Verify `shiftmind.db` is created with all tables.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: database schema with Drizzle ORM — 6 tables, migrations"
```

---

## Task 3: Seed Data

**Files:**
- Create: `server/src/db/seed.ts`

- [ ] **Step 1: Write seed script**

`server/src/db/seed.ts` — must be idempotent (check if data exists before inserting).

Create:
- 53 workers with realistic names across 8 roles (distribution from spec)
- Weekly availability for each worker (full-time = all 7 days, part-time = 3-4 days)
- Availability overrides: ~10 workers with vacation/sick days scattered through current month
- 3 schedule templates (Standard Weekday, Standard Weekend, Holiday) with realistic slot counts
- Template slots for each template with required_count per role per shift
- 2 weeks of assignments (last week + current week) generated via deterministic logic (iterate templates, assign eligible workers round-robin by role — the auto-fill service doesn't exist yet at this point)

Worker names should be diverse and realistic. Phone numbers formatted as (555) XXX-XXXX.

Template slot counts (from the mockup):
- **Weekday Morning:** 2 RN, 4 CNA, 1 Med, 1 Act, 2 Kitchen, 1 Hsk, 0 Sec, 1 Sup = 12
- **Weekday Afternoon:** 2 RN, 3 CNA, 1 Med, 1 Act, 2 Kitchen, 1 Hsk, 1 Sec, 0 Sup = 11
- **Weekday Night:** 1 RN, 2 CNA, 0 Med, 0 Act, 0 Kitchen, 0 Hsk, 1 Sec, 1 Sup = 5
- **Weekend:** slightly reduced (e.g., 1 RN morning, 2 CNA, etc.)
- **Holiday:** minimal skeleton crew

- [ ] **Step 2: Run seed**

```bash
npm run seed -w server
```

Verify with a quick SQLite query that data is populated.

- [ ] **Step 3: Run seed again to verify idempotency**

```bash
npm run seed -w server
```

Should not duplicate data.

- [ ] **Step 4: Verify npm run setup works end-to-end**

```bash
npm run setup
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: seed data — 53 workers, 3 templates, 2 weeks of assignments"
```

---

## Task 4: Backend Services — Workers & Templates

**Files:**
- Create: `server/src/services/workers.ts`
- Create: `server/src/services/templates.ts`

- [ ] **Step 1: Implement workers service**

`server/src/services/workers.ts`:
- `getAllWorkers(role?: Role)` — list active workers, optional role filter
- `getWorkerById(id: number)` — single worker with availability data
- `getAvailableWorkers(date: string, shift: Shift, role: Role)` — workers who are eligible for a specific slot
- `getWorkerByName(name: string)` — fuzzy name lookup for Aria
- `isWorkerAvailable(workerId: number, date: string)` — checks weekly pattern + overrides
- `getWorkerAvailability(workerId: number)` — returns weekly pattern + overrides
- `addAvailabilityOverride(workerId: number, date: string, isAvailable: boolean, reason?: string)`
- `removeAvailabilityOverride(overrideId: number)`

- [ ] **Step 2: Implement templates service**

`server/src/services/templates.ts`:
- `getAllTemplates()` — list all templates
- `getTemplateById(id: number)` — template with slots
- `getTemplateForDate(date: string)` — auto-select based on day of week (Mon-Fri → weekday, Sat-Sun → weekend)
- `updateTemplateSlot(templateId: number, role: Role, shift: Shift, requiredCount: number)`

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: worker and template service layers"
```

---

## Task 5: Backend Services — Assignments & Auto-Fill

**Files:**
- Create: `server/src/services/assignments.ts`
- Create: `server/src/services/autofill.ts`

- [ ] **Step 1: Implement assignments service**

`server/src/services/assignments.ts`:
- `getAssignments(startDate: string, endDate: string)` — all assignments in range with worker details
- `createAssignment(workerId: number, date: string, shift: Shift, role: Role)` — insert, handle unique constraint violation (409)
- `deleteAssignment(assignmentId: number)` — remove, return the gap info (date, shift, role)

- [ ] **Step 2: Write the auto-fill scoring function**

`server/src/services/autofill.ts` — this is the core algorithm:

```typescript
function scoreWorker(worker, shiftsThisWeek: number, maxShiftsThisWeek: number, oldestHireDate: string, newestHireDate: string): number {
  const fairness = maxShiftsThisWeek === 0 ? 1.0 : 1 - (shiftsThisWeek / maxShiftsThisWeek);
  const fulltime = worker.isPartTime ? 0.3 : 1.0;
  const seniorityRange = new Date(newestHireDate).getTime() - new Date(oldestHireDate).getTime();
  const seniority = seniorityRange === 0 ? 1.0 : 1 - ((new Date(worker.hireDate).getTime() - new Date(oldestHireDate).getTime()) / seniorityRange);
  return (0.5 * fairness) + (0.3 * fulltime) + (0.2 * seniority);
}
```

- [ ] **Step 3: Implement auto-fill and gap detection**

`server/src/services/autofill.ts`:
- `autoFillSchedule(startDate: string, endDate: string, templateId?: number)` — iterates each date in range, gets template for that date, finds gaps, fills them with highest-scoring workers. Returns `{ filled: number, gaps: number, details: Array<{date, shift, role, workerName?}> }`.
- `fillGap(date: string, shift: Shift, role: Role)` — finds best available worker for a single gap. Returns worker assigned or null.
- `getGaps(startDate: string, endDate: string)` — compares assignments against template requirements, returns unfilled slots.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: assignment service and auto-fill algorithm with weighted scoring"
```

---

## Task 6: Express Server & REST Routes

**Files:**
- Create: `server/src/index.ts`
- Create: `server/src/routes/workers.ts`
- Create: `server/src/routes/templates.ts`
- Create: `server/src/routes/assignments.ts`
- Create: `server/src/routes/schedule.ts`
- Create: `server/src/routes/session.ts`

- [ ] **Step 1: Create Express app bootstrap**

`server/src/index.ts`:
- Load dotenv
- Create Express app on port 3001
- JSON body parser
- Register all route modules under `/api`
- Error handling middleware (catches thrown errors, returns `{ error: string }`)
- In production, serve client's built static files from `../client/dist` via `express.static` — this avoids CORS issues when not using Vite dev server
- Start listening with startup message

- [ ] **Step 2: Implement worker routes**

`server/src/routes/workers.ts`:
- `GET /api/workers` — calls `getAllWorkers`, filters by query `?role=`
- `GET /api/workers/available` — calls `getAvailableWorkers` with query params — **registered before /:id**
- `GET /api/workers/:id` — calls `getWorkerById`
- `GET /api/workers/:id/availability` — calls `getWorkerAvailability`
- `POST /api/workers/:id/availability-overrides` — calls `addAvailabilityOverride`

**Note:** `DELETE /api/availability-overrides/:id` must be registered at the `/api` level in `index.ts`, NOT nested under the workers router (which is mounted at `/api/workers`). Register it as a separate route in the workers router file but export it separately, or register it directly in `index.ts`.

- [ ] **Step 3: Implement template routes**

`server/src/routes/templates.ts`:
- `GET /api/templates`
- `GET /api/templates/:id`
- `PATCH /api/templates/:id/slots`

- [ ] **Step 4: Implement assignment routes**

`server/src/routes/assignments.ts`:
- `GET /api/assignments` — requires `startDate` and `endDate` query params
- `POST /api/assignments`
- `DELETE /api/assignments/:id`

- [ ] **Step 5: Implement schedule routes**

`server/src/routes/schedule.ts`:
- `POST /api/schedule/auto-fill`
- `POST /api/schedule/fill-gap`
- `GET /api/schedule/gaps`

- [ ] **Step 6: Implement session route**

`server/src/routes/session.ts`:
- `GET /api/session` — returns `{ name: "Demo Manager", role: "manager" }`

- [ ] **Step 7: Verify all routes with curl**

Start server, test a few endpoints:
```bash
curl http://localhost:3001/api/workers | head
curl http://localhost:3001/api/assignments?startDate=2026-03-16&endDate=2026-03-22 | head
curl http://localhost:3001/api/session
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: REST API — all routes for workers, templates, assignments, schedule"
```

---

## Task 7: Aria Chat Handler & Tools

**Files:**
- Create: `server/src/aria/system-prompt.ts`
- Create: `server/src/aria/tools.ts`
- Create: `server/src/aria/handler.ts`
- Create: `server/src/routes/chat.ts`

- [ ] **Step 1: Write Aria system prompt**

`server/src/aria/system-prompt.ts` — export a string constant. Key points: Aria is the scheduling assistant for Sunrise Senior Living. She's conversational, concise, confirms before mutations. She formats data clearly. She suggests alternatives when blocked.

- [ ] **Step 2: Define tool schemas**

`server/src/aria/tools.ts` — export an array of Anthropic tool definitions with full JSON Schema `input_schema` for each of the 8 tools. Each tool has a clear description that helps Claude understand when to use it.

- [ ] **Step 3: Implement tool executor**

`server/src/aria/handler.ts`:
- `executeTool(name: string, input: any)` — switch on tool name, call the appropriate service function, return the result as a string
- `handleChat(message: string, conversationHistory: Array)` — main handler:
  1. Build messages array from history + new user message
  2. Call Anthropic API with system prompt + tools
  3. If response has `tool_use` blocks, execute each tool, collect results
  4. Feed tool results back as `tool_result` messages
  5. Loop until Claude returns a final text response (max 5 iterations to prevent infinite loops)
  6. Track which actions were performed (mutations) and return `actions` array
  7. Return `{ reply: string, actions: Array<{type, summary}> }`

- [ ] **Step 4: Create chat route**

`server/src/routes/chat.ts`:
- `POST /api/chat` — validates request body, calls `handleChat`, returns response
- Wraps in try/catch — on error returns `{ reply: "I ran into an issue processing your request. Please try again.", actions: [] }`

- [ ] **Step 5: Test Aria with curl**

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Who is working this Thursday morning?", "conversationHistory": []}'
```

Verify a meaningful response comes back.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: Aria AI chat — system prompt, 8 tools, Claude tool_use handler"
```

---

## Task 8: Frontend Foundation — Types, API Client, Hooks, Layout

**Files:**
- Create: `client/src/types/index.ts`
- Create: `client/src/api/client.ts`
- Create: `client/src/api/workers.ts`, `assignments.ts`, `templates.ts`, `schedule.ts`, `chat.ts`
- Create: `client/src/lib/roles.ts`, `client/src/lib/dates.ts`
- Create: `client/src/hooks/useSession.ts`, `useWeek.ts`, `useSchedule.ts`, `useChat.ts`
- Create: `client/src/App.tsx`

- [ ] **Step 1: Define frontend types**

`client/src/types/index.ts`:
```typescript
export type Role = 'RN' | 'CNA' | 'MED_TECH' | 'ACTIVITIES' | 'KITCHEN' | 'HOUSEKEEPING' | 'SECURITY' | 'SUPERVISOR';
export type Shift = 'morning' | 'afternoon' | 'night';
export type DayType = 'weekday' | 'weekend' | 'holiday';

export interface Worker { id: number; name: string; role: Role; avatarSeed: string; isActive: boolean; isPartTime: boolean; hireDate: string; phone: string; notes: string | null; }
export interface Assignment { id: number; workerId: number; workerName: string; date: string; shift: Shift; role: Role; }
export interface Template { id: number; name: string; dayType: DayType; slots: TemplateSlot[]; }
export interface TemplateSlot { id: number; role: Role; shift: Shift; requiredCount: number; }
export interface ChatMessage { role: 'user' | 'assistant'; content: string; }
export interface ChatResponse { reply: string; actions: Array<{type: string; summary: string}>; }
export interface Gap { date: string; shift: Shift; role: Role; required: number; assigned: number; }
```

- [ ] **Step 2: Create typed API client**

`client/src/api/client.ts` — generic `fetchApi<T>(url, options?)` wrapper that handles JSON parsing and error responses. Throws with error message from response body.

Create individual API modules (`workers.ts`, `assignments.ts`, `templates.ts`, `schedule.ts`, `chat.ts`) — each exports typed functions calling the API client.

- [ ] **Step 3: Create role config and date helpers**

`client/src/lib/roles.ts` — maps each `Role` to `{ display, color, abbrev }` per the spec's role badge table.

`client/src/lib/dates.ts` — helpers: `getWeekDates(startDate)`, `formatDateHeader(date)`, `isToday(date)`, `getMonday(date)`, `addWeeks(date, n)`.

- [ ] **Step 4: Create hooks**

- `useSession.ts` — reads/writes `localStorage.shiftmind_session`, returns `{ isLoggedIn, login(), logout() }`. Pure localStorage — no server call needed for demo.
- `useWeek.ts` — manages `weekStart` state (Monday of current week), `prevWeek()`, `nextWeek()`, `goToToday()`, `weekDates` (array of 7 date strings)
- `useSchedule.ts` — fetches **both assignments AND gaps** for the current week dates. Exposes `assignments`, `gaps`, `loading`, `refetch()`. Gaps are fetched via `GET /api/schedule/gaps` to compare against templates.
- `useChat.ts` — manages `messages` array, `isOpen` panel state, `isLoading` (waiting for Aria), `sendMessage(text)` that calls API and appends response. Accepts a `onAction` callback prop.

Create React Context wrappers:
- `src/contexts/ScheduleContext.tsx` — wraps `useSchedule` + `useWeek` into a context provider. Exposes all schedule state + week navigation to the entire app.
- `src/contexts/ChatContext.tsx` — wraps `useChat` into a context provider. On construction, receives `scheduleRefetch` from ScheduleContext so that when Aria performs mutations, the chat hook can trigger a calendar refresh.

Provider nesting in App.tsx (inside AppShell):
```tsx
<ScheduleProvider>
  <ChatProvider>
    <Sidebar />
    <MainContent />
    <AriaPanel />
  </ChatProvider>
</ScheduleProvider>
```

- [ ] **Step 5: Set up App.tsx with routing**

`client/src/App.tsx`:
- Check session — if not logged in, show LoginPage/RegisterPage routes
- If logged in, show AppShell with Sidebar + TopBar + MainContent (routes for Schedule, Workers, Templates) + AriaPanel
- Use React Router with `BrowserRouter`

- [ ] **Step 6: Update main.tsx**

Import globals.css, render App.

- [ ] **Step 7: Verify client builds without errors**

```bash
npm run build -w client
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: frontend foundation — types, API client, hooks, routing"
```

---

## Task 9: Login & Register Pages

**Files:**
- Create: `client/src/features/auth/LoginPage.tsx`
- Create: `client/src/features/auth/RegisterPage.tsx`

- [ ] **Step 1: Build LoginPage**

`client/src/features/auth/LoginPage.tsx`:
- Full-bleed dark background (`#111110`)
- Faint 7x3 grid overlay (CSS grid with low-opacity borders)
- Ghostly role-colored chips positioned absolutely in background
- Radial green glow (CSS radial-gradient, positioned behind card)
- Top bar: white ShiftMind logo (img from `/logo-white.svg`) + "Sunrise Senior Living" text
- Centered glassmorphic card (`bg-black/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl`)
- Form state: email + password inputs, Sign In button
- Error state: clicking Sign In → `showMessage` state flips, form fields fade out (CSS transition), inline green info box fades in with "Almost there" message, Sign In button disabled, Demo button highlighted
- "Enter as Demo User" button → calls `login()` from useSession, navigates to `/`
- "Create an account" link → navigates to `/register`
- Bottom right: "Powered by Aria AI" small text
- Use Lucide icons (LogIn for demo button)

- [ ] **Step 2: Build RegisterPage**

`client/src/features/auth/RegisterPage.tsx`:
- Same dark canvas + grid overlay
- Centered glassmorphic card (slightly wider)
- Lucide `UserPlus` icon in green-tinted box
- "We're not quite ready yet" heading
- Description text about contacting administrator
- "Notify Me" email input + button (cosmetic, no backend)
- "Try the Demo Instead" button → same demo login flow
- "Back to Sign In" link with Lucide `ArrowLeft` icon

- [ ] **Step 3: Verify login flow works**

Start dev, open browser, see login page. Click "Sign In" → message appears. Click "Enter as Demo User" → redirects to main app (blank for now). Refresh → stays logged in.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: login and register pages — dark glassmorphic design"
```

---

## Task 10: App Shell — Sidebar & TopBar

**Files:**
- Create: `client/src/features/sidebar/Sidebar.tsx`
- Create: `client/src/features/sidebar/NavItem.tsx`
- Create: `client/src/features/calendar/WeekNavigator.tsx`

- [ ] **Step 1: Build Sidebar**

`client/src/features/sidebar/Sidebar.tsx`:
- 220px fixed left, dark (#1A1A1A), full height
- Top: ShiftMind white logo (`/logo-white.svg`) + "Sunrise Senior Living" subtitle
- Nav items: Schedule (Calendar icon), Workers (Users icon), Templates (ClipboardList icon)
- Active state: left border accent (#2D5A3D), white text. Inactive: gray text, transparent border
- Bottom: UserBadge with initials circle + "Demo Manager" text + Logout icon

`client/src/features/sidebar/NavItem.tsx`:
- NavLink from react-router-dom
- Lucide icon + label
- Active class detection via `useLocation`

- [ ] **Step 2: Build TopBar and WeekNavigator**

The TopBar is **page-specific** — each page renders its own top bar content. SchedulePage has the WeekNavigator + Aria toggle. WorkersPage has search + filters. TemplatesPage has tab buttons. This avoids a complex shared TopBar component. WeekNavigator details:
- Prev button (ChevronLeft), date range text ("March 16 – 22, 2026"), Next button (ChevronRight)
- "Today" button (primary green) to snap back to current week
- "Ask Aria" button on the right (MessageCircle icon) — toggles chat panel

- [ ] **Step 3: Wire up AppShell layout**

In App.tsx, when logged in render:
```
<div className="flex h-screen">
  <Sidebar />
  <div className="flex-1 flex flex-col">
    <Routes>
      <Route path="/" element={<SchedulePage />} />
      <Route path="/workers" element={<WorkersPage />} />
      <Route path="/templates" element={<TemplatesPage />} />
    </Routes>
  </div>
  <AriaPanel /> {/* placeholder for now */}
</div>
```

- [ ] **Step 4: Verify navigation works**

Click between Schedule, Workers, Templates in sidebar. Active state highlights correctly. Week navigator shows current week dates.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: app shell — sidebar navigation, week navigator, layout"
```

---

## Task 11: Calendar Grid — The Hero View

**Files:**
- Create: `client/src/features/calendar/SchedulePage.tsx`
- Create: `client/src/features/calendar/CalendarGrid.tsx`
- Create: `client/src/features/calendar/ShiftRow.tsx`
- Create: `client/src/features/calendar/DayCell.tsx`
- Create: `client/src/features/calendar/WorkerChip.tsx`
- Create: `client/src/features/calendar/EmptySlot.tsx`
- Create: `client/src/components/RoleBadge.tsx`
- Create: `client/src/components/Tooltip.tsx`

- [ ] **Step 1: Build SchedulePage wrapper**

`SchedulePage.tsx`:
- TopBar area with WeekNavigator and Aria toggle
- CalendarGrid below, using `useSchedule` hook to fetch data
- Loading skeleton while data loads

- [ ] **Step 2: Build CalendarGrid**

`CalendarGrid.tsx`:
- Day headers row: 7 columns showing "MON 16", "TUE 17" etc. Today column highlighted with `bg-today` class
- 3 ShiftRow components (morning, afternoon, night)
- Grid layout: `grid-cols-[80px_repeat(7,1fr)]`

- [ ] **Step 3: Build ShiftRow and DayCell**

`ShiftRow.tsx`:
- Left label: shift name + time range + icon (Sun for morning, CloudSun for afternoon, Moon for night)
- 7 DayCell components, one per day

`DayCell.tsx`:
- Receives: date, shift, assignments for this cell, template gaps for this cell
- White rounded card with border
- Today cells get `bg-today` tint
- Renders WorkerChip for each assignment
- Renders EmptySlot for each unfilled template slot
- Flex wrap for chips

- [ ] **Step 4: Build WorkerChip**

`WorkerChip.tsx`:
- Role-colored pill (`bg-[role.color] text-white rounded px-2 py-0.5 text-xs`)
- Shows "Abbrev · LastName" (e.g. "RN · Johnson")
- Hover: shows Tooltip with full name, role, phone, shift time
- `cursor-pointer`

- [ ] **Step 5: Build EmptySlot**

`EmptySlot.tsx`:
- Dashed amber border (`border-dashed border-gap-border`)
- Light amber background (`bg-gap-bg`)
- Shows "Role · Unfilled" in amber text
- `cursor-pointer` — on click, opens Aria panel and sends pre-formatted message: "Can you fill the [role] gap on [date] [shift]?"

- [ ] **Step 6: Build Tooltip component**

`client/src/components/Tooltip.tsx`:
- Hover-triggered tooltip positioned above/below the trigger
- Shows content in a dark rounded box with arrow
- Uses `useState` for visibility + positioning

- [ ] **Step 7: Build RoleBadge component**

`client/src/components/RoleBadge.tsx`:
- Reusable role-colored pill used in workers page and calendar
- Takes `role` prop, looks up color from `roles.ts` config

- [ ] **Step 8: Verify calendar renders with real data**

Start dev, login, navigate to Schedule. Should see the weekly grid with pre-seeded assignments as colored chips. Empty slots visible with dashed borders.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: calendar grid — shift rows, worker chips, empty slots, tooltips"
```

---

## Task 12: Aria Chat Panel

**Files:**
- Create: `client/src/features/chat/AriaPanel.tsx`
- Create: `client/src/features/chat/MessageBubble.tsx`
- Create: `client/src/features/chat/TypingIndicator.tsx`
- Create: `client/src/features/chat/ChatInput.tsx`

- [ ] **Step 1: Build AriaPanel**

`AriaPanel.tsx`:
- 320px fixed right panel
- Slide in/out with `transform: translateX(100%)` / `translateX(0)` + transition 300ms
- Header: "Aria" title + green "Online" dot + close button (X icon)
- MessageList: scrollable area, auto-scrolls to bottom on new messages
- ChatInput at bottom
- Controlled by `useChat` hook's `isOpen` state

- [ ] **Step 2: Build MessageBubble**

`MessageBubble.tsx`:
- Aria messages: left-aligned, Aria avatar (from `/aria-avatar.png` with gradient fallback `bg-gradient-to-br from-primary to-primary-light`) + light gray bubble
- User messages: right-aligned, green bubble (`bg-primary text-white`)
- Rounded corners: `rounded-tl-sm` for Aria, `rounded-tr-sm` for user
- Text is `text-sm leading-relaxed`

- [ ] **Step 3: Build TypingIndicator**

`TypingIndicator.tsx`:
- 3 dots with staggered opacity animation
- CSS keyframes: each dot cycles opacity with a delay offset
- Only shown when `isLoading` is true in chat state

- [ ] **Step 4: Build ChatInput**

`ChatInput.tsx`:
- Text input + send button (ArrowUp icon in green circle)
- Submit on Enter key or button click
- Disabled while loading
- Calls `sendMessage` from `useChat` hook

- [ ] **Step 5: Wire up chat to schedule refetch**

In `useChat`, after receiving a response with `actions` containing `assignments_changed` or `template_changed`, trigger `refetch()` from `useSchedule`.

- [ ] **Step 6: Test full Aria flow**

Type "Who's working Thursday morning?" → Aria responds with worker list.
Type "Fill next week's schedule" → Aria describes what she'll do, confirms, then fills.
Calendar should update after Aria performs mutations.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: Aria chat panel — messages, typing indicator, schedule refetch"
```

---

## Task 13: Workers Page

**Files:**
- Create: `client/src/features/workers/WorkersPage.tsx`
- Create: `client/src/features/workers/WorkerRow.tsx`

- [ ] **Step 1: Build WorkersPage**

`WorkersPage.tsx`:
- Top bar: "Workers" title + count, search input, role filter dropdown
- Table container with rounded card styling
- Table header: Name, Role, Status, Availability, Actions
- Fetches workers from API, filters client-side by search/role
- Uses `useEffect` with debounced search

- [ ] **Step 2: Build WorkerRow**

`WorkerRow.tsx`:
- Avatar initials circle (bg-border-light, text-secondary)
- Name + "Hired [date] · [Full-time|Part-time]" subtitle
- RoleBadge component
- Status: green "Active" or amber "Vacation" (if override exists for today/this week)
- Availability dots: 7 small squares for M-T-W-T-F-S-S, green if available, gray if not
- "View" button (opens detail — for now just logs or shows alert)

- [ ] **Step 3: Verify workers page**

Navigate to Workers. See all 53 workers with correct role badges, availability dots, and statuses.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: workers page — searchable table with availability dots"
```

---

## Task 14: Templates Page

**Files:**
- Create: `client/src/features/templates/TemplatesPage.tsx`
- Create: `client/src/features/templates/TemplateDetail.tsx`

- [ ] **Step 1: Build TemplatesPage**

`TemplatesPage.tsx`:
- Top bar: "Schedule Templates" title + description
- Tab buttons: Weekday (active by default), Weekend, Holiday
- Fetches all templates from API
- Shows TemplateDetail for selected template

- [ ] **Step 2: Build TemplateDetail**

`TemplateDetail.tsx`:
- Template name + day type + total staff count
- 3-column grid: Morning, Afternoon, Night
- Each column: shift icon + name + time range, then list of roles with RoleBadge + required_count
- Total at bottom of each column
- "Edit Template" button (for now, disabled or shows message)

- [ ] **Step 3: Verify templates page**

Navigate to Templates. See weekday template with correct slot counts across 3 shifts. Switch tabs to Weekend and Holiday.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: templates page — tab navigation, shift columns, role counts"
```

---

## Task 15: Micro-interactions & Polish

**Files:**
- Modify: various component files
- Create: `client/src/styles/animations.css` (or add to globals.css)

- [ ] **Step 1: Add auto-fill shimmer animation**

When `useSchedule` detects new assignments after a refetch (compare before/after), briefly add a `shimmer` class to affected DayCells. CSS keyframes: background-color pulses from transparent to `rgba(45,90,61,0.1)` and back over 600ms.

- [ ] **Step 2: Polish Aria typing indicator**

Ensure the 3-dot animation is smooth with staggered delays (0ms, 150ms, 300ms). Each dot: `animate-pulse` with different `animation-delay`.

- [ ] **Step 3: Add empty slot click → Aria integration**

When EmptySlot is clicked:
1. Open Aria panel if closed
2. Auto-send message: "Can you fill the [RoleName] gap on [DayName, Month Date] [shift] shift?"
3. Show the message in chat immediately

- [ ] **Step 4: Add worker chip hover tooltip**

Ensure WorkerChip tooltip shows: Full name, Role (display name), Phone, Shift time. Tooltip appears on hover with 200ms delay, disappears on mouse leave.

- [ ] **Step 5: General UI polish pass**

- Ensure all Lucide icons are used (no emojis in UI code)
- Check font-family application (headings = DM Sans, body = IBM Plex Sans)
- Verify color tokens are consistently used via Tailwind classes
- Check that the calendar grid is scannable — enough padding, clear separation between shifts
- Ensure "Today" column is visually distinct

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: micro-interactions — shimmer, tooltips, empty slot → Aria"
```

---

## Task 16: README & Final Cleanup

**Files:**
- Create: `README.md`
- Modify: various files for cleanup

- [ ] **Step 1: Write README.md**

Structure:
```markdown
# ShiftMind

AI-powered workforce scheduling for senior care facilities.

## Quick Start

1. Clone and install: `npm install`
2. Add your Anthropic API key: `cp .env.example .env` and edit
3. Setup database: `npm run setup`
4. Run: `npm run dev`

Open http://localhost:5173 and click "Enter as Demo User".

## Features
- Weekly calendar with shift-based scheduling
- AI assistant (Aria) for natural language schedule management
- Auto-fill with weighted scoring algorithm
- Gap detection and smart replacement
- Worker availability management

## Architecture Decisions
1. **SQLite** — ...
2. **Drizzle ORM** — ...
3. **Aria tool_use** — ...
4. **Auto-fill scoring** — ...
5. **No real auth** — ...

## Aria's Tools
[List the 8 tools and what they do]

## Tech Stack
[List with brief notes]
```

- [ ] **Step 2: Remove any console.log statements**

Search all source files for `console.log` and remove. Keep `console.error` only in error handlers.

- [ ] **Step 3: Verify TypeScript build**

```bash
npm run build
```

Zero errors.

- [ ] **Step 4: Final end-to-end test**

```bash
rm -f server/shiftmind.db
npm run setup && npm run dev
```

1. Open browser → see login page with dark canvas design
2. Click "Enter as Demo User" → redirects to calendar
3. Calendar shows pre-seeded 2 weeks of data
4. Open Aria → type "Who's working this Thursday morning?" → get response
5. Type "Fill next week's schedule" → Aria confirms, fills, calendar updates
6. Navigate to Workers → see all 53 workers
7. Navigate to Templates → see weekday/weekend/holiday templates

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "docs: README with setup, architecture, features"
```

---

## Execution Notes

- Tasks 1-7 are backend-focused and should be done sequentially (each builds on the previous)
- Tasks 8-14 are frontend-focused — Task 8 (foundation) must be first, then 9-14 can be done in order
- Task 15 (polish) depends on all feature tasks being complete
- Task 16 (README) is last
- The logo SVG files (`logo-white.svg`, `logo-dark.svg`) and Aria avatar (`aria-avatar.png`) should be provided by the user and placed in `client/public/` — if not available, use the text fallbacks (green "S" square for logo, gradient circle for Aria)
