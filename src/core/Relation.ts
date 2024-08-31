import { getEntityComponents, World } from '.'
import { defineHiddenProperty } from './utils/defineHiddenProperty'

export type OnTargetRemovedCallback = (subject: number, target: number | string) => void
export type RelationTarget = number | '*' | typeof Wildcard

export const $relation = Symbol('relation')
export const $pairTarget = Symbol('pairTarget')
export const $isPairComponent = Symbol('isPairComponent')

export const $relationData = Symbol('relationData')

type RelationData<T> = {
    pairsMap: Map<number | string | Relation<any>, T>
    initStore: () => T
    exclusiveRelation: boolean
    autoRemoveSubject: boolean
    onTargetRemoved: OnTargetRemovedCallback
}

export type Relation<T> = (target: RelationTarget) => T

// Base relation creation
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
            const component = {} as T
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

// Modifiers
export const withStore = <T>(createStore: () => T) => (relation: Relation<T>): Relation<T> => {
    const ctx = relation[$relationData] as RelationData<T>
    ctx.initStore = createStore

    return ((target: RelationTarget): T => {
        if (target === undefined) throw Error('Relation target is undefined')
        const normalizedTarget = target === '*' ? Wildcard : target

        if (!ctx.pairsMap.has(normalizedTarget)) {
            const component = createStore()
            defineHiddenProperty(component, $relationData, {
                pairTarget: normalizedTarget,
                ...ctx
            })
            ctx.pairsMap.set(normalizedTarget, component)
        }

        return ctx.pairsMap.get(normalizedTarget)!
    }) as Relation<T>
}

export const makeExclusive = <T>(relation: Relation<T>): Relation<T> => {
    const ctx = relation[$relationData] as RelationData<T>
    ctx.exclusiveRelation = true
    return relation
}

export const withAutoRemoveSubject = <T>(relation: Relation<T>): Relation<T> => {
    const ctx = relation[$relationData] as RelationData<T>
    ctx.autoRemoveSubject = true
    return relation
}

export const withOnTargetRemoved = <T>(onRemove: OnTargetRemovedCallback) => (relation: Relation<T>): Relation<T> => {
    const ctx = relation[$relationData] as RelationData<T>
    ctx.onTargetRemoved = onRemove
    return relation
}

// TODO: withSetter
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

// Utility functions
export const Pair = <T>(relation: Relation<T>, target: RelationTarget): T => {
    if (relation === undefined) throw Error('Relation is undefined')
    return relation(target)
}

export const Wildcard: Relation<any> = createRelation()
export const IsA: Relation<any> = createRelation()

// TODO: cache until dirty
export const getRelationTargets = (world: World, relation: Relation<any>, eid: number) => {
	const components = getEntityComponents(world, eid)
	const targets = []
	for (const c of components) {
		if (c[$relation] === relation && c[$pairTarget] !== Wildcard) {
			targets.push(c[$pairTarget])
		}
	}
	return targets
}

export function createRelation<T>(...modifiers: Array<(relation: Relation<T>) => Relation<T>>): Relation<T>
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
