"use strict";
// test/integration/GeoPositionPositionManager.integration.test.ts
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
 * Integration tests for GeoPosition and PositionManager.
 *
 * Validates that the two classes work together correctly end-to-end:
 * position updates flow through PositionManager, are wrapped in GeoPosition,
 * and trigger observer notifications with correct event types.
 *
 * @jest-environment node
 * @author Marcelo Pereira Barbosa
 * @since 0.12.1-alpha
 */
const PositionManager_1 = __importStar(require("../../src/core/PositionManager"));
const GeoPosition_1 = __importDefault(require("../../src/core/GeoPosition"));
const fixtures_1 = require("../helpers/fixtures");
// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('../../src/utils/logger', () => ({
    log: jest.fn(),
    warn: jest.fn(),
}));
// Use real calculateDistance (integration test — no mock)
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makePos(lat, lon, accuracy = 10, timestamp = fixtures_1.TEST_TIMESTAMP) {
    return (0, fixtures_1.makeBrowserPosition)({ latitude: lat, longitude: lon, accuracy }, timestamp);
}
// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------
describe('Integration: GeoPosition + PositionManager', () => {
    beforeEach(() => {
        PositionManager_1.default.instance = null;
        (0, PositionManager_1.initializeConfig)((0, PositionManager_1.createPositionManagerConfig)());
    });
    afterEach(() => {
        PositionManager_1.default.instance = null;
        jest.clearAllMocks();
    });
    // ── GeoPosition creation ─────────────────────────────────────────────────
    describe('GeoPosition creation on position update', () => {
        it('wraps raw position in a GeoPosition instance', () => {
            const manager = new PositionManager_1.default(makePos(-23.5505, -46.6333));
            expect(manager.lastPosition).toBeInstanceOf(GeoPosition_1.default);
            expect(manager.lastPosition.latitude).toBe(-23.5505);
            expect(manager.lastPosition.longitude).toBe(-46.6333);
        });
        it('correctly classifies accuracy quality', () => {
            const manager = new PositionManager_1.default(makePos(-23.5505, -46.6333, 15));
            // 15 m → 'good' (threshold ≤ 30 m)
            expect(manager.lastPosition.accuracyQuality).toBe('good');
        });
        it('replaces lastPosition on subsequent accepted updates', () => {
            // Large distance ensures the second update is accepted
            const manager = new PositionManager_1.default(makePos(-23.5505, -46.6333, 10, fixtures_1.TEST_TIMESTAMP));
            const first = manager.lastPosition;
            // 200 km away, 2 hours later → definitely exceeds both thresholds
            manager.update(makePos(-22.9068, -43.1729, 8, fixtures_1.TEST_TIMESTAMP + 7200000));
            const second = manager.lastPosition;
            expect(second).not.toBe(first);
            expect(second.latitude).toBeCloseTo(-22.9068, 4);
        });
    });
    // ── Real distance calculations ───────────────────────────────────────────
    describe('Real distance calculations', () => {
        it('accepts move from São Paulo to Rio (> 20 m threshold)', () => {
            (0, PositionManager_1.initializeConfig)({ minimumDistanceChange: 20, minimumTimeChange: 30000 });
            const manager = new PositionManager_1.default(makePos(-23.5505, -46.6333, 10, fixtures_1.TEST_TIMESTAMP));
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            // 2 hours later — time threshold also exceeded
            manager.update(makePos(-22.9068, -43.1729, 10, fixtures_1.TEST_TIMESTAMP + 7200000));
            expect(observer.update).toHaveBeenCalledWith(manager, PositionManager_1.default.strCurrPosUpdate, null, null);
        });
        it('blocks negligible movement (< 20 m) when time threshold is also not met', () => {
            (0, PositionManager_1.initializeConfig)({ minimumDistanceChange: 20, minimumTimeChange: 30000 });
            // Near-identical coordinates: displacement ≈ 0.5 m
            const manager = new PositionManager_1.default(makePos(-23.5505000, -46.6333000, 10, fixtures_1.TEST_TIMESTAMP));
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            // 1 second later — time threshold not met
            manager.update(makePos(-23.5505001, -46.6333001, 10, fixtures_1.TEST_TIMESTAMP + 1000));
            expect(observer.update).toHaveBeenCalledWith(manager, PositionManager_1.default.strCurrPosNotUpdate, null, expect.objectContaining({ name: 'DistanceAndTimeError' }));
        });
        it('accepts negligible movement when time threshold IS met', () => {
            (0, PositionManager_1.initializeConfig)({ minimumDistanceChange: 20, minimumTimeChange: 30000 });
            // Near-identical coordinates — stays in place
            const manager = new PositionManager_1.default(makePos(-23.5505000, -46.6333000, 10, fixtures_1.TEST_TIMESTAMP));
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            // 31 seconds later — time threshold met
            manager.update(makePos(-23.5505001, -46.6333001, 10, fixtures_1.TEST_TIMESTAMP + 31000));
            expect(observer.update).toHaveBeenCalledWith(manager, expect.stringMatching(/PositionManager updated|Immediate address update/), null, expect.anything());
        });
    });
    // ── Accuracy filtering end-to-end ────────────────────────────────────────
    describe('Accuracy filtering end-to-end', () => {
        it('rejects very-bad accuracy positions in mobile mode', () => {
            (0, PositionManager_1.initializeConfig)({ notAcceptedAccuracy: ['medium', 'bad', 'very bad'] });
            const manager = new PositionManager_1.default();
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            // 500 m accuracy → 'very bad'
            manager.update(makePos(-23.5505, -46.6333, 500));
            expect(observer.update).toHaveBeenCalledWith(manager, PositionManager_1.default.strCurrPosNotUpdate, null, expect.objectContaining({ name: 'AccuracyError' }));
        });
        it('accepts excellent-accuracy position in desktop mode', () => {
            (0, PositionManager_1.initializeConfig)({ notAcceptedAccuracy: ['bad', 'very bad'] });
            const manager = new PositionManager_1.default();
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            // 5 m accuracy → 'excellent'
            manager.update(makePos(-23.5505, -46.6333, 5));
            expect(observer.update).toHaveBeenCalledWith(manager, PositionManager_1.default.strCurrPosUpdate, null, null);
        });
    });
    // ── Observer lifecycle ───────────────────────────────────────────────────
    describe('Observer lifecycle', () => {
        it('observer removed before update is not called', () => {
            const manager = new PositionManager_1.default(makePos(-23.5505, -46.6333, 10, fixtures_1.TEST_TIMESTAMP));
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            manager.unsubscribe(observer);
            // 2 h later, far away
            manager.update(makePos(-22.9068, -43.1729, 10, fixtures_1.TEST_TIMESTAMP + 7200000));
            expect(observer.update).not.toHaveBeenCalled();
        });
        it('observer receives both accepted and rejected events during a journey', () => {
            (0, PositionManager_1.initializeConfig)({ minimumDistanceChange: 20, minimumTimeChange: 30000 });
            const manager = new PositionManager_1.default(makePos(-23.5505, -46.6333, 10, fixtures_1.TEST_TIMESTAMP));
            const observer = (0, fixtures_1.makeObserver)();
            manager.subscribe(observer);
            // Rejected: 1 second, barely moved
            manager.update(makePos(-23.5505001, -46.6333001, 10, fixtures_1.TEST_TIMESTAMP + 1000));
            // Accepted: 2 hours, far away
            manager.update(makePos(-22.9068, -43.1729, 10, fixtures_1.TEST_TIMESTAMP + 7200000));
            expect(observer.update).toHaveBeenCalledTimes(2);
            const [firstCall, secondCall] = observer.update.mock.calls;
            expect(firstCall[1]).toBe(PositionManager_1.default.strCurrPosNotUpdate);
            expect(secondCall[1]).toBe(PositionManager_1.default.strCurrPosUpdate);
        });
    });
    // ── toString ────────────────────────────────────────────────────────────
    describe('toString() with real position data', () => {
        it('includes all expected position components', () => {
            const manager = new PositionManager_1.default(makePos(-23.5505, -46.6333, 10, fixtures_1.TEST_TIMESTAMP));
            const str = manager.toString();
            expect(str).toContain('PositionManager');
            expect(str).toContain('-23.5505');
            expect(str).toContain('-46.6333');
        });
    });
});
