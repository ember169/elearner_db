// A modest, curated catalog of well-known HackTheBox Academy modules the mentor
// can recommend FROM (rather than inventing module names). `area` loosely aligns
// with the competency map so recommendations can target gaps. Not exhaustive —
// HTB Academy has 100+ modules; extend as needed.

export type HtbModule = {
  id: string;
  name: string;
  area: string;
  tier: "Fundamental" | "Easy" | "Medium" | "Hard";
};

export const HTB_ACADEMY_MODULES: HtbModule[] = [
  // Foundations
  { id: "linux-fundamentals", name: "Linux Fundamentals", area: "Linux & systems", tier: "Fundamental" },
  { id: "windows-fundamentals", name: "Windows Fundamentals", area: "Windows internals & maldev", tier: "Fundamental" },
  { id: "intro-to-networking", name: "Introduction to Networking", area: "Networking", tier: "Fundamental" },
  { id: "intro-bash-scripting", name: "Introduction to Bash Scripting", area: "Scripting & automation", tier: "Easy" },
  { id: "intro-web-apps", name: "Introduction to Web Applications", area: "Web", tier: "Fundamental" },
  { id: "web-requests", name: "Web Requests", area: "Web", tier: "Fundamental" },
  { id: "pentest-process", name: "Penetration Testing Process", area: "Recon & OSINT", tier: "Fundamental" },

  // Recon & enumeration
  { id: "nmap-enumeration", name: "Network Enumeration with Nmap", area: "Networking", tier: "Easy" },
  { id: "footprinting", name: "Footprinting", area: "Recon & OSINT", tier: "Medium" },
  { id: "info-gathering-web", name: "Information Gathering - Web Edition", area: "Recon & OSINT", tier: "Easy" },
  { id: "vuln-assessment", name: "Vulnerability Assessment", area: "Networking", tier: "Easy" },

  // Web security
  { id: "using-web-proxies", name: "Using Web Proxies", area: "Web", tier: "Easy" },
  { id: "sql-injection-fundamentals", name: "SQL Injection Fundamentals", area: "Web", tier: "Easy" },
  { id: "xss", name: "Cross-Site Scripting (XSS)", area: "Web", tier: "Easy" },
  { id: "file-inclusion", name: "File Inclusion", area: "Web", tier: "Medium" },
  { id: "command-injections", name: "Command Injections", area: "Web", tier: "Medium" },
  { id: "web-attacks", name: "Web Attacks", area: "Web", tier: "Medium" },
  { id: "login-brute-forcing", name: "Login Brute Forcing", area: "Web", tier: "Easy" },

  // Exploitation & post-ex
  { id: "shells-payloads", name: "Shells & Payloads", area: "Networking", tier: "Easy" },
  { id: "metasploit", name: "Using the Metasploit Framework", area: "Networking", tier: "Easy" },
  { id: "password-attacks", name: "Password Attacks", area: "Networking", tier: "Medium" },
  { id: "attacking-common-services", name: "Attacking Common Services", area: "Networking", tier: "Medium" },
  { id: "file-transfers", name: "File Transfers", area: "Linux & systems", tier: "Medium" },
  { id: "pivoting-tunneling", name: "Pivoting, Tunneling & Port Forwarding", area: "Networking", tier: "Medium" },
  { id: "linux-privesc", name: "Linux Privilege Escalation", area: "Linux & systems", tier: "Easy" },
  { id: "windows-privesc", name: "Windows Privilege Escalation", area: "Windows internals & maldev", tier: "Medium" },

  // Active Directory
  { id: "intro-to-ad", name: "Introduction to Active Directory", area: "Active Directory", tier: "Fundamental" },
  { id: "ad-enumeration-attacks", name: "Active Directory Enumeration & Attacks", area: "Active Directory", tier: "Medium" },

  // Low-level / maldev-adjacent
  { id: "intro-assembly", name: "Intro to Assembly Language", area: "Low-level & C", tier: "Medium" },
  { id: "stack-bof-linux", name: "Stack-Based Buffer Overflows on Linux x86", area: "Low-level & C", tier: "Medium" },
];

export function getHtbModule(id: string): HtbModule | undefined {
  return HTB_ACADEMY_MODULES.find((m) => m.id === id);
}
