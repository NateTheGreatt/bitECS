
import { describe, expect, it } from 'vitest'
import {
	Not,
	addComponent,
	addEntity,
	createWorld,
	query,
	removeComponent,
	removeEntity,
	entityExists,
	Or,
	And,
	observe,
	onAdd,
	Hierarchy,
	Cascade,
	createRelation,
	withAutoRemoveSubject,
	asBuffer,
	isNested,
	noCommit,
	getHierarchyDepth,
	getMaxHierarchyDepth,
	type QueryOptions,
	type HierarchyTerm,
	type QueryModifier
} from '../../src/core'

describe('Query Tests', () => {
	it('should define a query and return matching eids', () => {
		const world = createWorld()
		const TestComponent = {value: []}
		const eid = addEntity(world)
		addComponent(world, eid, TestComponent)
		
		let ents = query(world,[TestComponent])

		expect(ents.length).toBe(1)
		expect(ents[0]).toBe(1)

		removeEntity(world, eid)

		ents = query(world,[TestComponent])
		expect(ents.length).toBe(0)
	})

	it('should define a query with Not and return matching eids', () => {
		const world = createWorld()
		const Foo = {value: []}
		const eid0 = addEntity(world)

		let ents = query(world,[Not(Foo)])
		expect(ents.length).toBe(1)
		expect(ents[0]).toBe(eid0)

		addComponent(world, eid0, Foo)

		ents = query(world,[Not(Foo)])
		expect(ents.length).toBe(0)

		const eid1 = addEntity(world)

		ents = query(world,[Not(Foo)])
		expect(ents.length).toBe(1)
		expect(ents[0]).toBe(eid1)

		removeEntity(world, eid1)

		ents = query(world,[Not(Foo)])
		expect(ents.length).toBe(0)
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
		expect(ents.length).toBe(0)

		// notFoo query should have eid 0, 1, and 2
		ents = query(world, [Not(Foo)])
		expect(ents.length).toBe(3)
		expect(ents[0]).toBe(eid1)
		expect(ents[1]).toBe(eid2)
		expect(ents[2]).toBe(eid3)

		/* add components */

		addComponent(world, eid1, Foo)

		addComponent(world, eid2, Bar)

		addComponent(world, eid3, Foo)
		addComponent(world, eid3, Bar)

		// now fooQuery should have eid 1 & 3
		ents = query(world, [Foo])
		expect(ents.length).toBe(2)
		expect(ents[0]).toBe(eid1)
		expect(ents[1]).toBe(eid3)

		// fooBarQuery should only have eid 3
		ents = query(world, [Foo, Bar])
		expect(ents.length).toBe(1)
		expect(ents[0]).toBe(eid3)

		// notFooBarQuery should have nothing
		ents = query(world, [Not(Foo), Not(Bar)])
		expect(ents.length).toBe(0)

		// and notFooQuery should have eid 1
		ents = query(world, [Not(Foo)])
		expect(ents.length).toBe(1)
		expect(ents[0]).toBe(eid2)

		/* remove components */

		removeComponent(world, eid1, Foo)

		// now fooQuery should only have eid 3
		ents = query(world, [Foo])
		expect(ents.length).toBe(1)
		expect(ents[0]).toBe(eid3)

		// notFooQuery should have eid 1 & 2
		ents = query(world, [Not(Foo)])
		expect(ents.length).toBe(2)
		expect(ents[0]).toBe(eid2)
		expect(ents[1]).toBe(eid1)

		// fooBarQuery should still only have eid 3
		ents = query(world, [Foo, Bar])
		expect(ents.length).toBe(1)
		expect(ents[0]).toBe(eid3)

		// notFooBarQuery should only have eid 1
		ents = query(world, [Not(Foo), Not(Bar)])
		expect(ents.length).toBe(1)
		expect(ents[0]).toBe(eid1)

		/* remove more components */

		removeComponent(world, eid3, Foo)
		removeComponent(world, eid3, Bar)

		// notFooBarQuery should have eid 1 & 3
		ents = query(world, [Not(Foo), Not(Bar)])
		expect(ents.length).toBe(2)
		expect(ents[0]).toBe(eid1)
		expect(ents[1]).toBe(eid3)

		// and notFooQuery should have eid 1, 2, & 3
		ents = query(world, [Not(Foo)])
		expect(ents.length).toBe(3)
		expect(ents[0]).toBe(eid2)
		expect(ents[1]).toBe(eid1)
		expect(ents[2]).toBe(eid3)
	})

	it('should work inline independent of component order', () => {
		const world = createWorld()
		const TestComponent = {value: []}
		const FooComponent = {value: []}
		const BarComponent = {value: []}

		const eid = addEntity(world)

		let eids = query(world, [TestComponent, FooComponent, BarComponent])
		expect(eids.length).toBe(0)

		addComponent(world, eid, TestComponent)
		addComponent(world, eid, FooComponent)
		addComponent(world, eid, BarComponent)

		eids = query(world, [TestComponent, BarComponent, FooComponent])

		expect(eids.length).toBe(1)

		eids = query(world, [FooComponent, TestComponent, BarComponent])

		expect(eids.length).toBe(1)
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
		expect(eids.length).toBe(1)
		expect(eids[0]).toBe(2)

		eids = query(world, [Not(FooComponent)])
		expect(eids.length).toBe(1)
		expect(eids[0]).toBe(1)

		eids = query(world, [Not(BarComponent)])
		expect(eids.length).toBe(0)
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

	it('should work with Or queries across different component types', () => {
		const world = createWorld()
		
		// Create test components with different purposes
		const Mesh = { vertices: [] }
		const InstancedMesh = { instances: [] }  
		const Group = { children: [] }
		
		// Create entities with these components
		const entity1 = addEntity(world)
		addComponent(world, entity1, Mesh)
		
		const entity2 = addEntity(world)
		addComponent(world, entity2, InstancedMesh)
		
		const entity3 = addEntity(world)
		addComponent(world, entity3, Group)
		
		// This should find all entities with any of the components
		const results = query(world, [Or(Mesh, InstancedMesh, Group)])
		
		expect(results.length).toBe(3)
		expect(results).toContain(entity1)
		expect(results).toContain(entity2) 
		expect(results).toContain(entity3)
		
		// Test edge case: Or query with some component types having no entities
		const world2 = createWorld()
		
		// Create new test components
		const Mesh2 = { vertices: [] }
		const InstancedMesh2 = { instances: [] }  
		const Group2 = { children: [] } // This will have no entities
		
		// Only create entities with Mesh2 and InstancedMesh2, NOT Group2
		const entityA = addEntity(world2)
		addComponent(world2, entityA, Mesh2)
		
		const entityB = addEntity(world2)
		addComponent(world2, entityB, InstancedMesh2)
		
		// This should still find both entities even though Group2 has no instances
		const resultsPartial = query(world2, [Or(Mesh2, InstancedMesh2, Group2)])
		
		expect(resultsPartial.length).toBe(2)
		expect(resultsPartial).toContain(entityA)
		expect(resultsPartial).toContain(entityB)
		
		// Test empty Or query result
		const emptyWorld = createWorld()
		const EmptyA = { value: [] }
		const EmptyB = { value: [] }
		const EmptyC = { value: [] }
		
		const emptyResults = query(emptyWorld, [Or(EmptyA, EmptyB, EmptyC)])
		expect(emptyResults.length).toBe(0)
	})

	it('should handle edge cases and error conditions', () => {
		const world = createWorld()
		const Position = { x: [] as number[], y: [] as number[] }
		const Velocity = { x: [] as number[], y: [] as number[] }
		
		// Test empty query terms
		const emptyResult = query(world, [])
		expect(emptyResult.length).toBe(0)
		
		// Test query with no matching entities
		const noMatchResult = query(world, [Position])
		expect(noMatchResult.length).toBe(0)
		
		// Test nested Not queries
		const eid1 = addEntity(world)
		addComponent(world, eid1, Position)
		
		const doubleNotResult = query(world, [Not(Not(Position))])
		expect(doubleNotResult).toContain(eid1) // Double negative should work (Position entity should match)
		
		// Test complex combinator nesting
		const eid2 = addEntity(world)
		addComponent(world, eid2, Velocity)
		
		// Test simple queries (nested combinators not supported in simple mode)
		const positionOnlyResult = query(world, [Position, Not(Velocity)])
		expect(positionOnlyResult.length).toBe(1) // Only eid1 matches
		expect(positionOnlyResult).toContain(eid1)
		
		// Test simple Or
		const orResult = query(world, [Or(Position, Velocity)])
		expect(orResult.length).toBe(2) // Both entities match
		expect(orResult).toContain(eid1) // Has Position
		expect(orResult).toContain(eid2) // Has Velocity
		
		// Test performance with many entities
		for (let i = 0; i < 1000; i++) {
			const eid = addEntity(world)
			if (i % 2 === 0) addComponent(world, eid, Position)
			if (i % 3 === 0) addComponent(world, eid, Velocity)
		}
		
		const manyResult = query(world, [Position])
		expect(manyResult.length).toBeGreaterThan(400) // At least 500 entities should have Position
		
		const bothResult = query(world, [Position, Velocity])
		expect(bothResult.length).toBeGreaterThan(100) // Entities divisible by both 2 and 3
	})

	it('should handle simple combinators (nested not supported for performance)', () => {
		const world = createWorld()
		const Position = { x: [] as number[], y: [] as number[] }
		const Velocity = { x: [] as number[], y: [] as number[] }
		const Health = { value: [] as number[] }
		const Dead = {}
		
		// Create test entities with different component combinations
		const eid1 = addEntity(world) // Position only
		addComponent(world, eid1, Position)
		
		const eid2 = addEntity(world) // Velocity only  
		addComponent(world, eid2, Velocity)
		
		const eid3 = addEntity(world) // Position + Velocity
		addComponent(world, eid3, Position)
		addComponent(world, eid3, Velocity)
		
		const eid4 = addEntity(world) // Position + Dead
		addComponent(world, eid4, Position)
		addComponent(world, eid4, Dead)
		
		const eid5 = addEntity(world) // Health only
		addComponent(world, eid5, Health)
		
		// Test simple queries that work blazingly fast
		
		// Test 1: Simple OR query
		const orResult = query(world, [Or(Position, Health)])
		expect(orResult.length).toBe(4) // eid1, eid3, eid4 (have Position), eid5 (has Health)
		expect(orResult).toContain(eid1)
		expect(orResult).toContain(eid3)
		expect(orResult).toContain(eid4)
		expect(orResult).toContain(eid5)
		expect(orResult).not.toContain(eid2) // Only has Velocity
		
		// Test 2: Simple AND query
		const andResult = query(world, [Position, Velocity])
		expect(andResult.length).toBe(1)
		expect(andResult).toContain(eid3) // Only entity with both
		
		// Test 3: Simple NOT query
		const notResult = query(world, [Position, Not(Dead)])
		expect(notResult.length).toBe(2)
		expect(notResult).toContain(eid1) // Position but not Dead
		expect(notResult).toContain(eid3) // Position but not Dead
		expect(notResult).not.toContain(eid4) // Has Dead
		
		// Test 4: Complex simple OR query
		const complexOrResult = query(world, [Or(Position, Velocity, Health)])
		expect(complexOrResult.length).toBe(5) // All entities have at least one of these
	})
})

describe('New Query API Tests', () => {
	describe('QueryOptions interface', () => {
		it('should support buffered option returning Uint32Array', () => {
			const world = createWorld()
			const Position = { x: [] as number[], y: [] as number[] }
			
			const eid = addEntity(world)
			addComponent(world, eid, Position)
			
			const result = query(world, [Position], { buffered: true })
			
			expect(result).toBeInstanceOf(Uint32Array)
			expect(result.length).toBe(1)
			expect(result[0]).toBe(eid)
		})
		
		it('should support commit option for nested queries', () => {
			const world = createWorld()
			const Position = { x: [] as number[], y: [] as number[] }
			
			const eid = addEntity(world)
			addComponent(world, eid, Position)
			
			const nestedResult = query(world, [Position], { commit: false })
			const regularResult = query(world, [Position], { commit: true })
			
			expect(Array.from(nestedResult)).toEqual(Array.from(regularResult))
		})
		
		it('should support both buffered and commit options together', () => {
			const world = createWorld()
			const Position = { x: [] as number[], y: [] as number[] }
			
			const eid = addEntity(world)
			addComponent(world, eid, Position)
			
			const result = query(world, [Position], { commit: false, buffered: true })
			
			expect(result).toBeInstanceOf(Uint32Array)
			expect(result.length).toBe(1)
			expect(result[0]).toBe(eid)
		})
	})
	
	describe('Hierarchy combinator', () => {
		it('should create valid HierarchyTerm structure', () => {
			const ChildOf = createRelation()
			
			const hierarchyTerm = Hierarchy(ChildOf, 2)
			
			const hierarchyTypeSymbol = Symbol.for('bitecs-hierarchyType')
			const hierarchyRelSymbol = Symbol.for('bitecs-hierarchyRel')
			const hierarchyDepthSymbol = Symbol.for('bitecs-hierarchyDepth')
			
			expect(hierarchyTerm[hierarchyTypeSymbol]).toBeDefined()
			expect(hierarchyTerm[hierarchyRelSymbol]).toBeDefined()
			expect(hierarchyTerm[hierarchyDepthSymbol]).toBeDefined()
			
			expect(hierarchyTerm[Symbol.for('bitecs-hierarchyType')]).toBe('Hierarchy')
			expect(hierarchyTerm[Symbol.for('bitecs-hierarchyRel')]).toBe(ChildOf)
			expect(hierarchyTerm[Symbol.for('bitecs-hierarchyDepth')]).toBe(2)
		})
		
		it('should create HierarchyTerm without depth', () => {
			const ChildOf = createRelation()
			
			const hierarchyTerm = Hierarchy(ChildOf)
			
			expect(hierarchyTerm[Symbol.for('bitecs-hierarchyType')]).toBe('Hierarchy')
			expect(hierarchyTerm[Symbol.for('bitecs-hierarchyRel')]).toBe(ChildOf)
			expect(hierarchyTerm[Symbol.for('bitecs-hierarchyDepth')]).toBeUndefined()
		})
		
		it('should parse hierarchy terms in query', () => {
			const world = createWorld()
			const Position = { x: [] as number[], y: [] as number[] }
			const ChildOf = createRelation()
			
			const parent = addEntity(world)
			const child = addEntity(world)
			
			addComponent(world, parent, Position)
			addComponent(world, child, Position)
			addComponent(world, child, ChildOf(parent))
			
			// Test hierarchy parsing - should work with both entities
			const result = query(world, [Position, Hierarchy(ChildOf)])
			
			expect(Array.from(result)).toContain(parent)
			expect(Array.from(result)).toContain(child)
		})
	})
	
	describe('Cascade alias', () => {
		it('should be identical to Hierarchy', () => {
			const ChildOf = createRelation()
			
			const hierarchyTerm = Hierarchy(ChildOf, 3)
			const cascadeTerm = Cascade(ChildOf, 3)
			
			expect(cascadeTerm).toEqual(hierarchyTerm)
		})
	})
	
	describe('Hierarchy with depth parameter', () => {
		it('should support hierarchy with depth', () => {
			const world = createWorld()
			const Position = { x: [] as number[], y: [] as number[] }
			const ChildOf = createRelation()
			
			const parent = addEntity(world)
			const child = addEntity(world)
			const grandchild = addEntity(world)
			
			addComponent(world, parent, Position)
			addComponent(world, child, Position)
			addComponent(world, grandchild, Position)
			addComponent(world, child, ChildOf(parent))
			addComponent(world, grandchild, ChildOf(child))
			
			// Test entities at depth 0 (roots)
			const depthZero = query(world, [Hierarchy(ChildOf, 0), Position])
			expect(Array.from(depthZero)).toContain(parent)
			expect(Array.from(depthZero)).not.toContain(child)
			expect(Array.from(depthZero)).not.toContain(grandchild)
			
			// Test entities at depth 1
			const depthOne = query(world, [Hierarchy(ChildOf, 1), Position])
			expect(Array.from(depthOne)).not.toContain(parent)
			expect(Array.from(depthOne)).toContain(child)
			expect(Array.from(depthOne)).not.toContain(grandchild)
			
			// Test entities at depth 2
			const depthTwo = query(world, [Hierarchy(ChildOf, 2), Position])
			expect(Array.from(depthTwo)).not.toContain(parent)
			expect(Array.from(depthTwo)).not.toContain(child)
			expect(Array.from(depthTwo)).toContain(grandchild)
		})
		
		it('should support hierarchy without depth', () => {
			const world = createWorld()
			const Position = { x: [] as number[], y: [] as number[] }
			const ChildOf = createRelation()
			
			const parent = addEntity(world)
			const child = addEntity(world)
			
			addComponent(world, parent, Position)
			addComponent(world, child, Position)
			addComponent(world, child, ChildOf(parent))
			
			const result = query(world, [Hierarchy(ChildOf), Position])
			
			expect(Array.from(result)).toContain(parent)
			expect(Array.from(result)).toContain(child)
		})
	})
	
	describe('Complex query combinations', () => {
		it('should handle hierarchy terms mixed with regular combinators', () => {
			const world = createWorld()
			const Position = { x: [] as number[], y: [] as number[] }
			const Velocity = { x: [] as number[], y: [] as number[] }
			const Dead = {}
			const ChildOf = createRelation()
			
			const parent = addEntity(world)
			const child = addEntity(world)
			
			addComponent(world, parent, Position)
			addComponent(world, child, Position)
			addComponent(world, child, Velocity)
			addComponent(world, child, ChildOf(parent))
			
			const result = query(world, [
				Position, 
				Velocity,
				Not(Dead),
				Hierarchy(ChildOf)
			])
			
			// Should return only entities that match ALL criteria (Position AND Velocity AND Not(Dead))
			// Hierarchy combinator affects ordering but preserves filtering
			expect(Array.from(result)).toContain(child)
			expect(Array.from(result)).not.toContain(parent) // parent doesn't have Velocity
			expect(result.length).toBe(1) // Only child matches all criteria
			
			// Test that hierarchy actually affects ordering when multiple entities match
			const entity3 = addEntity(world)
			addComponent(world, entity3, Position)
			addComponent(world, entity3, Velocity)
			addComponent(world, entity3, ChildOf(child)) // grandchild
			
			const multiResult = query(world, [Position, Velocity, Hierarchy(ChildOf)])
			const multiArray = Array.from(multiResult)
			
			// Should return in hierarchical order: child before entity3 (its child)
			const childIndex = multiArray.indexOf(child)
			const entity3Index = multiArray.indexOf(entity3)
			expect(childIndex).toBeLessThan(entity3Index)
		})
		
		it('should handle Cascade (alias for Hierarchy) with buffered option', () => {
			const world = createWorld()
			const Position = { x: [] as number[], y: [] as number[] }
			const ChildOf = createRelation()
			
			const parent = addEntity(world)
			const child = addEntity(world)
			
			addComponent(world, parent, Position)
			addComponent(world, child, Position)
			addComponent(world, child, ChildOf(parent))
			
			const result = query(world, [Cascade(ChildOf, 1), Position], { buffered: true })
			
			expect(result).toBeInstanceOf(Uint32Array) // Hierarchy supports buffered
			expect(Array.from(result)).not.toContain(parent)
			expect(Array.from(result)).toContain(child)
			
			// Verify Cascade is truly identical to Hierarchy in behavior
			const hierarchyResult = query(world, [Hierarchy(ChildOf, 1), Position], { buffered: true })
			expect(Array.from(result)).toEqual(Array.from(hierarchyResult))
		})
	})
	
	describe('Legacy API replacement tests', () => {
		it('should replace queryBuffer with query + asBuffer', () => {
			const world = createWorld()
			const Position = { x: [] as number[], y: [] as number[] }
			
			const eid = addEntity(world)
			addComponent(world, eid, Position)
			
			const result = query(world, [Position], asBuffer)
			
			expect(result).toBeInstanceOf(Uint32Array)
			expect(result.length).toBe(1)
			expect(result[0]).toBe(eid)
		})
		
		it('should replace queryNested with query + isNested', () => {
			const world = createWorld()
			const Position = { x: [] as number[], y: [] as number[] }
			
			const eid = addEntity(world)
			addComponent(world, eid, Position)
			
			const result = query(world, [Position], isNested)
			
			expect(result.length).toBe(1)
			expect(result[0]).toBe(eid)
		})
		
		it('should replace queryNested + buffered with query + asBuffer + isNested', () => {
			const world = createWorld()
			const Position = { x: [] as number[], y: [] as number[] }
			
			const eid = addEntity(world)
			addComponent(world, eid, Position)
			
			const result = query(world, [Position], asBuffer, isNested)
			
			expect(result).toBeInstanceOf(Uint32Array)
			expect(result.length).toBe(1)
			expect(result[0]).toBe(eid)
		})
	})
	

	
	describe('Query Modifiers', () => {
		it('should support asBuffer modifier', () => {
			const world = createWorld()
			const Position = { x: [] as number[], y: [] as number[] }
			
			const eid = addEntity(world)
			addComponent(world, eid, Position)
			
			const result = query(world, [Position], asBuffer)
			
			expect(result).toBeInstanceOf(Uint32Array)
			expect(result.length).toBe(1)
			expect(result[0]).toBe(eid)
		})
		
		it('should support isNested modifier', () => {
			const world = createWorld()
			const Position = { x: [] as number[], y: [] as number[] }
			
			const eid = addEntity(world)
			addComponent(world, eid, Position)
			
			const result = query(world, [Position], isNested)
			const nestedResult = query(world, [Position], { commit: false })
			
			expect(Array.from(result)).toEqual(Array.from(nestedResult))
		})
		
		it('should support noCommit modifier (alias)', () => {
			const world = createWorld()
			const Position = { x: [] as number[], y: [] as number[] }
			
			const eid = addEntity(world)
			addComponent(world, eid, Position)
			
			const result = query(world, [Position], noCommit)
			const nestedResult = query(world, [Position], { commit: false })
			
			expect(Array.from(result)).toEqual(Array.from(nestedResult))
		})
		
		it('should support combined modifiers', () => {
			const world = createWorld()
			const Position = { x: [] as number[], y: [] as number[] }
			
			const eid = addEntity(world)
			addComponent(world, eid, Position)
			
			const result = query(world, [Position], asBuffer, isNested)
			
			expect(result).toBeInstanceOf(Uint32Array)
			expect(result.length).toBe(1)
			expect(result[0]).toBe(eid)
		})
		
		it('should override options with modifiers', () => {
			const world = createWorld()
			const Position = { x: [] as number[], y: [] as number[] }
			
			const eid = addEntity(world)
			addComponent(world, eid, Position)
			
			// asBuffer modifier should override buffered: false
			const bufferResult = query(world, [Position], asBuffer, { buffered: false })
			expect(bufferResult).toBeInstanceOf(Uint32Array)
			
			// isNested modifier should override commit: true  
			const nestedResult = query(world, [Position], isNested, { commit: true })
			const normalNested = query(world, [Position], { commit: false })
			expect(Array.from(nestedResult)).toEqual(Array.from(normalNested))
		})
		
		it('should work with combinators and modifiers', () => {
			const world = createWorld()
			const Position = { x: [] as number[], y: [] as number[] }
			const Velocity = { x: [] as number[], y: [] as number[] }
			const Dead = {}
			
			const eid1 = addEntity(world)
			addComponent(world, eid1, Position)
			addComponent(world, eid1, Velocity)
			
			const eid2 = addEntity(world)
			addComponent(world, eid2, Position)
			addComponent(world, eid2, Dead)
			
			const eid3 = addEntity(world)
			addComponent(world, eid3, Velocity)
			
			// Test And combinator with asBuffer modifier
			const andResult = query(world, [And(Position, Velocity)], asBuffer)
			expect(andResult).toBeInstanceOf(Uint32Array)
			expect(andResult.length).toBe(1)
			expect(andResult[0]).toBe(eid1)
			
			// Test Or combinator with asBuffer modifier
			const orResult = query(world, [Or(Position, Velocity)], asBuffer)
			expect(orResult).toBeInstanceOf(Uint32Array)
			expect(orResult.length).toBe(3) // eid1 has both, eid2 has Position, eid3 has Velocity
			expect(Array.from(orResult)).toContain(eid1)
			expect(Array.from(orResult)).toContain(eid2)
			expect(Array.from(orResult)).toContain(eid3)
			
			// Test Not combinator with isNested modifier
			const notResult = query(world, [Position, Not(Dead)], isNested)
			expect(notResult.length).toBe(1)
			expect(notResult[0]).toBe(eid1) // eid1 has Position but not Dead
		})
		
		it('should maintain backward compatibility with options object', () => {
			const world = createWorld()
			const Position = { x: [] as number[], y: [] as number[] }
			
			const eid = addEntity(world)
			addComponent(world, eid, Position)
			
			// Old way should still work
			const oldWay = query(world, [Position], { buffered: true })
			// New way
			const newWay = query(world, [Position], asBuffer)
			
			expect(oldWay).toBeInstanceOf(Uint32Array)
			expect(newWay).toBeInstanceOf(Uint32Array)
			expect(Array.from(oldWay)).toEqual(Array.from(newWay))
		})
	})
	
	describe('Hierarchy Query Tests', () => {
		it('should support hierarchical queries with proper parent-child ordering', () => {
			const world = createWorld()
			
			// Create entities
			const parent = addEntity(world)
			const child1 = addEntity(world)
			const child2 = addEntity(world)
			const grandchild1 = addEntity(world)
			const grandchild2 = addEntity(world)
			
			// Create a transform component
			const Transform = { matrix: [] as number[] }
			
			// Add transform to all entities
			addComponent(world, parent, Transform)
			addComponent(world, child1, Transform)
			addComponent(world, child2, Transform)
			addComponent(world, grandchild1, Transform)
			addComponent(world, grandchild2, Transform)
			
			// Create hierarchy: parent -> child1 -> grandchild1
			//                   parent -> child2 -> grandchild2
			const ChildOf = createRelation()
			
			addComponent(world, child1, ChildOf(parent))
			addComponent(world, child2, ChildOf(parent))
			addComponent(world, grandchild1, ChildOf(child1))
			addComponent(world, grandchild2, ChildOf(child2))
			
			// Query in hierarchical order using new API
			const orderedEntities = query(world, [Transform, Hierarchy(ChildOf)])
			
			// Should return entities in depth-based order: all depth 0, then depth 1, then depth 2
			expect(orderedEntities.length).toBe(5)
			
			const entitiesArray = Array.from(orderedEntities)
			
			// Verify proper hierarchical ordering (parents before children)
			const parentIndex = entitiesArray.indexOf(parent)
			const child1Index = entitiesArray.indexOf(child1)
			const child2Index = entitiesArray.indexOf(child2)
			const grandchild1Index = entitiesArray.indexOf(grandchild1)
			const grandchild2Index = entitiesArray.indexOf(grandchild2)
			
			// Parent should come before all children
			expect(parentIndex).toBeLessThan(child1Index)
			expect(parentIndex).toBeLessThan(child2Index)
			
			// Children should come before their grandchildren  
			expect(child1Index).toBeLessThan(grandchild1Index)
			expect(child2Index).toBeLessThan(grandchild2Index)
			
			// Verify depth-based ordering: entities grouped by depth level
			// Depth 0: parent, Depth 1: child1 & child2, Depth 2: grandchild1 & grandchild2
			// Parents always come before children, but siblings can be in any order
			
			// Parent (depth 0) should come before all children (depth 1+)
			expect(parentIndex).toBeLessThan(child1Index)
			expect(parentIndex).toBeLessThan(child2Index)
			expect(parentIndex).toBeLessThan(grandchild1Index)
			expect(parentIndex).toBeLessThan(grandchild2Index)
			
			// Children (depth 1) should come before grandchildren (depth 2)
			expect(child1Index).toBeLessThan(grandchild1Index)
			expect(child1Index).toBeLessThan(grandchild2Index)
			expect(child2Index).toBeLessThan(grandchild1Index)
			expect(child2Index).toBeLessThan(grandchild2Index)
			
			// All entities should be present
			expect(entitiesArray).toContain(parent)
			expect(entitiesArray).toContain(child1)
			expect(entitiesArray).toContain(child2)
			expect(entitiesArray).toContain(grandchild1)
			expect(entitiesArray).toContain(grandchild2)
			
			// Test depth-specific functionality (these should still work)
			expect(getHierarchyDepth(world, parent, ChildOf)).toBe(0)
			expect(getHierarchyDepth(world, child1, ChildOf)).toBe(1)
			expect(getHierarchyDepth(world, child2, ChildOf)).toBe(1)
			expect(getHierarchyDepth(world, grandchild1, ChildOf)).toBe(2)
			expect(getHierarchyDepth(world, grandchild2, ChildOf)).toBe(2)
			
			expect(getMaxHierarchyDepth(world, ChildOf)).toBe(2)
		})

		it('should maintain hierarchy when relations are removed', () => {
			const world = createWorld()
			
			const parent = addEntity(world)
			const child = addEntity(world)
			const grandchild = addEntity(world)
			
			const Transform = { matrix: [] as number[] }
			addComponent(world, parent, Transform)
			addComponent(world, child, Transform)
			addComponent(world, grandchild, Transform)
			
			const ChildOf = createRelation()
			
			// Build hierarchy
			addComponent(world, child, ChildOf(parent))
			addComponent(world, grandchild, ChildOf(child))
			
			// Verify initial hierarchy
			expect(getHierarchyDepth(world, parent, ChildOf)).toBe(0)
			expect(getHierarchyDepth(world, child, ChildOf)).toBe(1)
			expect(getHierarchyDepth(world, grandchild, ChildOf)).toBe(2)
			
			// Remove middle relation
			removeComponent(world, child, ChildOf(parent))
			
			// Child should now be a root (depth 0), grandchild should move to depth 1
			expect(getHierarchyDepth(world, parent, ChildOf)).toBe(0)
			expect(getHierarchyDepth(world, child, ChildOf)).toBe(0)
			expect(getHierarchyDepth(world, grandchild, ChildOf)).toBe(1)
		})

		it('should handle multiple separate hierarchies', () => {
			const world = createWorld()
			
			// Create two separate hierarchy trees
			const treeA_root = addEntity(world)
			const treeA_child1 = addEntity(world)
			const treeA_child2 = addEntity(world)
			
			const treeB_root = addEntity(world)
			const treeB_child1 = addEntity(world)
			const treeB_child2 = addEntity(world)
			
			const Position = { x: [] as number[], y: [] as number[] }
			const entities = [treeA_root, treeA_child1, treeA_child2, treeB_root, treeB_child1, treeB_child2]
			entities.forEach(eid => addComponent(world, eid, Position))
			
			const ChildOf = createRelation()
			
			// Build tree A
			addComponent(world, treeA_child1, ChildOf(treeA_root))
			addComponent(world, treeA_child2, ChildOf(treeA_root))
			
			// Build tree B  
			addComponent(world, treeB_child1, ChildOf(treeB_root))
			addComponent(world, treeB_child2, ChildOf(treeB_root))
			
			// Query hierarchical order
			const result = query(world, [Position, Hierarchy(ChildOf)])
			const resultArray = Array.from(result)
			
			// All entities should be included
			expect(result.length).toBe(6)
			
			// Verify each tree maintains proper ordering
			const treeA_rootIndex = resultArray.indexOf(treeA_root)
			const treeA_child1Index = resultArray.indexOf(treeA_child1)
			const treeA_child2Index = resultArray.indexOf(treeA_child2)
			
			const treeB_rootIndex = resultArray.indexOf(treeB_root)
			const treeB_child1Index = resultArray.indexOf(treeB_child1)
			const treeB_child2Index = resultArray.indexOf(treeB_child2)
			
			// Tree A: root should come before children
			expect(treeA_rootIndex).toBeLessThan(treeA_child1Index)
			expect(treeA_rootIndex).toBeLessThan(treeA_child2Index)
			
			// Tree B: root should come before children
			expect(treeB_rootIndex).toBeLessThan(treeB_child1Index)
			expect(treeB_rootIndex).toBeLessThan(treeB_child2Index)
			
			// Verify depths are correct for both trees
			expect(getHierarchyDepth(world, treeA_root, ChildOf)).toBe(0)
			expect(getHierarchyDepth(world, treeA_child1, ChildOf)).toBe(1)
			expect(getHierarchyDepth(world, treeA_child2, ChildOf)).toBe(1)
			
			expect(getHierarchyDepth(world, treeB_root, ChildOf)).toBe(0)
			expect(getHierarchyDepth(world, treeB_child1, ChildOf)).toBe(1)
			expect(getHierarchyDepth(world, treeB_child2, ChildOf)).toBe(1)
		})

		it('should handle entities with no hierarchy relations (orphans)', () => {
			const world = createWorld()
			
			const parent = addEntity(world)
			const child = addEntity(world)
			const orphan1 = addEntity(world)
			const orphan2 = addEntity(world)
			
			const Position = { x: [] as number[], y: [] as number[] }
			addComponent(world, parent, Position)
			addComponent(world, child, Position)
			addComponent(world, orphan1, Position)
			addComponent(world, orphan2, Position)
			
			const ChildOf = createRelation()
			
			// Only create one relation
			addComponent(world, child, ChildOf(parent))
			
			// Query with hierarchy - should include orphans
			const result = query(world, [Position, Hierarchy(ChildOf)])
			expect(result.length).toBe(4)
			
			const resultArray = Array.from(result)
			const parentIndex = resultArray.indexOf(parent)
			const childIndex = resultArray.indexOf(child)
			
			// Parent should come before child
			expect(parentIndex).toBeLessThan(childIndex)
			
			// Orphans should be included but can be at any position relative to each other
			expect(resultArray).toContain(orphan1)
			expect(resultArray).toContain(orphan2)
			
			// Verify depths
			expect(getHierarchyDepth(world, parent, ChildOf)).toBe(0)
			expect(getHierarchyDepth(world, child, ChildOf)).toBe(1)
			expect(getHierarchyDepth(world, orphan1, ChildOf)).toBe(0) // orphans have depth 0
			expect(getHierarchyDepth(world, orphan2, ChildOf)).toBe(0)
		})

		it('should work with auto-remove-subject relations', () => {
			const world = createWorld()
			
			const parent = addEntity(world)
			const child = addEntity(world)
			const grandchild = addEntity(world)
			
			const Position = { x: [] as number[], y: [] as number[] }
			addComponent(world, parent, Position)
			addComponent(world, child, Position)
			addComponent(world, grandchild, Position)
			
			const ChildOf = createRelation(withAutoRemoveSubject)
			
			// Build hierarchy
			addComponent(world, child, ChildOf(parent))
			addComponent(world, grandchild, ChildOf(child))
			
			// Verify initial hierarchy
			expect(getHierarchyDepth(world, parent, ChildOf)).toBe(0)
			expect(getHierarchyDepth(world, child, ChildOf)).toBe(1)
			expect(getHierarchyDepth(world, grandchild, ChildOf)).toBe(2)
			
			const initialResult = query(world, [Position, Hierarchy(ChildOf)])
			expect(initialResult.length).toBe(3)
			
			// Remove parent - should auto-remove child and grandchild
			removeEntity(world, parent)
			
			// Child and grandchild should be auto-removed
			expect(entityExists(world, parent)).toBe(false)
			expect(entityExists(world, child)).toBe(false)
			expect(entityExists(world, grandchild)).toBe(false)
			
			// Query should return empty (regular query first to flush removals)
			const regularResult = query(world, [Position])
			expect(regularResult.length).toBe(0)
			
			const finalResult = query(world, [Position, Hierarchy(ChildOf)])
			expect(finalResult.length).toBe(0)
		})

		it('should handle deep hierarchies efficiently', () => {
			const world = createWorld()
			
			const Position = { x: [] as number[], y: [] as number[] }
			const ChildOf = createRelation()
			const depth = 50
			const entities: number[] = []
			
			// Create a deep hierarchy: root -> child1 -> child2 -> ... -> child50
			for (let i = 0; i < depth; i++) {
				const eid = addEntity(world)
				addComponent(world, eid, Position)
				entities.push(eid)
				
				if (i > 0) {
					addComponent(world, eid, ChildOf(entities[i - 1]))
				}
			}
			
			// Query hierarchical order
			const start = performance.now()
			const result = query(world, [Position, Hierarchy(ChildOf)])
			const end = performance.now()
			
			// Should include all entities
			expect(result.length).toBe(depth)
			
			// Verify proper ordering - each entity should come before the next
			const resultArray = Array.from(result)
			for (let i = 0; i < depth - 1; i++) {
				const currentIndex = resultArray.indexOf(entities[i])
				const nextIndex = resultArray.indexOf(entities[i + 1])
				expect(currentIndex).toBeLessThan(nextIndex)
			}
			
			// Verify depths are correct
			for (let i = 0; i < depth; i++) {
				expect(getHierarchyDepth(world, entities[i], ChildOf)).toBe(i)
			}
			
			expect(getMaxHierarchyDepth(world, ChildOf)).toBe(depth - 1)
			
			// Performance check - should complete reasonably quickly (under 10ms for 50 entities)
			expect(end - start).toBeLessThan(10)
		})
	})
})
