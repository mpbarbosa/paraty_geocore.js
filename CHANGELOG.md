# Changelog

All notable changes to `paraty_geocore.js` are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Planned
- npm package publication
- TypeScript compilation (`tsc`) and `dist/` output
- `package.json` with ESM exports map
- CI/CD pipeline

---

## [0.9.2-alpha] — 2025-10-11

### Added
- `src/utils/distance.ts` — new `utils/distance` module
    - `EARTH_RADIUS_METERS` constant (6,371,000 m)
    - `calculateDistance(lat1, lon1, lat2, lon2)` — Haversine great-circle distance in meters
    - `delay(ms)` — Promise-based async delay utility (moved to `utils/async` in 0.10.0-alpha)
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
