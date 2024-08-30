import assert from 'assert'
import { describe, it } from 'vitest'
import { registerComponent, addComponent, hasComponent, removeComponent, InternalWorld, createWorld, addEntity, removeEntity, $internal, getEntityComponents } from '../../src/core'

describe('Component Tests', () => {

	it('should register components on-demand', () => {
		const world = createWorld()
		const TestComponent = { value: [] }

		registerComponent(world, TestComponent)
		const ctx = (world as InternalWorld)[$internal]
		assert(ctx.componentMap.has(TestComponent))
	})

	it('should register components automatically upon adding to an entity', () => {
		const world = createWorld()
		const TestComponent = { value: [] }

		const eid = addEntity(world)

		addComponent(world, TestComponent, eid)
		const ctx = (world as InternalWorld)[$internal]
		assert(ctx.componentMap.has(TestComponent))
	})

	it('should add and remove components from an entity', () => {
		const world = createWorld()
		const TestComponent = { value: [] }

		const eid = addEntity(world)

		addComponent(world, TestComponent, eid)
		assert(hasComponent(world, TestComponent, eid))

		removeComponent(world, TestComponent, eid)
		assert(hasComponent(world, TestComponent, eid) === false)
	})

	it('should only remove the component specified', () => {
		const world = createWorld()
		const TestComponent = { value: [] }
		const TestComponent2 = { value: [] }

		const eid = addEntity(world)

		addComponent(world, TestComponent, eid)
		addComponent(world, TestComponent2, eid)
		assert(hasComponent(world, TestComponent, eid))
		assert(hasComponent(world, TestComponent2, eid))

		removeComponent(world, TestComponent, eid)
		assert(hasComponent(world, TestComponent, eid) === false)
		assert(hasComponent(world, TestComponent2, eid) === true)
	})

	it('should create tag components', () => {
		const world = createWorld()
		const TestComponent = {}

		const eid = addEntity(world)

		addComponent(world, TestComponent, eid)
		assert(hasComponent(world, TestComponent, eid))

		removeComponent(world, TestComponent, eid)
		assert(hasComponent(world, TestComponent, eid) === false)
	})

	it('should correctly register more than 32 components', () => {
		const world = createWorld()

		const eid = addEntity(world)

		Array(1024)
			.fill(null)
			.map(() => ({}))
			.forEach((c) => {
				addComponent(world, c, eid)
				assert(hasComponent(world, c, eid))
			})
	})

	it('should add components to entities after recycling', () => {
		const world = createWorld(10)
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
		addComponent(world, component, eid)

		assert(hasComponent(world, component, eid))
	})

	it('should correctly add more than 64 components to an entity', () => {
		const world = createWorld()
		const eid = addEntity(world)

		const createComponent = (index) => ({ value: [], index })

		const components = Array(128)
			.fill(null)
			.map((_, index) => createComponent(index))

		components.forEach((component) => {
			addComponent(world, component, eid)
			assert(hasComponent(world, component, eid), `Component ${component.index} should be added`)
		})

		const entityComponents = getEntityComponents(world, eid)
		assert(entityComponents.length === 128, 'Entity should have 128 components')

		components.forEach((component) => {
			assert(entityComponents.includes(component), `Component ${component.index} should be in entity components`)
			assert(hasComponent(world, component, eid), `Component ${component.index} should be present using hasComponent`)
		})
	})
})
