# Contributing

Thank you for your interest in contributing to `paraty_geocore.js`!

---

## Development Setup

```bash
git clone https://github.com/your-org/paraty_geocore.js.git
cd paraty_geocore.js
npm install
```

---

## Project Structure

```text
src/
  core/         # Core classes (GeoPosition, errors)
  utils/        # Pure utility functions (distance, async)
  index.ts      # Public entry point — barrel re-exports only
test/
  core/         # Unit tests for src/core/
  utils/        # Unit tests for src/utils/
  integration/  # Integration tests (browser Geolocation API simulation)
  benchmarks/   # Performance benchmarks (excluded from coverage run)
  index.test.ts # Smoke tests for the public re-export surface
docs/           # Functional requirements specs, API reference, architecture
```

---

## Code Standards

### Language

All source code is written in **TypeScript** (`src/**/*.ts`). Do not submit plain `.js` files under `src/`.

### Purity

This library is built on **referential transparency**. All new functions and methods must be:

- **Pure**: same inputs → same output, always.
- **Side-effect free**: no logging, no mutation of arguments, no global state.
- **Immutable by default**: prefer `Object.freeze()` for new class instances.

### Style

- 1 tab indentation (matching existing code)
- Single quotes for strings
- Trailing commas in multi-line argument lists
- JSDoc comments required for all exported symbols (params, returns, `@since`, `@example`)

---

## Error Handling

### When to throw

- Throw `GeoPositionError` (from `src/core/errors.ts`) for invalid arguments passed to `GeoPosition`.
- Throw standard `Error` subtypes for programming errors (wrong argument type) — not for missing or partial GPS data, which is normal in geolocation contexts.
- **Never throw inside pure utility functions** (`calculateDistance`, `delay`). Callers supply valid input; document the contract in JSDoc instead.

### Error class conventions

- Subclass `Error` directly; call `Object.setPrototypeOf(this, new.target.prototype)` to maintain the prototype chain in transpiled output.
- Always set `this.name` to the class name.
- Write error messages in the form `"ClassName: human-readable description"`.

### Returning vs throwing

| Situation | Preferred approach |
|---|---|
| Invalid constructor argument (wrong type) | Throw `GeoPositionError` |
| Missing / partial GPS data | Return `undefined` / `null` on the property |
| No coordinates available for calculation | Return `NaN` (e.g., `distanceTo`) |
| Async timeout or cancellation | Reject the returned `Promise` |

### Testing errors

Every custom error path must have a corresponding test that asserts:
1. The correct error class is thrown (`instanceof`)
2. The error message matches the documented format (`toThrow(/pattern/)`)
3. The prototype chain is intact (`instanceof Error`)

---

## Running Tests

```bash
npm test              # unit + integration + utils tests
npm run test:coverage # same, with coverage report (80% threshold enforced)
npm run test:verbose  # same, with per-test output
npm run bench         # performance benchmarks (not counted in coverage)
```

Tests use **Jest** with `ts-jest`. Test files live under `test/`. New features require accompanying tests.

---

## Running the Linter

```bash
npm run validate      # TypeScript type-check (tsc --noEmit)
npx markdownlint-cli "**/*.md" --ignore node_modules --config .markdownlint.json
```

Fix all type errors and markdown lint errors before submitting a pull request.

## Pre-commit Hooks

This project uses [pre-commit](https://pre-commit.com/) to automate code quality checks. Install and activate once after cloning:

```bash
pip install pre-commit
pre-commit install
```

Run manually against all files:

```bash
pre-commit run --all-files
```

Hooks enforce: private key detection, EditorConfig rules, and markdownlint.

---

## Submitting Changes

1. **Fork** the repository and create a branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Write tests** for any new or changed behaviour.

3. **Update documentation** — at minimum update `CHANGELOG.md` and `docs/API.md`. If adding a new module, add a functional requirements spec in `docs/`.

4. **Ensure all checks pass:**
   ```bash
   npm test && npm run validate
   ```

5. **Open a pull request** against `main` with a clear description of what changed and why.

---

## Commit Message Format

Use concise imperative messages:

```text
feat: add bearing calculation to distance utils
fix: handle null coords in GeoPosition constructor
docs: update API reference for distanceTo
test: add edge cases for getAccuracyQuality
```

Prefix choices: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`.

---

## Reporting Issues

Open an issue describing:
- What you expected to happen
- What actually happened
- A minimal reproducible example

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
