# GitHub Skills

**Package:** `paraty_geocore.js`
**Language:** TypeScript → JavaScript (ESM)
**License:** MIT

> **See also:** [API Reference](../docs/API.md) | [Architecture](../docs/ARCHITECTURE.md) | [Getting Started](../docs/GETTING_STARTED.md)

---

## Overview

GitHub Skills are reusable GitHub Actions workflows that automate recurring
engineering tasks for this repository. Each skill is a self-contained
`.yml` file under `.github/workflows/` and is designed to be idempotent —
running it multiple times with the same inputs always converges to the same
repository state.

---

## Skills Index

| Skill | File | Trigger | Purpose |
|-------|------|---------|---------|
| [CI](#ci) | `ci.yml` | push / PR to `main` | Test, lint, build, benchmark |
| [Update ibira.js](#update-ibirayml) | `update-ibira.yml` | Weekly (Mon) / manual | Bump ibira.js CDN tarball URL |
| [Update bessa_patterns.ts](#update-bessayml) | `update-bessa.yml` | Weekly (Tue) / manual | Bump bessa_patterns.ts CDN tarball URL |
| [Validate logs](#validate-logs) | _(Copilot skill)_ | Manual | Validate `.ai_workflow/logs` against codebase; write `plan.md` |
| [Fix log issues](#fix-log-issues) | _(Copilot skill)_ | Manual (after validate-logs) | Consume `plan.md`, apply fixes, update roadmap |
| [Audit and fix](#audit-and-fix) | _(Copilot skill)_ | Manual | Run validate-logs then fix-log-issues in one pass |
| [Purge workflow logs](#purge-workflow-logs) | _(Copilot skill)_ | Manual | Delete `.ai_workflow/logs/`, `backlog/`, and `summaries/` |
| [Next roadmap phase](#next-roadmap-phase) | _(Copilot skill)_ | Manual | Propose and implement the next library version milestone |

---

## CI

**File:** `.github/workflows/ci.yml`
**Trigger:** push or pull request to `main`

The primary quality gate. Runs in parallel across a Node.js version matrix
and is required to pass before any changes are merged.

### Jobs

| Job | Node matrix | Runs after | Purpose |
|-----|-------------|------------|---------|
| `test-split` | 20.x | — | Per-group fast feedback (core / utils / integration) |
| `test` | 18.x, 20.x | — | Full lint + build + smoke test + coverage |
| `benchmark` | 20.x | `test` | Performance benchmarks (Jest) |
| `flaky-detection` | 20.x | `test` | Runs the suite 3× with `--randomize --forceExit` |

### Steps — `test` job (Node 20.x)

| # | Step | Notes |
|---|------|-------|
| 1 | Checkout repository | `actions/checkout@v4` |
| 2 | Set up Node.js | Matrix version; npm cache enabled |
| 3 | Install dependencies | `npm ci` |
| 4 | Audit dependencies | `npm audit --audit-level=moderate` (20.x only) |
| 5 | Type-check | `tsc --noEmit` |
| 6 | Build dist (CJS + ESM) | `npm run build && npm run build:esm` (20.x only) |
| 7 | Smoke test | `npm run test:smoke` against freshly built `dist/` (20.x only) |
| 8 | Lint TypeScript | `npm run lint` (20.x only) |
| 9 | Lint Markdown | `npm run lint:md` (20.x only) |
| 10 | Run tests with coverage | `npm run test:coverage` |
| 11 | Upload coverage report | `actions/upload-artifact@v4`, retained 14 days (20.x only) |

### Permissions

| Scope | Level |
|-------|-------|
| `contents` | read (default) |

---

## update-ibira.yml

**File:** `.github/workflows/update-ibira.yml`
**Purpose:** Keep the `ibira.js` dependency current by updating its GitHub
tarball CDN URL in `package.json`, adjusting all related source, documentation,
and test files, then opening a pull request with the full set of changes.

### Triggers

| Event | Details |
|-------|---------|
| `schedule` | Every **Monday at 09:00 UTC** — fetches the latest `ibira.js` release |
| `workflow_dispatch` | Manual run; accepts an optional `version` input (e.g. `v0.4.5-alpha`) |

### Inputs (workflow_dispatch only)

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `version` | No | _(latest)_ | Exact release tag to target, e.g. `v0.4.5-alpha`. Omit to use the latest published GitHub release. |

### Permissions

| Scope | Level | Reason |
|-------|-------|--------|
| `contents` | write | Push the update branch |
| `pull-requests` | write | Open / update the PR |

### Concurrency

```yaml
concurrency:
  group: update-ibira-js
  cancel-in-progress: false
```

Runs are serialised under the `update-ibira-js` group. A second trigger
queues rather than cancels, so no scheduled run is silently dropped.

### Steps

| # | Step | Skipped if up to date |
|---|------|-----------------------|
| 1 | Checkout repository | — |
| 2 | Set up Node.js 20 | — |
| 3 | Resolve target ibira.js version | — |
| 4 | Check current ibira.js version in `package.json` | — |
| 5 | Update `ibira.js` entry in `package.json` | ✅ |
| 6 | `npm ci` + targeted `npm install ibira.js@<url>` | ✅ |
| 7 | Validate TypeScript (`tsc --noEmit`) | ✅ |
| 8 | Run unit & integration tests | ✅ |
| 9 | Adjust ibira.js related code | ✅ |
| 10 | Update ibira.js related documentation | ✅ |
| 11 | Adjust ibira.js related tests | ✅ |
| 12 | Create pull request | ✅ |

Steps 5–12 are gated by an `up_to_date` check (step 4) and are skipped
entirely when `package.json` already contains the target tarball URL.

### Step detail — Adjust code (step 9)

Scans `src/**/*.ts` for `ibira.js` imports. For every file found, replaces
hardcoded old version strings with the new tag using `sed`. Re-runs
`npm run validate` after edits to confirm no TypeScript type errors were
introduced by the new ibira.js API surface.

### Step detail — Update documentation (step 10)

Finds all `*.md` files (excluding `node_modules/` and `.ai_workflow/`).
For each file that mentions `ibira.js`:

1. Replaces the full old tarball URL with the new one.
2. Replaces any remaining bare old version strings on `ibira`-mentioning lines
   only after confirming the token is still present (avoids double-processing).

### Step detail — Adjust tests (step 11)

Scans `test/` and `__tests__/` for ibira.js imports or mocks. Applies the
same version-string replacement as step 9, then re-runs only the affected
test files with `npx jest --passWithNoTests` to confirm they pass against
the new package version.

### Tarball URL pattern

```text
https://github.com/mpbarbosa/ibira.js/archive/refs/tags/<TAG>.tar.gz
```

### Pull request

The skill opens (or updates) a PR on branch
`chore/update-ibira-js-<version>`. The PR body includes the old and new
URLs, and a checklist confirming every automated step passed.

### Idempotency guarantees

| Concern | Mitigation |
|---------|-----------|
| Running twice for the same version | Step 4 hard-exits; `peter-evans/create-pull-request` updates the existing PR |
| Concurrent schedule + manual trigger | `concurrency` group serialises runs |
| Transitive dep drift | `npm ci` first preserves the lock file; only the target dep's entry is regenerated |
| `sed` double-replacement in docs | URL pass runs before version pass; second pass is guarded by a `grep` pre-check |

---

## update-bessa.yml

**File:** `.github/workflows/update-bessa.yml`
**Purpose:** Keep the `bessa_patterns.ts` dependency current by updating its
GitHub tarball CDN URL in `package.json`, adjusting all related source,
documentation, and test files, then opening a pull request with the full set
of changes.

### Triggers

| Event | Details |
|-------|---------|
| `schedule` | Every **Tuesday at 09:00 UTC** — offset one day from `update-ibira` to avoid simultaneous PR noise |
| `workflow_dispatch` | Manual run; accepts an optional `version` input (e.g. `v0.13.0-alpha`) |

### Inputs (workflow_dispatch only)

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `version` | No | _(latest)_ | Exact release tag to target, e.g. `v0.13.0-alpha`. Omit to use the latest published GitHub release. |

### Permissions

| Scope | Level | Reason |
|-------|-------|--------|
| `contents` | write | Push the update branch |
| `pull-requests` | write | Open / update the PR |

### Concurrency

```yaml
concurrency:
  group: update-bessa-patterns
  cancel-in-progress: false
```

Runs are serialised under the `update-bessa-patterns` group. A second
trigger queues rather than cancels, so no scheduled run is silently dropped.

### Steps

| # | Step | Skipped if up to date |
|---|------|-----------------------|
| 1 | Checkout repository | — |
| 2 | Set up Node.js 20 | — |
| 3 | Resolve target bessa_patterns.ts version | — |
| 4 | Check current bessa_patterns.ts version in `package.json` | — |
| 5 | Update `bessa_patterns.ts` entry in `package.json` | ✅ |
| 6 | `npm ci` + targeted `npm install bessa_patterns.ts@<url>` | ✅ |
| 7 | Validate TypeScript (`tsc --noEmit`) | ✅ |
| 8 | Run unit & integration tests | ✅ |
| 9 | Adjust bessa_patterns.ts related code | ✅ |
| 10 | Update bessa_patterns.ts related documentation | ✅ |
| 11 | Adjust bessa_patterns.ts related tests | ✅ |
| 12 | Create pull request | ✅ |

Steps 5–12 are gated by an `up_to_date` check (step 4) and are skipped
entirely when `package.json` already contains the target tarball URL.

### Step detail — Adjust code (step 9)

Scans `src/**/*.ts` for `bessa_patterns` imports. For every file found,
replaces hardcoded old version strings with the new tag using `sed`. Re-runs
`npm run validate` after edits to confirm no TypeScript type errors were
introduced by the new bessa_patterns.ts API surface.

### Step detail — Update documentation (step 10)

Finds all `*.md` files (excluding `node_modules/` and `.ai_workflow/`).
For each file that mentions `bessa_patterns`:

1. Replaces the full old tarball URL with the new one.
2. Replaces any remaining bare old version strings on `bessa`-mentioning lines
   only after confirming the token is still present (avoids double-processing).

### Step detail — Adjust tests (step 11)

Scans `test/` and `__tests__/` for bessa_patterns.ts imports or mocks.
Applies the same version-string replacement as step 9, then re-runs only
the affected test files with `npx jest --passWithNoTests` to confirm they
pass against the new package version.

### Tarball URL pattern

```text
https://github.com/mpbarbosa/bessa_patterns.ts/archive/refs/tags/<TAG>.tar.gz
```

### Pull request

The skill opens (or updates) a PR on branch
`chore/update-bessa-patterns-<version>`. The PR body includes the old and
new URLs, and a checklist confirming every automated step passed.

### Idempotency guarantees

| Concern | Mitigation |
|---------|-----------|
| Running twice for the same version | Step 4 hard-exits; `peter-evans/create-pull-request` updates the existing PR |
| Concurrent schedule + manual trigger | `concurrency` group serialises runs |
| Transitive dep drift | `npm ci` first preserves the lock file; only the target dep's entry is regenerated |
| `sed` double-replacement in docs | URL pass runs before version pass; second pass is guarded by a `grep` pre-check |

---

## validate-logs

**File:** `.github/skills/validate-logs/SKILL.md`
**Trigger:** Manual (Copilot CLI skill)

Reads every workflow run directory under `.ai_workflow/logs/`, cross-checks
the AI-identified issues against the live codebase, and writes a structured
`.ai_workflow/plan.md` listing every confirmed **medium/low severity** item.
The `plan.md` is the handoff artifact consumed by `fix-log-issues`.

### When to use

- After a workflow run has been reviewed and you want to archive its findings
  before purging the logs.
- When auditing past runs for overlooked minor improvements.

### What it does

1. Collects flagged entries from `steps/*.log` and `## Response` blocks from
   `prompts/**/*.md`.
2. Verifies each issue still exists in the current codebase (lint, tsc,
   directory checks, etc.).
3. Writes confirmed medium/low issues to `.ai_workflow/plan.md` with status
   `open`, ready for `fix-log-issues`.

Critical/High severity items are out of scope and are not written to `plan.md`.

---

## fix-log-issues

**File:** `.github/skills/fix-log-issues/SKILL.md`
**Trigger:** Manual (Copilot CLI skill — run after `validate-logs`)

Reads `.ai_workflow/plan.md` produced by `validate-logs` and applies the fix
for each `open` issue. After every fix is verified, updates the issue status
in `plan.md` and inserts the resolved items into the project roadmap in
`docs/FUNCTIONAL_REQUIREMENTS.md`.

### When to use

- Immediately after `validate-logs` has written `plan.md`.
- When you want to batch-apply all confirmed minor fixes in one pass.

### What it does

1. Reads each `open` issue from `.ai_workflow/plan.md`.
2. Applies the fix described in the `Fix` field (see the fix catalogue in the
   skill file for type-specific procedures).
3. Verifies the fix (lint, tsc, tests as appropriate).
4. Marks the issue `done` (or `skipped` with a reason) in `plan.md`.
5. Commits each fix atomically.
6. Appends all resolved issues to `docs/FUNCTIONAL_REQUIREMENTS.md` under
   `## Roadmap — Minor Issues` and commits the roadmap update.

---

## audit-and-fix

**File:** `.github/skills/audit-and-fix/SKILL.md`
**Trigger:** Manual (Copilot CLI skill)

Orchestrates the full log-remediation pipeline in a single pass by running
`validate-logs` then `fix-log-issues` back-to-back. Use this instead of
invoking the two skills separately when you want an uninterrupted end-to-end
run with no manual handoff.

### When to use

- Any time you want to audit the workflow logs and apply all fixes in one go.
- Prefer the individual skills (`validate-logs` / `fix-log-issues`) when you
  need to inspect or edit `plan.md` between the two phases.

### What it does

1. **Phase 1** — runs `validate-logs`: scans `.ai_workflow/logs/`, verifies
   issues against the live codebase, and writes `.ai_workflow/plan.md`.
2. Aborts early (success) if `plan.md` contains zero issues.
3. **Phase 2** — runs `fix-log-issues`: processes every `open` issue in
   `plan.md`, applies and verifies each fix, then updates
   `docs/FUNCTIONAL_REQUIREMENTS.md` with the results.

If interrupted mid-run, resume with `fix-log-issues` alone — `plan.md`
preserves the status of every issue so no work is lost.

---

## Running a Skill Manually

1. Go to the repository on GitHub → **Actions** tab.
2. Select the skill from the left-hand workflow list.
3. Click **Run workflow**.
4. Optionally fill in the `version` input (leave blank for latest).
5. Click **Run workflow** to confirm.

The skill will open a pull request (or update an existing one) on a
dedicated branch. Review and merge the PR to apply the changes to `main`.

---

## purge-workflow-logs

**File:** `.github/skills/purge-workflow-logs/SKILL.md`
**Trigger:** Manual (Copilot CLI skill)

Deletes the three transient output directories that accumulate under
`.ai_workflow/` after workflow runs: `logs/`, `backlog/`, and `summaries/`.
All three are gitignored, so no commit is produced. The skill is idempotent —
it is safe to run even when the directories are already absent.

### When to use

- After `audit-and-fix` (or `validate-logs` + `fix-log-issues`) has been
  run and the logs are no longer needed.
- Before starting a fresh workflow run to ensure no stale data from previous
  runs is picked up.
- Any time you are asked to clean up, remove, or purge workflow logs,
  backlogs, or summaries.

### What it deletes

| Path | Description |
|------|-------------|
| `.ai_workflow/logs/` | Per-run execution transcripts and AI prompt/response logs |
| `.ai_workflow/backlog/` | Pending step-definition files from previous runs |
| `.ai_workflow/summaries/` | Executive summary reports per run |

### What it preserves

All other `.ai_workflow/` contents are left untouched: `context/`,
`metrics/`, `ml_models/`, `archive/`, `checkpoints/`, `commit_history.json`,
`plan.md`, and `.ai_cache/`.

### Idempotency

Running the skill multiple times is always safe. Absent directories are
silently skipped.

---

## next-roadmap-phase

**File:** `.github/skills/next-roadmap-phase/SKILL.md`
**Trigger:** Manual (Copilot CLI)

Propose and implement the next library version milestone. Reads current state
from `ARCHITECTURE.md`, `FUNCTIONAL_REQUIREMENTS.md`, and `CHANGELOG.md`;
surfaces deferred items, undocumented exports, and stale known-limitations;
proposes a scoped version bump; and — after developer confirmation — implements
the changes, updates all documentation, and commits.

### Trigger phrases

- "Go ahead with the next roadmap phase"
- "Implement the next version"
- "What should we ship next?"

### What it produces

- TypeScript source changes + matching tests
- Updated `CHANGELOG.md`, `ARCHITECTURE.md`, `FUNCTIONAL_REQUIREMENTS.md`
- Updated per-module FRS docs
- Single atomic git commit

### Requires confirmation

Scope is always proposed before implementation. The developer must confirm
(or modify) the version number and change list before any code is written.

---

## Adding a New Skill

1. Create `.github/workflows/<skill-name>.yml`.
2. Add a `concurrency` group to prevent race conditions.
3. Include an early-exit idempotency check before any write operations.
4. Use `npm ci` for deterministic installs; only run `npm install` when
   you explicitly need to update the lock file for a new dependency.
5. Document the skill in this file under a new `##` section.
