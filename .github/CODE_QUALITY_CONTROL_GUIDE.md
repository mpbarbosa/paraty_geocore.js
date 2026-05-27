# Code Quality Control Guide

This repository requires explicit code quality control for boundary-heavy
changes: keep public APIs intentional, isolate external type leakage, and
enforce clear review and validation gates before merging.

## Source of Truth

Use [docs/CODE_QUALITY_CONTROL_GUIDE.md](../docs/CODE_QUALITY_CONTROL_GUIDE.md)
as the authoritative guide. This `.github/` copy exists so workflow reviews and
Copilot-oriented guidance can discover the rule in the expected location without
duplicating the full document.

## Repository-Specific Rules

1. Do not let browser API types (`GeolocationCoordinates`, `GeolocationPosition`)
   or raw OSM field names appear in the public API surface exported from
   `src/index.ts`; translate them at domain boundaries before they reach callers.
2. Update the relevant `docs/*-FRS.md` acceptance criteria and `CHANGELOG.md`
   for every change to public API behaviour, exports, or recommended usage.
3. Run all three validation commands before committing a substantive change:
   `npm test`, `npx tsc --noEmit`, and `npm run lint:md`; all must be clean.
4. Verify `Object.isFrozen(instance) === true` in tests for any new value object
   added to `src/core/`.
5. Keep pure mapping, parsing, and normalisation logic in focused helpers in
   `src/utils/`; do not accumulate them inside orchestration classes in
   `src/core/`.

## Review Heuristic

If a change leaves SDK or platform quirks, raw external naming, or
compatibility workarounds visible in the public API, or if `npm test` /
`npx tsc --noEmit` / `npm run lint:md` do not all pass, the change is not
ready to merge.
