# PositionManagerPolicy

## Overview

`PositionManagerPolicy` contains the deterministic helper functions used by
`PositionManager` to validate incoming position data and classify update events.
It keeps pure decision logic separate from runtime orchestration, logging, and
observer notification.

> **Internal module:** this file documents a core helper used by
> `PositionManager`, but it is **not** part of the package's public re-export
> surface in `src/index.ts`.

## Responsibilities

- Validate the library-owned `GeoPositionInput` shape before `PositionManager`
  attempts to persist it
- Reject updates whose accuracy quality is configured as unacceptable
- Evaluate the distance-or-time gate for throttled updates
- Classify accepted updates as regular or immediate events

## Module API

### `validatePositionInput(position)`

Validates that the candidate position is a non-null object with:

- a finite `timestamp`
- a `coords` object
- finite `coords.latitude` and `coords.longitude` values

Returns:

```ts
{
  position: ValidPositionInput | null;
  error: PositionManagerError | null;
}
```

Invalid input returns an `InvalidPositionError` descriptor.

### `getRejectedAccuracyError(position, notAcceptedAccuracy)`

Computes the incoming position's accuracy quality and returns:

- `null` when the position is acceptable
- an `AccuracyError` descriptor when the quality is listed in
  `notAcceptedAccuracy`

### `evaluateDistanceTimeGate(options)`

Evaluates whether a new position should be accepted based on the configured:

- `minimumDistanceChange`
- `minimumTimeChange`
- `bypassDistanceRule`

Returns a structured result that includes the acceptance decision, measured
distance/time, and a `DistanceAndTimeError` when neither threshold is met.

### `classifyPositionEvent(timestamp, lastModified, trackingInterval)`

Classifies an accepted update as either:

- a regular `PositionManager.strCurrPosUpdate`, or
- an immediate `PositionManager.strImmediateAddressUpdate`

When the elapsed time is below `trackingInterval`, the helper returns an
`ElapseTimeError` descriptor alongside the `immediate` classification.

## Relationship to `PositionManager`

`PositionManager` remains responsible for:

- singleton lifecycle
- storing the last accepted `GeoPosition`
- notifying observers
- operational logging

`PositionManagerPolicy` is responsible only for the pure rule evaluation that
feeds those orchestration decisions.

## Tests

- `test/core/PositionManagerPolicy.test.ts` covers the extracted pure helpers
- `test/core/PositionManager.test.ts` covers their integration through
  `PositionManager.update()`
