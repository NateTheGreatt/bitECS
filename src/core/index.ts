export {
	createWorld,
	resetWorld,
	deleteWorld,
	getWorldComponents,
	getAllEntities,
	$internal,
} from './World'

export type {
	World,
	InternalWorld,
	WorldContext
} from './World'

export {
	type EntityId,
	addEntity,
	removeEntity,
	getEntityComponents,
	entityExists,
	Prefab,
	addPrefab,
} from './Entity'

export { 
	createEntityIndex,
	getId,
	getVersion,
	withRecycling,
} from './EntityIndex'

export {
	registerComponent,
	registerComponents,
	hasComponent,
	addComponent,
	addComponents,
	removeComponent,
	removeComponents,
	getComponentData,
	setComponent,
	set
} from './Component'

export type {
	ComponentRef,
	ComponentData
} from './Component'

export {
	commitRemovals,
	removeQuery,
	registerQuery,
	innerQuery,
	query,
	observe,
	onAdd,
	onRemove,
	Or,
	And,
	Not,
	Any,
	All,
	None,
	onGet, 
	onSet,
} from './Query'

export type {
	ObservableHookDef,
	ObservableHook,
	QueryResult,
	Query,
	QueryOperatorType,
	OpReturnType,
	QueryOperator,
	QueryTerm,
	OrOp,
	AndOp,
	NotOp,
	AnyOp,
	AllOp,
	NoneOp,
} from './Query'

export { pipe } from './utils/pipe'

export {
	withAutoRemoveSubject,
	withOnTargetRemoved,
	withStore,
	createRelation,
	getRelationTargets,
	Wildcard,
	IsA,
	Pair,
	isRelation,
} from './Relation'

export type {
	OnTargetRemovedCallback,
	Relation,
	RelationTarget,
} from './Relation'
