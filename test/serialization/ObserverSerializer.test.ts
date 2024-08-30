import { describe, it, expect } from 'vitest'
import {
    addComponent,
    removeComponent,
    addEntity,
    createWorld,
    hasComponent
} from '../../src/core'

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
        addComponent(world, Position, entity1)
        addComponent(world, networkedTag, entity1)

        const entity2 = addEntity(world)
        addComponent(world, Velocity, entity2)
        addComponent(world, networkedTag, entity2)

        const serializedData = serialize()
        
        removeComponent(world, Position, entity1)
        removeComponent(world, networkedTag, entity1)
        removeComponent(world, Velocity, entity2)
        removeComponent(world, networkedTag, entity2)

        const entityIdMapping = deserialize(serializedData)

        expect(hasComponent(world, Position, entityIdMapping.get(entity1)!)).toBe(true)
        expect(hasComponent(world, networkedTag, entityIdMapping.get(entity1)!)).toBe(true)
        expect(hasComponent(world, Velocity, entityIdMapping.get(entity2)!)).toBe(true)
        expect(hasComponent(world, networkedTag, entityIdMapping.get(entity2)!)).toBe(true)

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
        addComponent(world, Position, entity1)
        addComponent(world, networkedTag, entity1)

        const entity2 = addEntity(world)
        addComponent(world, Velocity, entity2)
        addComponent(world, networkedTag, entity2)

        removeComponent(world, Position, entity1)
        removeComponent(world, Velocity, entity2)

        const serializedData = serialize()

        addComponent(world, Position, entity1)
        addComponent(world, Velocity, entity2)

        const entityIdMapping = deserialize(serializedData)

        expect(hasComponent(world, Position, entityIdMapping.get(entity1)!)).toBe(false)
        expect(hasComponent(world, Velocity, entityIdMapping.get(entity2)!)).toBe(false)
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
        addComponent(world, Position, entity)
        addComponent(world, networkedTag, entity)

        let serializedData = serialize()
        let entityIdMapping = deserialize(serializedData)

        expect(hasComponent(world, Position, entityIdMapping.get(entity)!)).toBe(true)

        removeComponent(world, Position, entity)

        serializedData = serialize()
        entityIdMapping = deserialize(serializedData)

        expect(hasComponent(world, Position, entityIdMapping.get(entity)!)).toBe(false)

        addComponent(world, Position, entity)

        serializedData = serialize()
        entityIdMapping = deserialize(serializedData)

        expect(hasComponent(world, Position, entityIdMapping.get(entity)!)).toBe(true)
    })
})
