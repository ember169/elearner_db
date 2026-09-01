import type { SeedExercise } from "./types";

/** web-fundamentals (L0–L5) + web-security (L0–L5) — one MCQ per teaching section. */
export const WEB_EXERCISES: SeedExercise[] = [
  // ══ web-fundamentals L0 ══
  {
    slug: "web-fund-l0-what",
    competencyId: "web-fundamentals",
    depthTier: 0,
    sectionHeading: "What is web development",
    prompt: "In the client-server model, what is the basic flow of a web interaction?",
    options: [
      "The client (browser) sends a request over HTTP; the server processes it and returns a response.",
      "The server pushes pages to clients without any request.",
      "The browser executes server code directly on the user's disk.",
      "Clients communicate only with each other, never a server.",
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
    prompt: "Which HTTP status code indicates the client is not authorized / not authenticated?",
    options: [
      "401 (Unauthorized) — with 403 meaning forbidden even when authenticated.",
      "200 (OK).",
      "301 (Moved Permanently).",
      "500 (Internal Server Error).",
    ],
    correctIndex: 0,
    explanation:
      "2xx = success, 3xx = redirect, 4xx = client error (401 unauthorized, 403 forbidden, 404 not found), 5xx = server error. Reading status codes is fundamental to testing and debugging web apps.",
  },
  {
    slug: "web-fund-l0-vocab",
    competencyId: "web-fundamentals",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt: "What does CORS control?",
    options: [
      "Which origins a browser will let make cross-origin requests to a resource.",
      "How fast the server responds to requests.",
      "The encryption algorithm used for HTTPS.",
      "The database schema of the backend.",
    ],
    correctIndex: 0,
    explanation:
      "CORS (Cross-Origin Resource Sharing) is a browser mechanism governing cross-origin access. A session ties server-side state to a client via a cookie; TLS turns HTTP into HTTPS.",
  },
  // ══ web-fundamentals L1 ══
  {
    slug: "web-fund-l1-methods",
    competencyId: "web-fundamentals",
    depthTier: 1,
    sectionHeading: "HTTP methods and status codes",
    prompt: "Which HTTP method is intended to fully replace a resource?",
    options: [
      "PUT (PATCH does a partial update).",
      "GET.",
      "DELETE.",
      "POST.",
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
    prompt: "What does the HttpOnly cookie flag protect against?",
    options: [
      "JavaScript reading the cookie — mitigating cookie theft via XSS.",
      "The cookie being sent over plain HTTP.",
      "Cross-site sending of the cookie.",
      "The cookie expiring too soon.",
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
    prompt: "How does token-based (JWT) auth differ from session-based auth?",
    options: [
      "The client sends a signed token in the Authorization header; the server validates it without server-side session storage.",
      "The server stores the token and looks it up on each request, exactly like sessions.",
      "JWT sends the plaintext password on every request.",
      "JWT works only over unencrypted HTTP.",
    ],
    correctIndex: 0,
    explanation:
      "Session auth keeps state server-side keyed by a cookie; JWT carries a self-contained signed token in the Authorization header. OAuth 2.0 delegates auth (\"Login with Google\").",
  },
  {
    slug: "web-fund-l1-database",
    competencyId: "web-fundamentals",
    depthTier: 1,
    sectionHeading: "Database fundamentals",
    prompt: "Why is understanding SQL essential for web security, not just development?",
    options: [
      "The same query knowledge underpins SQL injection testing — knowing how queries are built reveals how they can be manipulated.",
      "SQL databases are immune to injection by design.",
      "Only NoSQL databases can be attacked.",
      "SQL is only relevant to the frontend.",
    ],
    correctIndex: 0,
    explanation:
      "SELECT/INSERT/UPDATE/DELETE are the building blocks apps use — and the queries attackers subvert via injection. Relational (PostgreSQL, MySQL, SQLite) and non-relational (MongoDB, Redis) stores both appear in web apps.",
  },
  // ══ web-fundamentals L2 ══
  {
    slug: "web-fund-l2-architecture",
    competencyId: "web-fundamentals",
    depthTier: 2,
    sectionHeading: "Server architecture patterns",
    prompt: "In a typical layered web architecture, what is a reverse proxy (nginx/Caddy) responsible for?",
    options: [
      "TLS termination, serving static files, and load balancing in front of application servers.",
      "Storing the application's persistent data.",
      "Executing the business logic itself.",
      "Running the client-side JavaScript.",
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
    prompt: "What does the Content-Security-Policy header do?",
    options: [
      "Restricts which sources scripts, styles, and other resources may load from, limiting XSS impact.",
      "Encrypts the response body.",
      "Forces the browser to cache the page forever.",
      "Rewrites the URL to HTTPS.",
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
    prompt: "Which CORS configuration is dangerously insecure?",
    options: [
      "Access-Control-Allow-Origin: * together with Access-Control-Allow-Credentials: true.",
      "Access-Control-Allow-Origin set to one specific trusted origin.",
      "Sending a preflight OPTIONS request for non-simple requests.",
      "Setting Access-Control-Max-Age to cache the preflight.",
    ],
    correctIndex: 0,
    explanation:
      "Reflecting/allowing any origin while also allowing credentials lets any site make authenticated cross-origin requests. (Browsers actually forbid literal `*` with credentials, but reflecting the Origin achieves the same insecure effect.)",
  },
  {
    slug: "web-fund-l2-websockets",
    competencyId: "web-fundamentals",
    depthTier: 2,
    sectionHeading: "WebSockets and real-time communication",
    prompt: "What is a key security note about WebSockets?",
    options: [
      "They bypass the same-origin policy after the handshake, so the server must validate the Origin header and use WSS (WS over TLS).",
      "They are automatically encrypted regardless of scheme.",
      "They cannot be used by attackers because they need a special port.",
      "They authenticate every message with the user's password.",
    ],
    correctIndex: 0,
    explanation:
      "Once upgraded, WebSocket traffic isn't bound by SOP, so the server must check Origin. WSS is simply WS over TLS (like HTTPS); the RFC 6455 frame masking is anti-cache-poisoning, not encryption.",
  },
  {
    slug: "web-fund-l2-api-design",
    competencyId: "web-fundamentals",
    depthTier: 2,
    sectionHeading: "API design and documentation",
    prompt: "What is the essential security rule for API input, even from authenticated users?",
    options: [
      "Always validate and sanitize input — never trust client-supplied data.",
      "Trust authenticated users completely to reduce latency.",
      "Validate only unauthenticated requests.",
      "Rely on the frontend to enforce all validation.",
    ],
    correctIndex: 0,
    explanation:
      "Authentication says who a user is, not that their input is safe; server-side validation is mandatory. RESTful conventions (method+path) and pagination/filtering are the design side of the same endpoints.",
  },
  // ══ web-fundamentals L3 ══
  {
    slug: "web-fund-l3-microservices",
    competencyId: "web-fundamentals",
    depthTier: 3,
    sectionHeading: "Microservices and service mesh",
    prompt: "What is a notable security consideration when decomposing into microservices?",
    options: [
      "Internal (east-west) service-to-service traffic often lacks the scrutiny of external endpoints — use mTLS or JWTs between services.",
      "Microservices remove the need for authentication entirely.",
      "A larger number of services reduces the attack surface.",
      "Each service can share one global admin credential safely.",
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
    prompt: "What security risk is specific to server-side rendering (SSR) components?",
    options: [
      "They have direct database access during rendering, so injection flaws there run with server privileges.",
      "They cannot use HTTPS.",
      "They always leak the user's password.",
      "They disable the same-origin policy.",
    ],
    correctIndex: 0,
    explanation:
      "SSR runs on the server per request with DB access, so an injection there is a server-side compromise; SSG pre-builds HTML; edge functions run near users with limited capabilities. Hydration mismatches can also leak data.",
  },
  {
    slug: "web-fund-l3-graphql",
    competencyId: "web-fundamentals",
    depthTier: 3,
    sectionHeading: "GraphQL security",
    prompt: "Why is a deeply nested GraphQL query a denial-of-service risk?",
    options: [
      "Recursive nesting (friends of friends of friends…) can force exponential resolution work — mitigated by query depth/cost limits.",
      "It exposes the server's TLS private key.",
      "It automatically grants admin access.",
      "It bypasses the CDN cache.",
    ],
    correctIndex: 0,
    explanation:
      "GraphQL's flexibility invites query-depth and query-cost abuse; introspection also reveals the full schema. Defenses: disable introspection in prod, set depth/cost limits, use persisted queries, and enforce field-level authorization.",
  },
  {
    slug: "web-fund-l3-caching",
    competencyId: "web-fundamentals",
    depthTier: 3,
    sectionHeading: "Caching strategies and security",
    prompt: "How does web cache poisoning work?",
    options: [
      "An attacker manipulates an unkeyed input (like a header) so the poisoned response gets cached and served to other users.",
      "The attacker encrypts the cache so it can't be read.",
      "The cache is deleted, forcing slow origin fetches.",
      "The attacker guesses the cache server's password.",
    ],
    correctIndex: 0,
    explanation:
      "If a response varies on an input the cache doesn't key on (e.g. X-Forwarded-Host), an attacker can poison the cached copy for everyone. Cache deception tricks the cache into storing a victim's authenticated page at a public URL.",
  },
  // ══ web-fundamentals L4 ══
  {
    slug: "web-fund-l4-browser-model",
    competencyId: "web-fundamentals",
    depthTier: 4,
    sectionHeading: "Browser security model",
    prompt: "What does the Same-Origin Policy (SOP) enforce?",
    options: [
      "Scripts from one origin (scheme + host + port) cannot read data from a different origin.",
      "All scripts must be served over HTTPS.",
      "Only one tab may run JavaScript at a time.",
      "Cookies are shared across all sites.",
    ],
    correctIndex: 0,
    explanation:
      "SOP isolates origins so a malicious site can't read another's data. CSP adds server-specified allowlists, SRI verifies CDN scripts, and Site Isolation gives each origin its own process to blunt Spectre-class attacks.",
  },
  {
    slug: "web-fund-l4-http2-3",
    competencyId: "web-fundamentals",
    depthTier: 4,
    sectionHeading: "HTTP/2 and HTTP/3",
    prompt: "What transport does HTTP/3 use, and what benefit follows?",
    options: [
      "QUIC over UDP, giving faster (0-RTT) connection setup and better performance on lossy networks.",
      "Raw TCP with no encryption, for speed.",
      "ICMP, to bypass firewalls.",
      "The same TLS-over-TCP as HTTP/1.1 with no changes.",
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
    prompt: "What is true about WebAssembly's security model?",
    options: [
      "It runs sandboxed (no direct DOM or raw memory outside its linear memory), but can still perform timing attacks and its runtime could have escape bugs.",
      "It has full unrestricted access to the operating system.",
      "It cannot be decompiled or analyzed.",
      "It replaces JavaScript's same-origin policy.",
    ],
    correctIndex: 0,
    explanation:
      "Wasm executes near-native speed in a sandbox with its own linear memory and no direct DOM access; it's used for crypto mining, cracking, and games. It can still do timing side channels, and runtime bugs could allow sandbox escape. wasm2wat decompiles it.",
  },
  // ══ web-fundamentals L5 ══
  {
    slug: "web-fund-l5-js-engine",
    competencyId: "web-fundamentals",
    depthTier: 5,
    sectionHeading: "JavaScript engine internals",
    prompt: "Why does JIT compilation in engines like V8 create security risk?",
    options: [
      "The JIT assumes types from profiling; incorrect assumptions (type confusion) produce memory-safety bugs exploitable from malicious JS.",
      "JIT code is always stored unencrypted on disk.",
      "JIT disables the same-origin policy.",
      "JIT makes JavaScript run slower and time out.",
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
    prompt: "What was Heartbleed?",
    options: [
      "A buffer over-read in OpenSSL's heartbeat extension that leaked adjacent server memory (keys, data).",
      "A padding oracle in SSLv3.",
      "A downgrade to 512-bit Diffie-Hellman.",
      "A compression oracle leaking secrets.",
    ],
    correctIndex: 0,
    explanation:
      "Heartbleed (OpenSSL) over-read memory via a malformed heartbeat request, exposing private keys and session data. Other TLS attacks include BEAST/POODLE (CBC), CRIME/BREACH (compression), and ROBOT (Bleichenbacher). CT logs help find misissued certs.",
  },
  {
    slug: "web-fund-l5-exploit-chain",
    competencyId: "web-fundamentals",
    depthTier: 5,
    sectionHeading: "Browser exploit chains",
    prompt: "Why does a full browser compromise usually require a chain of exploits?",
    options: [
      "A renderer bug only yields code execution inside the sandbox; a separate sandbox-escape (and often a kernel bug) is needed for full control.",
      "Browsers require exactly three passwords to compromise.",
      "One XSS payload always grants kernel access.",
      "Exploits must be chained only for aesthetic reasons.",
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
    prompt: "What does OWASP maintain that is the industry-standard reference for web risks?",
    options: [
      "The OWASP Top 10 — the most critical web application security risks.",
      "The list of approved TLS certificate authorities.",
      "The official HTTP specification.",
      "The global registry of IP addresses.",
    ],
    correctIndex: 0,
    explanation:
      "OWASP (Open Worldwide Application Security Project) publishes the Top 10, the canonical list of critical web risks. A single SQLi can dump a database; a single XSS can steal every user's session.",
  },
  {
    slug: "web-sec-l0-owasp-top10",
    competencyId: "web-security",
    depthTier: 0,
    sectionHeading: "The OWASP Top 10 (2021)",
    prompt: "Which category tops the OWASP Top 10 (2021)?",
    options: [
      "Broken Access Control.",
      "Cross-Site Scripting.",
      "Buffer Overflow.",
      "Denial of Service.",
    ],
    correctIndex: 0,
    explanation:
      "Broken Access Control ranks #1, followed by Cryptographic Failures and Injection. SSRF newly appears at #10. The list reflects how commonly each class is found and exploited.",
  },
  {
    slug: "web-sec-l0-vocab",
    competencyId: "web-security",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt: "What is an IDOR (Insecure Direct Object Reference)?",
    options: [
      "Accessing another user's resource by changing an identifier (e.g. /users/123 → /users/124) with no authorization check.",
      "Injecting JavaScript into a web page.",
      "Forcing the server to fetch an internal URL.",
      "Overflowing a fixed-size buffer.",
    ],
    correctIndex: 0,
    explanation:
      "IDOR is a broken-access-control flaw where object references aren't authorization-checked. XSS injects script, CSRF forges authenticated actions, SSRF makes the server fetch unintended URLs, LFI/RFI include unintended files.",
  },
  // ══ web-security L1 ══
  {
    slug: "web-sec-l1-sqli",
    competencyId: "web-security",
    depthTier: 1,
    sectionHeading: "SQL injection fundamentals",
    prompt: "What is the correct prevention for SQL injection?",
    options: [
      "Parameterized queries (prepared statements) — never build queries by concatenating user input.",
      "Escaping only single quotes in the input.",
      "Hiding the database error messages.",
      "Renaming the users table.",
    ],
    correctIndex: 0,
    explanation:
      "Injection arises from concatenating input into query text (`' OR 1=1--`). Parameterized queries send data separately from SQL so input can never change the query structure.",
  },
  {
    slug: "web-sec-l1-xss",
    competencyId: "web-security",
    depthTier: 1,
    sectionHeading: "Cross-Site Scripting (XSS)",
    prompt: "Which XSS type stores the payload server-side so it executes for every viewer?",
    options: [
      "Stored (persistent) XSS.",
      "Reflected XSS.",
      "DOM-based XSS.",
      "Blind SQL injection.",
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
    prompt: "What is the core defense against broken access control?",
    options: [
      "Enforce authorization on every request server-side, deny by default — not just hide options in the UI.",
      "Obfuscate the URLs of admin pages.",
      "Trust the client to send its own role.",
      "Rate-limit login attempts.",
    ],
    correctIndex: 0,
    explanation:
      "Access control must be checked on the server for each request (IDOR, forced browsing, and role tampering all exploit missing checks). Hiding UI elements or URLs is not access control.",
  },
  {
    slug: "web-sec-l1-csrf-ssrf",
    competencyId: "web-security",
    depthTier: 1,
    sectionHeading: "CSRF and SSRF basics",
    prompt: "What distinguishes CSRF from SSRF?",
    options: [
      "CSRF tricks a logged-in user's browser into making an unwanted request; SSRF makes the server fetch an attacker-chosen (often internal) URL.",
      "They are two names for the same attack.",
      "CSRF targets the server's filesystem; SSRF targets cookies.",
      "SSRF only works over HTTPS; CSRF only over HTTP.",
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
    prompt: "Which Burp Suite tool is used to manually modify and resend a single request?",
    options: [
      "Repeater.",
      "Proxy.",
      "Intruder.",
      "Decoder.",
    ],
    correctIndex: 0,
    explanation:
      "Proxy intercepts, Repeater re-sends single requests for manual testing, Intruder automates parameter fuzzing, Decoder encodes/decodes, and Comparer diffs responses — the standard web-testing loop.",
  },
  {
    slug: "web-sec-l2-adv-sqli",
    competencyId: "web-security",
    depthTier: 2,
    sectionHeading: "Advanced SQL injection",
    prompt: "What is second-order SQL injection?",
    options: [
      "Input stored safely, then used unsafely in a later query — e.g. a username `admin'--` reused without parameterization.",
      "Injection that requires two database servers.",
      "An injection that only works on the second HTTP request in a session.",
      "SQL injection combined with XSS.",
    ],
    correctIndex: 0,
    explanation:
      "Second-order SQLi stores a payload that seems harmless, then triggers when a later query uses the stored value unsafely. UNION-based, error-based, boolean-blind, and time-based are the extraction techniques.",
  },
  {
    slug: "web-sec-l2-lfi",
    competencyId: "web-security",
    depthTier: 2,
    sectionHeading: "File inclusion and path traversal",
    prompt: "How can Local File Inclusion (LFI) escalate to remote code execution?",
    options: [
      "Log poisoning — inject PHP into a log (e.g. via User-Agent), then include that log file so the code executes.",
      "By downloading a larger file than the disk allows.",
      "By reading /etc/passwd, which always yields a shell.",
      "LFI can never lead to code execution.",
    ],
    correctIndex: 0,
    explanation:
      "If attacker input reaches a file path, including a log file that contains injected PHP executes it (LFI→RCE). Prevention: never use user input in file paths, use allowlists, chroot the app.",
  },
  {
    slug: "web-sec-l2-auth-session",
    competencyId: "web-security",
    depthTier: 2,
    sectionHeading: "Authentication and session attacks",
    prompt: "What is the JWT “alg: none” attack?",
    options: [
      "Changing the token's algorithm to “none” and stripping the signature, so an app that doesn't verify accepts a forged token.",
      "Cracking the JWT's AES encryption.",
      "Guessing the user's password from the token.",
      "Replaying an expired token unchanged.",
    ],
    correctIndex: 0,
    explanation:
      "If the server trusts the token's declared algorithm, setting alg=none (no signature) or confusing RS256→HS256 (signing with the public key) forges valid tokens. Session fixation and password-reset poisoning are related session attacks.",
  },
  {
    slug: "web-sec-l2-cmd-injection",
    competencyId: "web-security",
    depthTier: 2,
    sectionHeading: "Command injection",
    prompt: "What is the correct prevention for OS command injection?",
    options: [
      "Avoid shell calls with user input; use language-native libraries with argument lists (e.g. subprocess with a list, not shell=True).",
      "Escape only semicolons in the input.",
      "Run the command as a non-root user only.",
      "Log the command before running it.",
    ],
    correctIndex: 0,
    explanation:
      "Passing user input to a shell lets metacharacters (`;`, `|`, `$()`, backticks) inject commands. Using APIs that pass arguments directly (no shell) avoids interpretation entirely; time-based and OOB techniques detect blind cases.",
  },
  {
    slug: "web-sec-l2-xxe",
    competencyId: "web-security",
    depthTier: 2,
    sectionHeading: "XML External Entity (XXE)",
    prompt: "What does an XXE vulnerability abuse?",
    options: [
      "An XML parser that resolves external entity declarations, enabling file reads, SSRF, and DoS (billion laughs).",
      "A JSON parser that ignores whitespace.",
      "A YAML anchor that duplicates keys.",
      "A CSV import that trims quotes.",
    ],
    correctIndex: 0,
    explanation:
      "An external entity like `<!ENTITY xxe SYSTEM \"file:///etc/passwd\">` makes the parser fetch local files or internal URLs (SSRF), and recursive entities cause DoS. Fix: disable DOCTYPE/external entities (e.g. defusedxml, disallow-doctype-decl).",
  },
  // ══ web-security L3 ══
  {
    slug: "web-sec-l3-ssti",
    competencyId: "web-security",
    depthTier: 3,
    sectionHeading: "Server-Side Template Injection (SSTI)",
    prompt: "What simple probe confirms server-side template injection?",
    options: [
      "Injecting a math expression like {{7*7}} and seeing 49 rendered back.",
      "Sending a single quote and seeing a SQL error.",
      "Uploading a large file.",
      "Adding a Host header.",
    ],
    correctIndex: 0,
    explanation:
      "If {{7*7}} renders as 49, the input is evaluated by the template engine (Jinja2, Twig, Freemarker…), which often escalates to RCE via object traversal to os/subprocess. tplmap automates detection.",
  },
  {
    slug: "web-sec-l3-deserialization",
    competencyId: "web-security",
    depthTier: 3,
    sectionHeading: "Deserialization attacks",
    prompt: "Why is deserializing untrusted data (e.g. Python pickle, Java) dangerous?",
    options: [
      "Crafted serialized objects can trigger code execution via magic methods / gadget chains during deserialization.",
      "It always corrupts the database.",
      "It only wastes CPU with no security impact.",
      "It reveals the server's IP address.",
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
    prompt: "How can a MongoDB authentication bypass be achieved via NoSQL injection?",
    options: [
      "Supplying query operators like {\"$ne\": \"\"} for username and password so the filter matches any non-empty value.",
      "Sending a UNION SELECT statement.",
      "Overflowing the BSON parser.",
      "Guessing the admin password by brute force.",
    ],
    correctIndex: 0,
    explanation:
      "If user input is placed into a query without sanitization, operators like $ne/$regex change the query logic — {\"$ne\":\"\"} matches anything. Prototype pollution ({\"__proto__\":{\"isAdmin\":true}}) similarly corrupts object defaults. Sanitize against operators.",
  },
  {
    slug: "web-sec-l3-race",
    competencyId: "web-security",
    depthTier: 3,
    sectionHeading: "Race conditions in web apps",
    prompt: "How does a web race-condition attack (e.g. redeeming a coupon multiple times) work?",
    options: [
      "Firing many parallel requests so several pass a check-then-act step before any is committed.",
      "Sending one request very slowly.",
      "Encrypting the request to hide it.",
      "Guessing the server's random seed.",
    ],
    correctIndex: 0,
    explanation:
      "Concurrent requests exploit the time-of-check/time-of-use gap, so a limited action (discount, vote, transfer) happens more than once. Tools like Turbo Intruder send simultaneous requests; server-side locking/atomic checks are the fix.",
  },
  // ══ web-security L4 ══
  {
    slug: "web-sec-l4-smuggling",
    competencyId: "web-security",
    depthTier: 4,
    sectionHeading: "HTTP request smuggling",
    prompt: "What disagreement do HTTP request smuggling attacks exploit?",
    options: [
      "Frontend and backend servers disagreeing on where one request ends (Content-Length vs Transfer-Encoding), letting a request be “smuggled” to the backend.",
      "The client and server disagreeing on the TLS version.",
      "Two databases disagreeing on a transaction.",
      "The browser and server disagreeing on the character encoding.",
    ],
    correctIndex: 0,
    explanation:
      "When a proxy uses one length header and the backend the other (CL.TE / TE.CL / TE.TE), an attacker frames an extra request the backend treats as internal — bypassing access control, poisoning caches, or capturing others' requests.",
  },
  {
    slug: "web-sec-l4-adv-ssrf",
    competencyId: "web-security",
    depthTier: 4,
    sectionHeading: "Advanced SSRF techniques",
    prompt: "Which is a common way to bypass an SSRF IP allowlist?",
    options: [
      "Alternate IP encodings or DNS rebinding (e.g. 127.0.0.1 as 2130706433, or a hostname that resolves to internal after the check).",
      "Sending the request twice.",
      "Adding a Content-Type header.",
      "Using a longer URL path.",
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
    prompt: "How can client-side prototype pollution escalate to XSS?",
    options: [
      "Polluting Object.prototype with a property a library later reads as a sink (e.g. innerHTML/src), so the injected value executes.",
      "By overwriting the server's session store.",
      "By disabling the same-origin policy directly.",
      "By brute-forcing the CSP nonce.",
    ],
    correctIndex: 0,
    explanation:
      "If an app merges attacker-controlled data into an object and a library reads an inherited property as a gadget (innerHTML, src, eval), the pollution turns into script execution. Look for property lookups in jQuery/lodash that sink to the DOM.",
  },
  // ══ web-security L5 ══
  {
    slug: "web-sec-l5-side-channels",
    competencyId: "web-security",
    depthTier: 5,
    sectionHeading: "Browser-based side channels",
    prompt: "What are XS-Leaks (cross-site leaks)?",
    options: [
      "Cross-site information disclosure via browser side channels — frame counting, error events, cache/timing — inferring state about another site.",
      "Leaks of the browser's own source code.",
      "A way to read another origin's response body directly.",
      "A method to disable HTTPS.",
    ],
    correctIndex: 0,
    explanation:
      "XS-Leaks infer cross-site state (e.g. is the user logged in) through timing, error events, frame counts, and cache probes without reading the response. SharedArrayBuffer's high-res timer aids Spectre-style attacks (mitigated by COOP/COEP).",
  },
  {
    slug: "web-sec-l5-csp-bypass",
    competencyId: "web-security",
    depthTier: 5,
    sectionHeading: "Advanced CSP bypass techniques",
    prompt: "How can an allowlisted CDN in a CSP be turned into a bypass?",
    options: [
      "Finding a JSONP endpoint or exploitable script gadget on the allowlisted origin, so attacker-controlled script loads from a trusted source.",
      "By sending the CSP header twice.",
      "By using HTTP/2 instead of HTTP/1.1.",
      "CSP allowlists can never be bypassed.",
    ],
    correctIndex: 0,
    explanation:
      "If `script-src` allows a CDN that hosts a JSONP endpoint or a usable script gadget, an attacker executes code from a trusted origin. Base-tag injection and DOM clobbering are other bypasses — CSP is defense-in-depth, not absolute.",
  },
  {
    slug: "web-sec-l5-supply-chain",
    competencyId: "web-security",
    depthTier: 5,
    sectionHeading: "Supply chain attacks on web applications",
    prompt: "What is a dependency confusion attack?",
    options: [
      "Publishing a public package with the same name (and a higher version) as a company's private package, so the build pulls the attacker's copy.",
      "Renaming a dependency to hide it.",
      "Confusing two versions of the same browser.",
      "Mixing HTTP and HTTPS dependencies.",
    ],
    correctIndex: 0,
    explanation:
      "If a resolver prefers the highest version across public and private registries, a malicious public package can shadow a private one. Typosquatting, compromised maintainers, and CI injection are related; defenses include lockfile integrity, pinning, and SRI.",
  },
];
