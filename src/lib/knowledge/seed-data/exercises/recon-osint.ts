import type { SeedExercise } from "./types";

/** recon-osint L0–L5 — one comprehension MCQ per teaching section. */
export const RECON_OSINT_EXERCISES: SeedExercise[] = [
  // ── L0 ──
  {
    slug: "recon-l0-what",
    competencyId: "recon-osint",
    depthTier: 0,
    sectionHeading: "What is reconnaissance",
    prompt:
      "Your team's rules of engagement state that Phase 1 must leave no trace on the client's systems. A junior analyst proposes running Nmap SYN scans against the target's external range. Why does this violate the Phase 1 constraint?",
    options: [
      "SYN scans actively send packets to the target's network stack, generating firewall and IDS logs — Phase 1 requires passive recon only, which gathers data from public sources like CT logs, WHOIS, and OSINT databases without touching the target.",
      "SYN scans are passive because they never complete the TCP handshake, so they leave no detectable trace — the real concern is that Nmap's default timing is too slow for Phase 1's tight deadlines and should be replaced with masscan.",
      "SYN scans are a passive DNS technique that only queries third-party resolvers, but the issue is that Nmap's output format is incompatible with most recon frameworks like recon-ng, making results harder to correlate in Phase 1.",
      "SYN scans qualify as passive recon when routed through a VPN, because the target logs the VPN's IP rather than the analyst's — the violation is using a personal endpoint instead of the team's shared VPN exit node.",
    ],
    correctIndex: 0,
    explanation:
      "Passive recon (DNS via third parties, OSINT, cert transparency) leaves no trace on the target; active recon (port scans, crawling) touches the target and can be logged. A SYN scan sends real packets to real ports regardless of VPN or handshake completion.",
  },
  {
    slug: "recon-l0-why",
    competencyId: "recon-osint",
    depthTier: 0,
    sectionHeading: "Why reconnaissance matters",
    prompt:
      "A penetration tester spends three days on reconnaissance before attempting any exploitation. The client asks why so much time is being 'wasted' before real testing begins. What is the best justification?",
    options: [
      "Thorough recon maps the full attack surface — leaked credentials, forgotten subdomains, exposed APIs, and employee details — so exploitation attempts are precise and efficient rather than noisy brute-force guessing that alerts defenders.",
      "Recon is required by all penetration testing standards as a fixed 72-hour minimum before exploitation can begin — skipping it would invalidate the final report under PTES, OWASP, and most compliance frameworks.",
      "The three days are primarily spent setting up scanning infrastructure and configuring tools like Burp Suite and Metasploit, which require extensive per-engagement customization before they can be pointed at any target environment.",
      "Extended recon ensures the tester fully understands the client's business model and revenue streams, which is the primary factor in determining which vulnerabilities to report as critical versus informational in the final deliverable.",
    ],
    correctIndex: 0,
    explanation:
      "Thorough recon maps the attack surface so later phases are precise. Organizations leak more than they realize — credentials, infrastructure, employees, and tech stacks can all be surfaced without ever touching the target.",
  },
  {
    slug: "recon-l0-vocab",
    competencyId: "recon-osint",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt:
      "You query crt.sh for %.example.com and receive a list of 47 subdomains, including staging.internal.example.com. What public data source made this discovery possible without touching the target?",
    options: [
      "Certificate Transparency logs — public, append-only records of every TLS certificate issued by participating CAs, which reveal all subdomains a certificate was requested for, including internal-looking names that are not meant to be public.",
      "Passive DNS databases — aggregated historical DNS resolution data collected by ISPs and security vendors, which record every subdomain that has ever been resolved by any recursive DNS server worldwide and make it publicly searchable.",
      "WHOIS privacy-leak databases — registrar records that inadvertently expose subdomain structures when zone administrators forget to enable privacy protection on wildcard domain registrations and their associated host records.",
      "Search engine cache indexes — crawlers like Googlebot that discover and index subdomains by following hyperlinks, which makes every linked subdomain visible through advanced search operators even after the page is taken down.",
    ],
    correctIndex: 0,
    explanation:
      "CT logs are append-only public records of issued certificates, so querying them (e.g. crt.sh) enumerates subdomains passively — including internal-looking names that organizations requested certificates for without realizing they would be publicly visible.",
  },
  // ── L1 ──
  {
    slug: "recon-l1-dns-whois",
    competencyId: "recon-osint",
    depthTier: 1,
    sectionHeading: "Passive DNS and WHOIS",
    prompt:
      "While enumerating DNS records for a target, you find a TXT record containing v=spf1 include:_spf.google.com include:spf.protection.outlook.com ~all. What does this reveal about the target's infrastructure?",
    options: [
      "The target uses both Google Workspace and Microsoft 365 for email — SPF includes authorize those providers' mail servers to send on behalf of the domain, revealing which SaaS platforms handle the organization's email infrastructure.",
      "The target has misconfigured its SPF record by including two conflicting providers, which means neither provider is actually authorized and all outbound email from the domain will fail DMARC validation checks at the recipient.",
      "The target is running both Google and Microsoft DNS servers in a split-horizon configuration, where internal queries resolve to Google's infrastructure and external queries resolve to Microsoft endpoints for redundancy.",
      "The target has outsourced its domain registration to both Google Domains and Microsoft Azure DNS, and the TXT record is a verification token proving domain ownership to both registrars simultaneously for failover.",
    ],
    correctIndex: 0,
    explanation:
      "TXT records often carry email-auth policies (SPF/DKIM/DMARC) and service verification tokens, hinting at which SaaS providers the target uses. Dual includes for Google and Microsoft suggest the org uses both platforms for email.",
  },
  {
    slug: "recon-l1-subdomains",
    competencyId: "recon-osint",
    depthTier: 1,
    sectionHeading: "Subdomain enumeration",
    prompt:
      "You have identified a target's IP address and suspect it hosts additional web applications with no public DNS records. You run ffuf against that IP with a wordlist of candidate hostnames injected into the Host header. What technique is this, and why does it work when DNS brute forcing fails?",
    options: [
      "Virtual host enumeration — it sends HTTP requests with different Host headers to a known IP, discovering sites the web server routes internally even when no DNS A record exists, because the server dispatches requests based on the Host header value.",
      "DNS zone transfer emulation — it replays the equivalent of an AXFR request over HTTP by encoding subdomain queries in the Host header, which bypasses DNS server access controls while achieving the same comprehensive enumeration result.",
      "Reverse DNS brute forcing — it queries the web server's PTR records indirectly by sending candidate hostnames, causing the server to reveal its reverse DNS mappings through HTTP error messages that include the server's canonical name.",
      "TLS SNI harvesting — it exploits the fact that web servers leak all configured virtual host names in their TLS Server Name Indication handshake, and ffuf collects these names from the TLS negotiation before any HTTP exchange occurs.",
    ],
    correctIndex: 0,
    explanation:
      "DNS brute forcing resolves names against DNS; vhost fuzzing (e.g. ffuf -H 'Host: FUZZ.example.com') finds sites served by the same IP without any DNS record. The web server's virtual host routing is independent of public DNS.",
  },
  {
    slug: "recon-l1-dorking",
    competencyId: "recon-osint",
    depthTier: 1,
    sectionHeading: "Google dorking",
    prompt:
      "After finding an indexed .env file via site:example.com filetype:env, a colleague suggests also trying site:example.com inurl:admin intitle:\"dashboard\". What is this second query designed to surface?",
    options: [
      "Exposed administrative panels — the query combines domain scoping with URL path filtering and page title matching to find dashboards or login pages that should be behind authentication but were accidentally indexed by search engine crawlers.",
      "Cached DNS administration records — Google stores zone file snapshots for domains it crawls, and inurl:admin filters for administrative DNS entries like SOA and NS records that reveal the domain's authoritative nameserver infrastructure.",
      "Employee directory pages — the intitle:dashboard operator specifically targets HR management systems, because most enterprise HR platforms use 'dashboard' in their default page titles when displaying employee rosters and org charts.",
      "Web application firewall configuration endpoints — inurl:admin locates WAF management interfaces where rule exceptions are configured, and intitle:dashboard confirms the WAF vendor's default management console page title is unchanged.",
    ],
    correctIndex: 0,
    explanation:
      "Advanced operators (site:, filetype:, inurl:, intitle:, intext:) surface exposed documents, admin pages, directory listings, and secrets. The Google Hacking Database catalogs hundreds of such dorks for specific technologies and misconfigurations.",
  },
  {
    slug: "recon-l1-fingerprint",
    competencyId: "recon-osint",
    depthTier: 1,
    sectionHeading: "Technology fingerprinting",
    prompt:
      "A Shodan query for org:\"Acme Corp\" port:9200 returns several results showing Elasticsearch REST API responses with cluster health data and index names. What recon value does this finding provide?",
    options: [
      "It reveals internet-exposed Elasticsearch instances belonging to the target — likely unauthenticated by default — which may contain sensitive data and disclose internal index names, cluster configuration, and exact software versions for CVE research.",
      "It shows that Acme Corp is running a Shodan honeypot on port 9200 designed to detect reconnaissance activity — the cluster health data is fabricated bait intended to waste attackers' time and fingerprint their scanning infrastructure.",
      "It indicates Acme Corp's primary email server infrastructure, because port 9200 is the standard IMAP-over-TLS port and Elasticsearch is commonly deployed as the backend full-text search engine for enterprise email archival platforms.",
      "It confirms that Acme Corp is a Shodan premium subscriber, because the org: filter only returns results for organizations that have registered their IP ranges with Shodan's commercial asset inventory and monitoring service.",
    ],
    correctIndex: 0,
    explanation:
      "Shodan/Censys index exposed services worldwide. Elasticsearch on port 9200 is frequently left unauthenticated, and its API responses reveal cluster names, index names, and version numbers — all useful for mapping the target's data infrastructure and finding CVEs.",
  },
  // ── L2 ──
  {
    slug: "recon-l2-people",
    competencyId: "recon-osint",
    depthTier: 2,
    sectionHeading: "Social media and people OSINT",
    prompt:
      "You find a LinkedIn job posting from the target company seeking a 'Senior Kubernetes Administrator with Terraform and AWS EKS experience.' How does a red team operationally leverage this information?",
    options: [
      "It reveals the target's tech stack — Kubernetes on AWS EKS managed via Terraform — which narrows attack research to EKS misconfigurations, Terraform state file exposure, and IAM role vulnerabilities specific to that environment.",
      "It confirms the company has an open headcount, meaning their security operations team is understaffed, which directly indicates weaker monitoring coverage and slower incident response times during the engagement window.",
      "It provides the hiring manager's identity for social engineering, but technical details in job postings are intentionally vague marketing language and never reflect the actual production infrastructure the company operates.",
      "It signals the company is migrating away from legacy on-premises infrastructure, so the red team should focus exclusively on deprecated internal systems that are likely unpatched while staff attention is on the cloud migration.",
    ],
    correctIndex: 0,
    explanation:
      "Job posts reveal technologies, teams, and sometimes internal tooling. Knowing the target runs EKS + Terraform focuses exploit research and helps build credential-spraying lists from employee profiles via theHarvester or similar tools.",
  },
  {
    slug: "recon-l2-repos",
    competencyId: "recon-osint",
    depthTier: 2,
    sectionHeading: "Code repository mining",
    prompt:
      "You discover the target's public GitHub repository. Running git log -p -S 'API_KEY' on a clone reveals a 2023 commit that added an AWS access key, followed by a 2024 commit that removed it. Is the key still a security risk, and why?",
    options: [
      "Yes — the key persists in the 2023 commit object forever unless the entire history is rewritten with tools like git filter-repo, and even then it may survive in forks, caches, and anyone's existing local clones of the repository.",
      "No — GitHub automatically revokes credentials detected by its secret scanning partnership program within 24 hours of the push, so a key first exposed in 2023 was invalidated long before the 2024 removal commit was made.",
      "No — once a file is deleted or overwritten in a later commit, Git's garbage collection permanently removes unreachable objects from the packfile after the default 90-day reflog expiration window passes on the remote.",
      "Yes, but only if the repository is public — private repositories encrypt all historical commit objects at rest with the owner's GPG key, making previous versions of sensitive files unreadable even with direct object-store access.",
    ],
    correctIndex: 0,
    explanation:
      "Developers frequently commit secrets and 'remove' them later, but the value remains in the Git object store. Tools like gitleaks and trufflehog scan full history; forks and cached clones may retain secrets even after a force-push rewrite.",
  },
  {
    slug: "recon-l2-infra",
    competencyId: "recon-osint",
    depthTier: 2,
    sectionHeading: "Infrastructure mapping",
    prompt:
      "During DNS enumeration you find that app.example.com has a CNAME pointing to d1234.cloudfront.net, and api.example.com resolves via CNAME to an ELB endpoint in us-east-1. What infrastructure conclusions can you draw from these records?",
    options: [
      "The target hosts its frontend through AWS CloudFront CDN and its API behind an AWS Elastic Load Balancer in us-east-1 — both CNAME targets are provider-specific patterns, confirming AWS as the primary cloud platform and narrowing the attack surface accordingly.",
      "The target uses Cloudflare for DDoS protection on the frontend and a self-hosted NGINX reverse proxy for the API — cloudfront.net is a common Cloudflare subdomain pattern, and ELB endpoints indicate generic load-balancer appliances rather than AWS specifically.",
      "The CNAME records confirm both domains are parked and inactive, because legitimate production services always use A records pointing directly to IP addresses rather than chaining through provider-specific CNAME aliases that add latency.",
      "The differing CNAME targets indicate a split-DNS configuration where internal users reach a private CloudFront distribution while external users hit the ELB directly — the priority should be finding the internal recursive DNS resolver to map both views.",
    ],
    correctIndex: 0,
    explanation:
      "Provider-specific CNAME targets betray the hosting platform. CloudFront distributions and ELB hostnames are unmistakably AWS. ASN lookups, reverse-IP, and org-based amass queries can then map the broader IP footprint and find misconfigurations.",
  },
  {
    slug: "recon-l2-breach",
    competencyId: "recon-osint",
    depthTier: 2,
    sectionHeading: "Breach data and credential leaks",
    prompt:
      "You find that 12 employees at your target appear in Have I Been Pwned from a 2019 breach of an unrelated social media site. The target's corporate email uses SSO with MFA enforced. Should you still investigate these credentials?",
    options: [
      "Yes — password reuse is common, and users may have used the same password for non-SSO services like VPN portals, legacy applications, or personal accounts on corporate devices, which may not enforce MFA and could provide an initial foothold.",
      "No — SSO with MFA makes breach data completely irrelevant because every authentication flow is protected by a second factor, and no legitimate penetration testing methodology permits testing credentials sourced from third-party breaches.",
      "Yes, but only to validate the SSO configuration — the breached passwords should be tested exclusively against the SSO portal's login page to confirm that MFA is properly enforced and cannot be bypassed on any of the twelve accounts.",
      "No — breach data from 2019 is too old to be actionable because all major identity providers automatically force password resets for accounts appearing in public breach databases within 12 months of the breach disclosure date.",
    ],
    correctIndex: 0,
    explanation:
      "Users reuse passwords across sites, so leaked credentials enable credential stuffing against non-SSO endpoints like VPNs, legacy webmail, or admin portals. Always verify scope and authorization before using breach data in an engagement.",
  },
  {
    slug: "recon-l2-automation",
    competencyId: "recon-osint",
    depthTier: 2,
    sectionHeading: "Automating reconnaissance",
    prompt:
      "Your recon pipeline runs subfinder -d example.com | httpx -title -status-code | nuclei -t cves/. The output shows a subdomain returning HTTP 200 with the title 'Apache Tomcat/9.0.31.' What has each stage of the pipeline contributed?",
    options: [
      "subfinder discovered the subdomain from passive sources, httpx confirmed it is a live HTTP service and extracted the page title revealing the software version, and nuclei checked it against known CVE templates — automating the path from discovery to vulnerability identification.",
      "subfinder performed a SYN scan to find open ports on the target, httpx connected to each port and grabbed service banners via raw sockets, and nuclei generated a compliance report — the pipeline replaces manual Nmap and Nikto workflows entirely.",
      "subfinder queried the target's DNS server for a zone transfer to list all records, httpx resolved each hostname to an IP and performed reverse DNS lookups, and nuclei classified each IP address into CIDR blocks — building a network map from DNS data alone.",
      "subfinder scraped search engine results for indexed subdomains, httpx tested each for WAF presence and identified the specific vendor product, and nuclei attempted automated WAF bypass techniques — the pipeline specifically targets web application firewall evasion.",
    ],
    correctIndex: 0,
    explanation:
      "Chaining ProjectDiscovery tools (subfinder for passive subdomain discovery, httpx for live probing, nuclei for template-based vuln scanning) turns discovery through vulnerability identification into one automated flow. The Tomcat version would match known CVEs.",
  },
  // ── L3 ──
  {
    slug: "recon-l3-asm",
    competencyId: "recon-osint",
    depthTier: 3,
    sectionHeading: "Attack surface management",
    prompt:
      "Your client has 200+ subdomains across three cloud providers and regularly spins up ephemeral dev environments. You propose continuous attack-surface-management monitoring instead of a point-in-time assessment. What trade-off must the client understand?",
    options: [
      "Continuous ASM catches ephemeral exposures — a dev server spun up Tuesday and forgotten by Thursday — but generates ongoing alert fatigue and requires dedicated triage staff to separate real risks from noise across hundreds of assets.",
      "Continuous ASM is strictly superior to point-in-time assessments in every dimension with no downside — the only reason clients choose point-in-time is budget constraints, since ASM platform licensing is significantly more expensive per asset.",
      "Continuous ASM eliminates the need for manual penetration testing entirely, because automated scanning covers all vulnerability classes including business logic flaws, so the trade-off is simply replacing human testers with tooling and automation.",
      "Continuous ASM only monitors cloud-hosted assets and cannot discover on-premises infrastructure, so the trade-off is that the client must migrate all remaining physical data center workloads to the cloud before the pipeline provides meaningful coverage.",
    ],
    correctIndex: 0,
    explanation:
      "ASM pipelines continuously enumerate, probe, and scan the external footprint, catching transient exposures that a quarterly pentest would miss. The trade-off is operational: alert volume, false positives, and the need for ongoing triage resources.",
  },
  {
    slug: "recon-l3-metadata",
    competencyId: "recon-osint",
    depthTier: 3,
    sectionHeading: "Metadata analysis",
    prompt:
      "You download a PDF proposal from the target's public website and run exiftool on it. The output shows Author: jsmith, Creator: Microsoft Word 2016, and a Subject field containing //FS01/shared/proposals/. What intelligence have you gathered?",
    options: [
      "An internal username (jsmith) for building credential lists, the office software version in use (Word 2016, which may have known CVEs), and an internal file server path revealing naming conventions and network share structure within the organization.",
      "A public pen name the author uses for published documents, the PDF rendering engine version (which is always different from the authoring software), and a URL where the document was downloaded from before being reuploaded to the target's site.",
      "The IT administrator's account name — metadata Author fields always reflect the system admin who installed Office, not the document author — plus the software license tier and the cloud storage path where Microsoft automatically backs up all documents.",
      "A deliberate canary token planted by the target's security team — embedding recognizable metadata in public documents is a standard honeypot technique designed to identify who is downloading and analyzing files, and the server path leads to a monitored decoy share.",
    ],
    correctIndex: 0,
    explanation:
      "Published PDFs/Office files embed author names, software versions, timestamps, and sometimes internal paths and hostnames. FOCA and exiftool extract this metadata at scale, feeding username lists and revealing internal naming conventions.",
  },
  {
    slug: "recon-l3-darkweb",
    competencyId: "recon-osint",
    depthTier: 3,
    sectionHeading: "Dark web and underground forums",
    prompt:
      "While monitoring dark web forums during an engagement, you find a post by an initial-access broker advertising 'Citrix VPN access to a US healthcare org — 15k revenue, 500 endpoints' with a price of $3,000. The description closely matches your client. How should this inform your engagement?",
    options: [
      "Report the finding immediately to the client as a priority intelligence item — an active broker listing means the target may already be compromised or valid credentials are circulating, which is a more urgent risk than anything your recon would uncover independently.",
      "Purchase the access to verify it is legitimate and include the cost in the engagement invoice — penetration testing rules of engagement implicitly authorize acquiring third-party access to demonstrate real-world threat scenarios to the client.",
      "Ignore the listing — initial-access broker posts are overwhelmingly fraudulent, and dark web forum posts cannot be attributed to specific organizations because brokers always anonymize the target's identity to avoid law enforcement attention.",
      "Use the listing's technical details to craft a simulated broker post as a social engineering pretext for the client's SOC team to test their dark web monitoring capabilities — the original listing itself has no direct operational value for the engagement.",
    ],
    correctIndex: 0,
    explanation:
      "Monitoring Tor forums, Telegram channels, and leak sites reveals active threats. An IAB listing matching the client indicates potential compromise and must be escalated immediately. Always ensure proper authorization and legal compliance when accessing such sources.",
  },
  {
    slug: "recon-l3-wireless-physical",
    competencyId: "recon-osint",
    depthTier: 3,
    sectionHeading: "Wireless and physical reconnaissance",
    prompt:
      "During physical recon outside a target building, you detect a WPA2-Enterprise network using EAP-PEAP/MSCHAPv2. A colleague suggests setting up a rogue AP with hostapd-mana. What specific weakness does this attack exploit, and what would you capture?",
    options: [
      "PEAP/MSCHAPv2 sends a challenge-response derived from the user's password hash to the authenticating server — a rogue AP impersonating the legitimate network captures these hashed credentials, which can then be cracked offline to recover plaintext passwords.",
      "WPA2-Enterprise transmits the network's pre-shared key during the four-way handshake with every connecting client — a rogue AP captures this PSK by initiating fake handshakes, and the single key decrypts all traffic for any device on the network.",
      "The rogue AP exploits a flaw in the RADIUS protocol where authentication tokens are transmitted in cleartext between the access point and the RADIUS server — capturing these tokens grants direct access to the RADIUS server's complete user database.",
      "The rogue AP forces clients to downgrade from WPA2 to WPA1, which has known RC4 keystream biases — capturing enough WPA1-encrypted frames allows statistical recovery of the network encryption key using tools like aircrack-ng's PTW attack.",
    ],
    correctIndex: 0,
    explanation:
      "Enterprise 802.1X networks authenticate individual users. Weak EAP methods like PEAP/MSCHAPv2 let a rogue AP (eaphammer, hostapd-mana) capture password hashes for offline cracking. WPA2-Enterprise does not use a PSK — each session derives unique keys.",
  },
  // ── L4 ──
  {
    slug: "recon-l4-custom-tooling",
    competencyId: "recon-osint",
    depthTier: 4,
    sectionHeading: "Custom OSINT tooling",
    prompt:
      "You are writing a Python script to probe 50,000 subdomains for HTTP responses. Sequential requests.get() calls would take roughly 14 hours. You refactor to use concurrent.futures.ThreadPoolExecutor with 100 workers. What makes threading specifically effective for this workload?",
    options: [
      "HTTP probing is I/O-bound — each thread spends most of its time waiting for network responses rather than computing, so 100 threads wait concurrently on different sockets while the OS handles scheduling, reducing wall-clock time by roughly two orders of magnitude.",
      "ThreadPoolExecutor bypasses Python's GIL entirely by spawning OS-level processes disguised as threads, which enables true parallel CPU execution of the HTTP response parsing logic that constitutes the primary performance bottleneck in sequential probing.",
      "Threading is effective because each worker thread gets its own isolated TCP/IP stack instance, allowing 100 simultaneous source IP addresses — this distributes traffic across different network routes and avoids triggering rate limits on the target's infrastructure.",
      "ThreadPoolExecutor improves performance primarily through connection pooling rather than concurrency — it reuses a fixed set of persistent TCP connections across all 50,000 requests, eliminating the three-way handshake overhead that dominates sequential probing time.",
    ],
    correctIndex: 0,
    explanation:
      "Recon probing is I/O-bound (waiting on network), not CPU-bound, so Python threads (despite the GIL) run effectively in parallel while blocked on socket I/O. Async (asyncio/aiohttp) is an alternative, but threading is simpler for request-based workloads.",
  },
  {
    slug: "recon-l4-cloud-enum",
    competencyId: "recon-osint",
    depthTier: 4,
    sectionHeading: "Cloud infrastructure enumeration",
    prompt:
      "You are enumerating cloud storage for a company called 'Acme Health.' Your wordlist generates candidates like acme-health-backup, acmehealth-dev, and acme-health-prod, testing them against S3, Azure Blob, and GCS endpoints. Several return HTTP 200 with ListBucketResult XML. What does this specific response indicate?",
    options: [
      "The buckets exist and allow anonymous listing — ListBucketResult is S3's response to an unauthenticated GET on a bucket with overly permissive ACLs, exposing the names, sizes, and last-modified timestamps of every object stored inside the bucket.",
      "The buckets exist but are properly secured — ListBucketResult is the standard access-denied error response from S3 when a bucket's IAM policy correctly blocks unauthorized requests, confirming the storage is configured with private-only access controls.",
      "The endpoints are returning a default cloud provider error page — all three providers return ListBucketResult XML for any bucket name that does not actually exist, so this response merely confirms the candidate names are unregistered and available.",
      "The buckets are encrypted at rest with customer-managed KMS keys — ListBucketResult is the encryption metadata envelope wrapping the bucket contents, and the XML payload includes the KMS key ARN needed to request decryption access from the provider.",
    ],
    correctIndex: 0,
    explanation:
      "Bucket names are guessable, so permutation wordlists against S3/Azure Blob/GCS surface misconfigured public buckets. ListBucketResult confirms anonymous read access — a critical misconfiguration that often exposes backups, logs, and sensitive data.",
  },
  {
    slug: "recon-l4-threat-intel",
    competencyId: "recon-osint",
    depthTier: 4,
    sectionHeading: "Threat intelligence correlation",
    prompt:
      "Your recon data shows: subfinder found staging.example.com, Shodan reveals it runs Jenkins on port 8080 with no authentication, and Dehashed shows the IT admin's email in a 2020 breach with a reused password pattern. How does correlating these findings change the risk picture compared to viewing each alone?",
    options: [
      "Correlation reveals a concrete attack path — an exposed, unauthenticated Jenkins instance combined with a likely-valid credential from breach data creates a chain from passive recon directly to potential initial access, which no single finding implies on its own.",
      "Correlation matters only for report presentation — each finding carries the same severity whether viewed alone or together, and combining them adds narrative polish for the client but does not change the technical risk rating or recommended remediation priority.",
      "Correlation primarily helps attribute the findings to a specific threat actor group — by matching the subdomain pattern, exposed service, and breach data against known APT playbooks in MITRE ATT&CK, you can predict which adversary is most likely already inside.",
      "Correlation is mainly useful for reducing scanner false positives — when three independent data sources all reference the same target asset, it statistically confirms the findings are genuine rather than artifacts, but the actual attack surface remains unchanged.",
    ],
    correctIndex: 0,
    explanation:
      "Correlating subdomains, exposed services, and breach data turns scattered findings into actionable attack paths. A staging Jenkins with no auth plus a breached admin credential is far more dangerous than either finding alone — context creates the chain.",
  },
  // ── L5 ──
  {
    slug: "recon-l5-geoint",
    competencyId: "recon-osint",
    depthTier: 5,
    sectionHeading: "Geolocation and imagery intelligence",
    prompt:
      "A target posts a photo on social media that has been stripped of EXIF data. The image shows a distinctive church spire, midday shadows falling due north, and a street sign partially visible in Cyrillic script. How would you approach geolocating this image?",
    options: [
      "Northward midday shadows place it in the Southern Hemisphere or the tropics during the right season, Cyrillic narrows it to a handful of countries, and the distinctive church spire can be matched via reverse image search and satellite imagery to pinpoint the exact location.",
      "Upload the image to a facial recognition API to identify bystanders in the background, then cross-reference their social media check-ins and geotagged posts from the same timeframe to triangulate the photographer's location indirectly through nearby people.",
      "Analyze the JPEG compression artifacts and quantization tables to determine which phone model captured the image, then query the manufacturer's device registry with the derived hardware signature to find the registered owner's billing address as a starting point.",
      "Submit the photo to multiple reverse image search engines and use the geographic distribution of websites that host visually similar images — the hosting country of the plurality of matching websites statistically indicates the region where the original photo was taken.",
    ],
    correctIndex: 0,
    explanation:
      "Visual clues — shadow angle for latitude/season (via SunCalc), signage language/script, architectural style — plus reverse image search and satellite/street-view imagery pin a location. EXIF GPS is the shortcut, but visual analysis works without it.",
  },
  {
    slug: "recon-l5-sockpuppet",
    competencyId: "recon-osint",
    depthTier: 5,
    sectionHeading: "Sock puppet and operational security",
    prompt:
      "You are running a long-term OSINT investigation using a sock-puppet LinkedIn profile. After three months of building connections, you accidentally log into the sock puppet from the same browser where your real LinkedIn session is active. What is the primary OPSEC concern?",
    options: [
      "LinkedIn correlates browser fingerprints, cookies, and IP addresses across sessions — logging in from the same browser may link both profiles in LinkedIn's backend, potentially exposing the sock puppet's true operator to the target or triggering an account integrity review.",
      "The primary concern is that LinkedIn's terms of service prohibit multiple accounts, and a detected violation triggers automatic notification emails to every connection of both profiles — including the investigation target — explaining that a fake account was identified.",
      "The concern is strictly about browser tab confusion — you might accidentally send a message from the wrong profile, but LinkedIn has no technical capability to correlate accounts since each session uses fully independent server-side authentication tokens.",
      "The primary risk is that LinkedIn will merge both profiles into a single account using its AI-powered identity resolution system, combining your real employment history with the sock puppet's fabricated background and displaying the merged profile to all connections.",
    ],
    correctIndex: 0,
    explanation:
      "A sock puppet needs strict compartmentalization — separate browser profiles, VPN endpoints, and device fingerprints. Platforms correlate sessions via cookies, fingerprints, and IP patterns. Cross-contamination can burn months of relationship building and expose the investigator.",
  },
  {
    slug: "recon-l5-ml",
    competencyId: "recon-osint",
    depthTier: 5,
    sectionHeading: "Machine learning for OSINT",
    prompt:
      "Your OSINT team proposes using a facial recognition API to match faces from the target company's public event photos against social media profiles to build an employee roster. The engagement is authorized for passive recon only. What concern should you raise before proceeding?",
    options: [
      "Biometric processing of facial images is regulated by laws like GDPR and BIPA even when source photos are publicly available — facial recognition may violate privacy regulations regardless of engagement authorization, and proportionality must be assessed before proceeding.",
      "The concern is purely technical accuracy — facial recognition APIs produce false positive rates above 60% on candid event photography due to variable lighting and angles, making the resulting employee roster too unreliable for inclusion in a professional report.",
      "Facial recognition only functions on frontal passport-style photos with controlled backgrounds and cannot process candid event photography at all, so the technical limitation makes the proposal entirely impractical — manual review of photos would be more effective.",
      "The only real concern is API cost — facial recognition services charge per comparison, and matching thousands of event photos against millions of social media profiles would far exceed any reasonable engagement budget without producing substantially better results than manual review.",
    ],
    correctIndex: 0,
    explanation:
      "ML-powered facial recognition crosses significant privacy boundaries. GDPR, BIPA, and similar laws regulate biometric data processing regardless of whether the source images are public. Authorization for passive recon does not automatically authorize biometric processing — proportionality and legality must be evaluated separately.",
  },
];
