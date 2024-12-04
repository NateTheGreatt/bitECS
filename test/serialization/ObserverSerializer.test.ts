import { describe, it, expect } from 'vitest'
import { addComponent, removeComponent, hasComponent, addEntity, entityExists, removeEntity, createWorld, createRelation, Wildcard, withAutoRemoveSubject, withStore } from 'bitecs'

import { createObserverSerializer, createObserverDeserializer, i32 } from '../../src/serialization'

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

    it('should correctly handle add, remove, add component sequence', () => {
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

    it('should correctly handle add, remove, add entity sequence', () => {
        const world1 = createWorld()
        const world2 = createWorld()
        const networkedTag = {}
        const Position = {}
        const components = [Position]
        const idMap = new Map<number, number>()

        const serialize = createObserverSerializer(world1, networkedTag, components)
        const deserialize = createObserverDeserializer(world2, networkedTag, components)

        // Add entity first time
        const entity = addEntity(world1)
        addComponent(world1, entity, networkedTag)
        addComponent(world1, entity, Position)

        let serializedData = serialize()
        deserialize(serializedData,idMap)

        // Verify first add
        expect(idMap.has(entity)).toBe(true)
        expect(hasComponent(world2, idMap.get(entity)!, Position)).toBe(true)

        // Remove entity
        removeEntity(world1, entity)

        serializedData = serialize()
        deserialize(serializedData, idMap)

        // Verify removal
        expect(entityExists(world2, idMap.get(entity)!)).toBe(false)

        // Add entity second time
        addEntity(world1)
        addComponent(world1, entity, networkedTag)
        addComponent(world1, entity, Position)

        serializedData = serialize()
        deserialize(serializedData, idMap)

        // Verify second add
        expect(idMap.has(entity)).toBe(true)
        expect(hasComponent(world2, idMap.get(entity)!, Position)).toBe(true)
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

    it('should correctly serialize and deserialize relations with data', () => {
        const world1 = createWorld()
        const world2 = createWorld()
        const Networked = {}
        const Contains1 = createRelation(withStore(()=>({ amount: i32() })))
        const Contains2 = createRelation(withStore(()=>({ amount: i32() })))

        const serialize = createObserverSerializer(world1, Networked, [Contains1])
        const deserialize = createObserverDeserializer(world2, Networked, [Contains2])

        // Create container and item entities in world1
        const container = addEntity(world1)
        const item = addEntity(world1)
        addComponent(world1, container, Networked)
        addComponent(world1, item, Networked)
        
        // Add Contains relation with amount data
        const containsRelation = Contains1(item)
        addComponent(world1, container, containsRelation)
        Contains1(item).amount[container] = 5

        // Serialize from world1 and deserialize into world2
        let serializedData = serialize()
        let entityIdMapping = deserialize(serializedData)

        // Get mapped entity IDs in world2
        const mappedContainer = entityIdMapping.get(container)!
        const mappedItem = entityIdMapping.get(item)!

        // Verify relation and data was copied correctly
        expect(hasComponent(world2, mappedContainer, Contains2(mappedItem))).toBe(true)
        expect(Contains2(mappedItem).amount[mappedContainer]).toBe(5)

        // Update relation data in world1
        const containsRelation1 = Contains1(item)
        removeComponent(world1, container, containsRelation1)
        addComponent(world1, container, containsRelation1)
        containsRelation1.amount[container] = 10

        // Serialize and deserialize again
        serializedData = serialize()
        entityIdMapping = deserialize(serializedData)

        // Verify updated data was synced
        expect(Contains2(mappedItem).amount[mappedContainer]).toBe(10)

        // Remove relation in world1
        removeComponent(world1, container, Contains1(item))

        // Serialize and deserialize again
        serializedData = serialize()
        entityIdMapping = deserialize(serializedData)

        // Verify relation was removed in world2
        expect(hasComponent(world2, mappedContainer, Contains2(mappedItem))).toBe(false)
    })
})
