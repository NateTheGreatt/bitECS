import { commitComponentRemovals } from './Component.js'
import { commitEntityRemovals } from './Entity.js'

export const defineSystem = (update) => {
  const system = world => {
    update(world)
    commitComponentRemovals(world)
    commitEntityRemovals(world)
  }

  Object.defineProperty(system, 'name', {
    value: (update.name || "AnonymousSystem") + "_internal",
    configurable: true,
  })

  return system
}