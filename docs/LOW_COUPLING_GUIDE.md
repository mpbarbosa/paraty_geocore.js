# Low Coupling Guide

Modules in `paraty_geocore.js` should depend on as few other components as
practical. Dependencies must be explicit, stable, and flow in the correct
direction. This guide defines what low coupling means for this library and
provides heuristics for maintaining it.

## Goal

Each module should be able to do its job without knowing unnecessary details
about how other modules are implemented. Dependencies should be visible at the
import boundary, not hidden in globals or platform state.

## What Low Coupling Means Here

A loosely coupled module in this library:

- Imports only what it genuinely needs.
- Does not reach across to an unrelated context (e.g., `distance.ts` does not
  import `ReferencePlace`).
- Receives collaborators as constructor parameters or function arguments rather
  than pulling from singletons (except where `PositionManager`'s singleton
  design is intentional and documented).
- Depends on stable types and interfaces, not implementation details that may
  change.

## Current Dependency Map

```text
bessa_patterns.ts  →  src/core/ObserverSubject.ts       (re-export)
bessa_patterns.ts  →  src/core/DualObserverSubject.ts   (re-export)
bessa_patterns.ts  →  src/core/ObserverMixin.ts         (re-export)
bessa_patterns.ts  →  src/core/GeocodingState.ts        (extends ObserverSubject)
bessa_patterns.ts  →  src/core/PositionManager.ts       (uses ObserverSubject)
src/core/GeoPosition.ts  →  src/core/errors.ts
src/core/GeoPosition.ts  →  src/utils/logger.ts
src/core/ReferencePlace.ts  (no imports from src/)
src/core/PositionManager.ts  →  src/core/GeoPosition.ts
src/core/PositionManager.ts  →  src/utils/distance.ts
src/core/PositionManager.ts  →  src/utils/logger.ts
src/utils/distance.ts  (no imports from src/)
src/utils/async.ts    (no imports from src/)
src/utils/logger.ts   (no imports from src/)
src/index.ts          →  all of the above (re-exports only)
```

Arrows show import direction. Any arrow pointing the wrong way is a coupling
violation.

## Required Rules

1. `src/utils/` files must not import from `src/core/`. Utilities are
   dependency-free helpers; they must not acquire domain knowledge.
2. `src/core/` files may import from `src/utils/` and from `bessa_patterns.ts`
   or `ibira.js`, but not from each other unless there is a clear, documented
   domain dependency.
3. `src/index.ts` is the only file that may import from all layers
   simultaneously.
4. Do not hardcode cross-module references when a parameter or injected
   collaborator would work as well.
5. Avoid reading the `PositionManager` singleton directly from within other
   `src/core/` domain objects. Cross-singleton coupling is hard to test.
6. Keep shared configuration (thresholds, constants) in one place rather than
   repeating magic numbers across files.

## Positive Signals

- `calculateDistance` can be replaced with a test stub by simply passing a
  different function — it has no global state.
- `GeoPosition` tests do not need to instantiate `PositionManager` or
  `GeocodingState`.
- A new implementation of the observer pattern could be swapped in by changing
  the re-export in `src/core/ObserverSubject.ts` without touching any consumer.
- `delay`'s `setTimeout` dependency can be stubbed with Jest fake timers because
  the function does not bypass the timer system.
- `ReferencePlace` has zero imports from `src/` — it is fully self-contained.

## Warning Signs

- `src/utils/distance.ts` imports `GeoPosition` to access coordinates directly
  instead of accepting plain numbers.
- `src/core/GeocodingState.ts` reaches into `PositionManager` to read the
  current position.
- A utility function imports a domain class "for convenience."
- Two domain modules import each other in a cycle.
- A value is hardcoded identically in three different files with no shared
  constant.

## Applying Low Coupling by Module

| Module | Low-coupling approach |
|--------|-----------------------|
| `GeoPosition` | Accepts a coordinates-shaped plain object, not `GeolocationCoordinates` directly |
| `PositionManager` | Receives `calculateDistance` implicitly; the gate threshold is configurable |
| `ReferencePlace` | Accepts an `OsmElement`-shaped plain object; the mapping table is internal |
| `GeocodingState` | Inherits `ObserverSubject` — it does not know about `PositionManager` |
| `calculateDistance` | Accepts four numbers — no domain class dependency |
| `delay` | Wraps standard `setTimeout` — replaceable in tests with Jest fake timers |

## Refactoring for Lower Coupling

When a module imports too many others, or when a change in one module requires
coordinated edits in many files:

1. List all imports and check whether each is genuinely needed.
2. Replace class-level imports with parameter-level or constructor-level
   injection where practical.
3. Move shared constants to a single authoritative location.
4. Introduce a narrow type or interface at unstable boundaries instead of
   depending on the full concrete implementation.
5. Split modules that both own domain logic and manage many external
   dependencies.

## Review Heuristics

### Dependency Trace Test

Can you follow what the module depends on by reading only its `import` lines?
If the full dependency chain requires jumping through five other files, coupling
is probably too high.

### Change-Radius Test

If a collaborator changes its internal implementation (not its public API), do
many modules need coordinated edits? If yes, they know too much about each
other.

### Replacement Test

Could a dependency be swapped for a test double without changing the module
under test? If not, the dependency is too tightly wired in.

### Construction Test

Does a domain module construct its own collaborators (e.g., `new Logger()`
inside `GeoPosition`)? If yes, move construction to the caller or entry point.

## Related Guides

- [HIGH_COHESION_GUIDE.md](./HIGH_COHESION_GUIDE.md) — keeping each module
  focused on one responsibility so its dependency surface stays small.
- [CLEAN_ARCHITECTURE_GUIDE.md](./CLEAN_ARCHITECTURE_GUIDE.md) — layer
  boundaries that enforce dependency direction.
- [REFERENTIAL_TRANSPARENCY.md](./REFERENTIAL_TRANSPARENCY.md) — keeping pure
  helpers free of hidden coupling through globals or singletons.
- [LIGHTWEIGHT_DDD_GUIDE.md](./LIGHTWEIGHT_DDD_GUIDE.md) — translating external
  shapes at boundaries instead of letting them define internal modules.

## Summary Checklist

- [ ] `src/utils/` files have no imports from `src/core/`.
- [ ] `src/core/` files do not import from `src/index.ts`.
- [ ] No two `src/core/` files form an import cycle.
- [ ] Configurable values (thresholds, constants) are not hardcoded in multiple
      places.
- [ ] Pure utility functions accept plain primitive inputs, not domain objects.
- [ ] A module's full dependency set is visible from its `import` lines alone.
- [ ] A reviewer or LLM can see the module's dependencies without tracing
      through indirect globals or singletons.
