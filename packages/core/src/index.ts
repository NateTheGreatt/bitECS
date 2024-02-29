import {
  createWorld,
  resetWorld,
  deleteWorld,
  getWorldComponents,
  getAllEntities,
  enableManualEntityRecycling,
} from "./world/World.js";
import {
  addEntity,
  removeEntity,
  setDefaultSize,
  setRemovedRecycleThreshold,
  getEntityComponents,
  entityExists,
  flushRemovedEntities,
  resetGlobals,
  getDefaultSize,
} from "./entity/Entity.js";
import {
  defineComponent,
  registerComponent,
  registerComponents,
  hasComponent,
  addComponent,
  removeComponent,
} from "./component/Component.js";
import {
  defineQuery,
  enterQuery,
  exitQuery,
  Changed,
  Not,
  commitRemovals,
  resetChangedQuery,
  removeQuery,
} from "./query/Query.js";
import { parentArray } from "./storage/Storage.js";
import { TYPES_ENUM } from "./constants/Constants.js";

export const Types = TYPES_ENUM;

export {
  setDefaultSize,
  setRemovedRecycleThreshold,
  createWorld,
  resetWorld,
  deleteWorld,
  addEntity,
  removeEntity,
  entityExists,
  getWorldComponents,
  enableManualEntityRecycling,
  flushRemovedEntities,
  getAllEntities,
  registerComponent,
  registerComponents,
  defineComponent,
  addComponent,
  removeComponent,
  hasComponent,
  getEntityComponents,
  defineQuery,
  Changed,
  Not,
  enterQuery,
  exitQuery,
  commitRemovals,
  resetChangedQuery,
  removeQuery,
  parentArray,
  resetGlobals,
  getDefaultSize,
};
