import type { SeedExercise } from "./types";

/** net-fundamentals (L0–L5) + net-attacks (L0–L5) — one MCQ per teaching section. */
export const NETWORKING_EXERCISES: SeedExercise[] = [
  // ══ net-fundamentals L0 ══
  {
    slug: "net-fund-l0-what",
    competencyId: "net-fundamentals",
    depthTier: 0,
    sectionHeading: "What is networking",
    prompt: "Your team deploys an internal web app on a server, but users on different floors cannot reach it. A colleague suggests the problem is 'not a networking issue — the app just needs more RAM.' What best describes why networking is central here?",
    options: [
      "Networking enables independent devices to exchange data using agreed protocols like IP and TCP, so without correct routing and protocol configuration between floors, no amount of server resources will make the app reachable.",
      "Networking is primarily about encrypting files stored on local disks, so the real issue is that the server's filesystem encryption is blocking users from reading the application's data across the building.",
      "Networking refers to the operating system's process scheduler allocating CPU time between applications, so the colleague is right that adding RAM would let the scheduler serve more users simultaneously.",
      "Networking controls how data is written to permanent storage on the server, so the users on other floors cannot reach the app because the server's disk I/O subsystem is saturated under load.",
    ],
    correctIndex: 0,
    explanation:
      "Networking is about devices communicating via shared protocols (IP, TCP, DNS...). Reachability between network segments is a protocol and routing concern, not a resource concern. Understanding this distinction underlies both defense and attack of any connected system.",
  },
  {
    slug: "net-fund-l0-models",
    competencyId: "net-fundamentals",
    depthTier: 0,
    sectionHeading: "The OSI and TCP/IP models",
    prompt: "A junior analyst sees a packet capture with Ethernet frames, IP headers, and TCP segments. They ask which OSI layers these correspond to. What is the correct mapping?",
    options: [
      "Ethernet operates at layer 2 (data link), IP at layer 3 (network), and TCP at layer 4 (transport). Each layer adds its own header as data moves down the stack before transmission on the wire.",
      "Ethernet operates at layer 4 (transport), IP at layer 3 (network), and TCP at layer 2 (data link). The transport layer handles physical framing while the data link layer manages connection reliability.",
      "All three operate at layer 7 (application) because they are all visible in the same packet capture. The application layer encompasses everything the analyst can inspect in a protocol analyzer.",
      "Ethernet operates at layer 3 (network), IP at layer 2 (data link), and TCP at layer 7 (application). IP handles local link addressing while Ethernet provides routing between different networks.",
    ],
    correctIndex: 0,
    explanation:
      "The layered model separates concerns: link (2, Ethernet/ARP), network (3, IP/routing), transport (4, TCP/UDP), up to application (7). Attacks and defenses map to specific layers, so knowing these mappings is foundational.",
  },
  {
    slug: "net-fund-l0-vocab",
    competencyId: "net-fundamentals",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt: "While examining traffic on a local switch, you see a device with MAC address aa:bb:cc:dd:ee:ff communicating with IP 10.0.1.5. A colleague asks what each address identifies and at what scope. What is the correct distinction?",
    options: [
      "The MAC address identifies the network interface at layer 2 and is only meaningful on the local link segment, while the IP address identifies the host at layer 3 and is routable across networks via gateways.",
      "The MAC address is the device's public internet identifier assigned by the ISP, while the IP address is a locally-scoped hardware serial number burned into the network card by the manufacturer.",
      "Both addresses are interchangeable names for the same entity — the MAC is simply the hexadecimal representation of the IP address, and either can be used for routing traffic across the internet.",
      "The MAC address is the DNS hostname of the device encoded in hexadecimal, while the IP address is derived from the device's physical location on the network using geographic lookup tables.",
    ],
    correctIndex: 0,
    explanation:
      "MAC addresses are link-local hardware identifiers; IP addresses are logical, routable addresses. ARP maps between them on a local segment — this is why ARP spoofing is a local-network attack.",
  },
  // ══ net-fundamentals L1 ══
  {
    slug: "net-fund-l1-subnetting",
    competencyId: "net-fundamentals",
    depthTier: 1,
    sectionHeading: "IP addressing and subnetting",
    prompt: "You are assigned the network 192.168.10.0/24 for a new office. The project manager asks how many devices can receive unique IP addresses on this subnet. What do you report?",
    options: [
      "254 usable host addresses — a /24 provides 256 total addresses, but the first (192.168.10.0) is reserved as the network address and the last (192.168.10.255) is the broadcast address, leaving 254 for hosts.",
      "256 usable host addresses — every address in the range from 192.168.10.0 through 192.168.10.255 is fully assignable to hosts because modern operating systems no longer require network or broadcast reservations.",
      "128 usable host addresses — a /24 mask divides the 256 addresses equally between the network portion and the host portion, so only the upper half of the range is available for device assignment.",
      "512 usable host addresses — the /24 notation means 24 hosts per subnet group, and the class C range provides space for approximately 21 such groups, yielding 504 addresses rounded up to 512.",
    ],
    correctIndex: 0,
    explanation:
      "A /24 has 256 addresses; subtracting the network and broadcast leaves 254 usable hosts. Each extra prefix bit halves the size (/25 = 126 usable, /26 = 62 usable). The RFC 1918 private ranges are 10/8, 172.16/12, 192.168/16.",
  },
  {
    slug: "net-fund-l1-tcp-udp",
    competencyId: "net-fundamentals",
    depthTier: 1,
    sectionHeading: "TCP and UDP",
    prompt: "A developer asks why their video streaming app should use UDP rather than TCP. They argue that TCP's reliability guarantees seem strictly better. What is the correct explanation of the trade-off?",
    options: [
      "TCP is connection-oriented with a three-way handshake and guarantees ordered, reliable delivery via retransmissions, but that overhead adds latency. UDP is connectionless with no delivery guarantee, making it faster for real-time streams where a dropped frame matters less than delay.",
      "TCP is connectionless and sends data without establishing a session first, while UDP uses a three-way handshake to set up a reliable, ordered channel. UDP's connection setup is faster because it uses fewer round trips than TCP's equivalent.",
      "Both TCP and UDP guarantee ordered delivery of every byte, but TCP achieves this through checksums while UDP uses forward error correction. The developer should choose UDP because its error correction consumes less bandwidth than TCP checksums.",
      "UDP requires a three-way handshake like TCP but completes it in a single packet rather than three, cutting connection setup time by two-thirds. TCP's three separate setup packets make it unsuitable for any application that needs low latency.",
    ],
    correctIndex: 0,
    explanation:
      "TCP (RFC 793) sets up a connection (SYN/SYN-ACK/ACK) and guarantees ordered, reliable bytes via retransmission; UDP (RFC 768) is fire-and-forget. For real-time traffic (video, gaming, VoIP), a late retransmission is worse than a dropped packet.",
  },
  {
    slug: "net-fund-l1-dns",
    competencyId: "net-fundamentals",
    depthTier: 1,
    sectionHeading: "DNS resolution",
    prompt: "You run \`dig example.com\` and see an answer section with record type A and an IPv4 address. A colleague confuses this with other DNS record types. Which record type correctly maps a hostname to an IPv4 address?",
    options: [
      "An A record maps a hostname to an IPv4 address (AAAA does the same for IPv6). This is the fundamental record that resolvers return when a client needs the IP address to connect to a named host.",
      "An MX record maps a hostname to an IPv4 address and is used by all applications to resolve any domain name. The 'M' stands for 'mapping' and the 'X' indicates it handles both IPv4 and IPv6 lookups.",
      "A PTR record maps a hostname to an IPv4 address by performing a forward lookup in the in-addr.arpa zone. PTR is the standard record used by web browsers when navigating to a URL with a domain name.",
      "A TXT record maps a hostname to an IPv4 address by encoding the IP inside a text string that the resolver parses. This approach allows arbitrary metadata to be attached alongside the address information.",
    ],
    correctIndex: 0,
    explanation:
      "A = IPv4, AAAA = IPv6, CNAME = alias, MX = mail exchange, NS = nameserver, TXT = text metadata, PTR = reverse (IP to name). \`dig +trace\` walks the full resolution path from the root servers.",
  },
  {
    slug: "net-fund-l1-arp",
    competencyId: "net-fundamentals",
    depthTier: 1,
    sectionHeading: "ARP and layer 2",
    prompt: "During a security assessment of a corporate LAN, you demonstrate ARP spoofing to intercept traffic between a workstation and the gateway. Management asks why this attack works at all. What is the core reason?",
    options: [
      "ARP has no authentication mechanism — any device can send a gratuitous ARP reply claiming to own any IP address, and recipients update their cache without verification, allowing an attacker to redirect traffic through their machine.",
      "ARP uses strong RSA encryption for all replies, but the attacker can brute-force the 512-bit key in real time using a modern GPU, decrypting and re-encrypting each ARP response before forwarding it to the victim.",
      "ARP requires a shared password between devices on the network, and the attacker guesses it by observing the timing patterns of legitimate ARP exchanges to reconstruct the passphrase character by character.",
      "ARP only operates over the public internet and not on local segments, so the attack works by intercepting ARP traffic at the ISP level where the protocol crosses from the local network onto the wider internet backbone.",
    ],
    correctIndex: 0,
    explanation:
      "ARP maps IP to MAC with no authentication, so poisoned replies let an attacker impersonate the gateway and intercept local traffic. Defenses include Dynamic ARP Inspection on managed switches and static ARP entries for critical hosts.",
  },
  // ══ net-fundamentals L2 ══
  {
    slug: "net-fund-l2-tcp-lifecycle",
    competencyId: "net-fundamentals",
    depthTier: 2,
    sectionHeading: "TCP connection lifecycle",
    prompt: "You run \`ss -s\` on a web server and find 12,000 sockets in SYN_RECV state. Normal traffic produces at most a few hundred. What does this pattern most likely indicate?",
    options: [
      "A SYN flood attack — an attacker is sending thousands of SYN packets (often with spoofed source IPs) without completing the handshake, exhausting the server's connection backlog with half-open connections.",
      "A successful graceful shutdown sequence — the server is closing 12,000 connections simultaneously using the FIN/ACK four-way teardown, and SYN_RECV is the intermediate state before each socket fully releases its resources.",
      "A DNS amplification issue — the server's resolver is generating recursive queries that are reflected back as SYN_RECV entries because the kernel tracks outbound DNS lookups in the TCP state table.",
      "Normal connection pooling behavior — the web server's reverse proxy maintains a warm pool of pre-established connections in SYN_RECV state so it can assign them to incoming requests without handshake latency.",
    ],
    correctIndex: 0,
    explanation:
      "SYN_RECV means a SYN-ACK was sent but the final ACK never arrived. A flood of these exhausts the backlog. SYN cookies (enabled via net.ipv4.tcp_syncookies) let the server handle SYN floods without maintaining state for half-open connections.",
  },
  {
    slug: "net-fund-l2-pcap",
    competencyId: "net-fundamentals",
    depthTier: 2,
    sectionHeading: "Packet analysis with tcpdump and Wireshark",
    prompt: "You need to capture only TCP connection initiations on a busy server to identify scanning activity. Which tcpdump BPF filter isolates SYN packets?",
    options: [
      "\`tcp[tcpflags] & tcp-syn != 0\` — this Berkeley Packet Filter expression tests the SYN bit in the TCP flags byte, matching any packet where the SYN flag is set, including both initial SYNs and SYN-ACKs.",
      "\`udp port 53 and host 10.0.0.1\` — this filter captures DNS traffic from the scanning host, which is equivalent to connection initiations because every TCP connection begins with a DNS resolution query first.",
      "\`icmp and icmp[0] == 8\` — this filter matches ICMP echo requests, which are the actual mechanism TCP uses to test whether a port is open before sending the SYN packet to initiate the handshake.",
      "\`ether proto 0x0806\` — this filter captures ARP frames, which precede every TCP connection because the kernel must resolve the destination MAC address through ARP before any SYN can be transmitted on the wire.",
    ],
    correctIndex: 0,
    explanation:
      "BPF filters can test TCP flag bits directly. In Wireshark the equivalent display filter is tcp.flags.syn == 1. Adding \`&& tcp.flags.ack == 0\` isolates pure SYNs (excluding SYN-ACKs) to see only the initiator side.",
  },
  {
    slug: "net-fund-l2-dhcp",
    competencyId: "net-fundamentals",
    depthTier: 2,
    sectionHeading: "DHCP and network bootstrapping",
    prompt: "After joining a client's network during a pentest, you notice workstations receiving a gateway address pointing to an unknown host rather than the legitimate router. What attack is most likely occurring?",
    options: [
      "A rogue DHCP server attack — an attacker is running their own DHCP server that races to respond before the legitimate one, assigning their machine as the gateway and DNS server to become a man-in-the-middle.",
      "A DNS zone transfer exploit — the attacker has pulled all records from the authoritative nameserver and is modifying A records on the fly so that the gateway hostname resolves to their IP address instead of the router's.",
      "A BGP route injection — the attacker has announced a more-specific route for the gateway's IP prefix from their laptop, causing the network's internal routing protocol to prefer their machine as the next hop.",
      "A TLS certificate substitution — the attacker has replaced the gateway's SSL certificate with their own, which causes workstations to re-resolve the gateway address through the certificate's Subject Alternative Name field.",
    ],
    correctIndex: 0,
    explanation:
      "DHCP follows DISCOVER/OFFER/REQUEST/ACK with no authentication. A rogue server (often deployed after DHCP starvation exhausts the real pool) hands out attacker-controlled gateway/DNS. DHCP snooping on managed switches is the primary mitigation.",
  },
  {
    slug: "net-fund-l2-routing-icmp",
    competencyId: "net-fundamentals",
    depthTier: 2,
    sectionHeading: "Routing and ICMP",
    prompt: "You run traceroute to a remote server and see a list of intermediate routers, each with increasing hop numbers. Which ICMP mechanism allows traceroute to discover each hop along the path?",
    options: [
      "Traceroute sends packets with incrementally increasing TTL values. Each router that decrements the TTL to zero returns an ICMP Type 11 (Time Exceeded) message, revealing its address as one hop in the path.",
      "Traceroute sends ICMP Type 8 (Echo Request) packets to every possible IP address in each intermediate subnet, and routers that match respond with their addresses, building the path from the collected responses.",
      "Traceroute relies on ICMP Type 0 (Echo Reply) messages that each router generates automatically when forwarding any packet, including a copy of the router's interface address in the reply payload.",
      "Traceroute uses ICMP Type 5 (Redirect) messages that routers send to inform the source of a better next-hop. By collecting these redirects, traceroute assembles the optimal path to the destination.",
    ],
    correctIndex: 0,
    explanation:
      "traceroute sends packets with increasing TTL; each router that decrements TTL to zero returns a Time Exceeded (Type 11), revealing the hop. The final destination responds with an Echo Reply or Port Unreachable depending on the implementation.",
  },
  {
    slug: "net-fund-l2-vlans",
    competencyId: "net-fundamentals",
    depthTier: 2,
    sectionHeading: "VLANs and network segmentation",
    prompt: "During a network penetration test, you craft an Ethernet frame with two 802.1Q VLAN tags — the outer tag matches the native VLAN of the trunk port. How does the double-tagging VLAN hopping attack proceed from here?",
    options: [
      "The first switch strips the outer tag (which matches its native VLAN) and forwards the frame still carrying the inner tag. The second switch reads that inner tag and delivers the frame into the target VLAN the attacker could not otherwise reach.",
      "Both switches read both VLAN tags simultaneously and route the frame through a special inter-VLAN routing table that only processes double-tagged frames, bypassing ACLs applied to single-tagged traffic on trunk ports.",
      "The first switch detects the double tag and encrypts the frame using the VLAN key associated with the outer tag, then the second switch decrypts it using the inner tag's key, placing it into the target VLAN.",
      "The double-tagged frame triggers a spanning tree recalculation that temporarily merges all VLANs into a single broadcast domain, allowing the attacker to send traffic to any VLAN during the reconvergence window.",
    ],
    correctIndex: 0,
    explanation:
      "With the outer tag matching the native VLAN, the first switch removes it per 802.1Q behavior and forwards the still-tagged frame. Mitigations: disable DTP, set the native VLAN to an unused ID, and configure all user-facing ports as explicit access ports.",
  },
  // ══ net-fundamentals L3 ══
  {
    slug: "net-fund-l3-ipv6",
    competencyId: "net-fundamentals",
    depthTier: 3,
    sectionHeading: "IPv6 networking",
    prompt: "A client insists their network is IPv4-only and does not need IPv6 security monitoring. You demonstrate that Windows workstations on the network are accepting Router Advertisements. Why is this a security concern?",
    options: [
      "Windows prefers IPv6 when available, so an attacker can send rogue Router Advertisements via SLAAC or DHCPv6 to become the default gateway and DNS server — achieving a man-in-the-middle position on a network nobody monitors for IPv6 traffic.",
      "Router Advertisements force all workstations to disable their IPv4 stack entirely, leaving them unable to reach the legitimate gateway. The security risk is a denial-of-service condition rather than interception of traffic.",
      "IPv6 Router Advertisements contain the plaintext WPA2 passphrase for the wireless segment, so an attacker capturing them can decrypt all Wi-Fi traffic even though the wired network uses only IPv4 addressing.",
      "When workstations accept Router Advertisements they automatically publish all open TCP ports to the IPv6 multicast group, creating an enumeration shortcut — but the traffic itself still routes through the legitimate IPv4 gateway.",
    ],
    correctIndex: 0,
    explanation:
      "Hosts (notably Windows) prefer IPv6, so an attacker sending rogue RAs or DHCPv6 (tools like mitm6) can become the gateway/DNS on a network no one watches for IPv6. Neighbor Discovery replaces ARP at layer 2 in IPv6.",
  },
  {
    slug: "net-fund-l3-tls",
    competencyId: "net-fundamentals",
    depthTier: 3,
    sectionHeading: "TLS and certificate infrastructure",
    prompt: "During a code review, a developer asks what exactly the TLS client validates when it receives the server's certificate during the handshake. What is the correct set of checks?",
    options: [
      "The client verifies the certificate chains to a trusted root CA, the Subject or SAN matches the requested hostname, the certificate has not expired, and it has not been revoked (via CRL or OCSP). Only then does the ECDHE key exchange proceed.",
      "The client verifies the certificate was issued by a CA located in the same country as the client's IP geolocation, because cross-border certificates are prohibited under the X.509 standard for security reasons.",
      "The client verifies the certificate contains the server's plaintext private key embedded in the Subject Key Identifier extension, then uses it directly to encrypt the session without a separate key exchange step.",
      "The client verifies only that the certificate file is smaller than 4 KB, because oversized certificates indicate padding oracle vulnerabilities. No hostname or CA chain validation occurs until after the encrypted session is established.",
    ],
    correctIndex: 0,
    explanation:
      "The client validates the certificate chain to a trusted root, checks hostname match (CN or SAN), expiry, and revocation status, then performs an ECDHE key exchange for forward secrecy before the encrypted Finished messages confirm the handshake.",
  },
  {
    slug: "net-fund-l3-nat",
    competencyId: "net-fundamentals",
    depthTier: 3,
    sectionHeading: "Network address translation deep dive",
    prompt: "A forensic analyst tracing an attack to a source IP finds that 200 internal hosts share that single public address. They ask how this is possible. What mechanism is responsible?",
    options: [
      "PAT (Port Address Translation, also called NAT overload) maps each internal host's connection to a distinct source port on the shared public IP, multiplexing hundreds of hosts behind one address via unique port mappings.",
      "DNAT (Destination NAT) assigns each internal host its own dedicated public IP address from a pool, but the analyst's query tool is incorrectly grouping them because all the public IPs share the same /24 prefix.",
      "The 200 hosts are using a VPN tunnel that encrypts all traffic end-to-end, and the single IP is the VPN concentrator's address — PAT is not involved because each host maintains its own encrypted tunnel with distinct keys.",
      "Static NAT one-to-one maps each internal host to a unique public IP, but the firewall log consolidation process merges all entries under the gateway's management IP for storage efficiency, creating the false appearance of sharing.",
    ],
    correctIndex: 0,
    explanation:
      "PAT (NAT overload) multiplexes many private hosts behind one public IP via unique source port mappings. This is why a single public IP can represent hundreds of internal hosts, complicating attribution. SNAT rewrites source addresses; DNAT handles inbound port forwarding.",
  },
  {
    slug: "net-fund-l3-wireless",
    competencyId: "net-fundamentals",
    depthTier: 3,
    sectionHeading: "Wireless networking security",
    prompt: "You capture a WPA2 four-way handshake between a client and an access point using airodump-ng. A teammate asks why this capture enables offline passphrase cracking when the passphrase itself is never transmitted. What is the explanation?",
    options: [
      "The handshake exchanges nonces and a Message Integrity Code (MIC) that is derived from the passphrase. An attacker can hash candidate passphrases with the captured nonces and compare the resulting MIC offline — no further communication with the AP is needed.",
      "The handshake transmits the passphrase encrypted with the AP's public RSA key, and the attacker uses a known weakness in WPA2's RSA implementation to factor the key and recover the passphrase from the encrypted payload.",
      "The four-way handshake contains the access point's MAC-layer encryption seed, which when XORed with the BSSID produces the passphrase directly. The computation is trivial but requires capturing all four handshake frames in sequence.",
      "The handshake includes a Diffie-Hellman exchange that negotiates a session key independent of the passphrase, so the attacker replays the captured exchange to force the AP to reveal the passphrase in a fifth acknowledgment frame.",
    ],
    correctIndex: 0,
    explanation:
      "The four-way handshake never sends the passphrase, but the MIC is derived from it via the Pairwise Master Key. Tools like aircrack-ng or hashcat test candidates offline. WPA3's SAE (Simultaneous Authentication of Equals) uses a PAKE to resist offline dictionary attacks.",
  },
  {
    slug: "net-fund-l3-dns-security",
    competencyId: "net-fundamentals",
    depthTier: 3,
    sectionHeading: "DNS security and attacks",
    prompt: "After a DNS cache poisoning incident, your team evaluates deploying DNSSEC. A colleague argues it is unnecessary because DoH already encrypts DNS queries. What does DNSSEC actually provide that DoH does not?",
    options: [
      "DNSSEC adds cryptographic signatures to DNS records so resolvers can verify their authenticity and integrity, detecting spoofed or tampered responses. DoH encrypts the transport but cannot verify the records themselves came from the authoritative source.",
      "DNSSEC encrypts the DNS query payload end-to-end between the stub resolver and the authoritative server, which DoH cannot do because DoH only encrypts the last mile between the client and the recursive resolver.",
      "DNSSEC adds a password-based authentication step where the resolver must present credentials to the authoritative server before receiving any records, preventing unauthorized resolvers from querying the zone.",
      "DNSSEC automatically blocks all queries to known-malicious domains by checking each domain against a cryptographically signed blocklist distributed via the root zone, while DoH only prevents eavesdropping on the query path.",
    ],
    correctIndex: 0,
    explanation:
      "DNSSEC signs records with RRSIG/DNSKEY to prevent cache poisoning and spoofing (it authenticates, not encrypts). DoH/DoT add confidentiality to the query channel. They are complementary — DNSSEC for integrity, DoH/DoT for privacy.",
  },
  // ══ net-fundamentals L4 ══
  {
    slug: "net-fund-l4-congestion",
    competencyId: "net-fundamentals",
    depthTier: 4,
    sectionHeading: "TCP congestion control and performance",
    prompt: "Monitoring a file transfer, you observe the TCP congestion window doubling every round trip for the first several seconds before switching to linear growth. What phase transition are you witnessing?",
    options: [
      "The transition from Slow Start to Congestion Avoidance — Slow Start grows the window exponentially (doubling per RTT) to probe bandwidth, then switches to linear growth once the slow-start threshold (ssthresh) is reached.",
      "The transition from Fast Recovery to Idle — Fast Recovery doubles the window after each retransmission timeout to compensate for packet loss, then drops to linear when the retransmission queue is finally empty.",
      "The transition from Nagle coalescing to immediate send — the Nagle algorithm buffers small writes and doubles the buffer each RTT, then switches to linear flushing once the maximum segment size is consistently filled.",
      "The transition from receiver window scaling to sender rate limiting — the receiver advertises exponentially increasing window values until its buffer fills, at which point the sender falls back to linear transmission pacing.",
    ],
    correctIndex: 0,
    explanation:
      "Slow Start ramps exponentially until ssthresh, then Congestion Avoidance grows linearly. On packet loss, Fast Retransmit/Recovery halves the window. Modern algorithms include CUBIC (Linux default) and BBR (Google's bandwidth-based approach).",
  },
  {
    slug: "net-fund-l4-bgp",
    competencyId: "net-fundamentals",
    depthTier: 4,
    sectionHeading: "BGP and internet routing",
    prompt: "News reports that a country's telecom briefly announced IP prefixes belonging to a major cloud provider, causing global traffic to route through that telecom for several minutes. What is this attack called and how does it work?",
    options: [
      "BGP hijacking — an Autonomous System announces routes for IP prefixes it does not legitimately own, and other ASes accept and propagate the false routes because BGP trusts announcements from established peers without cryptographic proof of ownership.",
      "DNS root server takeover — the telecom replaced a root DNS server's anycast address with its own, causing all global DNS queries to resolve through the telecom's infrastructure and redirecting traffic at the application layer.",
      "OSPF area injection — the telecom injected false link-state advertisements into the cloud provider's internal OSPF area, causing the provider's own routers to redirect traffic through an external next hop controlled by the telecom.",
      "MPLS label spoofing — the telecom forged MPLS labels that matched the cloud provider's internal label-switched paths, causing provider edge routers to forward traffic into the telecom's network through mislabeled tunnels.",
    ],
    correctIndex: 0,
    explanation:
      "BGP exchanges reachability between ASes with minimal verification. A false prefix announcement reroutes traffic globally (e.g., Pakistan/YouTube 2008). RPKI (Resource Public Key Infrastructure) validates route origins but adoption remains incomplete.",
  },
  {
    slug: "net-fund-l4-scapy",
    competencyId: "net-fundamentals",
    depthTier: 4,
    sectionHeading: "Network protocol dissection with Scapy",
    prompt: "You need to test whether a firewall correctly drops TCP packets with illegal flag combinations. A colleague suggests using Scapy. Why is Scapy particularly suited for this task compared to standard tools like nmap or netcat?",
    options: [
      "Scapy lets you craft, send, and receive packets at any protocol layer with arbitrary field values — you can set illegal TCP flag combinations like SYN+FIN+RST that no standard networking tool would generate, and inspect the raw responses.",
      "Scapy is a GUI-based packet viewer that renders each protocol layer in a color-coded tree, making it easy to visually inspect flag combinations — but it cannot send or modify packets, so you would still need nmap for injection.",
      "Scapy captures traffic passively like tcpdump but adds a built-in IDS engine that automatically detects illegal flag combinations in transit, alerting you without needing to craft any packets yourself.",
      "Scapy replaces the kernel's TCP/IP stack with its own implementation, allowing you to change the operating system's default flag behavior system-wide so all outbound connections use the illegal combinations you want to test.",
    ],
    correctIndex: 0,
    explanation:
      "Scapy builds arbitrary packets layer by layer (IP()/TCP()/Raw()...) with full control over every field, so you can hand-craft probes that no well-behaved stack would emit. This makes it invaluable for firewall testing, fuzzing, and protocol research.",
  },
  {
    slug: "net-fund-l4-tunneling",
    competencyId: "net-fundamentals",
    depthTier: 4,
    sectionHeading: "Network tunneling and encapsulation",
    prompt: "After compromising a jump host during a pentest, you run \`ssh -D 9050 jump-host\` from your machine. Your teammate asks what this provides and how to use it for pivoting. What is the correct explanation?",
    options: [
      "It creates a dynamic SOCKS proxy on local port 9050 — any tool configured to use this proxy (e.g., via proxychains) will have its TCP traffic tunneled through the jump host, letting you reach internal networks behind it.",
      "It opens a reverse shell listener on the jump host's port 9050, allowing any internal machine to connect back to your attacking machine. You would use netcat on internal hosts to establish the reverse connection.",
      "It starts a DNS server on port 9050 that resolves internal hostnames by querying the jump host's local resolver, but it does not tunnel any TCP traffic — you would still need a separate VPN for actual connectivity.",
      "It transfers files between your machine and the jump host using SCP on port 9050 instead of the default port 22, providing a parallel channel for large file downloads while keeping the interactive SSH session responsive.",
    ],
    correctIndex: 0,
    explanation:
      "SSH dynamic forwarding (-D) creates a SOCKS proxy so tools (via proxychains) reach networks behind the jump host. This is a key pivoting technique. Local (-L) and remote (-R) forwarding handle specific port mappings, while -D handles arbitrary destinations.",
  },
  // ══ net-fundamentals L5 ══
  {
    slug: "net-fund-l5-stack",
    competencyId: "net-fundamentals",
    depthTier: 5,
    sectionHeading: "TCP/IP stack implementation details",
    prompt: "While auditing a custom Linux kernel module that processes network traffic, you see references to \`sk_buff\` structures being manipulated at multiple points. What role does \`sk_buff\` play in the Linux networking stack?",
    options: [
      "sk_buff is the kernel's central packet representation — it holds pointers to protocol headers, the packet data, and metadata (interface, routing decision, netfilter marks) as the packet traverses the stack from NIC driver through netfilter to the socket layer.",
      "sk_buff is a user-space socket library that wraps the POSIX send/recv calls with a ring buffer, reducing system call overhead by batching multiple application-layer messages into a single kernel transition for improved throughput.",
      "sk_buff is the on-disk format used by /proc/net to store persistent routing table entries, and the kernel module reads these structures at boot time to populate the forwarding information base before any packets can be processed.",
      "sk_buff is a hardware register map exposed by modern NICs through memory-mapped I/O, and the kernel module writes directly to these registers to configure checksum offload, segmentation, and interrupt coalescing parameters.",
    ],
    correctIndex: 0,
    explanation:
      "sk_buff is the core packet structure passed through the entire Linux networking stack (NIC driver -> netfilter hooks -> routing -> transport -> socket). net_device represents a network interface, sock represents a socket endpoint, and /proc/net exposes runtime statistics.",
  },
  {
    slug: "net-fund-l5-xdp",
    competencyId: "net-fundamentals",
    depthTier: 5,
    sectionHeading: "XDP and high-performance packet processing",
    prompt: "Your team is evaluating XDP for DDoS mitigation on a high-traffic edge server. The current iptables-based approach cannot keep up at 10 Mpps. Why can XDP achieve line-rate filtering where iptables cannot?",
    options: [
      "XDP runs an eBPF program at the earliest driver hook, before the packet enters the kernel networking stack or allocates an sk_buff. Dropping packets at this stage avoids all stack overhead, achieving millions of drops per second per core.",
      "XDP buffers all incoming packets to a RAM disk and processes them in batch using a user-space daemon, which avoids kernel context switches. The RAM disk's sequential I/O pattern is what achieves the throughput improvement over iptables.",
      "XDP runs entirely in user space using DPDK-style kernel bypass, polling the NIC directly without any kernel involvement. It achieves line rate because it eliminates all kernel code from the packet path, including the driver itself.",
      "XDP rewrites the NIC's firmware at runtime with packet-matching rules compiled from eBPF bytecode, so filtering happens in the network card's ASIC before any packet reaches system memory or the CPU.",
    ],
    correctIndex: 0,
    explanation:
      "XDP (eXpress Data Path) executes eBPF programs at the driver level, before sk_buff allocation or stack processing. XDP_DROP discards malicious traffic at the earliest possible point — millions of packets per second per core. This is fundamentally earlier than netfilter/iptables hooks.",
  },
  {
    slug: "net-fund-l5-edge-cases",
    competencyId: "net-fundamentals",
    depthTier: 5,
    sectionHeading: "Protocol edge cases and exploits",
    prompt: "A legacy IDS inspects only the first IP fragment of each packet to check TCP port numbers and payload signatures. An attacker crafts overlapping fragments with a benign first fragment and malicious subsequent ones. Why does this evade the IDS?",
    options: [
      "The IDS sees only the first (benign) fragment and passes it, but the target host reassembles all fragments — including overlapping ones that overwrite the benign payload with malicious content — because reassembly policies vary and many stacks favor later fragments.",
      "Overlapping fragments trigger a cryptographic checksum mismatch in the IP header, causing the IDS to drop the entire packet silently. The target host ignores checksums by default, so it processes the malicious payload unfiltered.",
      "IP fragmentation encrypts the payload using the fragment offset as an XOR key, so the IDS cannot read any fragment's content. The target host decrypts on reassembly because it knows the original offset sequence from the first fragment.",
      "Overlapping fragments cause the IDS to reassemble the packet identically to the target host, but the IDS runs out of reassembly buffer space first and discards the packet. The target host has more memory and completes reassembly without evasion.",
    ],
    correctIndex: 0,
    explanation:
      "Firewalls and IDS devices that inspect only the first fragment miss content in subsequent overlapping fragments. The target's reassembly policy determines which overlapping bytes win. The teardrop attack exploited pathological overlaps to crash older kernels.",
  },
  {
    slug: "net-fund-l5-perf",
    competencyId: "net-fundamentals",
    depthTier: 5,
    sectionHeading: "Network performance analysis",
    prompt: "You suspect a high-bandwidth link between two data centers is underperforming due to a large bandwidth-delay product. You need to measure the actual achievable throughput. Which tool and approach is most appropriate?",
    options: [
      "iperf3 in client/server mode — it generates a sustained TCP (or UDP) stream between the endpoints, measuring throughput, jitter, and packet loss over configurable intervals, directly revealing whether the link achieves its rated capacity.",
      "traceroute with increasing packet sizes — it measures throughput by timing how long each ICMP Time Exceeded reply takes to return from each hop, and multiplying the round-trip time by the packet size to calculate bandwidth at each segment.",
      "nslookup with the -timeout flag set to the expected transfer time — it measures DNS resolution latency as a proxy for link throughput, because DNS query speed is directly proportional to the available bandwidth on the underlying path.",
      "arp -a with repeated invocations timed by a script — it measures how quickly the ARP cache populates across the link, which indicates layer-2 throughput because ARP responses travel at the raw Ethernet line rate without TCP overhead.",
    ],
    correctIndex: 0,
    explanation:
      "iperf3 measures actual throughput between two endpoints; irtt measures latency under load (bufferbloat); ss -ti exposes per-connection retransmission and window stats. On high-BDP links, tuning kernel socket buffers (rmem/wmem) is often needed to fill the pipe.",
  },
  // ══ net-attacks L0 ══
  {
    slug: "net-atk-l0-what",
    competencyId: "net-attacks",
    depthTier: 0,
    sectionHeading: "What is network enumeration",
    prompt: "You have just been given scope approval for a penetration test. Before attempting any exploits, your first active step is to map the target environment. What does this network enumeration phase involve?",
    options: [
      "Discovering live hosts, scanning for open ports, identifying running services and their versions — building a complete inventory of the attack surface so that later phases target real, reachable entry points.",
      "Encrypting all traffic between your machine and the target network using a VPN tunnel so that the client's IDS does not detect any of your subsequent exploitation attempts during the engagement.",
      "Physically inspecting the client's server room to document cable runs, switch models, and rack layouts, because network enumeration is an on-site hardware inventory process rather than a remote scanning activity.",
      "Installing patches and updates on all discovered hosts to remediate vulnerabilities as you find them, because enumeration in a pentest context means both discovering and immediately fixing each security gap.",
    ],
    correctIndex: 0,
    explanation:
      "Enumeration is the first active step after passive recon — probing the network to inventory reachable hosts, open ports, and service versions. This information directs every subsequent phase of the engagement, from vulnerability analysis to exploitation.",
  },
  {
    slug: "net-atk-l0-why",
    competencyId: "net-attacks",
    depthTier: 0,
    sectionHeading: "Why enumeration matters",
    prompt: "During a pentest, you identify two web servers: one running Apache 2.4.49 and another running Apache 2.4.54. Your colleague asks why the exact version matters when both are 'just Apache.' What is the correct reasoning?",
    options: [
      "Exact version numbers map to specific CVEs — Apache 2.4.49 is vulnerable to path traversal (CVE-2021-41773) while 2.4.54 has that patch applied. The difference between a vulnerable and a patched service determines whether an exploit will succeed.",
      "The version number only matters for licensing compliance — Apache 2.4.49 uses the older Apache License 1.1 while 2.4.54 uses 2.0, and running the wrong license version could expose the client to legal risk during the engagement.",
      "Version numbers are cosmetic identifiers that server administrators set manually in the configuration file. They have no relationship to the actual compiled code running, so neither version is inherently more or less vulnerable.",
      "The version difference only affects performance benchmarks — 2.4.54 includes HTTP/3 support that makes it faster under load, but both versions share identical security properties because Apache backports all security fixes to every release.",
    ],
    correctIndex: 0,
    explanation:
      "Knowing the exact version tells you which CVEs apply. Apache 2.4.49 has CVE-2021-41773 (path traversal/RCE); 2.4.54 does not. Precise fingerprinting directs the entire attack — without it, you waste time on patched targets or miss vulnerable ones.",
  },
  {
    slug: "net-atk-l0-vocab",
    competencyId: "net-attacks",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt: "You connect to port 22 on a target and immediately receive the text 'SSH-2.0-OpenSSH_8.9p1 Ubuntu-3'. A junior teammate asks what this response is called and why it matters. What do you explain?",
    options: [
      "That is a service banner — the identifying text a service returns on connection, revealing the software name, version, and sometimes the OS. This information feeds CVE lookups to determine whether the service has known vulnerabilities.",
      "That is a TLS certificate fingerprint — the server's SSL identity encoded as an ASCII string. It matters because you can use it to impersonate the server by replaying this string to clients connecting to your rogue service.",
      "That is a firewall rule name — the network administrator labels each allowed port with a human-readable tag, and seeing it confirms the port is permitted through the firewall but reveals nothing about the service behind it.",
      "That is a DNS reverse lookup result — the resolver automatically returns the software description of any IP address queried on port 22, which is why you see it even before the TCP handshake completes with the target.",
    ],
    correctIndex: 0,
    explanation:
      "Service banners are the identifying text services return on connection, leaking product and version info. Grabbing them (nc, curl -I, nmap -sV) is a core enumeration step that feeds CVE lookups and exploitation planning.",
  },
  // ══ net-attacks L1 ══
  {
    slug: "net-atk-l1-host-discovery",
    competencyId: "net-attacks",
    depthTier: 1,
    sectionHeading: "Host discovery with Nmap",
    prompt: "You are scanning a local /24 subnet where the client has confirmed all hosts have ICMP blocked by host-based firewalls. Despite this, \`nmap -sn -PR 192.168.1.0/24\` discovers every live host. Why does ARP-based discovery succeed when ICMP fails?",
    options: [
      "ARP is required for local IP communication at layer 2 — every host must respond to ARP requests to function on the network, and host-based firewalls cannot block ARP without breaking all connectivity on the local segment.",
      "ARP scanning works because it uses encrypted probes that bypass the host-based firewall's deep packet inspection engine. The firewall cannot decrypt the ARP payload, so it passes the probes through to the network stack.",
      "ARP responses are routed through the default gateway, which does not have ICMP blocking enabled. The gateway answers ARP on behalf of all local hosts using proxy ARP, making it appear that every host is alive.",
      "ARP scanning sends probes on UDP port 67, which is the DHCP port that host-based firewalls always allow. The ARP response piggybacks on the DHCP acknowledgment frame, bypassing the ICMP block.",
    ],
    correctIndex: 0,
    explanation:
      "On the local segment, ARP is essential for IP-to-MAC resolution — blocking it breaks networking entirely. That is why \`nmap -sn -PR\` (ARP ping) is the most reliable local discovery method. On remote networks, ARP does not route, so you combine ICMP and TCP probes.",
  },
  {
    slug: "net-atk-l1-port-scan",
    competencyId: "net-attacks",
    depthTier: 1,
    sectionHeading: "Port scanning techniques",
    prompt: "You run \`nmap -sS 10.10.10.5\` and notice it completes much faster and with fewer log entries on the target than \`nmap -sT 10.10.10.5\`. Why is the SYN scan (-sS) considered stealthier and faster than the connect scan (-sT)?",
    options: [
      "A SYN scan sends a SYN and, upon receiving SYN-ACK, immediately sends RST instead of completing the handshake. Since no full TCP connection is established, the application layer rarely logs it, and skipping the final ACK saves time.",
      "A SYN scan uses UDP instead of TCP to probe each port, which is inherently faster because UDP has no handshake overhead. The target's application logs only record TCP connections, so UDP probes go unnoticed.",
      "A SYN scan encrypts each probe packet with a per-port key derived from the target's IP address, making the probes invisible to the target's logging infrastructure. The encryption step is faster than TCP's plaintext handshake.",
      "A SYN scan sends probes to fewer ports by default — only the top 100 rather than -sT's default of all 65,535. The speed and stealth advantage comes entirely from scanning fewer ports, not from any protocol-level difference.",
    ],
    correctIndex: 0,
    explanation:
      "A SYN scan (half-open scan) never completes the three-way handshake — it resets after SYN-ACK. Most applications only log completed connections, so -sS evades application-level logging. It also requires raw socket privileges (root/sudo). -sT is the fallback when raw sockets are unavailable.",
  },
  {
    slug: "net-atk-l1-version",
    competencyId: "net-attacks",
    depthTier: 1,
    sectionHeading: "Service and version detection",
    prompt: "After a basic port scan shows port 8080 open, you run \`nmap -sV -p 8080 10.10.10.5\` and the output identifies 'Apache Tomcat 9.0.31'. What additional step did -sV perform beyond the initial port scan?",
    options: [
      "It sent protocol-specific probes to the open port and analyzed the responses to fingerprint the exact service and version running — going beyond just confirming the port is open to identifying the actual software behind it.",
      "It performed a DNS reverse lookup on the target IP and matched the resulting hostname against a database of known web server deployments to infer which software is most likely running on port 8080.",
      "It connected to the Tomcat manager interface with default credentials (admin/admin) and read the version from the dashboard page — this is the only way -sV can determine version numbers for Java-based servers.",
      "It launched a denial-of-service test against port 8080 and measured how the service degraded under load, then compared the degradation pattern against known performance profiles to identify the software version.",
    ],
    correctIndex: 0,
    explanation:
      "-sV sends protocol-specific probes (from nmap-service-probes) and matches responses against known signatures to identify the software and version. Adding -O detects the OS, and -A bundles version detection, OS detection, script scanning, and traceroute.",
  },
  {
    slug: "net-atk-l1-quick-scripts",
    competencyId: "net-attacks",
    depthTier: 1,
    sectionHeading: "Quick enumeration scripts",
    prompt: "You run \`nmap --script=default,vuln -sV 10.10.10.5\` and the output includes results from scripts like http-enum, smb-vuln-ms17-010, and ssl-heartbleed. What is the Nmap Scripting Engine (NSE) doing here?",
    options: [
      "NSE executes Lua scripts against discovered services to automate enumeration and vulnerability checks — http-enum brute-forces web paths, smb-vuln-ms17-010 tests for EternalBlue, and ssl-heartbleed checks for the Heartbleed bug.",
      "NSE compiles the Nmap binary from source with custom patches for each target, embedding the vulnerability signatures directly into the scanner's packet-generation engine so probes carry exploit payloads automatically.",
      "NSE encrypts the scan output using the target's SSL certificate so that only the target's administrator can read the results. The script names refer to the encryption algorithms applied to each section of the report.",
      "NSE configures the local firewall on the scanning machine to allow responses from the target, because without these scripts the host-based firewall would drop all inbound packets from the scan results.",
    ],
    correctIndex: 0,
    explanation:
      "NSE extends Nmap with Lua scripts organized into categories (default, vuln, auth, brute, etc.). They automate tasks like default-credential checks, vulnerability detection, and service enumeration. Manual complements include netcat banner grabs and curl -I for HTTP headers.",
  },
  // ══ net-attacks L2 ══
  {
    slug: "net-atk-l2-smb",
    competencyId: "net-attacks",
    depthTier: 2,
    sectionHeading: "SMB enumeration",
    prompt: "During internal enumeration, you run \`rpcclient -U '' -N 10.10.10.5\` and successfully connect, then execute \`enumdomusers\` to list all domain users. What type of SMB connection made this possible?",
    options: [
      "A null session — an anonymous, unauthenticated SMB connection where both the username and password are empty. Misconfigured hosts allow null sessions to enumerate users, shares, and domain policies without any credentials.",
      "An encrypted SMB3 session — the latest SMB version automatically authenticates anonymous users with a temporary certificate generated by the domain controller, granting read-only access to the user directory as a convenience feature.",
      "A domain admin session — rpcclient's -U '' flag defaults to the built-in Administrator account with a blank password, which is why enumdomusers returned results. The -N flag disabled Kerberos negotiation to force NTLM fallback.",
      "A Kerberos golden ticket session — the empty username triggers the KDC to issue a ticket-granting ticket with domain admin privileges because the krbtgt account's password hash is derived from the empty string by default.",
    ],
    correctIndex: 0,
    explanation:
      "Null sessions (empty username, no password) can leak users, shares, and policies on misconfigured systems. Common SMB findings include anonymous share access, writable shares, and SMBv1 vulnerabilities like EternalBlue (MS17-010). Disabling null sessions and enforcing SMB signing are key mitigations.",
  },
  {
    slug: "net-atk-l2-snmp",
    competencyId: "net-attacks",
    depthTier: 2,
    sectionHeading: "SNMP enumeration",
    prompt: "You run \`snmpwalk -v2c -c public 10.10.10.5\` against a network switch and receive pages of output including system description, interface tables, routing entries, and running process lists. Why is SNMP such a rich enumeration target?",
    options: [
      "SNMP v1/v2c use community strings as plaintext passwords, and the default 'public' string is widely left unchanged. A correct community string grants read access to the entire MIB tree — system info, interfaces, routes, processes, and sometimes credentials.",
      "SNMP grants interactive shell access by design through OID 1.3.6.1.4.1.99.1, which executes arbitrary commands on the device. The 'public' community string is the default root password for this remote shell feature.",
      "SNMP transmits the device's admin password in every response packet as part of the mandatory authentication header. Even with a wrong community string, the password is visible in the cleartext portion of the SNMP PDU.",
      "SNMP can only report a single metric — device uptime — but the switch firmware bug you are exploiting causes it to dump its entire configuration when the uptime OID overflows its 32-bit counter after 497 days.",
    ],
    correctIndex: 0,
    explanation:
      "SNMP v1/v2c community strings are effectively cleartext passwords. With a guessed string (tools like onesixtyone brute-force them), snmpwalk enumerates the entire MIB tree — system description, processes, interfaces, and sometimes plaintext credentials. SNMPv3 adds encryption and proper authentication.",
  },
  {
    slug: "net-atk-l2-ldap",
    competencyId: "net-attacks",
    depthTier: 2,
    sectionHeading: "LDAP and Active Directory enumeration",
    prompt: "With a low-privilege domain account, you query LDAP on port 389 of the domain controller and retrieve user objects, group memberships, and the domain password policy (minPwdLength, lockoutThreshold). Why does LDAP expose this much information?",
    options: [
      "Active Directory grants all authenticated users broad read access to directory objects by default — user attributes, group memberships, and domain policies are readable because AD was designed for directory lookups, not access restriction.",
      "LDAP on port 389 bypasses all Active Directory access controls because it uses an unencrypted channel. Switching to LDAPS on port 636 would enforce ACLs and restrict the query results to only the querying user's own object.",
      "The domain controller returns this data because your low-privilege account was automatically promoted to Domain Admin during the LDAP bind operation — LDAP always elevates the binding user's privileges for the duration of the session.",
      "The password policy fields (minPwdLength, lockoutThreshold) are fabricated responses injected by a man-in-the-middle on the network. LDAP never exposes password policy to non-admin users under any Active Directory configuration.",
    ],
    correctIndex: 0,
    explanation:
      "AD's default permissions grant authenticated users read access to most directory objects and attributes. This is by design for directory functionality but is a goldmine for attackers — the password policy guides password spraying while avoiding lockouts.",
  },
  {
    slug: "net-atk-l2-web-enum",
    competencyId: "net-attacks",
    depthTier: 2,
    sectionHeading: "Web service enumeration",
    prompt: "You run \`gobuster dir -u http://10.10.10.5 -w /usr/share/wordlists/common.txt\` against a web server and discover /admin, /backup, and /api/v1 — none of which are linked from the site's pages. What technique is this and why is it valuable?",
    options: [
      "Directory and content brute-forcing — it sends HTTP requests for each wordlist entry to discover unlinked paths like admin panels, backup files, and API endpoints that expand the attack surface beyond what a spider would find.",
      "DNS zone transfer enumeration — gobuster queries the authoritative nameserver for all subdomains associated with the target IP, and the paths it finds (/admin, /backup) are actually subdomain names translated to URL paths.",
      "TLS certificate transparency log mining — gobuster searches public CT logs for all certificates issued to the target domain, extracting the Subject Alternative Names and converting them to directory paths on the web server.",
      "Passive OSINT reconnaissance — gobuster queries cached copies of the target site stored in the Wayback Machine and search engine caches, compiling a list of paths that existed historically without sending any requests to the live server.",
    ],
    correctIndex: 0,
    explanation:
      "Wordlist-driven content discovery (gobuster, ffuf, feroxbuster) reveals directories, files, virtual hosts, and API endpoints not linked from the site. whatweb and Wappalyzer fingerprint the technology stack of what is found, guiding further exploitation.",
  },
  {
    slug: "net-atk-l2-output",
    competencyId: "net-attacks",
    depthTier: 2,
    sectionHeading: "Output management",
    prompt: "Your team lead requires all Nmap scan results saved in every available format for the engagement report and tooling pipeline. You use \`nmap -oA scan_results 10.10.10.0/24\`. What does the -oA flag produce and why save multiple formats?",
    options: [
      "It writes three files — .nmap (human-readable), .xml (machine-parseable for tools like searchsploit and libnmap), and .gnmap (greppable for quick command-line queries) — covering documentation, automation, and ad-hoc analysis needs.",
      "It encrypts the scan results using AES-256 and splits the ciphertext across three files for security, so that all three must be combined with the correct decryption key before any results can be read by the team.",
      "It uploads the scan results to the target network's SIEM in three streaming formats (JSON, CSV, syslog) so the client's security team can verify the scan activity against their detection rules in real time.",
      "It writes three identical copies of the results to different disk locations for redundancy, ensuring that if one file is corrupted during the scan the other two backups can be used to reconstruct the complete output.",
    ],
    correctIndex: 0,
    explanation:
      "-oA produces human-readable (.nmap), XML (.xml, machine-parseable for tools like searchsploit, libnmap, and Metasploit), and greppable (.gnmap) outputs. Proper output management is essential for professional engagements — findings feed reports and downstream tooling.",
  },
  // ══ net-attacks L3 ══
  {
    slug: "net-atk-l3-mitm",
    competencyId: "net-attacks",
    depthTier: 3,
    sectionHeading: "Man-in-the-middle attacks",
    prompt: "After ARP-spoofing a victim on the local network with bettercap, you enable IP forwarding and start intercepting traffic. What attacks become possible from this man-in-the-middle position?",
    options: [
      "You can capture cleartext credentials from unencrypted protocols, SSL-strip HTTPS connections down to HTTP, inject content into unencrypted pages, and capture NTLM hashes from SMB or HTTP authentication exchanges.",
      "You can only observe the encrypted TLS ciphertext flowing between the victim and the server, with no ability to read, modify, or downgrade the traffic because the TLS session keys are negotiated end-to-end.",
      "You can remotely modify the victim's BIOS/UEFI settings by injecting firmware update packets into the traffic stream, because BIOS updates are transmitted in plaintext over the same network path as regular traffic.",
      "You gain no useful capability without also possessing the victim's TLS private key, because all modern protocols — including HTTP, FTP, and Telnet — negotiate TLS by default before transmitting any application data.",
    ],
    correctIndex: 0,
    explanation:
      "From a MitM position (arpspoof/bettercap with IP forwarding), the attacker can read cleartext protocols, downgrade TLS via SSL stripping, inject into HTTP, and capture NTLM/NTLMv2 hashes from SMB/HTTP authentication. HSTS and certificate pinning defend against stripping.",
  },
  {
    slug: "net-atk-l3-pivot",
    competencyId: "net-attacks",
    depthTier: 3,
    sectionHeading: "Pivoting through compromised hosts",
    prompt: "You have compromised a dual-homed Linux server with interfaces on both 10.10.10.0/24 (DMZ) and 172.16.0.0/24 (internal). Your attack machine can only reach the DMZ. How do you reach the internal network?",
    options: [
      "Pivot through the compromised host by setting up SSH port forwarding (-L or -D) or a tool like chisel to create a SOCKS proxy, then route your scanning and exploitation traffic through the foothold into the 172.16.0.0/24 network via proxychains.",
      "Directly scan 172.16.0.0/24 from your attack machine by adding a static route pointing to the DMZ gateway — the DMZ router will forward your packets to the internal network because both subnets share the same broadcast domain.",
      "Request the client add your attack machine's IP to the internal network's firewall allowlist, because pivoting through compromised hosts is prohibited under standard penetration testing rules of engagement.",
      "Assign your attack machine an IP address in the 172.16.0.0/24 range alongside its existing DMZ address — dual-homing your own machine replicates the compromised server's connectivity without needing any tunneling or proxying.",
    ],
    correctIndex: 0,
    explanation:
      "Pivoting uses a compromised host to bridge into otherwise-unreachable segments via port forwarding or a SOCKS proxy. SSH -L (local) / -D (dynamic) are built-in options; chisel and ligolo help when SSH is unavailable. Double pivots chain through two hops for deeper networks.",
  },
  {
    slug: "net-atk-l3-password",
    competencyId: "net-attacks",
    depthTier: 3,
    sectionHeading: "Password attacks on network services",
    prompt: "You need to test weak credentials across 500 domain accounts, but the password policy locks accounts after 5 failed attempts in 30 minutes. How should you structure the attack to avoid triggering lockouts?",
    options: [
      "Use password spraying — try one common password (e.g., 'Summer2026!') against all 500 accounts, then wait past the lockout window before trying the next password. This keeps each account's failure count below the threshold.",
      "Use brute forcing against a single high-value account with every password in your wordlist. Concentrating on one account avoids lockouts because the lockout policy counts unique source IPs rather than failed attempts per account.",
      "Disable the lockout policy remotely by modifying the Default Domain Policy through an unauthenticated LDAP write to the domain controller, then brute-force all 500 accounts simultaneously without restrictions.",
      "Spray all passwords in the wordlist against all 500 accounts as fast as possible — modern Active Directory implementations rate-limit by source IP rather than by target account, so parallel attacks never trigger per-account lockouts.",
    ],
    correctIndex: 0,
    explanation:
      "Spraying (one password across many users, then wait) stays under per-account lockout thresholds. Tools like crackmapexec, kerbrute, and spray automate this. Common patterns include Season+Year!, Welcome1, and Company+Year. The LDAP-retrieved password policy guides the timing.",
  },
  {
    slug: "net-atk-l3-relay",
    competencyId: "net-attacks",
    depthTier: 3,
    sectionHeading: "Relay and coercion attacks",
    prompt: "Using Responder, you poison LLMNR/NBT-NS to intercept a victim's NTLM authentication, then relay it to a domain controller's LDAP service with ntlmrelayx. Why does this relay attack succeed even though you never learn the victim's password?",
    options: [
      "NTLM's challenge-response is not cryptographically bound to the connection it was generated for — the attacker forwards the victim's valid response to a different server, which accepts it as legitimate authentication from the victim's account.",
      "The attacker cracks the NTLMv2 hash instantly using a rainbow table before the authentication timeout expires, then replays the recovered plaintext password to the LDAP service as a normal login with the victim's credentials.",
      "The victim's browser sends the plaintext password in the HTTP Authorization header alongside the NTLM response, and the attacker extracts it from the header and uses it to authenticate to LDAP independently.",
      "The relay only works against LDAP because LDAP does not support NTLM authentication at all — ntlmrelayx converts the NTLM response into a Kerberos ticket by contacting the KDC, which is what actually authenticates to LDAP.",
    ],
    correctIndex: 0,
    explanation:
      "NTLM's response is not channel-bound, so the attacker relays it to another service (SMB, LDAP, HTTPS). Coercion tools like PetitPotam and poisoners like Responder provide the authentication. Defenses include SMB signing, EPA (Extended Protection for Authentication), and disabling NTLM.",
  },
  {
    slug: "net-atk-l3-service-exploit",
    competencyId: "net-attacks",
    depthTier: 3,
    sectionHeading: "Network service exploitation",
    prompt: "Nmap reveals port 445 (SMB) running SMBv1 on a Windows Server 2008 target. You immediately recognize this as a high-value finding. What well-known vulnerability family is associated with SMBv1 on port 445?",
    options: [
      "EternalBlue (MS17-010) — a critical SMBv1 remote code execution vulnerability exploited by WannaCry and NotPetya. Combined with null session enumeration and NTLM relay, SMB on 445 is one of the most attacked network services.",
      "BlueKeep (CVE-2019-0708) — a pre-authentication remote code execution in the SMB protocol's session negotiation phase that allows an attacker to execute arbitrary code before any credentials are exchanged on port 445.",
      "Shellshock (CVE-2014-6271) — an environment variable injection vulnerability in the SMB daemon's Bash shell integration that allows command execution when a specially crafted share name is processed during connection setup.",
      "Heartbleed (CVE-2014-0160) — a buffer over-read in SMBv1's heartbeat extension that leaks up to 64 KB of server memory per request, potentially exposing credentials, session tokens, and private keys from the SMB service.",
    ],
    correctIndex: 0,
    explanation:
      "EternalBlue (MS17-010) exploits SMBv1 for remote code execution — the basis of WannaCry. Other service-to-vulnerability mappings: RDP/3389 has BlueKeep, SMTP/25 has open relay and user enumeration, DNS/53 has zone transfer and cache poisoning. Knowing these mappings guides exploitation priorities.",
  },
  // ══ net-attacks L4 ══
  {
    slug: "net-atk-l4-evasion",
    competencyId: "net-attacks",
    depthTier: 4,
    sectionHeading: "Advanced scanning evasion",
    prompt: "You need to scan a target without your IP appearing in any of its logs. You identify a printer on the same network with a predictable IP ID sequence. How does Nmap's idle scan (-sI) use this zombie host to achieve complete stealth?",
    options: [
      "The attacker probes the zombie's IP ID, sends a spoofed SYN (source = zombie) to the target, then re-probes the zombie's IP ID. If the target replied SYN-ACK to the zombie (port open), the zombie's IP ID incremented by 2 instead of 1 — revealing port state without the attacker's IP ever reaching the target.",
      "The idle scan encrypts each probe with the zombie's MAC address as the key, so the target decrypts the probe and sees the zombie's identity. The attacker's IP is removed from the IP header by the zombie's NAT before the probe reaches the target.",
      "The idle scan sends all probes at a rate of one packet per minute through the zombie, which is too slow for any IDS to detect. The stealth comes entirely from timing rather than from hiding the attacker's source IP address.",
      "The idle scan spoofs the target's own IP as the source address, creating a loopback that the target processes internally. The zombie is used only to measure round-trip timing and has no role in hiding the attacker's identity.",
    ],
    correctIndex: 0,
    explanation:
      "The idle scan exploits predictable IP ID sequences: the attacker infers port state on the target by observing whether the zombie's IP ID counter jumped (because the target sent it a SYN-ACK that the zombie RST'd). The attacker's IP never appears in the target's logs. Other evasion techniques include fragmentation (-f), decoys (-D), and slow timing (-T1).",
  },
  {
    slug: "net-atk-l4-ipv6-attacks",
    competencyId: "net-attacks",
    depthTier: 4,
    sectionHeading: "IPv6 network attacks",
    prompt: "On an internal network where IPv6 is enabled but unmonitored, you run mitm6 to answer DHCPv6 requests and pair it with ntlmrelayx pointed at the domain controller's LDAP service. What chain of events makes this attack effective?",
    options: [
      "Windows clients prefer IPv6 and accept mitm6's DHCPv6 response, making the attacker their DNS server. The attacker's DNS replies direct WPAD/authentication traffic to ntlmrelayx, which relays the captured NTLM authentication to LDAP for privilege escalation.",
      "mitm6 exploits a buffer overflow in the Windows IPv6 stack to inject shellcode that disables the host-based firewall, then ntlmrelayx connects directly to the now-unprotected SMB service to dump the local SAM database.",
      "mitm6 fragments IPv6 Router Advertisements into overlapping pieces that crash the victim's network stack, forcing a reboot. During the reboot, ntlmrelayx intercepts the machine account's Kerberos AS-REQ before the TGT is encrypted.",
      "mitm6 replaces the WPA2 passphrase on the wireless segment with an attacker-controlled key using IPv6 neighbor solicitation, then ntlmrelayx decrypts the Wi-Fi traffic to extract NTLM hashes from any SMB sessions in transit.",
    ],
    correctIndex: 0,
    explanation:
      "Windows prefers IPv6 even on 'IPv4-only' networks. mitm6 poisons DHCPv6/DNS, and ntlmrelayx forwards the resulting NTLM authentication to LDAP/LDAPS. This can create new computer accounts or modify ACLs for privilege escalation. The attack is highly effective where IPv6 is enabled but not monitored.",
  },
  {
    slug: "net-atk-l4-protocol-attacks",
    competencyId: "net-attacks",
    depthTier: 4,
    sectionHeading: "Protocol-level attacks",
    prompt: "You demonstrate three attacks to a client: STP root-bridge takeover using forged BPDUs, DHCP starvation followed by a rogue DHCP server, and ARP cache poisoning. They ask what fundamental weakness these share. What do you explain?",
    options: [
      "All three exploit layer-2 protocols that were designed with implicit trust — STP, DHCP, and ARP have no authentication mechanism, so any device on the wire can forge protocol messages and manipulate network behavior without proving its identity.",
      "All three require the attacker to possess the target's TLS private key, because STP, DHCP, and ARP messages are encrypted at layer 2 using the same X.509 certificate infrastructure that protects HTTPS connections.",
      "All three work only from the public internet because layer-2 protocols extend beyond the local segment via MPLS label switching, which means an external attacker can reach STP, DHCP, and ARP services from any global IP address.",
      "All three exploit a shared implementation bug in the AES cipher suite used by modern switch firmware. The STP, DHCP, and ARP implementations in Cisco IOS, Juniper JunOS, and Linux all call the same vulnerable AES library function.",
    ],
    correctIndex: 0,
    explanation:
      "STP, DHCP, and ARP were designed for trusted environments with no authentication. STP takeover uses forged BPDUs; DHCP starvation exhausts leases for rogue DHCP; ARP poisoning redirects traffic. yersinia automates many of these. Port security, DHCP snooping, and DAI are switch-level defenses.",
  },
  {
    slug: "net-atk-l4-interception",
    competencyId: "net-attacks",
    depthTier: 4,
    sectionHeading: "Traffic interception and analysis",
    prompt: "From a MitM position, you intercept a victim browsing to their bank. The server responds with an HTTPS redirect, but your tool rewrites it to HTTP before forwarding to the victim. The victim's browser shows no lock icon but the page loads normally. What is this attack called and what defends against it?",
    options: [
      "SSL stripping — the attacker maintains HTTPS to the real server but downgrades the victim's connection to HTTP, exposing all traffic in cleartext. HSTS (HTTP Strict Transport Security) defends by telling the browser to refuse non-HTTPS connections to that domain.",
      "Certificate pinning bypass — the attacker replaces the server's certificate with a self-signed one that the victim's browser trusts because the attacker has added their CA to the system trust store. Revoking the CA certificate is the only defense.",
      "TLS renegotiation attack — the attacker forces a downgrade from TLS 1.3 to SSL 3.0 by injecting a forged ServerHello, then uses the POODLE vulnerability to decrypt the session. Disabling SSL 3.0 on the server is the defense.",
      "DNS rebinding — the attacker modifies the DNS response TTL to zero so the victim's browser re-resolves the domain to the attacker's IP on every request. The browser then connects directly to the attacker over HTTP. DNSSEC prevents rebinding.",
    ],
    correctIndex: 0,
    explanation:
      "SSL stripping (sslstrip, bettercap) keeps HTTPS to the server but serves HTTP to the victim. HSTS (with preloading) defends by making the browser refuse HTTP entirely for that domain. Tools like pcredz extract credentials from captured cleartext traffic.",
  },
  // ══ net-attacks L5 ══
  {
    slug: "net-atk-l5-fuzzing",
    competencyId: "net-attacks",
    depthTier: 5,
    sectionHeading: "Custom protocol fuzzing",
    prompt: "You are testing a proprietary network service that speaks a custom binary protocol on port 9999. No public CVEs exist. You set up boofuzz to systematically mutate protocol fields while monitoring the service for crashes. What is the goal of this approach?",
    options: [
      "To discover implementation bugs — memory corruption, integer overflows, or unhandled edge cases — by sending malformed and unexpected inputs that the developers never tested, potentially revealing exploitable vulnerabilities before they are publicly known.",
      "To encrypt the proprietary protocol's traffic using industry-standard TLS by fuzzing the handshake until the service accidentally negotiates a cipher suite, making the custom protocol compatible with standard security tooling.",
      "To measure the service's maximum throughput by gradually increasing the mutation rate until the service saturates its network bandwidth, producing a performance benchmark report without any security implications.",
      "To document the protocol's RFC specification by reverse-engineering valid message formats from the mutations that the service accepts, publishing the resulting documentation to the IETF for standardization review.",
    ],
    correctIndex: 0,
    explanation:
      "Protocol fuzzing mutates message fields to trigger parser bugs — crashes, hangs, and memory corruption — in network services. Boofuzz monitors the target for anomalies and tracks which mutations caused them, making it a primary technique for discovering zero-day vulnerabilities in custom protocols.",
  },
  {
    slug: "net-atk-l5-covert",
    competencyId: "net-attacks",
    depthTier: 5,
    sectionHeading: "Covert channels and data exfiltration",
    prompt: "After compromising a server in a locked-down environment where only DNS queries to an internal resolver are allowed outbound, you need to exfiltrate collected data. You encode data into DNS subdomain labels and query your external authoritative server. Why is DNS a particularly effective covert exfiltration channel?",
    options: [
      "DNS is almost universally allowed outbound — even strict firewalls permit it because name resolution is essential. Data encoded in subdomain query labels (e.g., \`dGVzdA.exfil.attacker.com\`) is recursively resolved to the attacker's authoritative server, bypassing egress controls that block direct connections.",
      "DNS queries are encrypted end-to-end by default using DNSSEC, so the data encoded in subdomain labels is unreadable to any monitoring system. The attacker's server decrypts the queries using its DNSSEC private key to recover the exfiltrated data.",
      "DNS queries are never logged by any network device, recursive resolver, or security appliance, making DNS exfiltration fundamentally undetectable. No monitoring solution — SIEM, IDS, or firewall — has the capability to inspect DNS query content.",
      "DNS can only carry a single byte of data per query because subdomain labels are limited to one character each. While this makes DNS exfiltration extremely slow, the one-byte-per-query pattern is too small for any detection engine to flag as anomalous.",
    ],
    correctIndex: 0,
    explanation:
      "DNS must be allowed for networks to function, so data encoded in query labels tunnels past egress controls. Tools like dnscat2 and iodine automate DNS tunneling. Detection looks for abnormally long subdomain labels, high query volume to unusual domains, and high-entropy query strings.",
  },
  {
    slug: "net-atk-l5-implant",
    competencyId: "net-attacks",
    depthTier: 5,
    sectionHeading: "Network implant development",
    prompt: "A red team deploys a C2 implant that beacons over HTTPS to a domain fronted through a major CDN, with randomized jitter between check-ins. The blue team's network monitoring shows only TLS connections to the CDN's IP ranges. Why is this C2 architecture difficult to detect?",
    options: [
      "The C2 traffic blends with legitimate HTTPS traffic to the same CDN, encrypted and indistinguishable at the network layer. Domain fronting hides the true destination in the encrypted SNI/Host header, and jitter prevents periodic-beacon detection by varying the timing pattern.",
      "The HTTPS beacon is the only protocol capable of traversing the corporate firewall because the firewall blocks every other protocol including DNS, ICMP, and raw TCP. The difficulty is purely that HTTPS is the sole allowed outbound channel.",
      "The CDN's terms of service prohibit security vendors from inspecting any traffic destined for its IP ranges, creating a legal safe harbor that prevents the blue team from deploying TLS inspection appliances or requesting traffic logs.",
      "The C2 implant transmits commands using HTTP plaintext inside the TLS tunnel, and the blue team's TLS inspection appliance cannot parse the inner HTTP because it only supports HTTP/2 while the implant deliberately uses HTTP/1.0.",
    ],
    correctIndex: 0,
    explanation:
      "Beaconing over TLS to plausible CDN-fronted domains hides C2 in the noise of legitimate HTTPS. Domain fronting puts the real destination in the encrypted Host header while the SNI shows the CDN. Jitter mimics human browsing patterns. Detection requires TLS inspection, JA3 fingerprinting, or behavioral analysis of beacon intervals.",
  },
  {
    slug: "net-atk-l5-defense-evasion",
    competencyId: "net-attacks",
    depthTier: 5,
    sectionHeading: "Network defense detection and evasion",
    prompt: "You are briefing a client on how their IDS/IPS detects threats and how sophisticated attackers evade it. The client has both signature-based and anomaly-based detection deployed inline. What evasion techniques address each detection method?",
    options: [
      "Signature-based detection matches known byte patterns, so attackers evade it by encrypting payloads, fragmenting packets across rule boundaries, and obfuscating protocol fields. Anomaly-based detection flags statistical outliers, so attackers evade it by mimicking normal traffic timing, volume, and protocol distribution.",
      "Both signature and anomaly detection are impossible to evade because they operate on a mathematical proof-of-correctness model that guarantees detection of any malicious traffic pattern, regardless of encryption, fragmentation, or obfuscation techniques applied.",
      "Signature-based detection only monitors traffic on TCP port 80, so any attack using a different port evades it entirely. Anomaly-based detection only tracks total bandwidth utilization, so attacks that stay below 50% of link capacity are never flagged.",
      "Both detection methods rely solely on IP reputation databases maintained by the ISP. The only evasion technique is to route attack traffic through IP addresses not yet added to the reputation list, which requires using a VPN exit node in a country the ISP does not monitor.",
    ],
    correctIndex: 0,
    explanation:
      "Signature-based detection matches known indicators (byte patterns, Snort rules); evasion encrypts, fragments, or obfuscates to avoid matches. Anomaly-based detection flags deviations from learned baselines; evasion mimics normal behavior in timing, volume, and protocol use. Sophisticated attackers must defeat both simultaneously.",
  },
];
