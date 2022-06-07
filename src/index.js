import { createWorld, resetWorld, deleteWorld, getWorldComponents, getAllEntities, resetWorldGlobals } from './World.js'
import { addEntity, removeEntity, setDefaultSize, getEntityComponents, entityExists, resetGlobals as resetEntityGlobals } from './Entity.js'
import { defineComponent, registerComponent, registerComponents, hasComponent, addComponent, removeComponent, resetComponentGlobals } from './Component.js'
import { defineSystem } from './System.js'
import { defineQuery, enterQuery, exitQuery, Changed, Not, commitRemovals, resetChangedQuery, removeQuery } from './Query.js'
import { defineSerializer, defineDeserializer, DESERIALIZE_MODE, resetSerializeGlobals } from './Serialize.js'
import { parentArray, resetStorageGlobals } from './Storage.js'
import { TYPES_ENUM } from './Constants.js'

export const pipe = (...fns) => (input) => {
  let tmp = input
  for (let i = 0; i < fns.length; i++) {
    const fn = fns[i]
    tmp = fn(tmp)
  }
  return tmp
}

export const resetAllGlobals = () => {
  resetComponentGlobals()
  resetSerializeGlobals()
  resetWorldGlobals()
  resetStorageGlobals()
  resetEntityGlobals()
}

export const Types = TYPES_ENUM

export {

  setDefaultSize,
  createWorld,
  resetWorld,
  deleteWorld,
  addEntity,
  removeEntity,
  entityExists,
  getWorldComponents,
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

  defineSystem,
  
  defineSerializer,
  defineDeserializer,
  DESERIALIZE_MODE,

  parentArray,

}
