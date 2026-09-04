import type { SeedExercise } from "./types";

/** crypto (L0–L5) + forensics (L0–L5) — one MCQ per teaching section. */
export const CRYPTO_FORENSICS_EXERCISES: SeedExercise[] = [
  // ══ crypto L0 ══
  {
    slug: "crypto-l0-what",
    competencyId: "crypto",
    depthTier: 0,
    sectionHeading: "What is cryptography",
    prompt:
      "A junior analyst claims that encrypting a database at rest fully secures its data. Which response correctly identifies all four properties cryptography is designed to provide?",
    options: [
      "Confidentiality, integrity, authentication, and non-repudiation. Encryption handles only confidentiality — you also need MACs or hashes for integrity, digital certificates for authentication, and digital signatures for non-repudiation. Encryption alone leaves three of the four unaddressed.",
      "Confidentiality, availability, resilience, and access control. These extend the CIA triad with resilience and access control, which are achieved through cryptographic key management and ensure that encrypted data remains both protected and continuously accessible to authorized parties.",
      "Encoding, hashing, salting, and key derivation. These four operations form the complete cryptographic pipeline — encoding normalizes the input, hashing creates a fixed-length fingerprint, salting adds entropy, and key derivation produces the final encryption key from a passphrase.",
      "Confidentiality, compression, obfuscation, and checksumming. Modern ciphers compress plaintext before encrypting to remove redundancy, obfuscate the output through multiple substitution rounds, and append a checksum for verification as part of the standard encryption process.",
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
    prompt:
      "You are reviewing a TLS 1.3 packet capture and see both an ECDHE key exchange and AES-256-GCM bulk encryption. Why does the protocol use both symmetric and asymmetric cryptography instead of just one?",
    options: [
      "Asymmetric crypto (ECDHE) securely establishes a shared secret between strangers without pre-shared keys, but it is computationally expensive. The session then switches to fast symmetric crypto (AES-256-GCM) for bulk data encryption, combining security with performance.",
      "Both algorithms encrypt the same data independently to provide defense-in-depth — if an attacker breaks AES-256-GCM, the ECDHE layer still protects the plaintext, and if ECDHE is compromised, the symmetric layer serves as a fallback encryption barrier.",
      "Symmetric crypto handles the key exchange because it is faster at generating random values, while asymmetric crypto encrypts the bulk data because its larger key size provides stronger confidentiality guarantees for long-lived data streams across the session.",
      "The client picks one algorithm at random for each message — ECDHE for short messages where the overhead is acceptable and AES-256-GCM for longer messages where throughput matters — so the protocol adapts dynamically to the payload size.",
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
    prompt:
      "While reviewing an AES-GCM implementation, you notice a counter value is sent alongside each ciphertext. A colleague asks why this value, called a nonce, is not kept secret. What is its purpose?",
    options: [
      "The nonce ensures that encrypting the same plaintext twice under the same key produces different ciphertexts, preventing pattern leakage. It does not need secrecy, but for AES-GCM specifically it must never be reused with the same key or all confidentiality and authenticity guarantees are lost.",
      "The nonce acts as a secondary encryption key derived from the primary key using a key derivation function. It is sent in cleartext only because it has already been encrypted once by the key schedule before being applied to the plaintext blocks during each round.",
      "The nonce is a checksum computed over the plaintext before encryption. The receiver recalculates it after decryption to verify the data was not corrupted in transit, serving the same role as a CRC but specifically designed for use with authenticated encryption modes.",
      "The nonce identifies which block cipher mode is in use — different counter ranges signal different modes like CBC, CTR, or GCM to the receiver. It is public because the mode selection is not a secret and must be agreed upon before decryption can begin.",
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
    prompt:
      "A penetration tester dumps a database and finds passwords stored as unsalted SHA-256 hashes. She cracks 80% of them within minutes using a GPU rig. Why were these hashes so easy to break?",
    options: [
      "SHA-256 is designed for speed — a modern GPU can compute billions of hashes per second, making brute-force and dictionary attacks trivial. Password storage requires deliberately slow algorithms like bcrypt, scrypt, or Argon2 that throttle guessing by design.",
      "SHA-256 produces a fixed 256-bit output regardless of input length, and typical passwords map to a small fraction of the output space. The birthday paradox means collisions in this restricted range occur at roughly 2^64 work, letting an attacker find matching passwords with commodity hardware.",
      "SHA-256 uses publicly known initialization constants (the fractional parts of square roots of the first eight primes), so an attacker can pre-compute partial hash states for common password prefixes. This eliminates most of the computational overhead for each candidate guess.",
      "SHA-256 applies only four rounds of its compression function to inputs shorter than 512 bits, which includes all typical passwords. The reduced round count means the diffusion is insufficient to resist differential cryptanalysis, allowing the original input to be derived algebraically from the digest.",
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
    prompt:
      "During a code review, you find a function that Base64-encodes API keys before storing them in a database column labeled 'encrypted_key'. Why is this a critical security flaw?",
    options: [
      "Base64 is an encoding, not encryption — it is freely reversible without any key or secret, so anyone who reads the database can decode the API keys instantly. Encryption requires a secret key and provides actual confidentiality; encoding provides none whatsoever.",
      "Base64 is a weak symmetric cipher that uses a fixed substitution table of 64 characters. While it does require a key to reverse, the key is standardized and publicly known, making it only slightly harder to crack than storing the values in plaintext directly.",
      "Base64 is a one-way hashing function similar to MD5 but with a larger character set. Since hashes cannot be reversed, the stored values are actually more secure than encryption, but the mislabeled column name creates confusion during incident response procedures.",
      "Base64 encoding expands the data by approximately 33%, which often exceeds the column length limit and causes silent truncation. The truncated values cannot be decoded back to the original keys, effectively destroying them rather than protecting them — a data-loss bug, not a security flaw.",
    ],
    correctIndex: 0,
    explanation:
      "Base64 is just a data representation (no secrecy). Encryption provides confidentiality and needs a key. Hashing is one-way (integrity/fingerprinting). Calling Base64 'encryption' is a classic beginner error.",
  },
  {
    slug: "crypto-l1-classical",
    competencyId: "crypto",
    depthTier: 1,
    sectionHeading: "Classical ciphers",
    prompt:
      "An analyst finds two ciphertexts encrypted with the same XOR key. She XORs the two ciphertexts together and begins recovering plaintext. Why does this attack work?",
    options: [
      "XORing two ciphertexts encrypted with the same key cancels the key entirely (C1 \u2295 C2 = P1 \u2295 P2), leaving the XOR of the two plaintexts. Since natural language has statistical patterns, both messages can then be recovered through frequency analysis and crib dragging.",
      "XOR encryption with a reused key causes both ciphertexts to share identical initialization vectors, creating a known-plaintext condition in the first block. The first block is always a predictable protocol header, allowing the key to be directly extracted from either message.",
      "Reusing an XOR key makes the cipher deterministic, so an attacker can build a rainbow table mapping all possible single-byte XOR values. Since the key byte repeats every 256 positions, only 256 table entries are needed to decode the entire message stream.",
      "When two XOR ciphertexts share a key, their combined output reveals the key's Hamming weight — the number of set bits. With the Hamming weight known, the key space shrinks from 2^n to a binomial coefficient, making exhaustive search computationally trivial on modern hardware.",
    ],
    correctIndex: 0,
    explanation:
      "With key reuse, C1 \u2295 C2 = P1 \u2295 P2 (the key drops out), which is often enough to recover both messages. Caesar breaks to frequency analysis; Vigen\u00e8re to Kasiski examination.",
  },
  // ══ crypto L2 ══
  {
    slug: "crypto-l2-modes",
    competencyId: "crypto",
    depthTier: 2,
    sectionHeading: "Block cipher modes",
    prompt:
      "A developer encrypts a company logo image using AES in ECB mode. When the encrypted file is rendered as a bitmap, the penguin outline is still clearly visible. What property of ECB causes this?",
    options: [
      "ECB encrypts each block independently with the same key, so identical plaintext blocks always produce identical ciphertext blocks. In an image, large regions of the same color become identical blocks, preserving the visual structure in the output — the classic 'ECB penguin' problem.",
      "ECB uses a fixed initialization vector of all zeros for every block, which causes the first round of encryption to produce weak output for blocks with common byte patterns. Images contain many such patterns, leaking spatial structure through the zero-IV weakness.",
      "ECB applies a linear transformation rather than the full non-linear AES rounds, trading security for speed in throughput-sensitive applications. The linear operation preserves pixel-value relationships, which is why the image structure remains recognizable after encryption.",
      "ECB performs only a single round of AES instead of the standard 10, 12, or 14 rounds, because it skips the inter-block chaining step that triggers additional rounds. With fewer rounds, diffusion is insufficient to obscure large-scale patterns like image contours.",
    ],
    correctIndex: 0,
    explanation:
      "ECB encrypts each block independently, so patterns survive into the ciphertext. GCM (AEAD) is the modern default \u2014 it provides both confidentiality and authentication, but its nonce must never repeat.",
  },
  {
    slug: "crypto-l2-rsa",
    competencyId: "crypto",
    depthTier: 2,
    sectionHeading: "RSA and asymmetric crypto",
    prompt:
      "You capture an RSA public key with modulus n = 391 and public exponent e = 3. After factoring n into 17 \u00d7 23, you compute the private exponent d. What hard mathematical problem protects RSA when n is large?",
    options: [
      "Integer factorization \u2014 recovering the primes p and q from their product n. With small n (like 391) factoring is trivial, but when p and q are each 1024+ bits, no known classical algorithm can factor n in practical time, which is what makes RSA secure.",
      "The discrete logarithm problem \u2014 computing the exponent d requires finding the discrete log of e in the multiplicative group modulo n. This is equivalent to the Diffie-Hellman problem, which is computationally infeasible when n has more than 2048 bits.",
      "The elliptic curve discrete logarithm problem \u2014 RSA maps its modular arithmetic onto an implicit elliptic curve defined by the relationship between e and d, and solving for d requires finding the curve's order, which is as hard as ECDLP for large parameters.",
      "The subset sum problem \u2014 the public exponent e encodes a knapsack whose solution yields d, and the modulus n defines the knapsack's density. When n is large enough, the density falls below the critical threshold, making lattice reduction attacks infeasible.",
    ],
    correctIndex: 0,
    explanation:
      "d = e\u207b\u00b9 mod \u03c6(n), and \u03c6(n) needs p and q \u2014 so breaking RSA means factoring n. The classic attacks (small-e cube root, common modulus, Fermat, Wiener) each exploit a broken assumption rather than factoring directly.",
  },
  {
    slug: "crypto-l2-tls",
    competencyId: "crypto",
    depthTier: 2,
    sectionHeading: "TLS handshake and certificate validation",
    prompt:
      "A security team captures TLS traffic and later obtains the server's long-term RSA private key through a breach. They attempt to decrypt the recorded sessions but fail. What TLS feature prevented retrospective decryption?",
    options: [
      "Forward secrecy via ephemeral key exchange (ECDHE). Each session generated a unique temporary key pair that was discarded after the handshake, so the session keys cannot be recovered from the server's long-term key \u2014 past recorded traffic remains protected even after the breach.",
      "Certificate pinning prevented decryption because the recorded traffic was bound to a specific certificate fingerprint. Once the certificate was rotated after the breach, the pinned fingerprint no longer matched, and the captured sessions became cryptographically unlinkable to any key material.",
      "TLS session tickets stored the session keys encrypted under a ticket key that rotates every 24 hours. Since the breach occurred after the ticket key had already rotated, the old ticket encryption key was overwritten and the session keys are unrecoverable from the tickets.",
      "HSTS headers instructed the server to destroy session key material after each connection closed. The keys were securely wiped from memory using constant-time zeroing, so even with the long-term private key the previously captured ciphertext cannot be reversed.",
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
    prompt:
      "A code review reveals that a web application generates password-reset tokens using Python's `random.randint()` seeded with `time.time()`. Why is this a critical vulnerability?",
    options: [
      "Python's `random` module uses the Mersenne Twister PRNG, which is deterministic and predictable \u2014 an attacker who approximates the seed (the server's clock) can reproduce the exact token sequence. Security tokens must use a CSPRNG like `secrets.token_hex()` or `os.urandom()`.",
      "The `time.time()` seed has millisecond precision, which limits the token to roughly 10 bits of entropy. While `random.randint()` itself is cryptographically secure, the weak seed reduces its output space enough for brute-force within a few thousand HTTP requests.",
      "The `random` module is thread-unsafe, so concurrent password-reset requests cause race conditions that repeat the same token for different users. This is an availability issue rather than a confidentiality one, but it allows account takeover through token collision.",
      "The Mersenne Twister requires a warm-up period of 624 iterations before producing unpredictable output. Tokens generated during the first 624 calls after each server restart fall within a predictable range, but tokens generated afterward are cryptographically secure and safe to use.",
    ],
    correctIndex: 0,
    explanation:
      "The Mersenne Twister is designed for statistical simulations, not security \u2014 its full state can be reconstructed from 624 outputs, and a time-based seed narrows the search space to seconds. Always use os.urandom / secrets for security-critical values.",
  },
  // ══ crypto L3 ══
  {
    slug: "crypto-l3-padding-oracle",
    competencyId: "crypto",
    depthTier: 3,
    sectionHeading: "Padding oracle attacks",
    prompt:
      "A web application returns HTTP 200 when CBC-mode decryption produces valid PKCS#7 padding and HTTP 500 when padding is invalid. An attacker manipulates ciphertext bytes one at a time, observing these responses. What can she recover?",
    options: [
      "The entire plaintext, one byte at a time, without knowing the key. By flipping bytes in the previous ciphertext block and observing valid vs. invalid padding responses, the attacker deduces each intermediate decryption value and XORs it with the manipulated byte to recover plaintext.",
      "Only the encryption key's last byte, which is enough to brute-force the rest. The padding oracle reveals one key byte per query because PKCS#7 validation checks against a key-derived constant embedded in the final ciphertext block, leaking key material directly.",
      "The HMAC secret used to authenticate the message, because the padding validation error occurs before MAC verification. The attacker reconstructs the MAC key from the timing difference between a padding failure and a MAC failure on the server side.",
      "Only the initialization vector, not the plaintext itself. The padding oracle leaks the XOR relationship between the IV and the first ciphertext block, allowing the attacker to recover and forge new valid IVs, but the actual message remains protected by the block cipher.",
    ],
    correctIndex: 0,
    explanation:
      "By manipulating the previous ciphertext block and observing valid/invalid padding, the attacker recovers the intermediate decryption and thus each plaintext byte \u2014 no key needed. AEAD modes (GCM) authenticate before decrypting, blocking this.",
  },
  {
    slug: "crypto-l3-length-extension",
    competencyId: "crypto",
    depthTier: 3,
    sectionHeading: "Hash length extension attacks",
    prompt:
      "An API authenticates requests with MAC = SHA-256(secret || message) and appends the MAC as a query parameter. An attacker who does not know the secret can forge a valid MAC for an extended message. How?",
    options: [
      "SHA-256 outputs its full internal state as the digest. The attacker loads that state into the hash function, appends the Merkle-Damg\u00e5rd padding for the original message length, then continues hashing attacker-controlled data \u2014 producing a valid MAC for the extended message without knowing the secret.",
      "SHA-256 is vulnerable to second-preimage attacks when the secret is shorter than one block. The attacker finds a different message that collides with the original MAC by exploiting the birthday paradox, which requires only 2^128 operations \u2014 feasible with modern cloud GPU resources.",
      "The attacker extracts the secret from the MAC by inverting SHA-256's compression function. Since the secret is prepended, it occupies a known position in the first input block, and the Merkle-Damg\u00e5rd structure allows algebraic recovery of the first block's input from the final digest.",
      "SHA-256 uses a linear compression function for the first block when the input begins with high-entropy data like a secret key. This linearity means the MAC reduces to secret XOR hash(message), so the attacker computes hash(extended) and XORs it with the known MAC value.",
    ],
    correctIndex: 0,
    explanation:
      "Merkle-Damg\u00e5rd hashes output their internal state verbatim, so you can load it back and keep hashing more data as if continuing the original. Use HMAC (which nests the key) or SHA-3 (a sponge) instead.",
  },
  {
    slug: "crypto-l3-timing",
    competencyId: "crypto",
    depthTier: 3,
    sectionHeading: "Timing attacks on crypto",
    prompt:
      "A security audit finds that a server compares submitted API tokens against stored tokens using Python's `==` operator. The auditor flags this as vulnerable even though the comparison itself is correct. Why?",
    options: [
      "Python's `==` on strings returns False at the first mismatched byte, so the comparison takes longer the more leading bytes match. An attacker measures response times to determine how many bytes are correct, iteratively recovering the full token one byte at a time.",
      "Python's `==` operator converts both strings to integers before comparing, which triggers a timing-observable big-integer subtraction. The carry propagation pattern during subtraction leaks the Hamming distance between the token and the guess through measurable CPU cycle differences.",
      "Python's `==` caches comparison results in the interpreter's string intern table, so repeated comparisons with the same prefix return increasingly faster. An attacker exploits the cache hit pattern to determine which prefixes the server has encountered most frequently.",
      "Python's `==` operator is not atomic \u2014 it can be interrupted between byte comparisons by the GIL releasing. An attacker sends concurrent requests to trigger GIL contention at specific comparison points, inferring correct bytes from which requests experience the longest waits.",
    ],
    correctIndex: 0,
    explanation:
      "Early-exit comparison takes longer the more leading bytes match, a timing side channel. Constant-time comparison always inspects all bytes, giving no timing signal \u2014 essential for any secret-dependent check.",
  },
  {
    slug: "crypto-l3-ecc",
    competencyId: "crypto",
    depthTier: 3,
    sectionHeading: "Elliptic curve cryptography attacks",
    prompt:
      "A researcher discovers that a custom ECC implementation does not validate that received points lie on the correct curve. She sends a point from a weaker curve with a small subgroup order. What attack does this enable?",
    options: [
      "An invalid-curve attack \u2014 the server performs scalar multiplication on the attacker's point using its private key, but on a weaker curve with a small group order. The attacker recovers the private key modulo that small order and combines results via the Chinese Remainder Theorem.",
      "A fault-injection attack \u2014 the invalid point causes an arithmetic exception during modular operations, and the error message leaks intermediate computation values. These values contain enough information to reconstruct the private key through algebraic manipulation of the curve equation.",
      "A timing attack \u2014 points not on the standard curve trigger the slow, non-constant-time fallback path in the scalar multiplication algorithm. By measuring execution time differences between valid and invalid points, the attacker recovers individual bits of the private key.",
      "A denial-of-service attack \u2014 computing scalar multiplication with an off-curve point enters an infinite loop because the point addition formula never reaches the point at infinity. The server exhausts CPU resources, but no cryptographic key material is leaked through this vulnerability.",
    ],
    correctIndex: 0,
    explanation:
      "ECC security rests on the ECDLP (recovering k from Q = k\u00b7G). Invalid-curve, small-subgroup, twist, and Pohlig-Hellman attacks all exploit small factors in the group order to solve the log in easy pieces \u2014 which is why secure curves use (near-)prime order.",
  },
  // ══ crypto L4 ══
  {
    slug: "crypto-l4-sidechannel",
    competencyId: "crypto",
    depthTier: 4,
    sectionHeading: "Side-channel attacks on cryptographic implementations",
    prompt:
      "A researcher shares a CPU core with a victim's AES process in a cloud VM. She uses Flush+Reload to monitor cache lines corresponding to AES T-table entries. What information does this leak?",
    options: [
      "Which T-table entries the AES implementation accessed during encryption, which are determined by the key XORed with the plaintext. By correlating cache-line hits with known plaintexts across multiple encryptions, the attacker statistically recovers the secret key bytes.",
      "The plaintext data passing through the AES rounds, because each T-table entry directly encodes one plaintext byte after the SubBytes step. Flush+Reload captures the full lookup sequence, which can be reversed through the S-box to recover the input without needing the key.",
      "The round key schedule's expansion constants, which are stored in adjacent cache lines to the T-tables. Since AES derives all round keys deterministically from the master key, recovering the expansion constants lets the attacker reverse the key schedule to obtain the original key.",
      "The memory address of the AES key buffer itself, because T-table lookups use key-relative addressing where each entry's offset from the base address equals the corresponding key byte. The attacker reads these offsets directly from the cache metadata without statistical analysis.",
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
    prompt:
      "A penetration tester recovers a hash database and runs Hashcat with a wordlist but cracks only 40% of entries. Switching to rule-based and mask attacks, she quickly cracks another 35%. Why are these techniques more effective than pure brute force?",
    options: [
      "They exploit how humans actually construct passwords \u2014 rules mutate dictionary words the way people do (Password \u2192 P@ssw0rd!), and masks target known structural patterns (?u?l?l?l?d?d?d?d). This concentrates effort on probable candidates rather than exhaustively searching the entire keyspace.",
      "Rule-based attacks exploit weaknesses in the hashing algorithm itself by applying mathematical transformations that partially invert the hash function. Each rule corresponds to a known algebraic shortcut in SHA-256 or bcrypt, reducing the effective number of rounds per guess.",
      "Mask attacks use GPU-optimized rainbow tables generated on the fly for each hash type. The mask defines which pre-computed chain length to use, trading memory for time in a way that pure brute force cannot \u2014 this is how they work even against salted hashes.",
      "These techniques exploit hash collisions by generating multiple candidate passwords that produce the same output. Since the birthday paradox guarantees collisions at roughly 2^128 for SHA-256, rules and masks guide the search toward collision-dense regions of the output space.",
    ],
    correctIndex: 0,
    explanation:
      "Rules mutate dictionary words the way people do (Password \u2192 P@ssw0rd1), and masks target known structures (?u?l?l?l?d?d?d?d). This concentrates effort on probable passwords rather than the whole keyspace.",
  },
  {
    slug: "crypto-l4-protocol",
    competencyId: "crypto",
    depthTier: 4,
    sectionHeading: "Protocol-level crypto attacks",
    prompt:
      "A TLS scan reveals that a server still supports SSLv2 alongside TLS 1.2. An attacker who only captures TLS 1.2 traffic uses the DROWN attack to decrypt it. How does supporting a completely different protocol version compromise the modern sessions?",
    options: [
      "DROWN exploits SSLv2's weak export-grade cryptography to recover the RSA session key \u2014 if the server reuses the same RSA certificate for both SSLv2 and TLS 1.2, the attacker decrypts the modern session's key exchange by attacking the legacy protocol. Disabling SSLv2 and using ECDHE eliminates this.",
      "SSLv2 and TLS 1.2 share a session cache, so an SSLv2 connection inherits the TLS 1.2 session ticket. The attacker initiates an SSLv2 handshake, receives the shared ticket, and replays it to resume the TLS 1.2 session with the victim's authenticated identity and decryption keys.",
      "The server's TLS 1.2 implementation falls back to SSLv2 cipher negotiation when it detects a client supporting both protocols. The attacker sends a crafted ClientHello that triggers this fallback, forcing the server to downgrade the current session's encryption to SSLv2 strength.",
      "SSLv2 connections expose the server's TLS 1.2 master secret through a version-confusion vulnerability in the PRF. The two protocol versions use overlapping PRF label strings, and an SSLv2 handshake leaks enough PRF output to reconstruct the TLS 1.2 master secret directly.",
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
    prompt:
      "You are analyzing a whitebox AES implementation and need to identify which transformation spreads each input byte's influence across the entire state matrix within a few rounds. Which step provides this diffusion?",
    options: [
      "MixColumns \u2014 it multiplies each column of the state by a fixed matrix in GF(2^8), causing every byte in a column to influence every other byte in that column. Combined with ShiftRows (which moves bytes between columns), full diffusion across all 16 bytes is achieved within two rounds.",
      "SubBytes \u2014 the S-box substitution applies a non-linear transformation derived from the multiplicative inverse in GF(2^8) followed by an affine map. This non-linearity spreads each input bit's influence across all eight output bits, achieving full diffusion within a single round.",
      "AddRoundKey \u2014 XORing the state with the round key propagates key-dependent bit changes throughout the matrix because the key schedule's RotWord and SubWord operations have already diffused the master key's bits across all round key bytes before the XOR is applied.",
      "ShiftRows \u2014 cyclically shifting each row by a different offset moves bytes into new column positions, ensuring that no byte remains in its original column after one round. This positional diffusion alone guarantees that a single plaintext byte change affects all 16 ciphertext bytes.",
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
    prompt:
      "Your organization is planning a cryptographic migration against 'harvest now, decrypt later' threats. A quantum computer running Shor's algorithm would break certain schemes. Which are at risk, and what replaces them?",
    options: [
      "Asymmetric schemes \u2014 RSA, ECDSA, ECDH, and DSA \u2014 because Shor's algorithm efficiently solves integer factorization and discrete logarithms. Replace with lattice-based ML-KEM (Kyber) for key exchange and ML-DSA (Dilithium) for signatures. Symmetric ciphers like AES-256 only lose half their key strength to Grover's algorithm.",
      "Symmetric ciphers \u2014 AES-128 and AES-256 \u2014 because Grover's algorithm reduces their effective key length to zero bits, making brute force instantaneous. Replace with lattice-based symmetric ciphers like FrodoKEM for bulk encryption. RSA and ECC remain safe because Shor's algorithm applies only to symmetric key search.",
      "Hash functions \u2014 SHA-256 and SHA-3 \u2014 because Shor's algorithm finds preimages in polynomial time by exploiting the Merkle-Damg\u00e5rd and sponge constructions. Replace with lattice-based hash functions from the NIST PQC competition. RSA and AES are unaffected because they do not rely on hash-based assumptions.",
      "All cryptographic schemes equally \u2014 Shor's algorithm is a universal quantum speedup that reduces every computational problem from exponential to polynomial time. The entire cryptographic stack must be replaced simultaneously, including symmetric ciphers, hash functions, and public-key systems.",
    ],
    correctIndex: 0,
    explanation:
      "Shor's algorithm factors and solves discrete logs in polynomial time, killing RSA/ECC \u2014 replace with ML-KEM (Kyber) and ML-DSA (Dilithium). Grover only quadratically speeds search, so AES-256 stays adequate.",
  },
  {
    slug: "crypto-l5-zkp",
    competencyId: "crypto",
    depthTier: 5,
    sectionHeading: "Zero-knowledge proofs and advanced protocols",
    prompt:
      "A decentralized identity platform lets users prove they are over 18 without revealing their birth date to the verifier. The verifier is convinced the claim is true but learns nothing else. What cryptographic primitive enables this?",
    options: [
      "A zero-knowledge proof \u2014 it allows a prover to convince a verifier that a statement (age \u2265 18) is true without revealing any information beyond the statement's validity. Implementations include zk-SNARKs, zk-STARKs, and Bulletproofs, each with different trust and performance trade-offs.",
      "Homomorphic encryption \u2014 the user encrypts their birth date and the verifier performs the age comparison on the ciphertext without decrypting it. The verifier learns only the boolean result because the comparison circuit outputs a single encrypted bit that the user decrypts and reveals.",
      "Secure multi-party computation \u2014 the user and verifier each hold a share of the birth date, and they jointly compute the comparison through an oblivious transfer protocol. Neither party learns the other's share, and the result is revealed only after both agree to reconstruct it.",
      "Ring signatures \u2014 the user signs the age claim using a ring of public keys from a set of verified adults. The verifier confirms that one ring member signed the claim but cannot determine which one, preserving the signer's birth date while establishing group membership.",
    ],
    correctIndex: 0,
    explanation:
      "ZKPs (zk-SNARKs, zk-STARKs, Bulletproofs) convince a verifier of a fact while leaking nothing else \u2014 used for private authentication, selective disclosure, and verifiable computation.",
  },
  // ══ forensics L0 ══
  {
    slug: "forensics-l0-what",
    competencyId: "forensics",
    depthTier: 0,
    sectionHeading: "What is digital forensics",
    prompt:
      "A company discovers unauthorized access to its servers. The IT team wants to immediately start analyzing the compromised server's hard drive. A forensic investigator objects, insisting on a specific procedure first. What principle is she enforcing?",
    options: [
      "Chain of custody \u2014 before analysis, the drive must be forensically imaged and hashed so there is a documented, verifiable record that the evidence has not been altered. Working directly on the original drive risks tainting the evidence and making it inadmissible in legal proceedings.",
      "The principle of least privilege \u2014 the investigator must first revoke all access to the server and re-provision it with minimal permissions. This ensures the attacker cannot re-enter during analysis and prevents automated processes from modifying log files or other forensic artifacts.",
      "Data sovereignty compliance \u2014 the investigator must first determine which jurisdiction's laws govern the server's physical location. Analysis cannot begin until a legal review confirms that forensic examination does not violate cross-border data transfer regulations for that particular region.",
      "The write-blocker protocol \u2014 the drive must first be connected through a hardware write blocker, which encrypts all evidence with the investigator's forensic certificate during acquisition. This encryption ensures that if the drive is later accessed by unauthorized personnel, the evidence remains protected.",
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
    prompt:
      "After containing a ransomware incident, the CISO asks why the IR team should spend weeks on forensic analysis instead of simply restoring from backups and moving on. What is the primary purpose of post-incident forensics?",
    options: [
      "To determine the full scope and impact of the breach \u2014 how the attacker got in, what they accessed, whether they established persistence, and whether data was exfiltrated. Without this understanding, the same vulnerability will be exploited again and legal or regulatory obligations may go unmet.",
      "To calculate the exact financial loss from the ransomware attack, which is needed for the cyber insurance claim. Forensic analysis reconstructs the attacker's payment infrastructure and negotiation timeline, allowing the insurer to assess whether paying the ransom would have been more cost-effective.",
      "To identify which backup snapshot is safe to restore by scanning each backup for the ransomware binary's file hash. The forensic team reverse-engineers the malware to extract its SHA-256 hash, then checks every backup file against that single hash before allowing the restore to proceed.",
      "To generate the incident documentation that satisfies the IT department's annual training requirements. Forensic analysis of a real incident counts as continuing education for the security team, and the report can be submitted to certification bodies as evidence of hands-on experience.",
    ],
    correctIndex: 0,
    explanation:
      "Forensics reconstructs an incident to scope its impact, understand attacker techniques, support legal proceedings, and feed threat intelligence \u2014 and it's a major CTF category.",
  },
  {
    slug: "forensics-l0-vocab",
    competencyId: "forensics",
    depthTier: 0,
    sectionHeading: "Key vocabulary",
    prompt:
      "A forensic responder arrives at a compromised workstation that is still powered on. She immediately begins capturing RAM with a memory acquisition tool before imaging the hard drive. What principle dictates this order of operations?",
    options: [
      "The order of volatility \u2014 evidence is collected from most volatile to least volatile. RAM contents (running processes, encryption keys, network connections) vanish on power-off, so they must be captured first. Disk data persists and can wait, but live memory cannot.",
      "The principle of proportionality \u2014 investigators must collect the smallest data set first to minimize privacy intrusion. RAM is much smaller than a full disk image, so collecting it first satisfies legal requirements to demonstrate that the investigation's scope was proportionate to the incident.",
      "The network-first doctrine \u2014 RAM contains the active network connection table, which is needed to block the attacker's current session before they can delete disk evidence. Once network connections are severed using data extracted from RAM, disk contents are safe to image at leisure.",
      "The chain-of-evidence rule \u2014 RAM acquisition generates a hash that serves as the cryptographic anchor for all subsequent evidence. The disk image's integrity chain must reference the RAM hash as its root of trust, so RAM must always be collected and hashed before disk imaging begins.",
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
    prompt:
      "During a CTF challenge, you receive a file named 'image.jpg' that won't open in any image viewer. Running `file image.jpg` returns 'ELF 64-bit LSB executable'. What happened, and why is the `file` command more reliable than the extension?",
    options: [
      "The file was renamed with a misleading .jpg extension, but `file` reads the magic bytes at the start of the file (7F 45 4C 46 for ELF) to determine its true type. Extensions are arbitrary labels that can be changed freely; magic bytes embedded in the file header reveal the actual format.",
      "The JPEG standard allows embedding executable code in its APP0 marker segment, and this file uses that feature. The `file` command reports the embedded payload type rather than the container type, which is why it shows ELF \u2014 the image data follows the executable header and is still valid JPEG.",
      "The file's EXIF metadata was corrupted during transfer, causing image viewers to reject it. The `file` command bypasses EXIF and reads the JFIF header directly, revealing that the image data was encoded using ELF's compression format instead of standard JPEG DCT compression.",
      "The operating system's file type association database mapped .jpg to the ELF loader after a system misconfiguration. The `file` command queries this same system database, which is why it reports ELF. Resetting the MIME type database with `update-mime-database` would fix both the viewer and the command.",
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
    prompt:
      "You suspect a PNG image contains hidden data. Running `zsteg` reveals a message embedded in the least significant bits of the red channel. How does LSB steganography hide data while keeping the image visually identical?",
    options: [
      "Each pixel channel is an 8-bit value (0\u2013255), and flipping the least significant bit changes the color by at most 1/256 \u2014 a difference imperceptible to the human eye. By storing one secret bit per channel across thousands of pixels, significant amounts of data can be hidden invisibly.",
      "The data is compressed using PNG's DEFLATE algorithm and inserted into unused chunks between the IDAT data blocks. Since PNG viewers ignore non-standard chunks, the extra data is invisible during rendering but fully recoverable by tools that parse the complete chunk structure.",
      "The secret data is encrypted with AES and appended after the PNG's IEND marker, which signals the end of image data. Viewers stop reading at IEND and never encounter the appended bytes, while extraction tools know to look beyond the end-of-file marker for the encrypted payload.",
      "The image's color palette is reordered so that the palette index numbers spell out the hidden message in ASCII. Since visual appearance depends on which color each index maps to rather than the index number itself, the image looks identical while the indices encode the secret data.",
    ],
    correctIndex: 0,
    explanation:
      "Flipping the lowest bit of a channel is imperceptible, so a large image can carry hundreds of KB (zsteg reads those bit-planes). A separate technique appends data after a format's end marker \u2014 which binwalk detects.",
  },
  {
    slug: "forensics-l1-logs",
    competencyId: "forensics",
    depthTier: 1,
    sectionHeading: "Log analysis",
    prompt:
      "A Windows domain admin suspects a brute-force attack against user accounts. She opens Event Viewer and filters the Security log. Which event IDs should she look for to identify failed and successful authentication attempts?",
    options: [
      "Event ID 4625 for failed logon attempts and 4624 for successful logons. A burst of 4625 events from one source IP followed by a 4624 indicates a successful brute-force. The Logon Type field (3=network, 10=RDP, 2=interactive) reveals how the attacker connected.",
      "Event ID 1102 for failed logons and 4688 for successful logons. ID 1102 fires whenever the authentication subsystem rejects credentials, and 4688 is generated when a user's logon session creates its first process, confirming the user successfully authenticated and is active on the system.",
      "Event ID 4672 for failed logons and 4720 for successful logons. The Security log uses 4672 for any authentication event that does not result in privilege assignment, and 4720 fires when the system creates a new logon token after successful credential validation.",
      "Event ID 5140 records both failed and successful logon attempts in a single consolidated entry. The Status sub-field within the 5140 event distinguishes success from failure, and the TargetUserName field identifies which account was targeted \u2014 this one ID covers all authentication scenarios.",
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
    prompt:
      "Before analyzing a suspect's hard drive, you create a bit-for-bit image using `dd` and compute its SHA-256 hash. During trial, opposing counsel claims the evidence was tampered with. How does your process counter this?",
    options: [
      "The SHA-256 hash taken immediately after acquisition is a mathematical fingerprint of the image. Re-hashing the image at any later point produces the same value if and only if the data is bit-for-bit identical \u2014 proving the evidence analyzed is exactly what was originally acquired, with no tampering.",
      "The `dd` command embeds a digital signature inside the image file's metadata block using the investigator's PKI certificate. This signature is validated by the court's certificate authority, which independently attests that the image contents have not been modified since the signing timestamp.",
      "The bit-for-bit image creates a compressed archive with built-in error correction codes that prevent any modification. If even one bit changes, the ECC redundancy detects and automatically reverts the change, making it physically impossible to tamper with the image after initial acquisition.",
      "The SHA-256 hash encrypts the disk image so that only the hash holder can decrypt it. Since the hash functions as both a decryption key and a content verifier, any tampering changes the key and renders the image unreadable, providing a self-enforcing tamper protection mechanism.",
    ],
    correctIndex: 0,
    explanation:
      "The SHA-256 hash provides mathematical proof of integrity \u2014 if even one bit changes, the hash changes. Working on a hashed image keeps the source untouched and defensible. Sleuth Kit (mmls, fls, icat) then analyzes the image's layers.",
  },
  {
    slug: "forensics-l2-memory",
    competencyId: "forensics",
    depthTier: 2,
    sectionHeading: "Memory forensics with Volatility",
    prompt:
      "A Volatility analysis of a compromised Windows machine shows `pslist` reporting 47 processes, but `psscan` reports 49. What is the most likely explanation for the two extra processes found only by psscan?",
    options: [
      "A rootkit unlinked those two processes from the kernel's ActiveProcessLinks doubly-linked list (a technique called DKOM). `pslist` walks that list and misses them, but `psscan` scans raw memory for EPROCESS structure signatures and finds them regardless of list manipulation.",
      "The two extra processes are kernel threads that terminated between the `pslist` and `psscan` scans. `psscan` caches its results from the first scan, so it retains entries for threads that exited during the brief window between the two commands \u2014 a known race condition in Volatility.",
      "They are zombie processes whose parent exited without calling waitpid(). The kernel removes zombie entries from the active list but keeps their memory structures allocated until reboot. `psscan` reports them because it searches allocated pages regardless of process state.",
      "The two extra entries are memory-mapped files that share the same structure layout as EPROCESS objects, creating false positives. `psscan` uses a simple signature match that cannot distinguish genuine process objects from data files that happen to contain the same byte pattern.",
    ],
    correctIndex: 0,
    explanation:
      "A rootkit can unlink its EPROCESS from the active list (DKOM) to evade pslist; psscan finds it by signature-scanning memory. Diffing the two exposes hidden processes \u2014 which is why memory (holding keys, injected code, live connections) is captured live.",
  },
  {
    slug: "forensics-l2-network",
    competencyId: "forensics",
    depthTier: 2,
    sectionHeading: "Network forensics",
    prompt:
      "While examining a pcap in Wireshark, you notice hundreds of DNS queries where the subdomain labels are unusually long base64-encoded strings like `aGVsbG8gd29ybGQ.tunnel.evil.com`. What attack technique does this pattern indicate?",
    options: [
      "DNS tunneling for data exfiltration \u2014 the attacker encodes stolen data into DNS query labels and sends them to an authoritative nameserver they control. Since DNS traffic often passes through firewalls unfiltered, it provides a covert channel to smuggle data out of the network.",
      "DNS cache poisoning \u2014 the long base64 labels are crafted to cause hash collisions in the resolver's cache table, allowing the attacker to overwrite legitimate DNS entries with malicious ones. The encoded strings contain computed hash values that target specific cache bucket positions.",
      "DNSSEC zone transfer exploitation \u2014 the base64 strings are forged DNSSEC signature records (RRSIG) being submitted to the authoritative server. The attacker injects false signed records into the zone by exploiting a vulnerability in the zone transfer authentication process.",
      "DNS amplification DDoS \u2014 the long subdomain labels increase the query packet size, triggering disproportionately large response packets from open resolvers. The base64 encoding maximizes byte count per label while staying within DNS's 63-character label limit for optimal amplification ratio.",
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
    prompt:
      "A forensic investigator recovers deleted JPEG files from an unallocated region of a reformatted USB drive, even though the new filesystem has no record of those files. How is this possible?",
    options: [
      "File carving scans raw bytes for known header and footer signatures (FF D8 FF for JPEG header, FF D9 for footer) regardless of filesystem metadata. Reformatting rewrites filesystem structures but rarely overwrites all data blocks, so original file contents persist in unallocated space.",
      "USB flash drives maintain a hardware-level journal in the controller's firmware that records every file ever written. Forensic tools query this controller journal through vendor-specific SCSI commands, reconstructing the file table even after the filesystem has been completely reformatted.",
      "The JPEG files were stored in the drive's hidden Host Protected Area (HPA), a reserved region that reformatting does not touch. Standard format tools cannot access or overwrite the HPA, so files previously written there survive intact through multiple reformat operations.",
      "Flash memory's wear-leveling algorithm maintains backup copies of recently deleted data blocks in spare cells reserved for rotation. Forensic tools access these spare cells directly through the flash translation layer, recovering exact copies of files the filesystem considers erased.",
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
    prompt:
      "During an investigation, you find a Prefetch file named MIMIKATZ.EXE-A1B2C3D4.pf in the suspect's C:\\Windows\\Prefetch directory. What exactly does this artifact prove, and what additional details does it contain?",
    options: [
      "It proves mimikatz.exe was executed on this system \u2014 Prefetch records the executable name, run count, last execution timestamps, and the files and directories it loaded. This is strong evidence of credential-dumping activity, even if the binary itself has been deleted.",
      "It proves that the mimikatz executable was downloaded but not executed. Prefetch files are created when Windows Defender's real-time scanner inspects a new binary, and the file list inside records which antivirus signatures were checked \u2014 not which DLLs the program loaded at runtime.",
      "It proves that mimikatz was blocked by Windows SmartScreen before it could execute. The Prefetch directory stores SmartScreen quarantine records for blocked executables, and the run count field shows how many times the user attempted to bypass the block before SmartScreen prevailed.",
      "It proves a file named mimikatz.exe exists somewhere on the system but reveals nothing about execution. Prefetch files are generated by Windows Search Indexer when it catalogs new files for the Start Menu search feature, and the hash in the filename is the file's content hash.",
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
    prompt:
      "An investigator analyzing a compromised Linux server needs to determine which user accounts logged in over the past month, including failed attempts. Which commands and log files provide this information?",
    options: [
      "`last` reads /var/log/wtmp for successful login sessions (user, terminal, source IP, duration), and `lastb` reads /var/log/btmp for failed login attempts. Together with /var/log/auth.log (or secure), they provide a comprehensive authentication timeline for the investigation.",
      "`ps aux` displays the currently logged-in users and their session durations, while `history` shows authentication attempts from /var/log/syslog. The combination reconstructs the complete login history including source IPs and failed attempts over any time period on the system.",
      "`who -a` reads /etc/passwd to list every login event since the file was created, including failed attempts. Each line in /etc/passwd contains a last-login timestamp that is updated on every authentication attempt, making it the definitive login history source on Linux systems.",
      "`journalctl --unit=login` displays all authentication events from the systemd login journal, which replaces both wtmp and btmp on modern Linux. The journal is the only reliable source because traditional log files are automatically rotated and purged after 24 hours by default.",
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
    prompt:
      "You receive a suspicious PE file for triage. Before running it in a sandbox, you examine its import address table and spot imports for VirtualAllocEx, WriteProcessMemory, and CreateRemoteThread. What does this combination suggest?",
    options: [
      "Process injection \u2014 VirtualAllocEx allocates memory in a remote process's address space, WriteProcessMemory writes shellcode or a DLL into that allocation, and CreateRemoteThread executes it. This is the classic injection technique used by malware to run code inside a legitimate process.",
      "Anti-debugging evasion \u2014 VirtualAllocEx creates a memory watchpoint that triggers when a debugger sets a breakpoint, WriteProcessMemory patches the debugger's memory to crash it, and CreateRemoteThread spawns a monitoring thread that detects and terminates any attached debugging tools.",
      "File encryption for ransomware \u2014 VirtualAllocEx pre-allocates a buffer sized to the target file, WriteProcessMemory copies the file contents into the buffer for in-memory encryption, and CreateRemoteThread parallelizes the encryption across multiple files simultaneously for faster operation.",
      "Network communication \u2014 VirtualAllocEx reserves a buffer for incoming network packets, WriteProcessMemory copies received data from the kernel network buffer into user space, and CreateRemoteThread creates a listener thread that handles incoming C2 connections asynchronously from the main thread.",
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
    prompt:
      "An investigator runs Plaso's log2timeline against a disk image and produces a super-timeline with over 500,000 events. How does this differ from simply sorting file modification timestamps, and why is it valuable?",
    options: [
      "A super-timeline correlates timestamps from dozens of artifact sources \u2014 filesystem MACb times, registry modifications, event logs, browser history, Prefetch, and more \u2014 into one chronological view. This reveals the attack's phases (initial access, execution, persistence, lateral movement) that no single source shows.",
      "A super-timeline applies machine learning to cluster related events and automatically classifies each cluster as benign or malicious. The ML model assigns a confidence score to each event, reducing 500,000 entries to a prioritized list of the 50 most suspicious for the investigator to review.",
      "A super-timeline de-duplicates identical timestamps across sources to reduce noise, producing a compressed timeline with far fewer entries. Its value lies in data reduction \u2014 sorting 500,000 events is unmanageable, but the de-duplicated timeline typically contains fewer than 1,000 unique timestamps.",
      "A super-timeline reconstructs deleted timestamps by interpolating between known events using the filesystem journal's metadata. File modification times of deleted files are unrecoverable, but the journal records approximate deletion times, which Plaso uses to fill gaps in the chronological record.",
    ],
    correctIndex: 0,
    explanation:
      "Correlating file times, registry changes, event logs, prefetch, browser history, and network logs into one timeline reconstructs the attack's phases \u2014 each of which leaves distinct artifacts.",
  },
  // ══ forensics L4 ══
  {
    slug: "forensics-l4-adv-memory",
    competencyId: "forensics",
    depthTier: 4,
    sectionHeading: "Advanced memory forensics",
    prompt:
      "Running Volatility's `malfind` plugin against a memory dump, you see a process with a private memory region marked PAGE_EXECUTE_READWRITE that contains an MZ header but is not backed by any file on disk. What does this indicate?",
    options: [
      "Code injection \u2014 legitimate executables are memory-mapped from on-disk files, so a private executable region with an MZ (PE) header and no backing file strongly suggests that a DLL or shellcode was injected into the process. This is a hallmark of techniques like reflective DLL injection.",
      "A just-in-time compiled code region \u2014 runtimes like .NET CLR and Java JVM dynamically generate executable code in private memory with an MZ header as a compatibility wrapper. The `malfind` plugin frequently flags JIT regions as suspicious, producing false positives that require manual triage.",
      "A Windows memory-mapped file whose backing file was deleted while the mapping remained open. The kernel retains the MZ header in the process's address space for handle validation, but since the file no longer exists on disk, `malfind` cannot correlate the region to its original source.",
      "An ASLR relocation artifact \u2014 when ASLR moves a DLL, it creates a private copy of the PE header at the new base address while leaving the original mapped file at the old location. The relocated copy has no file backing because it exists only as a kernel-managed relocation record.",
    ],
    correctIndex: 0,
    explanation:
      "malfind flags private, executable memory (often with an MZ header) that no image file backs \u2014 a strong injection indicator. SSDT-hook and hidden-module checks catch other rootkit behaviors.",
  },
  {
    slug: "forensics-l4-anti-forensics",
    competencyId: "forensics",
    depthTier: 4,
    sectionHeading: "Anti-forensics detection",
    prompt:
      "An investigator examines a suspicious file on an NTFS volume and notices that its $STANDARD_INFORMATION timestamps show a creation date of January 2015, but the $FILE_NAME attribute in the MFT records a creation date of March 2024. What anti-forensic technique does this discrepancy reveal?",
    options: [
      "Timestomping \u2014 the attacker used a tool to forge the $STANDARD_INFORMATION timestamps to make the file appear old and innocuous. The $FILE_NAME timestamps, set by the kernel and much harder for user-mode tools to modify, retained the true creation date and exposed the manipulation.",
      "File tunneling \u2014 NTFS reuses $STANDARD_INFORMATION timestamps from a previously deleted file when a new file is created with the same name in the same directory within 15 seconds. The 2015 dates are legitimate remnants from the deleted predecessor, and the 2024 $FILE_NAME reflects actual creation.",
      "Time zone migration \u2014 the system's time zone was changed between 2015 and 2024, and NTFS stores $STANDARD_INFORMATION in local time while $FILE_NAME uses UTC. The nine-year apparent discrepancy is actually a time zone offset displayed incorrectly by the forensic analysis tool.",
      "Volume Shadow Copy bleed \u2014 when a Volume Shadow Copy restores a file, it writes the original $STANDARD_INFORMATION timestamps from the snapshot but generates a new $FILE_NAME entry with the current date. This is standard NTFS behavior during restore operations and does not indicate malicious activity.",
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
    prompt:
      "An AWS account was compromised and the incident response team discovers that CloudTrail logging was disabled early in the attack. Why must the team rely on API audit logs as primary evidence, and what key events reveal the attacker's actions?",
    options: [
      "In cloud environments, you cannot image the provider's hypervisor or physical infrastructure \u2014 API audit logs are often the only evidence available. Key CloudTrail events include ConsoleLogin, CreateUser, AttachUserPolicy (persistence), GetSecretValue (credential access), and StopLogging/DeleteTrail (anti-forensics).",
      "AWS automatically snapshots all EC2 instance memory to S3 every hour for disaster recovery, and these snapshots survive even when CloudTrail is disabled. The team should analyze these memory snapshots using Volatility's AWS profile, which provides richer evidence than CloudTrail alone.",
      "When CloudTrail is disabled, AWS activates its backup logging system called CloudAudit, which records the same API calls but stores them in a tamper-proof region accessible only to AWS support. The IR team should file an AWS support case to obtain these CloudAudit logs for investigation.",
      "The team should image the EC2 instances' EBS volumes using the hypervisor's raw disk access API, available to all AWS customers through the Systems Manager agent. This provides bit-for-bit disk images identical to traditional forensics, making CloudTrail logs unnecessary for the investigation.",
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
    prompt:
      "A forensic examiner finds that a suspect deleted hundreds of sensitive documents from an NTFS volume two weeks ago, but the files are still fully recoverable through carving. Why does NTFS deletion leave data recoverable, and what would actually prevent recovery?",
    options: [
      "NTFS deletion marks the file's MFT entry as available and releases its data clusters to the free list, but neither operation overwrites the actual data on disk. The file contents persist until new data is written to those clusters \u2014 only secure-wiping tools that overwrite the sectors prevent recovery.",
      "NTFS uses a journaling filesystem that maintains a complete copy of every deleted file in the $LogFile transaction journal. The journal retains deleted data for 30 days by default before purging, so files deleted within that window are always fully recoverable directly from the journal.",
      "NTFS moves deleted files to a hidden system recycle bin separate from the user-visible one. This system-level recycle bin has no size limit and retains files indefinitely until an administrator explicitly purges it using the `cipher /w` command, which is why the files are still present.",
      "NTFS stores data redundantly across multiple physical sectors using an internal error-correction scheme similar to RAID-1. Deleting a file removes only the primary copy, but mirrored sectors retain the data until the volume's garbage collector runs during the next scheduled defragmentation.",
    ],
    correctIndex: 0,
    explanation:
      "Deletion just flags the MFT record and clusters as available; the actual bytes remain until something overwrites them \u2014 which is exactly why carving works. $STANDARD_INFORMATION vs $FILE_NAME timestamps also aid tamper detection.",
  },
  {
    slug: "forensics-l5-memory-structs",
    competencyId: "forensics",
    depthTier: 5,
    sectionHeading: "Windows memory structures",
    prompt:
      "A Volatility analysis shows 50 processes in `pslist` but 52 in `psscan`. Cross-referencing reveals two EPROCESS objects at unexpected pool addresses not in the ActiveProcessLinks list. How did the malware hide these processes, and how does pool scanning defeat this?",
    options: [
      "The malware unlinked those two EPROCESS structures from the kernel's ActiveProcessLinks doubly-linked list \u2014 Direct Kernel Object Manipulation (DKOM). Pool scanning defeats this by scanning raw memory for the EPROCESS pool tag ('Proc') and structure signatures, finding objects regardless of list membership.",
      "The malware remapped the EPROCESS objects into a different virtual address range using modified page table entries, making them invisible to tools scanning the kernel's standard address space. Pool scanning defeats this by enumerating all physical pages through the hardware page frame number database.",
      "The malware encrypted the EPROCESS structures using the kernel's built-in encryption facility for sensitive objects. The encrypted objects remain in the process list but their fields are unreadable to `pslist`. Pool scanning defeats this by applying known decryption keys from the kernel debugger data block.",
      "The malware moved the EPROCESS objects from kernel pool memory into user-mode memory mapped into the System process, where kernel-mode list walkers cannot follow pointers. Pool scanning defeats this by scanning both kernel and user address spaces simultaneously and resolving cross-space references.",
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
    prompt:
      "A nation-state threat actor deploys a UEFI firmware implant on a target's motherboard SPI flash chip. The victim reinstalls the OS and replaces the hard drive, but the malware reappears after every clean installation. Why?",
    options: [
      "UEFI firmware implants reside in the SPI flash chip on the motherboard itself \u2014 below and independent of the OS and storage drives. The implant executes during early boot before the OS loads, can patch the kernel or drop malware to disk, and survives any OS reinstall or drive replacement.",
      "The implant embeds itself in the CPU's microcode update region, stored in non-volatile memory on the processor die. Microcode executes before UEFI firmware and cannot be overwritten by any software-based reflashing tool, making it persistent across both OS reinstalls and motherboard replacements.",
      "The implant infects the network card's PXE boot ROM, which contains writable firmware queried during every boot sequence. Since PXE ROM is checked before the local disk, the implant downloads a fresh copy from a command-and-control server during each boot, regardless of what is installed locally.",
      "The implant modifies the hard drive's firmware controller \u2014 the disk's own embedded processor \u2014 so every new OS installation is infected at the sector level during write operations. Replacing the drive removes the implant, but the victim replaced only the storage chips, not the infected controller board.",
    ],
    correctIndex: 0,
    explanation:
      "Firmware/UEFI implants persist in the SPI flash chip beneath the operating system, surviving reinstalls \u2014 analyzed with CHIPSEC and UEFITool. Real cases include LoJax (2018) and CosmicStrand (2022).",
  },
];
