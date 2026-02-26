# API Reference

**Package:** `paraty_geocore.js`  
**Language:** TypeScript (compiled to JavaScript)  
**Since:** 0.6.0-alpha

---

## Modules

| Module | Path | Description |
|--------|------|-------------|
| `core/GeoPosition` | `src/core/GeoPosition.ts` | Immutable geographic position wrapper |
| `utils/distance` | `src/utils/distance.ts` | Pure distance calculation utilities |

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
GeoPosition.getAccuracyQuality(75);  // 'medium'
GeoPosition.getAccuracyQuality(150); // 'bad'
GeoPosition.getAccuracyQuality(500); // 'very bad'
```

#### Instance Methods

##### `distanceTo(otherPosition)`

Calculates the distance in meters between this position and another point using the Haversine formula.

```typescript
distanceTo(otherPosition: { latitude: number; longitude: number }): number
```

| Parameter                  | Type     | Description |
|----------------------------|----------|-------------|
| `otherPosition.latitude`   | `number` | Latitude of the target point |
| `otherPosition.longitude`  | `number` | Longitude of the target point |

**Returns:** `number` — distance in meters.

```javascript
const pos = new GeoPosition(browserPosition);
const distance = pos.distanceTo({ latitude: -22.9068, longitude: -43.1729 });
console.log(`${Math.round(distance)} meters away`);
```

##### `toString()`

Returns a formatted string summary of the position for debugging.

```typescript
toString(): string
```

**Returns:** `"GeoPosition: {latitude}, {longitude}, {accuracyQuality}, {altitude}, {speed}, {heading}, {timestamp}"`  
or `"GeoPosition: No position data"` when latitude/longitude are absent.

```javascript
const pos = new GeoPosition(browserPosition);
console.log(pos.toString());
// "GeoPosition: -23.5505, -46.6333, good, 760, 0, 0, 1634567890123"
```

##### `calculateAccuracyQuality()` ⚠️ Deprecated

```typescript
calculateAccuracyQuality(): string
```

> **Deprecated** — contains a scoping bug (`getAccuracyQuality` is not in scope). Use the `accuracyQuality` property instead.

---

## `utils/distance`

### Constant: `EARTH_RADIUS_METERS`

```typescript
export const EARTH_RADIUS_METERS: number = 6371e3
```

Earth's mean radius in meters (6,371,000 m). Used internally by `calculateDistance`.

---

### Function: `calculateDistance(lat1, lon1, lat2, lon2)`

Calculates the great-circle distance between two geographic points using the Haversine formula.

```typescript
export const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number
```

| Parameter | Type     | Range       | Description |
|-----------|----------|-------------|-------------|
| `lat1`    | `number` | −90 to 90   | Latitude of first point (decimal degrees) |
| `lon1`    | `number` | −180 to 180 | Longitude of first point (decimal degrees) |
| `lat2`    | `number` | −90 to 90   | Latitude of second point (decimal degrees) |
| `lon2`    | `number` | −180 to 180 | Longitude of second point (decimal degrees) |

**Returns:** `number` — distance in meters (≥ 0).

Pure function — no side effects, deterministic output.

```javascript
import { calculateDistance } from 'paraty_geocore.js/utils/distance';

const d = calculateDistance(-23.5505, -46.6333, -22.9068, -43.1729);
console.log(d); // ~357,710 meters
```

---

### Function: `delay(ms)`

Returns a `Promise` that resolves after the given number of milliseconds.

```typescript
export const delay = (ms: number): Promise<void>
```

| Parameter | Type     | Description |
|-----------|----------|-------------|
| `ms`      | `number` | Delay in milliseconds |

**Returns:** `Promise<void>`

```javascript
import { delay } from 'paraty_geocore.js/utils/distance';

await delay(1000); // pause 1 second
```
