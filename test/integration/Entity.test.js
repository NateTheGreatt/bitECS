import { strictEqual } from 'assert'
import { $entityEnabled, getEntityCursor, getRemovedEntities, resetGlobals } from '../../src/Entity.js'
import { createWorld, addEntity, removeEntity } from '../../src/index.js'

describe('Entity Integration Tests', () => {
  afterEach(() => {
    resetGlobals()
  })
  it('should add and remove entities', () => {
    const world = createWorld()
    
    const eid1 = addEntity(world)
    strictEqual(getEntityCursor(), 1)
    
    const eid2 = addEntity(world)
    strictEqual(getEntityCursor(), 2)
    
    const eid3 = addEntity(world)
    strictEqual(getEntityCursor(), 3)

    strictEqual(world[$entityEnabled][eid1], 1)
    strictEqual(world[$entityEnabled][eid2], 1)
    strictEqual(world[$entityEnabled][eid3], 1)
    strictEqual(eid1, 0)
    strictEqual(eid2, 1)
    strictEqual(eid3, 2)

    removeEntity(world, eid1)
    removeEntity(world, eid2)
    removeEntity(world, eid3)

    const removed = getRemovedEntities()
    
    strictEqual(removed.length, 3)
    strictEqual(removed[0], 0)
    strictEqual(removed[1], 1)
    strictEqual(removed[2], 2)
  })
  it('should recycle entity IDs when removed', () => {
    const world = createWorld()
    const eid1 = addEntity(world)

    strictEqual(getEntityCursor(), 1)
    strictEqual(eid1, 0)
    
    removeEntity(world, eid1)
    const eid2 = addEntity(world)
    
    strictEqual(eid2, 0)
    strictEqual(getEntityCursor(), 2)
  })
})
