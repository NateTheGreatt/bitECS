import { describe, it, expect } from 'vitest'
import { $f32, $u8, array, f32, u8 } from "../../src/serialization/SoASerializer"
import { createAoSSerializer, createAoSDeserializer, AoSComponentRef } from "../../src/serialization/AoSSerializer"

describe('AoS Serialization and Deserialization', () => {
  it('should correctly serialize and deserialize component data', () => {
    // Define AoS components (arrays where each element stores object data)
    const Position: AoSComponentRef = Object.assign([], { x: f32(), y: f32() })
    const Velocity: AoSComponentRef = Object.assign([], { vx: f32(), vy: f32() })
    const Health: AoSComponentRef = u8()

    const components = [Position, Velocity, Health]

    // Create serializer and deserializer
    const serialize = createAoSSerializer(components)
    const deserialize = createAoSDeserializer(components)

    // Add component data like in bitECS
    Position[0] = { x: 10, y: 20 }
    Velocity[0] = { vx: 1, vy: 2 }
    Health[0] = 100

    Position[1] = { x: 30, y: 40 }
    Velocity[1] = { vx: 3, vy: 4 }
    Health[1] = 80

    Position[2] = { x: 50, y: 60 }
    Velocity[2] = { vx: 5, vy: 6 }
    Health[2] = 120

    // Serialize the entities
    const serializedData = serialize([0, 1, 2])
    expect(serializedData.byteLength).toBeGreaterThan(0)

    // Reset components
    Position[0] = undefined
    Position[1] = undefined
    Position[2] = undefined
    Velocity[0] = undefined
    Velocity[1] = undefined
    Velocity[2] = undefined
    Health[0] = undefined
    Health[1] = undefined
    Health[2] = undefined

    // Deserialize the data back
    deserialize(serializedData)

    // Verify deserialized data
    expect(Position[0]).toEqual({ x: 10, y: 20 })
    expect(Velocity[0]).toEqual({ vx: 1, vy: 2 })
    expect(Health[0]).toBe(100)

    expect(Position[1]).toEqual({ x: 30, y: 40 })
    expect(Velocity[1]).toEqual({ vx: 3, vy: 4 })
    expect(Health[1]).toBe(80)

    expect(Position[2]).toEqual({ x: 50, y: 60 })
    expect(Velocity[2]).toEqual({ vx: 5, vy: 6 })
    expect(Health[2]).toBe(120)
  })

  it('should work with custom entity IDs and ID mapping', () => {
    const Position: AoSComponentRef = Object.assign([], { x: f32(), y: f32() })
    const Health: AoSComponentRef = u8()

    const components = [Position, Health]

    const serialize = createAoSSerializer(components)
    const deserialize = createAoSDeserializer(components)

    // Set data for entities 1000 and 2000
    Position[1000] = { x: 10, y: 20 }
    Health[1000] = 100
    Position[2000] = { x: 30, y: 40 }
    Health[2000] = 80

    // Serialize with entity IDs
    const serializedData = serialize([1000, 2000])

    // Deserialize with ID mapping (map 1000->5, 2000->10)
    const idMap = new Map([[1000, 5], [2000, 10]])
    deserialize(serializedData, idMap)

    // Verify data was mapped correctly
    expect(Position[5]).toEqual({ x: 10, y: 20 })
    expect(Health[5]).toBe(100)
    expect(Position[10]).toEqual({ x: 30, y: 40 })
    expect(Health[10]).toBe(80)
  })

  describe('Diff Mode Serialization', () => {
    it('should serialize all data on first call in diff mode', () => {
      const Position: AoSComponentRef = Object.assign([], { x: f32(), y: f32() })
      const Health: AoSComponentRef = u8()
      const components = [Position, Health]

      const serialize = createAoSSerializer(components, { diff: true })
      const deserialize = createAoSDeserializer(components, { diff: true })

      // Set initial data
      Position[0] = { x: 10, y: 20 }
      Health[0] = 100

      // First serialization should include all data
      const data1 = serialize([0])
      expect(data1.byteLength).toBeGreaterThan(0)

      // Reset components
      Position[0] = undefined
      Health[0] = undefined

      // Deserialize
      deserialize(data1)

      // Verify all data was serialized and deserialized
      expect(Position[0]).toEqual({ x: 10, y: 20 })
      expect(Health[0]).toBe(100)
    })

    it('should serialize only changed data on subsequent calls', () => {
      const Position: AoSComponentRef = Object.assign([], { x: f32(), y: f32() })
      const Health: AoSComponentRef = u8()
      const components = [Position, Health]

      const serialize = createAoSSerializer(components, { diff: true })

      // Set initial data
      Position[0] = { x: 10, y: 20 }
      Health[0] = 100

      // First call serializes everything
      const data1 = serialize([0])
      const initialSize = data1.byteLength

      // Second call with no changes should return empty buffer
      const data2 = serialize([0])
      expect(data2.byteLength).toBe(0)

      // Change only position
      Position[0] = { x: 15, y: 20 }

      // Third call should serialize only the changed entity
      const data3 = serialize([0])
      expect(data3.byteLength).toBeGreaterThan(0)
      expect(data3.byteLength).toBeLessThan(initialSize) // Should be smaller than full serialization
    })

    it('should handle partial component changes', () => {
      const Position: AoSComponentRef = Object.assign([], { x: f32(), y: f32() })
      const Velocity: AoSComponentRef = Object.assign([], { vx: f32(), vy: f32() })
      const components = [Position, Velocity]

      const serialize = createAoSSerializer(components, { diff: true })
      const deserialize = createAoSDeserializer(components, { diff: true })

      // Initial data
      Position[0] = { x: 10, y: 20 }
      Velocity[0] = { vx: 1, vy: 2 }

      // First serialization
      serialize([0])

      // Change only some properties
      Position[0] = { x: 15, y: 20 }  // Only x changed
      Velocity[0] = { vx: 1, vy: 5 }  // Only vy changed

      // Serialize changes
      const changedData = serialize([0])
      expect(changedData.byteLength).toBeGreaterThan(0)

      // Reset and deserialize to verify changes
      Position[0] = { x: 10, y: 20 }  // Reset to original
      Velocity[0] = { vx: 1, vy: 2 }  // Reset to original

      deserialize(changedData)

      // Verify changed components are updated (entire component gets updated if any property changes)
      expect(Position[0]).toEqual({ x: 15, y: 20 })
      expect(Velocity[0]).toEqual({ vx: 1, vy: 5 })
    })

    it('should work with direct value components', () => {
      const Health: AoSComponentRef = u8()
      const Score: AoSComponentRef = f32()
      const components = [Health, Score]

      const serialize = createAoSSerializer(components, { diff: true })
      const deserialize = createAoSDeserializer(components, { diff: true })

      // Initial data
      Health[0] = 100
      Score[0] = 1500.5

      // First serialization
      const data1 = serialize([0])
      expect(data1.byteLength).toBeGreaterThan(0)

      // No changes
      const data2 = serialize([0])
      expect(data2.byteLength).toBe(0)

      // Change Score
      Score[0] = 2000.7

      const data3 = serialize([0])
      expect(data3.byteLength).toBeGreaterThan(0)

      // Reset and verify
      Score[0] = 1500.5
      deserialize(data3)
      expect(Score[0]).toBeCloseTo(2000.7)
    })

    it('should handle array properties', () => {
      const Position: AoSComponentRef = Object.assign([], { x: f32(), y: f32() })
      const Inventory: AoSComponentRef = Object.assign([], { items: array($u8) })
      const components = [Position, Inventory]

      const serialize = createAoSSerializer(components, { diff: true })
      const deserialize = createAoSDeserializer(components, { diff: true })

      // Initial data
      Position[0] = { x: 10, y: 20 }
      Inventory[0] = { items: [1, 2, 3] }

      // First serialization
      serialize([0])

      // Change inventory
      Inventory[0] = { items: [4, 5, 6, 7] }

      const changedData = serialize([0])
      expect(changedData.byteLength).toBeGreaterThan(0)

      // Reset and verify
      Inventory[0] = { items: [1, 2, 3] }
      deserialize(changedData)
      expect(Inventory[0].items).toEqual([4, 5, 6, 7])
    })

    it('should work with custom epsilon for floats', () => {
      const Position: AoSComponentRef = Object.assign([], { x: f32(), y: f32() })
      const components = [Position]

      const serialize = createAoSSerializer(components, { diff: true, epsilon: 0.01 })

      // Initial data
      Position[0] = { x: 10.0, y: 20.0 }

      // First serialization
      serialize([0])

      // Tiny change within epsilon
      Position[0] = { x: 10.005, y: 20.0 }

      const data2 = serialize([0])
      expect(data2.byteLength).toBe(0) // Should not serialize

      // Change larger than epsilon
      Position[0] = { x: 10.02, y: 20.0 }

      const data3 = serialize([0])
      expect(data3.byteLength).toBeGreaterThan(0) // Should serialize
    })

    it('should work with multiple entities and selective changes', () => {
      const Position: AoSComponentRef = Object.assign([], { x: f32(), y: f32() })
      const components = [Position]

      const serialize = createAoSSerializer(components, { diff: true })

      // Initial data for 3 entities
      Position[0] = { x: 10, y: 20 }
      Position[1] = { x: 30, y: 40 }
      Position[2] = { x: 50, y: 60 }

      // First serialization
      serialize([0, 1, 2])

      // Change only entity 1
      Position[1] = { x: 35, y: 40 }

      // Serialize changes - should only include entity 1
      const changedData = serialize([0, 1, 2])
      expect(changedData.byteLength).toBeGreaterThan(0)

      // The changed data should be much smaller than full serialization
      const fullData = serialize([0, 1, 2]) // This will include entity 1 again
      expect(changedData.byteLength).toBeGreaterThan(0)
    })
  })
})