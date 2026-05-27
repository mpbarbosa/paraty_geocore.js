# High Cohesion Guide

This repository requires high-cohesion changes: keep each file, symbol, and
document focused on one clear responsibility.

## Source of Truth

Use [docs/HIGH_COHESION_GUIDE.md](../docs/HIGH_COHESION_GUIDE.md) as the
authoritative guide. This `.github/` copy exists so workflow reviews and
Copilot-oriented guidance can discover the rule in the expected location without
duplicating the full document.

## Repository-Specific Rules

1. Keep each `src/core/` file focused on one domain concept: `GeoPosition.ts`
   owns position normalisation, `ReferencePlace.ts` owns OSM POI classification,
   `PositionManager.ts` owns the position gate and subscriber coordination.
2. Keep each `src/utils/` file focused on one helper concern: `distance.ts`
   owns the Haversine calculation, `async.ts` owns `delay`, `logger.ts` owns
   structured console output.
3. Keep `src/index.ts` as a re-export barrel only; it must not accumulate logic,
   derived types, or conditional exports.
4. Mirror source structure in tests: `test/core/Foo.test.ts` tests
   `src/core/Foo.ts`; interactions between two modules belong in
   `test/integration/`, not `test/core/`.
5. Keep each FRS document in `docs/` focused on one module's acceptance criteria;
   cross-link to related guides instead of duplicating guidance.

## Review Heuristic

If the best one-sentence description of a file or symbol needs repeated "and",
the responsibility is probably too broad and should be split into narrower units.
