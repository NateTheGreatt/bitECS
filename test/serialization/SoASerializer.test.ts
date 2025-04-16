import { describe, it, expect } from 'vitest'
import { addEntity, createWorld } from "bitecs"
import {$f32, $f64, $u8, array, createSoADeserializer, createSoASerializer, f32, u8} from "../../src/serialization"

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

  it('should correctly serialize and deserialize array of arrays as component properties', () => {
    const Character = {
      position: array<[number, number]>($f64),
      inventory: array<number[]>($u8),
      skills: array(array($f64))
    }

    const components = [Character]

    const serialize = createSoASerializer(components)
    const deserialize = createSoADeserializer(components)

    const eid = 1

    // Set regular component data
    Character.position[eid] = [10.5, 20.4]

    // Set array component data
    Character.inventory[eid] = [1, 5, 10, 15]

    // Set nested array component data
    Character.skills[eid] = [
      [1, 5.0, 100.5],  // Skill 1: level 5, 100.5 exp
      [2, 3.0, 50.2],   // Skill 2: level 3, 50.2 exp
      [3, 7.0, 200.8]   // Skill 3: level 7, 200.8 exp
    ]

    // Serialize component data for entity
    const buffer = serialize([eid])

    // Zero out components to prepare for deserialization
    Character.position[eid] = null
    Character.inventory[eid] = []
    Character.skills[eid] = []

    // Deserialize back into components
    deserialize(buffer)

    // Assert all component data was deserialized correctly
    expect(Character.position[eid]).toEqual([10.5, 20.4])
    expect(Character.inventory[eid]).toEqual([1, 5, 10, 15])
    expect(Character.skills[eid]).toEqual([
      [1, 5.0, 100.5],
      [2, 3.0, 50.2],
      [3, 7.0, 200.8]
    ])
  })

  it('should serialize and deserialize basic array', () => {
    // Define a component with a nested array property
    const Waypoints = {
      // Array of coordinate pairs stored as f32 values
      points: array($f64)
    }

    const components = [Waypoints]

    const serialize = createSoASerializer(components)
    const deserialize = createSoADeserializer(components)

    const eid = 1

    // Add array data to component
    Waypoints.points[eid] = [10.5, 20.2]

    // Serialize component data
    const buffer = serialize([eid])

    // Zero out component to prepare for deserialization
    Waypoints.points[eid] = null

    // Deserialize back into component
    deserialize(buffer)

    // Assert array data was deserialized correctly
    expect(Waypoints.points[eid]).toEqual([10.5, 20.2])
  });

  it('should serialize and deserialize nested array of arrays', () => {
    // Define a component with a nested array structure
    const Inventory = {
      // Array of inventory pages, each containing arrays of item IDs
      pages: array(array($u8))
    }

    const components = [Inventory]

    const serialize = createSoASerializer(components)
    const deserialize = createSoADeserializer(components)

    const eid = 1

    // Define a complex nested structure
    const inventoryData = [
        [1, 2, 3],       // Page 1: items 1, 2, 3
        [10, 20],        // Page 2: items 10, 20
        [100, 101, 102]  // Page 3: items 100, 101, 102
    ]

    // Add the nested array data to component
    Inventory.pages[eid] = inventoryData

    // Serialize component data for entity
    const buffer = serialize([eid])

    // Zero out component to prepare for deserialization
    Inventory.pages[eid] = []

    // Deserialize back into component
    deserialize(buffer)

    // Assert nested array data was deserialized correctly
    expect(Inventory.pages[eid]).toEqual(inventoryData)
  });
})
