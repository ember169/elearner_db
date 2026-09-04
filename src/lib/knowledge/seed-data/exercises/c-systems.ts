import type { SeedExercise } from "./types";

/** c-systems L0–L5 — one comprehension MCQ per teaching section. */
export const C_SYSTEMS_EXERCISES: SeedExercise[] = [
  // ── L0 ──
  {
    slug: "c-systems-l0-meaning",
    competencyId: "c-systems",
    depthTier: 0,
    sectionHeading: "What Systems Programming Means",
    prompt:
      "You run strace on a C program and see calls like open(), read(), and write() being logged. What layer of the system is strace intercepting?",
    options: [
      "System calls — the interface between user-space and the kernel. libc functions like fopen and printf are wrappers that ultimately invoke these kernel entry points, which strace intercepts via ptrace.",
      "Standard library calls — strace hooks into glibc's internal dispatch table and logs each function before it executes, recording the arguments and return values at the library level rather than tracing into the kernel.",
      "Compiler-generated assembly instructions — strace reads the ELF binary's .text section at load time and instruments every instruction that resembles a privileged operation, intercepting them before the CPU executes them in ring 0.",
      "Network socket messages between the program and a local system daemon — strace monitors the loopback interface for this IPC traffic, since all file and process operations are requests sent to a daemon that performs them on the program's behalf.",
    ],
    correctIndex: 0,
    explanation:
      "Opening a file, forking, or sending data ultimately invokes a syscall. libc wraps many (fopen->open, printf->write), but systems code often calls them directly. Privilege-escalation exploits, fd leaks, and signal races all live at this layer.",
  },
  {
    slug: "c-systems-l0-concepts",
    competencyId: "c-systems",
    depthTier: 0,
    sectionHeading: "Key Concepts",
    prompt:
      "Your program opens a file immediately at startup, and open() returns file descriptor 3. You haven't opened or closed anything else. What are file descriptors 0, 1, and 2?",
    options: [
      "stdin, stdout, and stderr respectively — every process inherits these three open descriptors by convention, so the first file you open yourself gets the next available number, which is 3.",
      "They are unallocated slots reserved by the kernel for future use — the first three descriptors are never assigned automatically, and open() skips them as an optimization to avoid fragmentation in the descriptor table.",
      "The program's executable, its shared libraries, and the dynamic linker — the loader opens these before main() runs, filling descriptors 0 through 2, and your subsequent open() call receives the next free slot.",
      "Three duplicate references to /dev/null created during process startup — the kernel initializes all new processes with these placeholder descriptors, and the shell replaces them with terminal connections only if needed.",
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
    prompt:
      "An attacker's shellcode calls execve to spawn a shell, while the target application's seccomp sandbox blocks execve. Both offense and defense operate at the same layer. What is that shared layer?",
    options: [
      "System calls — shellcode invokes them directly (execve, dup2, socket) to control the OS, and sandboxes like seccomp-BPF filter them to restrict what a process can do. Both offense and defense operate at the syscall boundary.",
      "The C standard library — shellcode uses libc functions like system() and popen() to interact with the OS, and sandboxes intercept those function calls using LD_PRELOAD to deny disallowed operations at the library level.",
      "The ELF binary format — shellcode must conform to valid ELF structure to execute, and sandboxes parse ELF headers at load time to decide which functions the binary is allowed to call based on section permissions.",
      "The TCP/IP network stack — shellcode transmits commands to the kernel over a local socket, and sandboxes monitor that loopback traffic for disallowed operations, enforcing policy at the transport protocol layer.",
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
    prompt:
      "After calling fork(), the child process can read from a file descriptor the parent opened before forking, without reopening the file. What makes this possible?",
    options: [
      "fork() duplicates the parent's per-process file descriptor table, so the child inherits copies of all open fds pointing to the same kernel file descriptions — including the shared file offset and status flags.",
      "The kernel maintains a single global file descriptor table shared by all processes, so any fd opened by one process is automatically accessible by every other process using the same integer value.",
      "fork() serializes the parent's open file contents into a shared memory segment that the child maps at startup, giving both processes access to a cached snapshot of the data without needing the original fd.",
      "The child receives a list of the parent's open file paths through an environment variable, and the C runtime's startup code automatically reopens each one before main() is called in the child process.",
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
    prompt:
      "You add a printf after fork() that prints the return value. The program outputs '4827' and then '0' on separate lines. What do these two values tell you?",
    options: [
      "The parent received 4827, the child's PID, so it can track and waitpid on it. The child received 0, telling it that it is the new process. This return-value split is how each side identifies its role after fork().",
      "Both values are status codes — 4827 indicates the parent's process table is nearly full, while 0 means the child started successfully. fork() returns diagnostic codes rather than PIDs to both processes.",
      "The parent received its own PID (4827) as confirmation it is still running, while the child received 0 because new processes always start with a temporary PID of zero until the scheduler assigns a real one.",
      "4827 is the file descriptor assigned to the IPC pipe automatically created between parent and child, and 0 indicates the child's end of that pipe, establishing their built-in communication channel.",
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
    prompt:
      "Your program calls execve(\"/bin/ls\", argv, envp) and immediately after has a perror call. During normal operation the perror line never executes. Why?",
    options: [
      "A successful execve replaces the entire process image — code, data, and stack — with the new program. The instruction pointer jumps to /bin/ls's entry point, so no code from the original program can run afterward.",
      "execve forks a new child process to run /bin/ls, and the parent blocks in a waitpid-like state until the child finishes — perror is skipped because execution resumes only after the child exits successfully.",
      "execve sends SIGSTOP to the calling process and transfers control to /bin/ls running in a separate address space — the original process remains stopped until the new program sends it SIGCONT upon completion.",
      "execve marks the calling process's memory pages as read-only and maps /bin/ls into unused virtual pages above the stack — perror is unreachable because the kernel redirects the instruction pointer past it.",
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
    prompt:
      "Your program creates a pipe with pipe(fds), forks, and the child writes data then exits. But the parent's read() blocks forever instead of returning 0 for EOF. What went wrong?",
    options: [
      "The parent never closed fds[1], the write end of the pipe. EOF is only delivered to readers when every write-end file descriptor is closed — the parent's own copy keeps the write end alive, so read() never sees EOF.",
      "The child called _exit() instead of exit(), which skips flushing the pipe's internal kernel buffer — the data remains staged in kernel space and the parent blocks because the unflushed bytes prevent an EOF from being generated.",
      "The parent is reading from fds[1] instead of fds[0], accidentally reading from the write end — this doesn't return an error but blocks indefinitely since the kernel treats a read on a write-end fd as a deferred request.",
      "The pipe's internal buffer filled up before the child finished writing, causing a partial write — the kernel holds the remaining bytes in a staging area that read() cannot access until the pipe buffer is explicitly flushed.",
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
    prompt:
      "Your SIGINT handler calls fprintf to log a message. The program occasionally deadlocks when you press Ctrl-C during heavy output. What is the most likely cause?",
    options: [
      "fprintf is not async-signal-safe — if the signal arrives while the main code is inside printf or malloc (which hold internal locks), the handler's fprintf re-enters the same lock, causing a deadlock on the non-recursive mutex.",
      "SIGINT is delivered to a random thread, and fprintf requires thread-local storage that hasn't been initialized for the signal handler's execution context — this uninitialized TLS region causes the handler to spin on a futex indefinitely.",
      "The kernel queues SIGINT behind pending I/O completions, and the handler's fprintf writes to stderr which is line-buffered — the buffer flush blocks waiting for the terminal driver to acknowledge the previous write's completion.",
      "fprintf allocates a temporary buffer on the signal handler's alternate stack, but sigaltstack was not configured — the allocation hits the main stack's red zone guard page, triggering a recursive SIGSEGV that the kernel converts to a hang.",
    ],
    correctIndex: 0,
    explanation:
      "A handler may fire while malloc holds a lock; re-entering it deadlocks. Use only the POSIX async-signal-safe set (write, _exit, ...). SIGKILL and SIGSTOP cannot be caught at all.",
  },
  {
    slug: "c-systems-l2-dup2",
    competencyId: "c-systems",
    depthTier: 2,
    sectionHeading: "File Descriptor Redirection with dup2",
    prompt:
      "In your shell, a child process calls dup2(fd, 1) before execve, where fd is a file opened for writing. The exec'd program's printf output goes to that file instead of the terminal. What did dup2 do to make this happen?",
    options: [
      "dup2 closed fd 1 (stdout) and made it refer to the same kernel file description as fd — so when the new program writes to fd 1 through printf, the kernel routes the output to the open file rather than the terminal.",
      "dup2 modified the exec'd program's dynamic linker table so that all calls to write() targeting fd 1 are intercepted and rewritten to use fd instead — this binary patching persists across the execve boundary.",
      "dup2 created a kernel-level pipe between fd 1 and fd, then spawned a background kernel thread that copies bytes from stdout to the file — the new program writes to the pipe's input end, which forwards to the file.",
      "dup2 updated the process's environment to set STDOUT_PATH to the file path associated with fd, and the C runtime's startup code after execve reads this variable to reopen stdout pointing at that destination.",
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
    prompt:
      "In your pipex implementation, the parent creates a pipe, forks two children (one writes to pipefd[1], the other reads from pipefd[0]), then calls waitpid on both. The second child hangs indefinitely. What did the parent likely forget?",
    options: [
      "The parent forgot to close both pipefd[0] and pipefd[1] after forking. Its lingering write end means the second child's read() never gets EOF — the kernel sees an open writer and keeps the reader blocked forever.",
      "The parent called waitpid on the first child before the second, creating a scheduling dependency — the kernel suspends pipe I/O while any process in the same process group is being reaped by waitpid.",
      "The parent forgot to set the pipe to non-blocking mode with fcntl — by default pipes block reads indefinitely, and an explicit O_NONBLOCK flag must be set on each end after forking both children.",
      "The parent needs to call pipe() a second time after forking to refresh the file descriptors — the original pipe becomes stale once fork() duplicates the descriptor table, leaving the second child reading from an invalid pipe.",
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
    prompt:
      "You're implementing a 4-command pipeline (cmd1 | cmd2 | cmd3 | cmd4). How many pipe() calls do you need, and what is the most common bug in this pattern?",
    options: [
      "Three pipes for four commands (N-1 for N commands). The classic bug is a child failing to close pipe fds it doesn't use — even one leaked write end prevents the downstream reader from ever receiving EOF.",
      "Four pipes — one per command, each connecting to a shared multiplexer fd. The common bug is forgetting to set O_CLOEXEC on the multiplexer's master fd, causing all children to inherit a reference that blocks cleanup.",
      "Two pipes reused alternately for odd and even stages of the pipeline. The classic bug is calling pipe() inside the fork loop, which overwrites the previous pipe's fds before the earlier child can use them.",
      "Three pipes plus one additional signal pipe for coordinating startup order. The common bug is calling execve before sending a SIGUSR1 readiness notification, causing the next command to read before the previous writer is ready.",
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
    prompt:
      "A setuid-root program resolves commands by searching directories in the PATH environment variable. An unprivileged user sets PATH=/tmp:$PATH and places a malicious binary in /tmp with the target command's name. What happens?",
    options: [
      "The setuid program finds /tmp's malicious binary first (since /tmp is prepended) and executes it with root privileges — a classic privilege escalation via PATH injection, exploiting the program's trust in a user-controlled environment variable.",
      "The kernel ignores PATH for setuid binaries and always resolves commands from /usr/bin — the user's /tmp binary is never found because the SUID bit triggers automatic path sanitization in the dynamic linker at execve time.",
      "The setuid program detects the modified PATH through a hash comparison with /etc/environment and falls back to a hardcoded search path, bypassing user-writable directories like /tmp as a standard security measure.",
      "The malicious binary runs but without elevated privileges — when a setuid program calls execve on a PATH-resolved binary, the kernel clears the effective UID and runs the child under the calling user's real identity.",
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
    prompt:
      "You run `grep invalid /dev/null | cat` in bash. grep exits with status 1 (no match found), but `echo $?` shows 0. Why does the shell report success?",
    options: [
      "By default a pipeline's exit status is the exit code of the last command — cat succeeded with status 0, masking grep's failure. Enabling `set -o pipefail` would report the rightmost non-zero status instead.",
      "Bash retries failed pipeline components by restarting them with /dev/null as input — grep's second invocation matches nothing again but returns 0 on retry, overwriting the original failure status in the pipeline.",
      "The pipe buffer absorbs grep's error status along with its output stream — cat reads and discards the embedded status byte, then reports its own success because it processed all received bytes without I/O errors.",
      "grep's exit code 1 is treated as a signal number (SIGHUP) by the pipeline manager, and bash suppresses signal-based exits for pipeline components — the shell replaces any signal exit with 0 to prevent cascade termination.",
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
    prompt:
      "You need to notify a process that an event occurred, but you only need to convey the event type — no payload data. Which IPC mechanism is designed for exactly this kind of minimal notification?",
    options: [
      "Signals — they carry only a signal number as notification (and real-time signals can add a single int or pointer via sigqueue/SA_SIGINFO). They are asynchronous with essentially no data payload, fitting this use case precisely.",
      "A Unix domain socket in SOCK_DGRAM mode — datagrams can be zero-length, making them ideal for payloadless notifications. The kernel optimizes empty datagrams by skipping buffer allocation entirely, reducing delivery latency.",
      "A POSIX message queue with mq_maxmsg set to 1 — the message body can be left empty, and the kernel's priority field alone encodes the event type with no data-copying overhead, acting as a lightweight notification channel.",
      "A pipe with zero-byte writes — calling write(pipefd, \"\", 0) generates an EOF-like event on the read end that returns 0 bytes, letting the reader detect each notification without any payload being transferred through the pipe.",
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
    prompt:
      "Two unrelated programs (different parent processes, no shared ancestry) need a pipe-like byte stream between them. An anonymous pipe created with pipe() won't work. What mechanism allows this, and why?",
    options: [
      "A named pipe (FIFO) created with mkfifo — it has a filesystem path, so any process with appropriate permissions can open it by name. Unlike anonymous pipes, it doesn't require a fork relationship to pass the file descriptors.",
      "A shared memory segment created with shmget — both processes map it with shmat and use it as a byte stream buffer, with the kernel automatically managing read/write cursors to provide FIFO ordering without explicit synchronization.",
      "A socketpair created with socketpair(AF_UNIX, SOCK_STREAM, 0) — each process inherits one end through serialized descriptor numbers in environment variables that the C runtime parses and reopens at startup.",
      "A loopback TCP connection on 127.0.0.1 — both processes connect to a prearranged port. The kernel bypasses the full network stack for localhost connections, making them equivalent to anonymous pipes in throughput and semantics.",
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
    prompt:
      "Process A calls mmap with MAP_SHARED on a file, writes data to the mapped region, and Process B maps the same file with MAP_SHARED. Process B sees A's modifications without either calling read() or write(). Why?",
    options: [
      "MAP_SHARED maps the file's kernel page cache into both processes' virtual address spaces — they share the same physical pages, so A's stores are immediately visible to B through the hardware memory mapping without any explicit I/O syscalls.",
      "MAP_SHARED installs a kernel file-change notification that triggers a memcpy from A's mapping into B's whenever a dirty page is detected — this runs asynchronously via a kernel worker thread, appearing instantaneous to both processes.",
      "MAP_SHARED enables a write-ahead log in the filesystem layer — A's modifications are journaled to disk first, and B's mapping reads from the journal rather than the original file, providing eventual consistency between the two views.",
      "MAP_SHARED creates an IPC channel between the two processes via the filesystem's inotify subsystem — when A dirties pages, an IN_MODIFY event triggers B's mapping to refault and reload the changed pages from the on-disk copy.",
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
    prompt:
      "Two processes share an mmap'd region and use a named POSIX semaphore for synchronization. After the program crashes repeatedly during testing, you find stale entries under /dev/shm/sem.* that persist across reboots. What happened?",
    options: [
      "Named semaphores created with sem_open persist in the kernel until explicitly removed with sem_unlink — the crashes prevented cleanup code from running, leaving orphaned semaphore objects that must be manually unlinked or deleted from /dev/shm.",
      "The semaphore was created with the SEM_PERSIST option, which tells the kernel to retain it across process lifetimes for automatic reuse — removing this flag and recreating the semaphore would enable cleanup on process termination.",
      "The crashes corrupted the semaphore's reference count in the kernel, preventing automatic garbage collection — the /dev/shm entries are recovery journals created by the kernel's IPC repair subsystem to reconstruct corrupted semaphore state.",
      "sem_open memory-maps a backing file into /dev/shm as a side effect of internal initialization, but the actual semaphore state lives only in kernel memory — the files are debug artifacts from glibc's tracing mode with no functional effect.",
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
    prompt:
      "Your program sends SIGUSR1 five times rapidly to a process using kill(). The target's signal handler runs only once. What class of signals would ensure all five deliveries, and how?",
    options: [
      "POSIX real-time signals (SIGRTMIN to SIGRTMAX) queue — multiple pending instances of the same signal are each delivered individually. Standard signals like SIGUSR1 don't queue, so concurrent pending instances are merged into a single delivery.",
      "Standard signals have a per-process rate limit enforced by the kernel's scheduling quantum — only one delivery per time-slice is permitted. Real-time signals bypass this rate limit by using a dedicated high-priority delivery path.",
      "The handler takes too long relative to the signal arrival rate, and the kernel drops signals arriving during execution to prevent stack overflow. Real-time signals fix this by allocating a larger alternate stack via sigaltstack automatically.",
      "kill() batches consecutive identical signals into one delivery as a kernel-level optimization. Using sigqueue() for any signal type (including SIGUSR1) disables this batching and delivers each signal instance separately.",
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
    prompt:
      "After a buggy server crashes repeatedly, you suspect it leaked System V shared memory segments and semaphore sets that are persisting in the kernel. Which tool shows these resources, and how do you clean them up?",
    options: [
      "ipcs lists shared memory segments (-m), semaphore sets (-s), and message queues (-q) with their keys and IDs. ipcrm removes specific resources by ID or key — essential for cleaning up after crashes that skip proper IPC teardown code.",
      "lsof with the +D /dev/shm flag lists all System V IPC resources by scanning the shared memory filesystem, and fuser -k on each entry terminates any holding process, causing the kernel to reclaim the resources automatically.",
      "strace -e ipc replays the crashed process's IPC calls from the kernel's audit log, revealing which resources were allocated. sysctl -w kernel.ipc.cleanup=1 then triggers automatic garbage collection of all orphaned IPC objects.",
      "/proc/sysvipc/shm and /proc/sysvipc/sem expose the resources as virtual files that can be removed by unlinking them — running rm on the specific entry (e.g., rm /proc/sysvipc/shm/12345) deletes the resource from the kernel.",
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
    prompt:
      "Your server uses select() to handle 10,000 concurrent connections, but profiling shows most CPU time is spent scanning file descriptors. Switching to epoll drops CPU usage dramatically. What architectural difference explains this?",
    options: [
      "select copies and linearly scans the entire fd_set on every call — O(max_fd). epoll registers interest once with epoll_ctl, and epoll_wait returns only ready fds — O(ready_fds), avoiding the per-call re-scan of thousands of idle connections.",
      "select uses polling (busy-waiting) to check each fd's readiness, consuming CPU cycles per descriptor per call. epoll uses hardware interrupt coalescing from the NIC driver, batching readiness notifications so the CPU wakes only on actual I/O events.",
      "select is implemented entirely in userspace by glibc, issuing a separate syscall per fd to check readiness. epoll moves the loop into kernel space as a single syscall, but uses the same O(n) algorithm — it's simply faster per-fd due to less overhead.",
      "select allocates a temporary kernel buffer proportional to FD_SETSIZE on every call, and this allocation cost dominates at scale. epoll pre-allocates a fixed-size buffer at epoll_create time, so no per-call memory allocation is needed.",
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
    prompt:
      "A buffer overflow in one thread of a multi-threaded server corrupts a global data structure, crashing all threads. The same bug in a forked multi-process server would only crash one child. What architectural difference explains this?",
    options: [
      "Threads share the same address space — heap, globals, and file descriptors — so one thread's memory corruption is visible to all others immediately. Forked processes get separate address spaces via copy-on-write, isolating each child's corruption.",
      "The kernel maps all threads onto adjacent physical memory pages for cache locality, while forked processes land on distant pages — corruption in one thread's page bleeds into neighboring thread data through hardware page-level side effects.",
      "Threads share a single set of hardware segment registers (one memory protection domain), so the CPU cannot enforce per-thread boundaries. Forked processes each get dedicated segment descriptors, and hardware traps prevent cross-process access.",
      "The thread scheduler runs all threads in rapid round-robin on one core, so a corrupted instruction cache line from one thread poisons the next. Forked processes are distributed across cores, isolating their instruction cache state from each other.",
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
    prompt:
      "Two threads each increment a shared counter 1,000,000 times without any synchronization. The final value is 1,437,622 instead of 2,000,000. What specific mechanism causes this shortfall?",
    options: [
      "counter++ is a non-atomic read-modify-write: a thread reads the current value, increments locally, then writes back. When both threads read the same value before either writes, one increment is silently lost — a data race that is undefined behavior in C11.",
      "The CPU's store buffer coalesces consecutive writes to the same cache line, batching multiple increments into a single store instruction — this hardware optimization reduces the total number of committed increments that reach main memory.",
      "The compiler's optimizer detects that both threads write to the same address and applies dead-store elimination, removing increments it can prove are immediately overwritten by the other thread's subsequent store to the same location.",
      "The OS scheduler preempts threads mid-increment and checkpoints their register state — but the checkpoint granularity is per-quantum rather than per-instruction, so register-cached intermediate values are lost during context switches between threads.",
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
    prompt:
      "Five dining philosophers deadlock when each picks up their left fork and waits for the right one. You fix it by requiring each philosopher to always lock the lower-numbered fork first. Why does this specific ordering prevent deadlock?",
    options: [
      "It breaks the circular-wait condition (one of the four Coffman conditions). A total ordering on fork acquisition means at least one philosopher must request a fork held by someone who won't block on them, so no cycle of waiting can form.",
      "It forces philosophers to attempt both forks simultaneously using a kernel-level compare-and-swap, which either acquires both or neither — this all-or-nothing atomic approach eliminates the partial-acquisition state that creates circular dependencies.",
      "The lower-numbered fork is always physically closer to the philosopher, reducing acquisition latency — this timing difference makes the window for concurrent acquisition too small for another philosopher to grab their fork in the gap.",
      "It ensures philosophers with lower-numbered seats eat first via mutex priority inheritance, and a philosopher holding a high-priority fork cannot be preempted — this scheduler-enforced priority ordering prevents the circular wait from forming.",
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
    prompt:
      "In your dining philosophers simulation, a monitor thread checks each philosopher's last_meal_time to detect starvation. Occasionally the monitor declares a philosopher dead immediately after they eat. What concurrency bug causes this false detection?",
    options: [
      "last_meal_time is read by the monitor while the philosopher's thread is writing it — without a mutex or atomic, this unsynchronized access is a data race that can yield a stale or torn value, making elapsed time appear much larger than reality.",
      "gettimeofday returns wall-clock time that can jump backward during NTP adjustments — the monitor calculates a negative interval that wraps to a large unsigned value, exceeding the time_to_die threshold and triggering a false death detection.",
      "The philosopher thread updates last_meal_time before actually acquiring both forks, so if the scheduler preempts it between the timestamp and fork acquisition, the monitor sees a recent timestamp while the philosopher has not truly eaten.",
      "The monitor thread runs at higher scheduler priority and starves philosopher threads — they genuinely miss their timing deadlines because the monitor consumes the CPU cycles they need to complete their eat-and-update sequence.",
    ],
    correctIndex: 0,
    explanation:
      "One thread updates last_meal_time on each meal while the death monitor reads it concurrently; without synchronization that's a race. A separate monitor thread compares now - last_meal_time against time_to_die.",
  },
  {
    slug: "c-systems-l4-condvar",
    competencyId: "c-systems",
    depthTier: 4,
    sectionHeading: "Condition Variables",
    prompt:
      "You replace `while(!ready) pthread_cond_wait(&cv, &mtx)` with `if(!ready) pthread_cond_wait(&cv, &mtx)`, and the program occasionally processes data before it is actually ready. What causes this?",
    options: [
      "pthread_cond_wait can return spuriously — POSIX permits wakeups without a corresponding pthread_cond_signal or broadcast. With `if`, the thread skips re-checking the predicate and proceeds even though `ready` is still false after a spurious wakeup.",
      "pthread_cond_wait releases the mutex then reacquires it on return, but with `if` the reacquisition races with another thread setting ready — the single-branch path doesn't retry the lock and may proceed with a stale cached copy of the variable.",
      "The compiler reorders the condition check before the cond_wait return when using `if`, because the single-branch structure lets the optimizer assume the variable is unchanged — the `while` loop's back-edge forces an explicit memory barrier and re-read.",
      "pthread_cond_signal wakes all threads on the condvar despite its name suggesting only one, and with `if` every woken thread proceeds simultaneously — `while` acts as a thundering-herd throttle, re-sleeping threads that lose the post-wakeup race.",
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
    prompt:
      "Two threads call strtok() concurrently on different input strings, but the tokens they receive are scrambled — fragments of one thread's string appear in the other's results. What causes this cross-contamination?",
    options: [
      "strtok uses a hidden internal static pointer to track its parsing position across calls. Both threads share this single pointer, so each call overwrites the other thread's state — strtok_r takes an explicit saveptr argument to eliminate the shared state.",
      "strtok writes NUL bytes into the input string to delimit tokens, and the two threads' heap-allocated strings are in adjacent memory — the NUL terminators from one string corrupt characters in the neighboring string through buffer overflow.",
      "The C runtime uses a per-process string buffer pool for tokenization performance, and strtok checkpoints intermediate token positions in this shared pool — concurrent checkpoints interleave, producing scrambled references across both parsing sessions.",
      "strtok registers an internal SIGSEGV handler to recover from out-of-bounds parsing, and this global handler is shared across threads — when both threads install their handlers simultaneously, they redirect each other's fault recovery to the wrong input.",
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
    prompt:
      "You compile a multi-threaded program with -fsanitize=thread and run it. The tool reports two threads accessing the same variable — at least one writing — with no synchronization in between. What category of bug has it detected?",
    options: [
      "A data race — ThreadSanitizer instruments memory accesses at compile time to detect concurrent unsynchronized reads and writes to shared data, which is undefined behavior in C11. It reports both conflicting accesses with full stack traces.",
      "A priority inversion — the tool tracks mutex acquisition times and detects when a low-priority thread holds a lock needed by a high-priority thread, reporting the unsynchronized variable access as the symptom of the scheduling anomaly.",
      "A deadlock prediction — the tool constructs a lock-order graph at runtime and flags pairs of unsynchronized accesses that could form future deadlocks if thread scheduling changes, even though no actual deadlock occurred during this execution.",
      "A cache-line false sharing event — the tool uses hardware performance counters to detect two threads writing to different variables on the same 64-byte cache line, reporting the access pair because false sharing causes performance degradation.",
    ],
    correctIndex: 0,
    explanation:
      "TSan flags data races (5-15x slowdown); Helgrind/DRD also catch lock-order violations (50-100x). Related bug classes include TOCTOU (CWE-367) and unsynchronized non-sig_atomic_t access from signal handlers.",
  },
  {
    slug: "c-systems-l4-daemon",
    competencyId: "c-systems",
    depthTier: 4,
    sectionHeading: "The double-fork daemon pattern",
    prompt:
      "Your daemon process calls fork(), the parent exits, the child calls setsid(), then forks a second time. A colleague asks why the second fork is needed since setsid() already detached from the terminal. What risk does the second fork eliminate?",
    options: [
      "After setsid() the child is a session leader — a session leader can still acquire a controlling terminal by opening a tty device. The second fork produces a non-session-leader that can never reattach to a terminal, closing that window.",
      "setsid() detaches the terminal but leaves the process in its original process group, which still receives SIGHUP and SIGTSTP. The second fork moves the daemon into a new process group that is immune to those terminal-originated signals.",
      "The first child after setsid() inherits a reference to the terminal's device file in its descriptor table. The second fork triggers the kernel's O_CLOEXEC-on-fork mechanism for tty descriptors, ensuring they are closed in the grandchild.",
      "Without the second fork, other processes can join the setsid-created session using setpgid(), potentially injecting themselves into the daemon's session. The second fork creates a session that the kernel marks as closed to new members.",
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
    prompt:
      "A setuid-root program checks whether /tmp/output exists with access(), then opens it for writing. An attacker plants a symlink from /tmp/output to /etc/shadow between the check and the open. What flag combination in open() prevents this class of attack?",
    options: [
      "O_CREAT | O_EXCL | O_NOFOLLOW — O_EXCL makes open() fail atomically if the path already exists (eliminating the check-then-act gap), and O_NOFOLLOW refuses to follow symbolic links, blocking symlink substitution entirely.",
      "O_WRONLY | O_SYNC | O_DIRECT — O_SYNC forces synchronous metadata commits so the file's existence is immediately visible to other processes, and O_DIRECT bypasses the page cache to prevent the kernel from following cached symlink resolutions.",
      "O_RDWR | O_TMPFILE | O_DSYNC — O_TMPFILE creates an anonymous inode with no directory entry in /tmp, and O_DSYNC ensures metadata is written atomically, so the attacker cannot target a file that has no name in the filesystem namespace.",
      "O_CREAT | O_NOCTTY | O_TRUNC — these flags combine the existence check and file creation into one call, with O_NOCTTY preventing terminal hijacking and O_TRUNC ensuring the file starts empty, closing the TOCTOU window by eliminating the need for access().",
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
    prompt:
      "You're writing x86-64 shellcode to call write (syscall 1). You place 1 in rax, the fd in rdi, the buffer address in rsi, and the length in rdx, then execute the `syscall` instruction. Why must the arguments go in these specific registers?",
    options: [
      "The x86-64 Linux syscall ABI defines rax for the syscall number and rdi, rsi, rdx, r10, r8, r9 for arguments 1 through 6. The `syscall` instruction traps to ring 0, where the kernel reads these fixed registers to dispatch the correct handler.",
      "The registers match the System V AMD64 C calling convention identically, because syscall handlers are compiled C functions — the CPU jumps directly to the handler's entry point, which expects arguments in the standard C parameter positions.",
      "Any general-purpose registers can hold the arguments — the `syscall` instruction pushes all registers onto a kernel stack, and the handler retrieves them by stack offset. The rdi/rsi/rdx layout is a glibc convention, not a hardware or kernel requirement.",
      "The `syscall` instruction triggers a hardware lookup in the GDT (Global Descriptor Table), which maps register positions to syscall parameters based on entries the kernel configures at boot — the register assignments are a GDT configuration choice.",
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
    prompt:
      "A CTF challenge binary has a seccomp-BPF filter that blocks execve (syscall 59). Your shellcode calls execve and the process dies with SIGSYS. How must you change your exploitation strategy?",
    options: [
      "Use open-read-write (ORW) shellcode instead — call open() on the flag file, read() its contents into a buffer, then write() to stdout. This avoids the blocked syscall entirely while still exfiltrating the target data through permitted syscalls.",
      "Invoke ptrace(PTRACE_DETACH) from the shellcode to remove the seccomp filter — seccomp enforcement is implemented through the ptrace subsystem, and detaching the implicit tracer clears all installed BPF filters, re-enabling execve.",
      "Use mprotect to mark the seccomp filter's BPF bytecode as writable, then patch the comparison instruction to change the blocked number from 59 to an unused syscall — the filter is a memory-mapped BPF program modifiable at runtime from userspace.",
      "Call prctl(PR_SET_NO_NEW_PRIVS, 0) from the shellcode to lower the process restriction level — this flag is what enables seccomp enforcement, and resetting it to 0 disables the filter, allowing execve to proceed normally.",
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
    prompt:
      "Inside a Docker container, `ps aux` shows PID 1 as your application. On the host, the same process has PID 29451. Which kernel mechanism creates this PID illusion, and what container-escape risk does it introduce?",
    options: [
      "The PID namespace (CLONE_NEWPID) gives the container its own PID numbering where the process is 1, while the host sees its global PID. Escape risk: a shared or misconfigured PID namespace lets the container ptrace or signal host processes directly.",
      "The cgroups PID controller assigns virtual PIDs by intercepting getpid() in glibc — the kernel tracks the real PID internally. Escape risk: /proc/self/cgroup leaks the host PID, which can be used for direct cross-namespace process injection.",
      "Docker's runc runtime uses LD_PRELOAD to inject a library that overrides getpid() and related calls to return remapped values. Escape risk: statically linked binaries bypass the preload and see real host PIDs, enabling cross-container interference.",
      "A seccomp-BPF filter intercepts getpid/getppid syscalls and returns fake values from a translation table maintained by the container runtime. Escape risk: a process with CAP_SYS_ADMIN can remove seccomp filters and see the real PID namespace.",
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
    prompt:
      "During a penetration test you discover a non-setuid binary with CAP_DAC_OVERRIDE in its permitted and effective capability sets (shown by getcap). Why is this finding dangerous?",
    options: [
      "CAP_DAC_OVERRIDE bypasses all discretionary file permission checks — the process can read /etc/shadow, write to /etc/passwd, or modify any file regardless of ownership or mode bits, enabling full system compromise without the binary being setuid root.",
      "CAP_DAC_OVERRIDE lets the process call mlock on unlimited memory pages, pinning sensitive data in RAM — an attacker could exhaust physical memory and trigger OOM kills of critical services to create a denial-of-service condition.",
      "CAP_DAC_OVERRIDE grants permission to load arbitrary kernel modules via init_module and finit_module syscalls — an attacker could load a rootkit module that hides processes, files, and network connections from all system monitoring tools.",
      "CAP_DAC_OVERRIDE allows the process to bind to privileged TCP/UDP ports below 1024 without root — an attacker could impersonate sshd or httpd on their standard ports to intercept credentials from connecting users and automated systems.",
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
    prompt:
      "On Ubuntu with /proc/sys/kernel/yama/ptrace_scope set to 1, you try to attach gdb to a running process owned by your user, but PTRACE_ATTACH returns EPERM. What does ptrace_scope level 1 restrict, and why?",
    options: [
      "Level 1 restricts ptrace to direct parent-child relationships only — you can trace processes you spawned but not arbitrary same-user processes. This prevents a compromised process from reading memory of ssh-agent or gpg-agent via ptrace.",
      "Level 1 restricts tracing to processes in the same cgroup hierarchy — since gdb and the target are in different systemd slices, the kernel denies the attach to prevent cross-service tracing in multi-tenant environments sharing one user namespace.",
      "Level 1 requires the tracer to hold CAP_SYS_PTRACE in its ambient capability set, which regular user binaries lack. Ubuntu enforces this to maintain consistency with its AppArmor mandatory access control profiles for debugging tools.",
      "Level 1 disables ptrace entirely for non-root users and logs the attempt to the audit subsystem — the EPERM indicates that your user account lacks an explicit tracing permission entry in /etc/security/ptrace.conf.",
    ],
    correctIndex: 0,
    explanation:
      "ptrace powers gdb/strace and enables code injection and credential theft from processes like sshd or sudo. Malware also uses PTRACE_TRACEME as an anti-debug check. ptrace_scope level 1 (Ubuntu default) allows only parent->child tracing.",
  },
  {
    slug: "c-systems-l5-container-runtime",
    competencyId: "c-systems",
    depthTier: 5,
    sectionHeading: "Building a Minimal Container Runtime",
    prompt:
      "You're building a minimal container runtime. After clone() with CLONE_NEWPID|CLONE_NEWNS|CLONE_NEWNET, you call pivot_root, remount /proc, drop capabilities, install a seccomp filter, then execve the contained program. Why is this specific ordering critical?",
    options: [
      "Each step reduces attack surface before untrusted code runs: namespaces isolate resources, pivot_root confines filesystem access, /proc is remounted for the new PID namespace, capabilities are dropped so the process cannot undo its own sandbox, and seccomp locks syscalls — all before execve cedes control.",
      "The kernel enforces this exact ordering by validating each syscall's preconditions — clone checks for prior unshare, pivot_root validates the mount namespace flag, and seccomp verifies that capabilities were already dropped. Reordering causes EINVAL.",
      "pivot_root requires CAP_SYS_CHROOT (dropped later), and remounting /proc needs CAP_SYS_ADMIN — if capabilities are dropped first, both calls fail. seccomp must be last because prctl(PR_SET_SECCOMP) requires CAP_SYS_RESOURCE to install a BPF filter program.",
      "The ordering is a convention from the OCI runtime specification, not a security requirement — the kernel accumulates all isolation requests and applies them atomically at the execve boundary, so reordering the setup calls produces an identical sandbox.",
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
    prompt:
      "In a kernel exploit targeting a race condition in a syscall handler, the attacker registers a userfaultfd handler on a page passed to the kernel. When the kernel accesses that page mid-syscall, the kernel thread pauses. Why is this pause so valuable for exploitation?",
    options: [
      "The kernel thread blocks on the faulting page until the userspace handler responds — this lets the attacker control exactly when the kernel resumes, widening a narrow TOCTOU race window from nanoseconds to an arbitrary duration for reliable exploitation.",
      "The userfaultfd pause triggers a kernel oops that dumps register contents to dmesg, revealing the KASLR base address — the attacker parses these values to calculate ROP gadget locations, defeating kernel address space layout randomization.",
      "While the kernel is paused, userfaultfd automatically disables SMEP and SMAP for the faulting thread's context — this allows the exploit to redirect the kernel's instruction pointer to userspace code pages that would normally be blocked by those protections.",
      "The pause prevents the kernel's internal reference counter from being incremented, leaving a kernel object at refcount zero — when the userfaultfd handler responds, the kernel operates on the already-freed object, creating a controlled use-after-free primitive.",
    ],
    correctIndex: 0,
    explanation:
      "Registering userfaultfd on a page means a kernel access to it blocks until userspace responds, giving precise control to hit a narrow TOCTOU window. mprotect, mmap, CLONE_FILES, and io_uring are other syscalls frequently leveraged in exploits.",
  },
];
