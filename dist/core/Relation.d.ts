import { World } from '.';
export type OnTargetRemovedCallback = (subject: number, target: number | string) => void;
export type RelationTarget = number | '*' | typeof Wildcard;
export declare const $relation: unique symbol;
export declare const $pairTarget: unique symbol;
export declare const $isPairComponent: unique symbol;
export declare const $relationData: unique symbol;
export type Relation<T> = (target: RelationTarget) => T;
export declare const withStore: <T>(createStore: () => T) => (relation: Relation<T>) => Relation<T>;
export declare const makeExclusive: <T>(relation: Relation<T>) => Relation<T>;
export declare const withAutoRemove: <T>(relation: Relation<T>) => Relation<T>;
export declare const withOnRemove: <T>(onRemove: OnTargetRemovedCallback) => (relation: Relation<T>) => Relation<T>;
export declare const Pair: <T>(relation: Relation<T>, target: RelationTarget) => T;
export declare const Wildcard: Relation<any>;
export declare const IsA: Relation<any>;
export declare const getRelationTargets: (world: World, relation: Relation<any>, eid: number) => any[];
export declare function createRelation<T>(...modifiers: Array<(relation: Relation<T>) => Relation<T>>): Relation<T>;
export declare function createRelation<T>(options: {
    store?: () => T;
    exclusive?: boolean;
    autoRemoveSubject?: boolean;
    onTargetRemoved?: OnTargetRemovedCallback;
}): Relation<T>;
//# sourceMappingURL=Relation.d.ts.map