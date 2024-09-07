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
})
