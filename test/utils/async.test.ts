// test/utils/async.test.ts
import { delay } from '../../src/utils/async';

describe('utils/async delay', () => {
  it('should resolve after the specified milliseconds', async () => {
    const start = Date.now();
    await delay(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(45); // allow ±5ms for timer imprecision
  });

  it('should resolve immediately for 0 ms', async () => {
    const start = Date.now();
    await delay(0);
    expect(Date.now() - start).toBeLessThan(20); // event-loop tick; allow up to 20ms
  });

  it('should resolve immediately for negative ms (clamped to 0)', async () => {
    // Negative values are clamped to 0; resolves on the next event-loop tick.
    const start = Date.now();
    await delay(-10);
    expect(Date.now() - start).toBeLessThan(20);
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
