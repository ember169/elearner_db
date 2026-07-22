import type { QuestionTemplate } from "../types";

export const BINEXP_TEMPLATES: QuestionTemplate[] = [
  {
    competencyId: "binexp",
    subTopic: "ret2libc",
    questionType: "trace_explain",
    difficulty: 3,
    questionText: `A binary has NX enabled but no ASLR or PIE. You have a buffer overflow in a function that reads user input into a 64-byte stack buffer. Using GDB you find:

\`\`\`
(gdb) p system
$1 = {int (const char *)} 0xf7e4c850 <system>
(gdb) p exit
$2 = {void (int)} 0xf7e3f0d0 <exit>
(gdb) find &system,+9999999,"/bin/sh"
0xf7f5f406
(gdb) info frame
Stack level 0, frame at 0xffffd6a0
 Saved registers:
  ebp at 0xffffd698, eip at 0xffffd69c
\`\`\`

The buffer starts at 0xffffd654.

1. Why can't you use a traditional shellcode-on-stack approach?
2. Construct the ret2libc payload layout. Show the exact stack layout byte-by-byte from the buffer start.
3. What is the role of the exit() address in your payload?`,
    rubric: {
      maxScore: 8,
      criteria: [
        { id: "nx-explanation", description: "Explains NX prevents executing code on the stack", points: 2, keywords: ["NX", "non-executable", "DEP", "stack", "execute", "W^X"], check: "Student explains that NX marks the stack as non-executable, so injected shellcode cannot run" },
        { id: "payload-layout", description: "Constructs correct ret2libc payload: padding + system + exit + /bin/sh pointer", points: 3, keywords: ["padding", "72 bytes", "system", "exit", "0xf7f5f406", "/bin/sh", "return address"], check: "Student shows: 72 bytes padding (64 buffer + 4 saved EBP + 4 saved EIP) or correctly calculates offset, then system address, then exit address as fake return, then pointer to /bin/sh as system's argument" },
        { id: "exit-role", description: "Explains exit() serves as system()'s return address for clean exit", points: 2, keywords: ["return address", "clean", "exit", "segfault", "crash", "graceful"], check: "Student explains exit() is placed where system()'s return address would be, so the process exits cleanly instead of crashing" },
        { id: "offset-calc", description: "Correctly calculates the buffer-to-EIP offset", points: 1, keywords: ["0xffffd69c", "0xffffd654", "72", "68", "offset", "EBP"], check: "Student calculates offset from buffer start to saved EIP (0xffffd69c - 0xffffd654 = 72 bytes, or 64 + 4 for saved EBP = 68 to EBP)" },
      ],
      gaps: [
        { if_missing: "nx-explanation", gap: "Does not understand NX/DEP memory protection" },
        { if_missing: "payload-layout", gap: "Cannot construct ret2libc stack layout" },
        { if_missing: "exit-role", gap: "Does not understand calling convention in ret2libc chains" },
      ],
    },
  },
  {
    competencyId: "binexp",
    subTopic: "rop-basics",
    questionType: "trace_explain",
    difficulty: 3,
    questionText: `You are exploiting a 64-bit binary with NX and ASLR disabled. You found these ROP gadgets:

\`\`\`
0x0000000000401234 : pop rdi ; ret
0x0000000000401236 : pop rsi ; pop r15 ; ret
0x000000000040123a : pop rdx ; ret
0x0000000000401240 : syscall ; ret
\`\`\`

You want to call execve("/bin/sh", NULL, NULL). The string "/bin/sh" is at 0x402000. In x86_64 Linux, execve is syscall number 59 (0x3b).

1. What register holds the syscall number in x86_64?
2. Write out the exact ROP chain (sequence of addresses on the stack) that performs execve("/bin/sh", NULL, NULL).
3. Explain what happens at each step as the chain executes.`,
    rubric: {
      maxScore: 8,
      criteria: [
        { id: "syscall-register", description: "Identifies rax holds the syscall number", points: 1, keywords: ["rax", "syscall number", "0x3b", "59"], check: "Student identifies rax holds the syscall number in x86_64" },
        { id: "rop-chain", description: "Constructs correct ROP chain with proper register setup", points: 3, keywords: ["pop rdi", "0x402000", "pop rsi", "NULL", "0", "pop rdx", "syscall", "chain"], check: "Student constructs chain: pop rdi gadget + /bin/sh addr + pop rsi gadget + 0 + junk for r15 + pop rdx gadget + 0 + syscall gadget. Notes they also need to set rax to 0x3b" },
        { id: "chain-execution", description: "Traces execution step by step through the chain", points: 2, keywords: ["ret", "pops", "stack", "instruction pointer", "returns to", "executes"], check: "Student traces how each ret pops the next gadget address into RIP, each pop loads a value from the stack into the target register" },
        { id: "rax-issue", description: "Identifies the missing rax setup", points: 2, keywords: ["rax", "missing", "no pop rax", "syscall number", "set rax", "0x3b"], check: "Student notices there is no pop rax gadget provided and addresses how to set rax to 0x3b for execve" },
      ],
      gaps: [
        { if_missing: "syscall-register", gap: "Does not know x86_64 syscall calling convention" },
        { if_missing: "rop-chain", gap: "Cannot construct a basic ROP chain" },
        { if_missing: "rax-issue", gap: "Does not verify all required registers are set in a ROP chain" },
      ],
    },
  },
  {
    competencyId: "binexp",
    subTopic: "canary-bypass",
    questionType: "spot_vuln",
    difficulty: 2,
    questionText: `This server program runs with stack canaries enabled. Find the vulnerability that allows bypassing the canary:

\`\`\`c
#include <stdio.h>
#include <string.h>
#include <unistd.h>

void handle_client(int fd) {
    char buf[128];
    int i;

    for (i = 0; ; i++) {
        ssize_t n = read(fd, &buf[i], 1);
        if (n <= 0 || buf[i] == '\\n')
            break;
    }
    buf[i] = '\\0';

    dprintf(fd, "You said: %s\\n", buf);
}

int main() {
    // ... fork()-based server setup
    // Each client gets its own fork()
    while (1) {
        int client = accept(sockfd, NULL, NULL);
        if (fork() == 0) {
            handle_client(client);
            _exit(0);
        }
        close(client);
    }
}
\`\`\`

1. What is the buffer overflow vulnerability?
2. Why does the fork()-based architecture make canary bypass possible?
3. Describe the technique to leak the canary value.`,
    rubric: {
      maxScore: 8,
      criteria: [
        { id: "overflow-id", description: "Identifies the unbounded read loop overflows buf", points: 2, keywords: ["no bounds check", "i", "128", "read loop", "unbounded", "overflow"], check: "Student identifies the byte-by-byte read loop has no bounds check on i, allowing writing past buf[127]" },
        { id: "fork-canary", description: "Explains fork preserves the same canary in child processes", points: 3, keywords: ["fork", "same canary", "child", "copied", "address space", "clone", "not re-randomized"], check: "Student explains that fork() copies the parent's memory including the canary, so every child has the same canary value" },
        { id: "brute-force", description: "Describes byte-by-byte canary brute-force technique", points: 3, keywords: ["byte-by-byte", "brute force", "one byte", "256", "crash", "no crash", "null byte", "leak"], check: "Student describes: overflow one byte past the canary at a time, try all 256 values, correct byte = child doesn't crash; repeat for each canary byte" },
      ],
      gaps: [
        { if_missing: "overflow-id", gap: "Cannot identify unbounded read buffer overflow" },
        { if_missing: "fork-canary", gap: "Does not understand fork and stack canary interaction" },
        { if_missing: "brute-force", gap: "Does not know byte-by-byte canary brute-force technique" },
      ],
    },
  },
  {
    competencyId: "binexp",
    subTopic: "heap-uaf",
    questionType: "spot_vuln",
    difficulty: 2,
    questionText: `Identify the exploitable vulnerability in this program:

\`\`\`c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct user {
    char name[32];
    void (*print_info)(struct user *);
};

void print_user(struct user *u) {
    printf("User: %s\\n", u->name);
}

void admin_shell() {
    system("/bin/sh");
}

int main() {
    struct user *u = malloc(sizeof(struct user));
    strcpy(u->name, "guest");
    u->print_info = print_user;

    printf("1. Print info\\n2. Delete user\\n3. Edit name\\n4. Print info again\\n> ");

    int choice;
    while (scanf("%d", &choice) == 1) {
        switch (choice) {
            case 1: u->print_info(u); break;
            case 2: free(u); break;
            case 3:
                printf("Name: ");
                scanf("%31s", u->name);
                break;
            case 4: u->print_info(u); break;
        }
        printf("> ");
    }
}
\`\`\`

1. What is the vulnerability class?
2. Describe the exact sequence of menu choices to get a shell.
3. Explain why the function pointer in the struct makes this exploitable.`,
    rubric: {
      maxScore: 8,
      criteria: [
        { id: "uaf-class", description: "Identifies this as a use-after-free vulnerability", points: 2, keywords: ["use-after-free", "UAF", "dangling pointer", "freed", "still used"], check: "Student identifies the vulnerability as use-after-free: free(u) in case 2 doesn't set u to NULL, and cases 1/3/4 continue using it" },
        { id: "exploit-sequence", description: "Provides correct exploitation sequence", points: 3, keywords: ["2", "free", "3", "edit", "overwrite", "4", "print", "admin_shell", "function pointer"], check: "Student describes: choose 2 (free), then 3 (edit name writes into freed chunk reusing the same allocation), overwrite the function pointer area with admin_shell address, then choose 1 or 4 to call the overwritten pointer" },
        { id: "fptr-explanation", description: "Explains how the function pointer enables code execution", points: 3, keywords: ["function pointer", "print_info", "overwrite", "control flow", "call", "hijack", "indirect call"], check: "Student explains the struct layout places the function pointer after name, and after freeing+reallocating the same-size chunk, writing to name can overwrite print_info, redirecting the indirect call" },
      ],
      gaps: [
        { if_missing: "uaf-class", gap: "Does not recognize use-after-free vulnerability pattern" },
        { if_missing: "exploit-sequence", gap: "Cannot chain heap UAF into code execution" },
        { if_missing: "fptr-explanation", gap: "Does not understand function pointer hijacking via heap" },
      ],
    },
  },
  {
    competencyId: "binexp",
    subTopic: "got-overwrite",
    questionType: "trace_explain",
    difficulty: 3,
    questionText: `A binary has Partial RELRO (no Full RELRO), no PIE, and NX enabled. You have an arbitrary write primitive that lets you write 8 bytes to any address.

\`\`\`
$ objdump -R ./vuln | grep puts
0000000000404018  R_X86_64_JUMP_SLOT  puts@GLIBC_2.2.5

$ objdump -d ./vuln | grep '<system@plt>'
0000000000401040 <system@plt>:

$ readelf -r ./vuln | head
Relocation section '.rela.plt' at offset 0x448:
  Offset          Info           Type           Sym. Value    Sym. Name + Addend
000000404018  000200000007 R_X86_64_JUMP_SL 0000000000000000 puts@GLIBC_2.2.5 + 0
000000404020  000300000007 R_X86_64_JUMP_SL 0000000000000000 printf@GLIBC_2.2.5 + 0
\`\`\`

After the arbitrary write, the program calls \`puts(user_input)\`.

1. Explain what the GOT and PLT are, and how lazy binding works.
2. How would you use the arbitrary write to redirect puts() to system()?
3. What protection prevents this attack, and why is it not enabled here?`,
    rubric: {
      maxScore: 8,
      criteria: [
        { id: "got-plt", description: "Explains GOT/PLT and lazy binding mechanism", points: 2, keywords: ["GOT", "PLT", "Global Offset Table", "Procedure Linkage Table", "lazy binding", "first call", "resolver", "dynamic linker"], check: "Student explains: PLT is a trampoline that jumps to the GOT entry; on first call, GOT points back to PLT resolver which calls ld.so to fill in the real address; subsequent calls jump directly to the resolved address" },
        { id: "overwrite-technique", description: "Describes writing system@plt address to puts GOT entry", points: 3, keywords: ["0x404018", "0x401040", "write", "system", "puts GOT", "overwrite", "redirect"], check: "Student describes: write the address of system@plt (0x401040) to the puts GOT entry (0x404018), so when puts(user_input) is called, it actually calls system(user_input)" },
        { id: "relro-protection", description: "Identifies Full RELRO as the protection against GOT overwrites", points: 3, keywords: ["Full RELRO", "RELRO", "read-only", "BIND_NOW", "eagerly", "writable", "Partial RELRO"], check: "Student explains Full RELRO makes the GOT read-only after startup by resolving all symbols eagerly; Partial RELRO only protects .got but not .got.plt" },
      ],
      gaps: [
        { if_missing: "got-plt", gap: "Does not understand GOT/PLT lazy binding mechanism" },
        { if_missing: "overwrite-technique", gap: "Cannot perform GOT overwrite attack" },
        { if_missing: "relro-protection", gap: "Does not understand RELRO protection levels" },
      ],
    },
  },
  {
    competencyId: "binexp",
    subTopic: "format-string-write",
    questionType: "fix_code",
    difficulty: 3,
    questionText: `A CTF challenge has a format string vulnerability. The goal is to overwrite a variable \`is_admin\` at address 0x404060 with the value 1. The current exploit attempt doesn't work. Fix it and explain why:

\`\`\`python
from pwn import *

p = process('./challenge')

# Attempt 1: Direct approach (doesn't work)
payload = b"AAAA" + b"%x " * 20  # Find offset first
p.sendline(payload)
print(p.recvline())  # Shows AAAA at position 6

# Attempt 2: Write attempt (crashes)
target = 0x404060
payload = p64(target) + b"%1c%6$n"
p.sendline(payload)
\`\`\`

The program is 64-bit. When running Attempt 2, the program crashes with SIGSEGV.

1. Why does Attempt 2 crash?
2. Fix the exploit to successfully write 1 to 0x404060.
3. Explain the difference between %n, %hn, and %hhn in format string attacks.`,
    rubric: {
      maxScore: 10,
      criteria: [
        { id: "null-byte-issue", description: "Identifies that p64(target) contains null bytes that truncate the format string", points: 3, keywords: ["null byte", "0x00", "truncate", "p64", "64-bit", "address", "high bytes"], check: "Student identifies that 64-bit addresses like 0x0000000000404060 contain null bytes that terminate the string when placed at the start of the payload" },
        { id: "fix-exploit", description: "Provides working fix by placing address after format specifier", points: 3, keywords: ["after", "end", "format specifier first", "padding", "address at end", "%7$n", "positional"], check: "Student fixes by putting the format string first and the address after, using positional argument to reference the address's stack location" },
        { id: "write-size", description: "Explains %n vs %hn vs %hhn", points: 2, keywords: ["%n", "4 bytes", "%hn", "2 bytes", "%hhn", "1 byte", "short", "char", "written count"], check: "Student explains: %n writes 4 bytes (int), %hn writes 2 bytes (short), %hhn writes 1 byte (char) — all write the count of characters printed so far" },
        { id: "precision-control", description: "Shows how to control the exact value written", points: 2, keywords: ["padding", "%c", "width", "printed characters", "count", "precision", "minus 8"], check: "Student shows how to use format width specifiers to control the exact number of characters printed before %n to write the desired value" },
      ],
      gaps: [
        { if_missing: "null-byte-issue", gap: "Does not understand null byte issues in 64-bit format string attacks" },
        { if_missing: "fix-exploit", gap: "Cannot construct working 64-bit format string write" },
        { if_missing: "write-size", gap: "Does not know %n/%hn/%hhn format string write sizes" },
      ],
    },
  },
  {
    competencyId: "binexp",
    subTopic: "aslr-leak",
    questionType: "design_solution",
    difficulty: 4,
    questionText: `You have a binary with the following protections:

\`\`\`
RELRO:    Full RELRO
Stack:    Canary found
NX:       NX enabled
PIE:      PIE enabled
ASLR:     Enabled
\`\`\`

The binary has a format string vulnerability that lets you read from the stack (but not write — %n is filtered). It also has a separate stack buffer overflow in another function. The binary links against libc 2.31.

Design a two-stage exploit:
1. Stage 1: Use the format string read to defeat ASLR and leak necessary addresses
2. Stage 2: Use the buffer overflow with leaked addresses to get a shell

Describe what addresses you need to leak and why, and how you would use them in stage 2.`,
    rubric: {
      maxScore: 10,
      criteria: [
        { id: "leak-strategy", description: "Identifies which addresses to leak from the stack", points: 3, keywords: ["return address", "libc", "__libc_start_main", "stack address", "canary", "pie base", "text base"], check: "Student identifies needing to leak: (1) a libc address (like __libc_start_main return addr) to calculate libc base, (2) the stack canary to bypass it in stage 2, (3) optionally a PIE text address to find gadgets" },
        { id: "libc-calculation", description: "Explains how to calculate libc base and find system/binsh from leak", points: 2, keywords: ["offset", "subtract", "libc base", "system", "/bin/sh", "libc database", "known offset"], check: "Student explains: leaked_libc_addr - known_offset = libc_base, then system = libc_base + system_offset, /bin/sh = libc_base + binsh_offset" },
        { id: "stage2-payload", description: "Describes the stage 2 overflow payload using leaked values", points: 3, keywords: ["canary", "ROP", "one_gadget", "system", "pop rdi", "overflow", "ret2libc"], check: "Student constructs stage 2: padding + leaked canary + saved RBP + ROP chain using leaked libc addresses (either ret2libc with system or one_gadget)" },
        { id: "pie-handling", description: "Addresses PIE in the exploit strategy", points: 2, keywords: ["PIE", "base address", "text leak", "gadget", "relative", "binary base"], check: "Student addresses how PIE affects gadget addresses and how to leak or calculate the binary base for using gadgets from the main binary" },
      ],
      gaps: [
        { if_missing: "leak-strategy", gap: "Cannot identify useful addresses to leak for ASLR bypass" },
        { if_missing: "libc-calculation", gap: "Does not understand libc base calculation from leaks" },
        { if_missing: "stage2-payload", gap: "Cannot chain information leak into exploitation" },
      ],
    },
  },
  {
    competencyId: "binexp",
    subTopic: "heap-tcache",
    questionType: "trace_explain",
    difficulty: 4,
    questionText: `Consider this glibc 2.31 heap scenario. Trace the tcache state after each operation:

\`\`\`c
#include <stdlib.h>
#include <string.h>

int main() {
    // Phase 1: Allocations
    char *a = malloc(0x20);   // chunk A
    char *b = malloc(0x20);   // chunk B
    char *c = malloc(0x20);   // chunk C

    // Phase 2: Frees
    free(a);  // Step 1
    free(b);  // Step 2
    free(c);  // Step 3

    // Phase 3: Double-free (no tcache key check in glibc < 2.32)
    free(b);  // Step 4

    // Phase 4: Reuse
    char *d = malloc(0x20);  // Step 5
    char *e = malloc(0x20);  // Step 6

    // Write a controlled pointer
    *(unsigned long *)e = 0x404060;

    char *f = malloc(0x20);  // Step 7
    char *g = malloc(0x20);  // Step 8: Where does this point?

    return 0;
}
\`\`\`

1. Draw the tcache linked list state after each step (1-8).
2. Where does chunk \`g\` point to and why?
3. What mitigation was added in glibc 2.32 to prevent this?`,
    rubric: {
      maxScore: 10,
      criteria: [
        { id: "tcache-freelist", description: "Correctly traces the tcache singly-linked list after each free", points: 3, keywords: ["LIFO", "C->B->A", "tcache", "singly linked", "fd pointer", "next"], check: "Student traces: step 1: A, step 2: B->A, step 3: C->B->A, step 4: B->C->B->A (circular)" },
        { id: "double-free-cycle", description: "Explains how double-free creates a cycle in the tcache list", points: 2, keywords: ["double free", "cycle", "circular", "B->C->B", "duplicate", "same chunk twice"], check: "Student explains step 4 creates B->C->B->A, meaning B appears twice in the freelist, creating a cycle" },
        { id: "allocation-trace", description: "Correctly traces allocations consuming the corrupted list", points: 3, keywords: ["d=B", "e=C", "write", "fd", "f=B", "g=0x404060", "arbitrary"], check: "Student traces: d gets B, e gets C (then C's fd is overwritten to 0x404060), f gets B again, g gets 0x404060 — arbitrary address allocation" },
        { id: "glibc-mitigation", description: "Describes the tcache key mitigation in glibc 2.32+", points: 2, keywords: ["tcache key", "e->key", "tcache_perthread_struct", "random", "detect", "double free", "2.32"], check: "Student explains glibc 2.32 added a tcache key field (random value) that detects double-frees by checking if the key matches before allowing a free into the tcache" },
      ],
      gaps: [
        { if_missing: "tcache-freelist", gap: "Does not understand tcache freelist structure" },
        { if_missing: "double-free-cycle", gap: "Cannot trace tcache double-free corruption" },
        { if_missing: "allocation-trace", gap: "Cannot trace tcache poisoning to arbitrary allocation" },
        { if_missing: "glibc-mitigation", gap: "Does not know modern glibc tcache mitigations" },
      ],
    },
  },
  {
    competencyId: "binexp",
    subTopic: "nx-aslr-comparison",
    questionType: "compare_contrast",
    difficulty: 4,
    questionText: `Compare the following memory protection mechanisms. For each one, explain:
- What it protects against
- How it works at the OS/hardware level
- Known bypass techniques
- Its limitations

Protections to compare:
1. **NX/DEP** (No-eXecute / Data Execution Prevention)
2. **ASLR** (Address Space Layout Randomization)
3. **Stack Canaries** (SSP - Stack Smashing Protector)
4. **RELRO** (Relocation Read-Only)

Also explain: which combinations of these protections are most effective, and what attack techniques still work when ALL four are enabled?`,
    rubric: {
      maxScore: 10,
      criteria: [
        { id: "nx-analysis", description: "Correctly describes NX and its bypass", points: 2, keywords: ["NX", "page table", "execute bit", "hardware", "ROP", "ret2libc", "code reuse", "W^X"], check: "Student explains NX marks memory pages as non-executable via page table NX bit, bypassed by code reuse attacks (ROP, ret2libc)" },
        { id: "aslr-analysis", description: "Correctly describes ASLR and its bypass", points: 2, keywords: ["ASLR", "randomize", "base address", "libc", "heap", "stack", "info leak", "brute force", "entropy"], check: "Student explains ASLR randomizes base addresses of libraries/stack/heap, bypassed by information leaks or brute force (limited entropy on 32-bit)" },
        { id: "canary-relro", description: "Correctly describes canaries and RELRO", points: 2, keywords: ["canary", "random value", "before return", "check", "RELRO", "GOT", "read-only", "Partial", "Full"], check: "Student explains canaries place random values before return addresses checked on function exit; RELRO makes GOT read-only (Partial: .got only, Full: .got.plt too)" },
        { id: "combination-effectiveness", description: "Analyzes protection combinations and remaining attacks", points: 2, keywords: ["combination", "all four", "info leak", "heap", "JIT", "ROP chain", "one_gadget", "stack pivot"], check: "Student discusses how protections complement each other and what remains possible with all enabled (e.g., info leak + ROP, heap exploitation, JIT spraying)" },
        { id: "bypasses-depth", description: "Shows depth of understanding of bypass techniques", points: 2, keywords: ["partial overwrite", "blind ROP", "ret2csu", "sigreturn", "SROP", "format string", "type confusion"], check: "Student mentions advanced bypass techniques beyond the basics" },
      ],
      gaps: [
        { if_missing: "nx-analysis", gap: "Does not understand NX/DEP mechanism and bypass" },
        { if_missing: "aslr-analysis", gap: "Does not understand ASLR mechanism and bypass" },
        { if_missing: "combination-effectiveness", gap: "Cannot analyze defense-in-depth effectiveness" },
      ],
    },
  },
  {
    competencyId: "binexp",
    subTopic: "rop-chain-design",
    questionType: "design_solution",
    difficulty: 5,
    questionText: `You need to exploit a 64-bit Linux binary with all standard protections enabled (NX, ASLR, PIE, Full RELRO, stack canary). The binary has:
- A format string vulnerability in function \`log_message()\` that lets you leak stack data
- A stack buffer overflow in function \`process_input()\` (128-byte buffer, reads 256 bytes)
- The binary uses libc 2.35 (latest mitigations)

The program flow calls \`log_message()\` first, then \`process_input()\`.

Design a complete exploit strategy:
1. What information do you need to leak in stage 1, and how?
2. How do you handle the stack canary?
3. Design the ROP chain for stage 2 (you can assume you know the libc version)
4. What specific challenges does glibc 2.35 present compared to older versions?`,
    rubric: {
      maxScore: 10,
      criteria: [
        { id: "leak-plan", description: "Designs comprehensive leak strategy for all needed values", points: 2, keywords: ["format string", "%p", "positional", "canary", "libc return", "PIE base", "leak", "stack offset"], check: "Student plans to leak: stack canary, a libc address (for base calculation), and a binary address (for PIE base) using format string positional parameters" },
        { id: "canary-bypass", description: "Correctly handles the canary in the overflow payload", points: 2, keywords: ["canary", "leaked", "place", "correct position", "128", "offset", "preserved"], check: "Student places the leaked canary at the correct offset (after the 128-byte buffer + alignment) to pass the canary check" },
        { id: "rop-construction", description: "Designs a viable ROP chain using libc gadgets", points: 3, keywords: ["pop rdi", "ret", "/bin/sh", "system", "execve", "one_gadget", "alignment", "ret gadget"], check: "Student designs ROP chain: ret (for stack alignment on 2.35), pop rdi, /bin/sh string address, system or execve. Addresses libc gadgets found via ROPgadget/one_gadget" },
        { id: "glibc-235-challenges", description: "Identifies glibc 2.35-specific challenges", points: 3, keywords: ["2.35", "safe-linking", "tcache", "pointer mangling", "one_gadget constraints", "setcontext", "alignment", "stack alignment"], check: "Student mentions glibc 2.35 challenges: safe-linking (pointer mangling in tcache/fastbins), stricter one_gadget constraints, mandatory 16-byte stack alignment for system(), tighter ASLR entropy" },
      ],
      gaps: [
        { if_missing: "leak-plan", gap: "Cannot design multi-value information leak strategy" },
        { if_missing: "rop-construction", gap: "Cannot design modern ROP chain with libc gadgets" },
        { if_missing: "glibc-235-challenges", gap: "Does not know modern glibc mitigation evolution" },
      ],
    },
  },
  {
    competencyId: "binexp",
    subTopic: "pwntools-exploit",
    questionType: "fix_code",
    difficulty: 3,
    questionText: `This pwntools exploit script has several bugs. The target is a 32-bit binary with a simple stack buffer overflow (no canary, no PIE, NX enabled). Fix all the issues:

\`\`\`python
from pwn import *

context.binary = './vuln32'
elf = ELF('./vuln32')

# Binary has: system@plt at 0x08049040
# Buffer is 64 bytes, then saved EBP, then return address
# There is a "/bin/sh" string in the binary at 0x0804a030

p = process('./vuln32')

payload = b"A" * 64           # fill buffer
payload += p32(0x08049040)    # overwrite return addr with system@plt
payload += p32(0x0804a030)    # arg1: pointer to "/bin/sh"
payload += b"BBBB"            # return address for system()

p.sendline(payload)
p.interactive()
\`\`\`

The exploit crashes instead of giving a shell. Find and fix all bugs in the payload construction. Explain the 32-bit calling convention that makes the fix necessary.`,
    rubric: {
      maxScore: 8,
      criteria: [
        { id: "ebp-missing", description: "Identifies missing saved EBP overwrite in padding", points: 2, keywords: ["EBP", "saved EBP", "68", "64 + 4", "base pointer", "frame pointer"], check: "Student identifies that padding should be 68 bytes (64 for buffer + 4 for saved EBP) before the return address" },
        { id: "arg-order", description: "Fixes the argument order: system addr, then return addr, then argument", points: 3, keywords: ["return address", "argument", "after", "calling convention", "cdecl", "push", "stack frame", "system", "BBBB", "/bin/sh"], check: "Student fixes the order to: padding(68) + system_addr + fake_return_addr + /bin/sh_ptr. In cdecl, after overwriting EIP with system, the stack must have the return address for system, then its first argument" },
        { id: "calling-convention", description: "Explains 32-bit cdecl calling convention and stack layout", points: 3, keywords: ["cdecl", "caller", "push", "arguments", "right to left", "stack", "above return", "EIP"], check: "Student explains that in 32-bit cdecl, when a function is called, the stack has: return address, then arguments. So when we hijack EIP to system, the word after system's address is system's return address, and the word after that is system's first argument" },
      ],
      gaps: [
        { if_missing: "ebp-missing", gap: "Does not account for saved frame pointer in stack overflow" },
        { if_missing: "arg-order", gap: "Does not understand 32-bit stack layout for ret2libc" },
        { if_missing: "calling-convention", gap: "Does not understand cdecl calling convention" },
      ],
    },
  },
  {
    competencyId: "binexp",
    subTopic: "srop",
    questionType: "design_solution",
    difficulty: 5,
    questionText: `You are exploiting a statically-linked, stripped 64-bit binary with NX enabled. The binary is very minimal — you can only find these gadgets:

\`\`\`
0x0000000000401000 : mov eax, 0xf ; syscall ; ret    (sigreturn)
0x0000000000401010 : syscall ; ret
0x0000000000401020 : ret
\`\`\`

You have a stack buffer overflow but almost no useful gadgets (no pop rdi, no pop rsi, etc.). You know "/bin/sh" is at 0x402000 in the binary's .rodata.

1. What is SROP (Sigreturn-Oriented Programming) and why is it useful here?
2. Construct the full SROP payload. What values go in the sigcontext frame?
3. Why is the \`mov eax, 0xf; syscall\` gadget the key to this technique?`,
    rubric: {
      maxScore: 10,
      criteria: [
        { id: "srop-concept", description: "Explains SROP concept and signal handling mechanism", points: 3, keywords: ["sigreturn", "signal", "context", "restore registers", "fake frame", "kernel", "ucontext", "all registers"], check: "Student explains: when a signal handler returns, the kernel calls sigreturn (syscall 15) which restores ALL registers from a sigcontext frame on the stack. SROP abuses this by placing a fake sigcontext frame to set all registers to controlled values" },
        { id: "payload-construction", description: "Constructs the SROP payload with correct sigcontext values", points: 3, keywords: ["SigreturnFrame", "rax", "59", "0x3b", "rdi", "0x402000", "rsi", "0", "rdx", "0", "rip", "syscall", "cs", "0x33"], check: "Student constructs: overflow padding + sigreturn gadget address + fake sigcontext frame with rax=59(execve), rdi=0x402000(/bin/sh), rsi=0, rdx=0, rip=syscall_addr, cs=0x33" },
        { id: "sigreturn-gadget", description: "Explains why syscall 0xf is the enabling gadget", points: 2, keywords: ["0xf", "15", "sigreturn", "syscall number", "eax", "trigger", "restore", "frame"], check: "Student explains: syscall 15 is sigreturn, which tells the kernel to read the sigcontext frame from the stack and restore all registers to those values, giving full register control with just one gadget" },
        { id: "pwntools-frame", description: "Shows understanding of practical SROP implementation", points: 2, keywords: ["pwntools", "SigreturnFrame", "frame", "flat", "bytes", "p64"], check: "Student mentions pwntools SigreturnFrame() or manually constructs the frame with correct offsets for each register in the sigcontext structure" },
      ],
      gaps: [
        { if_missing: "srop-concept", gap: "Does not understand SROP / sigreturn-oriented programming" },
        { if_missing: "payload-construction", gap: "Cannot construct an SROP sigcontext frame" },
        { if_missing: "sigreturn-gadget", gap: "Does not understand the role of sigreturn syscall in SROP" },
      ],
    },
  },
];
