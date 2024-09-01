import { type SparseSet } from './utils/SparseSet';
import { ComponentRef, ComponentData } from './Component';
import { World } from "./World";
import { createObservable } from './utils/Observer';
export type QueryResult = Uint32Array | readonly number[];
export type Query = SparseSet & {
    allComponents: ComponentRef[];
    orComponents: ComponentRef[];
    notComponents: ComponentRef[];
    masks: {
        [key: number]: number;
    };
    orMasks: {
        [key: number]: number;
    };
    notMasks: {
        [key: number]: number;
    };
    hasMasks: {
        [key: number]: number;
    };
    generations: number[];
    toRemove: SparseSet;
    addObservable: ReturnType<typeof createObservable>;
    removeObservable: ReturnType<typeof createObservable>;
};
export type QueryOperatorType = 'Or' | 'And' | 'Not';
export declare const $opType: unique symbol;
export declare const $opComponents: unique symbol;
export type OpReturnType = {
    [$opType]: string;
    [$opComponents]: ComponentRef[];
};
export type QueryOperator = (...components: ComponentRef[]) => OpReturnType;
export type QueryTerm = ComponentRef | QueryOperator;
export type OrOp = QueryOperator;
export type AndOp = QueryOperator;
export type NotOp = QueryOperator;
export type AnyOp = OrOp;
export type AllOp = AndOp;
export type NoneOp = NotOp;
export type ObservableHook = (...components: ComponentRef[]) => {
    [$opType]: 'add' | 'remove' | 'set';
    [$opComponents]: ComponentRef[];
};
export declare const onAdd: ObservableHook;
export declare const onRemove: ObservableHook;
export declare const onSet: ObservableHook;
export declare const set: <T>(world: World, eid: number, component: ComponentRef, params: T) => void;
export declare const observe: (world: World, hook: ReturnType<typeof onAdd | typeof onRemove | typeof onSet>, callback: (eid: number) => void) => () => void;
export declare const Or: OrOp;
export declare const And: AndOp;
export declare const Not: NotOp;
export declare const Any: AnyOp;
export declare const All: AllOp;
export declare const None: NoneOp;
export declare const queryHash: (world: World, terms: QueryTerm[]) => string;
export declare const registerQuery: (world: World, terms: QueryTerm[], options?: {
    buffered?: boolean;
}) => Query;
export declare function innerQuery(world: World, terms: QueryTerm[], options?: {
    buffered?: boolean;
}): QueryResult;
export declare function query(world: World, terms: QueryTerm[]): readonly number[];
export declare function bufferQuery(world: World, terms: QueryTerm[]): Uint32Array;
export declare function queryCheckEntity(world: World, query: Query, eid: number): boolean;
export declare const queryCheckComponent: (query: Query, c: ComponentData) => boolean;
export declare const queryAddEntity: (query: Query, eid: number) => void;
export declare const commitRemovals: (world: World) => void;
export declare const queryRemoveEntity: (world: World, query: Query, eid: number) => void;
export declare const removeQuery: (world: World, terms: QueryTerm[]) => void;
//# sourceMappingURL=Query.d.ts.map