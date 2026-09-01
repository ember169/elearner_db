import type { SeedExercise } from "./types";

/** algorithms L0–L5 — one comprehension MCQ per teaching section. */
export const ALGORITHMS_EXERCISES: SeedExercise[] = [
  // ── L0 ──
  {
    slug: "algorithms-l0-what",
    competencyId: "algorithms",
    depthTier: 0,
    sectionHeading: "What Is an Algorithm",
    prompt: "What is an algorithm?",
    options: [
      "A finite sequence of well-defined steps that transforms an input into a desired output.",
      "Any program written in a compiled language.",
      "A data structure for storing sorted values.",
      "A hardware component that speeds up computation.",
    ],
    correctIndex: 0,
    explanation:
      "Algorithms solve problems (sorting, searching, pathfinding). For security they underpin cryptography, brute-force feasibility, intrusion detection pattern-matching, and malware analysis.",
  },
  {
    slug: "algorithms-l0-bigo",
    competencyId: "algorithms",
    depthTier: 0,
    sectionHeading: "Big-O Notation",
    prompt: "What does O(2^n) complexity describe?",
    options: [
      "Exponential growth — for example, brute-forcing an n-bit key.",
      "Constant time regardless of input size.",
      "Logarithmic growth, like binary search.",
      "Linearithmic growth, like efficient sorting.",
    ],
    correctIndex: 0,
    explanation:
      "Big-O describes how cost grows with n: O(1) constant, O(log n) binary search, O(n) linear scan, O(n log n) good sorts, O(n²) naive nested loops, O(2^n) exponential. Exponential cost is what makes brute force infeasible.",
  },
  {
    slug: "algorithms-l0-security",
    competencyId: "algorithms",
    depthTier: 0,
    sectionHeading: "Why Complexity Matters in Security",
    prompt: "Why is MD5 considered broken for security purposes?",
    options: [
      "Collisions can be found in roughly O(2^18) work — far below the strength its bit-length implies.",
      "It produces outputs that are too long to store.",
      "It requires a secret key that is easy to guess.",
      "It is slower than SHA-256 on modern hardware.",
    ],
    correctIndex: 0,
    explanation:
      "A hash's real security is set by the best-known attack complexity, not its bit-length. MD5 collisions are cheap (~2^18), so it fails as a collision-resistant hash even though the digest is 128 bits.",
  },
  // ── L1 ──
  {
    slug: "algorithms-l1-search",
    competencyId: "algorithms",
    depthTier: 1,
    sectionHeading: "Linear and Binary Search",
    prompt: "Why compute `mid = lo + (hi - lo) / 2` instead of `(lo + hi) / 2` in binary search?",
    options: [
      "lo + hi can overflow INT_MAX; the safe form avoids the overflow.",
      "The safe form is faster on modern CPUs.",
      "(lo + hi) / 2 rounds toward the wrong element.",
      "It lets binary search work on unsorted arrays.",
    ],
    correctIndex: 0,
    explanation:
      "For large indices, lo + hi can exceed INT_MAX and overflow (undefined behaviour for signed ints). The subtraction form stays in range — a bug that lurked in production binary searches for years (Bloch, 2006). Binary search still requires sorted data and runs in O(log n).",
  },
  {
    slug: "algorithms-l1-bubble-selection",
    competencyId: "algorithms",
    depthTier: 1,
    sectionHeading: "Bubble Sort and Selection Sort",
    prompt: "With the early-exit (swapped-flag) optimization, what is bubble sort's best-case complexity?",
    options: [
      "O(n) — a single clean pass over already-sorted data.",
      "O(n²) always, regardless of input.",
      "O(log n).",
      "O(n log n).",
    ],
    correctIndex: 0,
    explanation:
      "If a full pass makes no swaps, bubble sort stops early, giving O(n) on sorted input. Both bubble and selection sort are O(n²) in the average/worst case and are learning tools, not production sorts.",
  },
  {
    slug: "algorithms-l1-insertion",
    competencyId: "algorithms",
    depthTier: 1,
    sectionHeading: "Insertion Sort",
    prompt: "When is insertion sort especially efficient?",
    options: [
      "On nearly-sorted data (O(n)) and tiny arrays — which is why hybrid sorts like Timsort use it for small runs.",
      "On large random arrays, where it beats merge sort.",
      "Only on data that is already fully sorted.",
      "When the data cannot fit in memory.",
    ],
    correctIndex: 0,
    explanation:
      "Insertion sort is O(n²) worst case but O(n) on nearly-sorted input and has very low overhead, making it the ideal base case for small runs inside hybrid sorts.",
  },
  {
    slug: "algorithms-l1-stability",
    competencyId: "algorithms",
    depthTier: 1,
    sectionHeading: "Comparing Sort Stability and Security Relevance",
    prompt: "What does a “stable” sort guarantee, and why can it matter in log analysis?",
    options: [
      "Equal elements keep their relative order, so sorting logs by severity preserves the timestamp order within each severity level.",
      "It never crashes on malformed input.",
      "It always runs in O(n log n).",
      "It uses no extra memory.",
    ],
    correctIndex: 0,
    explanation:
      "Stability preserves prior ordering among equal keys. Bubble and insertion sort are stable; selection sort is not. It matters whenever you sort by multiple keys in sequence.",
  },
  // ── L2 ──
  {
    slug: "algorithms-l2-merge",
    competencyId: "algorithms",
    depthTier: 2,
    sectionHeading: "Merge Sort",
    prompt: "What distinguishes merge sort from quicksort?",
    options: [
      "Merge sort guarantees O(n log n) in the worst case and is stable, at the cost of O(n) extra space.",
      "Merge sort is O(n²) worst case like quicksort.",
      "Merge sort sorts in place with no extra memory.",
      "Merge sort only works on linked lists.",
    ],
    correctIndex: 0,
    explanation:
      "Merge sort divides, recursively sorts, and merges — always O(n log n) and stable, but it needs O(n) auxiliary space. Quicksort is in-place and often faster in practice but has an O(n²) worst case.",
  },
  {
    slug: "algorithms-l2-quicksort",
    competencyId: "algorithms",
    depthTier: 2,
    sectionHeading: "Quicksort",
    prompt: "When does quicksort hit its O(n²) worst case, and why is that a security concern?",
    options: [
      "When the pivot is always the smallest or largest element; an attacker who controls the input can force it, causing a denial of service.",
      "When the array is already sorted, and it always crashes.",
      "When the array has duplicate values, which it cannot handle.",
      "Never — quicksort is always O(n log n).",
    ],
    correctIndex: 0,
    explanation:
      "Consistently bad pivots degrade quicksort to O(n²). Adversarial input can trigger it, so hardened code randomizes the pivot or uses median-of-three — the same reason hash tables randomize their hashing.",
  },
  {
    slug: "algorithms-l2-linkedlist",
    competencyId: "algorithms",
    depthTier: 2,
    sectionHeading: "Linked Lists",
    prompt: "What is the core trade-off of a linked list versus an array?",
    options: [
      "O(1) insertion/deletion given a node pointer, but O(n) indexed access and poor cache locality.",
      "O(1) random access by index, but O(n) insertion at the head.",
      "It uses less memory per element than an array.",
      "It guarantees sorted order automatically.",
    ],
    correctIndex: 0,
    explanation:
      "Linked lists excel at splicing nodes in O(1) when you already hold a pointer, but reaching the k-th element is O(n) and the scattered nodes defeat CPU caches. Arrays give O(1) indexing but O(n) middle insertion.",
  },
  {
    slug: "algorithms-l2-stackqueue",
    competencyId: "algorithms",
    depthTier: 2,
    sectionHeading: "Stacks and Queues",
    prompt: "A stack is LIFO and a queue is FIFO. Which does breadth-first search rely on?",
    options: [
      "A queue (FIFO) — BFS; depth-first search uses a stack (LIFO).",
      "A stack (LIFO) — BFS uses a stack and DFS uses a queue.",
      "Both use a queue.",
      "Neither — BFS uses a hash table.",
    ],
    correctIndex: 0,
    explanation:
      "BFS processes nodes in the order discovered (FIFO queue), giving level-by-level traversal; DFS dives along one branch using a stack (explicit or the call stack).",
  },
  {
    slug: "algorithms-l2-hashtable",
    competencyId: "algorithms",
    depthTier: 2,
    sectionHeading: "Hash Tables",
    prompt: "How do you defend a hash table against a hash-flooding denial-of-service attack?",
    options: [
      "Use a keyed hash (e.g. SipHash) seeded with a random key at startup, so an attacker cannot precompute colliding keys.",
      "Increase the table size to exactly the number of inputs.",
      "Sort the keys before inserting them.",
      "Store the keys in a linked list instead.",
    ],
    correctIndex: 0,
    explanation:
      "A hash table is O(1) average but O(n) per operation if everything collides. A predictable hash lets an attacker craft colliding keys (O(n²) total); a randomly-keyed hash like SipHash makes collisions unpredictable.",
  },
  {
    slug: "algorithms-l2-choose",
    competencyId: "algorithms",
    depthTier: 2,
    sectionHeading: "Choosing the Right Data Structure",
    prompt: "Which structure offers O(1) average-time search but keeps elements unordered?",
    options: [
      "A hash table.",
      "A balanced binary search tree.",
      "A sorted array.",
      "A singly linked list.",
    ],
    correctIndex: 0,
    explanation:
      "Hash tables give O(1) average search but no ordering; balanced BSTs give O(log n) and keep order; arrays give O(1) indexing but O(n) search; linked lists give O(1) head insertion but O(n) search.",
  },
  {
    slug: "algorithms-l2-floyd",
    competencyId: "algorithms",
    depthTier: 2,
    sectionHeading: "Floyd's cycle detection (tortoise and hare)",
    prompt: "How does Floyd's tortoise-and-hare algorithm detect a cycle in a linked list?",
    options: [
      "Two pointers advance at 1× and 2× speed; if they ever meet, a cycle exists — O(n) time, O(1) space.",
      "It stores every visited node in a hash set and checks for repeats.",
      "It sorts the list and looks for duplicates.",
      "It counts nodes and compares to the allocation size.",
    ],
    correctIndex: 0,
    explanation:
      "The faster pointer laps the slower one inside any cycle, so a meeting proves a loop — using constant extra space, unlike the O(n)-space hash-set approach.",
  },
  // ── L3 ──
  {
    slug: "algorithms-l3-graphrep",
    competencyId: "algorithms",
    depthTier: 3,
    sectionHeading: "Graph Representations",
    prompt: "Which representation is preferable for a large sparse graph, and why?",
    options: [
      "Adjacency list — O(V + E) space, versus the adjacency matrix's O(V²).",
      "Adjacency matrix — it uses less memory when edges are rare.",
      "Adjacency list — because it gives O(1) edge-existence lookup.",
      "Neither; sparse graphs cannot be represented.",
    ],
    correctIndex: 0,
    explanation:
      "An adjacency matrix wastes O(V²) space when most cells are empty; an adjacency list stores only actual edges (O(V + E)). The matrix's advantage is O(1) edge lookup.",
  },
  {
    slug: "algorithms-l3-bfs",
    competencyId: "algorithms",
    depthTier: 3,
    sectionHeading: "Breadth-First Search (BFS)",
    prompt: "What does BFS find in an unweighted graph, and at what cost?",
    options: [
      "Shortest paths (fewest edges) from the source, in O(V + E), using a FIFO queue.",
      "The minimum spanning tree, in O(E log V).",
      "The longest path, in O(V²).",
      "A topological ordering, in O(V + E).",
    ],
    correctIndex: 0,
    explanation:
      "BFS expands level by level, so the first time it reaches a node is via a fewest-edge path. It runs in O(V + E) and underlies host discovery by hop distance and the lem-in augmenting-path search.",
  },
  {
    slug: "algorithms-l3-dfs",
    competencyId: "algorithms",
    depthTier: 3,
    sectionHeading: "Depth-First Search (DFS)",
    prompt: "Encountering a back edge during DFS indicates what?",
    options: [
      "A cycle in the graph.",
      "That the graph is bipartite.",
      "That the graph is disconnected.",
      "That the shortest path was found.",
    ],
    correctIndex: 0,
    explanation:
      "A back edge points to an ancestor still on the DFS stack, closing a cycle. DFS also powers topological sort (dependency ordering) and connected-component detection.",
  },
  {
    slug: "algorithms-l3-dijkstra",
    competencyId: "algorithms",
    depthTier: 3,
    sectionHeading: "Dijkstra's Algorithm",
    prompt: "What does Dijkstra's algorithm require, and how does a min-heap change its cost?",
    options: [
      "Non-negative edge weights; a min-heap priority queue reduces it from O(V²) to O((V + E) log V).",
      "A directed acyclic graph; a heap makes no difference.",
      "Negative edge weights; a heap makes it O(V³).",
      "An unweighted graph; a heap makes it O(1).",
    ],
    correctIndex: 0,
    explanation:
      "Dijkstra assumes non-negative weights (negative edges break its greedy invariant). Selecting the minimum-distance vertex with a min-heap instead of a linear scan gives O((V + E) log V). Routing protocols like OSPF use it.",
  },
  {
    slug: "algorithms-l3-dp",
    competencyId: "algorithms",
    depthTier: 3,
    sectionHeading: "Introduction to Dynamic Programming",
    prompt: "What property makes a problem a good fit for dynamic programming?",
    options: [
      "Overlapping subproblems plus optimal substructure, so caching subresults avoids exponential recomputation.",
      "A single base case and no recursion.",
      "Random access to a sorted array.",
      "The absence of any recursive structure.",
    ],
    correctIndex: 0,
    explanation:
      "DP stores subproblem results (memoization or tabulation) so each is computed once — turning naive Fibonacci's O(2^n) into O(n). It powers longest-common-subsequence, knapsack, and edit distance.",
  },
  {
    slug: "algorithms-l3-maxflow",
    competencyId: "algorithms",
    depthTier: 3,
    sectionHeading: "Max-Flow and the lem-in Connection",
    prompt: "What does each iteration of Edmonds-Karp (BFS-based Ford-Fulkerson) do?",
    options: [
      "Find an augmenting path with BFS, push flow equal to its bottleneck capacity, update residual capacities, and repeat until no path remains.",
      "Sort all edges by weight and add the smallest that avoids a cycle.",
      "Run Dijkstra from every vertex to build a distance matrix.",
      "Randomly remove edges until the graph disconnects.",
    ],
    correctIndex: 0,
    explanation:
      "Ford-Fulkerson augments flow along source→sink paths; Edmonds-Karp picks the shortest such path via BFS, giving O(VE²). lem-in is essentially this multi-path routing problem.",
  },
  // ── L4 ──
  {
    slug: "algorithms-l4-pushswap",
    competencyId: "algorithms",
    depthTier: 4,
    sectionHeading: "The Push_swap Problem",
    prompt: "What constraint defines the push_swap problem?",
    options: [
      "Sort integers using two stacks and a limited operation set (sa, pb, ra, rra, …) with as few operations as possible.",
      "Sort a linked list in place with no extra operations.",
      "Sort using only comparisons, counting the comparisons.",
      "Sort in O(1) time using a hash table.",
    ],
    correctIndex: 0,
    explanation:
      "push_swap is an optimization problem: reach a sorted stack a using only the allowed stack operations, minimizing the operation count (e.g. < 5500 moves for 500 numbers).",
  },
  {
    slug: "algorithms-l4-chunk",
    competencyId: "algorithms",
    depthTier: 4,
    sectionHeading: "Chunk-Based Sorting for Push_swap",
    prompt: "In chunk-based push_swap, why normalize the input values to their ranks first?",
    options: [
      "Ranks (0…n-1) make chunk-range membership trivial to test and independent of the actual value magnitudes.",
      "Ranks make the numbers smaller so they fit in a byte.",
      "Normalization sorts the array as a side effect.",
      "It is required to compile the operations.",
    ],
    correctIndex: 0,
    explanation:
      "Replacing values with their rank lets you partition into equal chunks by simple range checks and decide push/rotate moves cleanly, regardless of the original value distribution.",
  },
  {
    slug: "algorithms-l4-radix",
    competencyId: "algorithms",
    depthTier: 4,
    sectionHeading: "Radix Sort Approach",
    prompt: "Roughly how many operations does the bitwise radix approach use for 500 numbers (9 bits)?",
    options: [
      "About n × bits × 2 ≈ 9000 — each bit-pass does ~2n moves; simple and predictable, though not optimal.",
      "About n log n ≈ 4500 — optimal.",
      "About n² ≈ 250,000.",
      "Exactly 700, meeting the strictest target.",
    ],
    correctIndex: 0,
    explanation:
      "Radix push_swap processes each of the ~9 bits with roughly 2n moves, so ~500 × 9 × 2 ≈ 9000 operations. It's easy to implement with a predictable count, but chunk sorting achieves fewer moves.",
  },
  {
    slug: "algorithms-l4-bbst",
    competencyId: "algorithms",
    depthTier: 4,
    sectionHeading: "Balanced Binary Search Trees",
    prompt: "Why do self-balancing BSTs (AVL, red-black) matter for security?",
    options: [
      "They keep operations O(log n) even under adversarial insertions that would degrade a plain BST into an O(n) linked list (a DoS).",
      "They encrypt the stored keys.",
      "They remove the need for hashing entirely.",
      "They make every operation O(1).",
    ],
    correctIndex: 0,
    explanation:
      "An unbalanced BST can degenerate to a chain (O(n) per op) if an attacker controls insertion order. AVL/red-black trees rebalance to guarantee O(log n) — red-black trees back the Linux kernel VMA tree and std::map/std::set.",
  },
  {
    slug: "algorithms-l4-heap",
    competencyId: "algorithms",
    depthTier: 4,
    sectionHeading: "Heap Data Structure and Priority Queues",
    prompt: "What does a binary min-heap provide in O(log n)?",
    options: [
      "Insertion and extraction of the minimum — the basis of priority queues and heapsort.",
      "Search for an arbitrary element by value.",
      "Sorted iteration over all elements in O(1).",
      "Constant-time deletion of any node.",
    ],
    correctIndex: 0,
    explanation:
      "A heap keeps the min (or max) at the root with O(log n) push/pop via sift-up/sift-down. Priority queues (used by Dijkstra) and heapsort are built on it; arbitrary search is still O(n).",
  },
  {
    slug: "algorithms-l4-greedy",
    competencyId: "algorithms",
    depthTier: 4,
    sectionHeading: "Greedy Algorithms",
    prompt: "When does a greedy algorithm produce a globally optimal solution?",
    options: [
      "When the problem has the greedy-choice property and optimal substructure (e.g. activity selection, Huffman coding).",
      "Always, for any optimization problem.",
      "Only when the input is already sorted in reverse.",
      "Never — greedy algorithms are only approximations.",
    ],
    correctIndex: 0,
    explanation:
      "A greedy algorithm takes the locally best choice; it reaches the global optimum only when local choices provably compose into it. Activity selection and Huffman coding qualify; many other problems do not.",
  },
  {
    slug: "algorithms-l4-amortised",
    competencyId: "algorithms",
    depthTier: 4,
    sectionHeading: "Amortised Analysis and Real-World Complexity",
    prompt: "A dynamic array doubles on overflow. What is the amortised cost of an append, and why does it matter for security?",
    options: [
      "O(1) amortised — occasional O(n) resizes are spread over many cheap appends; but the O(n) worst case can be a DoS target.",
      "O(n) amortised, because every append copies the whole array.",
      "O(log n) amortised.",
      "O(n²) amortised.",
    ],
    correctIndex: 0,
    explanation:
      "Doubling makes total copying across n appends O(n), so each append is O(1) amortised. Still, a single append can be O(n) when it resizes — an attacker targeting that worst case can cause denial of service.",
  },
  {
    slug: "algorithms-l4-bloom",
    competencyId: "algorithms",
    depthTier: 4,
    sectionHeading: "Bloom filters",
    prompt: "What can a Bloom filter answer, and what can it never do?",
    options: [
      "It answers “probably in set” or “definitely not in set” — false positives are possible, false negatives are not.",
      "It gives exact membership with zero errors.",
      "It can return false negatives but never false positives.",
      "It stores the actual elements for later retrieval.",
    ],
    correctIndex: 0,
    explanation:
      "k hash functions set/check bits in a bit array. If any queried bit is 0 the element is definitely absent; if all are 1 it is probably present (collisions cause false positives). Used for safe-browsing URL checks, malware prefiltering, and spam filtering.",
  },
  // ── L5 ──
  {
    slug: "algorithms-l5-classes",
    competencyId: "algorithms",
    depthTier: 5,
    sectionHeading: "Computational Complexity Classes",
    prompt: "What does it mean for a problem to be NP-complete?",
    options: [
      "It is among the hardest in NP: every NP problem reduces to it in polynomial time, so if one NP-complete problem is in P, then P = NP.",
      "It can be solved in polynomial time by a deterministic machine.",
      "Its solutions cannot be verified in polynomial time.",
      "It is solvable only by quantum computers.",
    ],
    correctIndex: 0,
    explanation:
      "NP problems have poly-time-verifiable solutions; NP-complete ones are the hardest such problems. Modern cryptography relies on certain problems (factoring, discrete log) being outside P.",
  },
  {
    slug: "algorithms-l5-reductions",
    competencyId: "algorithms",
    depthTier: 5,
    sectionHeading: "Reductions and NP-Completeness Proofs",
    prompt: "How do you prove a new problem X is NP-complete?",
    options: [
      "Show X is in NP, then reduce a known NP-complete problem to X in polynomial time.",
      "Show X can be brute-forced, then measure its runtime.",
      "Reduce X to sorting in polynomial time.",
      "Prove X has no polynomial-time verifier.",
    ],
    correctIndex: 0,
    explanation:
      "Membership in NP plus a poly-time reduction from a known NP-complete problem (SAT, via Cook's theorem, is the root) establishes NP-completeness. Knowing a security problem is NP-hard tells you to use heuristics or approximations.",
  },
  {
    slug: "algorithms-l5-cryptanalysis",
    competencyId: "algorithms",
    depthTier: 5,
    sectionHeading: "Algorithmic Attacks on Cryptographic Primitives",
    prompt: "Why does an n-bit hash provide only about n/2 bits of collision resistance?",
    options: [
      "The birthday attack finds a collision in roughly 2^(n/2) evaluations, not 2^n.",
      "Half the output bits are always zero.",
      "Hash functions leak half their state on each call.",
      "Collisions require inverting the hash, which halves the work.",
    ],
    correctIndex: 0,
    explanation:
      "By the birthday bound, a collision appears after ~2^(n/2) random inputs, so SHA-256 gives ~128-bit collision resistance. Cryptanalysis is about finding such faster-than-brute-force methods (Pollard's rho, the number field sieve, etc.).",
  },
  {
    slug: "algorithms-l5-hashdos",
    competencyId: "algorithms",
    depthTier: 5,
    sectionHeading: "Algorithmic Complexity Attacks (HashDoS)",
    prompt: "How does a hash-flooding (HashDoS) attack work, and how is it mitigated?",
    options: [
      "A predictable hash lets an attacker send keys that all collide, degrading O(1) operations to O(n) (O(n²) total); a keyed/random hash like SipHash prevents it.",
      "The attacker overflows the hash table's memory to gain code execution.",
      "The attacker guesses the table size and reads other users' data.",
      "It only affects sorted arrays, not hash tables.",
    ],
    correctIndex: 0,
    explanation:
      "If the hash is predictable, crafted colliding keys pile into one bucket, so n insertions cost O(n²) — a denial of service. Randomly-keyed hashes (SipHash) and non-backtracking regex engines (to avoid the analogous ReDoS) are the fixes.",
  },
  {
    slug: "algorithms-l5-approx",
    competencyId: "algorithms",
    depthTier: 5,
    sectionHeading: "Approximation Algorithms and Heuristics",
    prompt: "What does a “2-approximation” algorithm guarantee?",
    options: [
      "A solution no worse than twice the optimal — useful when the exact problem is NP-hard.",
      "A solution that is exactly optimal, twice as fast.",
      "A 50% chance of finding the optimal solution.",
      "A solution using at most two data structures.",
    ],
    correctIndex: 0,
    explanation:
      "Approximation algorithms trade exactness for tractable running time with a proven bound (e.g. the greedy vertex-cover 2-approximation). They appear in IDS rule selection, scan prioritization, and coverage-guided fuzzing.",
  },
  {
    slug: "algorithms-l5-randomised",
    competencyId: "algorithms",
    depthTier: 5,
    sectionHeading: "Randomised Algorithms",
    prompt: "How does a Monte Carlo algorithm (e.g. Miller-Rabin) differ from a Las Vegas one?",
    options: [
      "Monte Carlo runs in bounded time but may be wrong with small probability; Las Vegas is always correct but has randomized running time.",
      "Monte Carlo is always correct; Las Vegas may be wrong.",
      "Both are always wrong but fast.",
      "They are two names for the same guarantee.",
    ],
    correctIndex: 0,
    explanation:
      "Miller-Rabin (Monte Carlo) may falsely call a composite prime with small probability but always terminates quickly; randomized quicksort (Las Vegas) is always correct with variable runtime. TLS key generation uses Miller-Rabin to test candidate primes.",
  },
  {
    slug: "algorithms-l5-quantum",
    competencyId: "algorithms",
    depthTier: 5,
    sectionHeading: "Quantum Algorithms and Post-Quantum Cryptography",
    prompt: "What do Shor's and Grover's quantum algorithms threaten?",
    options: [
      "Shor factors integers and solves discrete logs in polynomial time (breaking RSA/DH/ECC); Grover's √N search halves symmetric key strength.",
      "Both break AES completely in constant time.",
      "Shor breaks hash functions; Grover breaks RSA.",
      "Neither affects current cryptography.",
    ],
    correctIndex: 0,
    explanation:
      "Shor's algorithm dismantles factoring- and discrete-log-based public-key crypto; Grover's gives a quadratic speedup on brute-force search, so AES-128 offers ~64-bit quantum security. NIST's ML-KEM, ML-DSA, and SLH-DSA are the lattice/hash-based responses.",
  },
];
