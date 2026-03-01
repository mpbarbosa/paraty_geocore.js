"use strict";
/**
 * Edge-case tests for GeoPosition.
 *
 * Covers unusual, boundary, and malformed inputs not exercised by the main unit tests.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GeoPosition_1 = __importDefault(require("../../src/core/GeoPosition"));
const errors_1 = require("../../src/core/errors");
describe('GeoPosition — edge cases', () => {
    // -------------------------------------------------------------------------
    // Input validation / error handling
    // -------------------------------------------------------------------------
    describe('constructor — invalid primitive input', () => {
        it.each([42, 'string', true, Symbol('s')])('throws GeoPositionError for primitive: %p', (primitive) => {
            expect(() => new GeoPosition_1.default(primitive)).toThrow(errors_1.GeoPositionError);
            expect(() => new GeoPosition_1.default(primitive)).toThrow(/must be an object/);
        });
        it('thrown error is also an instance of Error', () => {
            expect(() => new GeoPosition_1.default(99)).toThrow(Error);
        });
        it('thrown error has name "GeoPositionError"', () => {
            expect(() => new GeoPosition_1.default('bad')).toThrow(expect.objectContaining({ name: 'GeoPositionError' }));
        });
        it('accepts null-ish objects gracefully (no throw)', () => {
            expect(() => new GeoPosition_1.default({})).not.toThrow();
            expect(() => new GeoPosition_1.default({ coords: undefined })).not.toThrow();
        });
    });
    // -------------------------------------------------------------------------
    // Extreme coordinate values
    // -------------------------------------------------------------------------
    describe('extreme coordinate values', () => {
        it('handles latitude = +90 (North Pole)', () => {
            const pos = new GeoPosition_1.default({ coords: { latitude: 90, longitude: 0, accuracy: 5 } });
            expect(pos.latitude).toBe(90);
            expect(pos.accuracyQuality).toBe('excellent');
        });
        it('handles latitude = -90 (South Pole)', () => {
            const pos = new GeoPosition_1.default({ coords: { latitude: -90, longitude: 0, accuracy: 5 } });
            expect(pos.latitude).toBe(-90);
        });
        it('handles longitude = +180 (antimeridian east)', () => {
            const pos = new GeoPosition_1.default({ coords: { latitude: 0, longitude: 180, accuracy: 10 } });
            expect(pos.longitude).toBe(180);
        });
        it('handles longitude = -180 (antimeridian west)', () => {
            const pos = new GeoPosition_1.default({ coords: { latitude: 0, longitude: -180, accuracy: 10 } });
            expect(pos.longitude).toBe(-180);
        });
        it('handles very large positive accuracy', () => {
            const pos = new GeoPosition_1.default({ coords: { latitude: 0, longitude: 0, accuracy: 1000000 } });
            expect(pos.accuracyQuality).toBe('very bad');
        });
        it('handles accuracy = 0', () => {
            const pos = new GeoPosition_1.default({ coords: { latitude: 0, longitude: 0, accuracy: 0 } });
            // 0 ≤ 10 → excellent
            expect(pos.accuracyQuality).toBe('excellent');
        });
        it('handles altitude = 0 (sea level)', () => {
            const pos = new GeoPosition_1.default({ coords: { latitude: 1, longitude: 1, accuracy: 5, altitude: 0 } });
            expect(pos.altitude).toBe(0);
        });
    });
    // -------------------------------------------------------------------------
    // NaN and Infinity coordinates
    // -------------------------------------------------------------------------
    describe('NaN and Infinity coordinates', () => {
        it('stores NaN latitude without throwing', () => {
            const pos = new GeoPosition_1.default({ coords: { latitude: NaN, longitude: 0, accuracy: 5 } });
            expect(Number.isNaN(pos.latitude)).toBe(true);
        });
        it('stores Infinity longitude without throwing', () => {
            const pos = new GeoPosition_1.default({ coords: { latitude: 0, longitude: Infinity, accuracy: 5 } });
            expect(pos.longitude).toBe(Infinity);
        });
        it('getAccuracyQuality with NaN accuracy returns "very bad"', () => {
            // NaN > 200 is false; NaN comparisons all return false → falls through to else
            expect(GeoPosition_1.default.getAccuracyQuality(NaN)).toBe('very bad');
        });
        it('getAccuracyQuality with Infinity returns "very bad"', () => {
            expect(GeoPosition_1.default.getAccuracyQuality(Infinity)).toBe('very bad');
        });
        it('getAccuracyQuality with -Infinity returns "excellent" (≤ 10)', () => {
            // -Infinity ≤ 10 → true
            expect(GeoPosition_1.default.getAccuracyQuality(-Infinity)).toBe('excellent');
        });
    });
    // -------------------------------------------------------------------------
    // Partial / missing coordinate properties
    // -------------------------------------------------------------------------
    describe('partial coordinate objects', () => {
        it('missing accuracy → accuracyQuality is "very bad" (Infinity fallback)', () => {
            const pos = new GeoPosition_1.default({ coords: { latitude: 1, longitude: 2 } });
            expect(pos.accuracy).toBeUndefined();
            expect(pos.accuracyQuality).toBe('very bad');
        });
        it('altitude null is preserved', () => {
            const pos = new GeoPosition_1.default({ coords: { latitude: 1, longitude: 2, accuracy: 5, altitude: null } });
            expect(pos.altitude).toBeNull();
        });
        it('heading null is preserved', () => {
            const pos = new GeoPosition_1.default({ coords: { latitude: 1, longitude: 2, accuracy: 5, heading: null } });
            expect(pos.heading).toBeNull();
        });
        it('speed null is preserved', () => {
            const pos = new GeoPosition_1.default({ coords: { latitude: 1, longitude: 2, accuracy: 5, speed: null } });
            expect(pos.speed).toBeNull();
        });
        it('missing timestamp leaves timestamp undefined', () => {
            const pos = new GeoPosition_1.default({ coords: { latitude: 1, longitude: 2, accuracy: 5 } });
            expect(pos.timestamp).toBeUndefined();
        });
    });
    // -------------------------------------------------------------------------
    // toString edge cases
    // -------------------------------------------------------------------------
    describe('toString edge cases', () => {
        it('latitude 0 is treated as falsy → "No position data" (known limitation)', () => {
            const pos = new GeoPosition_1.default({ coords: { latitude: 0, longitude: 0 } });
            expect(pos.toString()).toBe('GeoPosition: No position data');
        });
        it('valid non-zero coordinates produce full string', () => {
            const pos = new GeoPosition_1.default({
                timestamp: 1000,
                coords: { latitude: 1, longitude: 2, accuracy: 10, altitude: null, speed: null, heading: null },
            });
            expect(pos.toString()).toBe('GeoPosition: 1, 2, excellent, null, null, null, 1000');
        });
    });
    // -------------------------------------------------------------------------
    // distanceTo edge cases
    // -------------------------------------------------------------------------
    describe('distanceTo edge cases', () => {
        it('returns NaN when both latitude and longitude are undefined', () => {
            const pos = new GeoPosition_1.default({});
            expect(pos.distanceTo({ latitude: 0, longitude: 0 })).toBeNaN();
        });
        it('calculates distance across the antimeridian (longitude wrap)', () => {
            // Both points near ±180° longitude
            const a = new GeoPosition_1.default({ coords: { latitude: 0, longitude: 179, accuracy: 5 } });
            const distance = a.distanceTo({ latitude: 0, longitude: -179 });
            // ~222 km for 2° along equator
            expect(distance).toBeGreaterThan(0);
            expect(distance).toBeLessThan(300000);
        });
        it('distance between poles is approximately 20,000 km', () => {
            const north = new GeoPosition_1.default({ coords: { latitude: 90, longitude: 0, accuracy: 5 } });
            const south = { latitude: -90, longitude: 0 };
            const distance = north.distanceTo(south);
            // Half the Earth's circumference ≈ 20,015 km
            expect(distance).toBeGreaterThan(19900000);
            expect(distance).toBeLessThan(20100000);
        });
    });
    // -------------------------------------------------------------------------
    // getAccuracyQuality boundary values
    // -------------------------------------------------------------------------
    describe('getAccuracyQuality — boundary values', () => {
        it.each([
            [0, 'excellent'],
            [10, 'excellent'],
            [10.0001, 'good'],
            [30, 'good'],
            [30.0001, 'medium'],
            [100, 'medium'],
            [100.0001, 'bad'],
            [200, 'bad'],
            [200.0001, 'very bad'],
        ])('accuracy %d → "%s"', (accuracy, expected) => {
            expect(GeoPosition_1.default.getAccuracyQuality(accuracy)).toBe(expected);
        });
    });
});
