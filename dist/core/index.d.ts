export { createWorld, resetWorld, deleteWorld, getWorldComponents, getAllEntities, $internal, } from './World';
export type { World, InternalWorld, WorldContext } from './World';
export { type EntityId, addEntity, removeEntity, getEntityComponents, entityExists, Prefab, addPrefab, } from './Entity';
export { registerComponent, registerComponents, getComponentData, setComponent, set } from './Component';
export type { ComponentRef, ComponentData } from './Component';
export { commitRemovals, removeQuery, registerQuery, innerQuery, query, observe, onAdd, onRemove, And, Any, All, None, onGet, onSet, } from './Query';
export type { ObservableHookDef, ObservableHook, QueryResult, QueryOperatorType, OpReturnType, QueryOperator, QueryTerm, OrOp, AndOp, NotOp, AnyOp, AllOp, NoneOp, } from './Query';
export { pipe } from './utils/pipe';
export { withAutoRemoveSubject, withOnTargetRemoved, withStore, createRelation, getRelationTargets, Wildcard, IsA, Pair, } from './Relation';
export type { OnTargetRemovedCallback, Relation, RelationTarget, } from './Relation';
export { createEntityIndex } from './EntityIndex';
export { IWorld, ComponentProp, IComponentProp, IComponent, Component, QueryModifier, Query, $modifier, Not, Or, Changed, defineQuery, enterQuery, exitQuery, addComponent, hasComponent, removeComponent, ISchema, Type, ListType, Types, defineComponent, ComponentType, } from '../legacy/index';
//# sourceMappingURL=index.d.ts.map