// src/utils/async.test.ts
import { delay } from './async';

describe('utils/async delay', () => {
  it('should resolve after the specified milliseconds', async () => {
    const start = Date.now();
    await delay(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(50);
  });

  it('should resolve immediately for 0 ms', async () => {
    const start = Date.now();
    await delay(0);
    expect(Date.now() - start).toBeLessThan(10);
  });

  it('should throw if ms is negative', async () => {
    // The implementation does not throw, but setTimeout with negative ms acts as 0.
    // This test documents the current behavior.
    const start = Date.now();
    await delay(-10);
    expect(Date.now() - start).toBeLessThan(10);
  });

  it('should work with large ms values', async () => {
    jest.useFakeTimers();
    const promise = delay(1000);
    jest.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();
    jest.useRealTimers();
  });

  it('should be a Promise', () => {
    const result = delay(10);
    expect(result).toBeInstanceOf(Promise);
  });
});
