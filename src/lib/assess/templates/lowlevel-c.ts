import type { QuestionTemplate } from "../types";

export const LOWLEVEL_C_TEMPLATES: QuestionTemplate[] = [
// --- c-core (C fundamentals) ---

{
  competencyId: "c-core",
  subTopic: "pointer-arithmetic",
  questionType: "predict_output",
  difficulty: 1,
  questionText: `What does this program print? Explain each line of output.

\`\`\`c
#include <stdio.h>

int main(void)
{
    int   arr[] = {10, 20, 30, 40, 50};
    int   *p = arr;
    int   *q = arr + 3;

    printf("%d\\n", *p + 2);
    printf("%d\\n", *(p + 2));
    printf("%ld\\n", q - p);
    printf("%d\\n", p[4]);
    return 0;
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "line1", description: "Correctly states first printf prints 12 (*p is 10, +2 is 12, not pointer arithmetic)", points: 2, keywords: ["12", "dereference first", "value arithmetic", "operator precedence"], check: "Student says the output is 12 and explains that *p dereferences to 10, then adds 2 to the value." },
      { id: "line2", description: "Correctly states second printf prints 30 (pointer advances 2 ints, then dereferences)", points: 2, keywords: ["30", "pointer advances", "third element", "p+2"], check: "Student says the output is 30 and explains pointer arithmetic moves by sizeof(int)." },
      { id: "line3", description: "Correctly states third printf prints 3 (pointer subtraction yields element count)", points: 2, keywords: ["3", "pointer subtraction", "difference in elements", "ptrdiff"], check: "Student says the output is 3 and explains pointer subtraction gives the number of elements between them." },
      { id: "line4", description: "Correctly states fourth printf prints 50 (p[4] equivalent to *(p+4))", points: 2, keywords: ["50", "subscript", "equivalent", "*(p+4)"], check: "Student says the output is 50 and understands array subscript on pointer." }
    ],
    gaps: [
      { if_missing: "line1", gap: "Confuses value arithmetic with pointer arithmetic after dereference" },
      { if_missing: "line2", gap: "Does not understand pointer arithmetic moves in units of the pointed-to type" },
      { if_missing: "line3", gap: "Does not understand pointer subtraction yields element count, not byte count" },
      { if_missing: "line4", gap: "Does not recognise that array subscript notation works on pointers" }
    ]
  }
},

{
  competencyId: "c-core",
  subTopic: "null-termination",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `This function is supposed to safely copy a username into a fixed buffer. Identify all bugs and vulnerabilities.

\`\`\`c
#include <string.h>
#include <stdlib.h>

typedef struct {
    char username[16];
    int  privilege_level;
} user_t;

user_t *create_user(const char *name)
{
    user_t *u = malloc(sizeof(user_t));
    u->privilege_level = 0;
    strncpy(u->username, name, 16);
    return u;
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "no-null-check", description: "Identifies that malloc return value is not checked for NULL", points: 2, keywords: ["malloc", "NULL", "check", "return value", "null pointer"], check: "Student points out malloc can return NULL and the code dereferences without checking." },
      { id: "strncpy-no-null", description: "Identifies that strncpy does not null-terminate when name is >= 16 chars", points: 3, keywords: ["strncpy", "null-terminate", "null terminator", "16 bytes", "no NUL", "15"], check: "Student explains that strncpy will not write a NUL byte if the source is 16 chars or longer, leaving username unterminated." },
      { id: "struct-adjacent", description: "Recognises the unterminated string can leak into privilege_level or adjacent memory on read", points: 2, keywords: ["adjacent", "privilege_level", "overflow", "read past", "leak", "struct layout"], check: "Student connects the missing null terminator to potential read overrun into privilege_level or beyond." },
      { id: "fix", description: "Proposes a correct fix (e.g. strncpy + explicit NUL, or strlcpy, or limit to 15)", points: 1, keywords: ["strlcpy", "username[15] = '\\0'", "sizeof - 1", "snprintf"], check: "Student provides a concrete fix that ensures null termination." }
    ],
    gaps: [
      { if_missing: "strncpy-no-null", gap: "Does not understand strncpy's non-termination behavior — critical gap in C string safety" },
      { if_missing: "no-null-check", gap: "Missing habit of checking allocator return values" },
      { if_missing: "struct-adjacent", gap: "Does not reason about memory layout consequences of string bugs" }
    ]
  }
},

{
  competencyId: "c-core",
  subTopic: "array-decay",
  questionType: "predict_output",
  difficulty: 2,
  questionText: `What does this program print? Explain why the two sizeof results differ.

\`\`\`c
#include <stdio.h>

void print_size(int arr[])
{
    printf("In function: %zu\\n", sizeof(arr));
}

int main(void)
{
    int arr[10];
    printf("In main: %zu\\n", sizeof(arr));
    print_size(arr);
    return 0;
}
\`\`\`

Assume a 64-bit system where sizeof(int) = 4 and sizeof(void*) = 8.`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "main-sizeof", description: "Correctly states sizeof(arr) in main is 40 (10 * 4 bytes)", points: 2, keywords: ["40", "10 * 4", "full array", "ten ints"], check: "Student says sizeof in main is 40 and explains it measures the whole array." },
      { id: "func-sizeof", description: "Correctly states sizeof(arr) in the function is 8 (pointer size)", points: 2, keywords: ["8", "pointer", "decayed", "sizeof pointer"], check: "Student says sizeof in the function is 8 and explains the parameter is a pointer." },
      { id: "decay-explanation", description: "Explains array-to-pointer decay when passed to a function", points: 2, keywords: ["decay", "int *", "parameter", "loses size", "adjusted"], check: "Student explains that array parameters decay to pointers and lose size information." }
    ],
    gaps: [
      { if_missing: "decay-explanation", gap: "Does not understand array-to-pointer decay — fundamental C concept" },
      { if_missing: "func-sizeof", gap: "Cannot reason about sizeof on pointer types" }
    ]
  }
},

{
  competencyId: "c-core",
  subTopic: "buffer-overflow",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `This function reads a line from a file descriptor into a buffer. Identify all vulnerabilities and explain how they could be exploited.

\`\`\`c
#include <unistd.h>

int read_line(int fd, char *out)
{
    char buf[1024];
    int  i = 0;
    char c;

    while (read(fd, &c, 1) > 0)
    {
        buf[i] = c;
        if (c == '\\n')
            break;
        i++;
    }
    buf[i + 1] = '\\0';
    memcpy(out, buf, i + 2);
    return i;
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "no-bounds-check", description: "Identifies that i is not bounded by 1024 — a line longer than 1024 chars overflows buf", points: 3, keywords: ["bounds", "1024", "overflow", "no limit", "buffer overflow", "stack"], check: "Student explains that the while loop can write past buf[1023] if the line is longer than the buffer." },
      { id: "off-by-one-null", description: "Identifies the off-by-one: when c is newline, buf[i] = '\\n', then buf[i+1] = '\\0' skips NUL placement if intent was to terminate at the newline position", points: 2, keywords: ["off-by-one", "i + 1", "newline position", "null terminator placement"], check: "Student identifies the off-by-one issue in null terminator placement relative to the newline." },
      { id: "out-no-size", description: "Notes that out buffer size is unknown — memcpy may overflow the caller's buffer", points: 2, keywords: ["out", "caller", "memcpy", "destination size", "no size parameter"], check: "Student explains that the function has no way to know the size of out and may overflow it." },
      { id: "memcpy-include", description: "Notes missing #include for memcpy (string.h) — minor but shows attention", points: 1, keywords: ["string.h", "include", "memcpy", "implicit declaration"], check: "Student notices memcpy is used without including string.h." }
    ],
    gaps: [
      { if_missing: "no-bounds-check", gap: "Cannot identify classic stack buffer overflow — critical security gap" },
      { if_missing: "out-no-size", gap: "Does not reason about caller-supplied buffer safety" },
      { if_missing: "off-by-one-null", gap: "Misses off-by-one errors in string termination logic" }
    ]
  }
},

{
  competencyId: "c-core",
  subTopic: "struct-padding",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Given these two structs, explain why they have different sizes on a typical 64-bit x86 system. What is the size of each, and why?

\`\`\`c
struct A {
    char  a;
    int   b;
    char  c;
};

struct B {
    char  a;
    char  c;
    int   b;
};
\`\`\`

Then explain: if you had an array of 1000 struct A vs 1000 struct B, how much memory would you waste? What general rule should you follow when ordering struct members?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "size-a", description: "Correctly states sizeof(struct A) is 12 with proper padding reasoning", points: 2, keywords: ["12", "padding", "alignment", "3 bytes padding", "4-byte aligned"], check: "Student says struct A is 12 bytes and explains padding after char a (3 bytes) and after char c (3 bytes) for int alignment." },
      { id: "size-b", description: "Correctly states sizeof(struct B) is 8", points: 2, keywords: ["8", "packed", "no wasted", "less padding"], check: "Student says struct B is 8 bytes and explains chars are adjacent with only 2 bytes padding before int." },
      { id: "waste-calc", description: "Calculates memory waste: 1000*(12-8) = 4000 bytes", points: 2, keywords: ["4000", "4 bytes each", "4KB", "difference"], check: "Student calculates the memory difference for 1000 structs." },
      { id: "ordering-rule", description: "States the rule: order members from largest alignment to smallest (or group by size)", points: 2, keywords: ["largest to smallest", "descending alignment", "group", "sort by size"], check: "Student articulates a general rule for member ordering to minimise padding." }
    ],
    gaps: [
      { if_missing: "size-a", gap: "Does not understand struct padding and alignment rules" },
      { if_missing: "ordering-rule", gap: "Cannot apply struct layout optimisation as a general practice" }
    ]
  }
},

{
  competencyId: "c-core",
  subTopic: "dynamic-allocation",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Trace through this code and explain what happens at each numbered comment. Does this program have any memory errors? If so, what exactly goes wrong and when?

\`\`\`c
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

char *duplicate(const char *s)
{
    char *copy = malloc(strlen(s));  // (1)
    if (!copy)
        return NULL;
    strcpy(copy, s);                 // (2)
    return copy;
}

int main(void)
{
    char *a = duplicate("hello");
    char *b = a;                     // (3)
    printf("%s\\n", b);
    free(a);                         // (4)
    printf("%s\\n", b);              // (5)
    free(b);                         // (6)
    return 0;
}
\`\`\``,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "off-by-one-alloc", description: "Identifies (1): malloc(strlen(s)) should be strlen(s)+1 to include NUL", points: 2, keywords: ["strlen + 1", "NUL", "off by one", "null terminator", "one byte short"], check: "Student explains that strlen does not count the null terminator, so malloc allocates one byte too few." },
      { id: "heap-overflow", description: "Identifies (2): strcpy writes 6 bytes into 5-byte buffer — heap buffer overflow", points: 2, keywords: ["heap overflow", "strcpy", "writes past", "6 bytes", "one byte overflow"], check: "Student explains that strcpy copies the NUL terminator, writing one byte past the allocated region." },
      { id: "alias", description: "Explains (3): b is an alias to the same heap memory, not an independent copy", points: 2, keywords: ["alias", "same address", "same pointer", "not a copy", "points to same"], check: "Student explains that b and a point to the same heap allocation." },
      { id: "use-after-free", description: "Identifies (5): use-after-free — accessing b after a was freed", points: 2, keywords: ["use-after-free", "dangling", "freed memory", "undefined behavior", "UAF"], check: "Student identifies that reading b after free(a) is use-after-free since they alias the same memory." },
      { id: "double-free", description: "Identifies (6): double-free — freeing the same allocation twice", points: 2, keywords: ["double free", "already freed", "same pointer", "corruption", "undefined"], check: "Student identifies that free(b) is a double-free because a and b pointed to the same allocation." }
    ],
    gaps: [
      { if_missing: "off-by-one-alloc", gap: "Does not account for null terminator in allocation — will produce off-by-one heap overflows" },
      { if_missing: "use-after-free", gap: "Cannot identify use-after-free — critical for security/maldev work" },
      { if_missing: "double-free", gap: "Cannot identify double-free — critical heap exploitation primitive" }
    ]
  }
},

{
  competencyId: "c-core",
  subTopic: "void-pointers",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This generic swap function is supposed to swap any two values of the same type. It compiles but produces wrong results. Fix it and explain what was wrong.

\`\`\`c
#include <stdlib.h>
#include <string.h>

void generic_swap(void *a, void *b, size_t size)
{
    void *tmp = malloc(size);
    if (!tmp)
        return;
    tmp = a;
    a = b;
    b = tmp;
    free(tmp);
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "pointer-vs-data", description: "Identifies that the function swaps pointer values instead of copying data — tmp=a overwrites the malloc'd pointer", points: 3, keywords: ["pointer assignment", "overwrites", "not copying data", "memcpy", "local pointers"], check: "Student explains that assigning tmp=a copies the pointer, not the data, and also leaks the malloc'd memory." },
      { id: "correct-fix", description: "Provides correct fix using memcpy: memcpy(tmp,a,size); memcpy(a,b,size); memcpy(b,tmp,size)", points: 3, keywords: ["memcpy", "tmp, a, size", "a, b, size", "b, tmp, size"], check: "Student provides working code using memcpy (or memmove) to copy the actual bytes through the temporary buffer." },
      { id: "leak", description: "Notes the original code also leaks memory (tmp pointer overwritten before free frees wrong address)", points: 2, keywords: ["leak", "free wrong", "original malloc", "lost pointer", "frees a"], check: "Student explains that overwriting tmp means free(tmp) frees 'a' instead of the allocated buffer." }
    ],
    gaps: [
      { if_missing: "pointer-vs-data", gap: "Confuses pointer assignment with data copying through void pointers" },
      { if_missing: "correct-fix", gap: "Cannot use memcpy for type-generic operations — needed for generic C data structures" }
    ]
  }
},

{
  competencyId: "c-core",
  subTopic: "string-manipulation",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This function should reverse a string in place. It has a subtle bug that causes it to appear to do nothing. Find and fix it.

\`\`\`c
#include <string.h>

void reverse_str(char *s)
{
    int i = 0;
    int j = strlen(s);
    char tmp;

    while (i < j)
    {
        tmp = s[i];
        s[i] = s[j];
        s[j] = tmp;
        i++;
        j--;
    }
}
\`\`\``,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "off-by-one-j", description: "Identifies that j starts at strlen(s), which is the NUL terminator position", points: 3, keywords: ["strlen", "null terminator", "j = strlen - 1", "off by one", "\\0", "NUL byte"], check: "Student explains that s[strlen(s)] is the NUL byte, so the first swap puts NUL at s[0], making the string appear empty." },
      { id: "fix", description: "Provides the fix: initialise j to strlen(s) - 1", points: 2, keywords: ["strlen(s) - 1", "j = len - 1", "last character"], check: "Student changes j initialization to strlen(s) - 1." },
      { id: "empty-string", description: "Notes the edge case: strlen(s) - 1 underflows to SIZE_MAX if s is empty string and j is unsigned", points: 1, keywords: ["empty string", "underflow", "unsigned", "edge case", "check length"], check: "Student considers the empty-string edge case." }
    ],
    gaps: [
      { if_missing: "off-by-one-j", gap: "Cannot trace string indexing relative to null terminator — common off-by-one source" }
    ]
  }
},

{
  competencyId: "c-core",
  subTopic: "macro-pitfalls",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Explain what each call to SQUARE produces and why. Which calls give unexpected results?

\`\`\`c
#include <stdio.h>

#define SQUARE(x) x * x

int main(void)
{
    int a = 3;
    printf("A: %d\\n", SQUARE(a));       // Case A
    printf("B: %d\\n", SQUARE(a + 1));   // Case B
    printf("C: %d\\n", SQUARE(++a));     // Case C
    return 0;
}
\`\`\`

Then show how to fix the macro definition to avoid these problems.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "case-a", description: "Case A expands to 3*3 = 9 — correct", points: 1, keywords: ["9", "3 * 3", "correct"], check: "Student says case A produces 9." },
      { id: "case-b", description: "Case B expands to a+1*a+1 = 3+3+1 = 7, not 16", points: 3, keywords: ["7", "a+1*a+1", "precedence", "not 16", "operator precedence"], check: "Student shows the expansion is a+1*a+1 and explains multiplication binds tighter, giving 7." },
      { id: "case-c", description: "Case C has undefined behavior: ++a evaluated twice in one expression", points: 2, keywords: ["undefined behavior", "double increment", "sequence point", "evaluated twice", "UB"], check: "Student identifies that ++a is evaluated twice without a sequence point, causing undefined behavior." },
      { id: "fix", description: "Provides parenthesised macro: #define SQUARE(x) ((x) * (x)), and notes it still double-evaluates", points: 2, keywords: ["((x) * (x))", "parentheses", "still double-evaluates", "inline function"], check: "Student provides parenthesised version and ideally notes that a static inline function is the real fix for double-evaluation." }
    ],
    gaps: [
      { if_missing: "case-b", gap: "Does not understand macro text substitution and operator precedence interactions" },
      { if_missing: "case-c", gap: "Does not recognise undefined behavior from multiple unsequenced side effects" }
    ]
  }
},

{
  competencyId: "c-core",
  subTopic: "type-casting",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This code is meant to compute the average of an array of integers, but it always returns a truncated integer value. Fix the precision issue and explain what was happening.

\`\`\`c
#include <stdio.h>

double average(int *arr, int n)
{
    int sum = 0;
    for (int i = 0; i < n; i++)
        sum += arr[i];
    return sum / n;
}

int main(void)
{
    int data[] = {3, 7, 2, 8};
    printf("Average: %f\\n", average(data, 4));
    // prints 5.000000, expected 5.000000 ... but try {3, 7, 2}:
    // prints 4.000000, expected 4.000000 ... try {1, 2}:
    // prints 1.000000, expected 1.500000
    return 0;
}
\`\`\``,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "integer-division", description: "Identifies that sum/n is integer division since both operands are int", points: 2, keywords: ["integer division", "truncation", "both int", "floor", "no fractional"], check: "Student explains that dividing two ints performs integer division, discarding the fractional part." },
      { id: "cast-fix", description: "Provides correct fix: cast sum or n to double before division", points: 2, keywords: ["(double)sum", "(double)n", "cast", "1.0 *", "float division"], check: "Student provides a fix that promotes at least one operand to double." },
      { id: "overflow", description: "Notes potential integer overflow in sum for large arrays", points: 2, keywords: ["overflow", "long", "large arrays", "INT_MAX", "sum overflow"], check: "Student mentions that sum could overflow for large arrays and suggests using a larger type." }
    ],
    gaps: [
      { if_missing: "integer-division", gap: "Does not understand implicit integer division truncation in C" },
      { if_missing: "cast-fix", gap: "Cannot apply type casting to force floating-point arithmetic" }
    ]
  }
},

{
  competencyId: "c-core",
  subTopic: "function-pointers",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `Design a simple dispatch table in C for a command-line calculator that supports +, -, *, /. Requirements:

1. Define a function pointer type for binary operations (takes two doubles, returns double)
2. Create a lookup structure that maps a char operator to its function
3. Write a dispatch function that takes an operator char and two operands, looks up the function, and calls it
4. Handle division by zero and unknown operators

Write the complete implementation. Explain why function pointers are preferable to a switch/case chain here, and when they would NOT be preferable.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "typedef", description: "Correctly defines a function pointer typedef for double (*)(double, double)", points: 2, keywords: ["typedef", "double (*", "double, double)", "function pointer type"], check: "Student defines a proper function pointer type for binary double operations." },
      { id: "dispatch-table", description: "Creates a struct or array mapping operators to function pointers", points: 2, keywords: ["struct", "array", "map", "operator", "function pointer", "table", "lookup"], check: "Student creates a data structure associating char operators with function pointers." },
      { id: "dispatch-function", description: "Implements a dispatch function that iterates the table and calls the matched function", points: 2, keywords: ["dispatch", "lookup", "iterate", "call", "found", "match"], check: "Student writes a working dispatch function." },
      { id: "error-handling", description: "Handles division by zero and unknown operator cases", points: 2, keywords: ["division by zero", "unknown operator", "error", "0.0", "check"], check: "Student handles both error cases with appropriate return values or error reporting." },
      { id: "tradeoff", description: "Explains when function pointers beat switch (extensibility, data-driven) and when switch is better (few fixed cases, inlining)", points: 2, keywords: ["extensible", "data-driven", "runtime", "inlining", "fixed cases", "compiler optimise"], check: "Student articulates tradeoffs: function pointers for extensibility, switch for small fixed sets where the compiler can optimise." }
    ],
    gaps: [
      { if_missing: "typedef", gap: "Cannot declare function pointer types — needed for callbacks, vtable-like patterns" },
      { if_missing: "dispatch-table", gap: "Cannot build data-driven dispatch — fundamental pattern in systems code" },
      { if_missing: "tradeoff", gap: "Cannot evaluate when to use function pointers vs simpler control flow" }
    ]
  }
},

{
  competencyId: "c-core",
  subTopic: "stack-vs-heap",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText: `Compare stack allocation and heap allocation in C across these dimensions:

1. Lifetime: when is memory valid?
2. Performance: which is faster and why?
3. Size limits: what constraints apply to each?
4. Thread safety: how does each behave in multi-threaded programs?
5. Fragmentation: which suffers and why?

Then: give a concrete example of a bug that happens when you return a stack-allocated buffer from a function, and explain why the equivalent with heap allocation works but introduces a different class of bugs.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "lifetime", description: "Stack: automatic, freed at scope exit. Heap: manual, lives until free() or program exit", points: 2, keywords: ["scope", "automatic", "manual", "free", "scope exit", "explicit"], check: "Student correctly describes stack lifetime as scope-bound and heap as explicitly managed." },
      { id: "performance", description: "Stack is faster (pointer adjustment vs allocator overhead), explains why", points: 2, keywords: ["faster", "pointer", "bump", "allocator", "overhead", "system call", "brk", "mmap"], check: "Student explains stack is O(1) pointer adjustment while heap involves allocator bookkeeping." },
      { id: "size-limits", description: "Stack is limited (typically 8MB), heap limited by virtual memory", points: 1, keywords: ["8MB", "limited", "ulimit", "stack overflow", "virtual memory", "much larger"], check: "Student mentions stack size limits and that heap can be much larger." },
      { id: "thread-safety", description: "Each thread has its own stack (inherently thread-local); heap is shared and needs synchronization in the allocator", points: 2, keywords: ["thread-local", "own stack", "shared", "synchronization", "lock", "arena"], check: "Student explains per-thread stacks vs shared heap with allocator locking." },
      { id: "return-bug", description: "Gives a concrete dangling-pointer example from returning a local array, contrasts with heap version's leak/ownership burden", points: 3, keywords: ["dangling pointer", "local array", "return", "stack frame", "invalid", "malloc", "leak", "ownership", "who frees"], check: "Student shows returning &local_var is a dangling pointer and explains the heap alternative introduces ownership/leak concerns." }
    ],
    gaps: [
      { if_missing: "lifetime", gap: "Does not understand the fundamental lifetime difference between stack and heap" },
      { if_missing: "return-bug", gap: "Cannot reason about dangling pointers from stack-allocated data — will produce real bugs" },
      { if_missing: "thread-safety", gap: "Does not understand memory allocation behavior in multi-threaded programs" }
    ]
  }
},

{
  competencyId: "c-core",
  subTopic: "const-correctness",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText: `Explain the difference between these four declarations. For each one, state what is const and what can be modified. Then explain why the C standard library uses \`const char *\` for parameters like in \`strlen(const char *s)\` — what contract does it communicate?

\`\`\`c
const int *p1;
int const *p2;
int *const p3;
const int *const p4;
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "p1-p2", description: "Correctly identifies p1 and p2 as equivalent: pointer to const int (data is const, pointer is mutable)", points: 2, keywords: ["equivalent", "pointer to const", "data const", "pointer mutable", "same thing"], check: "Student explains both p1 and p2 mean the pointed-to int is const but the pointer itself can be reassigned." },
      { id: "p3", description: "Correctly identifies p3: const pointer to mutable int (pointer is const, data is mutable)", points: 2, keywords: ["const pointer", "pointer const", "cannot reassign", "data mutable", "change value"], check: "Student explains p3 is a fixed pointer that cannot be reassigned but the int it points to can be modified." },
      { id: "p4", description: "Correctly identifies p4: const pointer to const int (both const)", points: 1, keywords: ["both const", "neither", "read-only", "fully const"], check: "Student explains p4 is fully const — neither pointer nor data can be modified." },
      { id: "api-contract", description: "Explains const char* in function parameters as a read-only promise: function will not modify your data", points: 3, keywords: ["contract", "promise", "read-only", "will not modify", "caller guarantee", "API design", "intent"], check: "Student explains that const in parameters communicates the function's promise not to modify the caller's data, enabling safer API design." }
    ],
    gaps: [
      { if_missing: "p1-p2", gap: "Cannot read const qualifier placement in pointer declarations" },
      { if_missing: "api-contract", gap: "Does not understand const as API contract — will write unclear interfaces" }
    ]
  }
},

{
  competencyId: "c-core",
  subTopic: "bitwise-operations",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `Implement a compact permission system using bitwise operations. Requirements:

1. Define permission flags: READ (bit 0), WRITE (bit 1), EXEC (bit 2), ADMIN (bit 3)
2. Write functions to: grant a permission, revoke a permission, check if a permission is set, toggle a permission
3. Write a function that takes a permission bitmask and returns a human-readable string like "rwx-" or "r---"
4. Explain why bitmasks are used for permissions in Unix file systems instead of, say, an array of booleans

Show complete, compilable C code.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "flags", description: "Defines flags using bit shifts or hex: READ=1, WRITE=2, EXEC=4, ADMIN=8", points: 1, keywords: ["1 << 0", "1 << 1", "0x01", "0x02", "bit shift", "power of two"], check: "Student defines permission flags as powers of two using shifts or hex." },
      { id: "operations", description: "Correctly implements grant (|=), revoke (&= ~), check (&), toggle (^=)", points: 3, keywords: ["|=", "&= ~", "& flag", "^=", "OR", "AND NOT", "XOR"], check: "Student implements all four operations with correct bitwise operators." },
      { id: "to-string", description: "Implements readable string conversion by testing each bit", points: 2, keywords: ["& READ", "r", "w", "x", "-", "string", "test each"], check: "Student writes a function that checks each bit and builds an rwx-style string." },
      { id: "rationale", description: "Explains bitmask advantages: single integer, atomic ops, O(1) check, cache-friendly, compact storage in inodes", points: 2, keywords: ["single integer", "atomic", "O(1)", "compact", "inode", "cache", "one word"], check: "Student explains practical advantages of bitmasks over boolean arrays for permission representation." }
    ],
    gaps: [
      { if_missing: "operations", gap: "Cannot use bitwise operators for flag manipulation — needed for low-level systems work and protocol parsing" },
      { if_missing: "rationale", gap: "Does not understand why bitmasks are the standard choice for flags in systems programming" }
    ]
  }
},

{
  competencyId: "c-core",
  subTopic: "memory-management",
  questionType: "design_solution",
  difficulty: 5,
  questionText: `Design and implement a simple arena (bump) allocator in C. Requirements:

1. The arena is initialised with a single large malloc'd block of a given size
2. \`arena_alloc(arena, size)\` returns aligned pointers by bumping a cursor forward
3. Individual allocations cannot be freed — only the entire arena can be reset or destroyed
4. Handle alignment (all returned pointers must be 8-byte aligned)
5. Handle the case where the arena is full (return NULL)

Write the struct definition, init, alloc, reset, and destroy functions.

Then explain: in what situations is an arena allocator better than raw malloc/free? What are the downsides? Why is this pattern common in compilers and game engines?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "struct", description: "Defines an arena struct with buffer pointer, capacity, and current offset", points: 1, keywords: ["struct", "buffer", "capacity", "offset", "cursor", "size_t"], check: "Student defines an arena struct with the necessary fields." },
      { id: "alignment", description: "Implements proper 8-byte alignment in alloc (rounds offset up to next multiple of 8)", points: 3, keywords: ["alignment", "align", "8", "round up", "& ~7", "(offset + 7) & ~7", "modulo"], check: "Student correctly aligns the allocation offset to 8-byte boundaries." },
      { id: "bump-alloc", description: "Implements bump allocation: save aligned offset, advance by size, return pointer", points: 2, keywords: ["bump", "advance", "offset += size", "return base + offset"], check: "Student implements the core bump allocator: check space, align, advance offset, return pointer." },
      { id: "reset-destroy", description: "Reset sets offset to 0; destroy frees the underlying buffer", points: 1, keywords: ["reset", "offset = 0", "destroy", "free", "buffer"], check: "Student implements reset (zero the offset) and destroy (free the buffer)." },
      { id: "tradeoffs", description: "Explains when arenas win (batch alloc/free, no fragmentation, cache-friendly) and downsides (no individual free, waste)", points: 3, keywords: ["batch", "fragmentation", "cache", "locality", "no individual free", "waste", "compiler", "game", "frame allocator", "phase-based"], check: "Student explains arena use cases (compilers, games, request handlers) and the tradeoff of not being able to free individual allocations." }
    ],
    gaps: [
      { if_missing: "alignment", gap: "Does not understand memory alignment requirements — will cause bus errors on strict architectures" },
      { if_missing: "bump-alloc", gap: "Cannot implement basic allocation strategies beyond malloc/free" },
      { if_missing: "tradeoffs", gap: "Does not know when to reach for specialised allocators vs general-purpose malloc" }
    ]
  }
},

// --- c-systems (Systems programming in C) ---

{
  competencyId: "c-systems",
  subTopic: "fork-basics",
  questionType: "predict_output",
  difficulty: 1,
  questionText: `What output does this program produce? List ALL possible outputs (considering process scheduling).

\`\`\`c
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int main(void)
{
    int x = 1;
    pid_t pid = fork();

    if (pid == 0)
    {
        x += 1;
        printf("child: %d\\n", x);
    }
    else
    {
        x += 10;
        wait(NULL);
        printf("parent: %d\\n", x);
    }
    return 0;
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "child-value", description: "Child prints 2 (x starts as 1, child adds 1)", points: 2, keywords: ["child: 2", "x = 2", "child increments"], check: "Student correctly identifies child prints 'child: 2'." },
      { id: "parent-value", description: "Parent prints 11 (x starts as 1, parent adds 10)", points: 2, keywords: ["parent: 11", "x = 11", "parent increments"], check: "Student correctly identifies parent prints 'parent: 11'." },
      { id: "separate-memory", description: "Explains that parent and child have separate copies of x (copy-on-write fork semantics)", points: 2, keywords: ["separate copy", "copy-on-write", "COW", "own address space", "independent"], check: "Student explains that fork creates a separate address space so modifications to x are independent." },
      { id: "ordering", description: "Notes that wait() guarantees child prints before parent, so output order is deterministic", points: 2, keywords: ["wait", "deterministic", "child first", "waits for child", "guaranteed order"], check: "Student explains that wait(NULL) ensures child output appears before parent output." }
    ],
    gaps: [
      { if_missing: "separate-memory", gap: "Does not understand fork address space semantics — fundamental Unix concept" },
      { if_missing: "ordering", gap: "Does not understand wait() for synchronising parent-child execution" }
    ]
  }
},

{
  competencyId: "c-systems",
  subTopic: "pipe-basics",
  questionType: "predict_output",
  difficulty: 2,
  questionText: `What happens when this program runs? Describe the output and explain the role of each file descriptor.

\`\`\`c
#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include <sys/wait.h>

int main(void)
{
    int   pipefd[2];
    char  buf[64];

    pipe(pipefd);
    pid_t pid = fork();

    if (pid == 0)
    {
        close(pipefd[1]);
        int n = read(pipefd[0], buf, sizeof(buf) - 1);
        buf[n] = '\\0';
        printf("child received: %s\\n", buf);
        close(pipefd[0]);
    }
    else
    {
        close(pipefd[0]);
        const char *msg = "hello from parent";
        write(pipefd[1], msg, strlen(msg));
        close(pipefd[1]);
        wait(NULL);
    }
    return 0;
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "output", description: "Correctly states output is 'child received: hello from parent'", points: 2, keywords: ["hello from parent", "child received"], check: "Student predicts the correct output." },
      { id: "pipe-direction", description: "Explains pipefd[0] is read end, pipefd[1] is write end", points: 2, keywords: ["pipefd[0]", "read", "pipefd[1]", "write", "read end", "write end"], check: "Student correctly identifies which end of the pipe is for reading and writing." },
      { id: "close-unused", description: "Explains why each process closes the unused end (child closes write, parent closes read)", points: 2, keywords: ["close unused", "close write end", "close read end", "EOF", "prevents blocking"], check: "Student explains that closing unused pipe ends is necessary to signal EOF and prevent deadlocks." },
      { id: "fork-inherits", description: "Explains that fork duplicates file descriptors, so both processes get both pipe ends", points: 2, keywords: ["inherit", "duplicate", "both ends", "file descriptors", "fork copies"], check: "Student explains that fork gives both processes copies of both file descriptors." }
    ],
    gaps: [
      { if_missing: "close-unused", gap: "Does not understand why unused pipe ends must be closed — will cause pipe deadlocks" },
      { if_missing: "pipe-direction", gap: "Cannot reason about pipe read/write semantics" }
    ]
  }
},

{
  competencyId: "c-systems",
  subTopic: "zombie-processes",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `This server forks a worker for each request. Identify the problem that will occur over time and explain how to fix it.

\`\`\`c
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>

void handle_request(int client_fd)
{
    // ... process the request ...
    close(client_fd);
    exit(0);
}

void server_loop(int listen_fd)
{
    while (1)
    {
        int client_fd = accept(listen_fd, NULL, NULL);
        if (client_fd < 0)
            continue;

        pid_t pid = fork();
        if (pid == 0)
            handle_request(client_fd);
        else if (pid > 0)
            close(client_fd);  // parent closes client fd
        // parent loops back to accept()
    }
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "zombie", description: "Identifies that child processes become zombies because the parent never calls wait/waitpid", points: 3, keywords: ["zombie", "defunct", "wait", "waitpid", "not reaped", "process table"], check: "Student identifies that terminated children become zombie processes because the parent never reaps them." },
      { id: "resource-exhaustion", description: "Explains that zombies accumulate and exhaust PID space / process table entries", points: 2, keywords: ["accumulate", "PID", "process table", "exhaustion", "resource leak", "thousands"], check: "Student explains the long-term consequence: zombie accumulation leading to resource exhaustion." },
      { id: "fix", description: "Proposes a correct fix: SIGCHLD handler with waitpid(-1, NULL, WNOHANG), or double-fork, or signal(SIGCHLD, SIG_IGN)", points: 3, keywords: ["SIGCHLD", "waitpid", "WNOHANG", "double fork", "SIG_IGN", "signal handler"], check: "Student provides at least one correct solution for preventing zombie accumulation." }
    ],
    gaps: [
      { if_missing: "zombie", gap: "Does not understand zombie processes — will write leaky server code" },
      { if_missing: "fix", gap: "Cannot implement zombie prevention strategies — critical for long-running daemons" }
    ]
  }
},

{
  competencyId: "c-systems",
  subTopic: "signal-handling",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `This signal handler is meant to log a message when the program receives SIGINT. Identify the problems with this approach.

\`\`\`c
#include <stdio.h>
#include <signal.h>
#include <string.h>

char *log_message = NULL;

void sigint_handler(int sig)
{
    log_message = malloc(64);
    sprintf(log_message, "Caught signal %d at handler\\n", sig);
    printf("%s", log_message);
    free(log_message);
}

int main(void)
{
    signal(SIGINT, sigint_handler);
    while (1)
        pause();
    return 0;
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "async-unsafe", description: "Identifies that malloc, printf, sprintf, free are not async-signal-safe", points: 3, keywords: ["async-signal-safe", "not safe", "malloc", "printf", "reentrant", "signal-safe functions"], check: "Student identifies that the handler calls functions that are not async-signal-safe, which can cause deadlocks or corruption." },
      { id: "safe-alternative", description: "Proposes using write() and a static buffer instead, or setting a volatile sig_atomic_t flag", points: 3, keywords: ["write", "static buffer", "sig_atomic_t", "volatile", "flag", "STDOUT_FILENO"], check: "Student suggests using only async-signal-safe functions like write(), or setting a flag checked by the main loop." },
      { id: "sigaction", description: "Notes that signal() behavior is implementation-defined and sigaction() is preferred", points: 2, keywords: ["sigaction", "signal() unreliable", "implementation-defined", "portability", "SA_RESTART"], check: "Student recommends sigaction over signal for reliable signal handling." }
    ],
    gaps: [
      { if_missing: "async-unsafe", gap: "Does not know which functions are async-signal-safe — will write handlers that deadlock or corrupt state" },
      { if_missing: "safe-alternative", gap: "Cannot implement correct signal handlers using safe primitives" }
    ]
  }
},

{
  competencyId: "c-systems",
  subTopic: "dup2-redirection",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Trace through this code and explain what it does. What does the child process's stdout become? What would happen if you removed the close() calls?

\`\`\`c
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int main(void)
{
    int pipefd[2];
    pipe(pipefd);

    pid_t pid = fork();
    if (pid == 0)
    {
        close(pipefd[0]);          // (1)
        dup2(pipefd[1], STDOUT_FILENO);  // (2)
        close(pipefd[1]);          // (3)
        execlp("ls", "ls", "-la", NULL); // (4)
        perror("execlp");
        _exit(1);
    }
    else
    {
        close(pipefd[1]);          // (5)
        char buf[4096];
        ssize_t n;
        while ((n = read(pipefd[0], buf, sizeof(buf) - 1)) > 0)
        {
            buf[n] = '\\0';
            printf("Got from child: %s", buf);
        }
        close(pipefd[0]);
        wait(NULL);
    }
    return 0;
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "dup2-effect", description: "Explains that dup2 makes STDOUT_FILENO point to the pipe write end, so ls output goes into the pipe", points: 3, keywords: ["dup2", "STDOUT", "redirect", "pipe write end", "ls output goes to pipe"], check: "Student explains that dup2 redirects the child's stdout to the pipe write end so ls output flows through the pipe." },
      { id: "close-after-dup2", description: "Explains why pipefd[1] is closed after dup2: the fd was duplicated, original is no longer needed", points: 2, keywords: ["duplicated", "no longer needed", "close original", "already copied", "fd leak"], check: "Student explains that after dup2, pipefd[1] is a redundant descriptor and closing it avoids leaking fds." },
      { id: "no-close-consequence", description: "Explains that if close() calls were removed, the parent's read loop would hang because the write end wouldn't fully close", points: 2, keywords: ["hang", "block", "never EOF", "write end open", "read blocks forever"], check: "Student explains that failing to close write ends means read() never returns 0 (EOF), causing the parent to hang." },
      { id: "execlp", description: "Explains that execlp replaces the child process image with ls, inheriting the redirected stdout", points: 1, keywords: ["replaces", "exec", "inherits", "file descriptors", "process image"], check: "Student explains that exec replaces the process but inherits open file descriptors including the redirected stdout." }
    ],
    gaps: [
      { if_missing: "dup2-effect", gap: "Does not understand dup2 for file descriptor redirection — core shell/pipex concept" },
      { if_missing: "no-close-consequence", gap: "Cannot reason about pipe EOF semantics and close() requirements" }
    ]
  }
},

{
  competencyId: "c-systems",
  subTopic: "thread-creation",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `This program creates threads to increment a shared counter. Trace the execution and explain why the final result is unreliable. What is the name of this class of bug?

\`\`\`c
#include <stdio.h>
#include <pthread.h>

int counter = 0;

void *increment(void *arg)
{
    for (int i = 0; i < 100000; i++)
        counter++;
    return NULL;
}

int main(void)
{
    pthread_t t1, t2;
    pthread_create(&t1, NULL, increment, NULL);
    pthread_create(&t2, NULL, increment, NULL);
    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    printf("counter = %d\\n", counter);
    return 0;
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "race-condition", description: "Identifies this as a race condition / data race on the shared counter", points: 2, keywords: ["race condition", "data race", "concurrent", "shared variable", "unsynchronized"], check: "Student names the bug as a race condition or data race." },
      { id: "non-atomic", description: "Explains that counter++ is not atomic: it is load-modify-store, and threads can interleave", points: 3, keywords: ["not atomic", "load", "modify", "store", "read-modify-write", "interleave", "lost update"], check: "Student explains counter++ involves three steps (load, increment, store) and interleaving causes lost updates." },
      { id: "result-range", description: "Explains the result will be between 100000 and 200000, unpredictable across runs", points: 1, keywords: ["less than 200000", "unpredictable", "between", "varies", "not deterministic"], check: "Student states the result is non-deterministic, always <= 200000 but often less." },
      { id: "fix", description: "Proposes a fix: mutex, atomic operations, or thread-local accumulation", points: 2, keywords: ["mutex", "pthread_mutex", "atomic", "__sync", "lock", "critical section"], check: "Student proposes at least one correct synchronization mechanism." }
    ],
    gaps: [
      { if_missing: "race-condition", gap: "Cannot identify data races — will write broken multi-threaded code" },
      { if_missing: "non-atomic", gap: "Does not understand why increment is non-atomic at the hardware level" }
    ]
  }
},

{
  competencyId: "c-systems",
  subTopic: "mutex-deadlock",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This program deadlocks. Explain why, then fix it so it works correctly without deadlocking.

\`\`\`c
#include <stdio.h>
#include <pthread.h>

pthread_mutex_t lock_a = PTHREAD_MUTEX_INITIALIZER;
pthread_mutex_t lock_b = PTHREAD_MUTEX_INITIALIZER;
int account_a = 1000;
int account_b = 1000;

void *transfer_a_to_b(void *arg)
{
    pthread_mutex_lock(&lock_a);
    usleep(1000);  // simulate work
    pthread_mutex_lock(&lock_b);
    account_a -= 100;
    account_b += 100;
    pthread_mutex_unlock(&lock_b);
    pthread_mutex_unlock(&lock_a);
    return NULL;
}

void *transfer_b_to_a(void *arg)
{
    pthread_mutex_lock(&lock_b);
    usleep(1000);  // simulate work
    pthread_mutex_lock(&lock_a);
    account_b -= 100;
    account_a += 100;
    pthread_mutex_unlock(&lock_a);
    pthread_mutex_unlock(&lock_b);
    return NULL;
}

int main(void)
{
    pthread_t t1, t2;
    pthread_create(&t1, NULL, transfer_a_to_b, NULL);
    pthread_create(&t2, NULL, transfer_b_to_a, NULL);
    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    printf("A: %d, B: %d\\n", account_a, account_b);
    return 0;
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "deadlock-cause", description: "Identifies the circular wait: t1 holds lock_a and waits for lock_b, t2 holds lock_b and waits for lock_a", points: 3, keywords: ["circular wait", "holds", "waits", "opposite order", "lock ordering", "ABBA"], check: "Student explains the circular dependency: each thread holds one lock while waiting for the other." },
      { id: "fix-ordering", description: "Fixes by enforcing consistent lock ordering: always lock A before B (or B before A)", points: 3, keywords: ["consistent order", "always lock A first", "lock ordering", "same order", "total order"], check: "Student fixes by making both functions acquire locks in the same order." },
      { id: "coffman", description: "Mentions deadlock conditions (mutual exclusion, hold-and-wait, no preemption, circular wait)", points: 2, keywords: ["Coffman", "four conditions", "mutual exclusion", "hold and wait", "circular wait", "no preemption"], check: "Student names at least two of the four Coffman conditions for deadlock." }
    ],
    gaps: [
      { if_missing: "deadlock-cause", gap: "Cannot identify deadlock from lock ordering — will write deadlocking code in philosophers/concurrent systems" },
      { if_missing: "fix-ordering", gap: "Does not know the lock-ordering solution to prevent deadlock" }
    ]
  }
},

{
  competencyId: "c-systems",
  subTopic: "fd-leak",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This function opens a config file, reads a value, and returns it. It works on the first call but eventually the program crashes with "too many open files." Find and fix all issues.

\`\`\`c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>

char *read_config_value(const char *path, const char *key)
{
    int fd = open(path, O_RDONLY);
    if (fd < 0)
        return NULL;

    char buf[4096];
    ssize_t n = read(fd, buf, sizeof(buf));
    if (n <= 0)
        return NULL;
    buf[n] = '\\0';

    char *line = strtok(buf, "\\n");
    while (line)
    {
        if (strncmp(line, key, strlen(key)) == 0)
        {
            char *val = strchr(line, '=');
            if (val)
                return strdup(val + 1);
        }
        line = strtok(NULL, "\\n");
    }
    close(fd);
    return NULL;
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "leak-on-error", description: "Identifies that the early return after failed read() leaks the fd", points: 2, keywords: ["early return", "fd not closed", "leak", "n <= 0", "error path"], check: "Student identifies that the error return path after read() doesn't close fd." },
      { id: "leak-on-found", description: "Identifies that the return strdup(val+1) path also leaks the fd", points: 3, keywords: ["return strdup", "fd open", "found value", "never closes", "success path leaks"], check: "Student identifies that when the key is found and strdup returns, fd is never closed." },
      { id: "fix", description: "Fixes all paths to close fd before returning (e.g. using goto cleanup or close before each return)", points: 2, keywords: ["close(fd)", "goto cleanup", "close before return", "all paths"], check: "Student ensures fd is closed on every return path." },
      { id: "buf-overflow", description: "Notes that buf[n] = '\\0' can write at buf[4096] if n == 4096 (off-by-one)", points: 1, keywords: ["buf[4096]", "off-by-one", "sizeof(buf) - 1", "read size"], check: "Student notices read could fill the entire buffer, making buf[n] an out-of-bounds write." }
    ],
    gaps: [
      { if_missing: "leak-on-found", gap: "Misses fd leaks on success paths — common pattern in C resource management" },
      { if_missing: "leak-on-error", gap: "Misses fd leaks on error paths — will write resource-leaking code" }
    ]
  }
},

{
  competencyId: "c-systems",
  subTopic: "select-multiplexing",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Explain what this code does step by step. Why does it use select() instead of just calling read() on each fd? What problem does the timeout solve?

\`\`\`c
#include <stdio.h>
#include <sys/select.h>
#include <unistd.h>

int monitor_fds(int *fds, int nfds, int timeout_sec)
{
    fd_set readfds;
    struct timeval tv;
    int maxfd = 0;

    FD_ZERO(&readfds);
    for (int i = 0; i < nfds; i++)
    {
        FD_SET(fds[i], &readfds);
        if (fds[i] > maxfd)
            maxfd = fds[i];
    }
    tv.tv_sec = timeout_sec;
    tv.tv_usec = 0;

    int ready = select(maxfd + 1, &readfds, NULL, NULL, &tv);
    if (ready < 0)
        return -1;
    if (ready == 0)
        return 0;  // timeout

    for (int i = 0; i < nfds; i++)
    {
        if (FD_ISSET(fds[i], &readfds))
        {
            char buf[256];
            ssize_t n = read(fds[i], buf, sizeof(buf) - 1);
            if (n > 0)
            {
                buf[n] = '\\0';
                printf("fd %d: %s\\n", fds[i], buf);
            }
        }
    }
    return ready;
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "multiplexing", description: "Explains that select() monitors multiple fds simultaneously without blocking on any single one", points: 3, keywords: ["multiplex", "monitor", "multiple", "simultaneously", "without blocking", "which are ready"], check: "Student explains that select lets you wait on multiple file descriptors at once, returning when any become ready." },
      { id: "blocking-problem", description: "Explains why sequential read() calls are problematic: blocking on fd[0] prevents reading fd[1] even if data is available", points: 2, keywords: ["blocking", "sequential", "stuck", "data available", "would block", "starve"], check: "Student explains the problem with sequential blocking reads: you get stuck on one fd while another has data." },
      { id: "timeout-purpose", description: "Explains timeout prevents indefinite blocking and allows periodic checks or cleanup", points: 2, keywords: ["timeout", "indefinite", "periodic", "heartbeat", "cleanup", "not forever"], check: "Student explains the timeout avoids hanging forever if no data arrives." },
      { id: "maxfd-plus-one", description: "Explains why select takes maxfd+1 (it's the number of fds to check, not the highest fd)", points: 1, keywords: ["maxfd + 1", "nfds", "range", "0 to maxfd", "exclusive upper bound"], check: "Student explains the maxfd+1 parameter." }
    ],
    gaps: [
      { if_missing: "multiplexing", gap: "Does not understand I/O multiplexing — needed for any concurrent server or shell implementation" },
      { if_missing: "blocking-problem", gap: "Cannot reason about blocking I/O and its impact on concurrent fd monitoring" }
    ]
  }
},

{
  competencyId: "c-systems",
  subTopic: "mmap-file-io",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This function uses mmap to count newlines in a file. It sometimes segfaults and always leaks resources. Fix all the issues.

\`\`\`c
#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <stdio.h>

int count_lines(const char *path)
{
    int fd = open(path, O_RDONLY);
    struct stat st;
    fstat(fd, &st);

    char *data = mmap(NULL, st.st_size, PROT_READ, MAP_PRIVATE, fd, 0);

    int count = 0;
    for (size_t i = 0; i < st.st_size; i++)
    {
        if (data[i] == '\\n')
            count++;
    }
    return count;
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "no-error-checks", description: "Identifies missing error checks on open(), fstat(), and mmap()", points: 2, keywords: ["error check", "open returns -1", "mmap MAP_FAILED", "fstat", "check return"], check: "Student identifies that none of the system calls are checked for failure." },
      { id: "no-munmap", description: "Identifies missing munmap() — memory mapping is leaked", points: 2, keywords: ["munmap", "leak", "unmap", "memory mapping leaked"], check: "Student identifies the missing munmap call." },
      { id: "no-close", description: "Identifies missing close(fd) — file descriptor is leaked", points: 2, keywords: ["close", "fd", "file descriptor leak", "close(fd)"], check: "Student identifies the missing close(fd)." },
      { id: "empty-file", description: "Identifies that st.st_size could be 0 for empty files and mmap with size 0 is undefined", points: 2, keywords: ["empty file", "size 0", "zero length", "mmap zero", "undefined"], check: "Student identifies the edge case where the file is empty and mmap(size=0) has undefined behavior." }
    ],
    gaps: [
      { if_missing: "no-munmap", gap: "Does not understand mmap resource cleanup — will leak virtual address space" },
      { if_missing: "no-error-checks", gap: "Skips system call error checking — will write fragile systems code" }
    ]
  }
},

{
  competencyId: "c-systems",
  subTopic: "shared-memory",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `Design a shared counter between two processes using POSIX shared memory and semaphores. Requirements:

1. A parent process creates shared memory containing an integer counter and a semaphore
2. It forks a child
3. Both parent and child increment the counter 100,000 times each
4. The parent waits for the child and prints the final value (should be 200,000)
5. Clean up all IPC resources

Write the complete implementation. Explain why you need a semaphore here but wouldn't for threads using a mutex, and what would happen if you used a regular mutex (not process-shared) between processes.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "shm-setup", description: "Correctly creates shared memory with shm_open + mmap or shmget + shmat", points: 2, keywords: ["shm_open", "mmap", "MAP_SHARED", "shmget", "shmat", "shared memory"], check: "Student creates shared memory correctly using POSIX or SysV shared memory APIs." },
      { id: "semaphore", description: "Uses a process-shared semaphore (sem_init with pshared=1, or named semaphore)", points: 3, keywords: ["sem_init", "pshared", "sem_open", "named semaphore", "process-shared"], check: "Student creates a semaphore that works across processes (pshared=1 or named)." },
      { id: "increment-loop", description: "Both processes increment with sem_wait/sem_post around the critical section", points: 2, keywords: ["sem_wait", "sem_post", "critical section", "lock", "increment"], check: "Student wraps the increment in sem_wait/sem_post in both processes." },
      { id: "cleanup", description: "Cleans up: munmap, shm_unlink, sem_destroy/sem_unlink, close", points: 1, keywords: ["shm_unlink", "munmap", "sem_destroy", "sem_unlink", "cleanup"], check: "Student properly cleans up all IPC resources." },
      { id: "mutex-vs-sem", description: "Explains that regular pthread mutexes are not shared across fork (different address spaces) and process-shared attribute is needed", points: 2, keywords: ["address space", "not shared", "PTHREAD_PROCESS_SHARED", "fork copies", "different mapping"], check: "Student explains why regular mutexes don't work between processes and what process-shared means." }
    ],
    gaps: [
      { if_missing: "semaphore", gap: "Cannot synchronize between processes — needed for IPC coordination" },
      { if_missing: "shm-setup", gap: "Cannot set up shared memory between processes" },
      { if_missing: "mutex-vs-sem", gap: "Does not understand the difference between thread-local and process-shared synchronization" }
    ]
  }
},

{
  competencyId: "c-systems",
  subTopic: "pipeline-construction",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `Implement a function that executes a pipeline of N commands, equivalent to the shell command \`cmd1 | cmd2 | ... | cmdN\`.

Signature: \`int run_pipeline(char **cmds[], int n)\` where cmds[i] is a NULL-terminated argv array.

Requirements:
1. Each command's stdout is piped to the next command's stdin
2. The first command reads from the original stdin, the last writes to the original stdout
3. All pipes are properly closed (no fd leaks, no hanging reads)
4. The function waits for all children and returns the exit status of the last command

Write the implementation and explain the fd management strategy.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "pipe-chain", description: "Creates n-1 pipes connecting each pair of adjacent commands", points: 2, keywords: ["n-1 pipes", "pipe per pair", "adjacent", "chain"], check: "Student creates the right number of pipes to connect the command chain." },
      { id: "fork-exec", description: "Forks n children, each calling dup2 for stdin/stdout redirection then execvp", points: 3, keywords: ["fork", "dup2", "execvp", "redirect stdin", "redirect stdout", "child"], check: "Student forks each child with correct dup2 setup and exec." },
      { id: "close-all-fds", description: "Each child closes all pipe fds it doesn't use; parent closes all pipe fds after forking", points: 3, keywords: ["close all", "parent closes", "child closes unused", "fd leak", "every pipe end"], check: "Student ensures all pipe fds are closed in both parent and children where they're not needed." },
      { id: "wait-all", description: "Parent waits for all children and captures the last command's exit status", points: 1, keywords: ["waitpid", "all children", "last command", "WEXITSTATUS", "exit status"], check: "Student waits for all children and returns the last command's exit status." },
      { id: "edge-cases", description: "Handles edge cases: single command (no pipes), exec failure, fork failure", points: 1, keywords: ["single command", "n == 1", "exec fail", "fork fail", "_exit", "error"], check: "Student handles at least one edge case." }
    ],
    gaps: [
      { if_missing: "close-all-fds", gap: "Cannot manage file descriptors in multi-pipe setups — will create hanging or leaking pipelines" },
      { if_missing: "fork-exec", gap: "Cannot implement fork+exec pattern — fundamental for shell implementations" }
    ]
  }
},

{
  competencyId: "c-systems",
  subTopic: "race-condition-toctou",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText: `Compare these two approaches to safely writing a temporary file. Which one has a TOCTOU (time-of-check-to-time-of-use) vulnerability? Explain the race condition, who can exploit it, and how.

Approach A:
\`\`\`c
if (access("/tmp/myapp.conf", F_OK) != 0)
{
    int fd = open("/tmp/myapp.conf", O_WRONLY | O_CREAT, 0644);
    write(fd, config_data, config_len);
    close(fd);
}
\`\`\`

Approach B:
\`\`\`c
int fd = open("/tmp/myapp.conf", O_WRONLY | O_CREAT | O_EXCL, 0600);
if (fd >= 0)
{
    write(fd, config_data, config_len);
    close(fd);
}
\`\`\`

Then: describe a real attack scenario using the TOCTOU in approach A if the program runs as root.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "identify-vuln", description: "Correctly identifies Approach A as vulnerable: access() and open() are not atomic", points: 2, keywords: ["Approach A", "access then open", "not atomic", "TOCTOU", "window"], check: "Student identifies Approach A as the vulnerable one and names it a TOCTOU race." },
      { id: "race-window", description: "Explains the race: between access() and open(), an attacker can create a symlink at that path", points: 3, keywords: ["symlink", "between", "race window", "attacker creates", "replace", "link"], check: "Student explains that an attacker can create a symlink in the window between access() and open()." },
      { id: "root-attack", description: "Describes a privilege escalation: symlink /tmp/myapp.conf -> /etc/shadow, root program overwrites the target", points: 3, keywords: ["/etc/shadow", "/etc/passwd", "root", "overwrite", "symlink attack", "arbitrary file write", "privilege"], check: "Student describes a concrete symlink attack where a root process writes to a sensitive file." },
      { id: "approach-b-safe", description: "Explains why O_EXCL makes approach B safe: create-and-open is atomic, fails if file exists", points: 2, keywords: ["O_EXCL", "atomic", "create and open", "fails if exists", "single syscall"], check: "Student explains that O_EXCL makes the existence check and creation atomic in a single syscall." }
    ],
    gaps: [
      { if_missing: "race-window", gap: "Cannot reason about TOCTOU race conditions — critical for security-aware systems programming" },
      { if_missing: "root-attack", gap: "Does not understand symlink attacks in /tmp — a classic local privilege escalation vector" }
    ]
  }
},

{
  competencyId: "c-systems",
  subTopic: "daemon-creation",
  questionType: "compare_contrast",
  difficulty: 5,
  questionText: `Compare these two daemon implementations. One follows the traditional double-fork pattern, the other uses a modern approach. For each step in the traditional approach, explain WHY it is done (not just what it does). Then argue: on a modern Linux system with systemd, which approach would you recommend and why?

Traditional:
\`\`\`c
void daemonize(void)
{
    pid_t pid = fork();             // (1) first fork
    if (pid > 0) exit(0);           // (2) parent exits
    setsid();                       // (3) new session
    signal(SIGHUP, SIG_IGN);       // (4) ignore SIGHUP
    pid = fork();                   // (5) second fork
    if (pid > 0) exit(0);           // (6) session leader exits
    umask(0);                       // (7) clear umask
    chdir("/");                     // (8) root directory
    for (int i = 0; i < 1024; i++) // (9) close all fds
        close(i);
    open("/dev/null", O_RDONLY);   // (10) stdin  -> /dev/null
    open("/dev/null", O_WRONLY);   // (11) stdout -> /dev/null
    open("/dev/null", O_WRONLY);   // (12) stderr -> /dev/null
}
\`\`\`

Modern:
\`\`\`c
// Just run the program directly; let systemd handle:
// - process supervision, restart, logging (journald)
// - fd management, cgroup isolation, resource limits
int main(void) { /* just run the service logic */ }
\`\`\``,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "first-fork-why", description: "Explains first fork + parent exit: detaches from launching terminal/shell, becomes orphan adopted by init", points: 2, keywords: ["detach", "terminal", "orphan", "init", "background", "shell returns"], check: "Student explains the first fork detaches from the controlling terminal and lets the shell return." },
      { id: "setsid-why", description: "Explains setsid(): creates new session and process group, removes controlling terminal", points: 2, keywords: ["setsid", "new session", "process group leader", "no controlling terminal", "session leader"], check: "Student explains setsid creates a new session so the process is not associated with any terminal." },
      { id: "second-fork-why", description: "Explains second fork: prevents the process from ever acquiring a controlling terminal again (non-session-leader cannot open a tty as controlling)", points: 2, keywords: ["second fork", "session leader", "cannot acquire", "controlling terminal", "non-leader"], check: "Student explains the second fork ensures the daemon can never accidentally acquire a controlling terminal." },
      { id: "fd-redirect-why", description: "Explains closing fds and reopening to /dev/null: prevents holding open files from the parent, avoids writing to a gone terminal", points: 2, keywords: ["/dev/null", "close fds", "inherited", "terminal gone", "write errors"], check: "Student explains fd cleanup prevents inheriting unwanted descriptors and avoids broken pipe writes." },
      { id: "modern-recommendation", description: "Recommends modern approach for systemd systems with reasoning: simpler code, proper logging, supervision, socket activation", points: 2, keywords: ["systemd", "simpler", "journald", "supervision", "socket activation", "restart", "Type=simple"], check: "Student recommends the modern approach for systemd environments with concrete reasons." }
    ],
    gaps: [
      { if_missing: "second-fork-why", gap: "Does not understand the double-fork daemon pattern — foundational Unix systems knowledge" },
      { if_missing: "setsid-why", gap: "Does not understand sessions and process groups" },
      { if_missing: "modern-recommendation", gap: "Cannot evaluate traditional vs modern approaches to service management" }
    ]
  }
},

{
  competencyId: "c-systems",
  subTopic: "process-environment",
  questionType: "design_solution",
  difficulty: 5,
  questionText: `Design a process supervisor (like a minimal systemd unit manager) in C that:

1. Reads a list of commands from a config file (one per line)
2. Starts each command as a child process
3. Monitors all children — if any child exits, restarts it automatically
4. Handles SIGTERM gracefully: sends SIGTERM to all children, waits for them, then exits
5. Logs each start/stop/restart event to stderr with a timestamp

Write the core implementation. Explain:
- Why you cannot use a simple blocking waitpid() in the main loop
- How SIGCHLD + waitpid(WNOHANG) solves this
- What happens if two children die simultaneously
- How you prevent fork-bombing if a child crashes immediately in a loop`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "child-table", description: "Maintains a data structure mapping PIDs to command strings for tracking", points: 1, keywords: ["table", "array", "map", "PID", "command", "tracking", "struct"], check: "Student maintains a mapping from child PIDs to their commands for restart." },
      { id: "sigchld-handler", description: "Uses SIGCHLD with a non-blocking waitpid loop to reap all exited children", points: 3, keywords: ["SIGCHLD", "waitpid", "WNOHANG", "-1", "loop", "while", "reap all"], check: "Student handles SIGCHLD with a waitpid(-1, ..., WNOHANG) loop to handle multiple simultaneous exits." },
      { id: "graceful-shutdown", description: "SIGTERM handler sets a flag, main loop sends SIGTERM to all children and waits", points: 2, keywords: ["SIGTERM", "flag", "kill", "all children", "wait", "graceful", "shutdown"], check: "Student implements graceful shutdown: signal flag, kill children, wait for them." },
      { id: "fork-bomb-prevention", description: "Implements a restart rate limit: delays restart or stops after N rapid restarts", points: 2, keywords: ["rate limit", "delay", "rapid restart", "backoff", "cooldown", "count", "too fast"], check: "Student prevents fork bombing by rate-limiting restarts." },
      { id: "blocking-waitpid-problem", description: "Explains that blocking waitpid on one PID prevents seeing other children exit; need non-blocking on any child (-1)", points: 2, keywords: ["blocking", "one PID", "misses others", "non-blocking", "-1", "any child"], check: "Student explains why blocking waitpid is insufficient for multi-child supervision." }
    ],
    gaps: [
      { if_missing: "sigchld-handler", gap: "Cannot implement process supervision — a core systems programming pattern" },
      { if_missing: "fork-bomb-prevention", gap: "Does not consider runaway restart scenarios — will write supervisors that amplify failures" }
    ]
  }
},

// --- algorithms (Algorithms & problem solving) ---

{
  competencyId: "algorithms",
  subTopic: "sorting-complexity",
  questionType: "predict_output",
  difficulty: 1,
  questionText: `Given this array: [5, 3, 8, 1, 9, 2, 7], trace the first 3 passes of bubble sort (ascending order).

For each pass, show:
1. The state of the array after the pass completes
2. How many comparisons were made in that pass
3. How many swaps were made in that pass

Then state: what is the best-case and worst-case time complexity of bubble sort, and what input triggers each?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "pass-1", description: "Correctly traces pass 1: comparisons bring 9 to the end -> [3, 5, 1, 8, 2, 7, 9]", points: 2, keywords: ["3, 5, 1, 8, 2, 7, 9", "6 comparisons", "largest bubbles"], check: "Student correctly traces the first pass, showing the largest element reaching the end." },
      { id: "pass-2-3", description: "Correctly traces passes 2 and 3", points: 2, keywords: ["pass 2", "pass 3", "second largest", "fewer comparisons"], check: "Student correctly traces passes 2 and 3 with accurate swap counts." },
      { id: "best-case", description: "Best case O(n) with already-sorted input (with early termination optimization)", points: 2, keywords: ["O(n)", "already sorted", "no swaps", "early termination", "best case"], check: "Student states best case is O(n) for sorted input and mentions the early-exit optimization." },
      { id: "worst-case", description: "Worst case O(n^2) with reverse-sorted input", points: 2, keywords: ["O(n^2)", "O(n squared)", "reverse sorted", "worst case", "n*(n-1)/2"], check: "Student states worst case is O(n^2) for reverse-sorted input." }
    ],
    gaps: [
      { if_missing: "pass-1", gap: "Cannot trace basic sorting algorithms step by step" },
      { if_missing: "worst-case", gap: "Does not know the time complexity of elementary sorting algorithms" }
    ]
  }
},

{
  competencyId: "algorithms",
  subTopic: "binary-search",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `This binary search implementation has a subtle bug that only manifests with large arrays. Find it and explain when it fails.

\`\`\`c
int binary_search(int *arr, int n, int target)
{
    int low = 0;
    int high = n - 1;

    while (low <= high)
    {
        int mid = (low + high) / 2;
        if (arr[mid] == target)
            return mid;
        else if (arr[mid] < target)
            low = mid + 1;
        else
            high = mid - 1;
    }
    return -1;
}
\`\`\``,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "overflow", description: "Identifies that (low + high) can overflow when both are large (> INT_MAX/2)", points: 3, keywords: ["overflow", "low + high", "INT_MAX", "integer overflow", "wraps", "negative"], check: "Student identifies the integer overflow bug in (low + high) / 2." },
      { id: "fix", description: "Provides the fix: mid = low + (high - low) / 2", points: 2, keywords: ["low + (high - low) / 2", "subtraction", "avoids overflow"], check: "Student provides the standard fix using subtraction to avoid overflow." },
      { id: "threshold", description: "Explains this only matters when n > ~1 billion (INT_MAX/2) for 32-bit ints", points: 1, keywords: ["billion", "INT_MAX", "2^30", "large arrays", "2 billion"], check: "Student estimates the threshold at which the overflow occurs." }
    ],
    gaps: [
      { if_missing: "overflow", gap: "Does not recognise integer overflow in arithmetic — a classic bug even in published textbooks" },
      { if_missing: "fix", gap: "Cannot apply the standard binary search overflow fix" }
    ]
  }
},

{
  competencyId: "algorithms",
  subTopic: "stack-operations",
  questionType: "predict_output",
  difficulty: 2,
  questionText: `Trace through this stack-based expression evaluator. What value does it return for the input "3 4 + 2 * 1 -"? Show the stack state after processing each token.

\`\`\`c
int evaluate_rpn(const char *expr)
{
    int stack[64];
    int top = -1;
    char token[16];
    int pos = 0;

    while (sscanf(expr + pos, "%s", token) == 1)
    {
        pos += strlen(token);
        while (expr[pos] == ' ') pos++;

        if (token[0] >= '0' && token[0] <= '9')
        {
            stack[++top] = atoi(token);
        }
        else
        {
            int b = stack[top--];
            int a = stack[top--];
            if (token[0] == '+') stack[++top] = a + b;
            if (token[0] == '-') stack[++top] = a - b;
            if (token[0] == '*') stack[++top] = a * b;
        }
    }
    return stack[top];
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "trace", description: "Correctly traces all stack states: [3] -> [3,4] -> [7] -> [7,2] -> [14] -> [14,1] -> [13]", points: 4, keywords: ["[3]", "[3, 4]", "[7]", "[7, 2]", "[14]", "[14, 1]", "[13]"], check: "Student shows the correct stack state after each of the 7 tokens." },
      { id: "result", description: "States the final result is 13", points: 2, keywords: ["13", "result"], check: "Student states the final result is 13." },
      { id: "rpn-understanding", description: "Explains this is Reverse Polish Notation evaluation — operands push, operators pop two and push result", points: 2, keywords: ["Reverse Polish", "RPN", "postfix", "operands push", "operators pop"], check: "Student identifies the algorithm as RPN/postfix evaluation and explains the push/pop pattern." }
    ],
    gaps: [
      { if_missing: "trace", gap: "Cannot trace stack-based algorithms — fundamental to understanding function calls and expression evaluation" },
      { if_missing: "rpn-understanding", gap: "Does not understand postfix notation and stack-based evaluation" }
    ]
  }
},

{
  competencyId: "algorithms",
  subTopic: "time-complexity",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `This function checks if an array contains any duplicate values. It works correctly but the developer says "it's O(n)." Is that claim correct? Analyse the actual time complexity and propose a genuinely O(n) alternative.

\`\`\`c
int has_duplicates(int *arr, int n)
{
    for (int i = 0; i < n; i++)
    {
        for (int j = i + 1; j < n; j++)
        {
            if (arr[i] == arr[j])
                return 1;
        }
    }
    return 0;
}
\`\`\``,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "actual-complexity", description: "Correctly identifies the complexity as O(n^2) due to nested loops", points: 2, keywords: ["O(n^2)", "nested loops", "n*(n-1)/2", "quadratic"], check: "Student correctly identifies the complexity as O(n^2) and explains why." },
      { id: "analysis", description: "Shows the inner loop does n-1 + n-2 + ... + 1 = n(n-1)/2 comparisons", points: 2, keywords: ["n-1", "n-2", "sum", "n(n-1)/2", "arithmetic series"], check: "Student derives the comparison count as an arithmetic series." },
      { id: "o-n-alternative", description: "Proposes a hash set approach for O(n) average case, or sort + linear scan for O(n log n)", points: 2, keywords: ["hash", "hash set", "hash table", "O(n) average", "sort", "O(n log n)"], check: "Student proposes a hash-based O(n) solution or a sort-based O(n log n) alternative." }
    ],
    gaps: [
      { if_missing: "actual-complexity", gap: "Cannot analyse time complexity of nested loops — fundamental algorithmic reasoning" },
      { if_missing: "o-n-alternative", gap: "Does not know hash-based approaches to reduce duplicate detection complexity" }
    ]
  }
},

{
  competencyId: "algorithms",
  subTopic: "linked-list-cycle",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Explain how Floyd's cycle detection algorithm works. Given this linked list with a cycle (node values shown, arrow shows next pointer):

\`1 -> 2 -> 3 -> 4 -> 5 -> 3\` (5's next points back to 3)

Trace the slow and fast pointers step by step until they meet. Then: prove mathematically (or explain intuitively) why this algorithm is guaranteed to detect a cycle and why the pointers always meet.

\`\`\`c
typedef struct node { int val; struct node *next; } node_t;

node_t *detect_cycle(node_t *head)
{
    node_t *slow = head;
    node_t *fast = head;

    while (fast && fast->next)
    {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast)
            return slow;  // cycle detected
    }
    return NULL;  // no cycle
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "trace", description: "Correctly traces: step1(s=2,f=3), step2(s=3,f=5), step3(s=4,f=4) — they meet at node 4", points: 3, keywords: ["slow=2, fast=3", "slow=3, fast=5", "slow=4, fast=4", "meet at 4"], check: "Student correctly traces slow and fast through the list until they meet." },
      { id: "speed-difference", description: "Explains the fast pointer gains one node per step on the slow pointer inside the cycle", points: 2, keywords: ["gains one", "one node per step", "closing gap", "relative speed", "distance decreases"], check: "Student explains that inside the cycle, the gap decreases by 1 each step, so they must eventually meet." },
      { id: "guaranteed", description: "Explains why meeting is guaranteed: inside a cycle of length C, the gap mod C decreases by 1 each step, reaching 0", points: 2, keywords: ["modular", "mod C", "guaranteed", "must reach 0", "finite", "pigeon"], check: "Student provides an argument for why the pointers must eventually collide." },
      { id: "complexity", description: "States the algorithm is O(n) time and O(1) space", points: 1, keywords: ["O(n)", "O(1) space", "constant space", "linear time"], check: "Student states the time and space complexity." }
    ],
    gaps: [
      { if_missing: "trace", gap: "Cannot trace two-pointer algorithms on linked structures" },
      { if_missing: "speed-difference", gap: "Does not understand the invariant behind Floyd's algorithm" }
    ]
  }
},

{
  competencyId: "algorithms",
  subTopic: "recursion-stack",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Trace the complete call stack for this recursive function call: \`power(2, 5)\`. Show every recursive call, the return value at each level, and the total number of multiplications performed.

\`\`\`c
int power(int base, int exp)
{
    if (exp == 0)
        return 1;
    if (exp % 2 == 0)
    {
        int half = power(base, exp / 2);
        return half * half;
    }
    else
    {
        return base * power(base, exp - 1);
    }
}
\`\`\`

Then: what is the time complexity of this algorithm vs the naive approach \`base * base * ... (exp times)\`? Why is this called "exponentiation by squaring"?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "trace", description: "Correctly traces: power(2,5)->2*power(2,4)->power(2,2)->power(2,1)->2*power(2,0)->1, unwinds correctly", points: 3, keywords: ["power(2,5)", "power(2,4)", "power(2,2)", "power(2,1)", "power(2,0)", "returns 1", "returns 32"], check: "Student correctly traces all recursive calls and their return values, arriving at 32." },
      { id: "multiplication-count", description: "Counts the multiplications: about log2(exp) multiplications, not exp", points: 2, keywords: ["log", "4 multiplications", "O(log n)", "fewer", "logarithmic"], check: "Student counts the number of multiplications and notes it is logarithmic in exp." },
      { id: "complexity", description: "States O(log n) vs naive O(n), explains the halving gives logarithmic depth", points: 2, keywords: ["O(log n)", "O(n)", "halving", "logarithmic", "divide", "squaring"], check: "Student correctly compares O(log n) to O(n) and explains why halving exp gives logarithmic depth." },
      { id: "squaring-name", description: "Explains the name: even exponents are computed by squaring the half-result instead of multiplying linearly", points: 1, keywords: ["squaring", "half * half", "square the result", "reuse"], check: "Student explains the 'squaring' part — computing x^n as (x^(n/2))^2." }
    ],
    gaps: [
      { if_missing: "trace", gap: "Cannot trace recursive call stacks — needed for debugging and understanding algorithm behavior" },
      { if_missing: "complexity", gap: "Does not understand how divide-and-conquer yields logarithmic complexity" }
    ]
  }
},

{
  competencyId: "algorithms",
  subTopic: "hash-table-collision",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Given a hash table of size 7 using chaining (linked lists), and the hash function h(k) = k % 7, trace the insertion of these keys in order: 10, 22, 31, 4, 15, 28, 17, 88, 59.

For each insertion:
1. Show which bucket the key goes into
2. Show the state of that bucket's chain
3. Identify any collisions

Then answer: what is the load factor after all insertions? What happens to performance as the load factor grows? At what load factor would you typically resize?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "bucket-assignment", description: "Correctly assigns keys to buckets (10->3, 22->1, 31->3, 4->4, 15->1, 28->0, 17->3, 88->4, 59->3)", points: 3, keywords: ["10 mod 7 = 3", "22 mod 7 = 1", "31 mod 7 = 3", "collision", "bucket 3"], check: "Student correctly computes hash values and assigns keys to the right buckets." },
      { id: "collisions", description: "Identifies collisions: bucket 3 has 4 keys (10,31,17,59), bucket 1 has 2 (22,15), bucket 4 has 2 (4,88)", points: 2, keywords: ["collision", "bucket 3", "four keys", "chain", "linked list"], check: "Student correctly identifies which buckets have collisions and their chain contents." },
      { id: "load-factor", description: "States load factor = 9/7 ≈ 1.29 and explains it is the ratio of elements to buckets", points: 2, keywords: ["9/7", "1.29", "elements / buckets", "ratio", "load factor"], check: "Student computes the load factor correctly and defines it." },
      { id: "resize", description: "Explains performance degrades toward O(n) as load factor grows; typical resize threshold is 0.7-0.75", points: 1, keywords: ["O(n)", "degrade", "resize", "0.75", "rehash", "double"], check: "Student explains the performance impact and resize threshold." }
    ],
    gaps: [
      { if_missing: "bucket-assignment", gap: "Cannot trace hash table operations — fundamental data structure" },
      { if_missing: "load-factor", gap: "Does not understand load factor and its impact on hash table performance" }
    ]
  }
},

{
  competencyId: "algorithms",
  subTopic: "two-pointer-technique",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This function is supposed to remove duplicate elements from a sorted array in-place and return the new length. It has a logic error. Fix it and explain the two-pointer technique used here.

\`\`\`c
int remove_duplicates(int *arr, int n)
{
    if (n == 0)
        return 0;

    int write = 0;
    for (int read = 0; read < n; read++)
    {
        if (arr[read] != arr[write])
        {
            arr[write] = arr[read];
            write++;
        }
    }
    return write;
}
\`\`\`

Test case: [1, 1, 2, 3, 3, 3, 4] should become [1, 2, 3, 4] with return value 4.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "bug", description: "Identifies the bug: write should be incremented BEFORE assignment, or assignment should be to write+1. Currently arr[write] = arr[read] overwrites the value we're comparing against", points: 3, keywords: ["write + 1", "increment before", "overwrites", "arr[write+1]", "pre-increment"], check: "Student identifies that the write pointer must advance before (or the write must target write+1) so we don't overwrite the comparison value." },
      { id: "fix", description: "Provides correct fix: either write++ then arr[write] = arr[read], or arr[++write] = arr[read]", points: 2, keywords: ["++write", "write++", "arr[write] = arr[read]", "pre-increment write"], check: "Student provides correct fix code." },
      { id: "return-fix", description: "Notes the return value should be write+1 (since write is 0-indexed)", points: 2, keywords: ["write + 1", "return write + 1", "0-indexed", "length not index"], check: "Student notes the return value needs adjustment since write is an index, not a count." },
      { id: "technique", description: "Explains the two-pointer technique: read scans forward, write marks where to place next unique element", points: 1, keywords: ["two-pointer", "read pointer", "write pointer", "scan", "place", "in-place"], check: "Student explains the read/write pointer pattern." }
    ],
    gaps: [
      { if_missing: "bug", gap: "Cannot trace index-based in-place algorithms — needed for push_swap and memory-constrained problems" },
      { if_missing: "return-fix", gap: "Confuses array index with element count — common off-by-one source" }
    ]
  }
},

{
  competencyId: "algorithms",
  subTopic: "graph-bfs",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This BFS implementation is supposed to find the shortest path length from a source node to a target node in an unweighted graph. It compiles and runs but sometimes returns wrong distances. Find and fix the bug.

\`\`\`c
#include <stdbool.h>

#define MAX_NODES 100

typedef struct {
    int adj[MAX_NODES][MAX_NODES];
    int n;
} graph_t;

int bfs_distance(graph_t *g, int src, int dst)
{
    bool visited[MAX_NODES] = {false};
    int queue[MAX_NODES];
    int dist[MAX_NODES] = {0};
    int front = 0, rear = 0;

    queue[rear++] = src;

    while (front < rear)
    {
        int node = queue[front++];
        if (node == dst)
            return dist[node];

        for (int i = 0; i < g->n; i++)
        {
            if (g->adj[node][i] && !visited[i])
            {
                visited[i] = true;
                dist[i] = dist[node] + 1;
                queue[rear++] = i;
            }
        }
    }
    return -1;
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "src-not-visited", description: "Identifies that the source node is never marked as visited, so it can be re-enqueued by a neighbor", points: 3, keywords: ["source", "not visited", "src not marked", "visited[src]", "re-enqueued", "revisit"], check: "Student identifies that visited[src] is never set to true, allowing the source to be revisited." },
      { id: "fix", description: "Fixes by adding visited[src] = true before the while loop", points: 2, keywords: ["visited[src] = true", "before loop", "mark source", "initial"], check: "Student adds visited[src] = true before entering the BFS loop." },
      { id: "consequence", description: "Explains the consequence: a neighbor of src can re-add src to the queue with dist > 0, corrupting shortest paths", points: 2, keywords: ["re-add", "wrong distance", "corrupted", "longer path", "not shortest"], check: "Student explains how the missing visited mark causes incorrect distance calculations." },
      { id: "queue-overflow", description: "Notes that the queue array could overflow if the graph has more edges than MAX_NODES", points: 1, keywords: ["queue overflow", "rear >= MAX_NODES", "bounds", "circular queue"], check: "Student notes the potential queue overflow for dense graphs." }
    ],
    gaps: [
      { if_missing: "src-not-visited", gap: "Cannot identify BFS initialization errors — will write broken graph traversals" },
      { if_missing: "consequence", gap: "Cannot reason about how BFS errors propagate through distance calculations" }
    ]
  }
},

{
  competencyId: "algorithms",
  subTopic: "sorting-algorithm-design",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `You need to sort a stack of integers using only these operations:
- \`sa\`: swap the first two elements of stack A
- \`pb\`: push the top of stack A onto stack B
- \`pa\`: push the top of stack B onto stack A
- \`ra\`: rotate stack A (first element goes to bottom)
- \`rra\`: reverse rotate stack A (last element goes to top)
- \`rb\` / \`rrb\`: same for stack B

Given stack A = [5, 2, 8, 1, 3] (top first), design an algorithm to sort it in ascending order (1 at top) using the minimum number of operations. Show your step-by-step solution and explain your strategy.

Then: what is the theoretical minimum number of operations to sort n elements with this constraint? Why is this problem harder than array-based sorting?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "valid-solution", description: "Produces a valid sequence of operations that results in a sorted stack A", points: 3, keywords: ["pb", "pa", "ra", "sa", "sorted", "1 2 3 5 8"], check: "Student provides a sequence of valid operations that sorts the stack correctly." },
      { id: "strategy", description: "Explains a coherent strategy (e.g., find minimum and rotate to top, push to B, repeat; or partition-based)", points: 3, keywords: ["strategy", "minimum", "rotate", "partition", "chunks", "insertion"], check: "Student articulates a clear sorting strategy, not just random operations." },
      { id: "operation-count", description: "Uses a reasonable number of operations (under 15 for 5 elements)", points: 2, keywords: ["operations", "moves", "efficient", "count"], check: "Student produces a reasonably efficient solution." },
      { id: "harder-why", description: "Explains why it's harder: limited access (only top element), no random access, operations don't map to O(n log n) sorts", points: 2, keywords: ["limited access", "top only", "no random access", "no indexing", "sequential", "restricted"], check: "Student explains the constraints that make this harder than array-based sorting." }
    ],
    gaps: [
      { if_missing: "strategy", gap: "Cannot design sorting algorithms under constraints — needed for push_swap project" },
      { if_missing: "harder-why", gap: "Does not understand how data structure access patterns affect algorithm design" }
    ]
  }
},

{
  competencyId: "algorithms",
  subTopic: "complexity-analysis",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText: `Compare these three approaches to finding the k-th smallest element in an unsorted array of n integers:

1. Sort the array, return arr[k-1]
2. Use a max-heap of size k
3. Quickselect (partition-based selection)

For each approach, state:
- Time complexity (average and worst case)
- Space complexity
- Whether it modifies the input array

Then: if n = 10,000,000 and k = 100, which approach would you use and why? What if k = n/2?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "sort-complexity", description: "Sort: O(n log n) time, O(1) or O(n) space depending on algorithm, modifies array (or O(n) for copy)", points: 2, keywords: ["O(n log n)", "sort", "modifies", "in-place or copy"], check: "Student correctly states sort-based approach complexity." },
      { id: "heap-complexity", description: "Heap: O(n log k) time, O(k) space, does not modify input", points: 2, keywords: ["O(n log k)", "O(k) space", "max-heap", "does not modify"], check: "Student correctly states heap-based approach complexity." },
      { id: "quickselect-complexity", description: "Quickselect: O(n) average, O(n^2) worst, O(1) space, modifies input (partitions in-place)", points: 2, keywords: ["O(n) average", "O(n^2) worst", "partition", "in-place", "modifies"], check: "Student correctly states quickselect complexity including worst case." },
      { id: "small-k", description: "For k=100, recommends heap: O(n log 100) ≈ O(n), small space, no modification needed", points: 2, keywords: ["heap", "log 100", "small k", "practically linear", "O(k) space"], check: "Student recommends heap for small k with reasoning about log k being small." },
      { id: "median-k", description: "For k=n/2 (median), recommends quickselect: O(n) average vs O(n log n) for sort, heap's log k becomes log(n/2)", points: 2, keywords: ["quickselect", "median", "O(n)", "heap worse", "log(n/2)", "introselect"], check: "Student recommends quickselect for k=n/2 with reasoning about why heap is no longer advantageous." }
    ],
    gaps: [
      { if_missing: "quickselect-complexity", gap: "Does not know partition-based selection — important algorithmic technique" },
      { if_missing: "small-k", gap: "Cannot select the right algorithm based on parameter values — needed for practical problem solving" }
    ]
  }
},

{
  competencyId: "algorithms",
  subTopic: "dynamic-programming",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `Design a solution for the coin change problem: given an array of coin denominations and a target amount, find the minimum number of coins needed to make that amount (or -1 if impossible).

Example: coins = [1, 5, 10, 25], amount = 36 => answer is 3 (25 + 10 + 1)

Requirements:
1. Write the recurrence relation
2. Implement it using bottom-up dynamic programming in C
3. Trace through your solution for coins = [1, 3, 4] and amount = 6
4. State the time and space complexity

Explain why a greedy approach (always take the largest coin) fails for some coin systems.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "recurrence", description: "States the recurrence: dp[i] = min(dp[i - coin] + 1) for each coin, dp[0] = 0", points: 2, keywords: ["dp[i]", "min", "dp[i - coin] + 1", "dp[0] = 0", "recurrence"], check: "Student writes the correct recurrence relation." },
      { id: "implementation", description: "Implements correct bottom-up DP with a 1D array", points: 3, keywords: ["for", "amount", "coin", "dp[i]", "INT_MAX", "bottom-up", "table"], check: "Student provides working C code for the bottom-up DP solution." },
      { id: "trace", description: "Traces coins=[1,3,4], amount=6: dp = [0,1,2,1,1,2,2] — answer is 2 (3+3)", points: 2, keywords: ["dp[6] = 2", "3 + 3", "two coins", "trace"], check: "Student correctly traces the DP table and shows the answer is 2 (two coins of value 3)." },
      { id: "complexity", description: "States O(amount * |coins|) time and O(amount) space", points: 1, keywords: ["O(amount * coins)", "O(amount)", "pseudo-polynomial"], check: "Student states the correct time and space complexity." },
      { id: "greedy-fails", description: "Explains greedy fails: coins=[1,3,4] amount=6, greedy picks 4+1+1=3 coins, but optimal is 3+3=2 coins", points: 2, keywords: ["greedy fails", "4 + 1 + 1", "suboptimal", "3 + 3", "counterexample"], check: "Student gives a concrete counterexample showing greedy gives a non-optimal result." }
    ],
    gaps: [
      { if_missing: "recurrence", gap: "Cannot formulate DP recurrence relations — foundational for dynamic programming" },
      { if_missing: "greedy-fails", gap: "Does not understand when greedy heuristics fail and DP is required" }
    ]
  }
},

{
  competencyId: "algorithms",
  subTopic: "amortized-analysis",
  questionType: "compare_contrast",
  difficulty: 5,
  questionText: `A dynamic array (like C's realloc-based vector) starts with capacity 1 and doubles when full. Consider n push_back operations.

1. What is the worst-case cost of a single push_back? What is the amortized cost?
2. Prove or argue that the amortized cost per operation is O(1)
3. Compare the doubling strategy with growing by a fixed amount (e.g., +10 each time). What is the amortized cost of the fixed-growth strategy?
4. Why does the choice of growth factor matter for real-world performance?

Include concrete numbers: if you push 17 elements, show exactly when reallocations happen and how many total element copies occur.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "worst-single", description: "Worst-case single push_back is O(n) — must copy all existing elements on reallocation", points: 1, keywords: ["O(n)", "copy all", "realloc", "worst case single"], check: "Student states that a single push_back can cost O(n) when reallocation occurs." },
      { id: "amortized-proof", description: "Proves amortized O(1): total copies for n pushes = 1+2+4+...+n ≈ 2n, so amortized = O(1)", points: 3, keywords: ["geometric series", "1 + 2 + 4", "2n", "total copies", "amortized O(1)", "sum of powers"], check: "Student proves amortized O(1) using the geometric series argument or banker's/physicist's method." },
      { id: "concrete-17", description: "Traces 17 elements: realloc at sizes 1,2,4,8,16,32 — copies 1+2+4+8+16 = 31 total copies for 17 pushes", points: 2, keywords: ["1, 2, 4, 8, 16", "31 copies", "17 elements", "realloc at"], check: "Student correctly traces reallocation points and total copy counts for 17 elements." },
      { id: "fixed-growth", description: "Fixed growth (+k): amortized cost is O(n) because total copies = k + 2k + 3k + ... = O(n^2/k), giving O(n) per push", points: 2, keywords: ["O(n)", "arithmetic series", "n^2", "linear amortized", "quadratic total"], check: "Student analyses the fixed-growth strategy and shows it has O(n) amortized cost." },
      { id: "real-world", description: "Discusses real-world tradeoffs: doubling wastes up to 50% memory, growth factor 1.5 is common, memory allocator fragmentation", points: 2, keywords: ["50%", "wasted", "1.5", "memory", "fragmentation", "tradeoff", "cache"], check: "Student discusses practical tradeoffs between growth factor and memory waste." }
    ],
    gaps: [
      { if_missing: "amortized-proof", gap: "Does not understand amortized analysis — needed to reason about data structure performance" },
      { if_missing: "fixed-growth", gap: "Cannot compare growth strategies analytically" }
    ]
  }
},

{
  competencyId: "algorithms",
  subTopic: "space-time-tradeoff",
  questionType: "compare_contrast",
  difficulty: 5,
  questionText: `You have a stream of 10 million integers arriving one at a time. You need to answer "have I seen this integer before?" for each one. Compare these approaches:

1. Sorted array with binary search (insert in sorted position, binary search to check)
2. Hash table (open addressing, load factor 0.7)
3. Bloom filter (probabilistic, false positives allowed)
4. Bit array (if integers are in a known range, say 0 to 100,000,000)

For each, state: lookup time complexity, insertion time complexity, memory usage for 10M elements, and whether it gives false positives or false negatives.

Then: for a malware scanner checking file hashes against a blocklist of 1M known-bad hashes, which would you choose and why?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "sorted-array", description: "Sorted array: O(log n) lookup, O(n) insertion (shifting), ~40MB for 10M ints, exact", points: 1, keywords: ["O(log n) lookup", "O(n) insert", "shift", "binary search", "40MB"], check: "Student correctly characterises sorted array performance and notes the expensive insertion." },
      { id: "hash-table", description: "Hash table: O(1) amortized lookup/insert, ~60-80MB (overhead for table + load factor), exact", points: 2, keywords: ["O(1)", "amortized", "hash table", "load factor", "overhead"], check: "Student correctly characterises hash table with amortized O(1) and notes memory overhead." },
      { id: "bloom-filter", description: "Bloom filter: O(k) lookup/insert, ~1-2MB for 10M with 1% FP rate, false positives possible, no false negatives", points: 3, keywords: ["bloom", "O(k)", "false positive", "no false negative", "compact", "1%", "probabilistic"], check: "Student correctly describes bloom filter tradeoffs: compact, fast, but allows false positives." },
      { id: "bit-array", description: "Bit array: O(1) lookup/insert, ~12.5MB (100M bits), exact, only works with bounded integer range", points: 2, keywords: ["bit array", "O(1)", "12.5MB", "100M bits", "bounded range", "bitmap"], check: "Student correctly analyses the bit array approach including its range constraint." },
      { id: "malware-choice", description: "For malware scanner: bloom filter as first pass (fast rejection of clean files) then hash table for confirmation — argues the tradeoff", points: 2, keywords: ["bloom filter", "first pass", "prefilter", "then hash", "false positive acceptable", "fast reject"], check: "Student recommends a practical approach for the malware scanner scenario with clear reasoning." }
    ],
    gaps: [
      { if_missing: "bloom-filter", gap: "Does not know bloom filters — important probabilistic data structure for security tools" },
      { if_missing: "malware-choice", gap: "Cannot apply data structure knowledge to practical system design decisions" }
    ]
  }
},

{
  competencyId: "algorithms",
  subTopic: "divide-and-conquer",
  questionType: "design_solution",
  difficulty: 5,
  questionText: `You have an unsorted array of n integers. Design an algorithm to find both the minimum and maximum values using fewer than 2n comparisons.

1. Explain the naive approach and why it uses 2(n-1) comparisons
2. Design a divide-and-conquer approach that uses approximately 3n/2 comparisons
3. Prove (or argue clearly) that 3n/2 - 2 comparisons is optimal for this problem
4. Implement your solution in C

Hint: consider processing elements in pairs.

Then: why does this optimization matter in practice for comparison-heavy types (e.g., comparing long strings)?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "naive", description: "Explains naive approach: track min and max independently, each element compared against both, 2(n-1) comparisons", points: 1, keywords: ["2(n-1)", "2n", "compare each against min and max", "independent tracking"], check: "Student describes the naive approach and its comparison count." },
      { id: "pair-strategy", description: "Describes the pair-based strategy: compare elements in pairs first, then compare smaller against min and larger against max", points: 3, keywords: ["pairs", "compare pair", "smaller against min", "larger against max", "3 comparisons per pair"], check: "Student describes the 3-comparison-per-pair strategy." },
      { id: "count-proof", description: "Shows the count is 3*floor(n/2) which is approximately 3n/2 - 2", points: 2, keywords: ["3n/2", "3 per pair", "floor", "n/2 pairs", "optimal", "lower bound"], check: "Student derives the comparison count and argues it's optimal." },
      { id: "implementation", description: "Provides working C code implementing the pair-based approach", points: 2, keywords: ["for", "pair", "if", "min", "max", "i += 2", "implementation"], check: "Student provides working C code." },
      { id: "practical-relevance", description: "Explains that for expensive comparisons (strings, complex objects), halving comparison count is significant", points: 2, keywords: ["expensive", "string comparison", "O(k)", "comparison cost", "not free", "practical"], check: "Student explains why reducing comparisons matters for expensive comparison operations." }
    ],
    gaps: [
      { if_missing: "pair-strategy", gap: "Cannot optimize algorithms by reducing comparison count — important for competitive programming and resource-constrained systems" },
      { if_missing: "count-proof", gap: "Cannot reason about lower bounds and optimality of algorithms" }
    ]
  }
},

// --- cpp-oop (C++ & OOP) ---

{
  competencyId: "cpp-oop",
  subTopic: "constructor-destructor",
  questionType: "predict_output",
  difficulty: 1,
  questionText: `What does this program print? Explain the order and why.

\`\`\`cpp
#include <iostream>
using std::cout;

class Widget {
public:
    Widget(const char *name) : name_(name) {
        cout << "construct " << name_ << "\\n";
    }
    ~Widget() {
        cout << "destroy " << name_ << "\\n";
    }
private:
    const char *name_;
};

int main() {
    Widget a("A");
    Widget b("B");
    {
        Widget c("C");
        Widget d("D");
    }
    Widget e("E");
    return 0;
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "construction-order", description: "Correctly lists construction order: A, B, C, D", points: 2, keywords: ["A", "B", "C", "D", "order of declaration"], check: "Student lists the construction order matching declaration order." },
      { id: "inner-scope", description: "C and D are destroyed when inner scope ends, in reverse order: D then C", points: 2, keywords: ["D before C", "reverse order", "scope end", "inner block", "LIFO"], check: "Student explains C and D are destroyed in reverse order when the inner scope closes." },
      { id: "e-timing", description: "E is constructed after C and D are destroyed", points: 1, keywords: ["E after", "after scope", "construct E"], check: "Student shows E is constructed after the inner block's destructors run." },
      { id: "final-destruction", description: "At main's end: E, B, A destroyed in reverse construction order", points: 2, keywords: ["E, B, A", "reverse order", "main ends", "stack unwinding"], check: "Student shows the final destruction order is reverse of construction: E, B, A." },
      { id: "lifo", description: "Explains that destructors follow LIFO (stack) order within each scope", points: 1, keywords: ["LIFO", "stack", "reverse", "automatic storage"], check: "Student explains the general LIFO destruction rule." }
    ],
    gaps: [
      { if_missing: "inner-scope", gap: "Does not understand scope-based destruction — fundamental to RAII" },
      { if_missing: "final-destruction", gap: "Cannot predict destruction order — will mismanage resource lifetimes" }
    ]
  }
},

{
  competencyId: "cpp-oop",
  subTopic: "virtual-dispatch",
  questionType: "predict_output",
  difficulty: 2,
  questionText: `What does this program print? Explain why each line of output is what it is.

\`\`\`cpp
#include <iostream>
using std::cout;

class Base {
public:
    void foo()         { cout << "Base::foo\\n"; }
    virtual void bar() { cout << "Base::bar\\n"; }
    virtual ~Base() = default;
};

class Derived : public Base {
public:
    void foo()         { cout << "Derived::foo\\n"; }
    void bar() override { cout << "Derived::bar\\n"; }
};

int main() {
    Derived d;
    Base *p = &d;
    Base &r = d;

    d.foo();   // (1)
    p->foo();  // (2)
    p->bar();  // (3)
    r.foo();   // (4)
    r.bar();   // (5)
    return 0;
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "non-virtual-call", description: "Lines (1) calls Derived::foo, (2) and (4) call Base::foo — because foo is not virtual, static dispatch uses the declared type", points: 3, keywords: ["Derived::foo", "Base::foo", "not virtual", "static dispatch", "declared type", "compile-time"], check: "Student correctly identifies that non-virtual foo uses static dispatch based on the declared type of the variable/pointer." },
      { id: "virtual-call", description: "Lines (3) and (5) both call Derived::bar — because bar is virtual, dynamic dispatch uses the actual object type", points: 3, keywords: ["Derived::bar", "virtual", "dynamic dispatch", "actual type", "vtable", "runtime"], check: "Student correctly identifies that virtual bar uses dynamic dispatch to call the derived version." },
      { id: "mechanism", description: "Explains the mechanism: virtual functions use a vtable/vptr for runtime dispatch", points: 2, keywords: ["vtable", "vptr", "virtual table", "pointer to function", "indirection", "runtime lookup"], check: "Student explains the vtable mechanism that enables polymorphic dispatch." }
    ],
    gaps: [
      { if_missing: "non-virtual-call", gap: "Does not understand static vs dynamic dispatch — will create bugs with non-virtual method hiding" },
      { if_missing: "mechanism", gap: "Does not understand how virtual dispatch is implemented — needed for understanding C++ object model" }
    ]
  }
},

{
  competencyId: "cpp-oop",
  subTopic: "copy-semantics",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `This class manages a dynamically allocated array. Identify the problem that will occur when copies are made, and explain the consequences.

\`\`\`cpp
class DynArray {
public:
    DynArray(int n) : size_(n), data_(new int[n]) {
        for (int i = 0; i < n; i++)
            data_[i] = 0;
    }

    ~DynArray() {
        delete[] data_;
    }

    int& operator[](int i) { return data_[i]; }

private:
    int size_;
    int *data_;
};

void test() {
    DynArray a(5);
    a[0] = 42;
    DynArray b = a;  // copy
    b[0] = 99;
    // what is a[0] now?
}  // what happens here?
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "shallow-copy", description: "Identifies that the compiler-generated copy constructor does a shallow copy — both a and b point to the same array", points: 3, keywords: ["shallow copy", "same pointer", "both point", "compiler-generated", "default copy"], check: "Student explains that the default copy constructor copies the pointer, not the array data." },
      { id: "a0-value", description: "States that a[0] is 99 because a and b share the same data", points: 1, keywords: ["99", "shared", "same array", "aliased"], check: "Student states a[0] is 99 because both objects point to the same data." },
      { id: "double-delete", description: "Identifies double-delete: both destructors will delete[] the same pointer", points: 2, keywords: ["double delete", "double free", "undefined behavior", "both destructors", "delete same"], check: "Student identifies the double-delete when both a and b go out of scope." },
      { id: "rule-of-three", description: "States the fix: implement copy constructor and copy assignment operator (Rule of Three/Five)", points: 2, keywords: ["Rule of Three", "Rule of Five", "copy constructor", "copy assignment", "deep copy", "operator="], check: "Student mentions the Rule of Three/Five and the need for custom copy operations." }
    ],
    gaps: [
      { if_missing: "shallow-copy", gap: "Does not understand default copy semantics for classes with raw pointers" },
      { if_missing: "rule-of-three", gap: "Does not know the Rule of Three — will write classes with resource management bugs" }
    ]
  }
},

{
  competencyId: "cpp-oop",
  subTopic: "raii-pattern",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `This function acquires a mutex, does some work, and releases it. Identify the problem and explain how RAII solves it.

\`\`\`cpp
#include <mutex>
#include <stdexcept>

std::mutex mtx;

void process_data(int *data, int n)
{
    mtx.lock();

    if (n <= 0)
        return;  // early return

    for (int i = 0; i < n; i++)
    {
        if (data[i] < 0)
            throw std::runtime_error("negative value");
        data[i] *= 2;
    }

    mtx.unlock();
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "early-return", description: "Identifies that the early return when n<=0 leaves the mutex locked", points: 2, keywords: ["early return", "mutex locked", "not unlocked", "n <= 0", "deadlock"], check: "Student identifies the early return path that skips unlock." },
      { id: "exception", description: "Identifies that the exception path also leaves the mutex locked", points: 2, keywords: ["exception", "throw", "mutex locked", "unwinding", "not unlocked"], check: "Student identifies the exception path that skips unlock." },
      { id: "raii-fix", description: "Proposes using std::lock_guard or std::unique_lock — the destructor releases the mutex on any exit path", points: 3, keywords: ["lock_guard", "unique_lock", "RAII", "destructor", "automatic", "scope exit", "stack unwinding"], check: "Student proposes using an RAII lock guard and explains that its destructor guarantees unlock." },
      { id: "raii-principle", description: "Explains RAII: acquire resource in constructor, release in destructor, scope-bound lifetime ensures cleanup on all exit paths", points: 1, keywords: ["resource acquisition", "initialization", "constructor", "destructor", "all paths"], check: "Student explains the RAII principle beyond just this specific example." }
    ],
    gaps: [
      { if_missing: "exception", gap: "Does not consider exception safety in resource management" },
      { if_missing: "raii-fix", gap: "Does not know RAII wrappers for mutex management — will write code with deadlock-prone error paths" }
    ]
  }
},

{
  competencyId: "cpp-oop",
  subTopic: "move-semantics",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Trace through this code and explain what happens at each numbered line. Which operations involve copies and which involve moves? What would happen without the move constructor?

\`\`\`cpp
#include <iostream>
#include <utility>
#include <cstring>

class Buffer {
public:
    Buffer(size_t n) : size_(n), data_(new char[n]) {             // (1)
        std::cout << "construct " << size_ << "\\n";
    }
    Buffer(const Buffer& other) : size_(other.size_),             // (2)
                                   data_(new char[other.size_]) {
        std::memcpy(data_, other.data_, size_);
        std::cout << "copy " << size_ << "\\n";
    }
    Buffer(Buffer&& other) noexcept : size_(other.size_),         // (3)
                                       data_(other.data_) {
        other.size_ = 0;
        other.data_ = nullptr;
        std::cout << "move " << size_ << "\\n";
    }
    ~Buffer() {                                                    // (4)
        std::cout << "destroy " << size_ << "\\n";
        delete[] data_;
    }

private:
    size_t size_;
    char *data_;
};

Buffer create_buffer() {
    Buffer tmp(1024);
    return tmp;                                                    // (5)
}

int main() {
    Buffer a(512);                                                 // (6)
    Buffer b = a;                                                  // (7)
    Buffer c = std::move(a);                                       // (8)
    Buffer d = create_buffer();                                    // (9)
    return 0;
}
\`\`\``,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "line-6-7", description: "Line 6 constructs a(512). Line 7 copy-constructs b from a — allocates new memory and copies data", points: 2, keywords: ["construct 512", "copy 512", "deep copy", "new allocation", "memcpy"], check: "Student identifies line 6 as construction and line 7 as a copy with new allocation." },
      { id: "line-8", description: "Line 8 move-constructs c from a — steals a's pointer, leaves a in a valid but empty state", points: 3, keywords: ["move 512", "steals", "pointer transfer", "nullptr", "moved-from", "no allocation"], check: "Student explains the move takes a's pointer without allocating or copying, leaving a empty." },
      { id: "line-9", description: "Line 9: either NRVO elides the move entirely, or move constructor is used for the return value", points: 2, keywords: ["NRVO", "RVO", "elision", "move", "return value optimization", "copy elision"], check: "Student explains that the return may be elided (NRVO) or moved." },
      { id: "without-move", description: "Without move constructor, line 8 would copy (expensive), and returns would require copies or rely on NRVO alone", points: 2, keywords: ["copy instead", "expensive", "allocation", "O(n)", "copy constructor fallback"], check: "Student explains that without move semantics, all transfers would be expensive copies." },
      { id: "destroy-moved", description: "Notes that a's destructor runs on the moved-from state (size=0, data=nullptr) — delete[] nullptr is safe", points: 1, keywords: ["nullptr", "delete nullptr", "safe", "moved-from", "destroy 0"], check: "Student explains that the moved-from object is still destroyed and this is safe because data is nullptr." }
    ],
    gaps: [
      { if_missing: "line-8", gap: "Does not understand move semantics — pointer theft vs deep copy" },
      { if_missing: "line-9", gap: "Does not understand return value optimization (NRVO) — important for understanding when moves/copies happen" },
      { if_missing: "without-move", gap: "Cannot evaluate the performance impact of move semantics" }
    ]
  }
},

{
  competencyId: "cpp-oop",
  subTopic: "smart-pointers",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Trace through this code and explain the ownership semantics at each step. When is the Widget destroyed? What would happen if you tried to copy a unique_ptr instead of moving it?

\`\`\`cpp
#include <memory>
#include <iostream>

class Widget {
public:
    Widget(int id) : id_(id) { std::cout << "Widget " << id_ << " born\\n"; }
    ~Widget() { std::cout << "Widget " << id_ << " dies\\n"; }
    int id() const { return id_; }
private:
    int id_;
};

void use_widget(std::unique_ptr<Widget> w) {                      // (1)
    std::cout << "Using widget " << w->id() << "\\n";
}                                                                  // (2)

int main() {
    auto a = std::make_unique<Widget>(1);                         // (3)
    auto b = std::make_unique<Widget>(2);                         // (4)

    std::unique_ptr<Widget> c = std::move(a);                     // (5)
    // a is now nullptr

    use_widget(std::move(b));                                      // (6)
    // b is now nullptr

    std::cout << "a valid? " << (a != nullptr) << "\\n";           // (7)
    std::cout << "b valid? " << (b != nullptr) << "\\n";           // (8)

    return 0;
}                                                                  // (9)
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "ownership-transfer", description: "Explains that std::move transfers ownership: after (5) c owns Widget 1, a is nullptr", points: 2, keywords: ["ownership transfer", "move", "c owns", "a nullptr", "exclusive ownership"], check: "Student explains unique_ptr ownership transfer through move." },
      { id: "widget2-death", description: "Widget 2 is destroyed at line (2) when the unique_ptr parameter goes out of scope in use_widget", points: 2, keywords: ["Widget 2 dies", "parameter scope", "function end", "line 2", "use_widget returns"], check: "Student identifies that Widget 2 is destroyed when use_widget returns." },
      { id: "widget1-death", description: "Widget 1 is destroyed at line (9) when c goes out of scope at main's end", points: 2, keywords: ["Widget 1 dies", "main end", "c destroyed", "line 9"], check: "Student identifies that Widget 1 is destroyed when c goes out of scope." },
      { id: "no-copy", description: "Explains that unique_ptr cannot be copied (deleted copy constructor) — this enforces single ownership", points: 2, keywords: ["cannot copy", "deleted", "copy constructor deleted", "single ownership", "compile error"], check: "Student explains that unique_ptr's copy constructor is deleted to enforce exclusive ownership." }
    ],
    gaps: [
      { if_missing: "ownership-transfer", gap: "Does not understand unique_ptr ownership semantics — will mismanage heap resources" },
      { if_missing: "no-copy", gap: "Does not understand why unique_ptr is non-copyable — missing core smart pointer reasoning" }
    ]
  }
},

{
  competencyId: "cpp-oop",
  subTopic: "template-basics",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This template function is supposed to return the maximum of two values, but it has compilation issues when used with certain types. Fix all the problems.

\`\`\`cpp
template <typename T>
T max_val(T a, T b)
{
    if (a > b)
        return a;
    else
        return b;
}

int main()
{
    int x = max_val(3, 5);           // (1) OK
    double y = max_val(3.14, 2.71);  // (2) OK
    double z = max_val(3, 2.5);      // (3) error!
    const char *s = max_val("hello", "world");  // (4) suspicious
    return 0;
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "type-deduction", description: "Identifies line 3 fails: T deduced as int from 3 and double from 2.5 — conflicting deductions", points: 2, keywords: ["conflicting", "deduction", "int vs double", "ambiguous", "cannot deduce T"], check: "Student explains that the compiler cannot deduce T when arguments have different types." },
      { id: "fix-line3", description: "Proposes fix: explicit template argument max_val<double>(3, 2.5), or two template params, or static_cast", points: 2, keywords: ["max_val<double>", "two template parameters", "static_cast", "explicit"], check: "Student provides a fix for the type deduction conflict." },
      { id: "line4-issue", description: "Explains line 4 compares pointer addresses, not string contents — operator> on const char* compares pointers", points: 3, keywords: ["pointer comparison", "address", "not string content", "const char*", "undefined", "strcmp"], check: "Student explains that comparing C-strings with > compares pointer values, not lexicographic order." },
      { id: "line4-fix", description: "Proposes using std::string or a template specialization for const char*", points: 1, keywords: ["std::string", "specialization", "strcmp", "template specialization"], check: "Student proposes a fix for string comparison." }
    ],
    gaps: [
      { if_missing: "type-deduction", gap: "Does not understand template type deduction rules" },
      { if_missing: "line4-issue", gap: "Does not recognise that operator comparisons on pointers compare addresses, not contents" }
    ]
  }
},

{
  competencyId: "cpp-oop",
  subTopic: "stl-containers",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This code tries to remove all even numbers from a vector while iterating. It crashes or skips elements. Fix it and explain why the original approach is wrong.

\`\`\`cpp
#include <vector>
#include <iostream>

void remove_evens(std::vector<int>& v)
{
    for (auto it = v.begin(); it != v.end(); ++it)
    {
        if (*it % 2 == 0)
            v.erase(it);
    }
}

int main()
{
    std::vector<int> nums = {1, 2, 3, 4, 5, 6, 7, 8};
    remove_evens(nums);
    for (int n : nums)
        std::cout << n << " ";
    std::cout << "\\n";
    return 0;
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "invalidation", description: "Identifies that erase() invalidates the iterator, making ++it undefined behavior", points: 3, keywords: ["invalidate", "erase invalidates", "iterator invalidation", "undefined behavior", "dangling iterator"], check: "Student explains that erasing an element invalidates iterators at and after the erased position." },
      { id: "skip", description: "Explains the skipping behavior: after erase, the next element shifts into the current position, and ++it skips it", points: 2, keywords: ["skip", "shift", "next element", "moves into position", "misses"], check: "Student explains why elements get skipped even if it doesn't crash." },
      { id: "fix", description: "Provides correct fix using erase's return value: it = v.erase(it) in the if branch, else ++it", points: 2, keywords: ["it = v.erase(it)", "erase returns", "else ++it", "return value"], check: "Student uses erase's return value to get a valid iterator." },
      { id: "alternative", description: "Mentions the erase-remove idiom or std::erase_if (C++20) as a better alternative", points: 1, keywords: ["erase-remove", "remove_if", "std::erase_if", "idiom"], check: "Student mentions the erase-remove idiom or C++20 std::erase_if." }
    ],
    gaps: [
      { if_missing: "invalidation", gap: "Does not understand iterator invalidation — will write buggy container-modifying loops" },
      { if_missing: "fix", gap: "Cannot correctly use erase() return value for safe iteration" }
    ]
  }
},

{
  competencyId: "cpp-oop",
  subTopic: "operator-overloading",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `This Matrix class has an overloaded operator+ but it doesn't work correctly with chained operations. Fix the implementation and explain what's wrong.

\`\`\`cpp
class Matrix {
public:
    Matrix(int r, int c) : rows(r), cols(c), data(new int[r * c]()) {}
    ~Matrix() { delete[] data; }

    int& at(int r, int c) { return data[r * cols + c]; }
    const int& at(int r, int c) const { return data[r * cols + c]; }

    Matrix& operator+(const Matrix& rhs) {
        for (int i = 0; i < rows * cols; i++)
            data[i] += rhs.data[i];
        return *this;
    }

private:
    int rows, cols;
    int *data;
};

void test() {
    Matrix a(2, 2), b(2, 2), c(2, 2);
    Matrix d = a + b + c;  // problem here
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "mutates-lhs", description: "Identifies that operator+ modifies *this instead of returning a new matrix — a+b mutates a", points: 2, keywords: ["modifies this", "mutates", "a is changed", "side effect", "should return new"], check: "Student identifies that operator+ should not modify the left-hand operand." },
      { id: "return-by-value", description: "Explains operator+ should return a new Matrix by value, not a reference to *this", points: 2, keywords: ["return by value", "new Matrix", "not reference", "temporary"], check: "Student explains operator+ should return a new object." },
      { id: "fix", description: "Provides correct operator+ that creates a new Matrix, copies data, adds, and returns it", points: 2, keywords: ["Matrix result", "new object", "result.data[i]", "return result"], check: "Student provides a correct operator+ implementation." },
      { id: "rule-of-three", description: "Notes the class also needs a copy constructor and assignment operator (Rule of Three) for the return by value to work", points: 2, keywords: ["copy constructor", "Rule of Three", "assignment operator", "deep copy"], check: "Student notes the class needs copy/assignment support for correctness." }
    ],
    gaps: [
      { if_missing: "mutates-lhs", gap: "Does not understand the semantic contract of operator+ (non-mutating)" },
      { if_missing: "rule-of-three", gap: "Misses Rule of Three requirements when implementing operators that return by value" }
    ]
  }
},

{
  competencyId: "cpp-oop",
  subTopic: "inheritance-slicing",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Explain what goes wrong in this code. What is "object slicing" and why does it happen? What is printed and why?

\`\`\`cpp
#include <iostream>
#include <vector>

class Animal {
public:
    virtual void speak() const { std::cout << "...\\n"; }
    virtual ~Animal() = default;
};

class Dog : public Animal {
public:
    void speak() const override { std::cout << "Woof!\\n"; }
};

class Cat : public Animal {
public:
    void speak() const override { std::cout << "Meow!\\n"; }
};

int main() {
    std::vector<Animal> zoo;
    zoo.push_back(Dog());
    zoo.push_back(Cat());

    for (const auto& a : zoo)
        a.speak();

    return 0;
}
\`\`\``,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "slicing", description: "Identifies object slicing: Dog and Cat are copied into Animal-sized slots, losing derived data and vtable pointer", points: 3, keywords: ["object slicing", "sliced", "copied as Animal", "derived part lost", "truncated"], check: "Student identifies object slicing and explains that storing by value copies only the base part." },
      { id: "output", description: "States the output is '...' twice — the base class speak is called", points: 2, keywords: ["...", "twice", "base class", "Animal::speak"], check: "Student correctly predicts both calls print '...'." },
      { id: "fix", description: "Proposes fix: store pointers (unique_ptr<Animal>) in the vector to preserve polymorphism", points: 2, keywords: ["unique_ptr", "pointer", "vector<unique_ptr<Animal>>", "polymorphism", "reference semantics"], check: "Student proposes using smart pointers in the vector." },
      { id: "why-value-fails", description: "Explains that polymorphism requires indirection (pointer/reference) because the vtable lookup needs the actual object type", points: 1, keywords: ["indirection", "vtable", "actual type", "reference", "pointer required"], check: "Student explains why value semantics prevents polymorphism." }
    ],
    gaps: [
      { if_missing: "slicing", gap: "Does not understand object slicing — a common C++ trap with value semantics" },
      { if_missing: "fix", gap: "Cannot design polymorphic containers using smart pointers" }
    ]
  }
},

{
  competencyId: "cpp-oop",
  subTopic: "exception-safety",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `Design a Stack<T> class that provides the strong exception guarantee. Requirements:

1. It must manage its own dynamic array (no std::vector)
2. Implement push(), pop(), and top()
3. push() must not leak memory or corrupt state if T's copy constructor throws
4. The class must follow the Rule of Five

Explain the three exception safety guarantees (basic, strong, nothrow) and identify which guarantee each of your methods provides. Show the complete implementation.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "strong-push", description: "push() provides the strong guarantee: if copy/move throws, the stack is unchanged and no memory leaks", points: 3, keywords: ["strong guarantee", "unchanged", "rollback", "no leak", "copy then swap", "temporary"], check: "Student implements push with strong exception safety — state is unchanged on failure." },
      { id: "rule-of-five", description: "Implements all five special members: destructor, copy ctor, copy assignment, move ctor, move assignment", points: 2, keywords: ["Rule of Five", "copy constructor", "copy assignment", "move constructor", "move assignment", "destructor"], check: "Student implements all five special members." },
      { id: "three-guarantees", description: "Correctly explains basic (no leaks, valid state), strong (operation rolled back), nothrow (never throws)", points: 2, keywords: ["basic", "strong", "nothrow", "no leak", "rollback", "never throws", "valid state"], check: "Student correctly defines all three exception safety guarantees." },
      { id: "pop-design", description: "Notes that pop() should not return the value (returns void) because the copy on return could throw after element removal", points: 2, keywords: ["pop returns void", "top then pop", "separate", "copy on return", "Sutter", "Herb"], check: "Student separates pop (void, nothrow) from top (returns reference) for exception safety." },
      { id: "swap-idiom", description: "Uses copy-and-swap for exception-safe assignment", points: 1, keywords: ["copy-and-swap", "swap", "strong assignment", "temporary copy"], check: "Student uses the copy-and-swap idiom for assignment." }
    ],
    gaps: [
      { if_missing: "strong-push", gap: "Cannot implement exception-safe data structures — will write code that corrupts state on exceptions" },
      { if_missing: "three-guarantees", gap: "Does not know the exception safety guarantees — foundational C++ concept" }
    ]
  }
},

{
  competencyId: "cpp-oop",
  subTopic: "const-reference-lifetime",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText: `Compare these four ways to pass a parameter to a function. For each, explain: when to use it, what copies occur, and what happens to the original.

\`\`\`cpp
void f1(Widget w);              // by value
void f2(Widget& w);             // by lvalue reference
void f3(const Widget& w);       // by const reference
void f4(Widget&& w);            // by rvalue reference
\`\`\`

Then answer: what should a function use if it needs to take ownership of the Widget? What if it just needs to read it? What if it needs to modify the caller's copy?

Give a concrete example where choosing the wrong passing convention causes either unnecessary copies or dangling references.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "by-value", description: "By value: copies the argument, function gets its own independent copy, safe but potentially expensive", points: 2, keywords: ["copy", "independent", "own copy", "expensive", "safe"], check: "Student explains by-value creates a copy and when it's appropriate." },
      { id: "by-ref", description: "By reference: no copy, function can modify the original, cannot bind to temporaries", points: 2, keywords: ["no copy", "modifies original", "alias", "no temporary", "lvalue only"], check: "Student explains by-reference semantics including the lvalue restriction." },
      { id: "by-const-ref", description: "By const reference: no copy, read-only access, can bind to temporaries (lifetime extension)", points: 2, keywords: ["no copy", "read-only", "const", "temporary", "lifetime extension"], check: "Student explains const reference semantics including temporary binding." },
      { id: "by-rvalue-ref", description: "By rvalue reference: signals intent to move from the argument, takes ownership efficiently", points: 2, keywords: ["move", "rvalue", "ownership", "steal resources", "temporary", "std::move"], check: "Student explains rvalue reference for move semantics and ownership transfer." },
      { id: "practical-guidance", description: "Gives correct guidance: const& to read, & to modify, by value to own (sink), && for move-only or overload sets", points: 2, keywords: ["read: const&", "modify: &", "own: by value", "sink parameter", "move-only"], check: "Student gives practical guidance matching each use case to the right passing convention." }
    ],
    gaps: [
      { if_missing: "by-rvalue-ref", gap: "Does not understand rvalue references — cannot use move semantics effectively" },
      { if_missing: "practical-guidance", gap: "Cannot choose the right parameter passing convention for a given situation" }
    ]
  }
},

{
  competencyId: "cpp-oop",
  subTopic: "iterator-invalidation",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText: `Compare std::vector, std::deque, std::list, and std::unordered_map in terms of iterator invalidation rules.

For each container, state what operations invalidate iterators (insert, erase, push_back, reallocation) and which iterators survive.

Then: given this scenario — you are iterating over a container and need to conditionally remove some elements and insert new ones — which container would you choose and why? Show code for your solution.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "vector-rules", description: "Vector: insert/push_back may invalidate ALL iterators (reallocation); erase invalidates at and after the erased position", points: 2, keywords: ["reallocation", "all invalidated", "erase: after", "capacity", "push_back may"], check: "Student correctly describes vector's invalidation rules." },
      { id: "list-rules", description: "List: insert never invalidates; erase only invalidates the erased element's iterator", points: 2, keywords: ["list", "never invalidates", "only erased", "stable", "insert safe"], check: "Student correctly describes list's invalidation rules." },
      { id: "map-rules", description: "Unordered_map: insert may invalidate all iterators (rehash); erase only invalidates the erased element", points: 2, keywords: ["rehash", "insert may invalidate", "erase only erased", "load factor"], check: "Student correctly describes unordered_map's invalidation rules." },
      { id: "recommendation", description: "Recommends std::list for concurrent insert/erase during iteration, with reasoning about iterator stability", points: 2, keywords: ["list", "stable", "insert during iteration", "erase safe", "iterator stable"], check: "Student recommends std::list and explains why its iterator stability makes it suitable." },
      { id: "code", description: "Provides correct code that iterates, conditionally erases, and inserts without invalidation issues", points: 2, keywords: ["it = erase", "insert", "while loop", "correct iteration"], check: "Student provides working code that handles insert/erase during iteration." }
    ],
    gaps: [
      { if_missing: "vector-rules", gap: "Does not know vector iterator invalidation rules — will write UB-prone container code" },
      { if_missing: "recommendation", gap: "Cannot select containers based on iterator invalidation requirements" }
    ]
  }
},

{
  competencyId: "cpp-oop",
  subTopic: "diamond-inheritance",
  questionType: "design_solution",
  difficulty: 5,
  questionText: `Explain the "diamond problem" in C++ multiple inheritance. Given this class hierarchy:

\`\`\`cpp
class Device {
public:
    virtual void initialize() = 0;
    int device_id;
};

class NetworkDevice : public Device { /* ... */ };
class StorageDevice : public Device { /* ... */ };
class NAS : public NetworkDevice, public StorageDevice { /* ... */ };
\`\`\`

1. What goes wrong without virtual inheritance? Show the memory layout problem.
2. Fix it with virtual inheritance and explain the mechanism.
3. How does virtual inheritance affect construction order? Who calls Device's constructor?
4. What is the runtime cost of virtual inheritance (vtable, pointer indirection)?
5. Argue whether this design should use inheritance at all, or whether composition would be better. Redesign it using composition and explain the tradeoffs.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "diamond-problem", description: "Explains the ambiguity: NAS has two copies of Device (one from each parent), device_id is ambiguous", points: 2, keywords: ["two copies", "ambiguous", "duplicate", "which device_id", "two base subobjects"], check: "Student explains that without virtual inheritance, NAS contains two Device subobjects." },
      { id: "virtual-fix", description: "Applies virtual inheritance and explains it ensures only one shared Device subobject", points: 2, keywords: ["virtual public Device", "single copy", "shared base", "virtual inheritance"], check: "Student applies virtual inheritance and explains it creates a single shared base." },
      { id: "construction", description: "Explains that the most-derived class (NAS) must call Device's constructor directly", points: 2, keywords: ["most-derived", "NAS calls Device", "constructor", "virtual base", "initialization list"], check: "Student explains the virtual base construction rule." },
      { id: "cost", description: "Discusses runtime costs: extra vtable pointer per virtual base, pointer indirection to access base members", points: 2, keywords: ["vtable pointer", "indirection", "extra pointer", "vptr", "offset", "runtime cost"], check: "Student describes the performance overhead of virtual inheritance." },
      { id: "composition-alternative", description: "Redesigns using composition (NAS has-a NetworkInterface and StorageInterface) and argues it's simpler/more flexible", points: 2, keywords: ["composition", "has-a", "interface", "simpler", "flexible", "favor composition"], check: "Student provides a composition-based alternative and argues its merits." }
    ],
    gaps: [
      { if_missing: "diamond-problem", gap: "Does not understand the diamond problem — will create ambiguous class hierarchies" },
      { if_missing: "composition-alternative", gap: "Cannot evaluate inheritance vs composition tradeoffs — defaults to inheritance when composition is better" }
    ]
  }
},

{
  competencyId: "cpp-oop",
  subTopic: "type-erasure",
  questionType: "design_solution",
  difficulty: 5,
  questionText: `Design a simple type-erased function wrapper (like a minimal std::function<int(int)>) that can store and call any callable taking an int and returning an int — including free functions, lambdas (capturing and non-capturing), and function objects.

Requirements:
1. Uses an internal abstract base class with a virtual call operator
2. Templated derived class wraps the actual callable
3. Supports copy construction and assignment
4. The user-facing class is not a template (type erasure)

Write the complete implementation and explain:
- Why is this called "type erasure"?
- How does std::function use a similar pattern?
- What is the performance cost compared to a direct function call or function pointer?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "base-class", description: "Defines an abstract base (Concept) with virtual operator(), clone, and destructor", points: 2, keywords: ["virtual", "abstract", "base class", "Concept", "pure virtual", "clone", "operator()"], check: "Student defines an abstract base class with the necessary virtual interface." },
      { id: "template-derived", description: "Defines a templated derived class (Model<F>) that holds the callable and implements the virtuals", points: 3, keywords: ["template", "Model", "derived", "F callable", "stores", "implements"], check: "Student creates a templated derived class parameterized on the callable type." },
      { id: "wrapper-class", description: "The user-facing class holds a pointer to the base, forwards calls, manages lifetime", points: 2, keywords: ["unique_ptr", "base pointer", "forward", "operator()", "non-template"], check: "Student creates a non-template wrapper that owns a base pointer and forwards calls." },
      { id: "type-erasure-explanation", description: "Explains type erasure: the concrete type is 'erased' behind the virtual interface — callers don't need to know F", points: 2, keywords: ["erased", "hidden", "virtual interface", "callers don't know", "uniform type", "any callable"], check: "Student explains that the concrete callable type is hidden behind a uniform interface." },
      { id: "cost", description: "Discusses costs: heap allocation, virtual dispatch overhead, cannot inline through the type erasure", points: 1, keywords: ["heap", "virtual dispatch", "no inlining", "overhead", "indirection"], check: "Student describes the runtime costs of type erasure." }
    ],
    gaps: [
      { if_missing: "template-derived", gap: "Cannot implement the type erasure pattern — key advanced C++ technique" },
      { if_missing: "type-erasure-explanation", gap: "Does not understand type erasure conceptually — needed for designing flexible C++ libraries" }
    ]
  }
},
];
