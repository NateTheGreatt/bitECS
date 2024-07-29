import assert, { strictEqual } from 'assert';
import {
	createWorld,
	addEntity,
	removeEntity,
	hasComponent,
	flushRemovedEntities,
	getEntityCursor,
	getRecycledEntities,
} from '../../src/index.js';
import { describe, it } from 'vitest';

describe('Entity Integration Tests', () => {
	it('should add and remove entities', () => {
		const world = createWorld();

		const eid1 = addEntity(world);
		strictEqual(getEntityCursor(world), 1);

		const eid2 = addEntity(world);
		strictEqual(getEntityCursor(world), 2);

		const eid3 = addEntity(world);
		strictEqual(getEntityCursor(world), 3);

		strictEqual(eid1, 0);
		strictEqual(eid2, 1);
		strictEqual(eid3, 2);

		removeEntity(world, eid1);
		removeEntity(world, eid2);
		removeEntity(world, eid3);

		const removed = getRecycledEntities(world);

		strictEqual(removed.length, 3);
		strictEqual(removed[0], 0);
		strictEqual(removed[1], 1);
		strictEqual(removed[2], 2);
	});

	it('should flush entity IDs', () => {
		const world = createWorld();
		const ents: number[] = [];

		for (let i = 0; i < 1500; i++) {
			const eid = addEntity(world);
			ents.push(eid);
			strictEqual(getEntityCursor(world), eid + 1);
			strictEqual(eid, i);
		}

		strictEqual(getEntityCursor(world), 1500);

		// remove more than 1%
		for (let i = 0; i < 1500; i++) {
			const eid = ents[i];
			removeEntity(world, eid);
		}

		// flush removed ents, making them available again
		flushRemovedEntities(world);

		let eid = addEntity(world);
		strictEqual(eid, 0);

		eid = addEntity(world);
		strictEqual(eid, 1);

		eid = addEntity(world);
		strictEqual(eid, 2);

		eid = addEntity(world);
		strictEqual(eid, 3);

		removeEntity(world, 3);

		eid = addEntity(world);
		strictEqual(eid, 4);

		removeEntity(world, 2);

		eid = addEntity(world);
		strictEqual(eid, 5);
	});

	it('should handle multiple fixed size worlds', () => {
		const worldA = createWorld();
		const worldB = createWorld();

		for (let i = 0; i < 10; i++) {
			addEntity(worldA);
		}

		// Add 100 entities to world B
		for (let i = 0; i < 100; i++) {
			addEntity(worldB);
		}

		// Expect no errors thrown
	});

	it('should add components to the created entity', () => {
		const world = createWorld();
		const A = {};
		const B = {};
		const C = {};

		const eid = addEntity(world, A, B, C);

		assert(hasComponent(world, eid, A));
		assert(hasComponent(world, eid, B));
		assert(hasComponent(world, eid, C));
	});
});
