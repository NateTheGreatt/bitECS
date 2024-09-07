import { strictEqual } from 'assert'
import { describe, expect, it } from 'vitest'
import {
	Not,
	addComponent,
	addEntity,
	createWorld,
	query,
	removeComponent,
	removeEntity,
	Or,
	observe,
	onAdd
} from '../../src/core'

describe('Query Tests', () => {
	it('should define a query and return matching eids', () => {
		const world = createWorld()
		const TestComponent = {value: []}
		const eid = addEntity(world)
		addComponent(world, eid, TestComponent)
		
		let ents = query(world,[TestComponent])

		strictEqual(ents.length, 1)
		strictEqual(ents[0], 1)

		removeEntity(world, eid)

		ents = query(world,[TestComponent])
		strictEqual(ents.length, 0)
	})

	it('should define a query with Not and return matching eids', () => {
		const world = createWorld()
		const Foo = {value: []}
		const eid0 = addEntity(world)

		let ents = query(world,[Not(Foo)])
		strictEqual(ents.length, 1)
		strictEqual(ents[0], eid0)

		addComponent(world, eid0, Foo)

		ents = query(world,[Not(Foo)])
		strictEqual(ents.length, 0)

		const eid1 = addEntity(world)

		ents = query(world,[Not(Foo)])
		strictEqual(ents.length, 1)
		strictEqual(ents[0], eid1)

		removeEntity(world, eid1)

		ents = query(world,[Not(Foo)])
		strictEqual(ents.length, 0)
	})

	it('should correctly populate Not queries when adding/removing components', () => {
		const world = createWorld()

		const Foo = {}
		const Bar = {}

		const eid1 = addEntity(world)
		const eid2 = addEntity(world)
		const eid3 = addEntity(world)

		/* initial state */

		// foo query should have nothing
		let ents = query(world, [Foo])
		strictEqual(ents.length, 0)

		// notFoo query should have eid 0, 1, and 2
		ents = query(world, [Not(Foo)])
		strictEqual(ents.length, 3)
		strictEqual(ents[0], eid1)
		strictEqual(ents[1], eid2)
		strictEqual(ents[2], eid3)

		/* add components */

		addComponent(world, eid1, Foo)

		addComponent(world, eid2, Bar)

		addComponent(world, eid3, Foo)
		addComponent(world, eid3, Bar)

		// now fooQuery should have eid 1 & 3
		ents = query(world, [Foo])
		strictEqual(ents.length, 2)
		strictEqual(ents[0], eid1)
		strictEqual(ents[1], eid3)

		// fooBarQuery should only have eid 3
		ents = query(world, [Foo, Bar])
		strictEqual(ents.length, 1)
		strictEqual(ents[0], eid3)

		// notFooBarQuery should have nothing
		ents = query(world, [Not(Foo), Not(Bar)])
		strictEqual(ents.length, 0)

		// and notFooQuery should have eid 1
		ents = query(world, [Not(Foo)])
		strictEqual(ents.length, 1)
		strictEqual(ents[0], eid2)

		/* remove components */

		removeComponent(world, eid1, Foo)

		// now fooQuery should only have eid 3
		ents = query(world, [Foo])
		strictEqual(ents.length, 1)
		strictEqual(ents[0], eid3)

		// notFooQuery should have eid 1 & 2
		ents = query(world, [Not(Foo)])
		strictEqual(ents.length, 2)
		strictEqual(ents[0], eid2)
		strictEqual(ents[1], eid1)

		// fooBarQuery should still only have eid 3
		ents = query(world, [Foo, Bar])
		strictEqual(ents.length, 1)
		strictEqual(ents[0], eid3)

		// notFooBarQuery should only have eid 1
		ents = query(world, [Not(Foo), Not(Bar)])
		strictEqual(ents.length, 1)
		strictEqual(ents[0], eid1)

		/* remove more components */

		removeComponent(world, eid3, Foo)
		removeComponent(world, eid3, Bar)

		// notFooBarQuery should have eid 1 & 3
		ents = query(world, [Not(Foo), Not(Bar)])
		strictEqual(ents.length, 2)
		strictEqual(ents[0], eid1)
		strictEqual(ents[1], eid3)

		// and notFooQuery should have eid 1, 2, & 3
		ents = query(world, [Not(Foo)])
		strictEqual(ents.length, 3)
		strictEqual(ents[0], eid2)
		strictEqual(ents[1], eid1)
		strictEqual(ents[2], eid3)
	})

	it('should work inline independent of component order', () => {
		const world = createWorld()
		const TestComponent = {value: []}
		const FooComponent = {value: []}
		const BarComponent = {value: []}

		const eid = addEntity(world)

		let eids = query(world, [TestComponent, FooComponent, BarComponent])
		strictEqual(eids.length, 0)

		addComponent(world, eid, TestComponent)
		addComponent(world, eid, FooComponent)
		addComponent(world, eid, BarComponent)

		eids = query(world, [TestComponent, BarComponent, FooComponent])

		strictEqual(eids.length, 1)

		eids = query(world, [FooComponent, TestComponent, BarComponent])

		strictEqual(eids.length, 1)
	})

	it('should work inline with Not', () => {
		const world = createWorld()
		const TestComponent = {value: []}
		const FooComponent = {value: []}
		const BarComponent = {value: []}

		const eid0 = addEntity(world)
		const eid1 = addEntity(world)

		addComponent(world, eid0, TestComponent)
		addComponent(world, eid0, BarComponent)

		addComponent(world, eid1, FooComponent)
		addComponent(world, eid1, BarComponent)

		let eids = query(world, [Not(TestComponent)])
		strictEqual(eids.length, 1)
		strictEqual(eids[0], 2)

		eids = query(world, [Not(FooComponent)])
		strictEqual(eids.length, 1)
		strictEqual(eids[0], 1)

		eids = query(world, [Not(BarComponent)])
		strictEqual(eids.length, 0)
	})

	it('should not alter query results when removing entities', () => {
		const world = createWorld()
		const TestComponent = {value: []}

		for (let i = 0; i < 10; i += 1) {
			const eid = addEntity(world)
			addComponent(world, eid, TestComponent)
		}

		const results = query(world, [TestComponent])
		const length = results.length
		for (const eid of results) {
			removeEntity(world, eid)
		}

		expect(length).toBe(results.length)
	})

	it('should not alter query results when removing a query component', () => {
		const world = createWorld()
		const TestComponent = {value: []}

		for (let i = 0; i < 10; i += 1) {
			const eid = addEntity(world)
			addComponent(world, eid, TestComponent)
		}

		const results = query(world, [TestComponent])
		const length = results.length
		for (const eid of results) {
			removeComponent(world, eid, TestComponent)
		}

		expect(length).toBe(results.length)
	})

	it('should correctly query entities with more than 64 components', () => {
		const world = createWorld()
		const eid = addEntity(world)

		const createComponent = (index) => ({ value: [], index })

		const components = Array(128)
			.fill(null)
			.map((_, index) => createComponent(index))

		components.forEach((component) => {
			addComponent(world, eid, component)
		})

		// Query for all components
		const results = query(world, components)
		expect(results.length).toBe(1)
		expect(results[0]).toBe(eid)

		// Query for a subset of components
		const subsetComponents = components.slice(0, 40)
		const subsetResults = query(world, subsetComponents)
		expect(subsetResults.length).toBe(1)
		expect(subsetResults[0]).toBe(eid)

		// Query for components that don't exist
		const nonExistentComponent = createComponent(100)
		const emptyResults = query(world, [nonExistentComponent])
		expect(emptyResults.length).toBe(0)

		// Verify that all components can be queried individually
		components.forEach((component) => {
			const singleComponentResult = query(world, [component])
			expect(singleComponentResult.length).toBe(1)
			expect(singleComponentResult[0]).toBe(eid)
		})
	})
	it('should correctly query entities using Or operator', () => {
		const world = createWorld()
		const ComponentA = { value: [] }
		const ComponentB = { value: [] }
		const ComponentC = { value: [] }

		const entity1 = addEntity(world)
		addComponent(world, entity1, ComponentA)

		const entity2 = addEntity(world)
		addComponent(world, entity2, ComponentB)

		const entity3 = addEntity(world)
		addComponent(world, entity3, ComponentC)

		const entity4 = addEntity(world)
		addComponent(world, entity4, ComponentA)
		addComponent(world, entity4, ComponentB)

		const queryResults = query(world, [Or(ComponentA, ComponentB)])

		expect(queryResults.length).toBe(3)
		expect(queryResults).toContain(entity1)
		expect(queryResults).toContain(entity2)
		expect(queryResults).toContain(entity4)
		expect(queryResults).not.toContain(entity3)

		const complexQueryResults = query(world, [Or(ComponentA, ComponentB, ComponentC)])

		expect(complexQueryResults.length).toBe(4)
		expect(complexQueryResults).toContain(entity1)
		expect(complexQueryResults).toContain(entity2)
		expect(complexQueryResults).toContain(entity3)
		expect(complexQueryResults).toContain(entity4)
	})
})
