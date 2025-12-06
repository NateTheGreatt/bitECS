import { getEntityComponents, World } from '.'
import { EntityId } from './Entity'
import { defineHiddenProperty } from './utils/defineHiddenProperty'

/**
 * Callback function type for when a target is removed from a relation.
 * @callback OnTargetRemovedCallback
 * @param {number} subject - The subject entity ID.
 * @param {number} target - The target entity ID.
 */
export type OnTargetRemovedCallback = (subject: EntityId, target: EntityId) => void

/**
 * Possible types for a relation target.
 * @typedef {number | '*' | typeof Wildcard} RelationTarget
 */
export type RelationTarget = number | '*' | typeof Wildcard
/**
 * Symbol for accessing the relation of a component.
 * @type {Symbol}
 */
export const $relation = Symbol.for('bitecs-relation')

/**
 * Symbol for accessing the pair target of a component.
 * @type {Symbol}
 */
export const $pairTarget = Symbol.for('bitecs-pairTarget')

/**
 * Symbol for checking if a component is a pair component.
 * @type {Symbol}
 */
export const $isPairComponent = Symbol.for('bitecs-isPairComponent')

/**
 * Symbol for accessing the relation data of a component.
 * @type {Symbol}
 */
export const $relationData = Symbol.for('bitecs-relationData')

/**
 * Interface for relation data.
 * @interface RelationData
 * @template T
 */
type RelationData<T> = {
    pairsMap: Map<number | string | Relation<any>, T>
    initStore: (eid: EntityId) => T
    exclusiveRelation: boolean
    autoRemoveSubject: boolean
    onTargetRemoved: OnTargetRemovedCallback
}

/**
 * Type definition for a Relation function.
 * @template T
 * @typedef {function} Relation
 * @param {RelationTarget} target - The target of the relation.
 * @returns {T} The relation component.
 */
export interface Relation<T> {
    (target: RelationTarget):T
    [$relationData]: RelationData<T>
} 

/**
 * Creates a base relation.
 * @template T
 * @returns {Relation<T>} The created base relation.
 */
const createBaseRelation = <T>(): Relation<T> => {
    const data = {
        pairsMap: new Map(),
        initStore: undefined,
        exclusiveRelation: false,
        autoRemoveSubject: false,
        onTargetRemoved: undefined
    }
    const relation = (target: RelationTarget): T => {
        if (target === undefined) throw Error('Relation target is undefined')
        const normalizedTarget = target === '*' ? Wildcard : target
        if (!data.pairsMap.has(normalizedTarget)) {
            const component = data.initStore ? data.initStore(target) : {} as T
            defineHiddenProperty(component, $relation, relation)
            defineHiddenProperty(component, $pairTarget, normalizedTarget)
            defineHiddenProperty(component, $isPairComponent, true)
            data.pairsMap.set(normalizedTarget, component)
        }

        return data.pairsMap.get(normalizedTarget)!
    }

    defineHiddenProperty(relation, $relationData, data)

    return relation as Relation<T>
}

/**
 * Adds a store to a relation.
 * @template T
 * @param {function(): T} createStore - Function to create the store.
 * @returns {function(Relation<T>): Relation<T>} A function that modifies the relation.
 */
export const withStore = <T>(createStore: (eid: EntityId) => T) => (relation: Relation<T>): Relation<T> => {
    const ctx = relation[$relationData]
    ctx.initStore = createStore
    return relation
}

/**
 * Makes a relation exclusive.
 * @template T
 * @param {Relation<T>} relation - The relation to make exclusive.
 * @returns {Relation<T>} The modified relation.
 */
export const makeExclusive = <T>(relation: Relation<T>): Relation<T> => {
    const ctx = relation[$relationData]
    ctx.exclusiveRelation = true
    return relation
}

/**
 * Adds auto-remove subject behavior to a relation.
 * @template T
 * @param {Relation<T>} relation - The relation to modify.
 * @returns {Relation<T>} The modified relation.
 */
export const withAutoRemoveSubject = <T>(relation: Relation<T>): Relation<T> => {
    const ctx = relation[$relationData]
    ctx.autoRemoveSubject = true
    return relation
}

/**
 * Adds an onTargetRemoved callback to a relation.
 * @template T
 * @param {OnTargetRemovedCallback} onRemove - The callback to add.
 * @returns {function(Relation<T>): Relation<T>} A function that modifies the relation.
 */
export const withOnTargetRemoved = <T>(onRemove: OnTargetRemovedCallback) => (relation: Relation<T>): Relation<T> => {
    const ctx = relation[$relationData]
    ctx.onTargetRemoved = onRemove
    return relation
}

// TODO: withSetter
/**
 * Adds validation to a relation.
 * @template T
 * @param {function(T): boolean} validateFn - The validation function.
 * @returns {function(Relation<T>): Relation<T>} A function that modifies the relation.
 */
const withValidation = <T>(validateFn: (value: T) => boolean) => (relation: Relation<T>): Relation<T> => {
    const originalRelation = relation
    return ((target: RelationTarget): T => {
        const component = originalRelation(target)
        if (!validateFn(component)) {
            throw new Error('Validation failed for relation component')
        }
        return component
    }) as Relation<T>
}

/**
 * Creates a pair from a relation and a target.
 * @template T
 * @param {Relation<T>} relation - The relation.
 * @param {RelationTarget} target - The target.
 * @returns {T} The created pair.
 * @throws {Error} If the relation is undefined.
 */
export const Pair = <T>(relation: Relation<T>, target: RelationTarget): T => {
    if (relation === undefined) throw Error('Relation is undefined')
    return relation(target)
}

/**
 * Gets the relation targets for an entity.
 * @param {World} world - The world object.
 * @param {Relation<any>} relation - The relation to get targets for.
 * @param {number} eid - The entity ID.
 * @returns {Array<any>} An array of relation targets.
 */
export const getRelationTargets = (world: World, eid: EntityId, relation: Relation<any>): number[] => {
	const components = getEntityComponents(world, eid)
	const targets = []
	for (const c of components) {
		if (c[$relation] === relation && c[$pairTarget] !== Wildcard && !isRelation(c[$pairTarget])) {
			targets.push(c[$pairTarget])
		}
	}
	return targets
}

/**
 * Creates a new relation.
 * @template T
 * @param {...Array<function(Relation<T>): Relation<T>>} modifiers - Modifier functions for the relation.
 * @returns {Relation<T>} The created relation.
 */
export function createRelation<T>(...modifiers: Array<(relation: Relation<T>) => Relation<T>>): Relation<T>

/**
 * Creates a new relation with options.
 * @template T
 * @param {Object} options - Options for creating the relation.
 * @param {function(): T} [options.store] - Function to create the store.
 * @param {boolean} [options.exclusive] - Whether the relation is exclusive.
 * @param {boolean} [options.autoRemoveSubject] - Whether to auto-remove the subject.
 * @param {OnTargetRemovedCallback} [options.onTargetRemoved] - Callback for when a target is removed.
 * @returns {Relation<T>} The created relation.
 */
export function createRelation<T>(options: {
    store?: () => T
    exclusive?: boolean
    autoRemoveSubject?: boolean
    onTargetRemoved?: OnTargetRemovedCallback
}): Relation<T>
export function createRelation<T>(
    ...args: Array<(relation: Relation<T>) => Relation<T>> | [{
        store?: () => T
        exclusive?: boolean
        autoRemoveSubject?: boolean
        onTargetRemoved?: OnTargetRemovedCallback
    }]
): Relation<T> {
    if (args.length === 1 && typeof args[0] === 'object') {
        const { store, exclusive, autoRemoveSubject, onTargetRemoved } = args[0]
        const modifiers = [
            store && withStore(store),
            exclusive && makeExclusive,
            autoRemoveSubject && withAutoRemoveSubject,
            onTargetRemoved && withOnTargetRemoved(onTargetRemoved)
        ].filter(Boolean) as Array<(relation: Relation<T>) => Relation<T>>
        return modifiers.reduce((acc, modifier) => modifier(acc), createBaseRelation<T>())
    } else {
        const modifiers = args as Array<(relation: Relation<T>) => Relation<T>>
        return modifiers.reduce((acc, modifier) => modifier(acc), createBaseRelation<T>())
    }
}

/**
 * Symbol used to mark a relation as a wildcard relation
 */
export const $wildcard = Symbol.for('bitecs-wildcard')

/**
 * Creates a wildcard relation that matches any target.
 * @template T
 * @returns {Relation<T>} The created wildcard relation.
 */
export function createWildcardRelation<T>(): Relation<T> {
    const relation = createBaseRelation<T>()
    Object.defineProperty(relation, $wildcard, {
        value: true,
        enumerable: false,
        writable: false,
        configurable: false
    })
    return relation
}

/**
 * Gets the singleton wildcard instance.
 * @returns {Relation<any>} The global wildcard relation instance.
 */
export function getWildcard(): Relation<any> {
    const GLOBAL_WILDCARD = Symbol.for('bitecs-global-wildcard')
    
    if (!(globalThis as any)[GLOBAL_WILDCARD]) {
        (globalThis as any)[GLOBAL_WILDCARD] = createWildcardRelation()
    }
    
    return (globalThis as any)[GLOBAL_WILDCARD]
}

/**
 * Wildcard relation.
 * @type {Relation<any>}
 */
export const Wildcard = getWildcard()

/**
 * Creates an IsA relation.
 * @template T
 * @returns {Relation<T>} The created IsA relation.
 */
export function createIsARelation<T>(): Relation<T> {
    return createBaseRelation<T>()
}

/**
 * Gets the singleton IsA instance.
 * @returns {Relation<any>} The global IsA relation instance.
 */
export function getIsA(): Relation<any> {
    const GLOBAL_ISA = Symbol.for('bitecs-global-isa')
    
    if (!(globalThis as any)[GLOBAL_ISA]) {
        (globalThis as any)[GLOBAL_ISA] = createIsARelation()
    }
    
    return (globalThis as any)[GLOBAL_ISA]
}

/**
 * IsA relation.
 * @type {Relation<any>}
 */
export const IsA = getIsA()

/**
 * Checks if a relation is a wildcard relation.
 * @param {any} relation - The relation to check.
 * @returns {boolean} True if the relation is a wildcard relation, false otherwise.
 */
export function isWildcard(relation: any): boolean {
    if (!relation) return false
    const symbols = Object.getOwnPropertySymbols(relation)
    return symbols.includes($wildcard)
}

/**
 * Checks if a component is a relation.
 * @param {any} component - The component to check.
 * @returns {boolean} True if the component is a relation, false otherwise.
 */
export function isRelation(component: any): boolean {
    if (!component) return false
    const symbols = Object.getOwnPropertySymbols(component)
    return symbols.includes($relationData)
}
