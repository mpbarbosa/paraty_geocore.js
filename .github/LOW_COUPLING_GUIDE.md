# Low Coupling Guide

This repository requires low-coupling changes: keep dependencies explicit,
stable, and flowing in the correct direction through clear layer boundaries.

## Source of Truth

Use [docs/LOW_COUPLING_GUIDE.md](../docs/LOW_COUPLING_GUIDE.md) as the
authoritative guide. This `.github/` copy exists so workflow reviews and
Copilot-oriented guidance can discover the rule in the expected location without
duplicating the full document.

## Repository-Specific Rules

1. Do not let `src/utils/` import from `src/core/`; utility helpers must remain
   domain-free and dependency-free from the layer above them.
2. Do not let `src/core/` files import from `src/index.ts`; the entry point
   depends on the domain, not the other way around.
3. Keep pure utility functions (`calculateDistance`, `delay`) accepting plain
   primitive inputs rather than domain objects to avoid importing domain classes.
4. Do not introduce import cycles between `src/core/` files; if two domain
   modules need each other, extract the shared concept into a third module.
5. Centralise shared constants and thresholds instead of hardcoding the same
   values in multiple files.
6. Cross-link related documentation instead of copying the same guidance across
   many places.

## Review Heuristic

If a file in `src/utils/` imports from `src/core/`, or a file in `src/core/`
imports from `src/index.ts`, the dependency direction is inverted and must be
fixed before merging.
