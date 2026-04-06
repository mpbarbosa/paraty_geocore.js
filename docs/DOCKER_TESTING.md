# Docker Testing Guide

> This guide covers running the **paraty_geocore.js** test suite inside Docker for
> fully isolated, reproducible test runs.

---

## Table of Contents

1. [Why run tests in Docker?](#why-run-tests-in-docker)
2. [Prerequisites](#prerequisites)
3. [Project files overview](#project-files-overview)
4. [Dockerfile.test walkthrough](#dockerfiletest-walkthrough)
5. [.dockerignore walkthrough](#dockerignore-walkthrough)
6. [Shell script walkthrough](#shell-script-walkthrough)
7. [Running the tests](#running-the-tests)
8. [Extracting coverage reports](#extracting-coverage-reports)
9. [CI/CD integration (GitHub Actions)](#cicd-integration-github-actions)
10. [Troubleshooting](#troubleshooting)

---

## Why run tests in Docker?

| Benefit | Details |
|---|---|
| **Isolation** | Tests run in a clean OS every time — no leftover state, no host-machine differences |
| **Reproducibility** | Same image = same result on any machine or CI runner |
| **CI parity** | What passes locally in Docker will pass in CI |
| **Dependency pinning** | The exact Node.js version is locked to the image tag |
| **Safe multi-project setups** | Different projects can use conflicting Node versions without conflict |

---

## Prerequisites

### Docker

| Platform | Install |
|---|---|
| **macOS / Windows** | [Docker Desktop](https://docs.docker.com/desktop/) |
| **Linux** | [Docker Engine](https://docs.docker.com/engine/install/) |

Verify installation:

```bash
docker --version      # Docker version 26.x.x or later
docker info           # confirms the daemon is running
```

### Node.js (host only)

The host machine needs Node.js **only** for the `npm run test:docker` convenience
script (it resolves the package version). The actual tests run inside Docker.

```bash
node --version   # v18.0.0 or later
```

---

## Project files overview

The Docker test setup consists of three files:

```text
project-root/
├── Dockerfile.test               ← image definition for the test runner
├── .dockerignore                 ← files excluded from the build context
└── scripts/
    └── run-tests-docker.sh       ← orchestration script (build → run → report)
```

`package.json` also exposes a convenience script:

```json
"scripts": {
  "test:docker": "bash scripts/run-tests-docker.sh"
}
```

---

## Dockerfile.test walkthrough

```dockerfile
FROM node:20-alpine
```

- Uses the **official Node.js Alpine image** — roughly 60 MB vs 900 MB for the
  Debian image.
- Pinned to `node:20-alpine` rather than `node:alpine` or `node:latest` for
  reproducible builds.
- Version matches the `engines.node` field (`>=18`) and the primary CI Node version.
- **No `apk add` build tools** — paraty_geocore.js has no native npm dependencies,
  so no C++ compiler or Python is required.

---

```dockerfile
WORKDIR /app
```

Sets `/app` as the working directory for all subsequent commands.

---

```dockerfile
COPY package.json package-lock.json ./
```

Copies **only the dependency manifests** first. Docker caches each layer; if
neither file changed since the last build, the `npm ci` layer below is also
cached — saving time on subsequent rebuilds.

---

```dockerfile
ENV NODE_ENV=test
RUN npm ci --ignore-scripts
```

- `ENV NODE_ENV=test` — the `node:20-alpine` base image (like all official Node
  images) ships with `NODE_ENV=production`, which causes `npm ci` to silently skip
  `devDependencies`. Overriding it before `npm ci` ensures the full dependency
  tree is installed — including Jest, ts-jest, and TypeScript.
- `npm ci` does a clean install from `package-lock.json`. Faster and stricter than
  `npm install`, and never modifies `package-lock.json`.
- `--ignore-scripts` skips lifecycle scripts (`preinstall`, `postinstall`, etc.)
  that may fail inside Alpine.

---

```dockerfile
COPY . .
```

Copies the remaining project files **after** `npm ci` so that source-code changes
do not invalidate the dependency cache layer. `.dockerignore` controls what is
excluded.

---

```dockerfile
CMD ["npm", "test"]
```

Default command when the container is run with no extra arguments. Uses JSON array
form to avoid spawning an intermediate shell, making signal handling more reliable.

---

## .dockerignore walkthrough

`.dockerignore` uses the same syntax as `.gitignore`. It tells Docker which files
to exclude from the **build context** sent to the daemon before the build starts.
A smaller context means faster builds.

```dockerignore
node_modules/    # npm ci installs these fresh inside the container
dist/            # ts-jest compiles source on the fly; pre-built output not needed
coverage/        # tests produce their own inside the container
.jest-cache/     # stale host cache must not bleed into the clean container environment
.git/            # version history not needed at runtime
*.log            # logs and OS/editor artefacts
.ai_workflow/    # workflow artefacts not needed for tests
```

**Key rules:**

- Always exclude `node_modules/` — copying it in would override the clean `npm ci`
  install and dramatically bloat the build context.
- Exclude `dist/` — tests run against TypeScript source through ts-jest.
- Exclude `.jest-cache/` — stale host cache should not contaminate the container.
- Exclude `.git/` — no need for version history inside the container.

---

## Shell script walkthrough

`scripts/run-tests-docker.sh` is a convenience wrapper with three steps.

### Step 1 — Build the image

```bash
docker build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  -t paraty_geocore-test \
  -f Dockerfile.test \
  "${PROJECT_ROOT}"
```

- `-f Dockerfile.test` — uses the dedicated test Dockerfile.
- `-t paraty_geocore-test` — tags the image for easy reference.
- `--build-arg BUILDKIT_INLINE_CACHE=1` — embeds cache metadata in image layers
  (useful for registry-based caching in CI).

### Step 2 — Run the container

```bash
docker run \
  --rm \
  --name paraty_geocore-test-run \
  -e CI=true \
  paraty_geocore-test \
  sh -c "npm test -- --runInBand"
```

- `--rm` — removes the container automatically after it exits.
- `-e CI=true` — signals to Jest that the run is non-interactive; disables watch
  mode and colour animations.
- `--runInBand` — always passed inside Docker. Running tests serially in a single
  process prevents a VM-teardown race that can occur when parallel Jest workers
  are shut down on a resource-constrained container.
- The exit code of `docker run` mirrors the exit code of the test process.

### Step 3 — Report

The script captures the container's exit code and prints a pass/fail summary, then
exits with the same code. This makes it compatible with CI pipelines that check `$?`.

### Passing extra Jest arguments

Extra arguments after `--` are forwarded to Jest:

```bash
bash scripts/run-tests-docker.sh -- --coverage
bash scripts/run-tests-docker.sh -- --testPathPattern=GeoPosition
bash scripts/run-tests-docker.sh -- --verbose --detectOpenHandles
```

---

## Running the tests

### Basic run

```bash
npm run test:docker
# or directly:
bash scripts/run-tests-docker.sh
```

### With specific test file

```bash
bash scripts/run-tests-docker.sh -- --testPathPattern=distance
```

### With verbose output

```bash
bash scripts/run-tests-docker.sh -- --verbose
```

### With coverage threshold enforcement

```bash
bash scripts/run-tests-docker.sh -- --coverage
```

### One-liner without the script

```bash
docker build -f Dockerfile.test -t paraty_geocore-test . && \
docker run --rm -e CI=true paraty_geocore-test
```

---

## Extracting coverage reports

By default, coverage output stays inside the container and is lost when `--rm`
removes it. Mount the `coverage/` directory as a volume to persist it on the host:

```bash
docker run --rm \
  -e CI=true \
  -v "$(pwd)/coverage:/app/coverage" \
  paraty_geocore-test \
  npm test -- --runInBand --coverage
```

After the run, `./coverage/` on the host contains the full HTML and LCOV reports.

```bash
# open the HTML report in a browser (Linux)
xdg-open coverage/lcov-report/index.html
```

---

## CI/CD integration (GitHub Actions)

The workflow at `.github/workflows/test-docker.yml` builds the image, runs the
tests, and uploads the coverage report as an artifact.

```yaml
name: Docker Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-docker:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v6

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build test image
        run: |
          docker build \
            --cache-from type=gha \
            --cache-to type=gha,mode=max \
            -t paraty_geocore-test \
            -f Dockerfile.test \
            .

      - name: Run tests inside Docker
        run: |
          docker run --rm \
            -e CI=true \
            -v "${{ github.workspace }}/coverage:/app/coverage" \
            paraty_geocore-test \
            npm test -- --runInBand --coverage

      - name: Upload coverage report
        if: always()
        uses: actions/upload-artifact@v7
        with:
          name: docker-coverage-report
          path: coverage/
          retention-days: 14
```

**Key points:**

- `--cache-from / --cache-to type=gha` — uses GitHub Actions cache for Docker
  layers, dramatically reducing build time after the first run.
- `-v "${{ github.workspace }}/coverage:/app/coverage"` — extracts coverage from
  the container into the runner's workspace so the upload-artifact step can find it.
- `if: always()` on the upload step — uploads the report even when tests fail,
  which is when you need it most.

---

## Troubleshooting

### `Cannot find module 'jest'` (or other devDependency) inside Docker

**Cause:** The `node:20-alpine` base image sets `NODE_ENV=production`. When
`NODE_ENV=production`, `npm ci` silently skips `devDependencies` — so Jest,
ts-jest, and TypeScript are never installed.

**Diagnosis:**

```bash
docker run --rm paraty_geocore-test node -e "require('jest')"
# If this throws, devDeps were not installed.
```

**Fix:** `Dockerfile.test` already sets `ENV NODE_ENV=test` before `RUN npm ci`.
If you see this error, verify the `ENV` line is present and comes **before** the
`RUN npm ci` line.

---

### `package-lock.json` references a sibling project's `node_modules`

npm 7+ can resolve packages from a sibling directory. If another project in a
sibling directory shares a dependency, `package-lock.json` may record that path
instead of a local copy:

```json
# Example of a contaminated package-lock.json entry
"../other_project/node_modules/some-package": { "version": "x.y.z" }
```

`npm ci` follows the lock file exactly. Inside Docker only the current project is
present, so those `../` paths do not exist and the module cannot be found.

**Diagnosis:**

```bash
python3 -c "
import json
l = json.load(open('package-lock.json'))
sibling = [k for k in l['packages'] if k.startswith('../')]
print('sibling refs:', len(sibling))
if sibling:
    print('Examples:', sibling[:3])
"
```

**Fix:** Regenerate `package-lock.json` in an isolated directory:

```bash
mkdir -p /tmp/npm-clean && cp package.json /tmp/npm-clean/
cd /tmp/npm-clean && NODE_ENV=test npm install --package-lock-only
cp /tmp/npm-clean/package-lock.json /path/to/paraty_geocore.js/
cd /path/to/paraty_geocore.js && npm ci --ignore-scripts
git add package-lock.json && git commit -m "fix: regenerate package-lock.json in isolation"
```

---

### `MODULE_NOT_FOUND` errors for project files inside the container

**Cause:** A module path in an import does not resolve inside the container.

**Fix:** Check that the file exists and that its path is spelled correctly
(case-sensitive on Linux, even if macOS is forgiving). The `moduleNameMapper`
in `jest.config.js` already strips `.js` extensions for ts-jest compatibility.

---

### Tests pass locally but fail inside Docker

**Likely cause:** The host `node_modules/` is bleeding into the build context
despite `.dockerignore`. Verify the `.dockerignore` file is present at the project
root and contains `node_modules/`.

```bash
# Confirm the build context does NOT include node_modules
docker build --no-cache -f Dockerfile.test -t paraty_geocore-test . 2>&1 | grep -i "node_modules"
```
