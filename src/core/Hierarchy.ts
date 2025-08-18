import { World, InternalWorld, $internal } from './World'
import { EntityId } from './Entity'
import { ComponentRef } from './Component'
import { getRelationTargets, Wildcard, Pair } from './Relation'
import { query, queryHash, queryInternal, type QueryResult } from './Query'
import { createSparseSet, createUint32SparseSet, type SparseSet } from './utils/SparseSet'

// Constants
const MAX_HIERARCHY_DEPTH = 64 // Prevent stack overflow in deep hierarchies
const INVALID_DEPTH = 0xFFFFFFFF // 32-bit max value indicates uncomputed depth
const DEFAULT_BUFFER_GROWTH = 1024 // Growth increment for depth arrays

type HierarchyData = {
    depths: Uint32Array
    dirty: SparseSet
    depthToEntities: Map<number, SparseSet>
    maxDepth: number
}

/**
 * Grows the depths array to accommodate a specific entity
 */
function growDepthsArray(hierarchyData: HierarchyData, entity: EntityId): Uint32Array {
    const { depths } = hierarchyData
    if (entity < depths.length) return depths
    
    const newSize = Math.max(entity + 1, depths.length * 2, depths.length + DEFAULT_BUFFER_GROWTH)
    const newDepths = new Uint32Array(newSize)
    newDepths.fill(INVALID_DEPTH)
    newDepths.set(depths)
    hierarchyData.depths = newDepths
    return newDepths
}

/**
 * Updates the depthToEntities cache when an entity's depth changes
 */
function updateDepthCache(hierarchyData: HierarchyData, entity: EntityId, newDepth: number, oldDepth?: number): void {
    const { depthToEntities } = hierarchyData
    
    // Remove from old depth cache if exists
    if (oldDepth !== undefined && oldDepth !== INVALID_DEPTH) {
        const oldSet = depthToEntities.get(oldDepth)
        if (oldSet) {
            oldSet.remove(entity)
            if (oldSet.dense.length === 0) depthToEntities.delete(oldDepth)
        }
    }
    
    // Add to new depth cache (skip INVALID_DEPTH)
    if (newDepth !== INVALID_DEPTH) {
        if (!depthToEntities.has(newDepth)) depthToEntities.set(newDepth, createUint32SparseSet())
        depthToEntities.get(newDepth)!.add(entity)
    }
}

/**
 * Updates max depth if the new depth is greater
 */
function updateMaxDepth(hierarchyData: HierarchyData, depth: number): void {
    if (depth > hierarchyData.maxDepth) {
        hierarchyData.maxDepth = depth
    }
}

/**
 * Sets entity depth and updates all related caches
 */
function setEntityDepth(hierarchyData: HierarchyData, entity: EntityId, newDepth: number, oldDepth?: number): void {
    hierarchyData.depths[entity] = newDepth
    updateDepthCache(hierarchyData, entity, newDepth, oldDepth)
    updateMaxDepth(hierarchyData, newDepth)
}

/**
 * Invalidates hierarchy query cache for a relation
 */
function invalidateQueryCache(world: World, relation: ComponentRef): void {
    const ctx = (world as InternalWorld)[$internal]
    ctx.hierarchyQueryCache.delete(relation)
}

/**
 * Gets hierarchy data for a relation, activating tracking if needed
 */
function getHierarchyData(world: World, relation: ComponentRef): HierarchyData {
    const ctx = (world as InternalWorld)[$internal]
    
    if (!ctx.hierarchyActiveRelations.has(relation)) {
        ctx.hierarchyActiveRelations.add(relation)
        
        // Initialize tracking for this relation
        ensureDepthTracking(world, relation)
        
        // Populate depths for all existing entities and their targets
        populateExistingDepths(world, relation)
    }
    
    return ctx.hierarchyData.get(relation)!
}

/**
 * Populates depth calculations for all existing entities with this relation
 */
function populateExistingDepths(world: World, relation: ComponentRef): void {
    const entitiesWithRelation = query(world, [Pair(relation, Wildcard)])
    
    // Calculate depths for entities with this relation
    for (const entity of entitiesWithRelation) {
        getEntityDepth(world, relation, entity)
    }
    
    // Calculate depths for all relation targets (avoid extra allocation)
    const processedTargets = new Set<EntityId>()
    for (const entity of entitiesWithRelation) {
        for (const target of getRelationTargets(world, entity, relation)) {
            if (!processedTargets.has(target)) {
                processedTargets.add(target)
                getEntityDepth(world, relation, target)
            }
        }
    }
}

/**
 * Ensures depth tracking is initialized for a relation
 */
export function ensureDepthTracking(world: World, relation: ComponentRef): void {
    const ctx = (world as InternalWorld)[$internal]
    
    if (!ctx.hierarchyData.has(relation)) {
        const initialSize = Math.max(DEFAULT_BUFFER_GROWTH, ctx.entityIndex.dense.length * 2)
        const depthArray = new Uint32Array(initialSize)
        depthArray.fill(INVALID_DEPTH)
        
        ctx.hierarchyData.set(relation, {
            depths: depthArray,
            dirty: createSparseSet(),
            depthToEntities: new Map(),
            maxDepth: 0
        })
    }
}

/**
 * Calculates the hierarchy depth of an entity for a given relation
 */
export function calculateEntityDepth(world: World, relation: ComponentRef, entity: EntityId, visited = new Set<EntityId>()): number {
    if (visited.has(entity)) return 0
    visited.add(entity)
    
    const targets = getRelationTargets(world, entity, relation)
    if (targets.length === 0) return 0
    if (targets.length === 1) return getEntityDepthWithVisited(world, relation, targets[0], visited) + 1
    
    let minDepth = Infinity
    for (const target of targets) {
        const depth = getEntityDepthWithVisited(world, relation, target, visited)
        if (depth < minDepth) {
            minDepth = depth
            if (minDepth === 0) break
        }
    }
    return minDepth === Infinity ? 0 : minDepth + 1
}

/**
 * Internal helper to get entity depth with cycle detection
 */
function getEntityDepthWithVisited(world: World, relation: ComponentRef, entity: EntityId, visited: Set<EntityId>): number {
    const ctx = (world as InternalWorld)[$internal]
    ensureDepthTracking(world, relation)
    
    const hierarchyData = ctx.hierarchyData.get(relation)!
    let { depths } = hierarchyData
    
    depths = growDepthsArray(hierarchyData, entity)
    
    if (depths[entity] === INVALID_DEPTH) {
        const depth = calculateEntityDepth(world, relation, entity, visited)
        setEntityDepth(hierarchyData, entity, depth)
        return depth
    }
    
    return depths[entity]
}

/**
 * Gets the cached depth of an entity, calculating if needed
 */
function getEntityDepth(world: World, relation: ComponentRef, entity: EntityId): number {
    return getEntityDepthWithVisited(world, relation, entity, new Set())
}

/**
 * Marks an entity and its children as needing depth recalculation
 */
export function markChildrenDirty(world: World, relation: ComponentRef, parent: EntityId, dirty: SparseSet, visited = createSparseSet()): void {
    if (visited.has(parent)) return
    visited.add(parent)
    
    const children = query(world, [relation(parent)])
    for (const child of children) {
        dirty.add(child)
        markChildrenDirty(world, relation, child, dirty, visited)
    }
}

/**
 * Updates hierarchy depth when a relation is added
 */
export function updateHierarchyDepth(
    world: World, 
    relation: ComponentRef, 
    entity: EntityId, 
    parent?: EntityId,
    updating = new Set<EntityId>()
): void {
    const ctx = (world as InternalWorld)[$internal]
    
    // Skip if hierarchy tracking is not active for this relation
    if (!ctx.hierarchyActiveRelations.has(relation)) {
        return
    }
    ensureDepthTracking(world, relation)
    
    const hierarchyData = ctx.hierarchyData.get(relation)!
    
    // Prevent recursive updates - entity already being updated in this call stack
    if (updating.has(entity)) {
        // Just mark as dirty for later processing
        hierarchyData.dirty.add(entity)
        return
    }
    
    updating.add(entity)
    
    const { depths, dirty } = hierarchyData
    
    // Calculate new depth
    const newDepth = parent !== undefined ? 
        getEntityDepth(world, relation, parent) + 1 : 0
    
    // Prevent excessive depth (cycle detection)
    if (newDepth > MAX_HIERARCHY_DEPTH) {
        return
    }
    
    const oldDepth = depths[entity]
    setEntityDepth(hierarchyData, entity, newDepth, oldDepth === INVALID_DEPTH ? undefined : oldDepth)
    
    // If depth changed, mark children as dirty for recalculation
    if (oldDepth !== newDepth) {
        markChildrenDirty(world, relation, entity, dirty, createSparseSet())
        invalidateQueryCache(world, relation)
    }
}

/**
 * Invalidates hierarchy depth when a relation is removed
 */
export function invalidateHierarchyDepth(world: World, relation: ComponentRef, entity: EntityId): void {
    const ctx = (world as InternalWorld)[$internal]
    
    // Skip if hierarchy tracking is not active for this relation
    if (!ctx.hierarchyActiveRelations.has(relation)) {
        return
    }
    
    const hierarchyData = ctx.hierarchyData.get(relation)!
    let { depths } = hierarchyData
    
    // Expand array if needed
    depths = growDepthsArray(hierarchyData, entity)
    
    invalidateSubtree(world, relation, entity, depths, createSparseSet())
    invalidateQueryCache(world, relation)
}

/**
 * Recursively invalidates an entire subtree
 */
function invalidateSubtree(world: World, relation: ComponentRef, entity: EntityId, depths: Uint32Array, visited: SparseSet): void {
    if (visited.has(entity)) return
    visited.add(entity)
    
    const ctx = (world as InternalWorld)[$internal]
    const hierarchyData = ctx.hierarchyData.get(relation)!
    
    // Invalidate this entity and update cache
    if (entity < depths.length) {
        const oldDepth = depths[entity]
        if (oldDepth !== INVALID_DEPTH) {
            hierarchyData.depths[entity] = INVALID_DEPTH
            updateDepthCache(hierarchyData, entity, INVALID_DEPTH, oldDepth)
        }
    }
    
    // Find and invalidate all children
    const children = query(world, [relation(entity)])
    for (const child of children) {
        invalidateSubtree(world, relation, child, depths, visited)
    }
}

/**
 * Processes all dirty depth calculations for a relation
 */
export function flushDirtyDepths(world: World, relation: ComponentRef): void {
    const ctx = (world as InternalWorld)[$internal]
    const hierarchyData = ctx.hierarchyData.get(relation)
    
    if (!hierarchyData) return
    
    const { dirty, depths } = hierarchyData
    
    if (dirty.dense.length === 0) return
    
    // Simple approach: just calculate all dirty depths
    for (const entity of dirty.dense) {
        if (depths[entity] === INVALID_DEPTH) {
            const newDepth = calculateEntityDepth(world, relation, entity)
            setEntityDepth(hierarchyData, entity, newDepth)
        }
    }
    
    dirty.reset()
}

/**
 * Query entities in hierarchical order (depth-based ordering)
 * Returns entities grouped by depth: all depth 0, then depth 1, then depth 2, etc.
 * This ensures parents always come before their children.
 */
export function queryHierarchy(world: World, relation: ComponentRef, components: ComponentRef[], options: { buffered?: boolean } = {}): QueryResult {
    const ctx = (world as InternalWorld)[$internal]
    
    // Ensure hierarchy is active
    getHierarchyData(world, relation)
    
    // Check cache for this query
    const queryKey = queryHash(world, [relation, ...components])
    const cached = ctx.hierarchyQueryCache.get(relation)
    
    if (cached && cached.hash === queryKey) {
        return cached.result
    }
    
    // Update any dirty depths before sorting
    flushDirtyDepths(world, relation)
    
    // Ensure query is cached using existing infrastructure, then get Query object
    queryInternal(world, components, options)
    const queryObj = ctx.queriesHashMap.get(queryHash(world, components))!
    
    const hierarchyData = ctx.hierarchyData.get(relation)!
    const { depths } = hierarchyData
    
    // Sort the query's sparse set in place - no allocation needed!
    queryObj.sort((a, b) => {
        const depthA = depths[a]
        const depthB = depths[b]
        return depthA !== depthB ? depthA - depthB : a - b
    })
    
    // Cache this result (dense is already the correct type)
    const result = queryObj.dense
    ctx.hierarchyQueryCache.set(relation, { hash: queryKey, result: result as readonly EntityId[] })
    
    return result
}

/**
 * Get all entities at a specific depth level
 */
export function queryHierarchyDepth(world: World, relation: ComponentRef, depth: number, options: { buffered?: boolean } = {}): QueryResult {
    // Ensure hierarchy is active and get data
    const hierarchyData = getHierarchyData(world, relation)
    flushDirtyDepths(world, relation)
    
    const entitiesAtDepth = hierarchyData.depthToEntities.get(depth)
    
    if (entitiesAtDepth) {
        return entitiesAtDepth.dense
    }
    
    return options.buffered ? new Uint32Array(0) : []
}

/**
 * Get depth of specific entity
 */
export function getHierarchyDepth(world: World, entity: EntityId, relation: ComponentRef): number {
    getHierarchyData(world, relation)
    return getEntityDepthWithVisited(world, relation, entity, new Set())
}

/**
 * Get maximum depth in hierarchy
 */
export function getMaxHierarchyDepth(world: World, relation: ComponentRef): number {
    const hierarchyData = getHierarchyData(world, relation)
    return hierarchyData.maxDepth
}