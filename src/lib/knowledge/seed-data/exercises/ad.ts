import type { SeedExercise } from "./types";

/** ad-fundamentals L0–L5 — one comprehension MCQ per teaching section. */
export const AD_EXERCISES: SeedExercise[] = [
  // ── L0 ──
  {
    slug: "ad-l0-what",
    competencyId: "ad-fundamentals",
    depthTier: 0,
    sectionHeading: "What is Active Directory",
    prompt:
      "During an internal pentest, you gain initial access to a domain-joined workstation. Your team lead says the Domain Controller is the top-priority target. Why is compromising a DC so valuable?",
    options: [
      "The DC hosts the AD database (NTDS.dit) that controls authentication and authorization for every user, computer, and service in the domain, so compromising it means controlling the entire Windows environment.",
      "The DC is the only machine on the network with a public IP address, so compromising it lets you pivot from the internal network to the internet-facing infrastructure and attack external targets directly.",
      "The DC runs all business applications and stores the organization's intellectual property in its local filesystem, so compromising it gives direct access to source code repositories and financial databases.",
      "The DC manages the company's DNS and DHCP services exclusively, and controlling DNS lets you redirect all employee web traffic to phishing pages without needing any additional credentials or lateral movement.",
    ],
    correctIndex: 0,
    explanation:
      "AD centralizes authentication/authorization in a hierarchical database; owning a DC means owning the domain. Nearly every enterprise Windows environment depends on it, making it the top pentest objective.",
  },
  {
    slug: "ad-l0-why",
    competencyId: "ad-fundamentals",
    depthTier: 0,
    sectionHeading: "Why AD matters for security",
    prompt:
      "You are briefing a client on why their AD environment needs a security assessment. They ask how attackers typically go from a single compromised workstation to full domain control. What is the standard progression?",
    options: [
      "Attackers chain steps: enumerate AD objects and relationships, harvest or crack credentials, move laterally to higher-privilege machines, and escalate until reaching Domain Admin through a sequence of exploitable edges.",
      "Attackers use a single kernel exploit on the compromised workstation that directly elevates to Domain Admin, because Windows domain membership inherits all privileges from the Domain Controller automatically.",
      "Attackers exfiltrate the entire AD database over DNS by querying each LDAP attribute as a DNS TXT record, reconstructing the NTDS.dit file externally and cracking all passwords without any lateral movement.",
      "Attackers install a rogue Domain Controller on the compromised workstation using dcpromo, which triggers automatic replication of all credentials from the legitimate DC to the attacker-controlled machine directly.",
    ],
    correctIndex: 0,
    explanation:
      "AD compromise is a chain of steps, and tools like BloodHound map those paths across thousands of objects. Understanding this progression is why AD assessments test each link in the chain.",
  },
  {
    slug: "ad-l0-vocab",
    competencyId: "ad-fundamentals",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt:
      "While enumerating a domain, you see that the SQL service account has an SPN of MSSQLSvc/db01.corp.local:1433 registered. What does this Service Principal Name represent and why is it security-relevant?",
    options: [
      "It uniquely identifies the SQL Server service instance so Kerberos can issue service tickets for it; attackers can request this ticket and attempt to crack the service account's password offline (Kerberoasting).",
      "It is the DNS hostname that clients use to connect to the SQL server; it has no relationship to Kerberos authentication and is only used by the browser to validate the server's TLS certificate during connections.",
      "It is a security group membership indicator showing that the SQL account belongs to the MSSQLSvc group, which grants it network permission to accept connections on port 1433 through the domain's firewall.",
      "It is a Group Policy setting applied to the SQL server that restricts which user accounts can log in to the database, functioning as an access control list managed by the Domain Controller's GPO engine.",
    ],
    correctIndex: 0,
    explanation:
      "An SPN maps a service instance to the account running it so Kerberos can issue a ticket for it. This is exactly what Kerberoasting abuses: any authenticated user can request the ticket and attempt offline cracking.",
  },
  // ── L1 ──
  {
    slug: "ad-l1-structure",
    competencyId: "ad-fundamentals",
    depthTier: 1,
    sectionHeading: "AD structure and objects",
    prompt:
      "An administrator creates two OUs named 'Engineering' and 'Finance' and applies different Group Policy Objects to each. What is the purpose of Organizational Units in this context?",
    options: [
      "OUs are logical containers that organize AD objects (users, computers, groups) and serve as the targets for Group Policy application, allowing different security policies and configurations per department or function.",
      "OUs are authentication realms that each maintain their own Kerberos KDC and NTDS.dit database, so users in the Engineering OU authenticate against a separate Domain Controller than users in Finance.",
      "OUs are network segments that each correspond to a dedicated VLAN, and Group Policy Objects applied to an OU configure the switch ports and firewall rules for that specific network segment automatically.",
      "OUs are security boundaries equivalent to separate domains, meaning a compromise of the Engineering OU cannot spread to the Finance OU because each OU maintains its own independent trust relationship and forest.",
    ],
    correctIndex: 0,
    explanation:
      "OUs organize objects and are where GPOs are applied. They are logical containers, not security boundaries. Key object types include users, computers (machine accounts), and groups (nesting creates complex permission chains).",
  },
  {
    slug: "ad-l1-kerberos-flow",
    competencyId: "ad-fundamentals",
    depthTier: 1,
    sectionHeading: "Kerberos authentication flow",
    prompt:
      "An attacker extracts the krbtgt account hash from a compromised Domain Controller. A colleague says this means the attacker can now impersonate any user in the domain indefinitely. What is the technical basis for this claim?",
    options: [
      "The KDC encrypts every TGT with the krbtgt hash, so possessing that hash lets the attacker forge valid Ticket Granting Tickets for any user — the Golden Ticket attack — which remain valid until krbtgt is rotated twice.",
      "The krbtgt hash is used to encrypt the NTDS.dit database at rest, so possessing it lets the attacker decrypt every stored password hash, effectively giving them the plaintext password of every domain user.",
      "The krbtgt account has an implicit membership in the Domain Admins group that cannot be removed, so logging in with the krbtgt hash grants the attacker full administrative access to every domain-joined machine.",
      "The krbtgt hash is the master seed for all Kerberos session keys, so possessing it lets the attacker decrypt any currently active Kerberos session and hijack existing connections between users and services.",
    ],
    correctIndex: 0,
    explanation:
      "The KDC trusts a TGT because only it (via krbtgt) can produce one. Steal the krbtgt hash and you can forge TGTs for anyone — the Golden Ticket attack. The flow is AS-REQ/REP, TGS-REQ/REP, AP-REQ.",
  },
  {
    slug: "ad-l1-enum",
    competencyId: "ad-fundamentals",
    depthTier: 1,
    sectionHeading: "Basic enumeration commands",
    prompt:
      "You have valid domain credentials and run ldapsearch against the Domain Controller to list all user objects, groups, and computer accounts. What protocol is ldapsearch using to query the AD directory?",
    options: [
      "LDAP (Lightweight Directory Access Protocol): the standard protocol for querying and modifying the AD directory service, which stores all domain objects in a hierarchical database on the Domain Controller.",
      "SNMP (Simple Network Management Protocol): a protocol designed for monitoring network devices that AD extends to serve directory queries, using community strings as the authentication mechanism for user lookups.",
      "WMI (Windows Management Instrumentation): a Windows-native RPC protocol that AD uses exclusively for directory queries, wrapping DCOM calls in Kerberos tickets to authenticate each search query to the DC.",
      "SMB (Server Message Block): a file-sharing protocol that AD repurposes for directory queries by encoding LDAP-style search filters as named pipe commands sent to the DC's IPC$ administrative share on port 445.",
    ],
    correctIndex: 0,
    explanation:
      "LDAP is how clients query the directory (users, groups, computers). With valid credentials, ldapsearch, crackmapexec, and PowerShell AD cmdlets enumerate the domain over LDAP.",
  },
  {
    slug: "ad-l1-ntlm-kerberos",
    competencyId: "ad-fundamentals",
    depthTier: 1,
    sectionHeading: "NTLM vs Kerberos",
    prompt:
      "During a pentest you capture an NTLM authentication exchange using Responder and relay it to another service with ntlmrelayx. A colleague asks why the same relay technique does not work against Kerberos authentication. What is the key difference?",
    options: [
      "NTLM is a challenge-response protocol where the exchange is not bound to a specific service, so it can be relayed to any target; Kerberos issues tickets for specific services and provides mutual authentication, preventing relay.",
      "NTLM encrypts the entire authentication exchange with the server's public key, which can be intercepted and forwarded; Kerberos uses one-time session tokens that expire before they can be captured and replayed.",
      "NTLM sends the user's password hash directly to the server in each authentication attempt, which can be forwarded; Kerberos never transmits any credential material over the network at all during the authentication flow.",
      "NTLM requires the Domain Controller to validate each authentication request centrally, creating a relay window; Kerberos validates credentials locally on each server without contacting the DC at any point.",
    ],
    correctIndex: 0,
    explanation:
      "Kerberos is ticket-based with mutual authentication and service-specific tickets; NTLM is challenge-response, lacks mutual auth, and is vulnerable to relay. NTLM relay remains one of the most effective AD attack vectors.",
  },
  // ── L2 ──
  {
    slug: "ad-l2-bloodhound",
    competencyId: "ad-fundamentals",
    depthTier: 2,
    sectionHeading: "BloodHound for attack path mapping",
    prompt:
      "After running SharpHound, you load the data into BloodHound and find a path: User A is a member of Group B, which has GenericAll on User C, who is a member of Domain Admins. Why would this chain be nearly impossible to discover manually?",
    options: [
      "BloodHound graphs thousands of AD relationships and computes shortest paths to high-value targets; this kind of multi-hop privilege chain through nested group memberships and ACL edges is invisible to manual LDAP queries or net commands.",
      "BloodHound decrypts the Kerberos tickets of all domain users to reveal their effective permissions, which manual tools cannot do because only the KDC has the decryption keys needed to read inside ticket contents.",
      "BloodHound scans every machine in the domain for running processes and open ports to map full network connectivity, a task that would take days with nmap and requires local administrative access to each host.",
      "BloodHound accesses the Domain Controller's security audit log (Event ID 4624) to replay all historical login sessions, reconstructing exactly who authenticated where, which requires the DC's event forwarding API.",
    ],
    correctIndex: 0,
    explanation:
      "BloodHound ingests AD relationships (collected by SharpHound/bloodhound-python) and graphs shortest paths to Domain Admin, each edge being an exploitable step. Multi-hop chains across thousands of objects are its strength.",
  },
  {
    slug: "ad-l2-kerberoasting",
    competencyId: "ad-fundamentals",
    depthTier: 2,
    sectionHeading: "Kerberoasting",
    prompt:
      "With a standard domain user account, you request a TGS ticket for a service account with an SPN, extract the ticket, and crack it offline with hashcat. No alerts fire on the DC. Why does Kerberoasting work and remain stealthy?",
    options: [
      "Any authenticated user can request a service ticket for any SPN; the ticket is encrypted with the service account's NTLM hash, so cracking happens offline with no failed logins, lockouts, or suspicious authentication events on the DC.",
      "Kerberoasting exploits a vulnerability in the KDC that bypasses ticket encryption entirely, returning the service account's password in plaintext inside the TGS-REP, which is why no authentication failure events are logged.",
      "Kerberoasting intercepts the service account's TGT from network traffic using ARP spoofing, and since the capture is entirely passive, neither the DC nor the service account detects any authentication anomaly or failed login.",
      "Kerberoasting uses the Domain Controller's LDAP interface to read the service account's password hash directly from the NTDS.dit database, which is a normal read operation that generates only informational log events.",
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
    prompt:
      "You enumerate the domain and find several accounts with the 'Do not require Kerberos preauthentication' flag set. You request an AS-REP for each without providing any password. Why are these accounts vulnerable?",
    options: [
      "Without pre-authentication, the KDC returns an AS-REP containing data encrypted with the user's hash to anyone who asks, enabling offline password cracking (hashcat mode 18200) from just a username list with no valid credentials needed.",
      "Disabling pre-authentication causes the KDC to issue TGTs with an unlimited lifetime for these accounts, so any ticket requested never expires and can be replayed indefinitely across all domain services without renewal.",
      "Accounts without pre-authentication store their passwords in reversible encryption in the NTDS.dit database, so reading the AS-REP reveals the plaintext password directly without any need for offline cracking or brute force.",
      "Disabling pre-authentication removes the account from all security group memberships, which means the account's tokens carry no authorization restrictions and can access any resource in the domain without any access check.",
    ],
    correctIndex: 0,
    explanation:
      "With pre-auth off, the KDC returns an AS-REP encrypted with the user's hash to anyone who asks, enabling offline cracking from just a username list — no prior credentials needed.",
  },
  {
    slug: "ad-l2-pth",
    competencyId: "ad-fundamentals",
    depthTier: 2,
    sectionHeading: "Pass-the-Hash and overpass-the-hash",
    prompt:
      "You dump the local SAM database and obtain an NT hash for a domain admin who logged into the workstation. Using this hash with crackmapexec, you authenticate to remote machines without ever cracking the password. Why does this work?",
    options: [
      "NTLM authentication computes the challenge-response directly from the NT hash, not the plaintext password, so possessing the hash is functionally equivalent to possessing the credential for any NTLM authentication attempt.",
      "Windows stores a backup copy of each user's plaintext password alongside the NT hash in the SAM database, and crackmapexec automatically extracts and uses the plaintext copy for authentication transparently.",
      "The NT hash contains a signed Kerberos TGT that was cached when the domain admin logged in, and crackmapexec presents this cached ticket to remote machines, which accept it because the TGT has not yet expired.",
      "The NT hash includes the domain admin's smart card PIN encrypted with the machine's TPM key, and crackmapexec decrypts the PIN using the TPM to perform certificate-based authentication against remote machines.",
    ],
    correctIndex: 0,
    explanation:
      "NTLM never checks the plaintext — the NT hash is what the challenge-response is computed from. A stolen hash is replayed directly (PtH), or turned into a Kerberos TGT via overpass-the-hash.",
  },
  {
    slug: "ad-l2-cred-dump",
    competencyId: "ad-fundamentals",
    depthTier: 2,
    sectionHeading: "Credential dumping",
    prompt:
      "After gaining local admin on a workstation, you run Mimikatz with the command sekurlsa::logonpasswords and obtain NTLM hashes and some plaintext credentials for several domain users. Where is Mimikatz reading these credentials from?",
    options: [
      "The LSASS process memory, which caches credential material for users who have interactively logged onto this machine, including NTLM hashes, Kerberos tickets, and sometimes plaintext passwords depending on the configuration.",
      "The local SAM registry hive, which stores a copy of every domain user's credentials that have ever been used on the machine, encrypted with the machine's DPAPI master key for offline protection.",
      "The Active Directory SYSVOL share on the Domain Controller, which caches Group Policy Preference passwords for all users, and Mimikatz decrypts them using the publicly known AES key Microsoft published.",
      "The Windows Credential Manager vault files stored in the user's AppData directory, which contain saved RDP and network share credentials in an encrypted format that Mimikatz decrypts using the user's SID.",
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
    prompt:
      "An attacker forges two Kerberos tickets: one using the krbtgt hash and another using a SQL service account's hash. The first provides access to any domain resource while the second only works against the SQL service. What distinguishes these attacks?",
    options: [
      "The first is a Golden Ticket (forged TGT from krbtgt hash, granting domain-wide access that persists until krbtgt is rotated twice); the second is a Silver Ticket (forged service ticket from the service hash, limited to that service but stealthier since it never contacts the DC).",
      "Both are Golden Tickets of different scope: the krbtgt-based one is a 'full' Golden Ticket with unrestricted access, while the service-based one is a 'scoped' Golden Ticket that the KDC restricts to a single service through constrained delegation.",
      "The first is a Diamond Ticket (a modified legitimate TGT with extra SIDs injected by the attacker, validated normally by the KDC); the second is a Sapphire Ticket (a service ticket issued by a rogue KDC the attacker installs on a compromised workstation).",
      "The first is an overpass-the-hash attack that converts the krbtgt hash into a Kerberos TGT through the AS-REQ protocol; the second is a standard pass-the-hash that uses the service account's NTLM hash directly for NTLM authentication only.",
    ],
    correctIndex: 0,
    explanation:
      "Golden Tickets forge TGTs with the krbtgt hash (domain-wide, persists until krbtgt is rotated twice). Silver Tickets forge service tickets with a service account's hash — narrower but stealthier since the DC is not contacted.",
  },
  {
    slug: "ad-l3-dcsync",
    competencyId: "ad-fundamentals",
    depthTier: 3,
    sectionHeading: "DCSync attack",
    prompt:
      "You compromise an account with DS-Replication-Get-Changes and DS-Replication-Get-Changes-All rights. You run secretsdump and request the krbtgt hash from the DC. What protocol is this attack abusing and why does it work?",
    options: [
      "The Directory Replication Service (MS-DRSR): the attack mimics a Domain Controller requesting replication of password data, and the target DC complies because the compromised account holds the required replication permissions.",
      "The LDAP search protocol: the attack sends a specially crafted LDAP query that exploits a filter bypass in the DC's search handler, returning the normally hidden password hash attributes from the NTDS.dit database directly.",
      "The Kerberos AS-REQ protocol: the attack requests a TGT for the krbtgt account itself, and the KDC returns the hash in the encrypted portion of the AS-REP, which secretsdump decrypts using a known static key.",
      "The SMB file-sharing protocol: the attack mounts the DC's system volume over SMB and reads the NTDS.dit file directly from disk, parsing the ESE database format offline to extract the krbtgt hash from the datatable.",
    ],
    correctIndex: 0,
    explanation:
      "With DS-Replication-Get-Changes rights, secretsdump/Mimikatz request replication of secrets using the directory replication protocol. Detection watches Event ID 4662 replication requests from non-DC sources.",
  },
  {
    slug: "ad-l3-adcs",
    competencyId: "ad-fundamentals",
    depthTier: 3,
    sectionHeading: "AD CS attacks (Certifried / ESC1-ESC8)",
    prompt:
      "You find a certificate template in AD CS where enrollee-supplies-subject is enabled and low-privileged users have enrollment rights. You use Certipy to request a certificate with a Subject Alternative Name of administrator@corp.local. What attack class is this?",
    options: [
      "ESC1: the template allows the requester to specify an arbitrary Subject Alternative Name, so a low-privileged user can request a certificate authenticating as any user, including Domain Admin, and use it to obtain their NTLM hash.",
      "ESC4: the template's access control list grants low-privileged users the ability to modify the template's own configuration settings, so the attacker changes the template to auto-enroll Domain Admins and issues certificates on their behalf.",
      "ESC8: the CA's web enrollment endpoint accepts NTLM authentication without enforcing Extended Protection for Authentication, allowing the attacker to relay a Domain Admin's NTLM hash to the CA to request a certificate.",
      "ESC6: the CA has the EDITF_ATTRIBUTESUBJECTALTNAME2 flag set globally, which instructs the CA to include the SAN from any certificate request without checking whether the template normally allows requester-supplied subjects.",
    ],
    correctIndex: 0,
    explanation:
      "ESC1 templates let the requester specify the SAN, so you can obtain a cert authenticating as any user (then certipy auth returns their hash). ESC8 is NTLM relay to enrollment; ESC6 is a CA-level flag with a similar effect.",
  },
  {
    slug: "ad-l3-delegation",
    competencyId: "ad-fundamentals",
    depthTier: 3,
    sectionHeading: "Delegation attacks",
    prompt:
      "A file server has unconstrained delegation enabled. You use the printer bug (SpoolService) to coerce the Domain Controller to authenticate to this file server. You then extract the DC's TGT from the server's memory. Why did this work?",
    options: [
      "Machines with unconstrained delegation cache the TGTs of all users and computers that authenticate to them, so coercing the DC to authenticate delivers its TGT to the file server's memory, extractable with Rubeus or Mimikatz.",
      "Unconstrained delegation disables Kerberos pre-authentication for all accounts that connect to the delegated server, so the DC's authentication request returns an AS-REP you can crack offline to recover its machine account hash.",
      "Unconstrained delegation grants the file server's machine account implicit DCSync rights, so after the DC authenticates, the file server automatically replicates all password hashes from the DC's NTDS.dit to its local credential cache.",
      "Unconstrained delegation causes the file server to request a Golden Ticket from the KDC on behalf of any authenticating principal, and the KDC issues a forged TGT because the delegation flag overrides all authorization checks.",
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
    prompt:
      "You have Domain Admin in child.corp.local and want to escalate to the forest root corp.local. You forge a Golden Ticket in the child domain that includes the Enterprise Admins SID via SID History. Why does this cross-domain escalation succeed?",
    options: [
      "The forest is the security boundary, not the domain: intra-forest trusts honor SID History, so the forged ticket carrying the Enterprise Admins SID grants access to the forest root as if you were a legitimate member of that group.",
      "The child domain's DC has a direct LDAP replication link to the forest root DC, and the forged ticket triggers a replication event that promotes your account to Enterprise Admin in the forest root's NTDS.dit database.",
      "The child domain's krbtgt hash is mathematically derived from the forest root's krbtgt hash, so a Golden Ticket forged in the child is automatically valid in the forest root because both KDCs share the same encryption key.",
      "Inter-domain trust relationships automatically grant Domain Admins of child domains read access to the forest root's configuration partition, and the SID History attribute only changes the display name shown in security audit logs.",
    ],
    correctIndex: 0,
    explanation:
      "The forest is the security boundary, not the domain. A child Domain Admin can add the Enterprise Admins SID via SID History to a forged ticket, escalating across the intra-forest trust to the forest root.",
  },
  // ── L4 ──
  {
    slug: "ad-l4-sccm",
    competencyId: "ad-fundamentals",
    depthTier: 4,
    sectionHeading: "SCCM and MECM exploitation",
    prompt:
      "During an engagement you find that the SCCM Network Access Account (NAA) credentials are deployed to every domain-joined client. You recover them using SharpSCCM from a single workstation. Why are these credentials a valuable finding?",
    options: [
      "NAA credentials are pushed to all SCCM clients for accessing distribution points and are frequently over-privileged domain accounts, so recovering them from any single client gives you broad lateral movement access across the domain.",
      "NAA credentials are the SCCM site server's local administrator password, and since SCCM manages software deployment, this password also unlocks the encryption on all software packages stored in the content library.",
      "NAA credentials are used exclusively to authenticate to Microsoft's cloud update servers, and recovering them lets you intercept and tamper with Windows Update packages before they are deployed to domain clients.",
      "NAA credentials are temporary one-time-use tokens generated by the SCCM management point for each client, and while they cannot be reused, their format reveals the SCCM hierarchy's internal certificate chain.",
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
    prompt:
      "You discover that LAPS is deployed across the domain and find you have read access to the ms-Mcs-AdmPwd attribute on several computer objects in AD. What information does this give you, and why?",
    options: [
      "LAPS stores a unique randomized local administrator password for each managed computer in the ms-Mcs-AdmPwd attribute, so read access yields the current local admin password for every computer object you can query.",
      "LAPS stores the BitLocker recovery keys for each computer's encrypted drives in ms-Mcs-AdmPwd, so read access lets you decrypt the disk of any managed computer if you obtain physical access or a disk image.",
      "LAPS stores the Kerberos machine account password for each computer in ms-Mcs-AdmPwd, and reading it lets you forge Silver Tickets for any service running on that machine without needing the service account's hash.",
      "LAPS stores the SCCM client authentication certificate for each computer in ms-Mcs-AdmPwd, and reading it lets you impersonate that computer to the SCCM management point and deploy software packages to other clients.",
    ],
    correctIndex: 0,
    explanation:
      "LAPS randomizes each machine's local admin password and stores it in AD. If you can read ms-Mcs-AdmPwd you recover those passwords. gMSA passwords (msDS-ManagedPassword) are similarly readable by authorized principals.",
  },
  {
    slug: "ad-l4-shadow-creds",
    competencyId: "ad-fundamentals",
    depthTier: 4,
    sectionHeading: "Shadow credentials and Key Trust",
    prompt:
      "Instead of resetting a target user's password (which would lock them out and trigger alerts), you use pywhisker to add a key to their msDS-KeyCredentialLink attribute. Why is this approach stealthier for taking over the account?",
    options: [
      "Adding a key to msDS-KeyCredentialLink lets you authenticate as the target via certificate-based PKINIT without changing their password, so the user continues to log in normally and no password-change events are generated.",
      "Writing to msDS-KeyCredentialLink disables the target account's audit policy, preventing the Domain Controller from logging any authentication events for that account, which makes all subsequent logins invisible to monitoring.",
      "The msDS-KeyCredentialLink attribute is excluded from Active Directory replication, so changes to it are never copied to other Domain Controllers and cannot be detected by security tools monitoring AD replication traffic.",
      "Adding a key to msDS-KeyCredentialLink creates a hidden service account that mirrors the target's permissions, and this shadow account does not appear in LDAP queries, BloodHound collections, or group membership lists.",
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
    prompt:
      "After gaining Domain Admin, you modify the AdminSDHolder object's ACL to grant your controlled account full control. The blue team removes your account from Domain Admins. An hour later your access is restored. What mechanism is responsible?",
    options: [
      "The SDProp process runs approximately every 60 minutes and stamps the AdminSDHolder ACL onto all protected groups (Domain Admins, Enterprise Admins, etc.), so your backdoor ACE is automatically reapplied to those groups each cycle.",
      "The AdminSDHolder modification triggers a Group Policy refresh that re-adds your account to Domain Admins from a cached membership list, because GPO settings override manual group membership changes made by administrators.",
      "The AdminSDHolder ACL change created a scheduled task on every Domain Controller that runs hourly and executes a net group command to restore your account to the Domain Admins group using a hardcoded service credential.",
      "The AdminSDHolder ACL change propagated through AD replication to all DCs, and when the blue team removed your account on one DC, the replication conflict resolution algorithm favored the older modification and restored it.",
    ],
    correctIndex: 0,
    explanation:
      "SDProp periodically stamps the AdminSDHolder ACL onto protected groups, so a backdoor ACE there re-grants control over Domain/Enterprise Admins even after cleanup. Golden Tickets, DCSync rights, and Skeleton Key are other persistence paths.",
  },
  {
    slug: "ad-l4-azure",
    competencyId: "ad-fundamentals",
    depthTier: 4,
    sectionHeading: "Azure AD / Entra ID attacks in hybrid environments",
    prompt:
      "In a hybrid AD environment, you compromise the Azure AD Connect server. The security team asks why this is as critical as compromising a Domain Controller. What makes the Connect server such a high-value target?",
    options: [
      "With Password Hash Sync enabled, the Azure AD Connect service account has DCSync-equivalent replication rights, so compromising the Connect server lets you extract all domain password hashes without touching a Domain Controller.",
      "The Azure AD Connect server stores every user's multi-factor authentication TOTP seeds in a local SQLite database, so compromising it lets you generate valid MFA codes for any user and bypass conditional access policies.",
      "The Azure AD Connect server acts as the sole Certificate Authority for the hybrid environment, issuing certificates to both on-premises and cloud users, so compromising it lets you forge certificates for any identity.",
      "The Azure AD Connect server holds the encryption keys for all Azure Key Vault secrets used by the organization, so compromising it gives access to every secret, certificate, and encryption key stored in the cloud.",
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
    prompt:
      "You obtain a copy of NTDS.dit from a Domain Controller but secretsdump fails to extract hashes until you also provide the SYSTEM registry hive. Why are both files required for offline hash extraction?",
    options: [
      "The password hashes in NTDS.dit are encrypted with the Password Encryption Key (PEK), which is itself derived from the BOOTKEY stored in the SYSTEM registry hive, so both files are required to decrypt the stored credential data.",
      "NTDS.dit contains only the usernames and SIDs of domain accounts, while the SYSTEM hive contains the actual NTLM password hashes stored separately, and secretsdump merges both files to produce username-to-hash mappings.",
      "NTDS.dit is stored in Microsoft's Extensible Storage Engine (ESE) format, and the SYSTEM hive contains the ESE database driver that secretsdump loads dynamically at runtime to parse the database tables and read their rows.",
      "The SYSTEM hive contains the schema definition for the NTDS.dit database, including the column names and data types for the password hash attributes, without which secretsdump cannot locate the hash fields in the raw data.",
    ],
    correctIndex: 0,
    explanation:
      "NTDS.dit is the AD database (ESE/JET Blue) whose password hashes are encrypted by the Password Encryption Key, derived from the SYSTEM hive's BOOTKEY — so both are required. secretsdump -ntds ... -system ... does the extraction.",
  },
  {
    slug: "ad-l5-kerberos-internals",
    competencyId: "ad-fundamentals",
    depthTier: 5,
    sectionHeading: "Kerberos protocol internals",
    prompt:
      "A Silver Ticket forged with a service account's hash is accepted by the target service despite never being validated by the KDC. What structure inside the ticket carries the authorization data, and why did the service trust it?",
    options: [
      "The Privilege Attribute Certificate (PAC) carries the user's SIDs and group memberships; services historically verified only the server-side checksum (signed with the service hash) and skipped KDC-side PAC validation, so a forged PAC was accepted.",
      "The Authorization Data Extension (ADE) carries the user's access tokens as encrypted blobs; services validated the ADE against a local cache of user tokens synced from the DC hourly, and a forged ADE matched when the cache was stale.",
      "The Kerberos Authenticator carries the user's group memberships as a signed assertion; services checked only the timestamp in the Authenticator for freshness and never validated the group membership claims against the Domain Controller.",
      "The TGS session key carries an embedded ACL defining the user's service-level permissions; services compared this ACL against their local authorization policy but never verified whether the KDC actually issued that specific session key.",
    ],
    correctIndex: 0,
    explanation:
      "The PAC encodes authorization data (SIDs, groups). Many services verified only the server checksum, not the KDC checksum, so a forged ticket's PAC was trusted. Server 2022 added a ticket checksum to harden this.",
  },
  {
    slug: "ad-l5-dpapi",
    competencyId: "ad-fundamentals",
    depthTier: 5,
    sectionHeading: "DPAPI architecture",
    prompt:
      "After gaining Domain Admin, you export the domain DPAPI backup key from the DC using Mimikatz's lsadump::backupkeys command. A colleague asks why this single key is so powerful. What can it decrypt?",
    options: [
      "The domain DPAPI backup key can decrypt any domain user's DPAPI master keys, which protect all their saved secrets — browser passwords, Wi-Fi keys, certificates, and credential manager entries — providing persistent domain-wide secret access.",
      "The domain DPAPI backup key is the krbtgt account's hash stored in a different format, so exporting it is equivalent to performing a DCSync attack and gives you the ability to forge Golden Tickets for any user.",
      "The domain DPAPI backup key decrypts the BitLocker recovery keys for every domain-joined computer, stored in each computer object's msTPM-OwnerInformation attribute and protected by DPAPI encryption at the domain level.",
      "The domain DPAPI backup key is the root CA's private key used to sign all certificates in the domain's PKI hierarchy, so possessing it lets you issue trusted certificates for any user or service in the environment.",
    ],
    correctIndex: 0,
    explanation:
      "DPAPI protects user secrets via master keys derived from the user's password, with a domain backup key stored on the DC. Exporting that backup key decrypts every user's master keys — a durable secret-access foothold.",
  },
  {
    slug: "ad-l5-boundaries",
    competencyId: "ad-fundamentals",
    depthTier: 5,
    sectionHeading: "AD security boundaries and trust model",
    prompt:
      "Your client has three domains (corp.local, dev.corp.local, staging.corp.local) in a single forest and believes domain separation provides strong isolation. You demonstrate that compromising dev.corp.local can reach corp.local. What is Microsoft's actual security boundary?",
    options: [
      "The forest is the security boundary: a child-domain admin can reach the forest root via SID History injection in forged Golden Tickets, and forest-wide partitions (Schema, Configuration) are writable from any domain's Domain Admin account.",
      "The organizational unit is the security boundary: each OU maintains its own Kerberos realm and NTDS.dit partition, so compromising the dev OU only exposes objects within that OU and cannot affect objects in the corp OU.",
      "The domain is the security boundary when Selective Authentication is enabled on all inter-domain trusts, which restricts SID filtering and prevents lateral movement between domains using any type of Kerberos ticket.",
      "The site is the security boundary: AD sites correspond to physical network segments with independent Domain Controllers, and inter-site replication uses encrypted channels that prevent credential theft across site boundaries.",
    ],
    correctIndex: 0,
    explanation:
      "Because a child-domain admin can reach the forest root (SID History) and Schema/Configuration partitions are forest-wide, the forest is the boundary. True isolation requires separate forests.",
  },
];
