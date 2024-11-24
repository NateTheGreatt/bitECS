import { describe, test } from 'vitest'
import assert from 'assert'
import {
	Pair,
	addComponent,
	addEntity,
	createWorld,
	createRelation,
	entityExists,
	hasComponent,
	removeEntity,
	Wildcard,
	removeComponent,
	query,
	Not,
} from '../../src/core'

describe('Relation Tests', () => {
	test('should auto remove subject', () => {
		const world = createWorld()

		const ChildOf = createRelation({ autoRemoveSubject: true })

		const parent = addEntity(world)
		console.log('parent',parent)
		const child = addEntity(world)

		addComponent(world, child, ChildOf(parent))

		console.log('parent',parent)
		removeEntity(world, parent)

		assert(entityExists(world, child) === false)
	})

	test('should init store', () => {
		const world = createWorld()

		const Contains = createRelation({
			store: () => ({
				amount: [] as number[],
			}),
		})

		const inventory = addEntity(world)
		const gold = addEntity(world)
		const silver = addEntity(world)

		addComponent(world, inventory, Contains(gold))
		Contains(gold).amount[inventory] = 5

		addComponent(world, inventory, Contains(silver))
		Contains(silver).amount[inventory] = 12

		assert(Contains(gold) !== Contains(silver))
		assert(Contains(gold).amount[inventory] === 5)
		assert(Contains(silver).amount[inventory] === 12)
		assert(Pair(Contains, gold).amount[inventory] === 5)
		assert(Pair(Contains, silver).amount[inventory] === 12)
	})

	test('should auto remove all descendants of subject', () => {
		const world = createWorld()

		const ChildOf = createRelation({ autoRemoveSubject: true })
		const parent = addEntity(world)

		const child = addEntity(world)

		const childChild1 = addEntity(world)

		const childChild2 = addEntity(world)

		const childChild3 = addEntity(world)

		const childChildChild1 = addEntity(world)

		addComponent(world, child, ChildOf(parent))
		addComponent(world, childChild1, ChildOf(child))
		addComponent(world, childChild2, ChildOf(child))
		addComponent(world, childChild3, ChildOf(child))

		addComponent(world, childChildChild1, ChildOf(childChild2))

		removeEntity(world, parent)

		assert(entityExists(world, child) === false)
		assert(entityExists(world, childChild1) === false)
		assert(entityExists(world, childChild2) === false)
		assert(entityExists(world, childChild3) === false)
		assert(entityExists(world, childChildChild1) === false)
	})

	test('should maintain exclusive relations', () => {
		const world = createWorld()

		const Targeting = createRelation({ exclusive: true })

		const hero = addEntity(world)
		const rat = addEntity(world)
		const goblin = addEntity(world)

		addComponent(world, hero, Targeting(goblin))

		assert(hasComponent(world, hero, Targeting(rat)) === false)
		assert(hasComponent(world, hero, Targeting(goblin)) === true)
	})

    test('should correctly handle wildcard relations', () => {
        const world = createWorld()
        const ChildOf = createRelation()
        
        const parent = addEntity(world)
        const child = addEntity(world)
        
        addComponent(world, child, ChildOf(parent))
        
        assert(hasComponent(world, child, ChildOf(Wildcard)) === true)
        assert(hasComponent(world, child, Pair(ChildOf, Wildcard)) === true)

        assert(hasComponent(world, child, Wildcard(parent)) === true)
        assert(hasComponent(world, child, Pair(Wildcard, parent)) === true)

        assert(hasComponent(world, parent, Wildcard(ChildOf)) === true)
        assert(hasComponent(world, parent, Pair(Wildcard, ChildOf)) === true)

        // Query for all entities that are children of parent
        const childrenOfParent = query(world, [ChildOf(parent)])
        assert(childrenOfParent.length === 1)
        assert(childrenOfParent[0] === child)

        // Query for all entities that have any ChildOf relation
        const allChildren = query(world, [ChildOf(Wildcard)])
        assert(allChildren.length === 1) 
        assert(allChildren[0] === child)

        // Query for all entities that are targets of any relation
        const allParents = query(world, [Pair(Wildcard, ChildOf)])
        assert(allParents.length === 1)
        assert(allParents[0] === parent)

        // Query for entities that don't have ChildOf relation
        const nonChildren = query(world, [Not(ChildOf(Wildcard))])
        assert(nonChildren.length === 1)
        assert(nonChildren[0] === parent)
        
        removeComponent(world, child, ChildOf(parent))
        
        assert(hasComponent(world, child, ChildOf(Wildcard)) === false)
        assert(hasComponent(world, child, Pair(ChildOf, Wildcard)) === false) 
        assert(hasComponent(world, child, Pair(Wildcard, parent)) === false)

    })
})
