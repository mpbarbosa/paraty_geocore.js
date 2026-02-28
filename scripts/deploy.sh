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
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
info "Step 1/4 — Building TypeScript …"
npm run build
success "Build complete"
echo ""

# ── 2. Commit build artifacts ─────────────────────────────────────────────────
info "Step 2/4 — Committing build artifacts …"

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
info "Step 3/4 — Tagging and pushing …"

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
info "Step 4/4 — Generating jsDelivr CDN URLs …"
npm run cdn
success "CDN URL list generated"
echo ""

success "Deployment of ${TAG} complete! 🚀"
echo ""
