# Learner DB

Personal learning dashboard that aggregates progress across five platforms and generates adaptive weekly study plans.

## What it does

- **Syncs data** from 42 Paris, TryHackMe, HackTheBox, Root-me, and a self-hosted maldev elearning platform
- **Computes competency levels** across 20 skill areas using cross-platform signals (a 42 project in C and a THM room in Linux both feed into the same competency score)
- **Generates weekly schedules** via a deterministic rule engine that allocates a 35-hour budget across platforms, adjusting for deadline pressure and goal urgency
- **Backward-plans 42 deadlines** -- set a target date for the common core, and the system computes per-circle milestones, required weekly hours, and feasibility warnings
- **Tracks goals** with auto-synced metrics and pacing analysis (on track / behind / overdue)
- **Optional LLM integration** (Anthropic or local) for narrative briefings and side project suggestions -- the scheduling itself requires no AI

## Pages

| Page | What it shows |
|------|--------------|
| **Planner** (`/`) | Status-based kanban board (Backlog → To Do → In Progress → Done), mentor briefing, deadline warnings, competency spotlight, side project card with refresh button |
| **Progress** (`/progress`) | Platform stat cards with 30-day deltas, competency map (20 areas), 42 Holy Graph (circle progress), activity chart, milestones timeline |
| **Goals** (`/goals`) | Trackable targets with auto-sync from platform data, pacing analysis, suggested goals from competency gaps, resizable tree/detail split pane |
| **Settings** (`/settings`) | Platform credentials, AI mentor config, 42 deadline planner with backward scheduling, sync controls |

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- SQLite via better-sqlite3 + Drizzle ORM (auto-migrations)
- @dnd-kit for drag-and-drop
- Optional: Anthropic or OpenAI-compatible LLM

## Quick start

### Development

```bash
npm install
npm run dev
```

SQLite database at `./data/learner.db` (configurable via `DATABASE_PATH`). The directory is created and migrations are applied automatically on first start.

Open [http://localhost:3000](http://localhost:3000) and configure your platform credentials in Settings.

### Docker

```bash
docker compose up -d
```

Data persists in the `db-data` volume at `/app/data`. The maldev elearning database is bind-mounted read-only from the host.

### Schema changes

Edit `src/lib/db/schema.ts`, then run `npm run db:generate`. Migrations apply automatically on next server start.

## Configuration

All credentials are stored in the database via the Settings page -- not in environment variables. The only env var is `DATABASE_PATH` (default: `./data/learner.db`).

Supported platforms:
- **42 Paris** -- OAuth2 client credentials from [profile.intra.42.fr/oauth/applications](https://profile.intra.42.fr/oauth/applications)
- **TryHackMe** -- public username (profile must be public)
- **HackTheBox** -- API token from HTB Settings > App Tokens + user ID
- **Root-me** -- user ID + API key or spip_session cookie
- **Maldev elearning** -- absolute path to the local SQLite database
- **LLM** (optional) -- Anthropic API key or local LLM base URL (OpenAI-compatible)

## How scheduling works

The rule engine runs entirely without an LLM:

1. **Gather data** -- sync platform profiles, compute competency signals, analyze goal pacing
2. **Allocate budget** -- 35h/week split across 42 (40%, up to 70% under deadline pressure), cybersec platforms (THM/HTB/Root-me), maldev, and side projects
3. **Shift for goals** -- behind-pace goals boost their platform's share and promote related items in the priority queue
4. **Select items** -- fill the schedule from prioritized recommendations, respecting per-platform budgets and cross-platform difficulty floors
5. **Generate narrative** (optional) -- LLM writes a 2-3 sentence briefing and suggests one side project

The backward planner takes a single target date (e.g., "common core by April 2027") and computes intermediate circle deadlines using the full 42 project dependency graph, warning when the pace exceeds 25h/week or when start dates are already past.

## Architecture

See [docs/SPEC.md](docs/SPEC.md) for the full technical specification including data model, API routes, engine internals, and deployment details.
