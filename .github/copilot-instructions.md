# Copilot Instructions

This repository contains **paraty_geocore.js** — a JavaScript library providing core classes for geolocation applications.

## Status

Active development. The project has TypeScript source, Jest tests, CI/CD (GitHub Actions), pre-commit hooks, and markdownlint tooling in place.

## Architecture

- **Source:** `src/core/` (GeoPosition, errors) and `src/utils/` (distance, async)
- **Tests:** `test/` — unit and integration tests via Jest + ts-jest
- **Build:** TypeScript → ESM (`dist/`)
- **CI/CD:** `.github/workflows/ci.yml` (Node.js 18.x, 20.x matrix)
- **Quality:** `.pre-commit-config.yaml` (pre-commit hooks), `.markdownlint.json` (docs linting)
- **Docs:** `docs/` — API reference, architecture, functional requirements

## Intended Purpose

- TypeScript-authored, ESM-distributed geolocation utility library
- Intended to be consumed as a library by geolocation applications
- Licensed under MIT

## Key Files

- `src/core/GeoPosition.ts` — immutable position wrapper (main export)
- `src/core/errors.ts` — `GeoPositionError` custom error class
- `src/utils/distance.ts` — Haversine distance calculation
- `src/utils/async.ts` — `delay()` async utility
- `docs/API.md` — full API reference
- `CONTRIBUTING.md` — setup, standards, and submission process
