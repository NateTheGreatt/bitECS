import { strictEqual } from 'assert'
import { Types } from '../../src/index.js'
import { createWorld } from '../../src/World.js'
import { addComponent, defineComponent } from '../../src/Component.js'
import { addEntity, removeEntity, resetGlobals } from '../../src/Entity.js'
import { Changed, defineQuery, Not } from '../../src/Query.js'

describe('Query Integration Tests', () => {
  afterEach(() => {
    resetGlobals()
  })
  it('should define a query and return matching eids', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })
    const query = defineQuery([TestComponent])
    const eid = addEntity(world)
    addComponent(world, TestComponent, eid)
    
    let ents = query(world)
    
    strictEqual(ents.length, 1)
    strictEqual(ents[0], 0)

    removeEntity(world, eid)

    ents = query(world)    
    strictEqual(ents.length, 0)
  })
  it('should define a query with Not and return matching eids', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })
    const query = defineQuery([Not(TestComponent)])
    
    const eid1 = addEntity(world)
    addComponent(world, TestComponent, eid1)

    const eid2 = addEntity(world)
    
    let ents = query(world)
    
    strictEqual(ents.length, 1)
    strictEqual(ents[0], eid2)

    removeEntity(world, eid2)

    ents = query(world)
    strictEqual(ents.length, 0)
  })
  it('should define a query with Changed and return matching eids whose component state has changed', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })
    const query = defineQuery([Changed(TestComponent)])
    const eid1 = addEntity(world)
    const eid2 = addEntity(world)
    addComponent(world, TestComponent, eid1)
    addComponent(world, TestComponent, eid2)
    
    let ents = query(world)
    strictEqual(ents.length, 0)

    TestComponent.value[eid1]++
    
    ents = query(world)

    strictEqual(ents.length, 1)
    strictEqual(ents[0], eid1)
  })
})