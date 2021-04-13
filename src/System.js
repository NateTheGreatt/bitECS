import { commitComponentRemovals } from './Component.js'
import { commitEntityRemovals } from './Entity.js'
import { $queryMap, registerQuery } from './Query.js'

export const defineSystem = (query, update) => {
  const system = {}
  return world => {
    update(query(world))
    commitComponentRemovals(world)
    commitEntityRemovals(world)
  }
}
