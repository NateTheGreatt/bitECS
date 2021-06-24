import { $indexBytes, $indexType, $serializeShadow, $storeBase, $storeFlattened, $tagStore, createShadow } from "./Storage.js"
import { $componentMap, addComponent, hasComponent } from "./Component.js"
import { $entityArray, $entityEnabled, $entitySparseSet, addEntity, eidToWorld } from "./Entity.js"

let resized = false

export const setSerializationResized = v => { resized = v }

const canonicalize = (target) => {
  let componentProps = []
  let changedProps = new Map()
  if (Array.isArray(target)) {
    componentProps = target
      .map(p => {
        if (!p) throw new Error('👾 bitECS - undefined component passed into serializer.')
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

export const defineSerializer = (target, maxBytes = 20000000) => {
  const isWorld = Object.getOwnPropertySymbols(target).includes($componentMap)

  let [componentProps, changedProps] = canonicalize(target)

  // TODO: calculate max bytes based on target

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
      const diff = changedProps.get(prop)
      
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
        // TODO: check array diff
        if (diff && prop[eid] === prop[diff][eid]) {
          continue
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

            if (diff && prop[eid][i] === prop[eid][$serializeShadow][i]) {
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
          prop[$serializeShadow][eid] = prop[eid]
        }
      }

      view.setUint32(countWhere, count)
    }
    return buffer.slice(0, where)
  }
}

const newEntities = new Map()

export const defineDeserializer = (target) => {
  const isWorld = Object.getOwnPropertySymbols(target).includes($componentMap)
  let [componentProps] = canonicalize(target)
  return (world, packet, overwrite=true) => {

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

        let newEid = newEntities.get(eid)
        if (newEid !== undefined) {
          eid = newEid
        }

        // if this world hasn't seen this eid yet, or if not overwriting
        if (!world[$entitySparseSet].has(eid) || !overwrite) {
          // make a new entity for the data
          const newEid = addEntity(world)
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