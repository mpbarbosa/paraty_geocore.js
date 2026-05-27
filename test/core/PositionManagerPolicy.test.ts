import GeoPosition from '../../src/core/GeoPosition';
import {
	classifyPositionEvent,
	evaluateDistanceTimeGate,
	getRejectedAccuracyError,
	validatePositionInput,
} from '../../src/core/PositionManagerPolicy';
import {
	TEST_TIMESTAMP,
	makeBrowserPosition,
	makeGeoPositionInput,
} from '../helpers/fixtures';

describe('PositionManagerPolicy', () => {
	describe('validatePositionInput()', () => {
		it('accepts a plain GeoPositionInput', () => {
			const input = makeGeoPositionInput(-23.5505, -46.6333, 10);
			const result = validatePositionInput(input);

			expect(result.error).toBeNull();
			expect(result.position).toEqual(input);
		});

		it('accepts a browser-style position object', () => {
			const input = makeBrowserPosition(
				{ latitude: -23.5505, longitude: -46.6333, accuracy: 10 },
				TEST_TIMESTAMP,
			) as any;
			const result = validatePositionInput(input);

			expect(result.error).toBeNull();
			expect(result.position?.timestamp).toBe(TEST_TIMESTAMP);
			expect(result.position?.coords.latitude).toBe(-23.5505);
			expect(result.position?.coords.longitude).toBe(-46.6333);
		});

		it('rejects null input', () => {
			const result = validatePositionInput(null);
			expect(result.position).toBeNull();
			expect(result.error).toEqual(
				expect.objectContaining({ name: 'InvalidPositionError' }),
			);
		});

		it('rejects missing timestamp', () => {
			const result = validatePositionInput({
				coords: { latitude: -23.5505, longitude: -46.6333, accuracy: 10 },
			});
			expect(result.position).toBeNull();
			expect(result.error).toEqual(
				expect.objectContaining({ name: 'InvalidPositionError' }),
			);
		});

		it('rejects missing coords', () => {
			const result = validatePositionInput({ timestamp: TEST_TIMESTAMP });
			expect(result.position).toBeNull();
			expect(result.error).toEqual(
				expect.objectContaining({ name: 'InvalidPositionError' }),
			);
		});
	});

	describe('getRejectedAccuracyError()', () => {
		it('returns null when the quality is accepted', () => {
			const result = validatePositionInput(
				makeGeoPositionInput(-23.5505, -46.6333, 10),
			);
			expect(result.position).not.toBeNull();
			expect(
				getRejectedAccuracyError(result.position!, ['bad', 'very bad']),
			).toBeNull();
		});

		it('returns AccuracyError when the quality is rejected', () => {
			const result = validatePositionInput(
				makeGeoPositionInput(-23.5505, -46.6333, 500),
			);
			expect(result.position).not.toBeNull();
			expect(
				getRejectedAccuracyError(result.position!, ['medium', 'bad', 'very bad']),
			).toEqual(
				expect.objectContaining({ name: 'AccuracyError' }),
			);
		});
	});

	describe('evaluateDistanceTimeGate()', () => {
		it('accepts the first update when no previous position exists', () => {
			const result = evaluateDistanceTimeGate({
				lastPosition: null,
				position: validatePositionInput(
					makeGeoPositionInput(-23.5505, -46.6333, 10),
				).position!,
				lastModified: null,
				minimumDistanceChange: 20,
				minimumTimeChange: 30_000,
				bypassDistanceRule: false,
				calculateDistance: jest.fn(),
			});

			expect(result.accepted).toBe(true);
			expect(result.distance).toBeNull();
		});

		it('rejects when neither distance nor time thresholds are met', () => {
			const result = evaluateDistanceTimeGate({
				lastPosition: new GeoPosition(
					makeGeoPositionInput(-23.5505, -46.6333, 10),
				),
				position: validatePositionInput(
					{
						...makeGeoPositionInput(-23.5506, -46.6334, 10),
						timestamp: TEST_TIMESTAMP + 1_000,
					},
				).position!,
				lastModified: TEST_TIMESTAMP,
				minimumDistanceChange: 20,
				minimumTimeChange: 30_000,
				bypassDistanceRule: false,
				calculateDistance: jest.fn(() => 5),
			});

			expect(result.accepted).toBe(false);
			expect(result.error).toEqual(
				expect.objectContaining({ name: 'DistanceAndTimeError' }),
			);
		});

		it('accepts when the bypass flag is enabled', () => {
			const result = evaluateDistanceTimeGate({
				lastPosition: new GeoPosition(
					makeGeoPositionInput(-23.5505, -46.6333, 10),
				),
				position: validatePositionInput(
					{
						...makeGeoPositionInput(-23.5506, -46.6334, 10),
						timestamp: TEST_TIMESTAMP + 1_000,
					},
				).position!,
				lastModified: TEST_TIMESTAMP,
				minimumDistanceChange: 20,
				minimumTimeChange: 30_000,
				bypassDistanceRule: true,
				calculateDistance: jest.fn(() => 5),
			});

			expect(result.accepted).toBe(true);
			expect(result.bypassed).toBe(true);
		});
	});

	describe('classifyPositionEvent()', () => {
		it('classifies elapsed updates as regular updates', () => {
			const result = classifyPositionEvent(
				TEST_TIMESTAMP + 60_000,
				TEST_TIMESTAMP,
				50_000,
			);
			expect(result.immediate).toBe(false);
			expect(result.error).toBeNull();
		});

		it('classifies short-interval updates as immediate updates', () => {
			const result = classifyPositionEvent(
				TEST_TIMESTAMP + 5_000,
				TEST_TIMESTAMP,
				50_000,
			);
			expect(result.immediate).toBe(true);
			expect(result.error).toEqual(
				expect.objectContaining({ name: 'ElapseTimeError' }),
			);
		});
	});
});
