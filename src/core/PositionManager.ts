
/**
 * Centralized singleton manager for device geographic position.
 *
 * PositionManager implements the singleton and observer patterns to provide a
 * single source of truth for the current device position.  It wraps the
 * browser's Geolocation API, applies multi-layer validation rules (accuracy,
 * distance, and time thresholds), and notifies subscribed observers about
 * position changes.
 *
 * Key Features:
 * - Singleton pattern ensures one position state across the application
 * - Observer pattern for decoupled position-change notifications
 * - Smart filtering prevents excessive processing from GPS noise
 * - Multi-layer validation (accuracy quality, distance OR time threshold)
 * - Integration with {@link GeoPosition} for enhanced position data
 *
 * Validation Rules:
 * 1. Accuracy Quality: Rejects positions whose accuracy quality is listed in
 *    {@link PositionManagerConfig.notAcceptedAccuracy}.
 * 2. Distance OR Time Threshold: Updates if EITHER condition is met:
 *    - Movement ≥ {@link PositionManagerConfig.minimumDistanceChange} metres, OR
 *    - Time elapsed ≥ {@link PositionManagerConfig.minimumTimeChange} ms
 * 3. Event Classification: Distinguishes regular updates
 *    (≥ {@link PositionManagerConfig.trackingInterval}) from immediate ones.
 *
 * @module core/PositionManager
 * @pattern Singleton — Only one instance manages position state
 * @pattern Observer  — Notifies subscribers of position changes
 *
 * @see {@link GeoPosition}    For position data wrapper with convenience methods
 * @see {@link DualObserverSubject} For observer pattern implementation
 * @see [Complete Documentation](../../docs/POSITION_MANAGER.md)
 *
 * @example
 * // Basic usage — get singleton instance
 * const manager = PositionManager.getInstance();
 *
 * @example
 * // Subscribe to position updates
 * const observer = {
 *   update: (positionManager: PositionManager, eventType: string) => {
 *     if (eventType === PositionManager.strCurrPosUpdate) {
 *       console.log('Position:', positionManager.latitude, positionManager.longitude);
 *     }
 *   }
 * };
 * manager.subscribe(observer);
 *
 * @example
 * // Update position (typically done by GeolocationService)
 * navigator.geolocation.getCurrentPosition((position) => {
 *   const manager = PositionManager.getInstance();
 *   manager.update(position); // Validates and updates if rules pass
 * });
 *
 * @since 0.12.7-alpha
 * @author Marcelo Pereira Barbosa
 */

import GeoPosition from './GeoPosition.js';
import DualObserverSubject from './DualObserverSubject.js';
import { calculateDistance } from '../utils/distance.js';
import { log, warn } from '../utils/logger.js';
import { withObserver } from './ObserverMixin.js';
import type { AccuracyQuality } from './GeoPosition.js';

// ─── Configuration ──────────────────────────────────────────────────────────

/**
 * Configuration parameters for {@link PositionManager}.
 *
 * All fields are optional; call {@link initializeConfig} with a partial object
 * — the provided values override the defaults returned by
 * {@link createPositionManagerConfig}.
 */
export interface PositionManagerConfig {
	/**
	 * Minimum time (ms) between accepted position updates.
	 * Positions that arrive within this window trigger
	 * {@link PositionManager.strImmediateAddressUpdate} instead of
	 * {@link PositionManager.strCurrPosUpdate}.
	 * @default 50_000 (50 seconds)
	 */
	trackingInterval: number;

	/**
	 * Minimum distance (metres) the device must have moved before a position
	 * update is accepted (evaluated together with {@link minimumTimeChange}).
	 * @default 20
	 */
	minimumDistanceChange: number;

	/**
	 * Minimum time (ms) that must have elapsed since the last accepted update
	 * before a new one is accepted (evaluated together with
	 * {@link minimumDistanceChange}).
	 * @default 30_000 (30 seconds)
	 */
	minimumTimeChange: number;

	/**
	 * Accuracy-quality labels that will cause a position update to be rejected.
	 * Set to `null` to accept all accuracy levels.
	 * @default null
	 */
	notAcceptedAccuracy: AccuracyQuality[] | null;
}

/**
 * Returns a fresh config object pre-populated with library defaults.
 */
export function createPositionManagerConfig(): PositionManagerConfig {
	return {
		trackingInterval:       50_000,
		minimumDistanceChange:  20,
		minimumTimeChange:      30_000,
		notAcceptedAccuracy:    null,
	};
}

// Module-level mutable config — overridden via initializeConfig()
let config: PositionManagerConfig = createPositionManagerConfig();

/**
 * Overrides the module-level config used by every {@link PositionManager}
 * instance.  Useful for testing or application-level tuning.
 *
 * @param newConfig - Partial or full config object to merge with defaults
 *
 * @example
 * initializeConfig({
 *   minimumDistanceChange: 50,
 *   notAcceptedAccuracy: ['medium', 'bad', 'very bad'],
 * });
 *
 * @since 0.12.7-alpha
 */
export function initializeConfig(newConfig: Partial<PositionManagerConfig>): void {
	config = { ...createPositionManagerConfig(), ...newConfig };
}

// ─── Error type ─────────────────────────────────────────────────────────────

interface PositionError {
	name: string;
	message: string;
}

// ─── Observer type args ─────────────────────────────────────────────────────

/** Tuple forwarded to each observer on every notification. */
type PositionObserverArgs = [PositionManager, string, unknown, PositionError | null];

// ─── Class ──────────────────────────────────────────────────────────────────

/**
 * Manages the current geolocation position using singleton and observer
 * design patterns.
 *
 * This class provides centralised management of the user's current geographic
 * position, implementing timing constraints, accuracy validation, and
 * distance-based filtering to ensure position updates are meaningful and
 * efficient.  Subscribed observers are notified whenever a position change
 * occurs.
 *
 * @class PositionManager
 */
class PositionManager {
	/**
	 * Singleton instance holder.  Only one PositionManager exists per
	 * application.
	 *
	 * @static
	 */
	static instance: PositionManager | null = null;

	// ─── Instance properties ────────────────────────────────────────────────

	/** Internal subject for managing subscribers. */
	private observerSubject!: DualObserverSubject<PositionObserverArgs>;

	/** Timestamp (ms) of the most recently accepted position. */
	private lastModified: number | null = null;

	/** Last accepted geographic position. */
	lastPosition: GeoPosition | null = null;

	// Methods injected at runtime by withObserver() — declared here for TypeScript
	declare subscribe:   (observer: { update?: (...args: PositionObserverArgs) => void }) => void;
	declare unsubscribe: (observer: { update?: (...args: PositionObserverArgs) => void }) => void;

	// ─── Static event constants ─────────────────────────────────────────────

	/**
	 * Event fired when a position update is successfully accepted.
	 * @readonly
	 */
	static strCurrPosUpdate = 'PositionManager updated';

	/**
	 * Event fired when a position update is rejected by validation rules.
	 * @readonly
	 */
	static strCurrPosNotUpdate = 'PositionManager not updated';

	/**
	 * Event fired when a position update is accepted but arrived before the
	 * {@link PositionManagerConfig.trackingInterval} has elapsed, signalling
	 * that address geocoding should be triggered immediately.
	 * @readonly
	 */
	static strImmediateAddressUpdate = 'Immediate address update';

	// ─── Static factory ─────────────────────────────────────────────────────

	/**
	 * Gets or creates the singleton PositionManager instance.
	 *
	 * Implements the singleton pattern ensuring only one PositionManager
	 * instance exists throughout the application lifecycle.  If a position is
	 * supplied and an instance already exists, it delegates to
	 * {@link update}.
	 *
	 * @param position - Optional HTML5 Geolocation API position object
	 * @returns The singleton PositionManager instance
	 *
	 * @example
	 * const manager = PositionManager.getInstance();
	 *
	 * @example
	 * navigator.geolocation.getCurrentPosition((pos) => {
	 *   const manager = PositionManager.getInstance(pos);
	 *   console.log(manager.latitude, manager.longitude);
	 * });
	 *
	 * @since 0.12.7-alpha
	 */
	static getInstance(position?: GeolocationPosition): PositionManager {
		if (!PositionManager.instance) {
			PositionManager.instance = new PositionManager(position);
		} else if (position) {
			PositionManager.instance.update(position);
		}
		return PositionManager.instance!;
	}

	// ─── Constructor ────────────────────────────────────────────────────────

	/**
	 * Creates a new PositionManager instance.
	 *
	 * Initialises an internal {@link DualObserverSubject} and optionally
	 * seeds the instance with initial position data.  In normal usage this
	 * constructor is called only by {@link getInstance}.
	 *
	 * @param position - Optional initial position data
	 *
	 * @since 0.12.7-alpha
	 */
	constructor(position?: GeolocationPosition) {
		this.observerSubject = new DualObserverSubject<PositionObserverArgs>();
		this.lastModified = null;
		if (position) {
			this.update(position);
		}
	}

	// ─── Backward-compat observers accessor ────────────────────────────────

	/**
	 * Returns the current list of object-based observers.
	 * @returns Read-only array of subscribed observers
	 */
	get observers() {
		return this.observerSubject.observers;
	}

	// ─── Position property proxies ──────────────────────────────────────────

	/** Latitude of the last accepted position (decimal degrees). */
	get latitude()        { return this.lastPosition?.latitude; }
	/** Longitude of the last accepted position (decimal degrees). */
	get longitude()       { return this.lastPosition?.longitude; }
	/** Accuracy of the last accepted position in metres. */
	get accuracy()        { return this.lastPosition?.accuracy; }
	/** Accuracy quality label for the last accepted position. */
	get accuracyQuality() { return this.lastPosition?.accuracyQuality; }
	/** Altitude of the last accepted position in metres (may be `null`). */
	get altitude()        { return this.lastPosition?.altitude; }
	/** Compass heading of the last accepted position (may be `null`). */
	get heading()         { return this.lastPosition?.heading; }
	/** Speed of the last accepted position in m/s (may be `null`). */
	get speed()           { return this.lastPosition?.speed; }
	/** Timestamp (ms) of the last accepted position. */
	get timestamp()       { return this.lastPosition?.timestamp; }

	// ─── Core notification method ───────────────────────────────────────────

	/**
	 * Notifies all subscribed observers with the given event type and optional
	 * payload.
	 *
	 * @param posEvent - One of the static event string constants
	 * @param data     - Optional payload (defaults to `null`)
	 * @param error    - Optional error descriptor (defaults to `null`)
	 */
	notifyObservers(
		posEvent: string,
		data: unknown = null,
		error: PositionError | null = null,
	): void {
		this.observerSubject.notifyObservers(this, posEvent, data, error);
	}

	// ─── Update ─────────────────────────────────────────────────────────────

	/**
	 * Updates the position with multi-layer validation and filtering rules.
	 *
	 * Validation layers (evaluated in order):
	 * 1. **Position validity** — must have a valid object with a timestamp.
	 * 2. **Accuracy requirement** — rejects quality labels listed in
	 *    {@link PositionManagerConfig.notAcceptedAccuracy}.
	 * 3. **Distance OR time threshold** — rejects updates where *neither*
	 *    the distance nor the time threshold is exceeded.
	 * 4. **Event classification** — emits
	 *    {@link strImmediateAddressUpdate} when the update arrives before
	 *    {@link PositionManagerConfig.trackingInterval} has elapsed.
	 *
	 * When validation passes, position properties are updated and observers
	 * are notified.  When validation fails, observers receive
	 * {@link strCurrPosNotUpdate} with an error descriptor.
	 *
	 * @param position - New position data from the Geolocation API
	 *
	 * @fires PositionManager#strCurrPosUpdate        — position accepted
	 * @fires PositionManager#strImmediateAddressUpdate — accepted but early
	 * @fires PositionManager#strCurrPosNotUpdate     — position rejected
	 *
	 * @example
	 * navigator.geolocation.getCurrentPosition((pos) => {
	 *   PositionManager.getInstance().update(pos);
	 * });
	 *
	 * @since 0.12.7-alpha
	 */
	update(position: GeolocationPosition): void {
		let bUpdateCurrPos = true;
		let error: PositionError | null = null;

		log('(PositionManager) update called with position:', position);
		log('(PositionManager) lastPosition:', this.lastPosition);

		if (!position || !position.timestamp) {
			warn('(PositionManager) Invalid position data:', position);
			return;
		}

		// ── Accuracy validation ───────────────────────────────────────────
		if (
			config.notAcceptedAccuracy &&
			Array.isArray(config.notAcceptedAccuracy) &&
			config.notAcceptedAccuracy.includes(
				GeoPosition.getAccuracyQuality(position.coords.accuracy),
			)
		) {
			bUpdateCurrPos = false;
			error = { name: 'AccuracyError', message: 'Accuracy is not good enough' };
			warn('(PositionManager) Accuracy not good enough:', position.coords.accuracy);
		}

		// ── Distance OR time validation ───────────────────────────────────
		if (
			this.lastPosition &&
			this.lastPosition.latitude  != null &&
			this.lastPosition.longitude != null &&
			position.coords
		) {
			const distance = calculateDistance(
				this.lastPosition.latitude,
				this.lastPosition.longitude,
				position.coords.latitude,
				position.coords.longitude,
			);

			const timeElapsed        = position.timestamp - (this.lastModified ?? 0);
			const timeElapsedSeconds = (timeElapsed / 1000).toFixed(1);

			const distanceExceeded = distance >= config.minimumDistanceChange;
			const timeExceeded     = timeElapsed >= config.minimumTimeChange;

			if (!distanceExceeded && !timeExceeded) {
				bUpdateCurrPos = false;
				error = {
					name: 'DistanceAndTimeError',
					message:
						`Neither distance (${distance.toFixed(1)}m < ${config.minimumDistanceChange}m)` +
						` nor time (${timeElapsedSeconds}s < ${config.minimumTimeChange / 1000}s) threshold met`,
				};
				warn(
					'(PositionManager) Update blocked — distance:',
					`${distance.toFixed(1)}m`,
					'time:',
					`${timeElapsedSeconds}s`,
				);
			} else {
				if (distanceExceeded && timeExceeded) {
					log('(PositionManager) Update triggered — BOTH conditions met — distance:',
						`${distance.toFixed(1)}m`, 'time:', `${timeElapsedSeconds}s`);
				} else if (distanceExceeded) {
					log('(PositionManager) Update triggered by DISTANCE —',
						`${distance.toFixed(1)}m`, '(time:', `${timeElapsedSeconds}s)`);
				} else {
					log('(PositionManager) Update triggered by TIME —',
						`${timeElapsedSeconds}s`, '(distance:', `${distance.toFixed(1)}m)`);
				}
			}
		}

		if (!bUpdateCurrPos) {
			this.notifyObservers(PositionManager.strCurrPosNotUpdate, null, error);
			return;
		}

		// ── Event classification ──────────────────────────────────────────
		let posEvent: string;

		if (position.timestamp - (this.lastModified ?? 0) < config.trackingInterval) {
			const msg = `Less than ${config.trackingInterval / 1000}s since last update: ` +
				`${(position.timestamp - (this.lastModified ?? 0)) / 1000}s`;
			error = { name: 'ElapseTimeError', message: msg };
			warn('(PositionManager)', msg);
			posEvent = PositionManager.strImmediateAddressUpdate;
		} else {
			posEvent = PositionManager.strCurrPosUpdate;
		}

		this.lastPosition = new GeoPosition(position);
		this.lastModified = position.timestamp;
		this.notifyObservers(posEvent, null, error);
	}

	// ─── toString ───────────────────────────────────────────────────────────

	/**
	 * Returns a formatted string representation of the current position,
	 * useful for debugging and logging.
	 *
	 * @returns Human-readable summary of the current position
	 *
	 * @example
	 * console.log(manager.toString());
	 * // "PositionManager: -23.5505, -46.6333, good, 760, 0, 0, 1634567890123"
	 *
	 * @since 0.12.7-alpha
	 */
	toString(): string {
		const position = this.lastPosition;
		if (!position || this.latitude == null || this.longitude == null) {
			return `${this.constructor.name}: No position data`;
		}
		return (
			`${this.constructor.name}: ` +
			`${position.latitude}, ${position.longitude}, ` +
			`${position.accuracyQuality}, ${position.altitude}, ` +
			`${position.speed}, ${position.heading}, ${position.timestamp}`
		);
	}
}

// Apply observer mixin for subscribe/unsubscribe delegation.
// notifyObservers has a custom signature so it is excluded from the mixin.
Object.assign(PositionManager.prototype, withObserver({ excludeNotify: true }));

export default PositionManager;
