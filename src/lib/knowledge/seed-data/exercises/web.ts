import type { SeedExercise } from "./types";

/** web-fundamentals (L0–L5) + web-security (L0–L5) — one MCQ per teaching section. */
export const WEB_EXERCISES: SeedExercise[] = [
  // ══ web-fundamentals L0 ══
  {
    slug: "web-fund-l0-what",
    competencyId: "web-fundamentals",
    depthTier: 0,
    sectionHeading: "What is web development",
    prompt:
      "You open Wireshark on your machine and browse to a website. You see a TCP handshake followed by an HTTP GET, then an HTTP 200 response. What does this sequence represent?",
    options: [
      "A standard client-server web interaction: your browser (client) established a TCP connection, sent an HTTP request for the page, and the server returned a successful response containing the requested content.",
      "A server push notification: the server initiated contact with your browser, pushed content over UDP, and the 200 code confirms the push completed without requiring any client-side acknowledgment or further requests.",
      "A peer-to-peer file transfer: your browser and the remote machine negotiated a direct WebRTC data channel, and the HTTP 200 is the signaling confirmation that the transfer completed successfully.",
      "A DNS resolution sequence: the TCP handshake resolved the domain name to an IP address, the GET fetched the DNS zone file, and the 200 confirmed the record was cached locally for future lookups.",
    ],
    correctIndex: 0,
    explanation:
      "HTTP is request/response: the browser asks, the server answers. Understanding HTTP, sessions, cookies, and auth is prerequisite to both building and attacking web apps.",
  },
  {
    slug: "web-fund-l0-http-cycle",
    competencyId: "web-fundamentals",
    depthTier: 0,
    sectionHeading: "The HTTP request/response cycle",
    prompt:
      "You try to access an API endpoint and receive a 401 status code. Your colleague claims you should have received a 403 instead. What is the distinction between these two status codes?",
    options: [
      "401 means the server does not know who you are (unauthenticated) and wants you to provide credentials; 403 means it knows who you are but you lack permission to access the specific resource you requested.",
      "401 means the resource has been permanently moved and you need to follow the redirect to its new location; 403 means the server is temporarily overloaded and you should retry the request after a delay.",
      "401 means the server encountered an internal error while processing your authentication credentials; 403 means the request body was malformed and could not be parsed by the server's input handler.",
      "401 means the requested URL path does not exist on the server and has never been registered; 403 means the URL exists but the content was previously deleted and is no longer available for retrieval.",
    ],
    correctIndex: 0,
    explanation:
      "2xx = success, 3xx = redirect, 4xx = client error (401 unauthenticated, 403 forbidden, 404 not found), 5xx = server error. Reading status codes is fundamental to testing and debugging web apps.",
  },
  {
    slug: "web-fund-l0-vocab",
    competencyId: "web-fundamentals",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt:
      "Your JavaScript fetch call from app.example.com to api.otherdomain.com is blocked by the browser with a CORS error. What is the browser actually enforcing?",
    options: [
      "The browser's Cross-Origin Resource Sharing policy, which blocks cross-origin requests unless the target server explicitly permits the requesting origin via Access-Control-Allow-Origin response headers.",
      "The browser's Content Security Policy, which prevents loading external scripts unless the page's CSP header includes the target domain in its script-src directive for approved resource origins.",
      "The browser's TLS certificate pinning policy, which rejects requests to servers whose certificates are not pre-registered in the browser's built-in trust store for cross-domain connections.",
      "The browser's DNS-over-HTTPS enforcement, which blocks requests to domains that do not support encrypted DNS resolution and falls back to a safe error page to protect user privacy.",
    ],
    correctIndex: 0,
    explanation:
      "CORS (Cross-Origin Resource Sharing) is a browser mechanism governing cross-origin access. The server must send Access-Control-Allow-Origin headers to permit cross-origin requests.",
  },
  // ══ web-fundamentals L1 ══
  {
    slug: "web-fund-l1-methods",
    competencyId: "web-fundamentals",
    depthTier: 1,
    sectionHeading: "HTTP methods and status codes",
    prompt:
      "An API doc says updating a user profile should use PUT /users/42, but your team uses PATCH /users/42 instead. What is the semantic difference between these two HTTP methods?",
    options: [
      "PUT replaces the entire resource with the payload you send, so omitted fields are cleared; PATCH applies a partial update, modifying only the specific fields you include in the request body.",
      "PUT appends new data to the existing resource without removing any current field values; PATCH deletes the resource entirely and recreates it with only the fields provided in the request payload.",
      "PUT is idempotent and cacheable like GET, so it should never modify server state at all; PATCH is the only HTTP method allowed to write data and cannot be safely retried after a timeout.",
      "PUT creates a brand-new resource at the specified URI if none currently exists and fails otherwise; PATCH always succeeds regardless of whether the target resource exists, creating it automatically if needed.",
    ],
    correctIndex: 0,
    explanation:
      "GET retrieves, POST creates, PUT replaces, PATCH partially updates, DELETE removes. Matching the method to the intended action is core REST semantics.",
  },
  {
    slug: "web-fund-l1-cookies",
    competencyId: "web-fundamentals",
    depthTier: 1,
    sectionHeading: "Cookies and sessions",
    prompt:
      "After an XSS audit, you recommend adding the HttpOnly flag to the session cookie. A developer asks why the Secure flag alone is not enough. What do you explain?",
    options: [
      "HttpOnly prevents JavaScript from reading the cookie via document.cookie, blocking XSS-based session theft; Secure only ensures the cookie is sent over HTTPS, which does nothing to stop script access on the page itself.",
      "HttpOnly encrypts the cookie value with a server-side key so it cannot be decoded in the browser; Secure merely adds a checksum to detect tampering during transit over the network between client and server.",
      "HttpOnly restricts the cookie to first-party requests only, preventing cross-site request forgery attacks; Secure limits the cookie's lifetime to the current browser session and deletes it when the tab closes.",
      "HttpOnly binds the cookie to the user's IP address so it cannot be replayed from another machine; Secure pins the cookie to a specific TLS certificate to prevent man-in-the-middle interception of the value.",
    ],
    correctIndex: 0,
    explanation:
      "HttpOnly hides the cookie from document.cookie, blunting XSS-based session theft. Secure restricts it to HTTPS, and SameSite controls cross-site sending (CSRF defense).",
  },
  {
    slug: "web-fund-l1-auth",
    competencyId: "web-fundamentals",
    depthTier: 1,
    sectionHeading: "Authentication patterns",
    prompt:
      "Your team is debating JWT-based auth versus server-side sessions for a new microservice. What is the fundamental architectural difference between the two approaches?",
    options: [
      "JWT sends a self-contained signed token in the Authorization header that the server validates without storing session state; session auth keeps a server-side record keyed by a cookie-stored session ID on each request.",
      "JWT stores the user's credentials encrypted in a server-side database and issues a lookup key as a cookie; session auth embeds the full user profile directly in the URL query string on every outgoing request.",
      "JWT relies on the browser's built-in credential manager to store and send tokens automatically; session auth requires the client to manually attach a password hash to every request header for validation.",
      "JWT encrypts all request and response bodies end-to-end using the token as the encryption key; session auth only encrypts the initial login exchange and sends everything else in plaintext after authentication.",
    ],
    correctIndex: 0,
    explanation:
      "Session auth keeps state server-side keyed by a cookie; JWT carries a self-contained signed token. OAuth 2.0 delegates authentication to a third party.",
  },
  {
    slug: "web-fund-l1-database",
    competencyId: "web-fundamentals",
    depthTier: 1,
    sectionHeading: "Database fundamentals",
    prompt:
      "A junior developer asks why pentesters need to understand SQL when they are not building applications. What is the security-relevant reason?",
    options: [
      "Knowing how SELECT, INSERT, UPDATE, and DELETE queries are constructed reveals exactly how user input can be injected to manipulate query logic, which is the foundation of SQL injection testing.",
      "SQL knowledge is needed to configure the web server's firewall rules, since most firewalls store their access control lists in a relational database that must be queried directly during penetration tests.",
      "Pentesters need SQL to write the reporting templates that vulnerability scanners generate, because scanner output is always stored in SQLite databases that require manual SQL queries for extraction.",
      "Understanding SQL is necessary to decode the encrypted payloads that web application firewalls produce, since WAF logs use SQL-like syntax to encode blocked request patterns for analyst review.",
    ],
    correctIndex: 0,
    explanation:
      "SELECT/INSERT/UPDATE/DELETE are the building blocks apps use — and the queries attackers subvert via injection. Knowledge of query structure is essential for testing injection vulnerabilities.",
  },
  // ══ web-fundamentals L2 ══
  {
    slug: "web-fund-l2-architecture",
    competencyId: "web-fundamentals",
    depthTier: 2,
    sectionHeading: "Server architecture patterns",
    prompt:
      "You are mapping a target's infrastructure and discover nginx sitting in front of a Gunicorn application server. What role does nginx play in this layered architecture?",
    options: [
      "It acts as a reverse proxy: terminating TLS connections, serving static files from disk, and load-balancing incoming requests across backend application servers without executing any business logic itself.",
      "It acts as the primary database engine: storing application state in its configuration files, caching query results locally, and replicating data to Gunicorn for read-only access by the application layer.",
      "It acts as the application runtime: interpreting Python code directly, managing user sessions in memory, and passing rendered HTML to Gunicorn, which only handles low-level TCP connection management.",
      "It acts as a forward proxy: routing outbound requests from the application server to external APIs, enforcing egress firewall rules, and logging all upstream traffic for compliance and auditing.",
    ],
    correctIndex: 0,
    explanation:
      "The reverse proxy fronts app servers (handling TLS, static content, balancing); app servers run logic; a database persists data; a cache (Redis) speeds hot reads; a message queue handles async work.",
  },
  {
    slug: "web-fund-l2-security-headers",
    competencyId: "web-fundamentals",
    depthTier: 2,
    sectionHeading: "HTTP headers for security",
    prompt:
      "A vulnerability scan flags a missing Content-Security-Policy header on a web application. Your client asks what risk this header mitigates. What do you explain?",
    options: [
      "CSP restricts which origins the browser may load scripts, styles, images, and other resources from, limiting the impact of XSS by blocking inline scripts and resources from untrusted external sources.",
      "CSP encrypts all response headers before they leave the server, ensuring that intermediary proxies cannot read or modify the page content while it is in transit to the client browser.",
      "CSP forces the browser to validate the server's TLS certificate chain on every request, preventing man-in-the-middle attacks by rejecting connections with expired or self-signed certificates automatically.",
      "CSP compresses the response body using a server-specified algorithm, reducing bandwidth usage and preventing cache-timing attacks by normalizing response sizes across all page loads and requests.",
    ],
    correctIndex: 0,
    explanation:
      "CSP allowlists resource origins as defense-in-depth against XSS. Other headers: X-Content-Type-Options (no MIME sniffing), X-Frame-Options (anti-clickjacking), HSTS (force HTTPS). Missing headers are a common assessment finding.",
  },
  {
    slug: "web-fund-l2-cors",
    competencyId: "web-fundamentals",
    depthTier: 2,
    sectionHeading: "CORS in detail",
    prompt:
      "During a pentest you find an API that reflects the Origin header into Access-Control-Allow-Origin and sets Access-Control-Allow-Credentials: true. Why is this configuration dangerous?",
    options: [
      "Any website can make authenticated cross-origin requests to this API and read the responses, because the server trusts whatever origin the browser sends and includes the user's cookies with each request.",
      "The configuration forces all browsers to disable their TLS certificate validation for this domain, allowing any attacker on the network to intercept and modify API responses without detection.",
      "The reflected origin causes browsers to cache every API response indefinitely, meaning stale data is served to users and cache invalidation headers are permanently ignored for that origin pair.",
      "The setting instructs the browser to send API requests using the HTTP TRACE method instead of GET or POST, exposing request headers including session tokens in the response body for extraction.",
    ],
    correctIndex: 0,
    explanation:
      "Reflecting any origin while allowing credentials lets any site make authenticated cross-origin requests. Browsers block literal * with credentials, but reflecting the Origin achieves the same insecure effect.",
  },
  {
    slug: "web-fund-l2-websockets",
    competencyId: "web-fundamentals",
    depthTier: 2,
    sectionHeading: "WebSockets and real-time communication",
    prompt:
      "You are testing a chat application that uses WebSockets. After the initial HTTP upgrade handshake completes, you notice no further CORS checks are applied to messages. Why is this a security concern?",
    options: [
      "WebSockets bypass the Same-Origin Policy after the handshake, so a malicious page can open a socket to the target and send or receive messages using the victim's cookies unless the server validates the Origin header.",
      "WebSockets automatically encrypt all messages using AES-256 after the upgrade, but the key is derived from the URL, so any site that knows the endpoint can decrypt all messages in transit passively.",
      "WebSockets convert all payloads into binary frames using RFC 6455 masking, which is a strong encryption mechanism that replaces TLS entirely, making WSS connections unnecessary and redundant.",
      "WebSockets require the server to open a dedicated port for each connected client, so a malicious page can exhaust the server's port range by opening many connections and denying service to legitimate users.",
    ],
    correctIndex: 0,
    explanation:
      "Once upgraded, WebSocket traffic is not bound by SOP, so the server must check Origin. WSS is WS over TLS; the RFC 6455 frame masking is anti-cache-poisoning, not encryption.",
  },
  {
    slug: "web-fund-l2-api-design",
    competencyId: "web-fundamentals",
    depthTier: 2,
    sectionHeading: "API design and documentation",
    prompt:
      "An authenticated user sends a crafted JSON body to a REST API that passes frontend validation but contains a negative quantity value. The order processes successfully. What principle was violated?",
    options: [
      "Server-side input validation: the API trusted client-supplied data without re-validating on the server, so the attacker bypassed frontend-only checks by crafting a direct API request with manipulated field values.",
      "Rate limiting: the API failed to throttle the user's requests per minute, allowing the crafted request to reach the server before the frontend's debounce timer could intercept and correct the invalid value.",
      "Authentication token rotation: the API did not require a fresh JWT for state-changing requests, so the user reused an expired token that skipped the validation middleware entirely for that endpoint.",
      "Content negotiation: the API accepted JSON when it should have required XML for write operations, and the XML schema would have enforced the positive-integer constraint that JSON lacks as a format by default.",
    ],
    correctIndex: 0,
    explanation:
      "Authentication says who a user is, not that their input is safe; server-side validation is mandatory. Frontend validation is for UX only and can always be bypassed by crafting direct requests.",
  },
  // ══ web-fundamentals L3 ══
  {
    slug: "web-fund-l3-microservices",
    competencyId: "web-fundamentals",
    depthTier: 3,
    sectionHeading: "Microservices and service mesh",
    prompt:
      "You gain access to an internal microservice and discover that east-west traffic between services uses plain HTTP with no authentication. Why is this a significant finding?",
    options: [
      "Internal service-to-service traffic without authentication or encryption means any compromised service can impersonate others, read sensitive data in transit, and pivot laterally through the internal network unrestricted.",
      "Plain HTTP between internal services causes all request logs to be stored in cleartext in the service mesh's control plane, which exposes them to external threat intelligence platforms monitoring DNS queries.",
      "Unauthenticated internal traffic triggers the API gateway to bypass its rate-limiting rules, because the gateway trusts all plain HTTP connections as health-check probes from the container orchestrator automatically.",
      "Services communicating over plain HTTP are unable to use service discovery mechanisms like Consul or etcd, meaning each service must hardcode IP addresses, which breaks automatic failover and scaling policies.",
    ],
    correctIndex: 0,
    explanation:
      "More services means more endpoints and secrets; internal traffic is easy to under-protect. mTLS or per-service tokens, an API gateway for central auth, and a secrets manager (Vault/KMS) address this.",
  },
  {
    slug: "web-fund-l3-ssr-edge",
    competencyId: "web-fundamentals",
    depthTier: 3,
    sectionHeading: "Server-side rendering and edge computing",
    prompt:
      "A Next.js application renders user profile pages server-side with direct database queries in the rendering function. A tester finds an injection flaw in this code. Why is this worse than a client-side bug?",
    options: [
      "SSR code executes on the server with direct database access, so an injection there runs with server privileges — potentially reading or modifying the entire database, not just the current user's browser context.",
      "SSR code is compiled into WebAssembly before execution, which disables all memory-safety protections that Node.js normally provides, making any injection a guaranteed remote code execution pathway.",
      "SSR injection flaws are cached by the CDN and served to all subsequent visitors, meaning the injected payload persists in the edge cache indefinitely even after the original vulnerability is patched.",
      "SSR rendering functions run inside the browser's service worker thread, which has elevated privileges to access other origins, so an injection there bypasses the Same-Origin Policy for all cached pages.",
    ],
    correctIndex: 0,
    explanation:
      "SSR runs on the server per request with DB access, so an injection there is a server-side compromise. Hydration mismatches can also leak data that was intended to stay server-side.",
  },
  {
    slug: "web-fund-l3-graphql",
    competencyId: "web-fundamentals",
    depthTier: 3,
    sectionHeading: "GraphQL security",
    prompt:
      "You send a GraphQL query that nests the 'friends' field 15 levels deep: { user { friends { friends { ... } } } }. The server becomes unresponsive. What category of attack is this?",
    options: [
      "A query-depth denial-of-service attack: recursive nesting forces exponential resolution work on the server because each level multiplies the number of database lookups and objects that must be resolved.",
      "A schema injection attack: deeply nested fields cause the GraphQL engine to rewrite its internal schema definition, creating new resolver types that consume all available memory in the type registry.",
      "A mutation replay attack: each nesting level is silently converted to a write operation by the resolver, so the server exhausts its transaction log by committing thousands of duplicate database records.",
      "A subscription flood attack: nested fields automatically register persistent WebSocket subscriptions for each resolved node, and the accumulated connections overwhelm the server's event loop and connection pool.",
    ],
    correctIndex: 0,
    explanation:
      "GraphQL's flexibility invites query-depth and query-cost abuse. Defenses: disable introspection in prod, set depth/cost limits, use persisted queries, and enforce field-level authorization.",
  },
  {
    slug: "web-fund-l3-caching",
    competencyId: "web-fundamentals",
    depthTier: 3,
    sectionHeading: "Caching strategies and security",
    prompt:
      "You discover a CDN-fronted site where adding an X-Forwarded-Host header changes the page's base URL in the response, but the CDN does not include that header in its cache key. What attack does this enable?",
    options: [
      "Web cache poisoning: your manipulated response containing the malicious base URL gets cached and served to all subsequent visitors, because the CDN treats it as identical to a clean request for that page.",
      "Cache side-channel timing: by measuring how fast the CDN responds with and without the header, you can determine whether a specific user has visited the page, leaking their browsing history passively.",
      "Cache credential harvesting: the X-Forwarded-Host header causes the CDN to append all cached Set-Cookie headers from other requests to your response, revealing session tokens of other users who visited.",
      "Cache key collision: the header causes the CDN to overwrite its TLS session tickets with your chosen values, allowing you to downgrade all cached connections to unencrypted HTTP for interception.",
    ],
    correctIndex: 0,
    explanation:
      "If a response varies on an input the cache does not key on (e.g. X-Forwarded-Host), an attacker can poison the cached copy for everyone. Cache deception tricks the cache into storing a victim's authenticated page at a public URL.",
  },
  // ══ web-fundamentals L4 ══
  {
    slug: "web-fund-l4-browser-model",
    competencyId: "web-fundamentals",
    depthTier: 4,
    sectionHeading: "Browser security model",
    prompt:
      "A malicious ad loaded in an iframe on news.example.com tries to read the DOM of the parent page. The browser blocks it. What security mechanism is responsible, and what defines the isolation boundary?",
    options: [
      "The Same-Origin Policy: it isolates origins defined by the tuple of scheme, host, and port, preventing scripts from one origin from reading data or DOM content belonging to a different origin in the same browser.",
      "Content Security Policy: the parent page's CSP header specifies which iframe sources are allowed, and any iframe not listed in the frame-src directive has its JavaScript execution completely disabled by the browser.",
      "Subresource Integrity: the browser compares a cryptographic hash of the ad's script against a hash declared in the parent page, and blocks DOM access whenever the computed hashes do not match.",
      "Cross-Origin Resource Sharing: the ad's server did not include the parent page's domain in its CORS headers, so the browser prevents the iframe from rendering any content at all, not just DOM access.",
    ],
    correctIndex: 0,
    explanation:
      "SOP isolates origins so a malicious site cannot read another's data. CSP adds server-specified allowlists, SRI verifies CDN scripts, and Site Isolation gives each origin its own process to blunt Spectre-class attacks.",
  },
  {
    slug: "web-fund-l4-http2-3",
    competencyId: "web-fundamentals",
    depthTier: 4,
    sectionHeading: "HTTP/2 and HTTP/3",
    prompt:
      "A network administrator notices that HTTP/3 traffic uses UDP port 443 instead of TCP. A colleague argues this removes TLS encryption. What is actually happening at the transport layer?",
    options: [
      "HTTP/3 uses the QUIC protocol over UDP, which integrates TLS 1.3 directly into the transport layer, providing encrypted connections with faster 0-RTT handshakes and better performance on lossy networks.",
      "HTTP/3 uses raw UDP without any encryption because QUIC delegates all security to the application layer, which must implement its own cipher negotiation using a custom handshake separate from TLS entirely.",
      "HTTP/3 tunnels traditional TCP-over-TLS inside UDP packets for compatibility with legacy firewalls, adding an extra encapsulation layer that increases latency but improves connection reliability compared to HTTP/2.",
      "HTTP/3 uses DTLS (Datagram TLS) over UDP, which provides the same encryption as TLS 1.2 but with mandatory certificate pinning and no support for session resumption or zero-round-trip connection setup.",
    ],
    correctIndex: 0,
    explanation:
      "HTTP/2 adds binary framing, multiplexing, and HPACK header compression over TCP; HTTP/3 moves to QUIC (UDP) with built-in encryption and 0-RTT. HTTP/2 downgrade/desync smuggling is a notable attack class.",
  },
  {
    slug: "web-fund-l4-wasm",
    competencyId: "web-fundamentals",
    depthTier: 4,
    sectionHeading: "Web Assembly security",
    prompt:
      "A web application uses WebAssembly to run a cryptographic library. A penetration tester claims Wasm has unrestricted system access like native code. What is the actual security model?",
    options: [
      "Wasm runs in a sandbox with its own linear memory and no direct DOM or OS access; however, it can still be used for timing side-channel attacks, and runtime bugs could theoretically allow sandbox escape.",
      "Wasm executes with the same privileges as a native binary on the host OS, having full filesystem and network access, but the browser limits it to read-only operations unless the user grants explicit permission.",
      "Wasm is fully isolated with no security risks because it compiles to a bytecode format that cannot interact with JavaScript or the DOM at all, making it impossible for Wasm to affect the page or exfiltrate data.",
      "Wasm runs inside a hardware-enforced Intel SGX enclave in supporting browsers, providing memory encryption that prevents even the operating system kernel from reading the module's internal computation state.",
    ],
    correctIndex: 0,
    explanation:
      "Wasm executes near-native speed in a sandbox with its own linear memory and no direct DOM access. It can still do timing side channels, and runtime bugs could allow sandbox escape. wasm2wat decompiles it for analysis.",
  },
  // ══ web-fundamentals L5 ══
  {
    slug: "web-fund-l5-js-engine",
    competencyId: "web-fundamentals",
    depthTier: 5,
    sectionHeading: "JavaScript engine internals",
    prompt:
      "A Chrome zero-day CVE describes a 'type confusion in V8's TurboFan JIT compiler.' What makes JIT compilation inherently prone to this class of vulnerability?",
    options: [
      "The JIT profiles code at runtime and speculates on variable types to generate optimized machine code; if the speculation is wrong, the generated code may access memory as the wrong type, causing exploitable memory corruption.",
      "The JIT compiles JavaScript to an intermediate bytecode that shares type metadata with the garbage collector; if the GC runs during compilation, it corrupts the bytecode's type tags, causing use-after-free vulnerabilities.",
      "The JIT converts all JavaScript numbers to 32-bit integers for performance; when a value exceeds 32 bits, the truncation causes an integer overflow that overwrites adjacent heap objects with attacker-controlled data.",
      "The JIT disables Address Space Layout Randomization for compiled code pages to improve branch prediction, giving attackers a reliable fixed-address region to use as a base for return-oriented programming chains.",
    ],
    correctIndex: 0,
    explanation:
      "Optimizing JITs speculate on types; a wrong speculation can yield type confusion and memory corruption — a steady source of V8 sandbox-escape CVEs. Mitigations include the V8 sandbox, pointer compression, and CFI.",
  },
  {
    slug: "web-fund-l5-tls-attacks",
    competencyId: "web-fundamentals",
    depthTier: 5,
    sectionHeading: "TLS implementation attacks",
    prompt:
      "In 2014, a critical OpenSSL vulnerability allowed attackers to read up to 64 KB of server memory per request by sending a malformed heartbeat message. Which attack was this, and what was the root cause?",
    options: [
      "Heartbleed (CVE-2014-0160): the server's heartbeat handler returned more bytes than the request payload contained, leaking adjacent memory including private keys, session data, and user credentials from the server process.",
      "POODLE (CVE-2014-3566): the server's SSLv3 cipher-block-chaining implementation used predictable padding, allowing a network attacker to decrypt one byte of ciphertext per 256 requests on average during the session.",
      "BEAST (CVE-2011-3389): the server reused initialization vectors across TLS 1.0 CBC records, letting a man-in-the-middle attacker predict the IV and progressively decrypt session cookies one byte at a time.",
      "CRIME (CVE-2012-4929): the server's TLS-level compression leaked plaintext length through compressed ciphertext size, allowing an attacker to recover secret tokens by observing response size variations across requests.",
    ],
    correctIndex: 0,
    explanation:
      "Heartbleed over-read memory via a malformed heartbeat request, exposing private keys and session data. POODLE attacks CBC padding in SSLv3, BEAST targets CBC IV reuse in TLS 1.0, and CRIME exploits TLS compression.",
  },
  {
    slug: "web-fund-l5-exploit-chain",
    competencyId: "web-fundamentals",
    depthTier: 5,
    sectionHeading: "Browser exploit chains",
    prompt:
      "A Pwn2Own entry achieves full system compromise through Chrome using three separate exploits. Why does a full browser compromise typically require a chain rather than a single vulnerability?",
    options: [
      "A renderer bug gives code execution only inside the heavily sandboxed renderer process; a second exploit escapes the sandbox to the browser process, and a third (often a kernel bug) escalates to full OS-level control.",
      "Chrome splits its codebase across three separate programming languages with independent memory spaces, so exploiting one language runtime requires a distinct language-specific vulnerability for each of the three layers.",
      "The browser applies three independent layers of TLS encryption to all internal data, so the attacker must break each encryption layer sequentially using a different cryptographic attack technique for each layer.",
      "Chrome stores all user data in three separate databases (cookies, history, passwords) each with its own authentication key, so stealing all data requires a distinct database-specific exploit for each store.",
    ],
    correctIndex: 0,
    explanation:
      "Renderer memory corruption executes code in a heavily sandboxed process; escaping to the browser/kernel needs an IPC or kernel bug. Site isolation, the V8 sandbox, MiraclePtr, and CFI raise the bar at each link.",
  },
  // ══ web-security L0 ══
  {
    slug: "web-sec-l0-what",
    competencyId: "web-security",
    depthTier: 0,
    sectionHeading: "What is web application security",
    prompt:
      "Your manager asks you to prioritize web vulnerabilities based on an industry-standard framework. Which resource should you reference as the canonical classification of critical web application risks?",
    options: [
      "The OWASP Top 10, a regularly updated list of the most critical web application security risks maintained by the Open Worldwide Application Security Project, widely adopted as the industry-standard reference.",
      "The NIST Password Guidelines (SP 800-63B), a framework focused on authentication strength that classifies web risks by the complexity of the passwords required to exploit each vulnerability category.",
      "The CVE Database maintained by MITRE, which assigns severity scores to all known web vulnerabilities and ranks them by the number of affected applications currently deployed in production worldwide.",
      "The CIS Benchmarks for Web Servers, a configuration hardening guide that classifies web risks by the operating system and web server software combination running on the target host being assessed.",
    ],
    correctIndex: 0,
    explanation:
      "OWASP publishes the Top 10, the canonical list of critical web risks. It is the industry-standard reference used for prioritizing web application security testing and remediation.",
  },
  {
    slug: "web-sec-l0-owasp-top10",
    competencyId: "web-security",
    depthTier: 0,
    sectionHeading: "The OWASP Top 10 (2021)",
    prompt:
      "You are scoping a web application pentest and reviewing the OWASP Top 10 (2021) to guide your methodology. Which vulnerability category was promoted to the number-one position in the 2021 edition?",
    options: [
      "Broken Access Control, reflecting how commonly applications fail to enforce authorization checks, allowing users to act outside their intended permissions across many real-world deployments.",
      "Injection (SQL, OS command, LDAP), recognizing that input-concatenation vulnerabilities remain the single most exploited class of web flaw due to widespread use of string-built database queries.",
      "Cross-Site Scripting, because client-side script injection continues to dominate bug-bounty submissions and is the most frequently reported vulnerability class across all public programs worldwide.",
      "Security Misconfiguration, since default credentials, open cloud storage buckets, and verbose error messages account for the majority of breaches reported to OWASP's data collection partners.",
    ],
    correctIndex: 0,
    explanation:
      "Broken Access Control ranks #1 in the 2021 OWASP Top 10, followed by Cryptographic Failures and Injection. SSRF was newly added at #10.",
  },
  {
    slug: "web-sec-l0-vocab",
    competencyId: "web-security",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt:
      "During a pentest you change /api/invoices/1042 to /api/invoices/1043 in the URL and receive another customer's invoice without any error. What is this vulnerability called, and why does it occur?",
    options: [
      "Insecure Direct Object Reference (IDOR): the server uses the user-supplied identifier to fetch the resource without verifying that the authenticated user is authorized to access that specific object.",
      "Server-Side Request Forgery (SSRF): the server follows the modified URL as an internal redirect, fetching the other customer's invoice from a backend microservice without validating the destination.",
      "Cross-Site Request Forgery (CSRF): the browser automatically attaches the victim's session cookie to the modified request, tricking the server into returning the other customer's data to your session.",
      "XML External Entity injection (XXE): the invoice ID is parsed as an XML entity reference, and the server resolves it to a different file path containing the other customer's document on the filesystem.",
    ],
    correctIndex: 0,
    explanation:
      "IDOR is a broken-access-control flaw where object references are not authorization-checked. The server must verify that the requesting user has permission to access each specific resource.",
  },
  // ══ web-security L1 ══
  {
    slug: "web-sec-l1-sqli",
    competencyId: "web-security",
    depthTier: 1,
    sectionHeading: "SQL injection fundamentals",
    prompt:
      "A login form concatenates user input directly into its SQL query string. You enter admin'-- as the username and the query returns all users, bypassing authentication. Why does using parameterized queries prevent this attack?",
    options: [
      "Parameterized queries send user input as data separate from the SQL command structure, so the database engine never interprets the input as SQL syntax regardless of what special characters it contains.",
      "Parameterized queries encrypt the user input with the database's master key before inserting it into the query string, so the injected SQL becomes unreadable ciphertext that the parser simply ignores.",
      "Parameterized queries run the input through a regex filter that strips all SQL keywords and special characters, then concatenate the sanitized string into the query exactly like the original vulnerable code.",
      "Parameterized queries execute each part of the SQL statement in a separate database transaction, so even if the injection succeeds, its effects are automatically rolled back before the results are committed.",
    ],
    correctIndex: 0,
    explanation:
      "Parameterized queries send data separately from SQL so input can never change the query structure. This is the correct and primary defense against SQL injection.",
  },
  {
    slug: "web-sec-l1-xss",
    competencyId: "web-security",
    depthTier: 1,
    sectionHeading: "Cross-Site Scripting (XSS)",
    prompt:
      "A bug bounty hunter injects <script>alert(1)</script> into a forum comment field, and every user who views the thread triggers the alert. Which type of XSS is this, and why is it more dangerous than the other types?",
    options: [
      "Stored (persistent) XSS: the payload is saved server-side and rendered to every visitor, so it executes automatically without requiring the victim to click a specially crafted link or visit an attacker-controlled page.",
      "Reflected XSS: the payload bounces off the comment API response and back into the same user's browser session, so it only affects the original poster themselves and is primarily useful for self-testing.",
      "DOM-based XSS: the browser's rendering engine stores the script in the Document Object Model, where it persists across page navigations, but it cannot access cookies due to the DOM's built-in sandboxing mechanism.",
      "Blind XSS: the payload is stored but never rendered in any browser; instead, it executes inside the server's Node.js runtime during server-side rendering, gaining access to the server's filesystem and environment variables.",
    ],
    correctIndex: 0,
    explanation:
      "Stored XSS persists (e.g. in a comment) and runs for all viewers; reflected XSS bounces input back in one response; DOM XSS happens purely client-side. Prevention: output encoding, CSP, input validation.",
  },
  {
    slug: "web-sec-l1-access-control",
    competencyId: "web-security",
    depthTier: 1,
    sectionHeading: "Broken access control",
    prompt:
      "An application hides the 'Admin Panel' link from non-admin users in the UI, but directly browsing to /admin still loads the full panel with all functionality. What access control principle has been violated?",
    options: [
      "Server-side enforcement with deny-by-default: authorization must be checked on every request at the server, not merely by hiding UI elements, since any user can craft direct requests to hidden endpoints.",
      "Client-side obfuscation with URL randomization: the admin panel's URL should have been a randomly generated UUID path instead of a guessable path, because URL obscurity is the primary layer of access control.",
      "Transport-layer restriction with mutual TLS: the admin panel should only accept connections from clients presenting a valid client certificate, making server-side role checks unnecessary for privileged endpoints.",
      "Session-based path binding: the user's session token should encode the list of allowed URL paths, and the reverse proxy should reject any request to a path not included in the token's signed claims.",
    ],
    correctIndex: 0,
    explanation:
      "Access control must be checked on the server for each request. Hiding UI elements or URLs is not access control; IDOR, forced browsing, and role tampering all exploit missing server-side checks.",
  },
  {
    slug: "web-sec-l1-csrf-ssrf",
    competencyId: "web-security",
    depthTier: 1,
    sectionHeading: "CSRF and SSRF basics",
    prompt:
      "An attacker hosts a page with an auto-submitting form that transfers money from a victim's bank account. Separately, another attacker makes a vulnerable server fetch http://169.254.169.254/. What are these two attacks called?",
    options: [
      "The first is CSRF (Cross-Site Request Forgery), tricking the victim's browser into making an unwanted authenticated request; the second is SSRF (Server-Side Request Forgery), abusing the server to reach internal resources like cloud metadata.",
      "The first is clickjacking, overlaying an invisible iframe to capture the victim's clicks on a legitimate-looking page; the second is DNS rebinding, making the victim's browser resolve a public domain to an internal IP address.",
      "The first is session fixation, forcing the victim's browser to use an attacker-chosen session ID for all authentication; the second is open redirect, tricking the server into forwarding the user's request to an attacker-chosen URL.",
      "The first is reflected XSS, injecting a script that executes in the victim's browser and auto-submits the form; the second is directory traversal, making the server read a file outside its web root using path manipulation characters.",
    ],
    correctIndex: 0,
    explanation:
      "CSRF abuses the victim's authenticated session (defense: CSRF tokens, SameSite cookies). SSRF abuses the server as a request proxy to reach internal services like cloud metadata (defense: allowlist URLs, block private ranges).",
  },
  // ══ web-security L2 ══
  {
    slug: "web-sec-l2-burp",
    competencyId: "web-security",
    depthTier: 2,
    sectionHeading: "Burp Suite workflow",
    prompt:
      "In Burp Suite you intercept a request in the Proxy, identify a suspicious parameter, and want to manually tweak and resend it multiple times while observing each response. Which tool do you send it to?",
    options: [
      "Repeater: it lets you manually edit any part of a captured request and resend it as many times as needed, displaying each response so you can observe how parameter changes affect the server's behavior.",
      "Intruder: it provides a single-request editor with a response diff viewer, designed for manually crafting one request at a time and comparing its response against a baseline captured during the initial proxy phase.",
      "Decoder: it opens the request in an editable text view with syntax highlighting, where you can modify parameters and resend while the tool automatically decodes all encoded values in the server's response.",
      "Comparer: it provides a request replay interface that sends the same request twice with a configurable delay, then highlights differences between the two responses to detect race conditions and timing issues.",
    ],
    correctIndex: 0,
    explanation:
      "Proxy intercepts, Repeater re-sends single requests for manual testing, Intruder automates parameter fuzzing, Decoder encodes/decodes, and Comparer diffs responses.",
  },
  {
    slug: "web-sec-l2-adv-sqli",
    competencyId: "web-security",
    depthTier: 2,
    sectionHeading: "Advanced SQL injection",
    prompt:
      "A user registers with the username admin'-- and the application stores it safely using parameterized inserts. Later, an admin search feature builds a query using the stored username without parameterization. What is this attack called?",
    options: [
      "Second-order SQL injection: the payload is stored safely on first use but triggers when a different part of the application retrieves and uses the stored value in an unsafe, non-parameterized query context later.",
      "Blind boolean-based injection: the stored username causes the database to return different page content depending on whether a boolean condition in the injected SQL evaluates to true or false at query time.",
      "UNION-based injection: the stored payload uses a UNION SELECT clause to append rows from other tables to the original query result, exfiltrating data through the application's normal response rendering.",
      "Stacked-query injection: the stored username terminates the original query with a semicolon and starts a new one, allowing arbitrary INSERT, UPDATE, or DELETE statements to execute in sequence on the backend.",
    ],
    correctIndex: 0,
    explanation:
      "Second-order SQLi stores a payload that seems harmless, then triggers when a later query uses the stored value unsafely. The key distinction is that injection happens in a different code path from where input was originally received.",
  },
  {
    slug: "web-sec-l2-lfi",
    competencyId: "web-security",
    depthTier: 2,
    sectionHeading: "File inclusion and path traversal",
    prompt:
      "You find an LFI vulnerability in a PHP application: page=../../etc/passwd works and returns the file contents. The client asks whether this can lead to remote code execution. What is a proven escalation technique?",
    options: [
      "Log poisoning: inject PHP code into a log file (e.g. via the User-Agent header), then use the LFI to include that log file, causing the server to execute the injected code with the web server's privileges.",
      "Hash collision: include /etc/shadow via the LFI and compute a rainbow table against the password hashes, then SSH in with the cracked credentials to execute commands directly on the underlying server.",
      "Memory mapping: include /proc/self/mem to overwrite the PHP interpreter's instruction pointer in memory, redirecting execution flow to shellcode payload bytes embedded in the original HTTP request headers.",
      "Certificate forging: include the server's TLS private key via LFI, use it to sign a client certificate that the server trusts with administrative access, then authenticate to the server's management API.",
    ],
    correctIndex: 0,
    explanation:
      "If attacker input reaches a file path, including a log file that contains injected PHP executes it (LFI to RCE). Prevention: never use user input in file paths, use allowlists, and chroot the application.",
  },
  {
    slug: "web-sec-l2-auth-session",
    competencyId: "web-security",
    depthTier: 2,
    sectionHeading: "Authentication and session attacks",
    prompt:
      "You decode a JWT and change the 'alg' header from RS256 to 'none', remove the signature entirely, and elevate your role claim to admin. The server accepts the modified token. What vulnerability class is this?",
    options: [
      "JWT algorithm confusion (alg:none attack): the server trusts the token's declared algorithm without enforcing its own expected algorithm, so removing the signature produces a token the server accepts as validly signed.",
      "JWT key injection: changing the algorithm header causes the server to derive a new signing key from the token payload itself, creating a circular trust relationship that validates any arbitrary claims you set.",
      "JWT replay attack: removing the signature resets the token's expiration timestamp to its default value of zero, which the server interprets as 'never expires,' allowing indefinite reuse across different sessions.",
      "JWT session fixation: the 'none' algorithm forces the server to create a new session on the backend using the claims you provided, bypassing the normal authentication flow and issuing a fresh valid session ID.",
    ],
    correctIndex: 0,
    explanation:
      "If the server trusts the token's declared algorithm, setting alg=none or confusing RS256 to HS256 forges valid tokens. The server must enforce a specific expected algorithm rather than reading it from the token.",
  },
  {
    slug: "web-sec-l2-cmd-injection",
    competencyId: "web-security",
    depthTier: 2,
    sectionHeading: "Command injection",
    prompt:
      "A web app passes a user-supplied filename to a shell command: os.system('convert ' + filename + ' output.pdf'). You submit 'test; cat /etc/passwd' as the filename. What is the proper fix?",
    options: [
      "Avoid shell invocation entirely: use language-native APIs with argument lists (e.g. subprocess.run with a list) so the user input is passed as a data argument and never interpreted as shell command syntax.",
      "Escape only semicolons and pipes in the filename string before passing it to os.system, because those are the only two shell metacharacters that can separate or redirect commands in bash and sh shells.",
      "Run the os.system call inside a try-except block so that if the injected command fails, the exception handler catches it and returns a generic error message instead of the command output to the user.",
      "Switch from os.system to os.popen, which opens a read-only pipe to the command output stream and prevents write operations, so the injected cat command can read files but cannot modify anything.",
    ],
    correctIndex: 0,
    explanation:
      "Passing user input to a shell lets metacharacters inject commands. Using APIs that pass arguments directly (no shell) avoids interpretation entirely. Never build shell command strings from user input.",
  },
  {
    slug: "web-sec-l2-xxe",
    competencyId: "web-security",
    depthTier: 2,
    sectionHeading: "XML External Entity (XXE)",
    prompt:
      "An API accepts XML input. You submit a DOCTYPE declaration with an external entity pointing to file:///etc/passwd, and the file contents appear in the API response. What is this attack exploiting?",
    options: [
      "XML External Entity (XXE) injection: the XML parser resolves external entity declarations, allowing you to read local files, make SSRF requests to internal services, or cause denial of service via recursive entity expansion.",
      "XML Schema poisoning: the DOCTYPE declaration overrides the API's XML schema definition, replacing its validation rules with your own permissive schema, which causes the parser to accept arbitrary malformed elements.",
      "XSLT injection: the external entity reference triggers the XML processor's XSLT transformation engine, which executes the referenced file as a stylesheet and includes its rendered output in the XML response body.",
      "XML signature wrapping: the DOCTYPE declaration creates a signed reference to the external file, and the server's XML signature validation treats the file contents as a trusted signed assertion in the response.",
    ],
    correctIndex: 0,
    explanation:
      "An external entity declaration makes the parser fetch local files or internal URLs. Fix: disable DOCTYPE/external entities in the parser configuration (e.g. defusedxml in Python, disallow-doctype-decl in Java).",
  },
  // ══ web-security L3 ══
  {
    slug: "web-sec-l3-ssti",
    competencyId: "web-security",
    depthTier: 3,
    sectionHeading: "Server-Side Template Injection (SSTI)",
    prompt:
      "You submit {{7*7}} in a profile name field and the rendered page shows 49 instead of the literal text. What does this confirm, and why is it critical?",
    options: [
      "Server-Side Template Injection: the input is evaluated by the server's template engine (Jinja2, Twig, Freemarker, etc.), which often escalates to remote code execution via object traversal to system-level classes like os or subprocess.",
      "Client-side expression binding: the frontend framework (Angular, Vue, React) evaluates the expression in the browser's DOM, which can escalate to cross-site scripting but cannot reach the server's filesystem or execute commands.",
      "SQL expression injection: the database's computed-column feature evaluated the arithmetic expression during a SELECT query, which means the application is vulnerable to SQL injection through numeric field inputs only.",
      "LaTeX rendering injection: the application uses a server-side LaTeX engine to typeset mathematical expressions in profile names, and the double braces are LaTeX math-mode delimiters that execute arbitrary TeX macros.",
    ],
    correctIndex: 0,
    explanation:
      "If {{7*7}} renders as 49, the input is evaluated by the template engine, which often escalates to RCE via object traversal to os/subprocess. tplmap automates detection and exploitation.",
  },
  {
    slug: "web-sec-l3-deserialization",
    competencyId: "web-security",
    depthTier: 3,
    sectionHeading: "Deserialization attacks",
    prompt:
      "A Java application receives a Base64-encoded serialized object in a cookie. You use ysoserial to craft a payload targeting the Commons Collections gadget chain. Why is deserializing untrusted data dangerous?",
    options: [
      "Crafted serialized objects trigger arbitrary code execution through gadget chains: sequences of existing class methods that, when invoked automatically during deserialization, chain together to reach dangerous operations like Runtime.exec().",
      "The deserialized object replaces the application's entire configuration at runtime, because Java's ObjectInputStream overwrites the application context with whatever properties the serialized object defines in its fields.",
      "Deserialization forces the JVM to download and execute a remote class file specified in the object's codebase annotation, similar to a Java Web Start application loading unsigned code from an arbitrary external URL.",
      "The serialized object's class definition is compiled and loaded by the JVM's JIT compiler during deserialization, allowing embedded Java source code strings in the object's fields to execute as native machine code.",
    ],
    correctIndex: 0,
    explanation:
      "Insecure deserialization lets an attacker control reconstructed object state and invoke gadget chains (ysoserial for Java, __reduce__ for pickle). Prefer JSON, never deserialize untrusted data, and allowlist types.",
  },
  {
    slug: "web-sec-l3-prototype-nosql",
    competencyId: "web-security",
    depthTier: 3,
    sectionHeading: "Prototype pollution and NoSQL injection",
    prompt:
      "A Node.js login endpoint passes the request body directly to MongoDB: db.users.find({user: req.body.user, pass: req.body.pass}). You send {\"user\":\"admin\", \"pass\":{\"$ne\":\"\"}} as the JSON body. Why does this bypass authentication?",
    options: [
      "The $ne (not-equal) operator changes the query logic so the password field matches any value that is not an empty string, which is true for any real password, bypassing the intended exact-match comparison.",
      "The $ne operator triggers MongoDB's built-in password-reset mechanism, which generates a temporary password for the admin account and returns the new credentials in the query response metadata.",
      "The $ne operator forces MongoDB to compare the password hash against an empty-string hash, and since empty-string hashes collide with all passwords in MongoDB's default hashing algorithm, it always matches.",
      "The $ne operator causes MongoDB to skip the password field entirely during the find operation and return results based only on the username match, because inequality operators disable field-level filtering.",
    ],
    correctIndex: 0,
    explanation:
      "If user input is placed into a query without sanitization, operators like $ne/$regex change the query logic. Sanitize user input to strip MongoDB operators before using it in queries.",
  },
  {
    slug: "web-sec-l3-race",
    competencyId: "web-security",
    depthTier: 3,
    sectionHeading: "Race conditions in web apps",
    prompt:
      "An e-commerce site lets each user redeem a discount code once. You use Turbo Intruder to send 20 redemption requests simultaneously, and the discount is applied to all 20 orders. What type of vulnerability is this?",
    options: [
      "A race condition exploiting a TOCTOU (time-of-check/time-of-use) gap: all 20 requests pass the 'code not yet redeemed' check before any single request commits the redemption, so the one-time limit is bypassed.",
      "A session multiplexing vulnerability: sending 20 requests creates 20 parallel sessions each with its own independent redemption counter, so the server treats each request as a first-time use by a different user.",
      "A request smuggling vulnerability: the 20 simultaneous requests are desynchronized at the load balancer, causing each backend server to process the code against its own local database replica independently.",
      "A cache poisoning vulnerability: the first request caches the 'code valid' response at the reverse proxy, and the remaining 19 requests receive the cached positive response without the server re-checking the code.",
    ],
    correctIndex: 0,
    explanation:
      "Concurrent requests exploit the time-of-check/time-of-use gap. Server-side locking, atomic database operations, and idempotency keys are the fixes. Turbo Intruder sends simultaneous requests to exploit these gaps.",
  },
  // ══ web-security L4 ══
  {
    slug: "web-sec-l4-smuggling",
    competencyId: "web-security",
    depthTier: 4,
    sectionHeading: "HTTP request smuggling",
    prompt:
      "You send a request with both Content-Length: 6 and Transfer-Encoding: chunked to a site fronted by a reverse proxy. The proxy uses Content-Length while the backend uses Transfer-Encoding. What can you achieve?",
    options: [
      "CL.TE request smuggling: the proxy forwards 6 bytes as the full request body, but the backend reads chunked encoding and interprets leftover bytes as the start of a new request, letting you inject a smuggled request that bypasses frontend controls.",
      "TLS downgrade smuggling: the conflicting headers cause the proxy to strip TLS encryption from the forwarded request, so the backend receives it in plaintext and processes it without any certificate validation.",
      "Header injection smuggling: the proxy concatenates both header values into a single malformed header that the backend parses as an HTTP method override, allowing you to convert a GET request into a DELETE.",
      "Response splitting smuggling: the dual headers cause the backend to include both values in the response's Content-Length, which splits the HTTP response into two parts that the proxy delivers to different clients.",
    ],
    correctIndex: 0,
    explanation:
      "When a proxy uses one length header and the backend the other (CL.TE / TE.CL / TE.TE), an attacker frames an extra request the backend treats as internal, bypassing access control, poisoning caches, or capturing others' requests.",
  },
  {
    slug: "web-sec-l4-adv-ssrf",
    competencyId: "web-security",
    depthTier: 4,
    sectionHeading: "Advanced SSRF techniques",
    prompt:
      "A web application has SSRF protection that blocks requests to 127.0.0.1 and 10.0.0.0/8. You successfully bypass it using the URL http://2130706433/latest/meta-data/. What technique did you use?",
    options: [
      "Alternate IP encoding: 2130706433 is the decimal-integer representation of 127.0.0.1, which the blocklist did not account for because it only compared against the dotted-decimal string format of the address.",
      "DNS prefetch poisoning: the integer in the URL triggered the browser's DNS prefetch mechanism, which resolved it to 127.0.0.1 after the application's blocklist check had already passed on the raw URL string.",
      "HTTP redirect chaining: the integer URL caused the server to follow a redirect chain through an external service, which eventually resolved to 127.0.0.1, but the blocklist only validated the initial URL in the chain.",
      "IPv6 tunneling: the integer was interpreted as an IPv6 address in its compact notation form, which the application mapped to a 6to4 tunnel endpoint that terminates on the local machine outside the blocklist ranges.",
    ],
    correctIndex: 0,
    explanation:
      "Decimal/hex/octal/IPv6 encodings of internal IPs, DNS rebinding, and redirect-to-internal all evade naive filters. A prime SSRF target is cloud metadata (169.254.169.254) for credentials.",
  },
  {
    slug: "web-sec-l4-proto-pollution-xss",
    competencyId: "web-security",
    depthTier: 4,
    sectionHeading: "Client-side prototype pollution to XSS",
    prompt:
      "A JavaScript application deep-merges URL query parameters into a configuration object. You set ?__proto__[innerHTML]=<img src=x onerror=alert(1)> and an alert fires when a library reads the innerHTML property from a different object. What happened?",
    options: [
      "Client-side prototype pollution: the deep merge wrote to Object.prototype.innerHTML, so when a library later accessed an object's innerHTML property and found no own property, it inherited the polluted value and rendered it as HTML.",
      "DOM clobbering: the URL parameter created a named DOM element with the id '__proto__' that shadowed the real Object.prototype, and the browser's HTML parser injected the img tag directly into the document body.",
      "Reflected XSS via URL fragment: the query parameter was reflected verbatim into the page's HTML source by the server-side template engine, and the browser executed the onerror handler as part of standard HTML rendering.",
      "Service worker injection: the deep merge registered a new service worker whose fetch handler intercepts all page requests and injects the img tag into every response body, causing the alert on all subsequent page loads.",
    ],
    correctIndex: 0,
    explanation:
      "If an app merges attacker-controlled data into an object and a library reads an inherited property as a gadget (innerHTML, src, eval), the pollution turns into script execution. Look for property lookups that sink to the DOM.",
  },
  // ══ web-security L5 ══
  {
    slug: "web-sec-l5-side-channels",
    competencyId: "web-security",
    depthTier: 5,
    sectionHeading: "Browser-based side channels",
    prompt:
      "You load evil.com in one tab and bank.com in another. Without any XSS on bank.com, evil.com uses frame counting and error-event timing to determine whether the user is logged into their bank account. What attack class is this?",
    options: [
      "Cross-Site Leaks (XS-Leaks): side-channel techniques that infer state about another origin through observable browser behaviors like frame counts, error events, cache timing, and response size without reading the response body.",
      "Cross-Site Scripting (XSS): the evil.com tab injects a script into the bank.com tab via the browser's shared JavaScript execution context, which reads the bank's DOM and reports the login status back to the attacker.",
      "Cross-Origin Resource Sharing abuse: evil.com sends a credentialed fetch to bank.com's API, and because the bank's CORS headers are misconfigured, the browser allows evil.com to read the full API response body directly.",
      "Spectre variant exploitation: evil.com uses a SharedArrayBuffer high-resolution timer to read the bank.com tab's process memory through CPU cache side channels, extracting the authentication state from session cookie bytes.",
    ],
    correctIndex: 0,
    explanation:
      "XS-Leaks infer cross-site state through timing, error events, frame counts, and cache probes without reading the response. SharedArrayBuffer's high-res timer aids Spectre-style attacks (mitigated by COOP/COEP).",
  },
  {
    slug: "web-sec-l5-csp-bypass",
    competencyId: "web-security",
    depthTier: 5,
    sectionHeading: "Advanced CSP bypass techniques",
    prompt:
      "A site has a strict CSP: script-src 'nonce-abc123' https://cdn.example.com. You discover a JSONP endpoint on cdn.example.com that reflects a callback parameter. How can you bypass the CSP to execute arbitrary JavaScript?",
    options: [
      "Load a script tag pointing to the JSONP endpoint with your payload as the callback value; since the CDN is allowlisted in script-src, the browser executes the response as trusted JavaScript from an approved origin.",
      "Steal the CSP nonce from the page source using the JSONP endpoint's callback to read document.head.innerHTML, then inject a new script tag with the stolen nonce to execute your own code under the trusted policy.",
      "Override the CSP header by injecting a second Content-Security-Policy header through the JSONP callback parameter, which causes the browser to merge both policies and relax the script-src directive.",
      "Use the JSONP endpoint to register a service worker on the CDN's origin, which intercepts all script requests from the target site and replaces their content with your payload while preserving the trusted origin.",
    ],
    correctIndex: 0,
    explanation:
      "If script-src allows a CDN that hosts a JSONP endpoint or a usable script gadget, an attacker executes code from a trusted origin. Base-tag injection and DOM clobbering are other CSP bypasses.",
  },
  {
    slug: "web-sec-l5-supply-chain",
    competencyId: "web-security",
    depthTier: 5,
    sectionHeading: "Supply chain attacks on web applications",
    prompt:
      "Your company uses a private npm package called @corp/auth-utils. An attacker publishes a public package named 'corp-auth-utils' with version 99.0.0. Some developer machines start pulling the attacker's package instead. What is this attack?",
    options: [
      "Dependency confusion: the attacker published a public package matching the private package's name with a higher version number, exploiting package managers that check public registries alongside private ones and prefer the highest version.",
      "Typosquatting via registry poisoning: the attacker compromised the npm registry's internal index to redirect all requests for the private package to the public one, which only works when the registry cache is invalidated.",
      "Lockfile manipulation: the attacker submitted a pull request that modified the project's package-lock.json to replace the private package's integrity hash with the public package's tarball hash, bypassing registry resolution.",
      "Build cache pollution: the attacker exploited the CI/CD pipeline's shared cache directory to replace the cached tarball of the private package with their own, which is effective only when the build cache is not isolated.",
    ],
    correctIndex: 0,
    explanation:
      "If a resolver prefers the highest version across public and private registries, a malicious public package can shadow a private one. Defenses include lockfile integrity, pinning, scoped registries, and namespace reservation.",
  },
];
