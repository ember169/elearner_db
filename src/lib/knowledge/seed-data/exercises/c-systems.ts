import type { SeedExercise } from "./types";

/** c-systems L0–L5 — one comprehension MCQ per teaching section. */
export const C_SYSTEMS_EXERCISES: SeedExercise[] = [
  // ── L0 ──
  {
    slug: "c-systems-l0-meaning",
    competencyId: "c-systems",
    depthTier: 0,
    sectionHeading: "What Systems Programming Means",
    prompt: "How does systems programming interact with the operating system?",
    options: [
      "Through system calls — the interface between user-space programs and the kernel.",
      "Only through high-level libraries that never touch the kernel.",
      "Exclusively through inline assembly.",
      "Only over network sockets.",
    ],
    correctIndex: 0,
    explanation:
      "Opening a file, forking, or sending data ultimately invokes a syscall. libc wraps many (fopen→open, printf→write), but systems code often calls them directly. Privilege-escalation exploits, fd leaks, and signal races all live at this layer.",
  },
  {
    slug: "c-systems-l0-concepts",
    competencyId: "c-systems",
    depthTier: 0,
    sectionHeading: "Key Concepts",
    prompt: "Which file-descriptor numbers are stdin, stdout, and stderr?",
    options: [
      "0, 1, and 2 respectively.",
      "1, 2, and 3.",
      "-1, 0, and 1.",
      "They have no fixed numbers.",
    ],
    correctIndex: 0,
    explanation:
      "By convention stdin=0, stdout=1, stderr=2. A process is an address space plus fds and credentials; signals are async notifications; a pipe is a unidirectional byte stream created with pipe().",
  },
  {
    slug: "c-systems-l0-security",
    competencyId: "c-systems",
    depthTier: 0,
    sectionHeading: "Why It Matters for Security",
    prompt: "Why does systems programming matter for security?",
    options: [
      "Shellcode calls execve/dup2/socket directly, and sandboxing (seccomp, namespaces, capabilities) restricts which syscalls a process may make.",
      "It makes all code memory-safe automatically.",
      "It removes the need for a kernel.",
      "It only matters for GUI applications.",
    ],
    correctIndex: 0,
    explanation:
      "Understanding syscalls lets you audit setuid/daemon code, write payloads, build tools like strace, and reason about sandboxes — the core of both offense and defense at the OS boundary.",
  },
  // ── L1 ──
  {
    slug: "c-systems-l1-fd",
    competencyId: "c-systems",
    depthTier: 1,
    sectionHeading: "File Descriptors in Depth",
    prompt: "What is a file descriptor?",
    options: [
      "A small non-negative integer the kernel maps, via a per-process table, to an open file, socket, or pipe.",
      "The full pathname of an open file.",
      "A pointer to the file's bytes in RAM.",
      "A checksum of the file's contents.",
    ],
    correctIndex: 0,
    explanation:
      "An fd indexes a per-process table that points into the system-wide open-file table. fds are inherited across fork and exec unless marked O_CLOEXEC — a real information-disclosure class (CWE-403).",
  },
  {
    slug: "c-systems-l1-fork",
    competencyId: "c-systems",
    depthTier: 1,
    sectionHeading: "Creating Processes with fork",
    prompt: "After fork(), how do the parent and child tell themselves apart?",
    options: [
      "fork returns 0 in the child and the child's PID in the parent.",
      "Both receive 0.",
      "The child receives -1.",
      "They share one identical return value.",
    ],
    correctIndex: 0,
    explanation:
      "fork duplicates the process; the return value distinguishes them. Always waitpid (or wait) in the parent to reap the child, or it lingers as a zombie in the process table.",
  },
  {
    slug: "c-systems-l1-exec",
    competencyId: "c-systems",
    depthTier: 1,
    sectionHeading: "Replacing a Process with exec",
    prompt: "What does a successful execve() return?",
    options: [
      "Nothing — it replaces the current process image, so code after it runs only on failure.",
      "0 on success.",
      "The new process's PID.",
      "The exit status of the old program.",
    ],
    correctIndex: 0,
    explanation:
      "execve replaces the process image with a new program, so reaching the line after it means it failed. fork+exec is how shells launch commands, and execve is what shellcode ultimately invokes to spawn a shell.",
  },
  {
    slug: "c-systems-l1-pipes",
    competencyId: "c-systems",
    depthTier: 1,
    sectionHeading: "Pipes for Inter-Process Communication",
    prompt: "Why must you close a pipe's unused ends?",
    options: [
      "If the write end stays open in the reader, read() blocks forever instead of receiving EOF.",
      "Open ends leak memory that is never reclaimed.",
      "The kernel charges CPU time for each open end.",
      "A pipe can have only one fd open at a time.",
    ],
    correctIndex: 0,
    explanation:
      "A pipe is a pair of fds (read and write ends). EOF is delivered to the reader only when every write end is closed, so leaking one hangs the pipeline.",
  },
  // ── L2 ──
  {
    slug: "c-systems-l2-signals",
    competencyId: "c-systems",
    depthTier: 2,
    sectionHeading: "Signal Handling Fundamentals",
    prompt: "Why must a signal handler call only async-signal-safe functions?",
    options: [
      "It can interrupt the program mid-operation, so calling printf or malloc there risks deadlock or state corruption (UB).",
      "Handlers run in kernel mode where libc is unavailable.",
      "Signals disable all function calls.",
      "Only the main thread is allowed to call libc.",
    ],
    correctIndex: 0,
    explanation:
      "A handler may fire while malloc holds a lock; re-entering it deadlocks. Use only the POSIX async-signal-safe set (write, _exit, …). SIGKILL and SIGSTOP cannot be caught at all.",
  },
  {
    slug: "c-systems-l2-dup2",
    competencyId: "c-systems",
    depthTier: 2,
    sectionHeading: "File Descriptor Redirection with dup2",
    prompt: "What does `dup2(oldfd, newfd)` do?",
    options: [
      "Makes newfd refer to the same open file as oldfd, closing newfd first if open — the basis of shell redirection.",
      "Swaps the numeric values of the two descriptors.",
      "Copies the file's contents into a new file.",
      "Closes both descriptors.",
    ],
    correctIndex: 0,
    explanation:
      "dup2 points newfd at oldfd's open file description. A shell's child dup2's a file onto STDOUT_FILENO before execve. dup2 does not set O_CLOEXEC; use dup3 with O_CLOEXEC to avoid leaking the descriptor.",
  },
  {
    slug: "c-systems-l2-pipex",
    competencyId: "c-systems",
    depthTier: 2,
    sectionHeading: "Building pipex: Chaining Commands",
    prompt: "In pipex, why must the parent close both pipe ends?",
    options: [
      "If the parent keeps the write end open, the second child's read never sees EOF and the pipeline hangs.",
      "The parent's fds count against the child's descriptor limit.",
      "Otherwise the second fork fails.",
      "To free the pipe's internal buffer.",
    ],
    correctIndex: 0,
    explanation:
      "EOF requires every write end to be closed. After fork the parent holds copies of both ends, so it must close them or the downstream reader blocks forever.",
  },
  {
    slug: "c-systems-l2-multipipe",
    competencyId: "c-systems",
    depthTier: 2,
    sectionHeading: "Handling Multiple Pipes",
    prompt: "For an N-command pipeline, how many pipes are needed and what is the classic bug?",
    options: [
      "N-1 pipes; leaking a pipe fd (a child not closing every unused end) prevents EOF downstream.",
      "N pipes; the bug is forgetting to call fork.",
      "One shared pipe; the bug is a buffer overflow.",
      "2N pipes; the bug is a signal race.",
    ],
    correctIndex: 0,
    explanation:
      "N commands chain through N-1 pipes, and each child must close all pipe fds it does not use. A single leaked write end stops the next reader from ever seeing EOF.",
  },
  {
    slug: "c-systems-l2-path",
    competencyId: "c-systems",
    depthTier: 2,
    sectionHeading: "Resolving Command Paths",
    prompt: "Why must a setuid binary never resolve commands against a user-controlled PATH?",
    options: [
      "An attacker could prepend a malicious directory and hijack execution as the elevated user.",
      "PATH lookups are too slow for setuid code.",
      "setuid binaries are forbidden from calling execve.",
      "PATH is always empty in a setuid process.",
    ],
    correctIndex: 0,
    explanation:
      "Searching PATH runs whatever the user's PATH points to first — a classic setuid privilege-escalation vector. Use absolute paths or a sanitized environment.",
  },
  {
    slug: "c-systems-l2-errors",
    competencyId: "c-systems",
    depthTier: 2,
    sectionHeading: "Error Handling and Edge Cases",
    prompt: "By default (bash, no pipefail), what is a pipeline's exit status?",
    options: [
      "The exit status of the last command.",
      "The status of the first command.",
      "Always 0.",
      "The sum of every command's status.",
    ],
    correctIndex: 0,
    explanation:
      "`cmd1 | cmd2` reports cmd2's status; `set -o pipefail` changes it to the last non-zero. Robust systems code checks every syscall's errno (open, fork, pipe, execve all have documented failure modes).",
  },
  // ── L3 ──
  {
    slug: "c-systems-l3-ipc",
    competencyId: "c-systems",
    depthTier: 3,
    sectionHeading: "IPC Mechanisms Overview",
    prompt: "Which IPC mechanism carries no data payload beyond, at most, a single value?",
    options: [
      "Signals (real-time signals can carry one int/pointer via sigqueue).",
      "Shared memory.",
      "Unix domain sockets.",
      "Message queues.",
    ],
    correctIndex: 0,
    explanation:
      "Signals convey only a signal number (real-time signals add a single sigval). Pipes, sockets, shared memory, and message queues all move arbitrary data; each mechanism differs in scope and persistence.",
  },
  {
    slug: "c-systems-l3-fifo",
    competencyId: "c-systems",
    depthTier: 3,
    sectionHeading: "Named Pipes (FIFOs)",
    prompt: "How does a named pipe (FIFO) differ from an ordinary pipe?",
    options: [
      "It has a name in the filesystem, so unrelated processes can open it; an ordinary pipe is anonymous and shared only via fork.",
      "It is bidirectional.",
      "It stores its data permanently on disk.",
      "It requires root to create.",
    ],
    correctIndex: 0,
    explanation:
      "mkfifo creates a named pipe with a path, so any process with permission can open it. Its filesystem permissions control access — a world-writable FIFO in /tmp is a risk; consider Unix domain sockets with SO_PEERCRED for peer authentication.",
  },
  {
    slug: "c-systems-l3-mmap",
    competencyId: "c-systems",
    depthTier: 3,
    sectionHeading: "Shared Memory with mmap",
    prompt: "What does mmap with MAP_SHARED let two processes do?",
    options: [
      "Map the same object into both address spaces, so a write by one is visible to the other.",
      "Guarantee the data is encrypted in transit.",
      "Prevent either process from writing.",
      "Give each process a private copy of the file.",
    ],
    correctIndex: 0,
    explanation:
      "MAP_SHARED maps the same underlying pages into both processes; MAP_PRIVATE gives copy-on-write private mappings. Shared memory has no built-in synchronization, so concurrent access is a data race unless you add semaphores or process-shared mutexes.",
  },
  {
    slug: "c-systems-l3-semaphore",
    competencyId: "c-systems",
    depthTier: 3,
    sectionHeading: "POSIX Semaphores",
    prompt: "What does a POSIX semaphore provide for shared-memory IPC, and what housekeeping does it need?",
    options: [
      "Synchronization (sem_wait/sem_post) to prevent races; named semaphores must be sem_unlink'd or they leak in the kernel.",
      "Encryption of the shared region.",
      "Allocation of the shared memory itself.",
      "Automatic naming of the shared region.",
    ],
    correctIndex: 0,
    explanation:
      "sem_wait/sem_post coordinate access so processes don't race on shared memory. A named semaphore (sem_open) persists in the kernel until sem_unlink; leaked ones show up under /dev/shm/sem.*.",
  },
  {
    slug: "c-systems-l3-advsignals",
    competencyId: "c-systems",
    depthTier: 3,
    sectionHeading: "Advanced Signal Patterns",
    prompt: "What advantage do POSIX real-time signals (SIGRTMIN…) have over standard signals?",
    options: [
      "They queue (multiple pending instances are not merged) and can carry a value via sigqueue.",
      "They cannot be blocked.",
      "They run in kernel mode.",
      "They are delivered with zero latency.",
    ],
    correctIndex: 0,
    explanation:
      "Standard signals don't queue — several pending instances collapse into one, so they can be lost if sent faster than the handler runs. Real-time signals queue and carry a sigval (via sigqueue + SA_SIGINFO), making delivery reliable.",
  },
  {
    slug: "c-systems-l3-debug-ipc",
    competencyId: "c-systems",
    depthTier: 3,
    sectionHeading: "Debugging IPC Issues",
    prompt: "Which tool lists a system's shared-memory segments and semaphores?",
    options: [
      "ipcs (with ipcrm to remove stuck resources).",
      "readelf.",
      "ldd.",
      "nm.",
    ],
    correctIndex: 0,
    explanation:
      "`ipcs -m/-s/-q` lists shared memory, semaphores, and message queues; ipcrm removes leaked ones. For threaded data races, use Helgrind or ThreadSanitizer. Common IPC bugs are deadlock, races, resource leaks, and lost signals.",
  },
  {
    slug: "c-systems-l3-iomux",
    competencyId: "c-systems",
    depthTier: 3,
    sectionHeading: "I/O multiplexing: select, poll, and epoll",
    prompt: "Why does epoll scale better than select for a server with many connections?",
    options: [
      "You register fds once and epoll_wait returns only the ready ones, instead of re-scanning the whole fd set each call.",
      "epoll runs each connection on its own thread.",
      "epoll compresses the network data.",
      "epoll has no per-fd limit only because it uses UDP.",
    ],
    correctIndex: 0,
    explanation:
      "select/poll copy and scan the entire fd list every call (O(max_fd)); epoll registers fds once and returns just the ready set (O(ready_fds)), and isn't bounded by FD_SETSIZE. The BSD/macOS equivalent is kqueue.",
  },
  // ── L4 ──
  {
    slug: "c-systems-l4-pthreads",
    competencyId: "c-systems",
    depthTier: 4,
    sectionHeading: "POSIX Threads (pthreads)",
    prompt: "How does a thread differ from a process created by fork, and why does it matter for security?",
    options: [
      "Threads share the same address space (heap, globals, fds), so one thread's memory bug corrupts data visible to all — a larger attack surface.",
      "Threads have completely separate memory, so bugs are isolated.",
      "Threads cannot share file descriptors.",
      "Threads always run on separate machines.",
    ],
    correctIndex: 0,
    explanation:
      "pthreads share heap, globals, and fds within one process, which makes data sharing trivial but means a buffer overflow in one thread corrupts state for all. fork gives separate address spaces instead.",
  },
  {
    slug: "c-systems-l4-mutex",
    competencyId: "c-systems",
    depthTier: 4,
    sectionHeading: "Mutexes and Critical Sections",
    prompt: "Why can two threads incrementing a shared counter without a mutex end below the expected total?",
    options: [
      "Concurrent read-modify-write causes lost updates — a data race, which is undefined behaviour in C11.",
      "The compiler caps the counter at half the value.",
      "Increments are always atomic, so this cannot happen.",
      "The OS resets the counter periodically.",
    ],
    correctIndex: 0,
    explanation:
      "`counter++` is read-modify-write; interleaving loses updates. A mutex serializes the critical section. Best practice: lock briefly, unlock in the same function, and never re-lock a non-recursive mutex you already hold.",
  },
  {
    slug: "c-systems-l4-philosophers",
    competencyId: "c-systems",
    depthTier: 4,
    sectionHeading: "The Dining Philosophers Problem",
    prompt: "How does always locking the lower-numbered fork first prevent deadlock?",
    options: [
      "It removes the circular-wait condition (one of the four Coffman conditions), so no cycle of waiting can form.",
      "It makes each philosopher eat twice as fast.",
      "It gives every philosopher a third fork.",
      "It disables the monitor thread.",
    ],
    correctIndex: 0,
    explanation:
      "Deadlock needs a circular wait; imposing a global lock order on the forks breaks the cycle. This is resource ordering — the standard fix for the dining philosophers and many real lock hierarchies.",
  },
  {
    slug: "c-systems-l4-timing",
    competencyId: "c-systems",
    depthTier: 4,
    sectionHeading: "Precise Timing and Death Detection",
    prompt: "Why must a philosopher's last_meal_time be protected by a mutex (or made atomic)?",
    options: [
      "The eating thread writes it while the monitor thread reads it — an unsynchronized shared access is a data race.",
      "gettimeofday only works under a lock.",
      "usleep requires a mutex to run.",
      "The value is stored on disk and needs a file lock.",
    ],
    correctIndex: 0,
    explanation:
      "One thread updates last_meal_time on each meal while the death monitor reads it concurrently; without synchronization that's a race. A separate monitor thread compares now − last_meal_time against time_to_die.",
  },
  {
    slug: "c-systems-l4-condvar",
    competencyId: "c-systems",
    depthTier: 4,
    sectionHeading: "Condition Variables",
    prompt: "Why must pthread_cond_wait always be called inside a `while` loop, not an `if`?",
    options: [
      "cond_wait can return spuriously (without a signal), so the predicate must be rechecked after waking.",
      "The loop is only for readability; an if works identically.",
      "cond_wait needs to be called at least twice.",
      "Otherwise the mutex is never released.",
    ],
    correctIndex: 0,
    explanation:
      "POSIX permits spurious wakeups, so a woken thread must re-test the condition — hence `while (!ready) pthread_cond_wait(...)`. cond_wait atomically releases the mutex while waiting and re-acquires it on return. Use cond_broadcast to wake all waiters.",
  },
  {
    slug: "c-systems-l4-reentrancy",
    competencyId: "c-systems",
    depthTier: 4,
    sectionHeading: "Thread Safety and Reentrancy",
    prompt: "Why is strtok neither thread-safe nor reentrant, and what replaces it?",
    options: [
      "It keeps internal static state between calls; strtok_r takes an explicit saveptr instead.",
      "It allocates memory that is never freed; strtok_free fixes it.",
      "It uses recursion that overflows the stack; strtok_iter fixes it.",
      "It is fine as-is; the premise is false.",
    ],
    correctIndex: 0,
    explanation:
      "strtok stores parsing position in a hidden static, so concurrent or re-entrant calls clobber each other. strtok_r passes that state explicitly. Thread-safety strategies include immutable data, thread-local storage, and atomics.",
  },
  {
    slug: "c-systems-l4-race-tools",
    competencyId: "c-systems",
    depthTier: 4,
    sectionHeading: "Detecting Concurrency Bugs",
    prompt: "Which tool detects data races in a threaded program at runtime?",
    options: [
      "ThreadSanitizer (-fsanitize=thread), or Valgrind's Helgrind/DRD.",
      "AddressSanitizer, which only finds spatial memory errors.",
      "readelf, which reads ELF headers.",
      "strace, which traces system calls.",
    ],
    correctIndex: 0,
    explanation:
      "TSan flags data races (5–15× slowdown); Helgrind/DRD also catch lock-order violations (50–100×). Related bug classes include TOCTOU (CWE-367) and unsynchronized non-sig_atomic_t access from signal handlers.",
  },
  {
    slug: "c-systems-l4-daemon",
    competencyId: "c-systems",
    depthTier: 4,
    sectionHeading: "The double-fork daemon pattern",
    prompt: "Why does the daemon idiom fork a second time after setsid()?",
    options: [
      "After setsid the child is a session leader that could still acquire a controlling terminal; the second fork yields a non-leader that cannot.",
      "To create a backup process in case the first crashes.",
      "To double the daemon's CPU priority.",
      "Because fork must always be called in pairs.",
    ],
    correctIndex: 0,
    explanation:
      "setsid makes the child a new session leader with no tty, but a session leader can reacquire one by opening a tty device. The second fork produces a process that is not a session leader, so it can never get a controlling terminal.",
  },
  {
    slug: "c-systems-l4-toctou",
    competencyId: "c-systems",
    depthTier: 4,
    sectionHeading: "TOCTOU races and symlink attacks",
    prompt: "How do you safely create a file to avoid a /tmp symlink (TOCTOU) attack?",
    options: [
      "open() with O_CREAT | O_EXCL | O_NOFOLLOW — an atomic create that fails on an existing file or a symlink.",
      "Call access() first, then open() if it reports the file is missing.",
      "chmod the file to 0000 before writing.",
      "Write the file and delete it immediately afterward.",
    ],
    correctIndex: 0,
    explanation:
      "The vulnerable pattern checks with access() then opens — an attacker plants a symlink in the gap so root overwrites /etc/shadow (CWE-367). O_EXCL makes create-or-fail atomic and O_NOFOLLOW refuses symlinks; mkstemp and openat plus fs.protected_symlinks harden further.",
  },
  // ── L5 ──
  {
    slug: "c-systems-l5-syscall",
    competencyId: "c-systems",
    depthTier: 5,
    sectionHeading: "System Calls from the Kernel's Perspective",
    prompt: "On x86-64, how is a system call issued at the register level?",
    options: [
      "The syscall number goes in rax, arguments in rdi/rsi/rdx…, then the `syscall` instruction switches to ring 0.",
      "The number goes in rip and arguments on the stack only.",
      "A software interrupt 0x80 is required on all 64-bit systems.",
      "The kernel polls a shared memory mailbox.",
    ],
    correctIndex: 0,
    explanation:
      "libc's wrapper loads rax with the syscall number and rdi/rsi/rdx/r10/r8/r9 with arguments, then executes `syscall`, trapping into the kernel's syscall table. You can bypass libc entirely with the syscall() function.",
  },
  {
    slug: "c-systems-l5-seccomp",
    competencyId: "c-systems",
    depthTier: 5,
    sectionHeading: "seccomp-BPF: System Call Filtering",
    prompt: "What does a seccomp-BPF filter do?",
    options: [
      "Restricts which syscalls a process may make, killing it (SIGSYS) or erroring on disallowed ones.",
      "Encrypts every syscall's arguments.",
      "Speeds up syscalls by caching results.",
      "Grants the process extra capabilities.",
    ],
    correctIndex: 0,
    explanation:
      "seccomp-BPF inspects the syscall number (and args) against a filter; anything outside the allowlist is denied. Chrome, Firefox, and container runtimes use it to sandbox untrusted code — and CTF challenges use it to block execve, forcing open-read-write shellcode.",
  },
  {
    slug: "c-systems-l5-namespaces",
    competencyId: "c-systems",
    depthTier: 5,
    sectionHeading: "Linux Namespaces and Containers",
    prompt: "What role do Linux namespaces play in containers?",
    options: [
      "They isolate resources (PID, NET, MNT, UTS, IPC, USER) between process groups — the kernel primitive behind Docker.",
      "They encrypt the container's filesystem.",
      "They schedule the container on a dedicated CPU core.",
      "They are a userspace library with no kernel involvement.",
    ],
    correctIndex: 0,
    explanation:
      "Each namespace virtualizes one resource (e.g. CLONE_NEWPID gives the container its own PID 1). Container escapes exploit incomplete isolation — misconfigured bind mounts, CAP_SYS_ADMIN, kernel bugs, or a user-namespace UID-0 mapping to host root.",
  },
  {
    slug: "c-systems-l5-capabilities",
    competencyId: "c-systems",
    depthTier: 5,
    sectionHeading: "Linux Capabilities",
    prompt: "What are Linux capabilities?",
    options: [
      "A split of root's all-or-nothing power into ~40 distinct privileges (e.g. CAP_NET_RAW, CAP_SYS_PTRACE) that can be granted individually.",
      "A list of files a process is allowed to open.",
      "The set of CPU cores a process may run on.",
      "A per-process memory quota.",
    ],
    correctIndex: 0,
    explanation:
      "Capabilities let a binary hold just the privilege it needs (setcap cap_net_raw+ep) instead of full root. In pentests, hunt for surprising ones: CAP_SYS_PTRACE can inject into any process; CAP_DAC_OVERRIDE reads any file.",
  },
  {
    slug: "c-systems-l5-ptrace",
    competencyId: "c-systems",
    depthTier: 5,
    sectionHeading: "ptrace: Process Tracing and Debugging",
    prompt: "What can a process do with ptrace, and how is abuse limited?",
    options: [
      "Read/write another process's memory and registers and intercept its syscalls; the yama ptrace_scope sysctl restricts who may trace whom.",
      "Only read the target's exit code.",
      "Nothing without root, in every configuration.",
      "Encrypt the target's memory to protect it.",
    ],
    correctIndex: 0,
    explanation:
      "ptrace powers gdb/strace and enables code injection and credential theft from processes like sshd or sudo. Malware also uses PTRACE_TRACEME as an anti-debug check. ptrace_scope level 1 (Ubuntu default) allows only parent→child tracing.",
  },
  {
    slug: "c-systems-l5-container-runtime",
    competencyId: "c-systems",
    depthTier: 5,
    sectionHeading: "Building a Minimal Container Runtime",
    prompt: "Which combination of primitives does a minimal container runtime layer together?",
    options: [
      "Namespaces + pivot_root (new root fs) + cgroups + dropped capabilities + a seccomp filter, then execve.",
      "A single chroot call and nothing else.",
      "Only a virtual machine hypervisor.",
      "TLS encryption of the process's stack.",
    ],
    correctIndex: 0,
    explanation:
      "clone() with CLONE_NEW* isolates resources, pivot_root swaps the root filesystem, /proc is remounted, capabilities are dropped, and seccomp restricts syscalls before execve. This is conceptually what runc does — with far more safety checks.",
  },
  {
    slug: "c-systems-l5-exploit-primitives",
    competencyId: "c-systems",
    depthTier: 5,
    sectionHeading: "Exploit Primitives in Systems Programming",
    prompt: "Why is userfaultfd useful in kernel race-condition exploitation?",
    options: [
      "It lets attacker code handle page faults, pausing a kernel thread mid-syscall to widen a race window.",
      "It disables ASLR system-wide.",
      "It grants CAP_SYS_ADMIN automatically.",
      "It encrypts kernel memory.",
    ],
    correctIndex: 0,
    explanation:
      "Registering userfaultfd on a page means a kernel access to it blocks until userspace responds, giving precise control to hit a narrow TOCTOU window. mprotect, mmap, CLONE_FILES, and io_uring are other syscalls frequently leveraged in exploits.",
  },
];
