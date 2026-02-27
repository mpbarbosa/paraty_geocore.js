"use strict";
/**
 * Performance benchmarks — paraty_geocore.js
 *
 * Measures throughput and per-operation latency for core library functions.
 * Run with: npm run bench
 *
 * Thresholds are intentionally generous (wall-clock, CI-safe) and serve as
 * regression guards rather than strict performance contracts.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GeoPosition_1 = __importDefault(require("../../src/core/GeoPosition"));
const distance_1 = require("../../src/utils/distance");
const ITERATIONS = 100000;
// Increase Jest timeout for benchmark tests
jest.setTimeout(30000);
function bench(label, fn, iterations = ITERATIONS) {
    // Warm-up pass (avoid JIT cold-start skewing results)
    for (let i = 0; i < Math.min(1000, iterations); i++)
        fn();
    const start = performance.now();
    for (let i = 0; i < iterations; i++)
        fn();
    const elapsed = performance.now() - start;
    const perOpUs = (elapsed / iterations) * 1000;
    console.log(`  ${label}: ${iterations.toLocaleString()} ops in ${elapsed.toFixed(1)}ms ` +
        `(${perOpUs.toFixed(3)} µs/op)`);
    return elapsed;
}
// ---------------------------------------------------------------------------
describe('Performance Benchmarks', () => {
    describe('utils/distance', () => {
        it(`calculateDistance — ${ITERATIONS.toLocaleString()} iterations complete in < 500ms`, () => {
            const elapsed = bench('calculateDistance', () => (0, distance_1.calculateDistance)(-23.5505, -46.6333, -22.9068, -43.1729));
            expect(elapsed).toBeLessThan(500);
        });
        it('calculateDistance — same-point shortcut stays < 500ms', () => {
            const elapsed = bench('calculateDistance (same point)', () => (0, distance_1.calculateDistance)(-23.5505, -46.6333, -23.5505, -46.6333));
            expect(elapsed).toBeLessThan(500);
        });
    });
    describe('core/GeoPosition', () => {
        const input = {
            timestamp: 1700000000000,
            coords: {
                latitude: -23.5505,
                longitude: -46.6333,
                accuracy: 12,
                altitude: 760,
                altitudeAccuracy: 5,
                heading: null,
                speed: 0,
            },
        };
        it(`GeoPosition construction — ${ITERATIONS.toLocaleString()} iterations complete in < 2000ms`, () => {
            const elapsed = bench('new GeoPosition()', () => new GeoPosition_1.default(input));
            expect(elapsed).toBeLessThan(2000);
        });
        it(`GeoPosition.from() — ${ITERATIONS.toLocaleString()} iterations complete in < 2000ms`, () => {
            const elapsed = bench('GeoPosition.from()', () => GeoPosition_1.default.from(input));
            expect(elapsed).toBeLessThan(2000);
        });
        it(`getAccuracyQuality — ${ITERATIONS.toLocaleString()} iterations complete in < 100ms`, () => {
            const elapsed = bench('getAccuracyQuality', () => GeoPosition_1.default.getAccuracyQuality(15));
            expect(elapsed).toBeLessThan(100);
        });
        it(`distanceTo — ${ITERATIONS.toLocaleString()} iterations complete in < 1000ms`, () => {
            const pos = new GeoPosition_1.default(input);
            const target = { latitude: -22.9068, longitude: -43.1729 };
            const elapsed = bench('distanceTo', () => pos.distanceTo(target));
            expect(elapsed).toBeLessThan(1000);
        });
    });
});
