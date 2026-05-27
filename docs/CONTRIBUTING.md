# Contributing to paraty_geocore.js

Thank you for your interest in improving `paraty_geocore.js`. This guide covers
everything you need to make a clean, reviewable contribution.

---

## Prerequisites

- **Node.js** 18.x or 20.x (matching the CI matrix in `.github/workflows/ci.yml`)
- **npm** ≥ 9
- **pre-commit** — install with `pip install pre-commit && pre-commit install`

Verify the setup:

```bash
npm install
npm test         # all tests should pass
npx tsc --noEmit # type check should be clean
npm run lint:md  # markdown linting should be clean
```

---

## Branching

- Base all branches on `main`.
- Name branches with a prefix that reflects the change type:

| Prefix | When to use |
|--------|-------------|
| `feat/` | New feature or capability |
| `fix/` | Bug fix |
| `docs/` | Documentation-only change |
| `refactor/` | Internal restructuring with no behaviour change |
| `chore/` | Tooling, dependencies, CI |

Examples: `feat/add-altitude-to-geoposition`, `fix/reference-place-null-class`,
`docs/update-architecture-guide`.

---

## Making Changes

### Source files

All source lives under `src/`:

- `src/core/` — domain classes and re-exports (`GeoPosition`, `ReferencePlace`,
  `GeocodingState`, `PositionManager`, `ObserverSubject`, `errors`).
- `src/utils/` — pure or near-pure helpers (`calculateDistance`, `delay`,
  `log`/`warn`).
- `src/index.ts` — public re-export surface (re-exports only, no logic).

When adding a new file, decide its layer first. See
[CLEAN_ARCHITECTURE_GUIDE.md](./CLEAN_ARCHITECTURE_GUIDE.md) for layer rules and
[LIGHTWEIGHT_DDD_GUIDE.md](./LIGHTWEIGHT_DDD_GUIDE.md) for naming conventions.

### Tests

Every source change that affects public behaviour must include a matching test.

- Unit tests live in `test/core/` or `test/utils/`, named `<Module>.test.ts`.
- Integration tests live in `test/integration/`.
- Shared fixtures live in `test/helpers/fixtures.ts`.
- See [UNIT_TEST_GUIDE.md](./UNIT_TEST_GUIDE.md) for patterns and quality gates.

### Documentation

Documentation must be kept in sync with code:

| What changed | What to update |
|--------------|----------------|
| Public API surface | `docs/<Module>-FRS.md` acceptance criteria |
| Module index or scope | `docs/FUNCTIONAL_REQUIREMENTS.md` |
| Architecture or versioning | `docs/ARCHITECTURE.md` |
| Any user-visible change | `CHANGELOG.md` |

Changelog entries follow [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [X.Y.Z-alpha] — YYYY-MM-DD

### Added
- `MyClass.newMethod()` — brief description (#PR or context)

### Changed
- `GeoPosition.toString()` now includes altitude when non-null

### Removed
- `deprecatedHelper()` — replaced by `newHelper()`
```

---

## Validation

Run all three checks before opening a PR. All must be clean:

```bash
npm test              # Jest unit + integration tests
npx tsc --noEmit      # TypeScript type check
npm run lint:md       # markdownlint for all docs
```

For a faster development loop:

```bash
# Run only the tests related to your change
npm test -- --testPathPattern="GeoPosition" --no-coverage
```

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <short description> (v<VERSION if applicable>)

<body — optional, bullet list of changes>
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`.

Scopes are optional but useful: `GeoPosition`, `ReferencePlace`, `PositionManager`,
`distance`, `async`, `logger`, `docs`, `ci`.

Examples:

```text
feat(ReferencePlace): add leisure/sports_centre mapping (v0.16.0-alpha)
fix(GeoPosition): handle null speed field without throwing
docs(ARCHITECTURE): add v0.16.0-alpha row to versioning table
```

---

## Pull Requests

1. **Title** — follow the commit message convention.
2. **Description** — explain what changed and why. Reference related issues or
   roadmap items.
3. **Checklist** — confirm all validation commands pass.
4. **Scope** — keep PRs focused on one concern. Split unrelated changes into
   separate PRs.

---

## Design Guides

Before making architectural decisions, review the relevant guide:

| Guide | When to read |
|-------|-------------|
| [CLEAN_ARCHITECTURE_GUIDE.md](./CLEAN_ARCHITECTURE_GUIDE.md) | Adding a new file or moving logic between layers |
| [LIGHTWEIGHT_DDD_GUIDE.md](./LIGHTWEIGHT_DDD_GUIDE.md) | Naming a new type, constant, or module |
| [HIGH_COHESION_GUIDE.md](./HIGH_COHESION_GUIDE.md) | A file is growing hard to describe in one sentence |
| [LOW_COUPLING_GUIDE.md](./LOW_COUPLING_GUIDE.md) | A module is acquiring many imports |
| [REFERENTIAL_TRANSPARENCY.md](./REFERENTIAL_TRANSPARENCY.md) | A function is acquiring side effects |
| [UNIT_TEST_GUIDE.md](./UNIT_TEST_GUIDE.md) | Writing or reviewing tests |
| [CODE_QUALITY_CONTROL_GUIDE.md](./CODE_QUALITY_CONTROL_GUIDE.md) | Pre-PR self-review |

---

## Questions

Open an issue or start a discussion in the repository. When reporting a bug,
include the `paraty_geocore.js` version, the input that triggered the problem,
and the expected vs. actual behaviour.
