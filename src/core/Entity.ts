import { addComponent, removeComponent } from './Component'
import {
	innerQuery,
	queryAddEntity,
	queryCheckEntity,
	queryRemoveEntity,
} from './Query'
import { Pair, Wildcard, $isPairComponent, $relation, $pairTarget, $relationData } from './Relation'
import { World } from "./World"
import { InternalWorld } from './World'
import { addEntityId, isEntityIdAlive, removeEntityId } from './EntityIndex'
import { $internal } from './World'
import { ComponentRef } from './Component'

export const Prefab = {}
export const addPrefab = (world: World) => {
	const eid = addEntity(world)

	addComponent(world, Prefab, eid)

	return eid
}

/**
 * Adds a new entity to the specified world.
 *
 * @param {World} world
 * @returns {number} eid
 */
export const addEntity = (world: World): number => {
	const ctx = (world as InternalWorld)[$internal]
	const eid = addEntityId(ctx.entityIndex)

	ctx.notQueries.forEach((q) => {
		const match = queryCheckEntity(world, q, eid)
		if (match) queryAddEntity(q, eid)
	})

	ctx.entityComponents.set(eid, new Set())

	return eid
}

/**
 * Removes an existing entity from the specified world.
 *
 * @param {World} world
 * @param {number} eid
 */

export const removeEntity = (world: World, eid: number) => {
	const ctx = (world as InternalWorld)[$internal]
	// Check if entity is already removed
	if (!isEntityIdAlive(ctx.entityIndex, eid)) return

	// Remove relation components from entities that have a relation to this one, breadth-first
	// e.g. addComponent(world, Pair(ChildOf, parent), child)
	// when parent is removed, we need to remove the child
	const removalQueue = [eid]
	const processedEntities = new Set()
    while (removalQueue.length > 0) {
        
		const currentEid = removalQueue.shift()!
        if (processedEntities.has(currentEid)) continue
        processedEntities.add(currentEid)

        const componentRemovalQueue = []

        for (const subject of innerQuery(world, [Wildcard(currentEid)])) {
            if (!entityExists(world, subject)) {
                continue
            }

            for (const component of ctx.entityComponents.get(subject)!) {
                if (!component[$isPairComponent]) {
                    continue
                }

                const relation = component[$relation]
                const relationData = relation[$relationData]
                componentRemovalQueue.push(() => removeComponent(world, Pair(Wildcard, currentEid), subject))

                if (component[$pairTarget] === currentEid) {
                    componentRemovalQueue.push(() => removeComponent(world, component, subject))
                    if (relationData.autoRemoveSubject) {
                        removalQueue.push(subject)
                    }
                    if (relationData.onTargetRemoved) {
                        componentRemovalQueue.push(() => relationData.onTargetRemoved(world, subject, currentEid))
                    }
                }
            }
        }

        for (const removeOperation of componentRemovalQueue) {
            removeOperation()
        }

		for (const eid of removalQueue) {
			removeEntity(world, eid)
		}

		// Remove entity from all queries
		for (const query of ctx.queries) {
			queryRemoveEntity(world, query, currentEid)
		}

		// Free the entity ID
		removeEntityId(ctx.entityIndex, currentEid)

		// Remove all entity state from world
		ctx.entityComponents.delete(currentEid)

		// Clear entity bitmasks
		for (let i = 0; i < ctx.entityMasks.length; i++) {
			ctx.entityMasks[i][currentEid] = 0
		}
	}
}

/**
 *  Returns an array of components that an entity possesses.
 *
 * @param {*} world
 * @param {*} eid
 */
export const getEntityComponents = (world: World, eid: number): ComponentRef[] => {
	const ctx = (world as InternalWorld)[$internal]
	if (eid === undefined) throw new Error('bitECS - entity is undefined.')
	if (!isEntityIdAlive(ctx.entityIndex, eid))
		throw new Error('bitECS - entity does not exist in the world.')
	return Array.from(ctx.entityComponents.get(eid)!)
}

/**
 * Checks the existence of an entity in a world
 *
 * @param {World} world
 * @param {number} eid
 */
export const entityExists = (world: World, eid: number) => isEntityIdAlive((world as InternalWorld)[$internal].entityIndex, eid)