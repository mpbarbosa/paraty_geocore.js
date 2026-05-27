# Clean Architecture Guide

This repository requires clean-architecture changes: organise code into clear
layers where inner layers hold stable domain rules and outer layers hold
volatile implementation details, with all dependencies pointing inward.

## Source of Truth

Use [docs/CLEAN_ARCHITECTURE_GUIDE.md](../docs/CLEAN_ARCHITECTURE_GUIDE.md) as
the authoritative guide. This `.github/` copy exists so workflow reviews and
Copilot-oriented guidance can discover the rule in the expected location without
duplicating the full document.

## Repository-Specific Rules

1. Keep `src/core/` focused on domain concepts: `GeoPosition`, `GeocodingState`,
   `ReferencePlace`, `PositionManager`, `ObserverSubject`, `DualObserverSubject`,
   `ObserverMixin`, and `errors`.
2. Keep `src/utils/` focused on pure or near-pure helpers with no domain
   knowledge: `calculateDistance`, `delay`, `log`/`warn`.
3. Keep `src/index.ts` as a pure re-export barrel with no implementation logic.
4. Do not let `src/utils/` import from `src/core/`; the dependency direction is
   `src/utils/` ← `src/core/` ← `src/index.ts`.
5. Do not import browser platform APIs (such as `navigator` or
   `GeolocationCoordinates`) directly inside `src/core/` files; translate them
   at the constructor boundary.
6. Ensure domain and utility tests in `test/core/` and `test/utils/` run with
   Jest without a browser environment.

## Review Heuristic

If a file's import list includes browser globals, platform APIs, or an
`src/index.ts` reference from inside `src/core/` or `src/utils/`, the
dependency direction is violated and should be corrected before merging.
