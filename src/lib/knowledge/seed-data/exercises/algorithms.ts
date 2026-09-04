import type { SeedExercise } from "./types";

/** algorithms L0–L5 — one comprehension MCQ per teaching section. */
export const ALGORITHMS_EXERCISES: SeedExercise[] = [
  // ── L0 ──
  {
    slug: "algorithms-l0-what",
    competencyId: "algorithms",
    depthTier: 0,
    sectionHeading: "What Is an Algorithm",
    prompt:
      "A colleague hands you pseudocode for a login-throttling system: it counts failed attempts, doubles the wait after each failure, and resets after a success. They ask whether this qualifies as an algorithm. What determines the answer?",
    options: [
      "Yes — it is a finite sequence of unambiguous steps that transforms input (login attempts) into output (access or lockout). An algorithm is language-independent and analyzable for correctness and efficiency, which is what makes it foundational to security and computation.",
      "No — a true algorithm must operate on numerical data and produce a numerical result. Since this login system processes strings (usernames and passwords) and yields a boolean decision, it is properly classified as a heuristic rather than a formal algorithm.",
      "Only if it is implemented in a compiled language like C or Rust. Interpreted scripts execute instructions sequentially but lack the deterministic execution guarantees that define a proper algorithm, so the implementation language is the deciding factor.",
      "Only if it uses a recognized data structure such as a hash table or balanced tree internally. Without a formally specified structure to organize its state, the procedure remains an ad-hoc routine rather than a true algorithm.",
    ],
    correctIndex: 0,
    explanation:
      "An algorithm is a finite, well-defined sequence of steps that transforms input to output — language, data type, and underlying structure are irrelevant to the definition. For security, algorithms underpin cryptography, brute-force feasibility analysis, intrusion-detection pattern-matching, and malware analysis.",
  },
  {
    slug: "algorithms-l0-bigo",
    competencyId: "algorithms",
    depthTier: 0,
    sectionHeading: "Big-O Notation",
    prompt:
      "You are estimating how long a brute-force attack on an n-bit encryption key will take as key length grows. Your model shows the work doubles with every additional bit. Which Big-O class describes this growth?",
    options: [
      "O(2^n) — exponential growth. Each added bit doubles the search space, which is exactly why extending key length from 128 to 256 bits makes brute force astronomically harder rather than merely twice as slow.",
      "O(n^2) — quadratic growth. Each added bit adds n more comparisons in a nested loop over the key space, so the cost rises with the square of the key length rather than doubling per bit.",
      "O(n log n) — linearithmic growth. The brute-force search resembles a divide-and-conquer sort: each bit halves the remaining candidates, and processing each half is linear, giving n times log n overall.",
      "O(log n) — logarithmic growth. Because each guess eliminates half the remaining key space (analogous to binary search), the total work grows only as the logarithm of the number of possible keys.",
    ],
    correctIndex: 0,
    explanation:
      "Big-O describes how cost scales with input size: O(1) constant, O(log n) binary search, O(n) linear scan, O(n log n) efficient sorts, O(n^2) naive nested loops, O(2^n) exponential. Brute-forcing an n-bit key explores 2^n candidates, so each extra bit doubles the work — the definition of exponential growth.",
  },
  {
    slug: "algorithms-l0-security",
    competencyId: "algorithms",
    depthTier: 0,
    sectionHeading: "Why Complexity Matters in Security",
    prompt:
      "Your team is choosing a hash function for file-integrity checks. Someone proposes MD5 because its 128-bit digest 'should give 2^128 collision resistance.' A senior engineer objects. What is the core problem with MD5?",
    options: [
      "Practical collision attacks against MD5 require roughly 2^18 work — far below even the birthday bound of 2^64. Published techniques generate colliding files in seconds, so MD5 provides no meaningful collision resistance despite its 128-bit output length.",
      "MD5 is a keyed MAC, not a hash, so it requires a secret key that an attacker can brute-force in about 2^64 operations. Without that key the digest cannot be verified, making integrity checks unreliable in any practical deployment.",
      "MD5's output is 128 bits, which modern storage systems silently truncate to 64 bits for space efficiency. This truncation halves the effective digest length, reducing collision resistance to 2^32 — far too weak for any security purpose today.",
      "MD5 processes input in 64-byte blocks but pads the final block incorrectly, leaking up to 8 bytes of adjacent memory into the digest. This padding flaw lets two different files produce the same hash by carefully aligning their trailing data.",
    ],
    correctIndex: 0,
    explanation:
      "A hash's real security depends on the best-known attack complexity, not its bit-length alone. MD5 collisions can be generated in about 2^18 work, so it is completely broken as a collision-resistant hash — even though the digest is 128 bits. SHA-256 remains the standard replacement.",
  },
  // ── L1 ──
  {
    slug: "algorithms-l1-search",
    competencyId: "algorithms",
    depthTier: 1,
    sectionHeading: "Linear and Binary Search",
    prompt:
      "You are implementing binary search on a sorted array of 2 billion integers. Your code computes the midpoint as (lo + hi) / 2 using 32-bit signed integers. During testing on large arrays, the search returns wrong results. What is the bug?",
    options: [
      "When lo and hi are both large, their sum overflows a 32-bit signed integer, producing a negative or wrapped midpoint. The fix is mid = lo + (hi - lo) / 2, which keeps the arithmetic in range — a real bug that lurked in production binary searches for decades.",
      "Binary search on 2 billion elements exceeds the O(log n) guarantee and degrades to O(n) linear time, causing the function to time out before reaching the target. Switching to interpolation search, which handles large arrays in O(1) average time, solves the issue.",
      "Dividing by 2 using integer division always rounds toward zero, which in a large array skips elements near the boundaries. Replacing the division with a right-shift (hi + lo) >> 1 rounds toward negative infinity instead, correctly handling the off-by-one edge case.",
      "Binary search requires the array to be sorted in descending order to work correctly with large indices. Ascending-order arrays cause the comparison logic to invert when lo exceeds half the array length, returning the wrong element without any error indication.",
    ],
    correctIndex: 0,
    explanation:
      "For large indices, lo + hi can exceed INT_MAX and wrap around (undefined behaviour for signed ints in C/C++). The subtraction form lo + (hi - lo) / 2 stays in range. This bug was documented by Joshua Bloch in 2006 and affected Java's own Arrays.binarySearch. Binary search still requires sorted data and runs in O(log n).",
  },
  {
    slug: "algorithms-l1-bubble-selection",
    competencyId: "algorithms",
    depthTier: 1,
    sectionHeading: "Bubble Sort and Selection Sort",
    prompt:
      "You add a boolean swapped flag to your bubble sort: if a complete pass makes no swaps, the function returns early. On a nearly-sorted 10,000-element array, the sort finishes almost instantly. What is the best-case complexity with this optimization?",
    options: [
      "O(n) — one clean pass with no swaps confirms the array is already sorted, so the algorithm stops after a single linear scan. Without the flag, bubble sort always runs O(n^2). Both bubble and selection sort remain O(n^2) in the average and worst cases.",
      "O(n log n) — the early-exit flag effectively turns bubble sort into a divide-and-conquer algorithm on sorted input, since each pass halves the unsorted region. This matches merge sort's best-case performance on already-ordered data.",
      "O(1) — the flag is checked before the first comparison, so the function returns immediately without scanning any elements. The nearly-sorted input triggers the early-exit condition on entry, making the cost constant regardless of array size.",
      "O(n^2) — the flag reduces the constant factor but cannot change the asymptotic class. Bubble sort always performs n(n-1)/2 comparisons in every case; the flag only eliminates the final redundant pass after all elements are already in place.",
    ],
    correctIndex: 0,
    explanation:
      "If a full pass makes no swaps, the data is sorted and bubble sort stops early — giving O(n) on sorted or nearly-sorted input. Without the flag, or in the average/worst case, it remains O(n^2). Both bubble and selection sort are pedagogical tools, not production sorts.",
  },
  {
    slug: "algorithms-l1-insertion",
    competencyId: "algorithms",
    depthTier: 1,
    sectionHeading: "Insertion Sort",
    prompt:
      "You are writing a hybrid sorting algorithm. For sub-arrays smaller than 16 elements, you switch from merge sort to a simpler sort. Your benchmarks show insertion sort outperforms selection sort and bubble sort on these small, nearly-ordered runs. Why?",
    options: [
      "Insertion sort is O(n) on nearly-sorted data because each element shifts only a few positions. Its minimal overhead (no recursion, no auxiliary arrays) and cache-friendly sequential access make it the fastest choice for small runs inside hybrid sorts like Timsort.",
      "Insertion sort uses a divide-and-conquer strategy on small arrays: it splits the 16 elements into pairs, sorts each pair, then merges them upward. This gives O(n log n) even on tiny inputs, beating the strictly O(n^2) selection and bubble sort algorithms.",
      "Insertion sort pre-scans the sub-array to find the minimum element, places it at position zero, then shifts remaining elements around it. This minimum-first pass guarantees O(n) regardless of input order, unlike selection sort which always scans the full remaining range.",
      "Insertion sort allocates a temporary buffer the size of the sub-array and performs a single merge pass, making it effectively a one-level merge sort. The buffer fits in L1 cache for sub-arrays under 16 elements, which gives it its speed advantage.",
    ],
    correctIndex: 0,
    explanation:
      "Insertion sort is O(n^2) in the worst case but O(n) on nearly-sorted input, and its very low constant overhead (no function calls, no auxiliary memory) makes it the ideal base case for small runs inside hybrid sorts. Timsort and introsort both use insertion sort for this reason.",
  },
  {
    slug: "algorithms-l1-stability",
    competencyId: "algorithms",
    depthTier: 1,
    sectionHeading: "Comparing Sort Stability and Security Relevance",
    prompt:
      "You are sorting firewall logs first by timestamp, then by severity. After the severity sort, entries with the same severity level appear out of chronological order. What property is your sort missing, and why does it matter for log analysis?",
    options: [
      "Stability — a stable sort preserves the relative order of equal elements. If the severity sort were stable, entries sharing a severity level would keep their prior timestamp order, giving a clean chronological view within each group for forensic analysis.",
      "Determinism — a deterministic sort always produces the same output for the same input. Your sort uses randomized pivot selection, which reorders equal elements unpredictably on each run. Switching to a fixed-pivot variant would preserve the timestamp ordering across executions.",
      "Adaptivity — an adaptive sort detects pre-existing order in the input and preserves it. Your sort treats every input as fully unordered, re-shuffling the timestamps during partitioning. An adaptive variant would recognize the sorted timestamp runs and leave them intact.",
      "Totality — a total ordering sort compares every pair of elements using all available fields. Your sort uses a partial comparator that considers only severity and ignores the timestamp entirely. Extending the comparator to break ties by timestamp would restore chronological order.",
    ],
    correctIndex: 0,
    explanation:
      "Stability means equal elements retain their relative order from the input. Sorting by timestamp first and then stable-sorting by severity keeps timestamps ordered within each severity group. Bubble sort and insertion sort are stable; selection sort and (typically) quicksort are not.",
  },
  // ── L2 ──
  {
    slug: "algorithms-l2-merge",
    competencyId: "algorithms",
    depthTier: 2,
    sectionHeading: "Merge Sort",
    prompt:
      "Your security tool must sort 10 million log entries with a guaranteed O(n log n) worst case, and entries with identical timestamps must stay in their original order. A colleague suggests quicksort. Why is it not the right choice, and what should you use instead?",
    options: [
      "Quicksort's worst case is O(n^2), not O(n log n), and it is not stable — equal-timestamp entries may be reordered. Merge sort guarantees O(n log n) in all cases and is stable, at the cost of O(n) extra memory for the merge buffers.",
      "Quicksort is stable but its O(n^2) worst case on sorted input disqualifies it. Heapsort guarantees O(n log n) in all cases and is also stable, with the advantage of sorting in place using only O(1) additional memory overhead.",
      "Quicksort guarantees O(n log n) with median-of-three pivot selection, but its partitioning is unstable. Introsort adds a stability layer by falling back to insertion sort for equal elements, preserving their original order while matching quicksort's speed.",
      "Quicksort is O(n log n) average but its recursive partitioning makes it inherently unstable. Timsort fixes this by using quicksort's partitioning for large segments and switching to a stable selection sort for the final merge pass, giving guaranteed O(n log n).",
    ],
    correctIndex: 0,
    explanation:
      "Merge sort divides, recursively sorts halves, and merges — always O(n log n) and stable, but requiring O(n) auxiliary space. Quicksort is often faster in practice but has an O(n^2) worst case and is not stable. Heapsort is O(n log n) worst case but not stable. Timsort uses merge sort + insertion sort (not quicksort).",
  },
  {
    slug: "algorithms-l2-quicksort",
    competencyId: "algorithms",
    depthTier: 2,
    sectionHeading: "Quicksort",
    prompt:
      "A web application uses quicksort with the first element as pivot to sort user-submitted data before display. An attacker sends a pre-sorted array of 100,000 elements, and the server hangs for several seconds. What is happening and how do you fix it?",
    options: [
      "The pre-sorted input makes every partition maximally unbalanced — the first-element pivot is always the minimum, producing one empty side and one side with n-1 elements. This degrades quicksort to O(n^2). Randomizing the pivot or using median-of-three prevents an attacker from forcing bad partitions.",
      "The sorted input triggers excessive memory allocation because quicksort creates a new array for each partition level. With 100,000 levels of recursion each copying the input, memory usage grows to O(n^2). Switching to an in-place merge sort eliminates the allocation overhead entirely.",
      "Pre-sorted data causes quicksort to enter a verification loop that re-scans the array n times to confirm sortedness before partitioning. Adding an early-exit flag (like optimized bubble sort) would detect the sorted input immediately and skip the redundant verification passes.",
      "The sorted array triggers CPU cache thrashing because quicksort's access pattern on ordered data jumps between distant memory locations. The processor stalls on cache misses, inflating wall-clock time. Using a cache-oblivious variant that processes blocks of 64 elements fixes the locality issue.",
    ],
    correctIndex: 0,
    explanation:
      "Consistently bad pivots (smallest or largest element) make quicksort degrade to O(n^2). An attacker controlling the input can force this deliberately — a denial-of-service attack. Randomizing the pivot, using median-of-three, or switching to introsort (which falls back to heapsort after deep recursion) mitigates this.",
  },
  {
    slug: "algorithms-l2-linkedlist",
    competencyId: "algorithms",
    depthTier: 2,
    sectionHeading: "Linked Lists",
    prompt:
      "You need a data structure for an intrusion-detection system that frequently inserts and removes entries in the middle of its alert queue, but rarely needs to access alerts by index. A colleague suggests a dynamic array. What is the better choice and what trade-off does it introduce?",
    options: [
      "A linked list — given a pointer to the target node, insertion and deletion are O(1) since you only rewire a few pointers. The trade-off is O(n) indexed access and poor CPU-cache locality, but since you rarely look up by index, the fast splicing dominates.",
      "A balanced binary search tree — it offers O(log n) insertion at any position by rebalancing after each operation, and unlike a linked list it also provides O(log n) indexed access. The trade-off is higher per-node memory overhead for storing two child pointers and a balance factor.",
      "A circular buffer — it supports O(1) insertion and removal at both ends and O(1) indexed access by computing offsets from the head pointer. The trade-off is a fixed maximum capacity set at creation, though doubling-resize strategies can amortise this limitation.",
      "A skip list — it provides O(log n) insertion and deletion by maintaining express lanes that bypass intermediate nodes. Unlike a plain linked list it also gives O(log n) random access through its upper levels, making it strictly superior for this workload.",
    ],
    correctIndex: 0,
    explanation:
      "Linked lists excel at O(1) splicing when you already hold a pointer to the insertion point, but reaching the k-th element requires walking k nodes (O(n)). Scattered nodes also defeat CPU caches. Arrays give O(1) indexing but O(n) middle insertion due to element shifting.",
  },
  {
    slug: "algorithms-l2-stackqueue",
    competencyId: "algorithms",
    depthTier: 2,
    sectionHeading: "Stacks and Queues",
    prompt:
      "You are implementing a network packet analyzer. Incoming packets must be processed strictly in the order they arrive — the earliest packet goes first. Which abstract data type enforces this ordering, and which classic graph algorithm relies on the same structure?",
    options: [
      "A queue (FIFO) — first-in, first-out processing handles packets in arrival order. Breadth-first search uses the same structure to explore graph nodes level by level, guaranteeing that closer nodes are visited before distant ones. DFS, by contrast, uses a stack (LIFO).",
      "A stack (LIFO) — last-in, first-out means the earliest packet sits at the bottom and remains there until all later packets are processed. Breadth-first search also uses a stack to ensure it visits the earliest-discovered nodes before expanding deeper ones.",
      "A priority queue — it assigns each packet a priority equal to its arrival timestamp, always dequeuing the lowest timestamp first. Dijkstra's algorithm relies on the same min-priority-queue structure to process nodes by their cumulative distance from the source vertex.",
      "A deque (double-ended queue) — it allows insertion and removal at both ends. By convention you enqueue at the front and dequeue at the rear to get FIFO ordering. BFS relies on a deque rather than a simple queue for the flexibility of processing from either end.",
    ],
    correctIndex: 0,
    explanation:
      "A queue (FIFO) guarantees first-in, first-out ordering. BFS uses a FIFO queue to explore nodes level by level, ensuring shortest-hop-count paths in unweighted graphs. DFS uses a stack (LIFO — explicit or via the call stack) to dive along one branch before backtracking.",
  },
  {
    slug: "algorithms-l2-hashtable",
    competencyId: "algorithms",
    depthTier: 2,
    sectionHeading: "Hash Tables",
    prompt:
      "Your web framework uses a hash table to store HTTP request parameters. An attacker discovers the hash function is deterministic and public. They craft thousands of parameter names that all hash to the same bucket. What kind of attack is this, and how should you defend against it?",
    options: [
      "All keys land in one bucket, turning each O(1) lookup into an O(n) chain walk — n insertions cost O(n^2) total, exhausting CPU. This is a hash-flooding (HashDoS) attack. The defense is a keyed hash like SipHash, seeded with a random secret at startup to make collisions unpredictable.",
      "Identical hashes cause the table to resize on every insertion because the per-bucket load factor exceeds the threshold with each new key. Continuous reallocation and rehashing consume CPU and memory. The defense is to cap the maximum table size and reject requests with excess parameters.",
      "All keys mapping to one bucket triggers the table's overflow handler, which serializes the colliding entries to disk as a spill file. The disk I/O becomes the bottleneck. The defense is a cuckoo hash table, which distributes every key deterministically across two separate tables.",
      "The hash collisions force the table to convert the overloaded bucket from a chain into a sorted array, re-sorting on every insertion at O(n log n) per operation. The defense is to replace the hash table entirely with a balanced BST, which handles adversarial input in O(log n).",
    ],
    correctIndex: 0,
    explanation:
      "A hash table with a predictable hash function lets an attacker craft colliding keys, degrading O(1) operations to O(n) each — O(n^2) total for n inserts. SipHash or similar keyed hash functions, seeded randomly per process, make collision sets unpredictable and prevent this denial-of-service vector.",
  },
  {
    slug: "algorithms-l2-choose",
    competencyId: "algorithms",
    depthTier: 2,
    sectionHeading: "Choosing the Right Data Structure",
    prompt:
      "You are building a malware-signature lookup service. Given a file hash, you need to check whether it matches any of 10 million known signatures as fast as possible. The signatures do not need to be iterated in any particular order. Which data structure should you choose?",
    options: [
      "A hash table — it provides O(1) average-case lookup by computing the key's hash and jumping directly to the matching bucket. Since ordering is unnecessary, you trade sorted traversal capability for the fastest possible point queries on a large dataset.",
      "A balanced binary search tree (e.g. red-black tree) — it provides O(log n) lookup while automatically maintaining sorted order. For 10 million entries, log base 2 is about 23 comparisons per query, which is effectively constant and competitive with hash-table lookups.",
      "A sorted array with binary search — it provides O(log n) lookup with excellent cache performance because elements are stored contiguously in memory. The initial sort costs O(n log n) but is a one-time expense that pays off when the signature list changes infrequently.",
      "A trie (prefix tree) — it provides O(k) lookup where k is the key length, independent of the number of stored signatures. Each character of the file hash indexes one level of the trie, giving predictable performance that does not degrade as the dataset grows.",
    ],
    correctIndex: 0,
    explanation:
      "Hash tables give O(1) average lookup — the fastest for unordered point queries. Balanced BSTs give O(log n) with ordering; sorted arrays give O(log n) with cache locality; tries give O(key-length) independent of n. When only speed matters and ordering is irrelevant, the hash table wins.",
  },
  {
    slug: "algorithms-l2-floyd",
    competencyId: "algorithms",
    depthTier: 2,
    sectionHeading: "Floyd's cycle detection (tortoise and hare)",
    prompt:
      "Your memory-leak detector walks a chain of heap pointers and never terminates — you suspect a cyclic reference. You need to detect the cycle without allocating extra memory proportional to the chain length. Which approach works, and how?",
    options: [
      "Floyd's tortoise-and-hare algorithm: advance two pointers at 1x and 2x speed. If a cycle exists, the fast pointer laps the slow one and they meet — detection in O(n) time and O(1) space, with no hash set, no marking, and no false positives.",
      "Store every visited address in a sorted array and binary-search it before each step. If the search finds a match, a cycle exists. This detects cycles in O(n log n) time due to the per-step binary searches, but it requires O(n) space for the growing address array.",
      "Count traversal steps and compare against a fixed threshold. If the count exceeds the threshold, assume a cycle exists. This uses O(1) space and always terminates, but it cannot distinguish a genuinely long acyclic chain from a short cycle, producing false positives on large structures.",
      "Hash each visited pointer into a fixed-size Bloom filter, checking for membership at every step. A match signals a probable cycle. The filter uses constant space regardless of chain length, but its false-positive rate rises as entries accumulate, risking phantom cycle reports.",
    ],
    correctIndex: 0,
    explanation:
      "The fast pointer moves at 2x speed, so inside any cycle it gains one node per step on the slow pointer and eventually laps it — a meeting proves a cycle. This uses O(1) extra space (two pointers) and O(n) time, unlike the O(n)-space hash-set approach or the false-positive-prone threshold/Bloom alternatives.",
  },
  // ── L3 ──
  {
    slug: "algorithms-l3-graphrep",
    competencyId: "algorithms",
    depthTier: 3,
    sectionHeading: "Graph Representations",
    prompt:
      "You are modeling a network of 50,000 hosts with only 80,000 direct connections. A colleague proposes storing the topology in a 50,000 x 50,000 adjacency matrix. Why is this wasteful, what should you use instead, and what do you give up?",
    options: [
      "The matrix uses O(V^2) = 2.5 billion cells, almost all zeros — enormous waste for a sparse graph. An adjacency list stores only the actual edges in O(V + E) space. The trade-off is losing the matrix's O(1) edge-existence lookup; checking whether two hosts are directly connected now requires scanning a neighbor list.",
      "The matrix is memory-efficient but slow to traverse: finding all neighbors of a host requires scanning an entire 50,000-element row. An adjacency list stores edges in sorted order, giving O(log V) neighbor lookups via binary search — faster than the matrix's O(V) row scan on sparse graphs.",
      "The matrix cannot represent weighted connections because each cell is a single bit. An edge list of (source, destination, weight) triples is more flexible and uses O(E) space. The trade-off is that checking whether a specific edge exists requires a linear scan through all 80,000 edges.",
      "The matrix wastes space because it stores each undirected edge twice — once in each direction. A triangular half-matrix uses O(V^2 / 2) space, cutting storage in half while keeping O(1) edge lookups. The trade-off is that directed edges cannot be represented without the full matrix.",
    ],
    correctIndex: 0,
    explanation:
      "An adjacency matrix uses O(V^2) space regardless of edge count — wasteful when E << V^2. An adjacency list stores only actual edges (O(V + E)), ideal for sparse graphs. The matrix's advantage is O(1) edge-existence checking; the list requires scanning a node's neighbor list.",
  },
  {
    slug: "algorithms-l3-bfs",
    competencyId: "algorithms",
    depthTier: 3,
    sectionHeading: "Breadth-First Search (BFS)",
    prompt:
      "You are mapping a network by discovering all hosts reachable within k hops from your scanner. You need the minimum number of hops to each host in an unweighted topology graph. Which traversal algorithm gives you this, what does it cost, and what data structure drives it?",
    options: [
      "BFS — it explores nodes level by level using a FIFO queue, so the first time it reaches a host is via a fewest-hop path. It runs in O(V + E), visiting each node and edge once. Stopping at depth k gives exactly the hosts within k hops.",
      "DFS — it explores each branch to its deepest node before backtracking, naturally finding the shortest path because it exhaustively covers every route before moving on. It runs in O(V + E) using a stack, and the first path found to each node is always the shortest.",
      "Dijkstra's algorithm with a min-heap priority queue — it finds shortest paths in O((V + E) log V) by always processing the closest unvisited node. Even on unweighted graphs the heap is necessary to guarantee optimality; a plain queue would not preserve the distance ordering.",
      "Bellman-Ford — it relaxes every edge V-1 times, guaranteeing the correct hop count even if some links carry negative latency. It runs in O(VE), which is acceptable for network mapping since most topologies are sparse and E stays close to V in practice.",
    ],
    correctIndex: 0,
    explanation:
      "BFS expands level by level via a FIFO queue. The first arrival at each node is along a fewest-edge path — exactly what 'minimum hops' means in an unweighted graph. It runs in O(V + E). DFS does not guarantee shortest paths, and Dijkstra's heap is unnecessary when all edges have unit weight.",
  },
  {
    slug: "algorithms-l3-dfs",
    competencyId: "algorithms",
    depthTier: 3,
    sectionHeading: "Depth-First Search (DFS)",
    prompt:
      "While analyzing a dependency graph of software packages, your DFS encounters an edge from the node currently being explored back to an ancestor still on the recursion stack. What does this edge tell you about the dependency structure, and what is its practical implication?",
    options: [
      "It is a back edge, which proves a cycle exists — the package depends (directly or transitively) on itself. Cycles in a dependency graph mean the packages cannot be installed in a valid topological order without breaking the circular chain first.",
      "It is a forward edge, indicating a redundant dependency — the package lists an ancestor as a direct dependency even though it already depends on it transitively. The graph remains acyclic, but the extra edge wastes bandwidth during package resolution.",
      "It is a cross edge, meaning two independent branches of the dependency tree converge at a shared ancestor. This signals a diamond dependency — two packages requiring different versions of the same library — but does not imply any cycle in the graph itself.",
      "It is a tree edge that the DFS is revisiting because the ancestor's subtree was not fully explored on the first pass. This means the graph has more edges than a spanning tree can cover, but those extra edges do not create cycles or ordering violations.",
    ],
    correctIndex: 0,
    explanation:
      "A back edge points to an ancestor still on the DFS stack, closing a cycle. In a dependency graph, cycles make topological sorting impossible — you cannot order packages so every dependency is installed first. DFS also powers topological sort (on DAGs) and connected-component detection.",
  },
  {
    slug: "algorithms-l3-dijkstra",
    competencyId: "algorithms",
    depthTier: 3,
    sectionHeading: "Dijkstra's Algorithm",
    prompt:
      "You are implementing shortest-path routing for a network where link costs are positive milliseconds of latency. Using Dijkstra's algorithm with a simple array scan to find the minimum each step, performance is poor on your 100,000-node graph. What change improves the running time, and what constraint must edge weights satisfy?",
    options: [
      "Replace the linear scan with a min-heap priority queue, reducing cost from O(V^2) to O((V + E) log V). Dijkstra requires all edge weights to be non-negative — a negative weight breaks its greedy invariant because a finalized node's shortest distance could later decrease.",
      "Replace the array with a hash table mapping each node to its tentative distance, reducing per-lookup cost to O(1) and total cost to O(V + E). Dijkstra works with any edge weights, including negative ones, as long as no negative-weight cycles exist anywhere in the graph.",
      "Switch to Bellman-Ford, which processes all edges in a single linear pass rather than extracting minimums. This reduces cost from O(V^2) to O(V + E) and also handles negative edge weights, making Bellman-Ford strictly superior to Dijkstra on all weighted graph problems.",
      "Sort all edges by weight up front and process them in ascending order, turning Dijkstra into a Kruskal-like edge-processing algorithm running in O(E log E). This requires edge weights to be distinct — ties cause the algorithm to process nodes in the wrong order, producing incorrect paths.",
    ],
    correctIndex: 0,
    explanation:
      "Dijkstra's greedy invariant ('the nearest unfinalized node has its true shortest distance') requires non-negative weights. A min-heap selects the minimum in O(log V) instead of O(V), giving O((V + E) log V) overall. Bellman-Ford handles negative weights but costs O(VE), not O(V + E). Routing protocols like OSPF use Dijkstra.",
  },
  {
    slug: "algorithms-l3-dp",
    competencyId: "algorithms",
    depthTier: 3,
    sectionHeading: "Introduction to Dynamic Programming",
    prompt:
      "You write a naive recursive function to compute the nth Fibonacci number. For n = 50, it takes minutes. Profiling shows the same subproblems (e.g. fib(30)) are recomputed billions of times. Which technique eliminates this redundancy, and what two properties must the problem have for it to apply?",
    options: [
      "Dynamic programming — it caches each subproblem's result so it is computed only once (memoization) or fills a table bottom-up (tabulation). It applies when a problem has overlapping subproblems (the same sub-computations recur) and optimal substructure (optimal solutions compose from optimal sub-solutions).",
      "Greedy optimization — it solves each subproblem by selecting the locally largest Fibonacci predecessor and never revisiting that choice. It applies when the problem has the greedy-choice property, which Fibonacci satisfies because each value depends only on its two immediate predecessors.",
      "Divide and conquer — it splits the problem into independent, non-overlapping halves, solves each recursively, and merges results. Applied to Fibonacci, it reduces the exponential tree to O(n log n) by recognizing that fib(k) appears in only one branch of each split.",
      "Tail-call memoization — the compiler detects overlapping recursive calls and automatically caches their return values in an internal hash table. This requires the function to be tail-recursive, which Fibonacci qualifies as because the last operation in each call is the recursive invocation.",
    ],
    correctIndex: 0,
    explanation:
      "DP stores subproblem results so each is computed once, turning naive Fibonacci's O(2^n) into O(n). It requires overlapping subproblems (same sub-computations recur) and optimal substructure (optimal solutions build from optimal sub-solutions). It also powers longest-common-subsequence, knapsack, and edit-distance algorithms.",
  },
  {
    slug: "algorithms-l3-maxflow",
    competencyId: "algorithms",
    depthTier: 3,
    sectionHeading: "Max-Flow and the lem-in Connection",
    prompt:
      "In the lem-in project, you must route the maximum number of ants simultaneously from a source room to a sink room through tunnels with unit capacity. Each iteration of your solution finds a path and adjusts capacities. Which algorithm does this describe, and what happens in each iteration?",
    options: [
      "Edmonds-Karp (BFS-based Ford-Fulkerson): each iteration finds the shortest augmenting path via BFS, pushes one unit of flow along it, subtracts capacity on forward edges and adds capacity on reverse edges, then repeats until no source-to-sink path remains. Total cost is O(VE^2).",
      "Kruskal's algorithm adapted for flow: each iteration selects the lowest-capacity tunnel that does not create a cycle, adds it to the flow network, and routes one ant through it. This builds a minimum spanning tree whose edges carry the maximum possible total flow.",
      "Dijkstra's algorithm with unit weights: each iteration finds the shortest weighted path from source to sink, routes an ant along it, and permanently removes all used edges. Since all capacities are 1, the priority queue degenerates to a simple queue, giving O(V + E) per iteration.",
      "Bellman-Ford relaxation: each iteration relaxes all tunnel edges V-1 times to find an augmenting path, even when some tunnels carry negative residual capacity. This handles reverse-flow edges naturally and guarantees convergence in O(V^2 E) total time across all iterations.",
    ],
    correctIndex: 0,
    explanation:
      "Ford-Fulkerson repeatedly finds augmenting source-to-sink paths, pushes flow along them, and updates residual capacities. Edmonds-Karp uses BFS to pick the shortest path each time, giving O(VE^2). lem-in is essentially this multi-path max-flow problem with unit-capacity tunnels.",
  },
  // ── L4 ──
  {
    slug: "algorithms-l4-pushswap",
    competencyId: "algorithms",
    depthTier: 4,
    sectionHeading: "The Push_swap Problem",
    prompt:
      "You are given a stack of unique integers and an empty second stack. Your only operations are sa, sb, pa, pb, ra, rb, rra, rrb, ss, rr, and rrr. The goal is to end with stack A sorted and stack B empty. What defines the difficulty of this problem, and what makes a solution good?",
    options: [
      "The difficulty is that you have no random access — only stack-top operations and rotations. You cannot compare or move arbitrary elements directly. A good solution minimizes the total operation count; for 500 numbers, a competitive solution uses fewer than 5,500 moves.",
      "The difficulty is that both stacks have a fixed maximum capacity, so you must sort without ever letting either stack exceed half the total number of elements. A good solution balances the load evenly between stacks to avoid overflow at every step.",
      "The difficulty is that each operation's cost is proportional to the current stack depth, so deeper stacks make every move more expensive. A good solution minimizes total execution time by keeping both stacks as shallow as possible throughout the entire sort.",
      "The difficulty is that the integers must be sorted entirely within stack A without using stack B at all. Stack B exists only as a comparison buffer for deciding which rotation to apply. A good solution never executes pa or pb, relying solely on rotations and swaps.",
    ],
    correctIndex: 0,
    explanation:
      "push_swap is a constrained optimization problem: sort using only the allowed stack operations, minimizing total moves. No random access or direct comparison of non-top elements is possible. The standard scoring targets are roughly < 700 for 100 numbers and < 5,500 for 500.",
  },
  {
    slug: "algorithms-l4-chunk",
    competencyId: "algorithms",
    depthTier: 4,
    sectionHeading: "Chunk-Based Sorting for Push_swap",
    prompt:
      "Before applying chunk-based sorting in push_swap, you replace each input value with its rank (position in the sorted order, 0 to n-1). A colleague asks why this normalization step is necessary when you could just work with the raw values. What advantage do ranks provide?",
    options: [
      "Ranks create a uniform 0..n-1 range, making chunk boundaries trivial to compute — just divide the range into equal-sized intervals. Raw values might be clustered, sparse, or negative, so fixed-size chunk ranges would contain wildly uneven numbers of elements.",
      "Ranks compress values into a byte-sized range, reducing the memory footprint of each stack element. Since push_swap operates under memory constraints, fitting each rank in 8 bits instead of 32 speeds up every comparison and rotation operation significantly.",
      "Ranks eliminate the need for comparisons entirely — you can use an element's rank as its final array index. This transforms the sorting problem into a permutation-cycling problem that can be solved in exactly n operations, bypassing chunk logic altogether.",
      "Ranks guarantee that the input contains no duplicate values, which is a prerequisite for push_swap to terminate correctly. Without normalization, two equal values would cause the algorithm to loop indefinitely because it cannot determine their relative order.",
    ],
    correctIndex: 0,
    explanation:
      "Normalizing to ranks 0..n-1 lets you partition elements into equal-size chunks by simple range checks (e.g. rank < chunk_size, rank < 2*chunk_size, etc.), regardless of the original value distribution. It also simplifies the decision logic for choosing push vs. rotate at each step.",
  },
  {
    slug: "algorithms-l4-radix",
    competencyId: "algorithms",
    depthTier: 4,
    sectionHeading: "Radix Sort Approach",
    prompt:
      "For push_swap with 500 numbers (ranked 0-499, needing 9 bits), you consider a bitwise radix approach: for each bit position, push elements with that bit set to stack B, then rotate the rest in A. Roughly how many operations does this produce, and how does it compare to a tuned chunk sort?",
    options: [
      "About 9,000 operations — each of the 9 bit-passes does roughly 2n moves (half the elements are pushed to B and pulled back). It is simple and predictable, but a well-tuned chunk sort can achieve around 5,000-5,500 moves, making radix non-competitive for top scores.",
      "About 4,500 operations — each bit-pass processes n/2 elements on average, and 9 passes give 9 times n/2 total moves. This approaches the information-theoretic minimum for comparison-based sorting of 500 elements and is very difficult for chunk methods to beat.",
      "About 250 operations — radix sort processes 500/9 elements per pass since each pass fully sorts one ninth of the input. This makes it the fastest known strategy for push_swap at the 500-element scale, with no known chunk-based method that comes close.",
      "About 500 operations — exactly one per element. Radix sort places each element at its correct final position in a single pass by interleaving push and rotate operations. This O(n) performance with a constant factor of 1 is unbeatable by any chunk-based approach.",
    ],
    correctIndex: 0,
    explanation:
      "The bitwise radix approach processes each of ~9 bits, doing ~2n moves per pass (push matching elements to B, then pull them back): roughly 500 * 9 * 2 = 9,000 operations. It is simple to implement with a predictable count, but chunk-based sorting achieves significantly fewer moves (~5,000-5,500).",
  },
  {
    slug: "algorithms-l4-bbst",
    competencyId: "algorithms",
    depthTier: 4,
    sectionHeading: "Balanced Binary Search Trees",
    prompt:
      "A web server stores active sessions in a plain binary search tree keyed by session ID. An attacker notices that session IDs are assigned sequentially and creates sessions in ascending order. Response time degrades from milliseconds to seconds. What is happening, and how should the server defend itself?",
    options: [
      "Sequential insertions degenerate the BST into a linked list, turning every O(log n) lookup into O(n). A self-balancing BST (AVL or red-black tree) rebalances after each insertion to guarantee O(log n) depth regardless of insertion order — the same structure backing std::map and the Linux kernel's VMA tree.",
      "Sequential insertions cause each new node to be placed at the root (since BSTs always insert at the root for speed), pushing all existing nodes into a single right subtree. Randomizing the root position after each insertion via a splay operation restores O(log n) amortized performance.",
      "The BST's key-comparison function runs in O(n) on sequential keys because it verifies that each new key is strictly greater than all existing keys. Using a hash of the session ID as the tree key reduces each comparison to O(1), restoring overall O(n log n) insertion cost.",
      "Sequential IDs trigger excessive rotation operations even though the tree is not degenerate — the balance detector flags every insertion as unbalanced. Increasing the acceptable imbalance threshold from 1 to 4 levels reduces rotation overhead and restores O(log n) amortized performance.",
    ],
    correctIndex: 0,
    explanation:
      "Inserting sorted keys into a plain BST builds a chain (linked list), degrading every operation to O(n). An attacker controlling insertion order can trigger this deliberately as a DoS. AVL trees (strict balance) and red-black trees (relaxed balance) rebalance automatically to guarantee O(log n) height.",
  },
  {
    slug: "algorithms-l4-heap",
    competencyId: "algorithms",
    depthTier: 4,
    sectionHeading: "Heap Data Structure and Priority Queues",
    prompt:
      "Your intrusion-detection system always processes the highest-severity alert next. You implement a binary max-heap for the alert queue: insertion and extract-max both run in O(log n). A colleague wants to add a 'find alert by ID' feature. Why does the heap make this difficult?",
    options: [
      "The heap guarantees only the parent-child ordering (each parent >= children), not a left-right search order among siblings. Finding a specific alert ID requires scanning every element — O(n) — because there is no structural shortcut to narrow the search the way a BST's left-right ordering does.",
      "The heap stores alerts in insertion order within each priority tier, and finding an ID means searching all alerts at the same priority level. If priorities are unique, each tier has one element, and lookup degrades gracefully to O(log n) by walking down from the root.",
      "The heap organizes alerts into separate chained buckets per priority level, and alert IDs are scattered randomly across buckets. Finding a specific ID requires iterating through the bucket at that alert's priority level, averaging O(n/k) for k distinct priority values.",
      "The heap is stored as a sorted array with the maximum at index 0. Binary search on this array would give O(log n) ID lookup, but the sift operations during insertion temporarily break the sort order, making binary search unreliable until the next extract-max restores the invariant.",
    ],
    correctIndex: 0,
    explanation:
      "A binary heap enforces only the heap property (parent >= children in a max-heap), not a total search order. Siblings are unordered, so locating an arbitrary element requires O(n) scanning. This is why heaps power priority queues (fast min/max access) but not general lookup — balanced BSTs give O(log n) search for arbitrary keys.",
  },
  {
    slug: "algorithms-l4-greedy",
    competencyId: "algorithms",
    depthTier: 4,
    sectionHeading: "Greedy Algorithms",
    prompt:
      "You are scheduling non-overlapping security scans on a single server. Each scan has a start time and finish time. You sort scans by finish time and greedily pick the earliest-finishing scan that does not conflict with the last selected one. A colleague asks: how do you know this greedy strategy gives the maximum number of scans?",
    options: [
      "The activity-selection problem has the greedy-choice property: picking the earliest-finishing compatible activity always leaves the maximum room for remaining activities. Combined with optimal substructure (the remaining problem is a smaller instance of the same problem), this guarantees the greedy solution equals the global optimum.",
      "The greedy approach works because sorting by finish time is equivalent to solving a one-dimensional dynamic programming problem. The sort implicitly fills the DP table in the correct order, so the greedy picks match the DP's optimal substructure choices exactly.",
      "The greedy approach is only an approximation — it guarantees at most twice the optimal number of scans but may miss the true maximum. Proving exact optimality requires evaluating all 2^n subsets of scans, which is NP-hard for arbitrary scheduling inputs.",
      "The greedy approach works because it reduces the scheduling problem to finding a minimum spanning tree on a conflict graph, where edges represent time overlaps between scans. Kruskal's algorithm on this graph produces the same independent set as the greedy finish-time strategy.",
    ],
    correctIndex: 0,
    explanation:
      "A greedy algorithm reaches the global optimum only when the problem has the greedy-choice property (a locally optimal choice leads to a globally optimal solution) and optimal substructure. Activity selection (sort by finish time, pick greedily) provably satisfies both. Many other problems (e.g. 0-1 knapsack) do not.",
  },
  {
    slug: "algorithms-l4-amortised",
    competencyId: "algorithms",
    depthTier: 4,
    sectionHeading: "Amortised Analysis and Real-World Complexity",
    prompt:
      "Your C++ std::vector processes network packets by appending each one. The vector doubles its capacity when full. Most appends are instant, but occasionally the program stalls briefly when a resize copies all existing elements. An attacker tries to time their packets to always trigger a resize. What is the amortised cost per append, and why does the stall still matter?",
    options: [
      "O(1) amortised — the occasional O(n) resize is spread over n cheap appends, so the average is constant. But the worst-case O(n) spike is real and predictable: an attacker who knows the current capacity can time a burst to force a resize, causing a latency-based denial of service.",
      "O(log n) amortised — each doubling adds log n cost because the number of doublings grows logarithmically with total appends. The attacker exploits this by sending log n packets in rapid succession, each triggering a separate resize that compounds the delay multiplicatively.",
      "O(n) amortised — every append copies the entire vector to a new location, and doubling the capacity only reduces how frequently this happens by half. The attacker exploits this by sending large packets that increase the per-element copy cost, amplifying each resize.",
      "O(1) amortised — the resize happens only once during the vector's lifetime, after which it reserves capacity for the maximum possible input. The security risk is not the resize itself but the initial over-allocation, which can exhaust memory and trigger an out-of-memory crash.",
    ],
    correctIndex: 0,
    explanation:
      "Doubling ensures that total copying across n appends is O(n), so each append is O(1) amortised. However, a single append CAN cost O(n) when it triggers a resize — and an attacker who can predict (or influence) the vector's capacity can exploit that worst-case spike for denial of service.",
  },
  {
    slug: "algorithms-l4-bloom",
    competencyId: "algorithms",
    depthTier: 4,
    sectionHeading: "Bloom filters",
    prompt:
      "Your browser checks every URL you visit against a list of 10 million known-malicious URLs. Downloading the full list is impractical, so you store a compact probabilistic structure locally. When you query a URL, the structure says 'probably malicious' or 'definitely safe.' Which structure is this, and what error mode does it have?",
    options: [
      "A Bloom filter — k hash functions set bits in a bit array for each known URL. Querying checks the same k positions: if any bit is zero the URL is definitely safe; if all are set it is probably malicious. False positives (clean URLs flagged) are possible, but false negatives (malicious URLs missed) never occur.",
      "A cuckoo filter — it stores a fingerprint of each URL in one of two candidate buckets. A fingerprint match means the URL is definitely malicious; no match means it is probably safe. False negatives (some malicious URLs missed) are possible, but false positives (clean URLs flagged) never occur.",
      "A count-min sketch — it maintains k counters per URL, incremented when a malicious URL is added. Querying returns the minimum counter: zero means definitely safe; nonzero gives the exact number of times the URL appeared in the list, with no false positives or false negatives.",
      "A HyperLogLog sketch — it hashes each malicious URL and tracks the maximum number of leading zeros observed. Querying a new URL checks whether its leading-zero count falls within the observed range: inside means probably malicious; outside means definitely safe, with no false positives.",
    ],
    correctIndex: 0,
    explanation:
      "A Bloom filter uses k hash functions and a bit array. Insertions set k bits; queries check k bits. A zero bit means definite absence (no false negatives); all bits set means probable presence (possible false positives from hash collisions). It powers safe-browsing URL checks, spam filtering, and malware prefiltering.",
  },
  // ── L5 ──
  {
    slug: "algorithms-l5-classes",
    competencyId: "algorithms",
    depthTier: 5,
    sectionHeading: "Computational Complexity Classes",
    prompt:
      "A security researcher claims that a new intrusion-detection problem is NP-complete. If true, this has major implications for building exact solvers. What specifically does NP-completeness mean, and why does the claim matter for practical system design?",
    options: [
      "The problem is in NP (a proposed solution can be verified in polynomial time) and is among the hardest in NP — every NP problem reduces to it in polynomial time. No known polynomial algorithm solves it exactly, so the researcher must rely on heuristics or approximations.",
      "The problem requires exponential time to verify a proposed solution, placing it beyond NP in the EXPTIME class. Even checking whether a candidate answer is correct takes impractical time, ruling out both exact solvers and efficient approximation algorithms for all input sizes.",
      "The problem can be solved in polynomial time on a non-deterministic machine but requires exponential time on deterministic hardware. Since all real computers are deterministic, the distinction is purely theoretical and has no practical impact on solver design or system performance.",
      "The problem is provably unsolvable — no algorithm of any complexity class can produce a correct answer for all possible inputs. The researcher must restrict the problem to specific input structures where a tractable sub-problem can be identified and solved independently.",
    ],
    correctIndex: 0,
    explanation:
      "NP-complete problems are the hardest problems in NP: if any one of them has a polynomial-time algorithm, then P = NP and all NP problems do. Since no such algorithm is known, NP-completeness tells the researcher to expect exponential worst-case runtime and to use heuristics, approximations, or restricted formulations.",
  },
  {
    slug: "algorithms-l5-reductions",
    competencyId: "algorithms",
    depthTier: 5,
    sectionHeading: "Reductions and NP-Completeness Proofs",
    prompt:
      "You have developed a new network-vulnerability-assessment problem X and believe it is NP-complete. Your advisor asks you to prove the claim formally. What two things must you demonstrate, and in which direction does the reduction go?",
    options: [
      "First, show X is in NP by demonstrating that a proposed solution can be verified in polynomial time. Second, take a known NP-complete problem (e.g. SAT) and construct a polynomial-time reduction FROM that problem TO X, proving that X is at least as hard as the known hard problem.",
      "First, show X is in NP by demonstrating that a brute-force solver runs in at most exponential time. Second, construct a polynomial-time reduction FROM X TO a known NP-complete problem, proving that X is no harder than the known hard problem and therefore also in NP-complete.",
      "First, show X is in P by finding a polynomial-time algorithm for small instances. Second, demonstrate that the algorithm's complexity grows super-polynomially for large inputs by exhibiting a family of hard instances, establishing NP-completeness through empirical scaling analysis.",
      "First, show X is in co-NP by demonstrating that negative instances (no vulnerability found) can be verified in polynomial time. Second, reduce X to the halting problem in polynomial time, proving that X is at least as hard as the hardest decidable problems in computer science.",
    ],
    correctIndex: 0,
    explanation:
      "NP-completeness requires two proofs: (1) X is in NP (solutions are poly-time verifiable), and (2) a known NP-complete problem (SAT, 3-SAT, vertex cover, etc.) reduces to X in polynomial time — showing X is at least as hard. The reduction goes FROM the known hard problem TO your new problem.",
  },
  {
    slug: "algorithms-l5-cryptanalysis",
    competencyId: "algorithms",
    depthTier: 5,
    sectionHeading: "Algorithmic Attacks on Cryptographic Primitives",
    prompt:
      "You are designing a hash function with an n-bit output and claim it provides n bits of collision resistance. A cryptographer corrects you: the effective collision resistance is only about n/2 bits. What attack model justifies this, and what are the implications for choosing output lengths?",
    options: [
      "The birthday attack: by hashing roughly 2^(n/2) random inputs, the probability of finding two that collide exceeds 50%. This is why SHA-256 (256-bit output) offers only ~128-bit collision resistance, and why SHA-1's 160-bit output eventually fell to practical collision-finding attacks.",
      "The meet-in-the-middle attack: by splitting the hash computation into two halves and searching for a match in the middle, an attacker finds collisions in 2^(n/2) time. This halving only applies to Feistel-network-based hashes, not sponge constructions like SHA-3.",
      "The length-extension attack: given a hash H(m), an attacker can compute H(m || m') without knowing m, effectively halving the output's entropy contribution. This reduces collision resistance to n/2 bits because the attacker controls the second half of the input to the final compression function.",
      "Pollard's rho cycle-finding algorithm: it walks the hash output space and detects collisions in 2^(n/2) time using O(1) memory. However, this applies only to hash functions with weak diffusion properties — strong constructions like SHA-256 resist rho-based attacks and retain the full n-bit collision resistance.",
    ],
    correctIndex: 0,
    explanation:
      "The birthday paradox means a collision among random n-bit values appears after ~2^(n/2) samples. This is information-theoretic — it applies to ALL hash functions regardless of construction. SHA-256 gives ~128-bit collision resistance; SHA-1 (160-bit) gives ~80 bits, which eventually became practical to attack.",
  },
  {
    slug: "algorithms-l5-hashdos",
    competencyId: "algorithms",
    depthTier: 5,
    sectionHeading: "Algorithmic Complexity Attacks (HashDoS)",
    prompt:
      "A 2011 disclosure revealed that web frameworks using deterministic hash functions (e.g. MurmurHash with a fixed seed) in their parameter parsing were vulnerable to a devastating DoS. An attacker could bring down a server with a single crafted HTTP request. How did the attack work, and what class of fix was deployed?",
    options: [
      "The attacker pre-computed thousands of parameter names that all hashed to the same bucket, making each O(1) hash-table operation degrade to O(n). Parsing one request with n colliding keys cost O(n^2) total CPU. The fix was randomised hashing (e.g. SipHash with a per-process random seed) to make collision sets unpredictable.",
      "The attacker sent parameter names whose hash values straddled the load-factor threshold, causing the table to resize on every insertion. Each resize copied and rehashed all existing entries, consuming O(n^2) total memory allocations. The fix was to cap the table size and reject requests exceeding 1,000 parameters.",
      "The attacker sent parameter names containing null bytes, which caused the hash function to treat every name as the empty string. All parameters collapsed to the same key, overwriting each other and corrupting the request object. The fix was length-prefixed string handling in the hash function.",
      "The attacker sent extremely long parameter names (megabytes each) that made the hash function itself slow — MurmurHash is O(k) in key length, so hashing each key consumed excessive CPU independently of collisions. The fix was to truncate parameter names to 256 bytes before hashing.",
    ],
    correctIndex: 0,
    explanation:
      "With a predictable hash, an attacker crafts keys that all collide in one bucket. Each of n insertions walks the entire chain: O(n) per insert, O(n^2) total — a denial of service from a single request. SipHash (a keyed PRF) with a per-process random seed makes the collision set unpredictable, neutralising the attack.",
  },
  {
    slug: "algorithms-l5-approx",
    competencyId: "algorithms",
    depthTier: 5,
    sectionHeading: "Approximation Algorithms and Heuristics",
    prompt:
      "You need to select the smallest set of IDS rules that covers all known attack signatures — a set-cover problem, which is NP-hard. A colleague proposes a greedy algorithm: repeatedly pick the rule covering the most uncovered signatures. How good is this greedy solution compared to the true optimum?",
    options: [
      "The greedy set-cover algorithm achieves an O(ln n)-approximation — its solution uses at most ln(n) + 1 times as many rules as the optimum, where n is the number of signatures. This ratio is provably the best achievable in polynomial time unless P = NP, making greedy the practical standard.",
      "The greedy algorithm achieves a 2-approximation — it uses at most twice as many rules as the optimum. This matches the vertex-cover guarantee and holds because each greedy step covers at least half the remaining uncovered signatures, halving the residual set at every iteration.",
      "The greedy algorithm provides no provable approximation guarantee — its ratio to the optimum depends entirely on the structure of the input and can be arbitrarily bad. The only rigorous bound comes from solving the LP relaxation and rounding the fractional solution deterministically.",
      "The greedy algorithm finds the exact optimum in O(n^2) time because the set-cover problem, despite being NP-hard in the decision version, becomes polynomial when solved constructively via the greedy heuristic. The NP-hardness result applies only to the decision ('does a cover of size k exist?') form.",
    ],
    correctIndex: 0,
    explanation:
      "The greedy set-cover algorithm has a proven O(ln n) approximation ratio — the solution is at most ln(n) + 1 times the optimum. This is tight: no polynomial algorithm can do better than (1 - epsilon) * ln(n) unless P = NP. The 2-approximation applies to vertex cover, not set cover.",
  },
  {
    slug: "algorithms-l5-randomised",
    competencyId: "algorithms",
    depthTier: 5,
    sectionHeading: "Randomised Algorithms",
    prompt:
      "During TLS key generation, your system uses the Miller-Rabin test to check whether a randomly chosen large number is prime. The test may declare a composite number 'probably prime' with small probability, but it never calls a prime number composite. What category of randomised algorithm is Miller-Rabin, and how does it differ from the other main category?",
    options: [
      "Miller-Rabin is Monte Carlo: it always finishes in bounded polynomial time but may give a wrong answer (false 'prime') with controllable probability. A Las Vegas algorithm (e.g. randomised quicksort) is always correct but has variable, unpredictable running time depending on random choices.",
      "Miller-Rabin is Las Vegas: it always gives the correct primality verdict but its running time varies depending on which random witnesses it selects. A Monte Carlo algorithm (e.g. Rabin-Karp string matching) runs in fixed time but may occasionally return a false match.",
      "Miller-Rabin is an Atlantic City algorithm: it gives the correct answer with probability at least 3/4 per round and runs in expected polynomial time. This is a hybrid category between Monte Carlo (fixed time, possible errors) and Las Vegas (always correct, variable time).",
      "Miller-Rabin is a Sherwood algorithm: it uses randomisation not for correctness but to eliminate adversarial worst-case inputs. Without randomisation the primality test would be correct on all inputs but vulnerable to crafted composites; the random witnesses make worst-case inputs impossible.",
    ],
    correctIndex: 0,
    explanation:
      "Monte Carlo algorithms trade correctness for bounded time: Miller-Rabin may falsely call a composite 'prime' (with probability < 4^(-k) after k rounds) but always terminates quickly. Las Vegas algorithms (like randomised quicksort) are always correct but have random running time. TLS key generation runs enough Miller-Rabin rounds to make error probability negligible.",
  },
  {
    slug: "algorithms-l5-quantum",
    competencyId: "algorithms",
    depthTier: 5,
    sectionHeading: "Quantum Algorithms and Post-Quantum Cryptography",
    prompt:
      "Your organisation is planning a cryptographic migration to prepare for quantum computers. Shor's and Grover's algorithms pose different threats to different primitives. Your CISO asks: which current algorithms are broken outright, which are merely weakened, and what should replace them?",
    options: [
      "Shor's algorithm factors integers and solves discrete logarithms in polynomial time, completely breaking RSA, DH, and ECC. Grover's gives a quadratic speedup on brute-force search, halving effective symmetric key strength (AES-128 drops to ~64-bit security). NIST's replacements are lattice-based (ML-KEM, ML-DSA) and hash-based (SLH-DSA) schemes.",
      "Shor's algorithm breaks all symmetric ciphers by finding their key schedules in polynomial time, making AES and ChaCha20 obsolete at any key length. Grover's weakens public-key cryptography by reducing the discrete-log problem from exponential to sub-exponential. Replacements are code-based schemes like McEliece for symmetric encryption.",
      "Both algorithms target hash functions: Shor's finds SHA-256 collisions in polynomial time, and Grover's finds preimages in square-root time. RSA and ECC are unaffected because their security does not depend on hash functions. Replacements are quantum-resistant hashes with doubled output lengths of 512 bits.",
      "Shor's breaks RSA by factoring its modulus but does not affect elliptic-curve cryptography, because the discrete-log problem on elliptic curves has a fundamentally different mathematical structure that resists quantum attacks. Grover's has no impact on AES because its round structure prevents the quantum speedup from applying.",
    ],
    correctIndex: 0,
    explanation:
      "Shor's algorithm solves integer factorisation and discrete logarithms (including elliptic-curve DL) in polynomial time — destroying RSA, DH, and ECC. Grover's quadratic speedup halves symmetric key strength (AES-256 retains ~128-bit quantum security, AES-128 drops to ~64). NIST's post-quantum standards (ML-KEM, ML-DSA, SLH-DSA) are the designated replacements.",
  },
];
