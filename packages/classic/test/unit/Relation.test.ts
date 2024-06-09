import assert from 'assert';
import { addComponent, addEntity, createWorld, defineRelation, entityExists, hasComponent, removeEntity } from '../../src';
import { describe, test } from 'vitest';

describe('Relation Unit Tests', () => {
	test('should auto remove subject', () => {
		const world = createWorld();

        const ChildOf = defineRelation({}, { autoRemoveSubject: true })

        const parent = addEntity(world)
        const child = addEntity(world)
        
        addComponent(world, ChildOf(parent), child)

        removeEntity(world, parent)

        assert(entityExists(world, child) === false)
	});
    test('should auto remove all descendants of subject', () => {
		const world = createWorld();

        const ChildOf = defineRelation({}, { autoRemoveSubject: true })

        const parent = addEntity(world)
        
        const child = addEntity(world)
        
        const childChild1 = addEntity(world)
        const childChild2 = addEntity(world)
        const childChild3 = addEntity(world)

        const childChildChild1 = addEntity(world)
        
        addComponent(world, ChildOf(parent), child)
        addComponent(world, ChildOf(child), childChild1)
        addComponent(world, ChildOf(child), childChild2)
        addComponent(world, ChildOf(child), childChild3)

        addComponent(world, ChildOf(childChild2), childChildChild1)

        removeEntity(world, parent)

        assert(entityExists(world, child) === false)
        assert(entityExists(world, childChild1) === false)
        assert(entityExists(world, childChild2) === false)
        assert(entityExists(world, childChild3) === false)
        assert(entityExists(world, childChildChild1) === false)
	});
    test('should maintain exclusive relations', () => {
		const world = createWorld();

        const Targeting = defineRelation({}, { exclusive: true });

        const hero = addEntity(world);
        const rat = addEntity(world);
        const goblin = addEntity(world);

        addComponent(world, Targeting(rat), hero);
        addComponent(world, Targeting(goblin), hero);

        assert(hasComponent(world, Targeting(rat), hero) === false);
        assert(hasComponent(world, Targeting(goblin), hero) === true);
	});
});
