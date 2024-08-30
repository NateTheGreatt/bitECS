import { describe, it, expect } from 'vitest'
import {
    addComponent,
    addEntity,
    createWorld,
    hasComponent,
    removeEntity
} from '../../src/core'
import { createSnapshotDeserializer, createSnapshotSerializer, f32, u8 } from '../../src/serialization'

describe('Snapshot Serialization and Deserialization', () => {
    it('should correctly serialize and deserialize world state', () => {
        const world = createWorld()
        const Position = { x: f32([]), y: f32([]) }
        const Velocity = { vx: f32([]), vy: f32([]) }
        const Health = { value: u8([]) }
        const components = [Position, Velocity, Health]

        const serialize = createSnapshotSerializer(world, components)
        const deserialize = createSnapshotDeserializer(world, components)

        const entity1 = addEntity(world)
        addComponent(world, Position, entity1)
        addComponent(world, Velocity, entity1)
        Position.x[entity1] = 10
        Position.y[entity1] = 20
        Velocity.vx[entity1] = 1
        Velocity.vy[entity1] = 2

        const entity2 = addEntity(world)
        addComponent(world, Position, entity2)
        addComponent(world, Health, entity2)
        Position.x[entity2] = 30
        Position.y[entity2] = 40
        Health.value[entity2] = 100

        const serializedData = serialize()

        removeEntity(world, entity1)
        removeEntity(world, entity2)
        Position.x[entity1] = 0
        Position.y[entity1] = 0
        Position.x[entity2] = 0
        Position.y[entity2] = 0
        Velocity.vx[entity1] = 0
        Velocity.vy[entity1] = 0
        Health.value[entity2] = 0

        const deserializedEntities = deserialize(serializedData)

        const entityMap = new Map(deserializedEntities)
        const newEntity1 = entityMap.get(entity1)!
        const newEntity2 = entityMap.get(entity2)!

        expect(hasComponent(world, Position, newEntity1)).toBe(true)
        expect(hasComponent(world, Velocity, newEntity1)).toBe(true)
        expect(hasComponent(world, Position, newEntity2)).toBe(true)
        expect(hasComponent(world, Health, newEntity2)).toBe(true)

        expect(Position.x[newEntity1]).toBe(10)
        expect(Position.y[newEntity1]).toBe(20)
        expect(Velocity.vx[newEntity1]).toBe(1)
        expect(Velocity.vy[newEntity1]).toBe(2)
        expect(Position.x[newEntity2]).toBe(30)
        expect(Position.y[newEntity2]).toBe(40)
        expect(Health.value[newEntity2]).toBe(100)
    })
});