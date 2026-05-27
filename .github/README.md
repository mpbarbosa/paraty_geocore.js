# `.github/` — GitHub Automation & Project Conventions

This directory contains GitHub-specific configuration, automation workflows,
and project-wide conventions for `paraty_geocore.js`.

---

## `workflows/`

GitHub Actions CI/CD pipelines.

### `ci.yml`

The primary continuous integration workflow. Runs on Node.js 18.x and 20.x in
parallel to validate the full project lifecycle:

| Step | Command | Description |
|------|---------|-------------|
| Test + coverage | `npm test` | Jest unit and integration tests with coverage |
| Type-check | `npx tsc --noEmit` | TypeScript type validation without compilation |
| Build | `npm run build` | Compile to `dist/` (CJS + ESM) |

### `update-ibira.yml`

Automated dependency-update workflow for `ibira.js`. Triggers weekly (Monday)
or via `workflow_dispatch`. Bumps the CDN tarball URL and opens a pull request.

### `update-bessa.yml`

Automated dependency-update workflow for `bessa_patterns.ts`. Triggers weekly
(Tuesday) or via `workflow_dispatch`. Bumps the CDN tarball URL and opens a
pull request.

---

## `skills/`

Reusable Copilot skill instruction sets for recurring engineering tasks. See
[SKILLS.md](./SKILLS.md) for the full index.

| Skill | Purpose |
|-------|---------|
| `audit-and-fix/` | Orchestrates validate-logs → fix-log-issues in one pass |
| `fix-log-issues/` | Consumes `plan.md` and applies every confirmed fix |
| `next-roadmap-phase/` | Proposes and implements the next library version milestone |
| `purge-workflow-logs/` | Deletes transient artefacts under `.ai_workflow/` |
| `validate-logs/` | Validates `.ai_workflow/logs` against the codebase; writes `plan.md` |

---

## Design Guide Stubs

Short Copilot-facing pointers to the authoritative design guides in `docs/`.
Each stub lists repository-specific rules and a single review heuristic.

| File | Authoritative guide | Rule summary |
|------|--------------------|-|
| `CLEAN_ARCHITECTURE_GUIDE.md` | [docs/CLEAN_ARCHITECTURE_GUIDE.md](../docs/CLEAN_ARCHITECTURE_GUIDE.md) | Layer rules: `src/utils/` ← `src/core/` ← `src/index.ts` |
| `HIGH_COHESION_GUIDE.md` | [docs/HIGH_COHESION_GUIDE.md](../docs/HIGH_COHESION_GUIDE.md) | One domain concept per `src/core/` file; one concern per `src/utils/` file |
| `LOW_COUPLING_GUIDE.md` | [docs/LOW_COUPLING_GUIDE.md](../docs/LOW_COUPLING_GUIDE.md) | `src/utils/` must not import from `src/core/`; no import cycles |
| `REFERENTIAL_TRANSPARENCY.md` | [docs/REFERENTIAL_TRANSPARENCY.md](../docs/REFERENTIAL_TRANSPARENCY.md) | Getters read frozen fields only; effects at named boundary methods |
| `LIGHTWEIGHT_DDD_GUIDE.md` | [docs/LIGHTWEIGHT_DDD_GUIDE.md](../docs/LIGHTWEIGHT_DDD_GUIDE.md) | Ubiquitous language; translate browser/OSM types at boundaries |
| `CODE_QUALITY_CONTROL_GUIDE.md` | [docs/CODE_QUALITY_CONTROL_GUIDE.md](../docs/CODE_QUALITY_CONTROL_GUIDE.md) | Validation gate: `npm test`, `npx tsc --noEmit`, `npm run lint:md` |
| `UNIT_TEST_GUIDE.md` | [docs/UNIT_TEST_GUIDE.md](../docs/UNIT_TEST_GUIDE.md) | Jest patterns; no live browser; reset singleton; assert freeze |

---

## Other files

| File | Purpose |
|------|---------|
| `copilot-instructions.md` | Coding guidelines injected into Copilot sessions for this repository |
| `dependabot.yml` | Automated dependency update configuration |
| `SKILLS.md` | Index of all `.github/skills/` entries with purpose summaries |

---

## Related documentation

- [docs/CONTRIBUTING.md](../docs/CONTRIBUTING.md) — contribution guidelines,
  branching conventions, and commit message format
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — system architecture and
  versioning history
- [docs/API.md](../docs/API.md) — full public API reference
- [docs/FUNCTIONAL_REQUIREMENTS.md](../docs/FUNCTIONAL_REQUIREMENTS.md) —
  functional requirements and roadmap
