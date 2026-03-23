// test/core/PositionManager.test.ts

/**
 * Unit tests for PositionManager class.
 *
 * Tests cover the singleton pattern, position management, observer pattern
 * implementation, multi-layer validation rules, and event classification.
 *
 * @jest-environment node
 * @author Marcelo Pereira Barbosa
 * @see [PositionManager Documentation](../../docs/POSITION_MANAGER.md)
 * @since 0.12.3-alpha
 */

import PositionManager, { initializeConfig, createPositionManagerConfig } from '../../src/core/PositionManager';
import GeoPosition from '../../src/core/GeoPosition';
import { calculateDistance } from '../../src/utils/distance';
import { makeGeoPositionInput, makeBrowserPosition, TEST_TIMESTAMP, makeObserver } from '../helpers/fixtures';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../src/utils/distance');
jest.mock('../../src/utils/logger', () => ({
	log: jest.fn(),
	warn: jest.fn(),
}));

const mockCalculateDistance = calculateDistance as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a GeolocationPosition-like object with an explicit timestamp. */
function makePosition(
	lat: number,
	lon: number,
	accuracy = 10,
	timestamp = TEST_TIMESTAMP,
	extra: Partial<{
		altitude: number | null;
		altitudeAccuracy: number | null;
		heading: number | null;
		speed: number | null;
	}> = {},
): GeolocationPosition {
	return makeBrowserPosition(
		{ latitude: lat, longitude: lon, accuracy, ...extra },
		timestamp,
	) as unknown as GeolocationPosition;
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('PositionManager', () => {
	beforeEach(() => {
		PositionManager.instance = null;
		mockCalculateDistance.mockReturnValue(0);
		initializeConfig(createPositionManagerConfig());
	});

	afterEach(() => {
		PositionManager.instance = null;
		jest.clearAllMocks();
	});

	// ── Singleton ────────────────────────────────────────────────────────────

	describe('Singleton pattern', () => {
		it('returns the same instance on repeated calls', () => {
			const a = PositionManager.getInstance();
			const b = PositionManager.getInstance();
			expect(a).toBe(b);
		});

		it('stores the instance on the static property', () => {
			const inst = PositionManager.getInstance();
			expect(PositionManager.instance).toBe(inst);
		});

		it('initialises without position data', () => {
			const manager = PositionManager.getInstance();
			expect(manager).toBeDefined();
			expect(manager.lastPosition).toBeNull();
			expect(manager.latitude).toBeUndefined();
			expect(manager.longitude).toBeUndefined();
		});

		it('accepts an initial position via getInstance()', () => {
			const pos = makePosition(-23.5505, -46.6333);
			const manager = PositionManager.getInstance(pos);

			expect(manager.latitude).toBeCloseTo(-23.5505);
			expect(manager.longitude).toBeCloseTo(-46.6333);
		});

		it('delegates to update() when getInstance() is called on existing instance', () => {
			const first = PositionManager.getInstance();
			const spy   = jest.spyOn(first, 'update');
			const pos   = makePosition(-22.9068, -43.1729);

			PositionManager.getInstance(pos);
			expect(spy).toHaveBeenCalledWith(pos);
		});

		it('two distinct instances from new PositionManager() are separate objects', () => {
			const a = new PositionManager();
			const b = new PositionManager();
			expect(a).not.toBe(b);
		});
	});

	// ── Observer pattern ─────────────────────────────────────────────────────

	describe('Observer pattern', () => {
		it('exposes an observers array (initially empty)', () => {
			const manager = new PositionManager();
			expect(Array.isArray(manager.observers)).toBe(true);
			expect(manager.observers).toHaveLength(0);
		});

		it('subscribe() registers an observer', () => {
			const manager  = new PositionManager();
			const observer = makeObserver();

			manager.subscribe(observer);
			expect(manager.observers).toHaveLength(1);
		});

		it('unsubscribe() removes an observer', () => {
			const manager  = new PositionManager();
			const observer = makeObserver();

			manager.subscribe(observer);
			manager.unsubscribe(observer);
			expect(manager.observers).toHaveLength(0);
		});

		it('notifies observers on accepted position update', () => {
			mockCalculateDistance.mockReturnValue(999); // large distance
			const manager  = new PositionManager();
			const observer = makeObserver();
			manager.subscribe(observer);

			const pos = makePosition(-23.5505, -46.6333);
			manager.update(pos);

			expect(observer.update).toHaveBeenCalledWith(
				manager,
				PositionManager.strCurrPosUpdate,
				null,
				null,
			);
		});

		it('notifies observers with strCurrPosNotUpdate on rejected update', () => {
			const manager  = new PositionManager();
			const observer = makeObserver();
			manager.subscribe(observer);

			// No position set yet → accept first update, then block second
			const pos1 = makePosition(-23.5505, -46.6333, 10, TEST_TIMESTAMP);
			manager.update(pos1);
			observer.update.mockClear();

			// Second update: distance=0 (below threshold), time=0 (below threshold)
			mockCalculateDistance.mockReturnValue(0);
			const pos2 = makePosition(-23.5505, -46.6333, 10, TEST_TIMESTAMP + 1_000);
			manager.update(pos2);

			expect(observer.update).toHaveBeenCalledWith(
				manager,
				PositionManager.strCurrPosNotUpdate,
				null,
				expect.objectContaining({ name: 'DistanceAndTimeError' }),
			);
		});

		it('multiple observers all receive notifications', () => {
			mockCalculateDistance.mockReturnValue(999);
			const manager = new PositionManager();
			const obs1    = makeObserver();
			const obs2    = makeObserver();

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
			const pos     = makePosition(-23.5505, -46.6333, 10, TEST_TIMESTAMP);
			const manager = new PositionManager(pos);

			expect(manager.lastPosition).toBeInstanceOf(GeoPosition);
		});

		it('exposes proxy getters matching the wrapped GeoPosition', () => {
			const pos     = makePosition(-15.7975, -47.8919, 5, TEST_TIMESTAMP, {
				altitude: 1172, heading: 180, speed: 13.89,
			});
			const manager = new PositionManager(pos);

			expect(manager.latitude).toBeCloseTo(-15.7975);
			expect(manager.longitude).toBeCloseTo(-47.8919);
			expect(manager.accuracy).toBe(5);
			expect(manager.accuracyQuality).toBe('excellent');
			expect(manager.altitude).toBe(1172);
			expect(manager.heading).toBe(180);
			expect(manager.speed).toBeCloseTo(13.89);
			expect(manager.timestamp).toBe(TEST_TIMESTAMP);
		});

		it('update() stores lastPosition and lastModified', () => {
			const manager = new PositionManager();
			const pos     = makePosition(-23.5505, -46.6333, 10, TEST_TIMESTAMP);
			manager.update(pos);

			expect(manager.lastPosition).toBeInstanceOf(GeoPosition);
			expect((manager as unknown as { lastModified: number }).lastModified).toBe(TEST_TIMESTAMP);
		});

		it('rejects invalid position (null)', () => {
			const manager  = new PositionManager();
			const observer = makeObserver();
			manager.subscribe(observer);

			// @ts-expect-error intentional bad input
			manager.update(null);

			expect(observer.update).not.toHaveBeenCalled();
			expect(manager.lastPosition).toBeNull();
		});

		it('rejects position without timestamp', () => {
			const manager  = new PositionManager();
			const observer = makeObserver();
			manager.subscribe(observer);

			// @ts-expect-error intentional bad input
			manager.update({ coords: { latitude: -23, longitude: -46, accuracy: 10 } });

			expect(observer.update).not.toHaveBeenCalled();
		});
	});

	// ── Accuracy validation ──────────────────────────────────────────────────

	describe('Accuracy validation', () => {
		it('accepts all accuracy levels when notAcceptedAccuracy is null (default)', () => {
			const manager  = new PositionManager();
			const observer = makeObserver();
			manager.subscribe(observer);

			// 500m accuracy (very bad) — should still be accepted with null filter
			const pos = makePosition(-23.5505, -46.6333, 500, TEST_TIMESTAMP);
			manager.update(pos);

			expect(observer.update).toHaveBeenCalledWith(
				manager,
				PositionManager.strCurrPosUpdate,
				null,
				null,
			);
		});

		it('rejects positions with quality in notAcceptedAccuracy', () => {
			initializeConfig({ notAcceptedAccuracy: ['medium', 'bad', 'very bad'] });

			const manager  = new PositionManager();
			const observer = makeObserver();
			manager.subscribe(observer);

			// 300m accuracy → 'very bad'
			const pos = makePosition(-23.5505, -46.6333, 300, TEST_TIMESTAMP);
			manager.update(pos);

			expect(observer.update).toHaveBeenCalledWith(
				manager,
				PositionManager.strCurrPosNotUpdate,
				null,
				expect.objectContaining({ name: 'AccuracyError' }),
			);
		});

		it('accepts positions above the accuracy quality threshold', () => {
			initializeConfig({ notAcceptedAccuracy: ['bad', 'very bad'] });

			const manager  = new PositionManager();
			const observer = makeObserver();
			manager.subscribe(observer);

			// 10m accuracy → 'excellent' — should be accepted
			const pos = makePosition(-23.5505, -46.6333, 10, TEST_TIMESTAMP);
			manager.update(pos);

			expect(observer.update).toHaveBeenCalledWith(
				manager,
				PositionManager.strCurrPosUpdate,
				null,
				null,
			);
		});
	});

	// ── Distance & time thresholds ───────────────────────────────────────────

	describe('Distance and time thresholds', () => {
		it('accepts first update with no previous position (no distance check)', () => {
			const manager  = new PositionManager();
			const observer = makeObserver();
			manager.subscribe(observer);

			manager.update(makePosition(-23.5505, -46.6333, 10, TEST_TIMESTAMP));
			expect(observer.update).toHaveBeenCalledWith(
				manager, PositionManager.strCurrPosUpdate, null, null,
			);
		});

		it('accepts update when distance threshold is exceeded (time not met)', () => {
			initializeConfig({ minimumDistanceChange: 20, minimumTimeChange: 30_000 });
			mockCalculateDistance.mockReturnValue(25); // 25 m > 20 m

			const manager  = new PositionManager(makePosition(-23.5505, -46.6333, 10, TEST_TIMESTAMP));
			const observer = makeObserver();
			manager.subscribe(observer);

			// Only 1 second later but moved 25 m
			manager.update(makePosition(-23.5510, -46.6340, 10, TEST_TIMESTAMP + 1_000));
			expect(observer.update).toHaveBeenCalledWith(
				manager,
				expect.stringMatching(/PositionManager updated|Immediate address update/),
				null,
				expect.anything(),
			);
		});

		it('accepts update when time threshold is exceeded (distance not met)', () => {
			initializeConfig({ minimumDistanceChange: 20, minimumTimeChange: 30_000 });
			mockCalculateDistance.mockReturnValue(5); // 5 m < 20 m

			const manager  = new PositionManager(makePosition(-23.5505, -46.6333, 10, TEST_TIMESTAMP));
			const observer = makeObserver();
			manager.subscribe(observer);

			// 31 seconds later but barely moved
			manager.update(makePosition(-23.5505, -46.6334, 10, TEST_TIMESTAMP + 31_000));
			expect(observer.update).toHaveBeenCalledWith(
				manager,
				expect.stringMatching(/PositionManager updated|Immediate address update/),
				null,
				expect.anything(),
			);
		});

		it('rejects update when neither threshold is met', () => {
			initializeConfig({ minimumDistanceChange: 20, minimumTimeChange: 30_000 });
			mockCalculateDistance.mockReturnValue(5); // 5 m < 20 m

			const manager  = new PositionManager(makePosition(-23.5505, -46.6333, 10, TEST_TIMESTAMP));
			const observer = makeObserver();
			manager.subscribe(observer);

			// 1 second later and barely moved
			manager.update(makePosition(-23.5505, -46.6334, 10, TEST_TIMESTAMP + 1_000));
			expect(observer.update).toHaveBeenCalledWith(
				manager,
				PositionManager.strCurrPosNotUpdate,
				null,
				expect.objectContaining({ name: 'DistanceAndTimeError' }),
			);
		});
	});

	// ── Event classification ─────────────────────────────────────────────────

	describe('Event classification', () => {
		it('emits strCurrPosUpdate when trackingInterval has elapsed', () => {
			initializeConfig({ trackingInterval: 50_000 });
			mockCalculateDistance.mockReturnValue(999);

			const manager  = new PositionManager(makePosition(-23.5505, -46.6333, 10, TEST_TIMESTAMP));
			const observer = makeObserver();
			manager.subscribe(observer);

			// 60 seconds later — past the 50 s interval
			manager.update(makePosition(-23.5600, -46.6400, 10, TEST_TIMESTAMP + 60_000));

			expect(observer.update).toHaveBeenCalledWith(
				manager,
				PositionManager.strCurrPosUpdate,
				null,
				null,
			);
		});

		it('emits strImmediateAddressUpdate when update arrives before trackingInterval', () => {
			initializeConfig({ trackingInterval: 50_000, minimumDistanceChange: 20, minimumTimeChange: 30_000 });
			mockCalculateDistance.mockReturnValue(999); // distance OK

			const manager  = new PositionManager(makePosition(-23.5505, -46.6333, 10, TEST_TIMESTAMP));
			const observer = makeObserver();
			manager.subscribe(observer);

			// Only 5 seconds later (< 50 s tracking interval)
			manager.update(makePosition(-23.5600, -46.6400, 10, TEST_TIMESTAMP + 5_000));

			expect(observer.update).toHaveBeenCalledWith(
				manager,
				PositionManager.strImmediateAddressUpdate,
				null,
				expect.objectContaining({ name: 'ElapseTimeError' }),
			);
		});
	});

	// ── Static string constants ──────────────────────────────────────────────

	describe('Static string constants', () => {
		it('strCurrPosUpdate is a non-empty string', () => {
			expect(typeof PositionManager.strCurrPosUpdate).toBe('string');
			expect(PositionManager.strCurrPosUpdate.length).toBeGreaterThan(0);
		});

		it('strCurrPosNotUpdate is a non-empty string', () => {
			expect(typeof PositionManager.strCurrPosNotUpdate).toBe('string');
			expect(PositionManager.strCurrPosNotUpdate.length).toBeGreaterThan(0);
		});

		it('strImmediateAddressUpdate is a non-empty string', () => {
			expect(typeof PositionManager.strImmediateAddressUpdate).toBe('string');
			expect(PositionManager.strImmediateAddressUpdate.length).toBeGreaterThan(0);
		});

		it('all three event constants are distinct', () => {
			const events = new Set([
				PositionManager.strCurrPosUpdate,
				PositionManager.strCurrPosNotUpdate,
				PositionManager.strImmediateAddressUpdate,
			]);
			expect(events.size).toBe(3);
		});
	});

	// ── toString ────────────────────────────────────────────────────────────

	describe('toString()', () => {
		it('returns "No position data" when no position has been set', () => {
			const manager = new PositionManager();
			expect(manager.toString()).toContain('No position data');
		});

		it('includes lat/lon in output when position is set', () => {
			const pos     = makePosition(-23.5505, -46.6333, 10, TEST_TIMESTAMP);
			const manager = new PositionManager(pos);

			const str = manager.toString();
			expect(str).toContain('-23.5505');
			expect(str).toContain('-46.6333');
		});

		it('includes class name in output', () => {
			const manager = new PositionManager();
			expect(manager.toString()).toContain('PositionManager');
		});
	});

	// ── initializeConfig ─────────────────────────────────────────────────────

	describe('initializeConfig()', () => {
		it('overrides minimumDistanceChange', () => {
			initializeConfig({ minimumDistanceChange: 100 });
			mockCalculateDistance.mockReturnValue(50); // 50 m < new 100 m threshold

			const manager  = new PositionManager(makePosition(-23.5505, -46.6333, 10, TEST_TIMESTAMP));
			const observer = makeObserver();
			manager.subscribe(observer);

			// Time also not met (< minimumTimeChange)
			manager.update(makePosition(-23.5510, -46.6340, 10, TEST_TIMESTAMP + 1_000));

			expect(observer.update).toHaveBeenCalledWith(
				manager,
				PositionManager.strCurrPosNotUpdate,
				null,
				expect.objectContaining({ name: 'DistanceAndTimeError' }),
			);
		});

		it('createPositionManagerConfig() returns expected defaults', () => {
			const cfg = createPositionManagerConfig();
			expect(cfg.trackingInterval).toBe(50_000);
			expect(cfg.minimumDistanceChange).toBe(20);
			expect(cfg.minimumTimeChange).toBe(30_000);
			expect(cfg.notAcceptedAccuracy).toBeNull();
		});
	});
});
