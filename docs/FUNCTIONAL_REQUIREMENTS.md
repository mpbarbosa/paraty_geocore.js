# Functional Requirements — paraty_geocore.js

**Project:** paraty_geocore.js
**Current version:** 0.9.2-alpha
**Author:** Marcelo Pereira Barbosa

This document defines the top-level functional requirements and acceptance criteria for the library. Detailed per-module specifications are maintained separately and linked below.

---

## Module Index

| Module | Source | Detailed FRS |
|--------|--------|-------------|
| `core/GeoPosition` | `src/core/GeoPosition.ts` | [GeoPosition-FRS.md](./GeoPosition-FRS.md) |
| `core/errors` | `src/core/errors.ts` | (see §3 below) |
| `utils/distance` | `src/utils/distance.ts` | [distance-FRS.md](./distance-FRS.md) |
| `utils/async` | `src/utils/async.ts` | [async-FRS.md](./async-FRS.md) |

---

## 1. `core/GeoPosition` *(since 0.6.0-alpha)*

### 1.1 Acceptance Criteria

#### AC-GP-01 — Invalid primitive input throws `GeoPositionError`
- **Given** a primitive value (number, string, boolean) is passed to the constructor
- **When** `new GeoPosition(primitive as any)` is called
- **Then** a `GeoPositionError` is thrown with a descriptive message

#### AC-GP-02 — Immutable construction
- **Given** a valid `GeolocationPosition`-compatible object
- **When** `new GeoPosition(position)` is called
- **Then** all instance properties are set correctly and the instance is frozen (`Object.isFrozen(instance) === true`)

#### AC-GP-02 — Non-enumerable browser coords handled
- **Given** a browser `GeolocationPosition` whose `coords` properties are non-enumerable getters
- **When** `new GeoPosition(position)` is called
- **Then** `latitude`, `longitude`, `accuracy` and all other coordinate fields are correctly populated on the instance

#### AC-GP-03 — Accuracy quality classification
- **Given** an accuracy value in meters
- **When** `GeoPosition.getAccuracyQuality(accuracy)` is called
- **Then** it returns the correct quality tier:

  | Input (m) | Expected output |
  |-----------|----------------|
  | ≤ 10      | `"excellent"`   |
  | 11 – 30   | `"good"`        |
  | 31 – 100  | `"medium"`      |
  | 101 – 200 | `"bad"`         |
  | > 200     | `"very bad"`    |

#### AC-GP-04 — `accuracyQuality` computed at construction
- **Given** a position with a known accuracy value
- **When** `new GeoPosition(position)` is called
- **Then** `instance.accuracyQuality` matches the output of `GeoPosition.getAccuracyQuality(accuracy)`

#### AC-GP-05 — `distanceTo()` delegates to `calculateDistance`
- **Given** two `GeoPosition` instances (or one instance and a plain `{ latitude, longitude }` object)
- **When** `posA.distanceTo(posB)` is called
- **Then** the returned value in meters equals `calculateDistance(posA.latitude, posA.longitude, posB.latitude, posB.longitude)`

#### AC-GP-06 — `toString()` output format
- **Given** a position with valid latitude and longitude
- **When** `toString()` is called
- **Then** it returns `"GeoPosition: {latitude}, {longitude}, {accuracyQuality}, {altitude}, {speed}, {heading}, {timestamp}"`
- **And** returns `"GeoPosition: No position data"` when latitude or longitude is absent

#### AC-GP-07 — Input isolation (no shared references)
- **Given** a position object passed to the constructor
- **When** the caller mutates the original object after construction
- **Then** the `GeoPosition` instance is unaffected

### 1.2 Known Limitations

- `toString()` treats a latitude or longitude of exactly `0` as falsy, producing `"No position data"` for positions at the equator/prime-meridian intersection. This is a known issue; callers near that coordinate should use properties directly.
- `calculateAccuracyQuality()` instance method is **deprecated and broken** — do not use. Use the `accuracyQuality` property.

---

## 3. `core/errors` *(since 0.10.0-alpha)*

### 3.1 Acceptance Criteria

#### AC-ERR-01 — `GeoPositionError` is an `Error` subclass
- **Given** a `GeoPositionError` is thrown
- **When** caught and inspected
- **Then** `err instanceof Error === true` and `err instanceof GeoPositionError === true`

#### AC-ERR-02 — `name` property is set correctly
- **When** a `GeoPositionError` is constructed
- **Then** `err.name === 'GeoPositionError'`

---

## 4. `utils/distance` *(since 0.9.2-alpha)*

### 4.1 Acceptance Criteria

#### AC-DI-01 — `calculateDistance` returns correct distance
- **Given** two valid geographic coordinates
- **When** `calculateDistance(lat1, lon1, lat2, lon2)` is called
- **Then** the result is the Haversine great-circle distance in meters (≥ 0)
- **Example:** São Paulo → Rio de Janeiro ≈ 357,710 m

#### AC-DI-02 — Same-point distance is zero
- **Given** identical coordinates for both points
- **When** `calculateDistance` is called
- **Then** the result is `0`

#### AC-DI-03 — `calculateDistance` is a pure function
- **Given** the same set of inputs called multiple times
- **When** `calculateDistance` is called
- **Then** it always returns the same value with no observable side effects

#### AC-DI-04 — `EARTH_RADIUS_METERS` is exported and correct
- **Given** the module is imported
- **When** `EARTH_RADIUS_METERS` is accessed
- **Then** its value is `6371000` (6,371 km)

#### AC-DI-05 — `delay(ms)` resolves after the specified duration
- **Given** a call to `delay(ms)` with a positive integer `ms`
- **When** the returned `Promise` resolves
- **Then** at least `ms` milliseconds have elapsed

#### AC-DI-06 — `delay(0)` resolves on the next event-loop tick
- **Given** a call to `delay(0)`
- **When** awaited
- **Then** it resolves without throwing and yields control once

### 4.2 Known Limitations

- Coordinates outside valid ranges (lat: −90 to 90, lon: −180 to 180) are not validated; callers must supply valid inputs.
- Spherical Earth model (mean radius 6,371 km) introduces < 0.5% error vs WGS-84 ellipsoidal geometry.
- `delay` is co-located in this module for convenience; it is unrelated to distance calculation.

---

## 5. `utils/async` *(since 0.10.0-alpha)*

### 5.1 Acceptance Criteria

#### AC-AS-01 — `delay(ms)` resolves after the specified duration
- **Given** a call to `delay(ms)` with a positive integer `ms`
- **When** the returned `Promise` resolves
- **Then** at least `ms` milliseconds have elapsed

#### AC-AS-02 — `delay(0)` resolves on the next event-loop tick
- **Given** a call to `delay(0)`
- **When** awaited
- **Then** it resolves without throwing and yields control once

---

## 6. Cross-Module Requirements

#### AC-XM-01 — `GeoPosition.distanceTo` uses `utils/distance`
- **Given** the `core/GeoPosition` module
- **When** `distanceTo()` is called
- **Then** it internally delegates to `calculateDistance` from `utils/distance` (verified by module dependency graph)

---

## 7. Out of Scope

The following are explicitly **not** required for 0.9.2-alpha:

- npm package publication
- TypeScript compilation / `dist/` output
- CI/CD pipeline
- Input validation for coordinate ranges in `calculateDistance`
