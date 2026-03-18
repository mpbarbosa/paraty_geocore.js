// test/core/ObserverMixin.test.ts

import { withObserver } from '../../src/core/ObserverMixin';
import DualObserverSubject from '../../src/core/DualObserverSubject';
import { type ObserverObject } from '../../src/core/DualObserverSubject';
import { makeObserver } from '../helpers/fixtures';

type TestArgs = [string, number];

class TestHost {
    observerSubject = new DualObserverSubject<TestArgs>();
}

describe('withObserver', () => {
    describe('return value', () => {
        it('should return an object with subscribe and unsubscribe methods', () => {
            const mixin = withObserver();
            expect(typeof mixin.subscribe).toBe('function');
            expect(typeof mixin.unsubscribe).toBe('function');
        });

        it('should include notifyObservers by default', () => {
            const mixin = withObserver();
            expect(typeof mixin.notifyObservers).toBe('function');
        });

        it('should omit notifyObservers when excludeNotify is true', () => {
            const mixin = withObserver({ excludeNotify: true });
            expect(mixin.notifyObservers).toBeUndefined();
        });
    });

    describe('subscribe delegation', () => {
        it('should delegate subscribe to observerSubject', () => {
            const host = new TestHost();
            Object.assign(TestHost.prototype, withObserver<TestArgs>());

            const obs = makeObserver();
            (host as any).subscribe(obs);

            expect(host.observerSubject.getObserverCount()).toBe(1);
            expect(host.observerSubject.observers).toContain(obs);

            delete (TestHost.prototype as any).subscribe;
            delete (TestHost.prototype as any).unsubscribe;
            delete (TestHost.prototype as any).notifyObservers;
        });

        it('should silently forward null to observerSubject (no checkNull)', () => {
            const host = new TestHost();
            const mixin = withObserver<TestArgs>();
            mixin.subscribe.call(host, null);
            expect(host.observerSubject.getObserverCount()).toBe(0);
        });

        it('should warn and skip subscribe when checkNull is true and observer is null', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            const host = new TestHost();
            const mixin = withObserver<TestArgs>({ checkNull: true, className: 'TestHost' });

            mixin.subscribe.call(host, null);

            expect(host.observerSubject.getObserverCount()).toBe(0);
            expect(warnSpy).toHaveBeenCalledWith(
                '(TestHost) Attempted to subscribe a null observer.',
            );
            warnSpy.mockRestore();
        });

        it('should warn and skip subscribe when checkNull is true and observer is undefined', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            const host = new TestHost();
            const mixin = withObserver<TestArgs>({ checkNull: true, className: 'TestHost' });

            mixin.subscribe.call(host, undefined);

            expect(host.observerSubject.getObserverCount()).toBe(0);
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        it('should use default class name "Class" in warning when className is not provided', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            const host = new TestHost();
            const mixin = withObserver<TestArgs>({ checkNull: true });

            mixin.subscribe.call(host, null);

            expect(warnSpy).toHaveBeenCalledWith(
                '(Class) Attempted to subscribe a null observer.',
            );
            warnSpy.mockRestore();
        });

        it('should subscribe a valid observer when checkNull is true', () => {
            const host = new TestHost();
            const mixin = withObserver<TestArgs>({ checkNull: true });
            const obs = makeObserver();

            mixin.subscribe.call(host, obs);

            expect(host.observerSubject.getObserverCount()).toBe(1);
        });
    });

    describe('unsubscribe delegation', () => {
        it('should delegate unsubscribe to observerSubject', () => {
            const host = new TestHost();
            const mixin = withObserver<TestArgs>();
            const obs = makeObserver();

            mixin.subscribe.call(host, obs);
            expect(host.observerSubject.getObserverCount()).toBe(1);

            mixin.unsubscribe.call(host, obs);
            expect(host.observerSubject.getObserverCount()).toBe(0);
        });
    });

    describe('notifyObservers delegation', () => {
        it('should delegate notifyObservers to observerSubject', () => {
            const host = new TestHost();
            const mixin = withObserver<TestArgs>();
            const obs = makeObserver();

            mixin.subscribe.call(host, obs);
            mixin.notifyObservers!.call(host, 'event', 42);

            expect(obs.update).toHaveBeenCalledWith('event', 42);
        });

        it('should forward all arguments to notifyObservers', () => {
            const host = new TestHost();
            const mixin = withObserver<TestArgs>();
            const obs1 = makeObserver();
            const obs2 = makeObserver();

            mixin.subscribe.call(host, obs1);
            mixin.subscribe.call(host, obs2);
            mixin.notifyObservers!.call(host, 'update', 99);

            expect(obs1.update).toHaveBeenCalledWith('update', 99);
            expect(obs2.update).toHaveBeenCalledWith('update', 99);
        });
    });

    describe('Object.assign pattern', () => {
        it('should work correctly when assigned to a class prototype', () => {
            class EventBus {
                observerSubject = new DualObserverSubject<TestArgs>();
            }

            Object.assign(EventBus.prototype, withObserver<TestArgs>());

            const bus = new EventBus() as any;
            const obs = makeObserver();

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
                observerSubject = new DualObserverSubject<TestArgs>();

                notifyObservers(...args: TestArgs) {
                    notifySpy(...args);
                    this.observerSubject.notifyObservers(...args);
                }
            }

            Object.assign(
                CustomBus.prototype,
                withObserver<TestArgs>({ excludeNotify: true }),
            );

            const bus = new CustomBus() as any;
            const obs = makeObserver();

            bus.subscribe(obs);
            bus.notifyObservers('custom', 7);

            expect(notifySpy).toHaveBeenCalledWith('custom', 7);
            expect(obs.update).toHaveBeenCalledWith('custom', 7);
        });
    });
});
