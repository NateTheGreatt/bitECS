import { World } from './World';
import { EntityId } from './Entity';
import { ComponentRef } from './Component';
import { type QueryResult } from './Query';
import { type SparseSet } from './utils/SparseSet';
export declare function ensureDepthTracking(world: World, relation: ComponentRef): void;
export declare function calculateEntityDepth(world: World, relation: ComponentRef, entity: EntityId, visited?: Set<number>): number;
export declare function markChildrenDirty(world: World, relation: ComponentRef, parent: EntityId, dirty: SparseSet, visited?: SparseSet): void;
export declare function updateHierarchyDepth(world: World, relation: ComponentRef, entity: EntityId, parent?: EntityId, updating?: Set<number>): void;
export declare function invalidateHierarchyDepth(world: World, relation: ComponentRef, entity: EntityId): void;
export declare function flushDirtyDepths(world: World, relation: ComponentRef): void;
export declare function queryHierarchy(world: World, relation: ComponentRef, components: ComponentRef[], options?: {
    buffered?: boolean;
}): QueryResult;
export declare function queryHierarchyDepth(world: World, relation: ComponentRef, depth: number, options?: {
    buffered?: boolean;
}): QueryResult;
export declare function getHierarchyDepth(world: World, entity: EntityId, relation: ComponentRef): number;
export declare function getMaxHierarchyDepth(world: World, relation: ComponentRef): number;
//# sourceMappingURL=Hierarchy.d.ts.map