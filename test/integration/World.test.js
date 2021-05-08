import assert, { strictEqual } from 'assert'
import { $componentMap } from '../../src/Component.js'
import { $entityEnabled, $entityMasks, resetGlobals, resizeWorld, addEntity } from '../../src/Entity.js'
import { $dirtyQueries, $queries, $queryMap } from '../../src/Query.js'
import { createWorld, $size, $bitflag } from '../../src/World.js'

const defaultSize = 1_000_000

describe('World Integration Tests', () => {
  afterEach(() => {
    resetGlobals()
  })
  it('should resize on-demand', () => {
    const world = createWorld()
    resizeWorld(world, 1_500_000)
    strictEqual(world[$entityMasks][0].length, 1_500_000)
    strictEqual(world[$entityEnabled].length, 1_500_000)
  })
  it('should resize automatically at 80% of 1MM', () => {
    const world = createWorld()
    const n = 800_001
    for (let i = 0; i < n; i++) {
      addEntity(world)
    }
    
    strictEqual(world[$entityMasks][0].length, 1_500_000)
    strictEqual(world[$entityEnabled].length, 1_500_000)
  })
})
