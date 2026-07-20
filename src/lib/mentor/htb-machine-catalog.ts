// A curated catalog of retired HackTheBox machines the mentor can recommend.
// `area` aligns with the competency map so recommendations target skill gaps.

export type HtbMachine = {
  id: number;
  name: string;
  os: "Linux" | "Windows" | "FreeBSD" | "Other";
  difficulty: "Easy" | "Medium" | "Hard" | "Insane";
  area: string;
  retired: boolean;
  tags?: string[];
};

export const HTB_MACHINES: HtbMachine[] = [
  // ── Linux & systems ─────────────────────────────────────────────────────
  { id: 1, name: "Lame", os: "Linux", difficulty: "Easy", area: "Linux & systems", retired: true, tags: ["smb", "samba", "cve-2007-2447"] },
  { id: 64, name: "Mirai", os: "Linux", difficulty: "Easy", area: "Linux & systems", retired: true, tags: ["default-creds", "iot", "pi", "data-recovery"] },
  { id: 215, name: "Postman", os: "Linux", difficulty: "Easy", area: "Linux & systems", retired: true, tags: ["redis", "ssh-key-cracking", "webmin", "service-misconfiguration"] },
  { id: 217, name: "Traverxec", os: "Linux", difficulty: "Easy", area: "Linux & systems", retired: true, tags: ["nostromo", "ssh-key-cracking", "journalctl", "gtfobins"] },

  // ── Windows exploitation ─────────────────────────────────────────────────
  { id: 2, name: "Legacy", os: "Windows", difficulty: "Easy", area: "Windows exploitation", retired: true, tags: ["ms08-067", "smb"] },
  { id: 13, name: "Grandpa", os: "Windows", difficulty: "Easy", area: "Windows exploitation", retired: true, tags: ["webdav", "iis6", "cve-2017-7269", "token-impersonation"] },
  { id: 14, name: "Granny", os: "Windows", difficulty: "Easy", area: "Windows exploitation", retired: true, tags: ["webdav", "iis6", "put-upload", "token-kidnapping"] },
  { id: 51, name: "Blue", os: "Windows", difficulty: "Easy", area: "Windows exploitation", retired: true, tags: ["eternalblue", "ms17-010", "smb"] },

  // ── Networking ──────────────────────────────────────────────────────────
  { id: 11, name: "Cronos", os: "Linux", difficulty: "Medium", area: "Networking", retired: true, tags: ["dns-zone-transfer", "sqli", "command-injection", "cron"] },

  // ── Web ─────────────────────────────────────────────────────────────────
  { id: 5, name: "Beep", os: "Linux", difficulty: "Easy", area: "Web", retired: true, tags: ["voip", "elastix", "lfi", "shellshock", "credential-reuse"] },
  { id: 48, name: "Blocky", os: "Linux", difficulty: "Easy", area: "Web", retired: true, tags: ["wordpress", "java-decompilation", "credential-reuse", "sudo"] },
  { id: 108, name: "Shocker", os: "Linux", difficulty: "Easy", area: "Web", retired: true, tags: ["shellshock", "cgi-bin", "sudo"] },
  { id: 118, name: "Bashed", os: "Linux", difficulty: "Easy", area: "Web", retired: true, tags: ["phpbash", "webshell", "directory-enumeration", "cron", "sudo"] },
  { id: 121, name: "Nibbles", os: "Linux", difficulty: "Easy", area: "Web", retired: true, tags: ["nibbleblog", "file-upload", "sudo"] },
  { id: 3, name: "Devel", os: "Windows", difficulty: "Easy", area: "Web", retired: true, tags: ["ftp-anon", "aspx-webshell", "iis", "ms14-058"] },
  { id: 6, name: "Optimum", os: "Windows", difficulty: "Easy", area: "Web", retired: true, tags: ["rejetto-hfs", "rce", "ms16-032"] },
  { id: 144, name: "Jerry", os: "Windows", difficulty: "Easy", area: "Web", retired: true, tags: ["tomcat", "default-creds", "war-deploy"] },
  { id: 177, name: "Netmon", os: "Windows", difficulty: "Easy", area: "Web", retired: true, tags: ["ftp-anon", "prtg", "credential-reuse"] },
  { id: 111, name: "Sense", os: "FreeBSD", difficulty: "Easy", area: "Web", retired: true, tags: ["pfsense", "directory-fuzzing", "authenticated-rce"] },
  { id: 7, name: "Bastard", os: "Windows", difficulty: "Medium", area: "Web", retired: true, tags: ["drupal", "rce"] },
  { id: 9, name: "Arctic", os: "Windows", difficulty: "Easy", area: "Web", retired: true, tags: ["coldfusion", "directory-traversal"] },
  { id: 127, name: "Valentine", os: "Linux", difficulty: "Easy", area: "Web", retired: true, tags: ["heartbleed", "openssl", "tmux"] },
  { id: 132, name: "Poison", os: "FreeBSD", difficulty: "Medium", area: "Web", retired: true, tags: ["lfi", "log-poisoning", "vnc"] },
  { id: 222, name: "OpenAdmin", os: "Linux", difficulty: "Easy", area: "Web", retired: true, tags: ["opennetadmin", "nano", "sudo"] },
  { id: 481, name: "Photobomb", os: "Linux", difficulty: "Easy", area: "Web", retired: true, tags: ["command-injection", "path-hijacking", "sudo"] },
  { id: 513, name: "Precious", os: "Linux", difficulty: "Easy", area: "Web", retired: true, tags: ["pdfkit", "ruby", "yaml-deserialization"] },

  // ── Active Directory ────────────────────────────────────────────────────
  { id: 148, name: "Active", os: "Windows", difficulty: "Easy", area: "Active Directory", retired: true, tags: ["kerberoasting", "gpp", "smb"] },
  { id: 212, name: "Forest", os: "Windows", difficulty: "Easy", area: "Active Directory", retired: true, tags: ["as-rep-roasting", "dcsync", "exchange", "writedacl"] },
  { id: 220, name: "Resolute", os: "Windows", difficulty: "Medium", area: "Active Directory", retired: true, tags: ["password-spray", "dll-injection", "dns-admin"] },
  { id: 229, name: "Sauna", os: "Windows", difficulty: "Easy", area: "Active Directory", retired: true, tags: ["as-rep-roasting", "winrm", "autologon", "dcsync"] },
  { id: 235, name: "Cascade", os: "Windows", difficulty: "Medium", area: "Active Directory", retired: true, tags: ["ldap", "tightvnc", "ad-recycle-bin", "dotnet-reversing"] },

  // ── Reverse engineering & binary ────────────────────────────────────────
  { id: 15, name: "October", os: "Linux", difficulty: "Medium", area: "Reverse engineering & binary", retired: true, tags: ["buffer-overflow", "october-cms", "ret2libc", "suid"] },
  { id: 199, name: "Safe", os: "Linux", difficulty: "Easy", area: "Reverse engineering & binary", retired: true, tags: ["rop", "buffer-overflow", "keepass"] },

  // ── Crypto & forensics basics ───────────────────────────────────────────
  { id: 163, name: "Irked", os: "Linux", difficulty: "Easy", area: "Crypto & forensics basics", retired: true, tags: ["unrealircd", "steganography", "suid"] },
  { id: 195, name: "Haystack", os: "Linux", difficulty: "Easy", area: "Crypto & forensics basics", retired: true, tags: ["elasticsearch", "kibana", "logstash"] },
];

export function getHtbMachine(name: string): HtbMachine | undefined {
  return HTB_MACHINES.find(m => m.name.toLowerCase() === name.toLowerCase());
}

export function htbMachineLink(name: string): string {
  return `https://app.hackthebox.com/machines/${name}`;
}
