import { $indexBytes, $indexType, $serializeShadow, $storeBase, $storeFlattened, $tagStore, createShadow } from "./Storage.js"
import { $componentMap, addComponent, hasComponent } from "./Component.js"
import { $entityArray, $entitySparseSet, addEntity, eidToWorld } from "./Entity.js"
import { $localEntities } from "./World.js"

export const DESERIALIZE_MODE = {
  REPLACE: 0,
  APPEND: 1,
  MAP: 2
}

let resized = false

export const setSerializationResized = v => { resized = v }

const canonicalize = (target) => {
  let componentProps = []
  let changedProps = new Map()
  if (Array.isArray(target)) {
    componentProps = target
      .map(p => {
        if (!p) throw new Error('bitECS - Cannot serialize undefined component')
        if (typeof p === 'function' && p.name === 'QueryChanged') {
          p()[$storeFlattened].forEach(prop => {
            const $ = Symbol()
            createShadow(prop, $)
            changedProps.set(prop, $)
          })
          return p()[$storeFlattened]
        }
        if (Object.getOwnPropertySymbols(p).includes($storeFlattened)) {
          return p[$storeFlattened]
        }
        if (Object.getOwnPropertySymbols(p).includes($storeBase)) {
          return p
        }
      })
      .reduce((a,v) => a.concat(v), [])
  }
  return [componentProps, changedProps]
}

/**
 * Defines a new serializer which targets the given components to serialize the data of when called on a world or array of EIDs.
 *
 * @param {object|array} target
 * @param {number} [maxBytes=20000000]
 * @returns {function} serializer
 */
export const defineSerializer = (target, maxBytes = 20000000) => {
  const isWorld = Object.getOwnPropertySymbols(target).includes($componentMap)

  let [componentProps, changedProps] = canonicalize(target)

  // TODO: calculate max bytes based on target & recalc upon resize

  const buffer = new ArrayBuffer(maxBytes)
  const view = new DataView(buffer)

  return (ents) => {

    if (resized) {
      [componentProps, changedProps] = canonicalize(target)
      resized = false
    }

    if (isWorld) {
      componentProps = []
      target[$componentMap].forEach((c, component) => {
        if (component[$storeFlattened])
          componentProps.push(...component[$storeFlattened])
        else componentProps.push(component)
      })
    }
    
    let world
    if (Object.getOwnPropertySymbols(ents).includes($componentMap)) {
      world = ents
      ents = ents[$entityArray]
    } else {
      world = eidToWorld.get(ents[0])
    }

    if (!ents.length) return

    let where = 0

    // iterate over component props
    for (let pid = 0; pid < componentProps.length; pid++) {
      const prop = componentProps[pid]
      const $diff = changedProps.get(prop)
      
      // write pid
      view.setUint8(where, pid)
      where += 1

      // save space for entity count
      const countWhere = where
      where += 4
      
      let count = 0
      // write eid,val
      for (let i = 0; i < ents.length; i++) {
        const eid = ents[i]

        // skip if entity doesn't have this component
        if (!hasComponent(world, prop[$storeBase](), eid)) {
          continue
        }

        // skip if diffing and no change
        // TODO: optimize array diff
        if ($diff) {
          if (ArrayBuffer.isView(prop[eid])) {
            let dirty = false
            for (let i = 0; i < prop[eid].length; i++) {
              if(prop[eid][i] !== prop[eid][$diff][i]) {
                dirty = true
                break
              }
            }
            if (dirty) continue
          } else if (prop[eid] === prop[$diff][eid]) continue
        }

        count++

        // write eid
        view.setUint32(where, eid)
        where += 4

        if (prop[$tagStore]) {
          continue
        }

        // if property is an array
        if (ArrayBuffer.isView(prop[eid])) {
          const type = prop[eid].constructor.name.replace('Array', '')
          const indexType = prop[eid][$indexType]
          const indexBytes = prop[eid][$indexBytes]

          // add space for count of dirty array elements
          const countWhere2 = where
          where += 1

          let count2 = 0

          // write index,value
          for (let i = 0; i < prop[eid].length; i++) {
            const value = prop[eid][i]

            if ($diff && prop[eid][i] === prop[eid][$diff][i]) {
              continue
            }

            // write array index
            view[`set${indexType}`](where, i)
            where += indexBytes

            // write value at that index
            view[`set${type}`](where, value)
            where += prop[eid].BYTES_PER_ELEMENT
            count2++
          }

          // write total element count
          view[`set${indexType}`](countWhere2, count2)

        } else {
          // regular property values
          const type = prop.constructor.name.replace('Array', '')
          // set value next [type] bytes
          view[`set${type}`](where, prop[eid])
          where += prop.BYTES_PER_ELEMENT

          // sync shadow state
          if (prop[$diff]) prop[$diff][eid] = prop[eid]
        }
      }

      view.setUint32(countWhere, count)
    }
    return buffer.slice(0, where)
  }
}

const newEntities = new Map()

/**
 * Defines a new deserializer which targets the given components to deserialize onto a given world.
 *
 * @param {object|array} target
 * @returns {function} deserializer
 */
export const defineDeserializer = (target) => {
  const isWorld = Object.getOwnPropertySymbols(target).includes($componentMap)
  let [componentProps] = canonicalize(target)


  return (world, packet, mode=0) => {

    newEntities.clear()
    
    if (resized) {
      [componentProps] = canonicalize(target)
      resized = false
    }

    if (isWorld) {
      componentProps = []
      target[$componentMap].forEach((c, component) => {
        if (component[$storeFlattened])
          componentProps.push(...component[$storeFlattened])
        else componentProps.push(component)
      })
    }

    const localEntities = world[$localEntities]

    const view = new DataView(packet)
    let where = 0

    while (where < packet.byteLength) {

      // pid
      const pid = view.getUint8(where)
      where += 1

      // entity count
      const entityCount = view.getUint32(where)
      where += 4

      // component property
      const prop = componentProps[pid]

      // Get the entities and set their prop values
      for (let i = 0; i < entityCount; i++) {
        let eid = view.getUint32(where)
        where += 4

        if (mode === DESERIALIZE_MODE.MAP) {

          if (localEntities.has(eid)) {
            eid = localEntities.get(eid)
          } else if (newEntities.has(eid)) {
            eid = newEntities.get(eid)
          } else {
            const newEid = addEntity(world)
            localEntities.set(eid, newEid)
            newEntities.set(eid, newEid)
            eid = newEid
          }
        }

        if (mode === DESERIALIZE_MODE.APPEND ||  
          mode === DESERIALIZE_MODE.REPLACE && !world[$entitySparseSet].has(eid)
        ) {
          const newEid = newEntities.get(eid) || addEntity(world)
          newEntities.set(eid, newEid)
          eid = newEid
        }

        const component = prop[$storeBase]()
        if (!hasComponent(world, component, eid)) {
          addComponent(world, component, eid)
        }

        if (component[$tagStore]) {
          continue
        }
        
        if (ArrayBuffer.isView(prop[eid])) {
          const array = prop[eid]
          const count = view[`get${array[$indexType]}`](where)
          where += array[$indexBytes]

          // iterate over count
          for (let i = 0; i < count; i++) {
            const index = view[`get${array[$indexType]}`](where)
            where += array[$indexBytes]

            const value = view[`get${array.constructor.name.replace('Array', '')}`](where)
            where += array.BYTES_PER_ELEMENT

            prop[eid][index] = value
          }
        } else {
          const value = view[`get${prop.constructor.name.replace('Array', '')}`](where)
          where += prop.BYTES_PER_ELEMENT

          prop[eid] = value
        }
      }
    }
  }
}