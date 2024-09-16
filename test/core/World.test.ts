import assert, { strictEqual } from 'assert'
import { describe, it } from 'vitest'
import { createWorld, $internal } from '../../src/core'

describe('World Tests', () => {
	it('should initialize all private state', () => {
		const world = createWorld()
		const ctx = world[$internal]

		assert(Array.isArray(ctx.entityMasks))

		strictEqual(ctx.entityMasks[0].constructor.name, 'Array')
		strictEqual(ctx.entityMasks[0].length, 0)

		strictEqual(ctx.bitflag, 1)

		strictEqual(ctx.componentMap.constructor.name, 'Map')
		strictEqual(ctx.queries.constructor.name, 'Set')
		strictEqual(ctx.dirtyQueries.constructor.name, 'Set')
	})
})
