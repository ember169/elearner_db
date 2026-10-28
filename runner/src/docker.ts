import { execSync } from "node:child_process";
import type {
  LabConfig,
  LabStartResult,
  LabStatus,
  ContainerStatus,
} from "./types.js";

/**
 * Execute a shell command and return trimmed stdout.
 * Throws on non-zero exit.
 */
function exec(cmd: string): string {
  return execSync(cmd, { encoding: "utf-8", timeout: 60_000 }).trim();
}

/**
 * Execute a shell command, returning null on failure instead of throwing.
 */
function execSafe(cmd: string): string | null {
  try {
    return exec(cmd);
  } catch {
    return null;
  }
}

/** Prefix used for all lab-related Docker resources. */
const PREFIX = "lab";

function networkName(labId: string): string {
  return `${PREFIX}-${labId}`;
}

function containerName(labId: string, name: string): string {
  return `${PREFIX}-${labId}-${name}`;
}

// ──────────────────────────────────────────────
// Docker availability check
// ──────────────────────────────────────────────

export function checkDocker(): { available: boolean; version?: string } {
  const info = execSafe("docker info --format '{{.ServerVersion}}'");
  if (info) {
    return { available: true, version: info.replace(/'/g, "") };
  }
  return { available: false };
}

// ──────────────────────────────────────────────
// Lab lifecycle
// ──────────────────────────────────────────────

/**
 * Start a lab: create an isolated Docker network then launch all containers.
 */
export function startLab(config: LabConfig): LabStartResult {
  const { labId, containers, network } = config;
  const netName = networkName(labId);

  console.log(`[docker] Creating network ${netName} (${network.subnet})`);

  // Build network create command
  const internalFlag = network.isolation !== "none" ? "--internal" : "";
  exec(
    `docker network create ${internalFlag} --subnet=${network.subnet} ${netName}`
  );

  const results: LabStartResult["containers"] = [];

  // Derive per-container IP addresses from the subnet (start at .10)
  const subnetBase = network.subnet.replace(/\.\d+\/\d+$/, "");

  for (let i = 0; i < containers.length; i++) {
    const c = containers[i];
    const cName = containerName(labId, c.name);
    const ip = `${subnetBase}.${10 + i}`;

    console.log(`[docker] Starting container ${cName} (${c.image}) at ${ip}`);

    let cmd = `docker run -d --name ${cName} --network ${netName} --ip ${ip}`;

    // Port mappings
    if (c.ports && c.ports.length > 0) {
      for (const p of c.ports) {
        cmd += ` -p ${p}`;
      }
    }

    // Environment variables
    if (c.environment) {
      for (const [key, val] of Object.entries(c.environment)) {
        cmd += ` -e ${key}=${val}`;
      }
    }

    cmd += ` ${c.image}`;
    exec(cmd);

    // Read back the assigned IP (in case Docker adjusted it)
    const assignedIp =
      execSafe(
        `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${cName}`
      )?.replace(/'/g, "") ?? ip;

    results.push({
      name: c.name,
      ip: assignedIp,
      ports: c.ports ?? [],
    });
  }

  console.log(`[docker] Lab ${labId} started with ${results.length} container(s)`);
  return { labId, containers: results };
}

/**
 * Stop a lab: stop & remove all containers, then remove the network.
 */
export function stopLab(labId: string): void {
  console.log(`[docker] Stopping lab ${labId}`);

  // Discover containers on the lab network
  const netName = networkName(labId);
  const running = execSafe(
    `docker ps -a --filter "network=${netName}" --format "{{.Names}}"`
  );

  if (running) {
    for (const name of running.split("\n").filter(Boolean)) {
      console.log(`[docker]   stopping ${name}`);
      execSafe(`docker stop ${name}`);
      execSafe(`docker rm -f ${name}`);
    }
  }

  execSafe(`docker network rm ${netName}`);
  console.log(`[docker] Lab ${labId} stopped`);
}

/**
 * Reset a lab: stop then start with the given config.
 */
export function resetLab(labId: string, config: LabConfig): LabStartResult {
  stopLab(labId);
  return startLab(config);
}

/**
 * Get status of a single lab.
 */
export function getLabStatus(labId: string): LabStatus | null {
  const netName = networkName(labId);

  // Check if the network exists
  const netExists = execSafe(`docker network inspect ${netName}`);
  if (!netExists) {
    return null;
  }

  const running = execSafe(
    `docker ps -a --filter "network=${netName}" --format "{{.Names}}"`
  );

  const containers: ContainerStatus[] = [];

  if (running) {
    for (const name of running.split("\n").filter(Boolean)) {
      const inspectJson = execSafe(
        `docker inspect --format '{{json .}}' ${name}`
      );
      if (!inspectJson) continue;

      try {
        // Remove surrounding quotes that some shells add
        const cleaned = inspectJson.replace(/^'|'$/g, "");
        const info = JSON.parse(cleaned);
        const state = info.State ?? {};
        const nets = info.NetworkSettings?.Networks ?? {};

        // Find the IP on the lab network
        let ip = "";
        for (const [, v] of Object.entries(nets) as [string, any][]) {
          if (v?.IPAddress) {
            ip = v.IPAddress;
            break;
          }
        }

        // Extract published ports
        const portBindings = info.HostConfig?.PortBindings ?? {};
        const ports: string[] = [];
        for (const [containerPort, bindings] of Object.entries(portBindings) as [
          string,
          any
        ][]) {
          if (Array.isArray(bindings)) {
            for (const b of bindings) {
              ports.push(`${b.HostPort}:${containerPort.replace("/tcp", "")}`);
            }
          }
        }

        // Derive a short container label (strip the lab prefix)
        const shortName = name.replace(`${PREFIX}-${labId}-`, "");

        containers.push({
          name: shortName,
          running: state.Running === true,
          ip,
          ports,
          uptime: state.Running ? state.StartedAt ?? "unknown" : "stopped",
          health: state.Health?.Status ?? (state.Running ? "running" : "stopped"),
        });
      } catch {
        // If we can't parse inspect output, add a minimal entry
        containers.push({
          name,
          running: false,
          ip: "",
          ports: [],
          uptime: "unknown",
          health: "unknown",
        });
      }
    }
  }

  return {
    labId,
    running: containers.some((c) => c.running),
    containers,
    networkName: netName,
    createdAt: new Date().toISOString(),
  };
}

/**
 * List all running labs by inspecting Docker networks with the lab prefix.
 */
export function listLabs(): LabStatus[] {
  const networks = execSafe(
    `docker network ls --filter "name=${PREFIX}-" --format "{{.Name}}"`
  );

  if (!networks) return [];

  const labs: LabStatus[] = [];
  for (const netName of networks.split("\n").filter(Boolean)) {
    // Extract labId from network name "lab-{labId}"
    const labId = netName.replace(`${PREFIX}-`, "");
    const status = getLabStatus(labId);
    if (status) {
      labs.push(status);
    }
  }

  return labs;
}
