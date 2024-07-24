import assert from 'assert';
import {
	addComponent,
	addEntity,
	createWorld,
	defineComponent,
	defineRelation,
	entityExists,
	getRelationTargets,
	getStore,
	hasComponent,
	Pair,
	removeComponent,
	removeEntity,
	withStore,
} from '../../src';
import { describe, expect, test, vi } from 'vitest';
import { onTargetRemoved, withComponent, withOptions } from '../../src/relation/args';

describe('Relation Unit Tests', () => {
	// this test only works if the player eid is 0, so it needs to be first
	test('should maintain exclusive relations for eid 0', () => {
		const world = createWorld();

		const Targeting = defineRelation(withOptions({ exclusive: true }));

		const player = addEntity(world); // 0
		const guard = addEntity(world); // 1
		const goblin = addEntity(world, Targeting(player), Targeting(guard)); // 2

		assert(getRelationTargets(world, Targeting, goblin).length === 1);
		assert(hasComponent(world, goblin, Targeting(player)) === false);
		assert(hasComponent(world, goblin, Targeting(guard)) === true);

		addComponent(world, goblin, Targeting(player));
		assert(getRelationTargets(world, Targeting, goblin).length === 1);
		assert(hasComponent(world, goblin, Targeting(player)) === true);
		assert(hasComponent(world, goblin, Targeting(guard)) === false);
	});

	test('should auto remove subject', () => {
		const world = createWorld();

		const ChildOf = defineRelation(withOptions({ autoRemoveSubject: true }));

		const parent = addEntity(world);
		const child = addEntity(world);

		addComponent(world, child, ChildOf(parent));

		removeEntity(world, parent);

		assert(entityExists(world, child) === false);
	});

	test('should init store', () => {
		const world = createWorld();

		const Contains = defineRelation(
			withComponent(() =>
				defineComponent(
					withStore(() => ({
						amount: [] as number[],
					}))
				)
			)
		);

		const inventory = addEntity(world);
		const gold = addEntity(world);
		const silver = addEntity(world);

		addComponent(world, inventory, Contains(gold));
		const goldStore = getStore(world, Contains(gold));
		const silverStore = getStore(world, Contains(silver));
		goldStore.amount[inventory] = 5;

		addComponent(world, inventory, Contains(silver));
		silverStore.amount[inventory] = 12;

		assert(Contains(gold) !== Contains(silver));
		assert(goldStore.amount[inventory] === 5);
		assert(silverStore.amount[inventory] === 12);
		assert(getStore(world, Pair(Contains, gold)).amount[inventory] === 5);
		assert(getStore(world, Pair(Contains, silver)).amount[inventory] === 12);
	});

	test('should auto remove all descendants of subject', () => {
		const world = createWorld();

		const ChildOf = defineRelation(withOptions({ autoRemoveSubject: true }));

		const parent = addEntity(world);

		const child = addEntity(world);

		const childChild1 = addEntity(world);
		const childChild2 = addEntity(world);
		const childChild3 = addEntity(world);

		const childChildChild1 = addEntity(world);
		addComponent(world, child, ChildOf(parent));
		addComponent(world, childChild1, ChildOf(child));
		addComponent(world, childChild2, ChildOf(child));
		addComponent(world, childChild3, ChildOf(child));

		addComponent(world, childChildChild1, ChildOf(childChild2));

		removeEntity(world, parent);

		assert(entityExists(world, child) === false);
		assert(entityExists(world, childChild1) === false);
		assert(entityExists(world, childChild2) === false);
		assert(entityExists(world, childChild3) === false);
		assert(entityExists(world, childChildChild1) === false);
	});

	test('should maintain exclusive relations', () => {
		const world = createWorld();

		const Targeting = defineRelation(withOptions({ exclusive: true }));

		const hero = addEntity(world);
		const rat = addEntity(world);
		const goblin = addEntity(world);

		addComponent(world, hero, Targeting(rat));
		addComponent(world, hero, Targeting(goblin));

		assert(hasComponent(world, hero, Targeting(rat)) === false);
		assert(hasComponent(world, hero, Targeting(goblin)) === true);
	});

	test('should call onTargetRemoved when needed', () => {
		const world = createWorld();
		const cbMock = vi.fn();
		const Targeting = defineRelation(onTargetRemoved(cbMock));

		const hero = addEntity(world);
		addEntity(world, Targeting(hero));

		removeEntity(world, hero);

		expect(cbMock).toBeCalledTimes(1);
	});
});
