// src/core/GeoPosition.test.ts

import GeoPosition, { GeoCoords, GeoPositionInput, AccuracyQuality } from '../../src/core/GeoPosition';
import { calculateDistance } from '../../src/utils/distance';

jest.mock('../../src/utils/distance', () => ({
	calculateDistance: jest.fn(),
}));

describe('GeoPosition', () => {
	const mockDistance = 1234.56;
	beforeEach(() => {
		(calculateDistance as jest.Mock).mockReturnValue(mockDistance);
	});
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('constructor', () => {
		it('should create a GeoPosition with full data', () => {
			const input: GeoPositionInput = {
				timestamp: 1634567890123,
				coords: {
					latitude: -23.5505,
					longitude: -46.6333,
					accuracy: 15,
					altitude: 760,
					altitudeAccuracy: 5,
					heading: 0,
					speed: 0,
				},
			};
			const pos = new GeoPosition(input);
			expect(pos.latitude).toBe(-23.5505);
			expect(pos.longitude).toBe(-46.6333);
			expect(pos.accuracy).toBe(15);
			expect(pos.altitude).toBe(760);
			expect(pos.altitudeAccuracy).toBe(5);
			expect(pos.heading).toBe(0);
			expect(pos.speed).toBe(0);
			expect(pos.timestamp).toBe(1634567890123);
			expect(pos.geolocationPosition).toEqual({
				timestamp: 1634567890123,
				coords: {
					latitude: -23.5505,
					longitude: -46.6333,
					accuracy: 15,
					altitude: 760,
					altitudeAccuracy: 5,
					heading: 0,
					speed: 0,
				},
			});
			expect(Object.isFrozen(pos)).toBe(true);
			expect(Object.isFrozen(pos.geolocationPosition!)).toBe(true);
			expect(Object.isFrozen(pos.coords!)).toBe(true);
		});

		it('should handle missing coords gracefully', () => {
			const input: GeoPositionInput = { timestamp: 1234567890 };
			const pos = new GeoPosition(input);
			expect(pos.latitude).toBeUndefined();
			expect(pos.longitude).toBeUndefined();
			expect(pos.accuracy).toBeUndefined();
			expect(pos.coords).toBeNull();
			expect(pos.geolocationPosition).toEqual({
				timestamp: 1234567890,
				coords: {},
			});
		});

		it('should handle null/undefined input', () => {
			const pos = new GeoPosition({} as GeoPositionInput);
			expect(pos.latitude).toBeUndefined();
			expect(pos.longitude).toBeUndefined();
			expect(pos.accuracy).toBeUndefined();
			expect(pos.coords).toBeNull();
			expect(pos.geolocationPosition).toEqual({
				timestamp: undefined,
				coords: {},
			});
		});

		it('should set geolocationPosition to null when position is null', () => {
			const pos = new GeoPosition(null as any);
			expect(pos.geolocationPosition).toBeNull();
			expect(pos.coords).toBeNull();
			expect(pos.latitude).toBeUndefined();
			expect(pos.longitude).toBeUndefined();
			expect(pos.accuracyQuality).toBe('very bad');
		});

		it('should handle partial coords', () => {
			const input: GeoPositionInput = {
				coords: { latitude: 10.5 },
			};
			const pos = new GeoPosition(input);
			expect(pos.latitude).toBe(10.5);
			expect(pos.longitude).toBeUndefined();
			expect(pos.accuracy).toBeUndefined();
			expect(pos.coords).toEqual({ latitude: 10.5 });
		});
	});

	describe('parseCoords', () => {
		it('should freeze returned object', () => {
			const coords: GeoCoords = { latitude: 1, longitude: 2 };
			const pos = new GeoPosition({ coords });
			expect(Object.isFrozen(pos.coords!)).toBe(true);
		});
		it('should return empty frozen object for undefined', () => {
			const pos = new GeoPosition({});
			expect(pos.coords).toBeNull();
			expect(Object.isFrozen(pos.geolocationPosition!.coords)).toBe(true);
		});
	});

	describe('from', () => {
		it('should create a GeoPosition instance', () => {
			const input: GeoPositionInput = {
				timestamp: 1000,
				coords: { latitude: 1, longitude: 2, accuracy: 5 },
			};
			const pos = GeoPosition.from(input);
			expect(pos).toBeInstanceOf(GeoPosition);
			expect(pos.latitude).toBe(1);
			expect(pos.longitude).toBe(2);
			expect(pos.accuracy).toBe(5);
		});
	});

	describe('getAccuracyQuality', () => {
		const cases: [number, AccuracyQuality][] = [
			[5, 'excellent'],
			[10, 'excellent'],
			[11, 'good'],
			[30, 'good'],
			[31, 'medium'],
			[100, 'medium'],
			[101, 'bad'],
			[200, 'bad'],
			[201, 'very bad'],
			[500, 'very bad'],
			[Infinity, 'very bad'],
			[-1, 'excellent'],
		];
		it.each(cases)(
			'should classify accuracy %p as %p',
			(accuracy, expected) => {
				expect(GeoPosition.getAccuracyQuality(accuracy)).toBe(expected);
			},
		);
	});

	describe('calculateAccuracyQuality', () => {
		it('should return correct quality for current accuracy', () => {
			const pos = new GeoPosition({
				coords: { latitude: 1, longitude: 2, accuracy: 25 },
			});
			expect(pos.calculateAccuracyQuality()).toBe('good');
		});
		it('should return "very bad" for missing accuracy', () => {
			const pos = new GeoPosition({ coords: { latitude: 1, longitude: 2 } });
			expect(pos.calculateAccuracyQuality()).toBe('very bad');
		});
	});

	describe('distanceTo', () => {
		it('should call calculateDistance with correct args', () => {
			const pos = new GeoPosition({
				coords: { latitude: 10, longitude: 20 },
			});
			const other = { latitude: 30, longitude: 40 };
			const result = pos.distanceTo(other);
			expect(calculateDistance).toHaveBeenCalledWith(10, 20, 30, 40);
			expect(result).toBe(mockDistance);
		});
		it('should return NaN if latitude is undefined', () => {
			const pos = new GeoPosition({ coords: { longitude: 20 } });
			const other = { latitude: 30, longitude: 40 };
			expect(pos.distanceTo(other)).toBeNaN();
		});
		it('should return NaN if longitude is undefined', () => {
			const pos = new GeoPosition({ coords: { latitude: 10 } });
			const other = { latitude: 30, longitude: 40 };
			expect(pos.distanceTo(other)).toBeNaN();
		});
	});

	describe('toString', () => {
		it('should return formatted string for valid position', () => {
			const pos = new GeoPosition({
				timestamp: 1234567890,
				coords: {
					latitude: 1.1,
					longitude: 2.2,
					accuracy: 15,
					altitude: 100,
					speed: 5,
					heading: 90,
				},
			});
			expect(pos.toString()).toBe(
				`GeoPosition: 1.1, 2.2, good, 100, 5, 90, 1234567890`,
			);
		});
		it('should return "No position data" if latitude/longitude missing', () => {
			const pos = new GeoPosition({});
			expect(pos.toString()).toBe('GeoPosition: No position data');
		});
		it('should handle falsy latitude/longitude (0)', () => {
			const pos = new GeoPosition({
				coords: { latitude: 0, longitude: 0 },
			});
			expect(pos.toString()).toBe('GeoPosition: No position data');
		});
	});

	describe('immutability', () => {
		it('should not allow mutation of instance properties', () => {
			const pos = new GeoPosition({
				coords: { latitude: 1, longitude: 2, accuracy: 5 },
			});
			expect(() => {
				// @ts-expect-error
				pos.latitude = 99;
			}).toThrow();
			expect(() => {
				// @ts-expect-error
				pos.coords.latitude = 99;
			}).toThrow();
		});
	});
});
