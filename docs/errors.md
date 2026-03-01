# Error Handling

This document describes the error strategy used in **paraty_geocore.js**.

---

## `GeoPositionError`

`GeoPositionError` is the single custom error class exported by the library.
It extends the built-in `Error` and is thrown whenever a `GeoPosition`
instance cannot be constructed from the supplied input.

```ts
import { GeoPositionError } from 'paraty_geocore.js';
```

### When it is thrown

| Scenario | Message |
|---|---|
| `position` argument is not an object | `"GeoPosition: position must be an object"` |
| `coords` property is missing or not an object | `"GeoPosition: position.coords must be an object"` |
| `latitude` is not a finite number | `"GeoPosition: latitude must be a finite number"` |
| `longitude` is not a finite number | `"GeoPosition: longitude must be a finite number"` |
| `latitude` is outside −90 to 90 | `"GeoPosition: latitude must be between -90 and 90"` |
| `longitude` is outside −180 to 180 | `"GeoPosition: longitude must be between -180 and 180"` |

### Prototype chain

`Object.setPrototypeOf(this, new.target.prototype)` is called in the
constructor so that `instanceof GeoPositionError` works correctly in
transpiled (ES5/CommonJS) environments.

---

## Recommended usage

```ts
import { GeoPosition, GeoPositionError } from 'paraty_geocore.js';

try {
  const pos = new GeoPosition(rawBrowserPosition);
  doSomethingWith(pos);
} catch (err) {
  if (err instanceof GeoPositionError) {
    // Safe to inspect err.message — always a descriptive string.
    console.warn('Invalid position data:', err.message);
  } else {
    throw err; // Re-throw unexpected errors.
  }
}
```

---

## Error propagation

`GeoPositionError` is only thrown by the `GeoPosition` constructor.
Other library exports (`calculateDistance`, `delay`) do **not** throw custom
errors — they follow standard JavaScript conventions (`NaN` for bad numeric
inputs, `Promise` rejection for async failures).

---

## See Also

- [GeoPosition API Reference](GEO_POSITION_API.md)
- [GeoPosition Functional Spec](GEO_POSITION_FUNC_SPEC.md)
