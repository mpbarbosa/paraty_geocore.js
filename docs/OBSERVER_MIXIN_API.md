# ObserverMixin API Documentation

**Version:** 0.12.3-alpha (via `bessa_patterns.ts`)
**Module:** `src/core/ObserverMixin.ts`
**Pattern:** Observer (delegation via mixin)
**Author:** Marcelo Pereira Barbosa

## Overview

`withObserver` is a factory function that creates an observer delegation mixin for any class that
composes a `DualObserverSubject` instance. It eliminates boilerplate by generating standard
`subscribe`, `unsubscribe`, and `notifyObservers` methods that delegate to `this.observerSubject`.

The mixin is applied with `Object.assign` on the class prototype, adding observer capability
without inheritance.

## Purpose and Responsibility

- **Boilerplate elimination:** Removes 10–15 repeated delegation lines per class
- **Consistent interface:** Provides a uniform observer API across all host classes
- **Optional null guarding:** Warns and skips `null`/`undefined` observers when `checkNull: true`
- **Custom notification support:** `excludeNotify` allows the host to define its own notification logic

## Location in Codebase

```text
src/core/ObserverMixin.ts
```

## Requirement

The host class **must** have an `observerSubject` property that is a `DualObserverSubject`
instance (or any object matching the `SubjectDelegate` interface).

## Function: `withObserver(options?)`

```typescript
function withObserver<T extends unknown[] = unknown[]>(
  options?: ObserverMixinOptions
): ObserverMixinResult<T>
```

### Type Parameter

| Parameter | Description |
|-----------|-------------|
| `T` | Tuple of argument types forwarded to observer callbacks on notification |

### Options: `ObserverMixinOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `checkNull` | `boolean` | `false` | When `true`, emits `console.warn` and aborts subscribe if observer is `null` or `undefined` |
| `className` | `string` | `'Class'` | Class name included in null-check warning messages |
| `excludeNotify` | `boolean` | `false` | When `true`, `notifyObservers` is **not** included in the returned mixin |

### Return type: `ObserverMixinResult<T>`

| Method | Signature | Description |
|--------|-----------|-------------|
| `subscribe` | `(observer: ObserverObject<T> \| null \| undefined): void` | Delegates to `this.observerSubject.subscribe()` |
| `unsubscribe` | `(observer: ObserverObject<T>): void` | Delegates to `this.observerSubject.unsubscribe()` |
| `notifyObservers?` | `(...args: T): void` | Delegates to `this.observerSubject.notifyObservers()` (absent when `excludeNotify: true`) |

## Usage Patterns

### 1. Simple delegation (most common)

```typescript
import { withObserver } from 'paraty_geocore.js/core/ObserverMixin';
import DualObserverSubject from 'paraty_geocore.js/core/DualObserverSubject';

class MyService {
  observerSubject = new DualObserverSubject();
}

Object.assign(MyService.prototype, withObserver());
```

### 2. With null checking (for critical APIs)

```typescript
Object.assign(MyService.prototype, withObserver({
  checkNull: true,
  className: 'MyService',
}));
```

### 3. With custom notification logic

```typescript
class MyService {
  observerSubject = new DualObserverSubject();

  notifyObservers(event: string, data: unknown) {
    console.log(`Notifying: ${event}`);
    this.observerSubject.notifyObservers(this, event, data);
  }
}

// Add subscribe / unsubscribe only
Object.assign(MyService.prototype, withObserver({ excludeNotify: true }));
```

## Design Notes

- **No inheritance required:** Applied via `Object.assign` to the prototype, not via `extends`
- **Composition over inheritance:** Works alongside any existing class hierarchy
- **Type-safe:** Generic type parameter `T` ensures `notifyObservers` and `subscribe` share the
  same argument shape
- **Backward compatible:** Adding the mixin to an existing class does not break existing observers

## Tests

Tests are located at `test/core/ObserverMixin.test.ts` and cover:

- Return value shape (`subscribe`, `unsubscribe`, `notifyObservers` presence)
- `excludeNotify` removes `notifyObservers` from the result
- Subscribe delegation to `observerSubject`
- Null forwarding when `checkNull` is `false`
- `console.warn` and skip behaviour when `checkNull` is `true`
- Default `className` value in warning message
- Unsubscribe delegation
- `notifyObservers` argument forwarding to multiple observers
- `Object.assign` prototype pattern (full integration)
- `excludeNotify` with custom host notification method
