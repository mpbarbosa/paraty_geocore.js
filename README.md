# paraty_geocore.js

> Biblioteca JavaScript pública com classes principais para aplicações de geolocalização

**Version:** 0.9.10-alpha

**Status:** 🚧 Early Development

---

## 📚 Documentation

For comprehensive documentation, guides, and resources, see **[API Reference](./docs/API.md)** - your complete guide to the repository.

## 🎯 Overview

**paraty_geocore.js** is a JavaScript library providing core classes for geolocation applications. It provides:

- 📍 **Core geolocation classes** for building location-aware applications
- 🧩 **Low coupling and high cohesion** design
- 🎯 **Promise-based** async/await API
- 🛡️ **Comprehensive error handling**

## 🚀 Quick Start

```javascript
import { GeoPosition } from 'paraty_geocore.js';

// Wrap a browser GeolocationPosition
navigator.geolocation.getCurrentPosition((rawPosition) => {
  const pos = new GeoPosition(rawPosition);
  console.log(pos.toString());
  // e.g. "GeoPosition: -23.5505, -46.6333, good, 760, 0, 0, 1634567890123"
});
```

## 🌐 CDN Delivery (jsDelivr)

Load **paraty_geocore.js** directly from jsDelivr CDN without installation:

### ES Module Import (browsers — recommended)

```html
<script type="module">
  import { GeoPosition } from 'https://cdn.jsdelivr.net/gh/mpbarbosa/paraty_geocore.js@0.9.10-alpha/dist/esm/index.js';

  navigator.geolocation.getCurrentPosition((rawPosition) => {
    const pos = new GeoPosition(rawPosition);
    console.log(pos.toString());
  });
</script>
```

> ⚠️ **Use the ESM build** (`dist/esm/index.js`) for native browser ES module imports.
> The CJS build (`dist/src/index.js`) is for Node.js/CommonJS only — browsers **cannot** load it as an ES module.

### Version Options

- **Specific version:** `@0.9.10-alpha` (recommended for production)
- **Latest from branch:** `@main` (development, auto-updates)

## 🧪 Testing & Utilities

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose

# Validate JavaScript syntax
npm run validate

# Validate and run tests
npm run test:all
```

## 🚢 Release & Automation Scripts

### `scripts/deploy.sh` — Build, tag, and publish a release

Automates the full release workflow: TypeScript build → commit artifacts → create git tag → push to GitHub → generate CDN URLs.

**Prerequisites:** Node.js, npm, git (must be run from a valid git repo with a clean working tree)

```bash
bash scripts/deploy.sh
```

**Steps performed:**

1. Reads version from `package.json`
2. Runs `npm run build` (TypeScript compilation)
3. Commits `dist/` and `cdn-delivery.sh` as build artifacts
4. Creates git tag `v<version>` (skips if already exists)
5. Pulls and pushes current branch + tags to `origin`
6. Runs `cdn-delivery.sh` to generate CDN URL list

**Output:** console status messages, committed artifacts, git tag, updated `cdn-urls.txt`

---

### `cdn-delivery.sh` — Generate jsDelivr CDN URLs

Generates and prints jsDelivr CDN URLs for the current package version, commit, and branch. Saves all URLs to `cdn-urls.txt` and optionally tests CDN availability with `curl`.

**Prerequisites:** Node.js (for version read), git; `curl` optional (for CDN availability test)

```bash
bash cdn-delivery.sh
# or via npm script (also runs build first):
npm run cdn
```

**Output:** CDN URLs printed to console (version-pinned, commit-pinned, branch, semver range, npm, HTML snippets) and saved to `cdn-urls.txt`

---

### `scripts/colors.sh` — Shared ANSI color definitions

A helper library sourced by other shell scripts to provide consistent terminal color output. **Not intended to be run directly.**

```bash
# Source from another script:
source "$(dirname "${BASH_SOURCE[0]}")/colors.sh"
```

Exports: `RED`, `GREEN`, `YELLOW`, `BLUE`, `NC` (no color/reset).

---

### Script Permissions

If the scripts are not executable, grant permissions first:

```bash
chmod +x scripts/deploy.sh cdn-delivery.sh
```

### Error Handling

Both scripts use `set -euo pipefail` for robust error handling. Exit code `0` indicates success; any nonzero exit code indicates an error and the script will abort immediately.

### Troubleshooting

- **Missing dependencies:** Ensure Node.js, npm, and git are installed. `curl` is optional but required for CDN availability testing in `cdn-delivery.sh`.
- **Git tag already exists:** The deploy script skips tag creation if the tag exists. To re-tag, delete the existing tag: `git tag -d v<version> && git push origin :refs/tags/v<version>`
- **Permission denied:** Ensure scripts are executable (`chmod +x scripts/deploy.sh cdn-delivery.sh`).
- **Unclean working tree:** `scripts/deploy.sh` requires a clean git working tree. Commit or stash changes before running.

---

## 📖 Key Resources

- **[API Reference](./docs/API.md)** - All guides and documentation

## 🤝 Contributing

Please read our comprehensive guides before contributing:

1. [CONTRIBUTING.md](./CONTRIBUTING.md) - Setup, code standards, and submission process

See the full [API Reference](./docs/API.md) for all available resources.

## 📝 License

MIT License - Copyright (c) 2025 Marcelo Pereira Barbosa

## 🔗 Links

- **Repository:** [github.com/mpbarbosa/paraty_geocore.js](https://github.com/mpbarbosa/paraty_geocore.js)
- **Documentation:** [API Reference](./docs/API.md)

