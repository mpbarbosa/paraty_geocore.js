#!/usr/bin/env bash
# ==============================================================================
# Deploy Script for paraty_geocore.js
# ==============================================================================
# Installs dependencies, runs tests, builds the TypeScript source (CJS + ESM),
# commits the compiled artifacts, creates a version tag, pushes to GitHub,
# publishes to npm, and reports jsDelivr CDN URLs.
#
# Usage:
#   export NPM_TOKEN=npm_...      # or place NPM_TOKEN=npm_... in ./.env
#   bash scripts/deploy.sh
#   ai-workflow deploy            # via ai_workflow.js deploy command
#
# Guards:
#   NPM_TOKEN must be set (via environment or ./.env); tests must pass; build
#   must succeed. Prerelease versions (e.g. 0.17.0-alpha) publish under a
#   matching dist-tag (alpha), never `latest`.
# ==============================================================================

set -euo pipefail

# ── Cleanup ───────────────────────────────────────────────────────────────────
# Remove only the temporary auth config we create below. The project's tracked
# .npmrc (engine-strict=true) is never touched.
cleanup() {
  [[ -n "${NPMRC_AUTH:-}" ]] && rm -f "${NPMRC_AUTH}"
}
trap cleanup EXIT

# ── Colors ────────────────────────────────────────────────────────────────────
# shellcheck source=scripts/colors.sh
source "$(dirname "${BASH_SOURCE[0]}")/colors.sh"

info()    { echo -e "${BLUE}ℹ  $*${NC}"; }
success() { echo -e "${GREEN}✓  $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠  $*${NC}"; }
error()   { echo -e "${RED}✗  $*${NC}" >&2; }
fail()    { error "$*"; exit 1; }

# ── Resolve project root (directory containing this script's parent) ──────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

# ── Load .env ─────────────────────────────────────────────────────────────────
# Fills NPM_TOKEN (and any other vars) from ./.env when not already present in
# the environment. An explicit `export NPM_TOKEN=...` takes precedence over the
# file. The .env file is gitignored — never commit it.
ENV_FILE="${PROJECT_ROOT}/.env"
if [[ -z "${NPM_TOKEN:-}" && -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
  info "Loaded NPM_TOKEN from .env"
fi

# ── Guards ────────────────────────────────────────────────────────────────────
if [[ -z "${NPM_TOKEN:-}" ]]; then
  error "NPM_TOKEN is not set."
  info  "To fix this, create an Automation token on npm:"
  info  "  1. Go to https://www.npmjs.com/settings/~/tokens"
  info  "  2. Generate New Token → Granular Access Token"
  info  "  3. Enable 'Bypass 2FA' and set permission to 'Read and write'"
  info  "  4. export NPM_TOKEN=npm_... && bash scripts/deploy.sh"
  info  "     (or add NPM_TOKEN=npm_... to ./.env)"
  exit 1
fi

command -v npm >/dev/null 2>&1 || fail "npm not found on PATH."

# ── Read version from package.json ────────────────────────────────────────────
PACKAGE_NAME="$(node -p "require('./package.json').name")"
PACKAGE_VERSION="$(node -p "require('./package.json').version")"
PRERELEASE="$(node -p "('${PACKAGE_VERSION}'.match(/-([\w]+)/)||[])[1]||''")"
NPM_TAG="${PRERELEASE:-latest}"
TAG="v${PACKAGE_VERSION}"
MAIN_FILE="dist/src/index.js"
TYPES_FILE="dist/types/src/index.d.ts"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   paraty_geocore.js  ·  Deploy to npm      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
info "Project root : ${PROJECT_ROOT}"
info "Version      : ${PACKAGE_VERSION}"
info "dist-tag     : ${NPM_TAG}"
info "Git tag      : ${TAG}"
echo ""

# ── Step 1/6 — Install dependencies ──────────────────────────────────────────
info "Step 1/6 — Installing dependencies …"
npm ci --prefer-offline --no-audit
success "Dependencies installed"
echo ""

# ── Step 2/6 — Test ──────────────────────────────────────────────────────────
info "Step 2/6 — Running tests …"
npm test || fail "Tests failed. Aborting deploy."
success "Tests passed"
echo ""

# ── Step 3/6 — Build (CJS + ESM + types) ─────────────────────────────────────
info "Step 3/6 — Building TypeScript (CJS + ESM) …"
npm run build     || fail "CJS build failed. Aborting deploy."
npm run build:esm || fail "ESM build failed. Aborting deploy."

# Validate that the types declaration file was produced by the build.
# dist/src/index.d.ts does NOT exist — declarations land under dist/types/
# because tsconfig.json sets declarationDir: "./dist/types" with rootDir: "."
if [[ ! -f "${TYPES_FILE}" ]]; then
  error "Types file not found: ${TYPES_FILE}"
  fail  "Run 'npm run build' and verify tsconfig.json declarationDir is './dist/types'"
fi
success "Build complete (CJS + ESM + types: ${TYPES_FILE})"
echo ""

# ── Step 4/6 — Commit artifacts, tag & push ──────────────────────────────────
info "Step 4/6 — Committing build artifacts, tagging and pushing …"

# Detect current branch dynamically (avoids hardcoding 'main')
CURRENT_BRANCH="$(git branch --show-current)"
if [[ -z "${CURRENT_BRANCH}" ]]; then
  fail "Could not determine current git branch (detached HEAD?)"
fi

# Generate cdn-urls.txt BEFORE the commit so it is included in the tagged version.
bash cdn-delivery.sh > /dev/null 2>&1 || true

# Stage compiled output (tracked for jsDelivr gh delivery), delivery script,
# and generated URL list.
git add dist/ cdn-delivery.sh cdn-urls.txt 2>/dev/null || true

if git diff --cached --quiet; then
  warn "Nothing to commit — build artifacts are up to date"
else
  git commit -m "chore: build artifacts for ${TAG}"
  success "Committed build artifacts"
fi

# Pull latest remote changes before pushing to avoid non-fast-forward rejection.
git pull --rebase origin "${CURRENT_BRANCH}"

# Create version tag (skip if it already exists)
if git rev-parse "${TAG}" >/dev/null 2>&1; then
  warn "Tag ${TAG} already exists — skipping tag creation"
else
  git tag "${TAG}"
  success "Created tag ${TAG}"
fi

git push origin "${CURRENT_BRANCH}" --tags
success "Pushed to origin/${CURRENT_BRANCH}"
echo ""

# ── Step 5/6 — Publish to npm ────────────────────────────────────────────────
info "Step 5/6 — Publishing ${PACKAGE_NAME}@${PACKAGE_VERSION} to npm (tag: ${NPM_TAG}) …"

# Inject the auth token via a throwaway userconfig file rather than writing to
# the project's tracked .npmrc. The project .npmrc (engine-strict) still loads
# and merges with this, so both settings apply during publish.
NPMRC_AUTH="$(mktemp)"
chmod 600 "${NPMRC_AUTH}"
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > "${NPMRC_AUTH}"

set +e
PUBLISH_OUTPUT="$(npm publish --userconfig "${NPMRC_AUTH}" --access public --tag "${NPM_TAG}" 2>&1)"
PUBLISH_EXIT=$?
set -e
echo "${PUBLISH_OUTPUT}"

if [[ ${PUBLISH_EXIT} -ne 0 ]]; then
  if echo "${PUBLISH_OUTPUT}" | grep -qi "Two-factor authentication\|bypass 2fa\|EOTP\|one-time password"; then
    error "npm publish failed: 2FA bypass required (npm demanded a one-time password)."
    info  "Your NPM_TOKEN can't publish non-interactively because 2FA is enabled for publishing."
    info  "Fix: create a token that bypasses 2FA at https://www.npmjs.com/settings/~/tokens"
    info  "  → Granular Access Token → enable 'Bypass 2FA' → Read and write (or a classic Automation token)"
  elif echo "${PUBLISH_OUTPUT}" | grep -qi "You cannot publish over the previously published versions\|cannot publish over"; then
    error "npm publish failed: version ${PACKAGE_VERSION} is already published."
    info  "Bump the version in package.json before deploying again."
  elif echo "${PUBLISH_OUTPUT}" | grep -q "403\|Forbidden\|credentials"; then
    error "npm publish failed: invalid or expired token."
    info  "Verify NPM_TOKEN is a valid Automation token with publish rights."
    info  "  https://www.npmjs.com/settings/~/tokens"
  elif echo "${PUBLISH_OUTPUT}" | grep -q "404\|not found"; then
    error "npm publish failed: registry or package not found."
    info  "Check the package name in package.json and the registry URL."
  else
    error "npm publish failed (exit ${PUBLISH_EXIT})."
  fi
  exit 1
fi

success "Published ${PACKAGE_NAME}@${PACKAGE_VERSION} to npm (tag: ${NPM_TAG})"
echo ""

# ── Step 6/6 — CDN URLs ──────────────────────────────────────────────────────
info "Step 6/6 — jsDelivr CDN URLs …"
echo ""
echo -e "  ${GREEN}From npm (recommended — immutable, versioned)${NC}"
echo "    https://cdn.jsdelivr.net/npm/${PACKAGE_NAME}@${NPM_TAG}/${MAIN_FILE}"
echo "    https://cdn.jsdelivr.net/npm/${PACKAGE_NAME}@${PACKAGE_VERSION}/${MAIN_FILE}"
echo "    https://cdn.jsdelivr.net/npm/${PACKAGE_NAME}@${PACKAGE_VERSION}/${TYPES_FILE}"
echo ""
if [[ -f "${PROJECT_ROOT}/cdn-urls.txt" ]]; then
  echo -e "  ${GREEN}From GitHub tag (legacy gh delivery)${NC}"
  cat "${PROJECT_ROOT}/cdn-urls.txt"
  echo ""
fi

success "Deployment of ${TAG} complete! 🚀"
echo "    npm:      https://www.npmjs.com/package/${PACKAGE_NAME}/v/${PACKAGE_VERSION}"
echo "    jsDelivr: picks up the new npm version automatically within a few minutes."
echo ""
