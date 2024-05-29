import assert from 'assert';
import { createWorld, definePrefab, registerPrefab } from '../../src';
import { describe, test } from 'vitest';

describe('Prefab Unit Tests', () => {
	test('should avoid creating multiple eids for the same prefab', () => {
		const world = createWorld();

		const Human = definePrefab();

		const eid1 = registerPrefab(world, Human);
		const eid2 = registerPrefab(world, Human);

		assert(eid1 === eid2);
	});
});
