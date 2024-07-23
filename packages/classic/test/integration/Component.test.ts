import assert from 'assert';
import {
	addEntity,
	addComponent,
	hasComponent,
	registerComponent,
	removeComponent,
	removeEntity,
	addComponents,
	flushRemovedEntities,
	defineComponent,
} from '../../src/index.js';
import { createWorld } from '../../src/world/World.js';
import { describe, it } from 'vitest';
import { $componentMap } from '../../src/component/symbols.js';

const componentTypes = {
	SoA: defineComponent(() => ({ value: [] as number[] })),
	object: defineComponent(() => ({})),
	array: defineComponent(() => []),
	buffer: defineComponent(() => new ArrayBuffer(8)),
	string: defineComponent(() => 'test'),
	number: defineComponent(() => 1),
	Map: defineComponent(() => new Map()),
	Set: defineComponent(() => new Set()),
};

describe('Component Integration Tests', () => {
	it('should register components on-demand', () => {
		const world = createWorld();
		const TestComponent = {};

		registerComponent(world, TestComponent);
		assert(world[$componentMap].has(TestComponent));
	});

	it('should register components automatically upon adding to an entity', () => {
		const world = createWorld();
		const TestComponent = defineComponent(() => [] as number[]);

		const eid = addEntity(world);

		addComponent(world, eid, TestComponent);
		assert(world[$componentMap].has(TestComponent));
	});

	it('should add and remove components from an entity', () => {
		const world = createWorld();
		const TestComponent = {};

		const eid = addEntity(world);

		addComponent(world, eid, TestComponent);
		assert(hasComponent(world, eid, TestComponent));

		removeComponent(world, eid, TestComponent);
		assert(hasComponent(world, eid, TestComponent) === false);
	});

	(Object.keys(componentTypes) as (keyof typeof componentTypes)[]).forEach((type) => {
		it(`should correctly add ${type} components`, () => {
			const world = createWorld();

			const eid = addEntity(world);

			addComponent(world, eid, componentTypes[type]);
			assert(hasComponent(world, eid, componentTypes[type]));
		});
	});

	it('should only remove the component specified', () => {
		const world = createWorld();
		const TestComponent = {};
		const TestComponent2 = {};

		const eid = addEntity(world);

		addComponent(world, eid, TestComponent);
		addComponent(world, eid, TestComponent2);
		assert(hasComponent(world, eid, TestComponent));
		assert(hasComponent(world, eid, TestComponent2));

		removeComponent(world, eid, TestComponent);
		assert(hasComponent(world, eid, TestComponent) === false);
		assert(hasComponent(world, eid, TestComponent2) === true);
	});

	it('should create tag components', () => {
		const world = createWorld();
		const TestComponent = {};

		const eid = addEntity(world);

		addComponent(world, eid, TestComponent);
		assert(hasComponent(world, eid, TestComponent));

		removeComponent(world, eid, TestComponent);
		assert(hasComponent(world, eid, TestComponent) === false);
	});

	it('should correctly register more than 32 components', () => {
		const world = createWorld();

		const eid = addEntity(world);

		Array(1024)
			.fill(null)

			.map((_) => ({}))
			.forEach((c) => {
				addComponent(world, eid, c);
				assert(hasComponent(world, eid, c));
			});
	});

	it('should add components to entities after recycling', () => {
		const world = createWorld();
		let eid = 0;

		for (let i = 0; i < 10; i++) {
			addEntity(world);
		}

		for (let i = 0; i < 10; i++) {
			removeEntity(world, i);
		}

		flushRemovedEntities(world);

		for (let i = 0; i < 10; i++) {
			eid = addEntity(world);
		}

		const component = {};
		addComponent(world, eid, component);

		assert(hasComponent(world, eid, component));
	});

	it('should add multiple components at once', () => {
		const world = createWorld();
		const A = {};
		const B = {};
		const C = {};

		const eid = addEntity(world);
		addComponents(world, eid, A, B, C);

		assert(hasComponent(world, eid, A));
		assert(hasComponent(world, eid, B));
		assert(hasComponent(world, eid, C));
	});
});
