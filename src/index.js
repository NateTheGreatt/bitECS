import { createWorld } from './World.js'
import { addEntity, removeEntity } from './Entity.js'
import { defineComponent, registerComponent, registerComponents, addComponent, removeComponent } from './Component.js'
import { defineSystem } from './System.js'
import { defineQuery, enterQuery, exitQuery } from './Query.js'
// import { snapshot } from './Snapshot.js'
import { TYPES_ENUM } from './DataManager.js'

export const pipe = fns => world => {
  for (let i = 0; i < fns.length; i++) {
    const fn = fns[i]
    fn(world)
  }
}

export const Types = TYPES_ENUM

export {
  createWorld,
  registerComponent,
  registerComponents,
  defineComponent,
  defineQuery,
  enterQuery,
  exitQuery,
  defineSystem,
  addComponent,
  removeComponent,
  addEntity,
  removeEntity,
}
