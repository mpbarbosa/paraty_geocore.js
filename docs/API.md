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
GeoPosition.getAccuracyQuality(7

---

## API

# API Reference

**Package:** `paraty_geocore.js`
**Language:** TypeScript (compiled to JavaScript)
**Since:** 0.6.0-alpha

> **See also:** [GeoPosition Docs](../../GEO_POSITION.md) | [GeoPosition API](../../GEO_POSITION_API.md) | [Functional Spec](../../GEO_POSITION_FUNC_SPEC.md) | [FRS](../../GeoPosition-FRS.md) | [Refactoring Summary](../../GEOPOSITION_REFACTORING_SUMMARY.md)

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

Calculates the distance in meters bet
