import type { SeedExercise } from "./types";

/** c-core L0–L5 — one comprehension MCQ per teaching section. */
export const C_CORE_EXERCISES: SeedExercise[] = [
  // ── L0 ──
  {
    slug: "c-core-l0-what-c-is",
    competencyId: "c-core",
    depthTier: 0,
    sectionHeading: "What C Is and Where It Lives",
    prompt: "A junior analyst asks why your team reverse-engineers C-compiled binaries instead of focusing on higher-level languages. What is the most accurate justification?",
    options: [
      "C provides direct byte-level and pointer-based memory control with no runtime safety net, and because OS kernels, network stacks, and libc are all written in C, the vast majority of kernel and network CVEs trace back to its memory model.",
      "C produces the smallest binaries of any compiled language, making them faster to disassemble in tools like IDA Pro, so reverse engineering C targets is fundamentally more efficient than analyzing output from Rust or Go, which embed large runtimes.",
      "C's standardized calling convention places function arguments in the same registers across every architecture, making automated binary analysis tools far more reliable on C binaries than on code from languages with platform-dependent argument-passing conventions.",
      "C is the only systems language that still lacks position-independent code support, so its binaries always load at fixed addresses without ASLR, making exploits deterministic and static analysis straightforward compared to modern compiled languages.",
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
    prompt: "You compile a program with -O2 and notice that a security check you wrote — `if (x + 100 < x) abort();` — disappears from the binary. A colleague calls this undefined behaviour. What does that term mean in C?",
    options: [
      "The C standard imposes no requirements on what happens, and compilers may assume UB never occurs and optimize accordingly — here it assumed signed overflow is impossible, making the check always false and deleting it entirely.",
      "The C standard requires the compiler to emit a diagnostic warning and continue with a safe default, inserting a runtime bounds check that the optimizer later merges with adjacent checks for efficiency at higher optimization levels.",
      "The behaviour is defined differently by each C standard revision — C99 wraps on overflow, C11 saturates, and C17 traps — so the check was removed because the C17 hardware trap instruction makes it redundant on this platform.",
      "The program is required to halt immediately with a SIGFPE signal whenever signed overflow occurs, so the compiler removed the manual check because the hardware already catches the exact same condition automatically at runtime.",
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
    prompt: "You run `gcc -v main.c` and see cc1, as, and collect2/ld invoked in sequence. Your build fails with \"undefined reference to 'encrypt'\". Which stage is reporting this error?",
    options: [
      "The linker (ld), which merges object files and libraries into the final executable — it cannot find the symbol 'encrypt' because the library providing it was not passed on the link command line.",
      "The preprocessor (cpp), which expands macros and includes headers — it cannot find a header that declares 'encrypt' and therefore cannot resolve the reference during the macro expansion phase.",
      "The compiler (cc1), which translates C source to assembly — it marks 'encrypt' as an undefined type because no matching function signature was found during semantic analysis of the translation unit.",
      "The assembler (as), which converts assembly to an object file — it rejects 'encrypt' as an invalid mnemonic because no processor instruction matches that name in the target architecture's instruction set.",
    ],
    correctIndex: 0,
    explanation:
      "The order is preprocess -> compile (C->asm) -> assemble (asm->.o) -> link (merge .o + libs -> binary). 'Undefined reference' is a linker error. Tools like checksec and readelf operate on the final linked ELF.",
  },
  // ── L1 ──
  {
    slug: "c-core-l1-pointer",
    competencyId: "c-core",
    depthTier: 1,
    sectionHeading: "Pointer Declaration and Dereferencing",
    prompt: "You cast a `char *` to an `int *` and dereference it. On a little-endian machine the buffer contains bytes 0x41, 0x42, 0x43, 0x44. What value do you get, and why does the pointed-to type matter?",
    options: [
      "You get 0x44434241 because dereferencing an int* reads sizeof(int) bytes and assembles them in little-endian order — the pointed-to type controls how many bytes are read and how pointer arithmetic advances.",
      "You get 0x41 because the dereference always reads a single byte regardless of the pointer type — the type annotation exists only for the compiler's type-checker and has no effect on the generated machine code.",
      "You get 0x41424344 because the processor always reads memory in big-endian order at the hardware level — the pointed-to type only determines whether the compiler inserts a byte-swap instruction afterward.",
      "You get a segfault because casting between pointer types is unconditionally undefined behaviour in C — the compiler inserts a trap instruction whenever it detects an incompatible pointer cast at any optimization level.",
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
    prompt: "A function returns a pointer to a local `char buf[64]`. The caller sometimes reads valid data and sometimes garbage. What memory-management concept explains this inconsistent behaviour?",
    options: [
      "Stack memory is reclaimed when the function returns, so the pointer becomes dangling — the caller reads whatever later overwrites that stack frame, which may look valid by coincidence until another call clobbers it.",
      "Heap memory allocated inside the function is garbage-collected after a short delay, so the caller must read the pointer quickly before the collector runs — the inconsistency reflects varying garbage-collection timing.",
      "The buf array is placed in a read-only segment after the function returns, so the caller can read it until the next write to that segment triggers a protection fault and corrupts the previously valid data.",
      "The compiler moves local arrays to thread-local storage after the function exits, so reads from other threads see valid data but reads from the same thread see garbage because TLS is cleared on return.",
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
    prompt: "Given `int arr[4] = {10, 20, 30, 40};` and `int *p = arr;`, a student expects `*(p + 2)` to access the byte two positions forward. Instead it yields 30. Why?",
    options: [
      "Pointer arithmetic is scaled by the pointed-to type's size, so p + 2 advances by 2 * sizeof(int) bytes, landing on arr[2] which holds 30 — C does not bounds-check this access, which is why overflows are possible.",
      "The compiler detects that the array is small and automatically converts pointer arithmetic to index arithmetic, replacing p + 2 with arr[2] as an optimization that only works for arrays with fewer than 16 elements.",
      "The + operator on pointers performs modular arithmetic modulo the array length, so p + 2 wraps around within the 4-element array and coincidentally lands on element 2 — larger arrays would produce different results.",
      "Integer pointers always advance in 2-byte increments regardless of sizeof(int), because the C standard defines pointer stride as half the type's alignment — on this platform int happens to be 4 bytes wide.",
    ],
    correctIndex: 0,
    explanation:
      "Pointer arithmetic counts in units of the pointed-to type, so p + 2 skips two ints. C also does not bounds-check array access, which is the basis of stack buffer overflows (CWE-121).",
  },
  {
    slug: "c-core-l1-strings",
    competencyId: "c-core",
    depthTier: 1,
    sectionHeading: "Strings as char Arrays",
    prompt: "You run `strlen` on a `char buf[8]` that was filled with exactly 8 non-zero characters by `read()`. The function returns 47 instead of 8. What went wrong?",
    options: [
      "C strings are terminated by a '\\0' byte, and buf has none — strlen walked past the buffer into adjacent memory, counting bytes until it stumbled on a zero byte 47 positions from the start of the array.",
      "strlen counts from the end of the buffer backwards to the first non-zero byte, so it measured the distance from byte 47 in memory back to the start of buf — filling all 8 bytes confused its direction logic.",
      "read() stores the file descriptor number as a hidden prefix before the data, shifting all characters forward — strlen counted from the true start including the prefix, producing a count larger than expected.",
      "strlen returns the allocated capacity of the underlying memory page rather than the string length when no null terminator is found — the page allocator assigned 47 bytes to the region containing buf on this run.",
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
    prompt: "You overflow a heap buffer by 16 bytes in a CTF challenge and the next malloc returns a corrupted pointer. Where does glibc store the metadata you just overwrote?",
    options: [
      "Inline, just before each chunk's user data — the size field and flags sit immediately preceding the returned pointer, so your overflow clobbered the adjacent chunk's metadata, which is the basis of the classic unlink attack.",
      "In a kernel-managed descriptor table mapped into a separate read-only page that the process cannot directly write — your overflow must have triggered a page fault that corrupted the kernel's copy of the metadata.",
      "At the end of each chunk's user data in a trailing footer structure — your 16-byte overflow landed on the footer of your own chunk rather than the next one, so only your chunk's free() call will misbehave.",
      "In a process-wide hash table stored in the .bss segment, indexed by the chunk's address — your overflow into adjacent heap memory could not have reached .bss, so the corruption must originate from a different bug.",
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
    prompt: "After calling `free(obj)`, your program later dereferences obj and reads attacker-controlled data instead of crashing. Why is use-after-free exploitable rather than just a null-pointer crash?",
    options: [
      "After free, the allocator can hand that same memory to a new allocation the attacker controls — the dangling pointer now reads the attacker's data, potentially redirecting a function pointer or changing a security-critical flag.",
      "free() zeros out the memory and marks the page as no-access, but the MMU only enforces the protection on the next context switch — reads between the free and the switch return attacker-controlled register values instead.",
      "The C runtime replaces freed pointers with a sentinel value pointing to a global error page, but if the attacker overwrites that sentinel page through a separate vulnerability, all dangling dereferences read attacker data.",
      "free() places the memory in a quarantine where reads return random bytes from the entropy pool — the attacker seeds the pool through /dev/urandom writes, controlling what the dangling pointer subsequently reads back.",
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
    prompt: "A static analyzer flags a code path that calls `free(p)` twice without reassignment. What can calling free() twice on the same pointer do in glibc?",
    options: [
      "It corrupts the free lists by inserting one chunk twice, so two subsequent mallocs return the same address — giving the attacker overlapping allocations that let them control one object's memory through another.",
      "The second free detects the already-freed state through the chunk's in-use bit and silently converts the call to a no-op, preventing any corruption — glibc has handled double-free safely since version 2.12.",
      "It triggers an immediate SIGABRT that terminates the process before any corruption occurs, because glibc's free unconditionally validates the chunk's magic number and aborts on any inconsistency it detects.",
      "It moves the chunk from the process heap into a kernel-managed quarantine pool, doubling the quarantine's reference count — this leaks kernel memory but cannot be leveraged for code execution in practice.",
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
    prompt: "You feed 256 bytes to a program that reads into a local `char buf[64]`. In GDB you see that EIP now contains 0x41414141 ('AAAA'). What did the overflow overwrite to hijack execution?",
    options: [
      "The saved return address stored on the stack above the local buffer — when the function returned, it popped your attacker-controlled value into the instruction pointer, redirecting execution to 0x41414141.",
      "The heap chunk header that tracks buf's allocation size — the corrupted header caused malloc's bookkeeping to redirect the next function call through the overwritten size field interpreted as a code pointer.",
      "The Global Offset Table entry for the next library function called — your overflow reached the GOT in the .data segment and replaced the resolved address with your AAAA pattern before the indirect call.",
      "The MMU's page table entry for the code segment — overwriting the PTE remapped the instruction page so the processor fetched instructions from your controlled buffer instead of the original .text section.",
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
    prompt: "A CTF binary calls `printf(user_input)` where user_input comes directly from stdin. You send \"%08x.%08x.%08x.%s\" and see stack data in the output. Why is this dangerous?",
    options: [
      "Attacker-supplied format specifiers let %x leak stack memory and %s dereference arbitrary pointers — worse, %n writes the count of bytes printed to a stack-pointed address, enabling arbitrary memory writes.",
      "printf interprets the input as a regular expression and evaluates it against the program's symbol table — the matched symbols are printed, leaking function addresses, but no write primitive is possible through this path.",
      "printf allocates a new buffer for each format specifier and copies stack data into it — this exhausts heap memory and crashes the process, creating a denial-of-service condition but not a code-execution vector.",
      "The format specifiers cause printf to read from the network socket instead of the stack, mixing user network traffic with program output — this leaks other users' data through a confused-deputy attack on the I/O layer.",
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
    prompt: "You compile a C program with `-fsanitize=address` and it immediately reports a heap-buffer-overflow on a line that never crashed before. What is this tool and why did the bug go unnoticed previously?",
    options: [
      "AddressSanitizer (ASan) instruments every memory access at compile time with shadow-memory checks — it detects overflows, use-after-free, and double-free that might silently hit valid mapped memory in normal execution.",
      "The flag enables the kernel's memory protection unit to trap on every unaligned access — the overflow previously succeeded because the target address was aligned, but now any byte-level access is checked by hardware.",
      "It activates the compiler's static taint-tracking pass, which marks user-influenced variables and refuses to compile any code path where tainted data reaches a pointer dereference — the error is at compile time only.",
      "The flag links against a hardened libc that replaces malloc with an allocator using guard pages between every allocation — the overflow now hits a guard page, whereas the standard allocator placed chunks contiguously.",
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
    prompt: "You define `struct { char a; int b; char c; }` and sizeof returns 12 instead of the expected 6. A teammate suggests reordering to `struct { int b; char a; char c; }`. Why would this reduce sizeof?",
    options: [
      "The compiler inserts padding to align each member to its natural boundary — putting the int first eliminates the 3-byte gap before it, and the two chars pack together, reducing total padding to 2 trailing bytes.",
      "The compiler compresses adjacent small types using bit-packing when they appear after the largest member, merging the two chars into a single byte — this optimization is only triggered by largest-first ordering.",
      "Reordering triggers the compiler to place the struct in a special packed segment with no alignment requirements, eliminating all padding — structs in their original declaration order always use the standard aligned segment.",
      "The int member acts as a cache-line anchor when placed first, and the compiler eliminates padding for all subsequent members within the same cache line — reordering ensures the anchor sits at offset zero.",
    ],
    correctIndex: 0,
    explanation:
      "Each member is aligned to a multiple of its own size and the struct is padded to its largest member's alignment; ordering large->small packs them with less wasted padding. Leftover padding bytes can also leak uninitialized data when a struct is serialized.",
  },
  {
    slug: "c-core-l2-bitwise",
    competencyId: "c-core",
    depthTier: 2,
    sectionHeading: "Bitwise operations and bitmasks",
    prompt: "A permissions variable uses bit flags: READ=1, WRITE=2, EXEC=4. You need to remove the WRITE permission without affecting the others. Which operation is correct and why?",
    options: [
      "AND with the bitwise complement: `perms &= ~WRITE` — this clears only the WRITE bit by masking it to zero while preserving every other bit in the permissions field unchanged, regardless of their current state.",
      "OR with the flag value: `perms |= WRITE` — this selectively disables the WRITE bit because OR with a set bit toggles it off in permission-aware contexts, which the compiler enables for bitmask-typed variables.",
      "Right-shift by the flag position: `perms >>= WRITE` — shifting right by 2 moves the WRITE bit out of the register entirely, effectively removing that permission while preserving the relative positions of other bits.",
      "XOR with the complement: `perms ^= ~WRITE` — this inverts every bit except WRITE, which has the net effect of clearing WRITE while keeping the other permission bits in their original state through double negation.",
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
    prompt: "During exploitation of a stack overflow in a statically linked binary, you find far fewer usable ROP gadgets than expected. A mentor suggests targeting a dynamically linked version. Why does libc.so help?",
    options: [
      "libc.so is a large shared library containing functions like system(), execve(), and printf() — its code mass provides a rich supply of ROP gadgets and one-gadgets, and ret2libc chains can call system(\"/bin/sh\") directly.",
      "libc.so disables ASLR for the main binary when loaded, placing all code at fixed addresses — this makes gadget addresses predictable without any information leak, whereas static binaries retain full randomization.",
      "libc.so includes a built-in debugging stub that disables stack canaries for any function it calls — dynamically linked binaries therefore have no canary protection on library calls, exposing more exploitable return addresses.",
      "libc.so maps itself into a writable memory region by default, so the attacker can patch any function's code in place — static linking places all code in read-only pages that cannot be modified without mprotect.",
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
    prompt: "You benchmark a naive byte-by-byte strlen loop against glibc's strlen on a 1 MB string and find glibc is 15x faster. Disassembling glibc's version reveals SIMD instructions. What is happening?",
    options: [
      "glibc's strlen uses SSE2 or AVX2 to scan 16-32 bytes per cycle for the null terminator, aligned to cache-line boundaries — it still overreads past unterminated buffers, which is useful for leaks but dangerous defensively.",
      "glibc's strlen uses a precomputed hash table of all possible 4-byte sequences to skip directly to the null byte — the SIMD instructions accelerate the hash lookup rather than the string scan itself.",
      "glibc's strlen calls the kernel's copy_from_user routine, which runs in ring 0 with direct cache access — the SIMD instructions are part of the kernel's DMA engine rather than userspace string-scanning code.",
      "glibc's strlen first copies the entire string into an aligned temporary buffer using SIMD moves, then performs a simple byte scan on the copy — the speedup comes entirely from the cache-friendly copy step.",
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
    prompt: "While debugging a heap exploit, you notice chunks below 0x80 bytes are served instantly while larger freed chunks appear in a different data structure. What are glibc's \"bins\"?",
    options: [
      "Linked lists that group free chunks by size class — fastbins hold small chunks in LIFO singly-linked lists for speed, while unsorted, small, and large bins use doubly-linked lists for larger allocations with coalescing support.",
      "Memory-mapped files that back each size class — chunks under 0x80 bytes use an anonymous mmap region (the fast file), while larger ones are backed by a named tempfile for persistence across program restarts.",
      "Compiler-generated lookup tables embedded in the .rodata section that map requested sizes to pre-allocated pools — chunks under 0x80 hit the table directly, while larger ones require a binary search through the table.",
      "Hardware-managed memory pools controlled by the MMU's translation lookaside buffer — small chunks fit in TLB-cached pages and resolve instantly, while larger ones require a page-table walk that slows allocation.",
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
    prompt: "You call `printf(\"%d %d %d\", 42)` — passing one int where three are expected. The program prints 42 followed by two seemingly random numbers. How does printf determine argument types?",
    options: [
      "printf relies entirely on the format string to tell va_arg which type to read next — with only one argument supplied, the remaining %d specifiers read whatever happens to be in the next argument slots on the stack or in registers.",
      "printf queries a hidden type-descriptor array that the compiler generates alongside the arguments — when the array is shorter than the format string expects, it defaults to reading double-precision floats from the FPU stack.",
      "printf inspects a runtime type tag embedded in the upper bits of each argument — when no argument is present, the tag reads as zero, which printf interprets as unsigned long long and prints its lower 32 bits.",
      "printf asks the dynamic linker to resolve argument types from the calling function's DWARF debug information — without symbols compiled in, it falls back to treating missing arguments as the platform's register width.",
    ],
    correctIndex: 0,
    explanation:
      "va_arg blindly reads the next argument as the type the specifier names. If %d has no matching int, it reads adjacent stack data — exactly why format-string bugs leak memory.",
  },
  {
    slug: "c-core-l3-reimpl-calloc",
    competencyId: "c-core",
    depthTier: 3,
    sectionHeading: "Reimplementing Standard Functions Safely",
    prompt: "Your ft_calloc(count, size) implementation calls `malloc(count * size)`. A fuzzer triggers a case where count=0x100000001 and size=0x100, yet malloc receives a tiny buffer. What went wrong?",
    options: [
      "The multiplication `count * size` integer-overflowed to a small value, so malloc allocated far less memory than needed — ft_calloc must check `count > SIZE_MAX / size` before multiplying to detect the wraparound.",
      "malloc rounded the small request up to its minimum chunk size, which happened to equal count * size after overflow — the check should be `count < sizeof(void *)` to reject requests below the minimum chunk size.",
      "The compiler promoted both operands to signed 64-bit before multiplication, and the negative result caused malloc to interpret the size as zero — malloc returned a valid pointer to a zero-length allocation.",
      "SIZE_MAX is the maximum value of size_t on the platform, and the product exceeded it by wrapping into kernel address space — malloc succeeded but returned a pointer to a kernel page that will segfault on access.",
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
    prompt: "You run the tool `one_gadget` against the target's libc.so and it returns three addresses, each with register constraints like \"rsp & 0xf == 0\" and \"[rsp+0x70] == NULL\". What is a one-gadget?",
    options: [
      "A single address in libc that, when jumped to, executes execve(\"/bin/sh\", NULL, NULL) — but only when specific register and stack constraints are satisfied, so the exploit must arrange the right state before jumping.",
      "A single-byte write primitive that modifies exactly one byte of a GOT entry to redirect it — the constraints describe which byte position and alignment the target address must have for the overwrite to succeed.",
      "A hardware breakpoint gadget that pauses execution and drops into a debug shell — the register constraints ensure the debugger's stack frame is properly aligned to display a usable prompt in the terminal.",
      "A one-instruction ROP gadget that pops a single register and returns — the constraints describe which register it pops and what value must be present beforehand for the remainder of the exploit chain to continue.",
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
    prompt: "A virtual dispatch table stores function pointers for `read`, `write`, and `close` operations. A heap overflow lets you overwrite the `write` entry. What happens on the next call to obj->vtable->write()?",
    options: [
      "Execution jumps to whatever address you wrote into the function pointer slot — the indirect call transfers control to your chosen target, which could be a ROP gadget, a one-gadget in libc, or injected shellcode.",
      "The processor raises a SIGILL because function pointer entries include a hardware type tag that the branch predictor validates — your overwritten value fails the tag check and traps before the jump occurs.",
      "The overwritten entry is ignored because the compiler inlines all virtual calls at compile time, replacing indirect calls with direct jumps to the original function body — dispatch tables exist as metadata only.",
      "The call reads the original function's address from a read-only backup copy stored in the .rodata section by the compiler — the writable table is used only during initialization, not during runtime dispatch.",
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
    prompt: "During code review you see `int *const p = &x;` and `const int *q = &y;`. A developer reassigns `p = &z;` on line 10 and writes `*q = 5;` on line 12. Which line(s) fail to compile?",
    options: [
      "Both lines fail: `int *const p` makes the pointer itself immutable so p cannot be reassigned, while `const int *q` makes the pointed-to value immutable so *q cannot be written to — read the declaration right-to-left.",
      "Only line 12 fails: `int *const p` makes the pointed-to int constant but allows reassigning the pointer itself, while `const int *q` makes both the pointer and the target immutable, blocking all modifications.",
      "Only line 10 fails: `int *const p` prevents both pointer reassignment and writes through it, while `const int *q` only prevents reassigning q itself — writing through *q is permitted because the int is mutable.",
      "Neither line fails: const in C is advisory only and the compiler emits warnings but never errors for const violations — both assignments succeed at compile time, though runtime behaviour may differ by platform.",
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
    prompt: "A student questions why the 42 curriculum requires reimplementing strlen, printf, and malloc when battle-tested versions already exist in glibc. What is the security rationale for this exercise?",
    options: [
      "Reimplementing forces you to confront every edge case — NULL inputs, overlapping buffers, integer overflow in size calculations — whose mishandling in production code becomes exploitable CVEs, building secure-coding instincts.",
      "The reimplemented versions undergo formal verification by the school's automated checker, producing mathematically proven implementations safer than glibc — students ship these as hardened replacements in production code.",
      "Writing custom versions ensures the student's code never depends on shared libraries, eliminating the risk of supply-chain attacks through compromised libc packages — static self-sufficiency is the primary security benefit.",
      "The exercise trains students to write faster implementations that minimize syscall overhead, because glibc's defensive checks add latency that attackers exploit through timing side channels — speed equals security here.",
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
    prompt: "While implementing ft_printf, you test `ft_printf(\"%*d\", -10, 42)` and expect right-justified output in a 10-character field. Instead, the reference printf left-justifies. What does a negative * width mean?",
    options: [
      "A negative * width implies the '-' flag (left-justify), and the width is taken as the absolute value — so `printf(\"%*d\", -10, 42)` behaves identically to `printf(\"%-10d\", 42)`, per C17 section 7.21.6.1.",
      "A negative * width sets the field width to zero and enables zero-padding, printing the number with no extra spacing — negative values are treated as an explicit request to suppress all padding in the formatted output.",
      "A negative * width causes printf to right-justify and pad with the character whose ASCII value equals the absolute value of the width — here it pads with newline characters (ASCII 10), producing unusual output.",
      "A negative * width means the width is read from the next argument instead of the current one, shifting all subsequent argument positions by one — the -10 is discarded and 42 is consumed as the width value.",
    ],
    correctIndex: 0,
    explanation:
      "A negative * width implies the '-' (left-justify) flag with |width| (C17 7.21.6.1p5). Missing this edge case is a common 42 evaluation failure.",
  },
  {
    slug: "c-core-l4-allocator-align",
    competencyId: "c-core",
    depthTier: 4,
    sectionHeading: "Writing a Custom Memory Allocator",
    prompt: "Your custom malloc works until a user's program crashes with SIGBUS on a `movaps` instruction. The crash address ends in 0x8 rather than 0x0. What alignment rule did your allocator violate?",
    options: [
      "The x86-64 System V ABI requires malloc to return 16-byte-aligned addresses because SSE instructions like movaps fault on unaligned operands — your 8-byte-aligned return address violates this mandatory ABI guarantee.",
      "The movaps instruction requires 64-byte cache-line alignment for its operands — your allocator must round up every allocation to the nearest 64-byte boundary to satisfy the processor's cache coherency requirements.",
      "The SIGBUS indicates that the allocated memory crossed a 4 KB page boundary, which is forbidden for SSE operands — your allocator must ensure no single allocation straddles two virtual memory pages regardless of alignment.",
      "The x86-64 ABI requires the first 8 bytes of every allocation to be reserved for a type tag used by the runtime — your allocator returned the start of the chunk instead of offsetting past the mandatory tag prefix.",
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
    prompt: "Your get_next_line stores per-fd leftover buffers in a static array indexed by fd. A fuzzer crashes the program by calling it with fd=99999. What validation is missing?",
    options: [
      "The fd is used as an array index without bounds checking — a negative or out-of-range fd causes an out-of-bounds memory access, so you must validate that fd >= 0 and fd < the array's fixed size before indexing.",
      "The fd value exceeds the maximum value of a 16-bit integer, causing a truncation when stored in the array's short-typed index field — you should declare the index as size_t to handle fd values above 65535.",
      "The read() syscall is guaranteed to reject invalid fds with EBADF before your code runs, so the crash must originate from a different bug — fd validation in get_next_line is redundant and masks the real issue.",
      "The fd is too large for the kernel's per-process file descriptor table, which is limited to 1024 entries by default — your code should call getrlimit and raise the fd limit before accepting any fd above 1023.",
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
    prompt: "Your ft_printf passes basic tests but fails when a reviewer runs `ft_printf(\"%s\", NULL)`. Your version segfaults while the system printf prints \"(null)\". What is the correct validation strategy?",
    options: [
      "Compare your output and return value against the system printf on every documented edge case — NULL strings, INT_MIN, zero-width precision, and flag combinations — because matching the spec's corner-case behaviour is the point.",
      "Only verify that your implementation compiles without warnings under -Wall -Wextra -Werror, because if the compiler accepts it then the output must conform to the standard — runtime testing is redundant for well-typed code.",
      "Test exclusively against the POSIX specification text rather than the system printf, because glibc's handling of NULL for %s is a non-standard extension — your segfault is actually the standards-correct behaviour.",
      "Compare against a different student's ft_printf implementation from the same cohort, because two independent implementations that agree are more likely correct than matching glibc, which has many known quirks.",
    ],
    correctIndex: 0,
    explanation:
      "Diff against the real function on documented edge cases (glibc prints \"(null)\" for %s of NULL, and so on). Matching the spec's corner behavior is the whole point.",
  },
  {
    slug: "c-core-l4-perf",
    competencyId: "c-core",
    depthTier: 4,
    sectionHeading: "Performance Profiling",
    prompt: "Profiling your custom allocator reveals that 60% of CPU time is spent in a loop scanning a single free list for a fitting block. What data-structure change would address this bottleneck?",
    options: [
      "Switch to segregated (per-size-class) free lists so small allocations go directly to the right list in near-O(1) time, eliminating the linear scan that currently dominates your allocator's hot path.",
      "Replace the free list with a hash table keyed by the calling function's return address, so each call site gets its own pre-allocated pool — this turns every allocation into a constant-time hash lookup.",
      "Convert the free list into a binary search tree sorted by chunk address, so every allocation uses O(log n) binary search — this is the optimal strategy and is exactly what glibc's ptmalloc2 uses internally.",
      "Move the free list into a memory-mapped file so the kernel's page cache handles the search — the VM subsystem uses hardware TLB acceleration to find fitting blocks faster than any userspace algorithm.",
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
    prompt: "A penetration tester reports that your custom allocator is easier to exploit than glibc. Your allocator uses a simple first-fit single free list with inline metadata. What makes exploitation simpler?",
    options: [
      "The deterministic, predictable allocation order lets an attacker precisely groom the heap layout to place controlled data adjacent to target objects — glibc adds per-thread caches and randomization to make grooming harder.",
      "Your allocator uses guard pages between every chunk, which the attacker bypasses with a single mprotect call — glibc's absence of guard pages ironically makes exploitation harder because overflows hit unpredictable data.",
      "Your allocator encrypts chunk metadata with a fixed key derived from the process PID, and the attacker reads /proc/self/status to recover it — glibc uses a truly random key that resists such disclosure.",
      "Your allocator aligns all chunks to 4096-byte page boundaries, wasting so much memory that the kernel maps adjacent chunks to non-contiguous physical pages — overflows then hit kernel memory instead of other chunks.",
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
    prompt: "A developer writes `if (ptr + len < ptr) return -1;` to catch pointer wraparound. The check works at -O0 but silently vanishes at -O2. What happened?",
    options: [
      "Pointer overflow is undefined behaviour, so the optimizer assumes it never occurs and concludes the condition is always false — it deletes the branch entirely, silently removing the security check from the compiled binary.",
      "At -O2 the compiler hoists the comparison outside the function and evaluates it at link time against the program's address space layout — since the linker sees that the addresses fit, it removes the runtime check.",
      "The -O2 flag enables hardware bounds checking via the MPX extension, which makes the software check redundant — the compiler removes it because the hardware catches the wraparound faster at the CPU level.",
      "At -O2 the compiler replaces pointer arithmetic with index-based array access using unsigned integers that cannot wrap — the check becomes unreachable dead code because the unsigned index is always non-negative.",
    ],
    correctIndex: 0,
    explanation:
      "Because signed overflow and pointer overflow are UB, the optimizer assumes ptr+len >= ptr always and removes the branch — a real, documented class of vanished security checks. Use unsigned math or __builtin_add_overflow.",
  },
  {
    slug: "c-core-l5-aliasing",
    competencyId: "c-core",
    depthTier: 5,
    sectionHeading: "Strict Aliasing and Type-Punning Hazards",
    prompt: "You write `float f = *(float *)&bits;` to reinterpret a uint32_t as a float. It works at -O0, but at -O2 the read returns a stale value ignoring your latest write to bits. What is the bug and fix?",
    options: [
      "It violates strict aliasing (C17 6.5p7): accessing a uint32_t through a float* is undefined, and at -O2 the compiler may reorder or cache the read — the fix is memcpy(&f, &bits, sizeof f), which is well-defined.",
      "The float and uint32_t have different alignment requirements, so the cast produces a misaligned access that the CPU silently ignores at -O2 — the fix is __attribute__((aligned(8))) on bits to match float alignment.",
      "At -O2 the compiler places bits in an SSE register where integer and float views share the same storage — the stale value comes from a register-renaming hazard, and declaring bits as volatile is the standard fix.",
      "The cast is fine but -O2 enables link-time optimization that inlines the function, exposing the reinterpretation to the inliner's dead-store eliminator — the fix is __attribute__((noinline)) on the containing function.",
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
    prompt: "You poison a tcache free list's fd pointer in glibc 2.35 and attempt to allocate a chunk at your target address, but malloc aborts with \"corrupted pointer\". What mitigation stopped you?",
    options: [
      "Safe-linking (PROTECT_PTR) XOR-mangles each freed chunk's fd pointer with the chunk's address right-shifted by 12 — forging a valid fd requires knowing the heap base to reverse the mangling operation.",
      "glibc 2.35 encrypts the entire tcache with a per-thread AES key derived from the stack canary — forging the fd requires first recovering the canary through a separate information-leak vulnerability.",
      "The tcache uses an HMAC-SHA256 tag on each fd pointer, verified at allocation time against a per-arena secret stored in TLS — your forged pointer fails the authentication check and triggers the abort.",
      "glibc 2.35 moves all tcache metadata into a read-only page protected by mprotect after each free — your write landed on the user-data portion of the chunk while the fd lives in the protected metadata page.",
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
    prompt: "In a CTF heap challenge on glibc 2.27, you overflow into the wilderness chunk and overwrite its size field with 0xffffffffffffffff. After a carefully sized malloc, the top-chunk pointer wraps to your target. What technique is this?",
    options: [
      "House of Force — corrupting the top chunk's size to a huge value lets a subsequent malloc advance the top pointer past the address space boundary, wrapping it to an arbitrary target address for the next allocation.",
      "House of Spirit — this technique frees a fake chunk placed on the stack to get malloc to return a stack address, and it relies on the size field matching a fastbin range rather than modifying the wilderness.",
      "House of Lore — this corrupts the small-bin's bk pointer to return an arbitrary address on the next allocation, requiring forged fd/bk pointers in a fake chunk rather than any modification to the top chunk.",
      "House of Einherjar — this exploits a null-byte overflow in the prev_size field to trigger backward consolidation with a crafted fake chunk, targeting an adjacent chunk's metadata rather than the wilderness.",
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
    prompt: "After enabling CFI (-fsanitize=cfi), ROP-based exploits stop working, but a penetration tester still escalates privileges by corrupting an is_admin flag without diverting control flow. Why did CFI not prevent this?",
    options: [
      "CFI validates that indirect call and jump targets match expected function-type signatures, blocking ROP and JOP chains — but data-only attacks that corrupt variables without hijacking control flow are outside its protection model.",
      "CFI only protects forward-edge calls (function pointers) and does not guard backward-edge returns (return addresses) — the attacker used a classic return-address overwrite that CFI's forward-edge checks cannot detect.",
      "CFI relies on ASLR to randomize the address space, and the attacker disabled ASLR through a /proc/sys write before exploiting — without address randomization, CFI's signature checks become predictable and bypassable.",
      "CFI inserts canary values before every local variable on the stack, but the is_admin flag was on the heap where CFI places no canaries — moving the flag to a stack variable would have triggered CFI detection.",
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
    prompt: "Your fuzzer hits a code path that reads an uninitialized stack variable and uses it as an array index. ASan does not flag this. Which sanitizer catches uninitialized reads?",
    options: [
      "MemorySanitizer (MSan, -fsanitize=memory) tracks the initialized state of every byte using shadow memory and reports when an uninitialized value influences a branch or memory access — it catches CWE-908 bugs.",
      "ThreadSanitizer (TSan, -fsanitize=thread) detects when a variable is accessed before its initializer runs on the owning thread — uninitialized reads are a special case of data races that TSan classifies as use-before-init.",
      "UndefinedBehaviorSanitizer (UBSan, -fsanitize=undefined) instruments all local variable declarations with a zero-initialization pass and flags any variable whose value differs from zero at the point of first read.",
      "AddressSanitizer (ASan, -fsanitize=address) places red zones around stack variables and detects reads from uninitialised slots by checking whether the access falls within a red zone that has not yet been written to.",
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
    prompt: "A program uses stack canaries, full ASLR, NX, and CFI. An attacker exploits a heap overflow to flip a single byte in a uid field from 1000 to 0, gaining root. Why did every deployed mitigation miss this?",
    options: [
      "All four mitigations protect control flow — canaries guard return addresses, ASLR randomizes code locations, NX prevents code injection, CFI validates call targets — but none monitor non-control data like a uid variable.",
      "The heap overflow corrupted the canary's reference value stored in TLS before the comparison ran, so the canary check passed despite the overflow — a hardware-backed canary stored in an MSR would have caught it.",
      "ASLR only randomizes the base address of shared libraries, not heap allocations, so the uid field sat at a fixed offset — enabling full heap ASLR (requiring kernel 6.0+) would have randomized the uid's location.",
      "CFI detected the overflow but classified it as benign because the corrupted byte was within the same struct as a valid function pointer — CFI only reports corruption that crosses struct boundaries to reduce false positives.",
    ],
    correctIndex: 0,
    explanation:
      "Corrupting data without diverting control flow evades control-flow defenses. Research responses include memory tagging (ARM MTE) and CHERI capabilities that enforce pointer bounds in hardware.",
  },
];
