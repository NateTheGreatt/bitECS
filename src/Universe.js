export const MAX_ENTITIES = 10000

export const resizeThreshold = ({ capacity }) => Math.round(capacity - (capacity / 5))

// TODO
// export const resizeUniverse = universe => {
//   for (const world of universe.worlds) {
//     resizeWorld(world)
//   }
//   for (const component of universe.components) {
//     resizeComponent(component)
//   }
// }

/**
 * Creates a universe.
 *
 */
export const createUniverse = () => {
  return {
    worlds: [],
    removedEntities: [],
    components: [],
    entityCursor: 0,
    capacity: MAX_ENTITIES,
  }
}

/**
 * Deletes a universe.
 *
 * @param {Universe} universe
 * @param {World} world
 */
export const deleteWorld = (universe, world) => {
  universe.worlds.splice(universe.worlds.indexOf(world), 1)
}

export const resetUniverse = (universe, maxEntities = MAX_ENTITIES) => {
  universe.capacity = maxEntities
  universe.entityCursor = 0
  universe.removedEntities.length = 0
}

export const globalUniverse = createUniverse()