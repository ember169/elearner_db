import type { SeedExercise } from "./types";

/** net-fundamentals (L0–L5) + net-attacks (L0–L5) — one MCQ per teaching section. */
export const NETWORKING_EXERCISES: SeedExercise[] = [
  // ══ net-fundamentals L0 ══
  {
    slug: "net-fund-l0-what",
    competencyId: "net-fundamentals",
    depthTier: 0,
    sectionHeading: "What is networking",
    prompt: "What is the fundamental purpose of computer networking?",
    options: [
      "To let independent devices exchange data using agreed protocols.",
      "To encrypt every file on a single computer.",
      "To replace the operating system's scheduler.",
      "To store data permanently on disk.",
    ],
    correctIndex: 0,
    explanation:
      "Networking is about devices communicating via shared protocols (IP, TCP, DNS…). Understanding it underlies both defense and attack of any connected system.",
  },
  {
    slug: "net-fund-l0-models",
    competencyId: "net-fundamentals",
    depthTier: 0,
    sectionHeading: "The OSI and TCP/IP models",
    prompt: "Which OSI layer does IP operate at, and TCP?",
    options: [
      "IP is layer 3 (network); TCP is layer 4 (transport).",
      "IP is layer 4; TCP is layer 3.",
      "Both are layer 2 (data link).",
      "Both are layer 7 (application).",
    ],
    correctIndex: 0,
    explanation:
      "The layered model separates concerns: link (2, Ethernet/ARP), network (3, IP/routing), transport (4, TCP/UDP), up to application (7). Attacks and defenses map to specific layers.",
  },
  {
    slug: "net-fund-l0-vocab",
    competencyId: "net-fundamentals",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt: "What does a MAC address identify, versus an IP address?",
    options: [
      "A MAC address identifies a network interface at layer 2 (local link); an IP address identifies a host at layer 3 (routable).",
      "A MAC address is the public internet address; IP is local only.",
      "They are the same thing with different names.",
      "A MAC address is the DNS name of a host.",
    ],
    correctIndex: 0,
    explanation:
      "MAC addresses are link-local hardware identifiers; IP addresses are logical, routable addresses. ARP maps between them on a local segment.",
  },
  // ══ net-fundamentals L1 ══
  {
    slug: "net-fund-l1-subnetting",
    competencyId: "net-fundamentals",
    depthTier: 1,
    sectionHeading: "IP addressing and subnetting",
    prompt: "How many usable host addresses does a /24 network provide?",
    options: [
      "254 (256 addresses minus network and broadcast).",
      "256.",
      "128.",
      "512.",
    ],
    correctIndex: 0,
    explanation:
      "A /24 has 256 addresses; subtracting the network and broadcast leaves 254 usable hosts. Each extra prefix bit halves the size (/25 = 128, /26 = 64). The RFC 1918 private ranges are 10/8, 172.16/12, 192.168/16.",
  },
  {
    slug: "net-fund-l1-tcp-udp",
    competencyId: "net-fundamentals",
    depthTier: 1,
    sectionHeading: "TCP and UDP",
    prompt: "What is the key difference between TCP and UDP?",
    options: [
      "TCP is connection-oriented with reliable, ordered delivery (three-way handshake); UDP is connectionless with no delivery guarantee.",
      "TCP is connectionless; UDP is reliable and ordered.",
      "Both guarantee ordered delivery.",
      "UDP requires a three-way handshake; TCP does not.",
    ],
    correctIndex: 0,
    explanation:
      "TCP (RFC 793) sets up a connection (SYN/SYN-ACK/ACK) and guarantees ordered, reliable bytes; UDP (RFC 768) is fire-and-forget, used for DNS, DHCP, and real-time traffic.",
  },
  {
    slug: "net-fund-l1-dns",
    competencyId: "net-fundamentals",
    depthTier: 1,
    sectionHeading: "DNS resolution",
    prompt: "Which DNS record maps a hostname to an IPv4 address?",
    options: [
      "An A record (AAAA for IPv6).",
      "An MX record.",
      "A TXT record.",
      "A PTR record.",
    ],
    correctIndex: 0,
    explanation:
      "A = IPv4, AAAA = IPv6, CNAME = alias, MX = mail, NS = nameserver, TXT = text, PTR = reverse. `dig +trace` walks the full resolution path from the root.",
  },
  {
    slug: "net-fund-l1-arp",
    competencyId: "net-fundamentals",
    depthTier: 1,
    sectionHeading: "ARP and layer 2",
    prompt: "Why is ARP spoofing possible on a local network?",
    options: [
      "ARP has no authentication, so an attacker can send forged replies to redirect traffic (man-in-the-middle).",
      "ARP encrypts replies, which the attacker decrypts.",
      "ARP requires a password the attacker guesses.",
      "ARP only works over the internet, not locally.",
    ],
    correctIndex: 0,
    explanation:
      "ARP maps IP↔MAC with no authentication, so poisoned replies let an attacker impersonate the gateway and intercept local traffic — the basis of MAC flooding and VLAN-hopping-adjacent attacks too.",
  },
  // ══ net-fundamentals L2 ══
  {
    slug: "net-fund-l2-tcp-lifecycle",
    competencyId: "net-fundamentals",
    depthTier: 2,
    sectionHeading: "TCP connection lifecycle",
    prompt: "A host showing many SYN_RECV states may indicate what?",
    options: [
      "A SYN flood — half-open connections from spoofed SYNs exhausting the connection backlog.",
      "A successful graceful shutdown of many connections.",
      "That the host is idle.",
      "A DNS misconfiguration.",
    ],
    correctIndex: 0,
    explanation:
      "SYN_RECV means a SYN-ACK was sent but the final ACK never arrived; a flood of these is a SYN flood. TIME_WAIT (post-close) and CLOSE_WAIT (a possible app bug) are other diagnostic states.",
  },
  {
    slug: "net-fund-l2-pcap",
    competencyId: "net-fundamentals",
    depthTier: 2,
    sectionHeading: "Packet analysis with tcpdump and Wireshark",
    prompt: "Which tcpdump filter captures only TCP SYN packets (connection initiations)?",
    options: [
      "`tcp[tcpflags] & tcp-syn != 0`",
      "`udp port 53`",
      "`icmp`",
      "`host 10.0.0.1 and port 80` only",
    ],
    correctIndex: 0,
    explanation:
      "BPF filters can test TCP flag bits; matching the SYN flag isolates connection starts. Wireshark uses a different display-filter syntax (e.g. tcp.flags.syn == 1 && tcp.flags.ack == 0).",
  },
  {
    slug: "net-fund-l2-dhcp",
    competencyId: "net-fundamentals",
    depthTier: 2,
    sectionHeading: "DHCP and network bootstrapping",
    prompt: "What is a rogue DHCP attack?",
    options: [
      "An attacker runs a DHCP server that assigns their machine as the client's gateway/DNS, becoming a man-in-the-middle.",
      "Flooding the network with valid DNS queries.",
      "Encrypting the DHCP lease database.",
      "Assigning IPv6 addresses to IPv4 hosts.",
    ],
    correctIndex: 0,
    explanation:
      "DHCP is DISCOVER/OFFER/REQUEST/ACK. A rogue server (often after DHCP starvation exhausts the real pool) hands out attacker-controlled gateway/DNS. DHCP snooping on managed switches mitigates it.",
  },
  {
    slug: "net-fund-l2-routing-icmp",
    competencyId: "net-fundamentals",
    depthTier: 2,
    sectionHeading: "Routing and ICMP",
    prompt: "Which ICMP type does traceroute rely on to discover each hop?",
    options: [
      "Type 11 (Time Exceeded), returned when the TTL reaches zero at each hop.",
      "Type 8 (Echo Request) only.",
      "Type 3 (Destination Unreachable) only.",
      "Type 0 (Echo Reply) exclusively.",
    ],
    correctIndex: 0,
    explanation:
      "traceroute sends packets with increasing TTL; each router that decrements TTL to zero returns a Time Exceeded (type 11), revealing the hop. Type 3 (unreachable) also leaks host/port liveness.",
  },
  {
    slug: "net-fund-l2-vlans",
    competencyId: "net-fundamentals",
    depthTier: 2,
    sectionHeading: "VLANs and network segmentation",
    prompt: "How does a double-tagging VLAN hopping attack work?",
    options: [
      "The frame carries two 802.1Q tags; the first switch strips the outer (native VLAN) tag and forwards it into the inner victim VLAN.",
      "The attacker guesses the VLAN password.",
      "It floods the switch's MAC table until VLANs merge.",
      "It disables 802.1Q on the router.",
    ],
    correctIndex: 0,
    explanation:
      "With the outer tag matching the native VLAN, the first switch removes it and forwards the still-tagged frame into another VLAN. Mitigations: disable DTP, set the native VLAN to an unused ID, use explicit access ports.",
  },
  // ══ net-fundamentals L3 ══
  {
    slug: "net-fund-l3-ipv6",
    competencyId: "net-fundamentals",
    depthTier: 3,
    sectionHeading: "IPv6 networking",
    prompt: "Why is IPv6 a security concern even on IPv4-focused networks?",
    options: [
      "It is often enabled but unmonitored, so rogue Router Advertisements (SLAAC) enable man-in-the-middle attacks.",
      "IPv6 cannot be attacked at all.",
      "IPv6 disables ARP, making the network unusable.",
      "IPv6 addresses are always public and static.",
    ],
    correctIndex: 0,
    explanation:
      "Hosts (notably Windows) prefer IPv6, so an attacker sending rogue RAs or DHCPv6 (mitm6) can become the client's gateway/DNS on a network nobody is watching. Neighbor Discovery replaces ARP.",
  },
  {
    slug: "net-fund-l3-tls",
    competencyId: "net-fundamentals",
    depthTier: 3,
    sectionHeading: "TLS and certificate infrastructure",
    prompt: "During the TLS handshake, what does the client verify about the server's certificate?",
    options: [
      "That it chains to a trusted root CA and matches the hostname (and is unexpired/unrevoked).",
      "That it was issued in the same country as the client.",
      "That it contains the server's plaintext private key.",
      "That it is smaller than 1 KB.",
    ],
    correctIndex: 0,
    explanation:
      "The client validates the certificate chain to a trusted root, checks hostname, expiry, and revocation, then does an ECDHE key exchange for forward secrecy before the encrypted Finished messages.",
  },
  {
    slug: "net-fund-l3-nat",
    competencyId: "net-fundamentals",
    depthTier: 3,
    sectionHeading: "Network address translation deep dive",
    prompt: "What does PAT (Port Address Translation) enable?",
    options: [
      "Many internal hosts share one public IP by mapping distinct source ports.",
      "Encrypting all outbound traffic automatically.",
      "Assigning each host its own public IP.",
      "Blocking all inbound connections permanently.",
    ],
    correctIndex: 0,
    explanation:
      "PAT (NAT overload) multiplexes many private hosts behind one public IP via port mappings — which is why one public IP can represent hundreds of hosts, complicating forensics. SNAT rewrites source, DNAT does port forwarding.",
  },
  {
    slug: "net-fund-l3-wireless",
    competencyId: "net-fundamentals",
    depthTier: 3,
    sectionHeading: "Wireless networking security",
    prompt: "Why does capturing the WPA2 4-way handshake let an attacker crack the passphrase offline?",
    options: [
      "The handshake carries nonces and a MIC derived from the passphrase, so a guess can be verified offline without contacting the AP.",
      "The handshake contains the passphrase in cleartext.",
      "The AP sends the passphrase after a deauth.",
      "WPA2 has no encryption to crack.",
    ],
    correctIndex: 0,
    explanation:
      "The 4-way handshake never sends the passphrase, but the MIC is derived from it, so aircrack tests candidates offline. A deauth forces a reconnection to capture the handshake. WPA3's SAE resists offline dictionary attacks.",
  },
  {
    slug: "net-fund-l3-dns-security",
    competencyId: "net-fundamentals",
    depthTier: 3,
    sectionHeading: "DNS security and attacks",
    prompt: "What does DNSSEC add to defend DNS?",
    options: [
      "Cryptographic signatures on DNS records so resolvers can verify authenticity and detect spoofing.",
      "Encryption of the query so no one can read it.",
      "A password on every DNS lookup.",
      "Automatic blocking of all external queries.",
    ],
    correctIndex: 0,
    explanation:
      "DNSSEC signs records to prevent cache poisoning/spoofing (it authenticates, not encrypts). DoH/DoT add confidentiality. Zone transfers (AXFR) on misconfigured servers leak all records.",
  },
  // ══ net-fundamentals L4 ══
  {
    slug: "net-fund-l4-congestion",
    competencyId: "net-fundamentals",
    depthTier: 4,
    sectionHeading: "TCP congestion control and performance",
    prompt: "What does TCP's Slow Start phase do?",
    options: [
      "Grows the congestion window exponentially until a threshold, probing available bandwidth.",
      "Sends packets as slowly as possible to save power.",
      "Disables retransmission of lost packets.",
      "Halves the window on every ACK.",
    ],
    correctIndex: 0,
    explanation:
      "Slow Start ramps up exponentially, then Congestion Avoidance grows linearly; Fast Retransmit/Recovery react to loss. Modern algorithms include CUBIC (Linux default) and BBR. TCP reset and SYN-flood attacks target the state machine.",
  },
  {
    slug: "net-fund-l4-bgp",
    competencyId: "net-fundamentals",
    depthTier: 4,
    sectionHeading: "BGP and internet routing",
    prompt: "What is BGP hijacking?",
    options: [
      "An Autonomous System announces routes for IP prefixes it doesn't own, redirecting traffic to itself.",
      "Flooding a single host with BGP packets.",
      "Encrypting BGP updates so peers can't read them.",
      "Renaming a domain's nameservers.",
    ],
    correctIndex: 0,
    explanation:
      "BGP exchanges reachability between ASes; a false prefix announcement reroutes traffic (e.g. Pakistan/YouTube, 2008). RPKI validates route origins but adoption is still incomplete.",
  },
  {
    slug: "net-fund-l4-scapy",
    competencyId: "net-fundamentals",
    depthTier: 4,
    sectionHeading: "Network protocol dissection with Scapy",
    prompt: "What makes Scapy useful for security work?",
    options: [
      "It lets you craft, send, and dissect packets at any layer, enabling custom scans, spoofing, and protocol analysis.",
      "It only captures traffic and cannot send.",
      "It is a GUI-only packet viewer.",
      "It replaces the kernel's TCP stack permanently.",
    ],
    correctIndex: 0,
    explanation:
      "Scapy builds arbitrary packets layer by layer (IP()/TCP()/DNS()...), so you can hand-craft SYN scans, ARP requests, DNS queries, and TTL-based traceroutes — invaluable for testing and exploitation.",
  },
  {
    slug: "net-fund-l4-tunneling",
    competencyId: "net-fundamentals",
    depthTier: 4,
    sectionHeading: "Network tunneling and encapsulation",
    prompt: "What does `ssh -D 9050 jump-host` provide?",
    options: [
      "A dynamic SOCKS proxy, tunneling arbitrary TCP through the jump host (useful for pivoting).",
      "A local file transfer only.",
      "A reverse shell to the attacker.",
      "A DNS server on port 9050.",
    ],
    correctIndex: 0,
    explanation:
      "SSH dynamic forwarding creates a SOCKS proxy so tools (via proxychains) reach networks behind the jump host. Tunneling (SSH, GRE, VXLAN) is used both legitimately and for pivoting/exfiltration through allowed protocols.",
  },
  // ══ net-fundamentals L5 ══
  {
    slug: "net-fund-l5-stack",
    competencyId: "net-fundamentals",
    depthTier: 5,
    sectionHeading: "TCP/IP stack implementation details",
    prompt: "What is the sk_buff in the Linux networking stack?",
    options: [
      "The kernel's packet representation, holding headers, data, and metadata as a packet traverses the stack.",
      "A user-space library for sockets.",
      "The routing table on disk.",
      "A hardware register on the NIC.",
    ],
    correctIndex: 0,
    explanation:
      "sk_buff is the core packet structure passed through the stack (NIC → netfilter → routing → socket). net_device represents an interface and sock a socket endpoint; /proc/net exposes stats.",
  },
  {
    slug: "net-fund-l5-xdp",
    competencyId: "net-fundamentals",
    depthTier: 5,
    sectionHeading: "XDP and high-performance packet processing",
    prompt: "Why can XDP filter packets at line rate for DDoS mitigation?",
    options: [
      "It runs an eBPF program at the driver level, before the kernel networking stack, dropping packets very early.",
      "It buffers all packets to disk first.",
      "It runs entirely in user space with no kernel involvement.",
      "It rewrites the NIC firmware on every packet.",
    ],
    correctIndex: 0,
    explanation:
      "XDP (eXpress Data Path) executes eBPF at the earliest driver hook, so XDP_DROP discards malicious traffic before costly stack processing — millions of packets per second per core. kqueue/epoll are unrelated I/O mechanisms.",
  },
  {
    slug: "net-fund-l5-edge-cases",
    competencyId: "net-fundamentals",
    depthTier: 5,
    sectionHeading: "Protocol edge cases and exploits",
    prompt: "How can IP fragmentation be used to evade a firewall?",
    options: [
      "Overlapping fragments can bypass firewalls that inspect only the first fragment, and reassemble maliciously on the target.",
      "Fragments are always dropped, so they can't evade anything.",
      "Fragmentation encrypts the payload.",
      "It changes the destination IP mid-transit.",
    ],
    correctIndex: 0,
    explanation:
      "Firewalls that don't fully reassemble can miss content split across overlapping fragments (the teardrop attack crashed old kernels). Predictable TCP ISNs (pre-RFC 6528) and ICMP redirects are other protocol-level abuses.",
  },
  {
    slug: "net-fund-l5-perf",
    competencyId: "net-fundamentals",
    depthTier: 5,
    sectionHeading: "Network performance analysis",
    prompt: "Which tool measures achievable bandwidth between two hosts?",
    options: [
      "iperf3 (client/server throughput test).",
      "traceroute.",
      "nslookup.",
      "arp.",
    ],
    correctIndex: 0,
    explanation:
      "iperf3 measures throughput; irtt measures latency under load (bufferbloat), and ss -ti exposes retransmission and window stats. Kernel tunables (rmem/wmem) raise throughput on high-BDP links.",
  },
  // ══ net-attacks L0 ══
  {
    slug: "net-atk-l0-what",
    competencyId: "net-attacks",
    depthTier: 0,
    sectionHeading: "What is network enumeration",
    prompt: "What is network enumeration?",
    options: [
      "Discovering hosts, open ports, running services, and their versions to map the attack surface.",
      "Encrypting the target's network traffic.",
      "Physically rewiring the network.",
      "Installing patches on remote hosts.",
    ],
    correctIndex: 0,
    explanation:
      "Enumeration is the first active step after passive recon — probing the network to inventory reachable hosts, ports, and service versions that later phases target.",
  },
  {
    slug: "net-atk-l0-why",
    competencyId: "net-attacks",
    depthTier: 0,
    sectionHeading: "Why enumeration matters",
    prompt: "Why is accurate service/version enumeration so valuable?",
    options: [
      "Exact versions map to known CVEs — the difference between a vulnerable and a patched service.",
      "It automatically exploits every host.",
      "It hides the attacker's IP.",
      "It is only useful for documentation.",
    ],
    correctIndex: 0,
    explanation:
      "Knowing a service is, say, Apache 2.4.49 vs 2.4.52 tells you whether a specific vulnerability applies, so precise fingerprinting directs the whole attack.",
  },
  {
    slug: "net-atk-l0-vocab",
    competencyId: "net-attacks",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt: "What does a “banner” refer to in enumeration?",
    options: [
      "The identifying text a service returns on connection (e.g. SSH-2.0-OpenSSH_8.9), revealing software and version.",
      "The company logo on the website.",
      "A firewall rule name.",
      "The subject line of an email.",
    ],
    correctIndex: 0,
    explanation:
      "Service banners leak product and version info, feeding CVE lookups. Grabbing them (nc, curl -I, nmap -sV) is a core enumeration step.",
  },
  // ══ net-attacks L1 ══
  {
    slug: "net-atk-l1-host-discovery",
    competencyId: "net-attacks",
    depthTier: 1,
    sectionHeading: "Host discovery with Nmap",
    prompt: "Why is ARP scanning the most reliable host discovery on a local network?",
    options: [
      "ARP is required for local IP communication, so it can't be blocked without breaking networking.",
      "ARP works across the internet, unlike ICMP.",
      "ARP responses are encrypted and trusted.",
      "ARP scanning is slower but stealthier.",
    ],
    correctIndex: 0,
    explanation:
      "On the local segment, `nmap -sn -PR` uses ARP, which every host must answer to function. On remote networks you combine ICMP and TCP probes since ARP doesn't route.",
  },
  {
    slug: "net-atk-l1-port-scan",
    competencyId: "net-attacks",
    depthTier: 1,
    sectionHeading: "Port scanning techniques",
    prompt: "Why is a TCP SYN scan (-sS) considered stealthier than a connect scan (-sT)?",
    options: [
      "It never completes the three-way handshake, so the connection is less likely to be logged by the application.",
      "It uses UDP instead of TCP.",
      "It sends encrypted probes.",
      "It scans fewer ports by default.",
    ],
    correctIndex: 0,
    explanation:
      "A SYN scan sends SYN and, on SYN-ACK, replies RST instead of ACK — no full connection, so apps often don't log it. A connect scan completes the handshake (used when raw sockets aren't available). UDP scans are slow (no handshake to confirm).",
  },
  {
    slug: "net-atk-l1-version",
    competencyId: "net-attacks",
    depthTier: 1,
    sectionHeading: "Service and version detection",
    prompt: "What does `nmap -sV` add over a plain port scan?",
    options: [
      "It probes open ports to identify the service and its exact version.",
      "It only checks whether ports are open or closed.",
      "It performs a denial-of-service test.",
      "It changes the target's firewall rules.",
    ],
    correctIndex: 0,
    explanation:
      "-sV fingerprints the actual software and version behind each port (e.g. OpenSSH 8.9p1), which is what you map to CVEs. -O adds OS detection and -A bundles version, scripts, OS, and traceroute.",
  },
  {
    slug: "net-atk-l1-quick-scripts",
    competencyId: "net-attacks",
    depthTier: 1,
    sectionHeading: "Quick enumeration scripts",
    prompt: "What is the Nmap Scripting Engine (NSE) used for?",
    options: [
      "Running scripts (default, vuln, http-enum, …) to automate enumeration and vulnerability checks against discovered services.",
      "Compiling Nmap from source.",
      "Encrypting scan output.",
      "Configuring the local firewall.",
    ],
    correctIndex: 0,
    explanation:
      "NSE scripts extend Nmap with tasks like default-credential checks, vuln detection, and service enumeration. netcat banner grabs and curl -I are quick manual complements.",
  },
  // ══ net-attacks L2 ══
  {
    slug: "net-atk-l2-smb",
    competencyId: "net-attacks",
    depthTier: 2,
    sectionHeading: "SMB enumeration",
    prompt: "What is a “null session” in SMB enumeration?",
    options: [
      "An anonymous, unauthenticated connection that may still enumerate users, shares, or policies on misconfigured hosts.",
      "A session that has timed out.",
      "An encrypted SMB3 connection.",
      "A connection using the domain admin account.",
    ],
    correctIndex: 0,
    explanation:
      "Null sessions (rpcclient -U \"\" -N) can leak users/shares on weakly configured systems. Common SMB findings include anonymous share access, writable shares, and SMBv1 (EternalBlue).",
  },
  {
    slug: "net-atk-l2-snmp",
    competencyId: "net-attacks",
    depthTier: 2,
    sectionHeading: "SNMP enumeration",
    prompt: "Why is SNMP a rich enumeration target?",
    options: [
      "Default/weak community strings (like \"public\") allow walking the MIB to reveal system info, processes, and network config.",
      "SNMP transmits the admin password in every packet.",
      "SNMP grants shell access by design.",
      "SNMP can only report uptime.",
    ],
    correctIndex: 0,
    explanation:
      "With a guessed community string (onesixtyone), snmpwalk enumerates the MIB tree — system description, running processes, interfaces, sometimes credentials. It's read-only info, but very revealing.",
  },
  {
    slug: "net-atk-l2-ldap",
    competencyId: "net-attacks",
    depthTier: 2,
    sectionHeading: "LDAP and Active Directory enumeration",
    prompt: "What can anonymous or authenticated LDAP queries retrieve from a domain?",
    options: [
      "Directory objects such as users, groups, and the password policy (minPwdLength, lockoutThreshold).",
      "The plaintext of every user's password.",
      "The domain controller's disk image.",
      "The BIOS settings of each host.",
    ],
    correctIndex: 0,
    explanation:
      "LDAP (389/636) exposes AD objects and attributes; even anonymous binds can leak data on misconfigured DCs. The password policy guides spraying without triggering lockouts.",
  },
  {
    slug: "net-atk-l2-web-enum",
    competencyId: "net-attacks",
    depthTier: 2,
    sectionHeading: "Web service enumeration",
    prompt: "What is directory/content brute forcing (gobuster/ffuf) used to find?",
    options: [
      "Hidden paths, files, and endpoints not linked from the site (admin panels, backups, APIs).",
      "The server's TLS private key.",
      "The database schema.",
      "Other users' passwords directly.",
    ],
    correctIndex: 0,
    explanation:
      "Wordlist-driven fuzzing reveals unlinked directories, files, virtual hosts, and API endpoints. whatweb fingerprints the tech stack of what's found.",
  },
  {
    slug: "net-atk-l2-output",
    competencyId: "net-attacks",
    depthTier: 2,
    sectionHeading: "Output management",
    prompt: "Why run `nmap -oA` to save results in all formats?",
    options: [
      "It writes .nmap, .xml, and .gnmap so results can be documented, parsed programmatically, and grep'd later.",
      "It encrypts the scan so no one can read it.",
      "It uploads the scan to the target.",
      "It deletes the scan after printing.",
    ],
    correctIndex: 0,
    explanation:
      "-oA produces human-readable, XML (machine-parseable, e.g. with libnmap), and greppable outputs, so findings feed reports and downstream tooling. Documentation is part of a real engagement.",
  },
  // ══ net-attacks L3 ══
  {
    slug: "net-atk-l3-mitm",
    competencyId: "net-attacks",
    depthTier: 3,
    sectionHeading: "Man-in-the-middle attacks",
    prompt: "Once positioned as a local MitM (e.g. via ARP spoofing), what can an attacker do?",
    options: [
      "Capture cleartext credentials, SSL-strip HTTPS to HTTP, inject content, and grab NTLM hashes.",
      "Only observe encrypted traffic with no useful result.",
      "Change the victim's BIOS password.",
      "Nothing without the victim's private key.",
    ],
    correctIndex: 0,
    explanation:
      "MitM (arpspoof/bettercap with IP forwarding) lets the attacker read cleartext protocols, downgrade TLS via SSL stripping, inject into HTTP, and capture NTLM/NTLMv2 from SMB/HTTP auth.",
  },
  {
    slug: "net-atk-l3-pivot",
    competencyId: "net-attacks",
    depthTier: 3,
    sectionHeading: "Pivoting through compromised hosts",
    prompt: "What does pivoting through a compromised host achieve?",
    options: [
      "Reaching internal networks not directly accessible, by routing traffic through the foothold (e.g. SSH -L/-D, chisel, proxychains).",
      "Deleting logs on the foothold automatically.",
      "Encrypting the attacker's own machine.",
      "Assigning a public IP to internal hosts.",
    ],
    correctIndex: 0,
    explanation:
      "A compromised host bridges into otherwise-unreachable segments via port forwarding or a SOCKS proxy; chisel helps when SSH isn't available, and double pivots chain through two hops.",
  },
  {
    slug: "net-atk-l3-password",
    competencyId: "net-attacks",
    depthTier: 3,
    sectionHeading: "Password attacks on network services",
    prompt: "Why is password spraying preferred over brute forcing one account?",
    options: [
      "Trying one common password across many users avoids account lockout policies that per-account brute forcing would trigger.",
      "It is guaranteed to find the domain admin password.",
      "It works only against a single account.",
      "It never generates any authentication logs.",
    ],
    correctIndex: 0,
    explanation:
      "Spraying (one password, many users) stays under lockout thresholds, unlike hammering one account. hydra/medusa/ncrack/crackmapexec drive it; common patterns include Season+Year! and Welcome1.",
  },
  {
    slug: "net-atk-l3-relay",
    competencyId: "net-attacks",
    depthTier: 3,
    sectionHeading: "Relay and coercion attacks",
    prompt: "Why does an NTLM relay attack succeed?",
    options: [
      "NTLM's challenge-response isn't bound to its connection, so the attacker forwards a victim's authentication to a different target and authenticates as the victim.",
      "The attacker cracks the NTLM hash instantly.",
      "The victim sends their password in cleartext.",
      "It only works with domain admin credentials.",
    ],
    correctIndex: 0,
    explanation:
      "Because the response isn't tied to the channel, ntlmrelayx forwards it elsewhere (SMB/LDAP/HTTPS). Coercion (PetitPotam) and LLMNR/NBT-NS poisoning (Responder) provide the authentication; SMB signing and EPA defend.",
  },
  {
    slug: "net-atk-l3-service-exploit",
    competencyId: "net-attacks",
    depthTier: 3,
    sectionHeading: "Network service exploitation",
    prompt: "Which vulnerability is associated with SMB on port 445?",
    options: [
      "EternalBlue (and null sessions / relay).",
      "BlueKeep on RDP.",
      "Shellshock on Bash.",
      "Heartbleed on OpenSSL.",
    ],
    correctIndex: 0,
    explanation:
      "SMBv1's EternalBlue is the classic 445 exploit; RDP (3389) has BlueKeep, SMTP (25) has open relay/user enum, DNS (53) has zone transfer/poisoning. Mapping service→known-vuln guides exploitation.",
  },
  // ══ net-attacks L4 ══
  {
    slug: "net-atk-l4-evasion",
    competencyId: "net-attacks",
    depthTier: 4,
    sectionHeading: "Advanced scanning evasion",
    prompt: "Why is Nmap's idle scan (-sI) completely stealthy to the target?",
    options: [
      "The target only ever sees packets from the zombie host; the attacker's IP never appears, exploiting predictable IP ID sequences.",
      "It encrypts every probe so the target can't decode them.",
      "It scans only one port very slowly.",
      "It spoofs the target's own IP as the source.",
    ],
    correctIndex: 0,
    explanation:
      "The idle scan infers port state by watching a zombie's IP ID increments, so the target sees traffic only from the zombie. Fragmentation (-f), decoys (-D), and slow timing (-T1) are other evasions.",
  },
  {
    slug: "net-atk-l4-ipv6-attacks",
    competencyId: "net-attacks",
    depthTier: 4,
    sectionHeading: "IPv6 network attacks",
    prompt: "What does the mitm6 + ntlmrelayx combination exploit?",
    options: [
      "Windows preferring IPv6: mitm6 answers DHCPv6 to become the DNS server, then relays captured authentication (e.g. to LDAP).",
      "A buffer overflow in the IPv6 stack.",
      "Weak WPA2 encryption on wired links.",
      "Cleartext HTTP on port 80 only.",
    ],
    correctIndex: 0,
    explanation:
      "In dual-stack environments Windows favors IPv6, so mitm6 poisons DHCPv6/DNS and ntlmrelayx forwards the resulting authentication — highly effective where IPv6 is on but unmonitored.",
  },
  {
    slug: "net-atk-l4-protocol-attacks",
    competencyId: "net-attacks",
    depthTier: 4,
    sectionHeading: "Protocol-level attacks",
    prompt: "What underlying weakness do STP root-bridge takeover and DHCP starvation share?",
    options: [
      "Layer-2 protocols were designed to trust anything on the wire, with no authentication.",
      "They both require the target's TLS certificate.",
      "They only work over the public internet.",
      "They exploit a bug in AES.",
    ],
    correctIndex: 0,
    explanation:
      "STP takeover (forged low-priority BPDU), DHCP starvation + rogue DHCP, and DNS cache poisoning all abuse unauthenticated trust in early/L2 protocols. yersinia drives many of these.",
  },
  {
    slug: "net-atk-l4-interception",
    competencyId: "net-attacks",
    depthTier: 4,
    sectionHeading: "Traffic interception and analysis",
    prompt: "What does an SSL-strip attack do?",
    options: [
      "Downgrades a victim's HTTPS connection to HTTP (as a MitM) so traffic is transmitted in cleartext.",
      "Breaks the TLS cipher mathematically.",
      "Steals the server's certificate authority.",
      "Encrypts the victim's traffic a second time.",
    ],
    correctIndex: 0,
    explanation:
      "From a MitM position, SSL stripping keeps HTTPS to the server but serves HTTP to the victim, exposing credentials. Tools like pcredz extract creds from captures; HSTS defends against stripping.",
  },
  // ══ net-attacks L5 ══
  {
    slug: "net-atk-l5-fuzzing",
    competencyId: "net-attacks",
    depthTier: 5,
    sectionHeading: "Custom protocol fuzzing",
    prompt: "What is the goal of network protocol fuzzing (e.g. with boofuzz)?",
    options: [
      "Sending malformed/unexpected inputs to a service to trigger crashes that reveal implementation bugs.",
      "Encrypting the protocol to make it secure.",
      "Measuring the service's bandwidth.",
      "Documenting the protocol's RFC.",
    ],
    correctIndex: 0,
    explanation:
      "Fuzzers mutate protocol messages to find parser bugs (crashes, hangs, memory corruption) in network services — a primary way to discover new vulnerabilities.",
  },
  {
    slug: "net-atk-l5-covert",
    competencyId: "net-attacks",
    depthTier: 5,
    sectionHeading: "Covert channels and data exfiltration",
    prompt: "Why is DNS a favored covert exfiltration channel?",
    options: [
      "DNS is almost always allowed outbound, so data encoded in query names slips past egress controls.",
      "DNS encrypts exfiltrated data by default.",
      "DNS queries are never logged anywhere.",
      "DNS can only carry one byte total.",
    ],
    correctIndex: 0,
    explanation:
      "Because resolvers must reach the internet, encoding data into subdomain labels (or ICMP payloads) tunnels it out through permitted traffic. Detection looks for abnormally long/high-volume DNS queries.",
  },
  {
    slug: "net-atk-l5-implant",
    competencyId: "net-attacks",
    depthTier: 5,
    sectionHeading: "Network implant development",
    prompt: "Why do modern C2 implants often beacon over HTTPS to legitimate-looking domains?",
    options: [
      "To blend command-and-control traffic with normal encrypted web traffic and evade network detection.",
      "Because HTTPS is the only protocol that works.",
      "To make the traffic slower and less noticeable to the user.",
      "Because plaintext HTTP cannot carry commands.",
    ],
    correctIndex: 0,
    explanation:
      "Beaconing over TLS to plausible domains (often via CDN/domain fronting) hides C2 in the noise of ordinary HTTPS, defeating signature- and destination-based detection. Jitter and sleep further mimic benign patterns.",
  },
  {
    slug: "net-atk-l5-defense-evasion",
    competencyId: "net-attacks",
    depthTier: 5,
    sectionHeading: "Network defense detection and evasion",
    prompt: "How do IDS/IPS systems broadly detect malicious traffic, and how do attackers evade them?",
    options: [
      "Signature and anomaly detection catch known patterns/outliers; attackers evade via encryption, fragmentation, timing changes, and protocol obfuscation.",
      "They read the attacker's mind, so evasion is impossible.",
      "They only block traffic on port 80.",
      "They rely solely on the attacker's IP reputation.",
    ],
    correctIndex: 0,
    explanation:
      "Signature-based detection matches known indicators; anomaly-based flags deviations from baseline. Evasion encrypts payloads, splits them across fragments/packets, slows timing, and obfuscates protocols to avoid both.",
  },
];
