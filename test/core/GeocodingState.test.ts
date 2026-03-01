// test/core/GeocodingState.test.ts

import GeocodingState from '../../src/core/GeocodingState';
import GeoPosition from '../../src/core/GeoPosition';
import type { GeoPositionInput } from '../../src/core/GeoPosition';

function mockPos(lat: number, lon: number): GeoPositionInput {
return {
coords: {
latitude: lat,
longitude: lon,
accuracy: 15,
altitude: null,
altitudeAccuracy: null,
heading: null,
speed: null,
},
timestamp: Date.now(),
};
}

describe('GeocodingState', () => {
describe('constructor', () => {
it('should create instance with null initial state', () => {
const state = new GeocodingState();
expect(state).toBeInstanceOf(GeocodingState);
expect(state.getCurrentPosition()).toBeNull();
expect(state.getCurrentCoordinates()).toBeNull();
});

it('should initialize with zero observers', () => {
const state = new GeocodingState();
expect(state.getObserverCount()).toBe(0);
});
});

describe('setPosition()', () => {
it('should update position with a valid GeoPosition', () => {
const state = new GeocodingState();
const pos = new GeoPosition(mockPos(-23.5505, -46.6333));
state.setPosition(pos);
expect(state.getCurrentPosition()).toBe(pos);
});

it('should update coordinates when position is set', () => {
const state = new GeocodingState();
state.setPosition(new GeoPosition(mockPos(-23.5505, -46.6333)));
expect(state.getCurrentCoordinates()).toEqual({ latitude: -23.5505, longitude: -46.6333 });
});

it('should accept null to clear position', () => {
const state = new GeocodingState();
state.setPosition(new GeoPosition(mockPos(-23.5505, -46.6333)));
state.setPosition(null);
expect(state.getCurrentPosition()).toBeNull();
expect(state.getCurrentCoordinates()).toBeNull();
});

it('should throw TypeError for non-GeoPosition values', () => {
const state = new GeocodingState();
expect(() => state.setPosition({ latitude: 10, longitude: 20 } as any)).toThrow(TypeError);
expect(() => state.setPosition('invalid' as any)).toThrow(TypeError);
expect(() => state.setPosition(123 as any)).toThrow(TypeError);
});

it('should notify observers when position changes', () => {
const state = new GeocodingState();
const observer = jest.fn();
const pos = new GeoPosition(mockPos(-23.5505, -46.6333));
state.subscribe(observer);
state.setPosition(pos);
expect(observer).toHaveBeenCalledTimes(1);
expect(observer).toHaveBeenCalledWith({
position: pos,
coordinates: { latitude: -23.5505, longitude: -46.6333 },
});
});

it('should not notify observers when set to null', () => {
const state = new GeocodingState();
const observer = jest.fn();
state.subscribe(observer);
state.setPosition(null);
expect(observer).not.toHaveBeenCalled();
});

it('should handle observer errors gracefully', () => {
const state = new GeocodingState();
const errorObserver = jest.fn(() => { throw new Error('boom'); });
const successObserver = jest.fn();
const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
state.subscribe(errorObserver);
state.subscribe(successObserver);
expect(() => state.setPosition(new GeoPosition(mockPos(0, 0)))).not.toThrow();
expect(successObserver).toHaveBeenCalled();
expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Error notifying observer'), expect.any(Error));
warnSpy.mockRestore();
});

it('should allow chaining by returning this', () => {
const state = new GeocodingState();
const result = state.setPosition(new GeoPosition(mockPos(0, 0)));
expect(result).toBe(state);
});
});

describe('getCurrentCoordinates()', () => {
it('should return null initially', () => {
expect(new GeocodingState().getCurrentCoordinates()).toBeNull();
});

it('should return a defensive copy', () => {
const state = new GeocodingState();
state.setPosition(new GeoPosition(mockPos(-23.5505, -46.6333)));
const c1 = state.getCurrentCoordinates();
const c2 = state.getCurrentCoordinates();
expect(c1).toEqual(c2);
expect(c1).not.toBe(c2);
});

it('should not allow external mutation', () => {
const state = new GeocodingState();
state.setPosition(new GeoPosition(mockPos(-23.5505, -46.6333)));
const coords = state.getCurrentCoordinates()!;
coords.latitude = 999;
expect(state.getCurrentCoordinates()!.latitude).toBe(-23.5505);
});

it('should handle zero coordinates', () => {
const state = new GeocodingState();
state.setPosition(new GeoPosition(mockPos(0, 0)));
expect(state.getCurrentCoordinates()).toEqual({ latitude: 0, longitude: 0 });
});
});

describe('hasPosition()', () => {
it('should return false initially', () => {
expect(new GeocodingState().hasPosition()).toBe(false);
});

it('should return true after setting position', () => {
const state = new GeocodingState();
state.setPosition(new GeoPosition(mockPos(0, 0)));
expect(state.hasPosition()).toBe(true);
});

it('should return false after clearing position', () => {
const state = new GeocodingState();
state.setPosition(new GeoPosition(mockPos(0, 0)));
state.setPosition(null);
expect(state.hasPosition()).toBe(false);
});
});

describe('subscribe()', () => {
it('should register observer and return unsubscribe function', () => {
const state = new GeocodingState();
const unsubscribe = state.subscribe(jest.fn());
expect(typeof unsubscribe).toBe('function');
});

it('should throw TypeError for non-function observer', () => {
const state = new GeocodingState();
expect(() => state.subscribe(null as any)).toThrow(TypeError);
expect(() => state.subscribe('str' as any)).toThrow(TypeError);
});

it('should stop calling observer after unsubscribe', () => {
const state = new GeocodingState();
const observer = jest.fn();
const unsubscribe = state.subscribe(observer);
unsubscribe();
state.setPosition(new GeoPosition(mockPos(0, 0)));
expect(observer).not.toHaveBeenCalled();
});

it('should handle double unsubscribe without throwing', () => {
const state = new GeocodingState();
const unsubscribe = state.subscribe(jest.fn());
unsubscribe();
expect(() => unsubscribe()).not.toThrow();
});

it('should only remove the specific observer', () => {
const state = new GeocodingState();
const obs1 = jest.fn();
const obs2 = jest.fn();
const obs3 = jest.fn();
state.subscribe(obs1);
const unsub2 = state.subscribe(obs2);
state.subscribe(obs3);
unsub2();
state.setPosition(new GeoPosition(mockPos(0, 0)));
expect(obs1).toHaveBeenCalled();
expect(obs2).not.toHaveBeenCalled();
expect(obs3).toHaveBeenCalled();
});
});

describe('unsubscribe()', () => {
it('should return true when callback is found and removed', () => {
const state = new GeocodingState();
const handler = jest.fn();
state.subscribe(handler);
expect(state.unsubscribe(handler)).toBe(true);
});

it('should return false when callback is not registered', () => {
const state = new GeocodingState();
expect(state.unsubscribe(jest.fn())).toBe(false);
});
});

describe('clear()', () => {
it('should reset position without notifying observers', () => {
const state = new GeocodingState();
const observer = jest.fn();
state.setPosition(new GeoPosition(mockPos(0, 0)));
state.subscribe(observer);
observer.mockClear();
state.clear();
expect(state.hasPosition()).toBe(false);
expect(observer).not.toHaveBeenCalled();
});
});

describe('clearObservers()', () => {
it('should remove all observers', () => {
const state = new GeocodingState();
state.subscribe(jest.fn());
state.subscribe(jest.fn());
state.clearObservers();
expect(state.getObserverCount()).toBe(0);
});
});

describe('toString()', () => {
it('should include class name and null state initially', () => {
const str = new GeocodingState().toString();
expect(str).toContain('GeocodingState');
expect(str).toContain('position: null');
expect(str).toContain('observers: 0');
});

it('should include coordinates when position is set', () => {
const state = new GeocodingState();
state.setPosition(new GeoPosition(mockPos(-23.5505, -46.6333)));
const str = state.toString();
expect(str).toContain('-23.5505');
expect(str).toContain('-46.6333');
});

it('should reflect correct observer count', () => {
const state = new GeocodingState();
state.subscribe(jest.fn());
state.subscribe(jest.fn());
state.subscribe(jest.fn());
expect(state.toString()).toContain('observers: 3');
});
});

describe('Integration', () => {
it('should support full subscribe -> update -> unsubscribe lifecycle', () => {
const state = new GeocodingState();
const observer = jest.fn();
const unsubscribe = state.subscribe(observer);

const pos1 = new GeoPosition(mockPos(-23.5505, -46.6333));
const pos2 = new GeoPosition(mockPos(40.7128, -74.006));
state.setPosition(pos1);
state.setPosition(pos2);
unsubscribe();
state.setPosition(new GeoPosition(mockPos(51.5074, -0.1278)));

expect(observer).toHaveBeenCalledTimes(2);
expect(observer).toHaveBeenNthCalledWith(1, expect.objectContaining({ position: pos1 }));
expect(observer).toHaveBeenNthCalledWith(2, expect.objectContaining({ position: pos2 }));
});

it('should maintain consistency during rapid updates', () => {
const state = new GeocodingState();
const positions = [
new GeoPosition(mockPos(-23.5505, -46.6333)),
new GeoPosition(mockPos(40.7128, -74.006)),
new GeoPosition(mockPos(51.5074, -0.1278)),
];
positions.forEach(pos => {
state.setPosition(pos);
expect(state.getCurrentPosition()).toBe(pos);
});
expect(state.getCurrentPosition()).toBe(positions[2]);
});

it('should maintain state even when all observers throw', () => {
const state = new GeocodingState();
state.subscribe(() => { throw new Error('err1'); });
state.subscribe(() => { throw new Error('err2'); });
const pos = new GeoPosition(mockPos(0, 0));
state.setPosition(pos);
expect(state.getCurrentPosition()).toBe(pos);
});
});
});
