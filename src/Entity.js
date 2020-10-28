export const Entity = (config, registry) => {
  const { entities, systems } = registry
  const removed = []
  const deferredEntityRemovals = []

  /**
   * Count of entities in this world
   * @private
   */
  let _entityCount = 0

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
  const entityCount = () => _entityCount

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
    if (_entityCount + 1 > config.maxEntities) {
      console.warn('❌ Could not add entity, maximum number of entities reached.')
      return
    }

    const eid = removed.length ? removed.shift() : _entityCount
    _entityCount++
    entities.forEach(typedArray => { typedArray[eid] = 0 })
    return eid
  }

  /**
   * Internal remove function
   * @param {uint32} eid
   * @private true
   */
  const _removeEntity = eid => {
    // Check if entity is already removed
    if (removed.indexOf(eid) > -1) return

    // Remove entity from all systems
    for (const s in systems) {
      const system = systems[s]
      system.remove(eid)
    }
    removed.push(eid)
    _entityCount--

    // Clear component bitmasks
    entities.forEach(arr => { arr[eid] = 0 })
  }

  /**
   * Remove an entity from the world.
   *
   * @example <caption>Remove an entity from the world deferred.</caption>
   * import World from 'bitecs'
   *
   * const world = World()
   * const eid = world.addEntity() // 0
   * world.entityCount() // 1
   * world.removeEntity(eid)
   * world.step()
   * world.entityCount() // 0
   *
   * @example <caption>Remove an entity from the world immediately.</caption>
   * import World from 'bitecs'
   *
   * const world = World()
   * const eid = world.addEntity() // 0
   * world.entityCount() // 1
   * world.removeEntity(eid, true)
   * world.entityCount() // 0
   *
   * @memberof module:World
   * @param {uint32} eid        - The entity id to remove.
   * @param {boolean} immediate - Remove immediately. If false, defer until end of tick.
   */
  const removeEntity = (eid, immediate = false) => {
    if (immediate) {
      _removeEntity(eid)
    } else {
      deferredEntityRemovals.push(() => _removeEntity(eid))
    }
  }

  return { entityCount, addEntity, removeEntity, deferredEntityRemovals }
}
