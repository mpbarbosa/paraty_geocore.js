"use strict";
// test/core/ObserverSubject.test.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ObserverSubject_1 = __importDefault(require("../../src/core/ObserverSubject"));
describe('ObserverSubject', () => {
    describe('constructor', () => {
        it('should create instance with zero observers', () => {
            const subject = new ObserverSubject_1.default();
            expect(subject).toBeInstanceOf(ObserverSubject_1.default);
            expect(subject.getObserverCount()).toBe(0);
        });
        it('should be directly instantiable (concrete class)', () => {
            expect(() => new ObserverSubject_1.default()).not.toThrow();
        });
    });
    describe('subscribe()', () => {
        it('should register a callback and return an unsubscribe function', () => {
            const subject = new ObserverSubject_1.default();
            const unsubscribe = subject.subscribe(jest.fn());
            expect(typeof unsubscribe).toBe('function');
            expect(subject.getObserverCount()).toBe(1);
        });
        it('should throw TypeError for non-function callback', () => {
            const subject = new ObserverSubject_1.default();
            expect(() => subject.subscribe(null)).toThrow(TypeError);
            expect(() => subject.subscribe('str')).toThrow(TypeError);
            expect(() => subject.subscribe(42)).toThrow(TypeError);
        });
        it('should support multiple subscribers', () => {
            const subject = new ObserverSubject_1.default();
            subject.subscribe(jest.fn());
            subject.subscribe(jest.fn());
            subject.subscribe(jest.fn());
            expect(subject.getObserverCount()).toBe(3);
        });
        it('returned unsubscribe removes only that callback', () => {
            const subject = new ObserverSubject_1.default();
            const obs1 = jest.fn();
            const obs2 = jest.fn();
            subject.subscribe(obs1);
            const unsub2 = subject.subscribe(obs2);
            unsub2();
            subject._notifyObservers('ping');
            expect(obs1).toHaveBeenCalledWith('ping');
            expect(obs2).not.toHaveBeenCalled();
        });
        it('double unsubscribe does not throw', () => {
            const subject = new ObserverSubject_1.default();
            const unsub = subject.subscribe(jest.fn());
            unsub();
            expect(() => unsub()).not.toThrow();
        });
    });
    describe('unsubscribe()', () => {
        it('should return true when callback is found and removed', () => {
            const subject = new ObserverSubject_1.default();
            const cb = jest.fn();
            subject.subscribe(cb);
            expect(subject.unsubscribe(cb)).toBe(true);
            expect(subject.getObserverCount()).toBe(0);
        });
        it('should return false when callback is not registered', () => {
            const subject = new ObserverSubject_1.default();
            expect(subject.unsubscribe(jest.fn())).toBe(false);
        });
        it('should not affect other observers', () => {
            const subject = new ObserverSubject_1.default();
            const obs1 = jest.fn();
            const obs2 = jest.fn();
            subject.subscribe(obs1);
            subject.subscribe(obs2);
            subject.unsubscribe(obs1);
            subject._notifyObservers(null);
            expect(obs1).not.toHaveBeenCalled();
            expect(obs2).toHaveBeenCalledTimes(1);
        });
    });
    describe('getObserverCount()', () => {
        it('should reflect the current number of observers', () => {
            const subject = new ObserverSubject_1.default();
            expect(subject.getObserverCount()).toBe(0);
            const unsub1 = subject.subscribe(jest.fn());
            expect(subject.getObserverCount()).toBe(1);
            subject.subscribe(jest.fn());
            expect(subject.getObserverCount()).toBe(2);
            unsub1();
            expect(subject.getObserverCount()).toBe(1);
        });
    });
    describe('clearObservers()', () => {
        it('should remove all observers', () => {
            const subject = new ObserverSubject_1.default();
            subject.subscribe(jest.fn());
            subject.subscribe(jest.fn());
            subject.clearObservers();
            expect(subject.getObserverCount()).toBe(0);
        });
        it('should stop further notifications', () => {
            const subject = new ObserverSubject_1.default();
            const obs = jest.fn();
            subject.subscribe(obs);
            subject.clearObservers();
            subject._notifyObservers(1);
            expect(obs).not.toHaveBeenCalled();
        });
    });
    describe('_notifyObservers()', () => {
        it('should call each observer with the snapshot', () => {
            const subject = new ObserverSubject_1.default();
            const obs1 = jest.fn();
            const obs2 = jest.fn();
            subject.subscribe(obs1);
            subject.subscribe(obs2);
            subject._notifyObservers({ x: 99 });
            expect(obs1).toHaveBeenCalledWith({ x: 99 });
            expect(obs2).toHaveBeenCalledWith({ x: 99 });
        });
        it('should catch errors from observers and log them', () => {
            const subject = new ObserverSubject_1.default();
            const badObs = jest.fn(() => { throw new Error('boom'); });
            const goodObs = jest.fn();
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            subject.subscribe(badObs);
            subject.subscribe(goodObs);
            expect(() => subject._notifyObservers('event')).not.toThrow();
            expect(goodObs).toHaveBeenCalledWith('event');
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Error notifying observer'), expect.any(Error));
            warnSpy.mockRestore();
        });
        it('should do nothing when there are no observers', () => {
            const subject = new ObserverSubject_1.default();
            expect(() => subject._notifyObservers(true)).not.toThrow();
        });
    });
    describe('subclassing', () => {
        it('GeocodingState should be an instance of ObserverSubject', async () => {
            const { default: GeocodingState } = await Promise.resolve().then(() => __importStar(require('../../src/core/GeocodingState')));
            const state = new GeocodingState();
            expect(state).toBeInstanceOf(ObserverSubject_1.default);
        });
    });
});
