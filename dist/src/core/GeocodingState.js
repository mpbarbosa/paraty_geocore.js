"use strict";
/**
 * GeocodingState - Centralized state management for geocoding data
 *
 * @fileoverview Manages the current position and coordinate state for the geocoding workflow.
 * Extends {@link ObserverSubject} to notify subscribers of state changes.
 * This class follows the Single Responsibility Principle by focusing solely on geocoding state.
 *
 * **Design Principles:**
 * - **Single Responsibility:** Geocoding state management only
 * - **Immutability:** Returns defensive copies of state
 * - **Observer Pattern:** Inherited from ObserverSubject
 * - **Encapsulation:** Private state with public accessors
 *
 * @module core/GeocodingState
 * @since 0.9.0-alpha - Extracted from WebGeocodingManager during Phase 17 refactoring
 * @author Marcelo Pereira Barbosa
 *
 * @requires core/GeoPosition
 * @requires core/ObserverSubject
 *
 * @example
 * // Basic usage
 * import GeocodingState from './core/GeocodingState.js';
 *
 * const state = new GeocodingState();
 *
 * // Subscribe to state changes
 * state.subscribe((stateSnapshot) => {
 *   console.log('Position updated:', stateSnapshot.position);
 * });
 *
 * // Set position (triggers notification)
 * const position = new GeoPosition(browserPosition);
 * state.setPosition(position);
 *
 * @example
 * // Get current state
 * const coords = state.getCurrentCoordinates();
 * console.log(coords.latitude, coords.longitude);
 *
 * const position = state.getCurrentPosition();
 * console.log(position.accuracy, position.accuracyQuality);
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GeoPosition_js_1 = __importDefault(require("./GeoPosition.js"));
const ObserverSubject_js_1 = __importDefault(require("./ObserverSubject.js"));
/**
 * GeocodingState class - Manages position and coordinate state
 *
 * @class
 * @extends ObserverSubject<GeocodingStateSnapshot>
 */
class GeocodingState extends ObserverSubject_js_1.default {
    /**
     * Creates a new GeocodingState instance
     *
     * @constructor
     */
    constructor() {
        super();
        /**
         * Current position (GeoPosition instance)
         * @type {GeoPosition|null}
         * @private
         */
        this._currentPosition = null;
        /**
         * Current coordinates (extracted from position)
         * @type {Object|null}
         * @private
         */
        this._currentCoordinates = null;
    }
    /**
     * Set current position and notify observers
     *
     * @param {GeoPosition|null} position - The new position, or null to clear
     * @throws {TypeError} If position is not a GeoPosition instance or null
     * @returns {GeocodingState} This instance for chaining
     *
     * @example
     * const position = new GeoPosition(browserPosition);
     * state.setPosition(position);
     *
     * @example
     * state.setPosition(null); // Clear position
     */
    setPosition(position) {
        if (position !== null && !(position instanceof GeoPosition_js_1.default)) {
            throw new TypeError('GeocodingState: position must be a GeoPosition instance or null');
        }
        this._currentPosition = position;
        this._currentCoordinates = position && position.latitude !== undefined && position.longitude !== undefined ? {
            latitude: position.latitude,
            longitude: position.longitude
        } : null;
        if (position !== null) {
            this._notifyObservers({
                position: this._currentPosition,
                coordinates: this.getCurrentCoordinates()
            });
        }
        return this;
    }
    /**
     * Get current position
     *
     * @returns {GeoPosition|null} The current position or null if not set
     *
     * @example
     * const position = state.getCurrentPosition();
     * if (position) {
     *   console.log(position.latitude, position.accuracyQuality);
     * }
     */
    getCurrentPosition() {
        return this._currentPosition;
    }
    /**
     * Get current coordinates (defensive copy)
     *
     * @returns {Object|null} Coordinates object {latitude, longitude} or null
     *
     * @example
     * const coords = state.getCurrentCoordinates();
     * if (coords) {
     *   console.log(`Lat: ${coords.latitude}, Lon: ${coords.longitude}`);
     * }
     */
    getCurrentCoordinates() {
        return this._currentCoordinates ? { ...this._currentCoordinates } : null;
    }
    /**
     * Check if position is available
     *
     * @returns {boolean} True if position is set
     *
     * @example
     * if (state.hasPosition()) {
     *   const coords = state.getCurrentCoordinates();
     *   // Use coordinates...
     * }
     */
    hasPosition() {
        return this._currentPosition !== null;
    }
    /**
     * Clear current position state
     *
     * @example
     * state.clear();
     * console.log(state.hasPosition()); // false
     */
    clear() {
        this._currentPosition = null;
        this._currentCoordinates = null;
    }
    /**
     * Get string representation of current state
     *
     * @returns {string} State summary
     *
     * @example
     * console.log(state.toString());
     * // "GeocodingState: position: available, coordinates: (lat, lon), observers: 2"
     */
    toString() {
        const hasPos = this._currentPosition ? 'available' : 'null';
        const coords = this._currentCoordinates ?
            `(${this._currentCoordinates.latitude.toFixed(4)}, ${this._currentCoordinates.longitude.toFixed(4)})` :
            'null';
        return `GeocodingState: position: ${hasPos}, coordinates: ${coords}, observers: ${this._observers.length}`;
    }
}
exports.default = GeocodingState;
