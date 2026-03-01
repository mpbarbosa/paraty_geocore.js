/**
 * Shared test fixtures and constants for paraty_geocore.js test suites.
 *
 * Import these instead of repeating magic values across test files.
 */
import type { GeoPositionInput } from '../../src/core/GeoPosition';
/**
 * A stable, well-known Unix timestamp used across unit and integration tests.
 * Corresponds to 2023-11-14T22:13:20.000Z — arbitrary but consistent.
 */
export declare const TEST_TIMESTAMP = 1700000000000;
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
export declare function makeGeoPositionInput(lat: number, lon: number, accuracy?: number): GeoPositionInput;
