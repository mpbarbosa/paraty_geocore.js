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

```
src/
  core/         # Core classes (GeoPosition, ...)
  utils/        # Pure utility functions (distance, ...)
__tests__/
  unit/         # Unit tests
docs/           # Documentation
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

## Running Tests

```bash
npm test
```

Tests use **Jest**. Test files live in `__tests__/unit/`. New features require accompanying tests.

---

## Running the Linter

```bash
npm run lint
```

Fix all lint errors before submitting a pull request.

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
   npm test && npm run lint
   ```

5. **Open a pull request** against `main` with a clear description of what changed and why.

---

## Commit Message Format

Use concise imperative messages:

```
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
