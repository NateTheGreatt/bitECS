import { SYMBOLS, createWorld, resetGlobals, deleteWorld, worlds } from '../../src/index.js';
import { describe, it, afterEach, expect } from 'vitest';

describe('World Integration Tests', () => {
	afterEach(() => {
		resetGlobals();
	});

	it('can be created with a sized', () => {
		const world = createWorld(10);
		expect(world[SYMBOLS.$size]).toBe(10);
	});

	it('can be deleted', () => {
		const world = createWorld();

		expect(worlds.length).toBe(1);

		deleteWorld(world);

		expect(worlds.length).toBe(0);
	});
});
