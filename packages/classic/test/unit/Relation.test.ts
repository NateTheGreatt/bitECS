import assert from 'assert';
import { addComponent, addEntity, createWorld, defineRelation, entityExists, removeEntity } from '../../src';
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
});
