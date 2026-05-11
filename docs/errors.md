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

| Scenario | Message pattern |
|---|---|
| `position` argument is a primitive (number, string, boolean, etc.) | `"GeoPosition: position must be an object, got <type>"` |

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

`GeoPositionError` is thrown by:

- The `GeoPosition` constructor — when `position` is a primitive value (number, string, boolean, etc.)
- `calculateDistance` — when any coordinate argument is outside the valid range (lat outside −90…90, lon outside −180…180)

Other library exports (`delay`) do **not** throw custom errors.

---

## `TypeError` (standard)

Two library methods throw the built-in `TypeError` for programming errors — i.e., when the *type* of an argument is fundamentally wrong.

### `GeocodingState.setPosition(position)`

| Scenario | Message |
|---|---|
| `position` is not a `GeoPosition` instance or `null` | `"GeocodingState: position must be a GeoPosition instance or null"` |

```ts
import { GeocodingState, GeoPosition } from 'paraty_geocore.js';

const state = new GeocodingState();

try {
  state.setPosition('invalid' as any);
} catch (err) {
  if (err instanceof TypeError) {
    console.error(err.message); // "GeocodingState: position must be a GeoPosition instance or null"
  }
}
```

### `ObserverSubject.subscribe(callback)`

> **Note:** `ObserverSubject` is re-exported from the external [`bessa_patterns.ts`](https://github.com/mpbarbosa/bessa_patterns.ts) package. The behavior below reflects its documented contract.

| Scenario | Message |
|---|---|
| `callback` is not a function | `"ObserverSubject: callback must be a function"` |

```ts
import { GeocodingState } from 'paraty_geocore.js';

const state = new GeocodingState();

try {
  state.subscribe('not-a-function' as any);
} catch (err) {
  if (err instanceof TypeError) {
    console.error(err.message); // "ObserverSubject: callback must be a function"
  }
}
```

> **Why `TypeError` and not a custom error class?**
> `TypeError` is the appropriate built-in for argument-type contract violations. Custom error classes (like `GeoPositionError`) are reserved for domain-specific failures where callers may need to distinguish the error in catch blocks.

---

## Error message convention

All error messages follow the format `"ClassName: human-readable description"`:

| Class | Pattern |
|-------|---------|
| `GeoPositionError` | `"GeoPosition: ..."` |
| `TypeError` (GeocodingState) | `"GeocodingState: ..."` |
| `TypeError` (ObserverSubject) | `"ObserverSubject: ..."` |

---

## See Also

- [GeoPosition API Reference](GEO_POSITION_API.md)
- [GeoPosition Functional Spec](GEO_POSITION_FUNC_SPEC.md)
