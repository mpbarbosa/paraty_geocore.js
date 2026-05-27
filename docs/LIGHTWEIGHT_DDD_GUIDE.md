# Lightweight DDD Guide

`paraty_geocore.js` owns a real domain: geographic position data, geocoding
state, and OSM point-of-interest classification. Lightweight Domain-Driven Design
(DDD) keeps those concepts named, bounded, and stable without introducing
unnecessary ceremony.

## Goal

Use the parts of DDD that improve language, boundaries, and invariants for the
actual domain. Skip patterns that do not match the problem's real complexity.

## Ubiquitous Language

These terms should appear consistently across source code, tests, and
documentation. Avoid synonyms or informal substitutes.

| Term | Definition |
|------|------------|
| `GeoPosition` | An immutable snapshot of a geolocation fix, normalised from a `GeolocationCoordinates`-shaped input. |
| `GeocodingState` | An observable container for the current geocoding lifecycle state (idle, locating, located, error). |
| `PositionManager` | The singleton coordinator that receives raw GPS fixes, applies distance/time gate rules, and forwards qualifying positions to subscribers. |
| `ReferencePlace` | An immutable OSM point-of-interest wrapper that maps raw OSM `class`/`type` fields to typed, Portuguese-labelled descriptions. |
| `ObserverSubject` | The generic observable from `bessa_patterns.ts` that `GeocodingState` and `PositionManager` build on. |
| `DualObserverSubject` | An `ObserverSubject` variant that supports two independent subscriber channels. |
| `ObserverMixin` / `withObserver` | A mixin from `bessa_patterns.ts` for adding observable behaviour to arbitrary classes. |
| `accuracyQuality` | A derived quality label (`"high"`, `"medium"`, `"low"`) computed from the position's `accuracy` value. |
| `calculateDistance` | The Haversine-based pure function in `src/utils/distance.ts` that returns distance in metres between two lat/lng pairs. |
| `delay` | The async utility in `src/utils/async.ts` that wraps `setTimeout` in a `Promise`. |
| `NO_REFERENCE_PLACE` | The sentinel string `"Não classificado"` returned when a `ReferencePlace` cannot be mapped. |
| `VALID_REF_PLACE_CLASSES` | The frozen array of accepted OSM class names: `['place', 'shop', 'amenity', 'railway', 'building', 'leisure']`. |
| `referencePlaceMap` | The internal lookup that maps OSM `class`/`type` pairs to Portuguese descriptions. |
| `GeoPositionError` | The domain error type thrown by `GeoPosition` when constructed with invalid input. |
| `OsmElement` | The input shape expected by `ReferencePlace` — a plain object with `class`, `type`, and `name` fields drawn from OSM data. |

## Bounded Contexts

The library has two main contexts:

### 1. Geographic Position Context

**Files:** `src/core/GeoPosition.ts`, `src/core/PositionManager.ts`,
`src/utils/distance.ts`

**Responsibility:** Normalise, validate, and route GPS position data. Compute
derived metrics (accuracy quality, distance between fixes).

**Key invariants:**
- A `GeoPosition` is always immutable after construction (`Object.freeze`).
- `latitude` is clamped to `[-90, 90]`; `longitude` to `[-180, 180]`.
- `PositionManager` gates position updates by a configurable distance threshold;
  it does not pass every raw fix to subscribers.

**External vocabulary that must NOT leak in:** `GeolocationPosition`,
`GeolocationCoordinates`, `GeolocationPositionError` — these are browser API
types. They are translated at the `GeoPosition` constructor boundary.

### 2. Geocoding and POI Context

**Files:** `src/core/GeocodingState.ts`, `src/core/ReferencePlace.ts`

**Responsibility:** Track the geocoding lifecycle and classify OSM
points-of-interest with Portuguese descriptions.

**Key invariants:**
- A `ReferencePlace` is always immutable after construction (`Object.freeze`).
- Unknown OSM classes always produce `NO_REFERENCE_PLACE`.
- Unknown OSM types within a valid class fall back to `"<class>: <type>"`.

**External vocabulary that must NOT leak in:** Raw OSM field names (`amenity`,
`shop`, etc.) are translated inside `ReferencePlace`; calling code should use
`description` and `category`, not the raw OSM fields.

### 3. Observer Infrastructure Context

**Files:** `src/core/ObserverSubject.ts`, `src/core/DualObserverSubject.ts`,
`src/core/ObserverMixin.ts`

**Responsibility:** Re-export the upstream observer infrastructure from
`bessa_patterns.ts`. These are shared by both the position and geocoding contexts.

No new domain logic belongs here; these files are thin re-exports.

## Value Objects

The library is built almost entirely on value-object thinking. All primary domain
types are immutable and identity-free:

| Type | Why a value object |
|------|--------------------|
| `GeoPosition` | A position snapshot has no mutable identity — two fixes with the same coordinates are equal. Frozen at construction. |
| `ReferencePlace` | A POI classification is derived data with no lifecycle. Frozen at construction. |

**Rules for new types:**
1. Prefer immutable types (`Object.freeze` or `readonly`) over mutable objects.
2. Encode invariants close to construction (validate in the constructor, not at
   call sites).
3. Introduce a new named type when an implicit concept appears more than once
   across tests or source files.

## Domain Services

`GeocodingState` and `PositionManager` are the only domain services in the
library. They:

- Express a real coordination rule (throttling, state transitions).
- Are not just data containers.
- Depend on `ObserverSubject` via composition, not by duplicating observer logic.

New logic that expresses a rule or policy belongs here. Logic that is only data
routing belongs in utilities.

## Anti-Corruption Boundaries

The main external vocabulary that must be translated at the boundary:

| External source | External shape | Internal concept |
|-----------------|---------------|------------------|
| Browser Geolocation API | `GeolocationCoordinates` | `GeoPosition` constructor parameter |
| OSM data | `{ class, type, name }` raw fields | `OsmElement` → `ReferencePlace` |
| `bessa_patterns.ts` | `ObserverSubject<T>` | Re-exported as-is (stable upstream) |

If the OSM schema changes, only `ReferencePlace` and `referencePlaceMap` need to
change — no calling code should be aware of the raw OSM field names.

## Decision Rules for New Code

### Is this a domain concept or just wiring?

- If it expresses a reusable invariant or rule, model it explicitly in
  `src/core/`.
- If it only forwards data, keep it in `src/utils/` or at the entry point.

### Does it belong to the position context or the POI context?

- Position data → `GeoPosition`, `PositionManager`, `calculateDistance`.
- POI classification → `ReferencePlace`, `referencePlaceMap`.
- Cross-cutting observable infrastructure → `ObserverSubject` family.

### Are external terms leaking inward?

- If a `src/core/` file begins using `GeolocationCoordinates` or raw OSM field
  names directly, strengthen the anti-corruption boundary.

### Is the design becoming ceremonial?

- Do not introduce aggregates, repositories, or domain events unless they solve
  a concrete complexity problem that currently exists. The library's scope does
  not currently need them.

## Positive Signals

- `GeoPosition` and `ReferencePlace` can be constructed with plain objects in
  tests — no browser setup required.
- OSM field names do not appear outside `src/core/ReferencePlace.ts`.
- `accuracyQuality` is computed from a `GeoPosition` instance, not from a raw
  `GeolocationCoordinates` object.
- New OSM types can be added to `referencePlaceMap` without changing any calling
  code.

## Warning Signs

- A caller inspects `GeolocationCoordinates` directly instead of going through
  `GeoPosition`.
- Raw OSM `class`/`type` strings appear in `GeocodingState` or `PositionManager`.
- A new file is named `Manager`, `Helper`, or `Util` when a domain term exists.
- A value object acquires mutable setters.

## Related Guides

- [HIGH_COHESION_GUIDE.md](./HIGH_COHESION_GUIDE.md) — keeping each module
  focused on one responsibility.
- [LOW_COUPLING_GUIDE.md](./LOW_COUPLING_GUIDE.md) — keeping context boundaries
  explicit and dependency direction clean.
- [REFERENTIAL_TRANSPARENCY.md](./REFERENTIAL_TRANSPARENCY.md) — separating
  pure policy logic from side-effecting boundaries.
- [CLEAN_ARCHITECTURE_GUIDE.md](./CLEAN_ARCHITECTURE_GUIDE.md) — layer
  boundaries between `src/core/`, `src/utils/`, and `src/index.ts`.

## Summary Checklist

- [ ] New types use the ubiquitous language defined in this guide.
- [ ] Value objects are immutable (frozen or `readonly`).
- [ ] Invariants are enforced at construction, not scattered across call sites.
- [ ] Browser API types and raw OSM fields are translated at the boundary.
- [ ] Policy logic is not tangled with infrastructure details.
- [ ] Heavy DDD patterns (aggregates, repositories) are absent unless solving a
      real current complexity.
- [ ] A reviewer or LLM can infer the domain context of any file from its name
      and imports alone.
