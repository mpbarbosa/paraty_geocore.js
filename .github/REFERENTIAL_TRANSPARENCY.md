# Referential Transparency Guide

This repository requires referentially transparent changes where practical: keep
pure logic deterministic, explicit, and free of hidden state or observable side
effects.

## Source of Truth

Use [docs/REFERENTIAL_TRANSPARENCY.md](../docs/REFERENTIAL_TRANSPARENCY.md) as
the authoritative guide. This `.github/` copy exists so workflow reviews and
Copilot-oriented guidance can discover the rule in the expected location without
duplicating the full document.

## Repository-Specific Rules

1. Keep `GeoPosition` and `ReferencePlace` getters reading only their frozen
   instance fields; they must not call `Date.now()`, `Math.random()`, or any
   I/O function.
2. Keep `calculateDistance` and other `src/utils/` helpers pure: results must
   depend only on explicit parameters with no global or singleton reads.
3. Do not mutate constructor input arguments in `GeoPosition`, `ReferencePlace`,
   or any utility function; return new values instead.
4. Confine `log`/`warn` calls, `setTimeout`, and subscriber notifications to
   named boundary methods (`update`, event handlers) rather than scattering them
   inside domain computations.
5. Pass volatile values such as time or randomness as explicit parameters when
   deterministic behaviour matters, and control them with Jest fake timers in
   tests.
6. If a module must be impure, keep that impurity narrow, clearly named, and
   isolated from reusable pure helpers.

## Review Heuristic

If a getter or pure helper's result can change because of hidden state, ambient
time, global reads, or mutation of a caller-owned object, it is not referentially
transparent and should be refactored before merging.
