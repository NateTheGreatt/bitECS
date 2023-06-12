import assert from 'assert'
import { Types } from '../../src/index.js'
import { createWorld } from '../../src/World.js'
import { $componentMap, addComponent, defineComponent, hasComponent, registerComponent, removeComponent } from '../../src/Component.js'
import { addEntity, resetGlobals } from '../../src/Entity.js'
import { addAndFillComponent, updateComponent } from 'bitecs'

describe('Component Integration Tests', () => {
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
  it('should add and fill, and update components from an entity', () => {
    const world = createWorld()
    const TestComponent = defineComponent({
      foo: Types.f32,
      bar: {
        baz: Types.f32,
      }
    })
    const originalFoo = 10
    const originalBaz = 11
    const newFoo = 1000
    const newBaz = 1337

    const eid = addEntity(world)

    addAndFillComponent(world, TestComponent, eid, {
      foo: originalFoo,
      bar: { baz: originalBaz },
    })
    assert(hasComponent(world, TestComponent, eid))
    assert(TestComponent.foo[eid] === originalFoo)
    assert(TestComponent.foo.bar.baz[eid] === originalBaz)

    updateComponent(world, TestComponent, eid, {
      foo: newFoo,
      bar: { baz: newBaz },
    })
    assert(TestComponent.foo[eid] === newFoo)
    assert(TestComponent.foo.bar.baz[eid] === newBaz)
  })
  it('should only remove the component specified', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })
    const TestComponent2 = defineComponent({ value: Types.f32 })

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
    const TestComponent = defineComponent()

    const eid = addEntity(world)

    addComponent(world, TestComponent, eid)
    assert(hasComponent(world, TestComponent, eid))

    removeComponent(world, TestComponent, eid)
    assert(hasComponent(world, TestComponent, eid) === false)
  })
  it('should correctly register more than 32 components', () => {
    const world = createWorld()
        
    const eid = addEntity(world)
    
    Array(1024).fill(null)
      .map(_ => defineComponent())
      .forEach((c) => {
        addComponent(world, c, eid)
        assert(hasComponent(world, c, eid))
      })
  })
})
