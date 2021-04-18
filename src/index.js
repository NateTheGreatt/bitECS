import { createWorld } from './World.js'
import { addEntity, removeEntity } from './Entity.js'
import { defineComponent, registerComponent, registerComponents, hasComponent, addComponent, removeComponent } from './Component.js'
import { defineSystem } from './System.js'
import { defineQuery, enterQuery, exitQuery, Changed, Not, commitRemovals } from './Query.js'
import { defineSerializer, defineDeserializer } from './Serialize.js'
import { TYPES_ENUM } from './Storage.js'

export const pipe = (...fns) => world => {
  fns = Array.isArray(fns[0]) ? fns[0] : fns
  for (let i = 0; i < fns.length; i++) {
    const fn = fns[i]
    fn(world)
  }
}

export const Types = TYPES_ENUM

export {

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
  enterQuery,
  exitQuery,
  commitRemovals,

  defineSystem,
  
  defineSerializer,
  defineDeserializer,

}
