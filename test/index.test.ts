// src/index.test.ts
import { GeoPosition, GeoPositionError, calculateDistance, EARTH_RADIUS_METERS, delay } from './index';
import type { GeoCoords, GeoPositionInput, AccuracyQuality } from './index';

describe('paraty_geocore.js index exports', () => {
  describe('GeoPosition', () => {
    it('should create a GeoPosition with valid coordinates', () => {
      const pos = new GeoPosition({ latitude: 40.7128, longitude: -74.006, accuracy: 5 });
      expect(pos.latitude).toBeCloseTo(40.7128);
      expect(pos.longitude).toBeCloseTo(-74.006);
      expect(pos.accuracy).toBe(5);
    });

    it('should throw GeoPositionError for invalid latitude', () => {
      expect(() => new GeoPosition({ latitude: 100, longitude: 0 })).toThrow(GeoPositionError);
    });

    it('should throw GeoPositionError for invalid longitude', () => {
      expect(() => new GeoPosition({ latitude: 0, longitude: 200 })).toThrow(GeoPositionError);
    });

    it('should handle edge case: latitude/longitude at bounds', () => {
      expect(() => new GeoPosition({ latitude: -90, longitude: -180 })).not.toThrow();
      expect(() => new GeoPosition({ latitude: 90, longitude: 180 })).not.toThrow();
    });

    it('should accept GeoPositionInput with accuracyQuality', () => {
      const pos = new GeoPosition({ latitude: 10, longitude: 10, accuracyQuality: 'high' as AccuracyQuality });
      expect(pos.accuracyQuality).toBe('high');
    });
  });

  describe('GeoPositionError', () => {
    it('should be instance of Error', () => {
      const err = new GeoPositionError('Invalid position');
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Invalid position');
    });
  });

  describe('calculateDistance', () => {
    it('should calculate correct distance between two points', () => {
      const a: GeoCoords = { latitude: 0, longitude: 0 };
      const b: GeoCoords = { latitude: 0, longitude: 1 };
      const dist = calculateDistance(a, b);
      expect(dist).toBeGreaterThan(0);
      expect(typeof dist).toBe('number');
    });

    it('should return 0 for identical points', () => {
      const a: GeoCoords = { latitude: 51.5, longitude: -0.1 };
      expect(calculateDistance(a, a)).toBeCloseTo(0);
    });

    it('should throw for invalid coordinates', () => {
      const a: GeoCoords = { latitude: 91, longitude: 0 };
      const b: GeoCoords = { latitude: 0, longitude: 0 };
      expect(() => calculateDistance(a, b)).toThrow();
    });
  });

  describe('EARTH_RADIUS_METERS', () => {
    it('should be a positive number', () => {
      expect(EARTH_RADIUS_METERS).toBeGreaterThan(0);
      expect(typeof EARTH_RADIUS_METERS).toBe('number');
    });
  });

  describe('delay', () => {
    it('should resolve after specified ms', async () => {
      const start = Date.now();
      await delay(50);
      expect(Date.now() - start).toBeGreaterThanOrEqual(50);
    });

    it('should resolve immediately for 0 ms', async () => {
      const start = Date.now();
      await delay(0);
      expect(Date.now() - start).toBeLessThan(10);
    });

    it('should throw for negative ms', async () => {
      await expect(delay(-10)).rejects.toThrow();
    });
  });
});
