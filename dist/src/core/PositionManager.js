"use strict";
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
 * @since 0.12.10-alpha
 * @author Marcelo Pereira Barbosa
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPositionManagerConfig = createPositionManagerConfig;
exports.initializeConfig = initializeConfig;
const GeoPosition_js_1 = __importDefault(require("./GeoPosition.js"));
const DualObserverSubject_js_1 = __importDefault(require("./DualObserverSubject.js"));
const distance_js_1 = require("../utils/distance.js");
const logger_js_1 = require("../utils/logger.js");
const ObserverMixin_js_1 = require("./ObserverMixin.js");
const PositionManagerPolicy_js_1 = require("./PositionManagerPolicy.js");
/**
 * Returns a fresh config object pre-populated with library defaults.
 */
function createPositionManagerConfig() {
    return {
        trackingInterval: 50000,
        minimumDistanceChange: 20,
        minimumTimeChange: 30000,
        notAcceptedAccuracy: null,
    };
}
// Module-level mutable config — overridden via initializeConfig()
let config = createPositionManagerConfig();
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
 * @since 0.12.10-alpha
 */
function initializeConfig(newConfig) {
    config = { ...createPositionManagerConfig(), ...newConfig };
}
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
    // ─── Static factory ─────────────────────────────────────────────────────
    /**
     * Gets or creates the singleton PositionManager instance.
     *
     * Implements the singleton pattern ensuring only one PositionManager
     * instance exists throughout the application lifecycle.  If a position is
     * supplied and an instance already exists, it delegates to
     * {@link update}.
     *
     * @param position - Optional position data in the library-owned
     *   {@link GeoPositionInput} shape
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
     * @since 0.12.10-alpha
     */
    static getInstance(position) {
        if (!PositionManager.instance) {
            PositionManager.instance = new PositionManager(position);
        }
        else if (position) {
            PositionManager.instance.update(position);
        }
        return PositionManager.instance;
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
     * @since 0.12.10-alpha
     */
    constructor(position) {
        /** Timestamp (ms) of the most recently accepted position. */
        this.lastModified = null;
        /** Last accepted geographic position. */
        this.lastPosition = null;
        /**
         * When `true`, the distance/time gate is bypassed so every throttled GPS
         * fix is forwarded to subscribers regardless of movement distance or elapsed
         * time.  Intended to be set to `true` while a logradouro confirmation is in
         * progress (so the confirmation buffer fills quickly) and restored to `false`
         * once the confirmation buffers settle.
         *
         * @since 0.13.0-alpha
         */
        this._bypassDistanceRule = false;
        this.observerSubject = new DualObserverSubject_js_1.default();
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
    get latitude() { return this.lastPosition?.latitude; }
    /** Longitude of the last accepted position (decimal degrees). */
    get longitude() { return this.lastPosition?.longitude; }
    /** Accuracy of the last accepted position in metres. */
    get accuracy() { return this.lastPosition?.accuracy; }
    /** Accuracy quality label for the last accepted position. */
    get accuracyQuality() { return this.lastPosition?.accuracyQuality; }
    /** Altitude of the last accepted position in metres (may be `null`). */
    get altitude() { return this.lastPosition?.altitude; }
    /** Compass heading of the last accepted position (may be `null`). */
    get heading() { return this.lastPosition?.heading; }
    /** Speed of the last accepted position in m/s (may be `null`). */
    get speed() { return this.lastPosition?.speed; }
    /** Timestamp (ms) of the last accepted position. */
    get timestamp() { return this.lastPosition?.timestamp; }
    // ─── Core notification method ───────────────────────────────────────────
    /**
     * Notifies all subscribed observers with the given event type and optional
     * payload.
     *
     * @param posEvent - One of the static event string constants
     * @param data     - Optional payload (defaults to `null`)
     * @param error    - Optional error descriptor (defaults to `null`)
     */
    notifyObservers(posEvent, data = null, error = null) {
        this.observerSubject.notifyObservers(this, posEvent, data, error);
    }
    // ─── Update ─────────────────────────────────────────────────────────────
    /**
     * Updates the position with multi-layer validation and filtering rules.
     *
     * Validation layers (evaluated in order):
     * 1. **Position validity** — must have a valid object with a finite timestamp
     *    and coordinates.
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
     * {@link strCurrPosNotUpdate} with an error descriptor, including invalid
     * input that cannot be processed.
     *
     * @param position - New position data in the library-owned
     *   {@link GeoPositionInput} shape
     *
     * @fires PositionManager#strCurrPosUpdate        — position accepted
     * @fires PositionManager#strImmediateAddressUpdate — accepted but early
     * @fires PositionManager#strCurrPosNotUpdate     — position rejected
     *
     * @example
     * navigator.geolocation.getCurrentPosition((rawPosition) => {
     *   PositionManager.getInstance().update(rawPosition);
     * });
     *
     * @since 0.12.10-alpha
     */
    update(position) {
        let error = null;
        (0, logger_js_1.log)('(PositionManager) update called with position:', position);
        (0, logger_js_1.log)('(PositionManager) lastPosition:', this.lastPosition);
        const validation = (0, PositionManagerPolicy_js_1.validatePositionInput)(position);
        if (!validation.position || validation.error) {
            (0, logger_js_1.warn)('(PositionManager) Invalid position data:', position);
            this.notifyObservers(PositionManager.strCurrPosNotUpdate, null, validation.error);
            return;
        }
        const nextPosition = validation.position;
        // ── Accuracy validation ───────────────────────────────────────────
        error = (0, PositionManagerPolicy_js_1.getRejectedAccuracyError)(nextPosition, config.notAcceptedAccuracy);
        if (error) {
            (0, logger_js_1.warn)('(PositionManager) Accuracy not good enough:', nextPosition.coords.accuracy ?? Infinity);
            this.notifyObservers(PositionManager.strCurrPosNotUpdate, null, error);
            return;
        }
        // ── Distance OR time validation ───────────────────────────────────
        const gateResult = (0, PositionManagerPolicy_js_1.evaluateDistanceTimeGate)({
            lastPosition: this.lastPosition,
            position: nextPosition,
            lastModified: this.lastModified,
            minimumDistanceChange: config.minimumDistanceChange,
            minimumTimeChange: config.minimumTimeChange,
            bypassDistanceRule: this._bypassDistanceRule,
            calculateDistance: distance_js_1.calculateDistance,
        });
        if (gateResult.distance != null) {
            const timeElapsedSeconds = (gateResult.timeElapsed / 1000).toFixed(1);
            if (!gateResult.accepted) {
                (0, logger_js_1.warn)('(PositionManager) Update blocked — distance:', `${gateResult.distance.toFixed(1)}m`, 'time:', `${timeElapsedSeconds}s`);
            }
            else if (gateResult.bypassed) {
                (0, logger_js_1.log)('(PositionManager) Distance/time gate bypassed (confirmation pending) — distance:', `${gateResult.distance.toFixed(1)}m`, 'time:', `${timeElapsedSeconds}s`);
            }
            else if (gateResult.distanceExceeded && gateResult.timeExceeded) {
                (0, logger_js_1.log)('(PositionManager) Update triggered — BOTH conditions met — distance:', `${gateResult.distance.toFixed(1)}m`, 'time:', `${timeElapsedSeconds}s`);
            }
            else if (gateResult.distanceExceeded) {
                (0, logger_js_1.log)('(PositionManager) Update triggered by DISTANCE —', `${gateResult.distance.toFixed(1)}m`, '(time:', `${timeElapsedSeconds}s)`);
            }
            else {
                (0, logger_js_1.log)('(PositionManager) Update triggered by TIME —', `${timeElapsedSeconds}s`, '(distance:', `${gateResult.distance.toFixed(1)}m)`);
            }
        }
        if (!gateResult.accepted) {
            error = gateResult.error;
            this.notifyObservers(PositionManager.strCurrPosNotUpdate, null, error);
            return;
        }
        // ── Event classification ──────────────────────────────────────────
        let posEvent;
        const eventClassification = (0, PositionManagerPolicy_js_1.classifyPositionEvent)(nextPosition.timestamp, this.lastModified, config.trackingInterval);
        if (eventClassification.immediate) {
            error = eventClassification.error;
            (0, logger_js_1.warn)('(PositionManager)', eventClassification.error.message);
            posEvent = PositionManager.strImmediateAddressUpdate;
        }
        else {
            error = null;
            posEvent = PositionManager.strCurrPosUpdate;
        }
        this.lastPosition = new GeoPosition_js_1.default(nextPosition);
        this.lastModified = nextPosition.timestamp;
        this.notifyObservers(posEvent, null, error);
    }
    // ─── Bypass flag ────────────────────────────────────────────────────────
    /**
     * Enables or disables the distance/time gate bypass.
     *
     * When `true`, `update()` forwards every throttled GPS fix to subscribers
     * even if neither the distance nor the time threshold has been met.  Set to
     * `true` while a logradouro confirmation is in progress and restore to
     * `false` once the confirmation buffers settle.
     *
     * @param bypass - `true` to bypass the distance/time gate; `false` to
     *   restore normal behaviour.
     *
     * @since 0.13.0-alpha
     */
    setBypassDistanceRule(bypass) {
        this._bypassDistanceRule = bypass;
    }
    /** Returns whether the distance/time gate bypass is currently active. */
    get bypassDistanceRule() {
        return this._bypassDistanceRule;
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
     * @since 0.12.10-alpha
     */
    toString() {
        const position = this.lastPosition;
        if (!position || this.latitude == null || this.longitude == null) {
            return `${this.constructor.name}: No position data`;
        }
        return (`${this.constructor.name}: ` +
            `${position.latitude}, ${position.longitude}, ` +
            `${position.accuracyQuality}, ${position.altitude}, ` +
            `${position.speed}, ${position.heading}, ${position.timestamp}`);
    }
}
/**
 * Singleton instance holder.  Only one PositionManager exists per
 * application.
 *
 * @static
 */
PositionManager.instance = null;
// ─── Static event constants ─────────────────────────────────────────────
/**
 * Event fired when a position update is successfully accepted.
 * @readonly
 */
PositionManager.strCurrPosUpdate = 'PositionManager updated';
/**
 * Event fired when a position update is rejected by validation rules.
 * @readonly
 */
PositionManager.strCurrPosNotUpdate = 'PositionManager not updated';
/**
 * Event fired when a position update is accepted but arrived before the
 * {@link PositionManagerConfig.trackingInterval} has elapsed, signalling
 * that address geocoding should be triggered immediately.
 * @readonly
 */
PositionManager.strImmediateAddressUpdate = 'Immediate address update';
// Apply observer mixin for subscribe/unsubscribe delegation.
// notifyObservers has a custom signature so it is excluded from the mixin.
Object.assign(PositionManager.prototype, (0, ObserverMixin_js_1.withObserver)({ excludeNotify: true }));
exports.default = PositionManager;
