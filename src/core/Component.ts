import { entityExists, getEntityComponents, Prefab } from './Entity'
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
import { $internal, InternalWorld, World } from './World'

export type ComponentRef = any

export interface ComponentData {
	id: number
	generationId: number
	bitflag: number
	ref: ComponentRef
	queries: Set<Query>
	setObservable: Observable
}

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
		setObservable: createObservable()
	}

	ctx.componentMap.set(component, data)

	ctx.bitflag *= 2
	if (ctx.bitflag >= 2 ** 31) {
		ctx.bitflag = 1
		ctx.entityMasks.push([])
	}

	return data
}

export const registerComponents = (world: World, components: ComponentRef[]) => {
	components.forEach((component) => registerComponent(world, component))
}

export const hasComponent = (world: World, component: ComponentRef, eid: number): boolean => {
	const ctx = (world as InternalWorld)[$internal]
	const registeredComponent = ctx.componentMap.get(component)
	if (!registeredComponent) return false

	const { generationId, bitflag } = registeredComponent
	const mask = ctx.entityMasks[generationId][eid]

	return (mask & bitflag) === bitflag
}

const recursivelyInherit = (world: World, baseEid: number, inheritedEid: number) => {
	addComponent(world, IsA(inheritedEid), baseEid)
	const components = getEntityComponents(world, inheritedEid)
	for (const component of components) {
		if (component === Prefab) {
			continue
		}
		addComponent(world, component, baseEid)
		// TODO: onSet observable
		const keys = Object.keys(component)
		for (const key of keys) {
			component[key][baseEid] = component[key][inheritedEid]
		}
	}

	const inheritedTargets = getRelationTargets(world, IsA, inheritedEid)
	for (const inheritedEid2 of inheritedTargets) {
		recursivelyInherit(world, baseEid, inheritedEid2)
	}
}

export const addComponent = (world: World, component: ComponentRef, eid: number) => {
	const ctx = (world as InternalWorld)[$internal]
	if (!entityExists(world, eid)) {
		throw new Error('bitECS - entity does not exist in the world.')
	}

	if (!ctx.componentMap.has(component)) registerComponent(world, component)

	if (hasComponent(world, component, eid)) return

	const componentNode = ctx.componentMap.get(component)!
	const { generationId, bitflag, queries } = componentNode

	ctx.entityMasks[generationId][eid] |= bitflag

	if (!hasComponent(world, Prefab, eid)) {
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
		addComponent(world, Pair(relation, Wildcard), eid)
		const target = component[$pairTarget]
		addComponent(world, Pair(Wildcard, target), eid)

		const relationData = relation[$relationData]
		if (relationData.exclusiveRelation === true && target !== Wildcard) {
			const oldTarget = getRelationTargets(world, relation, eid)[0]
			if (oldTarget !== undefined && oldTarget !== null && oldTarget !== target) {
				removeComponent(world, relation(oldTarget), eid)
			}
		}

		if (relation === IsA) {
			const inheritedTargets = getRelationTargets(world, IsA, eid)
			for (const inherited of inheritedTargets) {
				recursivelyInherit(world, eid, inherited)
			}
		}
	}
}

export const addComponents = (world: World, components: ComponentRef[], eid: number) => {
	components.forEach((component) => addComponent(world, component, eid))
}

export const removeComponent = (world: World, component: ComponentRef, eid: number) => {
	const ctx = (world as InternalWorld)[$internal]
	if (!entityExists(world, eid)) {
		throw new Error('bitECS - entity does not exist in the world.')
	}

	if (!hasComponent(world, component, eid)) return

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
		removeComponent(world, Pair(Wildcard, target), eid)

		const relation = component[$relation]
		const otherTargets = getRelationTargets(world, relation, eid)
		if (otherTargets.length === 0) {
			removeComponent(world, Pair(relation, Wildcard), eid)
		}
	}
}

export const removeComponents = (
	world: World,
	components: ComponentRef[],
	eid: number,
) => {
	components.forEach((component) => removeComponent(world, component, eid))
}
