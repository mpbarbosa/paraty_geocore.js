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
| `"very bad"`  | > 200 m          | Very poor; should be rejected by callers         |

---

## 5. Instance Methods

### 5.1 `distanceTo(otherPosition)`

Calculates the great-circle distance between this position and another geographic point using the Haversine formula (delegated to `calculateDistance` from `utils/distance`).

| Parameter                   | Type     | Description                              |
|-----------------------------|----------|------------------------------------------|
| `otherPosition.latitude`    | `number` | Latitude of the target point (decimal degrees)  |
| `otherPosition.longitude`   | `number` | Longitude of the target point (decimal degrees) |

**Returns:** `number` — distance in **meters**.

---

### 5.2 `toString()`

Returns a formatted string summary of the position for logging/debugging.

**Returns:** `string`

- If `latitude` or `longitude` is falsy: `"GeoPosition: No position data"`
- Otherwise: `"GeoPosition: {latitude}, {longitude}, {accuracyQuality}, {altitude}, {speed}, {heading}, {timestamp}"`

---

### 5.3 `calculateAccuracyQuality()` *(deprecated)*

> **⚠ Deprecated since 0.6.0-alpha.** Contains a bug — calls `getAccuracyQuality` as a free function (which is undefined at call site). Use the `accuracyQuality` property instead.

---

## 6. Immutability

All `GeoPosition` instances are frozen via `Object.freeze()` immediately after construction. Any attempt to modify instance properties in strict mode will throw a `TypeError`; in non-strict mode, mutations are silently ignored.

---

## 7. Dependencies

| Dependency                 | Purpose                                               |
|----------------------------|-------------------------------------------------------|
| `../utils/distance.js`     | Provides `calculateDistance(lat1, lon1, lat2, lon2)` used by `distanceTo()` |
| Browser Geolocation API    | Source of input data (`GeolocationPosition`, `GeolocationCoordinates`) |

---

## 8. Known Issues / Notes

- `calculateAccuracyQuality()` is broken and deprecated. Do not use.
- `altitude`, `altitudeAccuracy`, `heading`, and `speed` may be `null` depending on the device and browser.
- `toString()` treats a latitude/longitude of `0` as falsy (no data). Positions exactly at the equator/prime-meridian intersection may produce incorrect output.
