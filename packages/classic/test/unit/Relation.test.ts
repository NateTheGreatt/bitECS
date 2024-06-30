import assert from 'assert';
import {
	Pair,
	addComponent,
	addEntity,
	createWorld,
	defineRelation,
	entityExists,
	getRelationTargets,
	hasComponent,
	removeEntity,
} from '../../src';
import { describe, test } from 'vitest';

describe('Relation Unit Tests', () => {
	// this test only works if the player eid is 0, so it needs to be first
	test('should maintain exclusive relations for eid 0', () => {
		const world = createWorld();

		const player = addEntity(world); // 0
		const guard = addEntity(world); // 1
		const goblin = addEntity(world); // 2

		const Targeting = defineRelation({ exclusive: true });

		addComponent(world, Targeting(player), goblin);
		addComponent(world, Targeting(guard), goblin);

		assert(getRelationTargets(world, Targeting, goblin).length === 1); 
		assert(hasComponent(world, Targeting(player), goblin) === false);
		assert(hasComponent(world, Targeting(guard), goblin) === true);
	});

	test('should auto remove subject', () => {
		const world = createWorld();

		const ChildOf = defineRelation({ autoRemoveSubject: true });

		const parent = addEntity(world);
		const child = addEntity(world);

		addComponent(world, ChildOf(parent), child);

		removeEntity(world, parent);

		assert(entityExists(world, child) === false);
	});

	test('should init store', () => {
		const world = createWorld();

		const Contains = defineRelation({
			initStore: () => ({
				amount: [] as number[],
			}),
		});

		const inventory = addEntity(world);
		const gold = addEntity(world);
		const silver = addEntity(world);

		addComponent(world, Contains(gold), inventory);
		Contains(gold).amount[inventory] = 5;

		addComponent(world, Contains(silver), inventory);
		Contains(silver).amount[inventory] = 12;

		assert(Contains(gold) !== Contains(silver));
		assert(Contains(gold).amount[inventory] === 5);
		assert(Contains(silver).amount[inventory] === 12);
		assert(Pair(Contains, gold).amount[inventory] === 5);
		assert(Pair(Contains, silver).amount[inventory] === 12);
	});

	test('should auto remove all descendants of subject', () => {
		const world = createWorld();

		const ChildOf = defineRelation({ autoRemoveSubject: true });

		const parent = addEntity(world);

		const child = addEntity(world);

		const childChild1 = addEntity(world);
		const childChild2 = addEntity(world);
		const childChild3 = addEntity(world);

		const childChildChild1 = addEntity(world);

		addComponent(world, ChildOf(parent), child);
		addComponent(world, ChildOf(child), childChild1);
		addComponent(world, ChildOf(child), childChild2);
		addComponent(world, ChildOf(child), childChild3);

		addComponent(world, ChildOf(childChild2), childChildChild1);

		removeEntity(world, parent);

		assert(entityExists(world, child) === false);
		assert(entityExists(world, childChild1) === false);
		assert(entityExists(world, childChild2) === false);
		assert(entityExists(world, childChild3) === false);
		assert(entityExists(world, childChildChild1) === false);
	});

	test('should maintain exclusive relations', () => {
		const world = createWorld();

		const Targeting = defineRelation({ exclusive: true });

		const hero = addEntity(world);
		const rat = addEntity(world);
		const goblin = addEntity(world);

		addComponent(world, Targeting(goblin), hero);

		assert(hasComponent(world, Targeting(rat), hero) === false);
		assert(hasComponent(world, Targeting(goblin), hero) === true);
	});
});
