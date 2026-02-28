"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// test/core/errors.test.ts
const errors_1 = require("../../src/core/errors");
describe('GeoPositionError', () => {
    it('should be instance of Error', () => {
        const err = new errors_1.GeoPositionError('Invalid position');
        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(errors_1.GeoPositionError);
    });
    it('should set the correct name', () => {
        const err = new errors_1.GeoPositionError('Test error');
        expect(err.name).toBe('GeoPositionError');
    });
    it('should set the correct message', () => {
        const err = new errors_1.GeoPositionError('GeoPosition: position must be an object');
        expect(err.message).toBe('GeoPosition: position must be an object');
    });
    it('should maintain prototype chain', () => {
        const err = new errors_1.GeoPositionError('Chain test');
        expect(Object.getPrototypeOf(err)).toBe(errors_1.GeoPositionError.prototype);
    });
    it('should be catchable as GeoPositionError', () => {
        try {
            throw new errors_1.GeoPositionError('Catch test');
        }
        catch (e) {
            expect(e).toBeInstanceOf(errors_1.GeoPositionError);
            expect(e.message).toBe('Catch test');
        }
    });
    it('should allow custom properties', () => {
        const err = new errors_1.GeoPositionError('Custom');
        err.code = 123;
        expect(err.code).toBe(123);
    });
});
