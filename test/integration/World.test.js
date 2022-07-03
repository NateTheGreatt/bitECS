import assert, { strictEqual } from 'assert'
import { $entityMasks, addEntity } from '../../src/Entity.js'
import { globalUniverse, resetUniverse } from '../../src/Universe.js'
import { createWorld } from '../../src/World.js'

const defaultSize = globalUniverse.capacity

const growAmount = defaultSize + defaultSize / 2

describe('World Integration Tests', () => {
  afterEach(() => {
    resetUniverse(globalUniverse)
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
