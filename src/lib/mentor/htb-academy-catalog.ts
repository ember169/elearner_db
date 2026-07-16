// A curated catalog of HackTheBox Academy modules the mentor can recommend FROM
// (rather than inventing module names). `area` loosely aligns with the competency
// map so recommendations can target gaps. `path` indicates the primary HTB learning
// path the module belongs to. Not exhaustive — HTB Academy has 100+ modules; extend
// as needed.

export type HtbModule = {
  id: string;
  name: string;
  area: string;
  tier: "Fundamental" | "Easy" | "Medium" | "Hard";
  path?: string;
};

export const HTB_ACADEMY_MODULES: HtbModule[] = [
  // ── Foundations ──────────────────────────────────────────────────────────
  { id: "linux-fundamentals", name: "Linux Fundamentals", area: "Linux & systems", tier: "Fundamental", path: "Penetration Tester" },
  { id: "windows-fundamentals", name: "Windows Fundamentals", area: "Windows internals & maldev", tier: "Fundamental", path: "Penetration Tester" },
  { id: "intro-to-networking", name: "Introduction to Networking", area: "Networking", tier: "Fundamental", path: "Penetration Tester" },
  { id: "intro-bash-scripting", name: "Introduction to Bash Scripting", area: "Scripting & automation", tier: "Easy", path: "Penetration Tester" },
  { id: "intro-python3", name: "Introduction to Python 3", area: "Scripting & automation", tier: "Easy" },
  { id: "intro-web-apps", name: "Introduction to Web Applications", area: "Web", tier: "Fundamental", path: "Bug Bounty Hunter" },
  { id: "web-requests", name: "Web Requests", area: "Web", tier: "Fundamental", path: "Bug Bounty Hunter" },
  { id: "pentest-process", name: "Penetration Testing Process", area: "Recon & OSINT", tier: "Fundamental", path: "Penetration Tester" },

  // ── Recon & enumeration ─────────────────────────────────────────────────
  { id: "nmap-enumeration", name: "Network Enumeration with Nmap", area: "Networking", tier: "Easy", path: "Penetration Tester" },
  { id: "footprinting", name: "Footprinting", area: "Recon & OSINT", tier: "Medium", path: "Penetration Tester" },
  { id: "info-gathering-web", name: "Information Gathering - Web Edition", area: "Recon & OSINT", tier: "Easy", path: "Bug Bounty Hunter" },
  { id: "vuln-assessment", name: "Vulnerability Assessment", area: "Networking", tier: "Easy", path: "Penetration Tester" },
  { id: "dns-enumeration", name: "DNS Enumeration Using Python", area: "Scripting & automation", tier: "Medium" },

  // ── Web security ────────────────────────────────────────────────────────
  { id: "using-web-proxies", name: "Using Web Proxies", area: "Web", tier: "Easy", path: "Bug Bounty Hunter" },
  { id: "attacking-web-apps-with-ffuf", name: "Attacking Web Applications with Ffuf", area: "Web", tier: "Easy", path: "Bug Bounty Hunter" },
  { id: "sql-injection-fundamentals", name: "SQL Injection Fundamentals", area: "Web", tier: "Easy", path: "Bug Bounty Hunter" },
  { id: "sqlmap-essentials", name: "SQLMap Essentials", area: "Web", tier: "Easy" },
  { id: "xss", name: "Cross-Site Scripting (XSS)", area: "Web", tier: "Easy", path: "Bug Bounty Hunter" },
  { id: "file-inclusion", name: "File Inclusion", area: "Web", tier: "Medium", path: "Bug Bounty Hunter" },
  { id: "file-upload-attacks", name: "File Upload Attacks", area: "Web", tier: "Medium" },
  { id: "command-injections", name: "Command Injections", area: "Web", tier: "Medium", path: "Bug Bounty Hunter" },
  { id: "web-attacks", name: "Web Attacks", area: "Web", tier: "Medium", path: "Bug Bounty Hunter" },
  { id: "login-brute-forcing", name: "Login Brute Forcing", area: "Web", tier: "Easy", path: "Penetration Tester" },
  { id: "javascript-deobfuscation", name: "JavaScript Deobfuscation", area: "Web", tier: "Easy", path: "Bug Bounty Hunter" },
  { id: "broken-authentication", name: "Broken Authentication", area: "Web", tier: "Medium", path: "Bug Bounty Hunter" },
  { id: "server-side-attacks", name: "Server-side Attacks", area: "Web", tier: "Medium", path: "Bug Bounty Hunter" },
  { id: "session-security", name: "Session Security", area: "Web", tier: "Medium", path: "Bug Bounty Hunter" },
  { id: "hacking-wordpress", name: "Hacking WordPress", area: "Web", tier: "Easy" },
  { id: "nosql-injection", name: "NoSQL Injection", area: "Web", tier: "Medium" },
  { id: "deserialization-attacks", name: "Deserialization Attacks", area: "Web", tier: "Medium" },
  { id: "whitebox-pentesting", name: "Whitebox Pentesting 101", area: "Web", tier: "Hard", path: "Bug Bounty Hunter" },
  { id: "web-service-api-attacks", name: "Web Service & API Attacks", area: "Web", tier: "Medium" },

  // ── Exploitation & post-exploitation ────────────────────────────────────
  { id: "shells-payloads", name: "Shells & Payloads", area: "Networking", tier: "Easy", path: "Penetration Tester" },
  { id: "metasploit", name: "Using the Metasploit Framework", area: "Networking", tier: "Easy", path: "Penetration Tester" },
  { id: "password-attacks", name: "Password Attacks", area: "Networking", tier: "Medium", path: "Penetration Tester" },
  { id: "cracking-passwords-hashcat", name: "Cracking Passwords with Hashcat", area: "Crypto & forensics basics", tier: "Medium", path: "Penetration Tester" },
  { id: "attacking-common-services", name: "Attacking Common Services", area: "Networking", tier: "Medium", path: "Penetration Tester" },
  { id: "file-transfers", name: "File Transfers", area: "Linux & systems", tier: "Medium", path: "Penetration Tester" },
  { id: "pivoting-tunneling", name: "Pivoting, Tunneling & Port Forwarding", area: "Networking", tier: "Medium", path: "Penetration Tester" },
  { id: "linux-privesc", name: "Linux Privilege Escalation", area: "Linux & systems", tier: "Easy", path: "Penetration Tester" },
  { id: "windows-privesc", name: "Windows Privilege Escalation", area: "Windows internals & maldev", tier: "Medium", path: "Penetration Tester" },
  { id: "lateral-movement", name: "Lateral Movement", area: "Networking", tier: "Medium" },
  { id: "defense-evasion", name: "Defense Evasion", area: "Windows internals & maldev", tier: "Medium" },
  { id: "attacking-enterprise-networks", name: "Attacking Enterprise Networks", area: "Networking", tier: "Hard", path: "Penetration Tester" },
  { id: "documentation-reporting", name: "Documentation & Reporting", area: "Recon & OSINT", tier: "Easy", path: "Penetration Tester" },

  // ── Active Directory ────────────────────────────────────────────────────
  { id: "intro-to-ad", name: "Introduction to Active Directory", area: "Active Directory", tier: "Fundamental", path: "Penetration Tester" },
  { id: "active-directory-ldap", name: "Active Directory LDAP", area: "Active Directory", tier: "Medium", path: "Penetration Tester" },
  { id: "ad-enumeration-attacks", name: "Active Directory Enumeration & Attacks", area: "Active Directory", tier: "Medium", path: "Penetration Tester" },

  // ── SOC / blue team ─────────────────────────────────────────────────────
  { id: "windows-event-logs", name: "Windows Event Logs & Finding Evil", area: "Windows internals & maldev", tier: "Medium", path: "SOC Analyst" },
  { id: "intro-to-network-traffic-analysis", name: "Intro to Network Traffic Analysis", area: "Networking", tier: "Medium", path: "SOC Analyst" },
  { id: "security-monitoring", name: "Security Monitoring", area: "Networking", tier: "Medium", path: "SOC Analyst" },
  { id: "siem-with-splunk", name: "Introduction to Splunk", area: "Networking", tier: "Easy", path: "SOC Analyst" },

  // ── Low-level / maldev-adjacent ─────────────────────────────────────────
  { id: "intro-assembly", name: "Intro to Assembly Language", area: "Low-level & C", tier: "Medium" },
  { id: "stack-bof-linux", name: "Stack-Based Buffer Overflows on Linux x86", area: "Low-level & C", tier: "Medium" },
  { id: "stack-bof-windows", name: "Stack-Based Buffer Overflows on Windows x86", area: "Low-level & C", tier: "Medium" },
  { id: "binary-exploitation", name: "Introduction to Binary Exploitation", area: "Low-level & C", tier: "Medium" },
  { id: "malware-analysis-fundamentals", name: "Introduction to Malware Analysis", area: "Windows internals & maldev", tier: "Medium" },
];

export function getHtbModule(id: string): HtbModule | undefined {
  return HTB_ACADEMY_MODULES.find((m) => m.id === id);
}
