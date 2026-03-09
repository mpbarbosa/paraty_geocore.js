#!/usr/bin/env node
/**
 * Smoke test for the compiled CJS dist bundle.
 *
 * Imports the package's CJS entry-point and exercises every public export to
 * verify that the build artefacts are correctly structured and functional.
 *
 * Run via:  node scripts/smoke-test.cjs
 *           npm run test:smoke
 *
 * Exit code 0 → all checks passed.
 * Exit code 1 → one or more checks failed (see output for details).
 */
'use strict';

const path = require('path');
const distIndex = path.join(__dirname, '..', 'dist', 'src', 'index.js');

let passed = 0;
let failed = 0;

function check(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

let exports_;
try {
  exports_ = require(distIndex);
} catch (err) {
  console.error(`\nFATAL: could not require('${distIndex}')`);
  console.error(err.message);
  process.exit(1);
}

const {
  GeoPosition,
  GeoPositionError,
  GeocodingState,
  ObserverSubject,
  DualObserverSubject,
  calculateDistance,
  EARTH_RADIUS_METERS,
  delay,
} = exports_;

console.log(`Smoke test — dist/src/index.js\n`);

// ---------------------------------------------------------------------------
// 1. Exports exist and have the right type
// ---------------------------------------------------------------------------

console.log('1. Exports');
check(typeof GeoPosition === 'function',        'GeoPosition is a constructor');
check(typeof GeoPositionError === 'function',   'GeoPositionError is a constructor');
check(typeof GeocodingState === 'function',     'GeocodingState is a constructor');
check(typeof ObserverSubject === 'function',    'ObserverSubject is a constructor');
check(typeof DualObserverSubject === 'function','DualObserverSubject is a constructor');
check(typeof calculateDistance === 'function',  'calculateDistance is a function');
check(typeof EARTH_RADIUS_METERS === 'number',  'EARTH_RADIUS_METERS is a number');
check(typeof delay === 'function',              'delay is a function');

// ---------------------------------------------------------------------------
// 2. GeoPosition
// ---------------------------------------------------------------------------

console.log('\n2. GeoPosition');

const SAO_PAULO = { latitude: -23.5505, longitude: -46.6333, accuracy: 12 };
const pos = new GeoPosition({ coords: SAO_PAULO, timestamp: 1_700_000_000_000 });

check(pos.latitude === -23.5505,    'latitude reads correctly');
check(pos.longitude === -46.6333,   'longitude reads correctly');
check(pos.accuracy === 12,          'accuracy reads correctly');
check(pos.timestamp === 1_700_000_000_000, 'timestamp reads correctly');
check(Object.isFrozen(pos),         'instance is frozen (immutable)');
check(typeof pos.toString() === 'string', 'toString() returns a string');
check(pos.toString().includes('-23.5505'), 'toString() includes latitude');
check(typeof pos.accuracyQuality === 'string', 'accuracyQuality is a string');

// GeoPosition.from() factory
const pos2 = GeoPosition.from({ coords: SAO_PAULO, timestamp: 0 });
check(pos2 instanceof GeoPosition,  'GeoPosition.from() returns a GeoPosition instance');
check(pos2.latitude === -23.5505,   'GeoPosition.from() sets latitude correctly');

// GeoPosition.getAccuracyQuality() static
check(GeoPosition.getAccuracyQuality(5) === 'excellent',  'getAccuracyQuality(5) → "excellent"');
check(GeoPosition.getAccuracyQuality(500) === 'very bad', 'getAccuracyQuality(500) → "very bad"');

// ---------------------------------------------------------------------------
// 3. GeoPositionError
// ---------------------------------------------------------------------------

console.log('\n3. GeoPositionError');

let caughtError;
try { new GeoPosition(42); } catch (e) { caughtError = e; }
check(caughtError instanceof GeoPositionError, 'throws GeoPositionError for primitive input');
check(caughtError instanceof Error,             'GeoPositionError extends Error');
check(caughtError.name === 'GeoPositionError',  'GeoPositionError.name is set correctly');

// ---------------------------------------------------------------------------
// 4. calculateDistance / EARTH_RADIUS_METERS
// ---------------------------------------------------------------------------

console.log('\n4. calculateDistance & EARTH_RADIUS_METERS');

const RIO = { latitude: -22.9068, longitude: -43.1729 };
const dist = calculateDistance(SAO_PAULO.latitude, SAO_PAULO.longitude, RIO.latitude, RIO.longitude);
check(typeof dist === 'number',           'calculateDistance returns a number');
check(Math.abs(dist - 360_748) / 360_748 < 0.01, 'SP→Rio distance within 1% of Haversine reference (~360 km)');
check(calculateDistance(0, 0, 0, 0) === 0, 'same-point distance is 0');
check(EARTH_RADIUS_METERS === 6_371_000,  'EARTH_RADIUS_METERS is 6,371,000 m');

// ---------------------------------------------------------------------------
// 5. ObserverSubject
// ---------------------------------------------------------------------------

console.log('\n5. ObserverSubject');

const subject = new ObserverSubject();
let received;
const unsub = subject.subscribe((v) => { received = v; });
check(typeof unsub === 'function',          'subscribe() returns an unsubscribe function');
check(subject.getObserverCount() === 1,     'getObserverCount() increments on subscribe');
unsub();
check(subject.getObserverCount() === 0,     'unsubscribe() decrements observer count');

// ---------------------------------------------------------------------------
// 6. DualObserverSubject
// ---------------------------------------------------------------------------

console.log('\n6. DualObserverSubject');

const dual = new DualObserverSubject();
let objResult, fnResult;
dual.subscribe({ update: (...args) => { objResult = args; } });
dual.subscribeFunction((...args) => { fnResult = args; });
dual.notifyObservers('a', 'b');
dual.notifyFunctionObservers('x', 'y');
check(Array.isArray(objResult) && objResult[0] === 'a', 'notifyObservers() calls object observers');
check(Array.isArray(fnResult) && fnResult[0] === 'x',  'notifyFunctionObservers() calls function observers');
check(dual.getObserverCount() === 1,         'getObserverCount() is 1');
check(dual.getFunctionObserverCount() === 1, 'getFunctionObserverCount() is 1');

// ---------------------------------------------------------------------------
// 7. delay
// ---------------------------------------------------------------------------

console.log('\n7. delay');
check(delay(0) instanceof Promise, 'delay() returns a Promise');

// ---------------------------------------------------------------------------
// 8. GeocodingState (subclass of ObserverSubject)
// ---------------------------------------------------------------------------

console.log('\n8. GeocodingState');
const state = new GeocodingState();
check(state instanceof ObserverSubject, 'GeocodingState extends ObserverSubject');
check(typeof state.setPosition === 'function', 'GeocodingState has setPosition() method');
check(typeof state.getCurrentPosition === 'function', 'GeocodingState has getCurrentPosition() method');
check(typeof state.hasPosition === 'function', 'GeocodingState has hasPosition() method');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const total = passed + failed;
console.log(`\n${total} checks: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.error('\n❌ Smoke test FAILED');
  process.exit(1);
}

console.log('\n✅ Smoke test passed');
