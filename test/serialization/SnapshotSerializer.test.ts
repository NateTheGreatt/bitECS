import { describe, it, expect } from 'vitest'
import {
    addComponent,
    addEntity,
    createRelation,
    createWorld,
    hasComponent,
    isRelation,
    removeEntity,
    Wildcard,
    withAutoRemoveSubject
} from 'bitecs'
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
        addComponent(world, entity1, Position)
        addComponent(world, entity1, Velocity)
        Position.x[entity1] = 10
        Position.y[entity1] = 20
        Velocity.vx[entity1] = 1
        Velocity.vy[entity1] = 2

        const entity2 = addEntity(world)
        addComponent(world, entity2, Position)
        addComponent(world, entity2, Health)
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

        expect(hasComponent(world, newEntity1, Position)).toBe(true)
        expect(hasComponent(world, newEntity1, Velocity)).toBe(true)
        expect(hasComponent(world, newEntity2, Position)).toBe(true)
        expect(hasComponent(world, newEntity2, Health)).toBe(true)

        expect(Position.x[newEntity1]).toBe(10)
        expect(Position.y[newEntity1]).toBe(20)
        expect(Velocity.vx[newEntity1]).toBe(1)
        expect(Velocity.vy[newEntity1]).toBe(2)
        expect(Position.x[newEntity2]).toBe(30)
        expect(Position.y[newEntity2]).toBe(40)
        expect(Health.value[newEntity2]).toBe(100)
    })

    it('should correctly serialize and deserialize relations', () => {
        const world = createWorld()
        const ChildOf = createRelation(withAutoRemoveSubject)
        const components = [ChildOf]

        const serialize = createSnapshotSerializer(world, components)
        const deserialize = createSnapshotDeserializer(world, components)

        // Create parent and child entities
        const parent = addEntity(world)
        const child = addEntity(world)
        addComponent(world, child, ChildOf(parent))

        // Serialize world state
        const serializedData = serialize()

        // Remove entities and relations
        removeEntity(world, parent)
        removeEntity(world, child)

        // Deserialize into world
        const entityIdMapping = deserialize(serializedData)

        // Get mapped entity IDs
        const mappedParent = entityIdMapping.get(parent)!
        const mappedChild = entityIdMapping.get(child)!

        // Verify relation was restored correctly
        expect(hasComponent(world, mappedChild, ChildOf(mappedParent))).toBe(true)

        // Verify implicit relation components
        expect(hasComponent(world, mappedParent, Wildcard(ChildOf))).toBe(true)
        expect(hasComponent(world, mappedChild, ChildOf(Wildcard))).toBe(true)
    })
});