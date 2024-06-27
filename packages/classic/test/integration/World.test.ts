import { afterEach, describe, expect, it } from 'vitest';
import { SYMBOLS, createWorld, deleteWorld, resetGlobals, worlds } from '../../src/index.js';

describe('World Integration Tests', () => {
	afterEach(() => {
		resetGlobals();
	});

	it('can be created with a size', () => {
		const world = createWorld(10);
		expect(world[SYMBOLS.$size]).toBe(10);
	});

	it('can be deleted', () => {
		const world = createWorld();

		expect(worlds.length).toBe(1);

		deleteWorld(world);

		expect(worlds.length).toBe(0);
	});

	it('can be created with any object', () => {
		const world = createWorld({ customValue: 10 });
		expect(world.customValue).toBe(10);
	});

	it('rectains custom values after deletion', () => {
		const world = createWorld({ customValue: 10 });

		expect(world.customValue).toBe(10);

		deleteWorld(world);

		expect(world.customValue).toBe(10);
	});
});
