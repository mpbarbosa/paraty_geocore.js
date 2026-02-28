/**
 * Geographic position data wrapper with convenience methods.
 * 
 * Provides an immutable wrapper around browser Geolocation API position data,
 * adding convenience methods for distance calculations and accuracy assessment.
 * 
 * @module core/GeoPosition
 * @since 0.6.0-alpha
 * @author Marcelo Pereira Barbosa
 */

import { calculateDistance } from '../utils/distance.js';
import { GeoPositionError } from './errors.js';

/**
 * Coordinate properties extracted from a GeolocationCoordinates object.
 * All fields are optional to accommodate missing or partial position data.
 */
export interface GeoCoords {
	latitude?: number;
	longitude?: number;
	accuracy?: number;
	altitude?: number | null;
	altitudeAccuracy?: number | null;
	heading?: number | null;
	speed?: number | null;
}

/**
 * Input shape accepted by the GeoPosition constructor.
 * Compatible with the browser GeolocationPosition API and plain test objects.
 */
export interface GeoPositionInput {
	timestamp?: number;
	coords?: GeoCoords;
}

/** GPS accuracy quality classification. */
export type AccuracyQuality = 'excellent' | 'good' | 'medium' | 'bad' | 'very bad';

/** Accuracy threshold boundaries (meters) used by {@link GeoPosition.getAccuracyQuality}. */
const ACCURACY_THRESHOLDS = Object.freeze({
	EXCELLENT: 10,   // ≤ 10 m
	GOOD:      30,   // ≤ 30 m
	MEDIUM:   100,   // ≤ 100 m
	BAD:      200,   // ≤ 200 m
	// > 200 m → 'very bad'
} as const);

/** Normalised internal position shape stored on the instance. */
interface NormalisedPosition {
	readonly timestamp: number | undefined;
	readonly coords: Readonly<GeoCoords>;
}

/**
 * Represents a geographic position with enhanced methods.
 * 
 * @class
 * @immutable All instances and their nested objects are frozen after creation
 */
class GeoPosition {
	readonly geolocationPosition: Readonly<NormalisedPosition> | null;
	readonly coords: Readonly<GeoCoords> | null;
	readonly latitude: number | undefined;
	readonly longitude: number | undefined;
	readonly accuracy: number | undefined;
	readonly accuracyQuality: AccuracyQuality;
	readonly altitude: number | null | undefined;
	readonly altitudeAccuracy: number | null | undefined;
	readonly heading: number | null | undefined;
	readonly speed: number | null | undefined;
	readonly timestamp: number | undefined;

	/**
	 * Creates a new immutable GeoPosition instance from a raw position object.
	 *
	 * The constructor explicitly extracts each coordinate property by name rather
	 * than relying on spread/Object.assign, because the browser's
	 * `GeolocationCoordinates` exposes properties via non-enumerable getters that
	 * spread silently ignores.
	 *
	 * @param {GeoPositionInput} position - A `GeolocationPosition`-compatible object
	 *   or plain object with `coords` and `timestamp`. Must be a non-null object.
	 * @throws {GeoPositionError} If `position` is a primitive (number, string, boolean, etc.)
	 *
	 * @example
	 * // From browser Geolocation API
	 * navigator.geolocation.getCurrentPosition((raw) => {
	 *   const pos = new GeoPosition(raw);
	 *   console.log(pos.accuracyQuality); // 'good'
	 * });
	 *
	 * // From a plain test object
	 * const pos = new GeoPosition({ timestamp: Date.now(), coords: { latitude: -23.5505, longitude: -46.6333, accuracy: 15 } });
	 */
	constructor(position: GeoPositionInput) {
		if (position !== null && typeof position !== 'object') {
			throw new GeoPositionError(
				`GeoPosition: position must be an object, got ${typeof position}`,
			);
		}
		const coords = GeoPosition.parseCoords(position?.coords);

		this.geolocationPosition = position
			? Object.freeze({ timestamp: position.timestamp, coords })
			: null;
		this.coords = Object.keys(coords).length > 0 ? coords : null;
		this.latitude = coords.latitude;
		this.longitude = coords.longitude;
		this.accuracy = coords.accuracy;
		this.accuracyQuality = GeoPosition.getAccuracyQuality(coords.accuracy ?? Infinity);
		this.altitude = coords.altitude;
		this.altitudeAccuracy = coords.altitudeAccuracy;
		this.heading = coords.heading;
		this.speed = coords.speed;
		this.timestamp = position?.timestamp;
		Object.freeze(this);
	}

	/**
	 * Extracts and deeply freezes coordinate properties from a raw coords object.
	 *
	 * **Why explicit extraction instead of spread?**
	 * The browser's `GeolocationCoordinates` exposes all properties (latitude,
	 * longitude, accuracy, etc.) via non-enumerable getters. The spread operator
	 * and `Object.assign` only copy enumerable own properties, so `{ ...rawCoords }`
	 * silently produces `{}`. Explicit property access by name works regardless of
	 * enumerability.
	 *
	 * **Why freeze the returned object?**
	 * The coords object is referenced both from `this.coords` and from the nested
	 * `geolocationPosition.coords`. Freezing at this level ensures immutability
	 * is enforced on the shared reference before either property is assigned,
	 * without requiring a second freeze pass later.
	 *
	 * @private
	 * @param {GeoCoords} [rawCoords] - Raw coords from a GeolocationPosition or plain object
	 * @returns {Readonly<GeoCoords>} Frozen defensive copy of the coordinate properties
	 */
	private static parseCoords(rawCoords?: GeoCoords): Readonly<GeoCoords> {
		if (!rawCoords) return Object.freeze({});
		return Object.freeze({
			latitude: rawCoords.latitude,
			longitude: rawCoords.longitude,
			accuracy: rawCoords.accuracy,
			altitude: rawCoords.altitude,
			altitudeAccuracy: rawCoords.altitudeAccuracy,
			heading: rawCoords.heading,
			speed: rawCoords.speed,
		});
	}

	/**
	 * Factory method — creates a GeoPosition from a GeoPositionInput.
	 * 
	 * @param {GeoPositionInput} position - Raw position input
	 * @returns {GeoPosition} New immutable GeoPosition instance
	 * 
	 * @example
	 * const pos = GeoPosition.from(browserPosition);
	 * 
	 * @since 0.6.0-alpha
	 */
	static from(position: GeoPositionInput): GeoPosition {
		return new GeoPosition(position);
	}

	/**
	 * Classifies GPS accuracy into quality levels based on accuracy value in meters.
	 * 
	 * Provides a standardized way to assess the quality of GPS position data
	 * based on the accuracy reported by the device. Lower values indicate better accuracy.
	 * 
	 * Quality Levels:
	 * - excellent: ≤ 10 meters (high precision, suitable for all applications)
	 * - good: 11-30 meters (good precision, suitable for most applications)  
	 * - medium: 31-100 meters (moderate precision, may be acceptable for some uses)
	 * - bad: 101-200 meters (poor precision, generally not recommended)
	 * - very bad: > 200 meters (very poor precision, should be rejected)
	 * 
	 * @static
	 * @param {number} accuracy - GPS accuracy value in meters; pass `Infinity` for unknown/missing accuracy
	 * @returns {AccuracyQuality} Quality classification
	 * 
	 * @example
	 * GeoPosition.getAccuracyQuality(5);        // 'excellent'
	 * GeoPosition.getAccuracyQuality(25);       // 'good'
	 * GeoPosition.getAccuracyQuality(75);       // 'medium'
	 * GeoPosition.getAccuracyQuality(150);      // 'bad'
	 * GeoPosition.getAccuracyQuality(500);      // 'very bad'
	 * GeoPosition.getAccuracyQuality(Infinity); // 'very bad'
	 * 
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/GeolocationCoordinates/accuracy} GeolocationCoordinates.accuracy
	 * @since 0.6.0-alpha
	 */
	static getAccuracyQuality(accuracy: number): AccuracyQuality {
		if (accuracy <= ACCURACY_THRESHOLDS.EXCELLENT) {
			return "excellent";
		} else if (accuracy <= ACCURACY_THRESHOLDS.GOOD) {
			return "good";
		} else if (accuracy <= ACCURACY_THRESHOLDS.MEDIUM) {
			return "medium";
		} else if (accuracy <= ACCURACY_THRESHOLDS.BAD) {
			return "bad";
		} else {
			return "very bad";
		}
	}

	/**
	 * Calculates the accuracy quality for the current position.
	 * 
	 * @returns {AccuracyQuality} Quality classification for current position accuracy
	 * 
	 * @example
	 * const pos = new GeoPosition(position);
	 * pos.calculateAccuracyQuality(); // 'good'
	 * 
	 * @since 0.6.0-alpha
	 * @deprecated Use the `accuracyQuality` property instead.
	 */
	calculateAccuracyQuality(): AccuracyQuality {
		return GeoPosition.getAccuracyQuality(this.accuracy ?? Infinity);
	}

	/**
	 * Calculates the distance between this position and another position.
	 * 
	 * Uses the Haversine formula to compute the great-circle distance between
	 * two geographic points. Useful for determining how far the device has
	 * moved or measuring distances to other locations.
	 * 
	 * @param {Object} otherPosition - Other position to calculate distance to
	 * @param {number} otherPosition.latitude - Latitude of other position in decimal degrees
	 * @param {number} otherPosition.longitude - Longitude of other position in decimal degrees
	 * @returns {number} Distance in meters, or `NaN` if this position has no coordinates
	 * 
	 * @example
	 * const pos = new GeoPosition(currentPosition);
	 * const restaurant = { latitude: -23.5489, longitude: -46.6388 };
	 * const distance = pos.distanceTo(restaurant);
	 * console.log(`Restaurant is ${Math.round(distance)} meters away`);
	 * 
	 * @see {@link calculateDistance} - The underlying distance calculation function
	 * @since 0.6.0-alpha
	 */
	distanceTo(otherPosition: { latitude: number; longitude: number }): number {
		if (this.latitude === undefined || this.longitude === undefined) {
			return NaN;
		}
		return calculateDistance(
			this.latitude,
			this.longitude,
			otherPosition.latitude,
			otherPosition.longitude,
		);
	}

	/**
	 * Returns a string representation of the GeoPosition instance.
	 * 
	 * Provides a formatted summary of key position properties for debugging
	 * and logging purposes.
	 * 
	 * @returns {string} Formatted string with position details
	 * 
	 * @example
	 * const position = new GeoPosition(geolocationPosition);
	 * console.log(position.toString());
	 * // Output: "GeoPosition: -23.5505, -46.6333, good, 760, 0, 0, 1634567890123"
	 * 
	 * @since 0.6.0-alpha
	 */
	toString(): string {
		if (!this.latitude || !this.longitude) {
			return `${this.constructor.name}: No position data`;
		}
		return `${this.constructor.name}: ${this.latitude}, ${this.longitude}, ${this.accuracyQuality}, ${this.altitude}, ${this.speed}, ${this.heading}, ${this.timestamp}`;
	}
}

export default GeoPosition;
