# PositionManager

## Overview

`PositionManager` is the central singleton for managing the current geographic
position in any application that builds on **paraty_geocore.js**.  It wraps
the browser Geolocation API, applies multi-layer position validation and
filtering rules, and exposes an observer-based notification system so that
multiple components can react to position changes without being tightly
coupled to each other.

## Motivation

Device location management involves several recurring challenges:

- Ensuring only one source of truth for the current position
- Filtering out inaccurate or insignificant position updates
- Preventing excessive processing from minor GPS fluctuations
- Notifying multiple components about position changes in a decoupled way
- Providing consistent position data across the application

`PositionManager` addresses all of these by:

- **Centralising position state** via the Singleton pattern
- **Implementing multi-layer validation rules** (accuracy, distance, time)
- **Managing subscriptions** via the Observer pattern (backed by
  [`DualObserverSubject`](./ARCHITECTURE.md))
- **Providing intelligent update logic** that prevents unnecessary processing

## Design Patterns

| Pattern    | Role |
|------------|------|
| Singleton  | One instance = one source of truth |
| Observer   | Decoupled position-change notifications |
| Strategy   | Configurable validation rules via `PositionManagerConfig` |

## Architecture

```text
PositionManager (Singleton)
    ├── holds      → GeoPosition (lastPosition)
    ├── uses       → DualObserverSubject
    │                   └── notifies → Observer.update(manager, event, data, error)
    ├── validates with → PositionManagerConfig
    │                   ├── trackingInterval       (50 s)
    │                   ├── minimumDistanceChange  (20 m)
    │                   ├── minimumTimeChange      (30 s)
    │                   └── notAcceptedAccuracy    (null)
    └── fires events
               ├── strCurrPosUpdate
               ├── strCurrPosNotUpdate
               └── strImmediateAddressUpdate
```

## Installation

```bash
npm install paraty_geocore.js
```

## Usage

### Basic usage

```typescript
import { PositionManager } from 'paraty_geocore.js';

const manager = PositionManager.getInstance();

const observer = {
  update: (manager: PositionManager, event: string) => {
    if (event === PositionManager.strCurrPosUpdate) {
      console.log('Position updated:', manager.latitude, manager.longitude);
    }
  }
};

manager.subscribe(observer);
```

### With initial position

```typescript
navigator.geolocation.getCurrentPosition((position) => {
  const manager = PositionManager.getInstance(position);
  console.log('Initialised at:', manager.latitude, manager.longitude);
  console.log('Accuracy quality:', manager.accuracyQuality);
});
```

### Continuous tracking

```typescript
navigator.geolocation.watchPosition((position) => {
  PositionManager.getInstance(position);
  // Observers are notified automatically
});
```

### Browser compatibility

```typescript
import { PositionManager, initializeConfig } from 'paraty_geocore.js';

const browserPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(resolve, reject);
});

// Browser GeolocationPosition objects remain compatible with the
// library-owned GeoPositionInput shape accepted by PositionManager.
PositionManager.getInstance(browserPosition);
```

### Library-owned input shape

```typescript
import { initializeConfig } from 'paraty_geocore.js';
import type { GeoPositionInput } from 'paraty_geocore.js';

const input: GeoPositionInput = {
  coords: { latitude: -23.5505, longitude: -46.6333, accuracy: 10 },
  timestamp: Date.now(),
};

PositionManager.getInstance(input);
```

### Custom configuration

```typescript
import { initializeConfig } from 'paraty_geocore.js';

// Call before the first getInstance() to override defaults
initializeConfig({
  minimumDistanceChange: 50,           // 50 m
  minimumTimeChange: 60_000,           // 60 s
  trackingInterval: 120_000,           // 2 min
  notAcceptedAccuracy: ['bad', 'very bad'],
});
```

## API Reference

### `PositionManager.getInstance(position?)`

Returns the singleton instance, creating it on first call.  If `position` is
supplied to a subsequent call, it is forwarded to `update()`.

`position` uses the library-owned `GeoPositionInput` shape. Browser
`GeolocationPosition` objects remain compatible and can still be passed
directly.

### `manager.update(position)`

Processes a new `GeoPositionInput`-compatible object through all validation
layers. Accepted positions update `lastPosition` and notify observers. Rejected
positions notify observers with `strCurrPosNotUpdate`.

### `manager.subscribe(observer)` / `manager.unsubscribe(observer)`

Add or remove an object observer.  The observer must implement:

```typescript
interface Observer {
  update?: (
    manager: PositionManager,
    event: string,
    data: unknown,
    error: { name: string; message: string } | null,
  ) => void;
}
```

### `manager.notifyObservers(event, data?, error?)`

Manually emit an event to all subscribers.  Typically called internally by
`update()`.

### Position proxy getters

| Property         | Type              | Description |
|------------------|-------------------|-------------|
| `latitude`       | `number \| undefined` | Decimal degrees |
| `longitude`      | `number \| undefined` | Decimal degrees |
| `accuracy`       | `number \| undefined` | Metres |
| `accuracyQuality`| `AccuracyQuality \| undefined` | `'excellent' \| 'good' \| 'medium' \| 'bad' \| 'very bad'` |
| `altitude`       | `number \| null \| undefined` | Metres |
| `heading`        | `number \| null \| undefined` | Degrees |
| `speed`          | `number \| null \| undefined` | m/s |
| `timestamp`      | `number \| undefined` | Unix ms |

### Static event constants

| Constant                     | Value | Fired when |
|------------------------------|-------|------------|
| `strCurrPosUpdate`           | `'PositionManager updated'`         | Position accepted, tracking interval elapsed |
| `strCurrPosNotUpdate`        | `'PositionManager not updated'`     | Position rejected by any validation rule |
| `strImmediateAddressUpdate`  | `'Immediate address update'`        | Position accepted but before tracking interval |

### `initializeConfig(partial)`

Merges `partial` with the library defaults and applies the result globally.
Always call this before the first `getInstance()` if you need custom thresholds.

### `createPositionManagerConfig()`

Returns a fresh config object with all defaults.  Useful as a base for testing
or selective overrides.

## Validation Rules

Position updates go through four layers in order:

### 1. Position validity

The `position` object must exist, include a finite `timestamp`, and provide
finite `coords.latitude` and `coords.longitude` values. If not, the update is
rejected and observers receive `strCurrPosNotUpdate` with an
`InvalidPositionError`.

### 2. Accuracy quality

```js
notAcceptedAccuracy: ['medium', 'bad', 'very bad']  // mobile example
```

If the accuracy quality of the incoming position is listed in
`notAcceptedAccuracy`, the update is rejected with an `AccuracyError`.

Set `notAcceptedAccuracy: null` (default) to accept all accuracy levels.

### 3. Distance OR time threshold

An update is accepted if **either**:

- The device has moved ≥ `minimumDistanceChange` metres, **OR**
- `minimumTimeChange` ms has elapsed since the last accepted update

This ensures responsive updates both during rapid movement and during slow
stationary periods.

If **neither** condition is met the update is rejected with a
`DistanceAndTimeError`.

### 4. Event classification

Once an update is accepted, the event type is chosen based on whether
`trackingInterval` ms has elapsed since the last accepted update:

| Elapsed time                        | Event |
|-------------------------------------|-------|
| ≥ `trackingInterval`                | `strCurrPosUpdate` |
| < `trackingInterval`                | `strImmediateAddressUpdate` |

## Configuration Reference

| Field                   | Type                   | Default | Description |
|-------------------------|------------------------|---------|-------------|
| `trackingInterval`      | `number` (ms)          | `50000` | Interval for regular updates |
| `minimumDistanceChange` | `number` (m)           | `20`    | Minimum distance to accept update |
| `minimumTimeChange`     | `number` (ms)          | `30000` | Minimum time to force update |
| `notAcceptedAccuracy`   | `AccuracyQuality[] \| null` | `null` | Rejected accuracy labels |

## Testing

```bash
# Unit tests
npm run test:core

# Integration tests
npm run test:integration

# All tests
npm test
```

The test files are:

- `test/core/PositionManager.test.ts` — unit tests (singleton, observers,
  validation layers, event classification)
- `test/integration/GeoPositionPositionManager.integration.test.ts` —
  integration tests with real `calculateDistance` and `GeoPosition`

## Changelog

| Version       | Change |
|---------------|--------|
| 0.12.3-alpha  | Initial port from guia_turistico; adapted imports, replaced app config with `PositionManagerConfig`, added `createPositionManagerConfig()` and `initializeConfig()` |
| 0.12.10-alpha | Introduced to paraty_geocore.js as a fully integrated module |
| 0.13.0-alpha | Added `setBypassDistanceRule(enabled)` / `_bypassDistanceRule` flag for testing distance-rule bypass |
