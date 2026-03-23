---
name: next-roadmap-phase
description: >
  Plan and implement the next library version milestone. Reads the current
  project state from ARCHITECTURE.md, FUNCTIONAL_REQUIREMENTS.md, and
  CHANGELOG.md; proposes a scoped set of changes for the next version; and
  executes the implementation once the scope is confirmed. Use this skill when
  asked to "go ahead with the next roadmap phase", "implement the next
  version", or "what should we ship next?".
---

## Overview

This skill encodes the full workflow for advancing `paraty_geocore.js` to
its next version milestone. It follows a **propose → confirm → implement**
loop so that scope decisions are always made by the developer, not by the
agent.

The skill produces:

- Working TypeScript code changes (new features, removals, fixes)
- Matching tests
- Updated `CHANGELOG.md`, `ARCHITECTURE.md`, and `FUNCTIONAL_REQUIREMENTS.md`
- A single atomic git commit

---

## Prerequisites

- A clean working tree (`git status` shows no uncommitted changes)
- All tests pass (`npm test`)
- `ARCHITECTURE.md` versioning table and `FUNCTIONAL_REQUIREMENTS.md` are
  reasonably up to date (run `audit-and-fix` first if in doubt)

---

## Step-by-step execution

### Step 1 — Read current state

Gather context from three files:

```bash
# Current version
grep "Current version" docs/FUNCTIONAL_REQUIREMENTS.md

# Last milestone in versioning table
grep -A 2 "Version.*Milestone" docs/ARCHITECTURE.md | tail -3

# Latest CHANGELOG entry
head -40 CHANGELOG.md
```

Also inspect:

- `docs/FUNCTIONAL_REQUIREMENTS.md` §"Out of Scope" — deferred items from
  the last version are the primary candidates for the next one
- `docs/FUNCTIONAL_REQUIREMENTS.md` §"Known Limitations" in each module —
  documented bugs that have since been fixed but whose docs haven't been updated
- `src/index.ts` — any exported symbols not yet documented in FUNCTIONAL_REQUIREMENTS.md
- Open GitHub issues (if any): `gh issue list --repo <owner>/<repo>`

### Step 2 — Identify candidate changes

Using the information from Step 1, build a candidate list organised by type:

| Type | Source | Example |
|------|--------|---------|
| **Feature** | "Out of Scope" in FRS | Coordinate range validation |
| **Removal** | Deprecated APIs in source | `calculateAccuracyQuality()` |
| **Bug fix** | "Known Limitations" still present in code | `toString()` equator bug |
| **Doc gap** | Exports not in FUNCTIONAL_REQUIREMENTS | `PositionManager`, `utils/logger` |
| **Doc stale** | Limitations listed but already fixed | Removed in code but doc not updated |

### Step 3 — Propose scope and wait for confirmation

Present the proposed next version number and scope table to the developer:

```
Proposed: v0.X.0-alpha

| # | Type    | Description                          | Files affected |
|---|---------|--------------------------------------|----------------|
| 1 | Feature | ...                                  | src/..., test/...|
| 2 | Removal | ...                                  | src/..., test/...|
| 3 | Docs    | Update FUNCTIONAL_REQUIREMENTS.md    | docs/...       |
```

**Do not proceed until the developer confirms the scope.**
If the developer modifies the scope, update your internal plan before continuing.

> **Important:** Scope decisions (what version number, what to include/exclude)
> are product decisions. The skill proposes; the developer decides.

### Step 4 — Implement code changes

For each code change in the confirmed scope:

1. Edit the source file under `src/`
2. Add or update tests under `test/`
3. Run the affected tests immediately to catch regressions:

   ```bash
   npm test -- --testPathPatterns="<affected-pattern>" --no-coverage
   ```

Order of operations within a change:
- Source change first
- Tests second (TDD: write test → see fail → fix → green)
- Do not move on until the tests for the current change are green

### Step 5 — Run full test suite + type check + lint

```bash
npm test -- --no-coverage
npx tsc --noEmit
npm run lint:md
```

All three must be clean before proceeding. Fix any failures before continuing.

### Step 6 — Update documentation

Update in this order:

1. **Per-module FRS docs** (`docs/<module>-FRS.md`) — reflect API changes,
   add/remove known limitations, add acceptance criteria for new behaviour
2. **`docs/FUNCTIONAL_REQUIREMENTS.md`** — bump `Current version`, update
   Module Index, update "Out of Scope", add/remove acceptance criteria
3. **`docs/ARCHITECTURE.md`** — add new version row to the versioning table
4. **`CHANGELOG.md`** — add a new `## [X.Y.Z-alpha] — YYYY-MM-DD` section
   using [Keep a Changelog](https://keepachangelog.com/) format

Run `npm run lint:md` again after updating docs.

### Step 7 — Commit

```bash
git add -A
git commit -m "feat(<scope>): <short description> (v<VERSION>)

<bullet list of changes>

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

Commit message conventions:
- Prefix: `feat(...)` for new features, `fix(...)` for bug fixes,
  `refactor(...)` for internal changes, `docs(...)` for doc-only changes
- If the commit contains multiple types, use the dominant one
- Always include the version number in the subject line

### Step 8 — Print summary

```
✓ next-roadmap-phase complete
  Version:  v0.X.0-alpha
  Commit:   <sha>
  Changes:
    ✅ <change 1>
    ✅ <change 2>
    ...
  Tests:    <N> passed (was <N-prev>)
```

---

## What this skill does NOT do

| Out of scope | Reason |
|-------------|--------|
| Decide version number autonomously | Product decision |
| Choose what features to add | Product decision |
| Publish to npm | Separate release workflow |
| Create a GitHub PR | Run `gh pr create` manually if needed |
| Run the AI workflow pipeline | Use `audit-and-fix` for that |

---

## Decision heuristics for version number

Use these as a starting point for the proposal (developer has final say):

| Change type | Suggested bump |
|-------------|---------------|
| Breaking change (removal, API change) | `MINOR` (e.g., 0.12 → 0.13) |
| New backwards-compatible feature | `MINOR` |
| Bug fix only, no API change | `PATCH` (e.g., 0.13.0 → 0.13.1) |
| Doc-only changes | `PATCH` |

Since the project is in `alpha`, all releases carry the `-alpha` prerelease tag
until stability criteria are met.

---

## Related files

- `docs/FUNCTIONAL_REQUIREMENTS.md` — source of truth for current scope and deferred items
- `docs/ARCHITECTURE.md` — versioning history
- `CHANGELOG.md` — release notes
- `src/index.ts` — canonical list of public exports
- `.github/skills/audit-and-fix/SKILL.md` — run this first if logs are stale
- `.github/SKILLS.md` — skills index for this project
