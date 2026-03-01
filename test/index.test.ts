/**
 * Smoke / contract tests for the public re-export surface of src/index.ts.
 *
 * These tests confirm that every symbol advertised by the package entry-point
 * is exported, has the correct shape, and behaves as documented.
 */
import {
  GeoPosition,
  GeoPositionError,
  calculateDistance,
  EARTH_RADIUS_METERS,
  delay,
} from '../src/index';
import type { GeoCoords, GeoPositionInput, AccuracyQuality } from '../src/index';
import { TEST_TIMESTAMP } from './helpers/fixtures';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid GeoPositionInput using the coords-wrapper shape. */
function makeInput(lat: number, lon: number, accuracy = 10): GeoPositionInput {
  return { coords: { latitude: lat, longitude: lon, accuracy }, timestamp: TEST_TIMESTAMP };
}

// ---------------------------------------------------------------------------
// GeoPosition
// ---------------------------------------------------------------------------

describe('GeoPosition (exported from index)', () => {
  it('is the default export and is a constructor', () => {
    expect(typeof GeoPosition).toBe('function');
  });

  it('creates an instance from a valid GeoPositionInput', () => {
    const pos = new GeoPosition(makeInput(40.7128, -74.006, 5));
    expect(pos.latitude).toBe(40.7128);
    expect(pos.longitude).toBe(-74.006);
    expect(pos.accuracy).toBe(5);
    expect(pos.timestamp).toBe(TEST_TIMESTAMP);
  });

  it('instance is frozen (immutable)', () => {
    const pos = new GeoPosition(makeInput(0, 0));
    expect(Object.isFrozen(pos)).toBe(true);
  });

  it('throws GeoPositionError when given a primitive', () => {
    expect(() => new GeoPosition(42 as any)).toThrow(GeoPositionError);
    expect(() => new GeoPosition('string' as any)).toThrow(GeoPositionError);
    expect(() => new GeoPosition(true as any)).toThrow(GeoPositionError);
  });

  it.each<[number, number]>([
    [-90, -180],
    [90, 180],
    [0, 0],
  ])('does NOT throw for extreme-but-valid coordinates: %p, %p', (lat, lon) => {
    expect(() => new GeoPosition(makeInput(lat, lon))).not.toThrow();
  });

  it('returns no-position string from toString() when coords are absent', () => {
    const pos = new GeoPosition({} as GeoPositionInput);
    expect(pos.toString()).toMatch(/No position data/);
  });

  describe('GeoPosition.from() factory', () => {
    it('returns a GeoPosition equal to new GeoPosition()', () => {
      const input = makeInput(-23.5505, -46.6333, 12);
      const a = new GeoPosition(input);
      const b = GeoPosition.from(input);
      expect(b.latitude).toBe(a.latitude);
      expect(b.longitude).toBe(a.longitude);
    });
  });

  describe('GeoPosition.getAccuracyQuality() static method', () => {
    it.each<[number, AccuracyQuality]>([
      [5,       'excellent'],
      [10,      'excellent'],
      [11,      'good'],
      [30,      'good'],
      [31,      'medium'],
      [100,     'medium'],
      [101,     'bad'],
      [200,     'bad'],
      [201,     'very bad'],
      [Infinity,'very bad'],
    ])('accuracy %dm → "%s"', (accuracy, expected) => {
      expect(GeoPosition.getAccuracyQuality(accuracy)).toBe(expected);
    });
  });
});

// ---------------------------------------------------------------------------
// GeoPositionError
// ---------------------------------------------------------------------------

describe('GeoPositionError (exported from index)', () => {
  it('is a named export', () => {
    expect(typeof GeoPositionError).toBe('function');
  });

  it('is instanceof Error and instanceof GeoPositionError', () => {
    const err = new GeoPositionError('test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(GeoPositionError);
  });

  it('sets name to "GeoPositionError"', () => {
    expect(new GeoPositionError('x').name).toBe('GeoPositionError');
  });

  it('preserves message', () => {
    expect(new GeoPositionError('bad input').message).toBe('bad input');
  });
});

// ---------------------------------------------------------------------------
// calculateDistance
// ---------------------------------------------------------------------------

describe('calculateDistance (exported from index)', () => {
  it('is a function', () => {
    expect(typeof calculateDistance).toBe('function');
  });

  it('returns 0 for identical points', () => {
    expect(calculateDistance(0, 0, 0, 0)).toBe(0);
  });

  it('returns a positive number for distinct points', () => {
    const d = calculateDistance(0, 0, 0, 1);
    expect(d).toBeGreaterThan(0);
    expect(typeof d).toBe('number');
  });

  it('SP→RIO is approximately 360,748 m', () => {
    const d = calculateDistance(-23.5505, -46.6333, -22.9068, -43.1729);
    expect(d).toBeCloseTo(360_748, -3);
  });

  it('is symmetric (A→B equals B→A)', () => {
    const d1 = calculateDistance(-23.5505, -46.6333, -22.9068, -43.1729);
    const d2 = calculateDistance(-22.9068, -43.1729, -23.5505, -46.6333);
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
  });
});

// ---------------------------------------------------------------------------
// EARTH_RADIUS_METERS
// ---------------------------------------------------------------------------

describe('EARTH_RADIUS_METERS (exported from index)', () => {
  it('equals 6,371,000', () => {
    expect(EARTH_RADIUS_METERS).toBe(6_371_000);
  });

  it('is a finite positive number', () => {
    expect(EARTH_RADIUS_METERS).toBeGreaterThan(0);
    expect(Number.isFinite(EARTH_RADIUS_METERS)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// delay
// ---------------------------------------------------------------------------

describe('delay (exported from index)', () => {
  it('is a function that returns a Promise', () => {
    const p = delay(0);
    expect(p).toBeInstanceOf(Promise);
    return p; // ensure the promise resolves so no open handles
  });

  it('resolves after the specified milliseconds', async () => {
    const start = Date.now();
    await delay(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(45); // allow ±5ms for timer imprecision
  });

  it('resolves immediately for delay(0)', async () => {
    const start = Date.now();
    await delay(0);
    expect(Date.now() - start).toBeLessThan(20);
  });

  it('delay with large ms resolves correctly (fake timers)', async () => {
    jest.useFakeTimers();
    const p = delay(5000);
    jest.advanceTimersByTime(5000);
    await expect(p).resolves.toBeUndefined();
    jest.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// Type exports (compile-time smoke test — no runtime assertions needed)
// ---------------------------------------------------------------------------

describe('TypeScript type exports', () => {
  it('GeoCoords can be used as a type annotation without error', () => {
    const coords: GeoCoords = { latitude: 10, longitude: 20, accuracy: 5 };
    expect(coords.latitude).toBe(10);
  });

  it('GeoPositionInput can be used as a type annotation without error', () => {
    const input: GeoPositionInput = { coords: { latitude: 0, longitude: 0 }, timestamp: 0 };
    expect(input.timestamp).toBe(0);
  });

  it('AccuracyQuality covers all expected literal values', () => {
    const values: AccuracyQuality[] = ['excellent', 'good', 'medium', 'bad', 'very bad'];
    expect(values).toHaveLength(5);
  });
});

