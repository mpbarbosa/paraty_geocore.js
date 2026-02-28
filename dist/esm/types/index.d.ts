/**
 * paraty_geocore.js — Core JavaScript classes for geolocation applications.
 *
 * @module paraty_geocore
 * @since 0.9.2-alpha
 * @author Marcelo Pereira Barbosa
 * @license MIT
 */
export { default as GeoPosition } from './core/GeoPosition.js';
export type { GeoCoords, GeoPositionInput, AccuracyQuality } from './core/GeoPosition.js';
export { GeoPositionError } from './core/errors.js';
export { calculateDistance, EARTH_RADIUS_METERS } from './utils/distance.js';
export { delay } from './utils/async.js';
