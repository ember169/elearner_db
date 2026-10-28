import * as http from "node:http";
import {
  startLab,
  stopLab,
  resetLab,
  getLabStatus,
  listLabs,
} from "./docker.js";
import type { LabConfig } from "./types.js";

/**
 * Parse the request body as JSON. Returns null on failure.
 */
function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf-8");
        resolve(raw ? JSON.parse(raw) : null);
      } catch {
        resolve(null);
      }
    });
    req.on("error", () => resolve(null));
  });
}

/**
 * Send a JSON response.
 */
function json(
  res: http.ServerResponse,
  status: number,
  body: Record<string, unknown>
): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

/**
 * Extract the path and method from a request. Handles /status/:labId patterns.
 */
function parseRoute(req: http.IncomingMessage): {
  method: string;
  path: string;
  param?: string;
} {
  const method = (req.method ?? "GET").toUpperCase();
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const path = url.pathname;

  // Match /status/:labId
  const statusMatch = path.match(/^\/status\/(.+)$/);
  if (statusMatch) {
    return { method, path: "/status/:labId", param: statusMatch[1] };
  }

  return { method, path };
}

/**
 * Create and start the HTTP command server.
 */
export function createServer(
  port: number,
  token: string
): http.Server {
  const server = http.createServer(async (req, res) => {
    const { method, path, param } = parseRoute(req);

    // Auth check (skip for /health so load balancers can probe)
    if (path !== "/health") {
      const authHeader = req.headers.authorization ?? "";
      const expected = `Bearer ${token}`;
      if (authHeader !== expected) {
        console.log(`[server] 401 Unauthorized: ${method} ${req.url}`);
        json(res, 401, { error: "Unauthorized" });
        return;
      }
    }

    console.log(`[server] ${method} ${req.url}`);

    try {
      // ── POST /start ────────────────────────
      if (method === "POST" && path === "/start") {
        const body = await parseBody(req) as LabConfig | null;
        if (!body || !body.labId || !body.containers || !body.network) {
          json(res, 400, { error: "Invalid LabConfig: labId, containers, and network are required" });
          return;
        }
        const result = startLab(body);
        json(res, 200, result as unknown as Record<string, unknown>);
        return;
      }

      // ── POST /stop ─────────────────────────
      if (method === "POST" && path === "/stop") {
        const body = await parseBody(req) as { labId?: string } | null;
        if (!body || !body.labId) {
          json(res, 400, { error: "Missing labId" });
          return;
        }
        stopLab(body.labId);
        json(res, 200, { ok: true, labId: body.labId });
        return;
      }

      // ── POST /reset ────────────────────────
      if (method === "POST" && path === "/reset") {
        const body = await parseBody(req) as { labId?: string; config?: LabConfig } | null;
        if (!body || !body.labId || !body.config) {
          json(res, 400, { error: "Missing labId or config" });
          return;
        }
        const result = resetLab(body.labId, body.config);
        json(res, 200, result as unknown as Record<string, unknown>);
        return;
      }

      // ── GET /status/:labId ─────────────────
      if (method === "GET" && path === "/status/:labId" && param) {
        const status = getLabStatus(param);
        if (!status) {
          json(res, 404, { error: `Lab ${param} not found` });
          return;
        }
        json(res, 200, status as unknown as Record<string, unknown>);
        return;
      }

      // ── GET /labs ──────────────────────────
      if (method === "GET" && path === "/labs") {
        const labs = listLabs();
        json(res, 200, { labs } as unknown as Record<string, unknown>);
        return;
      }

      // ── GET /health ────────────────────────
      if (method === "GET" && path === "/health") {
        json(res, 200, { status: "ok", uptime: process.uptime() });
        return;
      }

      // ── Not found ──────────────────────────
      json(res, 404, { error: `Unknown route: ${method} ${req.url}` });
    } catch (err: any) {
      console.error(`[server] Error handling ${method} ${req.url}:`, err.message);
      json(res, 500, { error: err.message ?? "Internal server error" });
    }
  });

  server.listen(port, () => {
    console.log(`[server] Listening on port ${port}`);
  });

  return server;
}
