"use strict";
/**
 * Logging utilities for paraty_geocore.js.
 *
 * Provides `log` and `warn` helpers that prefix messages with a timestamp and
 * forward them to the appropriate `console` method.  Callers should prefer
 * these helpers over raw `console` calls so that the output style stays
 * consistent across the library.
 *
 * @module utils/logger
 * @since 0.12.6-alpha
 * @author Marcelo Pereira Barbosa
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
exports.warn = warn;
/**
 * Emits a timestamped informational message via `console.log`.
 *
 * @param message - Primary message string
 * @param params  - Additional values passed to `console.log`
 */
function log(message, ...params) {
    const ts = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.log(`[${ts}] ${message}`, ...params);
}
/**
 * Emits a timestamped warning message via `console.warn`.
 *
 * @param message - Primary message string
 * @param params  - Additional values passed to `console.warn`
 */
function warn(message, ...params) {
    const ts = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.warn(`[${ts}] ${message}`, ...params);
}
