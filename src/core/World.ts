import { defineHiddenProperty } from './utils/defineHiddenProperty'
import { createEntityIndex, EntityIndex } from './EntityIndex'
import { ComponentRef, ComponentData } from './Component'
import { Query } from './Query'
import { EntityId } from './Entity'

export const $internal = Symbol.for('bitecs_internal')

export type WorldContext = {
    entityIndex: EntityIndex
    entityMasks: number[][]
    entityComponents: Map<EntityId, Set<ComponentRef>>
    bitflag: number
    componentMap: Map<ComponentRef, ComponentData>
    componentCount: number
    queries: Set<Query>
    queriesHashMap: Map<string, Query>
    notQueries: Set<any>
    dirtyQueries: Set<any>
    relationTargetEntities: Set<EntityId>
}

export type InternalWorld = {
    [$internal]: WorldContext
}

export type World<T extends object = {}> = { [K in keyof T]: T[K] }

const createBaseWorld = <T extends object>(context?: T, entityIndex?: EntityIndex): World<T> => 
    defineHiddenProperty(context || {} as T, $internal, {
        entityIndex: entityIndex || createEntityIndex(),
        entityMasks: [[]],
        entityComponents: new Map(),
        bitflag: 1,
        componentMap: new Map(),
        componentCount: 0,
        queries: new Set(),
        queriesHashMap: new Map(),
        notQueries: new Set(),
        dirtyQueries: new Set(),
        entitiesWithRelations: new Set(),
    }) as World<T>

/**
 * Creates a new world with various configurations.
 * @template T
 * @param {...Array<EntityIndex | object>} args - EntityIndex, context object, or both.
 * @returns {World<T>} The created world.
 */
export function createWorld<T extends object = {}>(
    ...args: Array<EntityIndex | T>
): World<T> {
    let entityIndex: EntityIndex | undefined
    let context: T | undefined

    args.forEach(arg => {
        if (typeof arg === 'object' && 'add' in arg && 'remove' in arg) {
            entityIndex = arg as EntityIndex
        } else if (typeof arg === 'object') {
            context = arg as T
        }
    })

    return createBaseWorld<T>(context, entityIndex)
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
    ctx.relationTargetEntities = new Set()
    return world
}

/**
 * Deletes a world by removing its internal data.
 *
 * @param {World} world - The world to be deleted.
 */
export const deleteWorld = (world: World) => {
    delete (world as any)[$internal];
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
