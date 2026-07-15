// Starter reference table mapping TryHackMe room codes to a topic category.
//
// TryHackMe doesn't expose clean per-room skill tags anywhere reachable
// (not on the completed-rooms API, not on individual room pages, not in
// their "Room Info" panel) — only title, description and difficulty are
// available. So unlike the Root-me categories (which come straight from
// their API), these are hand-classified from each room's real title and
// description, the same way FT_COMMON_CORE's skill lists were curated.
//
// Categories match the existing THM/HTB keys already wired into
// PLATFORM_SKILL_MAPPING in ft-project-tree.ts: web, crypto, forensics,
// reverse, pwn, misc, osint, steganography.
//
// This is intentionally a starter set of well-known, verified room codes,
// not an exhaustive catalog — TryHackMe has 1000+ rooms. Unmapped rooms
// just fall back to uncategorized rather than breaking anything. Extend
// this table as more rooms turn up in synced user data.
export const THM_ROOM_CATEGORIES: Record<string, string> = {
  // Web
  mrrobot: "web", // WordPress exploitation + privesc
  picklerick: "web", // Command injection in a web app
  owasptop10: "web", // OWASP Top 10 vulnerabilities

  // General exploitation / mixed enumeration+privesc ("misc")
  vulnversity: "misc", // Enumeration, file upload vuln, privesc
  kenobi: "misc", // Samba exploitation + Linux privesc
  blue: "misc", // EternalBlue/MS17-010 SMB exploitation
  ice: "misc", // Service misconfig exploitation + Windows privesc

  // Crypto
  crackthehash: "crypto", // Hash identification & cracking
  encryptioncrypto101: "crypto", // Encryption/cryptography fundamentals

  // Forensics
  autopsy: "forensics", // Digital forensics with the Autopsy tool

  // OSINT
  silverplatter: "osint", // Open-source intelligence gathering
};
