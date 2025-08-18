import { createSparseSet, createUint32SparseSet, type SparseSet } from './utils/SparseSet'
import { hasComponent, registerComponent } from './Component'
import { ComponentRef, ComponentData } from './Component'
import { World } from "./World"
import { InternalWorld } from './World'
import { $internal } from './World'
import { createObservable } from './utils/Observer'
import { EntityId, Prefab } from './Entity'
import { queryHierarchy, queryHierarchyDepth } from './Hierarchy'

/**
 * @typedef {Uint32Array | readonly number[]} QueryResult
 * @description The result of a query, either as a Uint32Array or a readonly array of numbers.
 */
export type QueryResult = Uint32Array | readonly EntityId[]

/**
 * @typedef {Object} QueryOptions
 * @description Options for configuring query behavior.
 * @property {boolean} [commit=true] - Whether to commit pending entity removals before querying.
 * @property {boolean} [buffered=false] - Whether to return results as Uint32Array instead of number[].
 */
export interface QueryOptions {
	commit?: boolean
	buffered?: boolean
}

/**
 * @typedef {Object} Query
 * @description Represents a query in the ECS using original blazing-fast bitmask evaluation.
 * @property {ComponentRef[]} allComponents - All components referenced in the query.
 * @property {ComponentRef[]} orComponents - Components in an OR relationship.
 * @property {ComponentRef[]} notComponents - Components that should not be present.
 * @property {Record<number, number>} masks - Bitmasks for each component generation.
 * @property {Record<number, number>} orMasks - OR bitmasks for each component generation.
 * @property {Record<number, number>} notMasks - NOT bitmasks for each component generation.
 * @property {Record<number, number>} hasMasks - HAS bitmasks for each component generation.
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
 * @typedef {ComponentRef | QueryOperator | HierarchyTerm} QueryTerm
 * @description A term in a query, either a component reference, query operator, or hierarchy term.
 */
export type QueryTerm = ComponentRef | QueryOperator | HierarchyTerm


const createOp = (type: string) => (...components: ComponentRef[]) => ({ [$opType]: type, [$opTerms]: components })

export const Or: QueryOperator = createOp('Or')
export const And: QueryOperator = createOp('And')
export const Not: QueryOperator = createOp('Not')
export const Any = Or
export const All = And
export const None = Not

// NEW: Hierarchy combinator symbols
export const $hierarchyType = Symbol.for('bitecs-hierarchyType')
export const $hierarchyRel = Symbol.for('bitecs-hierarchyRel')
export const $hierarchyDepth = Symbol.for('bitecs-hierarchyDepth')

/**
 * @typedef {Object} HierarchyTerm
 * @description Represents a hierarchy query term for topological ordering.
 * @property {symbol} [$hierarchyType] - Always 'Hierarchy'.
 * @property {ComponentRef} [$hierarchyRel] - The relation component for hierarchy.
 * @property {number} [$hierarchyDepth] - Optional depth limit.
 */
export type HierarchyTerm = {
	[$hierarchyType]: 'Hierarchy'
	[$hierarchyRel]: ComponentRef
	[$hierarchyDepth]?: number
}

/**
 * @function Hierarchy
 * @description Creates a hierarchy query term for topological ordering (parents before children).
 * @param {ComponentRef} relation - The relation component (e.g., ChildOf).
 * @param {number} [depth] - Optional depth limit.
 * @returns {HierarchyTerm} The hierarchy term.
 */
export const Hierarchy = (relation: ComponentRef, depth?: number): HierarchyTerm => ({
	[$hierarchyType]: 'Hierarchy',
	[$hierarchyRel]: relation,
	[$hierarchyDepth]: depth
})

/**
 * @function Cascade
 * @description Alias for Hierarchy - creates a hierarchy query term for topological ordering.
 * @param {ComponentRef} relation - The relation component (e.g., ChildOf).
 * @param {number} [depth] - Optional depth limit.
 * @returns {HierarchyTerm} The hierarchy term.
 */
export const Cascade = Hierarchy

// Query modifier symbols
export const $modifierType = Symbol.for('bitecs-modifierType')

/**
 * @typedef {Object} QueryModifier
 * @description Represents a query modifier that can be mixed into query terms.
 * @property {symbol} [$modifierType] - The type of modifier ('buffer' | 'nested').
 */
export type QueryModifier = {
	[$modifierType]: 'buffer' | 'nested'
}

export const asBuffer: QueryModifier = { [$modifierType]: 'buffer' }
export const isNested: QueryModifier = { [$modifierType]: 'nested' }
export const noCommit = isNested

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

const createHook = (type: 'add' | 'remove' | 'set' | 'get') => (...terms: QueryTerm[]) => ({ [$opType]: type, [$opTerms]: terms })
export const onAdd: ObservableHookDef = createHook('add')
export const onRemove: ObservableHookDef = createHook('remove')
export const onSet: ObservableHookDef = (component: ComponentRef) => ({ [$opType]: 'set', [$opTerms]: [component] })
export const onGet: ObservableHookDef = (component: ComponentRef) => ({ [$opType]: 'get', [$opTerms]: [component] })

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
		const queryData = ctx.queriesHashMap.get(queryHash(world, components)) || registerQuery(world, components)
		return queryData[type === 'add' ? 'addObservable' : 'removeObservable'].subscribe(callback)
	}
	
	if (type === 'set' || type === 'get') {
		if (components.length !== 1) throw new Error('Set and Get hooks can only observe a single component')
		const componentData = ctx.componentMap.get(components[0]) || registerComponent(world, components[0])
		return componentData[type === 'set' ? 'setObservable' : 'getObservable'].subscribe(callback)
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
		if (!ctx.componentMap.has(component)) registerComponent(world, component)
		return ctx.componentMap.get(component)!.id
	}
	const termToString = (term: QueryTerm): string => 
		$opType in term ? `${term[$opType].toLowerCase()}(${term[$opTerms].map(termToString).sort().join(',')})` : getComponentId(term).toString()
	
	return terms.map(termToString).sort().join('-')
}

/**
 * @function registerQuery  
 * @description Registers a new query in the world using unified clause-mask compilation.
 * @param {World} world - The world object.
 * @param {QueryTerm[]} terms - The query terms.
 * @param {Object} [options] - Additional options.
 * @param {boolean} [options.buffered] - Whether the query should be buffered.
 * @returns {Query} The registered query.
 */
export const registerQuery = (world: World, terms: QueryTerm[], options: { buffered?: boolean } = {}): Query => {
	const ctx = (world as InternalWorld)[$internal]
	const hash = queryHash(world, terms)

	const queryComponents: ComponentRef[] = []
	const collect = (term: QueryTerm) => {
		if ($opType in term) term[$opTerms].forEach(collect)
		else {
			if (!ctx.componentMap.has(term)) registerComponent(world, term)
			queryComponents.push(term)
		}
	}
	terms.forEach(collect)
	
	// Use original simple approach for blazing-fast simple queries
	// TODO: Add nested combinator support later if needed
	const components: ComponentRef[] = []
	const notComponents: ComponentRef[] = []
	const orComponents: ComponentRef[] = []

	const addToArray = (arr: ComponentRef[], comps: ComponentRef[]) => {
		comps.forEach(comp => {
			if (!ctx.componentMap.has(comp)) registerComponent(world, comp)
			arr.push(comp)
		})
	}
	
	terms.forEach(term => {
		if ($opType in term) {
			const { [$opType]: type, [$opTerms]: comps } = term
			if (type === 'Not') addToArray(notComponents, comps)
			else if (type === 'Or') addToArray(orComponents, comps)
			else if (type === 'And') addToArray(components, comps)
			else throw new Error(`Nested combinator ${type} not supported yet - use simple queries for best performance`)
		} else {
			if (!ctx.componentMap.has(term)) registerComponent(world, term)
			components.push(term)
		}
	})

	const allComponentsData = queryComponents.map(c => ctx.componentMap.get(c)!)
	const generations = [...new Set(allComponentsData.map(c => c.generationId))]
	const reduceBitflags = (a: Record<number, number>, c: ComponentData) => (a[c.generationId] = (a[c.generationId] || 0) | c.bitflag, a)
	
	const masks = components.map(c => ctx.componentMap.get(c)!).reduce(reduceBitflags, {})
	const notMasks = notComponents.map(c => ctx.componentMap.get(c)!).reduce(reduceBitflags, {})
	const orMasks = orComponents.map(c => ctx.componentMap.get(c)!).reduce(reduceBitflags, {})
	const hasMasks = allComponentsData.reduce(reduceBitflags, {})

	const query = Object.assign(options.buffered ? createUint32SparseSet() : createSparseSet(), {
		allComponents: queryComponents, orComponents, notComponents, masks, notMasks, orMasks, hasMasks, generations,
		toRemove: createSparseSet(), addObservable: createObservable(), removeObservable: createObservable(), queues: {}
	}) as Query

	ctx.queries.add(query)

	ctx.queriesHashMap.set(hash, query)

	allComponentsData.forEach((c) => {
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
 * @function queryInternal
 * @description Internal implementation for nested queries.
 * @param {World} world - The world object.
 * @param {QueryTerm[]} terms - The query terms.
 * @param {Object} [options] - Additional options.
 * @param {boolean} [options.buffered] - Whether the query should be buffered.
 * @returns {QueryResult} The result of the query.
 */
export function queryInternal(world: World, terms: QueryTerm[], options: { buffered?: boolean } = {}): QueryResult {
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
 * @description Performs a unified query operation with configurable options.
 * @param {World} world - The world object.
 * @param {QueryTerm[]} terms - The query terms.
 * @param {...QueryModifier} modifiers - Query modifiers (asBuffer, isNested, etc.).
 * @returns {QueryResult} The result of the query.
 */
export function query(world: World, terms: QueryTerm[], ...modifiers: (QueryModifier | QueryOptions)[]): QueryResult {
	const hierarchyTerm = terms.find(term => term && typeof term === 'object' && $hierarchyType in term) as HierarchyTerm | undefined
	const regularTerms = terms.filter(term => !(term && typeof term === 'object' && $hierarchyType in term))
	
	let buffered = false, commit = true
	const hasModifiers = modifiers.some(m => m && typeof m === 'object' && $modifierType in m)
	
	for (const modifier of modifiers) {
		if (hasModifiers && modifier && typeof modifier === 'object' && $modifierType in modifier) {
			const mod = modifier as QueryModifier
			if (mod[$modifierType] === 'buffer') buffered = true
			if (mod[$modifierType] === 'nested') commit = false
		} else if (!hasModifiers) {
			const opts = modifier as QueryOptions
			if (opts.buffered !== undefined) buffered = opts.buffered
			if (opts.commit !== undefined) commit = opts.commit
		}
	}

	if (hierarchyTerm) {
		const { [$hierarchyRel]: relation, [$hierarchyDepth]: depth } = hierarchyTerm
		return depth !== undefined ? queryHierarchyDepth(world, relation, depth, { buffered }) : queryHierarchy(world, relation, regularTerms, { buffered })
	}

	if (commit) commitRemovals(world)
	return queryInternal(world, regularTerms, { buffered })
}



/**
 * @function queryCheckEntity
 * @description Original blazing-fast query evaluation using simple bitmasks.
 * @param {World} world - The world object.
 * @param {Query} query - The query to check against.
 * @param {number} eid - The entity ID to check.
 * @returns {boolean} True if the entity matches the query, false otherwise.
 */
export function queryCheckEntity(world: World, query: Query, eid: EntityId): boolean {
	const ctx = (world as InternalWorld)[$internal]
	const { masks, notMasks, orMasks, generations } = query

	let hasOrMatch = Object.keys(orMasks).length === 0

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

		if (qOrMask && (eMask & qOrMask) !== 0) {
			hasOrMatch = true
		}
	}

	return hasOrMatch
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
