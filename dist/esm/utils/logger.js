/**
 * Logging utilities for paraty_geocore.js.
 *
 * Provides `log` and `warn` helpers that prefix messages with a timestamp and
 * forward them to the appropriate `console` method.  Callers should prefer
 * these helpers over raw `console` calls so that the output style stays
 * consistent across the library.
 *
 * @module utils/logger
 * @since 0.12.1-alpha
 * @author Marcelo Pereira Barbosa
 */
/**
 * Emits a timestamped informational message via `console.log`.
 *
 * @param message - Primary message string
 * @param params  - Additional values passed to `console.log`
 */
export function log(message, ...params) {
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
export function warn(message, ...params) {
    const ts = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.warn(`[${ts}] ${message}`, ...params);
}
