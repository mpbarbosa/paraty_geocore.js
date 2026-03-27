# ReferencePlace — Functional Requirements

**Module:** `paraty_geocore.js / src/core/ReferencePlace.ts`
**Version:** 0.14.0-alpha
**Status:** ✅ Implemented

---

## Purpose

`ReferencePlace` encapsulates information about a point of interest (POI)
extracted from an OpenStreetMap reverse-geocoding response. It maps the raw
OSM `class` and `type` fields to Portuguese-language descriptions, making it
straightforward for consumer applications to display or speak contextual
location information such as "Você está no Shopping Center Morumbi".

---

## Scope

| In scope | Out of scope |
|----------|-------------|
| Wrapping raw OSM `class`/`type`/`name` fields | Network requests / API calls |
| Portuguese description look-up | Internationalisation / other languages |
| Immutability via `Object.freeze` | Mutable state management |
| `calculateCategory()` convenience method | Distance or geolocation calculations |
| Exporting constants (`NO_REFERENCE_PLACE`, `VALID_REF_PLACE_CLASSES`) | Application-level UI rendering |

---

## Requirements

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-01 | Constructor accepts an `OsmElement` (or `null`/`undefined`) | `new ReferencePlace(null)` does not throw; all fields are `null` |
| FR-02 | `className` reflects `data.class`; falsy values become `null` | `new ReferencePlace({ class: '' }).className === null` |
| FR-03 | `typeName` reflects `data.type`; falsy values become `null` | `new ReferencePlace({ type: '' }).typeName === null` |
| FR-04 | `name` reflects `data.name`; falsy values become `null` | `new ReferencePlace({ name: '' }).name === null` |
| FR-05 | Instance is frozen after construction | `Object.isFrozen(rp) === true`; mutation throws in strict mode |
| FR-06 | `calculateDescription()` returns `NO_REFERENCE_PLACE` when `className` is absent | `rp.description === 'Não classificado'` |
| FR-07 | `calculateDescription()` returns `NO_REFERENCE_PLACE` when `typeName` is absent | `rp.description === 'Não classificado'` |
| FR-08 | `calculateDescription()` returns `NO_REFERENCE_PLACE` for classes outside `VALID_REF_PLACE_CLASSES` | `new ReferencePlace({ class: 'leisure', type: 'park' }).description === 'Não classificado'` |
| FR-09 | `calculateDescription()` returns `"<label> <name>"` for a mapped class/type when name is present | `'Shopping Center Shopping Morumbi'` for `{ class: 'shop', type: 'mall', name: 'Shopping Morumbi' }` |
| FR-10 | `calculateDescription()` returns just `"<label>"` for a mapped class/type when name is absent | `'Shopping Center'` for `{ class: 'shop', type: 'mall' }` |
| FR-11 | `calculateDescription()` returns `"<class>: <type>"` fallback for a valid class with an unmapped type | `'shop: bookshop'` for `{ class: 'shop', type: 'bookshop' }` |
| FR-12 | `calculateCategory()` returns the Portuguese label for a known class/type pair | `'Shopping Center'` for `{ class: 'shop', type: 'mall' }` |
| FR-13 | `calculateCategory()` returns `"unknown"` when no mapping is found | `'unknown'` for `{ class: 'leisure', type: 'park' }` |
| FR-14 | `toString()` returns `"ReferencePlace: <description>"` when name is absent | `'ReferencePlace: Café'` |
| FR-15 | `toString()` returns `"ReferencePlace: <description> - <name>"` when name is present | `'ReferencePlace: Shopping Center Shopping Morumbi - Shopping Morumbi'` |
| FR-16 | `referencePlaceMap` is frozen | `Object.isFrozen(ReferencePlace.referencePlaceMap) === true` |
| FR-17 | All `VALID_REF_PLACE_CLASSES` entries appear as top-level keys in `referencePlaceMap` | `Object.keys(referencePlaceMap)` ⊇ `VALID_REF_PLACE_CLASSES` |
| FR-18 | `ReferencePlace` is accessible through the package public entry point | `import { ReferencePlace } from 'paraty_geocore.js'` resolves without error |
| FR-19 | `NO_REFERENCE_PLACE` and `VALID_REF_PLACE_CLASSES` are exported from the package entry point | Named imports resolve correctly |

---

## Built-in OSM mapping

| OSM class | OSM type | Portuguese description |
|-----------|----------|------------------------|
| `place` | `house` | Residencial |
| `shop` | `mall` | Shopping Center |
| `shop` | `car_repair` | Oficina Mecânica |
| `shop` | `supermarket` | Supermercado |
| `shop` | `bakery` | Padaria |
| `shop` | `convenience` | Loja de Conveniência |
| `shop` | `pharmacy` | Farmácia |
| `amenity` | `cafe` | Café |
| `amenity` | `restaurant` | Restaurante |
| `amenity` | `bar` | Bar |
| `amenity` | `fast_food` | Lanchonete |
| `amenity` | `hospital` | Hospital |
| `amenity` | `school` | Escola |
| `amenity` | `bank` | Banco |
| `amenity` | `pharmacy` | Farmácia |
| `amenity` | `fuel` | Posto de Combustível |
| `railway` | `subway` | Estação do Metrô |
| `railway` | `station` | Estação de Trem |
| `building` | `yes` | Edifício |
| `building` | `school` | Escola |
| `building` | `hospital` | Hospital |
| `building` | `church` | Igreja |
| `leisure` | `park` | Parque |
| `leisure` | `playground` | Playground |

Unmapped types within a valid class fall back to `"<class>: <type>"`.
Classes outside `VALID_REF_PLACE_CLASSES` fall back to `NO_REFERENCE_PLACE`.

---

## Constants

### `NO_REFERENCE_PLACE`

```ts
export const NO_REFERENCE_PLACE = 'Não classificado';
```

Fallback description used when a class/type pair cannot be resolved.

### `VALID_REF_PLACE_CLASSES`

```ts
export const VALID_REF_PLACE_CLASSES: ReadonlyArray<string> = Object.freeze([
  'place', 'shop', 'amenity', 'railway', 'building', 'leisure',
]);
```

Frozen list of OSM feature classes treated as valid reference places.

---

## Usage example

```ts
import { ReferencePlace } from 'paraty_geocore.js';

const rp = new ReferencePlace({ class: 'shop', type: 'mall', name: 'Shopping Morumbi' });
console.log(rp.description);      // "Shopping Center Shopping Morumbi"
console.log(rp.calculateCategory()); // "Shopping Center"
console.log(rp.toString());       // "ReferencePlace: Shopping Center Shopping Morumbi - Shopping Morumbi"
```

---

## Migration notes

Migrated from `guia_turistico/src/data/ReferencePlace.ts` (v0.9.0-alpha).
Adaptations made:

- Removed dependency on guia_turistico `defaults.js`; constants are now
  self-contained inside this module and exported directly.
- Replaced the `OsmElement` import from guia_turistico's `types/nominatim.ts`
  with an inline interface definition (same shape).
- Constructor parameter type widened to `OsmElement | null | undefined` to
  make the contract explicit.
- `readonly` added to all instance properties (TypeScript strict immutability).
- `referencePlaceMap` made `readonly` via `Object.freeze`.
- JSDoc updated to paraty_geocore.js conventions (`@module`, `@since 0.14.0-alpha`).
