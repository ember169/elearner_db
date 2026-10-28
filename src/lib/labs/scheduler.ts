import { getOnlineRunners, getActiveLabSessions } from "./store";
import type { Runner, LabRequirements } from "./types";

/**
 * Pick the best available runner for a lab based on its requirements.
 *
 * 1. Only consider runners that are currently online (heartbeat < 90s).
 * 2. Filter by hard requirements: architecture, runtime (Docker/Hyper-V), RAM.
 * 3. Estimate remaining capacity (maxRamMb minus RAM used by active labs).
 * 4. Return the runner with the most remaining capacity, or null.
 */
export function pickRunner(
  requirements?: LabRequirements,
): Runner | null {
  const online = getOnlineRunners();
  if (online.length === 0) return null;

  const activeLabs = getActiveLabSessions();

  // RAM used per runner (from active lab manifests)
  const usedRam = new Map<string, number>();
  for (const lab of activeLabs) {
    try {
      const manifest = JSON.parse(lab.labManifest);
      const ramNeeded = manifest.requirements?.ramMb ?? 512;
      usedRam.set(lab.runnerId, (usedRam.get(lab.runnerId) ?? 0) + ramNeeded);
    } catch {
      // Malformed manifest — assume 512 MB.
      usedRam.set(lab.runnerId, (usedRam.get(lab.runnerId) ?? 0) + 512);
    }
  }

  const eligible = online.filter((r) => {
    if (!requirements) return r.dockerAvailable;

    // Architecture check
    if (requirements.arch !== "multi" && requirements.arch !== r.arch) {
      return false;
    }

    // Runtime check
    if (requirements.runtime === "docker" && !r.dockerAvailable) return false;
    if (requirements.runtime === "hyperv" && !r.hypervAvailable) return false;

    // RAM check
    const available = (r.maxRamMb ?? 0) - (usedRam.get(r.id) ?? 0);
    if (available < (requirements.ramMb ?? 0)) return false;

    return true;
  });

  if (eligible.length === 0) return null;

  // Sort by most remaining capacity
  eligible.sort((a, b) => {
    const aFree = (a.maxRamMb ?? 0) - (usedRam.get(a.id) ?? 0);
    const bFree = (b.maxRamMb ?? 0) - (usedRam.get(b.id) ?? 0);
    return bFree - aFree;
  });

  return eligible[0];
}
