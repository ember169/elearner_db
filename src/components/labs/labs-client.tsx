"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Server,
  Play,
  Square,
  ExternalLink,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  Container,
  Cpu,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Runner, LabSession, ContainerStatus } from "@/lib/labs/types";

// ---------- Test lab manifest ----------

const TEST_LAB = {
  labId: "test-connectivity",
  name: "Connectivity Test",
  description: "A simple nginx container to validate the runner ↔ server pipeline.",
  containers: [
    {
      name: "target",
      image: "nginx:alpine",
      ports: ["80:80"],
      environment: {},
    },
  ],
  network: {
    subnet: "10.129.1.0/24",
    isolation: "full" as const,
  },
  ttlMinutes: 30,
};

// ---------- Helpers ----------

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

function timeLeft(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "expired";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m left`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m left`;
}

// ---------- Component ----------

interface LabsClientProps {
  initialSessions: LabSession[];
  initialRunners: Runner[];
}

export function LabsClient({ initialSessions, initialRunners }: LabsClientProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [runners, setRunners] = useState(initialRunners);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/labs");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
        setRunners(data.runners);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Auto-refresh every 10s
  useEffect(() => {
    const iv = setInterval(refresh, 10_000);
    return () => clearInterval(iv);
  }, [refresh]);

  async function startTestLab() {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/labs/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manifest: TEST_LAB }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
      } else {
        await refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start lab");
    } finally {
      setStarting(false);
    }
  }

  async function stopLab(id: string) {
    try {
      await fetch(`/api/labs/${id}`, { method: "DELETE" });
      await refresh();
    } catch {
      /* ignore */
    }
  }

  const onlineRunners = runners.filter((r) => {
    const elapsed = Date.now() - new Date(r.lastHeartbeat).getTime();
    return elapsed < 90_000;
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pb-24 md:pb-4">
      <h1 className="cb-content-title text-cb-title text-cb-text">Labs</h1>

      {/* ---- Runners panel ---- */}
      <section>
        <h2 className="cb-label-mono mb-3 text-cb-caption text-cb-muted">
          Runners ({onlineRunners.length} online / {runners.length} registered)
        </h2>

        {runners.length === 0 ? (
          <div className="rounded-cb-card border border-dashed border-cb-line px-4 py-8 text-center font-cb-sans text-cb-foot text-cb-muted">
            No runners registered yet. Start a runner agent on your desktop or laptop.
          </div>
        ) : (
          <div className="space-y-2">
            {runners.map((r) => {
              const online =
                Date.now() - new Date(r.lastHeartbeat).getTime() < 90_000;
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-cb-card border border-cb-line bg-cb-card p-3"
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full",
                      online ? "bg-cb-ok-tint" : "bg-cb-raised",
                    )}
                  >
                    {online ? (
                      <Wifi className="h-4 w-4 text-cb-success" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-cb-muted" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-cb-sans text-cb-foot font-medium text-cb-text">
                      {r.hostname}{" "}
                      <span className="font-cb-mono text-cb-caption text-cb-muted">
                        {r.tailscaleIp}:{r.port}
                      </span>
                    </p>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0 font-cb-mono text-cb-caption text-cb-muted">
                      <span className="flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        {r.arch}/{r.os}
                      </span>
                      {r.dockerAvailable && (
                        <span className="flex items-center gap-1">
                          <Container className="h-3 w-3" />
                          Docker
                        </span>
                      )}
                      {r.hypervAvailable && (
                        <span className="flex items-center gap-1">
                          <Server className="h-3 w-3" />
                          Hyper-V
                        </span>
                      )}
                      {r.maxRamMb && (
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {Math.round(r.maxRamMb / 1024)} GB
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="font-cb-mono text-cb-caption text-cb-muted">
                    {timeAgo(r.lastHeartbeat)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ---- Start test lab ---- */}
      <section>
        <h2 className="cb-label-mono mb-3 text-cb-caption text-cb-muted">
          Test Environment
        </h2>
        <div className="rounded-cb-card border border-cb-line bg-cb-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-cb-sans text-cb-foot font-medium text-cb-text">
                {TEST_LAB.name}
              </p>
              <p className="mt-0.5 font-cb-sans text-cb-caption text-cb-second">
                {TEST_LAB.description}
              </p>
              <p className="mt-1 font-cb-mono text-cb-caption text-cb-muted">
                {TEST_LAB.containers[0].image} · TTL {TEST_LAB.ttlMinutes}m ·
                subnet {TEST_LAB.network.subnet}
              </p>
            </div>
            <button
              onClick={startTestLab}
              disabled={starting || onlineRunners.length === 0}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-cb-chip-sm px-3 py-1.5 font-cb-mono text-cb-caption font-medium transition-colors",
                onlineRunners.length === 0
                  ? "bg-cb-raised text-cb-muted cursor-not-allowed"
                  : "bg-cb-or-tint text-cb-or hover:bg-cb-or hover:text-white",
              )}
            >
              {starting ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {starting ? "Starting…" : "Start Lab"}
            </button>
          </div>

          {error && (
            <div className="mt-3 rounded-cb-card bg-cb-danger-tint px-3 py-2 font-cb-sans text-cb-foot text-cb-danger">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* ---- Active lab sessions ---- */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="cb-label-mono text-cb-caption text-cb-muted">
            Active Labs ({sessions.length})
          </h2>
          <button
            onClick={refresh}
            className="flex items-center gap-1 rounded-cb-chip-sm px-2 py-1 font-cb-mono text-cb-caption text-cb-muted transition-colors hover:bg-cb-raised hover:text-cb-text"
          >
            <RefreshCw className="h-3 w-3" /> refresh
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-cb-card border border-dashed border-cb-line px-4 py-8 text-center font-cb-sans text-cb-foot text-cb-muted">
            No active labs. Start one above.
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const manifest = (() => {
                try {
                  return JSON.parse(s.labManifest);
                } catch {
                  return null;
                }
              })();
              const containers: ContainerStatus[] = (() => {
                try {
                  return JSON.parse(s.containersJson ?? "[]");
                } catch {
                  return [];
                }
              })();
              const runner = runners.find((r) => r.id === s.runnerId);

              return (
                <div
                  key={s.id}
                  className="rounded-cb-card border border-cb-line bg-cb-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-cb-sans text-cb-foot font-medium text-cb-text">
                          {manifest?.name || s.id}
                        </p>
                        <span
                          className={cn(
                            "cb-label-mono shrink-0 rounded-cb-chip-sm px-2 py-0.5 text-cb-caption",
                            s.status === "running"
                              ? "bg-cb-ok-tint text-cb-success"
                              : s.status === "starting"
                                ? "bg-cb-or-tint text-cb-or"
                                : s.status === "error"
                                  ? "bg-cb-danger-tint text-cb-danger"
                                  : "bg-cb-raised text-cb-muted",
                          )}
                        >
                          {s.status}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0 font-cb-mono text-cb-caption text-cb-muted">
                        {runner && (
                          <span>
                            on {runner.hostname} ({runner.tailscaleIp})
                          </span>
                        )}
                        {s.subnet && <span>subnet {s.subnet}</span>}
                        {s.expiresAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeLeft(s.expiresAt)}
                          </span>
                        )}
                      </div>

                      {/* Container details */}
                      {containers.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {containers.map((c) => (
                            <div
                              key={c.name}
                              className="flex items-center gap-2 font-cb-mono text-cb-caption"
                            >
                              <Container className="h-3 w-3 text-cb-muted" />
                              <span className="text-cb-text">{c.name}</span>
                              {c.ip && (
                                <span className="text-cb-second">{c.ip}</span>
                              )}
                              {c.ports.map((p) => (
                                <span key={p} className="text-cb-muted">
                                  :{p}
                                </span>
                              ))}
                              {c.ip && (
                                <a
                                  href={`http://${c.ip}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-0.5 text-cb-or hover:underline"
                                >
                                  open
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {s.errorMessage && (
                        <p className="mt-2 font-cb-sans text-cb-foot text-cb-danger">
                          {s.errorMessage}
                        </p>
                      )}
                    </div>

                    {(s.status === "running" || s.status === "starting") && (
                      <button
                        onClick={() => stopLab(s.id)}
                        className="flex shrink-0 items-center gap-1.5 rounded-cb-chip-sm bg-cb-raised px-3 py-1.5 font-cb-mono text-cb-caption font-medium text-cb-muted transition-colors hover:bg-cb-danger-tint hover:text-cb-danger"
                      >
                        <Square className="h-3.5 w-3.5" />
                        Stop
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
