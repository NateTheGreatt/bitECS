import { createSparseSet, createUint32SparseSet, type SparseSet } from './utils/SparseSet'
import { hasComponent, registerComponent } from './Component'
import { ComponentRef, ComponentData } from './Component'
import { World } from "./World"
import { InternalWorld } from './World'
import { $internal } from './World'
import { createObservable } from './utils/Observer'
import { EntityId, Prefab } from './Entity'

/**
 * @typedef {Uint32Array | readonly number[]} QueryResult
 * @description The result of a query, either as a Uint32Array or a readonly array of numbers.
 */
export type QueryResult = Uint32Array | readonly EntityId[]

/**
 * @typedef {Object} Query
 * @description Represents a query in the ECS.
 * @property {ComponentRef[]} allComponents - All components in the query.
 * @property {ComponentRef[]} orComponents - Components in an OR relationship.
 * @property {ComponentRef[]} notComponents - Components that should not be present.
 * @property {Object.<number, number>} masks - Bitmasks for each component generation.
 * @property {Object.<number, number>} orMasks - OR bitmasks for each component generation.
 * @property {Object.<number, number>} notMasks - NOT bitmasks for each component generation.
 * @property {Object.<number, number>} hasMasks - HAS bitmasks for each component generation.
 * @property {number[]} generations - Component generations.
 * @property {SparseSet} toRemove - Set of entities to be removed.
 * @property {ReturnType<typeof createObservable>} addObservable - Observable for entity additions.
 * @property {ReturnType<typeof createObservable>} removeObservable - Observable for entity removals.
 */
export type Query = SparseSet & {
	allComponents: ComponentRef[]
	orComponents: ComponentRef[]
	notComponents: ComponentRef[]
	masks: Record<number, number>
	orMasks: Record<number, number>
	notMasks: Record<number, number>
	hasMasks: Record<number, number>
	generations: number[]
	toRemove: SparseSet
	addObservable: ReturnType<typeof createObservable>
	removeObservable: ReturnType<typeof createObservable>
	queues: Record<any, any>
}

/**
 * @typedef {'Or' | 'And' | 'Not'} QueryOperatorType
 * @description Types of query operators.
 */
export type QueryOperatorType = 'Or' | 'And' | 'Not'
/**
 * Symbol for query operator type.
 * @type {Symbol}
 */
export const $opType = Symbol.for('bitecs-opType')

/**
 * Symbol for query operator terms.
 * @type {Symbol}
 */
export const $opTerms = Symbol.for('bitecs-opTerms')

/**
 * @typedef {Object} OpReturnType
 * @property {symbol} [$opType] - The type of the operator.
 * @property {symbol} [$opTerms] - The components involved in the operation.
 */
export type OpReturnType = {
	[$opType]: string
	[$opTerms]: ComponentRef[]
}

/**
 * @typedef {Function} QueryOperator
 * @description A function that creates a query operator.
 * @param {...ComponentRef} components - The components to apply the operator to.
 * @returns {OpReturnType} The result of the operator.
 */
export type QueryOperator = (...components: ComponentRef[]) => OpReturnType

/**
 * @typedef {ComponentRef | QueryOperator} QueryTerm
 * @description A term in a query, either a component reference or a query operator.
 */
export type QueryTerm = ComponentRef | QueryOperator


// Aliases
export type OrOp = QueryOperator
export type AndOp = QueryOperator
export type NotOp = QueryOperator
export type AnyOp = OrOp
export type AllOp = AndOp
export type NoneOp = NotOp

/**
 * @function Or
 * @description Creates an 'Or' query operator.
 * @param {...ComponentRef} components - The components to apply the 'Or' operator to.
 * @returns {OpReturnType} The 'Or' operator configuration.
 */
export const Or: OrOp = (...components: ComponentRef[]) => ({
	[$opType]: 'Or',
	[$opTerms]: components
})

/**
 * @function And
 * @description Creates an 'And' query operator.
 * @param {...ComponentRef} components - The components to apply the 'And' operator to.
 * @returns {OpReturnType} The 'And' operator configuration.
 */
export const And: AndOp = (...components: ComponentRef[]) => ({
	[$opType]: 'And',
	[$opTerms]: components
})

/**
 * @function Not
 * @description Creates a 'Not' query operator.
 * @param {...ComponentRef} components - The components to apply the 'Not' operator to.
 * @returns {OpReturnType} The 'Not' operator configuration.
 */
export const Not: NotOp = (...components: ComponentRef[]) => ({
	[$opType]: 'Not',
	[$opTerms]: components
})

export const Any: AnyOp = Or
export const All: AllOp = And
export const None: NoneOp = Not

/**
 * @typedef {Function} ObservableHook
 * @description A function that creates an observable hook for queries.
 * @param {...QueryTerm} terms - The query terms to observe.
 * @returns {{type: 'add' | 'remove' | 'set', terms: QueryTerm[]}} The observable hook configuration.
 */
export type ObservableHookDef = (...terms: QueryTerm[]) => {
	[$opType]: 'add' | 'remove' | 'set' | 'get'
	[$opTerms]: QueryTerm[]
}

export type ObservableHook = ReturnType<ObservableHookDef>

/**
 * @function onAdd
 * @description Creates an 'add' observable hook.
 * @param {...QueryTerm} terms - The query terms to observe for addition.
 * @returns {OpReturnType} The 'add' observable hook configuration.
 */
export const onAdd: ObservableHookDef = (...terms: QueryTerm[]) => ({
	[$opType]: 'add',
	[$opTerms]: terms
})

/**
 * @function onRemove
 * @description Creates a 'remove' observable hook.
 * @param {...QueryTerm} terms - The query terms to observe for removal.
 * @returns {OpReturnType} The 'remove' observable hook configuration.
 */
export const onRemove: ObservableHookDef = (...terms: QueryTerm[]) => ({
	[$opType]: 'remove',
	[$opTerms]: terms
})

/**
 * @function onSet
 * @description Creates a 'set' observable hook.
 * @param {...QueryTerm} terms - The query terms to observe for setting.
 * @returns {OpReturnType} The 'set' observable hook configuration.
 */
export const onSet: ObservableHookDef = (component: ComponentRef) => ({
	[$opType]: 'set',
	[$opTerms]: [component]
})

/**
 * @function onGet
 * @description Creates a 'get' observable hook.
 * @param {...QueryTerm} terms - The query terms to observe for getting.
 * @returns {OpReturnType} The 'get' observable hook configuration.
 */
export const onGet: ObservableHookDef = (component: ComponentRef) => ({
	[$opType]: 'get',
	[$opTerms]: [component]
})

/**
 * @function observe
 * @description Observes changes in entities based on specified components.
 * @param {World} world - The world object.
 * @param {ObservableHook} hook - The observable hook.
 * @param {function(number): any} callback - The callback function to execute when changes occur.
 * @returns {function(): void} A function to unsubscribe from the observation.
 */
export function observe(world: World, hook: ObservableHook, callback: (eid: EntityId, ...args: any[]) => any): () => void {
	const ctx = (world as InternalWorld)[$internal]
	const { [$opType]: type, [$opTerms]: components } = hook

	if (type === 'add' || type === 'remove') {
		const hash = queryHash(world, components)
		let queryData = ctx.queriesHashMap.get(hash)!

		if (!queryData) {
			queryData = registerQuery(world, components)
		}

		const observableKey = type === 'add' ? 'addObservable' : 'removeObservable'
		return queryData[observableKey].subscribe(callback)
	} else if (type === 'set' || type === 'get') {
		if (components.length !== 1) {
			throw new Error('Set and Get hooks can only observe a single component')
		}
		const component = components[0]
		let componentData = ctx.componentMap.get(component)
		if (!componentData) {
			componentData = registerComponent(world, component)
		}
		const observableKey = type === 'set' ? 'setObservable' : 'getObservable'
		return componentData[observableKey].subscribe(callback)
	}

	throw new Error(`Invalid hook type: ${type}`)
}

/**
 * @function queryHash
 * @description Generates a hash for a query based on its terms.
 * @param {World} world - The world object.
 * @param {QueryTerm[]} terms - The query terms.
 * @returns {string} The generated hash.
 */
export const queryHash = (world: World, terms: QueryTerm[]): string => {
	const ctx = (world as InternalWorld)[$internal]

	const getComponentId = (component: ComponentRef): number => {
		if (!ctx.componentMap.has(component)) {
			registerComponent(world, component)
		}
		return ctx.componentMap.get(component)!.id
	}
	const termToString = (term: QueryTerm): string => {
		if ($opType in term) {
			const componentIds = term[$opTerms].map(getComponentId)
			const sortedComponentIds = componentIds.sort((a, b) => a - b)
			const sortedType = term[$opType].toLowerCase()
			return `${sortedType}(${sortedComponentIds.join(',')})`
		} else {
			return getComponentId(term).toString()
		}
	}

	return terms
		.map(termToString)
		.sort()
		.join('-')
}

/**
 * @function registerQuery
 * @description Registers a new query in the world.
 * @param {World} world - The world object.
 * @param {QueryTerm[]} terms - The query terms.
 * @param {Object} [options] - Additional options.
 * @param {boolean} [options.buffered] - Whether the query should be buffered.
 * @returns {Query} The registered query.
 */
export const registerQuery = (world: World, terms: QueryTerm[], options: { buffered?: boolean } = {}): Query => {
	const ctx = (world as InternalWorld)[$internal]
	const hash = queryHash(world, terms)
	// if (ctx.queriesHashMap.has(hash)) {
	// 	return ctx.queriesHashMap.get(hash)!
	// }
	const components: ComponentRef[] = []
	const notComponents: ComponentRef[] = []
	const orComponents: ComponentRef[] = []

	const processComponents = (comps: ComponentRef[], targetArray: ComponentRef[]) => {
		comps.forEach((comp: ComponentRef) => {
			if (!ctx.componentMap.has(comp)) registerComponent(world, comp)
			targetArray.push(comp)
		})
	}

	terms.forEach((term: QueryTerm) => {
		if ($opType in term) {
			if (term[$opType] === 'Not') {
				processComponents(term[$opTerms], notComponents)
			} else if (term[$opType] === 'Or') {
				processComponents(term[$opTerms], orComponents)
			}
		} else {
			if (!ctx.componentMap.has(term)) registerComponent(world, term)
			components.push(term)
		}
	})

	const mapComponents = (c: ComponentRef) => ctx.componentMap.get(c)!
	const allComponents = components.concat(notComponents.flat()).concat(orComponents.flat()).map(mapComponents)

	const sparseSet = options.buffered ? createUint32SparseSet() : createSparseSet()

	const toRemove = createSparseSet()

	const generations = allComponents
		.map((c) => c.generationId)
		.reduce((a, v) => {
			if (a.includes(v)) return a
			a.push(v)
			return a
		}, [] as number[])

	const reduceBitflags = (a: { [key: number]: number }, c: ComponentData) => {
		if (!a[c.generationId]) a[c.generationId] = 0
		a[c.generationId] |= c.bitflag
		return a
	}

	const masks = components.map(mapComponents).reduce(reduceBitflags, {})
	const notMasks = notComponents.map(mapComponents).reduce(reduceBitflags, {})
	const orMasks = orComponents.map(mapComponents).reduce(reduceBitflags, {})
	const hasMasks = allComponents.reduce(reduceBitflags, {})

	const addObservable = createObservable()
	const removeObservable = createObservable()

	const query = Object.assign(sparseSet, {
		components,
		notComponents,
		orComponents,
		allComponents,
		masks,
		notMasks,
		orMasks,
		hasMasks,
		generations,
		toRemove,
		addObservable,
		removeObservable,
		queues: {},
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
		if (hasComponent(world, eid, Prefab)) continue
		const match = queryCheckEntity(world, query, eid)
		if (match) {
			queryAddEntity(query, eid)
		}
	}

	return query
}

/**
 * @function innerQuery
 * @description Performs an internal query operation.
 * @param {World} world - The world object.
 * @param {QueryTerm[]} terms - The query terms.
 * @param {Object} [options] - Additional options.
 * @param {boolean} [options.buffered] - Whether the query should be buffered.
 * @returns {QueryResult} The result of the query.
 */
export function innerQuery(world: World, terms: QueryTerm[], options: { buffered?: boolean } = {}): QueryResult {
	const ctx = (world as InternalWorld)[$internal]
	const hash = queryHash(world, terms)
	let queryData = ctx.queriesHashMap.get(hash)
	if (!queryData) {
		queryData = registerQuery(world, terms, options)
	} else if (options.buffered && !('buffer' in queryData.dense)) {
		queryData = registerQuery(world, terms, { buffered: true })
	}
	return queryData.dense
}

/**
 * @function query
 * @description Performs a query operation.
 * @param {World} world - The world object.
 * @param {QueryTerm[]} terms - The query terms.
 * @returns {readonly EntityId[]} The result of the query as a readonly array of entity IDs.
 */
export function query(world: World, terms: QueryTerm[]): readonly EntityId[] {
	commitRemovals(world)
	return innerQuery(world, terms) as EntityId[]
}

/**
 * @function bufferQuery
 * @description Performs a buffered query operation.
 * @param {World} world - The world object.
 * @param {QueryTerm[]} terms - The query terms.
 * @returns {Uint32Array} The result of the query as a Uint32Array.
 */
export function bufferQuery(world: World, terms: QueryTerm[]): Uint32Array {
	commitRemovals(world)
	return innerQuery(world, terms, { buffered: true }) as Uint32Array
}

/**
 * @function queryCheckEntity
 * @description Checks if an entity matches a query.
 * @param {World} world - The world object.
 * @param {Query} query - The query to check against.
 * @param {number} eid - The entity ID to check.
 * @returns {boolean} True if the entity matches the query, false otherwise.
 */
export function queryCheckEntity(world: World, query: Query, eid: EntityId): boolean {
	const ctx = (world as InternalWorld)[$internal]
	const { masks, notMasks, orMasks, generations } = query

	for (let i = 0; i < generations.length; i++) {
		const generationId = generations[i]
		const qMask = masks[generationId]
		const qNotMask = notMasks[generationId]
		const qOrMask = orMasks[generationId]
		const eMask = ctx.entityMasks[generationId][eid]

		if (qNotMask && (eMask & qNotMask) !== 0) {
			return false
		}

		if (qMask && (eMask & qMask) !== qMask) {
			return false
		}

		if (qOrMask && (eMask & qOrMask) === 0) {
			return false
		}
	}

	return true
}

/**
 * @function queryCheckComponent
 * @description Checks if a component matches a query.
 * @param {Query} query - The query to check against.
 * @param {ComponentData} c - The component data to check.
 * @returns {boolean} True if the component matches the query, false otherwise.
 */
export const queryCheckComponent = (query: Query, c: ComponentData) => {
	const { generationId, bitflag } = c
	const { hasMasks } = query
	const mask = hasMasks[generationId]
	return (mask & bitflag) === bitflag
}

/**
 * @function queryAddEntity
 * @description Adds an entity to a query.
 * @param {Query} query - The query to add the entity to.
 * @param {number} eid - The entity ID to add.
 */
export const queryAddEntity = (query: Query, eid: EntityId) => {
	query.toRemove.remove(eid)

	query.addObservable.notify(eid)

	query.add(eid)
}

/**
 * @function queryCommitRemovals
 * @description Commits removals for a query.
 * @param {Query} query - The query to commit removals for.
 */
const queryCommitRemovals = (query: Query) => {
	for (let i = 0; i < query.toRemove.dense.length; i++) {
		const eid = query.toRemove.dense[i]

		query.remove(eid)
	}
	query.toRemove.reset()
}

/**
 * @function commitRemovals
 * @description Commits all pending removals for queries in the world.
 * @param {World} world - The world object.
 */
export const commitRemovals = (world: World) => {
	const ctx = (world as InternalWorld)[$internal]
	if (!ctx.dirtyQueries.size) return
	ctx.dirtyQueries.forEach(queryCommitRemovals)
	ctx.dirtyQueries.clear()
}

/**
 * @function queryRemoveEntity
 * @description Removes an entity from a query.
 * @param {World} world - The world object.
 * @param {Query} query - The query to remove the entity from.
 * @param {number} eid - The entity ID to remove.
 */
export const queryRemoveEntity = (world: World, query: Query, eid: EntityId) => {
	const ctx = (world as InternalWorld)[$internal]
	const has = query.has(eid)
	if (!has || query.toRemove.has(eid)) return
	query.toRemove.add(eid)
	ctx.dirtyQueries.add(query)
	query.removeObservable.notify(eid)
}

/**
 * @function removeQuery
 * @description Removes a query from the world.
 * @param {World} world - The world object.
 * @param {QueryTerm[]} terms - The query terms of the query to remove.
 */
export const removeQuery = (world: World, terms: QueryTerm[]) => {
	const ctx = (world as InternalWorld)[$internal]
	const hash = queryHash(world, terms)
	const query = ctx.queriesHashMap.get(hash)
	if (query) {
		ctx.queries.delete(query)
		ctx.queriesHashMap.delete(hash)
	}
}
