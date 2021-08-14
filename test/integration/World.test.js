import assert, { strictEqual } from 'assert'
import { $entityMasks, resetGlobals, addEntity, getDefaultSize } from '../../src/Entity.js'
import { createWorld } from '../../src/World.js'

const defaultSize = getDefaultSize()

const growAmount = defaultSize + defaultSize / 2

describe('World Integration Tests', () => {
  afterEach(() => {
    resetGlobals()
  })
  // it('should resize automatically at 80% of ' + defaultSize, () => {
  //   const world = createWorld()
  //   const n = defaultSize * 0.8
  //   for (let i = 0; i < n; i++) {
  //     addEntity(world)
  //   }
    
  //   strictEqual(world[$entityMasks][0].length, growAmount)
  // })
})
