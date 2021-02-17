export const Entity = (config, registry) => {
  const { entities, systems } = registry
  const removed = []
  const deferredEntityRemovals = []
  const enabledEntities = new Uint8Array(config.maxEntities)
  let entityCursor = 0

  /**
   * Get the count of entities currently in the world.
   *
   * @example <caption>Get the entity count</caption>
   * import World from 'bitecs'
   *
   * const world = World()
   * world.addEntity()
   * world.addEntity()
   * world.entityCount() // 2
   *
   * @memberof module:World
   */
  const entityCount = () => entityCursor - removed.length

  /**
   * Add a new entity to the world.
   *
   * @example <caption>Add an entity to the world</caption>
   * import World from 'bitecs'
   *
   * const world = World()
   * world.addEntity() // 0
   * world.addEntity() // 1
   *
   * @memberof module:World
   * @returns {uint32} The entity id.
   */
  const addEntity = () => {
    if (entityCursor >= config.maxEntities) {
      console.warn('❌ Could not add entity, maximum number of entities reached.')
      return
    }

    const eid = removed.length > 0 ? removed.pop() : entityCursor++
    for (let arr of entities) arr[eid] = 0
    enabledEntities[eid] = 1
    return eid
  }

  /**
   * Internal remove function
   * @private
   */
  const commitEntityRemovals = () => {
    if (deferredEntityRemovals.length === 0) return

    for (let eid of deferredEntityRemovals) {
      // Check if entity is already removed
      if (enabledEntities[eid] === 0) continue

      // Remove entity from all systems
      for (const s in systems) {
        systems[s].remove(eid)
      }

      // Free the entity
      removed.push(eid)
      enabledEntities[eid] = 0

      // Clear component bitmasks
      for (let arr of entities) arr[eid] = 0
    }

    deferredEntityRemovals.length = 0
  }

  /**
   * Remove an entity from the world.
   *
   * @example <caption>Remove an entity from the world deferred.</caption>
   * import World from 'bitecs'
   *
   * const world = World()
   * const eid = world.addEntity() // 1
   * world.entityCount() // 1
   * world.removeEntity(eid)
   * world.step()
   * world.entityCount() // 0
   *
   * @memberof module:World
   * @param {uint32} eid        - The entity id to remove.
   */
  const removeEntity = (eid) => {
    deferredEntityRemovals.push(eid)
  }

  return { entityCount, addEntity, removeEntity, commitEntityRemovals }
}
