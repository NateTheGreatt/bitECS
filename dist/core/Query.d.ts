import { type SparseSet } from './utils/SparseSet';
import { ComponentRef, ComponentData } from './Component';
import { World } from "./World";
import { createObservable } from './utils/Observer';
import { EntityId } from './Entity';
export type QueryResult = Readonly<Uint32Array> | readonly EntityId[];
export interface QueryOptions {
    commit?: boolean;
    buffered?: boolean;
}
export type Query = SparseSet & {
    allComponents: ComponentRef[];
    orComponents: ComponentRef[];
    notComponents: ComponentRef[];
    masks: Record<number, number>;
    orMasks: Record<number, number>;
    notMasks: Record<number, number>;
    hasMasks: Record<number, number>;
    generations: number[];
    toRemove: SparseSet;
    addObservable: ReturnType<typeof createObservable>;
    removeObservable: ReturnType<typeof createObservable>;
    queues: Record<any, any>;
};
export type QueryOperatorType = 'Or' | 'And' | 'Not';
export declare const $opType: unique symbol;
export declare const $opTerms: unique symbol;
export type OpReturnType = {
    [$opType]: string;
    [$opTerms]: ComponentRef[];
};
export type QueryOperator = (...components: ComponentRef[]) => OpReturnType;
export type QueryTerm = ComponentRef | QueryOperator | HierarchyTerm;
export declare const Or: QueryOperator;
export declare const And: QueryOperator;
export declare const Not: QueryOperator;
export declare const Any: QueryOperator;
export declare const All: QueryOperator;
export declare const None: QueryOperator;
export declare const $hierarchyType: unique symbol;
export declare const $hierarchyRel: unique symbol;
export declare const $hierarchyDepth: unique symbol;
export type HierarchyTerm = {
    [$hierarchyType]: 'Hierarchy';
    [$hierarchyRel]: ComponentRef;
    [$hierarchyDepth]?: number;
};
export declare const Hierarchy: (relation: ComponentRef, depth?: number) => HierarchyTerm;
export declare const Cascade: (relation: ComponentRef, depth?: number) => HierarchyTerm;
export declare const $modifierType: unique symbol;
export type QueryModifier = {
    [$modifierType]: 'buffer' | 'nested';
};
export declare const asBuffer: QueryModifier;
export declare const isNested: QueryModifier;
export declare const noCommit: QueryModifier;
export type ObservableHookDef = (...terms: QueryTerm[]) => {
    [$opType]: 'add' | 'remove' | 'set' | 'get';
    [$opTerms]: QueryTerm[];
};
export type ObservableHook = ReturnType<ObservableHookDef>;
export declare const onAdd: ObservableHookDef;
export declare const onRemove: ObservableHookDef;
export declare const onSet: ObservableHookDef;
export declare const onGet: ObservableHookDef;
export declare function observe(world: World, hook: ObservableHook, callback: (eid: EntityId, ...args: any[]) => any): () => void;
export declare const queryHash: (world: World, terms: QueryTerm[]) => string;
export declare const registerQuery: (world: World, terms: QueryTerm[], options?: {
    buffered?: boolean;
}) => Query;
export declare function queryInternal(world: World, terms: QueryTerm[], options?: {
    buffered?: boolean;
}): QueryResult;
export declare function query(world: World, terms: QueryTerm[], ...modifiers: (QueryModifier | QueryOptions)[]): QueryResult;
export declare function queryCheckEntity(world: World, query: Query, eid: EntityId): boolean;
export declare const queryCheckComponent: (query: Query, c: ComponentData) => boolean;
export declare const queryAddEntity: (query: Query, eid: EntityId) => void;
export declare const commitRemovals: (world: World) => void;
export declare const queryRemoveEntity: (world: World, query: Query, eid: EntityId) => void;
export declare const removeQuery: (world: World, terms: QueryTerm[]) => void;
//# sourceMappingURL=Query.d.ts.map