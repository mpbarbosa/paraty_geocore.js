"use strict";
// test/core/PositionManager.test.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Unit tests for PositionManager class.
 *
 * Tests cover the singleton pattern, position management, observer pattern
 * implementation, multi-layer validation rules, and event classification.
 *
 * @jest-environment node
 * @author Marcelo Pereira Barbosa
 * @see [PositionManager Documentation](../../docs/POSITION_MANAGER.md)
 * @since 0.12.1-alpha
 */
const PositionManager_1 = __importStar(require("../../src/core/PositionManager"));
const GeoPosition_1 = __importDefault(require("../../src/core/GeoPosition"));
const distance_1 = require("../../src/utils/distance");
const fixtures_1 = require("../helpers/fixtures");
// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('../../src/utils/distance');
jest.mock('../../src/utils/logger', () => ({
    log: jest.fn(),
    warn: jest.fn(),
}));
const mockCalculateDistance = distance_1.calculateDistance;
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Creates a GeolocationPosition-like object with an explicit timestamp. */
function makePosition(lat, lon, accuracy = 10, timestamp = fixtures_1.TEST_TIMESTAMP, extra = {}) {
    return (0, fixtures_1.makeBrowserPosition)({ latitude: lat, longitude: lon, accuracy, ...extra }, timestamp);
}
// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------
describe('PositionManager', () => {
    beforeEach(() => {
        PositionManager_1.default.instance = null;
        mockCalculateDistance.mockReturnValue(0);
        (0, PositionManager_1.initializeConfig)((0, PositionManager_1.createPositionManagerConfig)());
    });
    afterEach(() => {
        PositionManager_1.default.instance = null;
        jest.clearAllMocks();
    });
    // ── Singleton ────────────────────────────────────────────────────────────
    describe('Singleton pattern', () => {
        it('returns the same instance on repeated calls', () => {
            const a = PositionManager_1.default.getInstance();
            const b = PositionManager_1.default.getInstance();
            expect(a).toBe(b);
        });
        it('stores the instance on the static property', () => {
            const inst = PositionManager_1.default.getInstance();
            expect(PositionManager_1.default.instance).toBe(inst);
        });
        it('initialises without position data', () => {
            const manager = PositionManager_1.default.getInstance();
            expect(manager).toBeDefined();
            expect(manager.lastPosition).toBeNull();
            expect(manager.latitude).toBeUndefined();
            expect(manager.longitude).toBeUndefined();
        });
        it('accepts an initial position via getInstance()', () => {
            const pos = makePosition(-23.5505, -46.6333);
            const manager = PositionManager_1.default.getInstance(pos);
            expect(manager.latitude).toBeCloseTo(-23.5505);
            expect(manager.longitude).toBeCloseTo(-46.6333);
        });
        it('delegates to update() when getInstance() is called on existing instance', () => {
            const first = PositionManager_1.default.getInstance();
            const spy = jest.spyOn(first, 'update');
            const pos = makePosition(-22.9068, -43.1729);
            PositionManager_1.default.getInstance(pos);
            expect(spy).toHaveBeenCalledWith(pos);
        });
        it('two distinct instances from new PositionManager() are separate objects', () => {
            const a = new PositionManager_1.default();
            const b = new PositionManager_1.default();
            expect(a).not.toBe(b);
        });
    });
    // ── Observer pattern ─────────────────────────────────────────────────────
    describe('Observer pattern', () => {
        it('exposes an observers array (initially empty)', () => {
            const manager = new PositionManager_1.default();
            expect(Array.isArray(manager.observers)).toBe(true);
            expect(manager.observers).toHaveLength(0);
        });
        it('subscribe() registers an observer', () => {
            const manager = new PositionManager_1.default();
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            expect(manager.observers).toHaveLength(1);
        });
        it('unsubscribe() removes an observer', () => {
            const manager = new PositionManager_1.default();
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            manager.unsubscribe(observer);
            expect(manager.observers).toHaveLength(0);
        });
        it('notifies observers on accepted position update', () => {
            mockCalculateDistance.mockReturnValue(999); // large distance
            const manager = new PositionManager_1.default();
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            const pos = makePosition(-23.5505, -46.6333);
            manager.update(pos);
            expect(observer.update).toHaveBeenCalledWith(manager, PositionManager_1.default.strCurrPosUpdate, null, null);
        });
        it('notifies observers with strCurrPosNotUpdate on rejected update', () => {
            const manager = new PositionManager_1.default();
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            // No position set yet → accept first update, then block second
            const pos1 = makePosition(-23.5505, -46.6333, 10, fixtures_1.TEST_TIMESTAMP);
            manager.update(pos1);
            observer.update.mockClear();
            // Second update: distance=0 (below threshold), time=0 (below threshold)
            mockCalculateDistance.mockReturnValue(0);
            const pos2 = makePosition(-23.5505, -46.6333, 10, fixtures_1.TEST_TIMESTAMP + 1000);
            manager.update(pos2);
            expect(observer.update).toHaveBeenCalledWith(manager, PositionManager_1.default.strCurrPosNotUpdate, null, expect.objectContaining({ name: 'DistanceAndTimeError' }));
        });
        it('multiple observers all receive notifications', () => {
            mockCalculateDistance.mockReturnValue(999);
            const manager = new PositionManager_1.default();
            const obs1 = (0, fixtures_1.makeObserver)();
            const obs2 = (0, fixtures_1.makeObserver)();
            manager.subscribe(obs1);
            manager.subscribe(obs2);
            manager.update(makePosition(-23.5505, -46.6333));
            expect(obs1.update).toHaveBeenCalledTimes(1);
            expect(obs2.update).toHaveBeenCalledTimes(1);
        });
    });
    // ── Position data management ─────────────────────────────────────────────
    describe('Position data management', () => {
        it('wraps the raw position in a GeoPosition instance', () => {
            const pos = makePosition(-23.5505, -46.6333, 10, fixtures_1.TEST_TIMESTAMP);
            const manager = new PositionManager_1.default(pos);
            expect(manager.lastPosition).toBeInstanceOf(GeoPosition_1.default);
        });
        it('exposes proxy getters matching the wrapped GeoPosition', () => {
            const pos = makePosition(-15.7975, -47.8919, 5, fixtures_1.TEST_TIMESTAMP, {
                altitude: 1172, heading: 180, speed: 13.89,
            });
            const manager = new PositionManager_1.default(pos);
            expect(manager.latitude).toBeCloseTo(-15.7975);
            expect(manager.longitude).toBeCloseTo(-47.8919);
            expect(manager.accuracy).toBe(5);
            expect(manager.accuracyQuality).toBe('excellent');
            expect(manager.altitude).toBe(1172);
            expect(manager.heading).toBe(180);
            expect(manager.speed).toBeCloseTo(13.89);
            expect(manager.timestamp).toBe(fixtures_1.TEST_TIMESTAMP);
        });
        it('update() stores lastPosition and lastModified', () => {
            const manager = new PositionManager_1.default();
            const pos = makePosition(-23.5505, -46.6333, 10, fixtures_1.TEST_TIMESTAMP);
            manager.update(pos);
            expect(manager.lastPosition).toBeInstanceOf(GeoPosition_1.default);
            expect(manager.lastModified).toBe(fixtures_1.TEST_TIMESTAMP);
        });
        it('rejects invalid position (null)', () => {
            const manager = new PositionManager_1.default();
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            // @ts-expect-error intentional bad input
            manager.update(null);
            expect(observer.update).not.toHaveBeenCalled();
            expect(manager.lastPosition).toBeNull();
        });
        it('rejects position without timestamp', () => {
            const manager = new PositionManager_1.default();
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            // @ts-expect-error intentional bad input
            manager.update({ coords: { latitude: -23, longitude: -46, accuracy: 10 } });
            expect(observer.update).not.toHaveBeenCalled();
        });
    });
    // ── Accuracy validation ──────────────────────────────────────────────────
    describe('Accuracy validation', () => {
        it('accepts all accuracy levels when notAcceptedAccuracy is null (default)', () => {
            const manager = new PositionManager_1.default();
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            // 500m accuracy (very bad) — should still be accepted with null filter
            const pos = makePosition(-23.5505, -46.6333, 500, fixtures_1.TEST_TIMESTAMP);
            manager.update(pos);
            expect(observer.update).toHaveBeenCalledWith(manager, PositionManager_1.default.strCurrPosUpdate, null, null);
        });
        it('rejects positions with quality in notAcceptedAccuracy', () => {
            (0, PositionManager_1.initializeConfig)({ notAcceptedAccuracy: ['medium', 'bad', 'very bad'] });
            const manager = new PositionManager_1.default();
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            // 300m accuracy → 'very bad'
            const pos = makePosition(-23.5505, -46.6333, 300, fixtures_1.TEST_TIMESTAMP);
            manager.update(pos);
            expect(observer.update).toHaveBeenCalledWith(manager, PositionManager_1.default.strCurrPosNotUpdate, null, expect.objectContaining({ name: 'AccuracyError' }));
        });
        it('accepts positions above the accuracy quality threshold', () => {
            (0, PositionManager_1.initializeConfig)({ notAcceptedAccuracy: ['bad', 'very bad'] });
            const manager = new PositionManager_1.default();
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            // 10m accuracy → 'excellent' — should be accepted
            const pos = makePosition(-23.5505, -46.6333, 10, fixtures_1.TEST_TIMESTAMP);
            manager.update(pos);
            expect(observer.update).toHaveBeenCalledWith(manager, PositionManager_1.default.strCurrPosUpdate, null, null);
        });
    });
    // ── Distance & time thresholds ───────────────────────────────────────────
    describe('Distance and time thresholds', () => {
        it('accepts first update with no previous position (no distance check)', () => {
            const manager = new PositionManager_1.default();
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            manager.update(makePosition(-23.5505, -46.6333, 10, fixtures_1.TEST_TIMESTAMP));
            expect(observer.update).toHaveBeenCalledWith(manager, PositionManager_1.default.strCurrPosUpdate, null, null);
        });
        it('accepts update when distance threshold is exceeded (time not met)', () => {
            (0, PositionManager_1.initializeConfig)({ minimumDistanceChange: 20, minimumTimeChange: 30000 });
            mockCalculateDistance.mockReturnValue(25); // 25 m > 20 m
            const manager = new PositionManager_1.default(makePosition(-23.5505, -46.6333, 10, fixtures_1.TEST_TIMESTAMP));
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            // Only 1 second later but moved 25 m
            manager.update(makePosition(-23.5510, -46.6340, 10, fixtures_1.TEST_TIMESTAMP + 1000));
            expect(observer.update).toHaveBeenCalledWith(manager, expect.stringMatching(/PositionManager updated|Immediate address update/), null, expect.anything());
        });
        it('accepts update when time threshold is exceeded (distance not met)', () => {
            (0, PositionManager_1.initializeConfig)({ minimumDistanceChange: 20, minimumTimeChange: 30000 });
            mockCalculateDistance.mockReturnValue(5); // 5 m < 20 m
            const manager = new PositionManager_1.default(makePosition(-23.5505, -46.6333, 10, fixtures_1.TEST_TIMESTAMP));
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            // 31 seconds later but barely moved
            manager.update(makePosition(-23.5505, -46.6334, 10, fixtures_1.TEST_TIMESTAMP + 31000));
            expect(observer.update).toHaveBeenCalledWith(manager, expect.stringMatching(/PositionManager updated|Immediate address update/), null, expect.anything());
        });
        it('rejects update when neither threshold is met', () => {
            (0, PositionManager_1.initializeConfig)({ minimumDistanceChange: 20, minimumTimeChange: 30000 });
            mockCalculateDistance.mockReturnValue(5); // 5 m < 20 m
            const manager = new PositionManager_1.default(makePosition(-23.5505, -46.6333, 10, fixtures_1.TEST_TIMESTAMP));
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            // 1 second later and barely moved
            manager.update(makePosition(-23.5505, -46.6334, 10, fixtures_1.TEST_TIMESTAMP + 1000));
            expect(observer.update).toHaveBeenCalledWith(manager, PositionManager_1.default.strCurrPosNotUpdate, null, expect.objectContaining({ name: 'DistanceAndTimeError' }));
        });
    });
    // ── Event classification ─────────────────────────────────────────────────
    describe('Event classification', () => {
        it('emits strCurrPosUpdate when trackingInterval has elapsed', () => {
            (0, PositionManager_1.initializeConfig)({ trackingInterval: 50000 });
            mockCalculateDistance.mockReturnValue(999);
            const manager = new PositionManager_1.default(makePosition(-23.5505, -46.6333, 10, fixtures_1.TEST_TIMESTAMP));
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            // 60 seconds later — past the 50 s interval
            manager.update(makePosition(-23.5600, -46.6400, 10, fixtures_1.TEST_TIMESTAMP + 60000));
            expect(observer.update).toHaveBeenCalledWith(manager, PositionManager_1.default.strCurrPosUpdate, null, null);
        });
        it('emits strImmediateAddressUpdate when update arrives before trackingInterval', () => {
            (0, PositionManager_1.initializeConfig)({ trackingInterval: 50000, minimumDistanceChange: 20, minimumTimeChange: 30000 });
            mockCalculateDistance.mockReturnValue(999); // distance OK
            const manager = new PositionManager_1.default(makePosition(-23.5505, -46.6333, 10, fixtures_1.TEST_TIMESTAMP));
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            // Only 5 seconds later (< 50 s tracking interval)
            manager.update(makePosition(-23.5600, -46.6400, 10, fixtures_1.TEST_TIMESTAMP + 5000));
            expect(observer.update).toHaveBeenCalledWith(manager, PositionManager_1.default.strImmediateAddressUpdate, null, expect.objectContaining({ name: 'ElapseTimeError' }));
        });
    });
    // ── Static string constants ──────────────────────────────────────────────
    describe('Static string constants', () => {
        it('strCurrPosUpdate is a non-empty string', () => {
            expect(typeof PositionManager_1.default.strCurrPosUpdate).toBe('string');
            expect(PositionManager_1.default.strCurrPosUpdate.length).toBeGreaterThan(0);
        });
        it('strCurrPosNotUpdate is a non-empty string', () => {
            expect(typeof PositionManager_1.default.strCurrPosNotUpdate).toBe('string');
            expect(PositionManager_1.default.strCurrPosNotUpdate.length).toBeGreaterThan(0);
        });
        it('strImmediateAddressUpdate is a non-empty string', () => {
            expect(typeof PositionManager_1.default.strImmediateAddressUpdate).toBe('string');
            expect(PositionManager_1.default.strImmediateAddressUpdate.length).toBeGreaterThan(0);
        });
        it('all three event constants are distinct', () => {
            const events = new Set([
                PositionManager_1.default.strCurrPosUpdate,
                PositionManager_1.default.strCurrPosNotUpdate,
                PositionManager_1.default.strImmediateAddressUpdate,
            ]);
            expect(events.size).toBe(3);
        });
    });
    // ── toString ────────────────────────────────────────────────────────────
    describe('toString()', () => {
        it('returns "No position data" when no position has been set', () => {
            const manager = new PositionManager_1.default();
            expect(manager.toString()).toContain('No position data');
        });
        it('includes lat/lon in output when position is set', () => {
            const pos = makePosition(-23.5505, -46.6333, 10, fixtures_1.TEST_TIMESTAMP);
            const manager = new PositionManager_1.default(pos);
            const str = manager.toString();
            expect(str).toContain('-23.5505');
            expect(str).toContain('-46.6333');
        });
        it('includes class name in output', () => {
            const manager = new PositionManager_1.default();
            expect(manager.toString()).toContain('PositionManager');
        });
    });
    // ── initializeConfig ─────────────────────────────────────────────────────
    describe('initializeConfig()', () => {
        it('overrides minimumDistanceChange', () => {
            (0, PositionManager_1.initializeConfig)({ minimumDistanceChange: 100 });
            mockCalculateDistance.mockReturnValue(50); // 50 m < new 100 m threshold
            const manager = new PositionManager_1.default(makePosition(-23.5505, -46.6333, 10, fixtures_1.TEST_TIMESTAMP));
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            // Time also not met (< minimumTimeChange)
            manager.update(makePosition(-23.5510, -46.6340, 10, fixtures_1.TEST_TIMESTAMP + 1000));
            expect(observer.update).toHaveBeenCalledWith(manager, PositionManager_1.default.strCurrPosNotUpdate, null, expect.objectContaining({ name: 'DistanceAndTimeError' }));
        });
        it('createPositionManagerConfig() returns expected defaults', () => {
            const cfg = (0, PositionManager_1.createPositionManagerConfig)();
            expect(cfg.trackingInterval).toBe(50000);
            expect(cfg.minimumDistanceChange).toBe(20);
            expect(cfg.minimumTimeChange).toBe(30000);
            expect(cfg.notAcceptedAccuracy).toBeNull();
        });
    });
});
