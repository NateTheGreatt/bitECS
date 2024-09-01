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

export type World<T extends object = {}> = { [K in keyof T]: T[K] }

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
export const withContext = <U extends object>(context: U) =>
    <T extends object>(world: World<T>): World<T & U> => {
        const internalData = world[$internal];
        Object.assign(context, world);
        defineHiddenProperty(context, $internal, internalData);
        return context as World<T & U>;
    }

/**
 * Creates a new world with optional context and entity index.
 * @returns {World<{}>} A new world without any context.
 */
export function createWorld(): World<{}>

/**
 * Creates a new world with optional context and entity index.
 * @param {object} options - Options for creating the world.
 * @param {T} [options.context] - Optional context object to be merged with the world.
 * @param {EntityIndex} [options.entityIndex] - Optional custom entity index for the world.
 * @returns {World<T>} A new world with the specified context and/or entity index.
 */
export function createWorld<T extends object>(options: { context?: T, entityIndex?: EntityIndex }): World<T>

/**
 * Creates a new world with modifiers.
 * @param {...Array<function>} modifiers - Functions that modify the world.
 * @returns {World<T>} A new world modified by the provided functions.
 */
export function createWorld<T extends object>(...modifiers: Array<(world: World<{}>) => World<T>>): World<T>

/**
 * Creates a new world with optional context, entity index, or modifiers.
 * @param {object | function} optionsOrModifier - Options object or a modifier function.
 * @param {...Array<function>} restModifiers - Additional modifier functions.
 * @returns {World<T>} A new world with the specified options or modifications.
 */
export function createWorld<T extends object>(
    optionsOrModifier?: { context?: T, entityIndex?: EntityIndex } | ((world: World<{}>) => World<T>),
    ...restModifiers: Array<(world: World<{}>) => World<T>>
): World<T> {
    if (typeof optionsOrModifier === 'object' && optionsOrModifier !== null && !Array.isArray(optionsOrModifier)) {
        const { context, entityIndex } = optionsOrModifier;
        let world = createBaseWorld() as World<T>;
        if (context) {
            world = withContext(context)(world);
        }
        if (entityIndex) {
            world = withEntityIndex(entityIndex)(world);
        }
        return world;
    } else {
        const modifiers = (typeof optionsOrModifier === 'function' ? [optionsOrModifier, ...restModifiers] : restModifiers);
        const baseWorld = createBaseWorld() as World<{}>;
        return modifiers.reduce((world, modifier) => modifier(world), baseWorld) as World<T>;
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
