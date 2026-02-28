# Functional Requirements Specification
## `distance` — `src/utils/distance.ts`

**Module:** `utils/distance`
**Since:** 0.9.2-alpha
**Author:** Marcelo Pereira Barbosa

---

## 1. Overview

`utils/distance` provides pure, referentially transparent utility functions for geographic distance calculations. All exports are stateless with no side effects. The module is consumed primarily by `GeoPosition.distanceTo()` but is also available for direct use.

---

## 2. Exported Constants

### `EARTH_RADIUS_METERS`

| Attribute | Value         |
|-----------|---------------|
| Type      | `number`      |
| Value     | `6_371_000` (6,371 km — Earth's mean radius) |

Earth's mean radius in meters. Used as the fixed radius `R` in the Haversine formula. This value is a well-established geodetic constant and is not configurable.

---

## 3. Exported Functions

### `calculateDistance(lat1, lon1, lat2, lon2)`

Calculates the **great-circle distance** between two geographic points using the **Haversine formula**.

#### Signature

```typescript
export const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number
```

#### Parameters

| Parameter | Type     | Required | Range         | Description                              |
|-----------|----------|----------|---------------|------------------------------------------|
| `lat1`    | `number` | Yes      | −90 to 90     | Latitude of the first point in decimal degrees  |
| `lon1`    | `number` | Yes      | −180 to 180   | Longitude of the first point in decimal degrees |
| `lat2`    | `number` | Yes      | −90 to 90     | Latitude of the second point in decimal degrees |
| `lon2`    | `number` | Yes      | −180 to 180   | Longitude of the second point in decimal degrees |

#### Return Value

| Type     | Description                                           |
|----------|-------------------------------------------------------|
| `number` | Distance in **meters** between the two points (≥ 0)  |

#### Algorithm

Implements the Haversine formula for spherical Earth geometry:

```text
a = sin²(Δφ/2) + cos(φ₁) × cos(φ₂) × sin²(Δλ/2)
c = 2 × atan2(√a, √(1−a))
d = R × c
```

Where:
- `R` = `EARTH_RADIUS_METERS` (6,371,000 m)
- `φ` = latitude in radians
- `λ` = longitude in radians
- `Δφ` = difference in latitudes (radians)
- `Δλ` = difference in longitudes (radians)

#### Behaviour

- **Pure function**: same inputs always produce the same output.
- **No side effects**: does not mutate any external state or log output.
- Converts decimal-degree inputs to radians internally.
- Returns `0` when both points are identical.
- Assumes a **spherical Earth**; does not account for ellipsoidal geometry (WGS-84). Accuracy degrades slightly for very long distances (< 0.5% error in practice).

#### Example

```javascript
import { calculateDistance } from './utils/distance.js';

// Distance between São Paulo and Rio de Janeiro
const d = calculateDistance(-23.5505, -46.6333, -22.9068, -43.1729);
console.log(d); // ~357,710 meters (357.7 km)

// Same point — distance is zero
const zero = calculateDistance(-23.5505, -46.6333, -23.5505, -46.6333);
console.log(zero); // 0
```

#### References

- [Haversine formula — Wikipedia](https://en.wikipedia.org/wiki/Haversine_formula)
- [Calculate distance, bearing and more — Movable Type Scripts](https://www.movable-type.co.uk/scripts/latlong.html)

---

## 4. Purity & Design Constraints

| Constraint              | Status |
|-------------------------|--------|
| No side effects         | ✅     |
| Referentially transparent | ✅   |
| No external dependencies | ✅    |
| No global state         | ✅     |
| Deterministic output    | ✅ (`calculateDistance`) |

---

## 5. Known Limitations

| Limitation | Detail |
|------------|--------|
| Spherical Earth assumption | Uses mean radius 6,371 km. Does not implement WGS-84 ellipsoidal model; maximum error is < 0.5% for typical geolocation use cases. |
| No input validation | Out-of-range latitude/longitude values are not validated or clamped; callers are responsible for providing valid coordinates. |

> **Note:** The `delay` utility previously co-located in this module has been extracted to `utils/async` (since 0.10.0-alpha). See [async-FRS.md](./async-FRS.md).
