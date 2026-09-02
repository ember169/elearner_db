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
    prompt: "Why must security professionals understand Windows internals rather than just running tools?",
    options: [
      "Knowing how processes, memory, and the registry work lets you understand attack techniques at a fundamental level — tool output means nothing without that mental model.",
      "Tools already handle everything automatically.",
      "Windows internals only matter for software developers.",
      "Windows has no internal complexity worth studying.",
    ],
    correctIndex: 0,
    explanation:
      "Active Directory environments dominate enterprise networks and most malware targets Windows. Understanding how CreateProcess, lsass.exe, or registry Run keys actually work is what separates an operator from a button-pusher.",
  },
  {
    slug: "wi-l0-arch",
    competencyId: "win-internals",
    depthTier: 0,
    sectionHeading: "Architecture overview",
    prompt: "What is the role of ntdll.dll in the Windows architecture?",
    options: [
      "It is the bridge between user mode and kernel mode — it contains system call stubs that transition from Ring 3 to Ring 0.",
      "It is the graphical display driver.",
      "It manages the Windows registry exclusively.",
      "It is an optional DLL loaded only by .NET applications.",
    ],
    correctIndex: 0,
    explanation:
      "ntdll.dll provides the lowest-level user-mode API. Win32 API calls (kernel32.dll, user32.dll) ultimately call ntdll, which executes the syscall instruction to enter the kernel. EDR products hook ntdll to monitor API calls.",
  },
  {
    slug: "wi-l0-vocab",
    competencyId: "win-internals",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt: "What is an access token in the Windows security model?",
    options: [
      "A security context attached to a process that defines its identity (SID), group memberships, privileges, and integrity level.",
      "A password stored in the registry.",
      "A physical USB key for two-factor authentication.",
      "A file permission flag like read-only.",
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
    prompt: "Why is the parent process tree (System → smss → wininit → services → svchost) important for threat detection?",
    options: [
      "Deviations from the expected tree — like cmd.exe spawned by a Word document or svchost.exe not parented by services.exe — are strong indicators of compromise.",
      "The tree is randomly generated each boot.",
      "All processes share the same parent.",
      "The process tree only matters for performance.",
    ],
    correctIndex: 0,
    explanation:
      "Security analysts baseline the normal process tree. An abnormal parent-child relationship (e.g., powershell.exe spawned by excel.exe) is a red flag that EDR and SIEM rules detect.",
  },
  {
    slug: "wi-l1-reg",
    competencyId: "win-internals",
    depthTier: 1,
    sectionHeading: "Registry fundamentals",
    prompt: "Why are the HKCU and HKLM Run keys common persistence locations?",
    options: [
      "Programs listed there execute automatically on user logon (HKCU) or system startup (HKLM), so malware adds entries to survive reboots.",
      "Run keys only store display settings.",
      "Run keys are deleted on every reboot.",
      "Only Microsoft-signed programs can use Run keys.",
    ],
    correctIndex: 0,
    explanation:
      "The CurrentVersion\\Run keys are among the most common persistence mechanisms (MITRE T1547.001). Sysinternals Autoruns comprehensively enumerates all auto-start locations beyond just Run keys.",
  },
  {
    slug: "wi-l1-sysinternals",
    competencyId: "win-internals",
    depthTier: 1,
    sectionHeading: "Sysinternals tools",
    prompt: "What advantage does Process Monitor have over Process Explorer for investigation?",
    options: [
      "Process Monitor captures real-time file, registry, and network activity with filters — showing what a process is doing moment by moment, not just its static state.",
      "Process Monitor only shows CPU usage.",
      "Process Explorer captures more events than Process Monitor.",
      "They are identical tools with different names.",
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
    prompt: "What is the significance of the Import Table in a PE file for malware analysis?",
    options: [
      "It lists the DLLs and functions the binary uses — suspicious imports (VirtualAllocEx, WriteProcessMemory, CreateRemoteThread) signal injection capabilities.",
      "It contains the program's source code.",
      "It stores user passwords.",
      "It is identical for all Windows executables.",
    ],
    correctIndex: 0,
    explanation:
      "The PE Import Table reveals a binary's API usage. A combination of OpenProcess + VirtualAllocEx + WriteProcessMemory + CreateRemoteThread is a textbook injection pattern. Malware often hides imports via API hashing.",
  },
  {
    slug: "wi-l2-secmodel",
    competencyId: "win-internals",
    depthTier: 2,
    sectionHeading: "Windows security model",
    prompt: "Why is SeDebugPrivilege dangerous when enabled?",
    options: [
      "It allows a process to open a handle to any other process with full access — enabling credential dumping from lsass.exe and injection into any process.",
      "It only allows attaching a debugger to your own processes.",
      "It is a read-only privilege with no security impact.",
      "It is disabled by default and cannot be enabled.",
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
    prompt: "How can an unquoted service path lead to privilege escalation?",
    options: [
      "If the path is 'C:\\Program Files\\My App\\service.exe' (unquoted), Windows tries C:\\Program.exe, then C:\\Program Files\\My.exe — dropping a binary at an earlier path hijacks the service.",
      "Unquoted paths are ignored by Windows.",
      "Windows always resolves the full path correctly.",
      "This only affects Linux services.",
    ],
    correctIndex: 0,
    explanation:
      "Windows parses unquoted paths with spaces by testing each space as a possible end of the executable name. If you can write to an earlier directory in the path, you can place a malicious binary that runs instead of the real service.",
  },

  // ── L3 ──
  {
    slug: "wi-l3-apicall",
    competencyId: "win-internals",
    depthTier: 3,
    sectionHeading: "Windows API call chain",
    prompt: "At which two levels do security tools (EDR/AV) typically hook the API call chain?",
    options: [
      "User-mode hooks in ntdll.dll (patching function bytes to redirect) and kernel callbacks (PsSetCreateProcessNotifyRoutine, ObRegisterCallbacks).",
      "Only at the application level.",
      "Only in the BIOS firmware.",
      "Hooks are placed in the CPU microcode.",
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
    prompt: "Why is a VirtualProtect call changing memory from RW to RX suspicious?",
    options: [
      "It is the hallmark of shellcode execution — write data (shellcode) to RW memory, then flip to RX to execute it. Legitimate code rarely changes page protections at runtime.",
      "RW to RX transitions happen on every function call.",
      "VirtualProtect is a harmless API with no security relevance.",
      "This pattern only occurs in .NET applications.",
    ],
    correctIndex: 0,
    explanation:
      "Legitimate programs have their permissions set at load time (.text = RX, .data = RW). Changing RW→RX at runtime means the process is making writable data executable — a classic indicator of in-memory payload execution. RWX regions are even more suspicious.",
  },
  {
    slug: "wi-l3-creds",
    competencyId: "win-internals",
    depthTier: 3,
    sectionHeading: "Authentication and credential storage",
    prompt: "Why does Credential Guard protect against credential dumping from lsass.exe?",
    options: [
      "It uses Hyper-V to store credentials in an isolated secure world — even a compromised kernel cannot access VBS-protected memory where credentials are held.",
      "It encrypts the lsass.exe binary on disk.",
      "It simply adds a password to lsass.exe.",
      "It only protects against network-based attacks.",
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
    prompt: "Why must direct syscall implementations resolve syscall numbers dynamically?",
    options: [
      "Syscall numbers change between Windows versions — a hardcoded number works on one build but crashes on another. Techniques like Hell's Gate read the number from ntdll at runtime.",
      "Syscall numbers are the same across all Windows versions.",
      "Dynamic resolution is slower and never used in practice.",
      "The SSDT publishes a stable API that never changes.",
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
    prompt: "How do EDR products use ObRegisterCallbacks to protect lsass.exe?",
    options: [
      "They register a pre-operation callback that intercepts handle creation requests to lsass and strips sensitive access rights (PROCESS_VM_READ), preventing credential dumping.",
      "They encrypt the lsass.exe process memory.",
      "They move lsass to a different PID on each boot.",
      "They block all handle operations system-wide.",
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
    prompt: "Why are kernel callbacks (PsSetCreateProcessNotifyRoutineEx, etc.) harder to bypass than user-mode hooks?",
    options: [
      "They run in kernel mode and are triggered before the user-mode process can interfere — bypassing them requires a kernel driver or exploit, not just user-mode code.",
      "Kernel callbacks run in user mode and are easy to patch.",
      "They only monitor network traffic.",
      "They were deprecated in Windows 10.",
    ],
    correctIndex: 0,
    explanation:
      "User-mode hooks can be bypassed by direct syscalls or ntdll unhooking. Kernel callbacks are called by the kernel itself when events occur — a user-mode process cannot skip them. Disabling them requires BYOVD or a kernel exploit.",
  },

  // ── L5 ──
  {
    slug: "wi-l5-ntfs",
    competencyId: "win-internals",
    depthTier: 5,
    sectionHeading: "NTFS internals",
    prompt: "What is the Zone.Identifier Alternate Data Stream and why do attackers strip it?",
    options: [
      "It is the Mark of the Web — a hidden ADS that tags downloaded files with their source zone, triggering SmartScreen warnings. Stripping it bypasses those security prompts.",
      "It stores the file's encryption key.",
      "It records the file's creation date.",
      "It is a virus signature database.",
    ],
    correctIndex: 0,
    explanation:
      "When a file is downloaded from the internet, Windows adds a Zone.Identifier ADS with ZoneId=3 (Internet). SmartScreen and Office Protected View use this to warn users. Attackers strip it (e.g., via container formats) to bypass MOTW checks.",
  },
  {
    slug: "wi-l5-kernel",
    competencyId: "win-internals",
    depthTier: 5,
    sectionHeading: "Windows kernel architecture",
    prompt: "What does PatchGuard (Kernel Patch Protection) protect against?",
    options: [
      "It periodically checks the integrity of critical kernel structures (SSDT, IDT, GDT) and triggers a BSOD if modifications are detected — preventing rootkits from patching the kernel.",
      "It only protects user-mode applications.",
      "It prevents Windows Updates from installing.",
      "It encrypts kernel memory.",
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
    prompt: "Why can't an admin-level process dump lsass.exe memory when it runs as PPL?",
    options: [
      "PPL enforces a hierarchy — a process can only open handles to processes at the same or lower protection level. An admin process (None) is below Lsa-Light, so PROCESS_VM_READ is denied.",
      "Admin processes have higher protection than PPL.",
      "lsass.exe doesn't use memory.",
      "PPL only affects network access, not memory.",
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
    prompt: "Why should blue teamers study malware development techniques?",
    options: [
      "Understanding how malware works — loaders, injection, persistence — lets them build better detections and recognize technique patterns during analysis.",
      "Blue teamers should never study offensive techniques.",
      "Malware development knowledge is only useful for attackers.",
      "Detection tools work without any understanding of threats.",
    ],
    correctIndex: 0,
    explanation:
      "Knowledge flows both ways: red teamers build custom tooling that evades detection, and blue teamers who understand those techniques build more effective rules. MITRE ATT&CK maps these techniques for both sides.",
  },
  {
    slug: "md-l0-concepts",
    competencyId: "maldev-techniques",
    depthTier: 0,
    sectionHeading: "Core concepts",
    prompt: "What is the difference between a stager and a full payload?",
    options: [
      "A stager is a small initial payload that downloads and executes the full payload — keeping the initial delivery small and the main payload off disk.",
      "A stager is always larger than the payload.",
      "There is no difference; they are synonyms.",
      "A stager runs on the server, not the target.",
    ],
    correctIndex: 0,
    explanation:
      "Stagers are tiny (often shellcode) and their only job is to download the full payload (implant/beacon). This two-stage approach keeps the initial delivery small and avoids dropping the full implant to disk.",
  },
  {
    slug: "md-l0-langs",
    competencyId: "maldev-techniques",
    depthTier: 0,
    sectionHeading: "Development languages",
    prompt: "Why is C/C++ commonly used for implants and shellcode?",
    options: [
      "It provides full Win32 API access, produces small binaries with no runtime dependency, and gives direct memory control needed for shellcode and evasion.",
      "It is the only language that runs on Windows.",
      "C/C++ binaries are undetectable by antivirus.",
      "It is easier to learn than Python.",
    ],
    correctIndex: 0,
    explanation:
      "C/C++ gives direct API access, tiny binaries, and no runtime (unlike .NET/Go). C# is popular for rapid development and reflection-based techniques. Rust offers memory safety with similar benefits to C.",
  },

  // ── L1 ──
  {
    slug: "md-l1-api",
    competencyId: "maldev-techniques",
    depthTier: 1,
    sectionHeading: "Windows API for offensive use",
    prompt: "Why is the RegSetValueExA call to the Run key a persistence technique?",
    options: [
      "It adds a registry entry under CurrentVersion\\Run that executes the specified binary every time the user logs in — surviving reboots without requiring admin privileges (HKCU).",
      "It encrypts the registry to hide the entry.",
      "It only runs the binary once.",
      "Registry values cannot reference executables.",
    ],
    correctIndex: 0,
    explanation:
      "HKCU\\...\\Run entries execute on user logon (no admin needed). HKLM\\...\\Run requires admin but applies to all users. This is MITRE ATT&CK T1547.001 — one of the most common persistence mechanisms.",
  },
  {
    slug: "md-l1-shell",
    competencyId: "maldev-techniques",
    depthTier: 1,
    sectionHeading: "Basic reverse shell",
    prompt: "What does redirecting cmd.exe's stdin/stdout/stderr to a socket achieve?",
    options: [
      "It creates a reverse shell — the attacker's machine receives a command prompt over the network, allowing remote command execution on the target.",
      "It encrypts all network traffic.",
      "It crashes the target system.",
      "It only transfers files, not commands.",
    ],
    correctIndex: 0,
    explanation:
      "By setting STARTUPINFO handles to the socket, cmd.exe reads commands from the network and sends output back. This basic reverse shell has no encryption or evasion — real implants add encryption, jitter, and modular functionality.",
  },
  {
    slug: "md-l1-test",
    competencyId: "maldev-techniques",
    depthTier: 1,
    sectionHeading: "Compilation and testing",
    prompt: "Why should you never upload custom payloads to VirusTotal?",
    options: [
      "VirusTotal shares submitted samples with all participating AV vendors — your custom payload gets signatured, burning it for future use.",
      "VirusTotal doesn't accept executable files.",
      "VirusTotal results are always false positives.",
      "Uploading to VirusTotal is the recommended testing method.",
    ],
    correctIndex: 0,
    explanation:
      "VirusTotal distributes samples to 70+ AV vendors who then create signatures. Private scanning services (antiscan.me) or local Defender testing preserve OPSEC. Test in isolated VMs (FlareVM, CommandoVM).",
  },

  // ── L2 ──
  {
    slug: "md-l2-inject",
    competencyId: "maldev-techniques",
    depthTier: 2,
    sectionHeading: "Process injection techniques",
    prompt: "What are the four Win32 API calls in the classic DLL injection pattern?",
    options: [
      "OpenProcess → VirtualAllocEx → WriteProcessMemory → CreateRemoteThread (calling LoadLibraryA with the DLL path).",
      "CreateFile → ReadFile → WriteFile → CloseHandle.",
      "socket → connect → send → recv.",
      "RegOpenKey → RegQueryValue → RegSetValue → RegCloseKey.",
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
    prompt: "Why do shellcode runners use callback APIs like EnumDesktopsA instead of a direct function pointer call?",
    options: [
      "Callback-based execution is less obvious to analysts and some security tools — the shellcode runs as a callback parameter to a legitimate API, not via an explicit call to an unknown address.",
      "EnumDesktopsA is the only way to run shellcode.",
      "Function pointers cannot execute shellcode.",
      "Callbacks are required by the Windows ABI.",
    ],
    correctIndex: 0,
    explanation:
      "Many Win32 APIs accept callback function pointers (EnumDesktopsA, CreateTimerQueueTimer, CertEnumSystemStore). Passing shellcode as the callback avoids the more suspicious pattern of casting VirtualAlloc'd memory to a function pointer.",
  },
  {
    slug: "md-l2-persist",
    competencyId: "maldev-techniques",
    depthTier: 2,
    sectionHeading: "Persistence mechanisms",
    prompt: "Why is WMI event subscription persistence harder to detect than a Run key?",
    options: [
      "WMI subscriptions are stored in the WMI repository (not the obvious Run keys), survive reboots, and are not visible in standard registry enumeration — requiring specialized tools to find.",
      "WMI is simpler to implement than registry changes.",
      "Run keys are completely undetectable.",
      "WMI event subscriptions were removed in Windows 10.",
    ],
    correctIndex: 0,
    explanation:
      "WMI event subscriptions (MITRE T1546.003) consist of a filter, consumer, and binding stored in the WMI repository. They don't appear in Autoruns by default (though modern Autoruns does check). DLL search order hijacking (T1574.001) is another stealthy alternative.",
  },

  // ── L3 ──
  {
    slug: "md-l3-hollow",
    competencyId: "maldev-techniques",
    depthTier: 3,
    sectionHeading: "Advanced injection: process hollowing",
    prompt: "What makes process hollowing stealthier than classic DLL injection?",
    options: [
      "The malicious code runs under a legitimate process name (e.g., svchost.exe) — to the casual observer and many tools, it looks like a normal system process.",
      "It doesn't require any API calls.",
      "It works without opening the target process.",
      "It leaves more forensic artifacts than DLL injection.",
    ],
    correctIndex: 0,
    explanation:
      "Process hollowing: create svchost.exe suspended → unmap its code → write your PE → update the entry point → resume. The process appears as svchost.exe in task manager, but runs the attacker's code.",
  },
  {
    slug: "md-l3-c2",
    competencyId: "maldev-techniques",
    depthTier: 3,
    sectionHeading: "C2 communication patterns",
    prompt: "Why do C2 implants use jittered sleep intervals?",
    options: [
      "Fixed-interval beacons create regular network patterns that traffic analysis can detect — adding random jitter makes the timing look more like normal user traffic.",
      "Jitter makes the implant run faster.",
      "Fixed intervals are undetectable.",
      "Jitter is required by the Windows scheduler.",
    ],
    correctIndex: 0,
    explanation:
      "A beacon checking in exactly every 30 seconds is trivially detectable. Adding ±random jitter (e.g., 30s ± 10s) breaks the regular pattern. Advanced C2 also uses domain fronting, legitimate cloud services, and DNS channels.",
  },
  {
    slug: "md-l3-rdll",
    competencyId: "maldev-techniques",
    depthTier: 3,
    sectionHeading: "Reflective DLL loading",
    prompt: "What does reflective DLL loading avoid that makes it harder to detect?",
    options: [
      "It avoids: file on disk (no AV file scan), LoadLibrary API call (no hook trigger), and entry in PEB.Ldr module list (hidden from process module enumeration).",
      "It requires the DLL to be on disk.",
      "It uses the standard LoadLibrary API.",
      "It registers the DLL in the PEB module list.",
    ],
    correctIndex: 0,
    explanation:
      "Reflective loading parses PE headers, processes relocations, resolves imports, and calls DllMain — all from memory. Since it never calls LoadLibrary, the DLL doesn't appear in the module list and no file touches disk.",
  },

  // ── L4 ──
  {
    slug: "md-l4-syscall",
    competencyId: "maldev-techniques",
    depthTier: 4,
    sectionHeading: "Direct syscalls",
    prompt: "What does Halo's Gate add over the original Hell's Gate technique?",
    options: [
      "It handles hooked functions — when a function's prologue is patched by EDR, Halo's Gate checks neighboring (unhooked) stubs to derive the correct syscall number.",
      "It uses a completely different approach unrelated to Hell's Gate.",
      "It eliminates the need for syscall numbers entirely.",
      "It only works on 32-bit Windows.",
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
    prompt: "What does PPID spoofing accomplish?",
    options: [
      "It makes a process appear as the child of a chosen parent (e.g., explorer.exe instead of cmd.exe), defeating parent-child relationship detections.",
      "It changes the process's PID number.",
      "It hides the process from task manager entirely.",
      "It grants the child process admin privileges.",
    ],
    correctIndex: 0,
    explanation:
      "Using PROC_THREAD_ATTRIBUTE_PARENT_PROCESS, you specify which process appears as the parent. A cmd.exe seemingly spawned by explorer.exe is far less suspicious than one spawned by a macro-enabled document.",
  },
  {
    slug: "md-l4-dotnet",
    competencyId: "maldev-techniques",
    depthTier: 4,
    sectionHeading: "In-memory .NET execution",
    prompt: "Why is in-memory .NET assembly execution an evasion technique?",
    options: [
      "Loading the CLR and executing an assembly from a byte array avoids writing the payload to disk — no file for AV to scan, and the assembly can be encrypted until execution time.",
      "It is slower than running from disk.",
      ".NET assemblies cannot run from memory.",
      "It only works with PowerShell scripts.",
    ],
    correctIndex: 0,
    explanation:
      "Hosting the CLR (ICLRMetaHost → ICLRRuntimeHost) from unmanaged C/C++ and calling ExecuteInDefaultAppDomain or Assembly.Load with a byte array executes .NET payloads without any file on disk.",
  },

  // ── L5 ──
  {
    slug: "md-l5-peloader",
    competencyId: "maldev-techniques",
    depthTier: 5,
    sectionHeading: "Custom PE loader",
    prompt: "Why must a custom PE loader process relocations?",
    options: [
      "If the PE is loaded at a base address different from its preferred ImageBase, all absolute address references in the code are wrong — relocations add the delta to fix them.",
      "Relocations are cosmetic and can be skipped.",
      "The PE format doesn't support relocations.",
      "Relocations only apply to 16-bit executables.",
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
    prompt: "How does shellcode find kernel32.dll's base address without any imports?",
    options: [
      "It walks the PEB (Process Environment Block) via the GS/FS segment register → Ldr → InMemoryOrderModuleList to find kernel32, then walks its export table to resolve GetProcAddress.",
      "Shellcode has kernel32 hardcoded at a fixed address.",
      "Shellcode cannot call Windows APIs.",
      "The OS passes kernel32's address as a function argument.",
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
    prompt: "What is the BYOVD (Bring Your Own Vulnerable Driver) technique?",
    options: [
      "Loading a legitimately signed but vulnerable driver, then exploiting its vulnerability to execute arbitrary kernel code — bypassing driver signing enforcement since the driver has a valid signature.",
      "Writing a new unsigned driver and loading it.",
      "Using only built-in Windows drivers.",
      "A technique that only works on Linux.",
    ],
    correctIndex: 0,
    explanation:
      "Windows requires drivers to be signed. BYOVD uses a driver that IS signed (by a legitimate vendor) but has a known vulnerability (arbitrary read/write, code execution). LOLDrivers (loldrivers.io) catalogs vulnerable signed drivers.",
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
    prompt: "Which security tool layers does evasion target?",
    options: [
      "Antivirus (signatures/heuristics), EDR (behavioral analysis), network monitoring (IDS/IPS), application whitelisting, and AMSI (script scanning).",
      "Only antivirus signatures.",
      "Only firewalls.",
      "Evasion only targets physical security controls.",
    ],
    correctIndex: 0,
    explanation:
      "Modern defense is layered. Evasion must consider all layers: AV (static signatures), EDR (runtime behavior), AMSI (script content), network monitoring (traffic patterns), and application whitelisting (execution control).",
  },
  {
    slug: "ev-l0-detect",
    competencyId: "evasion",
    depthTier: 0,
    sectionHeading: "Detection methods",
    prompt: "Why is behavioral detection harder to evade than signature-based detection?",
    options: [
      "Behavioral detection monitors runtime actions (API calls, system changes) rather than byte patterns — obfuscation doesn't help if the behavior itself is suspicious.",
      "Behavioral detection is weaker than signatures.",
      "Signatures detect behavior better than behavioral analysis.",
      "Behavioral detection only works offline.",
    ],
    correctIndex: 0,
    explanation:
      "Signature-based detection matches known byte patterns — easily defeated by encoding/encryption. Behavioral analysis watches what the program does (inject into a process, read lsass, create a service) regardless of how the code looks.",
  },

  // ── L1 ──
  {
    slug: "ev-l1-obfusc",
    competencyId: "evasion",
    depthTier: 1,
    sectionHeading: "Basic obfuscation",
    prompt: "Why does XOR encoding defeat signature-based AV but not behavioral analysis?",
    options: [
      "XOR changes the byte pattern so static signatures don't match, but once the payload decrypts and executes, its runtime behavior (API calls, memory operations) is identical and detectable.",
      "XOR defeats all forms of detection.",
      "Behavioral analysis cannot monitor XOR-encoded payloads.",
      "XOR encoding is unbreakable encryption.",
    ],
    correctIndex: 0,
    explanation:
      "XOR encoding (or any encoding) only hides the payload from static analysis. At runtime, the payload must decrypt and execute — at that point, behavioral monitors see the same suspicious API calls. The decryption routine itself can also become a signature.",
  },
  {
    slug: "ev-l1-lolbin",
    competencyId: "evasion",
    depthTier: 1,
    sectionHeading: "Living off the land",
    prompt: "Why is using LOLBins (certutil, mshta, regsvr32) effective for evasion?",
    options: [
      "These are legitimate, Microsoft-signed binaries that are whitelisted by default — using them avoids dropping custom executables that would trigger AV/EDR.",
      "LOLBins are undetectable by any security tool.",
      "They encrypt all their traffic automatically.",
      "LOLBins are custom attacker tools.",
    ],
    correctIndex: 0,
    explanation:
      "Living-off-the-land uses trusted OS binaries for malicious purposes: certutil downloads files, mshta executes HTA, regsvr32 loads scriptlets. The LOLBAS Project catalogs these. Modern EDR detects suspicious LOLBin usage, but it's still effective against basic AV.",
  },
  {
    slug: "ev-l1-aes",
    competencyId: "evasion",
    depthTier: 1,
    sectionHeading: "Payload encoding",
    prompt: "Why is AES encryption stronger than XOR for payload protection?",
    options: [
      "AV can't decrypt without the key, so signature scanning on the encrypted payload is completely useless — unlike XOR which can be trivially brute-forced (single-byte key) or pattern-matched.",
      "AES is faster than XOR.",
      "XOR provides stronger encryption than AES.",
      "AES encryption makes the payload larger, which helps evasion.",
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
    prompt: "What does AMSI scan and at what point in execution?",
    options: [
      "AMSI scans script content (PowerShell, VBScript, JScript, .NET assemblies) before execution — even downloaded scripts are sent to the AV engine before they run.",
      "AMSI only scans files on disk.",
      "AMSI scans after script execution completes.",
      "AMSI only monitors network traffic.",
    ],
    correctIndex: 0,
    explanation:
      "AMSI intercepts script content at runtime, before execution. This catches fileless attacks (IEX download cradles). Bypass approaches: patching AmsiScanBuffer in memory, .NET reflection to set amsiInitFailed, or obfuscating trigger strings.",
  },
  {
    slug: "ev-l2-sandbox",
    competencyId: "evasion",
    depthTier: 2,
    sectionHeading: "Sandbox evasion",
    prompt: "Why does checking if GetTickCount shows time actually passed after Sleep() detect a sandbox?",
    options: [
      "Sandboxes often fast-forward Sleep calls to speed up analysis — if 10 seconds of Sleep complete in under 9 seconds of wall-clock time, the environment is manipulating execution timing.",
      "Sandboxes always sleep longer than requested.",
      "GetTickCount is unavailable in sandboxes.",
      "This technique only works on physical hardware.",
    ],
    correctIndex: 0,
    explanation:
      "Automated sandboxes have limited analysis time, so they often skip or shorten Sleep calls. Checking elapsed time catches this. Other checks: low CPU count, low RAM, VM artifacts (VMware Tools registry keys), and presence of analysis tools.",
  },
  {
    slug: "ev-l2-apihash",
    competencyId: "evasion",
    depthTier: 2,
    sectionHeading: "API hashing",
    prompt: "What does API hashing hide from static analysis?",
    options: [
      "The names of Windows API functions the binary uses — instead of appearing in the import table, functions are resolved at runtime by matching hash values, so analysts see only numeric constants.",
      "The binary's file size.",
      "The compiler used to build the binary.",
      "The binary's digital signature.",
    ],
    correctIndex: 0,
    explanation:
      "Normally, the PE import table lists every DLL and function (VirtualAlloc, CreateRemoteThread). API hashing walks the PEB to find the DLL and its export table, hashes each export name, and compares against a precomputed constant — no function names in the binary.",
  },

  // ── L3 ──
  {
    slug: "ev-l3-unhook",
    competencyId: "evasion",
    depthTier: 3,
    sectionHeading: "Unhooking ntdll",
    prompt: "How does loading a fresh ntdll.dll from disk bypass EDR hooks?",
    options: [
      "The on-disk copy of ntdll is unmodified — mapping it and copying its .text section over the in-memory (hooked) version restores the original function bytes, removing all EDR inline patches.",
      "The disk copy is also hooked by the EDR.",
      "Loading a DLL from disk is blocked by Windows.",
      "ntdll.dll cannot be memory-mapped.",
    ],
    correctIndex: 0,
    explanation:
      "EDR hooks are applied at runtime to the in-memory copy of ntdll. The file on disk (C:\\Windows\\System32\\ntdll.dll) retains the original bytes. Reading it, then overwriting the hooked .text section restores clean function code.",
  },
  {
    slug: "ev-l3-sleep",
    competencyId: "evasion",
    depthTier: 3,
    sectionHeading: "Sleep obfuscation",
    prompt: "Why is encrypting implant memory during sleep periods effective against memory scanners?",
    options: [
      "Memory scanners look for known implant byte patterns in process memory — if the memory is encrypted during idle periods, the scanner finds only ciphertext, not matching signatures.",
      "Memory scanners only run when the process is active.",
      "Encryption makes the memory inaccessible to the CPU.",
      "Sleep obfuscation prevents the process from appearing in task manager.",
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
    prompt: "Why can't user-mode ETW patching disable the Threat Intelligence ETW provider?",
    options: [
      "The Microsoft-Windows-Threat-Intelligence provider runs in kernel mode and is protected by PPL — user-mode patches to EtwEventWrite only affect user-mode ETW events in the current process.",
      "All ETW providers run in user mode.",
      "Threat Intelligence is not an ETW provider.",
      "ETW patching disables all providers, including kernel ones.",
    ],
    correctIndex: 0,
    explanation:
      "Patching ntdll!EtwEventWrite to return immediately silences user-mode ETW events (.NET assembly loads, PowerShell execution) in that process. But the kernel-level Threat Intelligence provider feeds Defender/EDR directly from the kernel — untouchable from user mode.",
  },

  // ── L4 ──
  {
    slug: "ev-l4-callback",
    competencyId: "evasion",
    depthTier: 4,
    sectionHeading: "Callback-based execution",
    prompt: "Why are thread pool callbacks and fibers less monitored than CreateThread?",
    options: [
      "EDR products heavily instrument CreateThread/CreateRemoteThread as common injection APIs. Thread pool work items (TpAllocWork) and fiber switches are legitimate OS mechanisms that receive less scrutiny.",
      "Thread pools and fibers cannot execute arbitrary code.",
      "CreateThread is not monitored by any EDR.",
      "Fibers are slower than threads and thus ignored.",
    ],
    correctIndex: 0,
    explanation:
      "CreateThread and CreateRemoteThread are high-signal APIs for EDR. Alternatives: TpAllocWork (thread pool), CreateFiber/SwitchToFiber (cooperative threading), QueueUserAPC (async procedure calls). Each avoids the most-watched code path.",
  },
  {
    slug: "ev-l4-stomp",
    competencyId: "evasion",
    depthTier: 4,
    sectionHeading: "Module stomping and phantom DLL loading",
    prompt: "Why does executing shellcode from a legitimate DLL's memory region fool memory scanners?",
    options: [
      "The memory region is backed by a signed DLL file — scanners see code executing from a known, trusted module rather than from unbacked (suspicious) memory.",
      "Signed DLLs cannot contain shellcode.",
      "Memory scanners don't check DLL regions.",
      "Module stomping only works on unsigned DLLs.",
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
    prompt: "What telltale sign do direct syscalls leave that indirect syscalls fix?",
    options: [
      "With direct syscalls, the syscall instruction executes from non-ntdll memory (the attacker's module). Indirect syscalls jump to ntdll's syscall instruction, so the RIP is in the expected address range.",
      "Direct syscalls are slower than indirect ones.",
      "Indirect syscalls use a different instruction than 'syscall'.",
      "Direct syscalls leave a file on disk.",
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
    prompt: "Why is a hypervisor rootkit invisible to all OS-level security tools?",
    options: [
      "It sits below the OS — the OS runs as a VM guest and all its security tools run inside the guest, unable to see the hypervisor layer intercepting and modifying their view of hardware.",
      "Hypervisor rootkits are easily detected by antivirus.",
      "They only work on Linux, not Windows.",
      "OS security tools always have access to the hypervisor.",
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
    prompt: "Why is code executing before the EDR DLL is loaded a blind spot?",
    options: [
      "EDR user-mode instrumentation relies on injecting its DLL into every process — code running before that injection completes (early execution) operates without any user-mode monitoring.",
      "EDR DLLs load before any other code runs.",
      "Early execution is impossible on modern Windows.",
      "EDR monitors all code regardless of load order.",
    ],
    correctIndex: 0,
    explanation:
      "EDR DLLs are injected after process creation but before the main thread runs (usually via image load callbacks + APC). Racing that window, or executing from contexts the EDR doesn't instrument (WoW64 transitions, early DLL loads), creates blind spots.",
  },
  {
    slug: "ev-l5-frontier",
    competencyId: "evasion",
    depthTier: 5,
    sectionHeading: "Research frontiers",
    prompt: "What makes firmware implants particularly persistent?",
    options: [
      "They persist in UEFI firmware below the OS — surviving OS reinstallation, disk formatting, and even drive replacement if stored in SPI flash on the motherboard.",
      "They are stored in RAM and lost on reboot.",
      "They only survive until the next Windows Update.",
      "Firmware implants are theoretical and have never been observed.",
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
    prompt: "What is the fundamental difference between static and dynamic analysis?",
    options: [
      "Static analysis examines the binary without executing it (disassembly, decompilation); dynamic analysis runs it and observes behavior (debugging, tracing).",
      "Static analysis is faster but always wrong.",
      "Dynamic analysis doesn't require the actual binary.",
      "They are the same technique with different names.",
    ],
    correctIndex: 0,
    explanation:
      "Static analysis (IDA, Ghidra) reveals code structure and logic. Dynamic analysis (GDB, x64dbg, strace) reveals runtime behavior, actual values, and code paths taken. Most real analysis combines both approaches.",
  },
  {
    slug: "re-l0-vocab",
    competencyId: "reverse-engineering",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt: "Why is a stripped binary harder to analyze than one with symbols?",
    options: [
      "Stripped binaries have debug symbols removed — function names, variable names, and type information are gone, so the analyst sees only raw addresses and must reconstruct meaning manually.",
      "Stripped binaries are encrypted.",
      "Stripped binaries cannot be disassembled.",
      "Symbols make binaries slower, not more readable.",
    ],
    correctIndex: 0,
    explanation:
      "Symbols (function names, struct definitions) are metadata that maps addresses to human-readable names. Stripping removes them, leaving sub_401000 instead of handle_login. The code still works — it's just much harder for a human to understand.",
  },

  // ── L1 ──
  {
    slug: "re-l1-first",
    competencyId: "reverse-engineering",
    depthTier: 1,
    sectionHeading: "First steps with a binary",
    prompt: "What does `strace` reveal about a binary's behavior that static analysis might miss?",
    options: [
      "The actual system calls made at runtime (file opens, network connections, process creation) — showing what the binary does, not just what its code could do.",
      "The binary's source code.",
      "The compiler used to build the binary.",
      "strace only works on Windows binaries.",
    ],
    correctIndex: 0,
    explanation:
      "strace traces system calls (open, read, write, connect, execve); ltrace traces library calls (printf, strcmp). They show runtime behavior quickly, without needing to understand the assembly. Useful for initial triage before deep RE.",
  },
  {
    slug: "re-l1-ghidra",
    competencyId: "reverse-engineering",
    depthTier: 1,
    sectionHeading: "Ghidra basics",
    prompt: "Why is renaming functions and retyping variables important in Ghidra?",
    options: [
      "It progressively builds understanding — renamed functions and retyped variables improve the decompiler output, making the code more readable and revealing patterns in related functions.",
      "It changes the original binary.",
      "Renaming is purely cosmetic and doesn't affect analysis.",
      "Ghidra automatically names everything correctly.",
    ],
    correctIndex: 0,
    explanation:
      "Ghidra's decompiler produces better pseudo-C when it knows correct types. Renaming sub_401000 to check_password and retyping its parameter from undefined4 to char* makes the decompiled output dramatically clearer. Cross-references (X) show who calls what.",
  },
  {
    slug: "re-l1-x64dbg",
    competencyId: "reverse-engineering",
    depthTier: 1,
    sectionHeading: "x64dbg basics (Windows)",
    prompt: "When would you use a hardware breakpoint instead of a software breakpoint?",
    options: [
      "To detect memory reads/writes at a specific address (data breakpoints), or when the code modifies itself and would overwrite a software breakpoint (int3 patch).",
      "Hardware breakpoints are always slower.",
      "Software breakpoints work on all memory types.",
      "Hardware breakpoints are unlimited in number.",
    ],
    correctIndex: 0,
    explanation:
      "Software breakpoints (int3, 0xCC) replace a code byte — they can be detected and are overwritten by self-modifying code. Hardware breakpoints use CPU debug registers (DR0-DR3, max 4) and can trigger on memory read/write, not just execution.",
  },

  // ── L2 ──
  {
    slug: "re-l2-cflow",
    competencyId: "reverse-engineering",
    depthTier: 2,
    sectionHeading: "Control flow analysis",
    prompt: "How does the System V AMD64 calling convention pass the first two arguments?",
    options: [
      "In registers RDI (first argument) and RSI (second argument), with the return value in RAX.",
      "On the stack, right to left.",
      "In EAX and EBX.",
      "Through global variables.",
    ],
    correctIndex: 0,
    explanation:
      "System V AMD64 (Linux/macOS): RDI, RSI, RDX, RCX, R8, R9 for the first 6 integer args, return in RAX. Windows x64 differs: RCX, RDX, R8, R9. Recognizing the calling convention is essential for understanding function parameters in disassembly.",
  },
  {
    slug: "re-l2-algo",
    competencyId: "reverse-engineering",
    depthTier: 2,
    sectionHeading: "Identifying algorithms",
    prompt: "How can you identify that a binary uses AES encryption from its disassembly?",
    options: [
      "Look for the AES S-box constants (0x63, 0x7C, 0x77, 0x7B...) in the .rodata section — cryptographic algorithms use recognizable initialization constants.",
      "AES cannot be identified from a binary.",
      "AES always uses the same function name.",
      "AES has no recognizable byte patterns.",
    ],
    correctIndex: 0,
    explanation:
      "Crypto algorithms embed telltale constants: AES S-box, SHA-256 init values (0x6A09E667), MD5 init values (0x67452301). Ghidra's FindCrypt plugin and YARA rules with crypto_signatures automate this detection.",
  },
  {
    slug: "re-l2-gdb",
    competencyId: "reverse-engineering",
    depthTier: 2,
    sectionHeading: "Dynamic analysis with GDB",
    prompt: "What does the GDB command `watch *0x404000` do?",
    options: [
      "It sets a watchpoint that breaks execution whenever the memory at address 0x404000 is written to — useful for finding what modifies a specific variable or flag.",
      "It prints the value at 0x404000 continuously.",
      "It deletes the memory at that address.",
      "It sets a software breakpoint at that code address.",
    ],
    correctIndex: 0,
    explanation:
      "Watchpoints (watch for write, rwatch for read, awatch for either) use hardware debug registers to monitor memory access. This is invaluable for finding when and where a value changes, without knowing which code writes to it.",
  },

  // ── L3 ──
  {
    slug: "re-l3-unpack",
    competencyId: "reverse-engineering",
    depthTier: 3,
    sectionHeading: "Malware unpacking",
    prompt: "What are the signs that a binary is packed?",
    options: [
      "High entropy (>7.0) in the code section, very few imports, unusual section names (.UPX0, .packed), and a small code stub that decompresses the real payload at runtime.",
      "The binary is larger than expected.",
      "The binary has many string references.",
      "A packed binary cannot be executed.",
    ],
    correctIndex: 0,
    explanation:
      "Packed binaries compress or encrypt the real code. The visible code is just the unpacker stub. Detect It Easy (DIE) identifies known packers. Manual unpacking involves finding the OEP (Original Entry Point) after the stub finishes, then dumping the process.",
  },
  {
    slug: "re-l3-antidebug",
    competencyId: "reverse-engineering",
    depthTier: 3,
    sectionHeading: "Anti-debugging bypass",
    prompt: "How does the IsDebuggerPresent API detect a debugger, and how is it bypassed?",
    options: [
      "It checks the PEB.BeingDebugged flag (set to 1 when a debugger is attached). Bypass: set that byte to 0 in the debugger's memory view.",
      "It checks the CPU temperature.",
      "It reads a special debugger registry key.",
      "IsDebuggerPresent cannot be bypassed.",
    ],
    correctIndex: 0,
    explanation:
      "IsDebuggerPresent simply reads PEB.BeingDebugged (offset 2 in the PEB). Setting it to 0 in the debugger tricks the check. Other anti-debug techniques (NtQueryInformationProcess, timing checks, INT 3 exceptions) require different bypasses. ScyllaHide automates many.",
  },
  {
    slug: "re-l3-script",
    competencyId: "reverse-engineering",
    depthTier: 3,
    sectionHeading: "Scripting analysis with Ghidra",
    prompt: "What can a Ghidra Python script automate that would be tedious manually?",
    options: [
      "Finding all calls to a specific API across the entire binary, decompiling every function to search for patterns like 'password', and bulk-renaming based on string references.",
      "Ghidra scripts can only change color themes.",
      "Scripts cannot access the decompiler.",
      "Automation is not possible in Ghidra.",
    ],
    correctIndex: 0,
    explanation:
      "Ghidra's scripting API (Java/Python) exposes everything: function enumeration, cross-references, decompilation, renaming, retyping. Automating tasks like 'find every function that references a crypto constant and rename it' saves hours on large binaries.",
  },

  // ── L4 ──
  {
    slug: "re-l4-bindiff",
    competencyId: "reverse-engineering",
    depthTier: 4,
    sectionHeading: "Binary diffing and patch analysis",
    prompt: "How are 1-day exploits developed from Patch Tuesday updates?",
    options: [
      "By diffing the patched and unpatched binaries to find what changed — if the patch adds a bounds check, the vulnerability was a buffer overflow, and you can write a PoC targeting unpatched systems.",
      "1-day exploits are written from scratch without patch analysis.",
      "Patch Tuesday updates cannot be reverse-engineered.",
      "Microsoft publishes full exploit code with each patch.",
    ],
    correctIndex: 0,
    explanation:
      "Binary diffing (BinDiff, Diaphora) compares the vulnerable and patched versions, highlighting changed functions. The patch reveals the vulnerability: an added check implies missing validation, an added comparison implies an off-by-one, etc.",
  },
  {
    slug: "re-l4-symexec",
    competencyId: "reverse-engineering",
    depthTier: 4,
    sectionHeading: "Symbolic execution and constraint solving",
    prompt: "What does angr's symbolic execution do that manual analysis cannot easily achieve?",
    options: [
      "It automatically explores code paths with symbolic (unknown) inputs and uses an SMT solver (Z3) to find concrete inputs that reach a target state — like finding a password that reaches 'Correct!'.",
      "It can only run the program with known inputs.",
      "It replaces the need for disassembly.",
      "It is limited to single-function analysis.",
    ],
    correctIndex: 0,
    explanation:
      "angr tracks symbolic values through execution, building path constraints. When a target state is reached (e.g., stdout contains 'Correct'), the solver produces concrete input values satisfying all constraints along that path. Powerful for CTF crackmes and license checks.",
  },
  {
    slug: "re-l4-firmware",
    competencyId: "reverse-engineering",
    depthTier: 4,
    sectionHeading: "Firmware reverse engineering",
    prompt: "What does binwalk do as the first step in firmware analysis?",
    options: [
      "It scans the firmware binary for embedded filesystems and file signatures, then extracts them — revealing the device's files, scripts, and binaries for analysis.",
      "It flashes new firmware to the device.",
      "It only works on x86 firmware.",
      "It encrypts the firmware for safe analysis.",
    ],
    correctIndex: 0,
    explanation:
      "binwalk identifies and extracts embedded content: squashfs, cramfs, JFFS2 filesystems, certificates, and compressed data. Once extracted, you can grep for hardcoded credentials, analyze CGI handlers for command injection, and emulate binaries with QEMU.",
  },

  // ── L5 ──
  {
    slug: "re-l5-compiler",
    competencyId: "reverse-engineering",
    depthTier: 5,
    sectionHeading: "Compiler internals and optimization patterns",
    prompt: "How does a compiler optimize integer division by a constant (e.g., x/10)?",
    options: [
      "It replaces the slow `div` instruction with a multiply by a magic constant followed by a shift — the magic constant identifies which divisor was used.",
      "It uses a lookup table for all possible dividends.",
      "Division is always performed with the `div` instruction.",
      "The compiler cannot optimize division.",
    ],
    correctIndex: 0,
    explanation:
      "x/10 becomes: mul by 0xCCCCCCCCCCCCCCCD, then shr rdx, 3. This is much faster than div. Recognizing these magic constants helps reconstruct the original arithmetic in decompiled code. Stack cookies and vtable dispatches are other important compiler patterns.",
  },
  {
    slug: "re-l5-obfusc",
    competencyId: "reverse-engineering",
    depthTier: 5,
    sectionHeading: "Obfuscation internals",
    prompt: "What is control flow flattening and why does it hinder analysis?",
    options: [
      "It replaces structured control flow (if/else, loops) with a dispatcher that selects the next basic block via a state variable — all blocks are at the same level, hiding the original program logic.",
      "It removes all function calls.",
      "It encrypts the control flow graph.",
      "It adds more functions to the binary.",
    ],
    correctIndex: 0,
    explanation:
      "Control flow flattening turns structured code into a state machine: while(state) { switch(state) { case 1: ... state=2; break; ... } }. Combined with opaque predicates (always-true conditions that look complex) and MBA (x+y → (x&y)*2+(x^y)), it makes static analysis extremely difficult.",
  },
  {
    slug: "re-l5-ir",
    competencyId: "reverse-engineering",
    depthTier: 5,
    sectionHeading: "Intermediate representations for analysis",
    prompt: "Why do advanced RE tools lift machine code to an intermediate representation (IR)?",
    options: [
      "An IR enables architecture-independent analysis — one analysis pass works on x86, ARM, MIPS, etc. It also enables applying compiler optimizations for deobfuscation.",
      "IRs make the code run faster.",
      "Machine code cannot be analyzed without an IR.",
      "IRs are only used for compilation, not analysis.",
    ],
    correctIndex: 0,
    explanation:
      "VEX IR (angr/Valgrind), LLVM IR (RetDec, McSema), and BAP BIL abstract away architecture-specific details. Analysis algorithms written against the IR work on any supported architecture. LLVM IR also enables recompilation and optimizer-based deobfuscation.",
  },
];
