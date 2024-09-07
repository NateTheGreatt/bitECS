import { World } from '.';
import { EntityId } from './Entity';
export type OnTargetRemovedCallback = (subject: EntityId, target: EntityId) => void;
export type RelationTarget = number | '*' | typeof Wildcard;
export declare const $relation: unique symbol;
export declare const $pairTarget: unique symbol;
export declare const $isPairComponent: unique symbol;
export declare const $relationData: unique symbol;
export type Relation<T> = (target: RelationTarget) => T;
export declare const withStore: <T>(createStore: () => T) => (relation: Relation<T>) => Relation<T>;
export declare const makeExclusive: <T>(relation: Relation<T>) => Relation<T>;
export declare const withAutoRemoveSubject: <T>(relation: Relation<T>) => Relation<T>;
export declare const withOnTargetRemoved: <T>(onRemove: OnTargetRemovedCallback) => (relation: Relation<T>) => Relation<T>;
export declare const Pair: <T>(relation: Relation<T>, target: RelationTarget) => T;
export declare const Wildcard: Relation<any>;
export declare const IsA: Relation<any>;
export declare const getRelationTargets: (world: World, eid: EntityId, relation: Relation<any>) => any[];
export declare function createRelation<T>(...modifiers: Array<(relation: Relation<T>) => Relation<T>>): Relation<T>;
export declare function createRelation<T>(options: {
    store?: () => T;
    exclusive?: boolean;
    autoRemoveSubject?: boolean;
    onTargetRemoved?: OnTargetRemovedCallback;
}): Relation<T>;
//# sourceMappingURL=Relation.d.ts.map