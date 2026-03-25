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
 * @since 0.12.4-alpha
 * @author Marcelo Pereira Barbosa
 */
import GeoPosition from './GeoPosition.js';
import type { AccuracyQuality } from './GeoPosition.js';
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
export declare function createPositionManagerConfig(): PositionManagerConfig;
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
 * @since 0.12.4-alpha
 */
export declare function initializeConfig(newConfig: Partial<PositionManagerConfig>): void;
interface PositionError {
    name: string;
    message: string;
}
/** Tuple forwarded to each observer on every notification. */
type PositionObserverArgs = [PositionManager, string, unknown, PositionError | null];
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
declare class PositionManager {
    /**
     * Singleton instance holder.  Only one PositionManager exists per
     * application.
     *
     * @static
     */
    static instance: PositionManager | null;
    /** Internal subject for managing subscribers. */
    private observerSubject;
    /** Timestamp (ms) of the most recently accepted position. */
    private lastModified;
    /** Last accepted geographic position. */
    lastPosition: GeoPosition | null;
    subscribe: (observer: {
        update?: (...args: PositionObserverArgs) => void;
    }) => void;
    unsubscribe: (observer: {
        update?: (...args: PositionObserverArgs) => void;
    }) => void;
    /**
     * Event fired when a position update is successfully accepted.
     * @readonly
     */
    static strCurrPosUpdate: string;
    /**
     * Event fired when a position update is rejected by validation rules.
     * @readonly
     */
    static strCurrPosNotUpdate: string;
    /**
     * Event fired when a position update is accepted but arrived before the
     * {@link PositionManagerConfig.trackingInterval} has elapsed, signalling
     * that address geocoding should be triggered immediately.
     * @readonly
     */
    static strImmediateAddressUpdate: string;
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
     * @since 0.12.4-alpha
     */
    static getInstance(position?: GeolocationPosition): PositionManager;
    /**
     * Creates a new PositionManager instance.
     *
     * Initialises an internal {@link DualObserverSubject} and optionally
     * seeds the instance with initial position data.  In normal usage this
     * constructor is called only by {@link getInstance}.
     *
     * @param position - Optional initial position data
     *
     * @since 0.12.4-alpha
     */
    constructor(position?: GeolocationPosition);
    /**
     * Returns the current list of object-based observers.
     * @returns Read-only array of subscribed observers
     */
    get observers(): readonly import("bessa_patterns.ts").ObserverObject<PositionObserverArgs>[];
    /** Latitude of the last accepted position (decimal degrees). */
    get latitude(): number | undefined;
    /** Longitude of the last accepted position (decimal degrees). */
    get longitude(): number | undefined;
    /** Accuracy of the last accepted position in metres. */
    get accuracy(): number | undefined;
    /** Accuracy quality label for the last accepted position. */
    get accuracyQuality(): AccuracyQuality | undefined;
    /** Altitude of the last accepted position in metres (may be `null`). */
    get altitude(): number | null | undefined;
    /** Compass heading of the last accepted position (may be `null`). */
    get heading(): number | null | undefined;
    /** Speed of the last accepted position in m/s (may be `null`). */
    get speed(): number | null | undefined;
    /** Timestamp (ms) of the last accepted position. */
    get timestamp(): number | undefined;
    /**
     * Notifies all subscribed observers with the given event type and optional
     * payload.
     *
     * @param posEvent - One of the static event string constants
     * @param data     - Optional payload (defaults to `null`)
     * @param error    - Optional error descriptor (defaults to `null`)
     */
    notifyObservers(posEvent: string, data?: unknown, error?: PositionError | null): void;
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
     * @since 0.12.4-alpha
     */
    update(position: GeolocationPosition): void;
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
     * @since 0.12.4-alpha
     */
    toString(): string;
}
export default PositionManager;
