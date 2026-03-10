"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// test/utils/async.test.ts
const async_1 = require("../../src/utils/async");
describe('utils/async delay', () => {
    beforeEach(() => { jest.useFakeTimers(); });
    afterEach(() => { jest.useRealTimers(); });
    it('resolves after the specified milliseconds', async () => {
        expect.assertions(1);
        const promise = (0, async_1.delay)(50);
        jest.advanceTimersByTime(50);
        await expect(promise).resolves.toBeUndefined();
    });
    it('resolves immediately for 0 ms', async () => {
        expect.assertions(1);
        const promise = (0, async_1.delay)(0);
        jest.runAllTimers();
        await expect(promise).resolves.toBeUndefined();
    });
    it('resolves immediately for negative ms (clamped to 0)', async () => {
        expect.assertions(1);
        // Negative values are clamped to 0; resolves on the next event-loop tick.
        const promise = (0, async_1.delay)(-10);
        jest.runAllTimers();
        await expect(promise).resolves.toBeUndefined();
    });
    it('resolves after large ms values when time is advanced', async () => {
        expect.assertions(1);
        const promise = (0, async_1.delay)(1000);
        jest.advanceTimersByTime(1000);
        await expect(promise).resolves.toBeUndefined();
    });
    it('returns a Promise that resolves to undefined', async () => {
        expect.assertions(1);
        const promise = (0, async_1.delay)(10);
        jest.advanceTimersByTime(10);
        await expect(promise).resolves.toBeUndefined();
    });
});
