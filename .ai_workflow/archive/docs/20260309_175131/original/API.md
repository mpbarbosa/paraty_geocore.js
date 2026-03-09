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

## `core/ObserverSubject`

### Class: `ObserverSubject<T>`

Concrete generic implementation of the Observer/Subject pattern. Manages a typed list of observer callbacks and notifies them with a snapshot value whenever the subject state changes.

Can be used directly or extended by specialised subclasses (e.g., `GeocodingState`).

**Since:** 0.9.1-alpha

**Type parameter:** `T` — shape of the snapshot object forwarded to observers.

#### Constructor

```typescript
new ObserverSubject<T>()
```

Initialises with an empty observer list.

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `subscribe(callback)` | `() => void` | Register an observer; returns an unsubscribe function |
| `unsubscribe(callback)` | `boolean` | Remove an observer by reference; returns `true` if found |
| `getObserverCount()` | `number` | Number of currently registered observers |
| `clearObservers()` | `void` | Remove all observers |
| `_notifyObservers(snapshot)` | `void` | Call all observers with `snapshot`; errors are caught and logged |

```typescript
import ObserverSubject from 'paraty_geocore.js/core/ObserverSubject';

const subject = new ObserverSubject<{ value: number }>();

const unsub = subject.subscribe((snap) => console.log(snap.value));
subject._notifyObservers({ value: 42 }); // logs: 42
unsub();
```

---

## `core/GeocodingState`

### Class: `GeocodingState`

Centralized state manager for geocoding position data. Extends `ObserverSubject<GeocodingStateSnapshot>` to inherit observer management and adds geocoding-specific state: the current `GeoPosition` and extracted coordinates.

**Since:** 0.9.0-alpha

**Extends:** `ObserverSubject<GeocodingStateSnapshot>`

#### Type: `GeocodingStateSnapshot`

```typescript
interface GeocodingStateSnapshot {
  position: GeoPosition | null;
  coordinates: { latitude: number; longitude: number } | null;
}
```

#### Constructor

```typescript
new GeocodingState()
```

Initialises with `null` position and no observers.

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `setPosition(position)` | `GeocodingState` | Set/clear position; notifies observers on non-null set |
| `getCurrentPosition()` | `GeoPosition \| null` | Current position |
| `getCurrentCoordinates()` | `object \| null` | Defensive copy of `{ latitude, longitude }` |
| `hasPosition()` | `boolean` | Whether a position is currently set |
| `clear()` | `void` | Clear position without notifying observers |
| *(inherited)* `subscribe`, `unsubscribe`, `getObserverCount`, `clearObservers` | — | Observer management from `ObserverSubject` |

```typescript
import GeocodingState from 'paraty_geocore.js/core/GeocodingState';

const state = new GeocodingState();

const unsub = state.subscribe(({ position, coordinates }) => {
  console.log(coordinates.latitude, coordinates.longitude);
});

state.setPosition(new GeoPosition(browserPosition));
unsub();
```

---

## `core/errors`

### Class: `GeoPositionError`

Custom error class thrown by `GeoPosition` for invalid input.

```typescript
new GeoPositionError(message: string)
```

`GeoPositionError` extends `Error` with `name` set to `'GeoPositionError'`.

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

> **Moved in 0.10.0-alpha:** `delay` has been extracted to `utils/async`. Import it from there going forward:
> ```javascript
> import { delay } from 'paraty_geocore.js/utils/async';
> ```

---

## `utils/async`

### Function: `delay(ms)`

Creates a `Promise` that resolves after the given number of milliseconds.

```typescript
export const delay = (ms: number): Promise<void>
```

| Parameter | Type     | Description |
|-----------|----------|-------------|
| `ms`      | `number` | Delay in milliseconds |

**Returns:** `Promise<void>`

```javascript
import { delay } from 'paraty_geocore.js/utils/async';

await delay(1000); // pause 1 second
```
