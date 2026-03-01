# GeocodingState API Documentation

**Version:** 0.9.6-alpha
**Module:** `src/core/GeocodingState.ts`
**Pattern:** Observer (State Management)
**Author:** Marcelo Pereira Barbosa

## Overview

Centralized state management for geocoding position data. Implements the Observer pattern to notify subscribers of state changes, following the Single Responsibility Principle by focusing solely on state management.

## Purpose and Responsibility

- **Position State:** Tracks the current `GeoPosition` instance
- **Coordinate Extraction:** Exposes `{latitude, longitude}` without requiring consumers to know `GeoPosition` internals
- **Observer Pattern:** Notifies registered callbacks whenever position changes
- **Defensive Copies:** Returns copies of coordinate data to prevent external mutation
- **Error Isolation:** Catches and logs observer errors so one failing subscriber cannot break others

## Location in Codebase

```text
src/core/GeocodingState.ts
```

## Dependencies

```typescript
import { GeoPosition } from './GeoPosition.js';
```

## Constructor

### `constructor()`

Creates a new `GeocodingState` instance with null position and no observers.

```typescript
const state = new GeocodingState();
```

## Methods

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

### `subscribe(callback)`

Registers a callback to receive state change notifications.

**Parameters:**

- `callback` (`(snapshot: { position: GeoPosition, coordinates: { latitude, longitude } }) => void`)

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

### `unsubscribe(callback)`

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

### `getObserverCount()`

Returns the number of currently registered observers.

**Returns:** `number`

```typescript
console.log(`Active observers: ${state.getObserverCount()}`);
```

---

### `clearObservers()`

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

When observers are notified, they receive a snapshot object:

```typescript
{
  position: GeoPosition;                            // current GeoPosition instance
  coordinates: { latitude: number; longitude: number } | null;  // defensive copy
}
```

## Error Handling

Observer errors are caught internally and logged via `console.warn`, so a failing observer does not prevent other observers from being notified:

```typescript
state.subscribe(() => { throw new Error('boom'); }); // caught
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

- **Single Responsibility:** State management only — no API calls, no UI interaction
- **Immutability:** `getCurrentCoordinates()` always returns a fresh copy
- **Observer isolation:** Errors in one observer do not affect others
- **Chaining:** `setPosition()` returns `this` for fluent usage

## Tests

Tests are located at `test/core/GeocodingState.test.ts` and cover:

- Constructor initialisation
- `setPosition()` with valid, null, and invalid inputs
- `getCurrentPosition()` and `getCurrentCoordinates()` state accuracy and defensive copy behaviour
- `hasPosition()` across state transitions
- `subscribe()` / `unsubscribe()` lifecycle and error isolation
- Observer error handling and memory management
- Integration scenarios with multiple observers and rapid updates
