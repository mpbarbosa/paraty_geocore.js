# paraty_geocore.js

> Biblioteca JavaScript pública com classes principais para aplicações de geolocalização

**Version:** 0.9.2-alpha

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

### HTML Script Tag

```html
<!-- Load specific version (recommended for production) -->
<!-- Note: CDN serves published releases only; @0.9.2-alpha requires the tag to be published on npm/GitHub. -->
<script src="https://cdn.jsdelivr.net/gh/mpbarbosa/paraty_geocore.js@0.9.2-alpha/src/index.js"></script>
```

### ES Module Import

```html
<script type="module">
  import { } from 'https://cdn.jsdelivr.net/gh/mpbarbosa/paraty_geocore.js@0.9.2-alpha/src/index.js';
</script>
```

### Version Options

- **Specific version:** `@0.9.2-alpha` (recommended for production)
- **Latest patch:** `@0.1` (auto-updates to latest 0.1.x)
- **Latest minor:** `@0` (auto-updates to latest 0.x.x)
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

## 📖 Key Resources

- **[API Reference](./docs/API.md)** - All guides and documentation

## 🤝 Contributing

Please read our comprehensive guides before contributing:

1. [JavaScript Best Practices](./.github/JAVASCRIPT_BEST_PRACTICES.md)
2. [TDD Guide](./.github/TDD_GUIDE.md)
3. [Code Review Guide](./.github/CODE_REVIEW_GUIDE.md)

See the full [API Reference](./docs/API.md) for all available resources.

## 📝 License

MIT License - Copyright (c) 2025 Marcelo Pereira Barbosa

## 🔗 Links

- **Repository:** [github.com/mpbarbosa/paraty_geocore.js](https://github.com/mpbarbosa/paraty_geocore.js)
- **Documentation:** [API Reference](./docs/API.md)

