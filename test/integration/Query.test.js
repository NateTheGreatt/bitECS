import { strictEqual } from 'assert'
import { exitQuery, Types } from '../../src/index.js'
import { createWorld } from '../../src/World.js'
import { addComponent, removeComponent, defineComponent } from '../../src/Component.js'
import { addEntity, removeEntity, resetGlobals } from '../../src/Entity.js'
import { Changed, defineQuery, enterQuery, Not } from '../../src/Query.js'

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
    const Foo = defineComponent({ value: Types.f32 })
    const notFooQuery = defineQuery([Not(Foo)])
    
    const eid1 = addEntity(world)

    let ents = notFooQuery(world)
    strictEqual(ents.length, 1)
    strictEqual(ents[0], eid1)

    addComponent(world, Foo, eid1)

    ents = notFooQuery(world)
    strictEqual(ents.length, 0)

    const eid2 = addEntity(world)
    
    ents = notFooQuery(world)
    strictEqual(ents.length, 1)
    strictEqual(ents[0], eid2)

    removeEntity(world, eid2)

    ents = notFooQuery(world)
    strictEqual(ents.length, 0)
  })
  it('should correctly populate Not queries when adding/removing components', () => {
    const world = createWorld()

    const Foo = defineComponent()
    const Bar = defineComponent()

    const notFooQuery = defineQuery([Not(Foo)])
    const fooQuery = defineQuery([Foo])

    const fooBarQuery = defineQuery([Foo, Bar])
    const notFooBarQuery = defineQuery([Not(Foo), Not(Bar)])

    const eid0 = addEntity(world)
    const eid1 = addEntity(world)
    const eid2 = addEntity(world)

    /* initial state */

    // foo query should have nothing
    let ents = fooQuery(world)
    strictEqual(ents.length, 0)

    // notFoo query should have eid 0
    ents = notFooQuery(world)
    strictEqual(ents.length, 3)
    strictEqual(ents[0], 0)
    strictEqual(ents[1], 1)
    strictEqual(ents[2], 2)


    /* add components */

    addComponent(world, Foo, eid0)

    addComponent(world, Bar, eid1)

    addComponent(world, Foo, eid2)
    addComponent(world, Bar, eid2)
    
    // now foo query should have eid 0 & 2
    ents = fooQuery(world)
    strictEqual(ents.length, 2)
    strictEqual(ents[0], 0)
    strictEqual(ents[1], 2)

    // fooBar query should only have eid 2
    ents = fooBarQuery(world)
    strictEqual(ents.length, 1)
    strictEqual(ents[0], 2)

    // notFooBar query should have nothing
    ents = notFooBarQuery(world)
    strictEqual(ents.length, 0)
    
    // and notFoo query should have eid 1
    ents = notFooQuery(world)
    strictEqual(ents.length, 1)
    strictEqual(ents[0], 1)


    /* remove components */

    removeComponent(world, Foo, eid0)

    // now foo query should only have eid 2
    ents = fooQuery(world)
    strictEqual(ents.length, 1)
    strictEqual(ents[0], 2)

    // notFoo query should have eid 0 & 1
    ents = notFooQuery(world)
    strictEqual(ents.length, 2)
    strictEqual(ents[0], 1)
    strictEqual(ents[1], 0)

    // fooBar query should still only have eid 2
    ents = fooBarQuery(world)
    console.log(ents)
    strictEqual(ents.length, 1)
    strictEqual(ents[0], 2)

    // notFooBar query should only have eid 0
    ents = notFooBarQuery(world)
    strictEqual(ents.length, 1)
    strictEqual(ents[0], 0)


    /* remove more components */

    removeComponent(world, Foo, eid2)
    removeComponent(world, Bar, eid2)

    // notFooBar query should have eid 0 & 2
    ents = notFooBarQuery(world)
    strictEqual(ents.length, 2)
    strictEqual(ents[0], 0)
    strictEqual(ents[1], 2)
    
    // and notFoo query should have eid 1, 0, & 2
    ents = notFooQuery(world)
    strictEqual(ents.length, 3)
    strictEqual(ents[0], 1)
    strictEqual(ents[1], 0)
    strictEqual(ents[2], 2)
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
  it('should return entities from enter/exitQuery who entered/exited the query', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })
    const query = defineQuery([TestComponent])
    const enteredQuery = enterQuery(query)
    const exitedQuery = exitQuery(query)

    const eid = addEntity(world)
    addComponent(world, TestComponent, eid)
    
    const entered = enteredQuery(world)
    strictEqual(entered.length, 1)
    strictEqual(entered[0], 0)

    let ents = query(world)
    strictEqual(ents.length, 1)
    strictEqual(ents[0], 0)

    removeEntity(world, eid)

    ents = query(world)
    strictEqual(ents.length, 0)
    
    const exited = exitedQuery(world)
    strictEqual(exited.length, 1)
    strictEqual(exited[0], 0)
  })
})