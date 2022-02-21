import { createWorld, resetWorld, deleteWorld, getWorldComponents } from './World.js'
import { addEntity, removeEntity, setDefaultSize, getEntityComponents, entityExists } from './Entity.js'
import { defineComponent, registerComponent, registerComponents, hasComponent, addComponent, removeComponent } from './Component.js'
import { defineSystem } from './System.js'
import { defineQuery, enterQuery, exitQuery, Changed, Not, commitRemovals, resetChangedQuery, removeQuery } from './Query.js'
import { defineSerializer, defineDeserializer, DESERIALIZE_MODE } from './Serialize.js'
import { parentArray } from './Storage.js'
import { TYPES_ENUM } from './Constants.js'

export const pipe = (...fns) => (input) => {
  let tmp = input
  for (let i = 0; i < fns.length; i++) {
    const fn = fns[i]
    tmp = fn(tmp)
  }
  return tmp
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
