import assert, { strictEqual } from 'assert';
import { $componentMap } from '../../src/component/symbols.js';
import { resetGlobals, getDefaultSize } from '../../src/index.js';
import { createWorld } from '../../src/world/World.js';
import { describe, it, afterEach } from 'vitest';
import { $bitflag, $size } from '../../src/world/symbols.js';
import { $entityMasks } from '../../src/entity/symbols.js';
import { $dirtyQueries, $queries, $queryDataMap } from '../../src/query/symbols.js';

const defaultSize = getDefaultSize();

describe('World Unit Tests', () => {
	afterEach(() => {
		resetGlobals();
	});
	it('should initialize all private state', () => {
		const world = createWorld();

		strictEqual(Object.keys(world).length, 0);

		strictEqual(world[$size], defaultSize);

		assert(Array.isArray(world[$entityMasks]));

		strictEqual(world[$entityMasks][0].constructor.name, 'Array');
		strictEqual(world[$entityMasks][0].length, defaultSize);

		strictEqual(world[$bitflag], 1);

		strictEqual(world[$componentMap].constructor.name, 'Map');
		strictEqual(world[$queryDataMap].constructor.name, 'Map');
		strictEqual(world[$queries].constructor.name, 'Set');
		strictEqual(world[$dirtyQueries].constructor.name, 'Set');
	});
});
