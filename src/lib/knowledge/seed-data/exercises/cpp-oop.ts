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
];
