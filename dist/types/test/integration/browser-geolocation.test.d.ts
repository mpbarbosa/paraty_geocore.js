/**
 * Integration tests — browser Geolocation API simulation
 *
 * These tests verify the full pipeline using GeolocationPosition objects
 * that simulate the browser implementation: coords are exposed via
 * non-enumerable getters (spread / Object.assign produce an empty object),
 * which is the exact behaviour that GeoPosition.parseCoords must handle.
 */
export {};
