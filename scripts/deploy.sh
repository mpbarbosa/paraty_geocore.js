#!/usr/bin/env bash
# ==============================================================================
# Deploy Script for paraty_geocore.js
# ==============================================================================
# Builds the TypeScript source, commits the compiled artifacts, creates a
# version tag, pushes to GitHub, and generates jsDelivr CDN URLs.
#
# Usage:
#   bash scripts/deploy.sh
#   ai-workflow deploy          # via ai_workflow.js deploy command
# ==============================================================================

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
# shellcheck source=scripts/colors.sh
source "$(dirname "${BASH_SOURCE[0]}")/colors.sh"

info()    { echo -e "${BLUE}ℹ  $*${NC}"; }
success() { echo -e "${GREEN}✓  $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠  $*${NC}"; }
error()   { echo -e "${RED}✗  $*${NC}" >&2; }

# ── Resolve project root (directory containing this script's parent) ──────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

# ── Read version from package.json ────────────────────────────────────────────
PACKAGE_VERSION="$(node -p "require('./package.json').version")"
TAG="v${PACKAGE_VERSION}"
MAIN_FILE="dist/src/index.js"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   paraty_geocore.js  ·  Deploy to CDN      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
info "Project root : ${PROJECT_ROOT}"
info "Version      : ${PACKAGE_VERSION}"
info "Git tag      : ${TAG}"
echo ""

# ── 1. Build ──────────────────────────────────────────────────────────────────
info "Step 1/5 — Building TypeScript (CJS + ESM) …"
npm run build
npm run build:esm
success "Build complete (CJS + ESM)"
echo ""

# ── 2. Commit build artifacts ─────────────────────────────────────────────────
info "Step 2/5 — Committing build artifacts …"

# Stage compiled output and delivery script (skip if nothing changed)
git add dist/ cdn-delivery.sh 2>/dev/null || true

if git diff --cached --quiet; then
  warn "Nothing to commit — build artifacts are up to date"
else
  git commit -m "chore: build artifacts for ${TAG}"
  success "Committed build artifacts"
fi
echo ""

# ── 3. Tag & push ─────────────────────────────────────────────────────────────
info "Step 3/5 — Tagging and pushing …"

# Detect current branch dynamically (avoids hardcoding 'main')
CURRENT_BRANCH="$(git branch --show-current)"
if [[ -z "${CURRENT_BRANCH}" ]]; then
  error "Could not determine current git branch (detached HEAD?)"
  exit 1
fi

# Pull latest remote changes before pushing to avoid non-fast-forward rejection
# (mirrors what step_12 does in _pushToRemote so both can coexist safely)
git pull --rebase origin "${CURRENT_BRANCH}"

# Create tag (skip if it already exists)
if git rev-parse "${TAG}" >/dev/null 2>&1; then
  warn "Tag ${TAG} already exists — skipping tag creation"
else
  git tag "${TAG}"
  success "Created tag ${TAG}"
fi

git push origin "${CURRENT_BRANCH}" --tags
success "Pushed to origin/${CURRENT_BRANCH}"
echo ""

# ── 4. Generate CDN URLs ──────────────────────────────────────────────────────
info "Step 4/5 — Generating jsDelivr CDN URLs …"
bash cdn-delivery.sh > /dev/null 2>&1 || true
if [[ -f "${PROJECT_ROOT}/cdn-urls.txt" ]]; then
  cat "${PROJECT_ROOT}/cdn-urls.txt"
else
  warn "cdn-urls.txt not found"
fi
success "CDN URL list generated"
echo ""

success "Deployment of ${TAG} complete! 🚀"
echo "    CDN will pick up the new tag automatically via jsDelivr within a few minutes."
echo ""

# ── 5. CDN availability check ─────────────────────────────────────────────────
info "Step 5/5 — Checking CDN availability for ${TAG} …"

GITHUB_USER="$(git remote get-url origin | sed -E 's|.*[:/]([^/]+)/[^/]+$|\1|; s|\.git$||')"
GITHUB_REPO="$(basename "$(git remote get-url origin)" .git)"
CDN_URL="https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/${MAIN_FILE}"

_cdn_purge() {
  local url="$1"
  local purge_url="${url/cdn.jsdelivr.net/purge.jsdelivr.net}"
  curl -s -o /dev/null --max-time 10 "${purge_url}" || true
}

_github_raw_check() {
  local gh_user="$1" gh_repo="$2" git_tag="$3" rel_path="$4"
  local raw_url="https://raw.githubusercontent.com/${gh_user}/${gh_repo}/${git_tag}/${rel_path}"
  curl -s -f -o /dev/null --max-time 10 "${raw_url}"
}

_cdn_check() {
  local label="$1" url="$2" max_retries=5 interval=30
  _cdn_purge "${url}"
  for ((attempt=1; attempt<=max_retries; attempt++)); do
    if curl -s -f -o /dev/null --max-time 10 "${url}"; then
      success "${label} is live on jsDelivr ✓"
      echo "    ${url}"
      return 0
    fi
    if [[ ${attempt} -lt ${max_retries} ]]; then
      warn "${label}: not ready yet (attempt ${attempt}/${max_retries}) — retrying in ${interval}s …"
      sleep "${interval}"
    fi
  done
  warn "${label}: not yet available on CDN after ${max_retries} attempts."
  echo "    Check manually: ${url}"
  return 0
}

if command -v curl &>/dev/null; then
  if _github_raw_check "${GITHUB_USER}" "${GITHUB_REPO}" "${TAG}" "${MAIN_FILE}"; then
    success "${MAIN_FILE} is committed and visible on GitHub ✓"
  else
    warn "${MAIN_FILE} not found on GitHub — CDN delivery will fail"
  fi
  _cdn_check "${GITHUB_REPO} ${TAG}" "${CDN_URL}" || true
else
  warn "curl not found — skipping CDN check"
  echo "    Verify manually: ${CDN_URL}"
fi
echo ""
