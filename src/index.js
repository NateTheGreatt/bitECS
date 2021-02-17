/**
 * High performance Entity Component System written in javascript. Compatible
 * with node.js and the browser.
 *
 */

import { Config } from './Config.js'
import { Registry } from './Registry.js'
import { Entity } from './Entity.js'
import { Component } from './Component.js'
import { System } from './System.js'
import { TYPES_ENUM, DataManager } from './utils/DataManager.js'

/**
 * Create a new ECS World.
 *
 * @example <caption>Create a new ECS World.</caption>
 * import World from 'bitecs'
 * const world = World({ maxEntities: 100000, maxComponentTypes: 128 })
 *
 * @module World
 * @param {Object} config={}                            - The world configuration.
 * @param {number} config.maxEntities=100000            - Maximum entities allowed in world.
 * @param {number} config.maxComponentTypes=128             - Maximum component registrations allowed in world.
 *
 * @returns {World} Returns the ECS API for the created world instance.
 */
export default (worldConfig = {}) => {
  const dataManager = DataManager()
  const config = Config(worldConfig)
  const registry = Registry(config)

  const {
    entityCount,
    addEntity,
    removeEntity,
    commitEntityRemovals
  } = Entity(config, registry)

  const {
    registerComponent,
    addComponent,
    removeComponent,
    removeAllComponents,
    hasComponent,
    deferredComponentRemovals
  } = Component(config, registry, dataManager)

  const {
    enabled,
    registerSystem,
    toggle,
    step
  } = System(config, registry, commitEntityRemovals, deferredComponentRemovals)

  let queryCount = 0
  const createQuery = components => registerSystem({ name: `query-${queryCount++}`, components }).localEntities

  return {
    TYPES: TYPES_ENUM,
    config,
    registry,
    entityCount,
    addEntity,
    removeEntity,
    registerComponent,
    removeComponent,
    removeAllComponents,
    addComponent,
    hasComponent,
    registerSystem,
    createQuery,
    enabled,
    toggle,
    step
  }
}
