import assert, { strictEqual } from 'assert'
import { Types } from '../src/index.js'
import { createWorld } from '../src/World.js'
import { $componentMap, addComponent, defineComponent, hasComponent, registerComponent, removeComponent } from '../src/Component.js'
import { addEntity, removeEntity, resetGlobals } from '../src/Entity.js'

const TestComponent = defineComponent({ value: Types.f32 })

describe('Component', () => {
  afterEach(() => {
    resetGlobals()
  })
  it('should register components on-demand', () => {
    const world = createWorld()

    registerComponent(world, TestComponent)
    assert(world[$componentMap].has(TestComponent))
  })
  it('should register components automatically upon adding to an entity', () => {
    const world = createWorld()
    const eid = addEntity(world)

    addComponent(world, TestComponent, eid)
    assert(world[$componentMap].has(TestComponent))
  })
  it('should add and remove components from an entity', () => {
    const world = createWorld()
    const eid = addEntity(world)

    addComponent(world, TestComponent, eid)
    assert(hasComponent(world, TestComponent, eid))

    removeComponent(world, TestComponent, eid)
    assert(hasComponent(world, TestComponent, eid) === false)
  })
})
