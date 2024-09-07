import { describe, it, expect, vi } from 'vitest'
import { createWorld, addEntity, addComponent, getComponentData, setComponent, observe, onGet, onSet } from '../../src/core'

describe('Observer Tests', () => {
	it('should trigger onGet when component data is accessed', () => {
		const world = createWorld()
		const eid = addEntity(world)
		const Position: {x:number[],y:number[]} = { x: [], y: [] }
		addComponent(world, eid, Position)

		const mockObserver = vi.fn((eid) => ({ x: Position.x[eid], y: Position.y[eid] }))
		const unsubscribe = observe(world, onGet(Position), mockObserver)

		getComponentData(world, eid, Position)
		expect(mockObserver).toHaveBeenCalledWith(eid)

		unsubscribe()
		getComponentData(world, eid, Position)
		expect(mockObserver).toHaveBeenCalledTimes(1)
	})

	it('should trigger onSet when component data is set', () => {
		const world = createWorld()
		const eid = addEntity(world)
		const Position: {x:number[],y:number[]} = { x: [], y: [] }
		addComponent(world, eid, Position)

		const mockObserver = vi.fn((eid, params) => {
			Position.x[eid] = params.x
			Position.y[eid] = params.y
		})
		const unsubscribe = observe(world, onSet(Position), mockObserver)

		setComponent(world, eid, Position, { x: 1, y: 1 })
		expect(mockObserver).toHaveBeenCalledWith(eid, { x: 1, y: 1 })
		expect(Position.x[eid]).toBe(1)
		expect(Position.y[eid]).toBe(1)

		unsubscribe()
		setComponent(world, eid, Position, { x: 2, y: 2 })
		expect(mockObserver).toHaveBeenCalledTimes(1)
		expect(Position.x[eid]).toBe(1)
		expect(Position.y[eid]).toBe(1)
	})

	it('should work with both onGet and onSet', () => {
		const world = createWorld()
		const eid = addEntity(world)
		const Position: {x:number[],y:number[]} = { x: [], y: [] }
		addComponent(world, eid, Position)

		const setObserver = vi.fn((eid, params) => {
			Position.x[eid] = params.x
			Position.y[eid] = params.y
		})
		observe(world, onSet(Position), setObserver)

		const getObserver = vi.fn((eid) => ({ x: Position.x[eid], y: Position.y[eid] }))
		observe(world, onGet(Position), getObserver)

		setComponent(world, eid, Position, { x: 3, y: 4 })
		expect(setObserver).toHaveBeenCalledWith(eid, { x: 3, y: 4 })
		expect(Position.x[eid]).toBe(3)
		expect(Position.y[eid]).toBe(4)

		const result = getComponentData(world, eid, Position)
		expect(getObserver).toHaveBeenCalledWith(eid)
		expect(result).toEqual({ x: 3, y: 4 })
	})
	it('should properly type params in onSet and onGet observers', () => {
		const world = createWorld()
		const eid = addEntity(world)
		const Position = { x: [] as number[], y: [] as number[] }
		addComponent(world, eid, Position)

		const setObserver = vi.fn((eid: number, params: { x: number, y: number }) => {
			Position.x[eid] = params.x
			Position.y[eid] = params.y
		})
		observe(world, onSet(Position), setObserver)

		const getObserver = vi.fn((eid: number): { x: number, y: number } => ({
			x: Position.x[eid],
			y: Position.y[eid]
		}))
		observe(world, onGet(Position), getObserver)

		setComponent(world, eid, Position, { x: 5, y: 6 })
		expect(setObserver).toHaveBeenCalledWith(eid, { x: 5, y: 6 })
		expect(Position.x[eid]).toBe(5)
		expect(Position.y[eid]).toBe(6)

		const result = getComponentData(world, eid, Position)
		expect(getObserver).toHaveBeenCalledWith(eid)
		expect(result).toEqual({ x: 5, y: 6 })

		setComponent(world, eid, Position, { x: 5, y: 6 })

		const componentData = getComponentData(world, eid, Position)
		const sum: number = componentData.x + componentData.y
		expect(sum).toBe(11)
	})
})
