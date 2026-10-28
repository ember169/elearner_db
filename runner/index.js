#!/usr/bin/env node

/**
 * Cartableo Lab Runner Agent
 *
 * A standalone, zero-dependency Node.js agent that:
 * 1. Registers with the Cartableo server (heartbeat every 60s)
 * 2. Accepts lab start/stop/status commands over HTTP
 * 3. Manages Docker containers for lab environments
 *
 * Usage:
 *   node index.js --server https://<server-tailscale-ip>:3001 \
 *                 --token <runner-token> \
 *                 [--port 7500] \
 *                 [--subnet 10.129.0.0/16]
 *
 * Requirements:
 *   - Node.js 18+
 *   - Docker CLI available in PATH
 */

import { createServer } from "node:http";
import { execSync, exec } from "node:child_process";
import { hostname, arch, platform, totalmem, networkInterfaces } from "node:os";

// ---------- CLI args ----------

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const SERVER_URL = getArg("server") || process.env.CARTABLEO_SERVER;
const TOKEN = getArg("token") || process.env.RUNNER_TOKEN || "test-runner-token-change-me";
const PORT = parseInt(getArg("port") || process.env.RUNNER_PORT || "7500", 10);
const SUBNET_RANGE = getArg("subnet") || process.env.RUNNER_SUBNET || "10.129.0.0/16";

if (!SERVER_URL) {
  console.error("Usage: node index.js --server <url> --token <token> [--port 7500] [--subnet 10.129.0.0/16]");
  process.exit(1);
}

// ---------- System detection ----------

function detectArch() {
  const a = arch();
  if (a === "x64" || a === "x86_64") return "amd64";
  if (a === "arm64" || a === "aarch64") return "arm64";
  return a;
}

function detectOs() {
  const p = platform();
  if (p === "win32") return "windows";
  return p; // "linux" or "darwin"
}

function hasDocker() {
  try {
    execSync("docker info", { stdio: "ignore", timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

function hasHyperV() {
  if (detectOs() !== "windows") return false;
  try {
    execSync("powershell -Command Get-VMHost", { stdio: "ignore", timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

const RUNNER_ID = getArg("id") || hostname();
const RUNNER_ARCH = detectArch();
const RUNNER_OS = detectOs();
const DOCKER_OK = hasDocker();
const HYPERV_OK = hasHyperV();
const MAX_RAM_MB = Math.round(totalmem() / (1024 * 1024));

console.log(`[runner] ${RUNNER_ID} — ${RUNNER_ARCH}/${RUNNER_OS}`);
console.log(`[runner] Docker: ${DOCKER_OK} | Hyper-V: ${HYPERV_OK} | RAM: ${MAX_RAM_MB} MB`);
console.log(`[runner] Server: ${SERVER_URL} | Port: ${PORT} | Subnet: ${SUBNET_RANGE}`);

// ---------- Docker helpers ----------

/** Active labs: sessionId → { containers: [{name, containerId}] } */
const activeLabs = new Map();

/** Next subnet octet for auto-assignment within the range */
let nextSubnetOctet = 1;

function dockerRun(sessionId, container, networkName) {
  const portArgs = container.ports.map((p) => `-p ${p}`).join(" ");
  const envArgs = Object.entries(container.environment || {})
    .map(([k, v]) => `-e ${k}=${v}`)
    .join(" ");
  const containerName = `lab-${sessionId}-${container.name}`;

  const cmd = [
    "docker run -d",
    `--name ${containerName}`,
    `--network ${networkName}`,
    portArgs,
    envArgs,
    container.image,
  ]
    .filter(Boolean)
    .join(" ");

  console.log(`[runner] docker run: ${cmd}`);
  const containerId = execSync(cmd, { timeout: 120_000 }).toString().trim();
  return { containerId, containerName };
}

function dockerInspectIp(containerName, networkName) {
  try {
    const raw = execSync(
      `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${containerName}`,
      { timeout: 5000 },
    )
      .toString()
      .trim();
    return raw || null;
  } catch {
    return null;
  }
}

function dockerContainerStatus(containerName) {
  try {
    const raw = execSync(
      `docker inspect -f '{{.State.Status}}' ${containerName}`,
      { timeout: 5000 },
    )
      .toString()
      .trim();
    return raw; // "running", "exited", "created", etc.
  } catch {
    return "unknown";
  }
}

function startLab(sessionId, manifest) {
  const subnet =
    manifest.network?.subnet || `10.129.${nextSubnetOctet++}.0/24`;
  const networkName = `lab-${sessionId}`;

  // Create Docker network (--internal blocks outbound by default)
  const isolation = manifest.network?.isolation || "full";
  const internalFlag = isolation === "full" ? "--internal" : "";
  execSync(
    `docker network create ${internalFlag} --subnet=${subnet} ${networkName}`,
    { timeout: 15_000 },
  );

  const containerStatuses = [];
  for (const c of manifest.containers) {
    const { containerId, containerName } = dockerRun(
      sessionId,
      c,
      networkName,
    );
    const ip = dockerInspectIp(containerName, networkName);
    containerStatuses.push({
      name: c.name,
      containerId,
      ip,
      ports: c.ports,
      status: "running",
    });
  }

  activeLabs.set(sessionId, {
    networkName,
    subnet,
    containers: containerStatuses,
  });

  return { labId: sessionId, containers: containerStatuses, subnet };
}

function stopLab(sessionId) {
  const lab = activeLabs.get(sessionId);
  if (!lab) return;

  for (const c of lab.containers) {
    try {
      execSync(`docker rm -f ${c.containerId}`, { timeout: 15_000 });
    } catch {
      /* best effort */
    }
  }
  try {
    execSync(`docker network rm ${lab.networkName}`, { timeout: 15_000 });
  } catch {
    /* best effort */
  }

  activeLabs.delete(sessionId);
}

function getLabStatus(sessionId) {
  const lab = activeLabs.get(sessionId);
  if (!lab) return { labId: sessionId, status: "stopped", containers: [] };

  const containers = lab.containers.map((c) => {
    const containerName = `lab-${sessionId}-${c.name}`;
    const state = dockerContainerStatus(containerName);
    return {
      ...c,
      status: state === "running" ? "running" : state === "exited" ? "stopped" : "error",
    };
  });

  const allStopped = containers.every((c) => c.status !== "running");
  return {
    labId: sessionId,
    status: allStopped ? "stopped" : "running",
    containers,
  };
}

// ---------- HTTP server ----------

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

function respond(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  try {
    // POST /start — start a lab
    if (req.method === "POST" && path === "/start") {
      const body = await parseBody(req);
      const { sessionId, manifest } = body;
      if (!sessionId || !manifest) {
        return respond(res, 400, { error: "sessionId and manifest required" });
      }
      console.log(`[runner] Starting lab ${sessionId}`);
      const result = startLab(sessionId, manifest);
      console.log(`[runner] Lab ${sessionId} started: ${result.containers.length} container(s)`);
      return respond(res, 200, result);
    }

    // POST /stop — stop a lab
    if (req.method === "POST" && path === "/stop") {
      const body = await parseBody(req);
      const { sessionId } = body;
      if (!sessionId) {
        return respond(res, 400, { error: "sessionId required" });
      }
      console.log(`[runner] Stopping lab ${sessionId}`);
      stopLab(sessionId);
      return respond(res, 200, { ok: true });
    }

    // GET /status/:id — lab status
    if (req.method === "GET" && path.startsWith("/status/")) {
      const sessionId = path.slice("/status/".length);
      const status = getLabStatus(sessionId);
      return respond(res, 200, status);
    }

    // GET /health — runner health check
    if (req.method === "GET" && path === "/health") {
      return respond(res, 200, {
        ok: true,
        runnerId: RUNNER_ID,
        activeLabs: activeLabs.size,
        docker: DOCKER_OK,
      });
    }

    respond(res, 404, { error: "not found" });
  } catch (err) {
    console.error(`[runner] Error handling ${req.method} ${path}:`, err);
    respond(res, 500, { error: err.message || "internal error" });
  }
});

server.listen(PORT, () => {
  console.log(`[runner] HTTP server listening on port ${PORT}`);
});

// ---------- Heartbeat registration ----------

async function register() {
  const payload = {
    id: RUNNER_ID,
    hostname: hostname(),
    tailscaleIp: getLocalTailscaleIp(),
    port: PORT,
    arch: RUNNER_ARCH,
    os: RUNNER_OS,
    dockerAvailable: DOCKER_OK,
    hypervAvailable: HYPERV_OK,
    maxRamMb: MAX_RAM_MB,
    maxDiskGb: 0, // not critical for PoC
    subnetRange: SUBNET_RANGE,
  };

  try {
    const res = await fetch(`${SERVER_URL}/api/runner/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      console.log(`[runner] Heartbeat OK`);
    } else {
      const text = await res.text();
      console.warn(`[runner] Heartbeat failed: ${res.status} ${text}`);
    }
  } catch (err) {
    console.warn(`[runner] Heartbeat error: ${err.message}`);
  }
}

function getLocalTailscaleIp() {
  try {
    const out = execSync("tailscale ip -4", { timeout: 5000 }).toString().trim();
    if (out) return out;
  } catch {
    /* not available */
  }
  // Fallback: first non-loopback IPv4
  try {
    for (const ifaces of Object.values(networkInterfaces())) {
      for (const iface of ifaces || []) {
        if (iface.family === "IPv4" && !iface.internal) return iface.address;
      }
    }
  } catch {
    /* ignore */
  }
  return "127.0.0.1";
}

// Register immediately, then every 60s
register();
const heartbeatInterval = setInterval(register, 60_000);

// ---------- Cleanup on exit ----------

function cleanup() {
  console.log(`[runner] Shutting down, stopping ${activeLabs.size} lab(s)…`);
  for (const sessionId of activeLabs.keys()) {
    try {
      stopLab(sessionId);
    } catch {
      /* best effort */
    }
  }
  clearInterval(heartbeatInterval);
  server.close();
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
