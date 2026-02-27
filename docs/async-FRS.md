# Functional Requirements Specification
## `async` — `src/utils/async.ts`

**Module:** `utils/async`
**Since:** 0.10.0-alpha
**Author:** Marcelo Pereira Barbosa

---

## 1. Overview

`utils/async` provides general-purpose asynchronous utility functions for callers
building polling, throttling, or retry logic around the library. All exports are
independent of geolocation concerns.

---

## 2. Exported Functions

### `delay(ms)`

Creates a `Promise` that resolves after the specified number of milliseconds.

#### Signature

```typescript
export const delay = (ms: number): Promise<void>
```

#### Parameters

| Parameter | Type     | Required | Description                    |
|-----------|----------|----------|--------------------------------|
| `ms`      | `number` | Yes      | Delay duration in milliseconds |

#### Return Value

| Type            | Description                                    |
|-----------------|------------------------------------------------|
| `Promise<void>` | Resolves with no value after `ms` milliseconds |

#### Behaviour

- Wraps `setTimeout` in a `Promise` for use with `async/await`.
- Does not reject under normal conditions.
- Passing `0` resolves on the next event-loop tick (yields control once).

#### Example

```javascript
import { delay } from 'paraty_geocore.js/utils/async';

async function pollPosition() {
    while (true) {
        await fetchAndProcessPosition();
        await delay(5000); // wait 5 s between polls
    }
}
```

---

## 3. Design Constraints

| Constraint              | Status |
|-------------------------|--------|
| No side effects         | ✅     |
| No external dependencies | ✅    |
| No global state         | ✅     |
| No geolocation coupling | ✅     |
