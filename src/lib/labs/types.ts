// ---------- Runner ----------

export interface RunnerRegistration {
  id: string;
  hostname: string;
  tailscaleIp: string;
  port: number;
  arch: "amd64" | "arm64";
  os: "linux" | "darwin" | "windows";
  dockerAvailable: boolean;
  hypervAvailable: boolean;
  maxRamMb: number;
  maxDiskGb: number;
  subnetRange: string | null;
}

export interface Runner extends RunnerRegistration {
  lastHeartbeat: string;
  status: "online" | "offline" | "busy";
  createdAt: string;
}

// ---------- Lab manifest ----------

export interface LabContainer {
  name: string;
  image: string;
  ports: string[]; // "host:container"
  environment: Record<string, string>;
}

export interface LabNetwork {
  subnet: string;
  isolation: "full" | "partial" | "none";
  allowedHosts?: string[];
}

export interface LabManifest {
  labId: string;
  name?: string;
  description?: string;
  requirements?: LabRequirements;
  containers: LabContainer[];
  network: LabNetwork;
  ttlMinutes: number;
}

export interface LabRequirements {
  arch: "multi" | "amd64" | "arm64";
  runtime: "docker" | "hyperv" | "qemu";
  ramMb: number;
  diskMb?: number;
  needsInternet?: boolean;
}

// ---------- Lab session ----------

export interface ContainerStatus {
  name: string;
  containerId?: string;
  ip?: string;
  ports: string[];
  status: "creating" | "running" | "stopped" | "error";
}

export interface LabSession {
  id: string;
  runnerId: string;
  labManifest: string; // JSON
  status: "starting" | "running" | "stopping" | "stopped" | "error";
  subnet: string | null;
  containersJson: string | null; // JSON ContainerStatus[]
  errorMessage: string | null;
  ttlMinutes: number | null;
  startedAt: string;
  expiresAt: string | null;
  stoppedAt: string | null;
}

export interface NewLabSession {
  id: string;
  runnerId: string;
  labManifest: string;
  status: LabSession["status"];
  subnet: string | null;
  containersJson: string | null;
  ttlMinutes: number;
  expiresAt: string | null;
}

// ---------- Runner API responses ----------

export interface RunnerStartResponse {
  labId: string;
  containers: ContainerStatus[];
  subnet: string;
}

export interface RunnerStatusResponse {
  labId: string;
  status: "running" | "stopped" | "error";
  containers: ContainerStatus[];
  error?: string;
}
