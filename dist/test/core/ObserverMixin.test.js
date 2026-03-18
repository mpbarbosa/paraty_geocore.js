"use strict";
// test/core/ObserverMixin.test.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ObserverMixin_1 = require("../../src/core/ObserverMixin");
const DualObserverSubject_1 = __importDefault(require("../../src/core/DualObserverSubject"));
const fixtures_1 = require("../helpers/fixtures");
class TestHost {
    constructor() {
        this.observerSubject = new DualObserverSubject_1.default();
    }
}
describe('withObserver', () => {
    describe('return value', () => {
        it('should return an object with subscribe and unsubscribe methods', () => {
            const mixin = (0, ObserverMixin_1.withObserver)();
            expect(typeof mixin.subscribe).toBe('function');
            expect(typeof mixin.unsubscribe).toBe('function');
        });
        it('should include notifyObservers by default', () => {
            const mixin = (0, ObserverMixin_1.withObserver)();
            expect(typeof mixin.notifyObservers).toBe('function');
        });
        it('should omit notifyObservers when excludeNotify is true', () => {
            const mixin = (0, ObserverMixin_1.withObserver)({ excludeNotify: true });
            expect(mixin.notifyObservers).toBeUndefined();
        });
    });
    describe('subscribe delegation', () => {
        it('should delegate subscribe to observerSubject', () => {
            const host = new TestHost();
            Object.assign(TestHost.prototype, (0, ObserverMixin_1.withObserver)());
            const obs = (0, fixtures_1.makeObserver)();
            host.subscribe(obs);
            expect(host.observerSubject.getObserverCount()).toBe(1);
            expect(host.observerSubject.observers).toContain(obs);
            delete TestHost.prototype.subscribe;
            delete TestHost.prototype.unsubscribe;
            delete TestHost.prototype.notifyObservers;
        });
        it('should silently forward null to observerSubject (no checkNull)', () => {
            const host = new TestHost();
            const mixin = (0, ObserverMixin_1.withObserver)();
            mixin.subscribe.call(host, null);
            expect(host.observerSubject.getObserverCount()).toBe(0);
        });
        it('should warn and skip subscribe when checkNull is true and observer is null', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            const host = new TestHost();
            const mixin = (0, ObserverMixin_1.withObserver)({ checkNull: true, className: 'TestHost' });
            mixin.subscribe.call(host, null);
            expect(host.observerSubject.getObserverCount()).toBe(0);
            expect(warnSpy).toHaveBeenCalledWith('(TestHost) Attempted to subscribe a null observer.');
            warnSpy.mockRestore();
        });
        it('should warn and skip subscribe when checkNull is true and observer is undefined', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            const host = new TestHost();
            const mixin = (0, ObserverMixin_1.withObserver)({ checkNull: true, className: 'TestHost' });
            mixin.subscribe.call(host, undefined);
            expect(host.observerSubject.getObserverCount()).toBe(0);
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });
        it('should use default class name "Class" in warning when className is not provided', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            const host = new TestHost();
            const mixin = (0, ObserverMixin_1.withObserver)({ checkNull: true });
            mixin.subscribe.call(host, null);
            expect(warnSpy).toHaveBeenCalledWith('(Class) Attempted to subscribe a null observer.');
            warnSpy.mockRestore();
        });
        it('should subscribe a valid observer when checkNull is true', () => {
            const host = new TestHost();
            const mixin = (0, ObserverMixin_1.withObserver)({ checkNull: true });
            const obs = (0, fixtures_1.makeObserver)();
            mixin.subscribe.call(host, obs);
            expect(host.observerSubject.getObserverCount()).toBe(1);
        });
    });
    describe('unsubscribe delegation', () => {
        it('should delegate unsubscribe to observerSubject', () => {
            const host = new TestHost();
            const mixin = (0, ObserverMixin_1.withObserver)();
            const obs = (0, fixtures_1.makeObserver)();
            mixin.subscribe.call(host, obs);
            expect(host.observerSubject.getObserverCount()).toBe(1);
            mixin.unsubscribe.call(host, obs);
            expect(host.observerSubject.getObserverCount()).toBe(0);
        });
    });
    describe('notifyObservers delegation', () => {
        it('should delegate notifyObservers to observerSubject', () => {
            const host = new TestHost();
            const mixin = (0, ObserverMixin_1.withObserver)();
            const obs = (0, fixtures_1.makeObserver)();
            mixin.subscribe.call(host, obs);
            mixin.notifyObservers.call(host, 'event', 42);
            expect(obs.update).toHaveBeenCalledWith('event', 42);
        });
        it('should forward all arguments to notifyObservers', () => {
            const host = new TestHost();
            const mixin = (0, ObserverMixin_1.withObserver)();
            const obs1 = (0, fixtures_1.makeObserver)();
            const obs2 = (0, fixtures_1.makeObserver)();
            mixin.subscribe.call(host, obs1);
            mixin.subscribe.call(host, obs2);
            mixin.notifyObservers.call(host, 'update', 99);
            expect(obs1.update).toHaveBeenCalledWith('update', 99);
            expect(obs2.update).toHaveBeenCalledWith('update', 99);
        });
    });
    describe('Object.assign pattern', () => {
        it('should work correctly when assigned to a class prototype', () => {
            class EventBus {
                constructor() {
                    this.observerSubject = new DualObserverSubject_1.default();
                }
            }
            Object.assign(EventBus.prototype, (0, ObserverMixin_1.withObserver)());
            const bus = new EventBus();
            const obs = (0, fixtures_1.makeObserver)();
            bus.subscribe(obs);
            expect(bus.observerSubject.getObserverCount()).toBe(1);
            bus.notifyObservers('ping', 1);
            expect(obs.update).toHaveBeenCalledWith('ping', 1);
            bus.unsubscribe(obs);
            expect(bus.observerSubject.getObserverCount()).toBe(0);
        });
        it('should work with excludeNotify when host provides custom notifyObservers', () => {
            const notifySpy = jest.fn();
            class CustomBus {
                constructor() {
                    this.observerSubject = new DualObserverSubject_1.default();
                }
                notifyObservers(...args) {
                    notifySpy(...args);
                    this.observerSubject.notifyObservers(...args);
                }
            }
            Object.assign(CustomBus.prototype, (0, ObserverMixin_1.withObserver)({ excludeNotify: true }));
            const bus = new CustomBus();
            const obs = (0, fixtures_1.makeObserver)();
            bus.subscribe(obs);
            bus.notifyObservers('custom', 7);
            expect(notifySpy).toHaveBeenCalledWith('custom', 7);
            expect(obs.update).toHaveBeenCalledWith('custom', 7);
        });
    });
});
