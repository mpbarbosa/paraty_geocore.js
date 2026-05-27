# High Cohesion Guide

Each module in `paraty_geocore.js` has one clear responsibility. This guide
defines what that means in practice and provides heuristics for keeping it true
as the library grows.

## Goal

Each file, class, and function should have one primary concern. Related behaviour
should stay together. Unrelated behaviour should be split into separate units
with explicit boundaries.

## What High Cohesion Means

A cohesive component can be described in one sentence:

- "`GeoPosition` normalises and wraps a raw geolocation fix."
- "`calculateDistance` computes the Haversine distance between two coordinates."
- "`ReferencePlace` translates OSM element fields into Portuguese POI descriptions."
- "`PositionManager` gates and forwards GPS fixes to subscribers."
- "`delay` wraps `setTimeout` in a Promise."

If the best description needs "and" more than once, the responsibility is
probably too broad.

## Current Module Responsibilities

| File | Single responsibility |
|------|-----------------------|
| `src/core/GeoPosition.ts` | Immutable, normalised geolocation position value object |
| `src/core/GeocodingState.ts` | Observable geocoding lifecycle state machine |
| `src/core/ReferencePlace.ts` | OSM POI wrapper with Portuguese-labelled descriptions |
| `src/core/PositionManager.ts` | Singleton position gate and subscriber coordinator |
| `src/core/ObserverSubject.ts` | Re-export of `ObserverSubject` from `bessa_patterns.ts` |
| `src/core/DualObserverSubject.ts` | Re-export of `DualObserverSubject` from `bessa_patterns.ts` |
| `src/core/ObserverMixin.ts` | Re-export of `withObserver` mixin from `bessa_patterns.ts` |
| `src/core/errors.ts` | Domain error types (`GeoPositionError`) |
| `src/utils/distance.ts` | Haversine distance calculation |
| `src/utils/async.ts` | Promise-based async helpers (`delay`) |
| `src/utils/logger.ts` | Structured console logging helpers (`log`, `warn`) |
| `src/index.ts` | Public re-export surface — no logic |

## Why It Matters

1. Components with one clear job are easier to understand at a glance.
2. Changes stay localised — adding a new OSM type only touches `ReferencePlace`.
3. Tests cluster naturally around one behaviour area per file.
4. Low-cohesion files tend to grow unboundedly and become hard to name.
5. Cohesive modules improve the quality of LLM-assisted edits: a narrowly
   focused file gives the model better, more predictable signals.

## Required Rules

1. A `src/core/` file must not mix domain logic with utility helpers or
   infrastructure wiring.
2. A `src/utils/` file must not accumulate unrelated helpers. If two utilities
   do not share purpose, put them in separate files.
3. `src/index.ts` must contain re-exports only — no conditional logic, no
   derived types.
4. Tests must mirror the source structure: `test/core/Foo.test.ts` tests
   `src/core/Foo.ts`. Cross-module test files belong in `test/integration/`.
5. New files should be named so the single responsibility is obvious without
   opening the file.

## Positive Signals

- Adding a new OSM classification only modifies `src/core/ReferencePlace.ts`
  and its test.
- A `GeoPosition` bug is debugged entirely within `GeoPosition.ts` and
  `GeoPosition.test.ts`.
- `src/utils/logger.ts` never imports from `src/core/`.
- Each test file is obviously named after the thing it tests.
- `PositionManager` does not own the distance calculation — it delegates to
  `calculateDistance`.

## Warning Signs

- A `src/core/` file contains both a domain class and a utility function.
- `src/utils/logger.ts` grows to include string formatting, OSM mapping, or
  position logic.
- `src/index.ts` begins containing helper functions.
- A test file tests two unrelated modules at once.
- A file accumulates `// ----` section dividers to justify unrelated logic
  living together.

## Applying Cohesion by Component Type

| Component type | Cohesive responsibility |
|----------------|------------------------|
| Domain class (`src/core/`) | Own the invariants and behaviour of one domain concept |
| Utility function (`src/utils/`) | Perform one transformation or side-effecting operation |
| Entry point (`src/index.ts`) | Expose the public surface; own no logic |
| Test file (`test/core/`) | Verify one module's public behaviour |
| Integration test (`test/integration/`) | Verify one interaction between two modules |
| FRS document (`docs/*-FRS.md`) | Specify the acceptance criteria for one module |

## Refactoring for Higher Cohesion

When a file grows hard to name or describe in one sentence:

1. List everything the file currently does.
2. Group behaviours by the data they operate on or the decision they make.
3. Extract unrelated groups into new, narrowly named files.
4. Keep composition in `src/index.ts` or `PositionManager`-level orchestrators.
5. Rename files and symbols so the single responsibility is obvious.
6. Verify each extracted file can be described in one sentence.

## Review Heuristics

### One-Sentence Test

Can the file's purpose be described without "and" or "also"?

### Change-Impact Test

When one behaviour changes, do unrelated parts of the same file also need
to change? If yes, cohesion is weak.

### Naming Test

If the best name for a new function is generic (`process`, `handle`, `manage`),
the responsibility is probably too broad.

## Related Guides

- [LOW_COUPLING_GUIDE.md](./LOW_COUPLING_GUIDE.md) — keeping dependencies
  between modules explicit and directional.
- [REFERENTIAL_TRANSPARENCY.md](./REFERENTIAL_TRANSPARENCY.md) — separating
  pure calculations from side-effecting orchestration.
- [CLEAN_ARCHITECTURE_GUIDE.md](./CLEAN_ARCHITECTURE_GUIDE.md) — assigning
  each file to the correct layer.
- [LIGHTWEIGHT_DDD_GUIDE.md](./LIGHTWEIGHT_DDD_GUIDE.md) — naming concepts
  precisely and keeping bounded contexts separate.

## Summary Checklist

- [ ] The file has one primary concern describable in one sentence.
- [ ] The file name matches its responsibility.
- [ ] Helpers inside the file directly support the primary concern.
- [ ] Side effects are at named boundary methods, not scattered through helpers.
- [ ] `src/utils/` files do not mix unrelated helper categories.
- [ ] `src/index.ts` contains re-exports only.
- [ ] A reviewer or LLM can infer the file's purpose from its name and exports
      without reading the implementation.
