import { strictEqual } from 'assert';
import { createWorld } from '../../src/world/World.js';
import { defineSystem } from '../../src/system/System.js';
import { defineQuery, addEntity, resetGlobals, addComponent } from '../../src/index.js';
import { describe, it, afterEach } from 'vitest';

describe('System Integration Tests', () => {
	afterEach(() => {
		resetGlobals();
	});
	it('should run against a world and update state', () => {
		const world = createWorld();
		const TestComponent = { value: [] as number[] };

		const query = defineQuery([TestComponent]);
		const eid = addEntity(world);
		addComponent(world, eid, TestComponent);
		TestComponent.value[eid] = 0;

		const system = defineSystem((world) =>
			query(world).forEach((eid) => {
				TestComponent.value[eid]++;
			})
		);

		system(world);

		strictEqual(TestComponent.value[eid], 1);

		return world;
	});
});
