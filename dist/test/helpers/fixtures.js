"use strict";
/**
 * Shared test fixtures and constants for paraty_geocore.js test suites.
 *
 * Import these instead of repeating magic values across test files.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_TIMESTAMP = void 0;
exports.makeBrowserPosition = makeBrowserPosition;
exports.makeGeoPositionInput = makeGeoPositionInput;
/**
 * Creates a GeolocationPosition-like object whose coords properties are
 * exposed as non-enumerable getters — identical to Chrome / Firefox behaviour.
 *
 * Use this in tests that must verify GeoPosition handles the real browser API
 * (where spread / Object.assign on coords produces an empty object).
 *
 * @param coords - Coordinate values to expose via non-enumerable getters
 * @param timestamp - Position timestamp (defaults to {@link TEST_TIMESTAMP})
 */
function makeBrowserPosition(coords, timestamp = exports.TEST_TIMESTAMP) {
    const coordsObj = Object.create(null);
    for (const [key, value] of Object.entries(coords)) {
        Object.defineProperty(coordsObj, key, {
            get: () => value ?? null,
            enumerable: false, // non-enumerable: spread/assign yields {}
            configurable: false,
        });
    }
    const positionObj = Object.create(null);
    Object.defineProperty(positionObj, 'coords', { get: () => coordsObj, enumerable: true });
    Object.defineProperty(positionObj, 'timestamp', { get: () => timestamp, enumerable: true });
    return positionObj;
}
/**
 * A stable, well-known Unix timestamp used across unit and integration tests.
 * Corresponds to 2023-11-14T22:13:20.000Z — arbitrary but consistent.
 */
exports.TEST_TIMESTAMP = 1700000000000;
/**
 * Creates a minimal {@link GeoPositionInput} for use in unit tests.
 *
 * All optional coord fields default to `null`; `timestamp` is always
 * {@link TEST_TIMESTAMP} to prevent non-deterministic `Date.now()` values
 * from leaking into test output.
 *
 * @param lat - Latitude in decimal degrees
 * @param lon - Longitude in decimal degrees
 * @param accuracy - GPS accuracy in metres (default: 10)
 */
function makeGeoPositionInput(lat, lon, accuracy = 10) {
    return {
        coords: {
            latitude: lat,
            longitude: lon,
            accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
        },
        timestamp: exports.TEST_TIMESTAMP,
    };
}
