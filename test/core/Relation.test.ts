import { describe, test, expect } from 'vitest'
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
	withStore,
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

		expect(entityExists(world, child) === false)
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

		expect(Contains(gold) !== Contains(silver))
		expect(Contains(gold).amount[inventory] === 5)
		expect(Contains(silver).amount[inventory] === 12)
		expect(Pair(Contains, gold).amount[inventory] === 5)
		expect(Pair(Contains, silver).amount[inventory] === 12)
	})

	test('should init store with withStore', () => {
		const world = createWorld()

		const Contains = createRelation(withStore(() => ({
			amount: [] as number[]
		})))

		const inventory = addEntity(world)
		const gold = addEntity(world)
		const silver = addEntity(world)

		addComponent(world, inventory, Contains(gold))
		Contains(gold).amount[inventory] = 5

		addComponent(world, inventory, Contains(silver))
		Contains(silver).amount[inventory] = 12

		expect(Contains(gold) !== Contains(silver))
		expect(Contains(gold).amount[inventory] === 5)
		expect(Contains(silver).amount[inventory] === 12)
		expect(Pair(Contains, gold).amount[inventory] === 5)
		expect(Pair(Contains, silver).amount[inventory] === 12)
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

		expect(entityExists(world, child) === false)
		expect(entityExists(world, childChild1) === false)
		expect(entityExists(world, childChild2) === false)
		expect(entityExists(world, childChild3) === false)
		expect(entityExists(world, childChildChild1) === false)
	})

	test('should maintain exclusive relations', () => {
		const world = createWorld()

		const Targeting = createRelation({ exclusive: true })

		const hero = addEntity(world)
		const rat = addEntity(world)
		const goblin = addEntity(world)

		addComponent(world, hero, Targeting(goblin))

		expect(hasComponent(world, hero, Targeting(rat)) === false)
		expect(hasComponent(world, hero, Targeting(goblin)) === true)
	})

	test('should correctly handle wildcard relations', () => {
			const world = createWorld()
			const ChildOf = createRelation()
			
			const parent = addEntity(world)
			const child = addEntity(world)
			
			addComponent(world, child, ChildOf(parent))
			
			expect(hasComponent(world, child, ChildOf(Wildcard)) === true)
			expect(hasComponent(world, child, Pair(ChildOf, Wildcard)) === true)

			expect(hasComponent(world, child, Wildcard(parent)) === true)
			expect(hasComponent(world, child, Pair(Wildcard, parent)) === true)

			expect(hasComponent(world, parent, Wildcard(ChildOf)) === true)
			expect(hasComponent(world, parent, Pair(Wildcard, ChildOf)) === true)

			// Query for all entities that are children of parent
			const childrenOfParent = query(world, [ChildOf(parent)])
			expect(childrenOfParent.length === 1)
			expect(childrenOfParent[0] === child)

			// Query for all entities that have any ChildOf relation
			const allChildren = query(world, [ChildOf(Wildcard)])
			expect(allChildren.length === 1) 
			expect(allChildren[0] === child)

			// Query for all entities that are targets of any relation
			const allParents = query(world, [Pair(Wildcard, ChildOf)])
			expect(allParents.length === 1)
			expect(allParents[0] === parent)

			// Query for entities that don't have ChildOf relation
			const nonChildren = query(world, [Not(ChildOf(Wildcard))])
			expect(nonChildren.length === 1)
			expect(nonChildren[0] === parent)
			
			removeComponent(world, child, ChildOf(parent))
			
			expect(hasComponent(world, child, ChildOf(Wildcard)) === false)
			expect(hasComponent(world, child, Pair(ChildOf, Wildcard)) === false) 
			expect(hasComponent(world, child, Pair(Wildcard, parent)) === false)

	})

	test('should query for entities related to a specific entity via wildcard', () => {
		const world = createWorld()
		const OrbitedBy = createRelation()
		const IlluminatedBy = createRelation()

		const earth = addEntity(world)
		const moon = addEntity(world)
		const sun = addEntity(world)

		addComponent(world, earth, OrbitedBy(moon))
		addComponent(world, earth, IlluminatedBy(sun))

		const relatedToEarth = query(world, [Wildcard(earth)])
		expect(relatedToEarth.length).toBe(2)
		expect(relatedToEarth).toContain(moon)
		expect(relatedToEarth).toContain(sun)
	})
})
