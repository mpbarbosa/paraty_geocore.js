// test/core/errors.test.ts
import { GeoPositionError } from '../../src/core/errors';

describe('GeoPositionError', () => {
  it('should be instance of Error', () => {
    const err = new GeoPositionError('Invalid position');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(GeoPositionError);
  });

  it('should set the correct name', () => {
    const err = new GeoPositionError('Test error');
    expect(err.name).toBe('GeoPositionError');
  });

  it('should set the correct message', () => {
    const err = new GeoPositionError('GeoPosition: position must be an object');
    expect(err.message).toBe('GeoPosition: position must be an object');
  });

  it('should maintain prototype chain', () => {
    const err = new GeoPositionError('Chain test');
    expect(Object.getPrototypeOf(err)).toBe(GeoPositionError.prototype);
  });

  it('should be catchable as GeoPositionError', () => {
    const err = new GeoPositionError('Catch test');
    expect(err).toBeInstanceOf(GeoPositionError);
    expect(err.message).toBe('Catch test');
  });

  it('should allow custom properties', () => {
    const err = new GeoPositionError('Custom');
    (err as any).code = 123;
    expect((err as any).code).toBe(123);
  });
});
