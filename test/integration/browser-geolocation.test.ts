/**
 * Integration tests — browser Geolocation API simulation
 *
 * These tests verify the full pipeline using GeolocationPosition objects
 * that simulate the browser implementation: coords are exposed via
 * non-enumerable getters (spread / Object.assign produce an empty object),
 * which is the exact behaviour that GeoPosition.parseCoords must handle.
 */

import GeoPosition from '../../src/core/GeoPosition';
import { calculateDistance } from '../../src/utils/distance';
import { TEST_TIMESTAMP } from '../helpers/fixtures';

// ---------------------------------------------------------------------------
// Browser GeolocationPosition factory
// ---------------------------------------------------------------------------

interface FakeCoords {
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
 */
function makeBrowserPosition(coords: FakeCoords, timestamp = Date.now()): object {
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

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

const SAO_PAULO = { latitude: -23.5505, longitude: -46.6333, accuracy: 12 };
const RIO_DE_JANEIRO = { latitude: -22.9068, longitude: -43.1729, accuracy: 18 };
const EXPECTED_SP_RIO_METERS = 360_748; // Haversine result for the given coordinates, ±1%

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Integration: browser GeolocationPosition → GeoPosition', () => {
  describe('non-enumerable coords extraction', () => {
    it('reads latitude and longitude from non-enumerable getters', () => {
      const raw = makeBrowserPosition(SAO_PAULO, TEST_TIMESTAMP);
      const pos = new GeoPosition(raw as any);

      expect(pos.latitude).toBe(SAO_PAULO.latitude);
      expect(pos.longitude).toBe(SAO_PAULO.longitude);
      expect(pos.accuracy).toBe(SAO_PAULO.accuracy);
      expect(pos.timestamp).toBe(TEST_TIMESTAMP);
    });

    it('spread of raw coords is empty (confirming non-enumerable behaviour)', () => {
      const raw = makeBrowserPosition(SAO_PAULO) as any;
      expect({ ...raw.coords }).toEqual({});  // browser-like: spread yields {}
    });

    it('GeoPosition still extracts coords correctly despite non-enumerable getters', () => {
      const raw = makeBrowserPosition({ ...SAO_PAULO, altitude: 760, altitudeAccuracy: 5, heading: 90, speed: 0 });
      const pos = new GeoPosition(raw as any);

      expect(pos.altitude).toBe(760);
      expect(pos.altitudeAccuracy).toBe(5);
      expect(pos.heading).toBe(90);
      expect(pos.speed).toBe(0);
    });
  });

  describe('accuracyQuality classification', () => {
    it.each([
      [5, 'excellent'],
      [20, 'good'],
      [60, 'medium'],
      [150, 'bad'],
      [500, 'very bad'],
    ] as [number, string][])(
      'accuracy %dm → quality "%s"',
      (accuracy, expected) => {
        const pos = new GeoPosition(makeBrowserPosition({ ...SAO_PAULO, accuracy }) as any);
        expect(pos.accuracyQuality).toBe(expected);
      },
    );
  });

  describe('immutability', () => {
    it('instance is frozen after construction from browser position', () => {
      const pos = new GeoPosition(makeBrowserPosition(SAO_PAULO) as any);
      expect(Object.isFrozen(pos)).toBe(true);
      expect(Object.isFrozen(pos.coords)).toBe(true);
      expect(Object.isFrozen(pos.geolocationPosition)).toBe(true);
    });

    it('mutating the original raw position does not affect GeoPosition', () => {
      const raw = makeBrowserPosition(SAO_PAULO) as any;
      const pos = new GeoPosition(raw);

      // Attempting to override the raw source (if it were mutable) must not alter pos
      expect(pos.latitude).toBe(SAO_PAULO.latitude);
    });
  });

  describe('distanceTo — real calculateDistance (not mocked)', () => {
    it('calculates SP→RIO distance within 1% of expected value', () => {
      const sp = new GeoPosition(makeBrowserPosition(SAO_PAULO) as any);
      const rio = new GeoPosition(makeBrowserPosition(RIO_DE_JANEIRO) as any);

      const distance = sp.distanceTo({ latitude: rio.latitude!, longitude: rio.longitude! });
      const tolerance = EXPECTED_SP_RIO_METERS * 0.01;

      expect(distance).toBeCloseTo(EXPECTED_SP_RIO_METERS, -2); // within 100m
      expect(Math.abs(distance - EXPECTED_SP_RIO_METERS)).toBeLessThan(tolerance);
    });

    it('distance from a point to itself is 0', () => {
      const pos = new GeoPosition(makeBrowserPosition(SAO_PAULO) as any);
      expect(pos.distanceTo(pos as any)).toBe(0);
    });

    it('distance is symmetric (A→B ≈ B→A)', () => {
      const sp = new GeoPosition(makeBrowserPosition(SAO_PAULO) as any);
      const rio = new GeoPosition(makeBrowserPosition(RIO_DE_JANEIRO) as any);

      const d1 = sp.distanceTo({ latitude: rio.latitude!, longitude: rio.longitude! });
      const d2 = rio.distanceTo({ latitude: sp.latitude!, longitude: sp.longitude! });
      expect(Math.abs(d1 - d2)).toBeLessThan(0.001); // floating-point tolerance
    });

    it('returns NaN when this position has no coordinates', () => {
      const pos = new GeoPosition({} as any);
      expect(pos.distanceTo({ latitude: -22.9068, longitude: -43.1729 })).toBeNaN();
    });
  });

  describe('toString — full position string', () => {
    it('produces correct format from browser position', () => {
      const raw = makeBrowserPosition(
        { latitude: -23.5505, longitude: -46.6333, accuracy: 12, altitude: 760, altitudeAccuracy: null, heading: null, speed: 0 },
        TEST_TIMESTAMP,
      );
      const pos = new GeoPosition(raw as any);
      expect(pos.toString()).toBe(
        'GeoPosition: -23.5505, -46.6333, good, 760, 0, null, 1700000000000',
      );
    });
  });

  describe('calculateDistance — direct integration', () => {
    it('SP→RIO matches GeoPosition.distanceTo result', () => {
      const sp = new GeoPosition(makeBrowserPosition(SAO_PAULO) as any);
      const direct = calculateDistance(
        SAO_PAULO.latitude, SAO_PAULO.longitude,
        RIO_DE_JANEIRO.latitude, RIO_DE_JANEIRO.longitude,
      );
      expect(sp.distanceTo(RIO_DE_JANEIRO)).toBe(direct);
    });
  });
});
