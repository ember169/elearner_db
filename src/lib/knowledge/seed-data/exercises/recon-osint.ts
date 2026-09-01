import type { SeedExercise } from "./types";

/** recon-osint L0–L5 — one comprehension MCQ per teaching section. */
export const RECON_OSINT_EXERCISES: SeedExercise[] = [
  // ── L0 ──
  {
    slug: "recon-l0-what",
    competencyId: "recon-osint",
    depthTier: 0,
    sectionHeading: "What is reconnaissance",
    prompt: "What distinguishes passive from active reconnaissance?",
    options: [
      "Passive recon avoids direct contact with the target's systems; active recon interacts with them and is potentially detectable.",
      "Passive recon is illegal; active recon is always authorized.",
      "Passive recon uses tools; active recon is done by hand.",
      "There is no difference.",
    ],
    correctIndex: 0,
    explanation:
      "Passive recon (DNS via third parties, OSINT, cert transparency) leaves no trace on the target; active recon (port scans, crawling) touches the target and can be logged. OSINT draws only on public sources.",
  },
  {
    slug: "recon-l0-why",
    competencyId: "recon-osint",
    depthTier: 0,
    sectionHeading: "Why reconnaissance matters",
    prompt: "Why is reconnaissance so heavily weighted in an engagement?",
    options: [
      "Better recon means fewer blind spots and more targeted attacks; organizations leak more than they realize.",
      "It is the only phase that requires no skill.",
      "It guarantees a shell on the first try.",
      "It replaces the need for exploitation entirely.",
    ],
    correctIndex: 0,
    explanation:
      "Thorough recon maps the attack surface so later phases are precise; OSINT can surface credentials, infrastructure, employees, and tech stacks without ever touching the target.",
  },
  {
    slug: "recon-l0-vocab",
    competencyId: "recon-osint",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt: "What is Certificate Transparency useful for in reconnaissance?",
    options: [
      "Its public logs of all issued TLS certificates reveal subdomains (including internal-looking ones) an org has requested certs for.",
      "It lists a domain's open ports.",
      "It stores the target's passwords.",
      "It decrypts HTTPS traffic.",
    ],
    correctIndex: 0,
    explanation:
      "CT logs are append-only public records of issued certificates, so querying them (e.g. crt.sh) enumerates subdomains passively. Google dorking, footprinting, and subdomain enumeration are related core techniques.",
  },
  // ── L1 ──
  {
    slug: "recon-l1-dns-whois",
    competencyId: "recon-osint",
    depthTier: 1,
    sectionHeading: "Passive DNS and WHOIS",
    prompt: "What can DNS TXT records reveal to a recon analyst?",
    options: [
      "SPF/DKIM/DMARC configuration and verification tokens that expose third-party services (Google Workspace, M365, Salesforce).",
      "The target's internal admin password.",
      "A list of all employees' home addresses.",
      "The server's CPU model.",
    ],
    correctIndex: 0,
    explanation:
      "TXT records often carry email-auth policies and service verification tokens, hinting at which SaaS providers the target uses. WHOIS adds registrar, dates, and nameservers; passive DNS databases give history.",
  },
  {
    slug: "recon-l1-subdomains",
    competencyId: "recon-osint",
    depthTier: 1,
    sectionHeading: "Subdomain enumeration",
    prompt: "How does virtual-host (vhost) enumeration differ from DNS subdomain brute forcing?",
    options: [
      "Vhost enumeration sends requests to a known IP with different Host headers (HTTP-based); DNS brute forcing resolves candidate names in the DNS.",
      "They are identical techniques.",
      "Vhost enumeration queries the DNS directly.",
      "DNS brute forcing sends Host headers to a web server.",
    ],
    correctIndex: 0,
    explanation:
      "gobuster dns resolves names against DNS; vhost fuzzing (ffuf -H \"Host: FUZZ...\") finds sites served by the same IP without any DNS record. Certificate Transparency and passive sources (subfinder/amass) complement both.",
  },
  {
    slug: "recon-l1-dorking",
    competencyId: "recon-osint",
    depthTier: 1,
    sectionHeading: "Google dorking",
    prompt: "What does a dork like `site:example.com filetype:env` hunt for?",
    options: [
      "Exposed .env files that may contain credentials, scoped to the target domain.",
      "The number of employees at the company.",
      "The domain's DNS records.",
      "The site's TLS certificate chain.",
    ],
    correctIndex: 0,
    explanation:
      "Advanced operators (site:, filetype:, inurl:, intitle:, intext:) surface exposed documents, admin pages, directory listings, and secrets. The Google Hacking Database catalogs hundreds of such dorks.",
  },
  {
    slug: "recon-l1-fingerprint",
    competencyId: "recon-osint",
    depthTier: 1,
    sectionHeading: "Technology fingerprinting",
    prompt: "Which tool searches internet-connected devices/services by banner and metadata for recon?",
    options: [
      "Shodan (and Censys).",
      "Wireshark.",
      "Metasploit.",
      "John the Ripper.",
    ],
    correctIndex: 0,
    explanation:
      "Shodan/Censys index exposed services worldwide; whatweb/Wappalyzer and HTTP response headers (Server, X-Powered-By) fingerprint the tech stack of a specific target.",
  },
  // ── L2 ──
  {
    slug: "recon-l2-people",
    competencyId: "recon-osint",
    depthTier: 2,
    sectionHeading: "Social media and people OSINT",
    prompt: "How does LinkedIn/employee OSINT feed an attack?",
    options: [
      "Employee names build username lists (e.g. flast@company.com) for password spraying, and profiles/job posts reveal the tech stack.",
      "It provides the domain's TLS private key.",
      "It grants VPN access automatically.",
      "It lists the company's open ports.",
    ],
    correctIndex: 0,
    explanation:
      "Enumerating employees yields email/username formats for spraying and reveals technologies, teams, and sometimes internal hostnames. theHarvester and sherlock automate email/username discovery.",
  },
  {
    slug: "recon-l2-repos",
    competencyId: "recon-osint",
    depthTier: 2,
    sectionHeading: "Code repository mining",
    prompt: "Why search a repository's full git history, not just the current files?",
    options: [
      "A secret removed in a later commit still persists in earlier commits, so scanners like gitleaks/trufflehog check the whole history.",
      "Old commits run faster to scan.",
      "The current files never contain secrets.",
      "Git history is encrypted and safer to read.",
    ],
    correctIndex: 0,
    explanation:
      "Developers frequently commit secrets and 'remove' them later, but the value remains in history. gitleaks/trufflehog and `git log -p -S` mine those old commits; GitHub org dorks find exposed .env/keys.",
  },
  {
    slug: "recon-l2-infra",
    competencyId: "recon-osint",
    depthTier: 2,
    sectionHeading: "Infrastructure mapping",
    prompt: "How can a CNAME record help identify a target's cloud provider?",
    options: [
      "CNAMEs pointing to provider domains (.cloudfront.net → AWS, .azurewebsites.net → Azure) reveal where assets are hosted.",
      "CNAMEs contain the provider's billing account.",
      "CNAMEs list the server's open ports.",
      "CNAMEs decrypt the site's traffic.",
    ],
    correctIndex: 0,
    explanation:
      "Provider-specific CNAME targets betray the hosting platform. ASN lookups, reverse-IP, and org-based amass intel map the broader IP footprint; misconfigured S3/blob buckets are a common find.",
  },
  {
    slug: "recon-l2-breach",
    competencyId: "recon-osint",
    depthTier: 2,
    sectionHeading: "Breach data and credential leaks",
    prompt: "Why is previously breached credential data a primary attack vector?",
    options: [
      "Password reuse is common, so a password leaked from an unrelated 2018 breach may still work for corporate email today (credential stuffing).",
      "Breach data contains the target's source code.",
      "Breach data grants domain admin directly.",
      "Breach data is fabricated and useless.",
    ],
    correctIndex: 0,
    explanation:
      "Users reuse passwords across sites, so leaked creds (HIBP, Dehashed) enable credential stuffing against corporate logins. Always confirm scope/authorization before using breach data in an engagement.",
  },
  {
    slug: "recon-l2-automation",
    competencyId: "recon-osint",
    depthTier: 2,
    sectionHeading: "Automating reconnaissance",
    prompt: "What does the pipeline `subfinder | httpx | nuclei` accomplish?",
    options: [
      "Discover subdomains, probe which are live HTTP services, then scan them for known vulnerabilities/CVEs automatically.",
      "Encrypt the recon results.",
      "Brute-force SSH on every host.",
      "Generate a fake identity for the researcher.",
    ],
    correctIndex: 0,
    explanation:
      "Chaining ProjectDiscovery tools turns discovery → probing → vuln scanning into one automated flow. Frameworks like recon-ng organize modules and store results in workspaces.",
  },
  // ── L3 ──
  {
    slug: "recon-l3-asm",
    competencyId: "recon-osint",
    depthTier: 3,
    sectionHeading: "Attack surface management",
    prompt: "What is the goal of an attack-surface-management pipeline (discover → probe → scan)?",
    options: [
      "Continuously map the complete external footprint and flag exposed panels, default creds, and known CVEs across hundreds of assets.",
      "Encrypt all of the target's assets.",
      "Take the target's website offline.",
      "Enumerate only a single known host.",
    ],
    correctIndex: 0,
    explanation:
      "ASM enumerates subdomains from many sources, resolves and probes them, screenshots for review, and runs templated vuln checks — surfacing the exposures an org has lost track of.",
  },
  {
    slug: "recon-l3-metadata",
    competencyId: "recon-osint",
    depthTier: 3,
    sectionHeading: "Metadata analysis",
    prompt: "What can document metadata (via exiftool/FOCA) leak about a target?",
    options: [
      "Internal usernames, software versions, internal server/printer names, and directory paths.",
      "The target's bank account balance.",
      "The visitor's browsing history.",
      "The site's TLS session keys.",
    ],
    correctIndex: 0,
    explanation:
      "Published PDFs/Office files embed author names, software, timestamps, and sometimes internal paths and hostnames — useful for building username lists and understanding internal naming.",
  },
  {
    slug: "recon-l3-darkweb",
    competencyId: "recon-osint",
    depthTier: 3,
    sectionHeading: "Dark web and underground forums",
    prompt: "What kind of threat-intel signal do ransomware leak sites and underground forums provide?",
    options: [
      "Breach announcements, initial-access broker listings, and published victim data relevant to the target.",
      "The target's live network traffic.",
      "Legitimate software updates.",
      "The target's DNS zone file.",
    ],
    correctIndex: 0,
    explanation:
      "Monitoring Tor forums, Telegram channels, and leak sites reveals breaches, access-for-sale, and exposed data. Always ensure proper authorization and legal compliance when accessing such sources.",
  },
  {
    slug: "recon-l3-wireless-physical",
    competencyId: "recon-osint",
    depthTier: 3,
    sectionHeading: "Wireless and physical reconnaissance",
    prompt: "Why do red teams distinguish WPA2-Enterprise from WPA2-PSK during wireless recon?",
    options: [
      "WPA2-Enterprise with EAP-PEAP/MSCHAPv2 is susceptible to credential capture via rogue-AP tools (eaphammer/hostapd-mana).",
      "WPA2-Enterprise has no encryption.",
      "WPA2-PSK cannot be attacked at all.",
      "Enterprise networks are always open.",
    ],
    correctIndex: 0,
    explanation:
      "Enterprise 802.1X networks authenticate users, and weak EAP methods let a rogue AP capture credentials. Physical recon (badge cloning, tailgating, dumpster diving) complements the wireless angle, with authorization.",
  },
  // ── L4 ──
  {
    slug: "recon-l4-custom-tooling",
    competencyId: "recon-osint",
    depthTier: 4,
    sectionHeading: "Custom OSINT tooling",
    prompt: "Why use a ThreadPoolExecutor when building a custom subdomain-probing script?",
    options: [
      "Network-bound checks run concurrently, dramatically speeding up probing many hosts versus sequential requests.",
      "It encrypts the results automatically.",
      "It bypasses rate limits by design.",
      "It is required to parse HTML.",
    ],
    correctIndex: 0,
    explanation:
      "Recon is I/O-bound, so concurrency (thread pool or async) is the main performance lever. Custom tooling lets you tailor probing, parsing, and output to an engagement's needs.",
  },
  {
    slug: "recon-l4-cloud-enum",
    competencyId: "recon-osint",
    depthTier: 4,
    sectionHeading: "Cloud infrastructure enumeration",
    prompt: "How are open cloud storage buckets typically discovered?",
    options: [
      "Permuting the target's name with common words (backup, dev, prod) and testing S3/blob/GCS endpoints for anonymous access.",
      "By asking the cloud provider for a customer list.",
      "By port-scanning the provider's data center.",
      "By reading the provider's source code.",
    ],
    correctIndex: 0,
    explanation:
      "Bucket names are guessable, so permutation wordlists against S3/Azure Blob/GCS surface misconfigured public buckets and snapshots. Provider IP-range files help attribute assets to a target.",
  },
  {
    slug: "recon-l4-threat-intel",
    competencyId: "recon-osint",
    depthTier: 4,
    sectionHeading: "Threat intelligence correlation",
    prompt: "What does correlating recon findings across sources enable?",
    options: [
      "Cross-referencing subdomains, exposed services, breach data, and infrastructure over time to build a fuller, higher-confidence picture.",
      "Automatically exploiting every found host.",
      "Replacing the need for any scanning.",
      "Guaranteeing zero false positives.",
    ],
    correctIndex: 0,
    explanation:
      "Correlation (subdomains ↔ Shodan services, emails ↔ breaches, IPs ↔ cloud ranges, cert issuance over time) turns scattered data into actionable intelligence, framed by models like the Kill Chain and MITRE ATT&CK.",
  },
  // ── L5 ──
  {
    slug: "recon-l5-geoint",
    competencyId: "recon-osint",
    depthTier: 5,
    sectionHeading: "Geolocation and imagery intelligence",
    prompt: "Which clues does geolocation from a photo rely on when EXIF GPS is absent?",
    options: [
      "Shadows, vegetation, architecture, signage, and terrain, cross-referenced with maps and satellite imagery.",
      "The photo's file size only.",
      "The camera's serial number.",
      "The uploader's IP address embedded in the pixels.",
    ],
    correctIndex: 0,
    explanation:
      "Visual clues (shadow angle for time/latitude via SunCalc, signage language, architecture) plus reverse image search and satellite/street imagery pin a location. EXIF GPS, when present, is the shortcut.",
  },
  {
    slug: "recon-l5-sockpuppet",
    competencyId: "recon-osint",
    depthTier: 5,
    sectionHeading: "Sock puppet and operational security",
    prompt: "What is a core OPSEC rule when running a sock-puppet OSINT persona?",
    options: [
      "Keep the research identity fully separated from your real one — dedicated VPN/browser profile, burner contacts, no cross-contamination.",
      "Use your real name to appear trustworthy.",
      "Log in to the persona from your personal accounts.",
      "Reuse the same password as your real email.",
    ],
    correctIndex: 0,
    explanation:
      "A sock puppet needs a consistent backstory and strict compartmentalization (separate infrastructure, generated profile photos, burner email/VoIP) so investigations can't be traced back — and note some actions (LinkedIn views) alert the target.",
  },
  {
    slug: "recon-l5-ml",
    competencyId: "recon-osint",
    depthTier: 5,
    sectionHeading: "Machine learning for OSINT",
    prompt: "What is a key ethical/legal consideration when applying ML like facial recognition to OSINT?",
    options: [
      "It crosses significant privacy boundaries, and many jurisdictions specifically regulate biometric data collection — authorization and proportionality are required.",
      "ML results are always 100% accurate and need no review.",
      "Biometric data is never regulated anywhere.",
      "Facial recognition is faster than reading, so ethics don't apply.",
    ],
    correctIndex: 0,
    explanation:
      "ML aids entity extraction, image matching, and network analysis at scale, but facial recognition and biometric processing are legally sensitive; ensure lawful authorization and proportionality.",
  },
];
