import { createWorld, resetWorld, deleteWorld } from './World.js'
import { addEntity, removeEntity, setDefaultSize, getEntityComponents} from './Entity.js'
import { defineComponent, registerComponent, registerComponents, hasComponent, addComponent, removeComponent } from './Component.js'
import { defineSystem } from './System.js'
import { defineQuery, enterQuery, exitQuery, Changed, Not, commitRemovals, resetChangedQuery, removeQuery } from './Query.js'
import { defineSerializer, defineDeserializer, DESERIALIZE_MODE } from './Serialize.js'
import { TYPES_ENUM, parentArray } from './Storage.js'
// import { defineProxy } from './Proxy.js'

export const pipe = (...fns) => (...args) => {
  const input = Array.isArray(args[0]) ? args[0] : args
  if (!input || input.length === 0) return
  fns = Array.isArray(fns[0]) ? fns[0] : fns
  let tmp = input
  for (let i = 0; i < fns.length; i++) {
    const fn = fns[i]
    if (Array.isArray(tmp)) {
      // tmp = tmp.reduce((a,v) => a.concat(fn(v)),[])
      tmp = fn(...tmp)
    } else {
      tmp = fn(tmp)
    }
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

  registerComponent,
  registerComponents,
  defineComponent,
  addComponent,
  removeComponent,
  hasComponent,
  getEntityComponents,
  // entityChanged,

  // defineProxy,

  defineQuery,
  Changed,
  Not,
  // Or,
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
