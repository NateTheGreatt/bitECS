import { strictEqual } from 'assert'
import { addEntity, removeEntity } from '../../src/Entity.js'
import { globalUniverse, MAX_ENTITIES, resetUniverse } from '../../src/Universe.js'
import { createWorld } from '../../src/World.js'

describe('Entity Integration Tests', () => {
  afterEach(() => {
    resetUniverse(globalUniverse)
  })
  it('should add and remove entities', () => {
    const world = createWorld()
    
    const eid1 = addEntity(world)
    strictEqual(globalUniverse.entityCursor, 1)
    
    const eid2 = addEntity(world)
    strictEqual(globalUniverse.entityCursor, 2)
    
    const eid3 = addEntity(world)
    strictEqual(globalUniverse.entityCursor, 3)

    strictEqual(eid1, 0)
    strictEqual(eid2, 1)
    strictEqual(eid3, 2)

    removeEntity(world, eid1)
    removeEntity(world, eid2)
    removeEntity(world, eid3)

    const removed = globalUniverse.removedEntities
    
    strictEqual(removed.length, 3)
    strictEqual(removed[0], 0)
    strictEqual(removed[1], 1)
    strictEqual(removed[2], 2)
  })
  it('should recycle entity IDs after 1% have been removed', () => {
    const world = createWorld()

    const n = 0.01 * MAX_ENTITIES
    for (let i = 0; i < n; i++) {
      const eid = addEntity(world)
      strictEqual(globalUniverse.entityCursor, eid+1)
      strictEqual(eid, i)
    }

    strictEqual(globalUniverse.entityCursor, n)

    for (let i = 0; i < n * 10; i++) {
      removeEntity(world, i)
    }

    let eid = addEntity(world)
    strictEqual(eid, n)

    eid = addEntity(world)
    strictEqual(eid, n + 1)

    eid = addEntity(world)
    strictEqual(eid, n + 2)

    eid = addEntity(world)
    strictEqual(eid, n + 3)

    removeEntity(world, eid)

    eid = addEntity(world)
    strictEqual(eid, 0)

  })
})
