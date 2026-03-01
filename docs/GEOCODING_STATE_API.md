# GeocodingState API Documentation

**Version:** 0.9.8-alpha
**Module:** `src/core/GeocodingState.ts`
**Pattern:** Observer/Subject (via `ObserverSubject`)
**Author:** Marcelo Pereira Barbosa

## Overview

Centralized state management for geocoding position data. `GeocodingState` extends
[`ObserverSubject<GeocodingStateSnapshot>`](./OBSERVER_SUBJECT_API.md) to inherit the
Observer/Subject pattern and adds geocoding-specific state: the current `GeoPosition`
instance and extracted coordinates.

## Purpose and Responsibility

- **Position State:** Tracks the current `GeoPosition` instance
- **Coordinate Extraction:** Exposes `{latitude, longitude}` without requiring consumers to know `GeoPosition` internals
- **Observer Pattern:** Inherited from `ObserverSubject` — notifies registered callbacks whenever position changes
- **Defensive Copies:** Returns copies of coordinate data to prevent external mutation
- **Error Isolation:** Observer errors are caught and logged in `ObserverSubject._notifyObservers()`

## Class Hierarchy

```text
ObserverSubject<GeocodingStateSnapshot>
  └── GeocodingState
```

## Location in Codebase

```text
src/core/ObserverSubject.ts   ← base class (Observer/Subject pattern)
src/core/GeocodingState.ts    ← this class (geocoding state)
```

## Dependencies

```typescript
import GeoPosition from './GeoPosition.js';
import ObserverSubject from './ObserverSubject.js';
```

## Snapshot Type

When observers are notified, they receive a `GeocodingStateSnapshot` object:

```typescript
interface GeocodingStateSnapshot {
  position: GeoPosition | null;
  coordinates: { latitude: number; longitude: number } | null;
}
```

## Constructor

### `constructor()`

Creates a new `GeocodingState` instance with null position and no observers.

```typescript
const state = new GeocodingState();
```

## Methods

> Observer-management methods (`subscribe`, `unsubscribe`, `getObserverCount`,
> `clearObservers`) are inherited from `ObserverSubject`.
> See [ObserverSubject API](./OBSERVER_SUBJECT_API.md) for their documentation.

### `setPosition(position)`

Sets the current position and notifies all observers.

**Parameters:**

- `position` (`GeoPosition | null`): New position, or `null` to clear

**Returns:** `GeocodingState` — this instance (for chaining)

**Throws:** `TypeError` if `position` is not a `GeoPosition` instance or `null`

**Behaviour:**
- Setting a non-null position updates internal state and notifies observers
- Setting `null` clears position and coordinates but does **not** notify observers

```typescript
const position = new GeoPosition(browserPosition);
state.setPosition(position);

// Chaining
state.setPosition(pos1).setPosition(pos2);

// Clear
state.setPosition(null);
```

---

### `getCurrentPosition()`

Returns the current position.

**Returns:** `GeoPosition | null`

```typescript
const position = state.getCurrentPosition();
if (position) {
  console.log(position.latitude, position.accuracyQuality);
}
```

---

### `getCurrentCoordinates()`

Returns a defensive copy of the current coordinates.

**Returns:** `{ latitude: number, longitude: number } | null`

```typescript
const coords = state.getCurrentCoordinates();
if (coords) {
  console.log(`Lat: ${coords.latitude}, Lon: ${coords.longitude}`);
}
```

---

### `hasPosition()`

Checks whether a position is currently set.

**Returns:** `boolean`

```typescript
if (state.hasPosition()) {
  const coords = state.getCurrentCoordinates();
}
```

---

### `subscribe(callback)` *(inherited)*

Registers a callback to receive `GeocodingStateSnapshot` notifications.

**Parameters:**

- `callback` (`(snapshot: GeocodingStateSnapshot) => void`)

**Returns:** `() => void` — unsubscribe function

**Throws:** `TypeError` if `callback` is not a function

```typescript
const unsubscribe = state.subscribe((snapshot) => {
  console.log('New position:', snapshot.position);
  console.log('Coordinates:', snapshot.coordinates);
});

// Later
unsubscribe();
```

---

### `unsubscribe(callback)` *(inherited)*

Removes a previously registered callback.

**Parameters:**

- `callback` — the same function reference passed to `subscribe()`

**Returns:** `boolean` — `true` if the callback was found and removed

```typescript
const handler = (snapshot) => console.log(snapshot);
state.subscribe(handler);
state.unsubscribe(handler); // returns true
```

---

### `getObserverCount()` *(inherited)*

Returns the number of currently registered observers.

**Returns:** `number`

```typescript
console.log(`Active observers: ${state.getObserverCount()}`);
```

---

### `clearObservers()` *(inherited)*

Removes all registered observers. Useful for cleanup or testing.

```typescript
state.clearObservers();
```

---

### `clear()`

Clears position and coordinates without notifying observers.

```typescript
state.clear();
console.log(state.hasPosition()); // false
```

---

### `toString()`

Returns a human-readable summary of current state.

**Returns:** `string`

```typescript
console.log(state.toString());
// "GeocodingState: position: available, coordinates: (-23.5505, -46.6333), observers: 2"
```

## Observer Snapshot

The `GeocodingStateSnapshot` interface (exported from `src/core/GeocodingState.ts`) defines
the value passed to every observer on notification:

```typescript
interface GeocodingStateSnapshot {
  position: GeoPosition | null;                            // current GeoPosition instance
  coordinates: { latitude: number; longitude: number } | null;  // defensive copy
}
```

## Error Handling

Observer errors are caught and logged via `console.warn` inside `ObserverSubject._notifyObservers()`,
so a failing observer does not prevent others from being notified:

```typescript
state.subscribe(() => { throw new Error('boom'); }); // caught, logged
state.subscribe((snap) => doWork(snap));              // still called
```

## Usage Examples

### Basic position tracking

```typescript
import GeocodingState from 'paraty_geocore.js/src/core/GeocodingState.js';
import { GeoPosition } from 'paraty_geocore.js/src/core/GeoPosition.js';

const state = new GeocodingState();

const unsubscribe = state.subscribe((snapshot) => {
  console.log(`Position: ${snapshot.coordinates.latitude}, ${snapshot.coordinates.longitude}`);
});

navigator.geolocation.watchPosition((browserPos) => {
  state.setPosition(new GeoPosition(browserPos));
});

// Cleanup
unsubscribe();
```

### Dependency injection in tests

```typescript
function createCoordinator(geocodingState = new GeocodingState()) {
  return new MyCoordinator(geocodingState);
}

// In tests
const mockState = new GeocodingState();
const coordinator = createCoordinator(mockState);
mockState.setPosition(new GeoPosition(mockBrowserPosition));
// assert coordinator reacted...
```

## Design Notes

- **Single Responsibility:** Geocoding state only — observer management is delegated to `ObserverSubject`
- **Immutability:** `getCurrentCoordinates()` always returns a fresh copy
- **Observer isolation:** Errors in one observer do not affect others (handled by `ObserverSubject`)
- **Chaining:** `setPosition()` returns `this` for fluent usage

## Tests

Tests are located at `test/core/GeocodingState.test.ts` and `test/core/ObserverSubject.test.ts`.

`GeocodingState.test.ts` covers:

- Constructor initialisation and `instanceof ObserverSubject` assertion
- `setPosition()` with valid, null, and invalid inputs
- `getCurrentPosition()` and `getCurrentCoordinates()` state accuracy and defensive copy behaviour
- `hasPosition()` across state transitions
- `subscribe()` / `unsubscribe()` lifecycle and error isolation
- Observer error handling and memory management
- Integration scenarios with multiple observers and rapid updates

`ObserverSubject.test.ts` covers the base class in isolation.
