import { createWorld } from './World.js'
import { addEntity, removeEntity, setDefaultSize } from './Entity.js'
import { defineComponent, registerComponent, registerComponents, hasComponent, addComponent, removeComponent } from './Component.js'
import { defineSystem } from './System.js'
import { defineQuery, enterQuery, exitQuery, Changed, Not, resetChangedQuery, commitRemovals } from './Query.js'
import { defineSerializer, defineDeserializer } from './Serialize.js'
import { TYPES_ENUM, parentArray } from './Storage.js'

export const pipe = (...fns) => input => {
  if (!input || Array.isArray(input) && input.length === 0) return
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
  addEntity,
  removeEntity,

  registerComponent,
  registerComponents,
  defineComponent,
  addComponent,
  removeComponent,
  hasComponent,
  
  defineQuery,
  Changed,
  Not,
  // Or,
  enterQuery,
  exitQuery,
  resetChangedQuery,
  commitRemovals,

  defineSystem,
  
  defineSerializer,
  defineDeserializer,

  parentArray,

}
