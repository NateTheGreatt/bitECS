import { alloc } from './DataManager.js'
import { $queryComponents, $queries, queryAddEntity, queryRemoveEntity, queryCheckEntity, queryCheckComponents } from './Query.js'
import { $bitflag, $size } from './World.js'
import { $entityMasks } from './Entity.js'

export const $componentMap = Symbol('componentMap')
export const $deferredComponentRemovals = Symbol('de$deferredComponentRemovals')

export const defineComponent = (schema, n) => alloc(schema, n)

export const incrementBitflag = (world) => {
  world[$bitflag] *= 2
  if (world[$bitflag] >= Math.pow(2, 32)) {
    world[$bitflag] = 1
    world[$entityMasks].push(new Uint32Array(world[$size]))
  }
}

export const registerComponent = (world, component) => {
  world[$componentMap].set(component, { 
    generationId: world[$entityMasks].length - 1,
    bitflag: world[$bitflag]
  })

  incrementBitflag(world)
}

export const registerComponents = (world, components) => {
  components.forEach(c => registerComponent(world, c))
}

export const hasComponent = (world, component, eid) => {
  const { generationId, bitflag } = world[$componentMap].get(component)
  const mask = world[$entityMasks][generationId][eid]
  return (mask & bitflag) === bitflag
}

export const addComponent = (world, component, eid) => {
  if (hasComponent(world, component, eid)) return

  // Add bitflag to entity bitmask
  const { generationId, bitflag } = world[$componentMap].get(component)
  world[$entityMasks][generationId][eid] |= bitflag

  // Zero out each property value
  // component._reset(eid)

  // todo: archetype graph
  const queries = world[$queries]
  queries.forEach(query => {
    const components = query[$queryComponents]
    if (!queryCheckComponents(world, query, components)) return
    const match = queryCheckEntity(world, query, eid)
    if (match) queryAddEntity(world, query, eid)
  })
}

export const removeComponent = (world, component, eid) => world[$deferredComponentRemovals].push(component, eid)

export const commitComponentRemovals = (world) => {
  const deferredComponentRemovals = world[$deferredComponentRemovals]
  for (let i = 0; i < deferredComponentRemovals.length; i += 2) {
    const component = deferredComponentRemovals[i]
    const eid = deferredComponentRemovals[i + 1]

    const { generationId, bitflag } = world[$componentMap].get(component)

    if (!(world[$entityMasks][generationId][eid] & bitflag)) return

    // Remove flag from entity bitmask
    world[$entityMasks][generationId][eid] &= ~bitflag

    // todo: archetype graph
    const queries = world[$queries]
    queries.forEach(query => {
      const components = query[$queryComponents]
      if (!queryCheckComponents(world, query, components)) return
      const match = queryCheckEntity(world, query, eid)
      if (match) queryRemoveEntity(world, query, eid)
    })
  }
  deferredComponentRemovals.length = 0
}


// export const Component = (config, registry, DataManager) => {
//   const { entities, components, queries } = registry
//   const deferredComponentRemovals = []

//   let generation = 0
//   const getGeneration = () => generation

//   /**
//    * Register a new component with the world.
//    *
//    * @example <caption>Register a flat component.</caption>
//    * import World from 'bitecs'
//    *
//    * const world = World()
//    * world.registerComponent('POSITION', {
//    *   x: 'float32',
//    *   y: 'float32'
//    * })
//    *
//    * @example <caption>Register a nested component.</caption>
//    * import World from 'bitecs'
//    *
//    * const world = World()
//    * world.registerComponent('POSITION', {
//    *   world: { x: 'float32', y: 'float32' }
//    * })
//    *
//    * @example <caption>Register an enum component.</caption>
//    * import World from 'bitecs'
//    *
//    * const world = World()
//    * world.registerComponent('STATE', {
//    *   animation: ['IDLE', 'WALK', 'RUN']
//    * })
//    *
//    * @example <caption>Register an array component.</caption>
//    * import World from 'bitecs'
//    *
//    * const world = World()
//    * world.registerComponent('POLYGON', {
//    *   points: {
//    *    x: [{ index: 'uint8', type: 'float32', length: 8 }],
//    *    y: [{ index: 'uint8', type: 'float32', length: 8 }]
//    *  }
//    * })
//    *
//    * // The `length` param is optional and defaults to the max size of the `index` type.
//    *
//    * @memberof module:World
//    * @param {string} name    - Name of component.
//    * @param {Object} schema  - Data structure and types for component.
//    * @returns {Object} DataManager for the component.
//    */
//   const Component = (schema) => {
//     if (Object.keys(components).length + 1 > config.maxComponentTypes) {
//       throw new Error(
//         `❌ Cannot register component, max component types of '${config.maxComponentTypes}' reached.`
//       )
//     }
//     const component = DataManager(config.maxEntities, schema)
//     components.push(component)
//     generation = components._generationId
//     return components
//   }
  
//   // generation ID incremented and global bitflag reset to 1 when global bitflag reaches 2^32 (when all bits are set to 1)
//   let globalBitflag = 1
//   let generationId = 0
//   const register = component => {
//     globalBitflag *= 2
//     if (globalBitflag >= Math.pow(2, 32)) {
//       globalBitflag = 1
//       generationId += 1
//    }

   
//   }

//   /**
//    * Add a registered component to an entity.
//    *
//    * @example <caption>Add a component to an entity.</caption>
//    * import World from 'bitecs'
//    *
//    * const world = World()
//    * world.registerComponent('POSITION', {
//    *   x: 'float32',
//    *   y: 'float32'
//    * })
//    *
//    * const eid = world.addEntity()
//    * world.addComponent('POSITION', eid)
//    *
//    * @example <caption>Add a component to en entity with default values</caption>
//    * import World from 'bitecs'
//    *
//    * const world = World()
//    * world.registerComponent('POSITION', {
//    *   x: 'float32',
//    *   y: 'float32'
//    * })
//    *
//    * const eid = world.addEntity()
//    * world.addComponent('POSITION', eid, { x: 100, y: 100 })
//    *
//    * @memberof module:World
//    * @param {string} name   - Name of the component,
//    * @param {uint32} eid    - Entity id.
//    * @param {object} values - Optional values to set upon component initialization.
//    * @param {boolean} reset - Zero out the component values.
//    */
//   const add = (component, eid, values = {}, reset = true) => {
//     if (has(component, eid)) return

//     const { _generationId, _bitflag } = component

//     // Add bitflag to entity bitmask
//     entities[_generationId][eid] |= _bitflag

//     // Zero out each property value
//     if (reset) component._reset(eid)

//     // Set values if any
//     component._set(eid, values)

//     // Add to queries that match the entity bitmask
//     // todo: archetype graph
//     for (let i = 0; i < queries.length; i++) {
//       const query = queries[i]
//       if (
//         query.components.length &&
//         query.checkComponent(component) &&
//         query.check(eid)
//       ) {
//         query.add(eid)
//       }
//     }
//   }

//   /**
//    * Internal remove component. Actually removes the component.
//    * @private
//    */
//   const commitComponentRemovals = () => {
//     if (deferredComponentRemovals.length === 0) return

//     for (let i = 0; i < deferredComponentRemovals.length; i += 2) {
//       const component = deferredComponentRemovals[i]
//       const eid = deferredComponentRemovals[i + 1]

//       const { _generationId, _bitflag } = component

//       if (!(entities[_generationId][eid] & _bitflag)) return

//       // Remove flag from entity bitmask
//       entities[_generationId][eid] &= ~_bitflag

//       // Remove from queries that no longer match the entity bitmask
//       for (let i = 0; i < queries.length; i++) {
//         const query = queries[i]
//         if (
//           query.components.length &&
//           query.checkComponent(component) &&
//           !query.check(eid)
//         ) {
//           query.remove(eid)
//         }
//       }
//     }

//     deferredComponentRemovals.length = 0
//   }

//   /**
//    * Remove a component type from an entity.
//    *
//    * @example <caption>Remove a component deferred.</caption>
//    * import World from 'bitecs'
//    *
//    * const world = World()
//    * world.registerComponent('POSITION', {
//    *   x: 'float32',
//    *   y: 'float32'
//    * })
//    *
//    * const eid = world.addEntity()
//    * world.addComponent('POSITION', eid, { x: 100, y: 100 }) // Component added
//    * world.step()
//    *
//    * world.removeComponent('POSITION', eid)
//    * world.step() // Component Removed
//    *
//    * @example <caption>Remove a component immediately.</caption>
//    * import World from 'bitecs'
//    *
//    * const world = World()
//    * world.registerComponent('POSITION', {
//    *   x: 'float32',
//    *   y: 'float32'
//    * })
//    *
//    * const eid = world.addEntity()
//    * world.addComponent('POSITION', eid, { x: 100, y: 100 }) // Component added
//    * world.step()
//    *
//    * world.removeComponent('POSITION', eid)
//    * world.step() // Component removed after system has finished running
//    *
//    * @memberof module:World
//    * @param {string} name       - Name of the component.
//    * @param {uint32} eid        - Entity id.
//    */
//   const remove = (component, eid) => {
//     deferredComponentRemovals.push(component, eid)
//   }

//   /**
//    * Removes all components from the given entity.
//    *
//    * @example <caption>Remove all components from an entity deferred.</caption>
//    * import World from 'bitecs'
//    *
//    * const world = World()
//    * world.registerComponent('POSITION', {
//    *   x: 'float32',
//    *   y: 'float32'
//    * })
//    * world.registerComponent('VELOCITY', {
//    *   vx: 'int8',
//    *   vy: 'int8,
//    * })
//    *
//    * const eid = world.addEntity()
//    * world.addComponent('POSITION', eid, { x: 100, y: 100 }) // Component added
//    * world.addComponent('VELOCITY', eid) // Component added
//    *
//    * world.removeAllComponent(eid)
//    * world.step() // All components Removed
//    *
//    * @example <caption>Remove all components from an entity deferred.</caption>
//    * import World from 'bitecs'
//    *
//    * const world = World()
//    * world.registerComponent('POSITION', {
//    *   x: 'float32',
//    *   y: 'float32'
//    * })
//    * world.registerComponent('VELOCITY', {
//    *   vx: 'int8',
//    *   vy: 'int8,
//    * })
//    *
//    * const eid = world.addEntity()
//    * world.addComponent('POSITION', eid, { x: 100, y: 100 }) // Component added
//    * world.addComponent('VELOCITY', eid) // Component added
//    *
//    * world.removeAllComponent(eid, true) // All components Removed
//    *
//    * @memberof module:World
//    * @param {uint32} eid - Entity id.
//    */
//   const removeAll = eid => {
//     components.forEach(component => {
//       removeComponent(component, eid)
//     })
//   }

//   /**
//    * Check if an entity has the specified component.
//    *
//    * @example <caption>Check if entity has component.</caption>
//    * import World from 'bitecs'
//    *
//    * const world = World()
//    * world.registerComponent('POSITION', {
//    *   x: 'float32',
//    *   y: 'float32'
//    * })
//    *
//    * const eid = world.addEntity()
//    * world.hasComponent('POSITION', eid) // false
//    *
//    * world.addComponent('POSITION', eid, { x: 100, y: 100 })
//    * world.hasComponent('POSITION', eid) // true
//    *
//    * @memberof module:World
//    * @param {string} name - Component name.
//    * @param {uint32} eid  - Entity id.
//    * @returns {boolean} Wether or not the component exists on the entity.
//    */
//   const has = (component, eid) => {
//     const { _generationId, _bitflag } = component
//     const mask = entities[_generationId][eid]
//     return (mask & _bitflag) === _bitflag
//   }

//   return {
//     getGeneration,
//     Component,
//     add,
//     remove,
//     removeAll,
//     has,
//     commitComponentRemovals
//   }
// }
