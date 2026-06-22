# Architecture

**Package:** `paraty_geocore.js`
**Language:** TypeScript → JavaScript (CJS + ESM)
**License:** MIT

---

## 1. Purpose

`paraty_geocore.js` is a core library for geolocation applications. It provides:

- An immutable, normalised wrapper around the browser Geolocation API (`GeoPosition`)
- Observer-pattern infrastructure re-exported from [`bessa_patterns.ts`](https://github.com/mpbarbosa/bessa_patterns.ts): `ObserverSubject`, `DualObserverSubject`, and the `withObserver` mixin
- A geocoding state manager built on `ObserverSubject` (`GeocodingState`)
- A singleton position manager with configurable distance thresholds (`PositionManager`)
- An OSM point-of-interest wrapper with Portuguese-language descriptions (`ReferencePlace`)
- Pure utility functions for geographic distance calculation (`utils/distance`)
- General-purpose async helpers for polling/throttling patterns (`utils/async`)
- Lightweight structured logging helpers (`utils/logger`)

The library is designed to be consumed by higher-level geolocation applications, not used directly by end users.

---

## 2. Directory Structure

```text
paraty_geocore.js/
├── src/
│   ├── core/
│   │   ├── GeoPosition.ts           # Immutable position wrapper class
│   │   ├── ObserverSubject.ts       # Re-export of ObserverSubject from bessa_patterns.ts
│   │   ├── DualObserverSubject.ts   # Re-export of DualObserverSubject from bessa_patterns.ts
│   │   ├── ObserverMixin.ts         # Re-export of withObserver mixin from bessa_patterns.ts
│   │   ├── GeocodingState.ts        # Geocoding state manager (extends ObserverSubject)
│   │   ├── PositionManager.ts       # Singleton position manager with configurable distance thresholds
│   │   ├── ReferencePlace.ts        # OSM point-of-interest wrapper with Portuguese descriptions
│   │   └── errors.ts                # Custom error classes (GeoPositionError)
│   ├── utils/
│   │   ├── distance.ts              # Haversine distance calculation utilities
│   │   ├── async.ts                 # General-purpose async utilities (delay)
│   │   └── logger.ts                # Structured logging helpers (log, warn)
│   └── index.ts                     # Public package entry point (re-exports all public API)
├── .claude/
│   ├── README.md                # Explains the local Claude/Copilot helper settings kept out of source code
│   └── settings.local.json      # Developer-local agent permission overrides for this repository
├── .github/
│   ├── SKILLS.md                # Skills index — catalogue of all Copilot CLI skills
│   ├── copilot-instructions.md  # Copilot custom instructions for this repository
│   ├── dependabot.yml           # Dependabot configuration for automated dependency updates
│   ├── skills/                  # Copilot CLI skill definitions (SKILLS.md is the index)
│   │   ├── audit-and-fix/       # Orchestrates validate-logs → fix-log-issues in one pass
│   │   ├── fix-log-issues/      # Consumes plan.md and applies every confirmed fix
│   │   ├── next-roadmap-phase/  # Plans and implements the next library version milestone
│   │   ├── purge-workflow-logs/ # Deletes transient artefacts under .ai_workflow/
│   │   ├── update-bessa/        # Bumps the bessa_patterns.ts dependency to the latest release
│   │   ├── update-ibira/        # Bumps the ibira.js dependency to the latest release
│   │   └── validate-logs/       # Validates .ai_workflow/logs against the codebase; writes plan.md
│   └── workflows/
│       └── ci.yml               # CI/CD pipeline (Node.js 18.x, 20.x matrix)
├── docs/
│   ├── API.md                          # Full API reference (legacy hand-written)
│   ├── ARCHITECTURE.md                 # This file
│   ├── FUNCTIONAL_REQUIREMENTS.md      # Library-wide functional requirements
│   ├── GETTING_STARTED.md              # Installation and usage guide
│   ├── DOCKER_TESTING.md               # Running tests inside Docker
│   ├── errors.md                       # Error handling strategy and reference
│   ├── GEOCODING_STATE_API.md          # GeocodingState API reference
│   ├── OBSERVER_SUBJECT_API.md         # ObserverSubject API reference
│   ├── OBSERVER_MIXIN_API.md           # withObserver mixin API reference
│   ├── POSITION_MANAGER.md             # PositionManager API reference
│   ├── GEO_POSITION.md                 # GeoPosition user guide
│   ├── GEO_POSITION_API.md             # GeoPosition API reference
│   ├── GEO_POSITION_FUNC_SPEC.md       # GeoPosition functional spec
│   ├── GeoPosition-FRS.md              # Functional requirements spec — GeoPosition
│   ├── distance-FRS.md                 # Functional requirements spec — distance utils
│   ├── async-FRS.md                    # Functional requirements spec — async utils
│   ├── ReferencePlace-FRS.md           # Functional requirements spec — ReferencePlace
│   ├── GEOPOSITION_REFACTORING_SUMMARY.md
│   └── api/                            # TypeDoc-generated HTML reference (gitignored — run `npm run docs:generate`)
│       ├── assets/              # TypeDoc CSS/JS/font assets
│       ├── classes/             # Generated page per exported class
│       ├── functions/           # Generated page per exported function
│       ├── interfaces/          # Generated page per exported interface
│       ├── types/               # Generated page per exported type alias
│       └── variables/           # Generated page per exported constant
├── test/
│   ├── core/                    # Unit tests for src/core/ (GeoPosition, ObserverSubject, GeocodingState, ReferencePlace, errors)
│   ├── utils/                   # Unit tests for src/utils/ (distance, async)
│   ├── integration/             # Integration tests — browser Geolocation API simulation
│   ├── benchmarks/              # Performance benchmarks (excluded from coverage)
│   ├── helpers/                 # Shared test fixtures and constants (TEST_TIMESTAMP, etc.)
│   └── index.test.ts            # Smoke tests for the public re-export surface
├── scripts/
│   ├── colors.sh                # Shared ANSI colour definitions — sourced by other scripts
│   ├── deploy.sh                # Build, tag, push, and generate CDN URLs
│   ├── generate_ts_profile.sh   # Regenerates .ai_workflow/context/typescript_profile.md
│   └── smoke-test.cjs           # Smoke test for the compiled CJS dist bundle
├── dist/                        # Build output — generated by `npm run build` (gitignored)
│   ├── src/                     # CJS build (Node.js/CommonJS)
│   ├── esm/                     # ESM build (ES modules)
│   │   └── types/               # TypeScript declarations for ESM
│   ├── types/                   # TypeScript declarations root
│   └── test/                    # Compiled test files
├── coverage/                    # Test coverage report — generated by `npm run test:coverage` (gitignored)
│   └── lcov-report/             # LCOV HTML report
├── .markdownlint.json           # Markdownlint configuration
├── .pre-commit-config.yaml      # Pre-commit hook configuration
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

The hidden `.claude/` directory is reserved for developer-local AI assistant settings used while working in this repository. Its contents are tooling metadata rather than runtime library code, build output, or published package assets.

---

## 3. Module Dependency Graph

```text
[bessa_patterns.ts]  (external package)
    ├──► ObserverSubject.ts    (re-export)
    ├──► DualObserverSubject.ts (re-export)
    └──► ObserverMixin.ts      (re-export: withObserver)

GeoPosition.ts  ──► utils/distance.ts  (calculateDistance)
                ──► core/errors.ts     (GeoPositionError)

utils/distance.ts  ──► core/errors.ts  (GeoPositionError, for coord-range validation)

GeocodingState.ts  ──► ObserverSubject (via bessa_patterns.ts)
                   ──► core/GeoPosition.ts

PositionManager.ts  ──► DualObserverSubject (via bessa_patterns.ts)
                    ──► ObserverMixin / withObserver (via bessa_patterns.ts)
                    ──► core/GeoPosition.ts
                    ──► utils/distance.ts
                    ──► utils/logger.ts

ReferencePlace.ts  — no internal imports (self-contained)
utils/async.ts     — no imports (self-contained)
utils/logger.ts    — no imports (self-contained)

src/index.ts  — re-exports all of the above
```

> **External runtime dependency:** `bessa_patterns.ts` (installed from GitHub) provides the observer-pattern primitives (`ObserverSubject`, `DualObserverSubject`, `withObserver`). All other modules are self-contained within this repository.

---

## 4. Design Principles

### 4.1 Immutability

`GeoPosition` instances are frozen with `Object.freeze()` immediately after construction. No property can be set or mutated after the object is created. This makes instances safe to share across asynchronous callbacks without defensive copying by the caller.

### 4.2 Referential Transparency

All functions in `utils/distance` and all methods on `GeoPosition` are **pure**:
- Deterministic: same inputs always produce the same output.
- No side effects: no logging, no mutation of external state, no I/O.

### 4.3 Defensive Copying

The `GeoPosition` constructor explicitly extracts each property from `position.coords` by name rather than using the spread operator (`{ ...coords }`). This is necessary because the browser's `GeolocationCoordinates` object exposes its properties through non-enumerable getters, which spread silently ignores.

### 4.4 Isolated Module-Level State

Most modules are stateless. The exception is `PositionManager`, which uses a module-level mutable `config` variable and a `static instance` singleton to implement the singleton pattern. This is intentional — `PositionManager` is the library's single coordination point for device position updates. All other core modules (`GeoPosition`, `GeocodingState`, `ReferencePlace`) and all utility modules are fully stateless.

---

## 5. Key Algorithms

### Haversine Formula (`calculateDistance`)

Computes great-circle distance on a spherical Earth (radius = 6,371 km):

```text
a = sin²(Δφ/2) + cos(φ₁) × cos(φ₂) × sin²(Δλ/2)
c = 2 × atan2(√a, √(1−a))
d = R × c
```

Maximum error vs. WGS-84 ellipsoid: < 0.5% for typical geolocation distances.

### Accuracy Quality Classification (`GeoPosition.getAccuracyQuality`)

A static threshold ladder maps GPS accuracy (meters) to a human-readable quality string:

| Range (m) | Label      |
|-----------|------------|
| ≤ 10      | excellent  |
| 11–30     | good       |
| 31–100    | medium     |
| 101–200   | bad        |
| > 200     | very bad   |

---

## 6. Versioning

The library uses **semantic versioning** (`MAJOR.MINOR.PATCH[-prerelease]`).

| Version       | Milestone |
|---------------|-----------|
| 0.6.0-alpha   | `GeoPosition` class introduced |
| 0.9.0-alpha   | `GeocodingState` introduced |
| 0.9.1-alpha   | `ObserverSubject<T>` extracted from `GeocodingState` |
| 0.9.2-alpha   | `utils/distance` module introduced |
| 0.11.2-alpha   | `utils/async` extracted; CI/CD, pre-commit, deploy script added |
| 0.11.4        | Infrastructure and documentation improvements |
| 0.12.3-alpha  | `PositionManager` singleton + `utils/logger` introduced |
| 0.13.0-alpha  | Coordinate range validation in `calculateDistance`; `calculateAccuracyQuality()` removed |
| 0.14.0-alpha  | `ReferencePlace` — OSM point-of-interest wrapper with Portuguese descriptions |
| 0.14.1-alpha  | Dependency bump: `bessa_patterns.ts` → `v0.12.15-alpha` (`CallbackRegistry` added upstream) |
| 0.14.2-alpha  | Dependency bump: `ibira.js` → `v0.4.48` (fixes `toString()` trailing `-` on empty prerelease) |
| 0.14.3-alpha  | Docs: remove stale Known Limitations; add `ReferencePlace` to FRS |
| 0.17.0-alpha  | `ReferencePlace` — expanded `referencePlaceMap` (24 entries, `leisure` class added) |

---

## 7. Build & Test Tooling

| Tool  | Role |
|-------|------|
| TypeScript (`tsc`) | Compilation |
| Jest   | Unit and integration testing |
| npm    | Package management and scripts |
| GitHub Actions (`ci.yml`) | CI/CD — runs tests on Node.js 18.x and 20.x |
| TypeDoc | Generates HTML API reference in `docs/api/` (`npm run docs:generate`) |
| pre-commit | Automated hooks: private-key detection, EditorConfig, markdownlint |
| markdownlint | Documentation quality enforcement |

Output targets: **CJS** (`dist/src/`) and **ESM** (`dist/esm/`), with type declarations in `dist/esm/types/` and `dist/types/`. Compiled test files land in `dist/test/`. Produced by `npm run build` / `scripts/deploy.sh`.
