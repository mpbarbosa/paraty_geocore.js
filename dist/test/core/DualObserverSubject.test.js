"use strict";
// test/core/DualObserverSubject.test.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DualObserverSubject_1 = __importDefault(require("../../src/core/DualObserverSubject"));
const fixtures_1 = require("../helpers/fixtures");
describe('DualObserverSubject', () => {
    let subject;
    beforeEach(() => {
        subject = new DualObserverSubject_1.default();
    });
    describe('constructor', () => {
        it('should initialize with empty observer arrays', () => {
            expect(subject.observers).toEqual([]);
            expect(subject.functionObservers).toEqual([]);
            expect(subject.getObserverCount()).toBe(0);
            expect(subject.getFunctionObserverCount()).toBe(0);
        });
    });
    // ─── Object Observer Management ───────────────────────────────────────────
    describe('subscribe()', () => {
        it('should add an object observer', () => {
            const observer = (0, fixtures_1.makeObserver)();
            subject.subscribe(observer);
            expect(subject.observers).toContain(observer);
            expect(subject.getObserverCount()).toBe(1);
        });
        it('should silently ignore null', () => {
            subject.subscribe(null);
            expect(subject.getObserverCount()).toBe(0);
        });
        it('should silently ignore undefined', () => {
            subject.subscribe(undefined);
            expect(subject.getObserverCount()).toBe(0);
        });
        it('should subscribe multiple observers', () => {
            const obs1 = (0, fixtures_1.makeObserver)();
            const obs2 = (0, fixtures_1.makeObserver)();
            const obs3 = (0, fixtures_1.makeObserver)();
            subject.subscribe(obs1);
            subject.subscribe(obs2);
            subject.subscribe(obs3);
            expect(subject.getObserverCount()).toBe(3);
            expect(subject.observers).toContain(obs1);
            expect(subject.observers).toContain(obs2);
            expect(subject.observers).toContain(obs3);
        });
        it('creates a new array on each subscribe (immutable pattern)', () => {
            const obs1 = (0, fixtures_1.makeObserver)();
            const obs2 = (0, fixtures_1.makeObserver)();
            subject.subscribe(obs1);
            const arrayBefore = subject.observers;
            subject.subscribe(obs2);
            const arrayAfter = subject.observers;
            expect(arrayBefore).not.toBe(arrayAfter);
            expect(arrayBefore).toHaveLength(1);
            expect(arrayAfter).toHaveLength(2);
        });
        it('accepts objects without an update method', () => {
            const observer = { someOtherMethod: jest.fn() };
            expect(() => subject.subscribe(observer)).not.toThrow();
            expect(subject.getObserverCount()).toBe(1);
        });
        it('allows the same observer to be subscribed multiple times (duplicate behaviour)', () => {
            const obs = (0, fixtures_1.makeObserver)();
            subject.subscribe(obs);
            subject.subscribe(obs);
            expect(subject.getObserverCount()).toBe(2);
            subject.notifyObservers('ping');
            expect(obs.update).toHaveBeenCalledTimes(2);
        });
    });
    describe('unsubscribe()', () => {
        it('should remove the specified observer', () => {
            const obs1 = (0, fixtures_1.makeObserver)();
            const obs2 = (0, fixtures_1.makeObserver)();
            subject.subscribe(obs1);
            subject.subscribe(obs2);
            subject.unsubscribe(obs1);
            expect(subject.getObserverCount()).toBe(1);
            expect(subject.observers).toContain(obs2);
            expect(subject.observers).not.toContain(obs1);
        });
        it('should not throw when unsubscribing a non-registered observer', () => {
            const obs1 = (0, fixtures_1.makeObserver)();
            const obs2 = (0, fixtures_1.makeObserver)();
            subject.subscribe(obs1);
            expect(() => subject.unsubscribe(obs2)).not.toThrow();
            expect(subject.getObserverCount()).toBe(1);
        });
        it('creates a new array on unsubscribe (immutable pattern)', () => {
            const obs = (0, fixtures_1.makeObserver)();
            subject.subscribe(obs);
            const arrayBefore = subject.observers;
            subject.unsubscribe(obs);
            const arrayAfter = subject.observers;
            expect(arrayBefore).not.toBe(arrayAfter);
            expect(arrayBefore).toHaveLength(1);
            expect(arrayAfter).toHaveLength(0);
        });
        it('removes ALL occurrences when the same observer was subscribed multiple times', () => {
            const obs = (0, fixtures_1.makeObserver)();
            subject.subscribe(obs);
            subject.subscribe(obs);
            expect(subject.getObserverCount()).toBe(2);
            subject.unsubscribe(obs);
            expect(subject.getObserverCount()).toBe(0);
        });
    });
    // ─── Object Observer Notification ─────────────────────────────────────────
    describe('notifyObservers()', () => {
        it('should call update() on all subscribed object observers', () => {
            const obs1 = (0, fixtures_1.makeObserver)();
            const obs2 = (0, fixtures_1.makeObserver)();
            subject.subscribe(obs1);
            subject.subscribe(obs2);
            subject.notifyObservers('arg1', 'arg2', 'arg3');
            expect(obs1.update).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
            expect(obs2.update).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
        });
        it('should work with no arguments', () => {
            const obs = (0, fixtures_1.makeObserver)();
            subject.subscribe(obs);
            subject.notifyObservers();
            expect(obs.update).toHaveBeenCalledWith();
        });
        it('should not throw when no observers are subscribed', () => {
            expect(() => subject.notifyObservers('data')).not.toThrow();
        });
        it('should skip observers without an update method', () => {
            const valid = (0, fixtures_1.makeObserver)();
            const invalid = { noUpdate: jest.fn() };
            subject.subscribe(valid);
            subject.subscribe(invalid);
            expect(() => subject.notifyObservers('data')).not.toThrow();
            expect(valid.update).toHaveBeenCalledWith('data');
        });
        it('should catch errors from misbehaving observers and continue notifying others', () => {
            const badObs = { update: jest.fn(() => { throw new Error('boom'); }) };
            const goodObs = (0, fixtures_1.makeObserver)();
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            subject.subscribe(badObs);
            subject.subscribe(goodObs);
            expect(() => subject.notifyObservers('event')).not.toThrow();
            expect(goodObs.update).toHaveBeenCalledWith('event');
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Error notifying observer'), expect.any(Error));
            warnSpy.mockRestore();
        });
        it('should NOT notify function observers', () => {
            const fn = jest.fn();
            const obs = (0, fixtures_1.makeObserver)();
            subject.subscribe(obs);
            subject.subscribeFunction(fn);
            subject.notifyObservers('data');
            expect(obs.update).toHaveBeenCalled();
            expect(fn).not.toHaveBeenCalled();
        });
    });
    // ─── Function Observer Management ─────────────────────────────────────────
    describe('subscribeFunction()', () => {
        it('should add a function observer', () => {
            const fn = jest.fn();
            subject.subscribeFunction(fn);
            expect(subject.functionObservers).toContain(fn);
            expect(subject.getFunctionObserverCount()).toBe(1);
        });
        it('should silently ignore null', () => {
            subject.subscribeFunction(null);
            expect(subject.getFunctionObserverCount()).toBe(0);
        });
        it('should silently ignore undefined', () => {
            subject.subscribeFunction(undefined);
            expect(subject.getFunctionObserverCount()).toBe(0);
        });
        it('should subscribe multiple function observers', () => {
            const fn1 = jest.fn();
            const fn2 = jest.fn();
            const fn3 = jest.fn();
            subject.subscribeFunction(fn1);
            subject.subscribeFunction(fn2);
            subject.subscribeFunction(fn3);
            expect(subject.getFunctionObserverCount()).toBe(3);
        });
        it('creates a new array on each subscribeFunction (immutable pattern)', () => {
            const fn1 = jest.fn();
            const fn2 = jest.fn();
            subject.subscribeFunction(fn1);
            const arrayBefore = subject.functionObservers;
            subject.subscribeFunction(fn2);
            const arrayAfter = subject.functionObservers;
            expect(arrayBefore).not.toBe(arrayAfter);
            expect(arrayBefore).toHaveLength(1);
            expect(arrayAfter).toHaveLength(2);
        });
        it('allows the same function to be subscribed multiple times (duplicate behaviour)', () => {
            const fn = jest.fn();
            subject.subscribeFunction(fn);
            subject.subscribeFunction(fn);
            expect(subject.getFunctionObserverCount()).toBe(2);
            subject.notifyFunctionObservers('ping');
            expect(fn).toHaveBeenCalledTimes(2);
        });
    });
    describe('unsubscribeFunction()', () => {
        it('should remove the specified function observer', () => {
            const fn1 = jest.fn();
            const fn2 = jest.fn();
            subject.subscribeFunction(fn1);
            subject.subscribeFunction(fn2);
            subject.unsubscribeFunction(fn1);
            expect(subject.getFunctionObserverCount()).toBe(1);
            expect(subject.functionObservers).toContain(fn2);
            expect(subject.functionObservers).not.toContain(fn1);
        });
        it('should not throw when unsubscribing a non-registered function', () => {
            const fn1 = jest.fn();
            const fn2 = jest.fn();
            subject.subscribeFunction(fn1);
            expect(() => subject.unsubscribeFunction(fn2)).not.toThrow();
            expect(subject.getFunctionObserverCount()).toBe(1);
        });
        it('removes ALL occurrences when the same function was subscribed multiple times', () => {
            const fn = jest.fn();
            subject.subscribeFunction(fn);
            subject.subscribeFunction(fn);
            expect(subject.getFunctionObserverCount()).toBe(2);
            subject.unsubscribeFunction(fn);
            expect(subject.getFunctionObserverCount()).toBe(0);
        });
    });
    // ─── Function Observer Notification ───────────────────────────────────────
    describe('notifyFunctionObservers()', () => {
        it('should call all subscribed function observers with args', () => {
            const fn1 = jest.fn();
            const fn2 = jest.fn();
            subject.subscribeFunction(fn1);
            subject.subscribeFunction(fn2);
            subject.notifyFunctionObservers('arg1', 'arg2');
            expect(fn1).toHaveBeenCalledWith('arg1', 'arg2');
            expect(fn2).toHaveBeenCalledWith('arg1', 'arg2');
        });
        it('should not throw when no function observers are subscribed', () => {
            expect(() => subject.notifyFunctionObservers('data')).not.toThrow();
        });
        it('should catch errors from misbehaving function observers and continue', () => {
            const badFn = jest.fn(() => { throw new Error('boom'); });
            const goodFn = jest.fn();
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            subject.subscribeFunction(badFn);
            subject.subscribeFunction(goodFn);
            expect(() => subject.notifyFunctionObservers('event')).not.toThrow();
            expect(goodFn).toHaveBeenCalledWith('event');
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Error notifying function observer'), expect.any(Error));
            warnSpy.mockRestore();
        });
        it('should NOT notify object observers', () => {
            const fn = jest.fn();
            const obs = (0, fixtures_1.makeObserver)();
            subject.subscribe(obs);
            subject.subscribeFunction(fn);
            subject.notifyFunctionObservers('data');
            expect(fn).toHaveBeenCalled();
            expect(obs.update).not.toHaveBeenCalled();
        });
    });
    // ─── Mixed Observer Types ──────────────────────────────────────────────────
    describe('mixed observer types', () => {
        it('should handle both observer types independently', () => {
            const obs = (0, fixtures_1.makeObserver)();
            const fn = jest.fn();
            subject.subscribe(obs);
            subject.subscribeFunction(fn);
            expect(subject.getObserverCount()).toBe(1);
            expect(subject.getFunctionObserverCount()).toBe(1);
            subject.notifyObservers('object-data');
            expect(obs.update).toHaveBeenCalledWith('object-data');
            expect(fn).not.toHaveBeenCalled();
            subject.notifyFunctionObservers('function-data');
            expect(fn).toHaveBeenCalledWith('function-data');
            expect(obs.update).toHaveBeenCalledTimes(1); // not called again
        });
    });
    // ─── clearAllObservers ─────────────────────────────────────────────────────
    describe('clearAllObservers()', () => {
        it('should remove all object and function observers', () => {
            subject.subscribe((0, fixtures_1.makeObserver)());
            subject.subscribe((0, fixtures_1.makeObserver)());
            subject.subscribeFunction(jest.fn());
            subject.subscribeFunction(jest.fn());
            subject.clearAllObservers();
            expect(subject.getObserverCount()).toBe(0);
            expect(subject.getFunctionObserverCount()).toBe(0);
            expect(subject.observers).toEqual([]);
            expect(subject.functionObservers).toEqual([]);
        });
        it('should prevent further notifications after clearing', () => {
            const obs = (0, fixtures_1.makeObserver)();
            const fn = jest.fn();
            subject.subscribe(obs);
            subject.subscribeFunction(fn);
            subject.clearAllObservers();
            subject.notifyObservers('data');
            subject.notifyFunctionObservers('data');
            expect(obs.update).not.toHaveBeenCalled();
            expect(fn).not.toHaveBeenCalled();
        });
    });
});
