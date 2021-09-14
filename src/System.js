/**
 * Defines a new system function.
 *
 * @param {function} update
 * @returns {function}
 */
 export const defineSystem = (update) => (world, ...args) => {
  update(world, ...args)
  return world
}