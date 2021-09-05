import { commitRemovals } from './Query.js'

/**
 * Defines a new system function.
 *
 * @param {function} update
 * @returns {function}
 */
 export const defineSystem = (update) => (world, ...args) => {
  console.warn('bitECS - defineSystem is deprecated.')
  update(world, ...args)
  commitRemovals(world)
  return world
}