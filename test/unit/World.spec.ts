import assert, { strictEqual } from 'assert'
import { $componentMap } from '../../src/Component'
import { $entityMasks, resetGlobals, getDefaultSize } from '../../src/Entity'
import { $dirtyQueries, $queries, $queryMap } from '../../src/Query'
import { createWorld, $size, $bitflag } from '../../src/World'

const defaultSize = getDefaultSize()

describe('World Integration Tests', () => {
  afterEach(() => {
    resetGlobals()
  })
  it('should initialize all private state', () => {
    const world = createWorld()
    
    strictEqual(Object.keys(world).length, 0)

    strictEqual(world[$size], defaultSize)

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
