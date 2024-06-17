import assert from 'assert';
import {
	Types,
	addEntity,
	resetGlobals,
	addComponent,
	defineComponent,
	hasComponent,
	registerComponent,
	removeComponent,
	removeEntity,
} from '../../src/index.js';
import { createWorld } from '../../src/world/World.js';
import { describe, it, afterEach } from 'vitest';
import { $componentMap } from '../../src/component/symbols.js';
import { getEntityCursor } from '../../src/entity/Entity.js';

const componentTypes = {
	SoA: defineComponent({ value: Types.f32 }),
	object: {},
	array: [],
	buffer: new ArrayBuffer(8),
	string: 'test',
	number: 1,
	Map: new Map(),
	Set: new Set(),
};

describe('Component Integration Tests', () => {
	afterEach(() => {
		resetGlobals();
	});

	it('should register components on-demand', () => {
		const world = createWorld();
		const TestComponent = defineComponent({ value: Types.f32 });

		registerComponent(world, TestComponent);
		assert(world[$componentMap].has(TestComponent));
	});

	it('should register components automatically upon adding to an entity', () => {
		const world = createWorld();
		const TestComponent = defineComponent({ value: Types.f32 });

		const eid = addEntity(world);

		addComponent(world, TestComponent, eid);
		assert(world[$componentMap].has(TestComponent));
	});

	it('should add and remove components from an entity', () => {
		const world = createWorld();
		const TestComponent = defineComponent({ value: Types.f32 });

		const eid = addEntity(world);

		addComponent(world, TestComponent, eid);
		assert(hasComponent(world, TestComponent, eid));

		removeComponent(world, TestComponent, eid);
		assert(hasComponent(world, TestComponent, eid) === false);
	});

	(Object.keys(componentTypes) as (keyof typeof componentTypes)[]).forEach((type) => {
		it(`should correctly add ${type} components`, () => {
			const world = createWorld();

			const eid = addEntity(world);

			addComponent(world, componentTypes[type], eid);
			assert(hasComponent(world, componentTypes[type], eid));
		});
	});

	it('should only remove the component specified', () => {
		const world = createWorld();
		const TestComponent = defineComponent({ value: Types.f32 });
		const TestComponent2 = defineComponent({ value: Types.f32 });

		const eid = addEntity(world);

		addComponent(world, TestComponent, eid);
		addComponent(world, TestComponent2, eid);
		assert(hasComponent(world, TestComponent, eid));
		assert(hasComponent(world, TestComponent2, eid));

		removeComponent(world, TestComponent, eid);
		assert(hasComponent(world, TestComponent, eid) === false);
		assert(hasComponent(world, TestComponent2, eid) === true);
	});

	it('should create tag components', () => {
		const world = createWorld();
		const TestComponent = defineComponent();

		const eid = addEntity(world);

		addComponent(world, TestComponent, eid);
		assert(hasComponent(world, TestComponent, eid));

		removeComponent(world, TestComponent, eid);
		assert(hasComponent(world, TestComponent, eid) === false);
	});

	it('should correctly register more than 32 components', () => {
		const world = createWorld();

		const eid = addEntity(world);

		Array(1024)
			.fill(null)

			.map((_) => defineComponent())
			.forEach((c) => {
				addComponent(world, c, eid);
				assert(hasComponent(world, c, eid));
			});
	});

	it.fails('should add components to entities after recycling', () => {
		const world = createWorld(10);
		let eid = 0;

		for (let i = 0; i < 10; i++) {
			addEntity(world);
		}

		for (let i = 0; i < 10; i++) {
			removeEntity(world, i);
		}

		for (let i = 0; i < 10; i++) {
			eid = addEntity(world);
		}

		const component = defineComponent({ value: Types.f32 });
		addComponent(world, component, eid);

		assert(hasComponent(world, component, eid));
	});
});
