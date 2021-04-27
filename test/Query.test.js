import { strictEqual } from 'assert'
import { Types } from '../src/index.js'
import { createWorld } from '../src/World.js'
import { addComponent, defineComponent } from '../src/Component.js'
import { addEntity, resetGlobals } from '../src/Entity.js'
import { Changed, defineQuery, Not } from '../src/Query.js'

describe('Query', () => {
  afterEach(() => {
    resetGlobals()
  })
  it('should define a query and return matching eids', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })
    const query = defineQuery([TestComponent])
    const eid = addEntity(world)
    addComponent(world, TestComponent, eid)
    const ents = query(world)
    
    strictEqual(ents.length, 1)
    strictEqual(ents[0], 0)
  })
  it('should define a query with Not and return matching eids', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })
    const query = defineQuery([Not(TestComponent)])
    const eid1 = addEntity(world)
    const eid2 = addEntity(world)
    addComponent(world, TestComponent, eid1)
    const ents = query(world)
    
    strictEqual(ents.length, 1)
    strictEqual(ents[0], eid2)
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