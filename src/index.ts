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

export { default as ObserverSubject } from './core/ObserverSubject.js';
export { default as DualObserverSubject } from './core/DualObserverSubject.js';
export type { ObserverObject, ObserverFunction } from './core/DualObserverSubject.js';

export { withObserver } from './core/ObserverMixin.js';
export type { ObserverMixinOptions, ObserverMixinResult } from './core/ObserverMixin.js';

export { default as GeocodingState } from './core/GeocodingState.js';
export type { GeocodingStateSnapshot } from './core/GeocodingState.js';

export { GeoPositionError } from './core/errors.js';

export { calculateDistance, EARTH_RADIUS_METERS } from './utils/distance.js';

export { delay } from './utils/async.js';

export { default as PositionManager, createPositionManagerConfig, initializeConfig } from './core/PositionManager.js';
export type { PositionManagerConfig } from './core/PositionManager.js';

export { log, warn } from './utils/logger.js';

export { default as ReferencePlace, NO_REFERENCE_PLACE, VALID_REF_PLACE_CLASSES } from './core/ReferencePlace.js';
export type { OsmElement } from './core/ReferencePlace.js';
