import type { SeedExercise } from "./types";

/** c-core L0–L5 — one comprehension MCQ per teaching section. */
export const C_CORE_EXERCISES: SeedExercise[] = [
  // ── L0 ──
  {
    slug: "c-core-l0-what-c-is",
    competencyId: "c-core",
    depthTier: 0,
    sectionHeading: "What C Is and Where It Lives",
    prompt: "What makes C especially relevant to cybersecurity?",
    options: [
      "It sits one thin layer above assembly with direct byte/address control, and most OS and network CVEs trace back to its memory model.",
      "It is interpreted, so memory bugs are caught at runtime before shipping.",
      "It has automatic garbage collection, which eliminates memory bugs.",
      "It runs on only one architecture, which keeps the attack surface small.",
    ],
    correctIndex: 0,
    explanation:
      "C's closeness to the hardware — manual memory, raw pointers — is why kernels, libc, and network stacks are written in it, and why memory-management mistakes account for most OS/network CVEs.",
  },
  {
    slug: "c-core-l0-vocabulary",
    competencyId: "c-core",
    depthTier: 0,
    sectionHeading: "Key Vocabulary",
    prompt: "What does “undefined behaviour (UB)” mean in C?",
    options: [
      "The standard leaves the result unpredictable, and compilers may optimize by assuming it never happens.",
      "The program always halts immediately with a clear error message.",
      "Behaviour that merely differs between C standard versions.",
      "A runtime warning that is safe to ignore.",
    ],
    correctIndex: 0,
    explanation:
      "UB is more than an unpredictable value: compilers assume UB never occurs and may delete code paths that would run only if it did — which is what makes UB dangerous.",
  },
  {
    slug: "c-core-l0-compilation",
    competencyId: "c-core",
    depthTier: 0,
    sectionHeading: "The Compilation Pipeline",
    prompt: "In the C build pipeline, what does the linker (ld) do?",
    options: [
      "Merges object files and libraries into the final executable.",
      "Expands macros and includes header files.",
      "Translates C source into assembly.",
      "Converts assembly into an object file.",
    ],
    correctIndex: 0,
    explanation:
      "The order is preprocess → compile (C→asm) → assemble (asm→.o) → link (merge .o + libs → binary). Tools like checksec and readelf operate on that final linked ELF.",
  },
  // ── L1 ──
  {
    slug: "c-core-l1-pointer",
    competencyId: "c-core",
    depthTier: 1,
    sectionHeading: "Pointer Declaration and Dereferencing",
    prompt: "Why does the pointed-to type of a pointer matter?",
    options: [
      "It determines how many bytes a dereference reads and how far pointer arithmetic advances.",
      "It has no effect; every pointer behaves identically.",
      "It controls whether the pointer lives on the stack or the heap.",
      "It sets the pointer's value automatically.",
    ],
    correctIndex: 0,
    explanation:
      "An int* advances by sizeof(int) and reads that many bytes; a char* advances by 1. The type drives dereference width and arithmetic stride, so mismatches cause bugs and UB such as unaligned access.",
  },
  {
    slug: "c-core-l1-stack-heap",
    competencyId: "c-core",
    depthTier: 1,
    sectionHeading: "Stack vs Heap",
    prompt: "Which statement about stack versus heap memory is correct?",
    options: [
      "Stack memory is reclaimed automatically when a function returns; heap memory must be freed manually.",
      "Both stack and heap are reclaimed automatically by the runtime.",
      "The heap is reclaimed automatically; the stack must be freed with free().",
      "Neither can be reclaimed once allocated.",
    ],
    correctIndex: 0,
    explanation:
      "Locals live on the stack with automatic lifetime tied to the call; heap allocations from malloc persist until you free them. Forgetting to free leaks memory; using memory after free is exploitable.",
  },
  {
    slug: "c-core-l1-arrays",
    competencyId: "c-core",
    depthTier: 1,
    sectionHeading: "Arrays and Pointer Arithmetic",
    prompt: "For `int *p`, what does `p + 2` compute?",
    options: [
      "An address 2 * sizeof(int) bytes further on, because pointer arithmetic is type-scaled.",
      "An address exactly 2 bytes further on.",
      "An address 2 bits further on.",
      "Nothing — it fails to compile.",
    ],
    correctIndex: 0,
    explanation:
      "Pointer arithmetic counts in units of the pointed-to type, so `p + 2` skips two ints. C also does not bounds-check array access, which is the basis of stack buffer overflows (CWE-121).",
  },
  {
    slug: "c-core-l1-strings",
    competencyId: "c-core",
    depthTier: 1,
    sectionHeading: "Strings as char Arrays",
    prompt: "What marks the end of a C “string”?",
    options: [
      "A null terminator byte ('\\0'); functions like strlen depend on it.",
      "A trailing newline character.",
      "A length field stored before the characters.",
      "The end of the allocated buffer.",
    ],
    correctIndex: 0,
    explanation:
      "A C string is a char array ended by '\\0'. If that terminator is missing or overwritten, strlen/strcpy read past the buffer — an info-leak/overflow vector. Prefer bounded variants like strncpy and snprintf.",
  },
  // ── L2 ──
  {
    slug: "c-core-l2-malloc",
    competencyId: "c-core",
    depthTier: 2,
    sectionHeading: "How malloc and free Work",
    prompt: "Where does glibc store a heap chunk's size metadata, and why does it matter?",
    options: [
      "Just before the returned pointer, so an overflow in one chunk can corrupt the next chunk's metadata (the unlink attack).",
      "In a kernel table the process cannot reach.",
      "After the user data, so overflows can never reach it.",
      "Nowhere — malloc does not track sizes.",
    ],
    correctIndex: 0,
    explanation:
      "Chunk metadata (size and flags) sits inline right before the user data. Because it is adjacent, an overflow can overwrite a neighbor's metadata — the foundation of classic heap-exploitation techniques.",
  },
  {
    slug: "c-core-l2-uaf",
    competencyId: "c-core",
    depthTier: 2,
    sectionHeading: "Use-After-Free",
    prompt: "Why is a use-after-free exploitable rather than just a crash?",
    options: [
      "After free, the allocator can hand the same memory to a new allocation the attacker controls, so the dangling dereference uses attacker data.",
      "free() zeroes the memory, so later reads always return 0.",
      "The pointer becomes NULL automatically, forcing a safe crash.",
      "It is caught as a compile-time error before running.",
    ],
    correctIndex: 0,
    explanation:
      "The freed chunk gets reused; if the attacker fills it, the stale pointer now reads or writes their data, potentially redirecting control flow. Setting the pointer to NULL after free turns it into a cleaner null-deref.",
  },
  {
    slug: "c-core-l2-doublefree",
    competencyId: "c-core",
    depthTier: 2,
    sectionHeading: "Double Free",
    prompt: "What can calling free() twice on the same pointer do in glibc?",
    options: [
      "Corrupt the free lists so that two later mallocs return the same address.",
      "Safely do nothing the second time.",
      "Immediately free the entire heap.",
      "Move the chunk to a fresh address.",
    ],
    correctIndex: 0,
    explanation:
      "A double free can insert one chunk into a free list twice; two subsequent mallocs then alias the same memory — a powerful primitive. Setting the pointer to NULL after free makes a second free(NULL) a safe no-op.",
  },
  {
    slug: "c-core-l2-overflow",
    competencyId: "c-core",
    depthTier: 2,
    sectionHeading: "Buffer Overflows on the Stack",
    prompt: "In a classic stack buffer overflow, what does the attacker overwrite to hijack execution?",
    options: [
      "The saved return address stored above the local buffer.",
      "The heap's top chunk.",
      "The program's environment variables.",
      "The read-only .rodata section.",
    ],
    correctIndex: 0,
    explanation:
      "Writing past a local array can overwrite the saved frame pointer and return address; classic exploitation points the return address at shellcode. Canaries, ASLR, and NX are the standard defenses.",
  },
  {
    slug: "c-core-l2-fmtstring",
    competencyId: "c-core",
    depthTier: 2,
    sectionHeading: "Format-String Vulnerabilities",
    prompt: "Why is `printf(user_input)` dangerous?",
    options: [
      "Attacker-supplied specifiers let %x/%s read the stack and %n write to memory.",
      "printf silently rejects any untrusted input.",
      "It prints the literal string with no risk at all.",
      "It only leaks printf's own return value.",
    ],
    correctIndex: 0,
    explanation:
      "With an attacker-controlled format string, %x/%s leak memory and %n writes the number of bytes printed to a pointed address — enough to overwrite a GOT entry. Always write printf(\"%s\", input).",
  },
  {
    slug: "c-core-l2-tooling",
    competencyId: "c-core",
    depthTier: 2,
    sectionHeading: "Tooling for Detection",
    prompt: "Which tool detects use-after-free and buffer overflows by instrumenting the build?",
    options: [
      "AddressSanitizer (-fsanitize=address).",
      "readelf.",
      "strings.",
      "objdump.",
    ],
    correctIndex: 0,
    explanation:
      "ASan instruments memory accesses at compile time to catch overflows, UAF, and double-free at runtime; Valgrind does similar without recompiling. Both catch bugs a bare segfault would hide.",
  },
  {
    slug: "c-core-l2-padding",
    competencyId: "c-core",
    depthTier: 2,
    sectionHeading: "Struct padding and alignment",
    prompt: "Why can reordering struct members largest-to-smallest reduce sizeof?",
    options: [
      "It minimizes the alignment padding the compiler inserts between members.",
      "It removes members the compiler deems unused.",
      "It compresses the data with a built-in algorithm.",
      "It moves the struct from the stack to the heap.",
    ],
    correctIndex: 0,
    explanation:
      "Each member is aligned to a multiple of its own size and the struct is padded to its largest member's alignment; ordering large→small packs them with less wasted padding. Leftover padding bytes can also leak uninitialized data when a struct is serialized.",
  },
  {
    slug: "c-core-l2-bitwise",
    competencyId: "c-core",
    depthTier: 2,
    sectionHeading: "Bitwise operations and bitmasks",
    prompt: "How do you clear a specific flag bit in a bitmask?",
    options: [
      "AND with the bitwise NOT of the flag: perms &= ~FLAG.",
      "OR with the flag: perms |= FLAG.",
      "XOR with the flag: perms ^= FLAG.",
      "Right-shift the mask by the flag.",
    ],
    correctIndex: 0,
    explanation:
      "`|=` sets a bit, `&= ~` clears it, `&` tests it, and `^=` toggles it. Bitmasks underlie permission systems, hardware registers, and protocol flags.",
  },
  // ── L3 ──
  {
    slug: "c-core-l3-libc",
    competencyId: "c-core",
    depthTier: 3,
    sectionHeading: "Overview of libc",
    prompt: "Why does understanding libc matter for binary exploitation?",
    options: [
      "Exploits target libc functions and reuse ROP gadgets found in libc.so.",
      "libc is never mapped into a running process.",
      "libc is written in Python and trivial to patch.",
      "libc automatically prevents all buffer overflows.",
    ],
    correctIndex: 0,
    explanation:
      "libc (glibc/musl) implements printf, malloc, and system, and is a large source of ROP gadgets and one-gadgets; ret2libc and gadget reuse are staples of exploitation.",
  },
  {
    slug: "c-core-l3-strlen",
    competencyId: "c-core",
    depthTier: 3,
    sectionHeading: "String Functions Under the Hood",
    prompt: "Why is glibc's real strlen far more complex than a byte-by-byte loop?",
    options: [
      "It uses SIMD (SSE2/AVX2) to scan 16–32 bytes at a time, aligned to cache lines.",
      "It first validates that the string is null-terminated.",
      "It allocates a defensive copy of the string.",
      "It counts the null terminator in the returned length.",
    ],
    correctIndex: 0,
    explanation:
      "Production strlen is vectorized for speed. It still overreads a non-terminated buffer (handy for leaks, dangerous defensively), so track lengths explicitly rather than trusting strlen.",
  },
  {
    slug: "c-core-l3-malloc-internals",
    competencyId: "c-core",
    depthTier: 3,
    sectionHeading: "Memory Allocation Internals",
    prompt: "In glibc's allocator, what are “bins”?",
    options: [
      "Linked lists grouping free chunks by size (fastbins, unsorted, small, large).",
      "The regions where the stack grows and shrinks.",
      "Compiler optimization passes.",
      "Log files where malloc records allocations.",
    ],
    correctIndex: 0,
    explanation:
      "ptmalloc2 sorts freed chunks into size-class bins for reuse; tcache, fastbin, unsorted, small, and large bins each have distinct exploitation characteristics.",
  },
  {
    slug: "c-core-l3-variadic",
    competencyId: "c-core",
    depthTier: 3,
    sectionHeading: "printf and Variadic Functions",
    prompt: "How does printf know the types of its variadic arguments?",
    options: [
      "The format string tells va_arg which type to read next; a mismatch reads whatever happens to be there.",
      "It inspects a runtime type tag on each argument.",
      "The compiler passes a hidden array of type descriptors.",
      "All variadic arguments are required to be int.",
    ],
    correctIndex: 0,
    explanation:
      "va_arg blindly reads the next argument as the type the specifier names. If %x has no matching int, it reads adjacent stack data — exactly why format-string bugs leak memory.",
  },
  {
    slug: "c-core-l3-reimpl-calloc",
    competencyId: "c-core",
    depthTier: 3,
    sectionHeading: "Reimplementing Standard Functions Safely",
    prompt: "Why must ft_calloc(count, size) check `count > SIZE_MAX / size` before multiplying?",
    options: [
      "count * size can integer-overflow to a small value, under-allocating and causing a later heap overflow.",
      "calloc is forbidden from calling malloc.",
      "SIZE_MAX is always smaller than size.",
      "It makes the allocation run faster.",
    ],
    correctIndex: 0,
    explanation:
      "An overflowing size multiplication under-allocates, and subsequent writes overflow the heap (CWE-190). A pre-multiplication overflow check is essential for safe allocation.",
  },
  {
    slug: "c-core-l3-ret2libc",
    competencyId: "c-core",
    depthTier: 3,
    sectionHeading: "libc as an Exploit Toolkit",
    prompt: "What is a “one-gadget”?",
    options: [
      "A single libc address that runs execve(\"/bin/sh\", NULL, NULL) given the right register/stack state.",
      "A one-byte overflow primitive.",
      "A gadget that only pops a single register.",
      "A CPU instruction that disables ASLR.",
    ],
    correctIndex: 0,
    explanation:
      "one_gadget finds addresses in glibc that spawn a shell when certain register/stack constraints hold. Offsets differ per glibc version, so identifying the target's version matters.",
  },
  {
    slug: "c-core-l3-funcptr",
    competencyId: "c-core",
    depthTier: 3,
    sectionHeading: "Function pointers and dispatch tables",
    prompt: "How does overwriting a stored function pointer help an attacker?",
    options: [
      "The next call through it transfers execution to an attacker-chosen address.",
      "It changes the function's declared return type.",
      "It frees the function from memory.",
      "It has no effect at runtime.",
    ],
    correctIndex: 0,
    explanation:
      "A dispatch table or callback is just an array of function pointers; corrupting one redirects the indirect call. This is why CFI and stack protectors exist.",
  },
  {
    slug: "c-core-l3-const",
    competencyId: "c-core",
    depthTier: 3,
    sectionHeading: "Const correctness in C",
    prompt: "What does `int *const p` mean?",
    options: [
      "A const pointer to a mutable int — you cannot change p, but you can change *p.",
      "A pointer to a const int — you can change p but not *p.",
      "Both p and *p are immutable.",
      "Neither p nor *p can even be read.",
    ],
    correctIndex: 0,
    explanation:
      "Read right-to-left: `const int *p` is a pointer to const int; `int *const p` is a const pointer to int; `const int *const p` makes both const. Where const sits decides exactly what is immutable.",
  },
  // ── L4 ──
  {
    slug: "c-core-l4-why-rebuild",
    competencyId: "c-core",
    depthTier: 4,
    sectionHeading: "Why Rebuild What Already Exists",
    prompt: "What is the security value of reimplementing libc functions from scratch?",
    options: [
      "You confront the edge cases (NULL, overlap, overflow) whose mishandling becomes exploitable bugs.",
      "Your versions are guaranteed faster than glibc.",
      "It removes any need to use libc again.",
      "It disables undefined behaviour in your program.",
    ],
    correctIndex: 0,
    explanation:
      "Building ft_printf, ft_malloc, and get_next_line forces you to handle the exact edge cases that, when wrong in production code, turn into CVEs — discipline that transfers directly to secure coding.",
  },
  {
    slug: "c-core-l4-ftprintf-star",
    competencyId: "c-core",
    depthTier: 4,
    sectionHeading: "Building ft_printf: Parsing and Conversion",
    prompt: "When printf width is given as `*` and the argument is negative, what does it mean?",
    options: [
      "Left-justify, with the width taken as the absolute value.",
      "Right-justify with zero padding.",
      "It is an error and nothing prints.",
      "Truncate the output to zero width.",
    ],
    correctIndex: 0,
    explanation:
      "A negative `*` width implies the '-' (left-justify) flag with |width| (C17 7.21.6.1p5). Missing this edge case is a common 42 evaluation failure.",
  },
  {
    slug: "c-core-l4-allocator-align",
    competencyId: "c-core",
    depthTier: 4,
    sectionHeading: "Writing a Custom Memory Allocator",
    prompt: "Why must a custom allocator align allocations to 16 bytes on x86-64?",
    options: [
      "The x86-64 ABI requires 16-byte alignment for SSE instructions.",
      "Because pointers are 16 bytes wide.",
      "So that every allocation is exactly 16 bytes.",
      "Alignment is optional and only affects readability.",
    ],
    correctIndex: 0,
    explanation:
      "The System V x86-64 ABI mandates 16-byte alignment (SSE loads/stores fault otherwise). A custom malloc replacing libc via LD_PRELOAD must honor it.",
  },
  {
    slug: "c-core-l4-gnl-fd",
    competencyId: "c-core",
    depthTier: 4,
    sectionHeading: "get_next_line: Buffered I/O and File Descriptor Management",
    prompt: "Why must get_next_line validate the fd before indexing its per-fd array?",
    options: [
      "A negative or out-of-range fd would be an out-of-bounds array access.",
      "File descriptors are always valid, so no check is needed.",
      "read() rejects invalid fds, making the array access safe.",
      "To allow a larger BUFFER_SIZE.",
    ],
    correctIndex: 0,
    explanation:
      "Indexing a fixed-size per-fd array with an unchecked fd is an OOB access. Also, read() can return short (loop until done), and the read buffer should be heap-allocated so a huge BUFFER_SIZE does not blow the stack.",
  },
  {
    slug: "c-core-l4-testing",
    competencyId: "c-core",
    depthTier: 4,
    sectionHeading: "Testing Against the Real Implementation",
    prompt: "What is the right way to validate an ft_printf reimplementation?",
    options: [
      "Compare its output and return value against the system printf on edge cases (INT_MIN, NULL, zero precision).",
      "Only check that it compiles without warnings.",
      "Trust it once it prints “hello world”.",
      "Compare it against a different custom implementation.",
    ],
    correctIndex: 0,
    explanation:
      "Diff against the real function on documented edge cases (glibc prints “(null)” for %s of NULL, and so on). Matching the spec's corner behavior is the whole point.",
  },
  {
    slug: "c-core-l4-perf",
    competencyId: "c-core",
    depthTier: 4,
    sectionHeading: "Performance Profiling",
    prompt: "What allocator performance problem does a segregated (per-size-class) free list solve?",
    options: [
      "The slow linear search of a single free list for a fitting block.",
      "Excessive stack usage.",
      "Integer overflow in size calculations.",
      "A lack of thread safety.",
    ],
    correctIndex: 0,
    explanation:
      "Separate lists per size class give near-O(1) small allocations instead of scanning one big list. Pre-allocating zones cuts mmap calls, and aligning to cache lines avoids false sharing.",
  },
  {
    slug: "c-core-l4-alloc-security",
    competencyId: "c-core",
    depthTier: 4,
    sectionHeading: "Security Implications of Custom Allocators",
    prompt: "Why can a simpler custom allocator make exploitation EASIER than glibc?",
    options: [
      "Its deterministic, predictable layout helps an attacker place data precisely.",
      "It uses more memory, which hides the bug.",
      "It encrypts every allocation.",
      "It never reuses freed memory.",
    ],
    correctIndex: 0,
    explanation:
      "Predictable allocation order aids heap grooming; glibc adds some randomization (MALLOC_PERTURB_). Inline metadata next to user data also lets an off-by-one write corrupt a neighbor.",
  },
  // ── L5 ──
  {
    slug: "c-core-l5-ub",
    competencyId: "c-core",
    depthTier: 5,
    sectionHeading: "Undefined Behaviour as a Security Primitive",
    prompt: "Why might a compiler delete an overflow check like `if (x + 100 < x)`?",
    options: [
      "Signed overflow is UB, so the optimizer assumes it never happens and the condition is always false.",
      "The check is syntactically invalid.",
      "The optimizer cannot see the comparison.",
      "x + 100 is fully computed at compile time.",
    ],
    correctIndex: 0,
    explanation:
      "Because signed overflow is UB, the optimizer assumes x+100 ≥ x always and removes the branch — a real, documented class of vanished security checks. Use unsigned math or __builtin_add_overflow.",
  },
  {
    slug: "c-core-l5-aliasing",
    competencyId: "c-core",
    depthTier: 5,
    sectionHeading: "Strict Aliasing and Type-Punning Hazards",
    prompt: "Why is `*(float *)&bits` (where bits is a uint32_t) undefined, and what is the fix?",
    options: [
      "It violates strict aliasing (accessing an object through an incompatible type); use memcpy instead.",
      "It is perfectly fine at any optimization level.",
      "floats cannot be 32 bits, so it overflows.",
      "The fix is to mark bits volatile.",
    ],
    correctIndex: 0,
    explanation:
      "Strict aliasing (C17 6.5p7) forbids accessing a uint32_t through a float lvalue; at -O2 the compiler may reorder or elide reads. memcpy is the well-defined type-pun — the Linux kernel builds with -fno-strict-aliasing for this reason.",
  },
  {
    slug: "c-core-l5-tcache",
    competencyId: "c-core",
    depthTier: 5,
    sectionHeading: "Modern glibc Heap Exploitation: Tcache and Beyond",
    prompt: "In glibc ≥ 2.32, why does tcache “safe-linking” force an attacker to also leak a heap address?",
    options: [
      "The freed chunk's next pointer is XOR-mangled with (chunk address >> 12), so forging it requires the heap base.",
      "It encrypts the whole heap with a random key.",
      "It disables the tcache entirely.",
      "It moves the heap into kernel space.",
    ],
    correctIndex: 0,
    explanation:
      "PROTECT_PTR mangles fastbin/tcache fd pointers using the chunk's own address, so poisoning the list requires knowing that address. Modern exploits therefore need a heap leak in addition to the write primitive.",
  },
  {
    slug: "c-core-l5-houses",
    competencyId: "c-core",
    depthTier: 5,
    sectionHeading: "House-of-* Techniques",
    prompt: "What does the “House of Force” technique corrupt?",
    options: [
      "The top chunk's size field, so a crafted malloc makes the top pointer wrap to a target address.",
      "A function's saved return address.",
      "The GOT directly.",
      "The stack canary.",
    ],
    correctIndex: 0,
    explanation:
      "House of Force overwrites the wilderness/top-chunk size to a huge value, then requests a size that advances the top pointer to an arbitrary address (mitigated by a top-size check in glibc 2.29).",
  },
  {
    slug: "c-core-l5-hardening",
    competencyId: "c-core",
    depthTier: 5,
    sectionHeading: "Compiler Hardening and Its Limits",
    prompt: "What does CFI (Control-Flow Integrity) protect against, and what does it NOT stop?",
    options: [
      "It validates indirect-call targets (defeating many ROP/JOP chains) but not data-only attacks.",
      "It prevents all integer overflows.",
      "It stops data-only attacks but permits ROP.",
      "It encrypts the stack.",
    ],
    correctIndex: 0,
    explanation:
      "CFI checks that indirect calls hit valid targets of the expected type, breaking control-flow hijacks — but attacks that corrupt only data (no diverted control flow) slip past it. Defense in depth is required.",
  },
  {
    slug: "c-core-l5-sanitizers",
    competencyId: "c-core",
    depthTier: 5,
    sectionHeading: "Sanitisers for Deep Bug Hunting",
    prompt: "Which sanitizer detects reads of uninitialized memory?",
    options: [
      "MemorySanitizer (MSan).",
      "ThreadSanitizer (TSan).",
      "AddressSanitizer (ASan).",
      "UndefinedBehaviorSanitizer (UBSan).",
    ],
    correctIndex: 0,
    explanation:
      "MSan finds uninitialized reads (CWE-908, an info-leak class); ASan finds spatial/temporal memory errors, TSan finds data races, UBSan finds UB. ASan and MSan cannot share one build.",
  },
  {
    slug: "c-core-l5-dataonly",
    competencyId: "c-core",
    depthTier: 5,
    sectionHeading: "Data-Only Attacks and Non-Control-Data Exploitation",
    prompt: "Why are data-only attacks (e.g. flipping an is_admin flag) hard to stop?",
    options: [
      "Control flow stays legitimate, so CFI, canaries, and shadow stacks never trigger.",
      "They require kernel privileges to attempt.",
      "They always crash the program first.",
      "Compilers reject them at build time.",
    ],
    correctIndex: 0,
    explanation:
      "Corrupting data without diverting control flow evades control-flow defenses. Research responses include memory tagging (ARM MTE) and CHERI capabilities that enforce pointer bounds in hardware.",
  },
];
