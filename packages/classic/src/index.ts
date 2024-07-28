export {
	addComponent,
	addComponents,
	defineComponent,
	getStore,
	hasComponent,
	registerComponent,
	registerComponents,
	removeComponent,
	removeComponents,
	setStore,
} from './component/Component.js';
export { TYPES_ENUM as Types } from './constants/Constants.js';
export { addEntity, entityExists, getEntityComponents, removeEntity } from './entity/Entity.js';
export * from './prefab/Prefab.js';
export {
	Not,
	commitRemovals,
	defineQuery,
	enterQuery,
	exitQuery,
	query,
	registerQuery,
	removeQuery,
} from './query/Query.js';
export { defineEnterQueue, defineExitQueue } from './query/Queue.js';
export { archetypeHash } from './query/utils.js';
export * from './relation/Relation.js';
export { defineSystem } from './system/System.js';
export { pipe } from './utils/pipe.js';
export {
	createWorld,
	defineWorld,
	deleteWorld,
	flushRemovedEntities,
	getAllEntities,
	getEntityCursor,
	getRecycledEntities,
	getWorldComponents,
	registerWorld,
	resetWorld,
	worlds,
} from './world/World.js';

export * from './component/utils.js';

// Types

export * from './component/types.js';
export * from './prefab/types.js';
export * from './query/types.js';
export * from './relation/types.js';
export * from './system/types.js';
export * from './utils/types.js';
export * from './world/types.js';

// Symbols
import * as componentSymbols from './component/symbols.js';
import * as entitySymbols from './entity/symbols.js';
import * as prefabSymbols from './prefab/symbols.js';
import * as querySymbols from './query/symbols.js';
import * as relationSymbols from './relation/symbols.js';
import * as worldSymbols from './world/symbols.js';

export const SYMBOLS = {
	...worldSymbols,
	...entitySymbols,
	...componentSymbols,
	...querySymbols,
	...relationSymbols,
	...prefabSymbols,
};
