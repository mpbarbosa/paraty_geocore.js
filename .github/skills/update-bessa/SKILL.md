---
name: update-bessa
description: >
  Update the bessa_patterns.ts dependency in paraty_geocore.js to the latest
  (or a specified) release. Uses jsDelivr CDN as the primary delivery source
  with the GitHub tarball as the npm-install fallback. Use this skill when
  asked to bump, upgrade, or refresh bessa_patterns.ts, or when the
  update-bessa GitHub Actions workflow needs to be triggered, debugged, or
  explained.
---

## Overview

`bessa_patterns.ts` is consumed by this project as a dependency tracked in
`package.json`. The update workflow uses **jsDelivr CDN** as the primary
delivery source — resolving the target version via the jsDelivr data API and
verifying CDN availability before completing. The **GitHub tarball URL** is
kept as the npm-install source since jsDelivr does not serve npm-compatible
archives for GitHub-hosted packages.

## Delivery strategy

| Purpose | URL pattern |
|---|---|
| **CDN delivery** (primary) | `https://cdn.jsdelivr.net/gh/mpbarbosa/bessa_patterns.ts@<TAG>/<ENTRY>` |
| **npm install** (fallback) | `https://github.com/mpbarbosa/bessa_patterns.ts/archive/refs/tags/<TAG>.tar.gz` |

## Workflow location

```text
.github/workflows/update-bessa.yml
```

## What the workflow does

1. **Resolve version** — queries the **jsDelivr data API** first
   (`data.jsdelivr.com/v1/package/gh/mpbarbosa/bessa_patterns.ts`) to get the
   latest available version; falls back to the GitHub releases API, then the
   GitHub tags API if jsDelivr is unavailable or does not yet carry the tag.
2. **Compute CDN URLs** — generates the jsDelivr CDN URL (primary, for browser
   and CDN consumers) by reading the package entry point from `package.json`
   served by jsDelivr. Also generates the GitHub tarball URL (npm fallback).
3. **Verify CDN availability** — performs an HTTP check against the jsDelivr
   CDN URL to confirm the version is live; logs a warning but continues if CDN
   is not yet propagated.
4. **Early-exit guard** — compares the resolved tag against the current npm URL
   in `package.json`; skips the rest if already up to date.
5. **Update `package.json`** — writes the GitHub tarball URL for the
   `bessa_patterns.ts` dependency (npm-compatible format required for
   `npm install`).
6. **Install dependencies** — runs `npm install "bessa_patterns.ts@<tarball>"`.
7. **Validate TypeScript** — runs `npx tsc --noEmit`.
8. **Run tests** — runs the full Jest suite.
9. **Adjust related code** — updates hardcoded version strings in `src/`.
10. **Update documentation** — replaces the old GitHub tarball URL, old
    jsDelivr CDN URLs, and bare version strings in all `*.md` files.
11. **Adjust related tests** — updates version strings in `test/` and
    `__tests__/`, then re-runs only the affected test files.
12. **Open pull request** — uses `peter-evans/create-pull-request@v8`; the PR
    description includes both the jsDelivr CDN URL and the GitHub tarball URL.

## How to trigger manually

```shell
gh workflow run update-bessa.yml --field version=v0.13.0-alpha
```

Leave `version` blank to use the latest version detected via jsDelivr data API.

## Idempotency guarantees

- A `concurrency` group (`update-bessa-patterns`) prevents simultaneous runs
  from racing on the same PR branch.
- The early-exit guard ensures no changes are committed if the dependency is
  already at the target version.
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
