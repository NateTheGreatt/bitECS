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
export type World<T extends object = {}> = T;
type WorldModifier<T> = (world: World) => World & T;
export declare const withEntityIndex: (entityIndex: EntityIndex) => WorldModifier<{}>;
export declare const withContext: <T extends object>(context: T) => WorldModifier<T>;
export declare const createWorld: <T extends object = {}>(...args: (WorldModifier<any> | {
    entityIndex?: EntityIndex;
    context?: T;
})[]) => T;
export declare const resetWorld: (world: World) => {};
export declare const getWorldComponents: (world: World) => string[];
export declare const getAllEntities: (world: World) => number[];
export {};
//# sourceMappingURL=World.d.ts.map