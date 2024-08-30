import { createSparseSet, type SparseSet } from './utils/SparseSet'
import { hasComponent, registerComponent } from './Component'
import { ComponentRef, ComponentData } from './Component'
import { World } from "./World"
import { InternalWorld } from './World'
import { $internal } from './World'
import { createObservable } from './utils/Observer'
import { Prefab } from './Entity'

export type QueryResult = Uint32Array | readonly number[]

export type Query = SparseSet & {
	notComponents: ComponentRef[]
	allComponents: ComponentRef[]
	masks: { [key: number]: number }
	notMasks: { [key: number]: number }
	hasMasks: { [key: number]: number }
	generations: number[]
	toRemove: SparseSet
	addObservable: ReturnType<typeof createObservable>
	removeObservable: ReturnType<typeof createObservable>
}

export type QueryOperatorType = 'Or' | 'And' | 'Not'

export type OpReturnType = {
    type: QueryOperatorType
    components: ComponentRef[]
}

export type QueryOperator = (...components: ComponentRef[]) => OpReturnType

export type QueryTerm = ComponentRef | QueryOperator

// Aliases
export type OrOp = QueryOperator
export type AndOp = QueryOperator
export type NotOp = QueryOperator
export type AnyOp = OrOp
export type AllOp = AndOp
export type NoneOp = NotOp

export type ObservableHook = (...components: ComponentRef[]) => {
	type: 'add' | 'remove' | 'set'
	components: ComponentRef[]
}

export const onAdd: ObservableHook = (...components: ComponentRef[]) => ({ type: 'add', components })
export const onRemove: ObservableHook = (...components: ComponentRef[]) => ({ type: 'remove', components })
export const onSet: ObservableHook = (...components: ComponentRef[]) => ({ type: 'set', components })

export const set = <T>(world: World, eid: number, component: ComponentRef, params: T): void => {
	const ctx = (world as InternalWorld)[$internal]
	let componentData = ctx.componentMap.get(component)

	if (!componentData) {
		registerComponent(world, component)
		componentData = ctx.componentMap.get(component)
	}

	if (!hasComponent(world, eid, component)) {
		throw new Error(`Entity ${eid} does not have component ${component.name}`)
	}

	componentData.setObservable.notify(eid, params)

	return component
}


export const observe = (world: World, hook: ReturnType<typeof onAdd | typeof onRemove>, callback: (eid: number) => void): () => void => {
	const ctx = (world as InternalWorld)[$internal]
	const { type, components } = hook
	const hash = queryHash(world, components)
	let queryData = ctx.queriesHashMap.get(hash)!

	if (!queryData) {
		queryData = registerQuery(world, components)
	}

	const observableKey = type === 'add' ? 'addObservable' : type === 'remove' ? 'removeObservable' : 'setObservable'

	const unsubscribe = queryData[observableKey].subscribe(callback)

	return unsubscribe
}

export const Or: OrOp = (...components: ComponentRef[]) => ({
	type: 'Or',
	components
})

export const And: AndOp = (...components: ComponentRef[]) => ({
	type: 'And',
	components
})

export const Not: NotOp = (...components: ComponentRef[]) => ({
	type: 'Not',
	components
})

export const Any: AnyOp = Or
export const All: AllOp = And
export const None: NoneOp = Not

export const queryHash = (world: World, terms: QueryTerm[]): string => {
    const ctx = (world as InternalWorld)[$internal]

    const getComponentId = (component: ComponentRef): number => {
        if (!ctx.componentMap.has(component)) {
            registerComponent(world, component)
        }
        return ctx.componentMap.get(component)!.id
    }

    const termToString = (term: QueryTerm): string => {
        if ('type' in term) {
            const componentIds = term.components.map(getComponentId).sort((a, b) => a - b)
            return `${term.type}(${componentIds.join(',')})`
        } else {
            return getComponentId(term).toString()
        }
    }

    return terms
        .map(termToString)
        .sort()
        .join('-')
}

export const registerQuery = (world: World, terms: QueryTerm[]): Query => {
	const ctx = (world as InternalWorld)[$internal]
	const hash = queryHash(world, terms)
	if (ctx.queriesHashMap.has(hash)) {
		return ctx.queriesHashMap.get(hash)!
	}

	const components: ComponentRef[] = []
	const notComponents: ComponentRef[] = []
	terms.forEach((c: QueryTerm) => {
		if (c.type === 'Not') {
			c.components.forEach((comp: ComponentRef) => {
				if (!ctx.componentMap.has(comp)) registerComponent(world, comp)
				notComponents.push(comp)
			})
		} else {
			if (!ctx.componentMap.has(c)) registerComponent(world, c)
			components.push(c)
		}
	})

	const mapComponents = (c: ComponentRef) => ctx.componentMap.get(c)!
	const allComponents = components.concat(notComponents).map(mapComponents)

	const sparseSet = createSparseSet()

	const toRemove = createSparseSet()

	const generations = allComponents
		.map((c) => c.generationId)
		.reduce((a, v) => {
			if (a.includes(v)) return a
			a.push(v)
			return a
		}, [] as number[])

	const reduceBitflags = (a: { [key:number]: number }, c: ComponentData) => {
		if (!a[c.generationId]) a[c.generationId] = 0
		a[c.generationId] |= c.bitflag
		return a
	}

	const masks = components.map(mapComponents).reduce(reduceBitflags, {})
	const notMasks = notComponents.map(mapComponents).reduce(reduceBitflags, {})
	const hasMasks = allComponents.reduce(reduceBitflags, {})

	const addObservable = createObservable()
	const removeObservable = createObservable()

	const query = Object.assign(sparseSet, {
		components,
		notComponents,
		allComponents,
		masks,
		notMasks,
		hasMasks,
		generations,
		toRemove,
		addObservable,
		removeObservable,
	}) as Query

	ctx.queries.add(query)

	ctx.queriesHashMap.set(hash, query)

	allComponents.forEach((c) => {
		c.queries.add(query)
	})

	if (notComponents.length) ctx.notQueries.add(query)

	const entityIndex = ctx.entityIndex
	for (let i = 0; i < entityIndex.aliveCount; i++) {
		const eid = entityIndex.dense[i]
		if (hasComponent(world, Prefab, eid)) continue
		const match = queryCheckEntity(world, query, eid)
		if (match) {
			queryAddEntity(query, eid)
		}
	}

	return query
}

export function innerQuery(world: World, terms: QueryTerm[]): QueryResult {
	const ctx = (world as InternalWorld)[$internal]
	const hash = queryHash(world, terms)
	let queryData = ctx.queriesHashMap.get(hash)
	if (!queryData) {
		queryData = registerQuery(world, terms)
	}
	return queryData.dense
}

export function query(world: World, terms: QueryTerm[]): QueryResult {
	commitRemovals(world)
	return innerQuery(world, terms)
}

export const queryCheckEntity = (world: World, query: Query, eid: number) => {
	const ctx = (world as InternalWorld)[$internal]
	const { masks, notMasks, generations } = query

	for (let i = 0; i < generations.length; i++) {
		const generationId = generations[i]
		const qMask = masks[generationId]
		const qNotMask = notMasks[generationId]
		const eMask = ctx.entityMasks[generationId][eid]

		if (qNotMask && (eMask & qNotMask) !== 0) {
			return false
		}

		if (qMask && (eMask & qMask) !== qMask) {
			return false
		}
	}

	return true
}

export const queryCheckComponent = (query: Query, c: ComponentData) => {
	const { generationId, bitflag } = c
	const { hasMasks } = query
	const mask = hasMasks[generationId]
	return (mask & bitflag) === bitflag
}

export const queryAddEntity = (query: Query, eid: number) => {
	query.toRemove.remove(eid)

	query.addObservable.notify(eid)

	query.add(eid)
}

const queryCommitRemovals = (query: Query) => {
	for (let i = 0; i < query.toRemove.dense.length; i++) {
		const eid = query.toRemove.dense[i]

		query.remove(eid)
	}
	query.toRemove.reset()
}

export const commitRemovals = (world: World) => {
	const ctx = (world as InternalWorld)[$internal]
	if (!ctx.dirtyQueries.size) return
	ctx.dirtyQueries.forEach(queryCommitRemovals)
	ctx.dirtyQueries.clear()
}

export const queryRemoveEntity = (world: World, query: Query, eid: number) => {
	const ctx = (world as InternalWorld)[$internal]
	const has = query.has(eid)
	if (!has || query.toRemove.has(eid)) return
	query.toRemove.add(eid)
	ctx.dirtyQueries.add(query)
	query.removeObservable.notify(eid)
}

export const removeQuery = (world: World, terms: QueryTerm[]) => {
	const ctx = (world as InternalWorld)[$internal]
	const hash = queryHash(world, terms)
	const query = ctx.queriesHashMap.get(hash)
	if (query) {
		ctx.queries.delete(query)
		ctx.queriesHashMap.delete(hash)
	}
}
