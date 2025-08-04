import assert, { strictEqual } from 'assert'
import { describe, it } from 'vitest'
import { createWorld, createEntityIndex, $internal } from '../../src/core'

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

	it('should correctly detect and use EntityIndex', () => {
		const entityIndex = createEntityIndex()
		const world = createWorld(entityIndex)
		const ctx = world[$internal]

		// The world should use the provided EntityIndex
		strictEqual(ctx.entityIndex, entityIndex)
	})

	it('should not confuse other objects with EntityIndex', () => {
		// Object with add/remove (the old broken check)
		const fakeIndex = { add: () => {}, remove: () => {} }
		const world = createWorld(fakeIndex as any)
		const ctx = world[$internal]

		// Should not use the fake object as EntityIndex
		assert(ctx.entityIndex !== fakeIndex)
	})
})
