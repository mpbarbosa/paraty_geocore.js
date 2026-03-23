// test/integration/GeoPositionPositionManager.integration.test.ts

/**
 * Integration tests for GeoPosition and PositionManager.
 *
 * Validates that the two classes work together correctly end-to-end:
 * position updates flow through PositionManager, are wrapped in GeoPosition,
 * and trigger observer notifications with correct event types.
 *
 * @jest-environment node
 * @author Marcelo Pereira Barbosa
 * @since 0.12.2-alpha
 */

import PositionManager, { initializeConfig, createPositionManagerConfig } from '../../src/core/PositionManager';
import GeoPosition from '../../src/core/GeoPosition';
import { makeBrowserPosition, TEST_TIMESTAMP, makeObserver } from '../helpers/fixtures';

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

function makePos(lat: number, lon: number, accuracy = 10, timestamp = TEST_TIMESTAMP): GeolocationPosition {
	return makeBrowserPosition(
		{ latitude: lat, longitude: lon, accuracy },
		timestamp,
	) as unknown as GeolocationPosition;
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('Integration: GeoPosition + PositionManager', () => {
	beforeEach(() => {
		PositionManager.instance = null;
		initializeConfig(createPositionManagerConfig());
	});

	afterEach(() => {
		PositionManager.instance = null;
		jest.clearAllMocks();
	});

	// ── GeoPosition creation ─────────────────────────────────────────────────

	describe('GeoPosition creation on position update', () => {
		it('wraps raw position in a GeoPosition instance', () => {
			const manager = new PositionManager(makePos(-23.5505, -46.6333));

			expect(manager.lastPosition).toBeInstanceOf(GeoPosition);
			expect(manager.lastPosition!.latitude).toBe(-23.5505);
			expect(manager.lastPosition!.longitude).toBe(-46.6333);
		});

		it('correctly classifies accuracy quality', () => {
			const manager = new PositionManager(makePos(-23.5505, -46.6333, 15));

			// 15 m → 'good' (threshold ≤ 30 m)
			expect(manager.lastPosition!.accuracyQuality).toBe('good');
		});

		it('replaces lastPosition on subsequent accepted updates', () => {
			// Large distance ensures the second update is accepted
			const manager = new PositionManager(
				makePos(-23.5505, -46.6333, 10, TEST_TIMESTAMP),
			);
			const first = manager.lastPosition;

			// 200 km away, 2 hours later → definitely exceeds both thresholds
			manager.update(makePos(-22.9068, -43.1729, 8, TEST_TIMESTAMP + 7_200_000));
			const second = manager.lastPosition;

			expect(second).not.toBe(first);
			expect(second!.latitude).toBeCloseTo(-22.9068, 4);
		});
	});

	// ── Real distance calculations ───────────────────────────────────────────

	describe('Real distance calculations', () => {
		it('accepts move from São Paulo to Rio (> 20 m threshold)', () => {
			initializeConfig({ minimumDistanceChange: 20, minimumTimeChange: 30_000 });

			const manager  = new PositionManager(
				makePos(-23.5505, -46.6333, 10, TEST_TIMESTAMP),
			);
			const observer = makeObserver();
			manager.subscribe(observer);

			// 2 hours later — time threshold also exceeded
			manager.update(makePos(-22.9068, -43.1729, 10, TEST_TIMESTAMP + 7_200_000));

			expect(observer.update).toHaveBeenCalledWith(
				manager,
				PositionManager.strCurrPosUpdate,
				null,
				null,
			);
		});

		it('blocks negligible movement (< 20 m) when time threshold is also not met', () => {
			initializeConfig({ minimumDistanceChange: 20, minimumTimeChange: 30_000 });

			// Near-identical coordinates: displacement ≈ 0.5 m
			const manager  = new PositionManager(
				makePos(-23.5505000, -46.6333000, 10, TEST_TIMESTAMP),
			);
			const observer = makeObserver();
			manager.subscribe(observer);

			// 1 second later — time threshold not met
			manager.update(makePos(-23.5505001, -46.6333001, 10, TEST_TIMESTAMP + 1_000));

			expect(observer.update).toHaveBeenCalledWith(
				manager,
				PositionManager.strCurrPosNotUpdate,
				null,
				expect.objectContaining({ name: 'DistanceAndTimeError' }),
			);
		});

		it('accepts negligible movement when time threshold IS met', () => {
			initializeConfig({ minimumDistanceChange: 20, minimumTimeChange: 30_000 });

			// Near-identical coordinates — stays in place
			const manager  = new PositionManager(
				makePos(-23.5505000, -46.6333000, 10, TEST_TIMESTAMP),
			);
			const observer = makeObserver();
			manager.subscribe(observer);

			// 31 seconds later — time threshold met
			manager.update(makePos(-23.5505001, -46.6333001, 10, TEST_TIMESTAMP + 31_000));

			expect(observer.update).toHaveBeenCalledWith(
				manager,
				expect.stringMatching(/PositionManager updated|Immediate address update/),
				null,
				expect.anything(),
			);
		});
	});

	// ── Accuracy filtering end-to-end ────────────────────────────────────────

	describe('Accuracy filtering end-to-end', () => {
		it('rejects very-bad accuracy positions in mobile mode', () => {
			initializeConfig({ notAcceptedAccuracy: ['medium', 'bad', 'very bad'] });

			const manager  = new PositionManager();
			const observer = makeObserver();
			manager.subscribe(observer);

			// 500 m accuracy → 'very bad'
			manager.update(makePos(-23.5505, -46.6333, 500));

			expect(observer.update).toHaveBeenCalledWith(
				manager,
				PositionManager.strCurrPosNotUpdate,
				null,
				expect.objectContaining({ name: 'AccuracyError' }),
			);
		});

		it('accepts excellent-accuracy position in desktop mode', () => {
			initializeConfig({ notAcceptedAccuracy: ['bad', 'very bad'] });

			const manager  = new PositionManager();
			const observer = makeObserver();
			manager.subscribe(observer);

			// 5 m accuracy → 'excellent'
			manager.update(makePos(-23.5505, -46.6333, 5));

			expect(observer.update).toHaveBeenCalledWith(
				manager,
				PositionManager.strCurrPosUpdate,
				null,
				null,
			);
		});
	});

	// ── Observer lifecycle ───────────────────────────────────────────────────

	describe('Observer lifecycle', () => {
		it('observer removed before update is not called', () => {
			const manager  = new PositionManager(makePos(-23.5505, -46.6333, 10, TEST_TIMESTAMP));
			const observer = makeObserver();

			manager.subscribe(observer);
			manager.unsubscribe(observer);

			// 2 h later, far away
			manager.update(makePos(-22.9068, -43.1729, 10, TEST_TIMESTAMP + 7_200_000));

			expect(observer.update).not.toHaveBeenCalled();
		});

		it('observer receives both accepted and rejected events during a journey', () => {
			initializeConfig({ minimumDistanceChange: 20, minimumTimeChange: 30_000 });

			const manager  = new PositionManager(makePos(-23.5505, -46.6333, 10, TEST_TIMESTAMP));
			const observer = makeObserver();
			manager.subscribe(observer);

			// Rejected: 1 second, barely moved
			manager.update(makePos(-23.5505001, -46.6333001, 10, TEST_TIMESTAMP + 1_000));
			// Accepted: 2 hours, far away
			manager.update(makePos(-22.9068, -43.1729, 10, TEST_TIMESTAMP + 7_200_000));

			expect(observer.update).toHaveBeenCalledTimes(2);

			const [firstCall, secondCall] = observer.update.mock.calls as
				[Parameters<typeof observer.update>, Parameters<typeof observer.update>];

			expect(firstCall[1]).toBe(PositionManager.strCurrPosNotUpdate);
			expect(secondCall[1]).toBe(PositionManager.strCurrPosUpdate);
		});
	});

	// ── toString ────────────────────────────────────────────────────────────

	describe('toString() with real position data', () => {
		it('includes all expected position components', () => {
			const manager = new PositionManager(makePos(-23.5505, -46.6333, 10, TEST_TIMESTAMP));
			const str     = manager.toString();

			expect(str).toContain('PositionManager');
			expect(str).toContain('-23.5505');
			expect(str).toContain('-46.6333');
		});
	});
});
