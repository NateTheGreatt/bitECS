import { commitRemovals } from './Query.js'

export const defineSystem = (update) => {
  const system = world => {
    update(world)
    commitRemovals(world)
  }

  Object.defineProperty(system, 'name', {
    value: (update.name || "AnonymousSystem") + "_internal",
    configurable: true,
  })

  return system
}