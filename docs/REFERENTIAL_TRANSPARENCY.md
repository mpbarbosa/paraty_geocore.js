# Referential Transparency Guide

`paraty_geocore.js` is designed around immutability and determinism.
`GeoPosition` and `ReferencePlace` are frozen value objects; `calculateDistance`
is a pure function. This guide codifies that intent and extends it to the whole
codebase.

## Goal

Keep calculations, transformations, and decision logic deterministic and free of
observable side effects wherever practical. A referentially transparent
expression should be replaceable with its result without changing program
behaviour.

## What It Means in This Project

| Component | Approach |
|-----------|----------|
| `GeoPosition` | Frozen at construction. `accuracyQuality`, `heading`, `toString()` are derived from constructor inputs only. No mutation after freeze. |
| `ReferencePlace` | Frozen at construction. `description`, `category`, `toString()` are pure computations from constructor inputs. |
| `calculateDistance` | Pure function: `(lat1, lon1, lat2, lon2) → metres`. No shared state, no I/O. |
| `delay` | Side-effecting (`setTimeout`) but deterministic for the caller: same `ms` input always resolves after the same minimum delay. |
| `log` / `warn` | Side-effecting (console output) but isolated. Never called from pure domain methods. |
| `GeocodingState` | Stateful — maintains current geocoding state. Side effects (notifying subscribers) are explicit and isolated. |
| `PositionManager` | Stateful singleton — gates and forwards GPS fixes. Side effects are explicit; the distance/time gate calculation is pure. |

The core rule: **calculations are pure; effects are at the boundary**.

## Required Rules

1. `src/core/GeoPosition.ts` and `src/core/ReferencePlace.ts` must not call
   `Date.now()`, `Math.random()`, or any I/O inside their computed properties.
2. `src/utils/distance.ts` must not read globals, singletons, or shared state.
3. Do not mutate the input argument of any constructor or utility function.
4. Prefer returning new values over modifying shared objects.
5. `log`/`warn` calls must not appear inside pure domain methods. Keep them in
   orchestration code or boundary adapters.
6. When a method is stateful by design (e.g., `PositionManager.update`), make
   that statefulness obvious from the name and docs — do not hide effects behind
   utility-sounding names.
7. Tests for pure methods must not require live clocks, browser globals, or
   external services.

## Applying This by Module

### `src/core/GeoPosition.ts`

```typescript
// ✅ Pure computed getter — same input always produces same output
get accuracyQuality(): AccuracyQuality {
    if (this.accuracy !== null && this.accuracy <= 10) return 'high';
    if (this.accuracy !== null && this.accuracy <= 30) return 'medium';
    return 'low';
}

// ❌ Would violate referential transparency
get accuracyQuality(): AccuracyQuality {
    console.log('computing quality');   // side effect inside pure getter
    return computeQuality(this.accuracy);
}
```

### `src/utils/distance.ts`

```typescript
// ✅ Pure function — unit-testable with plain numbers
export function calculateDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    // Haversine formula ...
}

// ❌ Reading global config would break purity
export function calculateDistance(...): number {
    const unit = globalConfig.distanceUnit;  // hidden input
    ...
}
```

### `src/core/PositionManager.ts`

```typescript
// ✅ Keep the pure gate calculation separate from the effectful dispatch
private passesDistanceGate(newPos: GeoPosition): boolean {
    if (!this._lastPosition) return true;
    return calculateDistance(...) >= this._minimumDistance;
}

// Side-effecting method is clearly named
update(position: GeoPosition): void {
    if (this.passesDistanceGate(position)) {
        this._lastPosition = position;
        this.notify(position);   // explicit effect
    }
}
```

## Positive Signals

- `GeoPosition` and `ReferencePlace` tests use `new GeoPosition(fixture)` with
  plain objects — no global state involved.
- `calculateDistance` tests are a table of inputs and expected outputs — no
  setup required.
- `PositionManager` tests inject a mock notifier or spy — they do not depend on
  a live browser.
- Getters and computed properties read only `this` fields, nothing external.
- When a test needs to control time, it overrides `delay`'s collaborator (`setTimeout`)
  with Jest fake timers, not an internal flag.

## Warning Signs

- A getter or pure helper calls `Date.now()`, `Math.random()`, or `console.*`.
- A constructor mutates a passed-in object.
- `calculateDistance` or any `src/utils/` function imports from `src/core/`.
- A pure method has side effects that only show up under certain call sequences.
- Tests for `GeoPosition` or `ReferencePlace` require a `jsdom` or browser
  environment to run.

## Review Heuristics

### Substitution Test

Could the result of a call be cached and reused without changing program
behaviour? If not, the logic is not referentially transparent or the effectful
part needs to be separated.

### Hidden Input Test

Does the function read anything other than its explicit parameters?
`this` properties on a frozen value object are acceptable. Singletons, globals,
or process state are not.

### Mutation Test

Does evaluating the function change any caller-owned object, shared collection,
or module-level variable?

### Boundary Test

Are console calls, `setTimeout`, and subscriber notifications grouped at
boundary methods (`update`, event handlers), rather than scattered inside
domain computations?

## Related Guides

- [HIGH_COHESION_GUIDE.md](./HIGH_COHESION_GUIDE.md) — keeping each module
  focused on one clear responsibility.
- [LOW_COUPLING_GUIDE.md](./LOW_COUPLING_GUIDE.md) — making dependencies
  explicit and avoiding hidden shared state.
- [UNIT_TEST_GUIDE.md](./UNIT_TEST_GUIDE.md) — testing pure behaviour with
  direct input/output assertions.
- [LIGHTWEIGHT_DDD_GUIDE.md](./LIGHTWEIGHT_DDD_GUIDE.md) — separating pure
  domain policy from side-effecting infrastructure.

## Summary Checklist

- [ ] `GeoPosition` and `ReferencePlace` getters read only frozen instance fields.
- [ ] `calculateDistance` and other utilities have no hidden inputs or outputs.
- [ ] No constructor mutates its input argument.
- [ ] `log`/`warn` calls appear only in orchestration or boundary code, not in
      pure domain methods.
- [ ] Effects (`notify`, `setTimeout`, console) are explicit and at named
      boundary methods.
- [ ] Tests for pure methods use direct input/output assertions without
      environment setup.
- [ ] A reviewer or LLM can infer a function's complete behaviour from its
      visible parameters and `this` fields alone.
