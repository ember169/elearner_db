import type { SeedExercise } from "./types";

/** win-internals + maldev-techniques + evasion + reverse-engineering L0–L5. */
export const WINDOWS_MALDEV_EXERCISES: SeedExercise[] = [
  // ══════════════════════════════════════════════════════════════════════════
  //  win-internals
  // ══════════════════════════════════════════════════════════════════════════

  // ── L0 ──
  {
    slug: "wi-l0-why",
    competencyId: "win-internals",
    depthTier: 0,
    sectionHeading: "Why Windows internals matter",
    prompt:
      "A junior analyst runs Mimikatz on an engagement but cannot explain its output to the client. What fundamental gap does this illustrate?",
    options: [
      "Understanding how processes, memory, tokens, and the registry work is essential to interpret tool output, explain findings, and adapt when tools fail or produce unexpected results in a real engagement.",
      "Familiarity with multiple tool GUIs is the main skill gap — analysts should master Mimikatz's full CLI syntax, its lesser-known modules, and its logging options before running it on client networks.",
      "The gap is in report writing and communication — the analyst likely understands the output but needs practice translating raw technical findings into executive-friendly language and risk ratings.",
      "Operational security is the core issue — running Mimikatz without understanding its network and disk signatures means the blue team likely detected the tool and blocked its credential-dumping modules.",
    ],
    correctIndex: 0,
    explanation:
      "Active Directory environments dominate enterprise networks and most malware targets Windows. Understanding how CreateProcess, lsass.exe, or registry Run keys actually work is what separates an operator from a button-pusher. Tool output means nothing without a mental model of the underlying system.",
  },
  {
    slug: "wi-l0-arch",
    competencyId: "win-internals",
    depthTier: 0,
    sectionHeading: "Architecture overview",
    prompt:
      "You trace a CreateFileW call and see it pass through kernel32.dll, then ntdll.dll, before a syscall instruction transitions to the kernel. What role does ntdll.dll play in this chain?",
    options: [
      "ntdll.dll is the user-to-kernel bridge — it contains the syscall stubs that set up register arguments and execute the syscall instruction to transition the thread from Ring 3 (user mode) to Ring 0 (kernel mode).",
      "ntdll.dll performs access-control validation on the file path before allowing the call to proceed, checking the calling thread's token against the target file's DACL and integrity level requirements.",
      "ntdll.dll is the Win32 compatibility layer that translates high-level CreateFileW parameters into the lower-level C runtime fopen structures and POSIX file descriptors the kernel expects.",
      "ntdll.dll caches recent file operations in a per-process lookup table, returning previously opened handles from cache when possible and only forwarding cache misses to the kernel via syscall.",
    ],
    correctIndex: 0,
    explanation:
      "ntdll.dll provides the lowest-level user-mode API. Win32 API calls (kernel32.dll, user32.dll) ultimately call ntdll, which executes the syscall instruction to enter the kernel. EDR products hook ntdll to monitor API calls before they reach the kernel.",
  },
  {
    slug: "wi-l0-vocab",
    competencyId: "win-internals",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt:
      "Process Explorer shows a process running at Medium integrity level with SeChangeNotifyPrivilege enabled. Where is this security information stored at the OS level?",
    options: [
      "In the process's access token — a kernel object attached to every process that holds the SID, group memberships, privilege list, and integrity level defining the process's full security context.",
      "In the process's PEB (Process Environment Block) — a user-mode structure that stores the integrity level alongside the image base address, command-line arguments, and environment variables.",
      "In the Security Account Manager (SAM) database — the registry hive at HKLM\\SAM that maps each running process to its assigned integrity level and privilege set established at logon time.",
      "In the process's PE header — the IMAGE_OPTIONAL_HEADER contains a security-level field and privilege bitmap that the Windows loader reads when mapping the executable into memory.",
    ],
    correctIndex: 0,
    explanation:
      "Every process has a token. It determines what the process can do — which objects it can access, which privileges (SeDebugPrivilege, SeImpersonatePrivilege) it holds, and its integrity level (medium, high, system).",
  },

  // ── L1 ──
  {
    slug: "wi-l1-proc",
    competencyId: "win-internals",
    depthTier: 1,
    sectionHeading: "Process and thread management",
    prompt:
      "Your SIEM flags svchost.exe with a parent process of cmd.exe instead of services.exe. What does this deviation from the normal process tree most likely indicate?",
    options: [
      "A likely compromise — svchost.exe should only be spawned by services.exe. A cmd.exe parent suggests an attacker launched a renamed or injected binary to masquerade as a legitimate system process.",
      "A Windows Update operation — during certain patch cycles the update agent uses cmd.exe batch scripts that temporarily restart svchost instances, producing this parent-child relationship in process logs.",
      "A scheduled task execution — the Task Scheduler can launch svchost.exe through cmd.exe when the task action is configured as a command-line wrapper around a specific service host group.",
      "A Group Policy refresh — when Group Policy reapplies settings it sometimes restarts svchost groups through a cmd.exe intermediary to ensure clean re-initialization of the policy client extensions.",
    ],
    correctIndex: 0,
    explanation:
      "Security analysts baseline the normal process tree. An abnormal parent-child relationship (e.g., powershell.exe spawned by excel.exe) is a red flag that EDR and SIEM rules detect. The canonical tree is System, smss, wininit, services, svchost.",
  },
  {
    slug: "wi-l1-reg",
    competencyId: "win-internals",
    depthTier: 1,
    sectionHeading: "Registry fundamentals",
    prompt:
      "During incident response you find a new entry under HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run pointing to a binary in %APPDATA%. Why is this a likely persistence mechanism?",
    options: [
      "Entries in the Run key execute automatically at user logon, so malware placed there survives reboots without needing admin privileges — the HKCU Run key is writable by the current user by default.",
      "The Run key is processed by Windows Defender during boot, which scans and whitelists each listed binary — placing a binary here bypasses real-time scanning on all subsequent executions of that file.",
      "The %APPDATA% location is significant because Windows applies digital signature verification only to executables in system directories — binaries in user-writable paths skip Authenticode validation entirely.",
      "The Run key triggers the binary to load as a Windows service under the SYSTEM account at boot, granting it elevated privileges even though the registry entry is stored in the current user's hive.",
    ],
    correctIndex: 0,
    explanation:
      "The CurrentVersion\\Run keys are among the most common persistence mechanisms (MITRE T1547.001). HKCU requires no admin. HKLM applies to all users but requires admin. Sysinternals Autoruns comprehensively enumerates all auto-start locations.",
  },
  {
    slug: "wi-l1-sysinternals",
    competencyId: "win-internals",
    depthTier: 1,
    sectionHeading: "Sysinternals tools",
    prompt:
      "You suspect a process is writing to a specific registry key for persistence. Which Sysinternals tool captures the exact key path, value, and timestamp of those writes in real time?",
    options: [
      "Process Monitor — it captures real-time file, registry, and network events with filtering, so you can filter on RegSetValue operations from that process and see each write's exact path, data, and call stack.",
      "Process Explorer — it displays each process's open registry handles in the lower pane, and refreshing the handle view while the process runs reveals new keys as they are created or modified in real time.",
      "Autoruns — it scans all known auto-start registry locations continuously and highlights newly created entries as they appear, capturing both the timestamp and the process identity that wrote them.",
      "AccessChk — it audits the permissions on registry keys in real time and logs whenever a process's access token matches a DACL entry that allows write access to a monitored key path and its subkeys.",
    ],
    correctIndex: 0,
    explanation:
      "Process Explorer shows current state (handles, DLLs, strings). Process Monitor shows activity over time (every registry write, file create, network connection) with powerful filtering — essential for malware behavioral analysis.",
  },

  // ── L2 ──
  {
    slug: "wi-l2-pe",
    competencyId: "win-internals",
    depthTier: 2,
    sectionHeading: "PE file format",
    prompt:
      "You open a suspicious binary in PE-bear and notice VirtualAllocEx, WriteProcessMemory, and CreateRemoteThread in its Import Table. What does this combination of imports suggest about the binary's capabilities?",
    options: [
      "Process injection capability — these three APIs together form the classic pattern for allocating memory in a remote process, writing a payload into it, and creating a thread to execute it in the target's address space.",
      "Shared-memory IPC — these APIs implement inter-process communication by creating a shared memory region between two cooperating processes, writing structured data to it, and signaling the receiver thread.",
      "Custom debugger functionality — the binary is a debugging tool that allocates tracing buffers in the debuggee, writes breakpoint instructions into its code sections, and creates monitor threads for debug events.",
      "DLL self-update logic — the binary patches its own loaded DLL modules by allocating new memory for updated code sections, writing the replacement bytes, and creating a thread to swap the old code at runtime.",
    ],
    correctIndex: 0,
    explanation:
      "The PE Import Table reveals a binary's API usage. A combination of OpenProcess + VirtualAllocEx + WriteProcessMemory + CreateRemoteThread is a textbook injection pattern. Malware often hides imports via API hashing to avoid this kind of static analysis.",
  },
  {
    slug: "wi-l2-secmodel",
    competencyId: "win-internals",
    depthTier: 2,
    sectionHeading: "Windows security model",
    prompt:
      "You gain a shell on a Windows host and find that SeDebugPrivilege is enabled in your token. What attack does this privilege directly enable?",
    options: [
      "Opening a handle to any process with full access — including lsass.exe — enabling credential dumping, process injection, and memory reads regardless of the target process's DACL or owner.",
      "Bypassing UAC prompts entirely — SeDebugPrivilege automatically elevates the token to high integrity, so any child process you launch inherits admin rights without triggering a consent dialog.",
      "Reading the SAM database file directly from disk — this privilege grants raw NTFS access to files protected by the SYSTEM account, including the credential hive at %SystemRoot%\\System32\\config\\SAM.",
      "Loading unsigned kernel drivers — the privilege extends trust to Ring 0, so the Service Control Manager allows driver registration and loading without requiring a valid Authenticode digital signature.",
    ],
    correctIndex: 0,
    explanation:
      "SeDebugPrivilege bypasses standard access checks for process handles. Mimikatz requires it for sekurlsa::logonpasswords. Other dangerous privileges: SeImpersonatePrivilege (potato attacks), SeBackupPrivilege (read any file).",
  },
  {
    slug: "wi-l2-services",
    competencyId: "win-internals",
    depthTier: 2,
    sectionHeading: "Windows services and SCM",
    prompt:
      "A penetration tester discovers a Windows service with the unquoted path C:\\Program Files\\My App\\service.exe. How can this configuration be exploited for privilege escalation?",
    options: [
      "Windows parses unquoted paths with spaces by testing each space as a path terminator — dropping a binary at C:\\Program.exe or C:\\Program Files\\My.exe hijacks the service when it starts under its privileged service account.",
      "The unquoted path causes the SCM to pass 'C:\\Program' as the executable and 'Files\\My App\\service.exe' as a command-line argument, allowing argument injection to redirect execution to an attacker-controlled handler.",
      "Unquoted paths enable DLL search-order hijacking — the service's working directory defaults to C:\\, so placing a malicious DLL there causes it to be loaded before the legitimate system DLLs the service depends on.",
      "The space in the path prevents Windows from applying AppLocker rules to the service binary because the policy engine cannot parse the unquoted path string, effectively whitelisting the executable location.",
    ],
    correctIndex: 0,
    explanation:
      "Windows parses unquoted paths with spaces by testing each space as a possible end of the executable name. If you can write to an earlier directory in the path, you can place a malicious binary that runs instead of the real service — often as SYSTEM.",
  },

  // ── L3 ──
  {
    slug: "wi-l3-apicall",
    competencyId: "win-internals",
    depthTier: 3,
    sectionHeading: "Windows API call chain",
    prompt:
      "An EDR product patches the first bytes of NtAllocateVirtualMemory in ntdll.dll with a JMP and also registers kernel callbacks via PsSetCreateProcessNotifyRoutine. What two detection layers do these mechanisms represent?",
    options: [
      "User-mode inline hooking (patching ntdll function prologues to redirect calls through EDR analysis code) and kernel callbacks (OS-invoked notifications on process/thread creation) — the EDR monitors at both privilege levels.",
      "Import Address Table hooking (rewriting the process's IAT to redirect API calls through the EDR DLL) and ETW tracing (subscribing to the Microsoft-Windows-Kernel-Process provider for asynchronous event logs).",
      "Detour-based hooking (inserting a trampoline that preserves the original function for forwarding) and minifilter callbacks (filesystem interception via FltRegisterFilter that monitors memory-mapped section creation).",
      "Debug register watchpoints (using DR0-DR3 to trap on ntdll function entry points) and hypervisor-based monitoring (EPT violations that intercept every syscall instruction execution from VMX root context).",
    ],
    correctIndex: 0,
    explanation:
      "User-mode hooks intercept ntdll calls before they reach the kernel. Kernel callbacks notify on process/thread creation and handle operations. Evasion targets both: direct syscalls bypass ntdll hooks, but kernel callbacks are much harder to evade.",
  },
  {
    slug: "wi-l3-mem",
    competencyId: "win-internals",
    depthTier: 3,
    sectionHeading: "Memory management internals",
    prompt:
      "Your EDR flags a process that called VirtualProtect to change a memory region from PAGE_READWRITE to PAGE_EXECUTE_READ at runtime. Why is this specific transition suspicious?",
    options: [
      "It is the hallmark of shellcode execution — an attacker writes the payload to writable memory, then flips it to executable. Legitimate code rarely changes page protections at runtime because section permissions are set at load time.",
      "It indicates just-in-time compilation — the .NET CLR and JavaScript engines routinely allocate RW buffers for generated machine code then make them executable, so the EDR should correlate with process identity first.",
      "It signals DLL rebasing — when a DLL cannot load at its preferred ImageBase, the loader writes relocation fixups to the RW copy of .text, then restores the section to RX after patching all base-relative addresses.",
      "It reveals stack pivoting preparation — the attacker is converting a portion of the heap from its default RW state to RX so that a ROP chain can transition into conventional shellcode execution from a predictable location.",
    ],
    correctIndex: 0,
    explanation:
      "Legitimate programs have their permissions set at load time (.text = RX, .data = RW). Changing RW to RX at runtime means the process is making writable data executable — a classic indicator of in-memory payload execution. RWX regions are even more suspicious.",
  },
  {
    slug: "wi-l3-creds",
    competencyId: "win-internals",
    depthTier: 3,
    sectionHeading: "Authentication and credential storage",
    prompt:
      "After compromising an admin account, your credential dump from lsass.exe returns no hashes on a host with Credential Guard enabled. Why does this protection work?",
    options: [
      "Credential Guard uses Hyper-V to isolate credentials in a VBS (Virtualization-Based Security) secure world — even a compromised kernel in the normal world cannot access the isolated memory where NTLM hashes and Kerberos tickets reside.",
      "Credential Guard encrypts lsass.exe's virtual address space with a per-boot AES-256 key stored in the TPM — without the TPM's PCR measurements validating the boot chain, the memory pages decrypt to random data.",
      "Credential Guard replaces lsass.exe with a minimal stub process that delegates all authentication to a cloud-hosted Azure AD token service, so no credential material is ever present in local process memory.",
      "Credential Guard applies ACL-based memory protection to the lsass process, setting its security descriptor to deny read access to all principals except the SYSTEM account's own impersonated service tokens.",
    ],
    correctIndex: 0,
    explanation:
      "Virtualization-Based Security (VBS) creates a Secure Kernel that runs alongside the normal kernel. Credential Guard stores NTLM hashes and Kerberos tickets in this isolated environment. Disabling WDigest also prevents plaintext password caching.",
  },

  // ── L4 ──
  {
    slug: "wi-l4-syscall",
    competencyId: "win-internals",
    depthTier: 4,
    sectionHeading: "Syscalls and the SSDT",
    prompt:
      "You are writing a direct syscall implementation targeting multiple Windows versions. Why must your code resolve the NtAllocateVirtualMemory syscall number at runtime rather than hardcoding it?",
    options: [
      "Windows syscall numbers change between OS builds — a hardcoded number from Windows 10 21H2 will invoke the wrong kernel function on Windows 11 23H2. Techniques like Hell's Gate read the number from ntdll's stubs at runtime.",
      "Syscall numbers are randomized by ASLR on each boot — the kernel shuffles the SSDT during initialization, so the same OS installation assigns different numbers across reboots for anti-exploitation purposes.",
      "The syscall number depends on which CPU core executes the instruction — on multi-core systems each processor maintains its own SSDT copy with distinct numbering to support per-core driver isolation boundaries.",
      "Syscall numbers are encrypted by PatchGuard and decrypted only inside the kernel's syscall dispatcher — passing a raw unencrypted number triggers a PatchGuard integrity violation and a blue screen on modern systems.",
    ],
    correctIndex: 0,
    explanation:
      "Unlike Linux, Windows syscall numbers are not stable across versions. Hell's Gate walks ntdll exports to find the mov eax, <number> instruction in each Zw* function. Halo's Gate handles hooked functions by checking neighboring stubs.",
  },
  {
    slug: "wi-l4-objmgr",
    competencyId: "win-internals",
    depthTier: 4,
    sectionHeading: "Object Manager and handles",
    prompt:
      "You run Mimikatz's sekurlsa::logonpasswords and get access-denied on the lsass handle despite running as SYSTEM. An EDR kernel driver is likely using what mechanism to block you?",
    options: [
      "ObRegisterCallbacks — the driver registers a pre-operation callback that intercepts handle creation requests targeting lsass.exe and strips PROCESS_VM_READ and other sensitive access rights before the handle is granted.",
      "PsSetCreateProcessNotifyRoutine — the driver receives notification when Mimikatz creates its process and injects a thread that terminates the Mimikatz process before the handle request to lsass can complete.",
      "Minifilter callbacks via FltRegisterFilter — the driver intercepts Mimikatz's attempt to read lsass memory by treating the memory-mapped section as a virtual file object and denying the read at the filesystem layer.",
      "CmRegisterCallbackEx — the driver monitors registry operations and blocks Mimikatz from reading the Security hive keys that contain encrypted credential blobs, causing the logonpasswords module to fail silently.",
    ],
    correctIndex: 0,
    explanation:
      "ObRegisterCallbacks lets a kernel driver intercept handle operations. The callback checks whether the target is lsass.exe and, if so, removes access rights like PROCESS_VM_READ from the handle — blocking Mimikatz-style dumps.",
  },
  {
    slug: "wi-l4-etw",
    competencyId: "win-internals",
    depthTier: 4,
    sectionHeading: "ETW and kernel callbacks",
    prompt:
      "An attacker patches ntdll!EtwEventWrite to return immediately in their process. Why does this not blind the EDR's kernel-level Threat Intelligence provider?",
    options: [
      "The Threat Intelligence ETW provider runs in kernel mode and is protected by PPL — user-mode patches to EtwEventWrite only silence user-mode ETW events within that process, leaving all kernel-level telemetry completely intact.",
      "EtwEventWrite is just a caching proxy — the actual telemetry is written directly by each API function to a shared memory buffer that the kernel reads independently, so patching the proxy has no effect on event delivery.",
      "The ETW runtime uses integrity checking — the kernel verifies EtwEventWrite's code hash on each invocation and falls back to a secondary event path when tampering is detected, ensuring events still reach consumers.",
      "Patching EtwEventWrite requires modifying ntdll's read-only .text pages — the resulting copy-on-write triggers a page fault notification that the kernel-mode Threat Intelligence provider intercepts as a tampering event.",
    ],
    correctIndex: 0,
    explanation:
      "User-mode hooks can be bypassed by direct syscalls or ntdll unhooking. Kernel callbacks are called by the kernel itself when events occur — a user-mode process cannot skip them. Disabling kernel ETW requires BYOVD or a kernel exploit.",
  },

  // ── L5 ──
  {
    slug: "wi-l5-ntfs",
    competencyId: "win-internals",
    depthTier: 5,
    sectionHeading: "NTFS internals",
    prompt:
      "During analysis you discover that a downloaded executable runs without triggering SmartScreen warnings. Investigation shows its Zone.Identifier Alternate Data Stream has been removed. What was stripped and why does it matter?",
    options: [
      "The Mark of the Web — a hidden ADS tagging downloaded files with their source zone (ZoneId=3 for Internet). SmartScreen and Office Protected View rely on it to warn users, so stripping it bypasses those security prompts entirely.",
      "The Authenticode signature stream — an ADS containing the file's digital signature chain. Without it SmartScreen cannot verify the publisher identity, but instead of warning it defaults to allowing unsigned binary execution.",
      "The Windows Defender scan-result cache — an ADS that stores the last antivirus verdict for the file. Removing it forces a rescan, but if the binary is freshly obfuscated the rescan returns a clean result and SmartScreen allows it.",
      "The NTFS encryption metadata stream — an ADS that flags the file as having been transmitted over an encrypted HTTPS channel. Without it SmartScreen classifies the download source as trusted local network traffic.",
    ],
    correctIndex: 0,
    explanation:
      "When a file is downloaded from the internet, Windows adds a Zone.Identifier ADS with ZoneId=3. SmartScreen and Office Protected View use this to warn users. Attackers strip it (e.g., via container formats like ISO/ZIP) to bypass MOTW checks.",
  },
  {
    slug: "wi-l5-kernel",
    competencyId: "win-internals",
    depthTier: 5,
    sectionHeading: "Windows kernel architecture",
    prompt:
      "A rootkit modifies the System Service Descriptor Table (SSDT) to intercept system calls. PatchGuard triggers a BSOD (bug check 0x109). How does PatchGuard detect this modification?",
    options: [
      "PatchGuard periodically checksums critical kernel structures — the SSDT, IDT, GDT, and key kernel code regions — from obfuscated timer DPCs, and triggers a CRITICAL_STRUCTURE_CORRUPTION BSOD when any modification is found.",
      "PatchGuard uses hardware memory protection via IOMMU/VT-d to mark the SSDT pages as read-only at the hardware level, so any write attempt causes an immediate EPT violation that the hypervisor converts to a BSOD.",
      "PatchGuard hooks the kernel's internal SSDT modification functions and intercepts any driver call that attempts to change a table entry, logging the caller's module identity and triggering the bug check synchronously.",
      "PatchGuard maintains a shadow copy of the SSDT in Secure Kernel memory under VBS, and the normal kernel validates every syscall dispatch against this shadow — a mismatch triggers the BSOD on the very next system call.",
    ],
    correctIndex: 0,
    explanation:
      "PatchGuard runs verification routines from timer DPCs with obfuscated context. Any modification to the SSDT, IDT, GDT, or other critical structures causes a BSOD. Virtualization-Based Security (VBS) adds further protection via Hyper-V isolation.",
  },
  {
    slug: "wi-l5-ppl",
    competencyId: "win-internals",
    depthTier: 5,
    sectionHeading: "Protected processes and PPL",
    prompt:
      "You have SYSTEM-level access and SeDebugPrivilege enabled, but OpenProcess on lsass.exe returns ERROR_ACCESS_DENIED. The host runs lsass as PPL (Protected Process Light). Why does the protection hold?",
    options: [
      "PPL enforces a signer-level hierarchy — even SYSTEM with SeDebugPrivilege is at protection level None, which ranks below lsass's Lsa-Light level. The kernel denies handle requests from lower to higher protection levels regardless of privilege.",
      "PPL encrypts the lsass process's handle table with a key derived from the Secure Boot chain — SYSTEM-level processes lack the TPM-sealed decryption key needed to construct valid handle requests to PPL-protected targets.",
      "PPL places lsass in a separate session (Session -1) that is inaccessible from any interactive or service session — the kernel's session isolation boundary blocks all cross-session handle operations for protected processes.",
      "PPL marks lsass's virtual address space as non-readable via hypervisor-enforced page permissions — the kernel grants the handle but any subsequent ReadProcessMemory call fails at the EPT layer with an access violation.",
    ],
    correctIndex: 0,
    explanation:
      "The PPL hierarchy goes from WinTcb-Full (highest) down to None (regular). Even with SeDebugPrivilege, a None-level process can't get a read handle to an Lsa-Light process. Bypasses require BYOVD (loading a vulnerable signed driver) or a kernel exploit.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  maldev-techniques
  // ══════════════════════════════════════════════════════════════════════════

  // ── L0 ──
  {
    slug: "md-l0-why",
    competencyId: "maldev-techniques",
    depthTier: 0,
    sectionHeading: "Why study malware development",
    prompt:
      "A SOC analyst encounters a Cobalt Strike beacon during triage but does not understand how its loader works. Why does this knowledge gap matter for defense?",
    options: [
      "Understanding loader mechanics — staging, injection, and in-memory execution — lets defenders build targeted detections, trace the full kill chain, and determine exactly what the attacker's payload can do on the compromised host.",
      "Knowing Cobalt Strike's licensing model and version history helps the analyst attribute the attack to specific threat groups, since each APT purchases and configures their beacons with distinct malleable C2 profiles.",
      "The analyst should focus on network indicators like the beacon's C2 domain and JA3 hash — loader internals are irrelevant because blocking the network channel neutralizes the implant regardless of how it was loaded.",
      "Understanding how to compile and deploy Cobalt Strike lets the analyst reproduce the attack in a sandbox, but this requires an active license — without one the analyst can only rely on published YARA signatures for triage.",
    ],
    correctIndex: 0,
    explanation:
      "Knowledge flows both ways: red teamers build custom tooling that evades detection, and blue teamers who understand those techniques build more effective rules. MITRE ATT&CK maps these techniques for both sides of the engagement.",
  },
  {
    slug: "md-l0-concepts",
    competencyId: "maldev-techniques",
    depthTier: 0,
    sectionHeading: "Core concepts",
    prompt:
      "You capture a 4KB shellcode blob that, when executed, downloads a 300KB DLL from a remote server and runs it in memory. What role does the shellcode play in this two-stage architecture?",
    options: [
      "It is a stager — a minimal initial payload whose only job is to fetch and execute the larger second-stage implant, keeping the initial delivery small and avoiding dropping the full payload to the target's disk.",
      "It is a dropper — a self-contained installer that extracts the embedded DLL from its own data section, writes it to the %TEMP% directory, and registers it as a COM object for persistence across reboots.",
      "It is a packer stub — a decompression routine that inflates the 4KB compressed form of the DLL back to its original 300KB size in memory, similar to how UPX or Themida unpacking stubs operate.",
      "It is a position-independent loader — a custom PE parser that maps the 300KB DLL into memory by manually processing its import table, relocation entries, and TLS callbacks without calling any Windows API.",
    ],
    correctIndex: 0,
    explanation:
      "Stagers are tiny (often shellcode) and their only job is to download the full payload (implant/beacon). This two-stage approach keeps the initial delivery small and avoids dropping the full implant to disk where AV can scan it.",
  },
  {
    slug: "md-l0-langs",
    competencyId: "maldev-techniques",
    depthTier: 0,
    sectionHeading: "Development languages",
    prompt:
      "A red team operator chooses C over C# for a custom implant. What technical advantage does C provide for this specific use case?",
    options: [
      "C produces small, dependency-free binaries with direct Win32 API access and full memory control — no managed runtime like the CLR is needed, reducing the implant's footprint and eliminating telemetry from AMSI and .NET ETW providers.",
      "C supports inline assembly for writing custom syscall stubs, but C# achieves the same via P/Invoke and Marshal.GetDelegateForFunctionPointer, making the language difference negligible for API-level evasion work in practice.",
      "C enables cross-compilation for Linux and macOS targets using GCC, while C# is Windows-only — for red teams targeting mixed enterprise environments C is the only viable option for a single-codebase cross-platform implant.",
      "C binaries are not subject to antivirus scanning because modern AV engines focus detection efforts on managed code (.NET, Java) and script interpreters — native compiled binaries pass through static analysis unexamined by endpoint protection.",
    ],
    correctIndex: 0,
    explanation:
      "C/C++ gives direct API access, tiny binaries, and no runtime (unlike .NET/Go). C# is popular for rapid development and reflection-based techniques. Rust offers memory safety with similar benefits to C. The key tradeoff is development speed vs. operational footprint.",
  },

  // ── L1 ──
  {
    slug: "md-l1-api",
    competencyId: "maldev-techniques",
    depthTier: 1,
    sectionHeading: "Windows API for offensive use",
    prompt:
      "You find a malware sample calling RegSetValueExA with arguments pointing to HKCU\\...\\CurrentVersion\\Run, a value name, and a binary path in %APPDATA%. What is the sample achieving with this API call?",
    options: [
      "Persistence via the user's Run key — this registry entry causes Windows to launch the specified binary automatically at each user logon, surviving reboots without requiring administrative privileges for the HKCU hive.",
      "Registry-based command-and-control — the sample stores encrypted C2 configuration data in the Run key, which it reads on each startup to determine the current callback address, using the registry as a covert data channel.",
      "Application compatibility shimming — the sample registers itself as a compatibility fix for a legitimate application, causing the Application Compatibility Framework to load its DLL alongside the target at every launch.",
      "Firewall rule creation — writing to the Run key programmatically triggers Windows Firewall to create an inbound allow rule for the referenced binary path, ensuring network connectivity for the implant without modifying firewall policy directly.",
    ],
    correctIndex: 0,
    explanation:
      "HKCU\\...\\Run entries execute on user logon (no admin needed). HKLM\\...\\Run requires admin but applies to all users. This is MITRE ATT&CK T1547.001 — one of the most common persistence mechanisms observed in the wild.",
  },
  {
    slug: "md-l1-shell",
    competencyId: "maldev-techniques",
    depthTier: 1,
    sectionHeading: "Basic reverse shell",
    prompt:
      "During dynamic analysis you observe a sample creating a socket, connecting to a remote IP, then spawning cmd.exe with its stdin, stdout, and stderr handles redirected to that socket. What has the sample constructed?",
    options: [
      "A reverse shell — redirecting cmd.exe's I/O handles to the socket lets the remote attacker type commands and receive output over the network, establishing interactive command execution on the compromised host.",
      "A file exfiltration channel — cmd.exe serves as a directory-walking engine that enumerates local files and streams their contents through the socket, using built-in commands like type and dir to collect data systematically.",
      "A remote logging agent — cmd.exe captures system diagnostic output (ipconfig, tasklist, systeminfo) and forwards it through the socket as a one-time status report, then disconnects after the transmission completes.",
      "A proxy tunnel — cmd.exe acts as an intermediary that relays arbitrary network traffic between the socket and local services, using pipe redirection to convert TCP connections into named-pipe IPC for lateral movement.",
    ],
    correctIndex: 0,
    explanation:
      "By setting STARTUPINFO handles to the socket, cmd.exe reads commands from the network and sends output back. This basic reverse shell has no encryption or evasion — real implants add TLS encryption, jitter, and modular post-exploitation functionality.",
  },
  {
    slug: "md-l1-test",
    competencyId: "maldev-techniques",
    depthTier: 1,
    sectionHeading: "Compilation and testing",
    prompt:
      "A red team operator wants to test whether their custom payload triggers Windows Defender. Why would uploading it to VirusTotal for testing be a critical operational mistake?",
    options: [
      "VirusTotal distributes all submitted samples to 70+ participating AV vendors who then create detection signatures — the custom payload would be burned, flagged by every vendor, and useless in future engagements.",
      "VirusTotal rate-limits submissions from non-enterprise accounts and queues them for days, making it impractical for iterative testing — local Windows Defender scans return results instantly and are the standard red team workflow.",
      "VirusTotal only runs static analysis without behavioral execution, so it would miss the payload's runtime evasion techniques and give a false sense of security that does not reflect real-time Defender protection behavior.",
      "VirusTotal attaches the submitter's IP address and account email to every submitted sample, allowing threat intelligence teams to attribute the payload directly to the operator's identity and testing infrastructure.",
    ],
    correctIndex: 0,
    explanation:
      "VirusTotal shares submitted samples with all participating AV vendors who then create signatures. Private scanning services (antiscan.me) or local Defender testing preserve OPSEC. Always test in isolated VMs (FlareVM, CommandoVM).",
  },

  // ── L2 ──
  {
    slug: "md-l2-inject",
    competencyId: "maldev-techniques",
    depthTier: 2,
    sectionHeading: "Process injection techniques",
    prompt:
      "You are analyzing a sample that calls OpenProcess, VirtualAllocEx, WriteProcessMemory, then CreateRemoteThread with a start address pointing to LoadLibraryA. What injection technique is this implementing?",
    options: [
      "Classic DLL injection — the sample opens a target process, allocates memory for a DLL path string, writes the path into the remote process, then creates a thread calling LoadLibraryA to load the attacker's DLL into that address space.",
      "Process hollowing — the sample suspends the target process, unmaps its original PE image from the base address, writes a replacement payload PE into the allocated memory, and creates a thread at the new entry point.",
      "APC injection — the sample queues an asynchronous procedure call to an existing alertable thread in the target process, using VirtualAllocEx only to stage the payload and CreateRemoteThread as a fallback delivery mechanism.",
      "Thread execution hijacking — the sample suspends an existing thread in the target, redirects its instruction pointer to the shellcode written via WriteProcessMemory, then resumes the thread with CreateRemoteThread.",
    ],
    correctIndex: 0,
    explanation:
      "Classic DLL injection: open the target process, allocate memory in it for the DLL path string, write the path, then create a remote thread that calls LoadLibraryA with that path — loading your DLL into the target.",
  },
  {
    slug: "md-l2-shellcode",
    competencyId: "maldev-techniques",
    depthTier: 2,
    sectionHeading: "Shellcode generation and execution",
    prompt:
      "Instead of casting VirtualAlloc'd memory to a function pointer, a shellcode runner passes the buffer address as a callback to EnumDesktopsA. Why is this callback-based approach used?",
    options: [
      "Callback-based execution is less suspicious to analysts and some security tools — the shellcode executes as a callback parameter to a legitimate Windows API rather than through an explicit call to a raw allocated memory address.",
      "EnumDesktopsA provides automatic DEP bypass — the Windows kernel marks the callback memory region as executable before invoking it, eliminating the need for a separate VirtualProtect call to change page permissions.",
      "The callback approach guarantees execution on a separate thread managed by the Window Station subsystem, which inherits a cleaner call stack that does not contain the attacker's module base addresses or return frames.",
      "EnumDesktopsA serializes callback execution through the CSRSS process which runs as SYSTEM — the shellcode inherits CSRSS's elevated token and security context for the duration of the enumeration callback.",
    ],
    correctIndex: 0,
    explanation:
      "Many Win32 APIs accept callback function pointers (EnumDesktopsA, CreateTimerQueueTimer, CertEnumSystemStore). Passing shellcode as the callback avoids the more suspicious pattern of casting VirtualAlloc'd memory to a function pointer and calling it directly.",
  },
  {
    slug: "md-l2-persist",
    competencyId: "maldev-techniques",
    depthTier: 2,
    sectionHeading: "Persistence mechanisms",
    prompt:
      "A threat hunter finds no suspicious Run keys, scheduled tasks, or startup folder entries on a compromised host, yet the implant still survives reboots. Where should they look next?",
    options: [
      "WMI event subscriptions — they persist in the WMI repository outside the registry's standard auto-start locations and consist of a filter, consumer, and binding that are invisible to tools scanning only conventional persistence points.",
      "NTFS Alternate Data Streams on system binaries — the implant could be hidden in an ADS attached to a legitimate executable like explorer.exe, causing the host binary to load the hidden payload whenever it runs at logon.",
      "Boot Configuration Data (BCD) store modifications — the implant may have added itself as an early-launch boot driver by editing the BCD, executing before the OS fully loads and before any endpoint security tools initialize.",
      "AppInit_DLLs registry value under HKLM — this legacy mechanism loads a specified DLL into every process that links user32.dll, providing persistence through a well-known registry key that many automated hunting tools overlook.",
    ],
    correctIndex: 0,
    explanation:
      "WMI event subscriptions (MITRE T1546.003) consist of a filter, consumer, and binding stored in the WMI repository. They don't appear in Autoruns by default (though modern Autoruns now checks). Specialized tools and WMI queries are needed to enumerate them.",
  },

  // ── L3 ──
  {
    slug: "md-l3-hollow",
    competencyId: "maldev-techniques",
    depthTier: 3,
    sectionHeading: "Advanced injection: process hollowing",
    prompt:
      "During analysis you see a sample create svchost.exe in a suspended state, call NtUnmapViewOfSection on its base address, write new PE content into the process, then resume the main thread. What technique is this and why is it stealthy?",
    options: [
      "Process hollowing — the malicious code runs under svchost.exe's name and PID. To task manager, EDR process lists, and casual inspection, it looks like a normal system process while actually executing the attacker's payload.",
      "Process doppelganging — the sample uses NTFS transacted file operations to create a temporary file containing the payload, maps it as the process image, then rolls back the transaction so no file artifact persists on disk.",
      "Process ghosting — the sample creates the target process, marks its backing file for deletion before the image section is fully mapped, then loads the payload image from a file handle that no longer exists on the filesystem.",
      "Process herpaderping — the sample modifies the on-disk content of svchost.exe after the OS has already mapped its image section into memory, so the file on disk no longer matches the code executing in the process.",
    ],
    correctIndex: 0,
    explanation:
      "Process hollowing: create svchost.exe suspended, unmap its code, write your PE, update the entry point, resume. The process appears as svchost.exe in task manager, but runs the attacker's code. Detection focuses on memory-to-disk image comparison.",
  },
  {
    slug: "md-l3-c2",
    competencyId: "maldev-techniques",
    depthTier: 3,
    sectionHeading: "C2 communication patterns",
    prompt:
      "Network analysis shows a beacon calling home every 30 seconds with sub-millisecond timing precision. After the operator adds jitter, callbacks range from 20 to 40 seconds. Why does this configuration change matter?",
    options: [
      "Fixed-interval beacons produce a detectable periodic pattern in traffic analysis — regular 30-second intervals are easily flagged by statistical tools. Random jitter breaks the periodicity, making traffic blend with normal user browsing patterns.",
      "The jitter reduces total network bandwidth consumption by spreading beacon intervals over a wider window, preventing congestion spikes that would alert network operations teams monitoring aggregate link utilization graphs.",
      "The timing variance prevents the C2 server from being overwhelmed — without jitter all implants in a campaign beacon simultaneously, causing request collisions that lead to dropped commands and unreliable tasking delivery.",
      "The randomized intervals defeat DNS TTL-based detection — when beacons resolve the C2 domain at fixed intervals, DNS cache logs show a suspicious pattern of identical TTL expirations that threat hunters easily correlate.",
    ],
    correctIndex: 0,
    explanation:
      "A beacon checking in exactly every 30 seconds is trivially detectable via traffic frequency analysis. Adding random jitter (e.g., 30s +/- 10s) breaks the regular pattern. Advanced C2 also uses domain fronting, legitimate cloud services, and DNS channels.",
  },
  {
    slug: "md-l3-rdll",
    competencyId: "maldev-techniques",
    depthTier: 3,
    sectionHeading: "Reflective DLL loading",
    prompt:
      "A blue team analyst runs Volatility's dlllist plugin on a memory dump and sees all expected modules for an svchost.exe process. Yet the process is clearly executing malicious code. What loading technique could explain the absence of a suspicious module?",
    options: [
      "Reflective DLL loading — it maps a DLL entirely from memory by manually parsing PE headers, processing relocations, and resolving imports without calling LoadLibrary. The module never appears in the PEB's Ldr module list that dlllist enumerates.",
      "DLL search-order hijacking — a malicious DLL with the same name as a legitimate dependency was placed earlier in the search path. It appears in the module list under a trusted name, so the analyst may have simply overlooked it.",
      "Process hollowing — the original svchost.exe image was entirely replaced with the attacker's PE before execution, so the module list correctly shows svchost.exe but the backing code in memory is completely different from the file on disk.",
      "Thread execution hijacking — the malicious code was injected as raw shellcode into an existing thread's stack memory. It occupies privately allocated memory pages but has no PE structure, so it would never appear in any DLL listing.",
    ],
    correctIndex: 0,
    explanation:
      "Reflective loading parses PE headers, processes relocations, resolves imports, and calls DllMain — all from memory. Since it never calls LoadLibrary, the DLL doesn't appear in the module list and no file touches disk. Detection requires scanning for unbacked executable memory.",
  },

  // ── L4 ──
  {
    slug: "md-l4-syscall",
    competencyId: "maldev-techniques",
    depthTier: 4,
    sectionHeading: "Direct syscalls",
    prompt:
      "Your implant uses Hell's Gate to resolve syscall numbers at runtime, but on a target host the mov eax, <number> pattern in NtWriteVirtualMemory is replaced with a JMP instruction by the EDR. How does Halo's Gate recover the correct syscall number?",
    options: [
      "Halo's Gate checks neighboring unhooked Zw* function stubs in ntdll — since syscall numbers are sequential, finding the number of an adjacent unhooked function and adding or subtracting the offset yields the target's correct number.",
      "Halo's Gate reads the SSDT directly from a mapped view of kernel memory — the SSDT contains the canonical syscall-to-handler mapping, which remains unaffected by user-mode inline hooks placed in ntdll's export stubs.",
      "Halo's Gate queries the KnownDlls object directory to find a cached clean copy of ntdll — Windows stores pre-mapped image sections of system DLLs there, and EDR products cannot hook these kernel-managed section copies.",
      "Halo's Gate disassembles the JMP instruction to follow the EDR's detour, then reads the original bytes preserved in the EDR's trampoline — the trampoline always stores the first 5 bytes including the original mov eax instruction.",
    ],
    correctIndex: 0,
    explanation:
      "Hell's Gate reads the syscall number from the mov eax, <number> instruction. If EDR has patched that instruction (inline hook), the bytes don't match. Halo's Gate checks adjacent Zw* functions and calculates the target number by offset.",
  },
  {
    slug: "md-l4-ppid",
    competencyId: "maldev-techniques",
    depthTier: 4,
    sectionHeading: "PPID spoofing and token manipulation",
    prompt:
      "A detection rule flags any cmd.exe process whose parent is a Microsoft Office application. An attacker modifies their macro payload to set PROC_THREAD_ATTRIBUTE_PARENT_PROCESS to explorer.exe's handle. What does this accomplish?",
    options: [
      "PPID spoofing — cmd.exe now appears as a child of explorer.exe, which is a normal parent for interactive commands, instead of Word or Excel. The parent-child relationship detection rule no longer fires on this process creation.",
      "Token stealing — the child process inherits explorer.exe's access token and security context, gaining the privileges and integrity level of the interactive desktop user rather than the Office application's restricted sandbox token.",
      "Session migration — cmd.exe launches in explorer.exe's window station and desktop, which is the interactive session. This makes the command prompt visible on screen but circumvents session-isolation security policy boundaries.",
      "Job object escape — assigning explorer.exe as the parent moves cmd.exe out of the Office application's job object, which normally restricts child process CPU, memory, and network resources to prevent macro-based resource abuse.",
    ],
    correctIndex: 0,
    explanation:
      "Using PROC_THREAD_ATTRIBUTE_PARENT_PROCESS, you specify which process appears as the parent. A cmd.exe seemingly spawned by explorer.exe is far less suspicious than one spawned by a macro-enabled document. The child's token comes from the real parent, not the spoofed one.",
  },
  {
    slug: "md-l4-dotnet",
    competencyId: "maldev-techniques",
    depthTier: 4,
    sectionHeading: "In-memory .NET execution",
    prompt:
      "An analyst finds a C++ binary that loads the CLR via ICLRMetaHost, creates a runtime host, and calls Assembly.Load with a byte array. Why is this pattern used instead of simply running a .NET executable from disk?",
    options: [
      "In-memory .NET execution — loading the CLR from unmanaged code and passing a byte array to Assembly.Load avoids writing the .NET payload to disk, so no file exists for AV static scanning, and the assembly can be decrypted at execution time.",
      "This approach enables cross-architecture execution — the C++ host runs on both x86 and ARM Windows, while the CLR byte array contains architecture-independent CIL code that JIT-compiles to the correct native instruction set at runtime.",
      "Loading through ICLRMetaHost bypasses .NET's Code Access Security (CAS) policy — assemblies loaded this way skip strong-name validation and permission demands that the standard CLR assembly resolver would enforce on disk-based assemblies.",
      "The byte array approach allows hot-patching — the C++ host can unload and reload a modified assembly without restarting the process, enabling rapid iteration during red team operations when the implant's C# post-exploitation modules need field updates.",
    ],
    correctIndex: 0,
    explanation:
      "Hosting the CLR (ICLRMetaHost, ICLRRuntimeHost) from unmanaged C/C++ and calling Assembly.Load with a byte array executes .NET payloads without any file on disk. The assembly can be AES-encrypted and only decrypted in memory at runtime.",
  },

  // ── L5 ──
  {
    slug: "md-l5-peloader",
    competencyId: "maldev-techniques",
    depthTier: 5,
    sectionHeading: "Custom PE loader",
    prompt:
      "You are building a custom PE loader that maps a DLL to a memory address different from its preferred ImageBase. After copying all sections, the code crashes on the first absolute address reference. What critical step did you miss?",
    options: [
      "Processing relocations — when the PE loads at a different base than its preferred ImageBase, all absolute address references in the code are wrong. The .reloc section lists offsets that must be adjusted by the delta between actual and preferred base.",
      "Flushing the instruction cache — after writing the PE sections to their new virtual addresses, the CPU's instruction cache may still hold stale data from the old memory contents, causing execution of invalid or outdated instructions.",
      "Applying section permissions — after copying all sections as RW for writing, you must call VirtualProtect to set correct page protections (RX for .text, RW for .data) before execution or the DEP policy will block all code paths.",
      "Initializing TLS callbacks — the PE's TLS directory specifies callback functions that must execute before the entry point. Skipping them leaves thread-local storage uninitialized, causing null-pointer dereferences in the DLL's global constructors.",
    ],
    correctIndex: 0,
    explanation:
      "PE files have a preferred ImageBase (e.g., 0x00400000). If that address is taken, the loader must adjust every absolute address reference by the delta (actual base - preferred base). The .reloc section lists which addresses to fix.",
  },
  {
    slug: "md-l5-pic",
    competencyId: "maldev-techniques",
    depthTier: 5,
    sectionHeading: "Position-independent code design",
    prompt:
      "A shellcode blob has no import table and no access to GetProcAddress, yet it successfully calls VirtualAlloc and other Win32 functions. How does it locate kernel32.dll's base address to begin resolving these APIs?",
    options: [
      "It walks the PEB via the GS segment register (64-bit) — reading GS:[0x60] to reach the PEB, then following Ldr.InMemoryOrderModuleList to find kernel32.dll, and manually parsing its export table to resolve function addresses.",
      "It scans memory backward from its own instruction pointer searching for the MZ/PE signature — since kernel32.dll is always mapped at a lower address than the shellcode, the first valid PE header encountered is assumed to be kernel32.",
      "It reads the kernel32.dll base address from the stack — the Windows loader always pushes the kernel32 base as a hidden parameter before invoking the thread entry point, so shellcode retrieves it from a fixed RSP offset.",
      "It issues a raw syscall to NtQuerySystemInformation with the SystemModuleInformation class — the kernel returns a list of all loaded modules including their base addresses, requiring no user-mode API or import table access.",
    ],
    correctIndex: 0,
    explanation:
      "Position-independent shellcode uses GS:[0x60] (64-bit) or FS:[0x30] (32-bit) to reach the PEB, then walks the InMemoryOrderModuleList to find kernel32.dll. From there, it manually parses the export table to find GetProcAddress and can resolve any other API.",
  },
  {
    slug: "md-l5-kernel",
    competencyId: "maldev-techniques",
    depthTier: 5,
    sectionHeading: "Kernel-mode techniques",
    prompt:
      "A threat actor loads a legitimately signed driver from 2015 that has a known arbitrary-write vulnerability, then uses it to disable EDR kernel callbacks. What technique is this and why is it effective?",
    options: [
      "BYOVD (Bring Your Own Vulnerable Driver) — the driver's valid Authenticode signature satisfies Windows driver signing enforcement, and its arbitrary-write vulnerability grants the attacker kernel read/write to modify security-critical structures.",
      "Driver Signature Enforcement bypass — the old driver exploits a Windows version-check flaw that allows it to load without a valid signature on newer OS builds, and the kernel write primitive is an unrelated secondary exploitation step.",
      "KPP (Kernel Patch Protection) evasion — the 2015 driver predates PatchGuard's monitoring scope for third-party driver memory regions, so any kernel modifications it makes to the SSDT are never included in integrity checksums.",
      "Certificate pinning bypass — the old driver's SHA-1 certificate has been revoked by the issuing CA, but the Windows driver verifier only checks the revocation list at install time, not at load time, so revoked drivers still load normally.",
    ],
    correctIndex: 0,
    explanation:
      "Windows requires drivers to be signed. BYOVD uses a driver that IS signed (by a legitimate vendor) but has a known vulnerability. LOLDrivers (loldrivers.io) catalogs hundreds of vulnerable signed drivers. The HVCI (Hypervisor-protected Code Integrity) blocklist mitigates some of these.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  evasion
  // ══════════════════════════════════════════════════════════════════════════

  // ── L0 ──
  {
    slug: "ev-l0-what",
    competencyId: "evasion",
    depthTier: 0,
    sectionHeading: "What is evasion",
    prompt:
      "A red team's payload bypasses Windows Defender's static scan but gets caught by the EDR's behavioral engine when it injects into explorer.exe. This illustrates that evasion must target multiple layers. Which layers must modern evasion address?",
    options: [
      "Antivirus (static signatures and heuristics), EDR (behavioral and API-call monitoring), AMSI (script and .NET content scanning), network monitoring (IDS/IPS traffic inspection), and application whitelisting (execution control policies).",
      "File system scanning (NTFS metadata and ADS inspection), memory forensics (Volatility-based live heap analysis), kernel integrity checks (PatchGuard's SSDT validation), and hardware security modules (TPM attestation of boot state).",
      "Windows Defender (real-time file protection), Windows Firewall (outbound connection rules), BitLocker (drive encryption and boot integrity measurement), and Credential Guard (VBS-isolated credential storage and access control).",
      "Static analysis (disassembler and decompiler pattern matching), dynamic analysis (sandbox behavioral recording and API logging), network forensics (full PCAP deep-packet analysis), and threat intelligence (IoC feeds and YARA rule scanning).",
    ],
    correctIndex: 0,
    explanation:
      "Modern defense is layered. Evasion must consider all layers: AV (static signatures), EDR (runtime behavior), AMSI (script content), network monitoring (traffic patterns), and application whitelisting (execution control). Defeating one layer while ignoring another leads to detection.",
  },
  {
    slug: "ev-l0-detect",
    competencyId: "evasion",
    depthTier: 0,
    sectionHeading: "Detection methods",
    prompt:
      "An attacker obfuscates their PowerShell downloader until no AV signature matches it. The EDR still flags it when it calls Invoke-WebRequest to download a second stage. Why did obfuscation fail to evade detection here?",
    options: [
      "The EDR uses behavioral detection — it monitors runtime actions like network downloads and suspicious command patterns rather than byte signatures. Obfuscation changes how code looks on disk, but the observable behavior at execution remains identical.",
      "The EDR uses script-block logging — PowerShell records the deobfuscated form of every command before execution, so the EDR matches its signature database against the clean reconstructed text rather than the obfuscated source code.",
      "The EDR uses machine-learning classification — it trained on code structure features like AST node types and call-graph shapes that survive syntactic obfuscation, detecting the same logical download pattern regardless of variable renaming.",
      "The EDR uses deep AMSI integration — PowerShell sends the full script content to AMSI before execution, and AMSI's deobfuscation engine unrolls variable substitution and string concatenation to reveal the original Invoke-WebRequest command.",
    ],
    correctIndex: 0,
    explanation:
      "Signature-based detection matches known byte patterns and is easily defeated by encoding. Behavioral analysis watches what the program does (inject into a process, download files, read lsass) regardless of how the code looks statically.",
  },

  // ── L1 ──
  {
    slug: "ev-l1-obfusc",
    competencyId: "evasion",
    depthTier: 1,
    sectionHeading: "Basic obfuscation",
    prompt:
      "You XOR-encrypt your shellcode with a single-byte key and embed it in a loader that decrypts and executes it at runtime. This bypasses AV static scanning. Why does the EDR still detect the payload after decryption?",
    options: [
      "XOR encoding only defeats static signature matching — once the loader decrypts the shellcode and executes it, the runtime behavior (API calls to VirtualAlloc, CreateRemoteThread, and network connections) is identical and triggers behavioral detection.",
      "The EDR maintains a database of known XOR decryption routines and pattern-matches the loader's decryption loop structure, flagging the binary based on the crypto stub's control flow rather than the encrypted payload content.",
      "The single-byte XOR key is trivially brute-forced by the EDR in real time — it tries all 256 possible keys against the encrypted blob, decrypts each candidate, and matches the results against its static signature database before execution.",
      "The XOR decryption produces a memory region whose entropy drops sharply from near-random ciphertext to structured executable code — the EDR monitors entropy transitions in newly allocated memory regions as a runtime decryption indicator.",
    ],
    correctIndex: 0,
    explanation:
      "XOR encoding (or any encoding) only hides the payload from static analysis. At runtime, the payload must decrypt and execute — at that point, behavioral monitors see the same suspicious API calls. The encoding buys time but not stealth.",
  },
  {
    slug: "ev-l1-lolbin",
    competencyId: "evasion",
    depthTier: 1,
    sectionHeading: "Living off the land",
    prompt:
      "Instead of dropping a custom downloader, an attacker uses certutil -urlcache -split -f to download a payload from a remote server. Why does this approach help evade security controls?",
    options: [
      "certutil is a legitimate, Microsoft-signed binary whitelisted by default — using it avoids triggering alerts for unknown custom executables and bypasses application whitelisting policies that would block an unsigned downloader.",
      "certutil encrypts the downloaded file using the machine's certificate store during transit, so network monitoring tools and IDS/IPS cannot inspect the payload content through deep packet inspection of the download stream.",
      "certutil downloads files through the Background Intelligent Transfer Service (BITS), which uses a separate network stack that bypasses the Windows Filtering Platform hooks used by host-based firewalls and EDR network monitors.",
      "certutil's download operation runs under the SYSTEM account via the CryptSvc service, so file system auditing records the download as a trusted system action rather than attributing it to the attacker's compromised user session.",
    ],
    correctIndex: 0,
    explanation:
      "Living-off-the-land uses trusted OS binaries for malicious purposes: certutil downloads files, mshta executes HTA, regsvr32 loads scriptlets. The LOLBAS Project catalogs these. Modern EDR detects suspicious LOLBin usage, but the technique remains effective against basic controls.",
  },
  {
    slug: "ev-l1-aes",
    competencyId: "evasion",
    depthTier: 1,
    sectionHeading: "Payload encoding",
    prompt:
      "You upgrade from single-byte XOR to AES-256-CBC for encrypting your shellcode payload before embedding it. Why is AES significantly harder for security tools to defeat compared to XOR?",
    options: [
      "Without the AES key the ciphertext is computationally indistinguishable from random data — AV cannot brute-force a 256-bit key to decrypt and signature-match, unlike XOR where all 256 single-byte keys can be tried in milliseconds.",
      "AES-CBC produces ciphertext blocks that all have uniform length and identical entropy, so the output passes entropy-based packer detection heuristics — XOR preserves the original data's entropy distribution and structural patterns.",
      "AES decryption uses the Windows CNG API (BCryptDecrypt), which is a trusted Microsoft system call that EDR products whitelist by default — the decryption operation itself is never flagged, unlike custom XOR loop patterns.",
      "AES encryption adds authentication via CBC-MAC that validates the payload's integrity before execution — if a scanner modifies the ciphertext to attempt analysis, decryption produces corrupted output that crashes safely without executing.",
    ],
    correctIndex: 0,
    explanation:
      "AES with a random key produces ciphertext that is indistinguishable from random data to any scanner. The key can be delivered separately (embedded, fetched from C2, derived from environment). XOR with a short key is trivially reversible.",
  },

  // ── L2 ──
  {
    slug: "ev-l2-amsi",
    competencyId: "evasion",
    depthTier: 2,
    sectionHeading: "AMSI bypass techniques",
    prompt:
      "A PowerShell payload is caught immediately upon execution even though the script was never written to disk. What scanning mechanism detected it, and at what point in the execution pipeline?",
    options: [
      "AMSI (Antimalware Scan Interface) — it intercepts script content at runtime before execution, sending the deobfuscated command text to the AV engine. Even fileless payloads downloaded and executed via IEX are scanned before they run.",
      "Script Block Logging — PowerShell's built-in deep logging records every command to the Windows Event Log before execution, and Defender's real-time log monitor matches the logged content against its current signature database.",
      "Constrained Language Mode — PowerShell's security policy restricts untrusted scripts to a safe language subset, and the payload used a blocked cmdlet like Invoke-Expression that triggered an immediate policy violation alert.",
      "Defender's real-time memory scanner — it periodically scans all process memory pages for known malicious byte patterns, and detected the payload in PowerShell's managed heap after string allocation but before the execution engine ran it.",
    ],
    correctIndex: 0,
    explanation:
      "AMSI intercepts script content at runtime, before execution. This catches fileless attacks (IEX download cradles). Bypass approaches: patching AmsiScanBuffer in memory, .NET reflection to set amsiInitFailed, or obfuscating the specific trigger strings.",
  },
  {
    slug: "ev-l2-sandbox",
    competencyId: "evasion",
    depthTier: 2,
    sectionHeading: "Sandbox evasion",
    prompt:
      "A malware sample calls Sleep(10000) then checks GetTickCount64 to verify that at least 9 seconds actually elapsed. If the elapsed time is less, the sample exits immediately without detonating. What environment is this check designed to detect?",
    options: [
      "An automated analysis sandbox — sandboxes often fast-forward or skip Sleep calls to accelerate analysis. If 10 seconds of requested sleep completes in under 9 seconds of wall-clock time, the environment is artificially manipulating execution timing.",
      "A debugger with time dilation — single-stepping through instructions causes GetTickCount64 to advance faster than real time because the debug trap handler overhead inflates the reported tick count beyond the actual elapsed duration.",
      "A virtual machine with a paravirtualized clock — hypervisors like VMware use a synthetic TSC that drifts slightly faster than real hardware, causing GetTickCount64 to report more elapsed time than the physical duration of the sleep.",
      "A remote desktop session with high network latency — RDP compresses idle periods for bandwidth efficiency, so the remote session's clock advances faster than the client's wall-clock time, producing detectable timing discrepancies.",
    ],
    correctIndex: 0,
    explanation:
      "Automated sandboxes have limited analysis time, so they often skip or shorten Sleep calls. Checking elapsed time catches this. Other sandbox indicators: low CPU count, low RAM, VM artifacts (VMware Tools registry keys), and presence of analysis tools.",
  },
  {
    slug: "ev-l2-apihash",
    competencyId: "evasion",
    depthTier: 2,
    sectionHeading: "API hashing",
    prompt:
      "A malware binary has only two imports — LoadLibraryA and GetProcAddress — yet it calls dozens of Windows APIs at runtime. Static analysis reveals hardcoded 32-bit constants being compared against values in a loop. What technique is this?",
    options: [
      "API hashing — the binary walks loaded module export tables at runtime, hashes each exported function name, and compares it against precomputed 32-bit constants. This hides the actual API names from the import table and string analysis.",
      "Import table obfuscation — the binary's real import entries are AES-encrypted in a custom PE section and decrypted at load time by a TLS callback, which rebuilds the IAT before the entry point runs so the loader never sees them.",
      "Delayed import loading — the binary uses the PE delayed-import mechanism with custom descriptors that encode function names as CRC32 checksums, which the delay-load helper DLL resolves on first invocation of each function.",
      "Ordinal-based importing — the binary imports functions by their numeric export ordinal rather than by name, and the 32-bit constants are packed ordinal/DLL-index pairs that GetProcAddress resolves using the MAKEINTRESOURCE macro.",
    ],
    correctIndex: 0,
    explanation:
      "Normally, the PE import table lists every DLL and function. API hashing walks the PEB to find each DLL and its export table, hashes export names, and compares against precomputed constants — leaving no readable function names in the binary for static analysis.",
  },

  // ── L3 ──
  {
    slug: "ev-l3-unhook",
    competencyId: "evasion",
    depthTier: 3,
    sectionHeading: "Unhooking ntdll",
    prompt:
      "Before making sensitive API calls, your implant reads ntdll.dll from C:\\Windows\\System32, maps it into the process, and copies its .text section over the currently loaded ntdll's .text section. What does this accomplish?",
    options: [
      "Ntdll unhooking — the on-disk copy is unmodified by EDR, so overwriting the in-memory .text section with the original clean bytes removes all inline hooks (JMP patches) the EDR placed on ntdll functions in the current process.",
      "ASLR re-randomization — remapping ntdll from disk assigns it a new randomized base address, breaking any EDR analysis that depends on the original load address to locate its hook trampolines and function entry points.",
      "Code signing revalidation — the Windows integrity checker verifies that ntdll's in-memory code hash matches the on-disk signed hash at each API call, so refreshing from disk prevents the integrity check from flagging hook modifications.",
      "Memory entropy normalization — the EDR's injected JMP instructions raise the hooked ntdll's entropy above normal baselines, and copying the clean .text section restores expected entropy levels to pass memory-scanning heuristics.",
    ],
    correctIndex: 0,
    explanation:
      "EDR hooks are applied at runtime to the in-memory copy of ntdll. The file on disk (C:\\Windows\\System32\\ntdll.dll) retains the original bytes. Reading it, then overwriting the hooked .text section restores clean function code for the current process.",
  },
  {
    slug: "ev-l3-sleep",
    competencyId: "evasion",
    depthTier: 3,
    sectionHeading: "Sleep obfuscation",
    prompt:
      "An implant encrypts its own memory pages and changes their protection from RX to RW before entering a 60-second sleep, then decrypts and restores RX when the timer fires. What threat does this technique counter?",
    options: [
      "In-memory signature scanning — memory scanners search process memory for known implant byte patterns. During sleep the encrypted pages contain only ciphertext and appear as ordinary RW data, not executable code with recognizable signatures.",
      "Working set analysis — the OS trims idle RX pages from the process working set to reclaim physical memory. Keeping them as RW prevents the pages from being paged out to the pagefile where disk forensics could recover their contents.",
      "Thread stack analysis — security tools inspect sleeping threads' call stacks to identify implants. Changing the code pages to RW makes the return addresses pointing into them unresolvable, so stack-walking tools report benign unknown frames.",
      "Hardware performance counter monitoring — Intel Processor Trace records all executed branches from RX pages. Downgrading to RW ensures the CPU does not record the implant's code execution pattern into the PT trace buffer for later analysis.",
    ],
    correctIndex: 0,
    explanation:
      "Techniques like Ekko (timer-based) and Foliage (APC-based) encrypt the implant's memory pages before sleeping, then decrypt when the sleep timer fires. The memory protection is also changed from RX to RW, so it looks like data, not code.",
  },
  {
    slug: "ev-l3-etw",
    competencyId: "evasion",
    depthTier: 3,
    sectionHeading: "ETW patching",
    prompt:
      "Your implant patches ntdll!EtwEventWrite to return immediately (xor eax, eax; ret), silencing .NET assembly load events and PowerShell logging in the process. The EDR's kernel Threat Intelligence provider still records your API calls. Why?",
    options: [
      "The Threat Intelligence ETW provider runs in kernel mode behind PPL protection — user-mode patches to EtwEventWrite only affect user-mode ETW providers within the patched process, leaving kernel-generated telemetry completely unaffected.",
      "The EDR subscribes to a shadow ETW session registered under the Secure Kernel — user-mode patching disables the primary session but the shadow session runs in VBS-isolated memory and continues emitting events independently of ntdll.",
      "The ETW runtime detects the code patch through integrity validation — when EtwEventWrite's first bytes do not match the expected function prologue, the runtime falls back to a secondary event-delivery path that bypasses the patched function.",
      "The EDR uses a separate telemetry channel through the WFP (Windows Filtering Platform) callout driver — it monitors syscall patterns by intercepting the kernel's syscall dispatcher rather than relying on ETW event delivery mechanisms.",
    ],
    correctIndex: 0,
    explanation:
      "Patching ntdll!EtwEventWrite silences user-mode ETW events (.NET assembly loads, PowerShell execution) in that process. But the kernel-level Threat Intelligence provider feeds Defender/EDR directly from the kernel — completely untouchable from user mode.",
  },

  // ── L4 ──
  {
    slug: "ev-l4-callback",
    competencyId: "evasion",
    depthTier: 4,
    sectionHeading: "Callback-based execution",
    prompt:
      "Instead of calling CreateThread to execute shellcode, your loader uses TpAllocWork and TpPostWork from the Windows thread pool API. Why is this less likely to trigger EDR detection?",
    options: [
      "EDR products heavily instrument CreateThread and CreateRemoteThread as high-signal injection indicators. Thread pool work items execute through the legitimate Windows thread pool infrastructure, which receives significantly less behavioral monitoring.",
      "Thread pool work items run on threads owned by the ntdll thread pool manager with pre-allocated signed stacks — the thread's call stack traces back to ntdll instead of the attacker's module, effectively spoofing the execution origin.",
      "TpAllocWork uses an undocumented syscall (NtAllocateVirtualMemoryEx) that is not in the EDR's hook table because Microsoft does not publish its prototype, making it structurally impossible for the EDR to instrument that code path.",
      "The thread pool batches multiple work items for simultaneous execution — the EDR's per-thread behavioral tracking cannot isolate the shellcode execution from the other benign work items sharing the same pool thread's execution context.",
    ],
    correctIndex: 0,
    explanation:
      "CreateThread and CreateRemoteThread are high-signal APIs for EDR. Alternatives: TpAllocWork (thread pool), CreateFiber/SwitchToFiber (cooperative threading), QueueUserAPC (async procedure calls). Each avoids the most-watched code path while achieving the same result.",
  },
  {
    slug: "ev-l4-stomp",
    competencyId: "evasion",
    depthTier: 4,
    sectionHeading: "Module stomping and phantom DLL loading",
    prompt:
      "After loading a signed, benign DLL into your process, you overwrite its .text section with shellcode and execute it. A memory scanner checks whether executable regions are backed by on-disk files. Why does your shellcode pass this check?",
    options: [
      "The memory region remains file-backed by the signed DLL on disk — the scanner sees code executing from a known, trusted module rather than from suspicious unbacked (privately allocated) executable memory, which is a common detection signal.",
      "Overwriting .text triggers copy-on-write which creates a private page, but the scanner checks the VAD (Virtual Address Descriptor) which still references the original on-disk file, so the private page inherits the file-backed classification.",
      "The DLL's Authenticode signature remains valid after the .text overwrite because code signing covers only the PE headers and certificate table, not individual section contents — the scanner verifies the signature and trusts the entire module.",
      "The signed DLL's section permissions are locked by the loader — the overwrite is silently committed only to the process's private working set, while the scanner reads the shared section object which still contains the original trusted code.",
    ],
    correctIndex: 0,
    explanation:
      "Module stomping: load a benign DLL, overwrite its .text section with shellcode. Memory scanners checking for unbacked executable memory see a file-backed region (the DLL on disk). Phantom DLL hollowing uses SEC_IMAGE for even cleaner mapping.",
  },
  {
    slug: "ev-l4-indirect",
    competencyId: "evasion",
    depthTier: 4,
    sectionHeading: "Indirect syscalls and call stack spoofing",
    prompt:
      "A direct syscall implementation in your implant triggers an alert because the EDR detects the syscall instruction executing from a non-ntdll memory region. How do indirect syscalls fix this detection?",
    options: [
      "Indirect syscalls jump to the syscall;ret gadget inside ntdll's actual code — the instruction pointer (RIP) at the moment of the syscall is in ntdll's legitimate address range, so the EDR's return-address validation sees the expected origin.",
      "Indirect syscalls route through a kernel trampoline that normalizes the return address — the kernel's syscall dispatcher rewrites the stored return frame before invoking the service handler, masking the original caller's module address.",
      "Indirect syscalls use INT 2E (the legacy interrupt-based system call mechanism) instead of the modern syscall instruction — the EDR only monitors the syscall opcode, so the INT 2E path executes without any interception or logging.",
      "Indirect syscalls embed the syscall stub inside a ROP chain constructed on the stack — the EDR only validates the direct caller's RIP at the syscall site, not the full return chain, so the stub's real module origin is never examined.",
    ],
    correctIndex: 0,
    explanation:
      "EDR checks the return address on a syscall: if it's not in ntdll's address range, it's a direct syscall from attacker code. Indirect syscalls jump to the actual syscall;ret gadget in ntdll. Call stack spoofing goes further by faking the entire stack trace.",
  },

  // ── L5 ──
  {
    slug: "ev-l5-hyper",
    competencyId: "evasion",
    depthTier: 5,
    sectionHeading: "Hypervisor-level evasion",
    prompt:
      "A rootkit installs a thin hypervisor beneath the running OS, making the OS a VM guest. An endpoint security tool inside the OS reports the system as clean. Why can it not detect the rootkit?",
    options: [
      "The rootkit sits below the OS at Ring -1 — all OS-level security tools run inside the guest and see only what the hypervisor allows. The hypervisor intercepts and can modify the guest's view of memory, MSRs, and hardware state transparently.",
      "The hypervisor replaces the OS's UEFI runtime services with shadow implementations that return clean responses — the security tool's firmware integrity checks pass because the shadow UEFI reports unmodified PCR boot measurements.",
      "The hypervisor intercepts the security tool's disk I/O requests and returns original unmodified system files — the tool compares on-disk hashes against known-good baselines and finds no differences from a clean default installation.",
      "The hypervisor places the security tool in a separate unprivileged VM that receives a synthetic view of the hardware — the tool scans the synthetic environment which is genuinely clean while the rootkit operates in the host partition.",
    ],
    correctIndex: 0,
    explanation:
      "A thin hypervisor places itself between hardware and OS, making the OS a VM guest. Security tools in the guest see only what the hypervisor allows. Defense: Secure Boot chain of trust, TPM measurements, and VBS (which uses its own hypervisor).",
  },
  {
    slug: "ev-l5-edr",
    competencyId: "evasion",
    depthTier: 5,
    sectionHeading: "EDR architecture and blind spots",
    prompt:
      "A shellcode loader executes its payload during the DLL_PROCESS_ATTACH callback of a very early loaded DLL, before the EDR's user-mode DLL is injected into the process. Why does this create a detection blind spot?",
    options: [
      "EDR user-mode monitoring relies on its DLL being loaded and its hooks placed first. Code executing before that injection completes runs with no user-mode instrumentation — inline hooks, AMSI initialization, and ETW registrations are not yet active.",
      "Early DLL_PROCESS_ATTACH callbacks run under the loader lock, which prevents thread creation — the EDR's DLL cannot spawn its monitoring thread until the lock is released, but by then the shellcode has already executed and erased itself.",
      "The Windows loader prioritizes DLL_PROCESS_ATTACH order by each DLL's PE timestamp — a DLL with an earlier compilation timestamp always initializes before the EDR's DLL, regardless of the kernel's image-load notification order.",
      "The loader processes DLL_PROCESS_ATTACH in reverse dependency order — since the EDR DLL has no declared dependency on early system DLLs, it initializes last after all system modules, and the attacker's early DLL exploits this ordering.",
    ],
    correctIndex: 0,
    explanation:
      "EDR DLLs are injected after process creation but before the main thread runs (usually via image load callbacks + APC). Racing that window, or executing from contexts the EDR doesn't instrument (early DLL loads, WoW64 transitions), creates blind spots.",
  },
  {
    slug: "ev-l5-frontier",
    competencyId: "evasion",
    depthTier: 5,
    sectionHeading: "Research frontiers",
    prompt:
      "A threat intelligence report describes a UEFI implant persisting in SPI flash on the motherboard. The victim reimages the hard drive and reinstalls Windows, but the implant returns. Why does this persistence defeat standard remediation?",
    options: [
      "The implant lives in UEFI firmware on the motherboard's SPI flash chip — it exists below the disk layer entirely, so reformatting, drive replacement, and OS reinstallation do not touch it. Only firmware reflashing or motherboard replacement removes it.",
      "The implant uses a Thunderbolt DMA attack to rewrite the MBR from an external device after every reinstallation — the persistence is not in firmware but in a hardware implant on the PCIe bus that survives disk-level operations.",
      "The implant infects the Intel Management Engine (ME) firmware running on a separate co-processor — ME firmware updates independently of UEFI and survives SPI flash reflashing because it occupies a hardware-protected flash region.",
      "The implant hides in the HDD/SSD controller's microcode — it intercepts disk read and write operations to reinject itself into the boot chain after reinstallation. Replacing the drive itself would actually remove this type of implant.",
    ],
    correctIndex: 0,
    explanation:
      "UEFI firmware implants (like LoJax, MosaicRegressor) live in SPI flash — below the disk. Reformatting, reinstalling, even swapping the drive won't remove them. Detection requires firmware integrity scanning and Secure Boot enforcement.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  reverse-engineering
  // ══════════════════════════════════════════════════════════════════════════

  // ── L0 ──
  {
    slug: "re-l0-what",
    competencyId: "reverse-engineering",
    depthTier: 0,
    sectionHeading: "What is reverse engineering",
    prompt: "A binary makes network connections you want to trace. Which approach lets you see the actual connection targets without reading assembly?",
    options: [
      "Run it under strace/ltrace to log runtime syscalls and library calls — connections appear as connect() calls with resolved addresses.",
      "Run it under a debugger like GDB and observe the connect() arguments as they hit the breakpoint at each call site.",
      "Load it into Ghidra and follow cross-references from the connect import to find the hardcoded IP/port in the disassembly.",
      "Use strace to intercept DNS queries, then correlate with pcap to find the server IP before the binary ever calls connect().",
    ],
    correctIndex: 0,
    explanation:
      "strace/ltrace log syscalls and library calls at runtime without needing to understand the binary's code. connect() calls show target IP/port directly. Debugging would also work but requires setup; static analysis in Ghidra reveals hardcoded values but misses dynamically resolved targets.",
  },
  {
    slug: "re-l0-vocab",
    competencyId: "reverse-engineering",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt: "You run `file` on a binary and see 'ELF 64-bit, stripped'. What specific information has been removed by stripping?",
    options: [
      "Debug symbols: function names, variable names, type info, and source-line mappings — the analyst sees only raw addresses like sub_401000.",
      "The ELF section headers and program headers that tell the loader how to map the binary into memory.",
      "The .text section's executable machine code, leaving only data sections and the dynamic linker reference.",
      "The import table entries for shared library calls, so the dynamic linker cannot resolve external functions.",
    ],
    correctIndex: 0,
    explanation:
      "Stripping removes the .symtab and .strtab sections containing function names, variable names, and type info. The code and structure remain intact — the binary runs identically, but a human analyst loses the readable labels and must reconstruct meaning manually.",
  },

  // ── L1 ──
  {
    slug: "re-l1-first",
    competencyId: "reverse-engineering",
    depthTier: 1,
    sectionHeading: "First steps with a binary",
    prompt: "You have an unknown Linux binary. Before opening a disassembler, which combination of commands gives the most useful initial triage?",
    options: [
      "`file` (format/arch/linking), `strings` (embedded text), `readelf -h` (entry point/sections) — together they reveal format, potential functionality hints, and structure.",
      "`objdump -d` to disassemble the full binary, `nm` to list all symbol names, and `ldd` to check which shared libraries it links.",
      "`checksec` (protections), `readelf -l` (segments), `ltrace` (library calls) — they reveal security mitigations and runtime dependencies.",
      "`hexdump -C | head` (magic bytes), `size` (section sizes), `file` (format) — they confirm it is an ELF and show how code/data are distributed.",
    ],
    correctIndex: 0,
    explanation:
      "file identifies format, architecture, and whether it's stripped. strings reveals embedded text (URLs, error messages, passwords). readelf shows the entry point and section layout. This triage takes seconds and guides where to focus deeper analysis.",
  },
  {
    slug: "re-l1-ghidra",
    competencyId: "reverse-engineering",
    depthTier: 1,
    sectionHeading: "Ghidra basics",
    prompt: "In Ghidra, you see a function parameter typed as `undefined4`. Retyping it to `char *` changes the decompiler output significantly. Why?",
    options: [
      "The decompiler uses type info to interpret memory operations — a char* tells it the value is a pointer to a string, so it shows string comparisons and indexing instead of raw integer arithmetic.",
      "Retyping the parameter forces Ghidra to re-analyze the function's control flow graph, which can split or merge basic blocks based on the new data flow.",
      "Ghidra propagates the new type to all callers of the function via cross-references, causing their decompilation to change even if the callers cast the value.",
      "The new type changes the function's calling convention from stdcall to cdecl, which shifts how the decompiler assigns parameters to registers vs. stack slots.",
    ],
    correctIndex: 0,
    explanation:
      "Ghidra's decompiler produces pseudo-C based on known types. Changing undefined4 to char* tells it that pointer arithmetic is string indexing, comparisons are strcmp-like operations, and dereferences read characters. The output becomes dramatically more readable.",
  },
  {
    slug: "re-l1-x64dbg",
    competencyId: "reverse-engineering",
    depthTier: 1,
    sectionHeading: "x64dbg basics (Windows)",
    prompt: "A crackme has anti-tamper code that detects software breakpoints. Which x64dbg feature lets you break on execution without being detected by int3 scans?",
    options: [
      "Hardware breakpoints — they use CPU debug registers (DR0-DR3) instead of patching an 0xCC byte into the code, so integrity checks on the code section pass.",
      "Memory breakpoints — they mark the target page as non-executable so the CPU traps on fetch, and the original bytes remain unmodified in the page.",
      "Conditional breakpoints with a log-only action — the breakpoint is still int3 but executes so fast the timing check window is too narrow to detect it.",
      "Trace-over mode — x64dbg uses single-stepping via the TF flag in EFLAGS instead of inserting any breakpoint byte into the code stream.",
    ],
    correctIndex: 0,
    explanation:
      "Software breakpoints replace a code byte with 0xCC (int3). Anti-tamper code checksums the .text section and detects the modification. Hardware breakpoints use DR0-DR3 debug registers (limited to 4) and leave the code untouched. Memory breakpoints also avoid code modification but are slower.",
  },

  // ── L2 ──
  {
    slug: "re-l2-cflow",
    competencyId: "reverse-engineering",
    depthTier: 2,
    sectionHeading: "Control flow analysis",
    prompt: "You see `mov rdi, rbx; mov rsi, rsp; call sub_401200` in a Linux x86-64 binary. Under System V AMD64, what are the first and second arguments?",
    options: [
      "First argument (RDI) is the value from RBX, second argument (RSI) is the current stack pointer — the function receives a pointer/value and a stack address.",
      "First argument (RCX) is RBX, second (RDX) is RSP — the Windows x64 convention uses RCX/RDX for the first two parameters.",
      "Both arguments are on the stack — the mov instructions store them at RSP and RSP+8 for the callee to pop after the call.",
      "First argument is RSI (source index for string ops), second is RDI (destination) — the names reflect their string-operation roles.",
    ],
    correctIndex: 0,
    explanation:
      "System V AMD64 (Linux/macOS) passes the first 6 integer arguments in RDI, RSI, RDX, RCX, R8, R9, return in RAX. Windows x64 uses RCX, RDX, R8, R9. Recognizing the calling convention is essential — it tells you what each register means at a call site.",
  },
  {
    slug: "re-l2-algo",
    competencyId: "reverse-engineering",
    depthTier: 2,
    sectionHeading: "Identifying algorithms",
    prompt: "You find the byte sequence 0x63, 0x7C, 0x77, 0x7B in a binary's .rodata section. What algorithm does this strongly suggest?",
    options: [
      "AES — those are the first four bytes of the AES S-box substitution table, a unique constant embedded by all standard AES implementations.",
      "SHA-256 — those are the fractional parts of the first four prime numbers used as initialization vector constants.",
      "RC4 — they represent the initial state of the 256-byte permutation array before key scheduling scrambles it.",
      "ChaCha20 — those are part of the \"expand 32-byte k\" ASCII constant converted to little-endian word format.",
    ],
    correctIndex: 0,
    explanation:
      "Crypto algorithms embed recognizable constants. AES uses a fixed 256-byte S-box starting with 0x63, 0x7C, 0x77, 0x7B. SHA-256 starts with 0x6A09E667. Tools like FindCrypt (IDA/Ghidra) and YARA crypto rules automate this identification.",
  },
  {
    slug: "re-l2-gdb",
    competencyId: "reverse-engineering",
    depthTier: 2,
    sectionHeading: "Dynamic analysis with GDB",
    prompt: "You want to find which instruction modifies a global flag at 0x404000, but you don't know which function writes to it. Which GDB command helps?",
    options: [
      "`watch *0x404000` — sets a hardware watchpoint that breaks on any write to that address, showing exactly which instruction modified it.",
      "`break *0x404000` — sets a breakpoint at that address so execution stops when the instruction pointer reaches it.",
      "`display *0x404000` — prints the value at that address after every step, letting you notice when it changes manually.",
      "`catch syscall write` — intercepts write() syscalls to detect when any process writes data to memory address 0x404000.",
    ],
    correctIndex: 0,
    explanation:
      "watch sets a hardware watchpoint using debug registers (DR0-DR3). It breaks on write; rwatch breaks on read; awatch breaks on either. The debugger stops at the exact instruction that modified the memory, with full register context. Break would only work if 0x404000 contained code, not data.",
  },

  // ── L3 ──
  {
    slug: "re-l3-unpack",
    competencyId: "reverse-engineering",
    depthTier: 3,
    sectionHeading: "Malware unpacking",
    prompt: "Detect It Easy shows entropy >7.0 in the .text section and only 3 imports (LoadLibrary, GetProcAddress, VirtualAlloc). What does this indicate?",
    options: [
      "The binary is packed — high entropy means compressed/encrypted code, and the minimal imports are just enough for the unpacking stub to resolve APIs at runtime.",
      "The binary is statically linked — all library code is compiled in, so .text is large and entropy is high from diverse instruction patterns.",
      "The binary uses position-independent code with heavy ASLR relocations, which inflates section entropy due to relocation fixup tables.",
      "The binary was compiled with aggressive link-time optimization (LTO), which inlines and merges functions, increasing code density and entropy.",
    ],
    correctIndex: 0,
    explanation:
      "Packed binaries compress or encrypt the real code. The visible imports are just enough for the unpacking stub (allocate memory, resolve APIs, decompress). Normal .text entropy is 5.5-6.5; >7.0 strongly suggests compression/encryption. Manual unpacking: find OEP after the stub runs, then dump.",
  },
  {
    slug: "re-l3-antidebug",
    competencyId: "reverse-engineering",
    depthTier: 3,
    sectionHeading: "Anti-debugging bypass",
    prompt: "A malware sample calls IsDebuggerPresent and exits if it returns TRUE. What is the simplest bypass in x64dbg?",
    options: [
      "Set PEB.BeingDebugged (offset 0x2 in the PEB) to 0 — IsDebuggerPresent just reads this byte, so zeroing it makes the check pass.",
      "Patch the call to IsDebuggerPresent with NOPs — this skips the API call entirely and the return value in EAX will be whatever was there before.",
      "Set a breakpoint on IsDebuggerPresent and change EAX to 0 in the register view before returning — the function already ran but the caller sees FALSE.",
      "Use ScyllaHide to hook NtQueryInformationProcess — it intercepts the ProcessDebugPort query that IsDebuggerPresent forwards to internally.",
    ],
    correctIndex: 0,
    explanation:
      "IsDebuggerPresent reads a single byte (PEB.BeingDebugged at PEB+0x2). Setting it to 0 in x64dbg's memory dump is instant and persists for the session. NOPing also works but modifies code. Patching EAX on return works per-call. ScyllaHide automates all these bypasses for complex samples.",
  },
  {
    slug: "re-l3-script",
    competencyId: "reverse-engineering",
    depthTier: 3,
    sectionHeading: "Scripting analysis with Ghidra",
    prompt: "You need to find every function in a 5MB binary that calls VirtualAlloc and also references an XOR instruction. Which Ghidra scripting approach is most efficient?",
    options: [
      "Iterate all functions, check cross-references to VirtualAlloc, then decompile each match and search the decompiler output for XOR patterns — scripting automates both checks.",
      "Use the Ghidra search bar to find VirtualAlloc references, manually open each function, and visually scan the disassembly listing for XOR instructions.",
      "Export the entire binary as a flat assembly listing with Ghidra's exporter, then use grep to find functions containing both VirtualAlloc and xor.",
      "Write a YARA rule with two string patterns (VirtualAlloc and the XOR opcode 0x31/0x33) and scan the binary externally, then cross-reference hits in Ghidra.",
    ],
    correctIndex: 0,
    explanation:
      "Ghidra's scripting API (Java/Python) can enumerate functions, follow cross-references, and invoke the decompiler programmatically. This automates a task that would take hours manually on a large binary — iterate, filter by xrefs, then grep decompiler output.",
  },

  // ── L4 ──
  {
    slug: "re-l4-bindiff",
    competencyId: "reverse-engineering",
    depthTier: 4,
    sectionHeading: "Binary diffing and patch analysis",
    prompt: "BinDiff shows a single changed function between a pre-patch and post-patch DLL: the new version adds a length check before a memcpy. What does this tell you about the vulnerability?",
    options: [
      "The vulnerability was a buffer overflow — the missing bounds check allowed memcpy to write past the buffer, and the patch adds the validation the original code lacked.",
      "The vulnerability was a use-after-free — the added length check ensures the buffer hasn't been freed before memcpy copies data into it.",
      "The vulnerability was a type confusion — the length check validates that the source data matches the expected struct size before the memcpy cast.",
      "The vulnerability was an integer overflow — the length check prevents the size parameter from wrapping around to a small value that passes a smaller-than-expected allocation.",
    ],
    correctIndex: 0,
    explanation:
      "Binary diffing reveals what the patch fixes. An added bounds check before memcpy directly implies the original code had no length validation, allowing a buffer overflow. This is the core of 1-day exploit development: the patch itself reveals the vulnerability class and location.",
  },
  {
    slug: "re-l4-symexec",
    competencyId: "reverse-engineering",
    depthTier: 4,
    sectionHeading: "Symbolic execution and constraint solving",
    prompt: "A CTF crackme applies 12 arithmetic transforms to user input and checks the result against a constant. How does angr find the correct input?",
    options: [
      "It treats the input as symbolic variables, tracks all transforms as constraints, then uses the Z3 SMT solver to find concrete values that satisfy the final comparison.",
      "It brute-forces all possible input strings character by character, using the binary's exit code to determine which characters are correct.",
      "It emulates the binary with random inputs in parallel threads, using coverage-guided feedback to steer toward the success path.",
      "It decompiles the transform chain into Python, then symbolically inverts each operation in reverse order to compute the original input algebraically.",
    ],
    correctIndex: 0,
    explanation:
      "angr represents inputs as symbolic bitvectors and builds constraints for every operation along the execution path. When the target state (e.g., stdout = 'Correct') is reached, Z3 solves the accumulated constraints to produce concrete input values. No brute force needed — it's algebraic.",
  },
  {
    slug: "re-l4-firmware",
    competencyId: "reverse-engineering",
    depthTier: 4,
    sectionHeading: "Firmware reverse engineering",
    prompt: "After extracting a router firmware image with binwalk, you find ARM binaries in the squashfs filesystem. What is your next analysis step?",
    options: [
      "Emulate the ARM binaries with QEMU user-mode or full-system emulation — this lets you run and debug them on an x86 host without the physical device.",
      "Load the ARM binaries directly into Ghidra configured for x86-64 — Ghidra automatically translates ARM instructions to x86 for analysis.",
      "Flash the extracted filesystem back to a development board running the same ARM SoC to get native execution for dynamic analysis.",
      "Convert the ARM binaries to x86 using RetDec's static recompilation, then analyze and debug the recompiled x86 versions with standard tools.",
    ],
    correctIndex: 0,
    explanation:
      "QEMU user-mode emulates individual ARM binaries on x86 (qemu-arm ./binary). QEMU system-mode emulates the full device for multi-binary interaction. Combined with gdb-multiarch for debugging, this is the standard approach for analyzing embedded firmware without hardware access.",
  },

  // ── L5 ──
  {
    slug: "re-l5-compiler",
    competencyId: "reverse-engineering",
    depthTier: 5,
    sectionHeading: "Compiler internals and optimization patterns",
    prompt: "You see `imul rax, rcx, 0xCCCCCCCCCCCCCCCD` followed by `shr rdx, 3` in a binary. What operation was this before optimization?",
    options: [
      "Integer division by 10 — the compiler replaced the slow div instruction with a multiply-by-magic-constant-then-shift sequence that produces the same quotient.",
      "Modulo by 10 — the compiler uses the multiplicative inverse to compute the remainder directly without performing a division instruction.",
      "Multiplication by a floating-point constant cast to integer — 0xCCCC... is the IEEE 754 representation of 0.1 stored as a fixed-point integer.",
      "A hash function step — the constant 0xCCCC... is used as a mixing constant in FNV-1a or similar non-cryptographic hash algorithms.",
    ],
    correctIndex: 0,
    explanation:
      "Compilers optimize x/N by computing (x * M) >> S where M and S are chosen so the result equals floor(x/N). For division by 10: M = 0xCCCCCCCCCCCCCCCD, S = 3 (applied to the high 64 bits from imul). Recognizing magic constants lets you reconstruct the original arithmetic.",
  },
  {
    slug: "re-l5-obfusc",
    competencyId: "reverse-engineering",
    depthTier: 5,
    sectionHeading: "Obfuscation internals",
    prompt: "After OLLVM control-flow flattening, all basic blocks in a function are at the same nesting level under a single switch/dispatcher. What makes this harder to analyze than the original code?",
    options: [
      "The original control flow (if/else, loops) is hidden — every block updates a state variable and jumps back to the dispatcher, so the relationship between blocks is no longer visible in the CFG.",
      "The dispatcher introduces a cryptographic key check at each transition, so symbolic execution must solve a new crypto constraint for every edge.",
      "Flattening duplicates every basic block N times (one per possible predecessor), so the function size grows exponentially and exceeds disassembler limits.",
      "The state variable is stored in a hardware debug register (DR7) instead of a general-purpose register, making it invisible to standard debugger watch expressions.",
    ],
    correctIndex: 0,
    explanation:
      "Control flow flattening creates: while(1) { switch(state) { case 1: ...; state=3; break; case 2: ...; } }. The original structure (if → then → else) becomes a flat state machine. Paired with opaque predicates and mixed boolean-arithmetic (MBA), it defeats most automated analysis.",
  },
  {
    slug: "re-l5-ir",
    competencyId: "reverse-engineering",
    depthTier: 5,
    sectionHeading: "Intermediate representations for analysis",
    prompt: "angr lifts x86 to VEX IR, RetDec lifts to LLVM IR. What is the primary advantage of analyzing code at the IR level rather than directly on machine code?",
    options: [
      "Architecture-independent analysis — the same algorithm (taint tracking, symbolic execution) works on x86, ARM, MIPS without rewriting it for each instruction set.",
      "IR has fewer instructions than machine code, so analysis runs in O(1) space regardless of binary size — a property no native disassembler provides.",
      "IR preserves the original source-level variable names and types that were lost during compilation, recovering the full debug information.",
      "IR executes directly on the host CPU via JIT compilation, allowing dynamic analysis at native speed without an emulator or virtual machine overhead.",
    ],
    correctIndex: 0,
    explanation:
      "IRs like VEX (angr), LLVM IR (RetDec), and BAP BIL abstract away per-architecture details (register names, flag semantics, instruction encoding). One analysis pass works on every supported architecture. LLVM IR also enables applying standard compiler optimizations as a deobfuscation technique.",
  },
];
