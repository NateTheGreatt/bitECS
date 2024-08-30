import { strictEqual } from 'assert'
import { describe, it } from 'vitest'
import { createWorld, addEntity, removeEntity, World, $internal } from '../../src/core'

const getEntityCursor = (world: World) => world[$internal].entityIndex.maxId + 1

describe('Entity Tests', () => {
    it('should add and remove entities', () => {
        const world = createWorld()

        const eid1 = addEntity(world)
        strictEqual(getEntityCursor(world), 2)

        const eid2 = addEntity(world)
        strictEqual(getEntityCursor(world), 3)

        const eid3 = addEntity(world)
        strictEqual(getEntityCursor(world), 4)

        strictEqual(eid1, 1)
        strictEqual(eid2, 2)
        strictEqual(eid3, 3)

        removeEntity(world, eid1)
        removeEntity(world, eid2)
        removeEntity(world, eid3)

        const eid4 = addEntity(world)
        const eid5 = addEntity(world)
        const eid6 = addEntity(world)

        strictEqual(eid4, 3)
        strictEqual(eid5, 2)
        strictEqual(eid6, 1)
        strictEqual(getEntityCursor(world), 4)
    })
})
