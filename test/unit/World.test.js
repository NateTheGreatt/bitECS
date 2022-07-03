import assert, { strictEqual } from 'assert'
import { $componentMap } from '../../src/Component.js'
import { $entityMasks } from '../../src/Entity.js'
import { $dirtyQueries, $queries, $queryMap } from '../../src/Query.js'
import { globalUniverse, resetUniverse } from '../../src/Universe.js'
import { createWorld, $bitflag } from '../../src/World.js'

const defaultSize = globalUniverse.capacity

describe('World Unit Tests', () => {
  afterEach(() => {
    resetUniverse(globalUniverse)
  })
  it('should initialize all private state', () => {
    const world = createWorld()
    
    strictEqual(Object.keys(world).length, 0)

    assert(Array.isArray(world[$entityMasks]))

    strictEqual(world[$entityMasks][0].constructor.name, 'Uint32Array')
    strictEqual(world[$entityMasks][0].length, defaultSize)

    strictEqual(world[$bitflag], 1)

    strictEqual(world[$componentMap].constructor.name, 'Map')
    strictEqual(world[$queryMap].constructor.name, 'Map')
    strictEqual(world[$queries].constructor.name, 'Set')
    strictEqual(world[$dirtyQueries].constructor.name, 'Set')
  })
})
