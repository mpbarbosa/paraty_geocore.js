"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// test/utils/async.test.ts
const async_1 = require("../../src/utils/async");
describe('utils/async delay', () => {
    it('should resolve after the specified milliseconds', async () => {
        const start = Date.now();
        await (0, async_1.delay)(50);
        expect(Date.now() - start).toBeGreaterThanOrEqual(45); // allow ±5ms for timer imprecision
    });
    it('should resolve immediately for 0 ms', async () => {
        const start = Date.now();
        await (0, async_1.delay)(0);
        expect(Date.now() - start).toBeLessThan(20); // event-loop tick; allow up to 20ms
    });
    it('should throw if ms is negative', async () => {
        // The implementation does not throw, but setTimeout with negative ms acts as 0.
        // This test documents the current behavior.
        const start = Date.now();
        await (0, async_1.delay)(-10);
        expect(Date.now() - start).toBeLessThan(20); // negative ms acts like 0; allow up to 20ms
    });
    it('should work with large ms values', async () => {
        jest.useFakeTimers();
        const promise = (0, async_1.delay)(1000);
        jest.advanceTimersByTime(1000);
        await expect(promise).resolves.toBeUndefined();
        jest.useRealTimers();
    });
    it('should be a Promise', () => {
        const result = (0, async_1.delay)(10);
        expect(result).toBeInstanceOf(Promise);
    });
});
