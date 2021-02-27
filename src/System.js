const NONE = -1

export const System = (
  config,
  registry,
  commitEntityRemovals,
  commitComponentRemovals
) => {
  const { entities, components, systems } = registry

  const systemArray = []

  /**
   * World enabled
   *
   * @type {boolean}
   * @private
   */
  let _enabled = true

  /**
   * Returns if the World system execution is enabled.
   *
   * @example <caption>Check if the world systems are enabled.</caption>
   * import World from 'bitecs'
   *
   * const world = World()
   * world.enabled() // true
   *
   * world.toggle()
   * world.enabled() // false
   *
   * @example <caption>Check if a system is enabled.</caption>
   * import World from 'bitecs'
   *
   * const world = World()
   * world.registerSystem({
   *   name: 'MOVEMENT',
   *   components: ['POSITION', 'VELOCITY'],
   *   update: (position, velocity) => entities => {
   *     for (let i = 0; i < entities.length; i++) {
   *       position.x[eid] += velocity.vx[eid] * velocity.speed[eid]
   *       position.y[eid] += velocity.vy[eid] * velocity.speed[eid]
   *     }
   *   }
   * })
   *
   * world.enabled('MOVEMENT') // true
   * world.toggle('MOVEMENT')
   * world.enabled('MOVEMENT') // false
   *
   * @memberof module:World
   * @param {string} name - Name of a system. If not defined return world enabled state.
   * @return {boolean} World system execution enabled.
   */
  const enabled = name => {
    if (name) {
      if (!systems[name]) {
        console.warn(`System '${name}' is not registered.`)
        return
      }
      return systems[name].enabled
    }
    return _enabled
  }

  /**
   * Register a new system.
   *
   * @example <caption>Full system API.</caption>
   * import World from 'bitecs'
   *
   * const world = World()
   * const position = world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
   * const velocity = world.registerComponent('VELOCITY', { vx: 'int8', vy: 'int8', speed: 'uint16' })
   *
   * world.registerSystem({
   *   name: 'MOVEMENT',
   *   components: ['POSITION', 'VELOCITY'],
   *   enter: eid => {
   *     // Called once when an entity is added to system.
   *   },
   *   update: (position, velocity) => entities => {
   *     // Called once every tick.
   *   },
   *   exit: eid => {
   *     // Called once when an entity is removed from the system.
   *   }
   * })
   *
   * @example <caption>A sample movement system.</caption>
   * import World from 'bitecs'
   *
   * const world = World()
   * const position = world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
   * const velocity = world.registerComponent('VELOCITY', { vx: 'int8', vy: 'int8', speed: 'uint16' })
   *
   * world.registerSystem({
   *   name: 'MOVEMENT',
   *   components: ['POSITION', 'VELOCITY'],
   *   update: (position, velocity) => entities => {
   *     for (let i = 0; i < entities.length; i++) {
   *       position.x[eid] += velocity.vx[eid] * velocity.speed[eid]
   *       position.y[eid] += velocity.vy[eid] * velocity.speed[eid]
   *     }
   *   }
   * })
   *
   * @memberof module:World
   * @param {Object} system               - System configuration.
   * @param {string} system.name          - The name of the system.
   * @param {string[]} system.components  - Component names the system queries.
   * @param {Function} system.enter       - Called when an entity is added to the system.
   * @param {Function} system.update      - Called every tick on all entities in the system.
   * @param {Function} system.exit        - Called when an entity is removed from the system.
   */
  const registerSystem = ({
    name,
    components: componentDependencies = [],
    enter,
    update,
    exit
  }) => {
    const localEntities = []
    const entityIndexes = new Int32Array(config.maxEntities).fill(NONE)

    const system = {
      count: 0,
      name,
      enabled: true,
      components: componentDependencies,
      localEntities,
      update,
      enter,
      exit
    }

    const componentManagers = componentDependencies.map(dep => {
      if (components[dep] === undefined) {
        throw new Error(
          `❌ Cannot register system '${name}', '${dep}' is not a registered component.`
        )
      }
      return components[dep]
    })

    // Ensure `masks` is packed
    const masks = Array.from({ length: config.maxGenerations }, () => 0)

    // Reduce bitflag to create mask
    for (const componentManager of componentManagers) {
      const { _generationId, _bitflag } = componentManager
      masks[_generationId] |= _bitflag
    }

    system.masks = masks

    // Checks if an entity mask matches the system's
    system.check = eid => {
      for (let generationId = 0; generationId < masks.length; generationId++) {
        const eMask = entities[generationId][eid]
        const sMask = masks[generationId]
        if ((eMask & sMask) !== sMask) {
          return false
        }
      }
      return true
    }

    system.checkComponent = componentManager =>
      (masks[componentManager._generationId] & componentManager._bitflag) ===
      componentManager._bitflag

    // Partially apply component managers onto the provided callbacks
    const updateFn = update ? update(...componentManagers) : null
    const enterFn = enter ? enter(...componentManagers) : null
    const exitFn = exit ? exit(...componentManagers) : null

    // Define execute function which executes each local entity
    system.execute = force => {
      if (force || system.enabled) {
        if (updateFn) updateFn(localEntities)
      }
      applyRemovalDeferrals()
    }

    // invoke enter/exit on add/remove
    system.add = eid => {
      if (entityIndexes[eid] !== NONE) return

      // Add index to map for faster lookup
      entityIndexes[eid] = localEntities.push(eid) - 1
      system.count = localEntities.length
      if (enterFn) enterFn(eid)
    }

    system.remove = eid => {
      const index = entityIndexes[eid]
      if (index === NONE) return

      // Pop swap removal
      const swapped = localEntities.pop()
      if (swapped !== eid) {
        localEntities[index] = swapped
        entityIndexes[swapped] = index
      }
      entityIndexes[eid] = NONE

      // Update metadata
      system.count = localEntities.length
      if (exitFn) exitFn(eid)
    }

    // Populate with matching entities (if registering after entities have been added)
    for (let i = 0; i < entities[0].length; i++) {
      if (system.components.length && system.check(i)) system.add(i)
    }

    // Set in the registry
    systems[name] = system

    // add it to the array if it's not a query
    if (!name.includes('query')) systemArray.push(system)

    return system
  }

  /**
   * Apply deferred component and entity removals.
   *
   * @private
   */
  const applyRemovalDeferrals = () => {
    commitComponentRemovals()
    commitEntityRemovals()
  }

  /**
   * Toggle the world system execution.
   *
   * @example <caption>Toggle the world system execution.</caption>
   * import World from 'bitecs'
   *
   * const world = World()
   * world.enabled() // true
   * world.step() // executes systems
   *
   * world.toggle()
   * world.enabled() // false
   * world.step() // does not execute systems
   *
   * @example <caption>Toggle a single system's execution.</caption>
   * import World from 'bitecs'
   *
   * const world = World()
   * const position = world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
   * const velocity = world.registerComponent('VELOCITY', { vx: 'int8', vy: 'int8', speed: 'uint16' })
   *
   * world.registerSystem({
   *   name: 'MOVEMENT',
   *   components: ['POSITION', 'VELOCITY'],
   *   update: (position, velocity) => entities => {
   *     for (let i = 0; i < entities.length; i++) {
   *       position.x[eid] += velocity.vx[eid] * velocity.speed[eid]
   *       position.y[eid] += velocity.vy[eid] * velocity.speed[eid]
   *     }
   *   }
   * })
   *
   * world.step('MOVEMENT') // executes system
   * world.toggle('MOVEMENT') // enabled false
   * world.enabled('MOVEMENT') // false
   * world.step('MOVEMENT') // does not execute the system
   *
   * @memberof module:World
   * @param {string} name - Name of a system to toggle. If not defined toggle world system execution.
   */
  const toggle = name => {
    if (name) {
      if (!systems[name]) {
        console.warn(`System '${name} is not registered.`)
        return
      }
      systems[name].enabled = !systems[name].enabled
      return
    }
    _enabled = !_enabled
  }

  /**
   * Step the world or specific system forward.
   *
   * @example <caption>Create a server side update loop.</caption>
   * import { performance } from 'perf_hooks'
   * import World from 'bitecs'
   * import events from 'eventemitter3'
   *
   * const TICK_RATE = 30
   * const world = World()
   *
   * const time = {
   *   now: performance.now(),
   *   previous: performance.now(),
   *   delta: 0,
   *   tick: 0
   * }
   *
   * const tickLengthMs = 1000 / TICK_RATE
   *
   * const tick = () => {
   *   time.now = performance.now()
   *
   *   if (previous + tickLengthMs <= time.now) {
   *     time.delta = (time.now - previous) / 1000
   *     time.previous = time.now
   *     time.tick++
   *
   *     events.emit('update', time)
   *     world.step()
   *     events.emit('late-update', time)
   *
   *     if (hrtimeMs() - previous < tickLengthMs - 4) {
   *       setTimeout(tick)
   *     } else {
   *       setImmediate(tick)
   *     }
   *   }
   * }
   *
   * tick()
   * events.emit('start')
   *
   * @example <caption>Create client side update loop.</caption>
   * import World from 'bitecs'
   * import events from 'eventemitter3'
   *
   * const world = World()
   *
   * const time = {
   *   now: performance.now(),
   *   previous: performance.now(),
   *   delta: 0,
   *   tick: 0
   * }
   *
   * const tick = () => {
   *   time.now = performance.now()
   *   time.delta = (time.now - previous) / 1000
   *   time.previous = time.now
   *   time.tick++
   *
   *   events.emit('update', time)
   *   world.step()
   *   events.emit('late-update', time)
   *
   *   requestAnimationFrame(tick)
   * }
   *
   * tick()
   * events.emit('start')
   *
   * @example <caption>Force step a paused world.</caption>
   * import World from 'bitecs'
   *
   * const world = World()
   * world.toggle()
   * world.enabled() // false
   * world.step() // does not execute systems
   * world.step('system-name') // executes system-name once
   *
   * @example <caption>Step a specific system.</caption>
   * import World from 'bitecs'
   *
   * const world = World()
   * const position = world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
   * const velocity = world.registerComponent('VELOCITY', { vx: 'int8', vy: 'int8', speed: 'uint16' })
   *
   * world.registerSystem({
   *   name: 'MOVEMENT',
   *   components: ['POSITION', 'VELOCITY'],
   *   update: (position, velocity) => entities => {
   *     for (let i = 0; i < entities.length; i++) {
   *       position.x[eid] += velocity.vx[eid] * velocity.speed[eid]
   *       position.y[eid] += velocity.vy[eid] * velocity.speed[eid]
   *     }
   *   }
   * })
   *
   * world.step('MOVEMENT') // executes system
   * world.toggle('MOVEMENT')
   * world.enabled('MOVEMENT') // false
   * world.step('MOVEMENT', true) // force execution on system
   *
   * @memberof module:World
   * @param {string} name   - Name of a system to step. If not defined step the entire world.
   * @param {boolean} force - Step the world even if it is not enabled.
   */
  const step = (name, force = false) => {
    // Step a specific system.
    if (typeof name === 'boolean') force = name
    if (typeof name === 'string') {
      systems[name].execute(force)
      return
    }

    if (force || _enabled) {
      for (let i = 0; i < systemArray.length; i++) {
        systemArray[i].execute()
      }
    }
    applyRemovalDeferrals()
  }

  return {
    registerSystem,
    enabled,
    step,
    toggle
  }
}
