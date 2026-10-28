# Hosting Strategy — Self-hosted HTB Academy Clone

## Overview

Three-tier architecture split across physical machines connected via Tailscale.

```
                         TAILNET (100.x.x.x)
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  ┌────────────────────┐   API    ┌────────────────────────────────┐  │
│  │  FEDORA SERVER     │◄────────►│  W11 DESKTOP (64 GB DDR5)     │  │
│  │  "control-plane"   │   API    │  "runner-heavy"                │  │
│  │                    │◄────────►│  Docker Desktop (WSL2)         │  │
│  │  Next.js app       │          │  Hyper-V (Windows/AD VMs)      │  │
│  │  SQLite database   │          │  subnet route 10.129.0.0/16    │  │
│  │  Content store     │          │  WoL-capable from LAN          │  │
│  │  Lab scheduler     │          └────────────────────────────────┘  │
│  │                    │                                               │
│  │                    │   API    ┌────────────────────────────────┐  │
│  │                    │◄────────►│  MACBOOK AIR M4 (16 GB)       │  │
│  │                    │          │  "runner-light"                │  │
│  │                    │          │  OrbStack / Colima (Docker)    │  │
│  │                    │          │  ARM-native + Rosetta x86      │  │
│  └────────────────────┘          └────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 1. Server — Fedora x86 (always on)

### Role
- Serves the Next.js app (port 3000, bound to Tailscale IP only)
- Hosts the SQLite database (all content, progress, lab state)
- Runs the **lab scheduler**: decides which runner starts a lab
- Sends Wake-on-LAN to the desktop when needed (same LAN)
- Does NOT run any lab container or VM

### Resource budget
- RAM: ~300–500 MB (Next.js + SQLite)
- Disk: 5–15 GB (app + imported content + images)
- CPU: minimal (serves pages, proxies lab status)

### Container setup
```yaml
# docker-compose.yml on server
services:
  app:
    build: .
    ports:
      - "${TAILSCALE_IP}:3001:3000"
    volumes:
      - app-data:/app/data          # SQLite DB
      - content-store:/app/content  # imported Markdown + images
    environment:
      - DATABASE_PATH=/app/data/learner.db
      - CONTENT_PATH=/app/content
    restart: unless-stopped
```

---

## 2. Lab Runners

### What is a runner?

A lightweight agent (single Node.js process, ~20 MB) that:
1. Registers with the server on startup (announces capabilities)
2. Receives lab start/stop/reset commands via HTTP API
3. Manages Docker containers and (on desktop) Hyper-V VMs
4. Reports lab status (running, IP, ports, health) back to the server
5. Enforces TTL: auto-stops labs after expiry

### Runner registration payload

```jsonc
{
  "runnerId": "desktop-w11",
  "hostname": "desktop.tailnet",
  "tailscaleIp": "100.x.x.x",
  "arch": "amd64",
  "os": "windows",
  "capabilities": {
    "docker": true,
    "hyperv": true,       // can run Windows Server VMs
    "maxRamMb": 49152,    // 48 GB available for labs (reserve 16 for OS)
    "maxDiskGb": 500,
    "gpuAvailable": false
  },
  "subnetRoutes": ["10.129.0.0/16"]  // lab network it advertises
}
```

```jsonc
{
  "runnerId": "macbook-m4",
  "hostname": "macbook.tailnet",
  "tailscaleIp": "100.x.x.x",
  "arch": "arm64",
  "os": "darwin",
  "capabilities": {
    "docker": true,
    "hyperv": false,
    "maxRamMb": 10240,   // 10 GB available for labs (reserve 6 for OS)
    "maxDiskGb": 100,
    "gpuAvailable": false
  },
  "subnetRoutes": ["10.130.0.0/16"]  // separate range to avoid conflicts
}
```

### Runner placement logic

The scheduler picks a runner using these rules in order:

1. **Hard requirements**: lab needs `hyperv` → only desktop. Lab needs `arch: amd64` exclusively → only desktop.
2. **RAM check**: runner has enough free RAM for the lab's `ramMb` requirement.
3. **Prefer local**: if the user's current device IS a runner and meets requirements, use it (lowest latency for reverse shells).
4. **Prefer cheapest**: among eligible runners, pick the one with the most remaining capacity.
5. **Wake-on-LAN**: if the desktop is the only eligible runner and it's offline, the server sends a WoL packet (same LAN) and queues the lab start for when the runner re-registers (timeout: 3 minutes).

### Runner agent protocol

All communication over HTTPS on Tailscale IPs. The server calls the runner, never the reverse (except registration).

```
POST /api/runner/register         runner → server    (on startup, heartbeat every 60s)
POST /api/runner/labs/start       server → runner    (start a lab environment)
POST /api/runner/labs/stop        server → runner    (stop / destroy)
POST /api/runner/labs/reset       server → runner    (destroy + restart fresh)
GET  /api/runner/labs/:id/status  server → runner    (health, IP, ports, uptime)
POST /api/runner/labs/:id/extend  server → runner    (extend TTL)
```

### Runner installation

```bash
# On the desktop (PowerShell) or Mac (bash):
npx cartableo-runner --server https://100.66.34.21:3001 --token <shared-secret>
```

The runner is a standalone package with zero dependencies beyond Node.js and Docker CLI. On Windows, it also shells out to `powershell` for Hyper-V commands.

---

## 3. Lab Manifest Format

Every lab environment is defined by a manifest stored alongside the module content. The scheduler reads it to decide placement; the runner reads it to start the environment.

```yaml
# content/modules/sql-injection-fundamentals/labs/section-03.lab.yml
id: sqli-fund-s03
name: "SQL Injection — Union-Based"
description: "Practice UNION-based injection against a vulnerable PHP app"

# Scheduling constraints
requirements:
  arch: multi          # multi | amd64 | arm64
  runtime: docker      # docker | hyperv | qemu
  ramMb: 512
  diskMb: 200
  needsInternet: false

# What to run
containers:
  - name: target
    image: cartableo/lab-sqli-union:1.0
    # Multi-arch image built for linux/amd64 + linux/arm64
    ports:
      - "80:80"
    environment:
      FLAG_S03: "HTB{un10n_1nj3ct10n_m4st3r}"
    healthcheck:
      path: /
      interval: 10s

# Network
network:
  subnet: auto          # scheduler assigns from runner's pool
  isolation: full       # full = no internet | partial = allowlist | none
  allowedHosts: []      # for partial isolation

# Lifecycle
ttl: 120m              # auto-stop after 2 hours
extendable: true       # user can click "extend 1h"
maxExtensions: 2
```

### Complex lab example (multi-container, AD)

```yaml
id: ad-enum-bloodhound
name: "Active Directory — BloodHound Enumeration"

requirements:
  arch: amd64
  runtime: hyperv       # needs Windows Server VMs
  ramMb: 8192
  diskMb: 40960
  needsInternet: false

vms:
  - name: dc01
    template: ws2022-dc-base    # pre-built Hyper-V template
    role: domain-controller
    domain: INLANEFREIGHT.LOCAL
    customize:
      - script: setup-ad-users.ps1
      - script: setup-spns.ps1
      - script: setup-acls.ps1
    ramMb: 4096

  - name: ws01
    template: w10-workstation-base
    role: workstation
    joinDomain: INLANEFREIGHT.LOCAL
    ramMb: 2048

containers:
  - name: pwnbox
    image: cartableo/pwnbox:latest
    tools: [bloodhound, neo4j, crackmapexec, impacket]
    ports:
      - "6901:6901"   # noVNC
    ramMb: 2048

network:
  subnet: auto
  isolation: full
  internalDns: dc01

ttl: 240m
extendable: true
maxExtensions: 3
```

---

## 4. Network Architecture

### Lab subnets

Each runner owns a /16 range for lab networks:

| Runner | Range | Notes |
|--------|-------|-------|
| Desktop (W11) | `10.129.0.0/16` | Matches HTB's range for familiarity |
| MacBook (M4) | `10.130.0.0/16` | Separate range to avoid conflicts when both active |

Each lab gets a /24 within its runner's range. The runner assigns sequentially:
- Lab 1: `10.129.1.0/24`
- Lab 2: `10.129.2.0/24`
- etc.

### Tailscale subnet routing

The desktop advertises `10.129.0.0/16` as a subnet route. The MacBook advertises `10.130.0.0/16`. Any device on the tailnet can reach lab targets by IP — just like HTB Academy.

```bash
# On desktop (PowerShell, elevated):
tailscale up --advertise-routes=10.129.0.0/16 --accept-routes

# On MacBook:
sudo tailscale up --advertise-routes=10.130.0.0/16 --accept-routes
```

### Isolation

Lab networks are **bridge networks with no default gateway** (Docker) or **internal switches** (Hyper-V). No route to the host's LAN or Internet unless the manifest says `isolation: partial` or `none`.

For Docker:
```bash
docker network create --internal --subnet=10.129.1.0/24 lab-sqli-fund-s03
```

The `--internal` flag blocks outbound traffic. The runner creates a veth pair to make the subnet routable from Tailscale without giving the containers a gateway.

### Pwnbox connectivity

The Pwnbox container runs on the SAME runner as the target, on the SAME Docker network. This means:
- Reverse shells work without any NAT or port forwarding
- Tools like `nmap`, `gobuster`, `sqlmap` have LAN-speed access to targets
- noVNC (port 6901) is exposed on the runner's Tailscale IP → accessible from any device

If the user prefers to attack from their own machine (Mac terminal, for instance), it works via the subnet route, but reverse shells need the Mac's Tailscale IP as LHOST — the runner handles the routing.

---

## 5. Tailscale ACLs

Restrict who can reach what:

```jsonc
// tailscale ACL policy (add to existing)
{
  "tagOwners": {
    "tag:lms-server": ["autogroup:admin"],
    "tag:lab-runner": ["autogroup:admin"]
  },
  "acls": [
    // Server ↔ Runner: agent API
    {
      "action": "accept",
      "src": ["tag:lms-server"],
      "dst": ["tag:lab-runner:7500"]  // runner agent port
    },
    // Runner → Server: registration
    {
      "action": "accept",
      "src": ["tag:lab-runner"],
      "dst": ["tag:lms-server:3001"]
    },
    // Your devices → lab subnets (for attacking from your own machine)
    {
      "action": "accept",
      "src": ["autogroup:member"],
      "dst": ["10.129.0.0/16:*", "10.130.0.0/16:*"]
    },
    // Your devices → Pwnbox noVNC
    {
      "action": "accept",
      "src": ["autogroup:member"],
      "dst": ["tag:lab-runner:6901"]
    }
  ]
}
```

---

## 6. Wake-on-LAN

The server and desktop are on the same physical LAN. When a lab needs the desktop and it's offline:

1. Server checks runner heartbeat — desktop not seen for >90s
2. Server sends WoL magic packet to desktop's LAN MAC address
3. Server queues the lab start request with a 3-minute timeout
4. Desktop boots → runner agent starts (Windows Task Scheduler: on-login) → re-registers
5. Server dispatches the queued lab start

```typescript
// server-side: src/lib/labs/wol.ts
import dgram from "node:dgram";

export function sendWakeOnLan(macAddress: string, broadcastIp: string) {
  const mac = macAddress.replace(/[:-]/g, "");
  const magicPacket = Buffer.alloc(102);
  // 6 bytes of 0xFF
  magicPacket.fill(0xff, 0, 6);
  // 16 repetitions of the MAC address
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 6; j++) {
      magicPacket[6 + i * 6 + j] = parseInt(mac.substr(j * 2, 2), 16);
    }
  }
  const socket = dgram.createSocket("udp4");
  socket.send(magicPacket, 0, magicPacket.length, 9, broadcastIp, () => {
    socket.close();
  });
}
```

The WoL packet goes over the **physical LAN**, not over Tailscale (which can't forward broadcast UDP). The server must have a LAN interface to the same broadcast domain as the desktop.

### Configuration

```jsonc
// In the app settings or env:
{
  "runners": {
    "desktop-w11": {
      "tailscaleIp": "100.x.x.x",
      "lanMac": "AA:BB:CC:DD:EE:FF",
      "lanBroadcast": "192.168.1.255",
      "wolEnabled": true
    }
  }
}
```

---

## 7. Pwnbox — Local Attack Container

A pre-built Docker image with common pentest tools, accessible via noVNC in the browser.

### Image: `cartableo/pwnbox`

Based on `parrotsec/security` (multi-arch: amd64 + arm64), with additions:

- **noVNC + TigerVNC** (web-accessible desktop)
- **Terminal**: zsh + oh-my-zsh + tmux
- **Pre-installed tools**: nmap, gobuster, ffuf, sqlmap, burpsuite-community, john, hashcat, hydra, crackmapexec, impacket, bloodhound, responder, chisel, ligolo-ng, gdb + pwndbg (amd64 only), python3 + pwntools
- **Wordlists**: rockyou.txt, SecLists (common subset, ~500 MB)
- **Size**: ~4 GB compressed

### Usage from the app

The user clicks "Start Pwnbox" on any section that has a lab. The Pwnbox is started on the SAME runner and SAME network as the target. The app shows an iframe or new-tab link to `https://<runner-tailscale-ip>:6901/vnc.html`.

If a Pwnbox is already running for another lab on the same runner, it's reused (added to the new lab's network as well).

### Lightweight alternative

For simple web labs where a full desktop isn't needed, the app can offer a **web terminal** instead (xterm.js + ttyd), which uses ~200 MB RAM instead of 2 GB.

---

## 8. VM Templates (Desktop only)

For Windows/AD labs, pre-built Hyper-V templates avoid rebuilding from scratch:

| Template | Based on | Size | Purpose |
|----------|----------|------|---------|
| `ws2022-dc-base` | Windows Server 2022 Eval | ~15 GB | Domain Controller, pre-sysprep'd |
| `ws2022-member` | Windows Server 2022 Eval | ~12 GB | Member server (IIS, MSSQL, etc.) |
| `w10-workstation` | Windows 10 Enterprise Eval | ~12 GB | Domain-joined workstation |
| `kali-vm` | Kali 2024.x | ~8 GB | For kernel exploit labs |
| `ubuntu-vuln` | Ubuntu 22.04 | ~4 GB | For Linux privesc labs |

**Differencing disks**: each lab creates a differencing disk from the template. Setup scripts (PowerShell for AD, bash for Linux) customize users, services, vulnerabilities. Teardown deletes only the differencing disk — the template stays.

Total template storage: ~50 GB. Per-lab overhead: 2–10 GB (differencing disk).

### Building templates

```powershell
# One-time setup on the desktop:
# 1. Download Windows Server 2022 Eval ISO from Microsoft
# 2. Create VM, install, apply updates, install tools, sysprep
# 3. Export as template:
Export-VM -Name "ws2022-dc-base" -Path "D:\LabTemplates"
```

A setup guide will be provided in `docs/vm-templates.md`.

---

## 9. Content Import Pipeline

### Sources (in order of priority)

1. **HTB Academy modules** (user's unlocked content) — scraped with a local browser script
2. **Open-source resources** — HackTricks, PayloadsAllTheThings, OWASP guides
3. **Custom content** — written by the user or generated by Claude

### Import format

All content is normalized to a directory structure before import:

```
content/
├── paths/
│   ├── penetration-tester.yml        # path metadata
│   └── bug-bounty-hunter.yml
├── modules/
│   ├── sql-injection-fundamentals/
│   │   ├── module.yml                # metadata, difficulty, tier, est. hours
│   │   ├── sections/
│   │   │   ├── 01-introduction.md
│   │   │   ├── 02-in-band-sqli.md
│   │   │   ├── 03-union-injection.md
│   │   │   └── ...
│   │   ├── questions/
│   │   │   ├── 01.yml                # { section: 1, question: "...", answer_hash: "sha256:..." }
│   │   │   └── ...
│   │   ├── labs/
│   │   │   ├── section-03.lab.yml
│   │   │   └── skill-assessment.lab.yml
│   │   ├── cheatsheet.md
│   │   └── images/
│   │       ├── union-injection-flow.png
│   │       └── ...
│   └── ...
└── images/                           # shared images
```

### Import CLI

```bash
# From the server:
npm run content:import -- --source ./content
# or
npm run content:import -- --source /path/to/scraped-htb-export
```

The importer:
1. Reads `module.yml` for metadata
2. Parses each Markdown section, resolves image paths
3. Hashes question answers (SHA-256) so they're not visible in the DB
4. Registers lab manifests
5. Links modules to paths
6. Upserts everything (idempotent — re-running updates content without losing progress)

---

## 10. Database Schema Changes

The existing Cartableo schema tracks progress on external platforms and has a knowledge/article system. For the LMS pivot, we:

### Keep (with minor adjustments)
- `settings` — add runner config fields
- `goals`, `goalMilestones` — link to modules/paths
- `activityFeed` — record LMS events too
- `mentorMessages` — contextual help while studying
- `exerciseAttempts` — repurpose for section questions

### Replace with LMS equivalents
- `knowledgeArticles` → `modules` (a module IS an article collection)
- `articleSections` → `sections` (sections within modules)
- `sectionExercises` → `sectionQuestions` (flag-based, not just MCQ)
- `learningResources` / `learningPaths` / `learningPathItems` → `paths` / `pathModules`

### New tables
- `paths` — learning paths (Penetration Tester, Bug Bounty Hunter, etc.)
- `pathModules` — ordered modules within a path
- `modules` — course modules with metadata
- `sections` — content sections within modules (Markdown body)
- `sectionQuestions` — questions with hashed answers
- `sectionProgress` — per-section completion
- `moduleProgress` — per-module completion and score
- `pathProgress` — per-path completion
- `labEnvironments` — lab manifest metadata (stored in DB for the scheduler)
- `labSessions` — active/past lab instances (runner, IP, status, started/stopped)
- `runners` — registered lab runners
- `cheatsheets` — per-module quick reference (Markdown)

### Preserved external platform tables
All `ft_*`, `thm_*`, `htb_*`, `rootme_*`, `maldev_*` tables stay as-is. They continue to sync and feed the progress dashboard. The new LMS content is orthogonal.

---

## 11. Implementation Phases

| Phase | What | Where | Depends on |
|-------|------|-------|------------|
| **1. Schema & Content Model** | New DB tables, Drizzle migrations, content import CLI | Server | — |
| **2. Course Reader** | Module/section viewer, Markdown rendering, navigation, progress tracking | Server | Phase 1 |
| **3. Questions & Flags** | Section questions, hashed answer verification, hints, stats | Server | Phase 2 |
| **4. Runner Agent** | Runner daemon, registration, Docker lab management | Desktop + Mac | Phase 1 |
| **5. Lab Scheduler** | Placement logic, WoL, lab lifecycle in the app UI | Server | Phase 4 |
| **6. Lab Images** | Build multi-arch Docker images for web/Linux labs | Desktop | Phase 4 |
| **7. Pwnbox** | noVNC attack container, web terminal alternative | Desktop + Mac | Phase 4 |
| **8. Content Scraper** | Browser script for HTB Academy export (runs on user's machine) | User's machine | Phase 1 |
| **9. VM Templates** | Hyper-V templates for Windows/AD labs | Desktop | Phase 4 |
| **10. Skill Assessments** | End-of-module practical assessments on lab environments | Server | Phase 5, 6 |
| **11. Path Progression** | Path-level tracking, prerequisites, certificates | Server | Phase 2, 3 |

Phases 1–3 are the foundation and can start immediately. Phase 4 can start in parallel. Phases 5–7 follow. Content (Phase 8) can happen anytime after Phase 1.

---

## 12. Security Considerations

- **No auth on the app**: single-user, Tailscale is the trust boundary. The app binds to the Tailscale IP only.
- **Runner auth**: shared secret token, rotatable, stored in env vars. All runner ↔ server communication over HTTPS on Tailscale.
- **Lab isolation**: `--internal` Docker networks, no default gateway. Hyper-V internal switches. Intentionally vulnerable machines MUST NOT reach your LAN or Internet.
- **Flag hashing**: answers stored as SHA-256 hashes. The user can't accidentally see them while browsing the DB.
- **Content on disk**: imported Markdown and images live in a Docker volume. No sensitive data beyond the flags (which are hashed).
- **WoL**: only works on the physical LAN, not routable from the Internet. Low risk.
