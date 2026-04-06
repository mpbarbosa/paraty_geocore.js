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
/**
 * Minimal OSM element shape used by {@link ReferencePlace} to identify points
 * of interest from a reverse-geocoding response.
 */
export interface OsmElement {
    class?: string;
    type?: string;
    name?: string;
    [key: string]: unknown;
}
/** Fallback description returned when no mapping exists for a class/type pair. */
export declare const NO_REFERENCE_PLACE = "N\u00E3o classificado";
/**
 * OSM feature classes that are considered valid reference places.
 *
 * - `place` — geographic locations (cities, towns, neighbourhoods)
 * - `shop` — commercial establishments
 * - `amenity` — public facilities (restaurants, banks, schools)
 * - `railway` — railway stations and transport hubs
 * - `building` — buildings
 * - `leisure` — parks, playgrounds, and recreational spaces
 */
export declare const VALID_REF_PLACE_CLASSES: ReadonlyArray<string>;
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
declare class ReferencePlace {
    readonly className: string | null;
    readonly typeName: string | null;
    readonly name: string | null;
    readonly description: string;
    /**
     * Maps OpenStreetMap feature classes and types to Portuguese descriptions.
     * Keys must be lowercase to match OSM data.
     *
     * @see {@link https://wiki.openstreetmap.org/wiki/Map_Features} OSM feature documentation
     */
    static readonly referencePlaceMap: Record<string, Record<string, string>>;
    /**
     * Creates a new ReferencePlace instance from raw OSM geocoding data.
     *
     * @param data - Raw element data from a reverse-geocoding API response.
     *               All fields are optional; missing fields default to `null`.
     */
    constructor(data: OsmElement | null | undefined);
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
    calculateDescription(): string;
    /**
     * Returns the category label for this reference place.
     *
     * Returns the Portuguese description for the `typeName` within the class
     * map, or `"unknown"` when no mapping is found.
     *
     * @returns Category label string or `"unknown"`.
     */
    calculateCategory(): string;
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
    toString(): string;
}
export default ReferencePlace;
export { ReferencePlace };
