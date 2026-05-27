# Unit Test Guide

This repository requires well-structured unit tests: each test must verify one
focused behaviour, run deterministically without a browser, and cover both happy
paths and error conditions at the correct layer boundary.

## Source of Truth

Use [docs/UNIT_TEST_GUIDE.md](../docs/UNIT_TEST_GUIDE.md) as the authoritative
guide. This `.github/` copy exists so workflow reviews and Copilot-oriented
guidance can discover the rule in the expected location without duplicating the
full document.

## Repository-Specific Rules

1. Mirror the source structure in tests: `test/core/Foo.test.ts` covers
   `src/core/Foo.ts`; `test/utils/foo.test.ts` covers `src/utils/foo.ts`;
   interactions between two modules belong in `test/integration/`.
2. Never rely on a live browser environment in `test/core/` or `test/utils/`;
   stub `navigator.geolocation`, `GeolocationCoordinates`, and all browser
   globals.
3. Reset `PositionManager` singleton state in `beforeEach` or `afterEach` to
   prevent test-order coupling.
4. Use `jest.useFakeTimers()` and `jest.advanceTimersByTime()` for any test that
   depends on `delay` or other timer-based behaviour.
5. Assert `Object.isFrozen(instance) === true` for every `GeoPosition` and
   `ReferencePlace` instance created in tests.
6. Cover error paths: null/undefined/out-of-range inputs for `GeoPosition`,
   unknown class and unknown type for `ReferencePlace`, and negative values for
   `delay`.

## Review Heuristic

If a test in `test/core/` or `test/utils/` starts a browser, depends on
execution order, or omits error-path coverage for a boundary that callers
rely on, the test does not meet the quality bar for this repository.
