import { strictEqual } from 'assert'
import { getEntityCursor, getRemovedEntities, resetGlobals } from '../../src/Entity.js'
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
  it('should recycle entity IDs after 1% have been removed', () => {
    const world = createWorld()

    for (let i = 0; i < 1500; i++) {
      const eid = addEntity(world)
      strictEqual(getEntityCursor(), eid+1)
      strictEqual(eid, i)
    }

    strictEqual(getEntityCursor(), 1500)

    for (let i = 0; i < 1000; i++) {
      removeEntity(world, i)
    }

    let eid = addEntity(world)
    strictEqual(eid, 1500)

    eid = addEntity(world)
    strictEqual(eid, 1501)

    eid = addEntity(world)
    strictEqual(eid, 1502)

    eid = addEntity(world)
    strictEqual(eid, 1503)

    removeEntity(world, eid)

    eid = addEntity(world)
    strictEqual(eid, 0)

  })
})
