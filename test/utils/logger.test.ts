// test/utils/logger.test.ts

/**
 * Unit tests for the logger utility.
 *
 * @jest-environment node
 * @since 0.12.3-alpha
 */

import { log, warn } from '../../src/utils/logger';

describe('logger', () => {
	let consoleSpy: jest.SpyInstance;
	let consoleWarnSpy: jest.SpyInstance;

	beforeEach(() => {
		// eslint-disable-next-line no-console
		consoleSpy     = jest.spyOn(console, 'log').mockImplementation(() => {});
		// eslint-disable-next-line no-console
		consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleSpy.mockRestore();
		consoleWarnSpy.mockRestore();
	});

	describe('log()', () => {
		it('calls console.log', () => {
			log('test message');
			expect(consoleSpy).toHaveBeenCalledTimes(1);
		});

		it('includes the message in the output', () => {
			log('hello world');
			const call = consoleSpy.mock.calls[0] as string[];
			expect(call.some((arg) => String(arg).includes('hello world'))).toBe(true);
		});

		it('forwards additional params to console.log', () => {
			log('msg', 42, { a: 1 });
			expect(consoleSpy).toHaveBeenCalledWith(expect.any(String), 42, { a: 1 });
		});

		it('prefixes output with an ISO timestamp', () => {
			log('ts test');
			const firstArg = String(consoleSpy.mock.calls[0]?.[0]);
			expect(firstArg).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
		});
	});

	describe('warn()', () => {
		it('calls console.warn', () => {
			warn('warning message');
			expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
		});

		it('includes the message in the output', () => {
			warn('something wrong');
			const call = consoleWarnSpy.mock.calls[0] as string[];
			expect(call.some((arg) => String(arg).includes('something wrong'))).toBe(true);
		});

		it('forwards additional params to console.warn', () => {
			warn('msg', 'extra', false);
			expect(consoleWarnSpy).toHaveBeenCalledWith(expect.any(String), 'extra', false);
		});

		it('prefixes output with an ISO timestamp', () => {
			warn('ts test');
			const firstArg = String(consoleWarnSpy.mock.calls[0]?.[0]);
			expect(firstArg).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
		});
	});
});
