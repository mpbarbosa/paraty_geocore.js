# Functional Requirements — paraty_geocore.js

**Project:** paraty_geocore.js
**Current version:** 0.14.2-alpha
**Author:** Marcelo Pereira Barbosa

This document defines the top-level functional requirements and acceptance criteria for the library. Detailed per-module specifications are maintained separately and linked below.

---

## Module Index

| Module | Source | Detailed FRS |
|--------|--------|-------------|
| `core/GeoPosition` | `src/core/GeoPosition.ts` | [GeoPosition-FRS.md](./GeoPosition-FRS.md) |
| `core/errors` | `src/core/errors.ts` | (see §3 below) |
| `core/ObserverSubject` | `src/core/ObserverSubject.ts` | (see §7 below) |
| `core/DualObserverSubject` | `src/core/DualObserverSubject.ts` | (see §8 below) |
| `core/ObserverMixin` | `src/core/ObserverMixin.ts` | (see §9 below) |
| `core/GeocodingState` | `src/core/GeocodingState.ts` | (see §10 below) |
| `core/PositionManager` | `src/core/PositionManager.ts` | (see §11 below) |
| `utils/distance` | `src/utils/distance.ts` | [distance-FRS.md](./distance-FRS.md) |
| `utils/async` | `src/utils/async.ts` | [async-FRS.md](./async-FRS.md) |
| `utils/logger` | `src/utils/logger.ts` | (see §12 below) |

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

## 3. `core/errors` *(since 0.11.2-alpha)*

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

## 5. `utils/async` *(since 0.11.2-alpha)*

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

The following are explicitly **not** required for 0.13.0-alpha:

- npm package publication


---

## 7. `core/ObserverSubject` *(since 0.9.1-alpha)*

### 7.1 Acceptance Criteria

#### AC-OS-01 — Generic typed observer pattern
- **Given** a class extending `ObserverSubject<T>`
- **When** `subscribe(callback)` is called with a function observer
- **Then** that callback is invoked with the subject instance on every `_notifyObservers()` call

#### AC-OS-02 — Unsubscribe removes observer
- **Given** a subscribed callback
- **When** `unsubscribe(callback)` is called
- **Then** subsequent `_notifyObservers()` calls do not invoke that callback

#### AC-OS-03 — Observer errors are isolated
- **Given** an observer that throws
- **When** `_notifyObservers()` is called
- **Then** remaining observers are still notified (errors are caught per observer)

---

## 8. `core/DualObserverSubject` *(since 0.11.0)*

### 8.1 Acceptance Criteria

#### AC-DOS-01 — Supports both GoF and function-based observers
- **Given** a class extending `DualObserverSubject<T>`
- **When** either an `ObserverObject` (with `update()`) or an `ObserverFunction` is subscribed
- **Then** both are notified correctly on state changes

---

## 9. `core/ObserverMixin` *(since 0.11.0)*

### 9.1 Acceptance Criteria

#### AC-OM-01 — `withObserver()` adds observer capability to any class
- **Given** a plain class and a call to `withObserver(BaseClass, options)`
- **When** the returned mixin class is instantiated
- **Then** it has `subscribe`, `unsubscribe`, and `_notifyObservers` methods from `ObserverSubject`

---

## 10. `core/GeocodingState` *(since 0.9.0-alpha)*

### 10.1 Acceptance Criteria

#### AC-GS-01 — Tracks current `GeoPosition`
- **Given** a `GeocodingState` instance
- **When** `setPosition(pos)` is called with a `GeoPosition`
- **Then** `getCurrentPosition()` returns that same position

#### AC-GS-02 — Exposes coordinates without exposing internals
- **When** `getCurrentCoordinates()` is called after a position is set
- **Then** it returns `{ latitude, longitude }` without exposing the full `GeoPosition` instance

#### AC-GS-03 — Notifies observers on position change
- **When** `setPosition(pos)` is called
- **Then** all subscribed observers are notified

#### AC-GS-04 — `clear()` resets state
- **When** `clear()` is called
- **Then** `getCurrentPosition()` returns `null` and `hasPosition()` returns `false`

---

## 11. `core/PositionManager` *(since 0.12.3-alpha)*

### 11.1 Acceptance Criteria

#### AC-PM-01 — Singleton pattern
- **Given** the `PositionManager` class
- **When** `PositionManager.getInstance()` is called multiple times
- **Then** it always returns the same instance

#### AC-PM-02 — Multi-layer position filtering
- **Given** a configured `PositionManager`
- **When** `update(position)` is called with a position whose accuracy quality is in `notAcceptedAccuracy`
- **Then** the position is rejected and observers are not notified

#### AC-PM-03 — Distance OR time threshold
- **Given** a `PositionManager` with a known last position
- **When** a new position arrives that has moved ≥ `minimumDistanceChange` metres OR elapsed ≥ `minimumTimeChange` ms
- **Then** the position is accepted and observers notified

#### AC-PM-04 — Observer notification on accepted update
- **When** an accepted position update triggers a notification
- **Then** all subscribed observers receive the event type string via `update(manager, eventType)`

---

## 12. `utils/logger` *(since 0.12.3-alpha)*

### 12.1 Acceptance Criteria

#### AC-LG-01 — `log()` prefixes with ISO timestamp
- **When** `log(message)` is called
- **Then** `console.log` is called with a string starting with an ISO 8601 timestamp

#### AC-LG-02 — `warn()` prefixes with ISO timestamp
- **When** `warn(message)` is called
- **Then** `console.warn` is called with a string starting with an ISO 8601 timestamp


---

## Roadmap — Minor Issues

> Populated by the `fix-log-issues` skill. Each item was verified against
> the live codebase before final disposition.

| ID | Source step | Description | File / Path | Priority | Status |
|----|-------------|-------------|-------------|----------|--------|
| RI-001 | step_02 | Broken See also links — TypeDoc path-rewriting limitation in generated copy | docs/api/media/API.md | Medium | skipped |
| RI-002 | step_20 | addEventListener missing { once: true } — TypeDoc-owned asset in git-ignored dir | docs/api/assets/icons.js | Low | skipped |
| RI-003 | step_05 | coverage/ directory not documented in directory tree | docs/ARCHITECTURE.md | Low | done |
| RI-004 | step_05 | dist/ subdirectories not fully documented in directory tree | docs/ARCHITECTURE.md | Low | done |
| RI-005 | step_05 | .github/skills/ tree missing from directory tree | docs/ARCHITECTURE.md | Medium | done |
