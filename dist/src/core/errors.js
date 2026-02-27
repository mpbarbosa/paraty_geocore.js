"use strict";
/**
 * Custom error classes for paraty_geocore.js.
 *
 * @module core/errors
 * @since 0.10.0-alpha
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoPositionError = void 0;
/**
 * Thrown when a `GeoPosition` is constructed with an invalid argument.
 *
 * @example
 * try {
 *   const pos = new GeoPosition(42 as any);
 * } catch (e) {
 *   if (e instanceof GeoPositionError) {
 *     console.error(e.message); // "GeoPosition: position must be an object"
 *   }
 * }
 */
class GeoPositionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'GeoPositionError';
        // Maintains proper prototype chain in transpiled ES5 output.
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.GeoPositionError = GeoPositionError;
