import * as os from "node:os";
import * as https from "node:https";
import * as http from "node:http";
import { checkDocker } from "./docker.js";
import { createServer } from "./server.js";
import type { RunnerArgs, RunnerCapabilities } from "./types.js";

// ──────────────────────────────────────────────
// CLI argument parsing
// ──────────────────────────────────────────────

function parseArgs(): RunnerArgs {
  const args = process.argv.slice(2);
  const map = new Map<string, string>();

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && i + 1 < args.length) {
      map.set(args[i].slice(2), args[i + 1]);
      i++; // skip the value
    }
  }

  const server = map.get("server");
  const token = map.get("token");

  if (!server) {
    console.error("Error: --server <url> is required");
    console.error("Usage: npm start -- --server https://... --token <secret> [--port 7500] [--id myrunner]");
    process.exit(1);
  }

  if (!token) {
    console.error("Error: --token <secret> is required");
    console.error("Usage: npm start -- --server https://... --token <secret> [--port 7500] [--id myrunner]");
    process.exit(1);
  }

  return {
    server: server.replace(/\/$/, ""), // strip trailing slash
    token,
    port: parseInt(map.get("port") ?? "7500", 10),
    id: map.get("id") ?? os.hostname(),
  };
}

// ──────────────────────────────────────────────
// Capability detection
// ──────────────────────────────────────────────

function detectCapabilities(args: RunnerArgs): RunnerCapabilities {
  console.log("[init] Detecting capabilities...");

  const docker = checkDocker();
  const totalMemoryMB = Math.round(os.totalmem() / 1024 / 1024);

  const caps: RunnerCapabilities = {
    runnerId: args.id,
    arch: process.arch,
    platform: process.platform,
    hostname: os.hostname(),
    totalMemoryMB,
    dockerAvailable: docker.available,
    dockerVersion: docker.version,
    listenPort: args.port,
    registeredAt: new Date().toISOString(),
  };

  console.log(`[init]   Runner ID:  ${caps.runnerId}`);
  console.log(`[init]   Arch:       ${caps.arch}`);
  console.log(`[init]   Platform:   ${caps.platform}`);
  console.log(`[init]   Hostname:   ${caps.hostname}`);
  console.log(`[init]   Memory:     ${caps.totalMemoryMB} MB`);
  console.log(`[init]   Docker:     ${caps.dockerAvailable ? `yes (${caps.dockerVersion})` : "NOT AVAILABLE"}`);
  console.log(`[init]   Port:       ${caps.listenPort}`);

  if (!docker.available) {
    console.warn("[init]   WARNING: Docker is not available. Lab commands will fail.");
  }

  return caps;
}

// ──────────────────────────────────────────────
// Registration & heartbeat
// ──────────────────────────────────────────────

function postToServer(
  serverUrl: string,
  path: string,
  token: string,
  body: Record<string, unknown>
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, serverUrl);
    const payload = JSON.stringify(body);

    const options: https.RequestOptions = {
      method: "POST",
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        Authorization: `Bearer ${token}`,
      },
      // Allow self-signed certs for PoC setups
      rejectUnauthorized: false,
    };

    const transport = url.protocol === "https:" ? https : http;
    const req = transport.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode ?? 0,
          body: Buffer.concat(chunks).toString("utf-8"),
        });
      });
    });

    req.on("error", (err) => reject(err));
    req.setTimeout(10_000, () => {
      req.destroy(new Error("Request timed out"));
    });
    req.write(payload);
    req.end();
  });
}

async function register(
  serverUrl: string,
  token: string,
  capabilities: RunnerCapabilities
): Promise<void> {
  console.log(`[register] Registering with ${serverUrl}/api/runner/register ...`);
  try {
    const resp = await postToServer(serverUrl, "/api/runner/register", token, capabilities as unknown as Record<string, unknown>);
    if (resp.status >= 200 && resp.status < 300) {
      console.log(`[register] Registered successfully (HTTP ${resp.status})`);
    } else {
      console.warn(`[register] Server responded with HTTP ${resp.status}: ${resp.body}`);
    }
  } catch (err: any) {
    console.error(`[register] Failed to contact server: ${err.message}`);
    console.error("[register] The runner will keep trying via heartbeats.");
  }
}

function startHeartbeat(
  serverUrl: string,
  token: string,
  capabilities: RunnerCapabilities
): NodeJS.Timeout {
  const INTERVAL_MS = 60_000;

  console.log(`[heartbeat] Sending heartbeats every ${INTERVAL_MS / 1000}s`);

  return setInterval(async () => {
    try {
      const payload = {
        ...capabilities,
        registeredAt: new Date().toISOString(),
        uptime: process.uptime(),
      };
      const resp = await postToServer(serverUrl, "/api/runner/register", token, payload as unknown as Record<string, unknown>);
      if (resp.status >= 200 && resp.status < 300) {
        console.log(`[heartbeat] OK (HTTP ${resp.status})`);
      } else {
        console.warn(`[heartbeat] Server responded HTTP ${resp.status}`);
      }
    } catch (err: any) {
      console.error(`[heartbeat] Failed: ${err.message}`);
    }
  }, INTERVAL_MS);
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("===================================");
  console.log("  eLearner Lab Runner Agent v0.1  ");
  console.log("===================================\n");

  const args = parseArgs();
  console.log(`[init] LMS Server:  ${args.server}`);
  console.log(`[init] Runner ID:   ${args.id}`);
  console.log(`[init] Listen Port: ${args.port}\n`);

  // 1. Detect capabilities
  const capabilities = detectCapabilities(args);
  console.log();

  // 2. Register with the LMS server
  await register(args.server, args.token, capabilities);
  console.log();

  // 3. Start heartbeat
  const heartbeatTimer = startHeartbeat(args.server, args.token, capabilities);

  // 4. Start HTTP command server
  const server = createServer(args.port, args.token);

  // Graceful shutdown
  const shutdown = () => {
    console.log("\n[shutdown] Shutting down...");
    clearInterval(heartbeatTimer);
    server.close(() => {
      console.log("[shutdown] Server closed. Goodbye.");
      process.exit(0);
    });
    // Force exit after 5 seconds if server doesn't close
    setTimeout(() => process.exit(0), 5_000);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
