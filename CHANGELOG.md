# Changelog

All notable changes to `paraty_geocore.js` are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [0.14.3-alpha] — 2026-03-27

### Changed

- `docs/FUNCTIONAL_REQUIREMENTS.md`: removed three stale Known Limitations
    - `GeoPosition.toString()` equator-bug entry — fix (`=== undefined` check) was
      already in place and covered by tests
    - `calculateAccuracyQuality()` deprecation notice — method was removed in 0.13.0-alpha
    - `calculateDistance` "coordinates not validated" entry — range guards were added in 0.13.0-alpha
- `docs/FUNCTIONAL_REQUIREMENTS.md`: updated "Out of Scope" version reference to 0.14.3-alpha
- `docs/GeoPosition-FRS.md`: corrected `toString()` trigger condition from "falsy" to "`undefined`"
- `docs/FUNCTIONAL_REQUIREMENTS.md`: added `core/ReferencePlace` to Module Index
- `docs/FUNCTIONAL_REQUIREMENTS.md`: added §13 `core/ReferencePlace` acceptance criteria
  (AC-RP-01 through AC-RP-11) and Known Limitations
- `docs/ARCHITECTURE.md`: added v0.14.3-alpha row to versioning table

---

## [0.14.2-alpha] — 2026-03-26

### Changed

- Updated `ibira.js` dependency to `v0.4.22-alpha` (fixes `toString()` trailing `-` when prerelease is empty)

---

## [0.14.1-alpha] — 2026-03-26

### Changed

- Updated `bessa_patterns.ts` dependency to `v0.12.15-alpha` (adds `CallbackRegistry` pattern)

---

## [0.14.0-alpha] — 2026-03-23

### Added

- `src/core/ReferencePlace.ts` — OSM point-of-interest wrapper with Portuguese descriptions
    - Immutable value object (`Object.freeze`) mirroring the existing guia_turistico implementation
    - `className`, `typeName`, `name` properties extracted from raw OSM geocoding data
    - `calculateDescription()` — resolves a Portuguese label from the built-in `referencePlaceMap`,
      falls back to `NO_REFERENCE_PLACE` for invalid classes or to `"<class>: <type>"` for unmapped types
    - `calculateCategory()` — returns the Portuguese category label or `"unknown"`
    - `toString()` — human-readable `"ReferencePlace: <description>[ - <name>]"` representation
    - Static `referencePlaceMap` — frozen mapping of OSM classes/types to Portuguese strings
      (place, shop, amenity, railway, building)
    - Exports: `ReferencePlace` (default + named), `OsmElement` interface,
      `NO_REFERENCE_PLACE` constant, `VALID_REF_PLACE_CLASSES` array
- New tests in `test/core/ReferencePlace.test.ts` — 36 tests, 100% line/branch/function coverage

### Documentation

- `docs/ARCHITECTURE.md` — added `ReferencePlace.ts` to directory structure and versioning table
- `docs/ReferencePlace-FRS.md` — new Functional Requirements Spec

---

## [0.13.0-alpha] — 2026-03-23

### Added

- `calculateDistance` now validates coordinate ranges before computing:
    - Throws `GeoPositionError` when `lat1` or `lat2` is outside `[-90, 90]`
    - Throws `GeoPositionError` when `lon1` or `lon2` is outside `[-180, 180]`
    - Error messages include the parameter name and value for easy debugging
- New tests in `test/utils/distance.test.ts` covering all eight out-of-range cases and boundary values

### Removed

- `GeoPosition.calculateAccuracyQuality()` instance method — deprecated and broken since `0.6.0-alpha`; use the `accuracyQuality` property instead

### Documentation

- `docs/FUNCTIONAL_REQUIREMENTS.md` — updated to `0.13.0-alpha`; added module index entries and acceptance criteria for `ObserverSubject`, `DualObserverSubject`, `ObserverMixin`, `GeocodingState`, `PositionManager`, `utils/logger`; removed stale out-of-scope item (coordinate validation now implemented)
- `docs/ARCHITECTURE.md` — added `0.13.0-alpha` milestone to versioning table
- `docs/distance-FRS.md` — documented validation behaviour, throws table, and removed "No input validation" known limitation
- `docs/GeoPosition-FRS.md` — removed deprecated `calculateAccuracyQuality()` section and stale known-issues entry

---

## [0.12.3-alpha] — 2026-03-23

### Added

- `src/core/PositionManager.ts` — new `PositionManager` singleton class
    - Singleton pattern: one source of truth for the current device position
    - Observer pattern: `subscribe` / `unsubscribe` backed by `DualObserverSubject`
    - Multi-layer position validation (accuracy quality → distance OR time threshold)
    - Event classification: `strCurrPosUpdate`, `strCurrPosNotUpdate`, `strImmediateAddressUpdate`
    - `PositionManager.getInstance(position?)` — creates or returns the singleton
    - `manager.update(position)` — validates and applies a new `GeolocationPosition`
    - `createPositionManagerConfig()` — returns a fresh config object with defaults
    - `initializeConfig(partial)` — merges overrides before the first `getInstance()` call
- `src/utils/logger.ts` — new `utils/logger` module
    - `log(message, ...params)` — timestamped `console.log` wrapper
    - `warn(message, ...params)` — timestamped `console.warn` wrapper
- `PositionManagerConfig` interface exported from public API
- `docs/POSITION_MANAGER.md` — full API reference for `PositionManager`

---

## [0.11.4] — 2026-03-23

### Added

- `.github/skills/purge-workflow-logs/` — new `purge-workflow-logs` skill

### Fixed

- `docs/ARCHITECTURE.md` — documented `coverage/` and `dist/` subdirectories in directory tree

---

## [0.11.3] — 2026-03-22

### Changed

- Updated `bessa_patterns.ts` dependency to `v0.12.12-alpha` (fixes `withObserver` missing from tagged dist)

---

## [0.11.2] — 2026-03-21

### Added

- `src/utils/async.ts` — `delay()` extracted to its own module
- `scripts/deploy.sh` — build, tag, push, and generate CDN URLs
- `cdn-delivery.sh` — jsDelivr CDN URL generation
- Pre-commit hooks (`.pre-commit-config.yaml`): private-key detection, EditorConfig, markdownlint
- CI/CD pipeline (`.github/workflows/ci.yml`) — Node.js 18.x and 20.x matrix
- `docs/async-FRS.md` — functional requirements for `utils/async`

### Changed

- `delay()` moved from `utils/distance` to dedicated `utils/async` module

---

## [0.11.0] — 2026-03-20

### Added

- `src/core/ObserverSubject.ts` — generic concrete Observer/Subject base class
- `src/core/DualObserverSubject.ts` — GoF + function-based dual observer variants
- `src/core/GeocodingState.ts` — centralised geocoding state manager (extends `ObserverSubject`)
- `src/core/ObserverMixin.ts` — `withObserver` helper for adding observer management to classes
- `bessa_patterns.ts` dependency — provides `ObserverMixin` interface contracts
- `docs/OBSERVER_SUBJECT_API.md`, `docs/GEOCODING_STATE_API.md`, `docs/OBSERVER_MIXIN_API.md`

---

## [0.10.0-alpha] — 2026-02-01

### Added

- `npm run build` and `npm run build:esm` — TypeScript CJS and ESM dual-build output
- `dist/` artifacts (CJS + ESM + type declarations)
- `package.json` ESM exports map (`"."`, `"./utils/distance"`, `"./utils/async"`, `"./core/errors"`)
- CI/CD dist smoke test (`scripts/smoke-test.cjs`)
- `docs/` expanded: `GETTING_STARTED.md`, `API.md`, `ARCHITECTURE.md`

### Fixed

- `GeoPosition.toString()` — zero-coordinate rendering bug
- `GeoPosition.getCurrentCoordinates()` return frozen for defensive immutability

---

## [0.9.2-alpha] — 2025-10-11

### Added
- `src/utils/distance.ts` — new `utils/distance` module
    - `EARTH_RADIUS_METERS` constant (6,371,000 m)
    - `calculateDistance(lat1, lon1, lat2, lon2)` — Haversine great-circle distance in meters
    - `delay(ms)` — Promise-based async delay utility (moved to `utils/async` in 0.11.2-alpha)
- `docs/distance-FRS.md` — functional requirements specification for `utils/distance`

### Changed
- `GeoPosition.distanceTo()` now delegates to `calculateDistance` from `utils/distance`

---

## [0.6.0-alpha] — 2025-10-11

### Added
- `src/core/GeoPosition.ts` — initial implementation of the `GeoPosition` class
    - Immutable wrapper around the browser `GeolocationPosition` object
    - Explicit property extraction from `GeolocationCoordinates` (handles non-enumerable browser getters)
    - `Object.freeze()` enforces immutability after construction
    - `accuracyQuality` property computed at construction time
    - `GeoPosition.getAccuracyQuality(accuracy)` static method — classifies accuracy in meters to `excellent` / `good` / `medium` / `bad` / `very bad`
    - `distanceTo(otherPosition)` — Haversine distance in meters
    - `toString()` — formatted position summary for debugging
- `docs/GeoPosition-FRS.md` — functional requirements specification for `GeoPosition`
- `docs/GEOPOSITION_REFACTORING_SUMMARY.md` — refactoring summary (referential transparency)

### Removed
- Side-effecting constructor behaviour: no longer mutates the input `position` object or logs during construction
- `accuracy` setter: instances are now fully immutable

### Deprecated
- `calculateAccuracyQuality()` instance method — contains a scoping bug; use the `accuracyQuality` property instead
