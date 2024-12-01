import { describe, it, expect } from 'vitest'
import { addComponent, removeComponent, hasComponent, addEntity, entityExists, removeEntity, createWorld, createRelation, Wildcard, withAutoRemoveSubject } from 'bitecs'

import { createObserverSerializer, createObserverDeserializer } from '../../src/serialization'

describe('ObserverSerializer and ObserverDeserializer', () => {
    it('should correctly serialize and deserialize component additions', () => {
        const world = createWorld()
        const networkedTag = {}
        const Position = {}
        const Velocity = {}
        const components = [Position, Velocity]

        const serialize = createObserverSerializer(world, networkedTag, components)
        const deserialize = createObserverDeserializer(world, networkedTag, components)

        const entity1 = addEntity(world)
        addComponent(world, entity1, Position)
        addComponent(world, entity1, networkedTag)

        const entity2 = addEntity(world)
        addComponent(world, entity2, Velocity)
        addComponent(world, entity2, networkedTag)

        const serializedData = serialize()

        removeComponent(world, entity1, Position)
        removeComponent(world, entity1, networkedTag)
        removeComponent(world, entity2, Velocity)
        removeComponent(world, entity2, networkedTag)

        const entityIdMapping = deserialize(serializedData)

        expect(hasComponent(world, entityIdMapping.get(entity1)!, Position)).toBe(true)
        expect(hasComponent(world, entityIdMapping.get(entity1)!, networkedTag)).toBe(true)
        expect(hasComponent(world, entityIdMapping.get(entity2)!, Velocity)).toBe(true)
        expect(hasComponent(world, entityIdMapping.get(entity2)!, networkedTag)).toBe(true)

        expect(entityIdMapping.size).toBe(2)
        expect(entityIdMapping.has(entity1)).toBe(true)
        expect(entityIdMapping.has(entity2)).toBe(true)
        expect(entityIdMapping.get(entity1)).not.toBe(entity1)
        expect(entityIdMapping.get(entity2)).not.toBe(entity2)
    })

    it('should correctly serialize and deserialize component removals', () => {
        const world = createWorld()
        const networkedTag = {}
        const Position = {}
        const Velocity = {}
        const components = [Position, Velocity]

        const serialize = createObserverSerializer(world, networkedTag, components)
        const deserialize = createObserverDeserializer(world, networkedTag, components)

        const entity1 = addEntity(world)
        addComponent(world, entity1, Position)
        addComponent(world, entity1, networkedTag)

        const entity2 = addEntity(world)
        addComponent(world, entity2, Velocity)
        addComponent(world, entity2, networkedTag)

        removeComponent(world, entity1, Position)
        removeComponent(world, entity2, Velocity)

        const serializedData = serialize()

        addComponent(world, entity1, Position)
        addComponent(world, entity2, Velocity)

        const entityIdMapping = deserialize(serializedData)

        expect(hasComponent(world, entityIdMapping.get(entity1)!, Position)).toBe(false)
        expect(hasComponent(world, entityIdMapping.get(entity2)!, Velocity)).toBe(false)
    })

    it('should correctly handle add, remove, add sequence', () => {
        const world = createWorld()
        const networkedTag = {}
        const Position = {}
        const Velocity = {}
        const components = [Position, Velocity]

        const serialize = createObserverSerializer(world, networkedTag, components)
        const deserialize = createObserverDeserializer(world, networkedTag, components)

        const entity = addEntity(world)
        addComponent(world, entity, Position)
        addComponent(world, entity, networkedTag)

        let serializedData = serialize()
        let entityIdMapping = deserialize(serializedData)

        expect(hasComponent(world, entityIdMapping.get(entity)!, Position)).toBe(true)

        removeComponent(world, entity, Position)

        serializedData = serialize()
        entityIdMapping = deserialize(serializedData)

        expect(hasComponent(world, entityIdMapping.get(entity)!, Position)).toBe(false)

        addComponent(world, entity, Position)

        serializedData = serialize()
        entityIdMapping = deserialize(serializedData)

        expect(hasComponent(world, entityIdMapping.get(entity)!, Position)).toBe(true)
    })

    it('should correctly handle add and remove entity sequence', () => {
        const world1 = createWorld()
        const world2 = createWorld()
        const networkedTag = {}
        const Position = {}
        const Velocity = {}
        const components = [Position, Velocity]

        const serialize = createObserverSerializer(world1, networkedTag, components)
        const deserialize = createObserverDeserializer(world2, networkedTag, components)

        // Add entity and components in world1
        const entity = addEntity(world1)
        addComponent(world1, entity, Position)
        addComponent(world1, entity, networkedTag)

        // Serialize from world1 and deserialize into world2
        let serializedData = serialize()
        let entityIdMapping = deserialize(serializedData)

        // Check if entity and components are added in world2
        expect(entityIdMapping.has(entity)).toBe(true)
        expect(hasComponent(world2, entityIdMapping.get(entity)!, Position)).toBe(true)

        // Remove entity in world1
        removeEntity(world1, entity)

        // Serialize from world1 and deserialize into world2
        serializedData = serialize()
        entityIdMapping = deserialize(serializedData)

        // Check if entity is removed in world2
        expect(entityExists(world2, entityIdMapping.get(entity)!)).toBe(false)
    })

    it('should correctly handle add and remove entity sequence with no components', () => {
        const world1 = createWorld()
        const world2 = createWorld()
        const networkedTag = {}
        const components: any[] = []

        const serialize = createObserverSerializer(world1, networkedTag, components)
        const deserialize = createObserverDeserializer(world2, networkedTag, components)

        // Add entity in world1
        const entity = addEntity(world1)
        addComponent(world1, entity, networkedTag)

        // Serialize from world1 and deserialize into world2
        let serializedData = serialize()
        let entityIdMapping = deserialize(serializedData)

        // Check if entity is added in world2
        expect(entityIdMapping.has(entity)).toBe(true)
        expect(entityExists(world2, entityIdMapping.get(entity)!)).toBe(true)

        // Remove entity in world1
        removeEntity(world1, entity)

        // Serialize from world1 and deserialize into world2
        serializedData = serialize()
        entityIdMapping = deserialize(serializedData)

        // Check if entity is removed in world2
        expect(entityExists(world2, entityIdMapping.get(entity)!)).toBe(false)
    })

    it('should correctly serialize and deserialize relations', () => {
        const world1 = createWorld()
        const world2 = createWorld()
        const Networked = {}
        const ChildOf = createRelation(withAutoRemoveSubject)
        const components = [ChildOf]

        const serialize = createObserverSerializer(world1, Networked, components)
        const deserialize = createObserverDeserializer(world2, Networked, components)

        // Create parent and child entities in world1
        const parent = addEntity(world1)
        const child = addEntity(world1)
        addComponent(world1, parent, Networked)
        addComponent(world1, child, Networked)
        addComponent(world1, child, ChildOf(parent))

        // Serialize from world1 and deserialize into world2
        let serializedData = serialize()
        let entityIdMapping = deserialize(serializedData)

        // Get EIDs of the newly created and copied entities in world 2 
        const mappedParent = entityIdMapping.get(parent)!
        const mappedChild = entityIdMapping.get(child)!

        // ChildOf(parent) needs to be explicitly synced by the serializer
        expect(hasComponent(world1, child, ChildOf(parent))).toBe(true)
        expect(hasComponent(world2, mappedChild, ChildOf(mappedParent))).toBe(true)

        // the rest will be implicitly added
        expect(hasComponent(world1, parent, Wildcard(ChildOf))).toBe(true)
        expect(hasComponent(world2, mappedParent, Wildcard(ChildOf))).toBe(true)

        expect(hasComponent(world1, child, ChildOf(Wildcard))).toBe(true)
        expect(hasComponent(world2, mappedChild, ChildOf(Wildcard))).toBe(true)

        // Remove relation in world1
        removeComponent(world1, child, ChildOf(parent))

        // Serialize from world1 and deserialize into world2
        serializedData = serialize()
        entityIdMapping = deserialize(serializedData)

        // Check if relation is removed in world2
        expect(hasComponent(world2, mappedChild, ChildOf(mappedParent))).toBe(false)
    })
})
