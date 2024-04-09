import { SYMBOLS, createWorld, resetGlobals } from '../../src/index.js';
import { describe, it, afterEach, expect } from 'vitest';

describe('World Integration Tests', () => {
	afterEach(() => {
		resetGlobals();
	});

	it('can be sized', () => {
		const world = createWorld(10);
		expect(world[SYMBOLS.$size]).toBe(10);
	});
});
