import { EntityIndex } from './EntityIndex';
import { ComponentRef, ComponentData } from './Component';
import { Query } from './Query';
export declare const $internal: unique symbol;
export type WorldContext = {
    entityIndex: EntityIndex;
    entityMasks: number[][];
    entityComponents: Map<number, Set<ComponentRef>>;
    bitflag: number;
    componentMap: WeakMap<ComponentRef, ComponentData>;
    componentCount: number;
    queries: Set<Query>;
    queriesHashMap: Map<string, Query>;
    notQueries: Set<any>;
    dirtyQueries: Set<any>;
};
export type InternalWorld = {
    [$internal]: WorldContext;
};
export type World<T extends object = {}> = {
    [K in keyof T]: T[K];
};
export declare const withEntityIndex: (entityIndex: EntityIndex) => <T extends object>(world: World<T>) => World<T>;
export declare const withContext: <T extends object>(context: T) => (world: World<T>) => World<T>;
export declare function createWorld<T extends object>(...modifiers: Array<(world: World<T>) => World<T>>): World<T>;
export declare function createWorld<T extends object>(options: {
    context?: T;
    entityIndex?: EntityIndex;
}): World<T>;
export declare const resetWorld: (world: World) => World<{}>;
export declare const deleteWorld: (world: World) => void;
export declare const getWorldComponents: (world: World) => string[];
export declare const getAllEntities: (world: World) => number[];
//# sourceMappingURL=World.d.ts.map