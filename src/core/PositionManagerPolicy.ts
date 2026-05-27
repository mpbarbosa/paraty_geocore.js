import GeoPosition, {
	type AccuracyQuality,
	type GeoCoords,
	type GeoPositionInput,
} from './GeoPosition.js';

export interface PositionManagerError {
	name: string;
	message: string;
}

export interface ValidPositionInput extends GeoPositionInput {
	timestamp: number;
	coords: GeoCoords & {
		latitude: number;
		longitude: number;
	};
}

export interface PositionInputValidationResult {
	position: ValidPositionInput | null;
	error: PositionManagerError | null;
}

export interface DistanceTimeGateResult {
	accepted: boolean;
	bypassed: boolean;
	distance: number | null;
	timeElapsed: number;
	distanceExceeded: boolean | null;
	timeExceeded: boolean | null;
	error: PositionManagerError | null;
}

export interface PositionEventClassification {
	immediate: boolean;
	timeElapsed: number;
	error: PositionManagerError | null;
}

const INVALID_POSITION_ERROR = 'InvalidPositionError';

function createError(name: string, message: string): PositionManagerError {
	return { name, message };
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

export function validatePositionInput(
	position: GeoPositionInput | null | undefined,
): PositionInputValidationResult {
	if (!position || typeof position !== 'object') {
		return {
			position: null,
			error: createError(
				INVALID_POSITION_ERROR,
				'Position must be a non-null object',
			),
		};
	}

	if (!isFiniteNumber(position.timestamp)) {
		return {
			position: null,
			error: createError(
				INVALID_POSITION_ERROR,
				'Position must include a finite timestamp',
			),
		};
	}

	if (!position.coords) {
		return {
			position: null,
			error: createError(
				INVALID_POSITION_ERROR,
				'Position must include coords',
			),
		};
	}

	if (
		!isFiniteNumber(position.coords.latitude) ||
		!isFiniteNumber(position.coords.longitude)
	) {
		return {
			position: null,
			error: createError(
				INVALID_POSITION_ERROR,
				'Position coords must include finite latitude and longitude',
			),
		};
	}

	return {
		position: {
			...position,
			timestamp: position.timestamp,
			coords: {
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
				accuracy: position.coords.accuracy,
				altitude: position.coords.altitude,
				altitudeAccuracy: position.coords.altitudeAccuracy,
				heading: position.coords.heading,
				speed: position.coords.speed,
			},
		},
		error: null,
	};
}

export function getRejectedAccuracyError(
	position: ValidPositionInput,
	notAcceptedAccuracy: AccuracyQuality[] | null,
): PositionManagerError | null {
	if (!notAcceptedAccuracy || notAcceptedAccuracy.length === 0) {
		return null;
	}

	const accuracyQuality = GeoPosition.getAccuracyQuality(
		position.coords.accuracy ?? Infinity,
	);

	if (!notAcceptedAccuracy.includes(accuracyQuality)) {
		return null;
	}

	return createError('AccuracyError', 'Accuracy is not good enough');
}

export function evaluateDistanceTimeGate({
	lastPosition,
	position,
	lastModified,
	minimumDistanceChange,
	minimumTimeChange,
	bypassDistanceRule,
	calculateDistance,
}: {
	lastPosition: GeoPosition | null;
	position: ValidPositionInput;
	lastModified: number | null;
	minimumDistanceChange: number;
	minimumTimeChange: number;
	bypassDistanceRule: boolean;
	calculateDistance: (
		lat1: number,
		lon1: number,
		lat2: number,
		lon2: number,
	) => number;
}): DistanceTimeGateResult {
	const timeElapsed = position.timestamp - (lastModified ?? 0);

	if (
		!lastPosition ||
		lastPosition.latitude == null ||
		lastPosition.longitude == null
	) {
		return {
			accepted: true,
			bypassed: false,
			distance: null,
			timeElapsed,
			distanceExceeded: null,
			timeExceeded: null,
			error: null,
		};
	}

	const distance = calculateDistance(
		lastPosition.latitude,
		lastPosition.longitude,
		position.coords.latitude,
		position.coords.longitude,
	);
	const distanceExceeded = distance >= minimumDistanceChange;
	const timeExceeded = timeElapsed >= minimumTimeChange;

	if (!distanceExceeded && !timeExceeded && !bypassDistanceRule) {
		return {
			accepted: false,
			bypassed: false,
			distance,
			timeElapsed,
			distanceExceeded,
			timeExceeded,
			error: createError(
				'DistanceAndTimeError',
				`Neither distance (${distance.toFixed(1)}m < ${minimumDistanceChange}m)` +
					` nor time (${(timeElapsed / 1000).toFixed(1)}s < ${minimumTimeChange / 1000}s) threshold met`,
			),
		};
	}

	return {
		accepted: true,
		bypassed: bypassDistanceRule && !distanceExceeded && !timeExceeded,
		distance,
		timeElapsed,
		distanceExceeded,
		timeExceeded,
		error: null,
	};
}

export function classifyPositionEvent(
	timestamp: number,
	lastModified: number | null,
	trackingInterval: number,
): PositionEventClassification {
	const timeElapsed = timestamp - (lastModified ?? 0);

	if (timeElapsed < trackingInterval) {
		return {
			immediate: true,
			timeElapsed,
			error: createError(
				'ElapseTimeError',
				`Less than ${trackingInterval / 1000}s since last update: ${timeElapsed / 1000}s`,
			),
		};
	}

	return {
		immediate: false,
		timeElapsed,
		error: null,
	};
}
