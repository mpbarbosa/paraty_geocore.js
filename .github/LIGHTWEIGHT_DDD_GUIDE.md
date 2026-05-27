# Lightweight DDD Guide

This repository uses Domain-Driven Design selectively: strengthen the
ubiquitous language, anti-corruption boundaries, and value-object invariants
without adding heavyweight tactical DDD ceremony to a focused geolocation
utility library.

## Source of Truth

Use [docs/LIGHTWEIGHT_DDD_GUIDE.md](../docs/LIGHTWEIGHT_DDD_GUIDE.md) as the
authoritative guide. This `.github/` copy exists so workflow reviews and
Copilot-oriented guidance can discover the rule in the expected location without
duplicating the full document.

## Repository-Specific Rules

1. Use the ubiquitous language consistently across source, tests, and docs:
   `GeoPosition`, `GeocodingState`, `ReferencePlace`, `PositionManager`,
   `ObserverSubject`, `accuracyQuality`, `calculateDistance`, `delay`,
   `NO_REFERENCE_PLACE`, `VALID_REF_PLACE_CLASSES`, `GeoPositionError`.
2. Translate browser API types (`GeolocationCoordinates`, `GeolocationPosition`)
   at the `GeoPosition` constructor boundary; never let them appear in internal
   type signatures or public API surface.
3. Translate raw OSM fields (`class`, `type`) inside `ReferencePlace`; callers
   must use `description`, `category`, `className`, and `typeName` — not the
   raw OSM names.
4. Keep `GeoPosition` and `ReferencePlace` as immutable value objects frozen
   with `Object.freeze` at construction time.
5. Keep policy logic (distance gate rules, geocoding state transitions) in
   `src/core/` domain files, not mixed into `src/utils/` helpers.
6. Do not introduce aggregates, repositories, or domain events unless the
   project acquires genuinely long-lived mutable business state.

## Review Heuristic

If a change introduces browser API type names or raw OSM field names into the
public API surface, or adds DDD ceremony without protecting a real invariant or
boundary, it is probably not aligned with the domain model of this repository.
