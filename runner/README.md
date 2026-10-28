# eLearner Lab Runner Agent

A lightweight Node.js agent that manages Docker-based lab environments for the eLearner LMS. The runner registers with a central LMS server, sends periodic heartbeats, and exposes an HTTP API for starting, stopping, and monitoring lab containers.

## Prerequisites

- **Node.js** >= 18
- **Docker** (daemon must be running for lab operations; the runner starts without it but lab commands will fail)

## Quick Start

```bash
cd runner
npm install
npm start -- --server https://100.66.34.21:3001 --token my-secret-token
```

### CLI Options

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--server <url>` | Yes | — | LMS server URL |
| `--token <secret>` | Yes | — | Shared authentication token |
| `--port <number>` | No | `7500` | Port for the runner's HTTP server |
| `--id <string>` | No | hostname | Runner identifier |

## API Endpoints

All endpoints except `/health` require an `Authorization: Bearer <token>` header.

### `GET /health`
Health check (no auth required).

```bash
curl http://localhost:7500/health
# {"status":"ok","uptime":42.3}
```

### `POST /start`
Start a lab environment.

```bash
curl -X POST http://localhost:7500/start \
  -H "Authorization: Bearer my-secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "labId": "demo-1",
    "containers": [
      {
        "name": "web",
        "image": "nginx:alpine",
        "ports": ["8080:80"],
        "environment": {"NGINX_HOST": "localhost"}
      }
    ],
    "network": {
      "subnet": "10.129.1.0/24",
      "isolation": "full"
    },
    "ttlMinutes": 60
  }'
```

### `POST /stop`
Stop and remove a lab environment.

```bash
curl -X POST http://localhost:7500/stop \
  -H "Authorization: Bearer my-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"labId": "demo-1"}'
```

### `POST /reset`
Reset a lab (stop + start with new config).

```bash
curl -X POST http://localhost:7500/reset \
  -H "Authorization: Bearer my-secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "labId": "demo-1",
    "config": {
      "labId": "demo-1",
      "containers": [{"name": "web", "image": "nginx:alpine"}],
      "network": {"subnet": "10.129.1.0/24", "isolation": "full"},
      "ttlMinutes": 60
    }
  }'
```

### `GET /status/:labId`
Get status of a specific lab.

```bash
curl http://localhost:7500/status/demo-1 \
  -H "Authorization: Bearer my-secret-token"
```

### `GET /labs`
List all running labs.

```bash
curl http://localhost:7500/labs \
  -H "Authorization: Bearer my-secret-token"
```

## Verifying It Works

1. **Start the runner** (Docker not required for this check):
   ```bash
   npm start -- --server https://httpbin.org --token test123
   ```
   You should see capability detection output and a registration attempt.

2. **Check health** (in another terminal):
   ```bash
   curl http://localhost:7500/health
   ```
   Should return `{"status":"ok","uptime":...}`.

3. **Start a lab** (requires Docker):
   ```bash
   curl -X POST http://localhost:7500/start \
     -H "Authorization: Bearer test123" \
     -H "Content-Type: application/json" \
     -d '{
       "labId": "test-1",
       "containers": [{"name": "web", "image": "nginx:alpine", "ports": ["9090:80"]}],
       "network": {"subnet": "10.129.1.0/24", "isolation": "full"},
       "ttlMinutes": 30
     }'
   ```

4. **Check lab status**:
   ```bash
   curl http://localhost:7500/status/test-1 \
     -H "Authorization: Bearer test123"
   ```

5. **Clean up**:
   ```bash
   curl -X POST http://localhost:7500/stop \
     -H "Authorization: Bearer test123" \
     -H "Content-Type: application/json" \
     -d '{"labId": "test-1"}'
   ```

## Architecture

```
LMS Server  <──────────>  Lab Runner Agent  <──────────>  Docker Daemon
             heartbeat      (this process)     exec shell
             /register       port 7500         commands
```

The runner uses `child_process.execSync` for Docker commands (no Docker SDK) and Node's built-in `http` module for its server (no Express). This keeps the dependency footprint minimal.
