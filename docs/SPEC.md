# Learner DB -- Technical Specification

## Overview

Learner DB is a personal learning dashboard for a cybersecurity student at 42 Paris. It aggregates progress across five platforms -- 42 Paris, TryHackMe, HackTheBox, Root-me, and a self-hosted malware development elearning app -- into a single adaptive planning system.

The core value proposition is **intelligent weekly scheduling**: a deterministic rule engine allocates a 35-hour weekly study budget across platforms, adjusting for 42 project deadlines, goal urgency, and cross-platform competency levels. An optional LLM (Anthropic or local) provides narrative briefings and side project suggestions, but the scheduling itself requires no AI.

**Target user**: a single student running the app self-hosted on a Linux server.

---

## Architecture

```
Platform APIs          Sync Engine            SQLite DB
  42 Intra  ──┐                             ┌─────────────┐
  THM API   ──┤    ┌──────────────┐         │  27 tables   │
  HTB API   ──┼───>│  runSync()   │────────>│  (Drizzle)   │
  Root-me   ──┤    └──────────────┘         └──────┬───────┘
  Maldev DB ──┘                                    │
                                                   v
                                         ┌─────────────────┐
                                         │ Guidance Engine  │
                                         │  - snapshots     │
                                         │  - goals/pacing  │
                                         │  - 42 progress   │
                                         │  - skill profile │
                                         │  - recommendations│
                                         └────────┬─────────┘
                                                  │
                              ┌────────────────────┼─────────────────┐
                              v                    v                  v
                     ┌──────────────┐    ┌──────────────┐   ┌──────────────┐
                     │ Rule Engine  │    │  Competency   │   │  Backward    │
                     │  - budget    │    │  Signals      │   │  Planner     │
                     │  - goals     │    │  (20 areas)   │   │  (42 core)   │
                     │  - items     │    └──────────────┘   └──────────────┘
                     └──────┬───────┘
                            │
                            v
                   ┌──────────────────┐
                   │  LLM (optional)  │
                   │  narrative only  │
                   └────────┬─────────┘
                            │
                            v
                   ┌──────────────────┐
                   │   Planner UI     │
                   │   (Kanban board) │
                   └──────────────────┘
```

**Stack**:
- Next.js 16.2 (App Router, server components) + TypeScript
- Tailwind CSS v4 + shadcn/ui components (base-ui primitives)
- SQLite via better-sqlite3 + Drizzle ORM with auto-migrations
- @dnd-kit for drag-and-drop Kanban board
- Recharts for activity visualizations
- Docker multi-stage build for deployment

**Key design decisions**:
- All configuration (API keys, tokens, LLM settings) stored in the database `settings` table, not in environment variables. The only env var is `DATABASE_PATH`.
- Hybrid scheduling: the rule engine handles all item selection and time allocation deterministically. The LLM only writes a 2-3 sentence briefing and suggests one side project.
- Cross-platform competency signals prevent beginner recommendations for students who are skilled on other platforms.
- Backward planning computes 42 project deadlines from a single high-level target date using the full dependency graph.

---

## Data Model

### Core

| Table | Purpose |
|-------|---------|
| `settings` | Single-row app config. API keys/tokens for all five platforms, LLM provider/key/model/baseUrl, user objective, theme, sync interval. |
| `syncLog` | Tracks each sync run: platform, status, error message, items synced, start/end timestamps. |
| `dailySnapshots` | Daily JSON snapshots per platform for historical delta tracking. Columns: platform, date, data (JSON blob). |

### 42 Paris

| Table | Purpose |
|-------|---------|
| `ftProfile` | User profile: login, level, correction points, wallet, coalition, campus, image URL. |
| `ftSkills` | Cursus skills: name, level, cursus ID. |
| `ftProjects` | Projects: project ID, name, slug, status (in_progress/finished/etc), final mark, validated flag, marked date. |
| `ftAchievements` | Achievements: name, description, tier, kind. |
| `ftLogtimes` | Logtime entries: date, duration (seconds), host machine. |

### TryHackMe

| Table | Purpose |
|-------|---------|
| `thmProfile` | Profile: username, rank, points, rooms completed, badges count, streak, level. |
| `thmRooms` | Completed rooms: room code, name, completed date, difficulty, room type. |
| `thmBadges` | Badges: badge ID, name, description, image URL. |

### HackTheBox

| Table | Purpose |
|-------|---------|
| `htbProfile` | Profile: username, rank, points, global ranking, system/user owns, bloods, progress percentage. |
| `htbActivity` | Activity feed: activity type, object type, name, date. |

### Root-me

| Table | Purpose |
|-------|---------|
| `rootmeProfile` | Profile: username, score, position, challenges solved count. |
| `rootmeChallenges` | Solved challenges: challenge ID, title, category, score value, solved date. |

### Maldev Elearning

| Table | Purpose |
|-------|---------|
| `maldevProfile` | Profile: overall progress %, modules completed, total modules. |
| `maldevModules` | Modules: module ID, name, progress %, exercises completed/total. |
| `maldevExercises` | Exercises: exercise ID, module ID, name, status, completed date. |

### Planning

| Table | Purpose |
|-------|---------|
| `weeklyPlans` | Weekly plan headers: week start (ISO Monday), status, notes, mentor briefing text, collapsed briefing. |
| `planItems` | Plan items (FK to weeklyPlans): title, type (42/thm/htb/rootme/maldev), why, estimated hours, priority, day index (0-6 or null for backlog), status (pending/active/done/blocked/stuck/deferred), ref, link, sort order, deferred-to date, source week (for carry-forward), attempt count, blocked reason/since, description. |
| `catalogEntries` | Platform catalog data: platform, code, name, category, difficulty, path, link, source. |
| `deadlines` | Backward-planning deadlines: type (common_core/circle/project), label, target date, ft slug, circle number, parent ID, auto-generated flag, weekly hours needed, warning text. |
| `mentorPlan` | Append-only mentor plans: version, objective echo, plan JSON blob, created date. |

### Goals

| Table | Purpose |
|-------|---------|
| `goals` | Trackable goals: title, description, category (platform), target/current value, metric source key, deadline, status (active/completed). |
| `goalMilestones` | Milestones (FK to goals, cascade delete): title, target value threshold, reached-at timestamp. |

### Other

| Table | Purpose |
|-------|---------|
| `tasks` | Pinned user tasks: title, description, category, completion flag, due date, recurrence pattern. |
| `activityFeed` | Cross-platform activity feed: platform, event type, title, detail text, timestamp. |
| `guidanceCache` | Cached LLM guidance responses: prompt hash, response text, created date. 6-hour TTL. |

---

## Pages

### Planner (`/`)

The main dashboard. Combines a mentor briefing with a Kanban-style weekly schedule.

**Server component** (`src/app/page.tsx`): loads the current week plan, mentor plan, all five platform profiles with 30-day deltas, competency signals, active goals with pacing, and incomplete pinned tasks. Passes everything to `PlannerClient`.

**Client features** (`src/components/planner/planner-client.tsx`):

- **Header**: "Planner" title, "Week N . Mon DD - Mon DD . {objective}" subtitle, week navigation arrows (Wk N-1 / **Wk N** / Wk N+1), Regenerate button.
- **Mentor briefing** (collapsible): gold M avatar + narrative text. Collapse state persisted in localStorage.
- **Deadline warnings**: urgency-colored banner (red=critical, amber=elevated) showing backward plan warnings when 42 deadline pressure is non-normal.
- **Pulse bar** (`pulse-bar.tsx`): horizontal status bar with live platform stats (42 level, THM rank/rooms, HTB rank/owns, RM score, Maldev %) and 30-day deltas. Sync button. Weekly budget gauge (Xh / 35h).
- **Kanban board** (`kanban-board.tsx`): CSS Grid with 8 columns (Backlog + Mon-Sun). Cards are draggable via @dnd-kit. Each card shows: status icon, platform badge, title (linked if applicable), estimated hours. Card states: pending, active, done (green), blocked (yellow + reason), stuck (red + attempt count), rolled over (dashed border + source week). Today column highlighted with a star.
- **Hints bar**: drag instructions, status toggle hint, goal coverage summary.
- **Side project** (`side-project-brief.tsx`): expandable card with LLM-generated project (title, steps with hours, prerequisites, skills, capstone connection).
- **Competency spotlight** (`competency-spotlight.tsx`): top 3 weakest competencies with 5-segment level bars.
- **Pinned tasks**: compact task list with add/complete/delete controls.

**Mobile** (`mobile-views.tsx`): segmented toggle between Today (action cards with Done/Stuck buttons), Full week (vertical day list with swipe navigation), and Backlog (grouped by status with Schedule/Retry/Drop actions).

**Regenerate flow**:
1. POST `/api/mentor` -- rule engine builds deterministic schedule, LLM generates narrative (or fallback)
2. POST `/api/week` with action "reroll" -- creates new week plan from mentor output, auto-distributes items across days

### Progress (`/progress`)

Multi-view progress dashboard.

**Server component** (`src/app/progress/page.tsx`): loads all platform profiles, 42 skills, activity feed (last 500), daily snapshots, competency signals.

**Client features** (`src/components/progress/progress-client.tsx`):

- **Period toggle**: this week / this month / all time.
- **Platform stat cards** (all time): 42 level, THM rank/rooms/streak, HTB rank/points/owns, Maldev progress %, RM score/solved. Week/month views show delta stats with green indicators.
- **Competency map**: 20 competencies grouped by 9 areas. Each competency shows a 5-segment level bar (0-5), evidence text, and orange warnings for gaps (level < 2).
- **42 Holy Graph**: circle-by-circle progress bars (circles 0-6) with available next projects listed.
- **Platform activity chart**: bar chart showing activity counts by platform over time.
- **Milestones timeline**: recent achievements/completions with colored dots per platform and relative timestamps.

### Goals (`/goals`)

Goal management with auto-tracking and pacing analysis.

**Server component** (`src/app/goals/page.tsx`): runs guidance engine, computes competency signals, loads mentor plan focus items.

**Client features** (`src/components/goals/goals-client.tsx`):

- **Goal cards**: progress bar with milestone markers, pacing badge (on track / behind / overdue), days remaining, required/current pace, competency area tags, "this week" connection showing which focus items feed into the goal.
- **Behind-pace alert**: banner listing all goals that are behind schedule.
- **Create/edit dialog**: title, platform category selector, auto-track metric source, target value, deadline. Quick presets (6 predefined goals).
- **Suggested goals**: competencies with level < 2 that don't have a corresponding goal. One-click creation with auto 3-month deadline.
- **Completed goals section**: archived goals.

**Auto-sync** (`src/lib/goals/metrics.ts`): on each guidance engine run, active goals with a `metricSource` have their `currentValue` updated from live platform data. 8 supported metrics: ft:projects_validated, ft:level, rootme:challenges_solved, rootme:score, maldev:progress, thm:rooms_completed, htb:owns, htb:points.

### Settings (`/settings`)

Configuration and sync management.

**Server component** (`src/app/settings/page.tsx`): loads settings row, recent sync logs, last-sync-per-platform timestamps.

**Client features** (`src/components/settings/settings-client.tsx`):

- **AI Mentor**: learning objective textarea, provider toggle (Anthropic / Local LLM), API key, model name, base URL (for local). Test connection button.
- **42 Deadline Planner**: target date input, weekly 42 budget (hours), Set/Update/Remove buttons. Shows backward plan results: hours remaining, weeks available, required pace, circle-by-circle deadlines grid, feasibility warnings.
- **Platform credentials**: 5 sections (42 Paris: client ID/secret/login; THM: username; HTB: API token + user ID; Root-me: user ID + API key or session cookie; Maldev: database path). Each with a Test connection button.
- **Sync**: Sync now button, scrollable sync history log.
- **Export/Save**: top-level buttons for exporting config and saving changes.

---

## API Routes

### `POST /api/mentor`

Hybrid plan generation pipeline:
1. Reads mentor config (provider, API key, model, objective)
2. Runs the deterministic rule engine (budget allocation, item selection, competency assessment)
3. Calls LLM for narrative briefing + side project (falls back to template if no key or LLM fails)
4. Assembles and saves the plan

Returns: `{ plan, stale, hasKey, briefing, collapsedBriefing, deadlinePressure, weeklyBudget, warnings }`.

### `GET /api/mentor`

Returns the current saved plan via `loadCurrentPlan()`.

### `GET /api/week?week=YYYY-MM-DD`

Returns the week plan for a given Monday (defaults to current week). Creates the plan from mentor output if it doesn't exist. Includes all plan items.

### `PATCH /api/week`

Updates a single plan item. Body: `{ id, dayIndex?, status?, sortOrder?, deferredTo?, attemptCount?, blockedReason?, blockedSince?, description? }`. Handles status side effects (completedAt, blockedSince, stuck auto-increment).

### `POST /api/week`

Action endpoint. Body: `{ action: "reroll", week? }`. Deletes and recreates the week plan from current mentor output.

### `POST /api/goals`

Creates a goal. Body: `{ title, description?, category?, targetValue?, currentValue?, deadline?, metricSource? }`.

### `PATCH /api/goals`

Updates a goal. Body: `{ id, ...fields }` (status, currentValue, title, description, category, targetValue, deadline, metricSource).

### `DELETE /api/goals`

Deletes a goal. Body: `{ id }`.

### `GET /api/deadlines`

Returns all deadline rows + backward plan computation if a common_core deadline exists.

### `POST /api/deadlines`

Creates/updates a common core deadline. Body: `{ targetDate: "YYYY-MM-DD", weeklyBudget42?: number }`. Returns the deadline and computed backward plan.

### `DELETE /api/deadlines?id=N`

Deletes a deadline and its auto-generated children.

### `GET/PUT /api/settings`

GET returns the settings row. PUT updates it with any fields from the body.

### `POST /api/sync`

Triggers a full platform sync across all configured platforms. Returns sync results array.

### `POST /api/sync/test`

Tests connectivity for a single platform. Body: `{ platform, ...overrides }`. Supported: 42, thm, htb, rootme, maldev, llm.

### `POST/PATCH/DELETE /api/checklist`

CRUD for pinned tasks. POST creates, PATCH toggles completion, DELETE removes.

### `GET/POST /api/guidance`

Runs the guidance engine and optionally generates LLM advice. Returns guidance result + `llmAdvice`.

---

## Core Engines

### Guidance Engine

**File**: `src/lib/guidance/engine.ts`

Orchestrates all platform data into actionable recommendations.

**`runGuidanceEngine()`** pipeline:
1. `syncGoalValues()` -- auto-update goal metrics from live data
2. `gatherSnapshot()` -- query all platform profiles/data from DB
3. `analyzeGoals()` -- compute pacing for each active goal
4. `analyzeFtProgress()` -- determine 42 circle, completed/available projects
5. `buildSkillProfile()` -- aggregate cross-platform skills
6. `generateRecommendations()` -- produce prioritized items using:
   - Cross-platform difficulty floors (skip content below skill level)
   - Goal deadline pressure (boost items for urgent goals)
   - 42 project availability (next in dependency graph)
   - Skill gap analysis

**Output**: `GuidanceResult` with snapshot, goals, ftProgress, skillProfile, recommendations.

### Rule Engine

**File**: `src/lib/planning/rule-engine.ts`

Deterministic weekly scheduling. No LLM dependency.

**`runRuleEngine(objective)`** pipeline:
1. Run guidance engine
2. Check 42 deadline pressure (normal/elevated/critical)
3. Allocate 35h budget: 42 (40% baseline, up to 70% under deadline) / cybersec (55% of remainder: THM 40%, HTB 35%, RM 25%) / maldev (20% of remainder) / side project (25% of remainder)
4. Apply goal pressure: shift cybersec sub-budgets toward platforms with urgent behind-pace goals; shift cybersec→maldev if maldev goal is urgent
5. Sort recommendations with goal deadline boost (behind-pace goals promote items up to a full priority tier)
6. Fill focus items respecting per-platform budgets
7. Ensure minimum platform diversity
8. Build competency assessment (deterministic, 20 competencies)

**Output**: `RuleEngineOutput` with focus items, competencies, weeklyBudget, deadlinePressure, warnings.

### Backward Planner

**File**: `src/lib/planning/backward-planner.ts`

Computes intermediate deadlines for the 42 common core from a single target date.

**`computeBackwardPlan(targetDate, completedSlugs)`**:
- Uses the full 42 project dependency graph (30 projects, circles 0-6, choice groups)
- Computes `minHoursForCircle()` using the shortest option from choice groups
- Distributes weeks proportionally across remaining circles
- Generates warnings: pace above 25h/week ceiling, circle start dates in the past, individual projects needing 7+ weeks

**`deadline42Pressure(completedSlugs)`**: returns urgency level and adjusted weekly hours. Critical if pace > 25h/week, elevated if > 20h/week, normal otherwise.

### Cross-Platform Level Assessment

**File**: `src/lib/planning/cross-platform-level.ts`

Prevents the guidance engine from recommending beginner content to skilled students.

Maps the 20 competency signal levels (0-5) to platform-specific difficulty floors:
- Level 0-1 -> info difficulty (no filter)
- Level 2 -> easy minimum
- Level 3 -> medium minimum
- Level 4-5 -> hard minimum

Two mappings: `COMPETENCY_TO_THM_CATEGORY` (competency ID -> THM category) and `COMPETENCY_TO_HTB_AREA` (competency ID -> HTB area).

### Mentor Engine

**File**: `src/lib/mentor/engine.ts`

LLM integration for narrative generation. Two modes:

1. **Hybrid mode** (current): `generateNarrative(ctx, config, scheduledItems)` -- tells the LLM the schedule is already decided, asks only for a 2-3 sentence briefing and one side project suggestion. Much simpler prompt, reliable with small local models.

2. **Full plan mode** (legacy): `generateMentorPlan(ctx, config)` -- asks the LLM to produce the entire structured plan (focus items, competencies, side project). Preserved for backward compatibility.

Both modes support Anthropic API and OpenAI-compatible endpoints (for local LLMs). Template-based fallbacks exist for when no LLM is configured.

### Competency System

**Files**: `src/lib/mentor/competency-signals.ts`, `src/lib/mentor/competency-map.ts`

**20 competencies across 9 areas**:
- Low-level & C: c-core, c-systems, algorithms
- C++ & OOP: cpp-oop
- Windows & maldev: win-internals, maldev-techniques, evasion
- Reverse engineering: reverse-engineering
- Linux & systems: linux-admin, containers-infra
- Networking: net-fundamentals, net-attacks
- Web: web-fundamentals, web-security
- Active Directory: ad-fundamentals
- Recon & OSINT: recon-osint
- Crypto & forensics: crypto, forensics
- Scripting: scripting, binexp

Each competency has **signal tokens** -- evidence markers drawn from platform data (e.g., validated 42 projects, completed THM rooms, HTB owns). `computeCompetencySignals()` evaluates all tokens against the current platform snapshot and assigns a 0-5 level with evidence text.

---

## Platform Sync

**Directory**: `src/lib/sync/`

**Orchestrator** (`engine.ts`): `runSync()` runs each platform sequentially, skipping those without credentials. Logs results to `syncLog`, saves daily snapshots.

| Platform | Auth | Data fetched |
|----------|------|-------------|
| 42 Paris (`forty-two.ts`) | OAuth2 client-credentials via `api.intra.42.fr` | Profile, skills, projects, achievements. 500ms rate-limit delay. |
| TryHackMe (`tryhackme.ts`) | Public API (no auth) | Profile, completed rooms, badges. Bot-check detection. |
| HackTheBox (`hackthebox.ts`) | Bearer token via `labs.hackthebox.com/api/v4` | Profile, activity feed. UUID-to-numeric ID resolution. |
| Root-me (`rootme.ts`) | Cookie auth (API key or spip_session) via `api.www.root-me.org` | Profile, solved challenges with categories/scores. Username-to-ID resolution. |
| Maldev (`maldev.ts`) | Local SQLite DB (read-only) | Module/exercise progress parsed from `progress` table and `Modules.htm`. |

---

## Catalogs

### 42 Common Core Projects

**File**: `src/lib/guidance/ft-project-tree.ts`

30 projects spanning circles 0-6 with:
- Prerequisite chains (e.g., Minishell requires Pipex)
- Choice groups (e.g., circle 2: pick Pipex OR minitalk for IPC, pick so_long OR fract-ol OR FdF for graphics)
- Estimated hours per project (from 10h for Libft to 200h for ft_transcendence)
- Skill tags per project

Key functions: `getAvailableProjects(completedSlugs)` respects prerequisites and choice groups. `getCircleProgress(completedSlugs)` treats choice pools as single units.

### TryHackMe Rooms

**File**: `src/lib/guidance/thm-room-categories.ts`

62 rooms organized by:
- Learning paths: Pre Security, Complete Beginner, Offensive Pentesting
- Categories: web, misc, networking, crypto, reverse, pwn, forensics, osint
- Difficulties: info, easy, medium, hard

### HTB Academy Modules

**File**: `src/lib/mentor/htb-academy-catalog.ts`

47 modules across:
- Areas: Foundations, Recon, Web security, Exploitation, Active Directory, SOC/Blue team, Low-level/maldev-adjacent
- Tiers: Fundamental, Easy, Medium, Hard
- Optional learning path associations

---

## Deployment

### Development

```
npm install
npm run dev
```

SQLite database at `./data/learner.db` (configurable via `DATABASE_PATH`). Auto-creates the directory and runs all migrations on first server start.

### Docker

```
docker compose up -d
```

- Multi-stage build (deps -> builder -> runner) with `node:20-slim`
- Rebuilds `better-sqlite3` from source for ABI compatibility
- Runs as non-root `nextjs` user
- Port mapping: 3001:3000
- Named volume `db-data` for `/app/data`
- Read-only bind mount from host maldev DB path to `/maldev`
- Health check via Node fetch
- Restart policy: `unless-stopped`

### Schema Changes

1. Edit `src/lib/db/schema.ts`
2. Run `npm run db:generate`
3. Migrations auto-apply on next server start

---

## UI Components

### Shared primitives (`src/components/ui/`)

20 components wrapping `@base-ui/react` primitives, styled with `class-variance-authority`:

Avatar, Badge (6 variants), Button (multiple sizes including xs), Calendar, Card, Checkbox, Dialog, DropdownMenu, Input, Label, Popover, Progress, ScrollArea, Select, Separator, Sheet, Switch, Tabs, Textarea, Tooltip.

### Layout (`src/components/layout/`)

**Sidebar** (`sidebar.tsx`): fixed left sidebar, 56 units wide. 4 nav items: Planner (/), Progress (/progress), Goals (/goals), Settings (/settings). Mobile: off-screen with hamburger toggle and overlay.

### Platform colors (`src/lib/platform-colors.ts`)

7 platform keys mapped to CSS custom properties and short labels: 42, THM, HTB, RM, MAL, GEN, SYS.
