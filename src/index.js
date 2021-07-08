import { createWorld, resetWorld, deleteWorld } from './World.js'
import { addEntity, removeEntity, setDefaultSize } from './Entity.js'
import { defineComponent, registerComponent, registerComponents, hasComponent, addComponent, removeComponent } from './Component.js'
import { defineSystem } from './System.js'
import { defineQuery, enterQuery, exitQuery, Changed, Not, commitRemovals, resetChangedQuery, removeQuery } from './Query.js'
import { defineSerializer, defineDeserializer } from './Serialize.js'
import { TYPES_ENUM, parentArray } from './Storage.js'

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

export function apply (world) {

  const appliedDefineSystem = (update) => {
    return defineSystem((world, ...args) => {
      update(world, ...args)
      return world
    })
  }

  const appliedPipe = (...systems) => {
    const pipeline = pipe(...systems)
    return () => pipeline(world, ...args)
  }

  return {
    setDefaultSize,
    resetWorld: () => resetWorld(world),
    deleteWorld: () => deleteWorld(world),
    addEntity: () => addEntity(world),
    removeEntity: (eid) => removeEntity(world, eid),

    registerComponent: (component) => registerComponent(world, component),
    registerComponents: (components) => registerComponents(world, components),
    defineComponent,
    addComponent: (component, eid) => addComponent(world, component, eid),
    removeComponent: (component, eid) => removeComponent(world, component, eid),
    hasComponent: (component, eid) => hasComponent(world, component, eid),

    defineQuery,
    Changed,
    Not,
    enterQuery,
    exitQuery,
    resetChangedQuery: (query) => resetChangedQuery(world, query),
    removeQuery: (query) => removeQuery(world, query),
    commitRemovals: () => commitRemovals(world),

    defineSystem: appliedDefineSystem,
    defineSerializer,
    defineDeserializer,
    pipe: appliedPipe,
    parentArray
  }
}

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

  parentArray,

}
