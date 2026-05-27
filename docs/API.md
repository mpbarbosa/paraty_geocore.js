## API

## API

# API Reference

**Package:** `paraty_geocore.js`
**Language:** TypeScript (compiled to JavaScript)
**Since:** 0.6.0-alpha

> **See also:** [GeoPosition Docs](./GEO_POSITION.md) | [GeoPosition API](./GEO_POSITION_API.md) | [Functional Spec](./GEO_POSITION_FUNC_SPEC.md) | [FRS](./GeoPosition-FRS.md) | [Refactoring Summary](./GEOPOSITION_REFACTORING_SUMMARY.md)

---

## Modules

| Module | Path | Description |
|--------|------|-------------|
| `core/GeoPosition` | `src/core/GeoPosition.ts` | Immutable geographic position wrapper |
| `core/ObserverSubject` | `src/core/ObserverSubject.ts` | Generic concrete Observer/Subject base class |
| `core/DualObserverSubject` | `src/core/DualObserverSubject.ts` | Dual observer subject (GoF + function-based) |
| `core/ObserverMixin` | `src/core/ObserverMixin.ts` | Delegation mixin for classes composing a `DualObserverSubject` |
| `core/GeocodingState` | `src/core/GeocodingState.ts` | Geocoding state manager (extends `ObserverSubject`) |
| `core/errors` | `src/core/errors.ts` | Custom error classes |
| `utils/distance` | `src/utils/distance.ts` | Pure distance calculation utilities |
| `utils/async` | `src/utils/async.ts` | General-purpose async utilities |

---

## `core/GeoPosition`

### Class: `GeoPosition`

Immutable wrapper around the browser [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPosition) position object. Normalises raw position data and adds convenience methods for accuracy assessment and distance calculation.

All instances are frozen via `Object.freeze()` after construction.

**Since:** 0.6.0-alpha

#### Constructor

```typescript
new GeoPosition(position: object)
```

| Parameter  | Type     | Required | Description |
|------------|----------|----------|-------------|
| `position` | `object` | Yes      | A `GeolocationPosition`-compatible object or plain object with `coords` and `timestamp` |

**Behaviour:**
- Extracts coordinate fields explicitly from `position.coords` to handle browser `GeolocationCoordinates` (non-enumerable getters).
- Stores a normalised copy as `geolocationPosition` — does **not** share references with the input.
- Computes `accuracyQuality` at construction time.
- Freezes the instance — all properties are read-only after construction.

#### Instance Properties

| Property              | Type             | Description |
|-----------------------|------------------|-------------|
| `geolocationPosition` | `object \| null` | Normalised copy of the original position (`{ timestamp, coords }`) |
| `coords`              | `object \| null` | Normalised copy of the coordinates object |
| `latitude`            | `number`         | Latitude in decimal degrees |
| `longitude`           | `number`         | Longitude in decimal degrees |
| `accuracy`            | `number`         | Position accuracy in meters |
| `accuracyQuality`     | `string`         | Classified accuracy level (see `getAccuracyQuality`) |
| `altitude`            | `number`         | Altitude in meters above the WGS-84 ellipsoid (or `null`) |
| `altitudeAccuracy`    | `number`         | Altitude accuracy in meters (or `null`) |
| `heading`             | `number`         | Direction of travel in degrees (0–360, or `null`) |
| `speed`               | `number`         | Speed in meters per second (or `null`) |
| `timestamp`           | `number`         | Unix timestamp (ms) when position was acquired |

#### Static Methods

##### `GeoPosition.getAccuracyQuality(accuracy)`

Classifies a GPS accuracy value (meters) into a quality level.

```typescript
static getAccuracyQuality(accuracy: number): string
```

| Accuracy (m) | Quality      |
|-------------|--------------|
| ≤ 10        | `'excellent'` |
| 11 – 30     | `'good'`      |
| 31 – 100    | `'medium'`    |
| 101 – 200   | `'bad'`       |
| > 200       | `'very bad'`  |

```javascript
GeoPosition.getAccuracyQuality(5);   // 'excellent'
GeoPosition.getAccuracyQuality(25);  // 'good'
GeoPosition.getAccuracyQ

---

## GeoPosition-FRS

# Functional Requirements Specification
## `GeoPosition` — `src/core/GeoPosition.js`

**Module:** `core/GeoPosition`
**Since:** 0.6.0-alpha
**Author:** Marcelo Pereira Barbosa

---

## 1. Overview

`GeoPosition` is an immutable wrapper class around the browser [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPosition) position object. It normalises raw position data into flat, directly accessible properties and adds convenience methods for accuracy assessment and distance calculation.

---

## 2. Constructor

### `new GeoPosition(position)`

| Parameter | Type     | Required | Description                                      |
|-----------|----------|----------|--------------------------------------------------|
| `position`| `object` | Yes      | A `GeolocationPosition`-compatible object or plain object with `coords` and `timestamp` |

**Behaviour:**

- Extracts all coordinate fields explicitly from `position.coords` to handle browser `GeolocationCoordinates` (whose properties are non-enumerable getters).
- Stores a normalised copy of the full position as `geolocationPosition`.
- Flattens coordinate properties (`latitude`, `longitude`, `accuracy`, etc.) directly onto the instance.
- Computes and stores `accuracyQuality` at construction time via `GeoPosition.getAccuracyQuality()`.
- Calls `Object.freeze(this)` — the instance is **immutable** after construction.

---

## 3. Instance Properties

All properties are set at construction and are read-only (frozen).

| Property              | Type             | Description                                                          |
|-----------------------|------------------|----------------------------------------------------------------------|
| `geolocationPosition` | `object \| null` | Normalised copy of the original position object (`{ timestamp, coords }`) |
| `coords`              | `object \| null` | Plain-object copy of coordinate data; `null` if no coords provided   |
| `latitude`            | `number`         | Latitude in decimal degrees                                          |
| `longitude`           | `number`         | Longitude in decimal degrees                                         |
| `accuracy`            | `number`         | Horizontal accuracy radius in meters                                 |
| `accuracyQuality`     | `string`         | Pre-computed quality classification (see §4)                         |
| `altitude`            | `number`         | Altitude in meters above WGS84 ellipsoid; `null` if unavailable      |
| `altitudeAccuracy`    | `number`         | Altitude accuracy in meters; `null` if unavailable                   |
| `heading`             | `number`         | Direction of travel in degrees (0–360, clockwise from true north); `null` if unavailable |
| `speed`               | `number`         | Ground speed in meters/second; `null` if unavailable                 |
| `timestamp`           | `number`         | Unix timestamp (ms) of when the position was acquired                |

---

## 4. Static Method — `GeoPosition.getAccuracyQuality(accuracy)`

Classifies a GPS accuracy value (in meters) into a human-readable quality tier.

| Parameter  | Type     | Description                          |
|------------|----------|--------------------------------------|
| `accuracy` | `number` | Accuracy radius in meters            |

**Returns:** `string` — one of the quality levels below.

| Quality Level | Accuracy Range   | Suitability                                      |
|---------------|------------------|--------------------------------------------------|
| `"excellent"` | ≤ 10 m           | High precision; suitable for all applications   |
| `"good"`      | 11 – 30 m        | Good precision; suitable for most applications  |
| `"medium"`    | 31 – 100 m       | Moderate; may be acceptable for some use cases  |
| `"bad"`       | 101 – 200 m      | Poor precision; generally not recommended        |
| `"very bad"`  | > 2