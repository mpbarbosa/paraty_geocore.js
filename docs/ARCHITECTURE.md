# Architecture

**Package:** `paraty_geocore.js`
**Language:** TypeScript → JavaScript (ESM)
**License:** MIT

---

## 1. Purpose

`paraty_geocore.js` is a lightweight, dependency-free core library for geolocation applications. It provides:

- An immutable, normalised wrapper around the browser Geolocation API (`GeoPosition`)
- Pure utility functions for geographic distance calculation (`utils/distance`)
- General-purpose async helpers for polling/throttling patterns (`utils/async`)

The library is designed to be consumed by higher-level geolocation applications, not used directly by end users.

---

## 2. Directory Structure

```text
paraty_geocore.js/
├── src/
│   ├── core/
│   │   ├── GeoPosition.ts       # Immutable position wrapper class
│   │   ├── ObserverSubject.ts   # Generic concrete Observer/Subject base class
│   │   ├── GeocodingState.ts    # Geocoding state manager (extends ObserverSubject)
│   │   └── errors.ts            # Custom error classes (GeoPositionError)
│   └── utils/
│       ├── distance.ts          # Haversine distance calculation utilities
│       └── async.ts             # General-purpose async utilities (delay)
├── .github/
│   └── workflows/
│       └── ci.yml               # CI/CD pipeline (Node.js 18.x, 20.x matrix)
├── docs/
│   ├── API.md                   # Full API reference
│   ├── ARCHITECTURE.md          # This file
│   ├── GEOCODING_STATE_API.md   # GeocodingState API reference
│   ├── OBSERVER_SUBJECT_API.md  # ObserverSubject API reference
│   ├── GETTING_STARTED.md       # Installation and usage guide
│   ├── GeoPosition-FRS.md       # Functional requirements spec — GeoPosition
│   ├── distance-FRS.md          # Functional requirements spec — distance utils
│   ├── async-FRS.md             # Functional requirements spec — async utils
│   └── GEOPOSITION_REFACTORING_SUMMARY.md
├── test/
│   ├── core/                    # Unit tests for src/core/ (GeoPosition, ObserverSubject, GeocodingState, errors)
│   ├── utils/                   # Unit tests for src/utils/ (distance, async)
│   ├── integration/             # Integration tests — browser Geolocation API simulation
│   ├── benchmarks/              # Performance benchmarks (excluded from coverage)
│   ├── helpers/                 # Shared test fixtures and constants (TEST_TIMESTAMP, etc.)
│   └── index.test.ts            # Smoke tests for the public re-export surface
├── scripts/
│   └── deploy.sh                # Build, tag, push, and generate CDN URLs
├── .markdownlint.json           # Markdownlint configuration
├── .pre-commit-config.yaml      # Pre-commit hook configuration
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

## 3. Module Dependency Graph

```text
ObserverSubject<T>
  └── GeocodingState  ──imports──►  GeoPosition

GeoPosition  ──imports──►  utils/distance  (calculateDistance)
                                │
                                └──► (no further dependencies)

(utils/async is independent — no imports from core or other utils)
```

Both modules have **zero external runtime dependencies**.

---

## 4. Design Principles

### 4.1 Immutability

`GeoPosition` instances are frozen with `Object.freeze()` immediately after construction. No property can be set or mutated after the object is created. This makes instances safe to share across asynchronous callbacks without defensive copying by the caller.

### 4.2 Referential Transparency

All functions in `utils/distance` and all methods on `GeoPosition` (except `calculateAccuracyQuality`, which is deprecated due to a bug) are **pure**:
- Deterministic: same inputs always produce the same output.
- No side effects: no logging, no mutation of external state, no I/O.

### 4.3 Defensive Copying

The `GeoPosition` constructor explicitly extracts each property from `position.coords` by name rather than using the spread operator (`{ ...coords }`). This is necessary because the browser's `GeolocationCoordinates` object exposes its properties through non-enumerable getters, which spread silently ignores.

### 4.4 No Global State

Neither module uses module-level mutable state, singletons, or global variables.

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
| 0.9.10-alpha   | `utils/async` extracted; CI/CD, pre-commit, deploy script added |

---

## 7. Build & Test Tooling

| Tool  | Role |
|-------|------|
| TypeScript (`tsc`) | Compilation |
| Jest   | Unit and integration testing |
| npm    | Package management and scripts |
| GitHub Actions (`ci.yml`) | CI/CD — runs tests on Node.js 18.x and 20.x |
| pre-commit | Automated hooks: private-key detection, EditorConfig, markdownlint |
| markdownlint | Documentation quality enforcement |

Output targets: **CJS** (`dist/src/`) and **ESM** (`dist/esm/`), with type declarations (`.d.ts`). Produced by `npm run build` / `scripts/deploy.sh`.
