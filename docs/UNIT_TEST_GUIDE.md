# Unit Test Guide

`paraty_geocore.js` uses **Jest** with **TypeScript** for all tests. This guide
defines what a good unit test looks like for this library and provides heuristics
for keeping the test suite fast, deterministic, and meaningful.

## Source of truth

Use this guide together with:

- [Code Quality Control Guide](./CODE_QUALITY_CONTROL_GUIDE.md)
- [Referential Transparency Guide](./REFERENTIAL_TRANSPARENCY.md)
- [High Cohesion Guide](./HIGH_COHESION_GUIDE.md)
- [Low Coupling Guide](./LOW_COUPLING_GUIDE.md)

## Test Structure

```text
test/
├── core/
│   ├── GeoPosition.test.ts            ← unit tests for GeoPosition
│   ├── GeoPosition.edge-cases.test.ts ← edge-case unit tests (split by concern)
│   ├── GeocodingState.test.ts
│   ├── ReferencePlace.test.ts
│   ├── PositionManager.test.ts
│   ├── ObserverSubject.test.ts
│   ├── DualObserverSubject.test.ts
│   ├── ObserverMixin.test.ts
│   └── errors.test.ts
├── utils/
│   ├── distance.test.ts               ← unit tests for calculateDistance
│   ├── async.test.ts                  ← unit tests for delay
│   └── logger.test.ts
├── integration/
│   ├── GeoPositionPositionManager.integration.test.ts
│   └── browser-geolocation.test.ts
├── benchmarks/
│   └── performance.benchmark.ts
├── helpers/
│   └── fixtures.ts                    ← shared test fixtures
└── index.test.ts                      ← public re-export surface test
```

Each `test/core/Foo.test.ts` file tests `src/core/Foo.ts`. Each
`test/utils/foo.test.ts` tests `src/utils/foo.ts`. Cross-module behaviour
belongs in `test/integration/`.

## Running Tests

```bash
# Full test suite with coverage
npm test

# Fast run without coverage (during development)
npm test -- --no-coverage

# Targeted run for one module
npm test -- --testPathPattern="GeoPosition" --no-coverage

# Type-check only (no test execution)
npx tsc --noEmit
```

## Quality Gates

Every substantive code change that affects unit-testable behaviour should satisfy
these gates.

### 1. Isolation gate

- A unit test must not open a real browser, network connection, or filesystem.
- `navigator.geolocation` and `GeolocationCoordinates` must be stubbed.
- `PositionManager` singleton state must be reset between tests (use
  `PositionManager.resetInstance()` or equivalent in `beforeEach`/`afterEach`).
- `Date.now()`, `Math.random()`, and timers must be controlled with Jest fake
  timers or explicit test doubles when determinism matters.

### 2. Determinism gate

- The same test with the same inputs must produce the same result every run.
- Tests must not depend on execution order (avoid shared state across `describe`
  blocks).
- When testing `delay`, use `jest.useFakeTimers()` and `jest.advanceTimersByTime()`.

### 3. Behaviour gate

- Assert what the module does, not how it is implemented.
- For `GeoPosition`: assert public properties, `toString()`, `accuracyQuality`,
  `toJSON()` — not internal variable names.
- For `ReferencePlace`: assert `description`, `category`, `toString()` — not
  the raw `referencePlaceMap` lookup internals.
- Only verify collaborator calls (spies) when the interaction is itself the
  public contract (e.g., observer notification was triggered).

### 4. Naming gate

- Test names should follow `it('returns X when Y')` or `it('throws Z when input
  is invalid')`.
- Group tests with `describe('GeoPosition')` → `describe('accuracyQuality')` →
  `it(...)`.
- If a test name needs "and" more than once, it is probably testing too much.

### 5. Boundary gate

- `GeoPosition` tests must construct from plain objects (`{ latitude, longitude,
  accuracy, ... }`), not from live `GeolocationCoordinates`.
- `PositionManager` tests must not require a real GPS signal.
- `calculateDistance` tests must use direct numeric inputs.

### 6. Error-path gate

- Test invalid constructor input for `GeoPosition` (null, undefined, out-of-range
  coordinates).
- Test `ReferencePlace` with null, undefined, unknown class, and unknown type.
- Test `delay(0)` and `delay(-1)` edge cases.
- `GeoPositionError` must be verifiable with `instanceof GeoPositionError`.

### 7. Immutability gate

- After constructing a `GeoPosition`, assert that mutation throws in strict mode:

  ```typescript
  const pos = new GeoPosition(fixture);
  expect(() => { (pos as any).latitude = 999; }).toThrow();
  ```

- After constructing a `ReferencePlace`, assert `Object.isFrozen(place) === true`.

### 8. Execution gate

- Unit tests in `test/core/` and `test/utils/` must run in milliseconds.
- Avoid `setTimeout` without fake timers in `test/core/` or `test/utils/`.
- Coverage targets are informative, not the primary quality metric.

## Common Patterns

### Pattern 1 — Pure function with direct assertions (`calculateDistance`)

```typescript
import { calculateDistance } from '../../src/utils/distance';

describe('calculateDistance', () => {
    it('returns 0 for identical coordinates', () => {
        expect(calculateDistance(-23.5, -46.6, -23.5, -46.6)).toBe(0);
    });

    it('rejects latitude out of range', () => {
        expect(() => calculateDistance(91, 0, 0, 0)).toThrow();
    });
});
```

### Pattern 2 — Immutable value object (`GeoPosition`)

```typescript
import { GeoPosition } from '../../src/core/GeoPosition';
import { validFixture } from '../helpers/fixtures';

describe('GeoPosition', () => {
    it('is frozen after construction', () => {
        const pos = new GeoPosition(validFixture);
        expect(Object.isFrozen(pos)).toBe(true);
    });

    it('derives accuracyQuality from accuracy value', () => {
        const pos = new GeoPosition({ ...validFixture, accuracy: 5 });
        expect(pos.accuracyQuality).toBe('high');
    });
});
```

### Pattern 3 — Controlling async (`delay`)

```typescript
import { delay } from '../../src/utils/async';

describe('delay', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('resolves after the specified milliseconds', async () => {
        const promise = delay(200);
        jest.advanceTimersByTime(200);
        await expect(promise).resolves.toBeUndefined();
    });
});
```

### Pattern 4 — Observer notification (spy on public contract)

```typescript
import { GeocodingState } from '../../src/core/GeocodingState';

describe('GeocodingState', () => {
    it('notifies subscribers when state changes', () => {
        const state = new GeocodingState();
        const listener = jest.fn();
        state.subscribe(listener);
        state.setLocating();
        expect(listener).toHaveBeenCalledTimes(1);
    });
});
```

### Pattern 5 — Parameterised edge cases (`ReferencePlace`)

```typescript
import { ReferencePlace, NO_REFERENCE_PLACE } from '../../src/core/ReferencePlace';

describe('ReferencePlace.calculateDescription', () => {
    test.each([
        [null, NO_REFERENCE_PLACE],
        [undefined, NO_REFERENCE_PLACE],
        [{}, NO_REFERENCE_PLACE],
        [{ class: 'amenity', type: 'cafe' }, 'Café'],
    ])('given %p returns %p', (input, expected) => {
        const place = new ReferencePlace(input as any);
        expect(place.description).toBe(expected);
    });
});
```

## Review Heuristics

### Isolation test

If the network were unavailable, the clock was wrong, or tests ran in reverse
order, would the test still pass? If not, the isolation is too weak.

### Hidden dependency test

Can a reader see every dependency from the test's `import` lines and `beforeEach`
setup? If a singleton or global is silently involved, the test is not describing
the full contract.

### Implementation-detail test

Would the test fail after an internal refactor that preserved the public API?
If yes, the assertions are too tightly coupled to internals.

### Readability test

Can a reviewer find the Arrange, Act, and Assert steps in under five seconds?
If the purpose is buried in large fixtures, reduce setup.

## Related Guides

- [CODE_QUALITY_CONTROL_GUIDE.md](./CODE_QUALITY_CONTROL_GUIDE.md) — broader
  quality gates that unit tests should support.
- [REFERENTIAL_TRANSPARENCY.md](./REFERENTIAL_TRANSPARENCY.md) — keeping core
  logic deterministic and easy to test with direct assertions.
- [HIGH_COHESION_GUIDE.md](./HIGH_COHESION_GUIDE.md) — keeping test files
  focused on one module's behaviour.
- [LOW_COUPLING_GUIDE.md](./LOW_COUPLING_GUIDE.md) — making collaborators
  explicit and replaceable in tests.

## Summary Checklist

- [ ] Each unit test verifies one focused behaviour.
- [ ] Browser globals and platform APIs are stubbed or not required.
- [ ] `PositionManager` singleton state is reset between tests.
- [ ] Timer-dependent tests use Jest fake timers.
- [ ] Immutability is asserted for `GeoPosition` and `ReferencePlace`.
- [ ] Error paths and edge cases are covered.
- [ ] Test names describe scenario and expected outcome clearly.
- [ ] Integration concerns (two modules together) are in `test/integration/`, not
      `test/core/`.
- [ ] `npm test` and `npx tsc --noEmit` both pass before a change is committed.
