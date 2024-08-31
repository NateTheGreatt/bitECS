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

export const withEntityIndex = (entityIndex: EntityIndex) =>
    <T extends object>(world: World<T>): World<T> => {
        const ctx = world[$internal]
        ctx.entityIndex = entityIndex
        return world
    }

export const withContext = <U extends object>(context: U) =>
    <T extends object>(world: World<T>): World<T & U> => {
        const internalData = world[$internal];
        Object.assign(context, world);
        defineHiddenProperty(context, $internal, internalData);
        return context as World<T & U>;
    }


export function createWorld(): World<{}>
export function createWorld<T extends object>(options: { context?: T, entityIndex?: EntityIndex }): World<T>
export function createWorld<T extends object>(...modifiers: Array<(world: World<{}>) => World<T>>): World<T>
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
