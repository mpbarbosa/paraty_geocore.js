// test/core/ObserverSubject.test.ts

import ObserverSubject from '../../src/core/ObserverSubject';

/** Minimal subclass to expose protected _notifyObservers for testing. */
class TestableObserverSubject<T> extends ObserverSubject<T> {
    notify(snapshot: T): void { this._notifyObservers(snapshot); }
}

describe('ObserverSubject', () => {
    describe('constructor', () => {
        it('should create instance with zero observers', () => {
            const subject = new ObserverSubject();
            expect(subject).toBeInstanceOf(ObserverSubject);
            expect(subject.getObserverCount()).toBe(0);
        });

        it('should be directly instantiable (concrete class)', () => {
            expect(() => new ObserverSubject()).not.toThrow();
        });
    });

    describe('subscribe()', () => {
        it('should register a callback and return an unsubscribe function', () => {
            const subject = new ObserverSubject<{ value: number }>();
            const unsubscribe = subject.subscribe(jest.fn());
            expect(typeof unsubscribe).toBe('function');
            expect(subject.getObserverCount()).toBe(1);
        });

        it('should throw TypeError for non-function callback', () => {
            const subject = new ObserverSubject();
            expect(() => subject.subscribe(null as any)).toThrow(TypeError);
            expect(() => subject.subscribe('str' as any)).toThrow(TypeError);
            expect(() => subject.subscribe(42 as any)).toThrow(TypeError);
        });

        it('should support multiple subscribers', () => {
            const subject = new ObserverSubject();
            subject.subscribe(jest.fn());
            subject.subscribe(jest.fn());
            subject.subscribe(jest.fn());
            expect(subject.getObserverCount()).toBe(3);
        });

        it('returned unsubscribe removes only that callback', () => {
            const subject = new TestableObserverSubject<string>();
            const obs1 = jest.fn();
            const obs2 = jest.fn();
            subject.subscribe(obs1);
            const unsub2 = subject.subscribe(obs2);
            unsub2();
            subject.notify('ping');
            expect(obs1).toHaveBeenCalledWith('ping');
            expect(obs2).not.toHaveBeenCalled();
        });

        it('double unsubscribe does not throw', () => {
            const subject = new ObserverSubject();
            const unsub = subject.subscribe(jest.fn());
            unsub();
            expect(() => unsub()).not.toThrow();
        });

        it('allows the same callback to be subscribed multiple times (duplicate behaviour)', () => {
            const subject = new TestableObserverSubject<string>();
            const cb = jest.fn();
            subject.subscribe(cb);
            subject.subscribe(cb);
            expect(subject.getObserverCount()).toBe(2);
            subject.notify('ping');
            expect(cb).toHaveBeenCalledTimes(2);
        });
    });

    describe('unsubscribe()', () => {
        it('should return true when callback is found and removed', () => {
            const subject = new ObserverSubject();
            const cb = jest.fn();
            subject.subscribe(cb);
            expect(subject.unsubscribe(cb)).toBe(true);
            expect(subject.getObserverCount()).toBe(0);
        });

        it('should return false when callback is not registered', () => {
            const subject = new ObserverSubject();
            expect(subject.unsubscribe(jest.fn())).toBe(false);
        });

        it('should not affect other observers', () => {
            const subject = new TestableObserverSubject<null>();
            const obs1 = jest.fn();
            const obs2 = jest.fn();
            subject.subscribe(obs1);
            subject.subscribe(obs2);
            subject.unsubscribe(obs1);
            subject.notify(null);
            expect(obs1).not.toHaveBeenCalled();
            expect(obs2).toHaveBeenCalledTimes(1);
        });

        it('removes only the FIRST occurrence when same callback subscribed multiple times', () => {
            const subject = new TestableObserverSubject<string>();
            const cb = jest.fn();
            subject.subscribe(cb);
            subject.subscribe(cb);
            expect(subject.getObserverCount()).toBe(2);
            subject.unsubscribe(cb);
            expect(subject.getObserverCount()).toBe(1);
            subject.notify('ping');
            expect(cb).toHaveBeenCalledTimes(1);
        });
    });

    describe('getObserverCount()', () => {
        it('should reflect the current number of observers', () => {
            const subject = new ObserverSubject();
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
            const subject = new ObserverSubject();
            subject.subscribe(jest.fn());
            subject.subscribe(jest.fn());
            subject.clearObservers();
            expect(subject.getObserverCount()).toBe(0);
        });

        it('should stop further notifications', () => {
            const subject = new TestableObserverSubject<number>();
            const obs = jest.fn();
            subject.subscribe(obs);
            subject.clearObservers();
            subject.notify(1);
            expect(obs).not.toHaveBeenCalled();
        });
    });

    describe('_notifyObservers()', () => {
        it('should call each observer with the snapshot', () => {
            const subject = new TestableObserverSubject<{ x: number }>();
            const obs1 = jest.fn();
            const obs2 = jest.fn();
            subject.subscribe(obs1);
            subject.subscribe(obs2);
            subject.notify({ x: 99 });
            expect(obs1).toHaveBeenCalledWith({ x: 99 });
            expect(obs2).toHaveBeenCalledWith({ x: 99 });
        });

        it('should catch errors from observers and log them', () => {
            const subject = new TestableObserverSubject<string>();
            const badObs = jest.fn(() => { throw new Error('boom'); });
            const goodObs = jest.fn();
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            subject.subscribe(badObs);
            subject.subscribe(goodObs);
            expect(() => subject.notify('event')).not.toThrow();
            expect(goodObs).toHaveBeenCalledWith('event');
            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error notifying observer'),
                expect.any(Error)
            );
            warnSpy.mockRestore();
        });

        it('should do nothing when there are no observers', () => {
            const subject = new TestableObserverSubject<boolean>();
            expect(() => subject.notify(true)).not.toThrow();
        });
    });

    describe('subclassing', () => {
        it('GeocodingState should be an instance of ObserverSubject', async () => {
            const { default: GeocodingState } = await import('../../src/core/GeocodingState');
            const state = new GeocodingState();
            expect(state).toBeInstanceOf(ObserverSubject);
        });
    });
});
