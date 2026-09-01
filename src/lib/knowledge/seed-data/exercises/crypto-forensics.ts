import type { SeedExercise } from "./types";

/** crypto (L0–L5) + forensics (L0–L5) — one MCQ per teaching section. */
export const CRYPTO_FORENSICS_EXERCISES: SeedExercise[] = [
  // ══ crypto L0 ══
  {
    slug: "crypto-l0-what",
    competencyId: "crypto",
    depthTier: 0,
    sectionHeading: "What is cryptography",
    prompt: "Which four properties does cryptography provide?",
    options: [
      "Confidentiality, integrity, authentication, and non-repudiation.",
      "Compression, speed, portability, and readability.",
      "Availability, redundancy, backup, and logging.",
      "Encoding, hashing, salting, and padding.",
    ],
    correctIndex: 0,
    explanation:
      "Confidentiality (only intended readers), integrity (untampered), authentication (verified identity), and non-repudiation (can't deny sending) are the core goals cryptographic tools are designed to deliver.",
  },
  {
    slug: "crypto-l0-sym-asym",
    competencyId: "crypto",
    depthTier: 0,
    sectionHeading: "Symmetric vs asymmetric encryption",
    prompt: "How do real systems (like TLS) combine symmetric and asymmetric crypto?",
    options: [
      "Asymmetric crypto establishes a shared key (key exchange), then fast symmetric crypto encrypts the bulk data.",
      "They encrypt everything twice, once with each.",
      "Symmetric crypto exchanges the key and asymmetric encrypts the data.",
      "They pick one at random per message.",
    ],
    correctIndex: 0,
    explanation:
      "Asymmetric algorithms (RSA, ECC) are slow, so they're used only to agree on a key; the actual data is then encrypted with fast symmetric ciphers (AES, ChaCha20). TLS does exactly this.",
  },
  {
    slug: "crypto-l0-vocab",
    competencyId: "crypto",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt: "What is the purpose of an IV or nonce in encryption?",
    options: [
      "A random value ensuring identical plaintexts produce different ciphertexts.",
      "A secret key shared between sender and receiver.",
      "A checksum appended to detect corruption.",
      "The public half of an asymmetric key pair.",
    ],
    correctIndex: 0,
    explanation:
      "An IV/nonce randomizes encryption so the same plaintext doesn't yield the same ciphertext (which would leak patterns). It is not secret, but for modes like CTR/GCM it must never repeat under the same key.",
  },
  // ══ crypto L1 ══
  {
    slug: "crypto-l1-hash-crack",
    competencyId: "crypto",
    depthTier: 1,
    sectionHeading: "Hash functions and password cracking",
    prompt: "Why are fast hashes like MD5 and SHA-256 unsuitable for storing passwords?",
    options: [
      "They can be brute-forced at billions of guesses per second on GPUs; use bcrypt, scrypt, or Argon2 instead.",
      "They produce outputs that are too short to be unique.",
      "They are reversible, so the password can be decrypted.",
      "They require a secret key that attackers can steal.",
    ],
    correctIndex: 0,
    explanation:
      "General-purpose hashes are designed to be fast, which is exactly what a cracker wants. Password hashes should be deliberately slow and memory-hard (bcrypt/scrypt/Argon2) to throttle guessing.",
  },
  {
    slug: "crypto-l1-encode-encrypt-hash",
    competencyId: "crypto",
    depthTier: 1,
    sectionHeading: "Encoding vs encryption vs hashing",
    prompt: "Which statement correctly distinguishes these operations?",
    options: [
      "Encoding is reversible without a key (Base64), encryption is reversible with a key, hashing is a one-way function.",
      "Encoding needs a key, encryption is one-way, hashing is reversible.",
      "All three are reversible given enough time.",
      "Hashing needs a key; encoding provides confidentiality.",
    ],
    correctIndex: 0,
    explanation:
      "Base64 is just a data representation (no secrecy). Encryption provides confidentiality and needs a key. Hashing is one-way (integrity/fingerprinting). Calling Base64 “encryption” is a classic beginner error.",
  },
  {
    slug: "crypto-l1-classical",
    competencyId: "crypto",
    depthTier: 1,
    sectionHeading: "Classical ciphers",
    prompt: "Why is reusing the key in an XOR cipher fatal?",
    options: [
      "XORing two ciphertexts encrypted with the same key cancels the key, leaving plaintext XOR plaintext to analyze.",
      "It makes the ciphertext longer than the plaintext.",
      "It changes the key length automatically.",
      "It converts the cipher into a hash.",
    ],
    correctIndex: 0,
    explanation:
      "With key reuse, C1 ⊕ C2 = P1 ⊕ P2 (the key drops out), which is often enough to recover both messages. Caesar breaks to frequency analysis; Vigenère to Kasiski examination.",
  },
  // ══ crypto L2 ══
  {
    slug: "crypto-l2-modes",
    competencyId: "crypto",
    depthTier: 2,
    sectionHeading: "Block cipher modes",
    prompt: "Why should ECB mode never be used beyond a single block?",
    options: [
      "Identical plaintext blocks produce identical ciphertext blocks, leaking structure (the “penguin” problem).",
      "It is slower than every other mode.",
      "It cannot decrypt what it encrypts.",
      "It requires a new key for every block.",
    ],
    correctIndex: 0,
    explanation:
      "ECB encrypts each block independently, so patterns survive into the ciphertext. GCM (AEAD) is the modern default — it provides both confidentiality and authentication, but its nonce must never repeat.",
  },
  {
    slug: "crypto-l2-rsa",
    competencyId: "crypto",
    depthTier: 2,
    sectionHeading: "RSA and asymmetric crypto",
    prompt: "Recovering the RSA private exponent d from the public key requires solving what hard problem?",
    options: [
      "Factoring the modulus n back into its primes p and q (to get φ(n)).",
      "Reversing the SHA-256 of the public key.",
      "Guessing the random IV used during encryption.",
      "Computing a discrete logarithm modulo 2.",
    ],
    correctIndex: 0,
    explanation:
      "d = e⁻¹ mod φ(n), and φ(n) needs p and q — so breaking RSA means factoring n. The classic attacks (small-e cube root, common modulus, Fermat, Wiener) each exploit a broken assumption rather than factoring directly.",
  },
  {
    slug: "crypto-l2-tls",
    competencyId: "crypto",
    depthTier: 2,
    sectionHeading: "TLS handshake and certificate validation",
    prompt: "During the TLS handshake, what gives it forward secrecy?",
    options: [
      "Ephemeral key exchange (ECDHE): the temporary keys are discarded, so recorded traffic stays safe even if the server's long-term key later leaks.",
      "Encrypting the certificate with the server's password.",
      "Reusing the same session key for every connection.",
      "Sending the private key inside the Finished message.",
    ],
    correctIndex: 0,
    explanation:
      "ECDHE derives a shared secret from ephemeral keys that are thrown away after the session, so a future compromise of the server's private key can't decrypt past captures. Certificate validation (chain to a trusted root, hostname, expiry) authenticates the server.",
  },
  {
    slug: "crypto-l2-rng",
    competencyId: "crypto",
    depthTier: 2,
    sectionHeading: "Random number generation",
    prompt: "Why must security tokens use secrets.token_hex / os.urandom rather than the `random` module?",
    options: [
      "`random` uses a predictable Mersenne Twister; a CSPRNG is required so tokens, session IDs, and CSRF values can't be predicted.",
      "`random` is too slow for token generation.",
      "`random` produces values that are too short.",
      "There is no difference; both are cryptographically secure.",
    ],
    correctIndex: 0,
    explanation:
      "Predictable PRNG output lets an attacker forge tokens and session IDs. Use a cryptographically secure RNG (os.urandom / secrets), which draws from the kernel CSPRNG.",
  },
  // ══ crypto L3 ══
  {
    slug: "crypto-l3-padding-oracle",
    competencyId: "crypto",
    depthTier: 3,
    sectionHeading: "Padding oracle attacks",
    prompt: "What single piece of information turns CBC decryption into a full plaintext-recovery oracle?",
    options: [
      "Whether the padding is valid after decryption — a one-bit signal the attacker exploits byte by byte.",
      "The server's private key.",
      "The length of the plaintext.",
      "The cipher's block size alone.",
    ],
    correctIndex: 0,
    explanation:
      "By manipulating the previous ciphertext block and observing valid/invalid padding, the attacker recovers the intermediate decryption and thus each plaintext byte — no key needed. AEAD modes (GCM) authenticate before decrypting, blocking this.",
  },
  {
    slug: "crypto-l3-length-extension",
    competencyId: "crypto",
    depthTier: 3,
    sectionHeading: "Hash length extension attacks",
    prompt: "Why is MAC = SHA256(secret || message) vulnerable to length extension?",
    options: [
      "The digest is the hash's final internal state, so an attacker can resume hashing and append data without knowing the secret.",
      "SHA-256 is reversible given the output.",
      "The secret is transmitted alongside the MAC.",
      "SHA-256 collisions are trivial to find.",
    ],
    correctIndex: 0,
    explanation:
      "Merkle-Damgård hashes output their internal state verbatim, so you can load it back and keep hashing more data as if continuing the original. Use HMAC (which nests the key) or SHA-3 (a sponge) instead.",
  },
  {
    slug: "crypto-l3-timing",
    competencyId: "crypto",
    depthTier: 3,
    sectionHeading: "Timing attacks on crypto",
    prompt: "Why must MAC/password comparison use a constant-time function like hmac.compare_digest?",
    options: [
      "A byte-by-byte compare that returns early leaks how many bytes matched via timing, letting an attacker recover the secret.",
      "It is faster than a normal comparison.",
      "It prevents the strings from being logged.",
      "Normal comparison cannot handle binary data.",
    ],
    correctIndex: 0,
    explanation:
      "Early-exit comparison takes longer the more leading bytes match, a timing side channel. Constant-time comparison always inspects all bytes, giving no timing signal — essential for any secret-dependent check.",
  },
  {
    slug: "crypto-l3-ecc",
    competencyId: "crypto",
    depthTier: 3,
    sectionHeading: "Elliptic curve cryptography attacks",
    prompt: "What underlying hard problem do ECC attacks like Pohlig-Hellman try to sidestep?",
    options: [
      "The Elliptic-Curve Discrete Logarithm Problem (ECDLP) — by moving the computation onto a weaker subgroup or curve.",
      "Integer factorization of the modulus.",
      "Finding a hash collision.",
      "Reversing the AES S-box.",
    ],
    correctIndex: 0,
    explanation:
      "ECC security rests on the ECDLP (recovering k from Q = k·G). Invalid-curve, small-subgroup, twist, and Pohlig-Hellman attacks all exploit small factors in the group order to solve the log in easy pieces — which is why secure curves use (near-)prime order.",
  },
  // ══ crypto L4 ══
  {
    slug: "crypto-l4-sidechannel",
    competencyId: "crypto",
    depthTier: 4,
    sectionHeading: "Side-channel attacks on cryptographic implementations",
    prompt: "How does a cache-timing attack (Flush+Reload) recover AES key material?",
    options: [
      "By measuring which memory lines the cipher's table lookups touched, inferring key-dependent access patterns.",
      "By reading the key directly from the CPU registers.",
      "By brute-forcing the key faster on the GPU.",
      "By intercepting the key over the network.",
    ],
    correctIndex: 0,
    explanation:
      "Table-based AES leaks key-dependent memory access through the cache; measuring access times reveals which lines were used. Constant-time code, blinding, and AES-NI hardware instructions (no table lookups) mitigate it.",
  },
  {
    slug: "crypto-l4-hash-cracking",
    competencyId: "crypto",
    depthTier: 4,
    sectionHeading: "Advanced hash cracking techniques",
    prompt: "Why are rule-based and mask attacks more effective than pure brute force?",
    options: [
      "They exploit how humans actually build passwords (word + digits, capitalization patterns), searching likely candidates first.",
      "They can reverse the hash function directly.",
      "They require no wordlist at all.",
      "They only work on unsalted hashes.",
    ],
    correctIndex: 0,
    explanation:
      "Rules mutate dictionary words the way people do (Password → P@ssw0rd1), and masks target known structures (?u?l?l?l?d?d?d?d). This concentrates effort on probable passwords rather than the whole keyspace.",
  },
  {
    slug: "crypto-l4-protocol",
    competencyId: "crypto",
    depthTier: 4,
    sectionHeading: "Protocol-level crypto attacks",
    prompt: "What do attacks like DROWN and Logjam have in common?",
    options: [
      "They exploit support for weak/legacy options (SSLv2, export-grade DH) to break otherwise-modern connections — so disable legacy protocols.",
      "They require physical access to the server.",
      "They rely on a flaw in AES itself.",
      "They only affect symmetric encryption.",
    ],
    correctIndex: 0,
    explanation:
      "Protocol-level attacks target negotiation and legacy support rather than the core primitive: DROWN abuses SSLv2, Logjam downgrades to 512-bit DH. Disabling legacy protocols, using ECDHE, and TLS 1.3 remove the vulnerable options.",
  },
  // ══ crypto L5 ══
  {
    slug: "crypto-l5-aes",
    competencyId: "crypto",
    depthTier: 5,
    sectionHeading: "AES internals",
    prompt: "Which AES step provides diffusion by mixing bytes within each column?",
    options: [
      "MixColumns (a matrix multiplication in GF(2^8)).",
      "SubBytes (the S-box substitution).",
      "AddRoundKey (XOR with the round key).",
      "ShiftRows (cyclic row shifts).",
    ],
    correctIndex: 0,
    explanation:
      "AES rounds are SubBytes (non-linear confusion), ShiftRows and MixColumns (diffusion), and AddRoundKey. MixColumns spreads each byte's influence across the column. AES-NI performs a whole round in one instruction and dodges cache-timing leaks.",
  },
  {
    slug: "crypto-l5-pqc",
    competencyId: "crypto",
    depthTier: 5,
    sectionHeading: "Post-quantum cryptography",
    prompt: "Which cryptography does a large quantum computer running Shor's algorithm break?",
    options: [
      "Asymmetric schemes (RSA, ECC/ECDSA); symmetric ciphers only lose half their key strength to Grover's algorithm.",
      "Only symmetric ciphers like AES.",
      "Only hash functions like SHA-256.",
      "Nothing — quantum computers can't break any modern crypto.",
    ],
    correctIndex: 0,
    explanation:
      "Shor's algorithm factors and solves discrete logs in polynomial time, killing RSA/ECC — replace with ML-KEM (Kyber) and ML-DSA (Dilithium). Grover only quadratically speeds search, so AES-256 stays adequate.",
  },
  {
    slug: "crypto-l5-zkp",
    competencyId: "crypto",
    depthTier: 5,
    sectionHeading: "Zero-knowledge proofs and advanced protocols",
    prompt: "What does a zero-knowledge proof let you do?",
    options: [
      "Prove a statement is true without revealing any information beyond its truth (e.g. prove age > 18 without revealing the birth date).",
      "Encrypt data so that no one, including the owner, can read it.",
      "Compress a proof to a single bit with no assumptions.",
      "Sign a message using someone else's private key.",
    ],
    correctIndex: 0,
    explanation:
      "ZKPs (zk-SNARKs, zk-STARKs, Bulletproofs) convince a verifier of a fact while leaking nothing else — used for private authentication, selective disclosure, and verifiable computation.",
  },
  // ══ forensics L0 ══
  {
    slug: "forensics-l0-what",
    competencyId: "forensics",
    depthTier: 0,
    sectionHeading: "What is digital forensics",
    prompt: "What is the key principle that makes digital evidence defensible?",
    options: [
      "Maintaining the chain of custody so the evidence's integrity can be proven.",
      "Encrypting the evidence with the investigator's key.",
      "Deleting the original after imaging it.",
      "Analyzing evidence only on the live system.",
    ],
    correctIndex: 0,
    explanation:
      "Forensics collects, preserves, analyzes, and presents evidence; documenting how it was handled (chain of custody) is what lets you prove it wasn't altered. It spans disk images, memory, network captures, mobile, and cloud.",
  },
  {
    slug: "forensics-l0-why",
    competencyId: "forensics",
    depthTier: 0,
    sectionHeading: "Why forensics matters for security",
    prompt: "In incident response, what is forensics primarily used to determine?",
    options: [
      "The scope and impact of a breach — what happened and how.",
      "The market value of the compromised company.",
      "Which antivirus vendor to purchase.",
      "The physical temperature of the servers.",
    ],
    correctIndex: 0,
    explanation:
      "Forensics reconstructs an incident to scope its impact, understand attacker techniques, support legal proceedings, and feed threat intelligence — and it's a major CTF category.",
  },
  {
    slug: "forensics-l0-vocab",
    competencyId: "forensics",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt: "What does the “order of volatility” tell an investigator to collect first?",
    options: [
      "The most volatile evidence first (RAM and running processes) before it disappears, then disk and logs.",
      "The largest files first to save time.",
      "Disk images before memory, since disk is bigger.",
      "Logs first because they are human-readable.",
    ],
    correctIndex: 0,
    explanation:
      "Volatile data (RAM, live processes, network state) vanishes on power-off, so it's captured before disk and logs. An artifact is any trace of activity (log entry, registry key, timestamp) used to build a timeline.",
  },
  // ══ forensics L1 ══
  {
    slug: "forensics-l1-file-analysis",
    competencyId: "forensics",
    depthTier: 1,
    sectionHeading: "File analysis fundamentals",
    prompt: "Why identify a file with `file` (magic bytes) rather than its extension?",
    options: [
      "The real type is determined by the file's signature/magic bytes, which the extension can misrepresent.",
      "Extensions are always removed by forensic tools.",
      "The `file` command decrypts the file.",
      "Magic bytes reveal the file's owner.",
    ],
    correctIndex: 0,
    explanation:
      "Attackers rename files to hide them, but the leading magic bytes (e.g. %PDF, PK.. for ZIP, 7F 45 4C 46 for ELF) reveal the true format. exiftool and strings extract further metadata and embedded text.",
  },
  {
    slug: "forensics-l1-stego",
    competencyId: "forensics",
    depthTier: 1,
    sectionHeading: "Steganography basics",
    prompt: "How does LSB image steganography hide data invisibly?",
    options: [
      "It stores one secret bit in the least significant bit of each pixel channel, changing the color by at most 1/256.",
      "It shrinks the image to fit the message inside.",
      "It encrypts the whole image with a password.",
      "It appends the data after the file's end marker only.",
    ],
    correctIndex: 0,
    explanation:
      "Flipping the lowest bit of a channel is imperceptible, so a large image can carry hundreds of KB (zsteg reads those bit-planes). A separate technique appends data after a format's end marker — which binwalk detects.",
  },
  {
    slug: "forensics-l1-logs",
    competencyId: "forensics",
    depthTier: 1,
    sectionHeading: "Log analysis",
    prompt: "Which Windows Security event IDs correspond to failed and successful logons?",
    options: [
      "4625 for failed logons and 4624 for successful logons.",
      "1102 for failed and 4688 for successful.",
      "5140 for both.",
      "There are no event IDs for logons.",
    ],
    correctIndex: 0,
    explanation:
      "4625 (failed) and 4624 (successful) logons are staples of authentication analysis; on Linux the equivalents live in /var/log/auth.log. Aggregating failed attempts by source IP surfaces brute-force activity.",
  },
  // ══ forensics L2 ══
  {
    slug: "forensics-l2-disk",
    competencyId: "forensics",
    depthTier: 2,
    sectionHeading: "Disk forensics with Autopsy and Sleuth Kit",
    prompt: "Why do you analyze a bit-for-bit image and hash it, rather than the original disk?",
    options: [
      "To preserve the original evidence and prove, via the hash, that the copy is identical and unaltered during analysis.",
      "Because Sleuth Kit cannot read physical disks.",
      "Because imaging encrypts the data for safety.",
      "To make the analysis run faster.",
    ],
    correctIndex: 0,
    explanation:
      "Working on a hashed image keeps the source untouched and defensible. Sleuth Kit then walks the layers — mmls (partitions), fls (files, incl. deleted), icat (extract by inode) — using the partition offset.",
  },
  {
    slug: "forensics-l2-memory",
    competencyId: "forensics",
    depthTier: 2,
    sectionHeading: "Memory forensics with Volatility",
    prompt: "Why does Volatility offer both pslist and psscan for listing processes?",
    options: [
      "pslist walks the kernel's process linked list; psscan scans raw memory for process objects, catching ones a rootkit unlinked to hide.",
      "pslist is for Windows and psscan is for Linux.",
      "psscan is simply a faster version of pslist.",
      "One lists threads and the other lists processes.",
    ],
    correctIndex: 0,
    explanation:
      "A rootkit can unlink its EPROCESS from the active list (DKOM) to evade pslist; psscan finds it by signature-scanning memory. Diffing the two exposes hidden processes — which is why memory (holding keys, injected code, live connections) is captured live.",
  },
  {
    slug: "forensics-l2-network",
    competencyId: "forensics",
    depthTier: 2,
    sectionHeading: "Network forensics",
    prompt: "What signal in a pcap suggests DNS tunneling / data exfiltration?",
    options: [
      "Abnormally long DNS query labels, which encode data inside the subdomain name.",
      "Any use of UDP port 53.",
      "TLS-encrypted HTTPS traffic.",
      "A high number of successful TCP handshakes.",
    ],
    correctIndex: 0,
    explanation:
      "DNS tunneling hides payload in oversized query names (e.g. base64.tunnel.evil.com), so unusually long labels are a red flag. Cleartext protocols (HTTP/FTP) also leak credentials that tshark can extract.",
  },
  {
    slug: "forensics-l2-carving",
    competencyId: "forensics",
    depthTier: 2,
    sectionHeading: "File carving and recovery",
    prompt: "How does file carving recover deleted files even when filesystem metadata is gone?",
    options: [
      "It scans raw bytes for known header/footer signatures, reconstructing files independent of the filesystem.",
      "It reads the recycle bin's index.",
      "It queries the filesystem journal for the deletions.",
      "It restores files from the operating system's backups.",
    ],
    correctIndex: 0,
    explanation:
      "Tools like foremost/photorec/scalpel recognize file signatures in unallocated space, so they recover data from formatted or damaged drives where the MFT/inode metadata is destroyed. This is why deleted-but-not-overwritten data is recoverable.",
  },
  // ══ forensics L3 ══
  {
    slug: "forensics-l3-windows-artifacts",
    competencyId: "forensics",
    depthTier: 3,
    sectionHeading: "Windows forensic artifacts",
    prompt: "What does a Windows Prefetch (.pf) file record?",
    options: [
      "Evidence of program execution — name, run count, timestamps, and files the program loaded.",
      "The full contents of every executed program.",
      "Deleted files awaiting overwrite.",
      "The user's saved passwords.",
    ],
    correctIndex: 0,
    explanation:
      "Prefetch proves a program ran and when. Other execution artifacts include Amcache (SHA1 of executables) and ShimCache; the Registry Run keys show persistence and RecentDocs shows opened files.",
  },
  {
    slug: "forensics-l3-linux-artifacts",
    competencyId: "forensics",
    depthTier: 3,
    sectionHeading: "Linux forensic artifacts",
    prompt: "Which command shows the login history (including failed logins) on Linux?",
    options: [
      "`last` (from wtmp) for logins and `lastb` (from btmp) for failed logins.",
      "`ps aux` for the login history.",
      "`ls -la /etc/passwd` for past sessions.",
      "`uptime` for individual logins.",
    ],
    correctIndex: 0,
    explanation:
      "wtmp/btmp record login sessions and failures (last/lastb). Shell history (.bash_history), auth logs, cron entries, and file MAC timestamps (stat) round out the Linux artifact set.",
  },
  {
    slug: "forensics-l3-malware-triage",
    competencyId: "forensics",
    depthTier: 3,
    sectionHeading: "Malware triage",
    prompt: "During static triage, why inspect a PE's imported APIs?",
    options: [
      "Imports like VirtualAlloc/WriteProcessMemory/CreateRemoteThread hint at injection, and InternetOpen/URLDownloadToFile hint at C2.",
      "Imports reveal the malware author's name.",
      "The import table contains the decryption key.",
      "Imports show the file's creation date.",
    ],
    correctIndex: 0,
    explanation:
      "Suspicious API imports reveal capability without running the sample: memory/thread APIs suggest process injection, network APIs suggest command-and-control. Hash lookups (VirusTotal, MalwareBazaar) and sandbox detonation follow.",
  },
  {
    slug: "forensics-l3-timeline",
    competencyId: "forensics",
    depthTier: 3,
    sectionHeading: "Timeline analysis",
    prompt: "What does a super-timeline (e.g. from Plaso) reveal?",
    options: [
      "The chronological sequence across many artifact sources — initial access → execution → persistence → lateral movement → exfiltration.",
      "Only the file modification times of one directory.",
      "The attacker's real-world identity.",
      "A ranked list of the most valuable files.",
    ],
    correctIndex: 0,
    explanation:
      "Correlating file times, registry changes, event logs, prefetch, browser history, and network logs into one timeline reconstructs the attack's phases — each of which leaves distinct artifacts.",
  },
  // ══ forensics L4 ══
  {
    slug: "forensics-l4-adv-memory",
    competencyId: "forensics",
    depthTier: 4,
    sectionHeading: "Advanced memory forensics",
    prompt: "What does Volatility's malfind plugin detect?",
    options: [
      "Executable memory regions in a process that aren't backed by a file on disk — a hallmark of code injection.",
      "Malware file names on the disk.",
      "The antivirus signatures installed on the host.",
      "Deleted files in unallocated disk space.",
    ],
    correctIndex: 0,
    explanation:
      "malfind flags private, executable memory (often with an MZ header) that no image file backs — a strong injection indicator. SSDT-hook and hidden-module checks catch other rootkit behaviors.",
  },
  {
    slug: "forensics-l4-anti-forensics",
    competencyId: "forensics",
    depthTier: 4,
    sectionHeading: "Anti-forensics detection",
    prompt: "How can timestomping (forged file times) be detected on NTFS?",
    options: [
      "By comparing the $STANDARD_INFORMATION timestamps against the harder-to-forge $FILE_NAME timestamps in the MFT.",
      "By checking whether the file has a .stomp extension.",
      "By reading the file's EXIF data.",
      "It cannot be detected once done.",
    ],
    correctIndex: 0,
    explanation:
      "Tools modify $STANDARD_INFORMATION times easily but $FILE_NAME times (set by the kernel) are harder to change; large discrepancies between them reveal timestomping. Log clearing shows up as Event ID 1102 or gaps in event sequences.",
  },
  {
    slug: "forensics-l4-cloud",
    competencyId: "forensics",
    depthTier: 4,
    sectionHeading: "Cloud forensics",
    prompt: "Why does cloud forensics rely on API/audit logs rather than disk imaging?",
    options: [
      "You can't image the provider's hypervisor layer, so CloudTrail/Activity/Audit logs, flow logs, and app artifacts become the primary evidence.",
      "Cloud disks are always encrypted and unreadable.",
      "Cloud providers forbid any investigation.",
      "Cloud VMs have no persistent storage.",
    ],
    correctIndex: 0,
    explanation:
      "The provider controls the infrastructure, so investigators lean on control-plane logs. Key CloudTrail events include ConsoleLogin, CreateUser/AttachUserPolicy (persistence), GetSecretValue (credential access), and StopLogging/DeleteTrail (anti-forensics).",
  },
  // ══ forensics L5 ══
  {
    slug: "forensics-l5-ntfs",
    competencyId: "forensics",
    depthTier: 5,
    sectionHeading: "NTFS internals for forensics",
    prompt: "Why are deleted files often recoverable from NTFS?",
    options: [
      "The MFT entry is marked unused and the data clusters are marked free but not overwritten until reused, so both persist for a while.",
      "NTFS keeps an encrypted backup of every file.",
      "Deletion only hides the file from Explorer, never touching metadata.",
      "The recycle bin retains every file permanently.",
    ],
    correctIndex: 0,
    explanation:
      "Deletion just flags the MFT record and clusters as available; the actual bytes remain until something overwrites them — which is exactly why carving works. $STANDARD_INFORMATION vs $FILE_NAME timestamps also aid tamper detection.",
  },
  {
    slug: "forensics-l5-memory-structs",
    competencyId: "forensics",
    depthTier: 5,
    sectionHeading: "Windows memory structures",
    prompt: "How do rootkits hide a process, and how does pool scanning defeat it?",
    options: [
      "They unlink the EPROCESS from the ActiveProcessLinks list; psscan finds it by scanning raw memory for the EPROCESS pool tag.",
      "They delete the process from disk; disk carving recovers it.",
      "They encrypt the PEB; decrypting it reveals the process.",
      "They rename the process; a string search finds it.",
    ],
    correctIndex: 0,
    explanation:
      "Unlinking EPROCESS from the doubly-linked active list hides a process from list-walkers, but the object still exists in kernel pool memory with its tag ('Proc'), which pool/signature scanning locates.",
  },
  {
    slug: "forensics-l5-firmware",
    competencyId: "forensics",
    depthTier: 5,
    sectionHeading: "Firmware and UEFI forensics",
    prompt: "Why are UEFI firmware implants especially dangerous?",
    options: [
      "They live in SPI flash below the OS, so they survive OS reinstallation and disk wiping.",
      "They can only run while the machine is powered off.",
      "They are removed automatically by Secure Boot.",
      "They exist only in RAM and vanish on reboot.",
    ],
    correctIndex: 0,
    explanation:
      "Firmware/UEFI implants persist in the SPI flash chip beneath the operating system, surviving reinstalls — analyzed with CHIPSEC and UEFITool. Real cases include LoJax (2018) and CosmicStrand (2022).",
  },
];
