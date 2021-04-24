import { $queryMap } from "./Query.js"
import { $indexBytes, $indexType, $queryShadow, $serializeShadow, $storeBase, $storeFlattened } from "./Storage.js"
import { $componentMap, addComponent, hasComponent } from "./Component.js"
import { $entityEnabled, addEntity } from "./Entity.js"

export const diff = (world, query) => {
  const q = world[$queryMap].get(query)
  q.changed.length = 0
  const flat = q.flatProps
  for (let i = 0; i < q.entities.length; i++) {
    const eid = q.entities[i]
    let dirty = false
    for (let pid = 0; pid < flat.length; pid++) {
      const prop = flat[pid]
      if (ArrayBuffer.isView(prop[eid])) {
        for (let i = 0; i < prop[eid].length; i++) {
          if (prop[eid][i] !== prop[eid][$queryShadow][i]) {
            dirty = true
            prop[eid][$queryShadow][i] = prop[eid][i]
          }
        }
      } else {
        if (prop[eid] !== prop[$queryShadow][eid]) {
          dirty = true
          prop[$queryShadow][eid] = prop[eid]
        }
      }
    }
    if (dirty) q.changed.push(eid)
  }
  return q.changed
}

const canonicalize = (target) => {
  let componentProps
  let changedProps = new Set()
  if (Array.isArray(target)) {
    componentProps = target
      .map(p => {
        if (typeof p === 'function' && p.name === 'QueryChanged') {
          p()[$storeFlattened].forEach(prop => {
            changedProps.add(prop)
          })
          return p()[$storeFlattened]
        }
        return p[$storeFlattened]
      })
      .reduce((a,v) => a.concat(v), [])
  } else {
    target[$componentMap].forEach(c => {
      componentProps = componentProps.concat(c[$storeFlattened])
    })
  }
  return [componentProps, changedProps]
}

export const defineSerializer = (target, maxBytes = 20_000_000) => {
  const [componentProps, changedProps] = canonicalize(target)

  // TODO: calculate max bytes based on target

  const buffer = new ArrayBuffer(maxBytes)
  const view = new DataView(buffer)

  return ents => {
    if (!ents.length) return

    let where = 0

    // iterate over component props
    for (let pid = 0; pid < componentProps.length; pid++) {
      const prop = componentProps[pid]
      const diff = changedProps.has(prop)
      
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

        // skip if diffing and no change
        if (diff && prop[eid] === prop[$serializeShadow][eid]) {
          continue
        }
        
        count++

        // write eid
        view.setUint32(where, eid)
        where += 4

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

export const defineDeserializer = (target) => {
  const [componentProps] = canonicalize(target)
  return (world, packet) => {
    const view = new DataView(packet)
    let where = 0

    while (where < packet.byteLength) {

      // pid
      const pid = view.getUint8(where)
      where += 1

      // entity count
      const entityCount = view.getUint32(where)
      where += 4

      // typed array
      const ta = componentProps[pid]

      // Get the properties and set the new state
      for (let i = 0; i < entityCount; i++) {
        let eid = view.getUint32(where)
        where += 4

        // if this world hasn't seen this eid yet
        if (!world[$entityEnabled][eid]) {
          // make a new entity for the data
          eid = addEntity(world)
        }

        const component = ta[$storeBase]()
        if (!hasComponent(world, component, eid)) {
          addComponent(world, component, eid)
        }
        
        if (ArrayBuffer.isView(ta[eid])) {
          const array = ta[eid]
          const count = view[`get${array[$indexType]}`](where)
          where += array[$indexBytes]

          // iterate over count
          for (let i = 0; i < count; i++) {
            const index = view[`get${array[$indexType]}`](where)
            where += array[$indexBytes]

            const value = view[`get${array.constructor.name.replace('Array', '')}`](where)
            where += array.BYTES_PER_ELEMENT

            ta[eid][index] = value
          }
        } else {
          let value = view[`get${ta.constructor.name.replace('Array', '')}`](where)
          where += ta.BYTES_PER_ELEMENT

          ta[eid] = value
        }
      }
    }
  }
}