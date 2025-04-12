import { describe, it, expect } from 'vitest'
import {
    addComponent,
    addEntity,
    createRelation,
    createWorld,
    getRelationTargets,
    hasComponent,
    isRelation,
    query,
    removeEntity,
    Wildcard,
    withAutoRemoveSubject,
    withStore
} from 'bitecs'
import { array, createSnapshotDeserializer, createSnapshotSerializer, f32, i32, u8} from '../../src/serialization'

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

    it('should correctly serialize and deserialize array of arrays components', () => {
        const world = createWorld()
        const Position = { value: array<[number, number]>() }
        const Transform = {
            position: array<[number, number, number]>(),
            rotation: array<[number, number, number]>(),
            scale: array<[number, number, number]>(),
        }
        const components = [Position, Transform]

        const serialize = createSnapshotSerializer(world, components)
        const deserialize = createSnapshotDeserializer(world, components)

        const entity1 = addEntity(world)
        addComponent(world, entity1, Position)
        addComponent(world, entity1, Transform)
        Position.value[entity1] = [10,20]
        Transform.position[entity1] = [1,2,3]
        Transform.rotation[entity1] = [4,5,6]
        Transform.scale[entity1] = [7,8,9]

        const entity2 = addEntity(world)
        addComponent(world, entity2, Position)
        addComponent(world, entity2, Transform)
        Position.value[entity2] = [30,40]
        Transform.position[entity2] = [10,20,30]
        Transform.rotation[entity2] = [40,50,60]
        Transform.scale[entity2] = [70,80,90]

        const entity3 = addEntity(world)
        addComponent(world, entity3, Position)
        addComponent(world, entity3, Transform)
        Position.value[entity3] = [30,40]
        Transform.position[entity3] = [10,20,30]
        Transform.rotation[entity3] = [40,50,60]
        Transform.scale[entity3] = [70,80,90]

        const serializedData = serialize()

        removeEntity(world, entity1)
        removeEntity(world, entity2)
        removeEntity(world, entity3)
        Position.value[entity1] = null
        Position.value[entity2] = null
        Transform.position[entity1] = null
        Transform.position[entity2] = null
        Transform.scale[entity1] = null
        Transform.scale[entity2] = null
        Transform.rotation[entity1] = null
        Transform.rotation[entity2] = null

        Position.value[entity3] = null
        Transform.position[entity3] = null
        Transform.rotation[entity3] = null
        Transform.scale[entity3] = null

        const deserializedEntities = deserialize(serializedData)

        const entityMap = new Map(deserializedEntities)
        const newEntity1 = entityMap.get(entity1)!
        const newEntity2 = entityMap.get(entity2)!
        const newEntity3 = entityMap.get(entity3)!

        expect(hasComponent(world, newEntity1, Position)).toBe(true)
        expect(hasComponent(world, newEntity2, Position)).toBe(true)
        expect(hasComponent(world, newEntity3, Position)).toBe(true)

        expect(Position.value[newEntity1]).toEqual([10,20])
        expect(Position.value[newEntity2]).toEqual([30,40])
        expect(Position.value[newEntity3]).toEqual([30,40])

        expect(Transform.position[newEntity1]).toEqual([1,2,3])
        expect(Transform.rotation[newEntity1]).toEqual([4,5,6])
        expect(Transform.scale[newEntity1]).toEqual([7,8,9])
        expect(Transform.position[newEntity2]).toEqual([10,20,30])
        expect(Transform.rotation[newEntity2]).toEqual([40,50,60])
        expect(Transform.scale[newEntity2]).toEqual([70,80,90])
        expect(Transform.position[newEntity3]).toEqual([10,20,30])
        expect(Transform.rotation[newEntity3]).toEqual([40,50,60])
        expect(Transform.scale[newEntity3]).toEqual([70,80,90])
    })

    it('should correctly serialize and deserialize relations in the same world', () => {
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

    it('should correctly serialize and deserialize relations between two different worlds', () => {
        const world1 = createWorld()
        const world2 = createWorld()
        const ChildOf1 = createRelation(withAutoRemoveSubject)
        const ChildOf2 = createRelation(withAutoRemoveSubject)

        const serialize = createSnapshotSerializer(world1, [ChildOf1])
        const deserialize = createSnapshotDeserializer(world2, [ChildOf2])

        // Create parent and child entities in world1
        const parent = addEntity(world1)
        const child = addEntity(world1)
        addComponent(world1, child, ChildOf1(parent))

        // Serialize from world1 and deserialize into world2
        const serializedData = serialize()
        const entityIdMapping = deserialize(serializedData)

        // Get mapped entity IDs in world2
        const mappedParent = entityIdMapping.get(parent)!
        const mappedChild = entityIdMapping.get(child)!

        // Verify relation was copied correctly
        expect(hasComponent(world2, mappedChild, ChildOf2(mappedParent))).toBe(true)

        // Verify implicit relation components in world2
        expect(hasComponent(world2, mappedParent, Wildcard(ChildOf2))).toBe(true)
        expect(hasComponent(world2, mappedChild, ChildOf2(Wildcard))).toBe(true)

        // Verify queries work correctly in world2
        const childResults = query(world2, [ChildOf2(mappedParent)])
        const parentResults = query(world2, [ChildOf2(Wildcard)])

        // Check child query results
        expect(childResults.length).toBe(1)
        expect(childResults[0]).toBe(mappedChild)

        // Check parent query results
        expect(parentResults.length).toBe(1)
        expect(parentResults[0]).toBe(mappedChild)
    })

    it('should correctly serialize and deserialize relations with data', () => {
        const world1 = createWorld()
        const world2 = createWorld()
        const Contains1 = createRelation(withStore(() => ({ amount: i32() })))
        const Contains2 = createRelation(withStore(() => ({ amount: i32() })))

        const serialize = createSnapshotSerializer(world1, [Contains1])
        const deserialize = createSnapshotDeserializer(world2, [Contains2])

        // Create container and item entities in world1
        const container = addEntity(world1)
        const item = addEntity(world1)

        // Add Contains relation with amount data
        addComponent(world1, container, Contains1(item))
        Contains1(item).amount[container] = 5

        // Serialize from world1 and deserialize into world2
        const serializedData = serialize()
        const entityIdMapping = deserialize(serializedData)

        // Get mapped entity IDs in world2
        const mappedContainer = entityIdMapping.get(container)!
        const mappedItem = entityIdMapping.get(item)!

        // Verify relation and data was copied correctly
        expect(hasComponent(world2, mappedContainer, Contains2(mappedItem))).toBe(true)

        // Query for containers that contain the mapped item
        const containers = query(world2, [Contains2(mappedItem)])
        expect(containers).toContain(mappedContainer)
        expect(Contains2(mappedItem).amount[mappedContainer]).toBe(5)
    })

    it('should be able to find entities via queries instead of entity mapping', () => {
        const world1 = createWorld()
        const world2 = createWorld()
        const Contains1 = createRelation(withStore(() => ({ amount: i32() })))
        const Contains2 = createRelation(withStore(() => ({ amount: i32() })))

        const serialize = createSnapshotSerializer(world1, [Contains1])
        const deserialize = createSnapshotDeserializer(world2, [Contains2])

        // Create entities and relations in world1
        const container = addEntity(world1)
        const item = addEntity(world1)
        addComponent(world1, container, Contains1(item))
        Contains1(item).amount[container] = 42

        // Serialize and deserialize
        const serializedData = serialize()
        deserialize(serializedData)
        // Find entities in world2 using queries
        const containersInWorld1 = query(world1, [Contains1(Wildcard)]) // containers that contain anything
        const containersInWorld2 = query(world2, [Contains2(Wildcard)]) // containers that contain anything
        // Get all items that are targets of Contains relations
        const itemsInWorld1 = containersInWorld1.flatMap(container => getRelationTargets(world1, container, Contains1))
        const itemsInWorld2 = containersInWorld2.flatMap(container => getRelationTargets(world2, container, Contains2))

        // Verify entities exist in both worlds
        expect(containersInWorld1.length).toBe(1)
        expect(containersInWorld2.length).toBe(1)
        expect(itemsInWorld1.length).toBe(1)
        expect(itemsInWorld2.length).toBe(1)

        // Get the container and item from world2 via query
        const containerInWorld2 = containersInWorld2[0]
        const itemInWorld2 = itemsInWorld2[0]

        // Verify relation data was copied correctly
        expect(hasComponent(world2, containerInWorld2, Contains2(itemInWorld2))).toBe(true)
        expect(Contains2(itemInWorld2).amount[containerInWorld2]).toBe(42)
    })

    it('should properly deserialize ChildOf relations to players', () => {
        // Create two separate worlds
        const world1 = createWorld()
        const world2 = createWorld()

        // Create relation components for both worlds
        const ChildOf1 = createRelation()
        const ChildOf2 = createRelation()

        // Create serializer and deserializer
        const serialize = createSnapshotSerializer(world1, [ChildOf1])
        const deserialize = createSnapshotDeserializer(world2, [ChildOf2])

        // Create mapping of user IDs to entity IDs
        const userIdToEntityId = new Map([
            ['user1', addEntity(world1)],
            ['user2', addEntity(world1)]
        ])

        // Create cards in world1
        const card1 = addEntity(world1)
        const card2 = addEntity(world1)
        const card3 = addEntity(world1)

        // Assign cards to players using ChildOf relation
        addComponent(world1, card1, ChildOf1(userIdToEntityId.get('user1')!))
        addComponent(world1, card2, ChildOf1(userIdToEntityId.get('user1')!))
        addComponent(world1, card3, ChildOf1(userIdToEntityId.get('user2')!))

        // Serialize and deserialize the world state
        const serializedData = serialize()
        const entityMapping = deserialize(serializedData)

        // Map user IDs to new world2 entity IDs
        const userIdToEntityId2 = new Map([
            ['user1', entityMapping.get(userIdToEntityId.get('user1')!)],
            ['user2', entityMapping.get(userIdToEntityId.get('user2')!)]
        ])

        // Query all entities with ChildOf relations in world2
        const allEntities = query(world2, [ChildOf2(Wildcard)])
        expect(allEntities.length).toBe(3) // Should have 3 cards with ChildOf relations

        // Query cards for each user
        const user1Cards = query(world2, [ChildOf2(userIdToEntityId2.get('user1')!)])
        const user2Cards = query(world2, [ChildOf2(userIdToEntityId2.get('user2')!)])

        // Verify card counts per user
        expect(user1Cards.length).toBe(2) // First user should have 2 cards
        expect(user2Cards.length).toBe(1) // Second user should have 1 card

        // Verify all cards have valid ChildOf relations
        for (const cardId of user1Cards) {
            expect(hasComponent(world2, cardId, ChildOf2(userIdToEntityId2.get('user1')!))).toBe(true)
        }
        for (const cardId of user2Cards) {
            expect(hasComponent(world2, cardId, ChildOf2(userIdToEntityId2.get('user2')!))).toBe(true)
        }
    })

    it('should properly deserialize ChildOf relations to players and work with removal', () => {
        // Create two separate worlds
        const clientWorld = createWorld()
        const serverWorld = createWorld()

        // Create relation components for both worlds
        const ChildOf = createRelation(withAutoRemoveSubject)
        const Targetting = createRelation()

        // Create other components
        const Damage = {}
        const Player = {}

        // Create serializer and deserializer
        const serialize = createSnapshotSerializer(serverWorld, [Damage, Player, ChildOf, Targetting])
        const deserialize = createSnapshotDeserializer(clientWorld, [Damage, Player, ChildOf, Targetting])

        // Create player in serverWorld
        const playerEntity = addEntity(serverWorld)
        addComponent(serverWorld, playerEntity, Player)

        const serializedData = serialize()
        const entityMapping = deserialize(serializedData)

        // Player existing in
        const initialPlayers = query(clientWorld, [Player])
        expect(initialPlayers.length).toBe(1)

        const damageEntity = addEntity(serverWorld)
        addComponent(serverWorld, damageEntity, Damage)
        addComponent(serverWorld, damageEntity, ChildOf(playerEntity))

        // Second deserialization
        const serializedData2 = serialize()
        const entityMapping2 = deserialize(serializedData2, entityMapping)

        const clientPlayerEntity = entityMapping2.get(playerEntity)
        const clientDamageEntity = entityMapping2.get(damageEntity)

        const allEntities = query(clientWorld, [ChildOf(clientPlayerEntity!)])
        expect(allEntities.length).toBe(1)
        expect(entityMapping2.get(damageEntity)).toBe(clientDamageEntity)

        // 💩 Poops the test
        removeEntity(serverWorld, damageEntity)

        // Third deserialization
        const serializedData3 = serialize()
        const entityMapping3 = deserialize(serializedData3, entityMapping2)

        const clientPlayerEntity2 = entityMapping3.get(playerEntity)
        const clientDamageEntity2 = entityMapping3.get(damageEntity)
        expect(clientPlayerEntity2).toBe(undefined)
        expect(clientDamageEntity2).toBe(undefined)

        const allEntities2 = query(clientWorld, [])
        expect(allEntities2.length).toBe(0)
    })
});