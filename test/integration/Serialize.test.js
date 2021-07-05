import { strictEqual } from 'assert'
import { createWorld } from '../../src/World.js'
import { addComponent, defineComponent } from '../../src/Component.js'
import { addEntity, resetGlobals } from '../../src/Entity.js'
import { defineQuery, defineSerializer, defineDeserializer, Types } from '../../src/index.js'
import { DESERIALIZE_MODE } from '../../src/Serialize.js'

describe('Serialize Integration Tests', () => {
  afterEach(() => {
    resetGlobals()
  })
  it('should serialize/deserialize entire world of entities and all of their components', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })
    const eid = addEntity(world)
    // console.log(TestComponent)
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
    deserialize(world, packet, DESERIALIZE_MODE.APPEND)

    strictEqual(TestComponent.value[eid], 1)
    strictEqual(TestComponent.value[eid+1], 0)
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
    deserialize(world, packet, DESERIALIZE_MODE.MAP)

    strictEqual(TestComponent.value[eid], 1)
    strictEqual(TestComponent.value[eid+1], 0)

    TestComponent.value[eid+1] = 1
    packet = serialize(query(world))
    
    deserialize(world, packet, DESERIALIZE_MODE.MAP)
    strictEqual(TestComponent.value[eid+1], 1)
  })
})
