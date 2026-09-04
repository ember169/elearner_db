import type { SeedExercise } from "./types";

/**
 * Pilot set — cpp-oop L0–L5 "OOP in C++".
 * One comprehension MCQ per teaching section, anchored by section heading.
 * Distractors are plausible misconceptions; each explanation reinforces the
 * core notion so a wrong answer becomes a teaching moment.
 */
export const CPP_OOP_EXERCISES: SeedExercise[] = [
  {
    slug: "cpp-oop-l2-inheritance-basics",
    competencyId: "cpp-oop",
    depthTier: 2,
    sectionHeading: "Inheritance Basics",
    prompt:
      "You define `class Animal` with only `Animal(const std::string &name)` as its constructor, and write `class Dog : public Animal`. Dog's constructor is `Dog(const std::string &name) : Animal(name) {}`. A teammate asks: 'Why can't we just write `Dog(const std::string &name) {}` and skip the base call?'",
    options: [
      "Defining `Animal(const std::string&)` suppresses the compiler-generated default constructor. With no default available, the derived class must explicitly initialize the base sub-object in its initializer list by forwarding the argument.",
      "The base call is required because `Dog` inherits `Animal`'s constructor through the using-declaration rules, and C++ mandates that inherited constructors be explicitly re-invoked to set up the vtable pointer correctly.",
      "The call to `Animal(name)` is only needed because `_name` is declared private in `Animal`. If it were protected or public, the derived constructor could assign it directly without delegating to the base.",
      "Skipping the base call is valid syntax but causes undefined behavior: the `Animal` portion is left uninitialized, and any access to its members triggers a segfault — though the compiler issues no error or warning.",
    ],
    correctIndex: 0,
    explanation:
      "Defining `Animal(const std::string&)` suppresses the compiler-generated default constructor. Every derived object still has to initialize its base sub-object first, and with no default available it must pass the argument explicitly via the initializer list. (`_name` is `protected`, not `private`, and the rule isn't about virtual dispatch — so the other options are wrong reasons.)",
  },
  {
    slug: "cpp-oop-l2-virtual-dispatch",
    competencyId: "cpp-oop",
    depthTier: 2,
    sectionHeading: "Virtual Functions and Dynamic Dispatch",
    prompt:
      "A function signature reads `void describe(const Animal &a)` and calls `a.makeSound()`, where `makeSound()` is declared virtual in `Animal`. You pass a `Dog` object. A junior asks: 'The parameter type says Animal — won't it call Animal::makeSound?'",
    options: [
      "No — `virtual` enables dynamic dispatch. At runtime, the call reads the object's hidden vptr, indexes its vtable, and jumps to `Dog::makeSound`, because the actual (dynamic) type of the referred-to object is `Dog`.",
      "Yes — since the reference's static type is `const Animal&`, the compiler binds the call to `Animal::makeSound` at compile time. To invoke the Dog version, you would need to `dynamic_cast` the reference first.",
      "It depends on optimization level: at -O0 the compiler uses dynamic dispatch and calls `Dog::makeSound`, but at -O2 or higher it devirtualizes the call and always dispatches to the base `Animal` version.",
      "Neither version runs — calling a virtual function through a const reference is undefined behavior because the const qualifier prevents the runtime from reading the mutable vptr hidden inside the object.",
    ],
    correctIndex: 0,
    explanation:
      "`virtual` enables dynamic dispatch: at the call site the program reads the object's hidden vptr, indexes the vtable, and jumps to the actual type's override — so a `Dog` runs `Dog::makeSound` even through an `Animal&`. Without `virtual`, the static type (`Animal`) would decide instead.",
  },
  {
    slug: "cpp-oop-l2-pure-virtual",
    competencyId: "cpp-oop",
    depthTier: 2,
    sectionHeading: "Abstract Classes and Pure Virtual Functions",
    prompt:
      "You declare `class AShape` with two pure virtuals: `virtual double area() = 0;` and `virtual double perimeter() = 0;`. Your `Square` class overrides `area()` but forgets `perimeter()`. The code compiles without errors until you write `Square s(5);`. Why does the error appear only there?",
    options: [
      "`Square` is still abstract because one pure virtual remains unoverridden — its vtable has an incomplete slot. The class definition itself compiles fine; the error appears only when you try to instantiate it directly.",
      "The compiler defers pure-virtual checking to link time, not compile time. The linker detects the missing `perimeter()` symbol only when it tries to populate the vtable entry in the final binary.",
      "`Square` becomes concrete the moment any one pure virtual is overridden — the remaining pure virtual gets a default implementation returning zero. The error at `Square s(5)` is actually a constructor-argument mismatch.",
      "The code compiles because the compiler auto-generates a `perimeter()` override that calls `area()` and derives the perimeter heuristically. The runtime error occurs because that derivation produces an incorrect value.",
    ],
    correctIndex: 0,
    explanation:
      "A class stays abstract until *every* inherited pure virtual is overridden. `Square` compiles fine as an abstract class — you just can't create an object of it. The compile error appears only where you actually try to instantiate a `Square`.",
  },
  {
    slug: "cpp-oop-l2-interfaces",
    competencyId: "cpp-oop",
    depthTier: 2,
    sectionHeading: "Interfaces in C++",
    prompt:
      "You need to define an interface `ISerializable` that any class can implement, but C++ has no `interface` keyword. A colleague suggests using a `struct` with only public data. What is the idiomatic C++ approach instead?",
    options: [
      "Define a class with only pure virtual methods and a virtual destructor — a pure abstract contract with no data or implementation. Any class implementing it overrides every method, and deletion through the interface pointer is safe.",
      "Define a `struct` where all members are public and all methods are non-virtual. Structs are C++'s interface mechanism because their default-public access matches the openness expected of an interface contract.",
      "Define a class template parameterized on the implementing type (CRTP). The template acts as the interface by static-asserting that the derived type provides each required method at compile time, without virtual overhead.",
      "Define a class marked `final` with only static methods. The `final` keyword prevents inheritance, ensuring all implementors compose the interface by aggregation rather than coupling through a class hierarchy.",
    ],
    correctIndex: 0,
    explanation:
      "An interface is modeled as an abstract class with only pure virtual functions: it defines a contract that any implementing class must fulfill, and depending on that abstraction (rather than a concrete class) keeps code swappable and testable. The virtual destructor makes deletion through the interface pointer safe.",
  },
  {
    slug: "cpp-oop-l2-diamond",
    competencyId: "cpp-oop",
    depthTier: 2,
    sectionHeading: "The Diamond Problem and Virtual Inheritance",
    prompt:
      "`class B : public A` and `class C : public A` each inherit from `A`, and `class D : public B, public C` inherits from both. Accessing `d.x` (a member of `A`) gives an 'ambiguous access' error. You need exactly one `A` sub-object in `D`. What is the fix?",
    options: [
      "Make both `B` and `C` inherit with `virtual public A`. Virtual inheritance collapses the two `A` sub-objects into one shared instance, constructed by the most-derived class `D`, eliminating the ambiguity.",
      "Add a `using A::x;` declaration inside `D` to resolve the ambiguity. The using-declaration merges the two separate `A::x` copies into a single member that both the `B` and `C` paths share transparently.",
      "Declare `x` as `static` in `A`. A static member exists once per class regardless of how many times `A` appears in the hierarchy, which eliminates the duplication without changing the inheritance structure.",
      "Have `D` inherit from only one of `B` or `C`, and compose the other by aggregation (a member variable). This avoids the diamond entirely while preserving access to both `B` and `C` interfaces.",
    ],
    correctIndex: 0,
    explanation:
      "Without virtual inheritance, `D` holds `B::A::x` and `C::A::x` — two distinct members, so `d.x` is ambiguous. Declaring the inheritance `virtual` collapses them into one shared `A` sub-object (initialized by the most-derived class, `D`), leaving exactly one `x`.",
  },
  {
    slug: "cpp-oop-l2-vtable-hijack",
    competencyId: "cpp-oop",
    depthTier: 2,
    sectionHeading: "Vtable Hijacking: A Security Perspective",
    prompt:
      "A heap buffer overflow lets an attacker overwrite exactly 8 bytes at the start of a polymorphic object on the heap. The object has several virtual methods that are called shortly after. Why is this enough for arbitrary code execution?",
    options: [
      "Those 8 bytes are the vptr. A virtual call dereferences the vptr to find the vtable, then calls through a function pointer in it. A forged vptr pointing to an attacker-controlled fake vtable redirects the next virtual call anywhere.",
      "Those 8 bytes are the object's destructor address stored inline. Overwriting it with a shellcode pointer means the next scope exit or delete expression jumps directly to the attacker's payload without any indirection.",
      "Those 8 bytes are the RTTI type_info pointer. Corrupting it causes dynamic_cast to return a reinterpreted pointer to the wrong type, giving the attacker a type-confused object whose methods execute arbitrary code.",
      "Those 8 bytes are the reference count used by shared_ptr. Setting the count to 1 triggers an early destructor call that frees the object while other references still use it, creating a use-after-free for code execution.",
    ],
    correctIndex: 0,
    explanation:
      "Each polymorphic object begins with a vptr -> vtable -> function pointers. A virtual call walks that chain, so if a heap overflow, use-after-free, or type confusion lets the attacker repoint the vptr at a fake vtable, the next virtual call jumps into their code. CFI and vtable verification exist specifically to detect this.",
  },
  {
    slug: "cpp-oop-l2-object-slicing",
    competencyId: "cpp-oop",
    depthTier: 2,
    sectionHeading: "Object slicing",
    prompt:
      "You store Dog objects in a `std::vector<Animal>` by value: `v.push_back(Dog(\"Rex\"));`. When you call `v[0].speak()` — a virtual method — it prints the generic Animal sound instead of Rex's bark. The Dog constructor definitely ran. What went wrong?",
    options: [
      "Object slicing: the vector stores `Animal` values, so copying the `Dog` in discards the derived portion — Dog's extra members and its vtable pointer are replaced by Animal's. Only the base sub-object survives the copy.",
      "The vector's allocator aligns objects to `sizeof(Animal)`, truncating the Dog's memory layout. The vtable pointer is preserved but the overridden function body lies beyond the allocation boundary and is unreachable.",
      "`push_back` moves the Dog into the vector, leaving the source in a moved-from state. The moved-from Dog's vtable reverts to Animal's vtable as part of the move operation, and the vector stores that reverted version.",
      "The `const` qualifier on the vector's element access (`operator[]` returns `const Animal&`) prevents virtual dispatch from resolving to the derived override, because the compiler treats const references as base-type-only.",
    ],
    correctIndex: 0,
    explanation:
      "The container holds `Animal` values, and copying a `Dog` into an `Animal` slot retains only the `Animal` sub-object and its vtable — `_name` and the override are discarded. That's slicing. Store `std::unique_ptr<Animal>` (or use references) to preserve polymorphism. Note `speak()` *is* virtual here; the culprit is the value copy, not a missing `virtual`.",
  },

  // ── L0 ──
  {
    slug: "cpp-oop-l0-cpp-vs-c",
    competencyId: "cpp-oop",
    depthTier: 0,
    sectionHeading: "C++ as an Extension of C",
    prompt:
      "A teammate porting a C project to C++ says 'it is the same language, just a different compiler flag.' You want to correct this misconception. Which statement best captures what C++ adds beyond C?",
    options: [
      "C++ introduces object-oriented programming with classes and inheritance, generic programming via templates, and stronger compile-time type checking, while retaining near-complete backward compatibility with C's syntax and memory model.",
      "C++ replaces C's manual memory management with a built-in garbage collector and reference-counted heap, eliminating the need for malloc/free and making memory leaks impossible in well-formed programs.",
      "C++ removes raw pointers entirely and replaces them with safe references, forbids direct memory access through casts, and enforces bounds checking on all array operations at compile time.",
      "C++ adds a bytecode interpreter layer that compiles source to an intermediate representation first, then JIT-compiles hot paths at runtime, much like Java's HotSpot or .NET's CLR.",
    ],
    correctIndex: 0,
    explanation:
      "'C with Classes' kept C's model and added OOP, templates, and stronger typing. It also inherits C's memory-safety issues and adds new attack surface — notably vtable hijacking.",
  },
  {
    slug: "cpp-oop-l0-oop-concepts",
    competencyId: "cpp-oop",
    depthTier: 0,
    sectionHeading: "Core OOP Concepts",
    prompt:
      "You write a function that takes an `Animal&` and calls `speak()`. Passing a `Dog` barks; passing a `Cat` meows — same interface, different behavior. Which OOP principle is this an example of?",
    options: [
      "Polymorphism — the ability for objects of different classes to respond to the same method call with type-specific behavior, implemented in C++ through virtual function dispatch at runtime.",
      "Encapsulation — the practice of bundling data and methods inside a class and restricting direct access to internal state, which forces callers to use the public interface for all interactions.",
      "Inheritance — the mechanism by which a derived class acquires the data members and method implementations of its base class, allowing code reuse without rewriting shared functionality.",
      "Abstraction — the design principle of exposing only essential details through a simplified interface while hiding complex implementation logic, reducing cognitive load for the caller.",
    ],
    correctIndex: 0,
    explanation:
      "The four principles are encapsulation, inheritance, polymorphism, and abstraction. Polymorphism specifically means one interface with type-dependent behaviour, implemented in C++ through virtual dispatch.",
  },
  {
    slug: "cpp-oop-l0-vocab",
    competencyId: "cpp-oop",
    depthTier: 0,
    sectionHeading: "Key Vocabulary",
    prompt:
      "While debugging a heap corruption exploit, your mentor points to a pointer at offset 0 of a polymorphic object and says 'that is how they hijacked execution.' What is this pointer and why is it security-critical?",
    options: [
      "It is the vptr — a per-object pointer to the class's vtable, an array of virtual function pointers. Corrupting it redirects all subsequent virtual calls to attacker-chosen addresses.",
      "It is the stack canary — a guard value placed between the return address and local variables. Overwriting it lets an attacker bypass stack-smashing detection on the next function return.",
      "It is the RTTI type descriptor pointer — it stores the class name string used by dynamic_cast. Corrupting it causes type confusion but cannot directly redirect execution flow.",
      "It is the reference count field used by shared_ptr — corrupting it triggers a premature free, creating a use-after-free condition, but does not directly control code execution.",
    ],
    correctIndex: 0,
    explanation:
      "Each polymorphic object holds a vptr to its class vtable (an array of virtual function pointers). Overwriting the vptr is a classic C++ exploitation primitive.",
  },
  // ── L1 ──
  {
    slug: "cpp-oop-l1-class",
    competencyId: "cpp-oop",
    depthTier: 1,
    sectionHeading: "Defining a Class",
    prompt:
      "Your code review flags a class managing a heap-allocated char array that only defines a constructor and destructor. A colleague asks why that is insufficient under 42's Orthodox Canonical Form. What is the correct explanation?",
    options: [
      "OCF requires a default constructor, copy constructor, copy assignment operator, and destructor. Without the copy constructor and copy assignment, the compiler generates shallow copies that will double-free the buffer.",
      "OCF requires a constructor, destructor, move constructor, and swap function. Without move semantics, every temporary object causes a full deep copy, making the class unusable in STL containers.",
      "OCF requires a constructor, destructor, operator new, and operator delete. Without custom allocation operators, the class cannot control where its heap memory is placed or how it is aligned.",
      "OCF requires a constructor, destructor, a virtual clone method, and an equality operator. Without clone(), polymorphic copies through a base pointer silently slice away the derived portion.",
    ],
    correctIndex: 0,
    explanation:
      "OCF (the Rule of Three plus a default constructor) makes copying and destruction explicit. The copy assignment operator also needs a self-assignment guard (`if (this != &rhs)`).",
  },
  {
    slug: "cpp-oop-l1-initlist",
    competencyId: "cpp-oop",
    depthTier: 1,
    sectionHeading: "Constructors and Initialiser Lists",
    prompt:
      "A peer's constructor assigns a `const std::string` member inside the body: `{ _name = name; }`. The compiler rejects it. They ask whether the initializer list is just a style preference. What do you explain?",
    options: [
      "The initializer list constructs members directly in one step, and const or reference members can only be initialized — never assigned — so they must appear there. It also avoids the cost of default-constructing then overwriting.",
      "The initializer list runs the member's move constructor instead of the copy constructor, which is the only way to initialize a const member because moves do not violate const semantics under the C++ standard.",
      "The initializer list defers initialization until the constructor body runs, letting the compiler verify that all const members are set before any method call, which the body-assignment path cannot guarantee.",
      "The initializer list guarantees initialization order matches the list order, not declaration order. The compiler rejects body assignment of const because it cannot verify the order of side effects.",
    ],
    correctIndex: 0,
    explanation:
      "Assignment in the body first default-constructs then overwrites (two steps, and impossible for const/reference members). Members are initialized in declaration order, not initializer-list order.",
  },
  {
    slug: "cpp-oop-l1-encapsulation",
    competencyId: "cpp-oop",
    depthTier: 1,
    sectionHeading: "Access Specifiers and Encapsulation",
    prompt:
      "You review a `BankAccount` class where `balance` is public. A bug lets external code set `balance` to -1000 directly. Your fix is to make `balance` private and add a setter. A junior developer asks: why not just leave it public and document 'do not set negative values'?",
    options: [
      "Private data with a controlled setter lets the class enforce invariants in code — the setter rejects negative values at the boundary. Documentation alone cannot prevent misuse; the compiler enforces the access restriction.",
      "Making the member private reduces the object's memory footprint because the compiler can pack private members more tightly than public ones, which also happens to prevent direct external writes.",
      "Private members are required for the class to participate in inheritance hierarchies — a derived class cannot override base methods unless the base data is hidden behind private access specifiers.",
      "Private members enable the compiler to inline all accesses, converting field reads into register operations. This optimization is unavailable for public members because external code may take their address.",
    ],
    correctIndex: 0,
    explanation:
      "Private data with a controlled interface lets a class reject invalid state. A `const` method further promises not to modify the object, enforced by the compiler.",
  },
  {
    slug: "cpp-oop-l1-operator",
    competencyId: "cpp-oop",
    depthTier: 1,
    sectionHeading: "Operator Overloading",
    prompt:
      "You profile a loop calling `it++` (postfix) on a heavyweight iterator class and notice unnecessary copies. Your colleague suggests switching to `++it` (prefix). Why would that help, and how do the two overloads differ in their signatures?",
    options: [
      "Prefix `operator++()` modifies the object and returns `*this` by reference — no copy. Postfix `operator++(int)` takes a dummy int parameter, saves the old value, increments, and returns the saved copy — hence the extra overhead.",
      "Prefix `operator++()` returns a const copy to prevent chaining like `++++it`, while postfix `operator++(int)` returns a mutable reference allowing modification of the returned value in the same expression.",
      "Prefix `operator++()` is always inlined by the compiler and elides the copy via NRVO, while postfix `operator++(int)` cannot be inlined because the pre-increment value must be heap-allocated to survive the expression.",
      "Both overloads have identical signatures — the compiler distinguishes them by call context. The performance difference comes from postfix requiring a memory barrier to ensure the pre-increment value is visible to other threads.",
    ],
    correctIndex: 0,
    explanation:
      "`++x` (prefix) modifies and returns *this by reference; `x++` (postfix) has a dummy int parameter to distinguish it and returns the prior value by copy — which is why prefix is usually cheaper.",
  },
  // ── L3 ──
  {
    slug: "cpp-oop-l3-raii",
    competencyId: "cpp-oop",
    depthTier: 3,
    sectionHeading: "The RAII Idiom",
    prompt:
      "You refactor a function that opens a file, reads data, and closes it — but an exception between open and close leaks the file descriptor. You wrap the fd in a class whose constructor opens and destructor closes. A colleague asks: 'What if the exception fires before the destructor runs?'",
    options: [
      "The destructor still runs — C++ guarantees that stack unwinding from an exception destroys all fully-constructed local objects in reverse order. This is RAII: tying resource lifetime to object lifetime ensures release on every exit path.",
      "The destructor does not run during stack unwinding — it only runs on normal scope exit. To handle exceptions you must also register the cleanup with `std::atexit()` so the resource is freed when the program terminates.",
      "The destructor runs only if you wrap the object creation in a try block and explicitly call the destructor in the catch clause. Without the catch, stack unwinding skips destructor calls for performance reasons.",
      "The destructor runs during unwinding but in an unspecified order relative to other local objects. RAII only guarantees release, not ordering, so dependent resources like a file and its lock may release in the wrong sequence.",
    ],
    correctIndex: 0,
    explanation:
      "Tying resource lifetime to object lifetime means destructors free files, locks, and memory on every exit path, eliminating the leak class that plagues C. In security terms it prevents fd exhaustion and inconsistent state after exceptions.",
  },
  {
    slug: "cpp-oop-l3-smartptr",
    competencyId: "cpp-oop",
    depthTier: 3,
    sectionHeading: "Smart Pointers",
    prompt:
      "You are designing a tree data structure. Each node owns its children exclusively, but sibling nodes need to reference the parent without owning it. A teammate suggests `shared_ptr` everywhere 'to be safe.' What is the better design and why?",
    options: [
      "`unique_ptr` for children (exclusive ownership, zero overhead), raw pointer or `weak_ptr` for the parent back-reference. `shared_ptr` adds atomic reference counting overhead and parent-child cycles would prevent destruction entirely.",
      "`shared_ptr` for both children and parent is correct — the reference count naturally reaches zero when the last reference drops, and the cycle detector built into `shared_ptr` breaks any parent-child loops automatically.",
      "Use `unique_ptr` for both directions. The parent `unique_ptr` in each child node uses a custom no-op deleter, which expresses non-owning semantics while keeping the smart-pointer type consistent across the entire tree.",
      "Use raw pointers for both children and parent, plus a centralized `TreeAllocator` that tracks all nodes. Smart pointers add overhead that is unacceptable in data structures, and the allocator handles bulk deallocation.",
    ],
    correctIndex: 0,
    explanation:
      "unique_ptr expresses exclusive ownership with no runtime cost; shared_ptr adds atomic reference counting. Corrupting a shared_ptr's refcount (e.g. via a heap overflow) can force a premature free — a use-after-free.",
  },
  {
    slug: "cpp-oop-l3-exceptsafety",
    competencyId: "cpp-oop",
    depthTier: 3,
    sectionHeading: "Exception Safety",
    prompt:
      "Your `Widget::resize()` method must allocate a new buffer, copy data, and swap. If `new` throws during allocation, the Widget must remain in its original state. A reviewer says your code only offers the 'basic guarantee.' What guarantee should you aim for, and how?",
    options: [
      "The strong exception guarantee: if the operation throws, program state is unchanged — as if it was never called. Achieve it via copy-and-swap: do all fallible work on a temporary copy, then swap (which must be noexcept) with `*this`.",
      "The no-throw guarantee: mark `resize()` as `noexcept` and catch all exceptions internally with a catch-all block. This promises callers the method never throws, so the Widget state question becomes moot entirely.",
      "The transactional guarantee: wrap the allocation and copy in a `std::transaction` block (C++23) that automatically rolls back heap mutations if an exception escapes, restoring the Widget without any manual swap logic.",
      "The basic guarantee with double-buffering: maintain two internal buffers at all times and toggle an active-buffer flag. If the copy into the standby buffer throws, the active buffer remains untouched — rollback at the cost of 2x memory.",
    ],
    correctIndex: 0,
    explanation:
      "The three levels are no-throw (noexcept), strong (all-or-nothing, via copy-and-swap), and basic (valid but possibly changed state, no leaks). Move operations, swap, and destructors should be noexcept.",
  },
  {
    slug: "cpp-oop-l3-ruleofzero",
    competencyId: "cpp-oop",
    depthTier: 3,
    sectionHeading: "The Rule of Zero, Three, and Five",
    prompt:
      "You write a class with two members: `std::string name_` and `std::vector<int> scores_`. A reviewer asks why you defined a destructor, copy constructor, copy-assignment operator, and move operations. They say the 'Rule of Zero' applies here. What does that mean?",
    options: [
      "If all data members manage their own resources (string and vector do), the compiler-generated defaults for destructor, copy, and move are correct. Define none — zero special members — and let the defaults handle everything.",
      "The Rule of Zero means defining all five special members but making each one explicitly `= default`. Writing them out documents intent and prevents the compiler from silently generating incorrect versions.",
      "The Rule of Zero applies only to final classes that cannot be inherited from. Since your class is not marked `final`, you must define at least the destructor as virtual to prevent slicing in polymorphic hierarchies.",
      "The Rule of Zero means deleting all five special members with `= delete`, making the class move-only by then re-enabling just the move constructor and move-assignment. This prevents accidental copies of string and vector.",
    ],
    correctIndex: 0,
    explanation:
      "If your members manage their own resources, the compiler's defaults for destructor/copy/move are correct, so you write none. (42's OCF exercises still have you implement the Rule of Three for learning.)",
  },
  {
    slug: "cpp-oop-l3-casting",
    competencyId: "cpp-oop",
    depthTier: 3,
    sectionHeading: "Casting in C++",
    prompt:
      "You have a `Base*` pointer that might point to a `Derived` object, and you need to call a Derived-only method safely. If the pointer actually points to a different subclass, the cast must fail gracefully (return nullptr) rather than cause undefined behavior. Which cast do you use?",
    options: [
      "`dynamic_cast<Derived*>(ptr)` — it performs a runtime RTTI check against the object's actual type, returning nullptr for pointers (or throwing `std::bad_cast` for references) if the target type does not match.",
      "`static_cast<Derived*>(ptr)` — it checks the class hierarchy at compile time and inserts a runtime null check if the base-to-derived conversion is potentially unsafe, returning nullptr on failure.",
      "`reinterpret_cast<Derived*>(ptr)` — it reinterprets the pointer's bit pattern as a Derived pointer and validates the vtable signature at runtime, returning nullptr if the vtable does not match Derived's layout.",
      "`const_cast<Derived*>(ptr)` — it removes the const/volatile qualifiers and simultaneously performs a safe downcast, returning nullptr if the pointed-to object's RTTI does not match the target derived type.",
    ],
    correctIndex: 0,
    explanation:
      "dynamic_cast verifies the conversion at runtime (nullptr for a failed pointer cast, throws std::bad_cast for references). reinterpret_cast bypasses the type system (a code-review red flag), and writing through a const_cast'd-away const is undefined behaviour.",
  },
  {
    slug: "cpp-oop-l3-exhandling",
    competencyId: "cpp-oop",
    depthTier: 3,
    sectionHeading: "Exception Handling Patterns",
    prompt:
      "During code review, you see: `throw new std::runtime_error(\"fail\");` caught by `catch (std::exception* e)`. The reviewer flags this as problematic. Another snippet throws by value and catches by const reference. Which pattern is correct and why?",
    options: [
      "Throw by value, catch by `const&`. Throwing a pointer requires the caller to delete the heap-allocated exception (leak-prone), and catching by value slices derived exception types. `const&` avoids both problems and catches the full derived object.",
      "Throw by pointer, catch by pointer. The heap allocation ensures the exception object survives stack unwinding, while catching by reference risks a dangling reference if the exception's stack frame is destroyed before the handler.",
      "Throw by value, catch by value. Catching by const reference prevents the catch block from calling non-const methods on the exception, which may be needed for logging or retry logic. Value catches preserve the full interface.",
      "Throw by `std::unique_ptr`, catch by `const std::unique_ptr&`. This combines RAII-managed lifetime with reference semantics, ensuring the exception is freed when the catch block exits without manual delete or slicing.",
    ],
    correctIndex: 0,
    explanation:
      "Throw-by-value/catch-by-const-reference avoids slicing and leaks. Throwing from a destructor during unwinding calls std::terminate. Cleanup should ride on RAII, not catch blocks.",
  },
  // ── L4 ──
  {
    slug: "cpp-oop-l4-functempl",
    competencyId: "cpp-oop",
    depthTier: 4,
    sectionHeading: "Function Templates",
    prompt:
      "You write `template <typename T> T max_val(T a, T b) { return a > b ? a : b; }` and call it with both `int` and `std::string` arguments. A colleague asks whether this creates a single generic function that handles all types at runtime, like a Java generic. What actually happens?",
    options: [
      "The compiler instantiates a separate, fully-typed function for each type argument — one for `int`, another for `std::string`. This monomorphization produces type-specific machine code with no runtime dispatch or type-erasure overhead.",
      "The compiler generates a single function that accepts arguments as `void*` pointers and uses RTTI at runtime to determine the actual type, then dispatches to the correct comparison operator through a function-pointer table.",
      "The compiler generates one function using the largest type's size for storage and performs implicit conversions at each call site. The `int` call widens to `std::string` internally, which is why both calls share one instantiation.",
      "The template acts as a compile-time macro: the preprocessor textually substitutes the type name before compilation. The resulting code is identical to a `#define MAX_VAL(a,b)` macro, with the same scoping and type-safety limitations.",
    ],
    correctIndex: 0,
    explanation:
      "The compiler stamps out a concrete function per type argument at compile time (monomorphization), so there is no runtime type dispatch — unlike virtual functions.",
  },
  {
    slug: "cpp-oop-l4-classtempl",
    competencyId: "cpp-oop",
    depthTier: 4,
    sectionHeading: "Class Templates",
    prompt:
      "You instantiate both `std::vector<int>` and `std::vector<std::string>` in the same translation unit. During debugging, you notice they have different sizes (sizeof) and different generated method addresses. Why are they distinct classes rather than one class that stores different types?",
    options: [
      "Class templates are compiled via monomorphization: the compiler generates a distinct class for each unique type argument. `vector<int>` and `vector<string>` are separate types with their own methods, layout, and size.",
      "They appear distinct in the debugger but share a single compiled class internally. The different sizes come from the allocator adjusting element alignment at runtime, and the method addresses are a debugger display artifact.",
      "They are distinct because `std::vector` uses type erasure internally — each instantiation creates a wrapper around a common `void*` storage layer, and the differing sizes reflect the type-erasure overhead scaling with element size.",
      "They are distinct only because the Standard requires separate RTTI entries for template specializations. The compiler generates one polymorphic vector class and uses virtual dispatch to select element operations at runtime.",
    ],
    correctIndex: 0,
    explanation:
      "A class template parameterizes a class over types; `vector<int>` and `vector<std::string>` are separate compiled classes. This is compile-time generic programming, distinct from runtime polymorphism.",
  },
  {
    slug: "cpp-oop-l4-stlcontainers",
    competencyId: "cpp-oop",
    depthTier: 4,
    sectionHeading: "STL Containers",
    prompt:
      "You need a key-value store with O(1) average lookup for a network packet dispatcher. A teammate suggests `std::map`. You propose `std::unordered_map` instead. They argue that `map` is faster because 'it keeps keys sorted.' Who is right, and what is the trade-off?",
    options: [
      "`unordered_map` (a hash table) gives O(1) average lookup — faster for pure lookup workloads. `std::map` (a red-black tree) gives O(log n) lookup but maintains sorted order, which matters only if you need ordered iteration or range queries.",
      "`std::map` is faster for lookup because its sorted structure enables binary search with better cache locality than hash-table probing. `unordered_map` is O(1) only in theory — real-world hash collisions push it closer to O(n).",
      "Both containers offer O(1) average lookup, but `std::map` achieves it through a B-tree with large node fanout, while `unordered_map` uses open addressing. The difference is only in insertion cost, not lookup performance.",
      "`unordered_map` is faster but unsafe for network code because hash-flooding attacks can degrade it to O(n). `std::map`'s guaranteed O(log n) makes it the only defensible choice for security-sensitive dispatchers regardless of average-case speed.",
    ],
    correctIndex: 0,
    explanation:
      "unordered_map/unordered_set use hashing (O(1) average, unordered); map/set use a balanced BST (O(log n), ordered). vector gives O(1) indexing but O(n) search; list gives O(n) search.",
  },
  {
    slug: "cpp-oop-l4-stlalgorithms",
    competencyId: "cpp-oop",
    depthTier: 4,
    sectionHeading: "STL Algorithms",
    prompt:
      "You call `std::sort(v.begin(), v.end())` on a `std::vector<int>`, then later sort a `std::deque<double>` with the same algorithm. No new sort is needed. A colleague asks why STL algorithms take iterator pairs instead of container references. What is the design rationale?",
    options: [
      "Iterator ranges decouple algorithms from containers: any container exposing compatible iterators works with any algorithm. This lets N algorithms and M containers interoperate with N+M implementations instead of N*M.",
      "Iterator ranges let algorithms modify the container's internal structure — for example, `std::sort` can reallocate the vector's storage through the iterators. Passing by reference would block this since the algorithm lacks allocator access.",
      "Containers cannot be passed to template functions because their nested template parameters make type deduction ambiguous. Iterator pairs erase the container type, acting as a form of runtime type erasure for generic dispatch.",
      "Iterator ranges allow algorithms to operate on sub-ranges without copying. This was originally a performance optimization — passing whole containers required deep copies before C++11 move semantics made container passing efficient.",
    ],
    correctIndex: 0,
    explanation:
      "By taking [first, last) iterator pairs, std::sort/find/transform work on vectors, deques, arrays, or any range — the core design of the STL (Stepanov). The algorithm never needs to know the container type.",
  },
  {
    slug: "cpp-oop-l4-iterators",
    competencyId: "cpp-oop",
    depthTier: 4,
    sectionHeading: "Iterators and Iterator Categories",
    prompt:
      "You attempt `std::sort(myList.begin(), myList.end())` on a `std::list<int>` and get a compile error about iterator category requirements. Yet `std::sort` works fine on `std::vector` and `std::deque`. What iterator category does `std::sort` require, and what does `std::list` provide?",
    options: [
      "`std::sort` requires random-access iterators (constant-time `it + n` and `it[n]`). `std::list` provides only bidirectional iterators (forward and backward, but no random jumps), so it offers its own `list::sort` member instead.",
      "`std::sort` requires forward iterators, which `std::list` provides, but the error is caused by `list`'s node-based layout — `std::sort` performs element swaps requiring contiguous memory, which a linked list cannot guarantee.",
      "`std::sort` requires contiguous iterators (a category above random-access, added in C++17). `std::vector` and `std::deque` satisfy this, but `std::list` provides only random-access iterators, one category below the requirement.",
      "`std::sort` requires output iterators for in-place swaps. `std::list` iterators are input-only because modifying a list node through an iterator would invalidate the linked-list pointers, so the Standard forbids it.",
    ],
    correctIndex: 0,
    explanation:
      "Iterator categories run input/output -> forward -> bidirectional -> random-access. std::sort needs random access (vector, deque, array); std::list only offers bidirectional iterators, hence its member sort.",
  },
  {
    slug: "cpp-oop-l4-specialization",
    competencyId: "cpp-oop",
    depthTier: 4,
    sectionHeading: "Template Specialisation",
    prompt:
      "You define `template<typename T> struct Serializer { ... }` with a generic implementation. For `std::string`, you need completely different serialization logic. You cannot modify the primary template. How do you provide the string-specific version, and what is this technique called?",
    options: [
      "Write a full template specialization: `template<> struct Serializer<std::string> { ... }`. The compiler selects this over the primary template when the type argument is exactly `std::string`, with no changes to the original.",
      "Write a partial specialization narrowed to string: `template<typename T> struct Serializer<T*> { ... }`. Partial specialization matches subsets of types, and `std::string` is matched by constraining T to `char` traits.",
      "Inherit from the primary template and override methods: `struct StringSerializer : Serializer<std::string> { ... }`. Template inheritance is the idiomatic way to customize behavior per type without touching the base definition.",
      "Define a separate function overload: `void serialize(std::string s) { ... }`. The compiler prefers non-template overloads over template instantiations, so this replaces the template via overload-resolution priority rules.",
    ],
    correctIndex: 0,
    explanation:
      "Specialization lets you override the generic definition for particular types (e.g. a `std::hash` specialization for your type), while the primary template handles the rest.",
  },
  {
    slug: "cpp-oop-l4-lambda",
    competencyId: "cpp-oop",
    depthTier: 4,
    sectionHeading: "Lambda Expressions",
    prompt:
      "You write `auto fn = [x, &y]() { return x + y; };` where `x` is an int and `y` is a large vector. After `fn` is created, `y` is modified externally, and `fn()` sees the change. But modifying `x` externally has no effect on `fn()`. What determines this difference?",
    options: [
      "The capture list: `[x]` captures by value (a copy frozen at lambda creation), while `[&y]` captures by reference (a live alias). Changes to the original `y` are visible inside the lambda; changes to the original `x` are not.",
      "The difference is due to type size: small types like `int` are automatically captured by value for efficiency, while large types like `vector` are captured by reference to avoid expensive copies. The capture syntax is only advisory.",
      "Both are captured by reference, but `int` is a fundamental type whose value is cached in a CPU register. Register-cached captures do not reflect later memory writes, while heap-allocated objects like vector always reflect changes.",
      "The lambda captures everything by value internally. The `&y` syntax enables move semantics for the vector rather than copy semantics, so the lambda holds a moved copy that shares the same heap buffer via copy-on-write.",
    ],
    correctIndex: 0,
    explanation:
      "The capture list binds outer variables into the closure. Prefer explicit captures over [=]/[&] to avoid copying large objects or, worse, capturing a reference that later dangles.",
  },
  {
    slug: "cpp-oop-l4-iterinvalid",
    competencyId: "cpp-oop",
    depthTier: 4,
    sectionHeading: "Iterator invalidation rules",
    prompt:
      "You write a loop: `for (auto it = v.begin(); it != v.end(); ++it) { if (*it < 0) v.erase(it); }` to remove negatives from a `std::vector<int>`. The program crashes intermittently. What is the bug and what is the correct pattern?",
    options: [
      "`erase` invalidates the iterator at the erased position and all iterators after it. The subsequent `++it` is undefined behavior. Fix: use `it = v.erase(it)` (erase returns the next valid iterator) and skip the `++it` when erasing, or use `std::erase_if`.",
      "`erase` shifts elements left but does not update `v.end()`, so the loop reads past the new logical end. The fix is to cache `v.size()` before the loop and use index-based iteration with a decrementing bound after each erase.",
      "`erase` is O(n) per call, and calling it inside a loop is O(n-squared), which causes a stack overflow on large vectors. The fix is to swap each negative element to the back and call `v.resize()` once after the loop completes.",
      "The crash is a data race: `erase` triggers a reallocation that moves the vector's buffer to a new heap address, but `v.end()` still points to the old buffer. The fix is to reserve enough capacity before the loop to prevent reallocation.",
    ],
    correctIndex: 0,
    explanation:
      "For a vector, erasing invalidates iterators from the erased position onward. erase returns the next valid iterator, so advance via `it = v.erase(it)`; C++20's std::erase_if does it in one call. Invalidation rules differ per container (list/map keep other iterators valid).",
  },
  {
    slug: "cpp-oop-l4-constref-lifetime",
    competencyId: "cpp-oop",
    depthTier: 4,
    sectionHeading: "Const-reference lifetime extension",
    prompt:
      "A colleague writes: `const auto& m = std::min(std::string(\"a\"), std::string(\"b\"));` and uses `m` later. Under AddressSanitizer, it reports a stack-use-after-scope. Yet binding a temporary to `const auto&` normally extends the temporary's lifetime. Why does it fail here?",
    options: [
      "`std::min` returns a `const&` to one of its arguments. Lifetime extension applies only when a temporary is bound directly to the reference — it does not propagate through a function returning by reference. Both temporaries die at the semicolon; `m` dangles.",
      "`std::min` is a constexpr function, and constexpr return values are materialized as compile-time constants in read-only memory. The `const auto&` tries to bind to that read-only location, which ASan flags as an out-of-scope access.",
      "Lifetime extension works, but only for the first temporary argument. `std::min` may return either argument, and the second temporary is always destroyed at the semicolon regardless, so `m` dangles roughly fifty percent of the time.",
      "`const auto&` deduces to `const std::string*`, not `const std::string&`, because `std::min` is overloaded to return a pointer when both arguments are rvalues. The pointer dangles because the pointed-to temporaries are destroyed.",
    ],
    correctIndex: 0,
    explanation:
      "A const& (or rvalue ref, or auto&&) bound directly to a temporary keeps it alive. But if the temporary is returned by reference from a function, extension does not propagate, so `const auto& x = std::min(A(), B())` dangles.",
  },
  // ── L5 ──
  {
    slug: "cpp-oop-l5-move",
    competencyId: "cpp-oop",
    depthTier: 5,
    sectionHeading: "Move Semantics and Rvalue References",
    prompt:
      "You call `std::vector<std::string> v2 = std::move(v1);` and expect zero copies. In the debugger, `v1` is now empty but still a valid object. A teammate says 'std::move physically relocates the data at runtime.' Is that accurate, and what does std::move actually do?",
    options: [
      "Not accurate. `std::move` is a zero-cost compile-time cast to `T&&` (an rvalue reference) that lets overload resolution pick the move constructor. The move constructor steals the heap pointer from `v1`, leaving it valid but empty — no bytes are relocated.",
      "Partially accurate. `std::move` calls `memcpy` on the object's internal buffer to relocate the data, then zeroes the source. It is not a cast — the compiler generates actual relocation code, which is why moves are cheaper than copies but not free.",
      "Not accurate in general, but true for trivially-movable types. For trivial types, `std::move` compiles to a single `memcpy`. For non-trivial types like `vector<string>`, it falls back to the copy constructor and then destroys the source.",
      "Accurate for small-buffer-optimized types like `std::string`. When the string fits in the SSO buffer, `std::move` must physically copy the bytes because there is no heap pointer to steal. Only heap-allocated strings get a zero-copy pointer swap.",
    ],
    correctIndex: 0,
    explanation:
      "std::move just casts to T&&, enabling overload resolution to pick the move constructor/assignment (an O(1) resource steal). The moved-from object is left valid but unspecified — ensure it doesn't retain sensitive data.",
  },
  {
    slug: "cpp-oop-l5-forwarding",
    competencyId: "cpp-oop",
    depthTier: 5,
    sectionHeading: "Perfect Forwarding and Universal References",
    prompt:
      "You write a factory: `template<typename T, typename... Args> auto make(Args&&... args) { return T(std::forward<Args>(args)...); }`. A reviewer asks why you use `std::forward` instead of `std::move`. What is the critical difference?",
    options: [
      "`Args&&` in a deduced context is a forwarding (universal) reference binding to both lvalues and rvalues. `std::forward<Args>` preserves the original value category — lvalues stay lvalues, rvalues stay rvalues. `std::move` would unconditionally cast everything to rvalue, potentially moving from a caller's lvalue.",
      "`std::forward` calls `std::move` internally when the argument is an rvalue and makes a copy when it is an lvalue. It is syntactic sugar combining move and copy semantics in one call, whereas `std::move` always moves regardless of source category.",
      "`std::forward` performs a runtime check on the argument's value category using RTTI and dispatches to either the copy or move constructor accordingly. `std::move` skips this check for performance, which is why it can accidentally steal from lvalues.",
      "`std::forward` and `std::move` are identical at the language level — both cast to `T&&`. The convention is to use `forward` in templates and `move` elsewhere, but the compiler treats them as interchangeable and generates identical code.",
    ],
    correctIndex: 0,
    explanation:
      "In a deduced context, `T&&` is a forwarding reference. std::forward<T> conditionally casts back to rvalue only if the caller passed an rvalue — the basis of emplace_back, make_unique, and make_shared.",
  },
  {
    slug: "cpp-oop-l5-variadic",
    competencyId: "cpp-oop",
    depthTier: 5,
    sectionHeading: "Variadic Templates and Fold Expressions",
    prompt:
      "Before C++17, summing a variadic parameter pack required a recursive template: a base case for one argument and a recursive case that peels off the first. With C++17, you write `(... + args)` and it works. What is this feature called, and what does the compiler expand it to?",
    options: [
      "A fold expression. `(... + args)` is a left fold that the compiler expands to `((arg1 + arg2) + arg3) + ...` at compile time, eliminating the need for recursive template instantiation and the base-case specialization entirely.",
      "A parameter-pack reduction. The compiler generates a runtime loop iterating over the arguments stored in a `std::tuple`, calling `operator+` on each element sequentially. It is syntactic sugar for `std::accumulate` applied to the pack.",
      "A constexpr fold. The compiler evaluates the entire sum at compile time via constexpr evaluation, producing a single constant in the binary. If any argument is not constexpr, the expression is ill-formed and compilation fails.",
      "A pack expansion with implicit recursion. The compiler still generates recursive template instantiations internally — the fold syntax is purely cosmetic sugar. Compile times and template-depth limits are unchanged from the C++14 approach.",
    ],
    correctIndex: 0,
    explanation:
      "A fold expression expands a parameter pack over an operator, e.g. `(... + args)` sums all arguments. Variadic templates underlie std::tuple, std::variant, and type-safe std::format.",
  },
  {
    slug: "cpp-oop-l5-constexpr",
    competencyId: "cpp-oop",
    depthTier: 5,
    sectionHeading: "Compile-Time Programming with constexpr and consteval",
    prompt:
      "You replace a runtime lookup table of CRC32 values with a `constexpr` function that computes them at compile time. A security reviewer asks what attack-surface benefit this provides, if any. What is the key security argument for compile-time computation?",
    options: [
      "Computation performed at compile time produces a constant baked into the binary — it has zero runtime attack surface. No input can influence the result at runtime, eliminating vulnerability classes tied to that computation path.",
      "Compile-time computation encrypts the resulting constants in the binary using the build system's signing key. An attacker reading the binary sees only ciphertext, whereas runtime-computed values would be visible in plaintext in memory.",
      "Compile-time computation guarantees constant-time execution, eliminating timing side channels. A runtime CRC32 loop leaks information about input length through variable execution time, which constexpr prevents by fixing it to one cycle.",
      "The security benefit is binary hardening: constexpr values are placed in a read-only, execute-never page (.rodata) that the OS protects with W^X. Runtime values in .data are writable, so an attacker could corrupt them via an arbitrary write.",
    ],
    correctIndex: 0,
    explanation:
      "constexpr functions fold to constants when inputs are known (consteval requires it). Computation done at build time can't be attacked at run time — e.g. compile-time hashing for switch-on-string, or bounds checks resolved before shipping.",
  },
  {
    slug: "cpp-oop-l5-sfinae",
    competencyId: "cpp-oop",
    depthTier: 5,
    sectionHeading: "SFINAE, Concepts, and Type Constraints",
    prompt:
      "You write a template function using `std::enable_if` to restrict it to integral types, but the error message on a bad instantiation is 200 lines of nested template failures. A colleague says C++20 concepts fix this. How do concepts improve on SFINAE?",
    options: [
      "Concepts let you write constraints as named, readable predicates (e.g. `template<std::integral T>`). When a type fails a concept check, the compiler reports exactly which requirement was not met, replacing SFINAE's cascading substitution-failure diagnostics.",
      "Concepts evaluate constraints at runtime using RTTI rather than at compile time, so failed constraints produce a clean `std::bad_concept_cast` exception with a human-readable message instead of any compile-time error at all.",
      "Concepts replace templates entirely with a new dispatch mechanism. Instead of generating code per type at compile time, concepts create a single function using runtime concept tables (similar to vtables) for type-safe dispatch.",
      "Concepts are syntactic sugar that the compiler desugars into `enable_if` internally. The error-message improvement comes from the compiler's diagnostic engine, which recognizes concept syntax and reformats the same SFINAE errors more concisely.",
    ],
    correctIndex: 0,
    explanation:
      "SFINAE removes non-matching overloads silently but yields brutal error messages. Concepts (e.g. `template <std::integral T>`) express the same constraints clearly and produce targeted diagnostics.",
  },
  {
    slug: "cpp-oop-l5-binlayout",
    competencyId: "cpp-oop",
    depthTier: 5,
    sectionHeading: "C++ Binary Layout and Exploitation",
    prompt:
      "While reversing a stripped C++ binary, you find a pointer at offset 0 of a heap object that points into .rodata. Following that pointer, you see an array of code addresses, and further down, a mangled string starting with `_ZTI`. What can you recover from this layout?",
    options: [
      "The pointer is the vptr, the array is the vtable (virtual function addresses), and the `_ZTI` prefix marks the RTTI `typeinfo` structure. Cross-referencing vtable writes finds constructors; demangling `_ZTI` with `c++filt` recovers the class name.",
      "The pointer is the EH (exception handling) personality function, the array is the LSDA (Language-Specific Data Area) table, and `_ZTI` is the exception type name used by the unwinder to match catch clauses during stack unwinding.",
      "The pointer is the object's allocator metadata, the array is a free-list of available heap slots maintained by the C++ runtime, and `_ZTI` is a heap cookie the allocator uses to detect double-free corruption.",
      "The pointer is the thread-local storage (TLS) key, the array is the TLS initialization vector for thread-local members, and `_ZTI` is the TLS segment name embedded by the linker for dynamic loader resolution.",
    ],
    correctIndex: 0,
    explanation:
      "A polymorphic object begins with a vptr into a vtable in .rodata; cross-referencing it finds constructors and virtual methods, and RTTI typeinfo (if present) names the class. c++filt demangles the Itanium-ABI symbols.",
  },
  {
    slug: "cpp-oop-l5-security-patterns",
    competencyId: "cpp-oop",
    depthTier: 5,
    sectionHeading: "Modern C++ Security Patterns",
    prompt:
      "You audit a C function that takes `void* buf, size_t len` and discover a bug where the caller passes the wrong `len`, causing an out-of-bounds read. The fix uses C++20's `std::span`. A colleague asks: 'How does span prevent this — does it not just wrap a pointer too?'",
    options: [
      "Yes, span wraps a pointer, but it bundles the pointer and its length into one indivisible object. The caller cannot pass a mismatched size because span carries the correct length from construction, eliminating the 'pointer + separate size' mismatch class entirely.",
      "Span performs bounds checking on every element access at runtime and throws `std::out_of_range` if the index exceeds the length. The safety comes from these runtime checks, not from bundling — a caller can still construct a span with a wrong length.",
      "Span allocates its own internal copy of the buffer on construction, so even if the original pointer is freed, the span's copy remains valid. The length is derived from the copy's allocation size, making mismatches impossible by design.",
      "Span uses compile-time dependent types (like Rust's lifetime annotations) to statically verify pointer and length consistency. The compiler rejects any span construction where it cannot prove the length matches the buffer's allocation size.",
    ],
    correctIndex: 0,
    explanation:
      "std::span bundles a pointer and a size, eliminating the classic 'pointer + separate length that gets out of sync' bug. std::optional similarly replaces error-prone null pointers with explicit nullable values.",
  },
  {
    slug: "cpp-oop-l5-typeerasure",
    competencyId: "cpp-oop",
    depthTier: 5,
    sectionHeading: "Type erasure pattern",
    prompt:
      "You need a `std::vector<Callback>` that stores lambdas, function pointers, and functors — all with signature `void(int)`. Using `std::function<void(int)>` works. A colleague asks: 'How can one type hold such different callable types without them sharing a base class?' What pattern does `std::function` use internally?",
    options: [
      "Type erasure: internally, `std::function` defines an abstract Concept interface with a virtual `operator()`, and a templated Model<T> wrapping the concrete callable. The wrapper stores any callable behind one uniform value-semantic type via virtual dispatch.",
      "Template monomorphization: `std::function` is a class template the compiler instantiates separately for each callable type stored in the vector, with implicit conversions between instantiations so they coexist in one container.",
      "Union-based dispatch: `std::function` contains a `std::variant` of all callable types it might hold, determined at compile time from the vector's usage. A `std::visit` call dispatches to the correct alternative when `operator()` is invoked.",
      "C-style function-pointer casting: `std::function` converts every callable to a raw `void(*)(int)` function pointer using a trampoline. Lambdas with captures are lifted to free functions with an implicit context parameter passed via a global.",
    ],
    correctIndex: 0,
    explanation:
      "Type erasure hides concrete types behind a value-semantic wrapper: an abstract Concept plus a templated Model<T> holds the object and forwards calls via virtual dispatch — how std::function stores any callable without a shared base class.",
  },
];
