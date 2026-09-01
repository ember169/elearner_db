import type { SeedExercise } from "./types";

/**
 * Pilot set — cpp-oop L2 "Inheritance, Polymorphism, and Virtual Functions".
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
      "In the example, `Dog`'s constructor is written `Dog(const std::string &name) : Animal(name) {}`. Why must it call `Animal(name)` in its initializer list?",
    options: [
      "`Animal` only defines a constructor taking a string, so it has no default constructor — the derived object must initialize its base sub-object explicitly.",
      "C++ requires every derived constructor to name its base constructor, even when the base has a default constructor.",
      "Because `makeSound()` is virtual, the base must be constructed by name before the vtable is set up.",
      "Because `_name` is `private` in `Animal` and can only be assigned through the base constructor.",
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
      "A function takes `const Animal &a` and calls `a.makeSound()`, which is declared `virtual`. If a `Dog` object is passed, which version runs and why?",
    options: [
      "`Dog::makeSound`, because a virtual call resolves at runtime to the dynamic type of the referred-to object.",
      "`Animal::makeSound`, because the reference's static type is `Animal`.",
      "Whichever `makeSound` the compiler saw last during translation.",
      "It is undefined behaviour unless you first `static_cast` the reference to `Dog&`.",
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
      "`AShape` has two pure virtuals, `area()` and `perimeter()`. `Square` overrides `area()` but not `perimeter()`. What is true of `Square`?",
    options: [
      "`Square` is still abstract and cannot be instantiated — one inherited pure virtual remains unimplemented, so its vtable still has an empty slot.",
      "`Square` is concrete; overriding any one of the pure virtuals is enough to instantiate it.",
      "`Square` fails to compile entirely until both pure virtuals are overridden.",
      "`Square` is concrete, and calling `perimeter()` simply returns 0 by default.",
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
      "C++ has no `interface` keyword. How is an interface expressed idiomatically?",
    options: [
      "As a class whose methods are all pure virtual (plus a virtual destructor) — an abstract contract with no implementation.",
      "As a `struct` in which every member is declared `public`.",
      "As a class marked `final` so it cannot be modified.",
      "As a template class that declares no data members.",
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
      "`B` and `C` each inherit from `A`, and `D` inherits from both. Why is `d.x` ambiguous, and what removes the ambiguity?",
    options: [
      "`D` contains two separate `A` sub-objects (one via `B`, one via `C`); making `B` and `C` inherit `virtual public A` gives `D` a single shared `A`.",
      "`x` must be declared `static`, which forces a single shared copy across `B` and `C`.",
      "The only fix is to rename `x` in either `B` or `C` so the two copies no longer collide.",
      "It is ambiguous because `x` is private; widening it to public resolves the conflict.",
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
      "Why does overwriting a polymorphic object's `vptr` hand an attacker control of execution?",
    options: [
      "A virtual call follows the vptr to the vtable and calls through it, so a forged vptr redirects the next virtual call to attacker-chosen code.",
      "The vptr stores the function's return address, so overwriting it hijacks the `ret` instruction.",
      "The vptr holds the stack canary, and changing it disables the overflow check.",
      "Overwriting the vptr enlarges the object, which itself corrupts the heap.",
    ],
    correctIndex: 0,
    explanation:
      "Each polymorphic object begins with a vptr → vtable → function pointers. A virtual call walks that chain, so if a heap overflow, use-after-free, or type confusion lets the attacker repoint the vptr at a fake vtable, the next virtual call jumps into their code. CFI and vtable verification exist specifically to detect this.",
  },
  {
    slug: "cpp-oop-l2-object-slicing",
    competencyId: "cpp-oop",
    depthTier: 2,
    sectionHeading: "Object slicing",
    prompt:
      "After `std::vector<Animal> v; v.push_back(Dog(\"Rex\"));`, calling `v[0].speak()` prints the generic base output, not Rex's bark. Why?",
    options: [
      "A `vector<Animal>` stores `Animal` values, so copying the `Dog` in keeps only the base part — the derived members and the Dog vtable are sliced away.",
      "`push_back` skips the copy constructor, so the stored element is left empty.",
      "`speak()` is not virtual, so the base version always runs regardless of the real type.",
      "`std::vector` stores pointers internally, which makes the call dispatch to `Animal`.",
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
    prompt: "What did C++ add to C?",
    options: [
      "Object-oriented programming, templates (generic programming), and stronger type safety, while staying largely backward-compatible with C.",
      "Automatic garbage collection and a virtual machine.",
      "Removal of pointers and manual memory management.",
      "A built-in interpreter that replaces compilation.",
    ],
    correctIndex: 0,
    explanation:
      "“C with Classes” kept C's model and added OOP, templates, and stronger typing. It also inherits C's memory-safety issues and adds new attack surface — notably vtable hijacking.",
  },
  {
    slug: "cpp-oop-l0-oop-concepts",
    competencyId: "cpp-oop",
    depthTier: 0,
    sectionHeading: "Core OOP Concepts",
    prompt: "Which OOP principle lets different classes respond to the same interface in different ways?",
    options: [
      "Polymorphism (in C++, via virtual functions).",
      "Encapsulation.",
      "Inheritance.",
      "Abstraction.",
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
    prompt: "What is a vtable, and why does it matter for security?",
    options: [
      "A per-class table of function pointers used for dynamic dispatch; corrupting an object's vtable pointer redirects virtual calls to attacker-chosen code.",
      "A table of a class's data-member offsets, used only by the debugger.",
      "The stack frame layout of a member function.",
      "A cache of recently constructed objects.",
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
    prompt: "Which four special members does 42's Orthodox Canonical Form require every class to define?",
    options: [
      "Default constructor, copy constructor, copy assignment operator, and destructor.",
      "Constructor, destructor, move constructor, and swap.",
      "Getter, setter, constructor, and destructor.",
      "operator new, operator delete, constructor, and destructor.",
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
    prompt: "Why prefer a member initializer list over assignment in the constructor body?",
    options: [
      "It initializes members directly in one step, and const or reference members can only be initialized that way.",
      "It runs the constructor body twice for safety.",
      "It disables the copy constructor.",
      "It is required by the compiler for all members.",
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
    prompt: "Why make data members private and expose public getters/setters?",
    options: [
      "It lets the class validate inputs and enforce its invariants (e.g. balance never goes negative).",
      "It makes the object smaller in memory.",
      "It is required for inheritance to work.",
      "It speeds up member access.",
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
    prompt: "How do prefix and postfix `operator++` differ?",
    options: [
      "Prefix returns a reference to the modified object; postfix takes a dummy `int` parameter and returns a copy of the value before modification.",
      "Prefix returns a copy; postfix returns a reference.",
      "They are identical; the compiler picks one at random.",
      "Postfix cannot be overloaded.",
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
    prompt: "What does RAII guarantee?",
    options: [
      "A resource acquired in a constructor is released in the destructor, which runs automatically — even during stack unwinding from an exception.",
      "Resources are freed only when the program exits.",
      "Memory is garbage-collected in the background.",
      "Resources must be released manually in a finally block.",
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
    prompt: "When should you reach for unique_ptr versus shared_ptr?",
    options: [
      "unique_ptr by default for single ownership (zero overhead); shared_ptr only when ownership is genuinely shared, since it carries a reference count.",
      "shared_ptr always, because it is safer.",
      "unique_ptr only for arrays, shared_ptr for everything else.",
      "Whichever compiles; they are interchangeable.",
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
    prompt: "What does the “strong exception guarantee” mean?",
    options: [
      "If the operation throws, program state is unchanged — as if it was never called (often achieved via copy-and-swap).",
      "The operation can never throw.",
      "Any thrown exception is silently swallowed.",
      "The program terminates on any exception.",
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
    prompt: "What does the modern “Rule of Zero” recommend?",
    options: [
      "Define no special member functions; use RAII members (smart pointers, containers) so the compiler-generated defaults are correct.",
      "Define all five special members on every class.",
      "Never use destructors.",
      "Always delete the copy constructor.",
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
    prompt: "Which C++ cast is runtime-checked for polymorphic types and returns nullptr on failure (for pointers)?",
    options: [
      "dynamic_cast.",
      "static_cast.",
      "reinterpret_cast.",
      "const_cast.",
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
    prompt: "Which is a correct exception-handling best practice?",
    options: [
      "Throw exceptions by value and catch them by const reference; never throw from a destructor.",
      "Throw pointers to heap-allocated exceptions and catch by pointer.",
      "Throw from destructors to signal cleanup errors.",
      "Rely on catch blocks (not RAII) to release resources.",
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
    prompt: "What does a function template give you?",
    options: [
      "One definition that the compiler instantiates separately for each type it is used with — compile-time generic code with no runtime dispatch.",
      "A single runtime function that accepts any type via reflection.",
      "A macro that textually substitutes types.",
      "A virtual function resolved at run time.",
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
    prompt: "What is `std::vector<T>` an example of?",
    options: [
      "A class template — the compiler generates a distinct class for each type argument at compile time.",
      "A runtime polymorphic base class.",
      "A macro expansion.",
      "A single class that stores values of any type via type erasure.",
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
    prompt: "Which STL container offers O(1) average lookup but keeps no ordering?",
    options: [
      "unordered_map (a hash table); std::map/std::set are O(log n) and ordered (a red-black tree).",
      "std::map — it is both O(1) and ordered.",
      "std::vector — it has O(1) search.",
      "std::list — it has O(1) search.",
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
    prompt: "Why do STL algorithms operate on iterator ranges rather than on containers directly?",
    options: [
      "It decouples algorithms from data structures, so any container that exposes suitable iterators works with any algorithm.",
      "Iterators are faster than references in every case.",
      "Containers cannot be passed by value.",
      "It lets algorithms modify the container's type at runtime.",
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
    prompt: "std::sort requires random-access iterators. Which container therefore cannot use it?",
    options: [
      "std::list — it provides only bidirectional iterators, so it offers its own list::sort instead.",
      "std::vector — its iterators are too weak for sort.",
      "std::deque — it has no iterators.",
      "std::array — it is not sortable.",
    ],
    correctIndex: 0,
    explanation:
      "Iterator categories run input/output → forward → bidirectional → random-access. std::sort needs random access (vector, deque, array); std::list only offers bidirectional iterators, hence its member sort.",
  },
  {
    slug: "cpp-oop-l4-specialization",
    competencyId: "cpp-oop",
    depthTier: 4,
    sectionHeading: "Template Specialisation",
    prompt: "What is template specialization?",
    options: [
      "Providing a distinct implementation of a template for a specific type (or set of type) arguments.",
      "Marking a template as final so it cannot be instantiated.",
      "Compiling a template only in debug builds.",
      "Converting a template into a virtual function.",
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
    prompt: "What does a lambda's capture list control?",
    options: [
      "Which enclosing variables the lambda can use, and whether each is captured by value ([=], [x]) or by reference ([&], [&x]).",
      "The lambda's return type only.",
      "The number of parameters the lambda accepts.",
      "Whether the lambda runs at compile time.",
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
    prompt: "Why is `v.erase(it)` inside a `for (…; ++it)` loop over a vector a bug?",
    options: [
      "erase invalidates the iterator at (and after) the erased element, so the subsequent ++it is undefined behaviour; use `it = v.erase(it)` or std::erase_if.",
      "vector has no erase method.",
      "erase always clears the whole vector.",
      "The loop never terminates but is otherwise safe.",
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
    prompt: "Binding a temporary to a `const&` extends its lifetime — where does this NOT hold?",
    options: [
      "It does not extend through a function that returns a reference (e.g. std::min of two temporaries) — the result dangles.",
      "It does not work for std::string temporaries.",
      "It only works inside a class constructor.",
      "It never extends lifetime at all.",
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
    prompt: "What does std::move actually do at runtime?",
    options: [
      "Nothing — it is a compile-time cast of an lvalue to an rvalue reference, which lets a move constructor steal resources instead of copying.",
      "It physically relocates the object's bytes to a new address.",
      "It frees the source object immediately.",
      "It performs a deep copy and then deletes the original.",
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
    prompt: "What is a forwarding (universal) reference, and what preserves an argument's value category?",
    options: [
      "`T&&` on a deduced template parameter binds to both lvalues and rvalues; std::forward<T> passes it on as the same category it arrived as.",
      "`T&&` always means rvalue reference; std::move preserves the category.",
      "`const T&` binds to everything; std::copy preserves the category.",
      "There is no way to preserve value category in a template.",
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
    prompt: "What do C++17 fold expressions simplify?",
    options: [
      "Applying an operator across a variadic parameter pack (e.g. `(... + args)`) without writing manual recursion.",
      "Folding a 2D array into one dimension.",
      "Compressing template code to reduce binary size.",
      "Converting recursion into iteration at runtime.",
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
    prompt: "What is the security value of constexpr/consteval computation?",
    options: [
      "Work performed at compile time has no runtime attack surface, so moving checks to compile time can eliminate whole vulnerability classes.",
      "It encrypts the computed values in the binary.",
      "It makes all runtime code constant-time against timing attacks.",
      "It disables the optimizer for safety.",
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
    prompt: "What do C++20 concepts improve over classic SFINAE (enable_if)?",
    options: [
      "They constrain templates with clean, readable syntax and report exactly which requirement failed, instead of pages of instantiation errors.",
      "They make templates run at runtime instead of compile time.",
      "They remove the need for templates entirely.",
      "They allow templates to bind to incompatible types silently.",
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
    prompt: "When reversing a C++ binary, what does the vptr at the start of a polymorphic object let you recover?",
    options: [
      "The object's class and its virtual methods — constructors write the vptr, and unstripped RTTI/typeinfo gives class names.",
      "The values of all the object's private members.",
      "The program's stack canary.",
      "The heap allocation size of the object.",
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
    prompt: "What buffer-safety problem does std::span (C++20) address?",
    options: [
      "It is a non-owning view that always carries the correct length, so passing data as a span prevents overflows from mismatched size arguments.",
      "It encrypts the buffer's contents.",
      "It makes the buffer immutable.",
      "It garbage-collects the buffer when unused.",
    ],
    correctIndex: 0,
    explanation:
      "std::span bundles a pointer and a size, eliminating the classic “pointer + separate length that gets out of sync” bug. std::optional similarly replaces error-prone null pointers with explicit nullable values.",
  },
  {
    slug: "cpp-oop-l5-typeerasure",
    competencyId: "cpp-oop",
    depthTier: 5,
    sectionHeading: "Type erasure pattern",
    prompt: "What does type erasure (as in std::function) achieve?",
    options: [
      "It stores any type satisfying a required interface behind one uniform wrapper, using an internal Concept/Model with virtual dispatch.",
      "It deletes type information so the program uses less memory.",
      "It converts every type to void* and casts back manually.",
      "It forces all types to share a common base class by inheritance.",
    ],
    correctIndex: 0,
    explanation:
      "Type erasure hides concrete types behind a value-semantic wrapper: an abstract Concept plus a templated Model<T> holds the object and forwards calls via virtual dispatch — how std::function stores any callable without a shared base class.",
  },
];
