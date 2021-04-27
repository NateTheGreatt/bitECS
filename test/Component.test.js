import assert from 'assert'
import { Types } from '../src/index.js'
import { createWorld } from '../src/World.js'
import { $componentMap, addComponent, defineComponent, hasComponent, registerComponent, removeComponent } from '../src/Component.js'
import { addEntity, resetGlobals } from '../src/Entity.js'

describe('Component', () => {
  afterEach(() => {
    resetGlobals()
  })
  it('should register components on-demand', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })

    registerComponent(world, TestComponent)
    assert(world[$componentMap].has(TestComponent))
  })
  it('should register components automatically upon adding to an entity', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })

    const eid = addEntity(world)

    addComponent(world, TestComponent, eid)
    assert(world[$componentMap].has(TestComponent))
  })
  it('should add and remove components from an entity', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })

    const eid = addEntity(world)

    addComponent(world, TestComponent, eid)
    assert(hasComponent(world, TestComponent, eid))

    removeComponent(world, TestComponent, eid)
    assert(hasComponent(world, TestComponent, eid) === false)
  })
})
