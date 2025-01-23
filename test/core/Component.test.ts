import assert from 'assert'
import { describe, it } from 'vitest'
import {
	$default,
	Default,
	registerComponent,
	addComponent,
	hasComponent,
	removeComponent,
	InternalWorld,
	createWorld,
	addEntity,
	removeEntity,
	$internal,
	getEntityComponents,
	set,
	observe,
	onSet
} from '../../src/core'

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

		addComponent(world, eid, TestComponent)
		const ctx = (world as InternalWorld)[$internal]
		assert(ctx.componentMap.has(TestComponent))
	})

	it('should add and remove components from an entity', () => {
		const world = createWorld()
		const TestComponent = { value: [] }

		const eid = addEntity(world)

		addComponent(world, eid, TestComponent)
		assert(hasComponent(world, eid, TestComponent))

		removeComponent(world, eid, TestComponent)
		assert(hasComponent(world, eid, TestComponent) === false)
	})

	it('should only remove the component specified', () => {
		const world = createWorld()
		const TestComponent = { value: [] }
		const TestComponent2 = { value: [] }

		const eid = addEntity(world)

		addComponent(world, eid, TestComponent)
		addComponent(world, eid, TestComponent2)
		assert(hasComponent(world, eid, TestComponent))
		assert(hasComponent(world, eid, TestComponent2))

		removeComponent(world, eid, TestComponent)
		assert(hasComponent(world, eid, TestComponent) === false)
		assert(hasComponent(world, eid, TestComponent2) === true)
	})

	it('should create tag components', () => {
		const world = createWorld()
		const TestComponent = {}

		const eid = addEntity(world)

		addComponent(world, eid, TestComponent)
		assert(hasComponent(world, eid, TestComponent))

		removeComponent(world, eid, TestComponent)
		assert(hasComponent(world, eid, TestComponent) === false)
	})

	it('should correctly register more than 32 components', () => {
		const world = createWorld()

		const eid = addEntity(world)

		Array(1024)
			.fill(null)
			.map(() => ({}))
			.forEach((c) => {
				addComponent(world, eid, c)
				assert(hasComponent(world, eid, c))
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

		assert(hasComponent(world, eid, component))
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
			assert(hasComponent(world, eid, component), `Component ${component.index} should be added`)
		})

		const entityComponents = getEntityComponents(world, eid)
		assert(entityComponents.length === 128, 'Entity should have 128 components')

		components.forEach((component) => {
			assert(entityComponents.includes(component), `Component ${component.index} should be in entity components`)
			assert(hasComponent(world, eid, component), `Component ${component.index} should be present using hasComponent`)
		})
	})

	it('should handle default initialization via $default method', () => {
		const world = createWorld()
		const eid = addEntity(world)

		const TestComponent = {
			x: [] as number[],
			y: [] as number[],
			[$default](eid: number) {
				this.x[eid] = 1
				this.y[eid] = 1
			}
		}

		const TestComponent2 = Object.assign(
			new Float32Array(10000),
			{ [$default](eid: number) { this[eid] = 100 }}
		)

		const TestComponent3 = Object.assign(
			[] as number[],
			{ [$default](eid: number) { this[eid] = 100 }}
		)

		observe(world, onSet(TestComponent3), (eid, value) => {
			TestComponent3[eid] = value
		})

		addComponent(world, eid, TestComponent)
		assert(TestComponent.x[eid] === 1)
		assert(TestComponent.y[eid] === 1)

		addComponent(world, eid, TestComponent2)
		assert(TestComponent2[eid] === 100)

		addComponent(world, eid, set(TestComponent3, 42))
		assert(TestComponent3[eid] === 42)
	})

	it('should pass params to default initializer via Default()', () => {
		const world = createWorld()
		const eid = addEntity(world)
		const eid2 = addEntity(world)

		const TestComponent = Object.assign(
			[],
			{[$default](eid: number, params: number) {
				this[eid] = new Float32Array(params || 10000)
			}}
		)

		addComponent(world, eid, TestComponent)
		assert(TestComponent[eid].length === 10000)

		addComponent(world, eid2, Default(TestComponent, 42))
		assert(TestComponent[eid2].length === 42)
	})

	it('should throw if $default is not a function', () => {
		const world = createWorld()
		const eid = addEntity(world)

		const BadComponent = {
			value: [] as number[],
			[$default]: 42
		}

		assert.throws(() => {
			addComponent(world, eid, BadComponent)
		})
	})
})
