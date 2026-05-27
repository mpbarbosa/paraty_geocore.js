# Code Quality Control Guide

This guide defines quality-control expectations for changes to `paraty_geocore.js`.
It is intentionally narrow: use it to review the quality of implementation
changes, not as a replacement for the architecture and design guides.

## Source of truth

Use this guide together with:

- [Clean Architecture Guide](./CLEAN_ARCHITECTURE_GUIDE.md)
- [High Cohesion Guide](./HIGH_COHESION_GUIDE.md)
- [Low Coupling Guide](./LOW_COUPLING_GUIDE.md)
- [Referential Transparency Guide](./REFERENTIAL_TRANSPARENCY.md)
- [Lightweight DDD Guide](./LIGHTWEIGHT_DDD_GUIDE.md)
- [Unit Test Guide](./UNIT_TEST_GUIDE.md)

## Goal

Catch quality regressions early by ensuring every change:

1. lands in the correct layer (`src/core/`, `src/utils/`, or `src/index.ts`)
2. keeps public APIs intentional and named in the ubiquitous language
3. isolates external API shapes at domain boundaries
4. preserves deterministic helper logic where practical
5. stays covered by focused tests and passes all validation commands

## Quality gates

### 1. Responsibility gate

- A file should have one clear primary job (see
  [High Cohesion Guide](./HIGH_COHESION_GUIDE.md)).
- `src/core/` files must not accumulate utility logic or re-export wiring
  alongside domain behaviour.
- `src/utils/` files must not accumulate domain knowledge.
- If a component description needs repeated "and", split or extract.

### 2. Boundary gate

- Public APIs exported from `src/index.ts` should expose library-owned types
  and names from the ubiquitous language.
- Browser API shapes (`GeolocationCoordinates`, `GeolocationPosition`) must not
  appear in public API signatures — they are translated at the `GeoPosition`
  constructor boundary.
- Raw OSM field names (`class`, `type`) must not appear in the public API of
  `ReferencePlace` — callers use `description`, `category`, `className`,
  `typeName`.

### 3. DDD-alignment gate

- Use the ubiquitous language consistently across all modules, tests, and docs
  (see [Lightweight DDD Guide](./LIGHTWEIGHT_DDD_GUIDE.md)).
- Prefer value-object modeling: new types representing geolocation data or POI
  classifications should be immutable and frozen.
- Avoid adding abstractions whose main effect is ceremony rather than clarity.

### 4. Purity gate

- Keep pure mapping, parsing, normalisation, and validation logic in small
  reusable helpers (see [Referential Transparency Guide](./REFERENTIAL_TRANSPARENCY.md)).
- `src/utils/distance.ts` must remain a pure function.
- Do not hide side effects behind utility-sounding names.

### 5. Test gate

- Changes to public behaviour require focused tests at the affected boundary.
- New utility functions must have direct unit coverage in `test/utils/`.
- Extracted domain logic must have tests in `test/core/`.
- Split tests along responsibility seams when a refactor separates behaviour.
- See [Unit Test Guide](./UNIT_TEST_GUIDE.md) for structure and patterns.

### 6. Documentation gate

- Update the relevant FRS document (`docs/*-FRS.md`) when public API behaviour,
  exports, or acceptance criteria change.
- Update `docs/FUNCTIONAL_REQUIREMENTS.md` when the module index or "Out of
  Scope" section changes.
- Update `CHANGELOG.md` for every user-visible change using
  [Keep a Changelog](https://keepachangelog.com/) format.
- Cross-link to related design guides instead of restating them.

### 7. Architecture gate

See [Clean Architecture Guide](./CLEAN_ARCHITECTURE_GUIDE.md) for the full layer
reference. Key checks at review time:

- Dependencies point inward: `src/utils/` ← `src/core/` ← `src/index.ts`.
- `src/core/` files are free of direct browser API imports and platform globals.
- `src/utils/` files are free of `src/core/` imports.
- `src/index.ts` contains re-exports only — no logic.
- Domain and utility logic can be exercised without a browser environment.

### 8. Validation gate

Run all three commands before committing a substantive change:

```bash
# 1. Full test suite
npm test

# 2. TypeScript type check (no compilation output)
npx tsc --noEmit

# 3. Markdown linting
npm run lint:md
```

All three must be clean. If lint violations exist in docs, fix them before
committing.

## Review Checklist

- [ ] The change belongs to the correct layer (`src/core/`, `src/utils/`, or
      `src/index.ts`).
- [ ] Public names use the ubiquitous language, not browser API or OSM
      vocabulary.
- [ ] Browser/OSM shapes are translated at domain boundaries, not passed through.
- [ ] Pure helpers are separated from runtime orchestration where practical.
- [ ] New abstractions improve clarity more than they increase indirection.
- [ ] Tests cover the changed boundary and any newly extracted critical helper.
- [ ] The relevant FRS doc and `CHANGELOG.md` reflect the change.
- [ ] `npm test`, `npx tsc --noEmit`, and `npm run lint:md` all pass.
- [ ] No `src/utils/` file imports from `src/core/`.
- [ ] No `src/core/` file imports from `src/index.ts`.
- [ ] No import cycle exists between `src/core/` files.
- [ ] Newly frozen types are asserted as frozen in their tests.

## Summary

Good quality control is mostly about keeping boundaries clear, abstractions
small, and public APIs intentional. Favour thinner adapters, focused helpers,
and explicit documentation over broad wrappers and hidden dependency leakage.
