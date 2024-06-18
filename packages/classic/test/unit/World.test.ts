import assert, { strictEqual } from 'assert';
import { afterEach, describe, expect, it } from 'vitest';
import { $componentMap } from '../../src/component/symbols.js';
import { $entityMasks } from '../../src/entity/symbols.js';
import { resetGlobals } from '../../src/index.js';
import { $dirtyQueries, $queries, $queryDataMap } from '../../src/query/symbols.js';
import { createWorld, enableBufferedQueries } from '../../src/world/World.js';
import { $bitflag, $bufferQueries, $size } from '../../src/world/symbols.js';

describe('World Unit Tests', () => {
	afterEach(() => {
		resetGlobals();
	});

	it('should initialize all private state', () => {
		const world = createWorld();

		strictEqual(Object.keys(world).length, 0);

		strictEqual(world[$size], -1);

		assert(Array.isArray(world[$entityMasks]));

		strictEqual(world[$entityMasks][0].constructor.name, 'Array');
		strictEqual(world[$entityMasks][0].length, 0);

		strictEqual(world[$bitflag], 1);

		strictEqual(world[$componentMap].constructor.name, 'Map');
		strictEqual(world[$queryDataMap].constructor.name, 'Map');
		strictEqual(world[$queries].constructor.name, 'Set');
		strictEqual(world[$dirtyQueries].constructor.name, 'Set');
	});

	it('should initialize with a size if provided', () => {
		const world = createWorld(100);

		strictEqual(world[$size], 100);
		strictEqual(world[$entityMasks][0].length, 100);
	});

	it('enables bufferes queries', () => {
		const world = enableBufferedQueries(createWorld());
		expect(world[$bufferQueries]).toBe(true);
	});
});
