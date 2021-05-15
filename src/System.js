import { commitRemovals } from './Query.js'

export const defineSystem = (fn1, fn2) => {
  const update = fn2 !== undefined ? fn2 : fn1
  const create = fn2 !== undefined ? fn1 : undefined
  const init = new Set()
  const system = world => {
    if (create && !init.has(world)) {
      create(world)
      init.add(world)
    }
    update(world)
    commitRemovals(world)
    return world
  }

  Object.defineProperty(system, 'name', {
    value: (update.name || "AnonymousSystem") + "_internal",
    configurable: true,
  })

  return system
}