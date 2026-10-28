/**
 * Shared types for the lab runner agent.
 */

/** Capabilities reported by the runner during registration. */
export interface RunnerCapabilities {
  runnerId: string;
  arch: string;
  platform: string;
  hostname: string;
  totalMemoryMB: number;
  dockerAvailable: boolean;
  dockerVersion?: string;
  listenPort: number;
  registeredAt: string;
}

/** A single container definition within a lab. */
export interface ContainerConfig {
  name: string;
  image: string;
  ports?: string[]; // "hostPort:containerPort" format
  environment?: Record<string, string>;
  healthcheck?: { path: string; interval: string };
}

/** Network configuration for a lab. */
export interface NetworkConfig {
  subnet: string; // e.g. "10.129.1.0/24"
  isolation: "full" | "partial" | "none";
}

/** Full lab configuration sent by the LMS server. */
export interface LabConfig {
  labId: string;
  containers: ContainerConfig[];
  network: NetworkConfig;
  ttlMinutes: number;
}

/** Status of a single container. */
export interface ContainerStatus {
  name: string;
  running: boolean;
  ip: string;
  ports: string[];
  uptime: string;
  health: string;
}

/** Status of an entire lab. */
export interface LabStatus {
  labId: string;
  running: boolean;
  containers: ContainerStatus[];
  networkName: string;
  createdAt: string;
}

/** Result of starting a lab. */
export interface LabStartResult {
  labId: string;
  containers: Array<{
    name: string;
    ip: string;
    ports: string[];
  }>;
}

/** Parsed CLI arguments for the runner. */
export interface RunnerArgs {
  server: string;
  token: string;
  port: number;
  id: string;
}
