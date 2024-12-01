import { describe, it, expect } from 'vitest'
import { addEntity, createWorld } from "bitecs"
import { createSoADeserializer, createSoASerializer, f32, u8 } from "../../src/serialization"

describe('SoA Serialization and Deserialization', () => {
  it('should correctly serialize and deserialize component data', () => {
    // Define some example components
    const Position = { x: f32([]), y: f32([]) }
    const Velocity = { vx: f32([]), vy: f32([]) }
    const Health = { value: u8([]) }

    const components = [Position, Velocity, Health]

    // Create serializer and deserializer
    const serialize = createSoASerializer(components)
    const deserialize = createSoADeserializer(components)

    // Add some data to the components
    const entityIndices = [0, 1, 2]

    Position.x[0] = 10; Position.y[0] = 20
    Velocity.vx[0] = 1; Velocity.vy[0] = 2
    Health.value[0] = 100

    Position.x[1] = 30; Position.y[1] = 40
    Velocity.vx[1] = 3; Velocity.vy[1] = 4
    Health.value[1] = 80

    Position.x[2] = 50; Position.y[2] = 60
    Velocity.vx[2] = 5; Velocity.vy[2] = 6
    Health.value[2] = 120

    // Serialize the component data
    const serializedData = serialize(entityIndices)

    expect(serializedData.byteLength).toBeGreaterThan(0)

    // Reset component data
    Position.x = f32([])
    Position.y = f32([])
    Velocity.vx = f32([])
    Velocity.vy = f32([])
    Health.value = u8([])

    // Deserialize the data back into the components
    deserialize(serializedData)

    // Verify deserialized data
    expect(Position.x[0]).toBe(10)
    expect(Position.y[0]).toBe(20)
    expect(Velocity.vx[0]).toBe(1)
    expect(Velocity.vy[0]).toBe(2)
    expect(Health.value[0]).toBe(100)

    expect(Position.x[1]).toBe(30)
    expect(Position.y[1]).toBe(40)
    expect(Velocity.vx[1]).toBe(3)
    expect(Velocity.vy[1]).toBe(4)
    expect(Health.value[1]).toBe(80)

    expect(Position.x[2]).toBe(50)
    expect(Position.y[2]).toBe(60)
    expect(Velocity.vx[2]).toBe(5)
    expect(Velocity.vy[2]).toBe(6)
    expect(Health.value[2]).toBe(120)
  })

  it('should correctly serialize and deserialize with ID mapper', () => {
    const world = createWorld()

    // Define components
    const Position = { x: f32([]), y: f32([]) }
    const Velocity = { vx: f32([]), vy: f32([]) }
    const Health = { value: u8([]) }

    const components = [Position, Velocity, Health]

    // Create serializer and deserializer with ID mapper
    const serialize = createSoASerializer(components)

    // Add some data to the components
    const entities = [
      addEntity(world),
      addEntity(world),
      addEntity(world)
    ]

    Position.x[entities[0]] = 10; Position.y[entities[0]] = 20
    Velocity.vx[entities[0]] = 1; Velocity.vy[entities[0]] = 2
    Health.value[entities[0]] = 100

    Position.x[entities[1]] = 30; Position.y[entities[1]] = 40
    Velocity.vx[entities[1]] = 3; Velocity.vy[entities[1]] = 4
    Health.value[entities[1]] = 80

    Position.x[entities[2]] = 50; Position.y[entities[2]] = 60
    Velocity.vx[entities[2]] = 5; Velocity.vy[entities[2]] = 6
    Health.value[entities[2]] = 120

    // Serialize the component data
    const serializedData = serialize(entities)

    expect(serializedData.byteLength).toBeGreaterThan(0)

    // Deserialize the data onto new indices
    const deserialize = createSoADeserializer(components)
    const idMap = new Map(entities.map((id, index) => [id, index+10]))
    deserialize(serializedData, idMap)

    // Verify deserialized data
    const verifyEntity = (originalId: number, newId: number) => {
      expect(Position.x[newId]).toBe(Position.x[originalId])
      expect(Position.y[newId]).toBe(Position.y[originalId])
      expect(Velocity.vx[newId]).toBe(Velocity.vx[originalId])
      expect(Velocity.vy[newId]).toBe(Velocity.vy[originalId])
      expect(Health.value[newId]).toBe(Health.value[originalId])
    }

    idMap.forEach((originalId, newId) => verifyEntity(originalId, newId))
  })
})
