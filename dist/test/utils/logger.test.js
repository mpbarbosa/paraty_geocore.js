"use strict";
// test/utils/logger.test.ts
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Unit tests for the logger utility.
 *
 * @jest-environment node
 * @since 0.12.1-alpha
 */
const logger_1 = require("../../src/utils/logger");
describe('logger', () => {
    let consoleSpy;
    let consoleWarnSpy;
    beforeEach(() => {
        // eslint-disable-next-line no-console
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        // eslint-disable-next-line no-console
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
    });
    afterEach(() => {
        consoleSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });
    describe('log()', () => {
        it('calls console.log', () => {
            (0, logger_1.log)('test message');
            expect(consoleSpy).toHaveBeenCalledTimes(1);
        });
        it('includes the message in the output', () => {
            (0, logger_1.log)('hello world');
            const call = consoleSpy.mock.calls[0];
            expect(call.some((arg) => String(arg).includes('hello world'))).toBe(true);
        });
        it('forwards additional params to console.log', () => {
            (0, logger_1.log)('msg', 42, { a: 1 });
            expect(consoleSpy).toHaveBeenCalledWith(expect.any(String), 42, { a: 1 });
        });
        it('prefixes output with an ISO timestamp', () => {
            (0, logger_1.log)('ts test');
            const firstArg = String(consoleSpy.mock.calls[0]?.[0]);
            expect(firstArg).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });
    });
    describe('warn()', () => {
        it('calls console.warn', () => {
            (0, logger_1.warn)('warning message');
            expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
        });
        it('includes the message in the output', () => {
            (0, logger_1.warn)('something wrong');
            const call = consoleWarnSpy.mock.calls[0];
            expect(call.some((arg) => String(arg).includes('something wrong'))).toBe(true);
        });
        it('forwards additional params to console.warn', () => {
            (0, logger_1.warn)('msg', 'extra', false);
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.any(String), 'extra', false);
        });
        it('prefixes output with an ISO timestamp', () => {
            (0, logger_1.warn)('ts test');
            const firstArg = String(consoleWarnSpy.mock.calls[0]?.[0]);
            expect(firstArg).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });
    });
});
