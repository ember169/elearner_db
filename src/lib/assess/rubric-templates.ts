import type { QuestionTemplate } from "./types";
import { LINUX_INFRA_TEMPLATES } from "./templates/linux-infra";
import { NETWORKING_TEMPLATES } from "./templates/networking";
import { WEB_TEMPLATES } from "./templates/web";
import { LOWLEVEL_C_TEMPLATES } from "./templates/lowlevel-c";
import { WIN_MALDEV_TEMPLATES } from "./templates/winmaldev";
import { BINEXP_TEMPLATES } from "./templates/binexp";
import { QUESTION_TEMPLATES } from "./question-templates";

const HAND_WRITTEN: QuestionTemplate[] = [
  // --- c-core (C fundamentals) ---
  {
    competencyId: "c-core",
    subTopic: "pointer-arithmetic",
    questionType: "predict_output",
    difficulty: 1,
    questionText: `What will the following C program print?\n\n\`\`\`c\n#include <stdio.h>\n\nint main(void) {\n    int arr[] = {10, 20, 30, 40, 50};\n    int *p = arr;\n    printf("%d\\n", *(p + 3));\n    printf("%d\\n", p[1]);\n    printf("%d\\n", *(arr + 4));\n    return 0;\n}\n\`\`\``,
    rubric: {
      maxScore: 6,
      criteria: [
        { id: "ptr_offset", description: "Correctly identifies *(p + 3) as 40", points: 2, keywords: ["40", "offset", "third"], check: "Must state the output of *(p + 3) is 40" },
        { id: "bracket_syntax", description: "Correctly identifies p[1] as 20", points: 2, keywords: ["20", "index", "bracket"], check: "Must state p[1] outputs 20" },
        { id: "arr_ptr_equiv", description: "Correctly identifies *(arr + 4) as 50", points: 2, keywords: ["50", "array", "pointer"], check: "Must state *(arr + 4) outputs 50" },
      ],
      gaps: [
        { if_missing: "ptr_offset", gap: "Does not understand pointer arithmetic with offsets" },
        { if_missing: "bracket_syntax", gap: "Does not recognize array bracket notation as pointer arithmetic" },
        { if_missing: "arr_ptr_equiv", gap: "Does not understand array-pointer equivalence" },
      ],
    },
  },
  {
    competencyId: "c-core",
    subTopic: "memory-management",
    questionType: "spot_vuln",
    difficulty: 2,
    questionText: `Identify ALL memory-related bugs in this C code:\n\n\`\`\`c\n#include <stdlib.h>\n#include <string.h>\n\nchar *duplicate(const char *src) {\n    char *dst = malloc(strlen(src));\n    if (!dst)\n        return NULL;\n    strcpy(dst, src);\n    return dst;\n}\n\nvoid process(void) {\n    char *a = duplicate("hello");\n    char *b = a;\n    free(a);\n    printf("%s\\n", b);\n    free(b);\n}\n\`\`\``,
    rubric: {
      maxScore: 8,
      criteria: [
        { id: "off_by_one", description: "Identifies malloc(strlen(src)) is missing +1 for null terminator", points: 3, keywords: ["strlen", "null terminator", "+1", "off-by-one"], check: "Must mention that malloc should be strlen(src) + 1" },
        { id: "use_after_free", description: "Identifies that b is used after a is freed (same pointer)", points: 3, keywords: ["use after free", "dangling", "freed"], check: "Must identify the printf(b) as use-after-free" },
        { id: "double_free", description: "Identifies the double free on the same memory", points: 2, keywords: ["double free", "freed twice"], check: "Must mention freeing both a and b frees the same allocation twice" },
      ],
      gaps: [
        { if_missing: "off_by_one", gap: "Does not account for null terminator in string allocation" },
        { if_missing: "use_after_free", gap: "Cannot identify use-after-free through pointer aliasing" },
        { if_missing: "double_free", gap: "Does not recognize double-free through aliased pointers" },
      ],
    },
  },
  {
    competencyId: "c-core",
    subTopic: "string-operations",
    questionType: "fix_code",
    difficulty: 3,
    questionText: `This ft_split implementation has a subtle bug that causes incorrect results when the string contains consecutive delimiters. Find the bug and explain the fix.\n\n\`\`\`c\nchar **ft_split(const char *s, char c) {\n    int count = 0;\n    int i = 0;\n    while (s[i]) {\n        if (s[i] != c) {\n            count++;\n            while (s[i] && s[i] != c)\n                i++;\n        }\n        i++;\n    }\n    char **result = malloc(sizeof(char *) * (count + 1));\n    // ... word extraction logic ...\n    return result;\n}\n\`\`\``,
    rubric: {
      maxScore: 8,
      criteria: [
        { id: "finds_bug", description: "Identifies the i++ after the if skips a character when s[i] is already a delimiter", points: 3, keywords: ["skip", "increment", "delimiter", "consecutive"], check: "Must identify that i++ in the else-path is unconditional and skips characters" },
        { id: "explains_fix", description: "Proposes using else branch or restructuring the loop", points: 3, keywords: ["else", "continue", "restructure"], check: "Must propose a concrete fix like adding else before i++ or using a while loop for delimiters" },
        { id: "edge_cases", description: "Mentions edge cases like leading/trailing delimiters or empty string", points: 2, keywords: ["leading", "trailing", "empty", "edge"], check: "Must mention at least one edge case" },
      ],
      gaps: [
        { if_missing: "finds_bug", gap: "Cannot trace control flow through nested loops" },
        { if_missing: "explains_fix", gap: "Cannot propose structured fixes for loop logic" },
        { if_missing: "edge_cases", gap: "Does not consider edge cases in string processing" },
      ],
    },
  },
  {
    competencyId: "c-core",
    subTopic: "structs-unions",
    questionType: "trace_explain",
    difficulty: 3,
    questionText: `Explain step by step what values are stored in memory and what gets printed:\n\n\`\`\`c\n#include <stdio.h>\n\ntypedef union {\n    unsigned int i;\n    unsigned char bytes[4];\n} converter;\n\nint main(void) {\n    converter c;\n    c.i = 0x41424344;\n    printf("%c %c %c %c\\n", c.bytes[0], c.bytes[1], c.bytes[2], c.bytes[3]);\n    return 0;\n}\n\`\`\`\n\nAssume a little-endian x86 system.`,
    rubric: {
      maxScore: 8,
      criteria: [
        { id: "union_sharing", description: "Explains that union members share the same memory", points: 2, keywords: ["share", "same memory", "overlap", "union"], check: "Must explain that i and bytes occupy the same memory" },
        { id: "endianness", description: "Correctly applies little-endian byte ordering", points: 3, keywords: ["little-endian", "least significant", "reversed", "LSB"], check: "Must explain that 0x44 is stored at bytes[0] on little-endian" },
        { id: "correct_output", description: "States the output is D C B A", points: 3, keywords: ["D C B A", "44 43 42 41"], check: "Must give the correct output showing reversed byte order" },
      ],
      gaps: [
        { if_missing: "union_sharing", gap: "Does not understand union memory layout" },
        { if_missing: "endianness", gap: "Does not understand byte ordering / endianness" },
        { if_missing: "correct_output", gap: "Cannot mentally execute byte-level memory operations" },
      ],
    },
  },
  {
    competencyId: "c-core",
    subTopic: "function-pointers",
    questionType: "predict_output",
    difficulty: 2,
    questionText: `What does this program print?\n\n\`\`\`c\n#include <stdio.h>\n\nvoid apply(int *arr, int n, int (*fn)(int)) {\n    for (int i = 0; i < n; i++)\n        arr[i] = fn(arr[i]);\n}\n\nint dbl(int x) { return x * 2; }\nint inc(int x) { return x + 1; }\n\nint main(void) {\n    int a[] = {1, 2, 3};\n    apply(a, 3, dbl);\n    apply(a, 3, inc);\n    printf("%d %d %d\\n", a[0], a[1], a[2]);\n    return 0;\n}\n\`\`\``,
    rubric: {
      maxScore: 6,
      criteria: [
        { id: "first_apply", description: "Correctly traces dbl: {1,2,3} -> {2,4,6}", points: 2, keywords: ["2", "4", "6", "double"], check: "Must show array becomes {2,4,6} after first apply" },
        { id: "second_apply", description: "Correctly traces inc: {2,4,6} -> {3,5,7}", points: 2, keywords: ["3", "5", "7", "increment"], check: "Must show array becomes {3,5,7} after second apply" },
        { id: "fn_ptr_concept", description: "Demonstrates understanding of function pointer mechanism", points: 2, keywords: ["function pointer", "callback", "passed"], check: "Must indicate understanding that fn is called on each element" },
      ],
      gaps: [
        { if_missing: "first_apply", gap: "Cannot trace function pointer application" },
        { if_missing: "second_apply", gap: "Cannot trace sequential mutations on the same array" },
        { if_missing: "fn_ptr_concept", gap: "Does not understand function pointers as callbacks" },
      ],
    },
  },

  // --- c-systems (Systems programming in C) ---
  {
    competencyId: "c-systems",
    subTopic: "fork-processes",
    questionType: "predict_output",
    difficulty: 2,
    questionText: `How many lines of output does this program produce? Explain each line.\n\n\`\`\`c\n#include <stdio.h>\n#include <unistd.h>\n\nint main(void) {\n    fork();\n    fork();\n    printf("hello\\n");\n    return 0;\n}\n\`\`\``,
    rubric: {
      maxScore: 6,
      criteria: [
        { id: "fork_count", description: "Correctly states 4 lines of output", points: 2, keywords: ["4", "four"], check: "Must state the program prints 4 lines" },
        { id: "fork_tree", description: "Explains the process tree: first fork creates 2, second fork doubles to 4", points: 2, keywords: ["tree", "doubles", "2 processes", "4 processes"], check: "Must explain the doubling effect of consecutive forks" },
        { id: "each_prints", description: "Explains that each of the 4 processes executes printf independently", points: 2, keywords: ["each process", "independent", "copy"], check: "Must state each process runs printf independently" },
      ],
      gaps: [
        { if_missing: "fork_count", gap: "Cannot count processes created by nested fork() calls" },
        { if_missing: "fork_tree", gap: "Does not understand fork process tree branching" },
        { if_missing: "each_prints", gap: "Does not understand process independence after fork" },
      ],
    },
  },
  {
    competencyId: "c-systems",
    subTopic: "pipe-communication",
    questionType: "trace_explain",
    difficulty: 3,
    questionText: `Trace the data flow in this pipe example. What does the parent print and why?\n\n\`\`\`c\n#include <stdio.h>\n#include <unistd.h>\n#include <string.h>\n\nint main(void) {\n    int fd[2];\n    pipe(fd);\n    pid_t pid = fork();\n\n    if (pid == 0) {\n        close(fd[0]);\n        char *msg = "42Paris";\n        write(fd[1], msg, strlen(msg));\n        close(fd[1]);\n    } else {\n        close(fd[1]);\n        char buf[64] = {0};\n        read(fd[0], buf, sizeof(buf) - 1);\n        close(fd[0]);\n        printf("Received: %s\\n", buf);\n    }\n    return 0;\n}\n\`\`\``,
    rubric: {
      maxScore: 8,
      criteria: [
        { id: "pipe_direction", description: "Explains fd[1] is write end, fd[0] is read end", points: 2, keywords: ["write end", "read end", "fd[1]", "fd[0]"], check: "Must identify which fd is read vs write" },
        { id: "close_unused", description: "Explains why each process closes the unused end", points: 2, keywords: ["close", "unused", "prevent", "EOF"], check: "Must explain closing unused pipe ends" },
        { id: "data_flow", description: "Traces the data from child write to parent read", points: 2, keywords: ["child writes", "parent reads", "42Paris"], check: "Must trace the complete data path" },
        { id: "output", description: "States the output is 'Received: 42Paris'", points: 2, keywords: ["Received: 42Paris"], check: "Must give correct output" },
      ],
      gaps: [
        { if_missing: "pipe_direction", gap: "Does not understand pipe file descriptor semantics" },
        { if_missing: "close_unused", gap: "Does not understand why unused pipe ends must be closed" },
        { if_missing: "data_flow", gap: "Cannot trace inter-process data flow through pipes" },
      ],
    },
  },
  {
    competencyId: "c-systems",
    subTopic: "signals",
    questionType: "fix_code",
    difficulty: 3,
    questionText: `This signal handler has a critical bug that can cause data corruption. Identify the problem and explain a safe fix.\n\n\`\`\`c\n#include <signal.h>\n#include <stdio.h>\n#include <string.h>\n\nchar log_buffer[1024];\nint log_pos = 0;\n\nvoid handler(int sig) {\n    const char *msg = "Signal caught\\n";\n    log_pos += sprintf(log_buffer + log_pos, "%s", msg);\n    printf("Logged at position %d\\n", log_pos);\n}\n\nint main(void) {\n    signal(SIGUSR1, handler);\n    // ... main processing loop ...\n}\n\`\`\``,
    rubric: {
      maxScore: 8,
      criteria: [
        { id: "async_signal_safety", description: "Identifies that printf and sprintf are not async-signal-safe", points: 3, keywords: ["async-signal-safe", "not safe", "reentrant", "signal-safe"], check: "Must identify that printf/sprintf are unsafe in signal handlers" },
        { id: "data_race", description: "Identifies the race condition on log_pos if signal interrupts itself", points: 2, keywords: ["race", "interrupt", "concurrent", "reentrancy"], check: "Must mention the race condition on shared state" },
        { id: "safe_fix", description: "Proposes using write() and volatile sig_atomic_t", points: 3, keywords: ["write", "sig_atomic_t", "volatile", "flag"], check: "Must propose async-signal-safe alternatives" },
      ],
      gaps: [
        { if_missing: "async_signal_safety", gap: "Does not know which functions are async-signal-safe" },
        { if_missing: "data_race", gap: "Does not recognize signal handler reentrancy issues" },
        { if_missing: "safe_fix", gap: "Cannot write safe signal handlers" },
      ],
    },
  },

  // --- binexp (Binary exploitation) ---
  {
    competencyId: "binexp",
    subTopic: "stack-overflow",
    questionType: "spot_vuln",
    difficulty: 2,
    questionText: `Identify the vulnerability and describe how an attacker could exploit it:\n\n\`\`\`c\n#include <stdio.h>\n#include <string.h>\n\nvoid check_password(void) {\n    int authenticated = 0;\n    char buffer[16];\n    printf("Enter password: ");\n    gets(buffer);\n    if (strcmp(buffer, "s3cr3t") == 0)\n        authenticated = 1;\n    if (authenticated)\n        printf("Access granted!\\n");\n}\n\`\`\``,
    rubric: {
      maxScore: 8,
      criteria: [
        { id: "identifies_gets", description: "Identifies gets() as the vulnerability (no bounds checking)", points: 2, keywords: ["gets", "no bounds", "buffer overflow", "unbounded"], check: "Must identify gets() as vulnerable" },
        { id: "overwrite_auth", description: "Explains that overflowing buffer can overwrite authenticated variable", points: 3, keywords: ["overwrite", "authenticated", "stack", "adjacent"], check: "Must explain how overflow reaches the authenticated variable" },
        { id: "stack_layout", description: "Describes stack layout with buffer below authenticated", points: 3, keywords: ["stack", "layout", "above", "below", "grows down"], check: "Must describe relative positions of buffer and authenticated on the stack" },
      ],
      gaps: [
        { if_missing: "identifies_gets", gap: "Does not recognize unsafe input functions" },
        { if_missing: "overwrite_auth", gap: "Cannot map buffer overflow to variable corruption" },
        { if_missing: "stack_layout", gap: "Does not understand stack variable layout" },
      ],
    },
  },
  {
    competencyId: "binexp",
    subTopic: "format-string",
    questionType: "trace_explain",
    difficulty: 3,
    questionText: `Explain what happens when this program receives the input \`%x.%x.%x.%x\`:\n\n\`\`\`c\n#include <stdio.h>\n\nvoid greet(void) {\n    char name[64];\n    printf("Enter name: ");\n    fgets(name, sizeof(name), stdin);\n    printf(name);  // vulnerability here\n}\n\`\`\`\n\nWhat data is leaked and why? How could an attacker use %n to write to memory?`,
    rubric: {
      maxScore: 10,
      criteria: [
        { id: "fmt_vuln", description: "Identifies printf(name) as a format string vulnerability", points: 2, keywords: ["format string", "user-controlled", "printf"], check: "Must identify the uncontrolled format string" },
        { id: "stack_leak", description: "Explains that %x reads values from the stack", points: 3, keywords: ["stack", "leak", "read", "arguments"], check: "Must explain that %x pops and prints stack values" },
        { id: "pct_n_write", description: "Explains that %n writes the number of bytes printed to a stack address", points: 3, keywords: ["%n", "write", "arbitrary", "bytes printed"], check: "Must explain %n write primitive" },
        { id: "exploit_chain", description: "Describes how this enables arbitrary read/write", points: 2, keywords: ["arbitrary", "GOT", "return address", "overwrite"], check: "Must connect format string to code execution" },
      ],
      gaps: [
        { if_missing: "fmt_vuln", gap: "Cannot identify format string vulnerabilities" },
        { if_missing: "stack_leak", gap: "Does not understand how format specifiers read the stack" },
        { if_missing: "pct_n_write", gap: "Does not understand the %n write primitive" },
        { if_missing: "exploit_chain", gap: "Cannot chain format string into code execution" },
      ],
    },
  },
  {
    competencyId: "binexp",
    subTopic: "shellcode",
    questionType: "design_solution",
    difficulty: 4,
    questionText: `Design a strategy to execute a /bin/sh shellcode on a binary with the following protections:\n- NX enabled (non-executable stack)\n- No ASLR\n- No stack canary\n- Binary has a known buffer overflow in a function with a large local buffer\n\nDescribe your approach step by step.`,
    rubric: {
      maxScore: 10,
      criteria: [
        { id: "nx_constraint", description: "Recognizes that NX prevents executing shellcode on the stack", points: 2, keywords: ["NX", "non-executable", "stack not executable", "DEP"], check: "Must acknowledge NX prevents stack execution" },
        { id: "ret2libc", description: "Proposes return-to-libc or ROP as the bypass technique", points: 3, keywords: ["ret2libc", "return to libc", "ROP", "return-oriented"], check: "Must propose ret2libc or ROP" },
        { id: "execution_plan", description: "Describes calling system('/bin/sh') via overwritten return address", points: 3, keywords: ["system", "/bin/sh", "return address", "overwrite"], check: "Must describe a concrete execution chain" },
        { id: "no_aslr_advantage", description: "Notes that no ASLR means libc addresses are predictable", points: 2, keywords: ["no ASLR", "fixed address", "predictable", "known address"], check: "Must note that fixed addresses simplify the attack" },
      ],
      gaps: [
        { if_missing: "nx_constraint", gap: "Does not understand NX/DEP protection" },
        { if_missing: "ret2libc", gap: "Does not know ret2libc as NX bypass" },
        { if_missing: "execution_plan", gap: "Cannot construct a return-to-libc attack chain" },
        { if_missing: "no_aslr_advantage", gap: "Does not understand ASLR's role in exploitation" },
      ],
    },
  },

  // --- web-security (Web application security) ---
  {
    competencyId: "web-security",
    subTopic: "sql-injection",
    questionType: "spot_vuln",
    difficulty: 2,
    questionText: `Find the SQL injection vulnerability and write a payload that bypasses authentication:\n\n\`\`\`php\n<?php\n$user = $_POST['username'];\n$pass = $_POST['password'];\n$query = "SELECT * FROM users WHERE username='$user' AND password='$pass'";\n$result = mysqli_query($conn, $query);\nif (mysqli_num_rows($result) > 0) {\n    echo "Login successful";\n}\n?>\n\`\`\``,
    rubric: {
      maxScore: 8,
      criteria: [
        { id: "identifies_sqli", description: "Identifies direct string interpolation as SQL injection", points: 2, keywords: ["SQL injection", "unsanitized", "interpolation", "concatenation"], check: "Must identify the injection point" },
        { id: "bypass_payload", description: "Provides a working bypass payload like ' OR '1'='1", points: 3, keywords: ["OR", "'1'='1'", "always true", "comment", "--"], check: "Must provide a payload that makes the WHERE clause always true" },
        { id: "fix_suggestion", description: "Suggests prepared statements or parameterized queries", points: 3, keywords: ["prepared statement", "parameterized", "bind", "PDO"], check: "Must suggest the proper fix" },
      ],
      gaps: [
        { if_missing: "identifies_sqli", gap: "Cannot identify SQL injection in server-side code" },
        { if_missing: "bypass_payload", gap: "Cannot craft SQL injection payloads" },
        { if_missing: "fix_suggestion", gap: "Does not know how to prevent SQL injection" },
      ],
    },
  },
  {
    competencyId: "web-security",
    subTopic: "xss",
    questionType: "fix_code",
    difficulty: 3,
    questionText: `This Express.js endpoint is vulnerable to XSS. Identify the vulnerability, demonstrate an exploit payload, and fix the code:\n\n\`\`\`javascript\napp.get('/search', (req, res) => {\n  const query = req.query.q;\n  res.send(\`<h1>Search results for: \${query}</h1><p>No results found.</p>\`);\n});\n\`\`\``,
    rubric: {
      maxScore: 8,
      criteria: [
        { id: "identifies_reflected_xss", description: "Identifies reflected XSS via unescaped query parameter", points: 2, keywords: ["reflected XSS", "unescaped", "unsanitized", "user input"], check: "Must identify reflected XSS" },
        { id: "exploit_payload", description: "Provides a working XSS payload like <script>alert(1)</script>", points: 3, keywords: ["<script>", "alert", "onerror", "onload"], check: "Must provide a working XSS payload" },
        { id: "html_encoding", description: "Proposes HTML entity encoding or template engine auto-escaping", points: 3, keywords: ["escape", "encode", "sanitize", "&lt;", "template"], check: "Must propose proper output encoding" },
      ],
      gaps: [
        { if_missing: "identifies_reflected_xss", gap: "Cannot identify reflected XSS vulnerabilities" },
        { if_missing: "exploit_payload", gap: "Cannot construct XSS payloads" },
        { if_missing: "html_encoding", gap: "Does not know output encoding as XSS prevention" },
      ],
    },
  },

  // --- net-fundamentals (Networking fundamentals) ---
  {
    competencyId: "net-fundamentals",
    subTopic: "tcp-handshake",
    questionType: "trace_explain",
    difficulty: 2,
    questionText: `Explain the complete TCP three-way handshake. For each step, state:\n1. Which flags are set\n2. The sequence/acknowledgment numbers\n3. What each side's state is after the step\n\nStart with client initiating a connection to a server listening on port 80.`,
    rubric: {
      maxScore: 8,
      criteria: [
        { id: "syn", description: "Correctly describes SYN packet with initial sequence number", points: 2, keywords: ["SYN", "sequence number", "ISN", "SYN_SENT"], check: "Must describe the SYN step with seq number" },
        { id: "syn_ack", description: "Correctly describes SYN-ACK with server's seq and ack=client_seq+1", points: 3, keywords: ["SYN-ACK", "SYN_RECEIVED", "ack", "seq+1"], check: "Must describe SYN-ACK with correct ack number" },
        { id: "ack", description: "Correctly describes final ACK completing the handshake", points: 2, keywords: ["ACK", "ESTABLISHED", "final"], check: "Must describe the final ACK and ESTABLISHED state" },
        { id: "states", description: "Names the TCP states for both sides", points: 1, keywords: ["SYN_SENT", "SYN_RECEIVED", "ESTABLISHED", "LISTEN"], check: "Must name at least 3 TCP states" },
      ],
      gaps: [
        { if_missing: "syn", gap: "Does not understand TCP connection initiation" },
        { if_missing: "syn_ack", gap: "Does not understand SYN-ACK sequence/ack number relationship" },
        { if_missing: "ack", gap: "Incomplete understanding of three-way handshake" },
      ],
    },
  },
  {
    competencyId: "net-fundamentals",
    subTopic: "subnetting",
    questionType: "predict_output",
    difficulty: 2,
    questionText: `Given the IP address 192.168.10.75 with subnet mask 255.255.255.192 (/26):\n\n1. What is the network address?\n2. What is the broadcast address?\n3. What is the range of usable host addresses?\n4. How many usable hosts can this subnet contain?`,
    rubric: {
      maxScore: 8,
      criteria: [
        { id: "network_addr", description: "Correctly calculates network address as 192.168.10.64", points: 2, keywords: ["192.168.10.64", "network"], check: "Must state 192.168.10.64 as network address" },
        { id: "broadcast", description: "Correctly calculates broadcast as 192.168.10.127", points: 2, keywords: ["192.168.10.127", "broadcast"], check: "Must state 192.168.10.127 as broadcast" },
        { id: "host_range", description: "Correctly states usable range 192.168.10.65 - 192.168.10.126", points: 2, keywords: [".65", ".126", "range"], check: "Must give correct host range" },
        { id: "host_count", description: "Correctly states 62 usable hosts (2^6 - 2)", points: 2, keywords: ["62", "64 - 2"], check: "Must state 62 usable hosts" },
      ],
      gaps: [
        { if_missing: "network_addr", gap: "Cannot calculate network address from CIDR notation" },
        { if_missing: "broadcast", gap: "Cannot determine broadcast address" },
        { if_missing: "host_count", gap: "Does not understand usable host count calculation" },
      ],
    },
  },

  // --- crypto (Cryptography) ---
  {
    competencyId: "crypto",
    subTopic: "ecb-weakness",
    questionType: "compare_contrast",
    difficulty: 3,
    questionText: `Compare AES in ECB mode vs CBC mode. Explain:\n1. How each mode processes blocks\n2. Why ECB is considered insecure for most use cases\n3. A concrete attack scenario demonstrating ECB's weakness\n4. What additional data CBC requires and how it helps`,
    rubric: {
      maxScore: 8,
      criteria: [
        { id: "ecb_mechanics", description: "Explains ECB encrypts each block independently", points: 2, keywords: ["independent", "same plaintext", "same ciphertext", "block by block"], check: "Must explain ECB's independent block encryption" },
        { id: "ecb_pattern_leak", description: "Explains that identical plaintext blocks produce identical ciphertext blocks", points: 2, keywords: ["pattern", "identical", "penguin", "deterministic"], check: "Must explain the pattern leakage problem" },
        { id: "cbc_chaining", description: "Explains CBC's XOR-with-previous-ciphertext chaining", points: 2, keywords: ["XOR", "previous", "chaining", "IV"], check: "Must explain CBC's chaining mechanism" },
        { id: "iv_role", description: "Explains the role of the initialization vector in CBC", points: 2, keywords: ["IV", "initialization vector", "random", "first block"], check: "Must explain what the IV does" },
      ],
      gaps: [
        { if_missing: "ecb_mechanics", gap: "Does not understand block cipher modes of operation" },
        { if_missing: "ecb_pattern_leak", gap: "Does not understand why ECB leaks patterns" },
        { if_missing: "cbc_chaining", gap: "Does not understand CBC's chaining mechanism" },
        { if_missing: "iv_role", gap: "Does not understand the role of IVs in block ciphers" },
      ],
    },
  },

  // --- scripting (Scripting & automation) ---
  {
    competencyId: "scripting",
    subTopic: "bash-automation",
    questionType: "fix_code",
    difficulty: 2,
    questionText: `This bash script is supposed to scan a list of IPs and report which ones have port 22 open, but it has several bugs. Find and fix them:\n\n\`\`\`bash\n#!/bin/bash\nfor ip in $(cat targets.txt)\ndo\n    result=$(nc $ip 22 -w 2 2>&1)\n    if [ $? -eq 0 ]; then\n        echo "$ip: SSH open"\n    fi\ndone\n\`\`\`\n\nWhat happens if targets.txt contains hostnames with spaces? What if nc isn't installed?`,
    rubric: {
      maxScore: 8,
      criteria: [
        { id: "word_splitting", description: "Identifies word splitting issue with $(cat ...)", points: 2, keywords: ["word splitting", "IFS", "while read", "quotes"], check: "Must identify the word splitting problem" },
        { id: "quoting", description: "Notes missing quotes around $ip and $?", points: 2, keywords: ["quote", "\"$ip\"", "double quote"], check: "Must mention variable quoting" },
        { id: "nc_check", description: "Suggests checking if nc/nmap exists before running", points: 2, keywords: ["command -v", "which", "type", "check"], check: "Must suggest checking for nc availability" },
        { id: "while_read", description: "Proposes while IFS= read -r line pattern as fix", points: 2, keywords: ["while", "read", "IFS"], check: "Must propose the safe line-reading pattern" },
      ],
      gaps: [
        { if_missing: "word_splitting", gap: "Does not understand bash word splitting pitfalls" },
        { if_missing: "quoting", gap: "Does not follow proper shell variable quoting" },
        { if_missing: "nc_check", gap: "Does not handle missing tool dependencies in scripts" },
      ],
    },
  },
];

export const TEMPLATES: QuestionTemplate[] = [
  ...HAND_WRITTEN,
  ...LINUX_INFRA_TEMPLATES,
  ...NETWORKING_TEMPLATES,
  ...WEB_TEMPLATES,
  ...LOWLEVEL_C_TEMPLATES,
  ...WIN_MALDEV_TEMPLATES,
  ...BINEXP_TEMPLATES,
  ...QUESTION_TEMPLATES,
];
