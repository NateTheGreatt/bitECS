import assert, { strictEqual } from 'assert'
import { createWorld } from '../../src/World.js'
import { addComponent, defineComponent } from '../../src/Component.js'
import { addEntity, resetGlobals } from '../../src/Entity.js'
// import { defineQuery, defineSerializer, defineDeserializer, Types } from '../../src/index.js'
import { defineDeserializer, defineSerializer, DESERIALIZE_MODE } from '../../src/Serialize.js'
import { Changed, defineQuery } from '../../src/Query.js'
import { TYPES_ENUM } from '../../src/Constants.js'
import { pipe } from '../../src/index.js'

const Types = TYPES_ENUM

const arraysEqual = (a,b) => !!a && !!b && !(a<b || b<a)

describe('Serialize Integration Tests', () => {
  afterEach(() => {
    resetGlobals()
  })
  it('should serialize/deserialize entire world of entities and all of their components', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })
    const eid = addEntity(world)

    addComponent(world, TestComponent, eid)
    const serialize = defineSerializer(world)
    const deserialize = defineDeserializer(world)

    const packet = serialize(world)

    strictEqual(packet.byteLength, 13)
    
    strictEqual(TestComponent.value[eid], 0)
    
    TestComponent.value[eid]++
    deserialize(world, packet)

    strictEqual(TestComponent.value[eid], 0)
  })
  it('should serialize/deserialize entire world of specific components', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })
    const eid = addEntity(world)
    addComponent(world, TestComponent, eid)

    const serialize = defineSerializer([TestComponent])
    const deserialize = defineDeserializer(world)

    const packet = serialize(world)

    strictEqual(packet.byteLength, 13)
    
    strictEqual(TestComponent.value[eid], 0)
    
    TestComponent.value[eid]++
    deserialize(world, packet)

    strictEqual(TestComponent.value[eid], 0)
  })
  it('should serialize/deserialize specific components of a queried set of entities', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })
    const query = defineQuery([TestComponent])
    const eid = addEntity(world)
    addComponent(world, TestComponent, eid)

    const serialize = defineSerializer([TestComponent])
    const deserialize = defineDeserializer(world)

    const packet = serialize(query(world))

    strictEqual(packet.byteLength, 13)
    
    strictEqual(TestComponent.value[eid], 0)
    
    TestComponent.value[eid]++
    deserialize(world, packet)

    strictEqual(TestComponent.value[eid], 0)
  })
  it('should serialize/deserialize array types on components', () => {
    const world1 = createWorld()
    const world2 = createWorld()

    const ArrayComponent = defineComponent({ array: [Types.f32, 4] })
    const TestComponent = defineComponent({ value: Types.f32 })
    const query = defineQuery([ArrayComponent, TestComponent])

    const serialize = defineSerializer([ArrayComponent, TestComponent])
    const deserialize = defineDeserializer([ArrayComponent, TestComponent])

    const eid = addEntity(world1)
    addComponent(world1, TestComponent, eid)
    addComponent(world1, ArrayComponent, eid)

    TestComponent.value[eid] = 1
    ArrayComponent.array[eid].set([1,2,3,4])
    
    strictEqual(TestComponent.value[eid], 1)
    assert(arraysEqual(Array.from(ArrayComponent.array[eid]), [1,2,3,4]))

    const packet = serialize(query(world1))
    strictEqual(packet.byteLength, 43)

    TestComponent.value[eid] = 0
    ArrayComponent.array[eid].set([0,0,0,0])
    
    deserialize(world1, packet)
    
    strictEqual(TestComponent.value[eid], 1)
    assert(arraysEqual(Array.from(ArrayComponent.array[eid]), [1,2,3,4]))

  })
  it('should deserialize properly with APPEND behavior', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })
    const query = defineQuery([TestComponent])
    const eid = addEntity(world)
    addComponent(world, TestComponent, eid)

    const serialize = defineSerializer([TestComponent])
    const deserialize = defineDeserializer(world)

    const packet = serialize(query(world))

    strictEqual(packet.byteLength, 13)
    
    strictEqual(TestComponent.value[eid], 0)
    
    TestComponent.value[eid]++
    let ents = deserialize(world, packet, DESERIALIZE_MODE.APPEND)
    const appendedEid = eid + 1

    strictEqual(TestComponent.value[eid], 1)
    strictEqual(TestComponent.value[appendedEid], 0)
    strictEqual(ents[0], appendedEid)
  })
  it('should deserialize properly with MAP behavior', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })
    const query = defineQuery([TestComponent])
    const eid = addEntity(world)
    addComponent(world, TestComponent, eid)

    const serialize = defineSerializer([TestComponent])
    const deserialize = defineDeserializer(world)

    let packet = serialize(query(world))

    strictEqual(packet.byteLength, 13)
    
    strictEqual(TestComponent.value[eid], 0)
    
    TestComponent.value[eid]++
    let ents = deserialize(world, packet, DESERIALIZE_MODE.MAP)
    const mappedEid = eid + 1

    strictEqual(TestComponent.value[eid], 1)
    strictEqual(TestComponent.value[mappedEid], 0)

    TestComponent.value[mappedEid] = 1
    packet = serialize(query(world))
    
    ents = deserialize(world, packet, DESERIALIZE_MODE.MAP)
    strictEqual(TestComponent.value[mappedEid], 1)
    strictEqual(ents[0], mappedEid)
  })
  // todo
  // it('should maintain references when deserializing', () => {
    
  // })
  it('should only serialize changes for Changed components and component properties', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })
    const ArrayComponent = defineComponent({ values: [Types.f32, 3] })

    const eid = addEntity(world)
    addComponent(world, TestComponent, eid)
    addComponent(world, ArrayComponent, eid)
    
    const serialize = defineSerializer([Changed(TestComponent.value), ArrayComponent])
    const deserialize = defineDeserializer([TestComponent.value, ArrayComponent])

    let packet = serialize([eid])

    strictEqual(TestComponent.value[eid], 0)

    // ArrayComponent should be serialized
    strictEqual(packet.byteLength, 25)

    packet = serialize([eid])
    
    deserialize(world, packet)
    
    strictEqual(TestComponent.value[eid], 0)

    TestComponent.value[eid]++
    
    strictEqual(TestComponent.value[eid], 1)
    
    packet = serialize([eid])
    
    deserialize(world, packet)
    
    strictEqual(TestComponent.value[eid], 1)
    
  })
  it('should only serialize changes for Changed array properties', () => {
    const world = createWorld()
    const ArrayComponent = defineComponent({ values: [Types.f32, 3] })

    const eid = addEntity(world)
    addComponent(world, ArrayComponent, eid)
    
    const serialize = defineSerializer([Changed(ArrayComponent.values)])
    const deserialize = defineDeserializer([ArrayComponent.values])
    
    ArrayComponent.values[eid][0]++

    let packet = serialize([eid])

    // strictEqual(ArrayComponent.values[eid][0], 0)

    // ArrayComponent should not be serialized yet
    // strictEqual(packet.byteLength, 0)
    assert(packet.byteLength > 0)

    packet = serialize([eid])
    
    deserialize(world, packet)
    
    // strictEqual(ArrayComponent.values[eid][0], 0)

    // ArrayComponent.values[eid][0]++
    
    strictEqual(ArrayComponent.values[eid][0], 1)
    
    packet = serialize([eid])
    
    deserialize(world, packet)
    
    strictEqual(ArrayComponent.values[eid][0], 1)
    
  })
  it('shouldn\'t serialize anything using Changed on a component with no changes', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })
    const eid = addEntity(world)

    addComponent(world, TestComponent, eid)
    TestComponent.value[eid] = 1

    const serialize = defineSerializer([Changed(TestComponent)])

    serialize([eid]) // run once to pick up current state
    const packet = serialize([eid])

    strictEqual(packet.byteLength, 0)
  })
  it('shouldn\'t serialize anything using Changed on an array component with no changes', () => {
    const world = createWorld()
    const ArrayComponent = defineComponent({ value: [Types.f32, 3] })
    const eid = addEntity(world)

    addComponent(world, ArrayComponent, eid)
    ArrayComponent.value[eid][1] = 1

    const serialize = defineSerializer([Changed(ArrayComponent)])

    serialize([eid]) // run once to pick up current state
    const packet = serialize([eid])

    strictEqual(packet.byteLength, 0)
  })
  it('should serialize and deserialize entities with a mix of single value, array value and tag components', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })
    const ArrayComponent = defineComponent({ value: [Types.f32, 3] })
    const TagComponent = defineComponent()

    const serialize = defineSerializer([TestComponent, ArrayComponent, TagComponent])
    const deserialize = defineDeserializer([TestComponent, ArrayComponent, TagComponent])

    const eid = addEntity(world)
    addComponent(world, TestComponent, eid)
    addComponent(world, ArrayComponent, eid)
    addComponent(world, TagComponent, eid)

    let packet = serialize([eid])
    assert(packet.byteLength > 0)
    // if this errors we know something is wrong with the packet
    deserialize(world, packet)

    const eids = [eid]

    const eid2 = addEntity(world)
    addComponent(world, TestComponent, eid2)
    TestComponent.value[eid2] = 8
    eids.push(eid2)

    const eid3 = addEntity(world)
    addComponent(world, TagComponent, eid3)
    eids.push(eid3)

    const eid4 = addEntity(world)
    addComponent(world, ArrayComponent, eid4)
    ArrayComponent.value[eid4][1] = 5
    eids.push(eid4)

    const eid5 = addEntity(world)
    addComponent(world, TagComponent, eid5)
    addComponent(world, ArrayComponent, eid5)
    ArrayComponent.value[eid5][0] = 3
    eids.push(eid5)

    const eid6 = addEntity(world)
    addComponent(world, TagComponent, eid6)
    addComponent(world, TestComponent, eid6)
    TestComponent.value[eid6] = 3
    eids.push(eid6)

    packet = serialize(eids)
    assert(packet.byteLength > 0)
    // if this errors we know something is wrong with the packet
    deserialize(world, packet)

    // run a couple more times for good measure
    serialize(eids)
    packet = serialize(eids)
    assert(packet.byteLength > 0)
    // if this errors we know something is wrong with the packet
    deserialize(world, packet)

    // verify some values
    strictEqual(TestComponent.value[eid2], 8)
    strictEqual(ArrayComponent.value[eid4][1], 5)
    strictEqual(ArrayComponent.value[eid5][0], 3)
    strictEqual(TestComponent.value[eid6], 3)
  })
  it('should serialize from a query using pipe', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })
    const eid = addEntity(world)
    addComponent(world, TestComponent, eid)

    const query = defineQuery([TestComponent])
    const serialize = defineSerializer([TestComponent])
    const serializeQuery = pipe(query, serialize)
    const deserialize = defineDeserializer([TestComponent])

    const packet = serializeQuery(world)
    assert(packet.byteLength > 0)
    deserialize(world, packet)
    strictEqual(query(world).length, 1)
  })
  it('should only register changes on the first serializer run', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })
    const eid = addEntity(world)
    addComponent(world, TestComponent, eid)

    const serialize = defineSerializer([Changed(TestComponent)])

    serialize([eid])
    TestComponent.value[eid] = 2
    let packet = serialize([eid])
    assert(packet.byteLength > 0)
    packet = serialize([eid])
    strictEqual(packet.byteLength, 0)
    
  })
})
