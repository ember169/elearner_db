import type { SeedExercise } from "./types";

/** scripting (L0–L5) + binexp (L0–L5) — one MCQ per teaching section. */
export const SCRIPTING_BINEXP_EXERCISES: SeedExercise[] = [
  // ══ scripting L0 ══
  {
    slug: "scripting-l0-why",
    competencyId: "scripting",
    depthTier: 0,
    sectionHeading: "Why scripting matters in cybersecurity",
    prompt: "Which language is described as the security “lingua franca” for exploit dev and tooling?",
    options: [
      "Python.",
      "COBOL.",
      "Visual Basic.",
      "Assembly.",
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
    prompt: "What does a shebang line (#!/usr/bin/env python3) do?",
    options: [
      "Tells the OS which interpreter to run the script with.",
      "Encrypts the script's source code.",
      "Imports the standard library automatically.",
      "Sets the script's file permissions.",
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
    prompt: "Which module runs external commands and captures their output in Python?",
    options: [
      "subprocess (subprocess.run(..., capture_output=True)).",
      "socket.",
      "hashlib.",
      "argparse.",
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
    prompt: "What does `find / -perm -4000 -type f 2>/dev/null` enumerate?",
    options: [
      "SUID binaries — potential privilege-escalation targets.",
      "All world-writable directories.",
      "Every open network port.",
      "Files modified in the last day.",
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
    prompt: "Why are regular expressions essential for security tooling?",
    options: [
      "They parse and extract structured data (IPs, emails, URLs, status codes) from noisy tool output and logs.",
      "They encrypt sensitive strings.",
      "They compile scripts to machine code.",
      "They manage network sockets.",
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
    prompt: "How does a simple Python TCP port scanner test whether a port is open?",
    options: [
      "socket.connect_ex((host, port)) returns 0 when the connection succeeds (port open).",
      "It sends an ICMP echo and waits for a reply.",
      "It reads the port state from /etc/services.",
      "It queries DNS for the port number.",
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
    prompt: "Why use a requests.Session() when scripting an authenticated web workflow?",
    options: [
      "It persists cookies across requests, so you stay logged in after posting credentials.",
      "It encrypts the traffic that requests otherwise sends in cleartext.",
      "It bypasses the site's login entirely.",
      "It is required to parse HTML.",
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
    prompt: "Why is `IEX (New-Object Net.WebClient).DownloadString(...)` a common post-exploitation pattern?",
    options: [
      "It downloads and executes a script in memory (fileless), avoiding writing to disk.",
      "It permanently installs a service on the host.",
      "It encrypts the C2 channel.",
      "It disables Windows Defender by itself.",
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
    prompt: "In pwntools, what does p64(0xdeadbeef) produce?",
    options: [
      "The 8-byte little-endian packing of the value, for placing an address in a payload.",
      "A hex string \"0xdeadbeef\".",
      "A 64-character random password.",
      "The disassembly of the address.",
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
    prompt: "What lets Scapy perform tasks other high-level libraries cannot?",
    options: [
      "It builds and sends packets at any layer, so you control fields like TCP flags, TTL, and raw payloads directly.",
      "It only reads pcap files.",
      "It runs exclusively inside the kernel.",
      "It automatically exploits any open port.",
    ],
    correctIndex: 0,
    explanation:
      "Scapy composes packets layer by layer (IP()/TCP(flags=\"S\")…) and sends them, enabling custom SYN scans, ARP sweeps, DNS queries, and TTL-controlled traceroutes.",
  },
  {
    slug: "scripting-l3-automation",
    competencyId: "scripting",
    depthTier: 3,
    sectionHeading: "Automation frameworks",
    prompt: "What does Python's argparse provide in a security tool?",
    options: [
      "A structured command-line interface with typed options, defaults, and help text.",
      "A network packet sniffer.",
      "A built-in exploit database.",
      "Automatic multithreading of any function.",
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
    prompt: "Why is asyncio/aiohttp dramatically faster than threads for network-bound scanning?",
    options: [
      "A single thread can juggle thousands of concurrent I/O operations without the overhead of thread context switching.",
      "It uses multiple CPU cores for the network I/O.",
      "It compiles the code to native machine code.",
      "It bypasses the target's rate limiting.",
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
    prompt: "What does ctypes let a Python script do?",
    options: [
      "Call C functions and OS APIs directly (libc, ptrace, ReadProcessMemory) without writing a C extension.",
      "Compile Python into a C binary.",
      "Encrypt Python bytecode.",
      "Disable the GIL permanently.",
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
    prompt: "Why parse Nmap's XML output (-oX) rather than scraping its text?",
    options: [
      "XML is structured and stable, so ElementTree reliably extracts hosts, ports, and versions to feed the next tool.",
      "XML output includes the exploit code.",
      "Text output cannot be saved to a file.",
      "XML runs the scan faster.",
    ],
    correctIndex: 0,
    explanation:
      "Machine-readable XML lets you chain tools (nmap → parse → nuclei) without brittle text scraping. Structured parsing is the key to building automation pipelines.",
  },
  // ══ scripting L5 ══
  {
    slug: "scripting-l5-internals",
    competencyId: "scripting",
    depthTier: 5,
    sectionHeading: "Python internals for security",
    prompt: "Why is `pickle.loads` on untrusted data dangerous?",
    options: [
      "A crafted pickle can define __reduce__ to execute arbitrary code (e.g. os.system) during deserialization.",
      "It only wastes memory with no security impact.",
      "It always crashes the interpreter safely.",
      "It converts the data to JSON, which is safe.",
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
    prompt: "How do Python sandbox escapes typically work?",
    options: [
      "Traversing object attributes (e.g. ().__class__.__bases__[0].__subclasses__()) to reach classes with os access.",
      "Guessing the interpreter's admin password.",
      "Overflowing the Python stack with recursion.",
      "Reading /etc/shadow directly with open().",
    ],
    correctIndex: 0,
    explanation:
      "Restricted environments are escaped by walking the object graph to a class that exposes os/subprocess. Jinja2 SSTI ({{ ...__globals__['os'].popen(...) }}) and JS prototype pollution exploit the same dynamic nature.",
  },
  {
    slug: "scripting-l5-perf",
    competencyId: "scripting",
    depthTier: 5,
    sectionHeading: "Performance engineering for large-scale tools",
    prompt: "Why use generators (yield) when processing a huge log file?",
    options: [
      "They stream one item at a time in near-constant memory, instead of loading the whole file with readlines().",
      "They run the loop on the GPU.",
      "They automatically parallelize across cores.",
      "They compress the file on disk.",
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
    prompt: "What does binary exploitation typically aim to achieve?",
    options: [
      "Arbitrary code execution by abusing how a program manages memory.",
      "Guessing the application's login password.",
      "Improving the program's performance.",
      "Translating the binary back to source code.",
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
    prompt: "Why is binary exploitation foundational knowledge in security?",
    options: [
      "Memory corruption is at the root of many CVEs across kernels, browsers, and firmware.",
      "It is the only way to write web applications.",
      "It replaces the need for cryptography.",
      "It is required to configure a firewall.",
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
    prompt: "What does a stack canary defend against?",
    options: [
      "Buffer overflows — a random value between the buffer and the return address is checked before returning.",
      "Predictable memory addresses.",
      "Executing code on the stack.",
      "Guessing the encryption key.",
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
    prompt: "In the System V AMD64 calling convention, which registers hold the first two integer arguments?",
    options: [
      "rdi (first) and rsi (second).",
      "rax (first) and rbx (second).",
      "rsp (first) and rbp (second).",
      "r8 (first) and r9 (second).",
    ],
    correctIndex: 0,
    explanation:
      "Arguments go in rdi, rsi, rdx, rcx, r8, r9 (then the stack); the return value is in rax. `call` pushes rip and jumps; `ret` pops rip.",
  },
  {
    slug: "binexp-l1-overflow",
    competencyId: "binexp",
    depthTier: 1,
    sectionHeading: "Stack buffer overflow",
    prompt: "In a classic 64-bit stack overflow with a 64-byte buffer, why is the offset to the return address often 72?",
    options: [
      "64 bytes of buffer plus 8 bytes of saved RBP before the saved return address.",
      "64 bytes buffer plus a 8-byte canary that is always present.",
      "The buffer is actually 72 bytes.",
      "72 is a random value with no structure.",
    ],
    correctIndex: 0,
    explanation:
      "Overflowing past the 64-byte buffer and the 8-byte saved RBP reaches the saved RIP at offset 72; overwriting it with win()'s address redirects execution. cyclic patterns find the exact offset.",
  },
  {
    slug: "binexp-l1-gdb",
    competencyId: "binexp",
    depthTier: 1,
    sectionHeading: "Using GDB for debugging",
    prompt: "What does pwndbg's `checksec` report about a binary?",
    options: [
      "Which mitigations are enabled: NX, stack canary, PIE, and RELRO.",
      "The binary's exact CPU instruction count.",
      "The remote server's IP address.",
      "The author of the program.",
    ],
    correctIndex: 0,
    explanation:
      "checksec shows the protections in play, shaping your exploit strategy. GDB (with pwndbg/GEF) sets breakpoints, examines memory (x/…), and finds offsets with cyclic patterns.",
  },
  // ══ binexp L2 ══
  {
    slug: "binexp-l2-rop",
    competencyId: "binexp",
    depthTier: 2,
    sectionHeading: "Bypassing NX with Return-Oriented Programming",
    prompt: "Why is ROP needed when NX (non-executable stack) is enabled?",
    options: [
      "You can't run injected shellcode, so you chain existing executable code snippets (“gadgets”) ending in ret.",
      "NX encrypts the stack, so you must decrypt it first.",
      "ROP disables NX at runtime.",
      "ROP is only for 32-bit binaries.",
    ],
    correctIndex: 0,
    explanation:
      "NX marks the stack non-executable, defeating shellcode injection; ROP reuses gadgets already in the binary/libc (e.g. pop rdi; ret) to call functions like system(\"/bin/sh\"). Stack alignment (an extra ret) is often required.",
  },
  {
    slug: "binexp-l2-fmtstr",
    competencyId: "binexp",
    depthTier: 2,
    sectionHeading: "Format string vulnerabilities",
    prompt: "Which format specifier gives a format-string bug an arbitrary write primitive?",
    options: [
      "%n — it writes the number of bytes printed so far to a pointed-to address.",
      "%s — it only reads a string.",
      "%d — it prints a decimal integer.",
      "%% — it prints a literal percent.",
    ],
    correctIndex: 0,
    explanation:
      "%x/%s leak the stack, but %n writes to memory (e.g. overwriting a GOT entry), turning a format-string bug into code execution. pwntools' fmtstr_payload automates it.",
  },
  {
    slug: "binexp-l2-re",
    competencyId: "binexp",
    depthTier: 2,
    sectionHeading: "Reverse engineering basics",
    prompt: "What does a decompiler like Ghidra produce from a binary?",
    options: [
      "Readable pseudo-C reconstructed from the disassembly, speeding up analysis.",
      "The original source code with comments intact.",
      "An encrypted copy of the binary.",
      "A network capture of the program.",
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
    prompt: "How is ASLR typically bypassed?",
    options: [
      "An information leak that discloses a real address, letting you compute the module base.",
      "It cannot be bypassed under any circumstances.",
      "By disabling NX first.",
      "By using a larger buffer.",
    ],
    correctIndex: 0,
    explanation:
      "ASLR randomizes base addresses, so exploits pair it with an info leak (e.g. leaking a libc pointer) to derive offsets. Full RELRO is bypassed by avoiding GOT overwrite (pure ROP); canaries by leaking the canary.",
  },
  // ══ binexp L3 ══
  {
    slug: "binexp-l3-heap",
    competencyId: "binexp",
    depthTier: 3,
    sectionHeading: "Heap exploitation",
    prompt: "How does tcache poisoning give an attacker an arbitrary allocation?",
    options: [
      "Corrupting a freed tcache chunk's fd pointer so the next malloc of that size returns an attacker-chosen address.",
      "Filling the heap until it overflows into the stack.",
      "Freeing the entire heap at once.",
      "Encrypting the heap metadata.",
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
    prompt: "In a ret2libc-with-leak exploit, why call puts(got['puts']) before spawning a shell?",
    options: [
      "To leak the runtime address of puts, compute the libc base, and then locate system and \"/bin/sh\".",
      "To crash the program cleanly.",
      "To disable ASLR for the whole system.",
      "To print the flag directly.",
    ],
    correctIndex: 0,
    explanation:
      "Leaking a known libc function's real address defeats ASLR by revealing the library base; from there you compute system/\"/bin/sh\" and build the second-stage ret2libc. Partial overwrites and (on 32-bit) brute force are alternatives.",
  },
  {
    slug: "binexp-l3-srop",
    competencyId: "binexp",
    depthTier: 3,
    sectionHeading: "Sigreturn-Oriented Programming (SROP)",
    prompt: "What does SROP abuse to set every register at once?",
    options: [
      "The sigreturn syscall, which restores all registers from an attacker-forged signal frame on the stack.",
      "A single pop rdi; ret gadget.",
      "The GOT table's first entry.",
      "The stack canary check.",
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
    prompt: "Why does glibc ≥ 2.32 safe-linking force an attacker to leak a heap address?",
    options: [
      "The fd pointer is mangled as (chunk_addr >> 12) XOR fd, so forging it requires knowing the chunk's address.",
      "It encrypts the entire heap with AES.",
      "It disables free() entirely.",
      "It moves the heap into the kernel.",
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
    prompt: "What is the classic goal after gaining a write primitive in a Linux kernel exploit?",
    options: [
      "Privilege escalation, e.g. commit_creds(prepare_kernel_cred(0)) to become root.",
      "Reformatting the disk.",
      "Turning off the screen.",
      "Sending an email to the admin.",
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
    prompt: "What does FSOP corrupt to gain control flow?",
    options: [
      "A glibc FILE structure's vtable pointer, so a file operation (fflush/fclose) calls attacker-controlled code.",
      "The stack canary of main().",
      "The ELF entry point in the header.",
      "The DNS resolver cache.",
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
    prompt: "Where does a freed chunk store its forward/backward pointers in glibc?",
    options: [
      "In the fd and bk fields, which occupy the space that was the user data while the chunk was allocated.",
      "In a separate encrypted table in the kernel.",
      "Immediately after the top chunk.",
      "In the ELF .bss section.",
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
    prompt: "How does lazy binding via the PLT/GOT work on first call?",
    options: [
      "The PLT stub jumps to a GOT entry that initially points back to the resolver, which resolves the symbol and patches the GOT with the real address.",
      "The linker resolves every symbol at compile time, so no runtime step exists.",
      "The GOT is read-only from the start, so it never changes.",
      "Each call re-downloads the library from disk.",
    ],
    correctIndex: 0,
    explanation:
      "First call: PLT → GOT → resolver → GOT patched with the real address; subsequent calls jump straight through. Partial RELRO leaves .got.plt writable (GOT-overwrite target); Full RELRO makes it read-only.",
  },
  {
    slug: "binexp-l5-cfi",
    competencyId: "binexp",
    depthTier: 5,
    sectionHeading: "Modern exploitation: CFI and shadow stacks",
    prompt: "How does Intel CET's shadow stack defeat ROP?",
    options: [
      "It keeps a hardware-protected second copy of return addresses; a mismatch at ret faults, so a corrupted stack return is caught.",
      "It encrypts every gadget in the binary.",
      "It removes all ret instructions.",
      "It randomizes the instruction set per boot.",
    ],
    correctIndex: 0,
    explanation:
      "The shadow stack stores return addresses separately; RET compares against it, so overwriting the normal stack return no longer works. Attackers turn to data-only / Data-Oriented Programming, which control flow integrity can't catch.",
  },
];
