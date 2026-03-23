/**
 * Reference place data extracted from geocoding data.
 *
 * Encapsulates information about points of interest such as shopping centres,
 * subway stations, cafés, and other OSM-tagged features. Extracts the `class`,
 * `type`, and `name` fields from a geocoding API response and provides a
 * Portuguese-language description of the reference place type.
 *
 * @module core/ReferencePlace
 * @since 0.14.0-alpha
 * @author Marcelo Pereira Barbosa
 */
/** Fallback description returned when no mapping exists for a class/type pair. */
export const NO_REFERENCE_PLACE = 'Não classificado';
/**
 * OSM feature classes that are considered valid reference places.
 *
 * - `place` — geographic locations (cities, towns, neighbourhoods)
 * - `shop` — commercial establishments
 * - `amenity` — public facilities (restaurants, banks, schools)
 * - `railway` — railway stations and transport hubs
 * - `building` — buildings
 */
export const VALID_REF_PLACE_CLASSES = Object.freeze([
    'place',
    'shop',
    'amenity',
    'railway',
    'building',
]);
/**
 * Represents a reference place extracted from geocoding data.
 *
 * All instances are frozen after construction (immutable value object).
 *
 * @example
 * ```ts
 * const refPlace = new ReferencePlace({ class: 'shop', type: 'mall', name: 'Shopping Morumbi' });
 * console.log(refPlace.description); // "Shopping Center Shopping Morumbi"
 * console.log(refPlace.toString());  // "ReferencePlace: Shopping Center Shopping Morumbi - Shopping Morumbi"
 * ```
 */
class ReferencePlace {
    /**
     * Creates a new ReferencePlace instance from raw OSM geocoding data.
     *
     * @param data - Raw element data from a reverse-geocoding API response.
     *               All fields are optional; missing fields default to `null`.
     */
    constructor(data) {
        this.className = (data && data.class) || null;
        this.typeName = (data && data.type) || null;
        this.name = (data && data.name) || null;
        this.description = this.calculateDescription();
        Object.freeze(this);
    }
    /**
     * Calculates the Portuguese description of the reference place type.
     *
     * Looks up `className` and `typeName` in {@link ReferencePlace.referencePlaceMap}.
     * Falls back to `NO_REFERENCE_PLACE` when the class is not in
     * `VALID_REF_PLACE_CLASSES` or when `className`/`typeName` are absent.
     * Falls back to `"<class>: <type>"` when the class is valid but the type
     * has no mapping entry.
     *
     * @returns Portuguese description of the reference place type.
     */
    calculateDescription() {
        if (!this.className || !this.typeName) {
            return NO_REFERENCE_PLACE;
        }
        if (!VALID_REF_PLACE_CLASSES.includes(this.className)) {
            return NO_REFERENCE_PLACE;
        }
        const typeMap = ReferencePlace.referencePlaceMap[this.className];
        if (typeMap && typeMap[this.typeName]) {
            const label = typeMap[this.typeName];
            return this.name ? `${label} ${this.name}` : label;
        }
        return `${this.className}: ${this.typeName}`;
    }
    /**
     * Returns the category label for this reference place.
     *
     * Returns the Portuguese description for the `typeName` within the class
     * map, or `"unknown"` when no mapping is found.
     *
     * @returns Category label string or `"unknown"`.
     */
    calculateCategory() {
        const classMap = this.className
            ? ReferencePlace.referencePlaceMap[this.className]
            : undefined;
        if (!classMap)
            return 'unknown';
        const category = this.typeName ? classMap[this.typeName] : undefined;
        return category ?? 'unknown';
    }
    /**
     * Returns a human-readable string representation of this reference place.
     *
     * @example
     * ```ts
     * new ReferencePlace({ class: 'shop', type: 'mall', name: 'Shopping Morumbi' }).toString();
     * // "ReferencePlace: Shopping Center Shopping Morumbi - Shopping Morumbi"
     *
     * new ReferencePlace({ class: 'amenity', type: 'cafe' }).toString();
     * // "ReferencePlace: Café"
     * ```
     */
    toString() {
        const base = `${this.constructor.name}: ${this.description}`;
        return this.name ? `${base} - ${this.name}` : base;
    }
}
/**
 * Maps OpenStreetMap feature classes and types to Portuguese descriptions.
 * Keys must be lowercase to match OSM data.
 *
 * @see {@link https://wiki.openstreetmap.org/wiki/Map_Features} OSM feature documentation
 */
ReferencePlace.referencePlaceMap = Object.freeze({
    place: { house: 'Residencial' },
    shop: { mall: 'Shopping Center', car_repair: 'Oficina Mecânica' },
    amenity: { cafe: 'Café' },
    railway: { subway: 'Estação do Metrô', station: 'Estação do Metrô' },
    building: { yes: 'Edifício' },
});
export default ReferencePlace;
export { ReferencePlace };
