"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GeoPosition_1 = __importDefault(require("../../src/core/GeoPosition"));
const PositionManagerPolicy_1 = require("../../src/core/PositionManagerPolicy");
const fixtures_1 = require("../helpers/fixtures");
describe('PositionManagerPolicy', () => {
    describe('validatePositionInput()', () => {
        it('accepts a plain GeoPositionInput', () => {
            const input = (0, fixtures_1.makeGeoPositionInput)(-23.5505, -46.6333, 10);
            const result = (0, PositionManagerPolicy_1.validatePositionInput)(input);
            expect(result.error).toBeNull();
            expect(result.position).toEqual(input);
        });
        it('accepts a browser-style position object', () => {
            const input = (0, fixtures_1.makeBrowserPosition)({ latitude: -23.5505, longitude: -46.6333, accuracy: 10 }, fixtures_1.TEST_TIMESTAMP);
            const result = (0, PositionManagerPolicy_1.validatePositionInput)(input);
            expect(result.error).toBeNull();
            expect(result.position?.timestamp).toBe(fixtures_1.TEST_TIMESTAMP);
            expect(result.position?.coords.latitude).toBe(-23.5505);
            expect(result.position?.coords.longitude).toBe(-46.6333);
        });
        it('rejects null input', () => {
            const result = (0, PositionManagerPolicy_1.validatePositionInput)(null);
            expect(result.position).toBeNull();
            expect(result.error).toEqual(expect.objectContaining({ name: 'InvalidPositionError' }));
        });
        it('rejects missing timestamp', () => {
            const result = (0, PositionManagerPolicy_1.validatePositionInput)({
                coords: { latitude: -23.5505, longitude: -46.6333, accuracy: 10 },
            });
            expect(result.position).toBeNull();
            expect(result.error).toEqual(expect.objectContaining({ name: 'InvalidPositionError' }));
        });
        it('rejects missing coords', () => {
            const result = (0, PositionManagerPolicy_1.validatePositionInput)({ timestamp: fixtures_1.TEST_TIMESTAMP });
            expect(result.position).toBeNull();
            expect(result.error).toEqual(expect.objectContaining({ name: 'InvalidPositionError' }));
        });
    });
    describe('getRejectedAccuracyError()', () => {
        it('returns null when the quality is accepted', () => {
            const result = (0, PositionManagerPolicy_1.validatePositionInput)((0, fixtures_1.makeGeoPositionInput)(-23.5505, -46.6333, 10));
            expect(result.position).not.toBeNull();
            expect((0, PositionManagerPolicy_1.getRejectedAccuracyError)(result.position, ['bad', 'very bad'])).toBeNull();
        });
        it('returns AccuracyError when the quality is rejected', () => {
            const result = (0, PositionManagerPolicy_1.validatePositionInput)((0, fixtures_1.makeGeoPositionInput)(-23.5505, -46.6333, 500));
            expect(result.position).not.toBeNull();
            expect((0, PositionManagerPolicy_1.getRejectedAccuracyError)(result.position, ['medium', 'bad', 'very bad'])).toEqual(expect.objectContaining({ name: 'AccuracyError' }));
        });
    });
    describe('evaluateDistanceTimeGate()', () => {
        it('accepts the first update when no previous position exists', () => {
            const result = (0, PositionManagerPolicy_1.evaluateDistanceTimeGate)({
                lastPosition: null,
                position: (0, PositionManagerPolicy_1.validatePositionInput)((0, fixtures_1.makeGeoPositionInput)(-23.5505, -46.6333, 10)).position,
                lastModified: null,
                minimumDistanceChange: 20,
                minimumTimeChange: 30000,
                bypassDistanceRule: false,
                calculateDistance: jest.fn(),
            });
            expect(result.accepted).toBe(true);
            expect(result.distance).toBeNull();
        });
        it('rejects when neither distance nor time thresholds are met', () => {
            const result = (0, PositionManagerPolicy_1.evaluateDistanceTimeGate)({
                lastPosition: new GeoPosition_1.default((0, fixtures_1.makeGeoPositionInput)(-23.5505, -46.6333, 10)),
                position: (0, PositionManagerPolicy_1.validatePositionInput)({
                    ...(0, fixtures_1.makeGeoPositionInput)(-23.5506, -46.6334, 10),
                    timestamp: fixtures_1.TEST_TIMESTAMP + 1000,
                }).position,
                lastModified: fixtures_1.TEST_TIMESTAMP,
                minimumDistanceChange: 20,
                minimumTimeChange: 30000,
                bypassDistanceRule: false,
                calculateDistance: jest.fn(() => 5),
            });
            expect(result.accepted).toBe(false);
            expect(result.error).toEqual(expect.objectContaining({ name: 'DistanceAndTimeError' }));
        });
        it('accepts when the bypass flag is enabled', () => {
            const result = (0, PositionManagerPolicy_1.evaluateDistanceTimeGate)({
                lastPosition: new GeoPosition_1.default((0, fixtures_1.makeGeoPositionInput)(-23.5505, -46.6333, 10)),
                position: (0, PositionManagerPolicy_1.validatePositionInput)({
                    ...(0, fixtures_1.makeGeoPositionInput)(-23.5506, -46.6334, 10),
                    timestamp: fixtures_1.TEST_TIMESTAMP + 1000,
                }).position,
                lastModified: fixtures_1.TEST_TIMESTAMP,
                minimumDistanceChange: 20,
                minimumTimeChange: 30000,
                bypassDistanceRule: true,
                calculateDistance: jest.fn(() => 5),
            });
            expect(result.accepted).toBe(true);
            expect(result.bypassed).toBe(true);
        });
    });
    describe('classifyPositionEvent()', () => {
        it('classifies elapsed updates as regular updates', () => {
            const result = (0, PositionManagerPolicy_1.classifyPositionEvent)(fixtures_1.TEST_TIMESTAMP + 60000, fixtures_1.TEST_TIMESTAMP, 50000);
            expect(result.immediate).toBe(false);
            expect(result.error).toBeNull();
        });
        it('classifies short-interval updates as immediate updates', () => {
            const result = (0, PositionManagerPolicy_1.classifyPositionEvent)(fixtures_1.TEST_TIMESTAMP + 5000, fixtures_1.TEST_TIMESTAMP, 50000);
            expect(result.immediate).toBe(true);
            expect(result.error).toEqual(expect.objectContaining({ name: 'ElapseTimeError' }));
        });
    });
});
