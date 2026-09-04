import type { SeedExercise } from "./types";

/** linux-admin L0–L5 + containers-infra L0–L5 comprehension MCQs. */
export const LINUX_SYSTEMS_EXERCISES: SeedExercise[] = [
  // ══════════════════════════════════════════════════════════════════════════
  //  linux-admin
  // ══════════════════════════════════════════════════════════════════════════

  // ── L0 ──
  {
    slug: "la-l0-what",
    competencyId: "linux-admin",
    depthTier: 0,
    sectionHeading: "What is Linux administration",
    prompt: "A DevOps engineer explains that you never interact with the kernel directly — you use userspace tools instead. Which statement best describes the kernel-userspace relationship in a Linux system?",
    options: [
      "The kernel manages hardware abstraction, process scheduling, memory allocation, and device access, while userspace tools like systemd, coreutils, and package managers provide the interfaces administrators actually use to configure and monitor the system.",
      "The kernel is a graphical shell that translates mouse clicks and keyboard input into system commands, while userspace tools are background daemons that execute those commands on the hardware without any visible user interface.",
      "The kernel and userspace are interchangeable layers — either can manage hardware, processes, and memory, and administrators choose which layer to use based on the performance requirements of each specific task.",
      "The kernel is an optional firmware component that accelerates boot time, while userspace tools like systemd handle all real work including process scheduling, memory management, and hardware driver loading at runtime.",
    ],
    correctIndex: 0,
    explanation:
      "The kernel is the OS core — it mediates between hardware and userspace. Userspace tools (systemd, coreutils, package managers) are what administrators interact with daily.",
  },
  {
    slug: "la-l0-why",
    competencyId: "linux-admin",
    depthTier: 0,
    sectionHeading: "Why it matters for security",
    prompt: "During a penetration test, you compromise a low-privileged shell on a Linux web server. Your next steps involve checking user permissions, crontabs, and SUID binaries. Why does Linux administration knowledge directly enable these post-exploitation actions?",
    options: [
      "Most servers run Linux, so understanding users, permissions, services, and firewall rules lets you identify misconfigurations — like writable cron scripts or unexpected SUID binaries — that lead to privilege escalation and lateral movement.",
      "Linux administration knowledge lets you install a graphical desktop on the server remotely, which provides a more intuitive interface for browsing directories, searching files, and running escalation tools during the engagement.",
      "Linux servers store all credentials in plaintext configuration files by convention, so administration knowledge simply tells you which files to read — no escalation techniques or permission analysis are actually needed.",
      "Linux administration is useful only for the initial access phase — once you have any shell, the operating system's internals are irrelevant because post-exploitation tools abstract away all system-level details automatically.",
    ],
    correctIndex: 0,
    explanation:
      "Over 90% of public cloud workloads run Linux. Defensive work (hardening, monitoring, IR) and offensive work (finding privesc paths) both require deep Linux knowledge.",
  },
  {
    slug: "la-l0-vocab",
    competencyId: "linux-admin",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt: "You find /usr/local/bin/backup owned by root with permissions -rwsr-xr-x. A junior tester asks why the 's' in the owner-execute position matters. What security implication does this SUID bit create?",
    options: [
      "The SUID bit means any user who runs this binary executes it with root's privileges, not their own — if the binary has an exploitable flaw like command injection or path traversal, it becomes a direct privilege escalation vector.",
      "The 's' marks the file as a symbolic link to a root-only binary — it allows unprivileged users to see the file's metadata but not execute it, acting as a placeholder that redirects to the real binary upon root authentication.",
      "The 's' enables mandatory file locking — while the binary runs, no other process can read or modify it, preventing race-condition attacks but having no effect on the privilege level of the executing process.",
      "The 's' indicates the file is signed by the distribution's package manager — it confirms integrity (the binary has not been tampered with) but does not change which user's privileges the binary runs under during execution.",
    ],
    correctIndex: 0,
    explanation:
      "SUID (Set User ID) lets a binary execute with the privileges of its owner. If root owns a SUID binary and a normal user runs it, the binary runs as root — a classic escalation path when the binary can be abused.",
  },

  // ── L1 ──
  {
    slug: "la-l1-users",
    competencyId: "linux-admin",
    depthTier: 1,
    sectionHeading: "User and group management",
    prompt: "You can read /etc/passwd as any user (it shows usernames, UIDs, and shells) but reading /etc/shadow returns 'Permission denied.' Why are password hashes stored in a separate root-only file instead of in the world-readable passwd file?",
    options: [
      "Shadow stores hashed passwords and was created specifically to prevent unprivileged users from copying hashes for offline cracking — passwd remains world-readable because many programs need it to resolve usernames and UIDs.",
      "Shadow contains each user's home directory path and default shell, which are sensitive because knowing a user's shell type reveals which exploits to use — passwd stores only the username and a display comment field.",
      "Shadow is root-only because it stores PAM module configuration for each user — password hashes are still in passwd but are base64-encoded, which is why they appear as 'x' placeholders to non-root readers.",
      "Shadow exists purely for performance — hashed passwords are computationally expensive to load, so isolating them in a separate file avoids slowing down the hundreds of UID lookups that programs perform per second against passwd.",
    ],
    correctIndex: 0,
    explanation:
      "Historically passwords were in /etc/passwd (world-readable). The shadow file was introduced to move hashes to a root-only file, preventing unprivileged users from grabbing hashes for offline cracking.",
  },
  {
    slug: "la-l1-perms",
    competencyId: "linux-admin",
    depthTier: 1,
    sectionHeading: "File permissions and special bits",
    prompt: "As part of your Linux privilege escalation checklist, you run find / -perm -4000 -type f 2>/dev/null and get a list of 15 binaries. A teammate asks what -perm -4000 actually matches. What is your answer?",
    options: [
      "It matches files whose SUID bit (octal 4000) is set — these binaries execute with their owner's privileges rather than the caller's, making them the first thing to check for unexpected entries that could provide root access.",
      "It matches files larger than 4000 bytes on disk — the -perm flag in this context checks file size in bytes, and large binaries are escalation targets because they contain more exploitable code paths and logic.",
      "It matches files with exactly 4000 hardlinks — a high hardlink count indicates system-critical binaries that are protected by the kernel, and exploiting one gives access to all linked paths simultaneously.",
      "It matches files whose inode number is below 4000 — low inode numbers are reserved for setuid-capable binaries by the filesystem driver, so this filter efficiently locates all privileged executables without reading permissions.",
    ],
    correctIndex: 0,
    explanation:
      "The -perm -4000 flag matches files whose SUID bit (octal 4000) is set. Finding unexpected SUID binaries is one of the first enumeration steps in Linux privilege escalation.",
  },
  {
    slug: "la-l1-systemd",
    competencyId: "linux-admin",
    depthTier: 1,
    sectionHeading: "Service management with systemd",
    prompt: "You compromise a Linux host and run ss -tlnp to list listening services. You discover an unexpected listener on port 8080 bound to localhost that your external nmap scan missed. Why is internal service enumeration critical for both offense and defense?",
    options: [
      "Running services define the attack surface — each listener is a potential entry point, and some bind to localhost only (invisible to external scans); identifying unnecessary services lets you disable them for hardening or target them for escalation.",
      "Services listed by ss are always vulnerable because any process that opens a socket must disable ASLR for compatibility, making every listener exploitable through a standard buffer overflow without service-specific knowledge.",
      "Internal service enumeration reveals which services run inside containers versus directly on the host — containerized services are fully immune to exploitation, so filtering them out focuses your efforts on host processes only.",
      "The ss command shows services that have been patched but not yet restarted — these are the most valuable targets because old vulnerable code is still in memory, whereas nmap only detects services running updated binaries.",
    ],
    correctIndex: 0,
    explanation:
      "Each listening service is a potential target. Hardening means disabling unnecessary services; enumeration means identifying what's exposed. systemctl and ss -tlnp are the key commands.",
  },
  {
    slug: "la-l1-pkg",
    competencyId: "linux-admin",
    depthTier: 1,
    sectionHeading: "Package management essentials",
    prompt: "A vulnerability scanner flags your server's Apache httpd as version 2.4.49, vulnerable to CVE-2021-41773 (path traversal). Applying apt update && apt upgrade installs 2.4.54. Why is this patch cycle a primary security defense?",
    options: [
      "Unpatched services are a primary attack vector — CVE databases tie known vulnerabilities to specific package versions, and upgrading to 2.4.54 removes the path-traversal flaw before attackers can exploit the publicly documented technique.",
      "Package updates only modify the version string reported by the service's banner — the underlying code remains unchanged, but scanners check version strings, so updating satisfies compliance without altering runtime behavior.",
      "apt upgrade recompiles Apache from source with ASLR and stack canaries enabled, which are the actual mitigations — the version number change is incidental, and the security improvement comes from the new compilation flags.",
      "Upgrading to 2.4.54 installs a firewall rule that blocks the specific HTTP request pattern used by CVE-2021-41773 — the Apache binary itself is unchanged, but the packet filter prevents the exploit from reaching the service.",
    ],
    correctIndex: 0,
    explanation:
      "Many exploits target known CVEs in specific package versions. Regular patching (apt update/upgrade, dnf update) closes these known holes before attackers can exploit them.",
  },

  // ── L2 ──
  {
    slug: "la-l2-ssh",
    competencyId: "linux-admin",
    depthTier: 2,
    sectionHeading: "SSH hardening",
    prompt: "You audit an SSH server and find PasswordAuthentication yes in sshd_config. You recommend switching to key-only authentication and a colleague asks why keys are stronger than passwords. What is the core security difference?",
    options: [
      "SSH keys are cryptographic key pairs (Ed25519 recommended) that cannot be brute-forced or guessed remotely like passwords — disabling password authentication eliminates credential-stuffing and online brute-force attacks against the SSH service entirely.",
      "SSH keys store the password inside the key file encrypted with AES-256, so the underlying authentication is still password-based — but the encryption prevents the password from being intercepted during network transit.",
      "SSH keys authenticate faster than passwords, and brute-force attacks rely on the latency of repeated authentication attempts — with keys, the server responds too quickly for attackers to iterate through their credential wordlists.",
      "SSH keys and passwords provide equivalent cryptographic strength, but keys also bind the authentication to the client's MAC address, preventing credential reuse from other machines even if the key file is stolen.",
    ],
    correctIndex: 0,
    explanation:
      "SSH key authentication eliminates brute-force password attacks entirely. Setting PasswordAuthentication no in sshd_config forces key-only access. Ed25519 keys are compact, fast, and strong.",
  },
  {
    slug: "la-l2-firewall",
    competencyId: "linux-admin",
    depthTier: 2,
    sectionHeading: "Firewall configuration with nftables",
    prompt: "You set up an nftables ruleset with 'policy drop' on the input chain, then add rules to accept established connections and SSH on port 22. A web server on port 80 is now unreachable from outside. Why does the drop policy cause this?",
    options: [
      "A 'policy drop' silently discards all incoming packets that do not match an explicit allow rule — since you only allowed SSH and established connections, new TCP connections to port 80 are dropped because no rule permits them.",
      "The 'policy drop' encrypts all incoming packets using IPsec by default — the web server cannot decrypt the packets because it lacks the pre-shared key, so the connections fail at the application's TLS handshake layer.",
      "The 'policy drop' limits each nftables chain to a maximum of two rules — since SSH and established connections already occupy both slots, the kernel silently ignores any additional rules you add for port 80.",
      "The 'policy drop' rate-limits incoming traffic to one packet per second per source IP — the web server is technically reachable, but the severe rate limiting causes browsers to time out before the page finishes loading.",
    ],
    correctIndex: 0,
    explanation:
      "A drop policy means only traffic matching explicit allow rules (e.g., SSH on port 22, established connections) is accepted. This is the foundation of a secure firewall: deny by default, allow by exception.",
  },
  {
    slug: "la-l2-sudo",
    competencyId: "linux-admin",
    depthTier: 2,
    sectionHeading: "Sudo configuration and abuse",
    prompt: "During post-exploitation, you run sudo -l and see the entry: user ALL=(root) NOPASSWD: /usr/bin/vim. You consult GTFOBins and discover a path to a root shell. How does vim escalate your privileges to root?",
    options: [
      "vim can execute shell commands from within the editor — running sudo vim then typing :!bash spawns a bash shell that inherits vim's root privileges via sudo, giving you an interactive root session immediately.",
      "vim's syntax-highlighting engine evaluates embedded Python in any opened file — placing a Python reverse-shell one-liner in a file's modeline causes vim to execute it as root when the file is opened with sudo.",
      "vim directly modifies /etc/sudoers when run as root because it detects the elevated context — opening any file with sudo vim silently appends an ALL rule for your user to the sudoers file.",
      "vim exploits a known buffer overflow in its regex engine when processing very long lines — opening a crafted file with sudo vim overflows the regex buffer and redirects execution to a shellcode stub embedded in the file.",
    ],
    correctIndex: 0,
    explanation:
      "Many binaries with sudo access can spawn a shell: vim (:!bash), find (-exec), python (-c 'import os; os.system(\"/bin/bash\")'). GTFOBins (gtfobins.github.io) is the reference catalog.",
  },
  {
    slug: "la-l2-cron",
    competencyId: "linux-admin",
    depthTier: 2,
    sectionHeading: "Cron and scheduled tasks",
    prompt: "You find a root crontab entry: * * * * * /opt/scripts/backup.sh. Checking permissions, you discover /opt/scripts/backup.sh is world-writable (chmod 777). How does this misconfiguration give you a path to root?",
    options: [
      "Since root's cron runs backup.sh every minute as root, and any user can edit the script, you append a reverse shell command to backup.sh — root executes your payload on the next scheduled run, giving you a root shell.",
      "The world-writable permission lets you overwrite the cron daemon's binary by creating a symlink from backup.sh to /usr/sbin/cron — once replaced, the cron daemon itself runs as your user on the next restart.",
      "World-writable cron scripts automatically trigger the kernel's SUID escalation handler, which grants the script the SUID bit on its next execution — after that, any user can run it with root's privileges directly.",
      "The 777 permission causes cron to skip the script's execution because cron refuses to run world-writable files — the real escalation vector is that cron logs the refusal to a world-writable log where you inject commands.",
    ],
    correctIndex: 0,
    explanation:
      "A writable script in root's crontab is a direct path to root. Also check for wildcard injection in tar/rsync cron commands, where crafted filenames are interpreted as arguments.",
  },
  {
    slug: "la-l2-logs",
    competencyId: "linux-admin",
    depthTier: 2,
    sectionHeading: "Log management and monitoring",
    prompt: "An attacker gains root on your web server and deletes /var/log/auth.log to cover their SSH brute-force traces. Your incident response team finds no local evidence. What architectural defense would have preserved the evidence?",
    options: [
      "Centralized logging — forwarding logs to a remote syslog server or SIEM in real time ensures copies survive host compromise, because the attacker would need to also compromise the log aggregation server to destroy the evidence.",
      "Log file immutability via chattr +i on auth.log — this flag makes the file undeletable even by root at the filesystem level, so the attacker's rm command would fail and the complete logs would remain intact.",
      "Storing logs in a MySQL database on the same host — database files use journaling and write-ahead logs, so even if the main log file is deleted, the database's internal journal preserves every single log entry for recovery.",
      "Enabling real-time log compression with gzip — compressed log files occupy less disk space and cannot be partially deleted, so an attacker's rm would fail because the filesystem cannot remove a compressed file that is in use.",
    ],
    correctIndex: 0,
    explanation:
      "A common post-exploitation step is deleting logs. Forwarding logs to a remote syslog or Loki instance means the evidence persists even if the attacker has root on the compromised host.",
  },

  // ── L3 ──
  {
    slug: "la-l3-apparmor",
    competencyId: "linux-admin",
    depthTier: 3,
    sectionHeading: "Mandatory Access Control with AppArmor",
    prompt: "A web server process running as root is compromised. With standard DAC permissions, the attacker reads /etc/shadow because root owns it. You then enable an AppArmor profile that confines the web server. How does this change the outcome?",
    options: [
      "AppArmor's MAC policy restricts the process to only the files and capabilities its profile allows — even though the process runs as root, AppArmor denies access to /etc/shadow if the profile does not explicitly permit that path.",
      "AppArmor changes the process's UID from root to a dedicated service user at runtime, effectively dropping root privileges — the process can no longer read /etc/shadow because it is no longer running as the root user.",
      "AppArmor encrypts /etc/shadow with a per-profile key so that only the AppArmor daemon itself can decrypt it — the web server process lacks the key, so reading the file returns ciphertext rather than usable password hashes.",
      "AppArmor moves /etc/shadow into a kernel-only filesystem that is invisible to all userspace processes — the file still exists for authentication purposes but cannot be accessed through any standard file operation, even by root.",
    ],
    correctIndex: 0,
    explanation:
      "DAC relies on file ownership (rwx for owner/group/other) and can be bypassed by root. MAC (AppArmor, SELinux) restricts what even root processes can do, based on policy profiles — defense-in-depth.",
  },
  {
    slug: "la-l3-sysctl",
    competencyId: "linux-admin",
    depthTier: 3,
    sectionHeading: "Kernel hardening with sysctl",
    prompt: "You set kernel.yama.ptrace_scope = 1 on a production server. A developer complains that their debugging tool can no longer attach to another user's running process with ptrace. Why does this sysctl value block that action?",
    options: [
      "ptrace_scope=1 restricts ptrace to parent-child relationships only — a process can only trace its own children, blocking the developer's tool from attaching to an unrelated process and preventing attackers from injecting code into other users' processes.",
      "ptrace_scope=1 requires all processes to be compiled with debug symbols (-g) before ptrace can attach — production binaries are stripped, so ptrace fails because it cannot locate the symbol table needed for the attachment protocol.",
      "ptrace_scope=1 limits ptrace to single-threaded processes only — modern applications use multiple threads, and the kernel refuses to attach to any process with more than one thread to prevent race conditions in the tracer.",
      "ptrace_scope=1 enables address-space layout randomization for traced processes only — the debugger can still attach, but ASLR scrambles the memory layout each time ptrace reads a region, making the debugging output unusable.",
    ],
    correctIndex: 0,
    explanation:
      "ptrace_scope=1 restricts ptrace to parent-child relationships only. This blocks techniques where an attacker's process attaches to another user's process to read its memory or inject code.",
  },
  {
    slug: "la-l3-auditd",
    competencyId: "linux-admin",
    depthTier: 3,
    sectionHeading: "Audit framework with auditd",
    prompt: "Your security team needs to log every process that reads /etc/shadow. You add the auditd rule: -w /etc/shadow -p r -k shadow_read. Later you run ausearch -k shadow_read and see entries. What exactly did this rule accomplish?",
    options: [
      "The -w flag watches the file path, -p r triggers on read access, and -k shadow_read tags each log entry for searching — auditd logged every process that opened /etc/shadow for reading, including the process name, UID, and timestamp.",
      "The rule configured auditd to deny read access to /etc/shadow for all non-root users — ausearch shows the blocked attempts, and the 'r' permission flag means 'restrict' rather than 'read' in auditd's rule syntax.",
      "The rule enabled real-time encryption of /etc/shadow — each read triggers auditd to re-encrypt the file with a fresh key, and ausearch shows the key-rotation events rather than the actual read operations themselves.",
      "The rule configured the kernel to create a backup copy of /etc/shadow on each read — ausearch shows the backup operations, and -p r means 'replicate' in auditd's permission model, creating redundant copies for integrity checks.",
    ],
    correctIndex: 0,
    explanation:
      "auditd provides kernel-level auditing. The -w flag watches a path, -p rwa specifies the operations (read/write/attribute), and -k tags the log for easy searching with ausearch -k shadow_access.",
  },
  {
    slug: "la-l3-pam",
    competencyId: "linux-admin",
    depthTier: 3,
    sectionHeading: "PAM configuration deep dive",
    prompt: "After configuring pam_faillock with deny=5 and unlock_time=900 in your PAM stack, a user reports being locked out after several password typos. They wait 15 minutes and can log in again. What is PAM enforcing here?",
    options: [
      "pam_faillock counted 5 consecutive failed login attempts and locked the account for 900 seconds (15 minutes) — this defends against brute-force and credential-stuffing attacks by rate-limiting authentication attempts per account.",
      "pam_faillock detected that the user's password was among the 5 most common passwords in its built-in dictionary and imposed a 900-second cooling period to encourage the user to choose a stronger password instead.",
      "pam_faillock measured the total authentication processing time across all attempts — when the cumulative time exceeded 5 seconds (deny=5 means 5 seconds), it imposed a 900-second delay before allowing any new authentication.",
      "pam_faillock restricts each user to 5 concurrent SSH sessions (deny=5 is the session limit) — the user was locked out because their previous sessions had not timed out yet, and unlock_time controls the session idle timeout.",
    ],
    correctIndex: 0,
    explanation:
      "pam_faillock tracks failed login attempts per account. With deny=5 and unlock_time=900, the account locks for 15 minutes after 5 failures. PAM also handles MFA (pam_google_authenticator) and password quality.",
  },
  {
    slug: "la-l3-fssec",
    competencyId: "linux-admin",
    depthTier: 3,
    sectionHeading: "Filesystem security",
    prompt: "An attacker compromises a web application and downloads a malicious ELF binary to /tmp, then runs chmod +x /tmp/exploit && /tmp/exploit. You remount /tmp with the noexec option and the attacker retries. What happens now?",
    options: [
      "The kernel blocks execution of any binary on the /tmp partition — even though chmod +x succeeds (it modifies metadata), the noexec mount flag prevents execve() from launching the binary, returning EACCES to the attacker.",
      "The noexec option removes write permission from /tmp entirely, so the attacker cannot download the binary in the first place — the exploit attempt fails at the download stage, not at the execution stage.",
      "The noexec option applies only to interpreted scripts (bash, python) and not to compiled ELF binaries — the attacker's compiled exploit still executes normally, but any shell scripts they download would be blocked.",
      "The noexec option quarantines the binary by moving it to /var/quarantine and alerting the administrator — the binary is not blocked from executing but is relocated so the original /tmp path becomes invalid.",
    ],
    correctIndex: 0,
    explanation:
      "Attackers commonly download payloads to /tmp (world-writable) and execute them. The noexec mount option prevents execution from that partition. Combined with nosuid and nodev, it significantly hardens /tmp.",
  },

  // ── L4 ──
  {
    slug: "la-l4-selinux",
    competencyId: "linux-admin",
    depthTier: 4,
    sectionHeading: "SELinux policies and contexts",
    prompt: "A compromised Apache process (labeled httpd_t) running as root tries to read /etc/shadow (labeled shadow_t). Standard DAC permissions allow root to read any file. But SELinux denies the access with an AVC denial. Why?",
    options: [
      "SELinux type enforcement defines which process types can access which file types — the policy allows httpd_t to read httpd_sys_content_t but not shadow_t, so the access is denied regardless of the DAC owner/permission check.",
      "SELinux replaces the root user with a virtual identity that has no special privileges — when SELinux is active, root is treated as an unprivileged user, so the standard DAC permission check itself denies the read.",
      "SELinux encrypts every file with a type-specific key — httpd_t does not have the decryption key for shadow_t files, so while the read syscall succeeds, the process receives ciphertext instead of usable password hashes.",
      "SELinux restricts file access based on file size and access frequency — /etc/shadow exceeds the per-type size limit defined in the httpd_t policy, and SELinux denies reads to files larger than that configured threshold.",
    ],
    correctIndex: 0,
    explanation:
      "SELinux labels every process and file with a security context (user:role:type:level). The TE policy maps which types can interact. Even if DAC allows root to read /etc/shadow, SELinux can deny httpd_t that access.",
  },
  {
    slug: "la-l4-ns-cg",
    competencyId: "linux-admin",
    depthTier: 4,
    sectionHeading: "Namespaces and cgroups for isolation",
    prompt: "A container process runs 'ps aux' and sees only its own processes with PID 1 as the container's init. On the host, the same process has PID 4523. What Linux kernel mechanism provides this isolated process-ID view?",
    options: [
      "PID namespaces — each namespace provides an independent process ID number space, so the container sees its own PID 1 while the host sees the real PID 4523; there are separate namespace types for network, mount, user, and other resources.",
      "cgroups — they create a virtual process table for each control group, hiding processes outside the group from ps and /proc; PID 1 is automatically assigned to the first process placed in each cgroup hierarchy.",
      "chroot — it restricts the process to a subdirectory that contains a modified /proc filesystem showing only the container's processes; the host's /proc is inaccessible because the chroot makes the parent directory unreachable.",
      "Seccomp filters — the container's seccomp profile intercepts the getdents syscall that ps uses to list /proc entries and filters out entries for processes outside the container, returning only the container's own PIDs.",
    ],
    correctIndex: 0,
    explanation:
      "There are 7 namespace types (PID, NET, MNT, UTS, IPC, USER, CGROUP). Together they isolate a process's view of the system. cgroups are separate — they limit resource consumption (CPU, memory), not visibility.",
  },
  {
    slug: "la-l4-secboot",
    competencyId: "linux-admin",
    depthTier: 4,
    sectionHeading: "Secure boot and measured boot",
    prompt: "An attacker with physical access replaces the Linux kernel on disk with a modified version containing a rootkit. On the next boot, UEFI Secure Boot prevents the system from starting. Why does the rootkit fail to load?",
    options: [
      "Secure Boot verifies each component's digital signature in the boot chain (firmware -> shim -> GRUB -> kernel) — the modified kernel's signature does not match any trusted key in the UEFI key database, so firmware refuses to load it.",
      "Secure Boot hashes the kernel at boot time and compares it against a hash stored in the TPM chip — the modified kernel produces a different hash, and the TPM instructs the firmware to halt the entire boot process.",
      "Secure Boot encrypts the kernel on disk using a key fused into the CPU at manufacturing time — the modified kernel was not encrypted with this key, so the firmware cannot decrypt it and the boot sequence fails.",
      "Secure Boot checks the kernel file's size and modification timestamp against values stored in the EFI System Partition — the modified kernel has a different file size, triggering a mismatch that causes a boot failure.",
    ],
    correctIndex: 0,
    explanation:
      "Secure Boot builds a chain of trust from firmware to kernel. A rootkit that modifies the kernel would break the signature chain. For forensics, this helps ensure the kernel itself hasn't been tampered with.",
  },
  {
    slug: "la-l4-compliance",
    competencyId: "linux-admin",
    depthTier: 4,
    sectionHeading: "Automated hardening and compliance",
    prompt: "Your organization must comply with CIS Benchmarks across 200 Linux servers. Running manual checks on each server is impractical, so you deploy OpenSCAP. What does it automate in this compliance workflow?",
    options: [
      "OpenSCAP evaluates each system against a CIS Benchmark security profile, reports which settings are non-compliant (e.g. weak password policy, missing firewall rules), and can automatically remediate findings to bring systems into compliance.",
      "OpenSCAP replaces the Linux kernel on each server with a hardened, pre-configured kernel image that embeds all CIS Benchmark settings — no evaluation or remediation is needed because the kernel enforces compliance by design.",
      "OpenSCAP scans network traffic between the 200 servers for unencrypted data and compliance violations — it is a network-level intrusion detection system that reports CIS-relevant findings based on deep packet analysis.",
      "OpenSCAP generates synthetic user login events to stress-test each server's authentication configuration against CIS thresholds — it simulates brute-force attacks and verifies that account lockout policies meet the required values.",
    ],
    correctIndex: 0,
    explanation:
      "OpenSCAP evaluates systems against CIS Benchmarks (or other SCAP profiles), generates compliance reports, and can auto-remediate findings. Combined with Ansible, it enables consistent hardening at scale.",
  },

  // ── L5 ──
  {
    slug: "la-l5-ebpf",
    competencyId: "linux-admin",
    depthTier: 5,
    sectionHeading: "eBPF for security monitoring",
    prompt: "Your team debates deploying a custom kernel module versus an eBPF-based solution for syscall monitoring. The security director is concerned about kernel stability in production. Why does eBPF address this concern better than a kernel module?",
    options: [
      "eBPF programs pass through the kernel's BPF verifier before execution — it proves they terminate, access only valid memory, and cannot crash the kernel, unlike kernel modules which run with full ring-0 privileges and no safety guarantees.",
      "eBPF programs execute in a user-space sandbox with no kernel access — they intercept syscalls by hooking the vDSO, so a bug in the eBPF code can only crash the monitoring process and never the kernel itself.",
      "eBPF programs are interpreted by a user-space virtual machine that communicates with the kernel via netlink sockets — the kernel never executes eBPF bytecode directly, eliminating any risk of instability from monitoring code.",
      "eBPF programs are limited to 1000 instructions and cannot contain loops, making them too simple to harbor bugs — kernel modules have no instruction limit, which is why they are more likely to contain complex bugs that crash the kernel.",
    ],
    correctIndex: 0,
    explanation:
      "The BPF verifier ensures eBPF programs terminate, don't access invalid memory, and can't crash the kernel. Tools like Falco and Tetragon use eBPF for runtime security enforcement — detecting container escapes and suspicious activity in real time.",
  },
  {
    slug: "la-l5-lsm",
    competencyId: "linux-admin",
    depthTier: 5,
    sectionHeading: "Linux Security Modules framework",
    prompt: "A developer wants to sandbox their application so it can only access ~/app-data and nothing else on the filesystem, but they have no root privileges and cannot ask an administrator to configure AppArmor or SELinux profiles. Which LSM lets them self-sandbox?",
    options: [
      "Landlock — since kernel 5.13, unprivileged processes can create Landlock rulesets to voluntarily restrict their own filesystem access, enabling application self-sandboxing without root privileges or administrator-configured MAC policies.",
      "SMACK (Simplified Mandatory Access Control Kernel) — it allows any process to tag its own files with custom security labels and restricts access based on label matching, without requiring root to define the labeling policy.",
      "TOMOYO — it provides a learning mode that automatically generates a minimal access profile by observing the application's behavior over 24 hours, then enforces that profile without requiring root to activate it.",
      "Yama — although primarily known for ptrace restrictions, its unprivileged mode also supports per-process filesystem sandboxing through the /proc/self/yama/sandbox interface, available since kernel 5.10 on most distributions.",
    ],
    correctIndex: 0,
    explanation:
      "Unlike SELinux or AppArmor which require admin privileges to configure, Landlock (since kernel 5.13) lets unprivileged processes voluntarily restrict themselves — useful for sandboxing untrusted code.",
  },
  {
    slug: "la-l5-rootkit",
    competencyId: "linux-admin",
    depthTier: 5,
    sectionHeading: "Rootkit detection and kernel integrity",
    prompt: "An attacker with root access attempts to load a custom kernel module to install a rootkit. The system runs with kernel lockdown in 'integrity' mode. What happens when they execute insmod rootkit.ko?",
    options: [
      "Kernel lockdown in integrity mode blocks loading unsigned kernel modules — even root cannot insmod an unsigned .ko file, and raw I/O access to /dev/mem and /dev/kmem is also denied, preventing kernel-level tampering.",
      "Kernel lockdown in integrity mode allows the module to load but marks it as tainted — the module runs normally, but the kernel logs a warning to dmesg indicating that an unsigned module is active for audit purposes.",
      "Kernel lockdown in integrity mode encrypts the module's code section before inserting it — the module loads but its functions are scrambled, rendering the rootkit non-functional without affecting legitimate modules that have the decryption key.",
      "Kernel lockdown in integrity mode quarantines the module in a sandboxed namespace with no access to kernel data structures — the module runs but can only see and modify its own isolated memory space within the kernel.",
    ],
    correctIndex: 0,
    explanation:
      "Kernel Lockdown (since 5.4) has two modes: 'integrity' prevents unsigned modules and raw I/O; 'confidentiality' also prevents reading kernel memory. This blocks kernel rootkits even from a root-level attacker.",
  },
  {
    slug: "la-l5-caps",
    competencyId: "linux-admin",
    depthTier: 5,
    sectionHeading: "Capability-based security",
    prompt: "You need tcpdump to capture raw packets but do not want to make it SUID root. You run setcap cap_net_raw=+ep /usr/bin/tcpdump instead. A colleague asks why capabilities are safer than SUID root for granting this specific privilege.",
    options: [
      "Capabilities split root's power into discrete units — cap_net_raw grants only raw socket access, so if tcpdump is compromised the attacker gets packet capture ability but not full root privileges like filesystem access or user management.",
      "setcap stores the capability in the file's extended attributes encrypted with the filesystem key — a compromised tcpdump cannot read its own capability metadata, so it cannot transfer the privilege to a child process.",
      "Capabilities are checked only at file-open time, not during sustained execution — cap_net_raw allows tcpdump to open raw sockets during initialization, then the kernel automatically drops all capabilities for the remainder of the process.",
      "setcap and SUID provide identical privilege levels, but capabilities are logged more verbosely by auditd — the only real advantage is better audit trails, not reduced privilege, since cap_net_raw still grants full root-level network access.",
    ],
    correctIndex: 0,
    explanation:
      "Instead of making tcpdump SUID root (full root access), setcap cap_net_raw=+ep /usr/bin/tcpdump grants only the raw socket capability. This follows least privilege — container escapes often exploit overly broad capability grants.",
  },
  {
    slug: "la-l5-seccomp",
    competencyId: "linux-admin",
    depthTier: 5,
    sectionHeading: "Seccomp and syscall filtering",
    prompt: "Docker's default seccomp profile blocks approximately 44 syscalls including mount, reboot, and kexec_load. A process inside a container calls mount() to attempt an escape. What happens at the kernel level?",
    options: [
      "The seccomp filter intercepts the mount syscall and returns EPERM or kills the process (depending on the profile's default action) — this is one of four isolation pillars alongside namespaces, cgroups, and capability dropping that contain the container.",
      "The seccomp filter allows the mount syscall to proceed but redirects it to a virtual filesystem layer that simulates success — the container believes the mount worked, but the actual host filesystem remains completely unaffected.",
      "The seccomp filter logs the mount attempt and sends an alert to the container orchestrator, which then stops the container after a 30-second grace period — the mount itself is not immediately blocked by the filter.",
      "The seccomp filter encrypts the mount syscall's arguments before passing them to the kernel — the kernel receives garbled parameters, fails to parse them, and returns a generic error indistinguishable from a permissions issue.",
    ],
    correctIndex: 0,
    explanation:
      "Seccomp filter mode (SECCOMP_MODE_FILTER) allows a whitelist/blacklist of syscalls. Combined with namespaces (isolation), cgroups (resource limits), and capabilities (privilege reduction), it forms comprehensive container security.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  containers-infra
  // ══════════════════════════════════════════════════════════════════════════

  // ── L0 ──
  {
    slug: "ci-l0-what",
    competencyId: "containers-infra",
    depthTier: 0,
    sectionHeading: "What are containers",
    prompt: "A colleague wants to run a vulnerable web app for testing and asks whether to use a container or a VM. You explain that containers start in milliseconds but share the host kernel. Why is this kernel-sharing distinction important for security?",
    options: [
      "Containers use namespaces and cgroups for isolation while sharing the host kernel, making them lightweight and fast — but a kernel exploit inside a container affects the host directly, unlike a VM where the guest kernel is a separate boundary.",
      "Containers include a minimal guest kernel compiled from the Dockerfile's base image — the 'shared kernel' refers to a networking optimization where the container borrows the host's TCP/IP stack but has its own process scheduler.",
      "Kernel sharing means containers can only run the same distribution as the host (e.g. Ubuntu containers on an Ubuntu host) — VMs are slower but can run any OS because they emulate different CPU architectures in software.",
      "Containers share the kernel for disk I/O only — each container has its own independent kernel for process scheduling and memory management, which is how they achieve isolation that is nearly equivalent to full VMs.",
    ],
    correctIndex: 0,
    explanation:
      "Containers use Linux namespaces for isolation and cgroups for resource limits, sharing the host kernel. VMs emulate hardware and run a complete guest OS. The OCI now standardizes container image and runtime specs.",
  },
  {
    slug: "ci-l0-why",
    competencyId: "containers-infra",
    depthTier: 0,
    sectionHeading: "Why containers matter for security",
    prompt: "You need to stand up an isolated DVWA (Damn Vulnerable Web App) instance for training in under a minute, then tear it down without leaving traces on the host. Why are containers the ideal approach for this?",
    options: [
      "Container images are immutable and reproducible — docker run launches an isolated DVWA instance from a pre-built image in seconds, and docker rm destroys it completely, leaving no residual state that could affect the host or other labs.",
      "Containers automatically patch the vulnerable application's code at runtime — DVWA in a container is safe to expose to the internet because Docker injects security fixes before the application starts serving requests.",
      "Containers encrypt all application data at rest and in transit by default — running DVWA in a container ensures that no training data or attack payloads are visible to network sniffers or stored on the host filesystem.",
      "Containers provide hardware-level isolation identical to VMs — Docker uses Intel VT-x to create a separate virtual CPU for each container, so a vulnerability in DVWA cannot affect any other process or the host kernel.",
    ],
    correctIndex: 0,
    explanation:
      "Container images are immutable and reproducible. For offense, you get instant lab environments; for defense, you can analyze exactly what was deployed. Misconfigured containers are themselves a major attack surface in the wild.",
  },
  {
    slug: "ci-l0-vocab",
    competencyId: "containers-infra",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt: "A teammate builds a Docker image with docker build and sees a 300 MB image. They then run docker run twice to launch two containers from it. How much additional disk space do the two running containers consume?",
    options: [
      "Almost none initially — an image is a read-only template, and each container adds only a thin writable layer on top for runtime file changes; both containers share the same underlying 300 MB of read-only image layers on disk.",
      "Exactly 600 MB — each container copies the full image to create an independent writable instance, so two containers from a 300 MB image consume 300 MB each, totaling 600 MB of additional disk space.",
      "Approximately 150 MB each — Docker compresses the image by half when creating a container's filesystem, so the compressed copy becomes the writable layer, saving exactly 50% of the original image size per container.",
      "Zero bytes on disk — a running container exists entirely in RAM with no disk footprint; Docker loads the image layers into memory at startup and releases the on-disk copy, which is why containers start so quickly.",
    ],
    correctIndex: 0,
    explanation:
      "Images are built from Dockerfiles layer by layer and stored in registries. When you 'docker run' an image, Docker creates a container — a running process with its own writable overlay layer.",
  },

  // ── L1 ──
  {
    slug: "ci-l1-docker",
    competencyId: "containers-infra",
    depthTier: 1,
    sectionHeading: "Docker essentials",
    prompt: "A security analyst needs to inspect the filesystem of a running container named 'web' to check if an attacker dropped any files. They run docker exec -it web bash. What does this give them?",
    options: [
      "An interactive bash shell inside the running container — the -i flag keeps stdin open and -t allocates a pseudo-TTY, letting the analyst browse the container's filesystem and run commands as if they had SSH access to it.",
      "A read-only snapshot of the container's filesystem exported to the host as a tar archive — docker exec writes the archive to the analyst's current directory, and the -it flags specify the output format as incremental tar.",
      "A shell on the host machine with the container's environment variables loaded — docker exec maps the container's ENV into the host shell, but the filesystem the analyst sees is the host filesystem, not the container's.",
      "A side-by-side diff of the container's current filesystem against its original image — -it stands for 'inspect and trace,' and bash specifies the diff format, showing files added, modified, and deleted since launch.",
    ],
    correctIndex: 0,
    explanation:
      "docker exec runs a command inside an already-running container. The -it flags give you an interactive terminal. This is how you inspect or debug a running container.",
  },
  {
    slug: "ci-l1-dockerfile",
    competencyId: "containers-infra",
    depthTier: 1,
    sectionHeading: "Writing a Dockerfile",
    prompt: "Your Dockerfile ends with CMD ['node', 'app.js'] and runs the application as root (PID 1 inside the container). A security review recommends adding USER node before CMD. Why does this change reduce risk?",
    options: [
      "USER node runs the application as the unprivileged 'node' user — if an attacker compromises the app, they land as a non-root user, limiting their ability to modify system files, escalate privileges, or exploit kernel vulnerabilities that require root.",
      "USER node enables Node.js's built-in security sandbox that restricts file and network access at the runtime level — without this Dockerfile directive, Node.js runs in an unrestricted mode and the USER instruction activates the sandbox.",
      "USER node changes the container's namespace configuration from 'shared' to 'isolated' — containers running as root share the host's PID namespace by default, and switching to a non-root user activates full PID isolation.",
      "USER node applies a seccomp profile specifically tailored for Node.js applications that blocks 98% of syscalls — running as root uses Docker's permissive default profile, and the USER instruction selects the stricter language-specific filter.",
    ],
    correctIndex: 0,
    explanation:
      "Running as non-root inside containers is a key security practice. If an attacker compromises the app, they land as an unprivileged user rather than root, limiting the damage and escape possibilities.",
  },
  {
    slug: "ci-l1-compose",
    competencyId: "containers-infra",
    depthTier: 1,
    sectionHeading: "Docker Compose for multi-container apps",
    prompt: "Your Compose file defines a web service with depends_on: [db]. When you run docker compose up, the web container starts and immediately crashes because PostgreSQL in the db container is not ready to accept connections yet. Why did depends_on not prevent this?",
    options: [
      "depends_on only controls startup order — it waits for the db container to start running, but not for PostgreSQL inside it to be ready for connections; you need a healthcheck with condition: service_healthy to wait for actual service readiness.",
      "depends_on is deprecated in Compose v3 and is silently ignored by the runtime — the web container starts independently, and you must use the links directive instead, which both orders startup and verifies TCP connectivity.",
      "depends_on waits 30 seconds by default before starting the dependent service, but PostgreSQL takes longer to initialize its data directory — increasing the timeout with depends_on_timeout: 60s in the Compose file would fix this.",
      "depends_on connects the services via Unix domain sockets instead of TCP, and PostgreSQL is not configured for socket connections by default — switching the web app to connect via localhost:5432 bypasses the socket limitation.",
    ],
    correctIndex: 0,
    explanation:
      "depends_on controls startup ordering. However, it doesn't wait for the dependency to be 'healthy' unless you add a condition: service_healthy with a healthcheck. Services on the same network can reach each other by service name.",
  },

  // ── L2 ──
  {
    slug: "ci-l2-scan",
    competencyId: "containers-infra",
    depthTier: 2,
    sectionHeading: "Image scanning and vulnerability management",
    prompt: "Your CI pipeline pulls nginx:latest for production. One week later, the same :latest tag points to a different image that contains a known CVE. How does pinning by version or digest prevent this class of problem?",
    options: [
      "Tags like :latest are mutable — anyone with push access can overwrite them to point to different content; pinning to nginx:1.25.3 or a sha256 digest guarantees you deploy the exact image you tested, making builds reproducible and auditable.",
      "Pinning by version enables Docker's built-in vulnerability scanner, which is disabled for :latest tags — the scanner only activates for explicitly versioned images because it needs the version number to look up matching CVEs.",
      "Tags like :latest are cached indefinitely by the Docker daemon — pinning forces Docker to re-pull the image on every build, ensuring you always get the newest and presumably most secure version from the remote registry.",
      "Pinning by digest encrypts the image layers with a key derived from the SHA-256 hash — the encryption prevents tampering during network transit, while :latest images are transferred unencrypted and vulnerable to interception.",
    ],
    correctIndex: 0,
    explanation:
      "Pinning by tag or (better) by digest ensures you know exactly what you're deploying. Trivy and similar scanners check images against CVE databases before deployment.",
  },
  {
    slug: "ci-l2-runtime",
    competencyId: "containers-infra",
    depthTier: 2,
    sectionHeading: "Container runtime security",
    prompt: "A developer runs their container with docker run --privileged for convenience during testing. You explain that this flag nearly eliminates container isolation. What specific security boundaries does --privileged disable?",
    options: [
      "It grants all Linux capabilities, disables the default seccomp profile and AppArmor confinement, and exposes host devices (/dev) — the container can mount the host filesystem, load kernel modules, and escape isolation with minimal effort.",
      "It disables only network namespace isolation, placing the container directly on the host's network stack — all other isolation mechanisms (PID, mount, user namespaces) remain fully active and the filesystem stays separated.",
      "It enables hardware passthrough for GPU and USB devices but does not change security boundaries — the container gains access to hardware for performance workloads but its filesystem, process, and network isolation remain enforced.",
      "It maps the container's root user to UID 0 on the host instead of a remapped UID — this is the only change, and the container still has its seccomp profile, AppArmor confinement, and capability restrictions fully active.",
    ],
    correctIndex: 0,
    explanation:
      "The --privileged flag disables most isolation: all capabilities are granted, devices are accessible, and AppArmor/SELinux/seccomp restrictions are lifted. Use --cap-drop=ALL and add only needed capabilities.",
  },
  {
    slug: "ci-l2-socket",
    competencyId: "containers-infra",
    depthTier: 2,
    sectionHeading: "Docker socket and API security",
    prompt: "You discover that a CI/CD runner container has /var/run/docker.sock mounted as a volume. A colleague says this is 'basically root on the host.' How could an attacker inside this container escalate to host-level root access?",
    options: [
      "Through the Docker socket, the attacker creates a new privileged container that mounts the host's root filesystem (docker run -v /:/host alpine chroot /host) — this gives a root shell with full access to every file on the host.",
      "The Docker socket allows reading environment variables from all other containers, which typically include database passwords — the attacker uses these credentials to log into the host's SSH service as root.",
      "The Docker socket exposes the host kernel's /proc filesystem to the container — the attacker writes to /proc/sysrq-trigger to reboot the host into single-user mode, which grants a root console without a password.",
      "The Docker socket leaks the host's SSH private key through the Docker API's /info endpoint — the attacker extracts the key and uses it to SSH directly into the host as root from any network-connected machine.",
    ],
    correctIndex: 0,
    explanation:
      "With /var/run/docker.sock mounted, a container can: docker run -v /:/host -it alpine chroot /host — creating a new container that mounts the entire host root filesystem. This is a common escape vector found in CI/CD agents.",
  },
  {
    slug: "ci-l2-multistage",
    competencyId: "containers-infra",
    depthTier: 2,
    sectionHeading: "Multi-stage builds for minimal images",
    prompt: "Your production container uses ubuntu:22.04 as its base, which ships with 200+ packages including bash, curl, and apt. A security scan finds 47 CVEs. Switching to a distroless base drops the count to 3. Why the dramatic reduction?",
    options: [
      "Distroless images contain only the application and its runtime dependencies — no shell, no package manager, no system utilities — so there are far fewer packages that could have CVEs, and an attacker who gains code execution has no tools to work with.",
      "Distroless images automatically patch all CVEs by connecting to Google's vulnerability database at build time — the 3 remaining CVEs are zero-days not yet published, and they will auto-patch once publicly disclosed.",
      "Distroless images run the application in a user-space kernel similar to gVisor that emulates all syscalls — the 47 CVEs affect the real kernel only, and the distroless emulation layer is inherently immune to kernel-level bugs.",
      "Distroless images compress all libraries into a single statically-linked binary — the compression prevents vulnerability scanners from identifying individual library versions, so the scanner reports fewer findings than actually exist.",
    ],
    correctIndex: 0,
    explanation:
      "Multi-stage builds separate the build environment from runtime. Distroless images (gcr.io/distroless/) have no shell or package manager, so even if an attacker gets code execution, they have minimal tools to work with.",
  },
  {
    slug: "ci-l2-secrets",
    competencyId: "containers-infra",
    depthTier: 2,
    sectionHeading: "Secrets management in containers",
    prompt: "A developer adds COPY credentials.json /app/ in their Dockerfile, then adds RUN rm /app/credentials.json in the next instruction. They argue the secret is removed. Why is the secret still exposed in the built image?",
    options: [
      "Each Dockerfile instruction creates an immutable image layer — credentials.json exists in the COPY layer's filesystem snapshot permanently, and the RUN rm only adds a new layer that marks the file as deleted without erasing the earlier layer.",
      "Docker caches the COPY instruction's content hash for faster rebuilds — the credentials file is stored in Docker's build cache as plain text, indexed by SHA-256, and docker system df reveals the cached copy.",
      "The RUN rm command deletes the file from the container's writable layer at runtime only, not during the build — the credentials are available during the entire build phase for any subsequent RUN instruction to copy elsewhere.",
      "Docker defers file deletions until the container starts — the rm in the Dockerfile is queued as a startup command, and if the container crashes before rm executes, the credentials remain visible in the running container's filesystem.",
    ],
    correctIndex: 0,
    explanation:
      "Each Dockerfile instruction creates an immutable layer. A secret added in layer 3 and removed in layer 4 still exists in layer 3. Use BuildKit's --mount=type=secret or external secrets managers instead.",
  },

  // ── L3 ──
  {
    slug: "ci-l3-escape",
    competencyId: "containers-infra",
    depthTier: 3,
    sectionHeading: "Container escape techniques",
    prompt: "A colleague argues that containers are 'just as secure as VMs' for running untrusted code. You disagree. What fundamental architectural difference makes container escape inherently easier than VM escape?",
    options: [
      "Containers share the host kernel — a kernel exploit inside a container compromises the host directly with no guest-kernel boundary to cross; VMs add a hypervisor layer and a separate guest kernel, requiring two independent exploits to reach the host.",
      "Containers use interpreted bytecode while VMs use compiled machine code — interpreted code has more exploitable abstraction layers, whereas VM machine code runs directly on hardware with fewer intermediate attack surfaces to target.",
      "Containers store their filesystem on the host disk unencrypted, while VMs always use encrypted virtual disks — an attacker in a container can read other containers' filesystems directly through the shared unencrypted storage backend.",
      "Containers run in user mode (ring 3) while VMs run in kernel mode (ring 0) — the VM's higher privilege level gives it direct hardware control that makes escape harder, whereas containers lack any hardware-level protections.",
    ],
    correctIndex: 0,
    explanation:
      "Containers share the host kernel, so a kernel vulnerability exploited from within a container compromises the host. VMs have an additional boundary (hypervisor + guest kernel). This is why Kata Containers and gVisor exist.",
  },
  {
    slug: "ci-l3-k8s",
    competencyId: "containers-infra",
    depthTier: 3,
    sectionHeading: "Kubernetes security fundamentals",
    prompt: "You define a Kubernetes pod security context with allowPrivilegeEscalation: false, runAsNonRoot: true, and capabilities: {drop: ['ALL']}. What does the allowPrivilegeEscalation: false setting specifically prevent inside the container?",
    options: [
      "It sets the no_new_privs flag, which prevents container processes from gaining more privileges than their parent — blocking SUID binaries, capability inheritance through execve, and other mechanisms that could elevate a process's privilege level.",
      "It prevents the Kubernetes scheduler from assigning the pod to a node with higher cluster-admin privileges — the pod remains on worker nodes where the kubelet runs with reduced RBAC permissions.",
      "It restricts the container from requesting more CPU and memory resources than initially allocated — without this flag, a container could escalate its resource limits by modifying its own cgroup constraints at runtime.",
      "It prevents the pod's service account token from being upgraded to cluster-admin via RBAC — Kubernetes normally allows runtime privilege escalation through automatic service account token refresh, and this flag disables that.",
    ],
    correctIndex: 0,
    explanation:
      "Combined with dropping all capabilities, running as non-root, and a read-only root filesystem, this forms the Pod Security Standards 'restricted' profile — the hardened baseline for production Kubernetes.",
  },
  {
    slug: "ci-l3-supply",
    competencyId: "containers-infra",
    depthTier: 3,
    sectionHeading: "Image supply chain security",
    prompt: "Your deployment manifest references nginx:1.25.3. An attacker gains push access to the registry and overwrites the 1.25.3 tag with a backdoored image. How would pinning by digest instead of tag prevent this supply chain attack?",
    options: [
      "A digest (nginx@sha256:abc...) is a content-addressable hash of the image manifest — it always refers to exactly the same bytes; even if the attacker pushes a different image under the same tag, the digest-pinned deployment pulls only the original content.",
      "A digest pins the image to a specific registry mirror — the attacker's push goes to the primary registry, but digest-pinned deployments always pull from a read-only mirror that cannot be overwritten by any push operation.",
      "A digest enables Docker Content Trust (Notary) verification automatically — tagged images skip signature verification by default, but digest-pinned images are always checked against the Notary server's database before pulling.",
      "A digest locks the image to the specific Kubernetes node that first pulled it — subsequent pods on other nodes use the digest to copy the image from the original node's cache, bypassing the potentially compromised registry.",
    ],
    correctIndex: 0,
    explanation:
      "A tag like :v1.2 can be moved to a different image (tag mutability). A digest (nginx@sha256:abc...) is a hash of the content — it always refers to exactly the same image. Cosign adds cryptographic signing for verification.",
  },
  {
    slug: "ci-l3-iac",
    competencyId: "containers-infra",
    depthTier: 3,
    sectionHeading: "Infrastructure as Code security",
    prompt: "A pull request adds a Terraform resource for an S3 bucket with no encryption and a public-read ACL. The IaC scanner tfsec flags both issues before the PR is merged. What category of security defense does this represent?",
    options: [
      "Shift-left security — tfsec catches misconfigurations like public buckets, missing encryption, and open security groups in infrastructure-as-code at code-review time, preventing the insecure resource from ever being created in the cloud.",
      "Runtime intrusion detection — tfsec deploys alongside the S3 bucket and monitors API calls in real time to detect unauthorized public reads, alerting the team only if an unapproved access pattern occurs after the bucket is provisioned.",
      "Compliance reporting — tfsec generates an audit trail of all S3 bucket configurations for regulatory purposes but does not block the PR; the developer must manually decide whether to remediate based on the report's findings.",
      "Network segmentation — tfsec injects VPC routing rules into the Terraform plan that isolate the S3 bucket from the public internet, effectively overriding the public-read ACL without modifying the developer's original code.",
    ],
    correctIndex: 0,
    explanation:
      "IaC scanners shift security left by catching misconfigurations at code-review time. tfsec scans Terraform, hadolint scans Dockerfiles, kubesec scans Kubernetes manifests — all before deployment.",
  },

  // ── L4 ──
  {
    slug: "ci-l4-rootless",
    competencyId: "containers-infra",
    depthTier: 4,
    sectionHeading: "Rootless containers and gVisor",
    prompt: "Your threat model includes kernel-level container escapes. Standard containers share the host kernel, so a kernel exploit inside a container compromises the host. How does gVisor's runsc runtime mitigate this specific threat?",
    options: [
      "gVisor interposes a user-space kernel (Sentry) that intercepts and emulates syscalls — the container never talks to the real host kernel directly, so a kernel exploit targeting a Linux vulnerability hits gVisor's emulation layer, not the host.",
      "gVisor compiles each container's application to WebAssembly at runtime and executes it in a WASM sandbox — the WebAssembly virtual machine has no syscall interface, eliminating the kernel-level attack surface entirely.",
      "gVisor encrypts all syscall arguments before forwarding them to the host kernel — the kernel processes only encrypted arguments, so even if it has a vulnerability, the attacker cannot craft a meaningful exploit payload.",
      "gVisor runs each container inside a lightweight KVM virtual machine with full hardware-assisted virtualization — it is functionally identical to Kata Containers but uses Google's custom hypervisor instead of QEMU or Firecracker.",
    ],
    correctIndex: 0,
    explanation:
      "gVisor (runsc) adds a user-space kernel that emulates Linux syscalls. The container never talks to the real kernel directly. Rootless Docker/Podman further reduces blast radius by running the entire engine without root privileges.",
  },
  {
    slug: "ci-l4-falco",
    competencyId: "containers-infra",
    depthTier: 4,
    sectionHeading: "Runtime threat detection",
    prompt: "A Falco rule triggers when a shell process (bash/sh) spawns inside a production container — something that should never happen in your environment. What underlying technology lets Falco detect this event in real time with minimal performance overhead?",
    options: [
      "eBPF — Falco attaches eBPF probes to kernel tracepoints for events like process creation, file access, and network connections, observing them in real time without modifying the kernel or adding significant CPU overhead.",
      "Docker API polling — Falco queries the Docker daemon's /containers/json endpoint every second and compares the process list against its rules, detecting new shell processes within one polling interval of their creation.",
      "Filesystem inotify watches — Falco monitors /proc for new PID directories and reads /proc/[pid]/cmdline to identify shell processes; inotify provides near-instant notification when a new process creates its /proc entry.",
      "ptrace attachment — Falco attaches to every container process at startup using ptrace and intercepts all syscalls; when it detects an execve call for bash or sh, it generates an alert before allowing the syscall to complete.",
    ],
    correctIndex: 0,
    explanation:
      "Falco uses eBPF probes to observe kernel-level events. Rules match patterns like 'shell spawned in container' or 'sensitive mount detected.' It primarily detects; Tetragon can also enforce (e.g., kill the offending process).",
  },
  {
    slug: "ci-l4-forensics",
    competencyId: "containers-infra",
    depthTier: 4,
    sectionHeading: "Container forensics",
    prompt: "During an incident investigation, you run docker diff on a container named 'compromised' and see output lines like 'A /tmp/backdoor.sh' and 'C /etc/passwd'. What do the A and C prefixes indicate about the container's filesystem?",
    options: [
      "A means a file was added (did not exist in the original image) and C means a file was changed (modified compared to the image) — docker diff compares the container's writable layer against its base image, revealing what the attacker created or altered.",
      "A means the file was archived (backed up by Docker's snapshot system) and C means it was cached (stored in Docker's build cache) — both are normal runtime events and do not necessarily indicate any malicious activity.",
      "A means the file was audited (accessed and logged by Docker's built-in audit system) and C means it was checksummed (Docker computed a hash for integrity) — these are security metadata tags, not modification indicators.",
      "A marks files stored in the container's application layer and C marks files in the configuration layer — Docker separates files by purpose into logical layers, and these prefixes indicate which layer each file belongs to.",
    ],
    correctIndex: 0,
    explanation:
      "docker diff compares the container's writable layer against its base image. Combined with docker export (full filesystem tarball) and docker cp (extract specific files), it provides the forensic triage workflow.",
  },
  {
    slug: "ci-l4-cicd",
    competencyId: "containers-infra",
    depthTier: 4,
    sectionHeading: "CI/CD pipeline security",
    prompt: "Your GitHub Actions workflow runs docker build inside a container that has /var/run/docker.sock mounted for Docker-in-Docker. A malicious dependency in a PR's package.json executes code during npm install. Why is this particularly dangerous?",
    options: [
      "The malicious code has access to the Docker socket — it can create a new privileged container that mounts the host filesystem, escape the CI runner, access stored secrets and tokens, and potentially pivot to production infrastructure.",
      "The malicious code can modify the Dockerfile during the build to inject a backdoor — however, it cannot escape the container or access the host because Docker socket access only permits reading build logs.",
      "The malicious code can exhaust the CI runner's CPU and memory by spawning infinite processes — this is a denial-of-service risk, but the container's resource limits and namespace isolation prevent any access to host resources or secrets.",
      "The malicious code can push its own Docker images to the registry under the CI runner's credentials — this is the primary risk, but the container's filesystem isolation and the host machine remain fully protected from the malicious process.",
    ],
    correctIndex: 0,
    explanation:
      "CI/CD agents with Docker socket access have effective root on the build host. A supply chain attack (compromised dependency, malicious PR) executing in that context can escape the container and access secrets.",
  },

  // ── L5 ──
  {
    slug: "ci-l5-oci",
    competencyId: "containers-infra",
    depthTier: 5,
    sectionHeading: "OCI runtime specification internals",
    prompt: "CVE-2024-21626 in runc allowed container escape via a working-directory file descriptor leak. Despite affecting a single component, the vulnerability was rated critical. Why was the blast radius so large?",
    options: [
      "runc is the reference OCI runtime used by Docker, containerd, CRI-O, and nearly all major container platforms — a vulnerability in runc means almost every container deployment on every Linux host is potentially affected simultaneously.",
      "The CVE allowed attackers to modify the OCI specification itself in memory — once the spec was corrupted, all runtimes implementing it (runc, crun, youki) would generate insecure configurations until the spec document was re-published.",
      "runc has been statically linked into the Linux kernel since version 5.15 — a vulnerability in runc is effectively a kernel vulnerability, requiring a full kernel update on every affected machine to patch.",
      "The CVE affected the Go standard library's os package rather than runc specifically — since runc and all other Go-based container tools import os, the vulnerability propagated to every Go-based runtime through the shared dependency.",
    ],
    correctIndex: 0,
    explanation:
      "runc is the most widely deployed OCI runtime. Understanding the runtime spec's config.json (namespaces, capabilities, seccomp) helps identify exactly what isolation boundaries exist and where they can fail.",
  },
  {
    slug: "ci-l5-kata",
    competencyId: "containers-infra",
    depthTier: 5,
    sectionHeading: "Kata Containers and microVMs",
    prompt: "Your multi-tenant platform runs untrusted customer workloads. Standard containers share the host kernel, making kernel exploits a cross-tenant risk. You switch to Kata Containers. What isolation boundary does this add?",
    options: [
      "Each Kata container runs inside its own lightweight VM with a separate guest kernel — a kernel exploit inside the container hits the guest kernel, not the host, and the attacker must also escape the hypervisor (QEMU/Firecracker) to reach the host.",
      "Kata Containers replace Linux namespaces with hardware-enforced memory partitioning using Intel SGX enclaves — each container's memory is encrypted by the CPU, and even the host kernel cannot read the container's contents.",
      "Kata Containers deploy each container on a dedicated physical machine provisioned from a bare-metal pool — the isolation comes from physical separation, and the Kata scheduler manages hardware allocation transparently to tenants.",
      "Kata Containers run each container in a separate user-space kernel (similar to gVisor) but add TLS encryption to all syscall traffic between the container and the emulation layer, preventing exploit payloads from reaching the handler.",
    ],
    correctIndex: 0,
    explanation:
      "Kata Containers combine VM-level isolation (separate guest kernel via QEMU/Firecracker) with container-like speed (~125ms startup for Firecracker microVMs). The tradeoff is higher memory overhead per container.",
  },
  {
    slug: "ci-l5-imageinternals",
    competencyId: "containers-infra",
    depthTier: 5,
    sectionHeading: "Container image internals",
    prompt: "Your Dockerfile needs an SSH key to clone a private repository during the build. You currently use COPY id_rsa /root/.ssh/ followed by RUN rm /root/.ssh/id_rsa. A colleague suggests BuildKit's --mount=type=secret instead. Why is it safer?",
    options: [
      "BuildKit's --mount=type=secret mounts the SSH key as a tmpfs available only during that specific RUN step — it never becomes part of any image layer, unlike COPY which persists the key in the layer history even after a subsequent rm deletes it.",
      "--mount=type=secret encrypts the key with a per-layer AES key before writing it to the image layer — the key is still present in the layer history, but it is encrypted and inaccessible without the build-time decryption key.",
      "--mount=type=secret stores the SSH key in Docker Hub's built-in secrets vault, which is completely separate from the image registry — the key is pulled at runtime from the vault and is never present during the build phase at all.",
      "--mount=type=secret adds the key only to the image's final layer (not intermediate layers) — since docker history only shows intermediate layers and the final layer uses a non-inspectable compressed format, the key is effectively hidden.",
    ],
    correctIndex: 0,
    explanation:
      "BuildKit mounts secrets as temporary files available only during that RUN step. Since they never enter the layer filesystem, they can't be recovered via docker history or by unpacking layers.",
  },
  {
    slug: "ci-l5-tetragon",
    competencyId: "containers-infra",
    depthTier: 5,
    sectionHeading: "eBPF-based container security",
    prompt: "Your Falco deployment detects a container escape attempt (a shell spawned in a production container) and sends an alert, but by the time your team responds the attacker has already gained host access. How would Tetragon have changed the outcome?",
    options: [
      "Tetragon can enforce policies at the kernel level in real time — a TracingPolicy matching the shell spawn would send SIGKILL to the offending process immediately, terminating the escape attempt before it succeeds rather than merely alerting after the fact.",
      "Tetragon patches the detected vulnerability in the running kernel at runtime using eBPF hot-patching — once the escape attempt is detected, Tetragon writes a fix into the kernel's code section to prevent any further attempts of the same type.",
      "Tetragon pauses the container using the cgroup freezer when it detects the violation, then takes a memory snapshot for forensics — the container resumes only after the security team reviews the snapshot and approves or terminates it.",
      "Tetragon redirects the attacker's shell session to a honeypot container that simulates the host environment — the attacker believes they have escaped, but they are interacting with a deception environment while the real host is unaffected.",
    ],
    correctIndex: 0,
    explanation:
      "Both use eBPF for kernel-level observability. The key difference: Falco's primary mode is detect-and-alert, while Tetragon TracingPolicies can take enforcement actions (Sigkill) at the kernel level with near-zero overhead.",
  },
];
