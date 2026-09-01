import type { SeedExercise } from "./types";

/** ad-fundamentals L0–L5 — one comprehension MCQ per teaching section. */
export const AD_EXERCISES: SeedExercise[] = [
  // ── L0 ──
  {
    slug: "ad-l0-what",
    competencyId: "ad-fundamentals",
    depthTier: 0,
    sectionHeading: "What is Active Directory",
    prompt: "Why is a Domain Controller such a high-value target?",
    options: [
      "Compromising a DC means controlling authentication and authorization for every account and machine in the domain.",
      "It stores the company's financial records.",
      "It is the only machine with internet access.",
      "It runs the company website.",
    ],
    correctIndex: 0,
    explanation:
      "AD centralizes authentication/authorization in a hierarchical database; owning a DC means owning the domain. Nearly every enterprise Windows environment depends on it, which is why it's a top pentest objective.",
  },
  {
    slug: "ad-l0-why",
    competencyId: "ad-fundamentals",
    depthTier: 0,
    sectionHeading: "Why AD matters for security",
    prompt: "How do AD attacks typically progress?",
    options: [
      "They chain: enumerate → credential access → lateral movement → domain admin.",
      "A single exploit instantly grants domain admin with no steps.",
      "They only work from outside the network.",
      "They require physical access to every machine.",
    ],
    correctIndex: 0,
    explanation:
      "AD compromise is a chain of steps, and tools like BloodHound map those paths across thousands of objects. Kerberos's design weaknesses are frequently part of the chain.",
  },
  {
    slug: "ad-l0-vocab",
    competencyId: "ad-fundamentals",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt: "What is a Service Principal Name (SPN)?",
    options: [
      "An identifier for a service instance, used by Kerberos to issue service tickets.",
      "The password of a service account.",
      "A group that contains all service accounts.",
      "The DNS name of the domain controller.",
    ],
    correctIndex: 0,
    explanation:
      "An SPN maps a service instance to the account running it, so Kerberos can issue a ticket for it — which is exactly what Kerberoasting abuses. Other core terms: forest, domain, GPO, LDAP, KDC.",
  },
  // ── L1 ──
  {
    slug: "ad-l1-structure",
    competencyId: "ad-fundamentals",
    depthTier: 1,
    sectionHeading: "AD structure and objects",
    prompt: "What is an Organizational Unit (OU) in Active Directory?",
    options: [
      "A container for organizing objects (users, computers) and applying Group Policy.",
      "A security group that grants domain admin rights.",
      "The physical server running AD.",
      "A synonym for a forest.",
    ],
    correctIndex: 0,
    explanation:
      "OUs organize objects and are where GPOs are applied. Key object types are users, computers (machine accounts with rotating passwords), and groups (nesting creates complex permission chains).",
  },
  {
    slug: "ad-l1-kerberos-flow",
    competencyId: "ad-fundamentals",
    depthTier: 1,
    sectionHeading: "Kerberos authentication flow",
    prompt: "Why can an attacker who obtains the krbtgt hash forge tickets for any user?",
    options: [
      "The KDC encrypts every TGT with the krbtgt hash, so knowing it lets you mint valid TGTs — a Golden Ticket.",
      "The krbtgt hash is the domain admin's password.",
      "krbtgt disables Kerberos entirely.",
      "It reveals every user's plaintext password.",
    ],
    correctIndex: 0,
    explanation:
      "The KDC trusts a TGT because only it (via krbtgt) can produce one. Steal the krbtgt hash and you can forge TGTs for anyone — the Golden Ticket attack. The flow is AS-REQ/REP → TGS-REQ/REP → AP-REQ.",
  },
  {
    slug: "ad-l1-enum",
    competencyId: "ad-fundamentals",
    depthTier: 1,
    sectionHeading: "Basic enumeration commands",
    prompt: "Which protocol do tools like ldapsearch and crackmapexec use to query AD objects?",
    options: [
      "LDAP (against the domain controller).",
      "SMTP.",
      "SNMP.",
      "FTP.",
    ],
    correctIndex: 0,
    explanation:
      "LDAP is how clients query the directory (users, groups, computers). With valid credentials, ldapsearch/crackmapexec/PowerShell AD cmdlets enumerate the domain; net and nltest work from domain-joined Windows.",
  },
  {
    slug: "ad-l1-ntlm-kerberos",
    competencyId: "ad-fundamentals",
    depthTier: 1,
    sectionHeading: "NTLM vs Kerberos",
    prompt: "Which is a key difference between NTLM and Kerberos?",
    options: [
      "NTLM is challenge-response (no DC required and relay-able); Kerberos is ticket-based and provides mutual authentication.",
      "Kerberos sends the password in cleartext; NTLM does not.",
      "NTLM is the default in modern AD; Kerberos is legacy.",
      "Kerberos cannot be used inside a domain.",
    ],
    correctIndex: 0,
    explanation:
      "Kerberos is the primary AD protocol (ticket-based, mutual auth, needs a KDC); NTLM is the legacy fallback, vulnerable to relay and pass-the-hash. NTLM relay remains one of the most effective AD attack vectors.",
  },
  // ── L2 ──
  {
    slug: "ad-l2-bloodhound",
    competencyId: "ad-fundamentals",
    depthTier: 2,
    sectionHeading: "BloodHound for attack path mapping",
    prompt: "What does BloodHound reveal that manual enumeration easily misses?",
    options: [
      "Non-obvious privilege chains (User A → Group B has GenericAll on User C who is a Domain Admin) across thousands of objects.",
      "The plaintext passwords of all users.",
      "The physical location of each server.",
      "The domain's internet bandwidth.",
    ],
    correctIndex: 0,
    explanation:
      "BloodHound ingests AD relationships (collected by SharpHound/bloodhound-python) and graphs shortest paths to Domain Admin, each edge being an exploitable step.",
  },
  {
    slug: "ad-l2-kerberoasting",
    competencyId: "ad-fundamentals",
    depthTier: 2,
    sectionHeading: "Kerberoasting",
    prompt: "Why does Kerberoasting work, and why is it stealthy?",
    options: [
      "A service ticket is encrypted with the service account's hash, so any user can request one and crack it offline — no failed logins or lockouts.",
      "It exploits a buffer overflow in the KDC.",
      "It requires domain admin rights to start.",
      "It brute-forces passwords directly against the DC.",
    ],
    correctIndex: 0,
    explanation:
      "Any authenticated user can request TGS tickets for accounts with SPNs; the ticket is encrypted with the account's NTLM hash, so a weak service password cracks offline (hashcat mode 13100) with no noise on the DC.",
  },
  {
    slug: "ad-l2-asrep",
    competencyId: "ad-fundamentals",
    depthTier: 2,
    sectionHeading: "AS-REP Roasting",
    prompt: "Which accounts are targeted by AS-REP Roasting?",
    options: [
      "Accounts with Kerberos pre-authentication disabled — their AS-REP contains crackable, hash-encrypted data requestable without credentials.",
      "Accounts that are members of Domain Admins only.",
      "Accounts with no SPN set.",
      "Disabled computer accounts.",
    ],
    correctIndex: 0,
    explanation:
      "With pre-auth off, the KDC returns an AS-REP encrypted with the user's hash to anyone who asks, enabling offline cracking (hashcat 18200) from just a username list — no prior credentials needed.",
  },
  {
    slug: "ad-l2-pth",
    competencyId: "ad-fundamentals",
    depthTier: 2,
    sectionHeading: "Pass-the-Hash and overpass-the-hash",
    prompt: "Why does Pass-the-Hash work without knowing the plaintext password?",
    options: [
      "NTLM authentication uses the NT hash itself as the secret, so possessing the hash is equivalent to possessing the credential.",
      "The hash can be trivially reversed to the password.",
      "Windows accepts any hash as valid.",
      "It only works if the password is blank.",
    ],
    correctIndex: 0,
    explanation:
      "NTLM never checks the plaintext — the NT hash is what the challenge-response is computed from. So a stolen hash is replayed directly (PtH), or turned into a Kerberos TGT via overpass-the-hash for stealthier, Kerberos-only access.",
  },
  {
    slug: "ad-l2-cred-dump",
    competencyId: "ad-fundamentals",
    depthTier: 2,
    sectionHeading: "Credential dumping",
    prompt: "What does Mimikatz's sekurlsa::logonpasswords read credentials from?",
    options: [
      "The memory of the LSASS process on a compromised host.",
      "The domain controller's disk over the network.",
      "The user's browser saved-password store.",
      "The BIOS firmware.",
    ],
    correctIndex: 0,
    explanation:
      "LSASS caches credential material in memory; Mimikatz extracts plaintext and hashes from it (or from an offline LSASS dump). secretsdump pulls SAM/LSA secrets and, with rights, the whole NTDS.dit.",
  },
  // ── L3 ──
  {
    slug: "ad-l3-tickets",
    competencyId: "ad-fundamentals",
    depthTier: 3,
    sectionHeading: "Golden and Silver Tickets",
    prompt: "How does a Silver Ticket differ from a Golden Ticket?",
    options: [
      "A Silver Ticket is forged with a service account's hash and grants access only to that service (and never touches the DC); a Golden Ticket uses krbtgt for domain-wide access.",
      "A Silver Ticket grants Enterprise Admin across the forest.",
      "A Silver Ticket is issued legitimately by the KDC.",
      "There is no difference; the terms are interchangeable.",
    ],
    correctIndex: 0,
    explanation:
      "Golden Tickets forge TGTs with the krbtgt hash (domain-wide, persists until krbtgt is rotated twice). Silver Tickets forge service tickets with a service account's hash — narrower but stealthier since the DC isn't contacted.",
  },
  {
    slug: "ad-l3-dcsync",
    competencyId: "ad-fundamentals",
    depthTier: 3,
    sectionHeading: "DCSync attack",
    prompt: "What does the DCSync attack abuse to obtain password hashes?",
    options: [
      "The Directory Replication Service protocol — it asks a DC to replicate account hashes as if it were another DC.",
      "A buffer overflow in the LDAP service.",
      "Physical theft of the DC's disk.",
      "A misconfigured web server on the DC.",
    ],
    correctIndex: 0,
    explanation:
      "With DS-Replication-Get-Changes rights (Domain Admins have them by default), secretsdump/Mimikatz request replication of secrets like the krbtgt hash. Detection watches Event ID 4662 replication requests from non-DC sources.",
  },
  {
    slug: "ad-l3-adcs",
    competencyId: "ad-fundamentals",
    depthTier: 3,
    sectionHeading: "AD CS attacks (Certifried / ESC1-ESC8)",
    prompt: "What does the ESC1 AD CS misconfiguration allow?",
    options: [
      "A template that lets the requester supply an arbitrary Subject Alternative Name, so a low-priv user requests a certificate as Domain Admin.",
      "Reading every user's password from the CA.",
      "Disabling Kerberos on the domain.",
      "Deleting the certificate authority.",
    ],
    correctIndex: 0,
    explanation:
      "ESC1 templates let the requester specify the SAN, so you can obtain a cert authenticating as any user (then certipy auth returns their hash). ESC8/ESC11 are NTLM relays to enrollment; ESC9/ESC13 abuse missing security extensions and policy OIDs.",
  },
  {
    slug: "ad-l3-delegation",
    competencyId: "ad-fundamentals",
    depthTier: 3,
    sectionHeading: "Delegation attacks",
    prompt: "Why is unconstrained delegation dangerous?",
    options: [
      "A machine with it caches the TGTs of users who authenticate to it, so coercing a privileged account (e.g. a DC) yields its TGT.",
      "It disables password expiry for all users.",
      "It grants every user local admin.",
      "It exposes the domain over the internet.",
    ],
    correctIndex: 0,
    explanation:
      "Unconstrained delegation lets a service impersonate users anywhere by holding their TGTs; coercion (e.g. the printer bug) forces a DC to authenticate, capturing its TGT. Constrained delegation and RBCD are abused via S4U.",
  },
  {
    slug: "ad-l3-trusts",
    competencyId: "ad-fundamentals",
    depthTier: 3,
    sectionHeading: "Trust attacks and forest compromise",
    prompt: "How can compromising a child domain lead to forest-wide compromise?",
    options: [
      "Forging a Golden Ticket in the child that includes the Enterprise Admins SID via SID History, exploiting the intra-forest trust.",
      "Child domains automatically own the forest root.",
      "By resetting the forest root's DNS.",
      "Trusts prevent any cross-domain access, so it cannot.",
    ],
    correctIndex: 0,
    explanation:
      "The forest — not the domain — is the security boundary. A child Domain Admin can add the Enterprise Admins SID (SID History / extra-sid) to a forged ticket, escalating across the trust to the forest root.",
  },
  // ── L4 ──
  {
    slug: "ad-l4-sccm",
    competencyId: "ad-fundamentals",
    depthTier: 4,
    sectionHeading: "SCCM and MECM exploitation",
    prompt: "Why are SCCM Network Access Account (NAA) credentials a valuable target?",
    options: [
      "They are deployed to all clients and are often over-privileged, so recovering them yields broad access.",
      "They are the domain admin's personal password.",
      "They unlock the BitLocker keys of every laptop.",
      "They are stored only on the domain controller.",
    ],
    correctIndex: 0,
    explanation:
      "SCCM/MECM manages software across the domain and is frequently misconfigured; the NAA creds pushed to every client are commonly overprivileged. SharpSCCM recovers them and abuses distribution points.",
  },
  {
    slug: "ad-l4-laps-gmsa",
    competencyId: "ad-fundamentals",
    depthTier: 4,
    sectionHeading: "LAPS and gMSA credential theft",
    prompt: "What does LAPS store in AD, and what is the attacker's goal?",
    options: [
      "Randomized local administrator passwords per machine; read access to ms-Mcs-AdmPwd yields those local admin passwords.",
      "The domain admin's Kerberos ticket.",
      "The forest root's krbtgt hash.",
      "Every user's browser cookies.",
    ],
    correctIndex: 0,
    explanation:
      "LAPS randomizes each machine's local admin password and stores it in AD; if you can read ms-Mcs-AdmPwd you recover those passwords. gMSA passwords (msDS-ManagedPassword) are similarly readable by authorized principals.",
  },
  {
    slug: "ad-l4-shadow-creds",
    competencyId: "ad-fundamentals",
    depthTier: 4,
    sectionHeading: "Shadow credentials and Key Trust",
    prompt: "Why are Shadow Credentials stealthier than resetting a target's password?",
    options: [
      "They add a key to msDS-KeyCredentialLink, letting you authenticate as the target while its password stays unchanged (and the key can be removed afterward).",
      "They delete the target account entirely.",
      "They require the target's plaintext password first.",
      "They only work on disabled accounts.",
    ],
    correctIndex: 0,
    explanation:
      "Writing to msDS-KeyCredentialLink (used by Windows Hello for Business) lets you obtain a certificate and authenticate as the victim without changing their password — quiet, and reversible. pywhisker/Whisker automate it.",
  },
  {
    slug: "ad-l4-persistence",
    competencyId: "ad-fundamentals",
    depthTier: 4,
    sectionHeading: "AD persistence mechanisms",
    prompt: "How does AdminSDHolder abuse provide persistence?",
    options: [
      "Modifying the AdminSDHolder ACL propagates permissions (via SDProp, ~hourly) to all protected groups like Domain Admins.",
      "It disables logging on every DC.",
      "It resets the krbtgt password automatically.",
      "It hides the attacker's process from Task Manager.",
    ],
    correctIndex: 0,
    explanation:
      "SDProp periodically stamps the AdminSDHolder ACL onto protected groups, so a backdoor ACE there re-grants control over Domain/Enterprise Admins even after cleanup. Golden Tickets, DCSync rights, Skeleton Key, and GPO abuse are other persistence paths.",
  },
  {
    slug: "ad-l4-azure",
    competencyId: "ad-fundamentals",
    depthTier: 4,
    sectionHeading: "Azure AD / Entra ID attacks in hybrid environments",
    prompt: "Why is the Azure AD Connect server a prime target in hybrid environments?",
    options: [
      "With Password Hash Sync it holds DCSync-level rights, so compromising it is equivalent to DCSync without touching a DC.",
      "It stores every user's MFA seed in plaintext.",
      "It is the only server with a public IP.",
      "It runs the corporate website.",
    ],
    correctIndex: 0,
    explanation:
      "Azure AD Connect bridges on-prem AD and Entra ID; with PHS its service account has replication rights, so owning the Connect server yields domain hashes. PRT theft, consent-grant phishing, and dangerous cloud roles are the cloud-side vectors.",
  },
  // ── L5 ──
  {
    slug: "ad-l5-ntds",
    competencyId: "ad-fundamentals",
    depthTier: 5,
    sectionHeading: "NTDS.dit internals",
    prompt: "Why do you need both NTDS.dit and the SYSTEM hive to extract hashes offline?",
    options: [
      "The stored hashes are encrypted with the PEK, which is derived from the SYSTEM hive's BOOTKEY.",
      "NTDS.dit only contains usernames; SYSTEM holds the passwords.",
      "The SYSTEM hive is the backup of NTDS.dit.",
      "Both files must be present to satisfy licensing.",
    ],
    correctIndex: 0,
    explanation:
      "NTDS.dit is the AD database (ESE/JET Blue) whose password hashes are encrypted by the Password Encryption Key, itself derived from the SYSTEM hive's BOOTKEY — so both are required. secretsdump -ntds ... -system ... does the offline extraction.",
  },
  {
    slug: "ad-l5-kerberos-internals",
    competencyId: "ad-fundamentals",
    depthTier: 5,
    sectionHeading: "Kerberos protocol internals",
    prompt: "What is the PAC inside a Kerberos ticket, and why does it matter for Silver Tickets?",
    options: [
      "The Privilege Attribute Certificate carries the user's SIDs/group memberships; services historically skipped KDC-side PAC validation, enabling Silver Ticket forgery.",
      "It is the ticket's expiration timestamp only.",
      "It is the user's plaintext password.",
      "It is the DC's TLS certificate.",
    ],
    correctIndex: 0,
    explanation:
      "The PAC encodes authorization data (SIDs, groups). Many services verified only the server checksum, not the KDC checksum, so a forged service ticket's PAC was trusted (Silver Ticket). Server 2022 added a ticket checksum to harden this.",
  },
  {
    slug: "ad-l5-dpapi",
    competencyId: "ad-fundamentals",
    depthTier: 5,
    sectionHeading: "DPAPI architecture",
    prompt: "Why is the domain DPAPI backup key so powerful for an attacker with Domain Admin?",
    options: [
      "It can decrypt any user's DPAPI master keys, giving persistent domain-wide access to saved secrets (passwords, certs, Wi-Fi keys).",
      "It is the krbtgt hash in disguise.",
      "It disables DPAPI for the whole domain.",
      "It only decrypts the current user's data.",
    ],
    correctIndex: 0,
    explanation:
      "DPAPI protects user secrets via master keys derived from the user's password, with a domain backup key stored on the DC. Exporting that backup key (lsadump::backupkeys) decrypts every user's master keys — a durable secret-access foothold.",
  },
  {
    slug: "ad-l5-boundaries",
    competencyId: "ad-fundamentals",
    depthTier: 5,
    sectionHeading: "AD security boundaries and trust model",
    prompt: "What is Microsoft's actual security boundary in Active Directory?",
    options: [
      "The forest — not the domain; true isolation requires separate forests.",
      "The individual domain.",
      "The organizational unit.",
      "The single computer account.",
    ],
    correctIndex: 0,
    explanation:
      "Because a child-domain admin can reach the forest root (SID History) and Schema/Configuration partitions are forest-wide, the forest is the boundary. Hybrid Entra ID integration (Azure AD Connect, PHS/PTA, seamless SSO) adds new bridges.",
  },
];
