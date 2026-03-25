## SKILL

---
name: update-bessa
description: >
  Update the bessa_patterns.ts dependency in paraty_geocore.js to the latest
  (or a specified) release. Use this skill when asked to bump, upgrade, or
  refresh bessa_patterns.ts, or when the update-bessa GitHub Actions workflow
  needs to be triggered, debugged, or explained.
---

## Overview

`bessa_patterns.ts` is consumed by this project via its GitHub tarball CDN URL
stored in `package.json`. A dedicated GitHub Actions workflow handles the
update process end-to-end.

## Workflow location

```text
.github/workflows/update-bessa.yml
```

## What the workflow does

1. **Resolve version** — queries the GitHub API for the latest
   bessa_patterns.ts release tag (or uses the `version` input if provided via
   `workflow_dispatch`).
2. **Early-exit guard** — compares the resolved tag against the tarball URL
   already in `package.json`; skips the rest if already up to date.
3. **Update `package.json`** — replaces the old tarball URL with the new one.
4. **Install dependencies** — runs `npm ci` then a targeted
   `npm install "bessa_patterns@<url>"` to keep the lockfile deterministic.
5. **Validate TypeScript** — runs `npx tsc --noEmit` to catch type errors
   introduced by the new version.
6. **Run tests** — runs the full Jest suite to confirm nothing regressed.
7. **Adjust related code** — `sed`-replaces old version strings in `src/`.
8. **Update documentation** — replaces old tarball URLs and version strings in
   all `*.md` files (single-pass, guarded by pre-check grep).
9. **Adjust related tests** — replaces old version strings in `test/` and
   `__tests__/`, then re-runs only the affected test files.
10. **Open pull request** — uses `peter-evans/create-pull-request@v7` to open
    (or update) a PR on branch `chore/update-bessa-patterns-<version>`.

## How to trigger manually

```shell
gh workflow run update-bessa.yml --field version=v0.13.0-alpha
```

Leave `version` blank to use the latest published release.

## Idempotency guarantees

- A `concurrency` group (`update-bessa-patterns`) prevents simultaneous runs
  from racing on the same PR branch.
- The early-exit guard in step 3 ensures no changes are committed if the
  dependency is already at the target version.
- `peter-evans/create-pull-request` updates an existing PR rather than opening
  a duplicate.

## Tarball URL pattern

```text
https://github.com/mpbarbosa/bessa_patterns.ts/archive/refs/tags/<TAG>.tar.gz
```

## Related files

- `.github/workflows/update-bessa.yml` — the full workflow definition
- `.github/SKILLS.md` — skills and workflows index for this project
- `docs/API.md` — paraty_geocore.js API reference


---

## SKILL

---
name: update-ibira
description: >
  Update the ibira.js dependency in paraty_geocore.js to the latest (or a
  specified) release. Use this skill when asked to bump, upgrade, or refresh
  ibira.js, or when the update-ibira GitHub Actions workflow needs to be
  triggered, debugged, or explained.
---

## Overview

`ibira.js` is consumed by this project via its GitHub tarball CDN URL stored in
`package.json`. A dedicated GitHub Actions workflow handles the update process
end-to-end.

## Workflow location

```text
.github/workflows/update-ibira.yml
```

## What the workflow does

1. **Resolve version** — queries the GitHub API for the latest ibira.js release
   tag (or uses the `version` input if provided via `workflow_dispatch`).
2. **Early-exit guard** — compares the resolved tag against the tarball URL
   already in `package.json`; skips the rest if already up to date.
3. **Update `package.json`** — replaces the old tarball URL with the new one.
4. **Install dependencies** — runs `npm ci` then a targeted
   `npm install "ibira@<url>"` to keep the lockfile deterministic.
5. **Validate TypeScript** — runs `npx tsc --noEmit` to catch type errors
   introduced by the new version.
6. **Run tests** — runs the full Jest suite to confirm nothing regressed.
7. **Adjust related code** — `sed`-replaces old version strings in `src/`.
8. **Update documentation** — replaces old tarball URLs and version strings in
   all `*.md` files (single-pass, guarded by pre-check grep).
9. **Adjust related tests** — replaces old version strings in `test/` and
   `__tests__/`, then re-runs only the affected test files.
10. **Open pull request** — uses `peter-evans/create-pull-request@v7` to open
    (or update) a PR on branch `chore/update-ibira-js-<version>`.

## How to trigger manually

```shell
gh workflow run update-ibira.yml --field version=v0.4.5-alpha
```

Leave `version` blank to use the latest published release.

## Idempotency guarantees

- A `concurrency` group (`update-ibira-js`) prevents simultaneous runs from
  racing on the same PR branch.
- The early-exit guard in step 3 ensures no changes are committed if the
  dependency is already at the target version.
- `peter-evans/create-pull-request` updates an existing PR rather than opening
  a duplicate.

## Tarball URL pattern

```text
https://github.com/mpbarbosa/ibira.js/archive/refs/tags/<TAG>.tar.gz
```

## Related files

- `.github/workflows/update-ibira.yml` — the full workflow definition
- `.github/SKILLS.md` — skills and workflows index for this project
- `docs/API.md` — paraty_geocore.js API reference
