import { defineHiddenProperty } from './utils/defineHiddenProperty'
import { createEntityIndex, EntityIndex } from './EntityIndex'
import { ComponentRef, ComponentData } from './Component'
import { Query } from './Query'

export const $internal = Symbol('internal')

export type WorldContext = {
	entityIndex: EntityIndex
	entityMasks: number[][]
	entityComponents: Map<number, Set<ComponentRef>>
	bitflag: number
	componentMap: WeakMap<ComponentRef, ComponentData>
	componentCount: number
	queries: Set<Query>
	queriesHashMap: Map<string, Query>
	notQueries: Set<any>
	dirtyQueries: Set<any>
}

export type InternalWorld = {
	[$internal]: WorldContext
}

export type World<T extends object = {}> = T
type WorldModifier<T> = (world: World) => World & T

const createBaseWorld = (context?: object): World => {
    const worldContext: WorldContext = {
        entityIndex: createEntityIndex(),
        entityMasks: [[]],
        entityComponents: new Map(),
        bitflag: 1,
        componentMap: new WeakMap(),
        componentCount: 0,
        queries: new Set(),
        queriesHashMap: new Map(),
        notQueries: new Set(),
        dirtyQueries: new Set(),
    }

    const world = context || {}
    defineHiddenProperty(world, $internal, worldContext)
    return world as World
}

export const withEntityIndex = (entityIndex: EntityIndex): WorldModifier<{}> => 
    (world: World) => {
        const ctx = (world as InternalWorld)[$internal]
        ctx.entityIndex = entityIndex
        return world
    }

export const withContext = <T extends object>(context: T): WorldModifier<T> =>
    (world: World) => {
        return Object.assign(context, world) as World & T
    }

export const createWorld = <T extends object = {}>(
    ...args: Array<WorldModifier<any> | {
        entityIndex?: EntityIndex
        context?: T
    }>
): World<T> => {
    const processInputs = (inputs: typeof args) => {
        let context: T | undefined
        const modifiers: Array<WorldModifier<any>> = []

        inputs.forEach(arg => {
            if (typeof arg === 'object' && !Array.isArray(arg) && !(arg instanceof Function)) {
                const { entityIndex, context: ctx } = arg
                if (entityIndex) modifiers.push(withEntityIndex(entityIndex))
                if (ctx) context = ctx
            } else if (typeof arg === 'function') {
                modifiers.push(arg as WorldModifier<any>)
            }
        })

        return { context, modifiers }
    }

    const { context, modifiers } = processInputs(args)
    const baseWorld = createBaseWorld(context)

    return modifiers.reduce((world, modifier) => modifier(world), baseWorld) as World<T>
}

/**
 * Resets a world.
 *
 * @param {World} world
 * @returns {object}
 */
export const resetWorld = (world: World) => {
	const ctx = (world as InternalWorld)[$internal]
	ctx.entityIndex = createEntityIndex()
	ctx.entityMasks = [[]]
	ctx.entityComponents = new Map()
	ctx.bitflag = 1
	ctx.componentMap = new Map()
	ctx.componentCount = 0
	ctx.queries = new Set()
	ctx.queriesHashMap = new Map()
	ctx.notQueries = new Set()
	ctx.dirtyQueries = new Set()
	return world
}

/**
 * Returns all components registered to a world
 *
 * @param {World} world
 * @returns Array
 */
export const getWorldComponents = (world: World) => 
	Object.keys((world as InternalWorld)[$internal].componentMap)

/**
 * Returns all existing entities in a world
 *
 * @param {World} world
 * @returns Array
 */
export const getAllEntities = (world: World) => (world as InternalWorld)[$internal].entityIndex.dense.slice(0)
