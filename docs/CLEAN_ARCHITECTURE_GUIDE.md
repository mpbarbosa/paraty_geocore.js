# Clean Architecture Guide

Organising `paraty_geocore.js` into clear, stable layers keeps the domain logic
independent of infrastructure concerns and makes every module easy to test, review,
and evolve.

## Goal

Organise the library into layers where inner layers hold stable domain rules and
outer layers hold volatile implementation details. All dependencies must point
inward. No inner layer may import from an outer layer.

## What Clean Architecture Means Here

The library's architecture maps directly onto three layers:

| Layer | Location | Contents |
|-------|----------|----------|
| **Domain core** | `src/core/` | `GeoPosition`, `GeocodingState`, `ReferencePlace`, `PositionManager`, `ObserverSubject`, `DualObserverSubject`, `ObserverMixin`, `errors` |
| **Utilities** | `src/utils/` | `calculateDistance`, `delay`, `log`/`warn` — pure or near-pure helpers |
| **Entry point** | `src/index.ts` | Public re-exports; the only file that wires the surface area together |

In practice it means:

1. `src/core/` files may import from `src/utils/` and from the two upstream
   packages (`bessa_patterns.ts`, `ibira.js`), but never from `src/index.ts` or
   from other outer layers.
2. `src/utils/` files must remain framework-free. They may not import from
   `src/core/`.
3. `src/index.ts` re-exports the public API. It does not own logic.
4. Tests import the modules under test directly. They do not go through
   `src/index.ts` unless testing the re-export surface itself.

It does **not** mean introducing ceremony for its own sake. The library's scope
is small; keep the layering lightweight and proportional.

## Why It Matters

1. Domain logic (`GeoPosition`, `ReferencePlace`, etc.) can be tested without
   any runtime environment or external service.
2. Infrastructure details (browser Geolocation API shape, OSM field names) are
   translated at the boundary — they do not define internal types.
3. Use-case orchestration (`PositionManager`, `GeocodingState`) depends on the
   domain layer, not the other way around.
4. A new entry point (Node.js CLI, test harness, React hook) can consume the
   library without duplicating core logic.
5. The library's public surface (`src/index.ts`) is the only place a downstream
   caller should need to understand.

## Layer Reference

### Domain core — `src/core/`

This is the most stable layer. Files here own the library's real concepts and
invariants:

- `GeoPosition` — immutable, normalised wrapper around a geolocation fix.
  Constructed from a `GeolocationCoordinates`-shaped object; does not import
  browser APIs directly.
- `GeocodingState` — observer-based geocoding state machine. Depends on
  `ObserverSubject` (imported from `bessa_patterns.ts`).
- `ReferencePlace` — immutable OSM point-of-interest wrapper. Translates raw
  OSM element fields into typed, Portuguese-labelled domain values.
- `PositionManager` — singleton position manager. Configures distance/time
  thresholds and forwards qualifying fixes to subscribers. Depends on
  `GeoPosition` and `ObserverSubject`.
- `ObserverSubject`, `DualObserverSubject`, `ObserverMixin` — re-exported from
  `bessa_patterns.ts`; kept in `src/core/` because they are part of the
  library's domain surface.
- `errors` — custom error types (`GeoPositionError`).

**Allowed imports:** `src/utils/`, `bessa_patterns.ts`, `ibira.js`, `src/core/`
peers.
**Forbidden imports:** `src/index.ts`, browser platform APIs as direct
dependencies (use constructor parameters or type guards instead).

### Utilities — `src/utils/`

This layer holds helpers with no domain knowledge. Utility files should be pure
or near-pure:

- `distance.ts` — `calculateDistance` (Haversine formula). Pure function:
  accepts numbers, returns a number.
- `async.ts` — `delay`. Side-effecting (`setTimeout`) but its async contract is
  explicit and deterministic for callers.
- `logger.ts` — `log`/`warn`. Side-effecting (console output) but isolated from
  all domain logic.

**Allowed imports:** language builtins, each other where justified.
**Forbidden imports:** `src/core/` (would create upward coupling).

### Entry point — `src/index.ts`

Exports the entire public API. Contains no logic of its own. Downstream callers
import from here; `src/core/` and `src/utils/` files never do.

## Dependency Direction Rules

```text
src/utils/     ←  src/core/  ←  src/index.ts  ←  callers
bessa_patterns.ts  ←  src/core/
ibira.js           ←  src/core/
```

Arrows show allowed import direction. Reversing any arrow breaks the
architecture.

## Review Heuristics

### Framework Import Test

Does any file in `src/core/` or `src/utils/` import from a runtime platform
(`window`, `navigator`, browser APIs, Node.js `fs`, etc.)? If yes, the import
should either move outward or the platform dependency should be passed in as a
parameter.

### Isolation Test

Can every file in `src/core/` and `src/utils/` be exercised with Jest without
starting a browser, a server, or an external service? If no, a boundary is
leaking.

### Upward Coupling Test

Does any file in `src/utils/` import from `src/core/`? Does any file in
`src/core/` import from `src/index.ts`? Either pattern is a dependency-direction
violation.

### Composition Root Test

Is `src/index.ts` the only file that assembles the full public surface? If
module wiring is scattered across `src/core/` files, refactor the wiring back
to the entry point.

## Positive Signals

- `src/core/` tests do not require browser globals unless explicitly injecting
  a stub.
- `src/utils/` files have no `import` from `src/core/`.
- `GeoPosition` can be constructed with a plain object in tests — it does not
  import `navigator.geolocation`.
- A new utility function can be added to `src/utils/` without touching any
  `src/core/` file.

## Warning Signs

- A `src/core/` file directly references `navigator`, `window`, or any platform
  global.
- `calculateDistance` or another utility imports a domain class.
- `src/index.ts` contains conditional logic, not just re-exports.
- Tests require a real browser environment to exercise pure domain behavior.
- `GeoPosition` or `ReferencePlace` import from `src/index.ts`.

## Related Guides

- [HIGH_COHESION_GUIDE.md](./HIGH_COHESION_GUIDE.md) — keeping each module
  focused on one clear responsibility within its layer.
- [LOW_COUPLING_GUIDE.md](./LOW_COUPLING_GUIDE.md) — keeping dependencies
  explicit and dependency direction enforced.
- [LIGHTWEIGHT_DDD_GUIDE.md](./LIGHTWEIGHT_DDD_GUIDE.md) — naming domain
  concepts and separating policy logic from infrastructure.
- [REFERENTIAL_TRANSPARENCY.md](./REFERENTIAL_TRANSPARENCY.md) — keeping domain
  and utility logic pure and testable.

## Summary Checklist

- [ ] Dependencies only point inward — `src/utils/` ← `src/core/` ← `src/index.ts`.
- [ ] `src/core/` files have no direct browser or Node.js platform imports.
- [ ] `src/utils/` files do not import from `src/core/`.
- [ ] `src/index.ts` contains re-exports only, no domain logic.
- [ ] Domain and utility logic can be exercised with Jest without environment setup.
- [ ] A reviewer or LLM can identify any file's layer from its imports alone.
