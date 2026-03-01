"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Smoke / contract tests for the public re-export surface of src/index.ts.
 *
 * These tests confirm that every symbol advertised by the package entry-point
 * is exported, has the correct shape, and behaves as documented.
 */
const index_1 = require("../src/index");
const fixtures_1 = require("./helpers/fixtures");
// ---------------------------------------------------------------------------
// GeoPosition
// ---------------------------------------------------------------------------
describe('GeoPosition (exported from index)', () => {
    it('is the default export and is a constructor', () => {
        expect(typeof index_1.GeoPosition).toBe('function');
    });
    it('creates an instance from a valid GeoPositionInput', () => {
        const pos = new index_1.GeoPosition((0, fixtures_1.makeGeoPositionInput)(40.7128, -74.006, 5));
        expect(pos.latitude).toBe(40.7128);
        expect(pos.longitude).toBe(-74.006);
        expect(pos.accuracy).toBe(5);
        expect(pos.timestamp).toBe(fixtures_1.TEST_TIMESTAMP);
    });
    it('instance is frozen (immutable)', () => {
        const pos = new index_1.GeoPosition((0, fixtures_1.makeGeoPositionInput)(0, 0));
        expect(Object.isFrozen(pos)).toBe(true);
    });
    it('throws GeoPositionError when given a primitive', () => {
        expect(() => new index_1.GeoPosition(42)).toThrow(index_1.GeoPositionError);
        expect(() => new index_1.GeoPosition('string')).toThrow(index_1.GeoPositionError);
        expect(() => new index_1.GeoPosition(true)).toThrow(index_1.GeoPositionError);
    });
    it.each([
        [-90, -180],
        [90, 180],
        [0, 0],
    ])('does NOT throw for extreme-but-valid coordinates: %p, %p', (lat, lon) => {
        expect(() => new index_1.GeoPosition((0, fixtures_1.makeGeoPositionInput)(lat, lon))).not.toThrow();
    });
    it('returns no-position string from toString() when coords are absent', () => {
        const pos = new index_1.GeoPosition({});
        expect(pos.toString()).toMatch(/No position data/);
    });
    describe('GeoPosition.from() factory', () => {
        it('returns a GeoPosition equal to new GeoPosition()', () => {
            const input = (0, fixtures_1.makeGeoPositionInput)(-23.5505, -46.6333, 12);
            const a = new index_1.GeoPosition(input);
            const b = index_1.GeoPosition.from(input);
            expect(b.latitude).toBe(a.latitude);
            expect(b.longitude).toBe(a.longitude);
        });
    });
    describe('GeoPosition.getAccuracyQuality() static method', () => {
        it.each([
            [5, 'excellent'],
            [10, 'excellent'],
            [11, 'good'],
            [30, 'good'],
            [31, 'medium'],
            [100, 'medium'],
            [101, 'bad'],
            [200, 'bad'],
            [201, 'very bad'],
            [Infinity, 'very bad'],
        ])('accuracy %dm → "%s"', (accuracy, expected) => {
            expect(index_1.GeoPosition.getAccuracyQuality(accuracy)).toBe(expected);
        });
    });
});
// ---------------------------------------------------------------------------
// GeoPositionError
// ---------------------------------------------------------------------------
describe('GeoPositionError (exported from index)', () => {
    it('is a named export', () => {
        expect(typeof index_1.GeoPositionError).toBe('function');
    });
    it('is instanceof Error and instanceof GeoPositionError', () => {
        const err = new index_1.GeoPositionError('test');
        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(index_1.GeoPositionError);
    });
    it('sets name to "GeoPositionError"', () => {
        expect(new index_1.GeoPositionError('x').name).toBe('GeoPositionError');
    });
    it('preserves message', () => {
        expect(new index_1.GeoPositionError('bad input').message).toBe('bad input');
    });
});
// ---------------------------------------------------------------------------
// calculateDistance
// ---------------------------------------------------------------------------
describe('calculateDistance (exported from index)', () => {
    it('is a function', () => {
        expect(typeof index_1.calculateDistance).toBe('function');
    });
    it('returns 0 for identical points', () => {
        expect((0, index_1.calculateDistance)(0, 0, 0, 0)).toBe(0);
    });
    it('returns a positive number for distinct points', () => {
        const d = (0, index_1.calculateDistance)(0, 0, 0, 1);
        expect(d).toBeGreaterThan(0);
        expect(typeof d).toBe('number');
    });
    it('SP→RIO is approximately 360,748 m', () => {
        const d = (0, index_1.calculateDistance)(-23.5505, -46.6333, -22.9068, -43.1729);
        expect(d).toBeCloseTo(360748, -3);
    });
    it('is symmetric (A→B equals B→A)', () => {
        const d1 = (0, index_1.calculateDistance)(-23.5505, -46.6333, -22.9068, -43.1729);
        const d2 = (0, index_1.calculateDistance)(-22.9068, -43.1729, -23.5505, -46.6333);
        expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
    });
});
// ---------------------------------------------------------------------------
// EARTH_RADIUS_METERS
// ---------------------------------------------------------------------------
describe('EARTH_RADIUS_METERS (exported from index)', () => {
    it('equals 6,371,000', () => {
        expect(index_1.EARTH_RADIUS_METERS).toBe(6371000);
    });
    it('is a finite positive number', () => {
        expect(index_1.EARTH_RADIUS_METERS).toBeGreaterThan(0);
        expect(Number.isFinite(index_1.EARTH_RADIUS_METERS)).toBe(true);
    });
});
// ---------------------------------------------------------------------------
// delay
// ---------------------------------------------------------------------------
describe('delay (exported from index)', () => {
    it('is a function that returns a Promise', () => {
        const p = (0, index_1.delay)(0);
        expect(p).toBeInstanceOf(Promise);
        return p; // ensure the promise resolves so no open handles
    });
    it('resolves after the specified milliseconds', async () => {
        const start = Date.now();
        await (0, index_1.delay)(50);
        expect(Date.now() - start).toBeGreaterThanOrEqual(45); // allow ±5ms for timer imprecision
    });
    it('resolves immediately for delay(0)', async () => {
        const start = Date.now();
        await (0, index_1.delay)(0);
        expect(Date.now() - start).toBeLessThan(20);
    });
    it('delay with large ms resolves correctly (fake timers)', async () => {
        jest.useFakeTimers();
        const p = (0, index_1.delay)(5000);
        jest.advanceTimersByTime(5000);
        await expect(p).resolves.toBeUndefined();
        jest.useRealTimers();
    });
});
// ---------------------------------------------------------------------------
// GeocodingState
// ---------------------------------------------------------------------------
describe('GeocodingState (exported from index)', () => {
    it('is a named export and is a constructor', () => {
        expect(typeof index_1.GeocodingState).toBe('function');
    });
    it('creates an instance with no position', () => {
        const state = new index_1.GeocodingState();
        expect(state.hasPosition()).toBe(false);
        expect(state.getCurrentPosition()).toBeNull();
        expect(state.getCurrentCoordinates()).toBeNull();
    });
    it('accepts a GeoPosition and notifies observers', () => {
        const state = new index_1.GeocodingState();
        const pos = new index_1.GeoPosition({ coords: { latitude: -23.5505, longitude: -46.6333, accuracy: 10 }, timestamp: 1000 });
        const cb = jest.fn();
        state.subscribe(cb);
        state.setPosition(pos);
        expect(state.hasPosition()).toBe(true);
        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb.mock.calls[0][0].position).toBe(pos);
    });
});
// ---------------------------------------------------------------------------
// ObserverSubject
// ---------------------------------------------------------------------------
describe('ObserverSubject (exported from index)', () => {
    it('is a named export and is a constructor', () => {
        expect(typeof index_1.ObserverSubject).toBe('function');
    });
    it('creates an instance with zero observers', () => {
        const subject = new index_1.ObserverSubject();
        expect(subject.getObserverCount()).toBe(0);
    });
    it('subscribe/notify/unsubscribe lifecycle works', () => {
        const subject = new index_1.ObserverSubject();
        const cb = jest.fn();
        const unsub = subject.subscribe(cb);
        subject._notifyObservers(7);
        expect(cb).toHaveBeenCalledWith(7);
        unsub();
        subject._notifyObservers(8);
        expect(cb).toHaveBeenCalledTimes(1);
    });
});
// ---------------------------------------------------------------------------
// Type exports (compile-time smoke test — no runtime assertions needed)
// ---------------------------------------------------------------------------
describe('TypeScript type exports', () => {
    it('GeoCoords can be used as a type annotation without error', () => {
        const coords = { latitude: 10, longitude: 20, accuracy: 5 };
        expect(coords.latitude).toBe(10);
    });
    it('GeoPositionInput can be used as a type annotation without error', () => {
        const input = { coords: { latitude: 0, longitude: 0 }, timestamp: 0 };
        expect(input.timestamp).toBe(0);
    });
    it('AccuracyQuality covers all expected literal values', () => {
        const values = ['excellent', 'good', 'medium', 'bad', 'very bad'];
        expect(values).toHaveLength(5);
    });
});
