/**
 * General-purpose async utility functions.
 *
 * These helpers are unrelated to geolocation but are provided as convenience
 * utilities for callers building polling or throttling logic around the library.
 *
 * @module utils/async
 * @since 0.10.0-alpha
 */
/**
 * Creates a Promise that resolves after the specified number of milliseconds.
 *
 * Wraps `setTimeout` for use with `async/await`. Passing `0` yields control
 * on the next event-loop tick without a guaranteed minimum wait.
 *
 * @param {number} ms - Delay duration in milliseconds
 * @returns {Promise<void>} Promise that resolves after `ms` milliseconds
 *
 * @example
 * async function pollPosition() {
 *   while (true) {
 *     await fetchAndProcessPosition();
 *     await delay(5000); // wait 5 s between polls
 *   }
 * }
 *
 * @since 0.10.0-alpha
 */
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
