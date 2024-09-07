import { defineHiddenProperty } from './utils/defineHiddenProperty'
import { createEntityIndex, EntityIndex } from './EntityIndex'
import { ComponentRef, ComponentData } from './Component'
import { Query } from './Query'
import { EntityId } from './Entity'

export const $internal = Symbol('internal')

export type WorldContext = {
    entityIndex: EntityIndex
    entityMasks: number[][]
    entityComponents: Map<EntityId, Set<ComponentRef>>
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

export type World<T extends object = {}> = { [K in keyof T]: T[K] }

export type WorldMiddleware<T extends object> = (world: World<T>) => World<T>;

const createBaseWorld = <T extends object>(context?: T): World<T> => {
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
    return world as World<T>
}

/**
 * Higher-order function that returns a function to set a custom entity index for a world.
 * @param {EntityIndex} entityIndex - The custom entity index to be set.
 * @returns {function} A function that takes a world and returns the modified world.
 */
export const withEntityIndex = (entityIndex: EntityIndex) =>
    <T extends object>(world: World<T>): World<T> => {
        const ctx = world[$internal]
        ctx.entityIndex = entityIndex
        return world
    }

/**
 * Higher-order function that returns a function to merge a context object with a world.
 * @param {U} context - The context object to be merged with the world.
 * @returns {function} A function that takes a world and returns the modified world with the merged context.
 */
export const withContext = <T extends object>(context: T) => (world: World<T>): World<T> => {
    const internalData = world[$internal];
    Object.assign(context, world);
    defineHiddenProperty(context, $internal, internalData);
    return context as World<T>;
}

export function createWorld<T extends object = {}>(): World<T>;

/**
 * Creates a new world with modifiers.
 * @template T
 * @param {...Array<function(World<T>): World<T>>} modifiers - Modifier functions for the world.
 * @returns {World<T>} The created world.
 */
// export function createWorld<T extends object>(...modifiers: Array<WorldMiddleware<T>>): World<T>
export function createWorld<T extends object = {}, U extends object = {}>(
    ...modifiers: Array<WorldMiddleware<T & U>>
): World<T & U>;

/**
 * Creates a new world with options.
 * @template T
 * @param {Object} options - Options for creating the world.
 * @param {T} [options.context] - Optional context object to be merged with the world.
 * @param {EntityIndex} [options.entityIndex] - Optional custom entity index for the world.
 * @returns {World<T>} The created world.
 */
export function createWorld<T extends object>(options: {
    context?: T
    entityIndex?: EntityIndex
}): World<T>

export function createWorld<T extends object>(
    ...args: Array<WorldMiddleware<T>> | [{
        context?: T
        entityIndex?: EntityIndex
    }]
): World<T> {
    if (args.length === 1 && typeof args[0] === 'object') {
        const { context, entityIndex } = args[0]
        const modifiers = [
            context && withContext(context),
            entityIndex && withEntityIndex(entityIndex)
        ].filter(Boolean) as Array<WorldMiddleware<T>>
        return modifiers.reduce((acc, modifier) => modifier(acc), createBaseWorld<T>())
    } else {
        const modifiers = args as Array<WorldMiddleware<T>>
        return modifiers.reduce((acc, modifier) => modifier(acc), createBaseWorld<T>())
    }
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
