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
    prompt: "What role does the Linux kernel play in the overall system?",
    options: [
      "It handles hardware abstraction, process scheduling, and memory management, while userspace tools provide the administrator interface.",
      "It provides the graphical desktop environment.",
      "It manages only file permissions.",
      "It is an optional component that can be replaced by systemd.",
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
    prompt: "Why is Linux administration knowledge critical for penetration testers?",
    options: [
      "Most servers run Linux, so understanding users, permissions, services, and firewall rules lets you identify misconfigurations that lead to privilege escalation or lateral movement.",
      "Linux is only used on desktops.",
      "Penetration testing never involves Linux systems.",
      "Linux has no security features to test.",
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
    prompt: "What is the SUID bit and why is it security-relevant?",
    options: [
      "A special permission bit that runs a binary as the file owner (often root), making unexpected SUID binaries a privilege escalation vector.",
      "A bit that makes a file invisible to ls.",
      "A bit that encrypts the file contents at rest.",
      "A bit that prevents a file from being deleted.",
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
    prompt: "Why is /etc/shadow readable only by root, while /etc/passwd is world-readable?",
    options: [
      "Shadow stores hashed passwords; making it root-only prevents offline cracking. Passwd stores account metadata that applications need to read.",
      "Shadow contains user home directories.",
      "Passwd stores encrypted passwords and shadow is empty.",
      "There is no difference in their permissions.",
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
    prompt: "What does the command `find / -perm -4000 -type f 2>/dev/null` search for?",
    options: [
      "All files with the SUID bit set — binaries that run as their owner, a common privilege escalation check.",
      "All files larger than 4000 bytes.",
      "All files modified in the last 4000 seconds.",
      "All directories with exactly 4000 files.",
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
    prompt: "Why is knowing which services are running important for both hardening and enumeration?",
    options: [
      "Running services define the attack surface — unnecessary services increase risk, and each listener is a potential entry point.",
      "It only matters for performance tuning.",
      "Services cannot be exploited.",
      "systemd services are always secure by default.",
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
    prompt: "Why is keeping packages up to date a primary security measure?",
    options: [
      "Unpatched services are a primary attack vector — CVE databases tie known vulnerabilities to specific package versions.",
      "Updates only change the user interface.",
      "Patches are cosmetic and don't affect security.",
      "Package managers cannot update security-related software.",
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
    prompt: "Why is disabling password authentication in favor of SSH keys recommended?",
    options: [
      "Keys are not vulnerable to brute-force or credential-stuffing attacks, unlike passwords; Ed25519 is recommended over RSA per NIST SP 800-186.",
      "SSH keys are shorter than passwords.",
      "Password authentication is faster.",
      "Keys and passwords provide identical security.",
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
    prompt: "What does setting the input chain policy to 'drop' accomplish?",
    options: [
      "All incoming packets are dropped by default unless a rule explicitly allows them — a deny-by-default posture.",
      "It allows all traffic through.",
      "It logs packets without affecting them.",
      "It only blocks ICMP traffic.",
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
    prompt: "Why can `sudo vim` lead to a root shell?",
    options: [
      "vim can execute shell commands (`:!bash`), so sudo access to vim effectively grants full root — GTFOBins catalogs such escape techniques.",
      "vim always runs as root regardless of sudo.",
      "vim has a built-in privilege escalation exploit.",
      "sudo vim only opens files, it cannot run commands.",
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
    prompt: "How can a writable cron script lead to privilege escalation?",
    options: [
      "If root's crontab runs a script that a lower-privileged user can modify, the user can inject commands that execute as root on the next schedule.",
      "Cron jobs always run as the current user.",
      "Writable scripts are automatically disabled by cron.",
      "Cron cannot execute shell scripts.",
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
    prompt: "Why is centralized logging important from a security standpoint?",
    options: [
      "It prevents attackers from covering their tracks by deleting local logs — remote log copies survive host compromise.",
      "It reduces disk usage on the server.",
      "It only matters for performance monitoring.",
      "Local logs are always sufficient for forensics.",
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
    prompt: "How does AppArmor's MAC enforcement differ from standard DAC permissions?",
    options: [
      "AppArmor confines programs to allowed resources via per-app profiles and applies even to root-owned processes, unlike DAC which only checks owner/group/other.",
      "AppArmor replaces file ownership entirely.",
      "DAC is stronger than MAC.",
      "AppArmor only affects network access.",
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
    prompt: "What does setting `kernel.yama.ptrace_scope = 1` prevent?",
    options: [
      "Non-parent processes from tracing (ptracing) other processes, blocking some injection techniques.",
      "All processes from creating files.",
      "The kernel from loading modules.",
      "Users from changing passwords.",
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
    prompt: "What does the audit rule `-w /etc/shadow -p rwa -k shadow_access` accomplish?",
    options: [
      "It watches /etc/shadow for read, write, and attribute changes, logging any access under the key 'shadow_access' for later searching.",
      "It prevents anyone from reading /etc/shadow.",
      "It encrypts the shadow file.",
      "It deletes the shadow file on access.",
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
    prompt: "What does PAM's pam_faillock module with `deny = 5` enforce?",
    options: [
      "It locks a user account after 5 consecutive failed authentication attempts, defending against brute-force attacks.",
      "It requires passwords of at least 5 characters.",
      "It allows only 5 users to exist on the system.",
      "It logs out the user after 5 minutes of inactivity.",
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
    prompt: "What does the `noexec` mount option on /tmp prevent?",
    options: [
      "Execution of any binaries from /tmp, blocking a common technique where attackers drop and run payloads in world-writable directories.",
      "Writing files to /tmp.",
      "Reading files from /tmp.",
      "Creating subdirectories in /tmp.",
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
    prompt: "How does SELinux's type enforcement (TE) policy restrict access beyond DAC?",
    options: [
      "TE defines which process types can access which file types — a confined process like httpd_t is denied access to unauthorized types even if DAC permissions allow it.",
      "TE replaces file ownership with encryption.",
      "TE only applies to network connections.",
      "TE disables all processes not explicitly listed.",
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
    prompt: "What do Linux namespaces provide that forms the foundation of container isolation?",
    options: [
      "Each namespace type isolates a different resource (PID tree, network stack, mount points, hostname, IPC, UID mapping), so a process sees only its own namespace's view.",
      "Namespaces only limit CPU usage.",
      "Namespaces provide encryption for network traffic.",
      "Namespaces are the same as cgroups.",
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
    prompt: "How does UEFI Secure Boot protect the system from rootkits?",
    options: [
      "Each component in the boot chain (firmware → shim → GRUB → kernel) must be signed with a trusted key, so a modified kernel breaks the chain and fails to boot.",
      "It encrypts the hard drive at rest.",
      "It only verifies the BIOS password.",
      "It blocks all unsigned user applications.",
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
    prompt: "What does OpenSCAP automate in the context of Linux hardening?",
    options: [
      "CIS Benchmark checks and remediation — it evaluates a system against a security profile and can automatically fix non-compliant settings.",
      "Database backups.",
      "Network packet capture.",
      "User account creation.",
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
    prompt: "Why is eBPF preferred over kernel modules for security monitoring?",
    options: [
      "eBPF programs are verified by the kernel's BPF verifier to guarantee they terminate and won't crash the kernel, making them safe for production; kernel modules have no such safety net.",
      "eBPF is slower but more accurate.",
      "Kernel modules are sandboxed but eBPF is not.",
      "eBPF cannot trace system calls.",
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
    prompt: "What makes Landlock unique among LSM implementations?",
    options: [
      "Landlock allows unprivileged processes to self-restrict their own filesystem access, enabling sandboxing without root or container overhead.",
      "Landlock requires a reboot to activate.",
      "Landlock replaces SELinux entirely.",
      "Landlock is only available on ARM processors.",
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
    prompt: "What does Linux Kernel Lockdown's 'integrity' mode prevent?",
    options: [
      "It prevents even root from modifying the running kernel — blocking unsigned module loading and raw I/O access.",
      "It only restricts network access.",
      "It disables all user accounts except root.",
      "It forces all filesystems to be read-only.",
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
    prompt: "Why are Linux capabilities preferred over SUID root for granting specific privileges?",
    options: [
      "Capabilities split root into discrete units (e.g., CAP_NET_RAW for raw sockets) so a binary gets only the privilege it needs, unlike SUID which grants full root.",
      "Capabilities are slower but more compatible.",
      "SUID is more granular than capabilities.",
      "Capabilities cannot be assigned to binaries.",
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
    prompt: "How does seccomp contribute to container isolation?",
    options: [
      "It restricts which system calls a process can make — Docker's default profile blocks ~44 dangerous syscalls (mount, reboot, etc.), forming the fourth pillar of container isolation alongside namespaces, cgroups, and capabilities.",
      "It encrypts inter-container traffic.",
      "It limits disk usage per container.",
      "It provides network address translation.",
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
    prompt: "How do containers differ from virtual machines?",
    options: [
      "Containers share the host kernel and use namespaces/cgroups for isolation, making them lightweight (millisecond startup); VMs run a full guest OS with their own kernel.",
      "Containers are identical to virtual machines.",
      "Virtual machines are faster than containers.",
      "Containers require their own kernel to function.",
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
    prompt: "Why are containers particularly useful for security testing labs?",
    options: [
      "They can quickly spin up isolated, reproducible environments — vulnerable apps like DVWA or Juice Shop — without affecting the host.",
      "Containers are inherently unhackable.",
      "They replace the need for any other security tools.",
      "Containers cannot run network services.",
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
    prompt: "What is the relationship between a container image and a running container?",
    options: [
      "An image is a read-only template; a container is a running instance of that image, with its own writable layer on top.",
      "An image and a container are the same thing.",
      "A container creates the image when it stops.",
      "Images can only be used once.",
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
    prompt: "What does `docker exec -it web bash` do?",
    options: [
      "It opens an interactive bash shell inside the running 'web' container, attaching your terminal to it (-i = interactive, -t = TTY).",
      "It restarts the container named 'web'.",
      "It creates a new container called 'web'.",
      "It removes the container named 'web'.",
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
    prompt: "Why should a Dockerfile include `USER nobody` before the CMD instruction?",
    options: [
      "It runs the application as a non-root user inside the container, reducing the impact of a compromise — a root process in a container can more easily escape to the host.",
      "It speeds up the container startup.",
      "It is purely cosmetic and has no effect.",
      "It prevents the image from being pulled by others.",
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
    prompt: "What does `depends_on` in a Compose file control?",
    options: [
      "It defines startup order — the dependent service starts only after its dependency is running (but does not guarantee the dependency is ready to accept connections).",
      "It automatically scales the dependent service.",
      "It shares environment variables between services.",
      "It merges the two services into one container.",
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
    prompt: "Why should you pin image versions (e.g., nginx:1.25.3) instead of using :latest?",
    options: [
      "Tags can be overwritten — :latest may change to a different (possibly vulnerable) version at any time, making builds non-reproducible and auditing impossible.",
      ":latest is always the most secure version.",
      "Pinned versions are slower to pull.",
      "There is no difference between :latest and a pinned version.",
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
    prompt: "Why should you never run production containers with `--privileged`?",
    options: [
      "It gives the container almost full host access — including all capabilities, device access, and the ability to escape isolation — defeating the purpose of containerization.",
      "It makes the container slower.",
      "It disables networking inside the container.",
      "Privileged mode only affects logging.",
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
    prompt: "Why is mounting the Docker socket into a container equivalent to giving it root on the host?",
    options: [
      "A container with socket access can create new privileged containers that mount the host filesystem, effectively escaping to the host with full root access.",
      "The socket only allows reading container logs.",
      "The socket provides network access only.",
      "The socket is read-only by default.",
    ],
    correctIndex: 0,
    explanation:
      "With /var/run/docker.sock mounted, a container can: `docker run -v /:/host -it alpine chroot /host` — creating a new container that mounts the entire host root filesystem. This is a common escape vector found in CI/CD agents.",
  },
  {
    slug: "ci-l2-multistage",
    competencyId: "containers-infra",
    depthTier: 2,
    sectionHeading: "Multi-stage builds for minimal images",
    prompt: "What security benefit do distroless images provide?",
    options: [
      "They contain only the application and its runtime — no shell, no package manager — significantly reducing the CVE attack surface and preventing interactive exploitation.",
      "They are larger but more compatible.",
      "They include extra debugging tools for security testing.",
      "They are identical to full Ubuntu images.",
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
    prompt: "Why can't you simply delete a secret from a later Dockerfile layer to remove it?",
    options: [
      "Docker images are built layer by layer; a secret in an earlier layer persists in the image history even if a later layer deletes the file — `docker history --no-trunc` reveals it.",
      "Later layers always overwrite earlier ones completely.",
      "Deletion in Docker is instant and permanent.",
      "Dockerfile layers cannot reference earlier layers.",
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
    prompt: "Why does a shared kernel make containers fundamentally less isolated than VMs?",
    options: [
      "A kernel exploit inside a container affects the host directly — there is no guest kernel boundary. Escape vectors include privileged mode, excessive capabilities, mounted sockets, and kernel CVEs.",
      "Containers and VMs share the same kernel.",
      "The kernel has no security-relevant role in isolation.",
      "Container kernels are more secure than VM kernels.",
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
    prompt: "What does `allowPrivilegeEscalation: false` in a Kubernetes pod security context prevent?",
    options: [
      "It prevents a container process from gaining more privileges than its parent — blocking SUID binaries and other escalation mechanisms inside the container.",
      "It prevents pods from scaling horizontally.",
      "It blocks all network traffic to the pod.",
      "It disables pod logging.",
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
    prompt: "Why should production images be pinned by digest rather than by tag?",
    options: [
      "Digests are content-addressable and immutable (sha256 of the manifest), while tags can be overwritten to point to different content — a supply chain attack vector.",
      "Digests are shorter than tags.",
      "Tags are more secure than digests.",
      "Digests only work with private registries.",
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
    prompt: "What type of issues do IaC scanners like tfsec and hadolint catch?",
    options: [
      "Security misconfigurations — public S3 buckets, open security groups, running as root in Dockerfiles, unencrypted storage — before they reach production.",
      "They only check syntax errors.",
      "They test application performance.",
      "They scan for malware in container images.",
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
    prompt: "How does gVisor provide stronger isolation than standard containers?",
    options: [
      "gVisor intercepts syscalls in a user-space kernel, so even if a container escape exploit exists, it hits gVisor's syscall emulation rather than the real host kernel.",
      "gVisor encrypts all container network traffic.",
      "gVisor is a type of antivirus for containers.",
      "gVisor removes all capabilities from containers.",
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
    prompt: "What does Falco use under the hood to detect anomalous container behavior?",
    options: [
      "eBPF — it traces kernel events (process creation, file access, network connections) in real time with near-zero overhead.",
      "It periodically scans container images for CVEs.",
      "It monitors DNS queries only.",
      "It reads container log files.",
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
    prompt: "What does `docker diff` show during an incident investigation?",
    options: [
      "Filesystem changes relative to the original image — added (A), changed (C), and deleted (D) files — revealing what the attacker modified at a glance.",
      "Network traffic logs for the container.",
      "CPU usage over time.",
      "The Dockerfile used to build the image.",
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
    prompt: "Why is giving CI runners Docker socket access dangerous?",
    options: [
      "A compromised build step can use the socket to create privileged containers, escape to the host, and pivot to production infrastructure.",
      "It only slows down the build.",
      "CI runners cannot use Docker sockets.",
      "Docker socket access is always read-only in CI.",
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
    prompt: "Why was the runc CVE-2024-21626 (working directory escape) so critical?",
    options: [
      "runc is the reference OCI runtime used by Docker and most container engines — a vulnerability in it affects nearly all container deployments, allowing escape from the container to the host.",
      "It only affected a single obscure container runtime.",
      "It was a denial-of-service issue with no privilege impact.",
      "It required physical access to the host to exploit.",
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
    prompt: "What isolation advantage do Kata Containers provide over standard containers?",
    options: [
      "Each container runs in its own lightweight VM with a separate guest kernel, so a kernel exploit inside the container hits the guest kernel, not the host.",
      "Kata Containers use the same kernel as the host.",
      "They provide no additional isolation.",
      "Kata Containers are only for Windows workloads.",
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
    prompt: "Why does BuildKit's `--mount=type=secret` prevent secrets from leaking into image layers?",
    options: [
      "The secret is mounted into the build step as a tmpfs — it never becomes part of any image layer, unlike ENV or COPY which persist in the layer history.",
      "It encrypts the entire image.",
      "It deletes the secret from the source system.",
      "It only works with Docker Hub images.",
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
    prompt: "How does Tetragon differ from Falco in its approach to container security?",
    options: [
      "Tetragon can enforce policies at the kernel level — killing processes that violate rules in real time — while Falco primarily detects and alerts.",
      "Tetragon only works on ARM processors.",
      "Falco is more powerful than Tetragon in all cases.",
      "Tetragon does not use eBPF.",
    ],
    correctIndex: 0,
    explanation:
      "Both use eBPF for kernel-level observability. The key difference: Falco's primary mode is detect-and-alert, while Tetragon TracingPolicies can take enforcement actions (Sigkill) at the kernel level with near-zero overhead.",
  },
];
