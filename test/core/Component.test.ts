import { describe, it, expect, vi } from 'vitest'
import { registerComponent, addComponent, addComponents, setComponent, hasComponent, removeComponent, InternalWorld, createWorld, addEntity, removeEntity, $internal, getEntityComponents, observe, onSet, onAdd, set, createRelation, query, Wildcard, withStore } from '../../src/core'

describe('Component Tests', () => {

	it('should register components on-demand', () => {
		const world = createWorld()
		const TestComponent = { value: [] }

		registerComponent(world, TestComponent)
		const ctx = (world as InternalWorld)[$internal]
		expect(ctx.componentMap.has(TestComponent)).toBe(true)
	})

	it('should register components automatically upon adding to an entity', () => {
		const world = createWorld()
		const TestComponent = { value: [] }

		const eid = addEntity(world)

		addComponent(world, eid, TestComponent)
		const ctx = (world as InternalWorld)[$internal]
		expect(ctx.componentMap.has(TestComponent)).toBe(true)
	})

	it('should add and remove components from an entity', () => {
		const world = createWorld()
		const TestComponent = { value: [] }

		const eid = addEntity(world)

		addComponent(world, eid, TestComponent)
		expect(hasComponent(world, eid, TestComponent)).toBe(true)

		removeComponent(world, eid, TestComponent)
		expect(hasComponent(world, eid, TestComponent)).toBe(false)
	})

	it('should only remove the component specified', () => {
		const world = createWorld()
		const TestComponent = { value: [] }
		const TestComponent2 = { value: [] }

		const eid = addEntity(world)

		addComponent(world, eid, TestComponent)
		addComponent(world, eid, TestComponent2)
		expect(hasComponent(world, eid, TestComponent)).toBe(true)
		expect(hasComponent(world, eid, TestComponent2)).toBe(true)

		removeComponent(world, eid, TestComponent)
		expect(hasComponent(world, eid, TestComponent)).toBe(false)
		expect(hasComponent(world, eid, TestComponent2)).toBe(true)
	})

	it('should create tag components', () => {
		const world = createWorld()
		const TestComponent = {}

		const eid = addEntity(world)

		addComponent(world, eid, TestComponent)
		expect(hasComponent(world, eid, TestComponent)).toBe(true)

		removeComponent(world, eid, TestComponent)
		expect(hasComponent(world, eid, TestComponent)).toBe(false)
	})

	it('should correctly register more than 32 components', () => {
		const world = createWorld()

		const eid = addEntity(world)

		Array(1024)
			.fill(null)
			.map(() => ({}))
			.forEach((c) => {
				addComponent(world, eid, c)
				expect(hasComponent(world, eid, c)).toBe(true)
			})
	})

	it('should add components to entities after recycling', () => {
		const world = createWorld()
		let eid = 0

		for (let i = 0; i < 10; i++) {
			addEntity(world)
		}

		for (let i = 0; i < 10; i++) {
			removeEntity(world, i)
		}

		for (let i = 0; i < 10; i++) {
			eid = addEntity(world)
		}

		const component = { value: [] }
		addComponent(world, eid, component)

		expect(hasComponent(world, eid, component)).toBe(true)
	})

	it('should correctly add more than 64 components to an entity', () => {
		const world = createWorld()
		const eid = addEntity(world)

		const createComponent = (index) => ({ value: [], index })

		const components = Array(128)
			.fill(null)
			.map((_, index) => createComponent(index))

		components.forEach((component) => {
			addComponent(world, eid, component)
			expect(hasComponent(world, eid, component)).toBe(true)
		})

		const entityComponents = getEntityComponents(world, eid)
		expect(entityComponents.length).toBe(128)

		components.forEach((component) => {
			expect(entityComponents.includes(component)).toBe(true)
			expect(hasComponent(world, eid, component)).toBe(true)
		})
	})

	it('should always call setter even when entity already has the component', () => {
		const world = createWorld()
		const eid = addEntity(world)
		const Position: { x: number[], y: number[] } = { x: [], y: [] }

		const mockObserver = vi.fn((eid, params) => {
			Position.x[eid] = params.x
			Position.y[eid] = params.y
		})
		const unsubscribe = observe(world, onSet(Position), mockObserver)

		// Test addComponent - first time (entity doesn't have component)
		addComponent(world, eid, set(Position, { x: 1, y: 1 }))
		expect(mockObserver).toHaveBeenCalledWith(eid, { x: 1, y: 1 })
		expect(mockObserver).toHaveBeenCalledTimes(1)
		expect(hasComponent(world, eid, Position)).toBe(true)
		expect(Position.x[eid]).toBe(1)
		expect(Position.y[eid]).toBe(1)

		// Test addComponent - second time (entity already has component)
		// Should still call the setter
		addComponent(world, eid, set(Position, { x: 2, y: 2 }))
		expect(mockObserver).toHaveBeenCalledWith(eid, { x: 2, y: 2 })
		expect(mockObserver).toHaveBeenCalledTimes(2)
		expect(Position.x[eid]).toBe(2)
		expect(Position.y[eid]).toBe(2)

		// Test setComponent - third time (entity already has component)  
		// Should still call the setter
		setComponent(world, eid, Position, { x: 3, y: 3 })
		expect(mockObserver).toHaveBeenCalledWith(eid, { x: 3, y: 3 })
		expect(mockObserver).toHaveBeenCalledTimes(3)
		expect(Position.x[eid]).toBe(3)
		expect(Position.y[eid]).toBe(3)

		unsubscribe()
	})

	it('should call setter with setComponent on new component', () => {
		const world = createWorld()
		const eid = addEntity(world)
		const Velocity: { dx: number[], dy: number[] } = { dx: [], dy: [] }

		const mockObserver = vi.fn((eid, params) => {
			Velocity.dx[eid] = params.dx
			Velocity.dy[eid] = params.dy
		})
		const unsubscribe = observe(world, onSet(Velocity), mockObserver)

		// Test setComponent on entity that doesn't have the component yet
		expect(hasComponent(world, eid, Velocity)).toBe(false)
		setComponent(world, eid, Velocity, { dx: 5, dy: 10 })
		
		expect(mockObserver).toHaveBeenCalledWith(eid, { dx: 5, dy: 10 })
		expect(mockObserver).toHaveBeenCalledTimes(1)
		expect(hasComponent(world, eid, Velocity)).toBe(true)
		expect(Velocity.dx[eid]).toBe(5)
		expect(Velocity.dy[eid]).toBe(10)

		unsubscribe()
	})

	it('should properly clean up relation components when removing relations', () => {
		const world = createWorld()
		
		// Create test scenario from the bug report
		const Asteroid = { preciousMetals: [] as boolean[] }
		const OrbitedBy = createRelation()
		const IlluminatedBy = createRelation()
		
		const earth = addEntity(world)
		const moon = addEntity(world)
		const sun = addEntity(world)
		
		addComponent(world, moon, Asteroid)
		Asteroid.preciousMetals[moon] = true
		
		// Add relations
		addComponent(world, earth, OrbitedBy(moon))
		addComponent(world, earth, IlluminatedBy(sun))
		
		// Verify relations exist
		expect(hasComponent(world, earth, OrbitedBy(moon))).toBe(true)
		expect(hasComponent(world, earth, IlluminatedBy(sun))).toBe(true)
		
		// Should find 2 entities related to earth before removal
		let relatedToEarth = query(world, [Wildcard(earth)])
		expect(relatedToEarth.length).toBe(2)
		expect(relatedToEarth).toContain(moon)
		expect(relatedToEarth).toContain(sun)
		
		// Remove IlluminatedBy relation
		removeComponent(world, earth, IlluminatedBy(sun))
		
		// Verify the specific relation is removed
		expect(hasComponent(world, earth, IlluminatedBy(sun))).toBe(false)
		expect(hasComponent(world, earth, OrbitedBy(moon))).toBe(true)
		
		// Should now only find 1 entity related to earth (moon)
		relatedToEarth = query(world, [Wildcard(earth)])
		expect(relatedToEarth.length).toBe(1)
		expect(relatedToEarth).toContain(moon)
		expect(relatedToEarth).not.toContain(sun)
		
		// Verify all Wildcard tracking components are cleaned up
		expect(hasComponent(world, sun, Wildcard(earth))).toBe(false)
		expect(hasComponent(world, sun, Wildcard(IlluminatedBy))).toBe(false)
	})

	it('should call onAdd before onSet when adding component with data', () => {
		const world = createWorld()
		const eid = addEntity(world)
		const TestComponent: { priority: number[] } = { priority: [] }
		
		const callOrder: string[] = []
		
		// Set up onAdd callback (should run first and set default value)
		observe(world, onAdd(TestComponent), (entityId) => {
			callOrder.push('onAdd')
			TestComponent.priority[entityId] = 0
		})
		
		// Set up onSet callback (should run second and update with provided value)
		observe(world, onSet(TestComponent), (entityId, params) => {
			callOrder.push('onSet')
			TestComponent.priority[entityId] = params.priority
		})
		
		// Add component with initial data
		addComponent(world, eid, set(TestComponent, { priority: 3 }))
		
		// Verify callback order
		expect(callOrder).toEqual(['onAdd', 'onSet'])
		
		// Verify final value is from onSet (not overwritten by onAdd)
		expect(TestComponent.priority[eid]).toBe(3)
	})

	it('should properly set relation defaults', () => {
		const world = createWorld()
		
		// Exact test case from the GitHub issue
		const CanTarget = createRelation(
			withStore(() => {
				const comp = { priority: [] as number[] }
				observe(world, onAdd(comp), (eid) => { comp.priority[eid] = 0 })
				observe(world, onSet(comp), (eid, params) => { comp.priority[eid] = params.priority })
				return comp
			})
		)
		
		const source = addEntity(world)
		const target = addEntity(world)
		
		addComponent(world, source, set(CanTarget(target), { priority: 3 }))
		
		// This should now be 3, not 0 (was failing before due to onSet running before onAdd)
		expect(CanTarget(target).priority[source]).toBe(3)
	})

	it('should return boolean indicating if component was added or already existed', () => {
		const world = createWorld()
		const eid = addEntity(world)
		const TestComponent = { value: [] }

		// First add should return true (component was added)
		const firstAdd = addComponent(world, eid, TestComponent)
		expect(firstAdd).toBe(true)
		expect(hasComponent(world, eid, TestComponent)).toBe(true)

		// Second add should return false (component already existed)
		const secondAdd = addComponent(world, eid, TestComponent)
		expect(secondAdd).toBe(false)
		expect(hasComponent(world, eid, TestComponent)).toBe(true)

		// Adding with data should still return false if component exists
		const thirdAdd = addComponent(world, eid, set(TestComponent, { someData: 42 }))
		expect(thirdAdd).toBe(false)
	})

	it('should support addComponents with spread args and array', () => {
		const world = createWorld()
		const eid = addEntity(world)
		const ComponentA = { value: [] }
		const ComponentB = { value: [] }
		const ComponentC = { value: [] }

		// Test spread args
		addComponents(world, eid, ComponentA, ComponentB)
		expect(hasComponent(world, eid, ComponentA)).toBe(true)
		expect(hasComponent(world, eid, ComponentB)).toBe(true)

		// Test array
		addComponents(world, eid, [ComponentC])
		expect(hasComponent(world, eid, ComponentC)).toBe(true)

		// Test mixed array with set()
		const eid2 = addEntity(world)
		const ComponentD = { priority: [] as number[] }
		addComponents(world, eid2, [ComponentA, set(ComponentD, { priority: 5 })])
		expect(hasComponent(world, eid2, ComponentA)).toBe(true)
		expect(hasComponent(world, eid2, ComponentD)).toBe(true)
	})


})
