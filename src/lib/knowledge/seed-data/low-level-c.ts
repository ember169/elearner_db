import type { SeedArticle } from "./types";

export const LOW_LEVEL_C_ARTICLES: SeedArticle[] = [
  // ============================================================
  // c-core — L0
  // ============================================================
  {
    competencyId: "c-core",
    depthTier: 0,
    title: "Why C Still Matters for Security",
    recommendedLevel: 0,
    sections: [
      {
        heading: "What C Is and Where It Lives",
        content: `C is a compiled, statically-typed language created in 1972 by Dennis Ritchie at Bell Labs. It sits one thin layer above assembly: close enough to hardware that you can manipulate individual bytes and addresses, yet portable enough to run on virtually every architecture. The Linux kernel, glibc, OpenSSL, curl, sudo — the software that underpins modern infrastructure — is overwhelmingly written in C.

For a cybersecurity student, C is not optional. Most CVEs in operating-system and network-stack code trace back to memory-management mistakes that only make sense once you understand C's memory model.`,
        sortOrder: 0,
      },
      {
        heading: "Key Vocabulary",
        content: `Before writing any C, pin down these terms:

- **Pointer** — a variable that stores a memory address. Dereferencing it reads or writes the value at that address.
- **Stack** — automatic storage for local variables and return addresses; grows and shrinks with function calls.
- **Heap** — dynamic storage managed manually with \`malloc\` / \`free\`.
- **Undefined behaviour (UB)** — the C standard says the result is unpredictable; compilers may optimise code *assuming* UB never happens.
- **Standard library (libc)** — a set of functions (\`printf\`, \`strlen\`, \`memcpy\`, ...) specified by ISO C and implemented by your system's C library (glibc on Linux, musl in Alpine).

Understanding these concepts is the first step to reasoning about buffer overflows, use-after-free bugs, and format-string attacks.`,
        sortOrder: 1,
      },
      {
        heading: "The Compilation Pipeline",
        content: `A C source file goes through four stages before it becomes an executable:

1. **Preprocessing** — \`cpp\` expands macros, includes headers, strips comments.
2. **Compilation** — \`cc1\` translates C to assembly.
3. **Assembly** — \`as\` converts assembly to an object file (\`.o\`).
4. **Linking** — \`ld\` merges object files and libraries into a final binary.

You can inspect each stage with GCC flags:

\`\`\`bash
gcc -E main.c -o main.i   # preprocessor output
gcc -S main.c -o main.s   # assembly
gcc -c main.c -o main.o   # object file
gcc main.o -o main         # linked executable
\`\`\`

Security tools like \`checksec\` and \`readelf\` operate on the final ELF binary, so knowing how it is built helps you interpret their output (ISO/IEC 9899:2018, Section 5.1.1.2).`,
        sortOrder: 2,
      },
      {
        heading: "Sources",
        content: `- ISO/IEC 9899:2018 (C17 standard) — https://www.iso.org/standard/74528.html
- Ritchie, D. "The Development of the C Language" — https://www.bell-labs.com/usr/dmr/www/chist.html
- GCC Manual, "Overall Options" — https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html`,
        sortOrder: 3,
      },
    ],
  },

  // ============================================================
  // c-core — L1
  // ============================================================
  {
    competencyId: "c-core",
    depthTier: 1,
    title: "Pointers and Memory Layout Essentials",
    recommendedLevel: 1,
    sections: [
      {
        heading: "Pointer Declaration and Dereferencing",
        content: `A pointer holds the address of another object. Declaring one, dereferencing it, and taking the address of a variable are the three operations you will use most:

\`\`\`c
int   x   = 42;
int  *p   = &x;   // p stores the address of x
int   val = *p;    // val == 42 — dereference
\`\`\`

The type of the pointer matters: \`int *\` means "pointer to int." The compiler uses the pointed-to type to decide how many bytes to read on a dereference and how far to advance on pointer arithmetic. A \`char *\` advances one byte; an \`int *\` advances \`sizeof(int)\` bytes (typically 4).

Mismatching types is a classic source of bugs. Casting a \`char *\` to an \`int *\` and dereferencing on an architecture that requires aligned access triggers undefined behaviour (C17, Section 6.3.2.3, paragraph 7).`,
        sortOrder: 0,
      },
      {
        heading: "Stack vs Heap",
        content: `Local variables live on the **stack**, which is managed automatically: space is allocated when a function is entered and freed when it returns. The stack grows downward on x86-64; each function call pushes a new **stack frame** containing the return address, saved registers, and locals.

The **heap** is for allocations whose lifetime is not tied to a single function:

\`\`\`c
char *buf = malloc(256);   // 256 bytes on the heap
if (!buf) { perror("malloc"); exit(1); }
// ... use buf ...
free(buf);                 // must free manually
\`\`\`

Forgetting to \`free\` causes a **memory leak**. Using memory after \`free\` (\`use-after-free\`) is exploitable — an attacker can reclaim the freed chunk with controlled data and hijack subsequent dereferences.`,
        sortOrder: 1,
      },
      {
        heading: "Arrays and Pointer Arithmetic",
        content: `In C, an array name decays to a pointer to its first element in most expressions:

\`\`\`c
int arr[5] = {10, 20, 30, 40, 50};
int *p = arr;        // equivalent to &arr[0]
printf("%d\\n", *(p + 2));  // prints 30
\`\`\`

\`p + 2\` does not add 2 bytes — it adds \`2 * sizeof(int)\` bytes. This is why pointer arithmetic is type-aware.

A critical security note: C does **not** bounds-check array accesses. Writing past the end of \`arr\` overwrites adjacent stack data, which is the basis of classic stack buffer overflows (CWE-121).`,
        sortOrder: 2,
      },
      {
        heading: "Strings as char Arrays",
        content: `C has no native string type. A "string" is a \`char\` array terminated by a null byte (\`'\\0'\`). The standard library functions \`strlen\`, \`strcpy\`, and \`strcat\` all rely on this sentinel:

\`\`\`c
char greeting[] = "Hello";  // {'H','e','l','l','o','\\0'}
size_t len = strlen(greeting);  // 5 — does NOT count '\\0'
\`\`\`

If the null terminator is missing or overwritten, these functions read past the buffer — an information-leak vector. Prefer length-bounded variants: \`strncpy\`, \`snprintf\`, or POSIX \`strlcpy\` where available.`,
        sortOrder: 3,
      },
      {
        heading: "Memory errors: what goes wrong and why",
        content: `C gives you direct access to memory — and with that power comes an entire family of bugs that do not exist in higher-level languages. Before diving into specific vulnerability classes (covered in the next resource), it helps to understand *why* these bugs arise from the concepts you just learned.

**The root cause: no automatic safety net.** C does not check array bounds, does not track whether a pointer is still valid, and does not zero out freed memory. Every pointer operation is a promise from the programmer that the address is valid and the type is correct. When that promise is broken, the result is **undefined behaviour** — the program may crash, silently corrupt data, or behave in ways an attacker can predict and exploit.

**Four families of memory errors:**

| Family | What happens | Why it is possible |
|--------|-------------|-------------------|
| **Buffer overflow** | Writing past the end of an array overwrites adjacent memory (return addresses, function pointers, other variables) | C arrays have no bounds checking (as you saw with pointer arithmetic) |
| **Use-after-free** | Accessing memory through a pointer after calling \`free()\` on it | \`free()\` does not invalidate the pointer — it just marks the memory as reusable |
| **Double free** | Calling \`free()\` on the same pointer twice corrupts the allocator's internal bookkeeping | The allocator trusts the programmer to free each block exactly once |
| **Format-string attack** | Passing user-controlled data as the first argument to \`printf()\` lets an attacker read and write arbitrary memory | \`printf\` trusts its format string to describe how many and what type of arguments follow |

**Why attackers care:** each of these errors gives a primitive — the ability to read memory you should not see, or to write data where you should not write. Chaining primitives together is how exploits are built. The next resource examines each family in detail with code examples and mitigations.

**A defensive habit to build now:** always initialize pointers (to \`NULL\` if no valid target yet), always check \`malloc\` return values, always set pointers to \`NULL\` after \`free\`, and never pass user input directly as a format string.`,
        sortOrder: 4,
      },
      {
        heading: "Sources",
        content: `- ISO/IEC 9899:2018 (C17), Sections 6.3.2.3 (Pointers), 6.5.6 (Additive operators), 7.24 (String handling)
- CWE-121: Stack-based Buffer Overflow — https://cwe.mitre.org/data/definitions/121.html
- \`man 3 malloc\`, \`man 3 strlen\`
- Bryant & O'Hallaron, *Computer Systems: A Programmer's Perspective*, Chapter 3 (Machine-Level Representation)`,
        sortOrder: 5,
      },
    ],
  },

  // ============================================================
  // c-core — L2
  // ============================================================
  {
    competencyId: "c-core",
    depthTier: 2,
    title: "Dynamic Memory and Common Vulnerability Patterns",
    recommendedLevel: 2,
    sections: [
      {
        heading: "How malloc and free Work",
        content: `\`malloc(size)\` asks the C library allocator for at least \`size\` contiguous bytes on the heap and returns a pointer to that block, or \`NULL\` on failure. Internally, glibc's allocator (ptmalloc2) maintains bins — linked lists of freed chunks grouped by size. When you call \`free(ptr)\`, the chunk is returned to the appropriate bin for reuse.

Each allocated chunk carries metadata — at minimum, the chunk size — stored just before the returned pointer. Overwriting this metadata is the basis of heap-exploitation techniques such as the "unlink" attack.

\`\`\`c
#include <stdlib.h>
#include <string.h>

char *dup_string(const char *src) {
    size_t len = strlen(src) + 1;   // +1 for null terminator
    char *dst  = malloc(len);
    if (!dst) return NULL;
    memcpy(dst, src, len);
    return dst;
}
\`\`\`

Always check the return value of \`malloc\`. In security-sensitive code, also consider whether the size argument can overflow: \`malloc(n * sizeof(int))\` wraps to a small value when \`n\` is large enough, leading to a heap buffer overflow on subsequent writes (CWE-190).`,
        sortOrder: 0,
      },
      {
        heading: "Use-After-Free",
        content: `A use-after-free (UAF) occurs when code dereferences a pointer after the underlying memory has been freed:

\`\`\`c
char *buf = malloc(64);
// ... populate buf ...
free(buf);
// buf is now a "dangling pointer"
printf("%s\\n", buf);   // undefined behaviour — UAF
\`\`\`

Why is this exploitable? After \`free\`, the allocator may hand the same memory to a different \`malloc\` call. An attacker who controls the new allocation can place crafted data where \`buf\` once pointed, then trigger the dangling dereference to redirect control flow.

Mitigation habit: set the pointer to \`NULL\` immediately after freeing:

\`\`\`c
free(buf);
buf = NULL;
\`\`\`

This turns a UAF into a null-pointer dereference, which typically crashes cleanly rather than being exploitable (CWE-416).`,
        sortOrder: 1,
      },
      {
        heading: "Double Free",
        content: `Calling \`free\` on the same pointer twice corrupts the allocator's internal data structures:

\`\`\`c
char *p = malloc(32);
free(p);
free(p);   // double free — undefined behaviour
\`\`\`

In glibc, a double-free can insert the same chunk into a free list twice. A subsequent pair of \`malloc\` calls returns the same address twice, allowing one allocation to overwrite the other's contents — a powerful primitive for heap exploitation.

Modern allocators include mitigations (glibc's \`tcache\` double-free check since 2.29), but they are bypassable. Write code that avoids the bug in the first place:

\`\`\`c
free(p);
p = NULL;   // second free(NULL) is a safe no-op per C17 7.22.3.3
\`\`\``,
        sortOrder: 2,
      },
      {
        heading: "Buffer Overflows on the Stack",
        content: `The classic stack-based buffer overflow writes past the end of a local array, overwriting the saved return address:

\`\`\`c
#include <string.h>

void vulnerable(const char *input) {
    char buf[64];
    strcpy(buf, input);   // no length check
}
\`\`\`

If \`input\` is longer than 63 bytes (plus null terminator), \`strcpy\` writes past \`buf\`, overwriting the saved frame pointer and return address. On a system without modern mitigations, an attacker supplies shellcode in \`input\` and sets the return address to point at it.

Modern defences include:
- **Stack canaries** — a random value placed between the buffer and the return address; checked before the function returns.
- **ASLR** — randomises the base addresses of stack, heap, and libraries.
- **NX / DEP** — marks the stack non-executable.

Compile and inspect:

\`\`\`bash
gcc -fstack-protector-all -o vuln vuln.c
checksec --file=vuln
\`\`\`

\`checksec\` will show whether canaries, NX, PIE, and RELRO are enabled (CWE-121).`,
        sortOrder: 3,
      },
      {
        heading: "Format-String Vulnerabilities",
        content: `Passing user input directly as the format string to \`printf\` is a critical vulnerability:

\`\`\`c
// VULNERABLE:
printf(user_input);

// SAFE:
printf("%s", user_input);
\`\`\`

An attacker who controls the format string can:
1. **Read stack memory** — \`%x %x %x\` leaks successive stack values.
2. **Read arbitrary memory** — \`%s\` with a crafted address on the stack dereferences it.
3. **Write arbitrary memory** — \`%n\` writes the number of bytes printed so far to the address pointed to by the corresponding argument.

The \`%n\` write primitive is powerful enough to overwrite GOT entries and redirect execution. This class of bug is tracked as CWE-134.

Prevention: never pass unsanitised input as the first argument to any \`printf\`-family function. Enable \`-Wformat -Wformat-security\` in your compiler flags.`,
        sortOrder: 4,
      },
      {
        heading: "Tooling for Detection",
        content: `Use these tools during development to catch memory bugs early:

\`\`\`bash
# AddressSanitizer (ASan) — detects overflows, UAF, double-free
gcc -fsanitize=address -g -o prog prog.c
./prog

# Valgrind — runtime memory checker (slower but no recompilation needed)
valgrind --leak-check=full ./prog

# Static analysis
gcc -Wall -Wextra -Werror -fanalyzer prog.c
\`\`\`

ASan and Valgrind can also detect stack buffer overflows, heap overflows, and memory leaks. For 42 projects, running your code under ASan should be standard practice — it catches bugs that segfaults alone may hide.`,
        sortOrder: 5,
      },
      {
        heading: "Struct padding and alignment",
        content: `The compiler inserts invisible padding bytes between struct members to satisfy hardware alignment requirements. This affects \`sizeof\`, binary protocols, and exploit payloads.\n\n\`\`\`c\n// Poorly ordered — 24 bytes on 64-bit\nstruct Bad {\n    char  a;    // 1 byte  + 7 padding (align next to 8)\n    double b;   // 8 bytes\n    char  c;    // 1 byte  + 3 padding (align next to 4)\n    int   d;    // 4 bytes\n};              // total: 24 bytes\n\n// Well ordered — 16 bytes\nstruct Good {\n    double b;   // 8 bytes\n    int    d;   // 4 bytes\n    char   a;   // 1 byte\n    char   c;   // 1 byte + 2 trailing padding (struct size must be multiple of max alignment)\n};              // total: 16 bytes\n\`\`\`\n\n**Rules**:\n1. Each member is aligned to a multiple of its own size (\`int\` to 4, \`double\` to 8, etc.)\n2. Struct total size is padded to a multiple of the largest member's alignment\n3. Order members from largest to smallest to minimize padding\n\n\`\`\`c\n// Verify with offsetof and sizeof\n#include <stddef.h>\nprintf("sizeof(Bad)  = %zu\\n", sizeof(struct Bad));  // 24\nprintf("sizeof(Good) = %zu\\n", sizeof(struct Good)); // 16\nprintf("offsetof(Bad, b) = %zu\\n", offsetof(struct Bad, b)); // 8 (not 1!)\n\`\`\`\n\n**Security relevance**: when serializing structs for network protocols or file formats, padding bytes leak uninitialized stack/heap data — always use \`memset\` or initialize all bytes. In exploit development, knowing the exact layout is essential for crafting payloads.\n\nGCC: \`__attribute__((packed))\` removes padding (but causes unaligned access on some architectures).\n\nSource: System V AMD64 ABI §3.1; \`man 3 offsetof\`; ISO C17 §6.7.2.1`,
        sortOrder: 6,
      },
      {
        heading: "Bitwise operations and bitmasks",
        content: `Bitwise operators manipulate individual bits — essential for permissions, flags, hardware registers, and binary protocols.\n\n\`\`\`c\n// Bitwise operators\na & b   // AND — both bits 1 → 1\na | b   // OR  — either bit 1 → 1\na ^ b   // XOR — bits differ → 1\n~a      // NOT — flip all bits\na << n  // Left shift — multiply by 2^n\na >> n  // Right shift — divide by 2^n (arithmetic for signed)\n\`\`\`\n\n\`\`\`c\n// Permission bitmask system (like Unix file permissions)\n#define PERM_READ    (1 << 0)  // 0b001 = 1\n#define PERM_WRITE   (1 << 1)  // 0b010 = 2\n#define PERM_EXEC    (1 << 2)  // 0b100 = 4\n\nunsigned int perms = 0;\n\n// Grant permissions\nperms |= PERM_READ;              // set read bit\nperms |= PERM_WRITE | PERM_EXEC; // set multiple\n\n// Check permissions\nif (perms & PERM_READ)  // non-zero if read is set\n    printf("can read\\n");\n\n// Revoke permission\nperms &= ~PERM_WRITE;  // clear write bit\n\n// Toggle permission\nperms ^= PERM_EXEC;    // flip exec bit\n\`\`\`\n\nCommon idioms: \`n & (n-1)\` clears the lowest set bit (power-of-2 check: \`n && !(n & (n-1))\`). \`n & (-n)\` isolates the lowest set bit. \`__builtin_popcount(n)\` counts set bits (GCC/Clang).\n\nSource: Hacker's Delight (Warren, 2nd ed.), Chapter 2; K&R, §2.9`,
        sortOrder: 7,
      },
      {
        heading: "Sources",
        content: `- ISO/IEC 9899:2018 (C17), Section 7.22.3 (Memory management functions)
- CWE-416: Use After Free — https://cwe.mitre.org/data/definitions/416.html
- CWE-121: Stack-based Buffer Overflow — https://cwe.mitre.org/data/definitions/121.html
- CWE-134: Use of Externally-Controlled Format String — https://cwe.mitre.org/data/definitions/134.html
- CWE-190: Integer Overflow — https://cwe.mitre.org/data/definitions/190.html
- glibc malloc internals — https://sourceware.org/glibc/wiki/MallocInternals
- \`man 1 valgrind\`, GCC AddressSanitizer docs — https://gcc.gnu.org/onlinedocs/gcc/Instrumentation-Options.html`,
        sortOrder: 8,
      },
    ],
  },

  // ============================================================
  // c-core — L3
  // ============================================================
  {
    competencyId: "c-core",
    depthTier: 3,
    title: "The C Standard Library: Internals and Security Implications",
    recommendedLevel: 3,
    sections: [
      {
        heading: "Overview of libc",
        content: `The C standard library — commonly called "libc" — provides the runtime functions mandated by the ISO C standard plus POSIX extensions on Unix systems. On a typical Linux box, \`glibc\` (the GNU C Library) is the implementation you will encounter. Alpine Linux and many embedded systems use \`musl\`, which is smaller and easier to audit.

For security work, understanding libc matters for two reasons:

1. **Attack surface** — many exploits target libc functions (\`printf\`, \`malloc\`, \`system\`) or rely on gadgets found in \`libc.so\`.
2. **Reimplementation at 42** — projects like \`libft\` and \`ft_printf\` require you to reproduce standard behaviour from scratch, which forces you to confront edge cases the standard specifies.

\`\`\`bash
# Find your system's libc
ldd /bin/ls | grep libc
# Typical output: libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6

# Inspect exported symbols
nm -D /lib/x86_64-linux-gnu/libc.so.6 | grep ' T ' | head -20
\`\`\``,
        sortOrder: 0,
      },
      {
        heading: "String Functions Under the Hood",
        content: `Consider \`strlen\`: the naive implementation walks byte-by-byte until it finds \`'\\0'\`:

\`\`\`c
size_t ft_strlen(const char *s) {
    size_t len = 0;
    while (s[len])
        len++;
    return len;
}
\`\`\`

glibc's real implementation is far more complex. On x86-64, it uses SSE2/AVX2 instructions to check 16 or 32 bytes at a time, aligning reads to cache-line boundaries. The implementation lives in \`sysdeps/x86_64/multiarch/strlen-avx2.S\`.

Security consideration: if the string is not properly null-terminated, \`strlen\` reads past the buffer until it either finds a zero byte or triggers a segfault. In exploit development, this is useful for leaking adjacent memory. In defensive coding, it means you should always track buffer lengths explicitly rather than trusting \`strlen\`.

\`memcpy\` has similar architecture-specific optimisations and a critical contract: the source and destination must not overlap. Use \`memmove\` when they might. Violating this causes undefined behaviour (C17, Section 7.24.2.1).`,
        sortOrder: 1,
      },
      {
        heading: "Memory Allocation Internals",
        content: `glibc's \`malloc\` uses ptmalloc2, a thread-aware allocator based on Doug Lea's dlmalloc. Key concepts:

- **Chunks** — the internal unit of allocation. Each chunk has a header containing its size and flags (\`PREV_INUSE\`, \`IS_MMAPPED\`, \`NON_MAIN_ARENA\`).
- **Bins** — linked lists grouping free chunks by size: fast bins (LIFO, 32-176 bytes on 64-bit, per DEFAULT_MXFAST), unsorted bin (catch-all), small bins, large bins.
- **Top chunk (wilderness)** — the chunk at the top of the heap; extends via \`brk\` or \`sbrk\` when bins cannot satisfy a request.
- **mmap threshold** — allocations above 128 KB (default) use \`mmap\` instead of \`brk\`, so \`free\` returns the pages to the OS with \`munmap\`.

\`\`\`c
#include <malloc.h>

int main(void) {
    void *a = malloc(32);
    void *b = malloc(32);
    free(a);
    malloc_stats();   // prints arena, heap, and mmap statistics
    free(b);
    return 0;
}
\`\`\`

Understanding this layout is essential for heap exploitation. Techniques like tcache poisoning, fastbin dup, and house-of-* all manipulate these internal structures.`,
        sortOrder: 2,
      },
      {
        heading: "printf and Variadic Functions",
        content: `\`printf\` is a variadic function: it accepts a variable number of arguments. The format string tells the runtime how to interpret each successive argument from the stack (or registers on x86-64, where the first six integer/pointer arguments go in \`rdi\`, \`rsi\`, \`rdx\`, \`rcx\`, \`r8\`, \`r9\`).

When you reimplement \`ft_printf\`, you use \`<stdarg.h>\`:

\`\`\`c
#include <stdarg.h>
#include <unistd.h>

int ft_printf(const char *fmt, ...) {
    va_list ap;
    va_start(ap, fmt);
    int count = 0;
    while (*fmt) {
        if (*fmt == '%') {
            fmt++;
            if (*fmt == 'd') {
                int val = va_arg(ap, int);
                // convert and write val...
                count += /* digits written */;
            }
            // handle %s, %x, %p, etc.
        } else {
            write(1, fmt, 1);
            count++;
        }
        fmt++;
    }
    va_end(ap);
    return count;
}
\`\`\`

The security-relevant detail: \`va_arg\` blindly reads the next argument according to the specified type. If the format string says \`%x\` but no corresponding \`int\` was passed, it reads whatever is next on the stack — which is why format-string attacks work.`,
        sortOrder: 3,
      },
      {
        heading: "Reimplementing Standard Functions Safely",
        content: `At 42, reimplementing libc functions (\`libft\`) teaches you to handle edge cases the standard mandates:

1. **NULL inputs** — the standard says passing \`NULL\` to \`strlen\` is undefined. In your \`ft_strlen\`, decide whether to return 0 or crash.
2. **Overlapping regions** — \`ft_memcpy\` must not support overlapping buffers; write a separate \`ft_memmove\` that does.
3. **Integer overflow** — when \`ft_calloc(count, size)\` computes \`count * size\`, check for overflow before calling \`malloc\`:

\`\`\`c
void *ft_calloc(size_t count, size_t size) {
    if (size && count > SIZE_MAX / size)
        return NULL;   // overflow
    size_t total = count * size;
    void *ptr = malloc(total);
    if (ptr)
        ft_bzero(ptr, total);
    return ptr;
}
\`\`\`

4. **Return values** — functions like \`ft_atoi\` must match the behaviour of the real \`atoi\` on edge cases (leading whitespace, signs, overflow). Read the man page and the C standard, then write tests against the system function.

This discipline — reading the spec, handling edge cases, writing tests — transfers directly to secure coding practice.`,
        sortOrder: 4,
      },
      {
        heading: "libc as an Exploit Toolkit",
        content: `In binary exploitation, libc is both target and toolbox:

- **ret2libc** — redirect execution to \`system("/bin/sh")\` without injecting shellcode, bypassing NX.
- **ROP gadgets in libc** — \`libc.so\` is large and contains thousands of useful instruction sequences. Tools like \`ROPgadget\` and \`ropper\` scan it for gadgets.
- **One-gadget** — specific addresses in glibc that, when jumped to with the right register state, call \`execve("/bin/sh", NULL, NULL)\`. The \`one_gadget\` tool finds them.

\`\`\`bash
# Find one-gadgets in your libc
one_gadget /lib/x86_64-linux-gnu/libc.so.6

# Find ROP gadgets
ROPgadget --binary /lib/x86_64-linux-gnu/libc.so.6 --only "pop|ret"
\`\`\`

Knowing which version of glibc a target runs is crucial — gadget offsets change between versions. Use the libc-database project to identify the version from leaked function addresses.`,
        sortOrder: 5,
      },
      {
        heading: "Function pointers and dispatch tables",
        content: `A function pointer stores the address of a function. Combined with arrays, they create dispatch tables — the C precursor to virtual method tables.\n\n\`\`\`c\n// Function pointer declaration\nint (*operation)(int, int); // pointer to a function taking two ints, returning int\n\n// Typedef makes it readable\ntypedef int (*binop_t)(int, int);\n\nint add(int a, int b) { return a + b; }\nint sub(int a, int b) { return a - b; }\nint mul(int a, int b) { return a * b; }\n\n// Dispatch table — array of function pointers\nbinop_t ops[] = { add, sub, mul };\nconst char *names[] = { "add", "sub", "mul" };\n\n// Call via index\nint result = ops[choice](x, y);\nprintf("%s(%d, %d) = %d\\n", names[choice], x, y, result);\n\`\`\`\n\n\`\`\`mermaid\nflowchart LR\n    Input[User choice: 0,1,2] --> Table[ops array]\n    Table -->|0| Add[add]\n    Table -->|1| Sub[sub]\n    Table -->|2| Mul[mul]\n\`\`\`\n\n\`\`\`c\n// Callback pattern — pass behavior as argument\nvoid ft_foreach(int *arr, int len, void (*f)(int)) {\n    for (int i = 0; i < len; i++)\n        f(arr[i]);\n}\n\nvoid print_int(int n) { printf("%d\\n", n); }\nft_foreach(arr, 5, print_int);\n\`\`\`\n\n**Security note**: function pointer overwrite is a classic exploitation technique — overwriting a stored function pointer redirects execution. This is why modern systems use \`-fstack-protector\` and CFI (Control Flow Integrity).\n\nSource: K&R, §5.11-5.12; ISO C17 §6.7.6.3`,
        sortOrder: 6,
      },
      {
        heading: "Const correctness in C",
        content: `The \`const\` qualifier tells the compiler (and the reader) that a value should not be modified. Reading the declaration right-to-left clarifies its meaning:\n\n\`\`\`c\nconst int *p;         // pointer to a const int — can't modify *p\nint *const p;         // const pointer to int — can't modify p itself\nconst int *const p;   // const pointer to const int — can't modify either\n\nconst char *str = "hello";\n// str[0] = 'H';  // ERROR: data is const\nstr = "world";     // OK: pointer itself is not const\n\nchar *const fixed = buf;\n// fixed = other;  // ERROR: pointer is const\nfixed[0] = 'X';    // OK: data is not const\n\`\`\`\n\n**In function parameters**: \`const\` documents intent and enables compiler optimizations:\n\`\`\`c\nsize_t ft_strlen(const char *s);     // promises not to modify the string\nvoid ft_swap(int *a, int *b);         // no const — will modify\nint ft_max(const int *arr, size_t n); // read-only access to array\n\`\`\`\n\n**Integer promotion and implicit conversions**: C silently converts between types in expressions. Key rules:\n- \`char\`/\`short\` promote to \`int\` in expressions\n- Signed + unsigned → unsigned (can cause surprising results: \`-1 > 0U\` is true!)\n- Narrowing on assignment truncates silently\n\nSource: ISO C17 §6.7.3 (Type qualifiers), §6.3.1 (Arithmetic conversions)`,
        sortOrder: 7,
      },
      {
        heading: "Sources",
        content: `- ISO/IEC 9899:2018 (C17), Section 7.24 (String handling), 7.22 (General utilities)
- glibc source — https://sourceware.org/git/glibc.git
- glibc malloc internals — https://sourceware.org/glibc/wiki/MallocInternals
- musl libc — https://musl.libc.org/
- \`man 3 printf\`, \`man 3 malloc\`, \`man 3 memmove\`
- one_gadget — https://github.com/david942j/one_gadget
- ROPgadget — https://github.com/JonathanSalwan/ROPgadget
- libc-database — https://github.com/niklasb/libc-database`,
        sortOrder: 8,
      },
    ],
  },

  // ============================================================
  // c-core — L4
  // ============================================================
  {
    competencyId: "c-core",
    depthTier: 4,
    title: "Rebuilding libc: From ft_printf to Custom Allocators",
    recommendedLevel: 4,
    sections: [
      {
        heading: "Why Rebuild What Already Exists",
        content: `Reimplementing standard library functions is a core part of the 42 curriculum and an unusually effective way to understand the security properties of code you use daily. When you build \`ft_printf\`, \`ft_malloc\`, or a custom \`get_next_line\`, you confront every edge case that production libc handles — and you learn which mistakes lead to exploitable bugs.

This article walks through building three non-trivial components from scratch: a format-string printer, a memory allocator, and a buffered line reader. Each one maps to real attack surfaces.`,
        sortOrder: 0,
      },
      {
        heading: "Building ft_printf: Parsing and Conversion",
        content: `A production-grade \`printf\` reimplementation must handle format specifiers (\`%d\`, \`%s\`, \`%x\`, \`%p\`, \`%%\`), width and precision, and flags (\`-\`, \`0\`, \`+\`, \` \`, \`#\`). Structure the parser around a state machine:

\`\`\`c
typedef struct s_fmt {
    int   flags;       // bitfield: FLAG_MINUS, FLAG_ZERO, ...
    int   width;
    int   precision;
    char  specifier;   // 'd', 's', 'x', 'p', ...
} t_fmt;

static int parse_format(const char **fmt, va_list ap, t_fmt *spec) {
    (*fmt)++;  // skip '%'
    // parse flags
    while (**fmt && ft_strchr("-0+ #", **fmt))
        spec->flags |= flag_bit(*(*fmt)++);
    // parse width (may be '*')
    if (**fmt == '*')
        spec->width = va_arg(ap, int);
    else
        spec->width = ft_atoi_advance(fmt);
    // parse precision
    if (**fmt == '.') {
        (*fmt)++;
        if (**fmt == '*')
            spec->precision = va_arg(ap, int);
        else
            spec->precision = ft_atoi_advance(fmt);
    }
    spec->specifier = *(*fmt)++;
    return 0;
}
\`\`\`

Critical detail: when width is specified with \`*\`, a negative value means left-justify and the width becomes the absolute value (C17, 7.21.6.1, paragraph 5). Missing this edge case is a common 42 evaluation failure.

For the \`%p\` specifier, print the pointer as a hexadecimal address prefixed with \`0x\`. The exact format is implementation-defined, but matching glibc's output (\`0x7ffd3a2b1c00\`) is the standard expectation.`,
        sortOrder: 1,
      },
      {
        heading: "Writing a Custom Memory Allocator",
        content: `The 42 \`malloc\` project asks you to implement \`malloc\`, \`free\`, and \`realloc\` as a shared library that can replace libc's allocator via \`LD_PRELOAD\`. This is architecturally identical to how tools like jemalloc, tcmalloc, and mimalloc replace the system allocator.

A simple allocator design:

1. **Request pages from the OS** using \`mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0)\`.
2. **Divide pages into zones** — TINY (allocations up to 128 bytes), SMALL (up to 1024 bytes), LARGE (individually mmap'd).
3. **Track free blocks** with a free list embedded in the blocks themselves:

\`\`\`c
typedef struct s_block {
    size_t              size;
    int                 free;
    struct s_block     *next;
    struct s_block     *prev;
} t_block;

#define BLOCK_META_SIZE sizeof(t_block)
\`\`\`

4. **Coalesce adjacent free blocks** on \`free\` to reduce fragmentation.
5. **Align all allocations** to 16-byte boundaries (required by the x86-64 ABI for SSE instructions).

Thread safety requires either a global mutex (simple but slow) or per-arena locks (what ptmalloc2 does). For the 42 project, a single \`pthread_mutex_t\` protecting all allocator state is acceptable.

\`\`\`bash
# Compile as a shared library
gcc -shared -fPIC -o libft_malloc.so ft_malloc.c

# Test with any program
LD_PRELOAD=./libft_malloc.so ls -la
\`\`\``,
        sortOrder: 2,
      },
      {
        heading: "get_next_line: Buffered I/O and File Descriptor Management",
        content: `\`get_next_line\` reads one line at a time from a file descriptor, handling arbitrary buffer sizes. The key challenge is maintaining a static (or dynamically allocated) remainder buffer between calls:

\`\`\`c
#ifndef BUFFER_SIZE
# define BUFFER_SIZE 42
#endif

// Note: OPEN_MAX is not defined by glibc (it is optional per POSIX).
// A portable alternative uses a linked list keyed by fd.
// Here we use a fixed-size array for simplicity — works on macOS/BSDs.
char *get_next_line(int fd) {
    static char *remainder[OPEN_MAX]; // per-fd remainder
    char        *buf;
    ssize_t      bytes_read;

    if (fd < 0 || fd >= OPEN_MAX || BUFFER_SIZE <= 0)
        return NULL;
    buf = malloc(BUFFER_SIZE + 1); // heap-allocated — safe for large BUFFER_SIZE
    if (!buf)
        return NULL;
    while (!has_newline(remainder[fd])) {
        bytes_read = read(fd, buf, BUFFER_SIZE);
        if (bytes_read <= 0)
            break;
        buf[bytes_read] = '\\0';
        remainder[fd] = ft_strjoin_free(remainder[fd], buf);
    }
    free(buf);
    return extract_line(&remainder[fd]);
}
\`\`\`

Security-relevant lessons:
- Validate \`fd\` before use — an attacker-controlled fd value indexing into a fixed-size array is an out-of-bounds access.
- \`read\` can return fewer bytes than requested (\`EINTR\`, short reads on pipes/sockets). Always loop.
- A \`BUFFER_SIZE\` of 1 must work correctly (though slowly). A \`BUFFER_SIZE\` of 10000000 must not stack-overflow — the code above uses \`malloc\` to allocate the read buffer on the heap, avoiding this issue.`,
        sortOrder: 3,
      },
      {
        heading: "Testing Against the Real Implementation",
        content: `Validating your reimplementation means comparing output against the system function on edge cases:

\`\`\`c
#include <stdio.h>
#include <limits.h>
#include <assert.h>

void test_printf_edge_cases(void) {
    char buf1[256], buf2[256];
    int  r1, r2;

    // INT_MIN
    r1 = sprintf(buf1, "%d", INT_MIN);
    r2 = ft_sprintf(buf2, "%d", INT_MIN);
    assert(r1 == r2 && strcmp(buf1, buf2) == 0);

    // zero-width, zero-precision
    r1 = sprintf(buf1, "%.0d", 0);
    r2 = ft_sprintf(buf2, "%.0d", 0);
    assert(r1 == r2 && strcmp(buf1, buf2) == 0);

    // NULL string
    r1 = sprintf(buf1, "%s", (char *)NULL);
    r2 = ft_sprintf(buf2, "%s", (char *)NULL);
    // glibc prints "(null)"; your ft_printf should match
    assert(strcmp(buf1, buf2) == 0);
}
\`\`\`

For the allocator, stress-test with concurrent allocations, realloc on a freed block, and pathological allocation patterns:

\`\`\`bash
# Run the system's malloc test suite with your library
LD_PRELOAD=./libft_malloc.so python3 -c "
import ctypes; [ctypes.create_string_buffer(i) for i in range(1, 10000)]
"
\`\`\``,
        sortOrder: 4,
      },
      {
        heading: "Performance Profiling",
        content: `Once your implementation is correct, profile it against the system allocator:

\`\`\`bash
# Time a workload with system malloc vs yours
time LD_PRELOAD=./libft_malloc.so ./benchmark
time ./benchmark

# Profile with perf
perf stat -e cache-misses,cycles,instructions \\
    LD_PRELOAD=./libft_malloc.so ./benchmark
\`\`\`

Common performance issues in custom allocators:
- **Linear free-list search** — use segregated free lists (separate lists per size class) for O(1) small allocations.
- **Excessive mmap calls** — pre-allocate zones large enough to serve many allocations before requesting more pages.
- **False sharing** — when two threads' allocations share a cache line (64 bytes on x86-64), cache coherency traffic kills performance. Align zone boundaries to cache lines.

Understanding these tradeoffs prepares you for analysing allocator behaviour in exploit development, where allocation timing and layout predictability are critical.`,
        sortOrder: 5,
      },
      {
        heading: "Security Implications of Custom Allocators",
        content: `Writing your own allocator teaches you exactly what an exploit developer targets:

1. **Metadata corruption** — if your chunk header is adjacent to user data, an off-by-one write in the user region corrupts the next chunk's metadata. Production allocators mitigate this with inline canaries and by storing metadata out-of-band.

2. **Heap determinism** — a simpler allocator is more predictable than glibc's, which can make exploitation easier. Randomising allocation order (\`MALLOC_PERTURB_\` in glibc) mitigates this.

3. **Coalesce bugs** — incorrect merging of free blocks can create overlapping allocations, giving an attacker two pointers to the same memory.

4. **Thread-safety races** — if your lock granularity is wrong, a race between \`malloc\` and \`free\` on different threads can corrupt the free list.

These are the same bug classes found in CVEs against real allocators (e.g., CVE-2017-7047 in iOS's libmalloc, CVE-2020-6418 — a type confusion in V8's TurboFan JIT compiler).`,
        sortOrder: 6,
      },
      {
        heading: "Sources",
        content: `- ISO/IEC 9899:2018 (C17), Section 7.21.6.1 (fprintf), 7.22.3 (Memory management)
- glibc malloc source — https://sourceware.org/git/?p=glibc.git;a=blob;f=malloc/malloc.c
- \`man 2 mmap\`, \`man 2 brk\`
- jemalloc design — https://jemalloc.net/
- "Vudo: An Object Superstitiously Possessed" — Phrack 57 (heap exploitation)
- "Understanding glibc malloc" — https://sploitfun.wordpress.com/2015/02/10/understanding-glibc-malloc/`,
        sortOrder: 7,
      },
    ],
  },

  // ============================================================
  // c-core — L5
  // ============================================================
  {
    competencyId: "c-core",
    depthTier: 5,
    title: "Undefined Behaviour, Compiler Exploitation, and Modern Heap Techniques",
    recommendedLevel: 5,
    sections: [
      {
        heading: "Undefined Behaviour as a Security Primitive",
        content: `The C standard defines over 200 categories of undefined behaviour (UB). Compilers exploit UB aggressively for optimisation: if the standard says behaviour X is undefined, the compiler may assume X never happens, and remove code paths that would only execute if X did happen.

This has direct security consequences. Consider:

\`\`\`c
int check_overflow(int x) {
    if (x + 100 < x)  // "overflow check"
        return -1;     // error: overflow detected
    return x + 100;
}
\`\`\`

A compiler may remove the \`if\` branch entirely, because signed integer overflow is UB in C (C17, Section 6.5, paragraph 5), so the compiler assumes \`x + 100\` never overflows, making the condition always false.

\`\`\`bash
# See the optimised assembly — the branch is gone
gcc -O2 -S check_overflow.c -o check_overflow.s
cat check_overflow.s
\`\`\`

The fix: use unsigned arithmetic (which wraps), or compiler built-ins:

\`\`\`c
#include <stdint.h>
int safe_add(int a, int b, int *result) {
    return __builtin_add_overflow(a, b, result);
    // returns 1 on overflow, 0 on success
}
\`\`\`

Research references: Xi Wang et al., "Undefined Behavior: What Happened to My Code?" (APSys 2012) documents how real-world security checks are silently eliminated by optimising compilers.`,
        sortOrder: 0,
      },
      {
        heading: "Strict Aliasing and Type-Punning Hazards",
        content: `C's strict aliasing rule (C17, Section 6.5, paragraph 7) states that an object shall be accessed only through an lvalue of a compatible type. Violating this is UB, and compilers at \`-O2\` and above exploit it.

\`\`\`c
// WRONG — strict aliasing violation
float convert_bad(uint32_t bits) {
    return *(float *)&bits;   // UB: uint32_t accessed as float
}

// CORRECT — use memcpy
float convert_good(uint32_t bits) {
    float f;
    memcpy(&f, &bits, sizeof(f));  // well-defined
    return f;
}
\`\`\`

Why this matters for security: network protocol parsers often cast buffer pointers to struct pointers. Under strict aliasing, the compiler may reorder or eliminate reads, causing the parser to use stale data. This class of bug is extremely difficult to diagnose because the code works at \`-O0\` and breaks at \`-O2\`.

\`\`\`bash
# Detect violations at runtime
gcc -fstrict-aliasing -Wstrict-aliasing=1 -O2 parser.c

# Or disable the optimisation (common in kernel code)
gcc -fno-strict-aliasing -O2 parser.c
\`\`\`

The Linux kernel compiles with \`-fno-strict-aliasing\` precisely because kernel code performs type-punning extensively. Understanding when this flag is necessary is an expert-level skill.`,
        sortOrder: 1,
      },
      {
        heading: "Modern glibc Heap Exploitation: Tcache and Beyond",
        content: `Since glibc 2.26, the **tcache** (thread-local caching) layer sits in front of the traditional bin system. Each thread gets a per-thread cache with 64 bins for chunk sizes 24 to 1032 bytes (on 64-bit), holding up to 7 chunks each. Tcache operations bypass the traditional malloc/free locking, improving performance but initially introducing new attack vectors.

**Tcache poisoning** (pre-glibc 2.32): tcache bins are singly-linked lists. A UAF that modifies a freed tcache chunk's \`next\` pointer redirects the next \`malloc\` to an attacker-controlled address:

\`\`\`c
// Simplified tcache poisoning concept
char *a = malloc(0x20);
free(a);
// a is now in tcache bin for size 0x30 (0x20 + metadata)
// UAF: overwrite a's next pointer
*(unsigned long *)a = (unsigned long)target_addr;
// Two mallocs: first returns a, second returns target_addr
malloc(0x20);
char *evil = malloc(0x20);  // points to target_addr
\`\`\`

**Mitigations added over time:**
- glibc 2.29: double-free check via a \`key\` field in freed tcache chunks.
- glibc 2.32: pointer mangling (\`PROTECT_PTR\`): the \`next\` pointer is XOR'd with the chunk's own address right-shifted by 12. Bypassing this requires leaking a heap address.
- glibc 2.32: safe-linking also covers fastbin free lists (same commit as tcache, per Check Point Research disclosure).

\`\`\`c
// glibc 2.32+ PROTECT_PTR macro
#define PROTECT_PTR(pos, ptr) \\
    ((__typeof(ptr))((((size_t)pos) >> 12) ^ ((size_t)ptr)))
#define REVEAL_PTR(ptr) PROTECT_PTR(&ptr, ptr)
\`\`\`

To exploit modern glibc, you typically need both a UAF/overflow and an info leak to defeat safe-linking and ASLR.`,
        sortOrder: 2,
      },
      {
        heading: "House-of-* Techniques",
        content: `The "House of" techniques are named exploit strategies targeting glibc's allocator at various points:

- **House of Force** — corrupt the top chunk's size to a very large value, then \`malloc\` a carefully calculated size to make the top chunk pointer wrap around to a target address. Mitigated in glibc 2.29 by a top-chunk size check.

- **House of Spirit** — free a fake chunk crafted on the stack or in a global buffer, then \`malloc\` returns that fake chunk. Requires control over the fake chunk's size and the next chunk's size to pass \`free\`'s sanity checks.

- **House of Lore** — corrupt a small-bin chunk's \`bk\` pointer so that \`malloc\` from the small bin returns an arbitrary address. Requires that the target address's forward pointer points back correctly (a victim pointer).

- **House of Orange** — trigger an unsorted-bin attack without calling \`free\` by corrupting the top chunk's size so that the next large \`malloc\` calls \`sysmalloc\`, which frees the old top chunk into the unsorted bin.

- **House of Einherjar** — exploit a single null-byte overflow to set a chunk's \`PREV_INUSE\` bit to zero, triggering backward coalescing with a fake chunk.

Each technique has specific version constraints and prerequisites. When developing exploits, always check the target's glibc version:

\`\`\`bash
# Remote version fingerprinting via libc leak
strings /lib/x86_64-linux-gnu/libc.so.6 | grep "GNU C Library"
# GNU C Library (Ubuntu GLIBC 2.35-0ubuntu3.1) stable release
\`\`\``,
        sortOrder: 3,
      },
      {
        heading: "Compiler Hardening and Its Limits",
        content: `Modern compilers offer hardening flags that transform your code at compile time. Understanding what they do — and do not — protect against is essential:

**Control-Flow Integrity (CFI):**
\`\`\`bash
# Clang CFI — validates indirect call targets
clang -fsanitize=cfi -fvisibility=hidden -flto -o prog prog.c
\`\`\`
CFI ensures indirect calls (via function pointers, virtual dispatch) target valid functions of the expected type. It defeats many ROP/JOP attacks but not data-only attacks.

**Stack Clash Protection:**
\`\`\`bash
gcc -fstack-clash-protection -o prog prog.c
\`\`\`
Probes the stack on large allocations to ensure the guard page is hit, preventing an attacker from jumping over it to corrupt adjacent memory regions.

**Shadow Call Stack (AArch64):**
\`\`\`bash
clang -fsanitize=shadow-call-stack -o prog prog.c
\`\`\`
Stores return addresses in a separate shadow stack, making it impossible to overwrite them via buffer overflows on the main stack.

**FORTIFY_SOURCE:**
\`\`\`bash
gcc -D_FORTIFY_SOURCE=2 -O2 -o prog prog.c
\`\`\`
Replaces certain libc functions (\`strcpy\`, \`memcpy\`, \`sprintf\`) with bounds-checked variants when the compiler can determine the destination buffer size at compile time. Level 3 (GCC 12+) adds additional checks.

None of these are silver bullets. A determined attacker with an info leak and a powerful write primitive can bypass all of them. Defence in depth — combining multiple mitigations — is the only viable strategy.`,
        sortOrder: 4,
      },
      {
        heading: "Sanitisers for Deep Bug Hunting",
        content: `Beyond ASan, the sanitiser suite offers tools for finding subtle UB:

**UndefinedBehaviorSanitizer (UBSan):**
\`\`\`bash
gcc -fsanitize=undefined -o prog prog.c
./prog
# Reports: signed integer overflow, null pointer dereference,
# misaligned access, out-of-bounds array index, etc.
\`\`\`

**MemorySanitizer (MSan) — uninitialized memory reads:**
\`\`\`bash
clang -fsanitize=memory -fPIE -pie -o prog prog.c
\`\`\`
Detects reads of uninitialised memory — a vulnerability class that can leak sensitive data from the stack or heap (CWE-908).

**ThreadSanitizer (TSan) — data races:**
\`\`\`bash
gcc -fsanitize=thread -o prog prog.c
\`\`\`

Combine sanitisers judiciously — ASan and MSan cannot run together (they use conflicting shadow-memory layouts). A typical CI pipeline runs separate builds for each.

For coverage-guided fuzzing, pair sanitisers with libFuzzer or AFL++:

\`\`\`bash
clang -fsanitize=address,fuzzer -o fuzz_target fuzz_target.c
./fuzz_target corpus/
\`\`\`

This combination finds bugs that no amount of manual testing can catch. The OSS-Fuzz project has found thousands of vulnerabilities in open-source C/C++ projects using exactly this approach.`,
        sortOrder: 5,
      },
      {
        heading: "Data-Only Attacks and Non-Control-Data Exploitation",
        content: `As control-flow hijacking becomes harder (CFI, shadow stacks, pointer authentication on ARM), attackers increasingly pursue **data-only attacks** — corrupting application data without diverting control flow.

Examples:
- Overwriting an \`is_admin\` flag in a server's session struct.
- Modifying a filename string so \`open()\` accesses a different file.
- Corrupting a length variable to cause an information leak on the next read.

These attacks are undetectable by CFI, stack canaries, and most existing mitigations because the control flow remains entirely legitimate.

Defence research in this area includes:
- **Data-Flow Integrity (DFI)** — tracking the provenance of data values (Castro et al., OSDI 2006).
- **Memory tagging** (ARM MTE, SPARC ADI) — assigning 4-bit tags to memory and pointers; a mismatch on access triggers a fault.
- **Compartmentalisation** (CHERI capabilities) — hardware-enforced bounds on every pointer, preventing out-of-bounds access at the architectural level.

ARM MTE is available in ARMv8.5-A and later; Linux kernel support has been in mainline since 5.10. CHERI is an experimental architecture from Cambridge/SRI that eliminates entire classes of memory-safety bugs by replacing raw pointers with unforgeable capabilities.

These represent the cutting edge of memory-safety research and are likely to shape the security landscape in the coming decade.`,
        sortOrder: 6,
      },
      {
        heading: "Sources",
        content: `- ISO/IEC 9899:2018 (C17), Sections 6.5 (Expressions), 6.5p7 (Strict aliasing)
- Wang, Xi et al., "Undefined Behavior: What Happened to My Code?" (APSys 2012)
- glibc source, malloc/malloc.c — https://sourceware.org/git/?p=glibc.git
- "Tcache Stashing Unlink Attack" — https://github.com/shellphish/how2heap
- "House of ..." techniques — https://github.com/shellphish/how2heap
- Castro et al., "Securing Software by Enforcing Data-Flow Integrity" (OSDI 2006)
- CHERI ISA — https://www.cl.cam.ac.uk/research/security/ctsrd/cheri/
- ARM MTE — https://developer.arm.com/documentation/ddi0596/2021-06/
- CWE-908: Use of Uninitialized Resource — https://cwe.mitre.org/data/definitions/908.html
- OSS-Fuzz — https://github.com/google/oss-fuzz`,
        sortOrder: 7,
      },
    ],
  },

  // ============================================================
  // c-systems — L0
  // ============================================================
  {
    competencyId: "c-systems",
    depthTier: 0,
    title: "Introduction to Systems Programming in C",
    recommendedLevel: 0,
    sections: [
      {
        heading: "What Systems Programming Means",
        content: `Systems programming is writing software that interacts directly with the operating system kernel rather than through high-level abstractions. In C, this means using **system calls** — the interface between user-space programs and the kernel.

Every time you open a file, create a process, or send data over a network, your code ultimately invokes a system call. The C standard library wraps many of these (\`fopen\` wraps \`open\`, \`printf\` wraps \`write\`), but systems programming often requires calling them directly for control and performance.

For security work, this is where the action is: privilege escalation exploits target system calls, file-descriptor leaks enable information disclosure, and race conditions in signal handlers cause exploitable crashes.`,
        sortOrder: 0,
      },
      {
        heading: "Key Concepts",
        content: `- **Process** — a running program with its own address space, file descriptors, and credentials. Created with \`fork()\`.
- **File descriptor (fd)** — an integer handle for an open file, socket, or pipe. \`stdin\` is fd 0, \`stdout\` is fd 1, \`stderr\` is fd 2.
- **Signal** — an asynchronous notification sent to a process (e.g., \`SIGTERM\` to request termination, \`SIGSEGV\` on invalid memory access).
- **Pipe** — a unidirectional byte stream connecting two processes. Created with \`pipe()\`.
- **IPC** (inter-process communication) — mechanisms for processes to exchange data: pipes, shared memory, message queues, sockets.

These primitives are defined by POSIX (IEEE Std 1003.1) and implemented by every Unix-like operating system.`,
        sortOrder: 1,
      },
      {
        heading: "Why It Matters for Security",
        content: `Understanding systems programming lets you:

1. **Audit privileged code** — daemons, setuid binaries, and kernel modules use these APIs. Misuse is the root cause of many privilege-escalation vulnerabilities.
2. **Write exploit payloads** — shellcode typically calls \`execve\`, \`dup2\`, and \`socket\` directly via syscall numbers.
3. **Build security tools** — strace, ltrace, and seccomp filters all operate at the system-call level.
4. **Understand sandboxing** — technologies like seccomp-bpf, namespaces, and capabilities restrict which system calls a process can make.

At 42, projects like \`pipex\`, \`minishell\`, and \`philosophers\` require fluent use of these primitives.`,
        sortOrder: 2,
      },
      {
        heading: "Sources",
        content: `- IEEE Std 1003.1-2017 (POSIX.1) — https://pubs.opengroup.org/onlinepubs/9699919799/
- Kerrisk, M. *The Linux Programming Interface* (TLPI) — the definitive reference
- \`man 2 syscalls\` — list of Linux system calls`,
        sortOrder: 3,
      },
    ],
  },

  // ============================================================
  // c-systems — L1
  // ============================================================
  {
    competencyId: "c-systems",
    depthTier: 1,
    title: "File Descriptors, Processes, and Basic I/O",
    recommendedLevel: 1,
    sections: [
      {
        heading: "File Descriptors in Depth",
        content: `A file descriptor is a small non-negative integer that the kernel uses to identify an open file (or pipe, socket, device, etc.) within a process. The kernel maintains a per-process file-descriptor table that maps each fd to an entry in the system-wide open-file table.

\`\`\`c
#include <fcntl.h>
#include <unistd.h>

int fd = open("secret.txt", O_RDONLY);
if (fd == -1) {
    perror("open");
    return 1;
}
char buf[256];
ssize_t n = read(fd, buf, sizeof(buf) - 1);
if (n > 0) {
    buf[n] = '\\0';
    write(STDOUT_FILENO, buf, n);
}
close(fd);
\`\`\`

Security note: file descriptors are inherited across \`fork\` and \`exec\` unless marked with \`O_CLOEXEC\` or \`FD_CLOEXEC\`. A child process that inherits an fd to a sensitive file can read its contents — this is a real vulnerability class (CWE-403).

\`\`\`c
// Safer: set close-on-exec at open time
int fd = open("secret.txt", O_RDONLY | O_CLOEXEC);
\`\`\``,
        sortOrder: 0,
      },
      {
        heading: "Creating Processes with fork",
        content: `\`fork()\` creates a new process by duplicating the calling process. The child gets a copy of the parent's address space, file descriptors, and signal handlers:

\`\`\`c
#include <unistd.h>
#include <sys/wait.h>
#include <stdio.h>

int main(void) {
    pid_t pid = fork();
    if (pid == -1) {
        perror("fork");
        return 1;
    }
    if (pid == 0) {
        // Child process
        printf("Child PID: %d\\n", getpid());
        return 0;
    }
    // Parent process
    int status;
    waitpid(pid, &status, 0);
    if (WIFEXITED(status))
        printf("Child exited with %d\\n", WEXITSTATUS(status));
    return 0;
}
\`\`\`

After \`fork\`, both processes execute the same code. The return value distinguishes them: 0 in the child, the child's PID in the parent.

Always call \`waitpid\` (or \`wait\`) in the parent to avoid zombie processes. A zombie is a terminated process whose entry remains in the process table because the parent has not collected its exit status.`,
        sortOrder: 1,
      },
      {
        heading: "Replacing a Process with exec",
        content: `\`execve\` replaces the current process image with a new program. It does not return on success:

\`\`\`c
#include <unistd.h>

int main(void) {
    char *argv[] = {"/bin/ls", "-la", NULL};
    char *envp[] = {NULL};
    execve("/bin/ls", argv, envp);
    // If we reach here, execve failed
    perror("execve");
    return 1;
}
\`\`\`

The \`fork + exec\` pattern is how shells launch commands. The shell forks, and the child calls \`execve\` with the command to run. The parent waits for the child to finish.

Security note: \`execve\` is the system call that shellcode ultimately invokes to spawn a shell. Understanding its argument structure (path, argv, envp) is essential for writing and analysing payloads.`,
        sortOrder: 2,
      },
      {
        heading: "Pipes for Inter-Process Communication",
        content: `A pipe is a pair of connected file descriptors — writing to one end makes data available for reading on the other:

\`\`\`c
#include <unistd.h>

int main(void) {
    int pipefd[2];
    pipe(pipefd);  // pipefd[0] = read end, pipefd[1] = write end

    pid_t pid = fork();
    if (pid == 0) {
        // Child: write to pipe
        close(pipefd[0]);
        write(pipefd[1], "hello", 5);
        close(pipefd[1]);
        return 0;
    }
    // Parent: read from pipe
    close(pipefd[1]);
    char buf[16];
    ssize_t n = read(pipefd[0], buf, sizeof(buf));
    write(STDOUT_FILENO, buf, n);
    close(pipefd[0]);
    waitpid(pid, NULL, 0);
    return 0;
}
\`\`\`

Close the ends you do not use. If the write end remains open in the reader, \`read\` will block forever waiting for more data instead of receiving EOF.`,
        sortOrder: 3,
      },
      {
        heading: "Sources",
        content: `- \`man 2 open\`, \`man 2 fork\`, \`man 2 execve\`, \`man 2 pipe\`, \`man 2 waitpid\`
- POSIX.1-2017 — https://pubs.opengroup.org/onlinepubs/9699919799/
- CWE-403: Exposure of File Descriptor to Unintended Control Sphere — https://cwe.mitre.org/data/definitions/403.html
- Kerrisk, M. *The Linux Programming Interface*, Chapters 5, 24, 27, 44`,
        sortOrder: 4,
      },
    ],
  },

  // ============================================================
  // c-systems — L2
  // ============================================================
  {
    competencyId: "c-systems",
    depthTier: 2,
    title: "Signals, Redirection, and the pipex Pattern",
    recommendedLevel: 2,
    sections: [
      {
        heading: "Signal Handling Fundamentals",
        content: `Signals are software interrupts delivered to a process. The kernel sends them in response to events (segfault, timer expiry, user pressing Ctrl+C) or because another process explicitly sent one via \`kill()\`.

Common signals:
| Signal   | Default Action | Typical Use |
|----------|---------------|-------------|
| SIGINT   | Terminate     | Ctrl+C      |
| SIGTERM  | Terminate     | Graceful shutdown request |
| SIGKILL  | Terminate     | Forced kill (cannot be caught) |
| SIGSEGV  | Core dump     | Invalid memory access |
| SIGCHLD  | Ignore        | Child process status change |
| SIGPIPE  | Terminate     | Write to a pipe with no readers |

Install a handler with \`sigaction\` (not the older \`signal\`, which has portability issues):

\`\`\`c
#include <signal.h>
#include <unistd.h>

volatile sig_atomic_t g_received_signal = 0;

void handler(int sig) {
    g_received_signal = sig;
}

int main(void) {
    struct sigaction sa;
    sa.sa_handler = handler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = SA_RESTART;
    sigaction(SIGINT, &sa, NULL);

    while (!g_received_signal) {
        pause();  // wait for a signal
    }
    write(STDOUT_FILENO, "Caught SIGINT\\n", 14);
    return 0;
}
\`\`\`

The handler must be **async-signal-safe**: only call functions from the POSIX async-signal-safe list (\`write\`, \`_exit\`, etc.). Calling \`printf\` or \`malloc\` in a signal handler is undefined behaviour and can deadlock or corrupt state (POSIX.1-2017, Section 2.4.3).`,
        sortOrder: 0,
      },
      {
        heading: "File Descriptor Redirection with dup2",
        content: `\`dup2(oldfd, newfd)\` duplicates \`oldfd\` onto \`newfd\`, closing \`newfd\` first if it was open. This is how shells implement I/O redirection:

\`\`\`c
#include <fcntl.h>
#include <unistd.h>

// Redirect stdout to a file
int fd = open("output.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
dup2(fd, STDOUT_FILENO);   // stdout now writes to output.txt
close(fd);                   // original fd no longer needed
printf("This goes to the file\\n");
\`\`\`

In a shell implementation, the parent opens the file and forks. The child calls \`dup2\` to redirect its stdin/stdout before calling \`execve\`. The parent's file descriptors are unaffected.

Security note: \`dup2\` does not set \`O_CLOEXEC\` on the new descriptor. In security-sensitive code, use \`dup3(oldfd, newfd, O_CLOEXEC)\` (Linux-specific) to prevent the descriptor from leaking to child processes.`,
        sortOrder: 1,
      },
      {
        heading: "Building pipex: Chaining Commands",
        content: `The 42 \`pipex\` project implements the shell pipeline \`< infile cmd1 | cmd2 > outfile\`. The core pattern:

\`\`\`c
#include <unistd.h>
#include <fcntl.h>
#include <sys/wait.h>

void pipex(char *cmd1[], char *cmd2[], char *infile, char *outfile) {
    int pipefd[2];
    pipe(pipefd);

    pid_t pid1 = fork();
    if (pid1 == 0) {
        // Child 1: reads from infile, writes to pipe
        int fd_in = open(infile, O_RDONLY);
        dup2(fd_in, STDIN_FILENO);
        close(fd_in);
        dup2(pipefd[1], STDOUT_FILENO);
        close(pipefd[0]);
        close(pipefd[1]);
        execve(cmd1[0], cmd1, NULL);
        perror("execve");
        _exit(127);
    }

    pid_t pid2 = fork();
    if (pid2 == 0) {
        // Child 2: reads from pipe, writes to outfile
        int fd_out = open(outfile, O_WRONLY | O_CREAT | O_TRUNC, 0644);
        dup2(pipefd[0], STDIN_FILENO);
        close(pipefd[0]);
        dup2(fd_out, STDOUT_FILENO);
        close(fd_out);
        close(pipefd[1]);
        execve(cmd2[0], cmd2, NULL);
        perror("execve");
        _exit(127);
    }

    // Parent: close both pipe ends and wait
    close(pipefd[0]);
    close(pipefd[1]);
    waitpid(pid1, NULL, 0);
    waitpid(pid2, NULL, 0);
}
\`\`\`

Critical detail: the parent must close both pipe ends. If the parent keeps the write end open, the second child's \`read\` will never see EOF, and the pipeline hangs.`,
        sortOrder: 2,
      },
      {
        heading: "Handling Multiple Pipes",
        content: `For a bonus implementation with N commands, create N-1 pipes and fork N children. The pattern generalises:

\`\`\`c
// Pseudocode for N-command pipeline
for (int i = 0; i < n_cmds; i++) {
    if (i < n_cmds - 1)
        pipe(pipes[i]);
    pid[i] = fork();
    if (pid[i] == 0) {
        // Redirect stdin from previous pipe (if not first)
        if (i > 0)
            dup2(pipes[i - 1][0], STDIN_FILENO);
        // Redirect stdout to current pipe (if not last)
        if (i < n_cmds - 1)
            dup2(pipes[i][1], STDOUT_FILENO);
        // Close all pipe fds in child
        close_all_pipes(pipes, n_cmds - 1);
        execve(cmds[i][0], cmds[i], envp);
        _exit(127);
    }
}
close_all_pipes(pipes, n_cmds - 1);
for (int i = 0; i < n_cmds; i++)
    waitpid(pid[i], NULL, 0);
\`\`\`

The most common bug is leaking pipe file descriptors. Each child must close **all** pipe fds it does not use. Leaking a write end prevents the downstream reader from seeing EOF.`,
        sortOrder: 3,
      },
      {
        heading: "Resolving Command Paths",
        content: `Shells find executables by searching the \`PATH\` environment variable. Implement this for \`pipex\` and \`minishell\`:

\`\`\`c
#include <string.h>
#include <stdlib.h>
#include <unistd.h>

char *resolve_path(const char *cmd, char **envp) {
    // If cmd contains '/', use it directly
    if (strchr(cmd, '/'))
        return access(cmd, X_OK) == 0 ? strdup(cmd) : NULL;

    // Find PATH in envp
    char *path_var = NULL;
    for (int i = 0; envp[i]; i++) {
        if (strncmp(envp[i], "PATH=", 5) == 0) {
            path_var = envp[i] + 5;
            break;
        }
    }
    if (!path_var)
        return NULL;

    char *path = strdup(path_var);
    char *dir  = strtok(path, ":");
    while (dir) {
        char full[4096];
        snprintf(full, sizeof(full), "%s/%s", dir, cmd);
        if (access(full, X_OK) == 0) {
            free(path);
            return strdup(full);
        }
        dir = strtok(NULL, ":");
    }
    free(path);
    return NULL;
}
\`\`\`

Security note: never resolve paths against a user-controlled \`PATH\` in a setuid binary. An attacker could prepend a malicious directory and hijack execution.`,
        sortOrder: 4,
      },
      {
        heading: "Error Handling and Edge Cases",
        content: `Robust systems code checks every system call:

- \`open\` can fail with \`EACCES\` (permission denied), \`ENOENT\` (file not found), \`EMFILE\` (too many open files).
- \`fork\` can fail with \`EAGAIN\` (process limit reached) or \`ENOMEM\`.
- \`pipe\` can fail with \`EMFILE\` or \`ENFILE\`.
- \`execve\` can fail with \`ENOENT\`, \`EACCES\`, \`ENOEXEC\` (not a valid executable).

In a pipeline, if a command fails, you still need to clean up: close all pipe fds, wait for all children, and report the correct exit status. The exit status of a pipeline is typically the exit status of the last command (matching bash's behaviour).

\`\`\`bash
# Check exit status of pipeline
ls nonexistent 2>/dev/null | wc -l
echo $?   # 0 (exit status of wc)

# bash pipefail option changes this
set -o pipefail
ls nonexistent 2>/dev/null | wc -l
echo $?   # 2 (exit status of ls)
\`\`\``,
        sortOrder: 5,
      },
      {
        heading: "Sources",
        content: `- \`man 2 sigaction\`, \`man 2 dup2\`, \`man 7 signal\`, \`man 7 signal-safety\`
- POSIX.1-2017, Section 2.4.3 (Signal Actions) — https://pubs.opengroup.org/onlinepubs/9699919799/
- Kerrisk, M. *The Linux Programming Interface*, Chapters 20-22 (Signals), 44 (Pipes)
- Stevens & Rago, *Advanced Programming in the UNIX Environment*, Chapter 15 (IPC)`,
        sortOrder: 6,
      },
    ],
  },

  // ============================================================
  // c-systems — L3
  // ============================================================
  {
    competencyId: "c-systems",
    depthTier: 3,
    title: "Inter-Process Communication and Advanced Signal Handling",
    recommendedLevel: 3,
    sections: [
      {
        heading: "IPC Mechanisms Overview",
        content: `Unix provides multiple IPC mechanisms, each suited to different use cases:

| Mechanism        | Scope           | Data Type   | Persistence |
|-----------------|-----------------|-------------|-------------|
| Pipe             | Parent-child    | Byte stream | Process     |
| Named pipe (FIFO)| Any processes   | Byte stream | Filesystem  |
| Unix socket      | Same machine    | Byte/datagram| Process   |
| Shared memory    | Same machine    | Raw bytes   | Kernel      |
| Message queue    | Same machine    | Messages    | Kernel      |
| Signals          | Same machine    | Signal number| Instant    |

For security tools, Unix domain sockets and shared memory are the most relevant. Signals are limited to 31 standard signals and carry no data payload (real-time signals can carry a single \`int\` or pointer via \`sigqueue\`).`,
        sortOrder: 0,
      },
      {
        heading: "Named Pipes (FIFOs)",
        content: `A named pipe (FIFO) is a pipe that has a name in the filesystem, allowing unrelated processes to communicate:

\`\`\`c
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>

// Writer process
int main(void) {
    mkfifo("/tmp/myfifo", 0666);
    int fd = open("/tmp/myfifo", O_WRONLY);
    write(fd, "secret data\\n", 12);
    close(fd);
    unlink("/tmp/myfifo");
    return 0;
}
\`\`\`

\`\`\`c
// Reader process (run in a separate terminal)
#include <fcntl.h>
#include <unistd.h>

int main(void) {
    int fd = open("/tmp/myfifo", O_RDONLY);
    char buf[256];
    ssize_t n = read(fd, buf, sizeof(buf));
    write(STDOUT_FILENO, buf, n);
    close(fd);
    return 0;
}
\`\`\`

Security consideration: the FIFO's permissions control who can open it. Creating a FIFO in \`/tmp\` with mode 0666 allows any user to write to it. For sensitive data, use a directory with restricted permissions or Unix domain sockets with \`SO_PEERCRED\` for peer authentication.`,
        sortOrder: 1,
      },
      {
        heading: "Shared Memory with mmap",
        content: `\`mmap\` with \`MAP_SHARED\` creates a memory region visible to both parent and child (or, with a backing file, to any process that maps the same file):

\`\`\`c
#include <sys/mman.h>
#include <unistd.h>
#include <string.h>
#include <stdio.h>
#include <sys/wait.h>

int main(void) {
    // Anonymous shared mapping
    int *shared = mmap(NULL, sizeof(int),
                       PROT_READ | PROT_WRITE,
                       MAP_SHARED | MAP_ANONYMOUS,
                       -1, 0);
    *shared = 0;

    pid_t pid = fork();
    if (pid == 0) {
        (*shared)++;   // child increments
        return 0;
    }
    waitpid(pid, NULL, 0);
    printf("shared value: %d\\n", *shared);  // prints 1
    munmap(shared, sizeof(int));
    return 0;
}
\`\`\`

Without synchronisation, concurrent access to shared memory is a data race. Use POSIX semaphores (\`sem_init\` with \`pshared=1\`), mutexes with \`PTHREAD_PROCESS_SHARED\`, or atomic operations.

For the 42 \`philosophers\` project, shared memory between processes (as opposed to threads sharing the same address space) requires this pattern. The forks (mutexes or semaphores) must be placed in the shared region.`,
        sortOrder: 2,
      },
      {
        heading: "POSIX Semaphores",
        content: `POSIX named semaphores provide inter-process synchronisation:

\`\`\`c
#include <semaphore.h>
#include <fcntl.h>
#include <sys/wait.h>
#include <stdio.h>
#include <unistd.h>

int main(void) {
    sem_t *sem = sem_open("/mysem", O_CREAT | O_EXCL, 0644, 1);
    if (sem == SEM_FAILED) {
        perror("sem_open");
        return 1;
    }

    pid_t pid = fork();
    if (pid == 0) {
        sem_wait(sem);
        printf("Child has the semaphore\\n");
        sleep(1);
        sem_post(sem);
        sem_close(sem);
        return 0;
    }

    sem_wait(sem);
    printf("Parent has the semaphore\\n");
    sleep(1);
    sem_post(sem);

    waitpid(pid, NULL, 0);
    sem_close(sem);
    sem_unlink("/mysem");
    return 0;
}
\`\`\`

Always \`sem_unlink\` named semaphores when done. Leaked semaphores persist in the kernel and consume resources. List them with:

\`\`\`bash
ls /dev/shm/sem.*
\`\`\``,
        sortOrder: 3,
      },
      {
        heading: "Advanced Signal Patterns",
        content: `Real-time signals (\`SIGRTMIN\` to \`SIGRTMAX\`) can carry data and are queued (standard signals may be coalesced). Use \`sigqueue\` to send and \`SA_SIGINFO\` to receive:

\`\`\`c
#include <signal.h>
#include <unistd.h>
#include <stdio.h>

void handler(int sig, siginfo_t *info, void *context) {
    (void)context;
    // info->si_value.sival_int contains the sent integer
    char buf[64];
    int len = snprintf(buf, sizeof(buf), "Received %d with value %d\\n",
                       sig, info->si_value.sival_int);
    write(STDOUT_FILENO, buf, len);
}

int main(void) {
    struct sigaction sa;
    sa.sa_sigaction = handler;
    sa.sa_flags = SA_SIGINFO;
    sigemptyset(&sa.sa_mask);
    sigaction(SIGRTMIN, &sa, NULL);

    // Send to self with data
    union sigval val;
    val.sival_int = 42;
    sigqueue(getpid(), SIGRTMIN, val);
    pause();
    return 0;
}
\`\`\`

In the 42 \`minitalk\` project, you transmit data between processes using only \`SIGUSR1\` and \`SIGUSR2\`. The sender encodes each byte as 8 signals (one per bit). The receiver reconstructs the byte in its signal handler. Real-time signals with \`sigqueue\` make this more reliable than standard signals, which can be lost if sent faster than the handler runs.`,
        sortOrder: 4,
      },
      {
        heading: "Debugging IPC Issues",
        content: `IPC bugs are notoriously difficult to reproduce. Essential debugging tools:

\`\`\`bash
# Trace system calls in real time
strace -f -e trace=ipc,signal,read,write ./program

# Show open file descriptors of a running process
ls -la /proc/<pid>/fd/

# Show shared memory segments
ipcs -m

# Show semaphores
ipcs -s

# Show message queues
ipcs -q

# Remove a stuck IPC resource
ipcrm -M <shmkey>   # shared memory by key
ipcrm -S <semkey>   # semaphore by key
\`\`\`

Common IPC bugs:
1. **Deadlock** — two processes each wait for a resource the other holds.
2. **Race condition** — outcome depends on scheduling order.
3. **Resource leak** — shared memory or semaphores not cleaned up on exit.
4. **Signal loss** — sending signals faster than the handler can process them.

Use \`valgrind --tool=helgrind\` or ThreadSanitizer for detecting data races in threaded programs that share memory.`,
        sortOrder: 5,
      },
      {
        heading: "I/O multiplexing: select, poll, and epoll",
        content: `A server handling multiple clients cannot simply call \`read()\` on each fd sequentially — a blocking read on one fd stalls all others. I/O multiplexing solves this by monitoring multiple fds and telling you which ones are ready.\n\n\`\`\`mermaid\nflowchart TB\n    subgraph select/poll\n        S[Call select/poll with fd list] --> W[Kernel checks all fds]\n        W --> R[Returns ready fd set]\n        R --> P[Process ready fds]\n        P --> S\n    end\n    subgraph epoll\n        E1[epoll_create] --> E2[epoll_ctl: add fds once]\n        E2 --> E3[epoll_wait: blocks]\n        E3 --> E4[Returns ONLY ready fds]\n        E4 --> E3\n    end\n\`\`\`\n\n\`\`\`c\n// select() — POSIX, portable, limited to FD_SETSIZE (typically 1024)\nfd_set read_fds;\nFD_ZERO(&read_fds);\nFD_SET(listen_fd, &read_fds);\nfor (int i = 0; i < n_clients; i++)\n    FD_SET(client_fds[i], &read_fds);\n\nint ready = select(max_fd + 1, &read_fds, NULL, NULL, &timeout);\nfor (int fd = 0; fd <= max_fd; fd++) {\n    if (FD_ISSET(fd, &read_fds)) {\n        // fd is ready for reading\n    }\n}\n\`\`\`\n\n\`\`\`c\n// epoll — Linux-specific, scales to millions of connections\nint epfd = epoll_create1(0);\nstruct epoll_event ev = { .events = EPOLLIN, .data.fd = listen_fd };\nepoll_ctl(epfd, EPOLL_CTL_ADD, listen_fd, &ev);\n\nstruct epoll_event events[MAX_EVENTS];\nwhile (1) {\n    int n = epoll_wait(epfd, events, MAX_EVENTS, -1);\n    for (int i = 0; i < n; i++) {\n        if (events[i].data.fd == listen_fd)\n            accept_new_client(epfd, listen_fd);\n        else\n            handle_client(events[i].data.fd);\n    }\n}\n\`\`\`\n\n| | \`select\` | \`poll\` | \`epoll\` |\n|---|---|---|---|\n| **Portability** | POSIX (everywhere) | POSIX | Linux only |\n| **fd limit** | FD_SETSIZE (~1024) | No hard limit | No hard limit |\n| **Complexity** | O(max_fd) per call | O(n_fds) per call | O(ready_fds) per call |\n| **Fd passing** | Copy entire set each call | Copy array each call | Register once, kernel tracks |\n| **Best for** | Small fd counts, portability | Medium fd counts | High-concurrency servers |\n\nBSD/macOS equivalent of epoll: \`kqueue\` (\`kevent()\`).\n\nSource: \`man 2 select\`, \`man 2 poll\`, \`man 7 epoll\`; Kerrisk, *TLPI*, Chapter 63`,
        sortOrder: 6,
      },
      {
        heading: "Sources",
        content: `- \`man 7 fifo\`, \`man 3 sem_open\`, \`man 2 mmap\`, \`man 2 sigqueue\`
- POSIX.1-2017, Sections on Shared Memory, Semaphores, Message Queues
- Kerrisk, M. *The Linux Programming Interface*, Chapters 47-54 (System V and POSIX IPC)
- Stevens & Rago, *APUE*, Chapter 15 (IPC)
- \`man 1 strace\`, \`man 1 ipcs\``,
        sortOrder: 7,
      },
    ],
  },

  // ============================================================
  // c-systems — L4
  // ============================================================
  {
    competencyId: "c-systems",
    depthTier: 4,
    title: "Threads, Synchronisation, and the Dining Philosophers",
    recommendedLevel: 4,
    sections: [
      {
        heading: "POSIX Threads (pthreads)",
        content: `Threads share the same address space within a process, making data sharing trivial but synchronisation critical. Create and join threads with the pthreads API:

\`\`\`c
#include <pthread.h>
#include <stdio.h>

void *routine(void *arg) {
    int id = *(int *)arg;
    printf("Thread %d running\\n", id);
    return NULL;
}

int main(void) {
    pthread_t threads[4];
    int       ids[4];

    for (int i = 0; i < 4; i++) {
        ids[i] = i;
        pthread_create(&threads[i], NULL, routine, &ids[i]);
    }
    for (int i = 0; i < 4; i++)
        pthread_join(threads[i], NULL);
    return 0;
}
\`\`\`

Compile with \`-pthread\`:
\`\`\`bash
gcc -pthread -o threads threads.c
\`\`\`

Key difference from \`fork\`: threads share heap, globals, and file descriptors. A bug in one thread (e.g., buffer overflow) corrupts data visible to all threads. This is why multi-threaded programs have a larger attack surface than multi-process ones.`,
        sortOrder: 0,
      },
      {
        heading: "Mutexes and Critical Sections",
        content: `A mutex (mutual exclusion) ensures that only one thread accesses a critical section at a time:

\`\`\`c
#include <pthread.h>

int             counter = 0;
pthread_mutex_t lock    = PTHREAD_MUTEX_INITIALIZER;

void *increment(void *arg) {
    (void)arg;
    for (int i = 0; i < 1000000; i++) {
        pthread_mutex_lock(&lock);
        counter++;
        pthread_mutex_unlock(&lock);
    }
    return NULL;
}
\`\`\`

Without the mutex, two threads incrementing \`counter\` concurrently produce a result less than 2000000 due to lost updates (a data race, which is undefined behaviour in C11 and later).

Mutex best practices:
- Lock for the shortest possible duration.
- Always unlock in the same function that locked (avoids forgetting to unlock on error paths).
- Never lock a mutex you already hold (deadlock) unless it is a \`PTHREAD_MUTEX_RECURSIVE\` type.
- Check return values: \`pthread_mutex_lock\` can fail with \`EDEADLK\` on error-checking mutexes.`,
        sortOrder: 1,
      },
      {
        heading: "The Dining Philosophers Problem",
        content: `The classic concurrency problem: N philosophers sit at a round table with N forks. Each needs two forks (left and right) to eat. The challenge is avoiding deadlock (everyone holds one fork and waits for the other) and starvation (a philosopher never gets to eat).

For the 42 \`philosophers\` project, the standard solution uses resource ordering to prevent deadlock:

\`\`\`c
typedef struct s_philo {
    int              id;
    pthread_mutex_t *left_fork;
    pthread_mutex_t *right_fork;
    long long        last_meal_time;
    int              meals_eaten;
} t_philo;

void *philosopher_routine(void *arg) {
    t_philo *philo = (t_philo *)arg;

    while (!simulation_ended()) {
        // Think
        print_status(philo, "is thinking");

        // Pick up forks (lower-numbered first to prevent deadlock)
        pthread_mutex_t *first  = philo->left_fork < philo->right_fork
                                  ? philo->left_fork : philo->right_fork;
        pthread_mutex_t *second = (first == philo->left_fork)
                                  ? philo->right_fork : philo->left_fork;
        pthread_mutex_lock(first);
        print_status(philo, "has taken a fork");
        pthread_mutex_lock(second);
        print_status(philo, "has taken a fork");

        // Eat
        print_status(philo, "is eating");
        update_last_meal(philo);
        precise_sleep(time_to_eat);

        pthread_mutex_unlock(second);
        pthread_mutex_unlock(first);

        // Sleep
        print_status(philo, "is sleeping");
        precise_sleep(time_to_sleep);
    }
    return NULL;
}
\`\`\`

The resource-ordering approach (always lock the lower-numbered fork first) guarantees no circular wait, which is one of the four Coffman conditions for deadlock.`,
        sortOrder: 2,
      },
      {
        heading: "Precise Timing and Death Detection",
        content: `The philosophers project requires detecting death (a philosopher not eating within \`time_to_die\` milliseconds) with high precision. Use \`gettimeofday\` or \`clock_gettime\`:

\`\`\`c
#include <sys/time.h>

long long get_time_ms(void) {
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return (long long)tv.tv_sec * 1000 + tv.tv_usec / 1000;
}

// Precise sleep: usleep is not accurate enough for short durations
void precise_sleep(int ms) {
    long long start = get_time_ms();
    while (get_time_ms() - start < ms)
        usleep(100);  // poll in 100us intervals
}
\`\`\`

A separate monitor thread checks each philosopher's \`last_meal_time\`:

\`\`\`c
void *death_monitor(void *arg) {
    t_data *data = (t_data *)arg;
    while (1) {
        for (int i = 0; i < data->num_philos; i++) {
            pthread_mutex_lock(&data->meal_lock);
            long long since_meal = get_time_ms() - data->philos[i].last_meal_time;
            pthread_mutex_unlock(&data->meal_lock);
            if (since_meal > data->time_to_die) {
                print_status(&data->philos[i], "died");
                set_simulation_ended(data);
                return NULL;
            }
        }
        usleep(1000);
    }
}
\`\`\`

The \`last_meal_time\` must be protected by a mutex or atomic to avoid data races between the eating thread updating it and the monitor reading it.`,
        sortOrder: 3,
      },
      {
        heading: "Condition Variables",
        content: `Condition variables allow a thread to wait until a particular condition is met, without busy-waiting:

\`\`\`c
#include <pthread.h>

pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t  cond  = PTHREAD_COND_INITIALIZER;
int             ready = 0;

void *producer(void *arg) {
    (void)arg;
    pthread_mutex_lock(&mutex);
    ready = 1;
    pthread_cond_signal(&cond);   // wake one waiter
    pthread_mutex_unlock(&mutex);
    return NULL;
}

void *consumer(void *arg) {
    (void)arg;
    pthread_mutex_lock(&mutex);
    while (!ready)                 // always use a loop, not if
        pthread_cond_wait(&cond, &mutex);
    // ready == 1 here, mutex is held
    pthread_mutex_unlock(&mutex);
    return NULL;
}
\`\`\`

The \`while\` loop is essential — \`pthread_cond_wait\` can return spuriously (without the condition being signalled). This is specified behaviour, not a bug (POSIX.1-2017, Section on pthread_cond_wait).

Use \`pthread_cond_broadcast\` to wake all waiters when multiple threads need to check the condition.`,
        sortOrder: 4,
      },
      {
        heading: "Thread Safety and Reentrancy",
        content: `A function is **thread-safe** if it can be called from multiple threads simultaneously without producing incorrect results. A function is **reentrant** if it can be safely called again before a previous call completes (e.g., from a signal handler while it is already running).

Reentrant implies thread-safe, but not vice versa. \`strtok\` is neither — it uses internal static state. \`strtok_r\` is the reentrant version.

Common thread-safety strategies:
1. **Immutable data** — read-only data is inherently thread-safe.
2. **Thread-local storage** — each thread gets its own copy:
\`\`\`c
_Thread_local int per_thread_counter = 0;  // C11
// or
__thread int per_thread_counter = 0;       // GCC extension
\`\`\`
3. **Lock-free algorithms** — use atomic operations (\`<stdatomic.h>\` in C11) to update shared state without mutexes:
\`\`\`c
#include <stdatomic.h>
atomic_int counter = 0;
atomic_fetch_add(&counter, 1);  // thread-safe increment
\`\`\`

For security-critical code, prefer simpler synchronisation. Lock-free code is notoriously difficult to get right, and bugs in it (e.g., ABA problems) are exploitable.`,
        sortOrder: 5,
      },
      {
        heading: "Detecting Concurrency Bugs",
        content: `Concurrency bugs are among the hardest to find and reproduce. Tools:

\`\`\`bash
# ThreadSanitizer — detects data races at runtime
gcc -fsanitize=thread -g -o prog prog.c -pthread
./prog

# Helgrind (Valgrind tool) — detects lock-order violations, data races
valgrind --tool=helgrind ./prog

# DRD (Valgrind tool) — another race detector, sometimes catches different bugs
valgrind --tool=drd ./prog
\`\`\`

ThreadSanitizer is typically 5-15x slower than normal execution. Helgrind/DRD are 50-100x slower. Run them in CI with short test cases.

Common concurrency CVEs in the wild:
- **TOCTOU (time-of-check-time-of-use)** — checking a condition and acting on it non-atomically. Example: checking file permissions with \`access()\` then opening with \`open()\` — another process can change the file between the two calls (CWE-367).
- **Race in signal handlers** — modifying non-atomic, non-\`sig_atomic_t\` data in a signal handler while the main thread reads it.`,
        sortOrder: 6,
      },
      {
        heading: "The double-fork daemon pattern",
        content: `A daemon is a long-running background process with no controlling terminal. The classic UNIX double-fork idiom ensures the daemon cannot accidentally reacquire a terminal:\n\n\`\`\`mermaid\nsequenceDiagram\n    participant P as Parent (PID 100)\n    participant C as Child 1 (PID 101)\n    participant D as Daemon (PID 102)\n    P->>C: fork() — first fork\n    P->>P: exit(0) — parent exits\n    Note over C: Child is now orphan, reparented to init\n    C->>C: setsid() — new session leader, no controlling tty\n    C->>D: fork() — second fork\n    C->>C: exit(0) — session leader exits\n    Note over D: Not a session leader → cannot acquire a tty\n    D->>D: chdir("/"), umask(0), close fds\n    D->>D: Run daemon loop\n\`\`\`\n\n\`\`\`c\n#include <unistd.h>\n#include <stdlib.h>\n#include <sys/stat.h>\n\nvoid daemonize(void) {\n    pid_t pid = fork();\n    if (pid < 0) exit(EXIT_FAILURE);\n    if (pid > 0) exit(EXIT_SUCCESS); // parent exits\n\n    // Child: become session leader\n    if (setsid() < 0) exit(EXIT_FAILURE);\n\n    pid = fork(); // second fork\n    if (pid < 0) exit(EXIT_FAILURE);\n    if (pid > 0) exit(EXIT_SUCCESS); // session leader exits\n\n    // Grandchild: the daemon\n    umask(0);\n    chdir("/");\n\n    // Close stdin/stdout/stderr, reopen to /dev/null\n    close(STDIN_FILENO);\n    close(STDOUT_FILENO);\n    close(STDERR_FILENO);\n    open("/dev/null", O_RDONLY); // fd 0\n    open("/dev/null", O_WRONLY); // fd 1\n    open("/dev/null", O_WRONLY); // fd 2\n}\n\`\`\`\n\nWhy double-fork? After \`setsid()\`, the child is a session leader — it *could* acquire a controlling terminal by opening a tty device. The second fork creates a non-session-leader, which cannot.\n\nModern alternative: \`systemd\` handles daemonization — services should run in the foreground (\`Type=simple\`) and let systemd manage the lifecycle.\n\nSource: Stevens, W.R. *Advanced Programming in the UNIX Environment*, §13.3; \`man 7 daemon\``,
        sortOrder: 7,
      },
      {
        heading: "TOCTOU races and symlink attacks",
        content: `TOCTOU (Time-of-Check to Time-of-Use) is a race condition where a resource changes between checking its state and acting on it:\n\n\`\`\`mermaid\nsequenceDiagram\n    participant Root as Root Process\n    participant Attacker as Attacker\n    participant FS as Filesystem\n    Root->>FS: access("/tmp/output", F_OK) → not found\n    Note over Attacker: Window of opportunity!\n    Attacker->>FS: ln -s /etc/shadow /tmp/output\n    Root->>FS: open("/tmp/output", O_WRONLY|O_CREAT)\n    Note over FS: Follows symlink → overwrites /etc/shadow!\n\`\`\`\n\n\`\`\`c\n// VULNERABLE: TOCTOU between access() and open()\nif (access("/tmp/output", F_OK) == -1) {\n    // attacker creates symlink here\n    int fd = open("/tmp/output", O_WRONLY | O_CREAT, 0644);\n    write(fd, data, len); // writes to attacker's target\n}\n\n// SAFE: atomic create-or-fail with O_EXCL | O_NOFOLLOW\nint fd = open("/tmp/output", O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW, 0644);\nif (fd == -1) {\n    if (errno == EEXIST)\n        // file already exists — handle safely\n}\n// O_EXCL: fails if file exists (atomic check+create)\n// O_NOFOLLOW: fails if path is a symlink\n\`\`\`\n\n**Classic /tmp symlink attack scenario**: A SUID-root program writes to a predictable file in /tmp. The attacker creates a symlink at that path pointing to /etc/passwd or /etc/shadow. The root process follows the symlink and overwrites the target file.\n\n**Defenses**:\n- Use \`O_EXCL | O_NOFOLLOW\` for atomic file creation\n- Use \`mkstemp()\` for unpredictable temp file names\n- Use \`openat()\` with a dirfd to avoid path races\n- Set sticky bit on /tmp (\`chmod +t\`) — prevents users from renaming/deleting other users' files\n- Linux: \`fs.protected_symlinks = 1\` (sysctl) blocks following symlinks in sticky-bit directories unless the owner matches\n\nSource: CWE-367, Kerrisk, M. *The Linux Programming Interface*, §38.7; \`man 2 open\` (O_EXCL, O_NOFOLLOW)`,
        sortOrder: 8,
      },
      {
        heading: "Sources",
        content: `- \`man 7 pthreads\`, \`man 3 pthread_mutex_lock\`, \`man 3 pthread_cond_wait\`
- POSIX.1-2017, Threads — https://pubs.opengroup.org/onlinepubs/9699919799/
- Kerrisk, M. *The Linux Programming Interface*, Chapters 29-33 (Threads)
- Coffman et al., "System Deadlocks" (Computing Surveys, 1971)
- CWE-367: TOCTOU Race Condition — https://cwe.mitre.org/data/definitions/367.html
- Dijkstra, E.W. "Hierarchical Ordering of Sequential Processes" (1971) — the original dining philosophers`,
        sortOrder: 7,
      },
    ],
  },

  // ============================================================
  // c-systems — L5
  // ============================================================
  {
    competencyId: "c-systems",
    depthTier: 5,
    title: "Advanced Unix Internals: Sandboxing, Namespaces, and Exploit Primitives",
    recommendedLevel: 5,
    sections: [
      {
        heading: "System Calls from the Kernel's Perspective",
        content: `> **Prerequisite: x86-64 registers and CPU privilege levels.** On x86-64 Linux, the CPU has general-purpose registers: \`rax\` (return value / syscall number), \`rdi\`, \`rsi\`, \`rdx\`, \`rcx\`, \`r8\`, \`r9\` (function arguments in order). The CPU operates at privilege levels called rings: ring 3 (user space — your programs) and ring 0 (kernel space — full hardware access). The \`syscall\` instruction triggers a ring 3→ring 0 transition. GCC inline assembly uses constraints like \`"=a"(ret)\` (output in rax), \`"D"(fd)\` (input in rdi), \`"S"(buf)\` (input in rsi) to map C variables to registers. See also *C Core L3* for calling conventions and stack frame layout.

When a user-space program calls \`read(fd, buf, count)\`, the C library wrapper places the syscall number in \`rax\` (0 for \`read\` on x86-64), arguments in \`rdi\`, \`rsi\`, \`rdx\`, and executes the \`syscall\` instruction. The CPU switches to ring 0, and the kernel dispatches through the syscall table.

You can invoke syscalls directly without libc:

\`\`\`c
#include <sys/syscall.h>
#include <unistd.h>

ssize_t my_write(int fd, const void *buf, size_t count) {
    return syscall(SYS_write, fd, buf, count);
}
\`\`\`

Or in inline assembly:

\`\`\`c
ssize_t my_write_asm(int fd, const void *buf, size_t count) {
    ssize_t ret;
    __asm__ volatile (
        "syscall"
        : "=a"(ret)
        : "a"((long)SYS_write), "D"((long)fd),
          "S"(buf), "d"(count)
        : "rcx", "r11", "memory"
    );
    return ret;
}
\`\`\`

This is exactly how shellcode works — it cannot rely on libc being mapped at a known address, so it invokes syscalls directly. Understanding the calling convention is essential for writing and analysing payloads.

\`\`\`bash
# Trace syscalls of a running binary
strace -f -o trace.log ./target
# Count syscall types
strace -c ./target
\`\`\``,
        sortOrder: 0,
      },
      {
        heading: "seccomp-BPF: System Call Filtering",
        content: `seccomp (secure computing mode) restricts which system calls a process can make. The BPF (Berkeley Packet Filter) variant allows fine-grained rules:

\`\`\`c
#include <linux/seccomp.h>
#include <linux/filter.h>
#include <linux/audit.h>
#include <sys/prctl.h>
#include <stddef.h>
#include <unistd.h>

void install_seccomp_filter(void) {
    struct sock_filter filter[] = {
        // Load syscall number
        BPF_STMT(BPF_LD | BPF_W | BPF_ABS,
                 offsetof(struct seccomp_data, nr)),
        // Allow read (0), write (1), exit_group (231)
        BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, __NR_read, 0, 1),
        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ALLOW),
        BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, __NR_write, 0, 1),
        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ALLOW),
        BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, __NR_exit_group, 0, 1),
        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ALLOW),
        // Kill on any other syscall
        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_KILL),
    };
    struct sock_fprog prog = {
        .len    = sizeof(filter) / sizeof(filter[0]),
        .filter = filter,
    };
    prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0);
    prctl(PR_SET_SECCOMP, SECCOMP_MODE_FILTER, &prog);
}
\`\`\`

After installing this filter, any syscall other than \`read\`, \`write\`, or \`exit_group\` kills the process with \`SIGSYS\`. This is how Chrome, Firefox, and container runtimes sandbox untrusted code.

For CTF challenges, seccomp filters often restrict \`execve\`, forcing you to use open-read-write shellcode instead of spawning a shell.

\`\`\`bash
# Dump a binary's seccomp filter
seccomp-tools dump ./challenge
\`\`\``,
        sortOrder: 1,
      },
      {
        heading: "Linux Namespaces and Containers",
        content: `Linux namespaces isolate system resources between groups of processes. They are the kernel primitive behind Docker and other container runtimes.

| Namespace | Isolates | Flag |
|-----------|----------|------|
| PID       | Process IDs | CLONE_NEWPID |
| NET       | Network stack | CLONE_NEWNET |
| MNT       | Mount points | CLONE_NEWNS |
| UTS       | Hostname | CLONE_NEWUTS |
| IPC       | SysV IPC, POSIX MQ | CLONE_NEWIPC |
| USER      | UID/GID mappings | CLONE_NEWUSER |
| CGROUP    | Cgroup root | CLONE_NEWCGROUP |

Create a new namespace with \`clone\` or \`unshare\`:

\`\`\`c
#define _GNU_SOURCE
#include <sched.h>
#include <unistd.h>
#include <stdio.h>
#include <sys/wait.h>

static int child_func(void *arg) {
    (void)arg;
    // Inside new PID and UTS namespaces
    sethostname("sandbox", 7);
    char hostname[64];
    gethostname(hostname, sizeof(hostname));
    printf("Hostname: %s, PID: %d\\n", hostname, getpid());
    // PID is 1 inside the new PID namespace
    return 0;
}

int main(void) {
    char stack[65536];
    pid_t pid = clone(child_func, stack + sizeof(stack),
                      CLONE_NEWPID | CLONE_NEWUTS | SIGCHLD,
                      NULL);
    if (pid == -1) { perror("clone"); return 1; }
    waitpid(pid, NULL, 0);
    return 0;
}
\`\`\`

Container escapes exploit incomplete isolation. Common vectors:
- Mounting the host filesystem via a misconfigured bind mount
- Exploiting a kernel vulnerability from within a privileged container
- Abusing \`CAP_SYS_ADMIN\` if granted to the container
- Escaping user namespaces via UID 0 mapping to the host's UID 0`,
        sortOrder: 2,
      },
      {
        heading: "Linux Capabilities",
        content: `Traditionally, Unix has two privilege levels: root (UID 0, can do everything) and non-root. Linux capabilities split root's power into ~40 distinct capabilities:

- \`CAP_NET_RAW\` — create raw sockets (needed for \`ping\`, packet capture)
- \`CAP_NET_BIND_SERVICE\` — bind to ports below 1024
- \`CAP_SYS_PTRACE\` — trace processes with \`ptrace\`
- \`CAP_DAC_OVERRIDE\` — bypass file permission checks
- \`CAP_SYS_ADMIN\` — a catch-all for miscellaneous privileged operations (mount, namespace, etc.)

\`\`\`bash
# View a process's capabilities
cat /proc/self/status | grep Cap
# Decode the hex bitmask
capsh --decode=00000000a80425fb

# Run a program with specific capabilities
sudo setcap cap_net_raw+ep ./my_scanner
# Verify
getcap ./my_scanner
\`\`\`

\`\`\`c
// Drop all capabilities in code (sandboxing)
#include <sys/capability.h>

void drop_caps(void) {
    cap_t caps = cap_init();   // empty capability set
    cap_set_proc(caps);        // apply — drops everything
    cap_free(caps);
}
\`\`\`

In penetration testing, look for binaries with unexpected capabilities (\`getcap -r / 2>/dev/null\`). A binary with \`CAP_SYS_PTRACE\` can attach to any process and inject shellcode. A binary with \`CAP_DAC_OVERRIDE\` can read any file.`,
        sortOrder: 3,
      },
      {
        heading: "ptrace: Process Tracing and Debugging",
        content: `\`ptrace\` is the system call behind \`gdb\`, \`strace\`, and \`ltrace\`. It allows one process to control another: read/write its memory, single-step its execution, and intercept its system calls.

\`\`\`c
#include <sys/ptrace.h>
#include <sys/wait.h>
#include <sys/user.h>
#include <unistd.h>
#include <stdio.h>

int main(void) {
    pid_t child = fork();
    if (child == 0) {
        ptrace(PTRACE_TRACEME, 0, NULL, NULL);
        execl("/bin/ls", "ls", NULL);
        return 1;
    }

    int status;
    waitpid(child, &status, 0);

    // Read registers
    struct user_regs_struct regs;
    ptrace(PTRACE_GETREGS, child, NULL, &regs);
    printf("RIP: 0x%llx\\n", regs.rip);

    // Single-step
    ptrace(PTRACE_SINGLESTEP, child, NULL, NULL);
    waitpid(child, &status, 0);
    ptrace(PTRACE_GETREGS, child, NULL, &regs);
    printf("RIP after step: 0x%llx\\n", regs.rip);

    ptrace(PTRACE_CONT, child, NULL, NULL);
    waitpid(child, &status, 0);
    return 0;
}
\`\`\`

Security implications:
- **Anti-debugging**: malware calls \`ptrace(PTRACE_TRACEME)\` on itself; if a debugger is already attached, this fails, revealing the debugging environment.
- **Code injection**: an attacker with \`ptrace\` access can write shellcode into a target process's memory and redirect \`rip\` to it.
- **Credential theft**: \`ptrace\` can read passwords from the memory of running processes (e.g., \`sshd\`, \`sudo\`).

Mitigations: the \`ptrace_scope\` sysctl (\`/proc/sys/kernel/yama/ptrace_scope\`) restricts who can ptrace whom. Level 1 (default on Ubuntu) allows only parent-child tracing.`,
        sortOrder: 4,
      },
      {
        heading: "Building a Minimal Container Runtime",
        content: `Combining namespaces, cgroups, pivot_root, and seccomp, you can build a basic container runtime in C:

\`\`\`c
// Simplified container setup (pseudocode structure)
int container_main(void *arg) {
    // 1. Set hostname
    sethostname("container", 9);

    // 2. Mount a new root filesystem
    mount("none", "/", NULL, MS_REC | MS_PRIVATE, NULL);
    mount(rootfs_path, rootfs_path, NULL, MS_BIND, NULL);
    // pivot_root to the new root
    mkdir(old_root_path, 0700);
    syscall(SYS_pivot_root, rootfs_path, old_root_path);
    chdir("/");
    umount2(old_root, MNT_DETACH);
    rmdir(old_root);

    // 3. Mount /proc for the new PID namespace
    mount("proc", "/proc", "proc", 0, NULL);

    // 4. Drop capabilities
    drop_caps();

    // 5. Install seccomp filter
    install_seccomp_filter();

    // 6. Exec the contained process
    execve(cmd, argv, envp);
    return 1;
}

int main(int argc, char **argv) {
    char stack[1024 * 1024];
    int flags = CLONE_NEWPID | CLONE_NEWNS | CLONE_NEWUTS
              | CLONE_NEWIPC | CLONE_NEWNET | SIGCHLD;

    pid_t pid = clone(container_main, stack + sizeof(stack),
                      flags, NULL);
    waitpid(pid, NULL, 0);
    return 0;
}
\`\`\`

This is conceptually what Docker's \`runc\` does (in Go, with many more safety checks). Writing it in C gives you a concrete understanding of every layer of container isolation — invaluable for container security assessments and escape research.`,
        sortOrder: 5,
      },
      {
        heading: "Exploit Primitives in Systems Programming",
        content: `At the expert level, systems programming knowledge feeds directly into exploit development:

**Kernel exploitation patterns:**
- Use-after-free in kernel objects (e.g., \`struct file\`, \`struct cred\`) — spray the slab allocator with controlled objects to reclaim the freed slot.
- Race conditions in syscall handlers — use \`userfaultfd\` to pause a kernel thread mid-syscall, creating a wide race window.
- \`ioctl\` handlers with insufficient validation — many kernel vulnerabilities are in device-specific ioctl implementations.

**Useful syscalls for exploit development:**
- \`mprotect\` — change memory permissions (make stack/heap executable)
- \`mmap\` — map memory at specific addresses (for ROP pivot)
- \`clone\` with \`CLONE_FILES\` — share file descriptor table (useful for fd-based attacks)
- \`userfaultfd\` — register a handler for page faults in user memory (kernel race exploitation)
- \`io_uring\` — asynchronous I/O with a shared ring buffer; has been a rich source of kernel vulnerabilities

\`\`\`bash
# Enumerate available syscalls on your system
ausyscall --dump

# Monitor a process's syscalls in real time
strace -fp <pid> -e trace=openat,read,write,mmap,mprotect
\`\`\``,
        sortOrder: 6,
      },
      {
        heading: "Sources",
        content: `- \`man 2 ptrace\`, \`man 2 clone\`, \`man 2 seccomp\`, \`man 2 unshare\`
- \`man 7 namespaces\`, \`man 7 capabilities\`
- Kerrisk, M. *The Linux Programming Interface*, Chapters 38 (Capabilities), 40 (Namespaces)
- "Anatomy of a Container" — https://www.katacoda.com/ (interactive labs)
- seccomp-tools — https://github.com/david942j/seccomp-tools
- Linux kernel source, \`kernel/seccomp.c\` — https://git.kernel.org/
- "Exploiting userfaultfd" — https://blog.lizzie.io/using-userfaultfd.html
- Yama LSM ptrace_scope — https://www.kernel.org/doc/Documentation/security/Yama.txt`,
        sortOrder: 7,
      },
    ],
  },

  // ============================================================
  // algorithms — L0
  // ============================================================
  {
    competencyId: "algorithms",
    depthTier: 0,
    title: "Introduction to Algorithms and Complexity",
    recommendedLevel: 0,
    sections: [
      {
        heading: "What Is an Algorithm",
        content: `An algorithm is a finite sequence of well-defined steps that transforms an input into a desired output. In programming, algorithms solve problems: sorting a list, finding a path, searching a database.

For a cybersecurity student, algorithmic thinking matters because:
- Cryptographic algorithms are the foundation of secure communication.
- Brute-force attacks are fundamentally an algorithmic problem — their feasibility depends on the algorithm's complexity.
- Intrusion-detection systems use pattern-matching algorithms on network traffic.
- Malware analysis involves understanding the algorithms embedded in binaries.`,
        sortOrder: 0,
      },
      {
        heading: "Big-O Notation",
        content: `Big-O notation describes how an algorithm's resource usage (time or space) grows as the input size n increases:

- **O(1)** — constant: accessing an array element by index.
- **O(log n)** — logarithmic: binary search in a sorted array.
- **O(n)** — linear: scanning every element in a list.
- **O(n log n)** — linearithmic: efficient sorting (merge sort, quicksort average case).
- **O(n^2)** — quadratic: naive nested-loop comparisons (bubble sort).
- **O(2^n)** — exponential: brute-forcing an n-bit key.

For security, exponential complexity is both the enemy (makes brute force on passwords slow — good) and the tool (certain attacks are only feasible when a weakness reduces the effective complexity).`,
        sortOrder: 1,
      },
      {
        heading: "Why Complexity Matters in Security",
        content: `Consider password cracking. A 4-digit PIN has 10^4 = 10,000 combinations — trivially brute-forceable. A 128-bit AES key has 2^128 possibilities — computationally infeasible.

Hash functions like SHA-256 are designed so that finding a preimage (an input that produces a given hash) has complexity O(2^256). Collision attacks aim to reduce this: MD5 collisions can be found in O(2^18), which is why MD5 is considered broken for security purposes.

Understanding complexity lets you evaluate whether a security mechanism is genuinely strong or merely appears so.`,
        sortOrder: 2,
      },
      {
        heading: "Sources",
        content: `- Cormen, Leiserson, Rivest, Stein (CLRS), *Introduction to Algorithms*, 4th ed., Chapters 1-3
- Knuth, *The Art of Computer Programming*, Volume 1 (Fundamental Algorithms)
- Schneier, *Applied Cryptography*, Chapter 7 (Key Length and Brute Force)`,
        sortOrder: 3,
      },
    ],
  },

  // ============================================================
  // algorithms — L1
  // ============================================================
  {
    competencyId: "algorithms",
    depthTier: 1,
    title: "Fundamental Sorting and Searching",
    recommendedLevel: 1,
    sections: [
      {
        heading: "Linear and Binary Search",
        content: `**Linear search** checks every element sequentially. Time complexity: O(n). Works on unsorted data.

\`\`\`c
int linear_search(int *arr, int n, int target) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == target)
            return i;
    }
    return -1;
}
\`\`\`

**Binary search** requires a sorted array. It repeatedly halves the search space. Time complexity: O(log n).

\`\`\`c
int binary_search(int *arr, int n, int target) {
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;   // avoids overflow vs (lo+hi)/2
        if (arr[mid] == target)
            return mid;
        else if (arr[mid] < target)
            lo = mid + 1;
        else
            hi = mid - 1;
    }
    return -1;
}
\`\`\`

Note: \`mid = (lo + hi) / 2\` can overflow when \`lo + hi > INT_MAX\`. The safe formula \`lo + (hi - lo) / 2\` avoids this — a real bug that was present in many production binary search implementations for decades (see Joshua Bloch, "Extra, Extra — Read All About It: Nearly All Binary Searches and Mergesorts are Broken").`,
        sortOrder: 0,
      },
      {
        heading: "Bubble Sort and Selection Sort",
        content: `These O(n^2) sorts are simple but inefficient. Know them for understanding, not for production use.

**Bubble sort** repeatedly swaps adjacent out-of-order elements:

\`\`\`c
void bubble_sort(int *arr, int n) {
    for (int i = 0; i < n - 1; i++) {
        int swapped = 0;
        for (int j = 0; j < n - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                int tmp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = tmp;
                swapped = 1;
            }
        }
        if (!swapped) break;  // optimisation: already sorted
    }
}
\`\`\`

**Selection sort** finds the minimum and moves it to the front:

\`\`\`c
void selection_sort(int *arr, int n) {
    for (int i = 0; i < n - 1; i++) {
        int min_idx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[min_idx])
                min_idx = j;
        }
        int tmp = arr[i];
        arr[i] = arr[min_idx];
        arr[min_idx] = tmp;
    }
}
\`\`\`

At 42, the \`push_swap\` project requires sorting with a restricted set of operations on two stacks — understanding these basic sorts helps build intuition, even though the optimal push_swap solution uses different techniques.`,
        sortOrder: 1,
      },
      {
        heading: "Insertion Sort",
        content: `Insertion sort builds a sorted prefix one element at a time, inserting each new element into its correct position:

\`\`\`c
void insertion_sort(int *arr, int n) {
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}
\`\`\`

Insertion sort is O(n^2) worst case but O(n) on nearly-sorted data, making it useful as the base case for hybrid sorts (e.g., Timsort uses insertion sort for small runs). It is also the most efficient simple sort for tiny arrays (n < 10-20) due to low overhead.`,
        sortOrder: 2,
      },
      {
        heading: "Comparing Sort Stability and Security Relevance",
        content: `A sort is **stable** if equal elements maintain their relative order. Bubble sort and insertion sort are stable; selection sort is not.

Stability matters when sorting structured data by multiple keys. In security contexts, log analysis often sorts events by timestamp and then by severity — instability would scramble the time ordering within each severity level.

| Sort           | Best    | Average | Worst   | Stable | Space |
|---------------|---------|---------|---------|--------|-------|
| Bubble        | O(n)    | O(n^2)  | O(n^2)  | Yes    | O(1)  |
| Selection     | O(n^2)  | O(n^2)  | O(n^2)  | No     | O(1)  |
| Insertion     | O(n)    | O(n^2)  | O(n^2)  | Yes    | O(1)  |

For the 42 curriculum, these algorithms are foundational. Efficient sorts (merge sort, quicksort) build on these concepts.`,
        sortOrder: 3,
      },
      {
        heading: "From arrays to more flexible structures",
        content: `Arrays are the simplest way to store a collection, but they have fundamental limitations that motivate the data structures you will learn next:

**Problem 1 — Fixed size.** A C array has a fixed length set at allocation time. If you need more space, you must allocate a new, larger array and copy everything over — an O(n) operation. In contrast, a **linked list** can grow one element at a time by allocating a new node and linking it to the chain, in O(1).

**Problem 2 — Expensive insertion and deletion.** Inserting an element in the middle of an array requires shifting all subsequent elements, costing O(n). A **linked list** can insert or delete at any known position in O(1) by relinking pointers.

**Problem 3 — Slow search by value.** Finding a specific value in an unsorted array requires scanning every element — O(n). A **hash table** maps keys to positions using a hash function, achieving O(1) average-case lookup.

**Problem 4 — No structural constraint.** Sometimes you need a collection that enforces an access pattern: last-in-first-out (**stack**) for undo operations, function calls, and expression parsing, or first-in-first-out (**queue**) for task scheduling and breadth-first traversal.

| Structure    | Insert  | Delete  | Search  | Access by index | Use case |
|-------------|---------|---------|---------|----------------|----------|
| Array       | O(n)*   | O(n)*   | O(n)    | O(1)           | Random access, known size |
| Linked list | O(1)**  | O(1)**  | O(n)    | O(n)           | Frequent insert/delete, unknown size |
| Hash table  | O(1)*** | O(1)*** | O(1)*** | —              | Fast key-based lookup |
| Stack       | O(1)    | O(1)    | —       | top only        | LIFO: call stacks, undo, parsing |
| Queue       | O(1)    | O(1)    | —       | front only      | FIFO: scheduling, BFS |

\\* Middle insertion/deletion. Appending to the end is O(1) amortised.
\\*\\* At a known position (given a pointer to the node).
\\*\\*\\* Average case; worst case is O(n) with hash collisions.

The next resource covers each of these structures in detail with C implementations, along with the efficient O(n log n) sorting algorithms that leverage divide-and-conquer.`,
        sortOrder: 4,
      },
      {
        heading: "Sources",
        content: `- Cormen et al. (CLRS), *Introduction to Algorithms*, Chapters 2 (Insertion Sort), 7 (Quicksort), 8 (Sorting in Linear Time)
- Bloch, J. "Extra, Extra — Read All About It: Nearly All Binary Searches and Mergesorts are Broken" — https://ai.googleblog.com/2006/06/extra-extra-read-all-about-it-nearly.html
- Sedgewick, R. *Algorithms*, 4th ed., Chapter 2 (Sorting)`,
        sortOrder: 5,
      },
    ],
  },

  // ============================================================
  // algorithms — L2
  // ============================================================
  {
    competencyId: "algorithms",
    depthTier: 2,
    title: "Efficient Sorting and Core Data Structures",
    recommendedLevel: 2,
    sections: [
      {
        heading: "Merge Sort",
        content: `Merge sort divides the array in half, recursively sorts each half, and merges the sorted halves. It guarantees O(n log n) time in all cases.

\`\`\`c
void merge(int *arr, int *tmp, int left, int mid, int right) {
    int i = left, j = mid + 1, k = left;
    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j])
            tmp[k++] = arr[i++];
        else
            tmp[k++] = arr[j++];
    }
    while (i <= mid)
        tmp[k++] = arr[i++];
    while (j <= right)
        tmp[k++] = arr[j++];
    for (int x = left; x <= right; x++)
        arr[x] = tmp[x];
}

void merge_sort_rec(int *arr, int *tmp, int left, int right) {
    if (left >= right) return;
    int mid = left + (right - left) / 2;
    merge_sort_rec(arr, tmp, left, mid);
    merge_sort_rec(arr, tmp, mid + 1, right);
    merge(arr, tmp, left, mid, right);
}

void merge_sort(int *arr, int n) {
    int *tmp = malloc(n * sizeof(int));
    if (!tmp) return;
    merge_sort_rec(arr, tmp, 0, n - 1);
    free(tmp);
}
\`\`\`

Merge sort is stable and uses O(n) extra space. It is the basis for external sorting (sorting data that does not fit in memory) because it accesses data sequentially, which is efficient for disk I/O.`,
        sortOrder: 0,
      },
      {
        heading: "Quicksort",
        content: `Quicksort selects a pivot, partitions the array so that elements less than the pivot come before it and elements greater come after, then recursively sorts the partitions:

\`\`\`c
int partition(int *arr, int lo, int hi) {
    int pivot = arr[hi];
    int i = lo - 1;
    for (int j = lo; j < hi; j++) {
        if (arr[j] < pivot) {
            i++;
            int tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
    }
    int tmp = arr[i + 1]; arr[i + 1] = arr[hi]; arr[hi] = tmp;
    return i + 1;
}

void quicksort(int *arr, int lo, int hi) {
    if (lo >= hi) return;
    int p = partition(arr, lo, hi);
    quicksort(arr, lo, p - 1);
    quicksort(arr, p + 1, hi);
}
\`\`\`

Quicksort is O(n log n) on average but O(n^2) in the worst case (when the pivot is always the smallest or largest element). Mitigation: use median-of-three pivot selection or randomize the pivot.

Security note: an attacker who controls the input to a quicksort with a predictable pivot can craft adversarial data that triggers the O(n^2) worst case, causing a denial-of-service. This is why hash-table implementations (which use sorting/comparison internally) use randomized hash functions.`,
        sortOrder: 1,
      },
      {
        heading: "Linked Lists",
        content: `A singly linked list stores elements in nodes, where each node holds a value and a pointer to the next node:

\`\`\`c
typedef struct s_node {
    int             data;
    struct s_node  *next;
} t_node;

t_node *new_node(int data) {
    t_node *node = malloc(sizeof(t_node));
    if (!node) return NULL;
    node->data = data;
    node->next = NULL;
    return node;
}

void push_front(t_node **head, int data) {
    t_node *node = new_node(data);
    node->next = *head;
    *head = node;
}

void free_list(t_node *head) {
    while (head) {
        t_node *tmp = head;
        head = head->next;
        free(tmp);
    }
}
\`\`\`

Linked lists are central to 42 projects (libft, push_swap). They allow O(1) insertion/deletion at the head but O(n) random access. For the push_swap project, implementing stacks as linked lists (with push/pop/rotate/reverse-rotate operations) is the typical approach.

Security relevance: the heap metadata structures in glibc's malloc are essentially linked lists. Understanding how to manipulate linked-list pointers is directly applicable to heap exploitation.`,
        sortOrder: 2,
      },
      {
        heading: "Stacks and Queues",
        content: `A **stack** is a LIFO (last-in, first-out) data structure. Operations: push (add to top), pop (remove from top), peek (view top without removing).

A **queue** is a FIFO (first-in, first-out) data structure. Operations: enqueue (add to back), dequeue (remove from front).

Both can be implemented with linked lists or arrays:

\`\`\`c
// Array-based stack
typedef struct s_stack {
    int *data;
    int  top;
    int  capacity;
} t_stack;

void stack_push(t_stack *s, int val) {
    if (s->top >= s->capacity - 1) return; // overflow check
    s->data[++s->top] = val;
}

int stack_pop(t_stack *s) {
    if (s->top < 0) return -1;  // underflow
    return s->data[s->top--];
}
\`\`\`

Stacks are used in function-call mechanics (the call stack), expression evaluation, and depth-first search. Queues are used in breadth-first search and scheduling.

In security: the program's call stack is a literal stack data structure. Understanding stacks is prerequisite for understanding stack-based buffer overflows and return-oriented programming.`,
        sortOrder: 3,
      },
      {
        heading: "Hash Tables",
        content: `A hash table maps keys to values using a hash function. Average-case O(1) lookup, insertion, and deletion.

\`\`\`c
#define TABLE_SIZE 1024

typedef struct s_entry {
    char            *key;
    void            *value;
    struct s_entry  *next;   // chaining for collisions
} t_entry;

typedef struct s_htable {
    t_entry *buckets[TABLE_SIZE];
} t_htable;

unsigned int hash(const char *key) {
    unsigned int h = 5381;
    while (*key)
        h = ((h << 5) + h) + (unsigned char)*key++;
    return h % TABLE_SIZE;
}

void ht_set(t_htable *ht, const char *key, void *value) {
    unsigned int idx = hash(key);
    t_entry *entry = malloc(sizeof(t_entry));
    entry->key   = strdup(key);
    entry->value = value;
    entry->next  = ht->buckets[idx];
    ht->buckets[idx] = entry;
}
\`\`\`

The hash function djb2 (shown above) is simple and fast. For security-sensitive applications, use a keyed hash function like SipHash to prevent hash-flooding denial-of-service attacks (where an attacker crafts inputs that all hash to the same bucket, degrading O(1) to O(n)).`,
        sortOrder: 4,
      },
      {
        heading: "Choosing the Right Data Structure",
        content: `The choice of data structure determines your algorithm's performance:

| Operation        | Array | Linked List | Hash Table | BST (balanced) |
|-----------------|-------|-------------|------------|----------------|
| Access by index | O(1)  | O(n)        | N/A        | N/A            |
| Search          | O(n)  | O(n)        | O(1) avg   | O(log n)       |
| Insert (front)  | O(n)  | O(1)        | O(1) avg   | O(log n)       |
| Insert (end)    | O(1)* | O(n)        | O(1) avg   | O(log n)       |
| Delete          | O(n)  | O(1)**      | O(1) avg   | O(log n)       |

*amortized with dynamic resizing; **given a pointer to the node

For 42 projects, linked lists and arrays cover most needs. Hash tables appear in \`minishell\` (environment variables) and parsers. Binary search trees appear in more advanced projects.`,
        sortOrder: 5,
      },
      {
        heading: "Floyd's cycle detection (tortoise and hare)",
        content: `Floyd's algorithm detects a cycle in a linked list using two pointers — one moving one step at a time (tortoise), the other two steps (hare). If there is a cycle, they will eventually meet.\n\n\`\`\`mermaid\nflowchart LR\n    A((1)) --> B((2)) --> C((3)) --> D((4)) --> E((5)) --> F((6))\n    F --> C\n    style C fill:#e8a840,color:#000\n    style F fill:#e8a840,color:#000\n\`\`\`\n\n\`\`\`c\n// Returns the node where the cycle begins, or NULL\nt_list *detect_cycle(t_list *head) {\n    t_list *slow = head;\n    t_list *fast = head;\n\n    // Phase 1: detect if cycle exists\n    while (fast && fast->next) {\n        slow = slow->next;          // 1 step\n        fast = fast->next->next;    // 2 steps\n        if (slow == fast)\n            break;  // they meet inside the cycle\n    }\n    if (!fast || !fast->next)\n        return NULL; // no cycle\n\n    // Phase 2: find cycle start\n    // Move one pointer back to head, advance both by 1\n    slow = head;\n    while (slow != fast) {\n        slow = slow->next;\n        fast = fast->next;\n    }\n    return slow; // cycle start\n}\n\`\`\`\n\n**Why it works**: let d = distance from head to cycle start, c = cycle length. When they first meet, the tortoise has traveled d + k steps and the hare 2(d + k) steps. The difference (d + k) is a multiple of c. Resetting one pointer to head and advancing both by 1, they meet at exactly the cycle start after d more steps.\n\n**Complexity**: O(n) time, O(1) space — the key advantage over using a hash set (O(n) space).\n\nSource: Floyd, R.W. "Non-deterministic Algorithms" (1967); Knuth, *The Art of Computer Programming* Vol. 2, §3.1, Exercise 6`,
        sortOrder: 6,
      },
      {
        heading: "Sources",
        content: `- Cormen et al. (CLRS), *Introduction to Algorithms*, Chapters 2 (Merge Sort), 7 (Quicksort), 11 (Hash Tables)
- Bernstein, D.J. "SipHash: a fast short-input PRF" — https://cr.yp.to/siphash.html
- "Algorithmic Complexity Attacks" — Crosby & Wallach, USENIX Security 2003
- Sedgewick, R. *Algorithms*, 4th ed., Chapters 2-3`,
        sortOrder: 6,
      },
    ],
  },

  // ============================================================
  // algorithms — L3
  // ============================================================
  {
    competencyId: "algorithms",
    depthTier: 3,
    title: "Graph Algorithms and Dynamic Programming",
    recommendedLevel: 3,
    sections: [
      {
        heading: "Graph Representations",
        content: `A graph consists of vertices (nodes) and edges (connections). Two standard representations:

**Adjacency matrix** — a 2D array where \`matrix[i][j] = 1\` if there is an edge from vertex i to vertex j. O(V^2) space, O(1) edge lookup, but wasteful for sparse graphs.

**Adjacency list** — an array of linked lists, where \`adj[i]\` lists all vertices adjacent to i. O(V + E) space, efficient for sparse graphs.

\`\`\`c
// Adjacency list representation
typedef struct s_edge {
    int             dest;
    int             weight;
    struct s_edge  *next;
} t_edge;

typedef struct s_graph {
    int      n_vertices;
    t_edge **adj;  // array of linked lists
} t_graph;

void add_edge(t_graph *g, int src, int dest, int weight) {
    t_edge *edge = malloc(sizeof(t_edge));
    edge->dest   = dest;
    edge->weight = weight;
    edge->next   = g->adj[src];
    g->adj[src]  = edge;
}
\`\`\`

For security applications, network topologies are naturally modelled as graphs. The 42 \`lem-in\` project (finding paths through a graph for ant colony simulation) is a direct application.`,
        sortOrder: 0,
      },
      {
        heading: "Breadth-First Search (BFS)",
        content: `BFS explores a graph level by level, finding the shortest path in unweighted graphs:

\`\`\`c
void bfs(t_graph *g, int start) {
    int *visited = calloc(g->n_vertices, sizeof(int));
    int *queue   = malloc(g->n_vertices * sizeof(int));
    int  front = 0, back = 0;

    visited[start] = 1;
    queue[back++] = start;

    while (front < back) {
        int v = queue[front++];
        printf("Visited: %d\\n", v);
        for (t_edge *e = g->adj[v]; e; e = e->next) {
            if (!visited[e->dest]) {
                visited[e->dest] = 1;
                queue[back++] = e->dest;
            }
        }
    }
    free(visited);
    free(queue);
}
\`\`\`

Time complexity: O(V + E). BFS is used in:
- Network scanning (discovering hosts at each hop distance)
- Finding shortest paths in unweighted networks
- Web crawling (level-order traversal of the link graph)
- The 42 \`lem-in\` project for finding shortest/augmenting paths`,
        sortOrder: 1,
      },
      {
        heading: "Depth-First Search (DFS)",
        content: `DFS explores as deep as possible along each branch before backtracking:

\`\`\`c
void dfs_recursive(t_graph *g, int v, int *visited) {
    visited[v] = 1;
    printf("Visited: %d\\n", v);
    for (t_edge *e = g->adj[v]; e; e = e->next) {
        if (!visited[e->dest])
            dfs_recursive(g, e->dest, visited);
    }
}

// Iterative version using an explicit stack
void dfs_iterative(t_graph *g, int start) {
    int *visited = calloc(g->n_vertices, sizeof(int));
    int *stack   = malloc(g->n_vertices * sizeof(int));
    int  top     = 0;

    stack[top++] = start;
    while (top > 0) {
        int v = stack[--top];
        if (visited[v]) continue;
        visited[v] = 1;
        printf("Visited: %d\\n", v);
        for (t_edge *e = g->adj[v]; e; e = e->next) {
            if (!visited[e->dest])
                stack[top++] = e->dest;
        }
    }
    free(visited);
    free(stack);
}
\`\`\`

DFS applications:
- **Cycle detection** — a back edge during DFS indicates a cycle.
- **Topological sort** — ordering tasks with dependencies (e.g., build systems, makefile dependency resolution).
- **Connected components** — in network analysis, identifying isolated subnetworks.`,
        sortOrder: 2,
      },
      {
        heading: "Dijkstra's Algorithm",
        content: `Dijkstra's finds shortest paths from a source vertex in a weighted graph with non-negative edges:

\`\`\`c
#include <limits.h>

void dijkstra(t_graph *g, int src, int *dist) {
    int *visited = calloc(g->n_vertices, sizeof(int));
    for (int i = 0; i < g->n_vertices; i++)
        dist[i] = INT_MAX;
    dist[src] = 0;

    for (int count = 0; count < g->n_vertices; count++) {
        // Find unvisited vertex with minimum distance
        int u = -1;
        for (int i = 0; i < g->n_vertices; i++) {
            if (!visited[i] && (u == -1 || dist[i] < dist[u]))
                u = i;
        }
        if (dist[u] == INT_MAX) break;
        visited[u] = 1;

        // Relax edges
        for (t_edge *e = g->adj[u]; e; e = e->next) {
            if (!visited[e->dest] && dist[u] + e->weight < dist[e->dest])
                dist[e->dest] = dist[u] + e->weight;
        }
    }
    free(visited);
}
\`\`\`

This naive version is O(V^2). Using a min-heap (priority queue) reduces it to O((V + E) log V).

Security application: network routing protocols (OSPF) use Dijkstra's algorithm. Understanding it helps in analysing routing attacks and network topology manipulation.`,
        sortOrder: 3,
      },
      {
        heading: "Introduction to Dynamic Programming",
        content: `Dynamic programming (DP) solves problems by breaking them into overlapping subproblems and storing results to avoid redundant computation. Two approaches:

1. **Top-down (memoization)** — recursive with a cache.
2. **Bottom-up (tabulation)** — iterative, building solutions from smallest subproblems.

Classic example: Fibonacci numbers.

\`\`\`c
// Naive recursive: O(2^n) — exponentially slow
int fib_naive(int n) {
    if (n <= 1) return n;
    return fib_naive(n - 1) + fib_naive(n - 2);
}

// Bottom-up DP: O(n) time, O(1) space
int fib_dp(int n) {
    if (n <= 1) return n;
    int prev2 = 0, prev1 = 1;
    for (int i = 2; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
\`\`\`

DP is critical for:
- **Longest common subsequence** — used in diff tools and plagiarism detection.
- **Knapsack problems** — resource allocation under constraints.
- **Edit distance** — string similarity, used in fuzzy matching and intrusion detection signatures.`,
        sortOrder: 4,
      },
      {
        heading: "Max-Flow and the lem-in Connection",
        content: `The max-flow problem finds the maximum amount of flow that can be sent from a source to a sink in a flow network. The Ford-Fulkerson method uses augmenting paths (found via BFS in the Edmonds-Karp variant):

1. Find a path from source to sink in the residual graph (BFS).
2. Find the minimum capacity along that path (the bottleneck).
3. Update capacities: subtract the bottleneck along forward edges, add it along reverse edges.
4. Repeat until no augmenting path exists.

The 42 \`lem-in\` project is essentially a max-flow / multi-path problem: find the set of paths through a graph that minimizes the total number of turns for all ants to traverse from start to end. The Edmonds-Karp algorithm (BFS-based Ford-Fulkerson) with O(VE^2) complexity is a standard approach.

This connects to network security: max-flow models can determine the bottleneck bandwidth in a network, identify critical links whose failure disconnects the network, and optimise traffic distribution.`,
        sortOrder: 5,
      },
      {
        heading: "Sources",
        content: `- Cormen et al. (CLRS), *Introduction to Algorithms*, Chapters 22 (BFS/DFS), 24 (Dijkstra), 15 (Dynamic Programming), 26 (Max Flow)
- Sedgewick, R. *Algorithms*, 4th ed., Chapter 4 (Graphs)
- Edmonds, J. & Karp, R.M. "Theoretical Improvements in Algorithmic Efficiency for Network Flow Problems" (1972)
- POSIX.1-2017 (for relating graph algorithms to network routing)`,
        sortOrder: 6,
      },
    ],
  },

  // ============================================================
  // algorithms — L4
  // ============================================================
  {
    competencyId: "algorithms",
    depthTier: 4,
    title: "Advanced Algorithmic Techniques and Push_swap Strategies",
    recommendedLevel: 4,
    sections: [
      {
        heading: "The Push_swap Problem",
        content: `The 42 \`push_swap\` project asks you to sort a sequence of integers using two stacks (\`a\` and \`b\`) and a limited set of operations:

- \`sa\` / \`sb\` — swap the top two elements of stack a/b
- \`pa\` / \`pb\` — push the top of b onto a / push the top of a onto b
- \`ra\` / \`rb\` — rotate: top element goes to the bottom
- \`rra\` / \`rrb\` — reverse rotate: bottom element goes to the top
- \`ss\`, \`rr\`, \`rrr\` — combined operations on both stacks

The goal is to sort the entire sequence into stack \`a\` in ascending order, using as few operations as possible. For 100 numbers, under 700 operations is the target; for 500 numbers, under 5500.

This is an algorithmic optimisation problem: you need to find a sorting strategy that produces near-optimal operation counts with the given primitives.`,
        sortOrder: 0,
      },
      {
        heading: "Chunk-Based Sorting for Push_swap",
        content: `The most common efficient approach for push_swap with large inputs is chunk-based sorting:

1. **Normalize** — replace the input values with their rank (0 to n-1) to simplify comparisons.
2. **Partition into chunks** — divide the ranks into equal-sized chunks. For 500 elements, 10-15 chunks works well.
3. **Push to stack B** — iterate through stack A; if the current top's rank falls in the current chunk range, push it to B. Use rotations to access elements efficiently.
4. **Greedy insertion back to A** — find the element in B that requires the fewest combined rotations to reach the top of B and be inserted in the correct position in A.

\`\`\`c
// Normalisation: replace values with ranks
void normalise(int *values, int *ranks, int n) {
    for (int i = 0; i < n; i++) {
        int rank = 0;
        for (int j = 0; j < n; j++) {
            if (values[j] < values[i])
                rank++;
        }
        ranks[i] = rank;
    }
}

// Determine optimal rotation direction and count
int cost_to_top(int pos, int size) {
    if (pos <= size / 2)
        return pos;        // rotate forward
    return -(size - pos);  // rotate backward (negative = reverse)
}
\`\`\`

The chunk size is a tunable parameter. Experimentally, sqrt(n) * 1.3 is a reasonable starting point for the number of elements per chunk.`,
        sortOrder: 1,
      },
      {
        heading: "Radix Sort Approach",
        content: `An alternative push_swap strategy uses bitwise radix sort:

1. Sort by the least significant bit: push elements with bit 0 == 0 to stack B, leave bit 0 == 1 in A. Then push everything from B back to A.
2. Repeat for the next bit, until all bits are processed.

\`\`\`c
void radix_sort_pushswap(t_stack *a, t_stack *b, int n) {
    int max_bits = 0;
    while ((n - 1) >> max_bits)
        max_bits++;

    for (int bit = 0; bit < max_bits; bit++) {
        int size = stack_size(a);
        for (int i = 0; i < size; i++) {
            int top = stack_top(a);
            if ((top >> bit) & 1)
                ra(a);   // bit is 1: keep in a (rotate to bottom)
            else
                pb(a, b); // bit is 0: push to b
        }
        // Push everything from b back to a
        while (stack_size(b) > 0)
            pa(a, b);
    }
}
\`\`\`

This uses approximately n × number_of_bits × 2 operations (each bit-pass does ~2n moves). For 500 numbers (9 bits needed), that is roughly 500 × 9 × 2 ≈ 9000 operations — not optimal, but the implementation is simple and the operation count is predictable.`,
        sortOrder: 2,
      },
      {
        heading: "Balanced Binary Search Trees",
        content: `Balanced BSTs (AVL trees, red-black trees) guarantee O(log n) operations. An AVL tree maintains the invariant that for every node, the heights of the left and right subtrees differ by at most 1.

\`\`\`c
typedef struct s_avl {
    int             value;
    int             height;
    struct s_avl   *left;
    struct s_avl   *right;
} t_avl;

int height(t_avl *node) {
    return node ? node->height : 0;
}

int balance_factor(t_avl *node) {
    return height(node->left) - height(node->right);
}

t_avl *rotate_right(t_avl *y) {
    t_avl *x  = y->left;
    t_avl *T2 = x->right;
    x->right  = y;
    y->left   = T2;
    y->height = 1 + (height(y->left) > height(y->right) ?
                      height(y->left) : height(y->right));
    x->height = 1 + (height(x->left) > height(x->right) ?
                      height(x->left) : height(x->right));
    return x;
}
\`\`\`

Red-black trees are used in the Linux kernel (e.g., for virtual memory area management in \`mm_struct\`), the C++ STL (\`std::map\`, \`std::set\`), and many database indices.

For security: binary search trees can be targets of algorithmic complexity attacks. If an attacker controls insertions into an unbalanced BST, they can degrade it to a linked list (O(n) operations), causing denial of service. Self-balancing trees prevent this.`,
        sortOrder: 3,
      },
      {
        heading: "Heap Data Structure and Priority Queues",
        content: `A binary heap is a complete binary tree where each node is smaller (min-heap) or larger (max-heap) than its children. It supports O(log n) insertion and extraction of the minimum/maximum.

\`\`\`c
typedef struct s_heap {
    int *data;
    int  size;
    int  capacity;
} t_heap;

void heap_push(t_heap *h, int val) {
    h->data[h->size] = val;
    int i = h->size++;
    // Sift up
    while (i > 0) {
        int parent = (i - 1) / 2;
        if (h->data[parent] <= h->data[i]) break;
        int tmp = h->data[parent];
        h->data[parent] = h->data[i];
        h->data[i] = tmp;
        i = parent;
    }
}

int heap_pop(t_heap *h) {
    int min = h->data[0];
    h->data[0] = h->data[--h->size];
    int i = 0;
    // Sift down
    while (2 * i + 1 < h->size) {
        int child = 2 * i + 1;
        if (child + 1 < h->size && h->data[child + 1] < h->data[child])
            child++;
        if (h->data[i] <= h->data[child]) break;
        int tmp = h->data[i];
        h->data[i] = h->data[child];
        h->data[child] = tmp;
        i = child;
    }
    return min;
}
\`\`\`

Heaps are used for:
- **Heap sort** — O(n log n), in-place, not stable.
- **Priority queues** — Dijkstra's algorithm uses a min-heap.
- **Event scheduling** — OS schedulers often use heaps to select the next process to run.`,
        sortOrder: 4,
      },
      {
        heading: "Greedy Algorithms",
        content: `A greedy algorithm makes the locally optimal choice at each step, hoping to find the global optimum. Greedy works when the problem has the **greedy-choice property** (a locally optimal choice leads to a globally optimal solution) and **optimal substructure**.

Classic examples:

**Activity selection** — given activities with start and end times, select the maximum number of non-overlapping activities. Sort by end time, then greedily select the earliest-finishing activity that does not conflict:

\`\`\`c
int activity_selection(int *start, int *end, int n) {
    // Assume sorted by end time
    int count = 1;
    int last_end = end[0];
    for (int i = 1; i < n; i++) {
        if (start[i] >= last_end) {
            count++;
            last_end = end[i];
        }
    }
    return count;
}
\`\`\`

**Huffman coding** — build an optimal prefix code for data compression. This is used in gzip, DEFLATE, and JPEG. The algorithm repeatedly merges the two lowest-frequency nodes, which can be efficiently implemented with a min-heap.

In push_swap, the greedy insertion phase (finding the element in B with the lowest combined rotation cost) is a greedy strategy applied to each insertion step.`,
        sortOrder: 5,
      },
      {
        heading: "Amortised Analysis and Real-World Complexity",
        content: `Some operations have different worst-case and amortised costs. A dynamic array (\`realloc\` doubling strategy) has O(n) worst-case for a single insertion (when resizing) but O(1) amortised across n insertions.

Understanding amortised analysis is important for:
- Evaluating the real performance of data structures (hash table resizing, splay trees).
- Reasoning about security: a DoS attack targeting the worst case of an operation with good amortised but poor worst-case complexity can be devastating.

Techniques:
1. **Aggregate method** — total cost of n operations divided by n.
2. **Accounting method** — assign each operation a "charge"; excess charges "pay for" expensive future operations.
3. **Potential method** — define a potential function over the data structure; actual cost + change in potential = amortised cost.

Example: for a dynamic array that doubles on overflow, the amortised cost of append is 3 units (each element pays for its own copy plus helping copy two elements during future resize operations).`,
        sortOrder: 6,
      },
      {
        heading: "Bloom filters",
        content: `A Bloom filter is a space-efficient probabilistic data structure for set membership testing. It can say "definitely not in set" or "probably in set" — false positives are possible, false negatives are not.\n\n\`\`\`mermaid\nflowchart LR\n    subgraph Insert x\n        X[x] --> H1[h1 x = 2]\n        X --> H2[h2 x = 5]\n        X --> H3[h3 x = 9]\n    end\n    subgraph Bit Array m=12\n        B["0 0 1 0 0 1 0 0 0 1 0 0"]\n    end\n    H1 -->|set bit 2| B\n    H2 -->|set bit 5| B\n    H3 -->|set bit 9| B\n\`\`\`\n\n**How it works**:\n1. Allocate a bit array of m bits, all initialized to 0\n2. Choose k independent hash functions, each mapping to [0, m)\n3. **Insert**: hash the element with all k functions, set those k bits to 1\n4. **Query**: hash the element with all k functions — if all k bits are 1, "probably in set"; if any bit is 0, "definitely not in set"\n\n**Sizing formula** (from Bloom, 1970):\n- m = -(n × ln(p)) / (ln2)² where n = expected elements, p = desired false positive rate\n- k = (m/n) × ln2 (optimal number of hash functions)\n- For n=10M, p=1%: m ≈ 95.8M bits ≈ **~12 MB**, k = 7\n- Rule of thumb: ~9.6 bits per element for 1% FP rate\n\n\`\`\`c\n// Minimal Bloom filter implementation\ntypedef struct {\n    uint8_t *bits;\n    size_t   m; // number of bits\n    size_t   k; // number of hash functions\n} bloom_t;\n\nvoid bloom_insert(bloom_t *bf, const void *key, size_t len) {\n    for (size_t i = 0; i < bf->k; i++) {\n        uint64_t h = murmurhash3(key, len, i); // seed = i\n        bf->bits[(h % bf->m) / 8] |= 1 << (h % bf->m % 8);\n    }\n}\n\nbool bloom_query(bloom_t *bf, const void *key, size_t len) {\n    for (size_t i = 0; i < bf->k; i++) {\n        uint64_t h = murmurhash3(key, len, i);\n        if (!(bf->bits[(h % bf->m) / 8] & (1 << (h % bf->m % 8))))\n            return false; // definitely not in set\n    }\n    return true; // probably in set\n}\n\`\`\`\n\n**Security applications**: malware signature prefiltering, safe browsing URL checks (Chrome uses a Bloom filter for malicious URLs), spam filtering, network intrusion detection.\n\nSource: Bloom, B.H. "Space/Time Trade-offs in Hash Coding with Allowable Errors" (CACM, 1970); Mitzenmacher & Upfal, *Probability and Computing*, Ch. 5`,
        sortOrder: 7,
      },
      {
        heading: "Sources",
        content: `- Cormen et al. (CLRS), *Introduction to Algorithms*, Chapters 6 (Heapsort), 13 (Red-Black Trees), 15 (Dynamic Programming), 16 (Greedy), 17 (Amortised Analysis)
- 42 push_swap tester — https://github.com/LeoFu9487/push_swap_tester
- Huffman, D.A. "A Method for the Construction of Minimum-Redundancy Codes" (1952)
- Tarjan, R.E. "Amortized Computational Complexity" (SIAM J. on Algebraic and Discrete Methods, 1985)`,
        sortOrder: 7,
      },
    ],
  },

  // ============================================================
  // algorithms — L5
  // ============================================================
  {
    competencyId: "algorithms",
    depthTier: 5,
    title: "Algorithmic Complexity Theory and Security Applications",
    recommendedLevel: 5,
    sections: [
      {
        heading: "Computational Complexity Classes",
        content: `Complexity theory classifies problems by the resources required to solve them:

- **P** — problems solvable in polynomial time by a deterministic Turing machine. Examples: sorting, shortest path, maximum matching.
- **NP** — problems whose solutions can be verified in polynomial time. Examples: SAT, graph colouring, Hamiltonian path.
- **NP-complete** — the hardest problems in NP; every NP problem can be reduced to them in polynomial time. If any NP-complete problem is in P, then P = NP.
- **NP-hard** — at least as hard as NP-complete, but not necessarily in NP (the solution may not even be verifiable in polynomial time).

The P vs NP question is the most important open problem in computer science. Modern cryptography relies on the assumption that certain problems (factoring, discrete logarithm) are not in P.

If P = NP were proven, RSA, Diffie-Hellman, and elliptic-curve cryptography would all be broken in polynomial time. Conversely, if P != NP, these systems are secure against classical computers (though quantum computers running Shor's algorithm are a separate threat to factoring and discrete-log-based schemes).`,
        sortOrder: 0,
      },
      {
        heading: "Reductions and NP-Completeness Proofs",
        content: `A **reduction** from problem A to problem B transforms instances of A into instances of B in polynomial time, proving that B is at least as hard as A.

The canonical NP-complete problem is **Boolean satisfiability (SAT)**: given a Boolean formula, is there an assignment of variables that makes it true? Cook's theorem (1971) proves SAT is NP-complete.

To prove a new problem X is NP-complete:
1. Show X is in NP (a proposed solution can be verified in polynomial time).
2. Reduce a known NP-complete problem to X in polynomial time.

\`\`\`
Example: Reduce 3-SAT to Independent Set

Given a 3-SAT formula with k clauses:
- Create a triangle (3-vertex clique) for each clause
- Add edges between complementary literals across triangles
- The formula is satisfiable iff the graph has an independent set of size k
\`\`\`

For security: many resource-allocation and optimisation problems in network security are NP-hard (optimal IDS rule placement, minimum vertex cut for network partitioning). Knowing a problem is NP-hard tells you that exact solutions are infeasible for large inputs, and you should use heuristics or approximation algorithms.`,
        sortOrder: 1,
      },
      {
        heading: "Algorithmic Attacks on Cryptographic Primitives",
        content: `Cryptanalysis is fundamentally algorithmic — finding faster-than-brute-force methods to break cryptographic schemes:

**Birthday attack on hash functions** — finding a collision in an n-bit hash requires approximately 2^(n/2) evaluations, not 2^n. This is why SHA-256 (256 bits) provides only 128 bits of collision resistance.

**Pollard's rho for discrete logarithm** — finds discrete logarithms in O(sqrt(p)) time and O(1) space, where p is the group order. Uses cycle detection (Floyd's tortoise-and-hare algorithm):

\`\`\`c
// Simplified Pollard's rho structure
typedef struct {
    long long x;
    long long a;
    long long b;
} point_t;

point_t step(point_t pt, long long g, long long h, long long p, long long n) {
    // Partition into 3 sets based on x mod 3
    switch (pt.x % 3) {
        case 0: pt.x = (pt.x * h) % p; pt.b = (pt.b + 1) % n; break;
        case 1: pt.x = (pt.x * pt.x) % p; pt.a = (pt.a * 2) % n;
                pt.b = (pt.b * 2) % n; break;
        case 2: pt.x = (pt.x * g) % p; pt.a = (pt.a + 1) % n; break;
    }
    return pt;
}
\`\`\`

**Number field sieve (NFS)** — the fastest known algorithm for factoring large integers, with sub-exponential complexity L(1/3, (64/9)^(1/3)). It determines the key sizes needed for RSA: 2048-bit RSA is considered secure because NFS is too slow to factor it with current resources.

These algorithms define the boundary between "secure" and "broken" for every cryptographic system in use.`,
        sortOrder: 2,
      },
      {
        heading: "Algorithmic Complexity Attacks (HashDoS)",
        content: `When a data structure's worst-case complexity is significantly worse than its average case, an attacker who controls the input can trigger the worst case, causing denial of service.

**Hash table flooding** (CVE-2011-4815, CVE-2012-5371, and many others): if the hash function is predictable, an attacker crafts inputs that all hash to the same bucket, degrading O(1) operations to O(n). With n controlled insertions, the total time becomes O(n^2).

\`\`\`c
// Vulnerable: deterministic hash
unsigned int bad_hash(const char *key) {
    unsigned int h = 0;
    while (*key)
        h = h * 31 + *key++;
    return h;
}
// Attacker can precompute collisions for this hash function

// Secure: keyed hash (SipHash)
// Initialised with a random key at program startup
uint64_t siphash(const void *in, size_t len, const uint8_t key[16]);
\`\`\`

**Regular expression denial of service (ReDoS)**: backtracking regex engines have exponential worst-case complexity on crafted inputs. The regex \`(a+)+$\` on the input "aaaaaaaaaaaaaaaaX" causes catastrophic backtracking.

Mitigations:
- Use keyed/randomised hash functions (SipHash, xxHash with random seed).
- Use non-backtracking regex engines (RE2, Rust's regex crate).
- Set timeouts on computationally expensive operations.
- Use cgroups or rlimits to bound CPU usage per request.`,
        sortOrder: 3,
      },
      {
        heading: "Approximation Algorithms and Heuristics",
        content: `For NP-hard problems, we settle for approximate solutions with provable guarantees:

- A **2-approximation** for vertex cover: greedily select edges and include both endpoints. The result is at most twice the optimal size.
- A **(1 + epsilon)-approximation** for the knapsack problem using dynamic programming on rounded values: polynomial time for any fixed epsilon > 0 (an FPTAS — fully polynomial-time approximation scheme).

In security, approximation algorithms appear in:

1. **Intrusion detection rule optimisation** — selecting a subset of rules that maximises coverage while minimising false positives (a variant of set cover, which has a known ln(n)-approximation).

2. **Network vulnerability scanning** — prioritising which hosts to scan first when time is limited (a scheduling/coverage optimisation problem).

3. **Fuzzing** — coverage-guided fuzzers like AFL use heuristics (genetic algorithms, simulated annealing) to maximise code coverage, which is fundamentally an NP-hard problem (maximising the number of paths explored in a program's control-flow graph).

\`\`\`c
// Greedy 2-approximation for vertex cover
int vertex_cover_approx(t_graph *g) {
    int *covered = calloc(g->n_vertices, sizeof(int));
    int  count   = 0;

    for (int u = 0; u < g->n_vertices; u++) {
        for (t_edge *e = g->adj[u]; e; e = e->next) {
            int v = e->dest;
            if (!covered[u] && !covered[v]) {
                covered[u] = 1;
                covered[v] = 1;
                count += 2;
            }
        }
    }
    free(covered);
    return count;
}
\`\`\``,
        sortOrder: 4,
      },
      {
        heading: "Randomised Algorithms",
        content: `Randomisation is a powerful algorithmic technique with direct security applications:

**Monte Carlo algorithms** — may produce incorrect results with small probability but always run in bounded time. Example: Miller-Rabin primality test.

**Las Vegas algorithms** — always produce correct results but have randomised running time. Example: randomized quicksort (expected O(n log n), always correct).

\`\`\`c
// Miller-Rabin primality test (probabilistic)
#include <stdint.h>
#include <stdbool.h>

uint64_t mod_pow(uint64_t base, uint64_t exp, uint64_t mod) {
    uint64_t result = 1;
    base %= mod;
    while (exp > 0) {
        if (exp & 1)
            result = (__uint128_t)result * base % mod;
        exp >>= 1;
        base = (__uint128_t)base * base % mod;
    }
    return result;
}

bool miller_rabin_test(uint64_t n, uint64_t a) {
    if (n % a == 0) return n == a;
    uint64_t d = n - 1;
    int r = 0;
    while (d % 2 == 0) { d /= 2; r++; }

    uint64_t x = mod_pow(a, d, n);
    if (x == 1 || x == n - 1) return true;
    for (int i = 0; i < r - 1; i++) {
        x = (__uint128_t)x * x % n;
        if (x == n - 1) return true;
    }
    return false;
}

bool is_probably_prime(uint64_t n) {
    if (n < 2) return false;
    // Deterministic for n < 3,317,044,064,679,887,385,961,981
    uint64_t witnesses[] = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37};
    for (int i = 0; i < 12; i++) {
        if (!miller_rabin_test(n, witnesses[i]))
            return false;
    }
    return true;
}
\`\`\`

This is how OpenSSL, GnuPG, and every TLS implementation test candidate primes during RSA key generation. The deterministic variant with fixed witnesses is exact for all 64-bit integers.`,
        sortOrder: 5,
      },
      {
        heading: "Quantum Algorithms and Post-Quantum Cryptography",
        content: `Quantum computing introduces new complexity classes relevant to security:

- **BQP** (Bounded-error Quantum Polynomial time) — problems solvable by a quantum computer in polynomial time with bounded error probability.
- **Shor's algorithm** — factors integers and computes discrete logarithms in polynomial time on a quantum computer. This breaks RSA, Diffie-Hellman, and ECC.
- **Grover's algorithm** — searches an unstructured database of N items in O(sqrt(N)) time. This halves the effective key length of symmetric ciphers (AES-128 becomes 64-bit security against quantum search).

Post-quantum cryptographic algorithms under standardisation (NIST PQC project):
- **ML-KEM (Kyber)** — lattice-based key encapsulation, selected as the primary KEM standard (FIPS 203).
- **ML-DSA (Dilithium)** — lattice-based digital signatures (FIPS 204).
- **SLH-DSA (SPHINCS+)** — hash-based signatures, no lattice assumptions (FIPS 205).

The algorithmic hardness assumptions behind these schemes (Learning With Errors, Short Integer Solution) are believed to resist both classical and quantum attacks. However, they are newer and less studied than factoring/DLP assumptions.

For a cybersecurity practitioner, the transition to post-quantum cryptography is the most significant algorithmic change in security in decades. Understanding the underlying complexity theory helps evaluate which schemes are trustworthy.`,
        sortOrder: 6,
      },
      {
        heading: "Sources",
        content: `- Cook, S.A. "The Complexity of Theorem-Proving Procedures" (STOC 1971)
- Shor, P.W. "Polynomial-Time Algorithms for Prime Factorization and Discrete Logarithms on a Quantum Computer" (SIAM J. Comput., 1997)
- Grover, L.K. "A Fast Quantum Mechanical Algorithm for Database Search" (STOC 1996)
- NIST Post-Quantum Cryptography — https://csrc.nist.gov/projects/post-quantum-cryptography
- FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA) — https://csrc.nist.gov/publications
- Crosby & Wallach, "Denial of Service via Algorithmic Complexity Attacks" (USENIX Security 2003)
- Cormen et al. (CLRS), *Introduction to Algorithms*, Chapters 34-35 (NP-Completeness, Approximation)
- Lenstra et al., "Selecting Cryptographic Key Sizes" — https://www.keylength.com/`,
        sortOrder: 7,
      },
    ],
  },

  // ============================================================
  // cpp-oop — L0
  // ============================================================
  {
    competencyId: "cpp-oop",
    depthTier: 0,
    title: "Introduction to C++ and Object-Oriented Programming",
    recommendedLevel: 0,
    sections: [
      {
        heading: "C++ as an Extension of C",
        content: `C++ was created by Bjarne Stroustrup at Bell Labs in 1979, originally called "C with Classes." It adds object-oriented programming, generic programming (templates), and stronger type safety to C, while maintaining backward compatibility with most C code.

At 42, the C++ modules (CPP00 through CPP09) introduce you to object-oriented programming after the C-only curriculum. The transition requires a shift in thinking: instead of functions operating on data, you design objects that encapsulate data and behaviour together.

For security work, C++ is relevant because:
- Major software is written in it (Chrome, Firefox, the Windows kernel, game engines, trading systems).
- C++ inherits C's memory-safety issues and adds new ones (virtual dispatch, exceptions, RAII misuse).
- Many exploitation techniques apply to both C and C++ binaries, with C++ adding vtable hijacking as an additional attack vector.`,
        sortOrder: 0,
      },
      {
        heading: "Core OOP Concepts",
        content: `Object-oriented programming organises code around four principles:

1. **Encapsulation** — bundling data (attributes) and functions (methods) into a class, hiding internal details behind public interfaces.
2. **Inheritance** — creating new classes based on existing ones, reusing and extending their behaviour.
3. **Polymorphism** — different classes responding to the same interface in different ways (via virtual functions in C++).
4. **Abstraction** — exposing only the relevant interface and hiding implementation details.

These concepts map to C++ constructs: classes, inheritance hierarchies, virtual functions, and access specifiers (\`public\`, \`protected\`, \`private\`).`,
        sortOrder: 1,
      },
      {
        heading: "Key Vocabulary",
        content: `- **Class** — a user-defined type that groups data members and member functions.
- **Object** — an instance of a class.
- **Constructor / Destructor** — special functions called when an object is created / destroyed.
- **RAII** (Resource Acquisition Is Initialisation) — a C++ idiom where resource management is tied to object lifetime.
- **Template** — a mechanism for writing generic code that works with any type.
- **STL** (Standard Template Library) — a collection of template-based containers, algorithms, and iterators.
- **Vtable** (virtual table) — a lookup table used for dynamic dispatch of virtual functions.

Understanding vtables is directly relevant to binary exploitation: corrupting a vtable pointer allows an attacker to redirect virtual function calls to arbitrary code.`,
        sortOrder: 2,
      },
      {
        heading: "C++ syntax essentials for C programmers",
        content: `If you come from 42's C curriculum, here are the key syntax differences you need before touching C++ code.

**Compilation**: use \`g++\` (or \`c++\`), not \`gcc\`. The standard flag is \`-std=c++98\` for CPP00-CPP08 at 42.

\`\`\`cpp
g++ -Wall -Wextra -Werror -std=c++98 main.cpp -o program
\`\`\`

**I/O streams replace printf/scanf**:

\`\`\`cpp
#include <iostream>

int main() {
    int x = 42;
    std::cout << "Value: " << x << std::endl;   // like printf("Value: %d\\n", x);
    std::cin >> x;                                // like scanf("%d", &x);
    return 0;
}
\`\`\`

\`std::cout\` is an output stream; \`<<\` inserts data into it. \`std::endl\` flushes and adds a newline. \`std::cin\` reads input with \`>>\`.

**Namespaces and \`std::\`**: C++ groups standard library names under the \`std\` namespace. Writing \`std::cout\` means "cout from the std namespace." You can write \`using namespace std;\` to drop the prefix, but 42 forbids it — always qualify with \`std::\`.

**References (the \`&\` in declarations)**: a reference is an alias — a second name for an existing variable. Unlike a pointer, it cannot be null and cannot be reseated.

\`\`\`cpp
void swap(int &a, int &b) {   // a and b are references, not copies
    int tmp = a;
    a = b;
    b = tmp;
}
// Equivalent C: void swap(int *a, int *b) { int tmp = *a; *a = *b; *b = tmp; }
\`\`\`

\`const int &x\` means "a reference to x that cannot modify x through this alias."

**Classes vs structs**: a \`struct\` in C++ is identical to a \`class\` except that members are \`public\` by default (in a \`class\`, they are \`private\` by default). At 42, you use \`class\`.

**Scope resolution operator \`::\`**: tells the compiler which class (or namespace) a function belongs to.

\`\`\`cpp
// In the .hpp: declare the method
class Fixed {
public:
    int getRawBits() const;
};

// In the .cpp: define it — Fixed:: means "this belongs to class Fixed"
int Fixed::getRawBits() const {
    return this->_rawBits;
}
\`\`\`

The \`const\` after the parentheses means "this method does not modify the object."

**Member initialiser lists**: constructors initialise members before the body runs, using a colon syntax:

\`\`\`cpp
Fixed::Fixed() : _rawBits(0) {
    // _rawBits is already 0 when we reach this line
}
\`\`\`

This is not an assignment — it is direct initialisation, and it is required for \`const\` and reference members.

These are the building blocks L1 and onward will use extensively. If any of them looks unfamiliar when you encounter it in the next resource, come back here.`,
        sortOrder: 3,
      },
      {
        heading: "Sources",
        content: `- Stroustrup, B. *The C++ Programming Language*, 4th ed.
- ISO/IEC 14882:2020 (C++20 standard)
- Meyers, S. *Effective C++*, 3rd ed.
- cppreference.com — https://en.cppreference.com/`,
        sortOrder: 4,
      },
    ],
  },

  // ============================================================
  // cpp-oop — L1
  // ============================================================
  {
    competencyId: "cpp-oop",
    depthTier: 1,
    title: "Classes, Constructors, and the Orthodox Canonical Form",
    recommendedLevel: 1,
    sections: [
      {
        heading: "Defining a Class",
        content: `A class groups data and functions. In 42's C++ modules, you follow the **Orthodox Canonical Form** (OCF): every class must implement four special member functions.

\`\`\`cpp
class Fixed {
private:
    int                _rawBits;
    static const int   _fractionalBits = 8;

public:
    Fixed();                              // Default constructor
    Fixed(const Fixed &other);            // Copy constructor
    Fixed &operator=(const Fixed &rhs);   // Copy assignment operator
    ~Fixed();                             // Destructor

    int getRawBits() const;
    void setRawBits(int raw);
};
\`\`\`

Implementation:

\`\`\`cpp
Fixed::Fixed() : _rawBits(0) {
    std::cout << "Default constructor called" << std::endl;
}

Fixed::Fixed(const Fixed &other) : _rawBits(other._rawBits) {
    std::cout << "Copy constructor called" << std::endl;
}

Fixed &Fixed::operator=(const Fixed &rhs) {
    std::cout << "Copy assignment operator called" << std::endl;
    if (this != &rhs)
        _rawBits = rhs._rawBits;
    return *this;
}

Fixed::~Fixed() {
    std::cout << "Destructor called" << std::endl;
}
\`\`\`

The self-assignment check (\`if (this != &rhs)\`) in the copy assignment operator prevents bugs when someone writes \`a = a\`.`,
        sortOrder: 0,
      },
      {
        heading: "Constructors and Initialiser Lists",
        content: `Always use **initialiser lists** rather than assignment in the constructor body:

\`\`\`cpp
// Good: initialises directly
Fixed::Fixed(int value) : _rawBits(value << _fractionalBits) {}

// Bad: default-constructs, then assigns (two operations instead of one)
Fixed::Fixed(int value) {
    _rawBits = value << _fractionalBits;
}
\`\`\`

For built-in types, the difference is negligible. For class-type members, the initialiser list avoids a default construction followed by an assignment, which can be expensive and sometimes impossible (for const or reference members).

The order of initialisation follows the **declaration order** in the class, not the order in the initialiser list. Mismatching these produces a compiler warning (\`-Wreorder\`) and can cause subtle bugs if one member's initialisation depends on another.`,
        sortOrder: 1,
      },
      {
        heading: "Access Specifiers and Encapsulation",
        content: `C++ provides three access levels:

- \`public\` — accessible from anywhere.
- \`protected\` — accessible from the class itself and its derived classes.
- \`private\` — accessible only from the class itself.

Convention: data members are \`private\`, accessed through \`public\` getters/setters. This is not just style — it allows the class to validate inputs and maintain invariants:

\`\`\`cpp
class Account {
private:
    double _balance;

public:
    Account(double initial) : _balance(initial) {}

    double getBalance() const { return _balance; }

    bool withdraw(double amount) {
        if (amount <= 0 || amount > _balance)
            return false;  // enforce invariant: balance >= 0
        _balance -= amount;
        return true;
    }
};
\`\`\`

The \`const\` after \`getBalance()\` means the method does not modify the object. This is both documentation and enforcement — calling a non-const method on a const reference is a compile error.`,
        sortOrder: 2,
      },
      {
        heading: "Operator Overloading",
        content: `C++ lets you define how built-in operators behave on your own types, so an object can be used with the same natural syntax as an \`int\`.

**Why and when.** Overload an operator only when it has an *obvious, conventional* meaning for your type — arithmetic on a \`Fixed\`-point number, comparison on a \`Date\`, \`<<\` to print. It is syntactic sugar for a named method: \`a + b\` is exactly \`a.operator+(b)\`. The danger is surprise: overloading an operator to do something unexpected (e.g. \`+\` that mutates its operand) makes code harder to read than a plainly named function. Rule of thumb — if a reader could guess wrong about what the symbol does, use a named method instead.

\`\`\`cpp

\`\`\`cpp
class Fixed {
    // ... members ...
public:
    // Comparison operators
    bool operator>(const Fixed &rhs) const;
    bool operator<(const Fixed &rhs) const;
    bool operator>=(const Fixed &rhs) const;
    bool operator<=(const Fixed &rhs) const;
    bool operator==(const Fixed &rhs) const;
    bool operator!=(const Fixed &rhs) const;

    // Arithmetic operators
    Fixed operator+(const Fixed &rhs) const;
    Fixed operator-(const Fixed &rhs) const;
    Fixed operator*(const Fixed &rhs) const;
    Fixed operator/(const Fixed &rhs) const;

    // Increment/decrement
    Fixed &operator++();       // prefix ++x
    Fixed  operator++(int);    // postfix x++
};

// Stream insertion (non-member)
std::ostream &operator<<(std::ostream &os, const Fixed &f) {
    os << f.toFloat();
    return os;
}
\`\`\`

The prefix increment returns a reference (the modified object), while the postfix returns a copy (the value before modification). The \`int\` parameter in the postfix version is a dummy to distinguish it from the prefix.

**Why \`operator<<\` is a non-member.** \`std::cout << f\` means \`operator<<(std::cout, f)\` — the *left* operand is the stream, not your object. A member \`operator<<\` would make the left operand \`*this\` (your type), forcing the unnatural \`f << std::cout\`; and you cannot add a member to \`std::ostream\` because you do not own that class. So stream operators are written as free functions taking \`std::ostream &\` first, returning it to allow chaining (\`os << a << b\`). Declare them \`friend\` only if they must read private members.

**Member vs non-member, in short:** operators that modify the left operand (\`=\`, \`+=\`, \`++\`) are members; symmetric operators where either side could convert (\`+\`, \`==\`, and \`<<\`) are typically non-members so both operands are treated equally.`,
        sortOrder: 3,
      },
      {
        heading: "Sources",
        content: `- ISO/IEC 14882:2020 (C++20), Sections on classes, special member functions
- Meyers, S. *Effective C++*, Items 5-12 (constructors, destructors, assignment)
- cppreference.com, "The rule of three/five/zero" — https://en.cppreference.com/w/cpp/language/rule_of_three
- 42 C++ module subjects (CPP00-CPP01)`,
        sortOrder: 4,
      },
    ],
  },

  // ============================================================
  // cpp-oop — L2
  // ============================================================
  {
    competencyId: "cpp-oop",
    depthTier: 2,
    title: "Inheritance, Polymorphism, and Virtual Functions",
    recommendedLevel: 2,
    sections: [
      {
        heading: "Inheritance Basics",
        content: `Inheritance lets a derived class reuse and extend a base class:

\`\`\`cpp
class Animal {
protected:
    std::string _name;

public:
    Animal(const std::string &name) : _name(name) {}
    virtual ~Animal() {}

    virtual void makeSound() const {
        std::cout << _name << " makes a generic sound" << std::endl;
    }
    std::string getName() const { return _name; }
};

class Dog : public Animal {
public:
    Dog(const std::string &name) : Animal(name) {}

    void makeSound() const override {
        std::cout << _name << " barks" << std::endl;
    }
};

class Cat : public Animal {
public:
    Cat(const std::string &name) : Animal(name) {}

    void makeSound() const override {
        std::cout << _name << " meows" << std::endl;
    }
};
\`\`\`

The \`public\` keyword in \`class Dog : public Animal\` means public members of \`Animal\` remain public in \`Dog\`. With \`private\` inheritance, they become private (used for "implemented in terms of" relationships).`,
        sortOrder: 0,
      },
      {
        heading: "Virtual Functions and Dynamic Dispatch",
        content: `The \`virtual\` keyword enables **dynamic dispatch**: the function called depends on the object's actual type at runtime, not the type of the pointer/reference:

\`\`\`cpp
void describe(const Animal &animal) {
    animal.makeSound();  // calls Dog::makeSound or Cat::makeSound
}

int main() {
    Dog dog("Rex");
    Cat cat("Whiskers");
    describe(dog);  // "Rex barks"
    describe(cat);  // "Whiskers meows"
}
\`\`\`

Without \`virtual\`, \`describe\` would always call \`Animal::makeSound\`, regardless of the actual type.

**How it works**: each class with virtual functions has a **vtable** — an array of function pointers. Each object of that class contains a hidden **vptr** pointing to the vtable. When you call a virtual function, the compiler generates code that:
1. Reads the vptr from the object.
2. Indexes into the vtable to find the function pointer.
3. Calls through the function pointer.

This indirection is the mechanism that vtable-hijacking exploits target.`,
        sortOrder: 1,
      },
      {
        heading: "Abstract Classes and Pure Virtual Functions",
        content: `A **pure virtual function** is a virtual function declared with \`= 0\` and no implementation in the base class. A class with at least one of them is **abstract**: it cannot be instantiated. It exists only to be inherited.

**Why they exist.** A pure virtual function defines a *contract*: "every concrete subclass must provide this behaviour." You reach for one when the base class has no sensible default — a generic \`Shape\` cannot compute \`area()\` without knowing which shape it is. Declaring it pure pushes the decision down to the derived class and turns a missing implementation into a *compile error* rather than a silent runtime bug.

\`\`\`cpp
class AShape {
public:
    virtual ~AShape() {}
    virtual double area() const = 0;        // pure virtual — no body, MUST be overridden
    virtual double perimeter() const = 0;   // pure virtual
    virtual void display() const {          // regular virtual — has a default
        std::cout << "Area: " << area()
                  << ", Perimeter: " << perimeter() << std::endl;
    }
};

class Circle : public AShape {
    double _radius;
public:
    Circle(double r) : _radius(r) {}
    double area() const override { return M_PI * _radius * _radius; }
    double perimeter() const override { return 2 * M_PI * _radius; }
};
// AShape s;      // ERROR: cannot instantiate an abstract class
// Circle c(2.0); // OK: every pure virtual is implemented
\`\`\`

**How it works.** Each polymorphic class has a **vtable** (an array of function pointers — see the previous section). For a *regular* virtual, the slot holds the base's implementation. For a *pure* virtual, the compiler puts a placeholder (\`__cxa_pure_virtual\` in the Itanium ABI) in that slot — there is nothing valid to call. The class is non-instantiable *precisely because* its vtable is incomplete; a derived class becomes concrete only once every such slot is filled by an \`override\`.

\`\`\`mermaid
flowchart TB
    subgraph A["AShape vtable (abstract)"]
        a1["area() → __cxa_pure_virtual"]
        a2["perimeter() → __cxa_pure_virtual"]
        a3["display() → AShape::display"]
    end
    subgraph C["Circle vtable (concrete)"]
        c1["area() → Circle::area"]
        c2["perimeter() → Circle::perimeter"]
        c3["display() → AShape::display (inherited)"]
    end
    A -. override fills empty slots .-> C
\`\`\`

**Pure virtual vs regular virtual:**

| | Regular \`virtual\` | Pure \`virtual ... = 0\` |
|---|---|---|
| Body in base | Yes (a default) | Usually none |
| Overriding | Optional | Mandatory to become concrete |
| Base instantiable | Yes | No (abstract) |
| Use when | A sensible default exists | No default; base is only a contract |

**Limits and gotchas:**
- A pure virtual *can* still have an out-of-line body (\`double AShape::area() const { return 0; }\`), callable explicitly via \`AShape::area()\`. The \`= 0\` controls *instantiability*, not whether a body exists.
- A derived class that leaves even one pure virtual unimplemented is *itself* abstract.
- Never call a virtual (pure or not) from a constructor or destructor: mid-construction the object is only "the base type so far", so dispatch resolves to the base version — and calling a *pure* one there is undefined behaviour.

**When to use — and not.** Use a pure virtual for an interface, or an abstract base with no default behaviour. Prefer a *regular* virtual when a reasonable default exists (subclasses override only if they need to). If no runtime polymorphism is involved at all, you may not need virtuals — templates (compile-time polymorphism) are a zero-overhead alternative.

In 42's CPP modules, abstract classes are prefixed with \`A\` (e.g., \`AAnimal\`, \`ACharacter\`) to signal intent. And always keep the base destructor virtual: deleting a derived object through a base pointer without it skips the derived destructor and leaks resources (undefined behaviour per C++ standard [expr.delete]).

Source: ISO C++ [class.abstract]; Itanium C++ ABI §2.5.2 (\`__cxa_pure_virtual\`); cppreference "abstract class".`,
        sortOrder: 2,
      },
      {
        heading: "Interfaces in C++",
        content: `C++ has no \`interface\` keyword (unlike Java). An interface is simulated by a class with only pure virtual functions:

\`\`\`cpp
class ICharacter {
public:
    virtual ~ICharacter() {}
    virtual std::string const &getName() const = 0;
    virtual void equip(AMateria *m) = 0;
    virtual void unequip(int idx) = 0;
    virtual void use(int idx, ICharacter &target) = 0;
};
\`\`\`

Interfaces define a contract: any class implementing \`ICharacter\` must provide all four methods. This is used in the 42 CPP04 module (Materia/Character exercise).

Design principle: depend on abstractions (interfaces), not concrete classes. This makes code testable and extensible — you can swap implementations without changing client code.`,
        sortOrder: 3,
      },
      {
        heading: "The Diamond Problem and Virtual Inheritance",
        content: `When a class inherits from two classes that share a common base, the derived class gets two copies of the base class's members:

\`\`\`cpp
class A { public: int x; };
class B : public A {};
class C : public A {};
class D : public B, public C {};
// D has B::A::x and C::A::x — ambiguous!
\`\`\`

**Virtual inheritance** solves this by ensuring only one copy of the base:

\`\`\`cpp
class B : virtual public A {};
class C : virtual public A {};
class D : public B, public C {};
// D has a single A::x
\`\`\`

Virtual inheritance adds complexity: the virtual base class is initialised by the most-derived class, and the vtable layout includes additional offset information. Use it sparingly — prefer composition over deep inheritance hierarchies.`,
        sortOrder: 4,
      },
      {
        heading: "Vtable Hijacking: A Security Perspective",
        content: `In a C++ binary, each polymorphic object starts with a hidden \`vptr\` pointing to the class's vtable. If an attacker can overwrite this pointer (via a heap overflow, UAF, or type confusion), they can redirect virtual function calls to arbitrary code:

\`\`\`
Normal:
  Object -> vptr -> vtable -> [func1_ptr, func2_ptr, ...]

After vtable hijack:
  Object -> vptr -> attacker_controlled -> [shellcode_addr, ...]
\`\`\`

Modern mitigations:
- **CFI (Control-Flow Integrity)** validates that virtual call targets are legitimate.
- **VTable verification** (GCC's \`-fvtable-verify\`) checks vtable pointers at runtime.
- **ASLR** makes vtable addresses unpredictable (but info leaks bypass this).

When analysing C++ binaries with tools like IDA or Ghidra, identifying vtables helps reconstruct class hierarchies and understand the program's architecture.`,
        sortOrder: 5,
      },
      {
        heading: "Object slicing",
        content: `When a derived object is assigned or passed **by value** to a base-type variable, the derived part is silently discarded — this is object slicing:\n\n\`\`\`mermaid\nflowchart LR\n    subgraph SRC["Derived Object"]\n        B1[Base members]\n        D1[Derived members]\n        V1["vtable → Derived"]\n    end\n    subgraph DST["After Slicing"]\n        B2[Base members copied]\n        V2["vtable → Base"]\n        X[Derived members lost]\n    end\n    SRC -->|copy by value| DST\n    style X fill:#c0392b,color:#fff\n    style D1 fill:#e8605a,color:#fff\n\`\`\`\n\n\`\`\`cpp\nclass Animal {\npublic:\n    virtual std::string speak() const { return "..."; }\n};\n\nclass Dog : public Animal {\n    std::string _name;\npublic:\n    Dog(std::string name) : _name(name) {}\n    std::string speak() const override { return _name + " says Woof!"; }\n};\n\n// SLICING: Dog is copied into an Animal value — _name is lost, vtable is Animal's\nAnimal a = Dog("Rex");\nstd::cout << a.speak(); // prints "..." not "Rex says Woof!"\n\n// SLICING in a container:\nstd::vector<Animal> animals;\nanimals.push_back(Dog("Rex")); // sliced!\n\n// FIX: use pointers or references for polymorphic collections\nstd::vector<std::unique_ptr<Animal>> animals;\nanimals.push_back(std::make_unique<Dog>("Rex"));\nstd::cout << animals[0]->speak(); // "Rex says Woof!" — correct\n\`\`\`\n\nRule: if a class has virtual functions, always pass and store it by pointer or reference, never by value.\n\nSource: Meyers, S. *Effective C++*, Item 20: "Prefer pass-by-reference-to-const to pass-by-value"`,
        sortOrder: 6,
      },
      {
        heading: "Sources",
        content: `- ISO/IEC 14882:2020, Sections 11 (Classes), 13 (Derived classes), 11.7.3 (Virtual functions)
- Meyers, S. *Effective C++*, Items 7 (virtual destructors), 32-40 (inheritance and OOP design)
- Stroustrup, B. *The C++ Programming Language*, Chapter 20 (Derived Classes)
- "Smashing C++ Vptrs" — Phrack 56 (vtable hijacking)
- cppreference.com, "virtual function specifier" — https://en.cppreference.com/w/cpp/language/virtual`,
        sortOrder: 7,
      },
    ],
  },

  // ============================================================
  // cpp-oop — L3
  // ============================================================
  {
    competencyId: "cpp-oop",
    depthTier: 3,
    title: "RAII, Exceptions, and Resource Management in C++",
    recommendedLevel: 3,
    sections: [
      {
        heading: "The RAII Idiom",
        content: `RAII (Resource Acquisition Is Initialisation) is the most important C++ idiom. The principle: acquire resources in constructors, release them in destructors. Since destructors are called automatically (even during stack unwinding from exceptions), resources are always released.

\`\`\`cpp
class FileHandle {
private:
    int _fd;

public:
    explicit FileHandle(const char *path)
        : _fd(open(path, O_RDONLY | O_CLOEXEC))
    {
        if (_fd == -1)
            throw std::runtime_error(std::string("open: ") + strerror(errno));
    }

    ~FileHandle() {
        if (_fd != -1)
            close(_fd);
    }

    // Delete copy operations — a file descriptor cannot be meaningfully copied
    FileHandle(const FileHandle &) = delete;
    FileHandle &operator=(const FileHandle &) = delete;

    // Move operations for ownership transfer
    FileHandle(FileHandle &&other) noexcept : _fd(other._fd) {
        other._fd = -1;
    }

    FileHandle &operator=(FileHandle &&other) noexcept {
        if (this != &other) {
            if (_fd != -1) close(_fd);
            _fd = other._fd;
            other._fd = -1;
        }
        return *this;
    }

    int get() const { return _fd; }
};
\`\`\`

This class cannot leak a file descriptor. The destructor always closes it, move semantics allow transferring ownership, and copy is explicitly forbidden.

RAII eliminates the entire class of resource leaks that plague C code (unclosed files, unreleased mutexes, leaked memory). In security-sensitive code, resource leaks can lead to file descriptor exhaustion (DoS) or information disclosure (leaked handles).`,
        sortOrder: 0,
      },
      {
        heading: "Smart Pointers",
        content: `The standard library provides RAII wrappers for dynamic memory:

**\`std::unique_ptr\`** — exclusive ownership, zero overhead:
\`\`\`cpp
#include <memory>

std::unique_ptr<int[]> buffer(new int[1024]);
// buffer is automatically freed when it goes out of scope

// Preferred: use make_unique (exception-safe)
auto buffer2 = std::make_unique<int[]>(1024);
\`\`\`

**\`std::shared_ptr\`** — shared ownership via reference counting:
\`\`\`cpp
auto config = std::make_shared<Config>();
auto copy = config;  // ref count = 2
// config is freed when the last shared_ptr is destroyed
\`\`\`

**\`std::weak_ptr\`** — non-owning reference that does not prevent destruction:
\`\`\`cpp
std::weak_ptr<Config> observer = config;
if (auto locked = observer.lock()) {
    // object still alive, use locked
}
\`\`\`

The rule of thumb from the C++ Core Guidelines:
- Use \`unique_ptr\` by default for single ownership.
- Use \`shared_ptr\` only when ownership is genuinely shared.
- Never use raw \`new\` / \`delete\` in application code.

Security implication: \`shared_ptr\`'s reference count is an attack target. If an attacker can corrupt the reference count (e.g., via a heap overflow), they can trigger a premature free (use-after-free) or prevent the object from ever being freed (memory leak / potential info leak).`,
        sortOrder: 1,
      },
      {
        heading: "Exception Safety",
        content: `C++ code can provide three levels of exception safety:

1. **No-throw guarantee** — the function never throws. Mark with \`noexcept\`. Destructors, move operations, and swap should always be noexcept.
2. **Strong guarantee** — if an exception is thrown, the program state is unchanged (as if the function was never called). Achieved via the copy-and-swap idiom.
3. **Basic guarantee** — if an exception is thrown, the program is in a valid (but possibly changed) state. No resources are leaked.

The copy-and-swap idiom provides the strong guarantee for assignment:

\`\`\`cpp
class Widget {
    int *_data;
    size_t _size;

public:
    Widget &operator=(Widget other) {   // note: by value (copy)
        swap(*this, other);              // swap with the copy
        return *this;                    // old data destroyed with 'other'
    }

    friend void swap(Widget &a, Widget &b) noexcept {
        using std::swap;
        swap(a._data, b._data);
        swap(a._size, b._size);
    }
};
\`\`\`

If the copy constructor throws (in the parameter), the original object is untouched. If the swap throws... it does not, because swap is noexcept.

In security contexts, exception safety prevents resource leaks and inconsistent state that could be exploited. A mutex locked before an operation that throws (without RAII) stays locked forever, causing deadlock.`,
        sortOrder: 2,
      },
      {
        heading: "The Rule of Zero, Three, and Five",
        content: `**Rule of Three** (C++98): if you define any of {destructor, copy constructor, copy assignment}, define all three. If one is needed, the defaults for the others are likely wrong.

**Rule of Five** (C++11): add move constructor and move assignment operator to the list.

**Rule of Zero** (modern best practice): do not define any special member functions. Use smart pointers and standard containers as members — they handle their own resources, so the compiler-generated defaults work correctly.

\`\`\`cpp
// Rule of Zero — no special members needed
class UserProfile {
    std::string                _name;
    std::vector<std::string>   _roles;
    std::unique_ptr<Session>   _session;  // move-only

public:
    UserProfile(std::string name) : _name(std::move(name)) {}
    // Compiler generates correct destructor, move ctor, move assignment
    // Copy is implicitly deleted because unique_ptr is not copyable
};
\`\`\`

For 42's CPP modules, you will implement the Rule of Three (OCF) for learning purposes. In production code, prefer the Rule of Zero.`,
        sortOrder: 3,
      },
      {
        heading: "Casting in C++",
        content: `C++ provides four cast operators, each with specific semantics:

\`\`\`cpp
// static_cast — compile-time checked, for related types
double d = 3.14;
int i = static_cast<int>(d);   // truncates to 3
Base *bp = static_cast<Base *>(derived_ptr);  // upcast (always safe)

// dynamic_cast — runtime-checked, for polymorphic types
Derived *dp = dynamic_cast<Derived *>(base_ptr);
if (dp) { /* safe to use dp */ }
// Returns nullptr on failure (for pointers)
// Throws std::bad_cast on failure (for references)

// const_cast — add or remove const
const char *cp = "hello";
char *p = const_cast<char *>(cp);
// Modifying through p is UB if the original was truly const

// reinterpret_cast — bit-level reinterpretation
uintptr_t addr = reinterpret_cast<uintptr_t>(ptr);
\`\`\`

In 42 CPP06, you implement conversion functions using these casts. Security relevance:
- \`reinterpret_cast\` bypasses the type system entirely — its use in application code is a red flag during code review.
- \`dynamic_cast\` failure (returning nullptr) that is not checked leads to null-pointer dereferences.
- Casting away \`const\` and then writing is undefined behaviour and can cause data corruption.`,
        sortOrder: 4,
      },
      {
        heading: "Exception Handling Patterns",
        content: `Structure exception handling around specific exception types:

\`\`\`cpp
#include <stdexcept>

class ParsingError : public std::runtime_error {
public:
    ParsingError(const std::string &msg) : std::runtime_error(msg) {}
};

void parse_config(const std::string &path) {
    FileHandle fh(path.c_str());  // RAII — closed on any exit path
    // ... parse ...
    if (syntax_error)
        throw ParsingError("Line 42: unexpected token");
}

int main() {
    try {
        parse_config("app.conf");
    } catch (const ParsingError &e) {
        std::cerr << "Parse error: " << e.what() << std::endl;
        return 1;
    } catch (const std::exception &e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
    return 0;
}
\`\`\`

Best practices:
- Throw by value, catch by const reference.
- Never throw from a destructor (it causes \`std::terminate\` if another exception is already in flight).
- Derive custom exceptions from \`std::exception\` or its subclasses.
- Use RAII so that cleanup happens automatically — do not rely on catch blocks for resource release.`,
        sortOrder: 5,
      },
      {
        heading: "Sources",
        content: `- ISO/IEC 14882:2020, Section 14 (Exception handling), 6.7.5.5 (Destructors and exceptions)
- Meyers, S. *Effective C++*, Items 13-17 (Resource Management)
- Sutter, H. *Exceptional C++* — definitive guide to exception safety
- C++ Core Guidelines, R (Resource management) — https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#S-resource
- cppreference.com, "Smart pointers" — https://en.cppreference.com/w/cpp/memory`,
        sortOrder: 6,
      },
    ],
  },

  // ============================================================
  // cpp-oop — L4
  // ============================================================
  {
    competencyId: "cpp-oop",
    depthTier: 4,
    title: "Templates, the STL, and Generic Programming",
    recommendedLevel: 4,
    sections: [
      {
        heading: "Function Templates",
        content: `Templates let you write functions and classes that work with any type. The compiler generates specialised code for each type used:

\`\`\`cpp
template <typename T>
T const &max(T const &a, T const &b) {
    return (a > b) ? a : b;
}

// Usage — type deduced automatically
int    i = max(3, 5);         // T = int
double d = max(3.14, 2.71);   // T = double

// Explicit type specification
auto s = max<std::string>("hello", "world");
\`\`\`

Template code is instantiated at compile time. If you call \`max<int>\`, the compiler generates a function specifically for \`int\`. This means template definitions must be visible at the point of use — typically in header files.

In the 42 CPP07 module, you implement function templates like \`swap\`, \`min\`, \`max\`, and \`iter\` (which applies a function to every element of an array):

\`\`\`cpp
template <typename T>
void iter(T *array, size_t length, void (*func)(T &)) {
    for (size_t i = 0; i < length; i++)
        func(array[i]);
}
\`\`\``,
        sortOrder: 0,
      },
      {
        heading: "Class Templates",
        content: `Class templates define generic containers and data structures:

\`\`\`cpp
template <typename T>
class Array {
private:
    T      *_data;
    size_t  _size;

public:
    Array() : _data(nullptr), _size(0) {}

    explicit Array(unsigned int n) : _data(new T[n]()), _size(n) {}

    Array(const Array &other) : _data(nullptr), _size(0) {
        *this = other;
    }

    Array &operator=(const Array &rhs) {
        if (this != &rhs) {
            delete[] _data;
            _size = rhs._size;
            _data = new T[_size];
            for (size_t i = 0; i < _size; i++)
                _data[i] = rhs._data[i];
        }
        return *this;
    }

    ~Array() { delete[] _data; }

    T &operator[](size_t index) {
        if (index >= _size)
            throw std::out_of_range("Index out of bounds");
        return _data[index];
    }

    const T &operator[](size_t index) const {
        if (index >= _size)
            throw std::out_of_range("Index out of bounds");
        return _data[index];
    }

    size_t size() const { return _size; }
};
\`\`\`

This is the 42 CPP07 \`Array\` exercise. Key points:
- The bounds check in \`operator[]\` throws an exception rather than causing undefined behaviour (unlike raw arrays and \`std::vector::operator[]\`).
- Provide both const and non-const overloads of \`operator[]\`.
- \`new T[n]()\` value-initialises the elements (zeroes for built-in types).`,
        sortOrder: 1,
      },
      {
        heading: "STL Containers",
        content: `The Standard Template Library provides battle-tested container implementations:

**Sequence containers:**

| Container      | Access  | Insert (front/back) | Insert (middle) | Notes |
|---------------|---------|--------------------|-----------------|-|
| \`vector\`      | O(1)    | O(1) amortised / O(n) | O(n)         | Contiguous memory |
| \`deque\`       | O(1)    | O(1) / O(1)       | O(n)            | Double-ended |
| \`list\`        | O(n)    | O(1) / O(1)       | O(1) with iterator | Doubly linked |

**Associative containers:**

| Container  | Lookup    | Insert    | Ordered | Underlying |
|-----------|-----------|-----------|---------|------------|
| \`map\`     | O(log n)  | O(log n)  | Yes     | Red-black tree |
| \`set\`     | O(log n)  | O(log n)  | Yes     | Red-black tree |
| \`unordered_map\` | O(1) avg | O(1) avg | No   | Hash table |
| \`unordered_set\` | O(1) avg | O(1) avg | No   | Hash table |

\`\`\`cpp
#include <vector>
#include <map>
#include <algorithm>

std::vector<int> v = {5, 3, 1, 4, 2};
std::sort(v.begin(), v.end());   // {1, 2, 3, 4, 5}

std::map<std::string, int> scores;
scores["Alice"] = 95;
scores["Bob"]   = 87;

for (const auto &[name, score] : scores)  // C++17 structured bindings
    std::cout << name << ": " << score << std::endl;
\`\`\`

In the 42 CPP08 and CPP09 modules, you use STL containers to solve problems: \`easyfind\` (finding an element in a container), \`Span\` (storing and querying ranges), and algorithmic exercises (RPN calculator, merge-insertion sort).`,
        sortOrder: 2,
      },
      {
        heading: "STL Algorithms",
        content: `The \`<algorithm>\` header provides generic algorithms that work with iterators:

\`\`\`cpp
#include <algorithm>
#include <vector>
#include <numeric>

std::vector<int> data = {3, 1, 4, 1, 5, 9, 2, 6};

// Sort
std::sort(data.begin(), data.end());

// Binary search (requires sorted range)
bool found = std::binary_search(data.begin(), data.end(), 5);

// Find
auto it = std::find(data.begin(), data.end(), 9);
if (it != data.end())
    std::cout << "Found at index " << (it - data.begin()) << std::endl;

// Transform
std::vector<int> doubled(data.size());
std::transform(data.begin(), data.end(), doubled.begin(),
               [](int x) { return x * 2; });

// Accumulate (sum)
int sum = std::accumulate(data.begin(), data.end(), 0);

// Remove-erase idiom
data.erase(std::remove(data.begin(), data.end(), 1), data.end());

// Count
int nines = std::count(data.begin(), data.end(), 9);
\`\`\`

Key principle: algorithms operate on iterator ranges, not containers. This decouples algorithms from data structures — any container that provides appropriate iterators can use any algorithm.

For the 42 CPP09 RPN calculator, you use a \`std::stack\` (built on \`std::deque\` by default) with STL patterns.`,
        sortOrder: 3,
      },
      {
        heading: "Iterators and Iterator Categories",
        content: `Iterators are the glue between containers and algorithms. Five categories, from weakest to strongest:

1. **Input** — read-only, single-pass forward (\`std::istream_iterator\`)
2. **Output** — write-only, single-pass forward (\`std::ostream_iterator\`)
3. **Forward** — read/write, multi-pass forward (\`std::forward_list::iterator\`)
4. **Bidirectional** — forward + backward (\`std::list::iterator\`, \`std::map::iterator\`)
5. **Random access** — bidirectional + arithmetic (\`std::vector::iterator\`, raw pointers)

\`\`\`cpp
// Writing a function that works with any container
template <typename InputIt>
typename std::iterator_traits<InputIt>::value_type
sum_range(InputIt first, InputIt last) {
    typename std::iterator_traits<InputIt>::value_type total{};
    for (; first != last; ++first)
        total += *first;
    return total;
}

std::vector<int> v = {1, 2, 3};
std::list<int>   l = {4, 5, 6};
sum_range(v.begin(), v.end());  // works
sum_range(l.begin(), l.end());  // works
\`\`\`

\`std::sort\` requires random-access iterators, so it works with \`vector\` and \`deque\` but not \`list\` (which provides \`list::sort\` as a member function instead).`,
        sortOrder: 4,
      },
      {
        heading: "Template Specialisation",
        content: `You can provide specialised implementations for specific types:

\`\`\`cpp
// Primary template
template <typename T>
class Serializer {
public:
    static std::string serialize(const T &val) {
        // Generic: use stream
        std::ostringstream oss;
        oss << val;
        return oss.str();
    }
};

// Full specialisation for bool
template <>
class Serializer<bool> {
public:
    static std::string serialize(const bool &val) {
        return val ? "true" : "false";
    }
};

// Partial specialisation for pointers
template <typename T>
class Serializer<T *> {
public:
    static std::string serialize(T *const &ptr) {
        if (!ptr) return "null";
        return Serializer<T>::serialize(*ptr);
    }
};
\`\`\`

In 42 CPP08, you encounter scenarios where template specialisation handles edge cases (e.g., \`easyfind\` needing different logic for maps vs sequences).

Security relevance: template instantiation can cause code bloat — a heavily templatised binary exposes more gadgets for ROP attacks. Additionally, complex template metaprogramming can hide security-relevant logic, making code review harder.`,
        sortOrder: 5,
      },
      {
        heading: "Lambda Expressions",
        content: `Lambdas (C++11) create anonymous function objects:

\`\`\`cpp
// Basic lambda
auto square = [](int x) { return x * x; };
int result = square(5);  // 25

// Capturing variables
int threshold = 10;
auto filter = [threshold](int x) { return x > threshold; };

// Capture by reference
std::vector<int> results;
auto collector = [&results](int x) { results.push_back(x); };

// In STL algorithms
std::vector<int> data = {1, 5, 3, 8, 2, 9};
std::sort(data.begin(), data.end(),
          [](int a, int b) { return a > b; });  // descending

// Count elements matching a predicate
int above = std::count_if(data.begin(), data.end(),
                          [threshold](int x) { return x > threshold; });

// Generic lambda (C++14)
auto add = [](auto a, auto b) { return a + b; };
\`\`\`

Capture modes:
- \`[=]\` — capture all by value (copy)
- \`[&]\` — capture all by reference
- \`[x]\` — capture x by value
- \`[&x]\` — capture x by reference
- \`[this]\` — capture the enclosing object's \`this\` pointer

Prefer explicit captures over \`[=]\` or \`[&]\` to make dependencies clear and avoid accidentally capturing large objects by value or dangling references.`,
        sortOrder: 6,
      },
      {
        heading: "Iterator invalidation rules",
        content: `Modifying a container can invalidate iterators, references, and pointers to its elements. The rules differ per container:\n\n| Container | Insert | Erase |\n|-----------|--------|-------|\n| \`vector\` | All iterators invalidated if reallocation; otherwise only those at/after insertion point | Iterators at/after erased element |\n| \`deque\` | All iterators invalidated (insertion at front/back may preserve references) | All iterators if not at front/back; front/back erase only invalidates erased |\n| \`list\` | No iterators invalidated | Only iterator to erased element |\n| \`map/set\` | No iterators invalidated | Only iterator to erased element |\n| \`unordered_map\` | All iterators if rehash occurs (when load_factor > max_load_factor) | Only iterator to erased element |\n\n\`\`\`cpp\n// Classic bug: erasing while iterating\nstd::vector<int> v = {1, 2, 3, 4, 5};\nfor (auto it = v.begin(); it != v.end(); ++it) {\n    if (*it % 2 == 0)\n        v.erase(it); // BUG: invalidates it, ++it is UB\n}\n\n// Correct: erase returns next valid iterator\nfor (auto it = v.begin(); it != v.end(); ) {\n    if (*it % 2 == 0)\n        it = v.erase(it);\n    else\n        ++it;\n}\n\n// Modern: std::erase_if (C++20)\nstd::erase_if(v, [](int x) { return x % 2 == 0; });\n\`\`\`\n\nSource: cppreference.com "Iterator invalidation rules", C++ standard [container.requirements.general]`,
        sortOrder: 7,
      },
      {
        heading: "Const-reference lifetime extension",
        content: `A \`const\` lvalue reference (or rvalue reference) bound to a temporary extends that temporary's lifetime to match the reference's lifetime:\n\n\`\`\`cpp\nstd::string make_greeting() { return "Hello, World!"; }\n\n// Temporary would normally be destroyed at end of full-expression\n// But binding to const& extends its lifetime\nconst std::string& greeting = make_greeting(); // OK: lifetime extended\nstd::cout << greeting; // safe — temporary still alive\n\n// Does NOT extend through function calls:\nconst std::string& bad = std::min(std::string("a"), std::string("b"));\n// BAD: temporaries destroyed after min() returns — dangling reference\n\n// Rvalue references also extend lifetime:\nstd::string&& rref = make_greeting(); // OK: lifetime extended\n\`\`\`\n\nCritical gotchas:\n- Lifetime extension does **not** propagate through function return values or member access chains\n- \`auto&&\` extends lifetime (it deduces to an rvalue reference for temporaries)\n- Structured bindings (C++17) to a temporary also extend its lifetime\n\nSource: C++ standard [class.temporary]/6, cppreference.com "Reference initialization"`,
        sortOrder: 8,
      },
      {
        heading: "Sources",
        content: `- ISO/IEC 14882:2020, Sections 13.7 (Templates), 7.5.5 (Lambda expressions)
- Meyers, S. *Effective Modern C++*, Items 18-21 (Smart pointers), 31-34 (Lambdas)
- Josuttis, N.M. *The C++ Standard Library: A Tutorial and Reference*, 2nd ed.
- Stepanov, A. & Lee, M. "The Standard Template Library" (1994)
- cppreference.com, "Containers library" — https://en.cppreference.com/w/cpp/container
- 42 CPP module subjects (CPP07-CPP09)`,
        sortOrder: 7,
      },
    ],
  },

  // ============================================================
  // cpp-oop — L5
  // ============================================================
  {
    competencyId: "cpp-oop",
    depthTier: 5,
    title: "Advanced C++: Move Semantics, Metaprogramming, and Binary Security",
    recommendedLevel: 5,
    sections: [
      {
        heading: "Move Semantics and Rvalue References",
        content: `C++11 introduced rvalue references (\`T&&\`) and move semantics to avoid unnecessary copies. An rvalue reference binds to a temporary (an object about to be destroyed), allowing its resources to be "stolen" rather than copied.

\`\`\`cpp
class Buffer {
    char  *_data;
    size_t _size;

public:
    Buffer(size_t size) : _data(new char[size]), _size(size) {}

    // Copy constructor — deep copy, O(n)
    Buffer(const Buffer &other)
        : _data(new char[other._size]), _size(other._size) {
        std::memcpy(_data, other._data, _size);
    }

    // Move constructor — steal resources, O(1)
    Buffer(Buffer &&other) noexcept
        : _data(other._data), _size(other._size) {
        other._data = nullptr;
        other._size = 0;
    }

    // Move assignment
    Buffer &operator=(Buffer &&other) noexcept {
        if (this != &other) {
            delete[] _data;
            _data = other._data;
            _size = other._size;
            other._data = nullptr;
            other._size = 0;
        }
        return *this;
    }

    ~Buffer() { delete[] _data; }
};

Buffer create_buffer() {
    Buffer b(1024);
    // ... fill b ...
    return b;   // move (or NRVO eliminates the move entirely)
}

Buffer buf = create_buffer();  // no copy — moved or elided
\`\`\`

\`std::move\` does not move anything — it casts an lvalue to an rvalue reference, enabling a move operation:

\`\`\`cpp
Buffer a(512);
Buffer b = std::move(a);  // a is now in a "moved-from" state
// Using a after this (except reassigning or destroying) is risky
\`\`\`

Security implication: moved-from objects are in a valid but unspecified state. In security-sensitive code, ensure that the moved-from state does not leak sensitive data (e.g., the old buffer pointer might still be cached somewhere).`,
        sortOrder: 0,
      },
      {
        heading: "Perfect Forwarding and Universal References",
        content: `When writing wrapper functions or factory functions, you need to preserve the value category (lvalue vs rvalue) of arguments. This is **perfect forwarding**:

\`\`\`cpp
template <typename T, typename... Args>
std::unique_ptr<T> make_unique_custom(Args&&... args) {
    return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}
\`\`\`

\`Args&&\` in a template context is a **forwarding reference** (also called universal reference), not an rvalue reference. It binds to both lvalues and rvalues. \`std::forward<Args>(args)\` preserves the original value category:
- If an lvalue was passed, it forwards as an lvalue.
- If an rvalue was passed, it forwards as an rvalue.

\`\`\`cpp
// Without forwarding — always copies
template <typename T>
void wrapper_bad(T arg) {
    target(arg);  // always lvalue — copies even temporaries
}

// With forwarding — zero overhead
template <typename T>
void wrapper_good(T&& arg) {
    target(std::forward<T>(arg));  // preserves value category
}
\`\`\`

This is the foundation of efficient generic code in modern C++. The STL's \`emplace_back\`, \`std::make_shared\`, and \`std::invoke\` all rely on perfect forwarding.`,
        sortOrder: 1,
      },
      {
        heading: "Variadic Templates and Fold Expressions",
        content: `Variadic templates accept any number of template arguments:

\`\`\`cpp
// Recursive base case
void print() {}

// Variadic recursive function
template <typename T, typename... Rest>
void print(const T &first, const Rest&... rest) {
    std::cout << first;
    if constexpr (sizeof...(rest) > 0) {
        std::cout << ", ";
        print(rest...);
    }
}

print(1, "hello", 3.14, 'x');
// Output: 1, hello, 3.14, x
\`\`\`

C++17 fold expressions simplify this:

\`\`\`cpp
// Sum all arguments
template <typename... Args>
auto sum(Args... args) {
    return (... + args);   // left fold: ((a1 + a2) + a3) + ...
}

// Print all with separator
template <typename... Args>
void print_all(const Args&... args) {
    ((std::cout << args << " "), ...);  // comma fold
    std::cout << std::endl;
}

sum(1, 2, 3, 4);      // 10
print_all("a", "b", "c"); // a b c
\`\`\`

Variadic templates are used extensively in:
- \`std::tuple\` and \`std::variant\`
- Type-safe printf replacements (\`fmt::format\`, \`std::format\`)
- Compile-time configuration and policy-based design`,
        sortOrder: 2,
      },
      {
        heading: "Compile-Time Programming with constexpr and consteval",
        content: `\`constexpr\` functions can be evaluated at compile time when all inputs are known:

\`\`\`cpp
constexpr uint64_t fibonacci(int n) {
    if (n <= 1) return n;
    uint64_t a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        uint64_t c = a + b;
        a = b;
        b = c;
    }
    return b;
}

// Computed at compile time — no runtime cost
constexpr uint64_t fib50 = fibonacci(50);

// consteval (C++20) — MUST be evaluated at compile time
consteval int square(int n) { return n * n; }
\`\`\`

Compile-time hash function for switch-on-string patterns:

\`\`\`cpp
constexpr uint32_t fnv1a(const char *str) {
    uint32_t hash = 2166136261u;
    while (*str) {
        hash ^= static_cast<uint32_t>(*str++);
        hash *= 16777619u;
    }
    return hash;
}

void process_command(const std::string &cmd) {
    switch (fnv1a(cmd.c_str())) {
        case fnv1a("help"):  show_help();  break;
        case fnv1a("quit"):  do_quit();    break;
        case fnv1a("scan"):  run_scan();   break;
        default: std::cerr << "Unknown command" << std::endl;
    }
}
\`\`\`

Security implication: constexpr computation produces no runtime attack surface for the computation itself. Moving security checks (bounds validation, format verification) to compile time eliminates entire vulnerability classes.`,
        sortOrder: 3,
      },
      {
        heading: "SFINAE, Concepts, and Type Constraints",
        content: `**SFINAE** (Substitution Failure Is Not An Error) is a template metaprogramming technique where an invalid template substitution silently removes a candidate from overload resolution:

\`\`\`cpp
// C++11/14 SFINAE — enable function only for integral types
template <typename T>
typename std::enable_if<std::is_integral<T>::value, T>::type
safe_add(T a, T b) {
    if (__builtin_add_overflow(a, b, &a))
        throw std::overflow_error("integer overflow");
    return a;
}
\`\`\`

C++20 **concepts** replace SFINAE with cleaner syntax:

\`\`\`cpp
#include <concepts>

template <std::integral T>
T safe_add(T a, T b) {
    if (__builtin_add_overflow(a, b, &a))
        throw std::overflow_error("integer overflow");
    return a;
}

// Custom concept
template <typename T>
concept Printable = requires(T t, std::ostream &os) {
    { os << t } -> std::same_as<std::ostream &>;
};

template <Printable T>
void log(const T &value) {
    std::cout << "[LOG] " << value << std::endl;
}
\`\`\`

Concepts produce much better error messages than SFINAE. When a template constraint is not satisfied, the compiler reports which concept requirement failed, rather than spewing pages of template instantiation errors.`,
        sortOrder: 4,
      },
      {
        heading: "C++ Binary Layout and Exploitation",
        content: `Understanding how C++ objects are laid out in memory is essential for binary analysis and exploitation:

**Object layout with virtual functions:**
\`\`\`
+------------------+
| vptr             |  8 bytes (pointer to vtable)
+------------------+
| member_1         |  sizeof(member_1)
+------------------+
| member_2         |  sizeof(member_2)
+------------------+
| padding          |  alignment
+------------------+
\`\`\`

**Vtable layout:**
\`\`\`
+------------------+
| typeinfo ptr     |  for dynamic_cast and typeid
+------------------+
| virtual_func_1   |  function pointer
+------------------+
| virtual_func_2   |  function pointer
+------------------+
| ...              |
+------------------+
\`\`\`

**Reversing C++ binaries with Ghidra/IDA:**

1. Look for vtable references — they are typically in the \`.rodata\` section.
2. Cross-reference vtable pointers to identify constructor functions (constructors write the vptr).
3. Use RTTI (Run-Time Type Information) if not stripped — the \`typeinfo\` objects contain class names and inheritance relationships.

\`\`\`bash
# List RTTI typeinfo structures
readelf -s binary | grep -i typeinfo
# Demangle C++ symbols
c++filt _ZN5MyApp7processEPKc
# Output: MyApp::process(char const*)
\`\`\`

**Name mangling**: C++ compilers encode type information into symbol names. The Itanium ABI (used by GCC and Clang) prepends \`_Z\`, followed by the namespace/class nesting and parameter types. Understanding mangling helps when reading disassembly.

**Exception handling tables**: the \`.eh_frame\` and \`.gcc_except_table\` sections contain DWARF CFI (Call Frame Information) descriptors used for stack unwinding during exception propagation. These are data tables, not executable code. Advanced exploitation techniques can abuse forged unwind metadata to hijack control flow during exception unwinding — a different mechanism from traditional ROP gadgets (see "Exception-Oriented Programming" research).`,
        sortOrder: 5,
      },
      {
        heading: "Modern C++ Security Patterns",
        content: `Modern C++ offers features that, when used correctly, eliminate entire vulnerability classes:

**\`std::span\` (C++20)** — a non-owning view over a contiguous sequence, with bounds information:
\`\`\`cpp
void process(std::span<const std::byte> data) {
    // data.size() is always correct — no buffer overflow from size mismatch
    for (auto b : data)
        // ...
}
\`\`\`

**\`std::optional\`** — explicit nullable values, replacing null pointers:
\`\`\`cpp
std::optional<User> find_user(int id) {
    if (/* found */)
        return User{...};
    return std::nullopt;  // explicit "not found"
}

if (auto user = find_user(42)) {
    // use *user safely
}
\`\`\`

**\`std::variant\`** — type-safe union:
\`\`\`cpp
std::variant<int, std::string, std::vector<int>> data;
data = "hello";  // holds a string
// Access with std::get or std::visit — type mismatch throws, not UB
\`\`\`

**Sanitiser integration**: modern C++ code should be tested with:
\`\`\`bash
# ASan + UBSan together for maximum coverage
clang++ -std=c++20 -fsanitize=address,undefined \\
        -fno-omit-frame-pointer -g -o test test.cpp
\`\`\`

**Hardening the STL**: libstdc++ and libc++ offer debug modes that add bounds checking to containers:
\`\`\`bash
# GCC libstdc++ debug mode
g++ -D_GLIBCXX_DEBUG -D_GLIBCXX_DEBUG_PEDANTIC -o test test.cpp

# LLVM libc++ hardened mode
clang++ -D_LIBCPP_HARDENING_MODE=_LIBCPP_HARDENING_MODE_FAST -o test test.cpp
\`\`\`

These modes add bounds checks to \`operator[]\`, iterator validity checks, and precondition assertions — catching bugs that the non-debug mode leaves as undefined behaviour.`,
        sortOrder: 6,
      },
      {
        heading: "Type erasure pattern",
        content: `Type erasure hides concrete types behind a uniform interface without virtual inheritance at the call site — the pattern behind \`std::function\`, \`std::any\`, and \`std::packaged_task\`.\n\n\`\`\`mermaid\nclassDiagram\n    class AnyCallable {\n        -unique_ptr~Concept~ impl\n        +operator()(Args...) R\n    }\n    class Concept {\n        <<interface>>\n        +call(Args...) R*\n        +clone() unique_ptr~Concept~*\n    }\n    class Model~T~ {\n        -T callable\n        +call(Args...) R\n        +clone() unique_ptr~Concept~\n    }\n    AnyCallable --> Concept\n    Concept <|-- Model\n\`\`\`\n\n\`\`\`cpp\n// Simplified std::function-like type erasure\ntemplate<typename R, typename... Args>\nclass Function<R(Args...)> {\n    // Abstract base — the "Concept"\n    struct Concept {\n        virtual R call(Args... args) = 0;\n        virtual std::unique_ptr<Concept> clone() const = 0;\n        virtual ~Concept() = default;\n    };\n\n    // Templated derived — the "Model"\n    template<typename F>\n    struct Model : Concept {\n        F func;\n        Model(F f) : func(std::move(f)) {}\n        R call(Args... args) override { return func(std::forward<Args>(args)...); }\n        std::unique_ptr<Concept> clone() const override {\n            return std::make_unique<Model>(func);\n        }\n    };\n\n    std::unique_ptr<Concept> impl;\npublic:\n    template<typename F>\n    Function(F f) : impl(std::make_unique<Model<F>>(std::move(f))) {}\n    R operator()(Args... args) { return impl->call(std::forward<Args>(args)...); }\n};\n\`\`\`\n\nThe key insight: the template parameter \`F\` only appears in the constructor (and Model) — it is "erased" from the class type. The caller uses \`Function<int(int)>\` regardless of what callable it wraps (lambda, function pointer, functor).\n\nSource: Sean Parent, "Inheritance Is the Base Class of Evil" (GoingNative 2013); cppreference.com/w/cpp/utility/any`,
        sortOrder: 7,
      },
      {
        heading: "Sources",
        content: `- ISO/IEC 14882:2020 (C++20), Sections on move semantics, concepts, constexpr, span
- Meyers, S. *Effective Modern C++*, Items 23-30 (Move semantics and perfect forwarding)
- Stroustrup, B. *The C++ Programming Language*, 4th ed., Chapters 23-29 (Templates)
- Itanium C++ ABI — https://itanium-cxx-abi.github.io/cxx-abi/abi.html
- C++ Core Guidelines — https://isocpp.github.io/CppCoreGuidelines/
- "Smashing C++ Vptrs" — Phrack 56
- libc++ hardening — https://libcxx.llvm.org/Hardening.html
- GCC libstdc++ debug mode — https://gcc.gnu.org/onlinedocs/libstdc++/manual/debug_mode.html
- cppreference.com, "std::span" — https://en.cppreference.com/w/cpp/container/span`,
        sortOrder: 7,
      },
    ],
  },
];
