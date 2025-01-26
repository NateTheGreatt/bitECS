import { EntityIndex } from './EntityIndex';
import { ComponentRef, ComponentData } from './Component';
import { Query } from './Query';
import { EntityId } from './Entity';
export declare const $internal: unique symbol;
export type WorldContext = {
    entityIndex: EntityIndex;
    entityMasks: number[][];
    entityComponents: Map<EntityId, Set<ComponentRef>>;
    bitflag: number;
    componentMap: Map<ComponentRef, ComponentData>;
    componentCount: number;
    queries: Set<Query>;
    queriesHashMap: Map<string, Query>;
    notQueries: Set<any>;
    dirtyQueries: Set<any>;
    entitiesWithRelations: Set<EntityId>;
};
export type InternalWorld = {
    [$internal]: WorldContext;
};
export type World<T extends object = {}> = {
    [K in keyof T]: T[K];
};
export declare function createWorld<T extends object = {}>(...args: Array<EntityIndex | T>): World<T>;
export declare const resetWorld: (world: World) => World<{}>;
export declare const deleteWorld: (world: World) => void;
export declare const getWorldComponents: (world: World) => string[];
export declare const getAllEntities: (world: World) => readonly EntityId[];
//# sourceMappingURL=World.d.ts.map