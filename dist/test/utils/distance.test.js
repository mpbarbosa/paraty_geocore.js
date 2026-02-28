"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Unit tests for utils/distance
 *
 * Covers: EARTH_RADIUS_METERS, calculateDistance
 * FRS: AC-DI-01 through AC-DI-04
 */
const distance_1 = require("../../src/utils/distance");
// ---------------------------------------------------------------------------
// Known reference points
// ---------------------------------------------------------------------------
const SAO_PAULO = { lat: -23.5505, lon: -46.6333 };
const RIO_DE_JANEIRO = { lat: -22.9068, lon: -43.1729 };
// Haversine result for the exact coordinates above (matches integration test fixture)
const SP_RIO_METERS = 360748;
describe('EARTH_RADIUS_METERS', () => {
    it('equals 6,371,000 m (mean Earth radius)', () => {
        // AC-DI-04
        expect(distance_1.EARTH_RADIUS_METERS).toBe(6371000);
    });
    it('is a positive finite number', () => {
        expect(distance_1.EARTH_RADIUS_METERS).toBeGreaterThan(0);
        expect(Number.isFinite(distance_1.EARTH_RADIUS_METERS)).toBe(true);
    });
});
describe('calculateDistance', () => {
    describe('AC-DI-02 — same-point distance is zero', () => {
        it('returns 0 for identical coordinates', () => {
            expect((0, distance_1.calculateDistance)(0, 0, 0, 0)).toBe(0);
        });
        it('returns 0 for identical non-zero coordinates', () => {
            expect((0, distance_1.calculateDistance)(SAO_PAULO.lat, SAO_PAULO.lon, SAO_PAULO.lat, SAO_PAULO.lon)).toBe(0);
        });
    });
    describe('AC-DI-01 — correct distance for known points', () => {
        it('São Paulo → Rio de Janeiro is within 1% of Haversine reference', () => {
            const d = (0, distance_1.calculateDistance)(SAO_PAULO.lat, SAO_PAULO.lon, RIO_DE_JANEIRO.lat, RIO_DE_JANEIRO.lon);
            expect(d).toBeCloseTo(SP_RIO_METERS, -3); // within 1,000 m
            expect(Math.abs(d - SP_RIO_METERS) / SP_RIO_METERS).toBeLessThan(0.01);
        });
        it('1° latitude apart ≈ 111,195 m at the equator', () => {
            const d = (0, distance_1.calculateDistance)(0, 0, 1, 0);
            expect(d).toBeCloseTo(111195, -2); // within 100 m
        });
        it('1° longitude apart ≈ 111,195 m at the equator', () => {
            const d = (0, distance_1.calculateDistance)(0, 0, 0, 1);
            expect(d).toBeCloseTo(111195, -2);
        });
    });
    describe('AC-DI-03 — pure function behaviour', () => {
        it('returns the same value on repeated calls with the same input', () => {
            const args = [SAO_PAULO.lat, SAO_PAULO.lon, RIO_DE_JANEIRO.lat, RIO_DE_JANEIRO.lon];
            const r1 = (0, distance_1.calculateDistance)(...args);
            const r2 = (0, distance_1.calculateDistance)(...args);
            const r3 = (0, distance_1.calculateDistance)(...args);
            expect(r1).toBe(r2);
            expect(r2).toBe(r3);
        });
        it('does not modify its arguments', () => {
            const lat1 = -23.5505, lon1 = -46.6333, lat2 = -22.9068, lon2 = -43.1729;
            (0, distance_1.calculateDistance)(lat1, lon1, lat2, lon2);
            expect(lat1).toBe(-23.5505);
            expect(lon1).toBe(-46.6333);
        });
    });
    describe('symmetry — A→B equals B→A', () => {
        it('SP→RIO and RIO→SP produce the same distance', () => {
            const forward = (0, distance_1.calculateDistance)(SAO_PAULO.lat, SAO_PAULO.lon, RIO_DE_JANEIRO.lat, RIO_DE_JANEIRO.lon);
            const reverse = (0, distance_1.calculateDistance)(RIO_DE_JANEIRO.lat, RIO_DE_JANEIRO.lon, SAO_PAULO.lat, SAO_PAULO.lon);
            expect(Math.abs(forward - reverse)).toBeLessThan(0.001); // floating-point tolerance
        });
    });
    describe('return type and range', () => {
        it('always returns a non-negative number', () => {
            expect((0, distance_1.calculateDistance)(0, 0, 0, 0)).toBeGreaterThanOrEqual(0);
            expect((0, distance_1.calculateDistance)(SAO_PAULO.lat, SAO_PAULO.lon, RIO_DE_JANEIRO.lat, RIO_DE_JANEIRO.lon)).toBeGreaterThanOrEqual(0);
        });
        it('distance cannot exceed half the Earth circumference (~20,015 km)', () => {
            // Antipodal points: maximum possible Haversine distance
            const antipodal = (0, distance_1.calculateDistance)(90, 0, -90, 0);
            expect(antipodal).toBeLessThanOrEqual(Math.PI * distance_1.EARTH_RADIUS_METERS + 1); // π × R
        });
        it('returns a finite number for all valid inputs', () => {
            expect(Number.isFinite((0, distance_1.calculateDistance)(0, 0, 0, 0))).toBe(true);
            expect(Number.isFinite((0, distance_1.calculateDistance)(90, 180, -90, -180))).toBe(true);
        });
    });
    describe('boundary coordinates', () => {
        it('handles poles (lat ±90)', () => {
            const d = (0, distance_1.calculateDistance)(90, 0, -90, 0);
            expect(Number.isFinite(d)).toBe(true);
            expect(d).toBeGreaterThan(0);
        });
        it('handles antimeridian (lon ±180)', () => {
            const d = (0, distance_1.calculateDistance)(0, 180, 0, -180);
            expect(Number.isFinite(d)).toBe(true);
            expect(d).toBeCloseTo(0, -1); // ±180 longitude is the same meridian
        });
    });
});
