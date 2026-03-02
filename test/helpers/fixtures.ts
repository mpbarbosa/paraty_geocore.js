/**
 * Shared test fixtures and constants for paraty_geocore.js test suites.
 *
 * Import these instead of repeating magic values across test files.
 */

import type { GeoPositionInput } from '../../src/core/GeoPosition';

// ---------------------------------------------------------------------------
// Browser GeolocationPosition simulation
// ---------------------------------------------------------------------------

export interface FakeCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

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
export function makeBrowserPosition(coords: FakeCoords, timestamp = TEST_TIMESTAMP): object {
  const coordsObj = Object.create(null);
  for (const [key, value] of Object.entries(coords) as [keyof FakeCoords, unknown][]) {
    Object.defineProperty(coordsObj, key, {
      get: () => value ?? null,
      enumerable: false,  // non-enumerable: spread/assign yields {}
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
export const TEST_TIMESTAMP = 1_700_000_000_000;

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
export function makeGeoPositionInput(lat: number, lon: number, accuracy = 10): GeoPositionInput {
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
    timestamp: TEST_TIMESTAMP,
  };
}
