import { entityExists, EntityId, getEntityComponents, Prefab } from './Entity'
import { queryAddEntity, queryCheckEntity, queryRemoveEntity } from './Query'
import { Query } from './Query'
import {
	IsA,
	Pair,
	Wildcard,
	getRelationTargets,
	$relationData,
	$isPairComponent,
	$pairTarget,
	$relation
} from './Relation'
import { createObservable, Observable } from './utils/Observer'
import { $internal, InternalWorld, World, WorldContext } from './World'

/**
 * Represents a reference to a component.
 * @typedef {any} ComponentRef
 */
export type ComponentRef = any

/**
 * Represents the data associated with a component.
 * @interface ComponentData
 * @property {number} id - The unique identifier for the component.
 * @property {number} generationId - The generation ID of the component.
 * @property {number} bitflag - The bitflag used for component masking.
 * @property {ComponentRef} ref - Reference to the component.
 * @property {Set<Query>} queries - Set of queries associated with the component.
 * @property {Observable} setObservable - Observable for component changes.
 */
export interface ComponentData {
	id: number
	generationId: number
	bitflag: number
	ref: ComponentRef
	queries: Set<Query>
	setObservable: Observable
	getObservable: Observable
}

/**
 * Registers a component with the world.
 * @param {World} world - The world object.
 * @param {ComponentRef} component - The component to register.
 * @returns {ComponentData} The registered component data.
 * @throws {Error} If the component is null or undefined.
 */
export const registerComponent = (world: World, component: ComponentRef) => {
	if (!component) {
		throw new Error(`bitECS - Cannot register null or undefined component`)
	}

	const ctx = (world as InternalWorld)[$internal]
	const queries = new Set<Query>()

	const data: ComponentData = {
		id: ctx.componentCount++,
		generationId: ctx.entityMasks.length - 1,
		bitflag: ctx.bitflag,
		ref: component,
		queries,
		setObservable: createObservable(),
		getObservable: createObservable(),
	}

	ctx.componentMap.set(component, data)

	ctx.bitflag *= 2
	if (ctx.bitflag >= 2 ** 31) {
		ctx.bitflag = 1
		ctx.entityMasks.push([])
	}

	return data
}

/**
 * Registers multiple components with the world.
 * @param {World} world - The world object.
 * @param {ComponentRef[]} components - Array of components to register.
 */
export const registerComponents = (world: World, components: ComponentRef[]) => {
	components.forEach((component) => registerComponent(world, component))
}

/**
 * Checks if an entity has a specific component.
 * @param {World} world - The world object.
 * @param {number} eid - The entity ID.
 * @param {ComponentRef} component - The component to check for.
 * @returns {boolean} True if the entity has the component, false otherwise.
 */
export const hasComponent = (world: World, eid: EntityId, component: ComponentRef): boolean => {
	const ctx = (world as InternalWorld)[$internal]
	const registeredComponent = ctx.componentMap.get(component)
	if (!registeredComponent) return false

	const { generationId, bitflag } = registeredComponent
	const mask = ctx.entityMasks[generationId][eid]

	return (mask & bitflag) === bitflag
}
/**
 * Retrieves the data associated with a component for a specific entity.
 * @param {World} world - The world object.
 * @param {EntityId} eid - The entity ID.
 * @param {ComponentRef} component - The component to retrieve data for.
 * @returns {any} The component data, or undefined if the component is not found or the entity doesn't have the component.
 */
export const getComponentData = (world: World, eid: EntityId, component: ComponentRef): any => {
	const ctx = (world as InternalWorld)[$internal]
	const componentData = ctx.componentMap.get(component)

	if (!componentData) {
		return undefined
	}

	if (!hasComponent(world, eid, component)) {
		return undefined
	}

	// Notify observers that this component is being accessed
	return componentData.getObservable.notify(eid)
}

/**
 * Helper function to set component data.
 * @param {ComponentRef} component - The component to set.
 * @param {any} data - The data to set for the component.
 * @returns {{ component: ComponentRef, data: any }} An object containing the component and its data.
 */
export const set = <T extends ComponentRef>(component: T, data: any): { component: T, data: any } => ({
	component,
	data
})

/**
 * Recursvely inherits components from one entity to another.
 * @param {World} world - The world object.
 * @param {number} baseEid - The ID of the entity inheriting components.
 * @param {number} inheritedEid - The ID of the entity being inherited from.
 * @param {boolean} isFirstSuper - Whether this is the first super in the inheritance chain.
 */
const recursivelyInherit = (ctx: WorldContext, world: World, baseEid: EntityId, inheritedEid: EntityId, visited = new Set<EntityId>()): void => {
	// Guard against circular inheritance
	if (visited.has(inheritedEid)) return
	visited.add(inheritedEid)
	
	// Add IsA relation first
	addComponent(world, baseEid, IsA(inheritedEid))
	
	// Copy components and their data from this level
	// This needs to happen before recursing to ancestors so closer ancestors take precedence
	for (const component of getEntityComponents(world, inheritedEid)) {
		// TODO: inherit reference vs copy
		if (component === Prefab) continue
		
		// Only add component if entity doesn't already have it
		// This ensures closer ancestors take precedence
		if (!hasComponent(world, baseEid, component)) {
			addComponent(world, baseEid, component)
			
			const componentData = ctx.componentMap.get(component)
			if (componentData?.setObservable) {
				const data = getComponentData(world, inheritedEid, component)
				componentData.setObservable.notify(baseEid, data)
			}
		}
	}
	
	// Then recursively inherit from ancestors
	// This ensures more distant ancestors don't override closer ones
	for (const parentEid of getRelationTargets(world, inheritedEid, IsA)) {
		recursivelyInherit(ctx, world, baseEid, parentEid, visited)
	}
}

/**
 * Represents a component with data to be set on an entity.
 */
type ComponentSetter<T = any> = { component: ComponentRef; data: T }

/**
 * Adds one or more components to an entity.
 * @param {World} world - The world object.
 * @param {EntityId} eid - The entity ID.
 * @param {...(ComponentRef | ComponentSetter)} components - Components to add or set.
 * @throws {Error} If the entity does not exist in the world.
 */
export const addComponent = (world: World, eid: EntityId, ...components: (ComponentRef | ComponentSetter)[]): void => {
	if (!entityExists(world, eid)) {
		throw new Error(`Cannot add component - entity ${eid} does not exist in the world.`)
	}
	
	const ctx = (world as InternalWorld)[$internal]
	
	components.forEach(componentOrSet => {
		const component = 'component' in componentOrSet ? componentOrSet.component : componentOrSet
		const data = 'data' in componentOrSet ? componentOrSet.data : undefined

		if (!ctx.componentMap.has(component)) registerComponent(world, component)

		const componentData = ctx.componentMap.get(component)!
		if (data !== undefined) {
			componentData.setObservable.notify(eid, data)
		}

		if (hasComponent(world, eid, component)) return

		const { generationId, bitflag, queries } = componentData

		ctx.entityMasks[generationId][eid] |= bitflag

		if (!hasComponent(world, eid, Prefab)) {
			queries.forEach((queryData: Query) => {
				queryData.toRemove.remove(eid)
				const match = queryCheckEntity(world, queryData, eid)

				if (match) queryAddEntity(queryData, eid)
				else queryRemoveEntity(world, queryData, eid)
			})
		}
		ctx.entityComponents.get(eid)!.add(component)
		if (component[$isPairComponent]) {
			const relation = component[$relation]
			const target = component[$pairTarget]

			// Add both Wildcard pairs for relation and target
			addComponent(world, eid, Pair(relation, Wildcard))
			addComponent(world, eid, Pair(Wildcard, target))

			// For non-Wildcard targets, add Wildcard pair to track relation targets
			if (typeof target === 'number') {
				// Add Wildcard pair for target being a relation target
				addComponent(world, target, Pair(Wildcard, relation))
				
				// add target to a set to make autoRemoveSubject checks faster
				ctx.entitiesWithRelations.add(target)
			}

			// add target to a set to make autoRemoveSubject checks faster
			ctx.entitiesWithRelations.add(target)

			const relationData = relation[$relationData]
			if (relationData.exclusiveRelation === true && target !== Wildcard) {
				const oldTarget = getRelationTargets(world, eid, relation)[0]
				if (oldTarget !== undefined && oldTarget !== null && oldTarget !== target) {
					removeComponent(world, eid, relation(oldTarget))
				}
			}

			if (relation === IsA) {
				const inheritedTargets = getRelationTargets(world, eid, IsA)
				for (const inherited of inheritedTargets) {
					recursivelyInherit(ctx, world, eid, inherited)
				}
			}
		}
	})
}

/**
 * Alias for addComponent.
 */
export const addComponents = addComponent

/**
 * Removes one or more components from an entity.
 * @param {World} world - The world object.
 * @param {number} eid - The entity ID.
 * @param {...ComponentRef} components - Components to remove.
 * @throws {Error} If the entity does not exist in the world.
 */
export const removeComponent = (world: World, eid: EntityId, ...components: ComponentRef[]) => {
	const ctx = (world as InternalWorld)[$internal]
	if (!entityExists(world, eid)) {
		throw new Error(`Cannot remove component - entity ${eid} does not exist in the world.`)
	}

	components.forEach(component => {
		if (!hasComponent(world, eid, component)) return

		const componentNode = ctx.componentMap.get(component)!
		const { generationId, bitflag, queries } = componentNode

		ctx.entityMasks[generationId][eid] &= ~bitflag

		queries.forEach((queryData: Query) => {
			queryData.toRemove.remove(eid)

			const match = queryCheckEntity(world, queryData, eid)

			if (match) queryAddEntity(queryData, eid)
			else queryRemoveEntity(world, queryData, eid)
		})

		ctx.entityComponents.get(eid)!.delete(component)

		if (component[$isPairComponent]) {
			const target = component[$pairTarget]
			removeComponent(world, eid, Pair(Wildcard, target))

			const relation = component[$relation]
			const otherTargets = getRelationTargets(world, eid, relation)
			if (otherTargets.length === 0) {
				removeComponent(world, eid, Pair(relation, Wildcard))
			}
		}
	})
}

/**
 * Alias for removeComponent.
 */
export const removeComponents = removeComponent
