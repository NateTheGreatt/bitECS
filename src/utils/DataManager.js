/* globals SharedArrayBuffer */

export const TYPES_ENUM = {
  bool: 'bool',
  int8: 'int8',
  uint8: 'uint8',
  uint8clamped: 'uint8clamped',
  int16: 'int16',
  uint16: 'uint16',
  int32: 'int32',
  uint32: 'uint32',
  float32: 'float32',
  float64: 'float64'
}

export const TYPES = {
  bool: 'bool',
  int8: Int8Array,
  uint8: Uint8Array,
  uint8clamped: Uint8ClampedArray,
  int16: Int16Array,
  uint16: Uint16Array,
  int32: Int32Array,
  uint32: Uint32Array,
  float32: Float32Array,
  float64: Float64Array
}

const UNSIGNED_MAX = {
  uint8: 255,
  uint16: 65535,
  uint32: 4294967295
}

const roundToPower4 = x => Math.ceil(x / 4) * 4

export const DataManager = () => {
  // generation ID incremented and global bitflag reset to 1 when global bitflag reaches 2^32 (when all bits are set to 1)
  let globalBitflag = 1
  let generationId = 0

  const Manager = (n, schema = {}, base = true) => {
    const manager = {}
    const maps = {}
    const subarrays = {}

    const props = Object.keys(schema)

    const arrays = props.filter(p => Array.isArray(schema[p]) && typeof schema[p][0] === 'object')
    const cursors = Object.keys(TYPES).reduce((a, type) => ({ ...a, [type]: 0 }), {})

    props.forEach(prop => {
      // Boolean Type
      if (schema[prop] === 'bool') {
        const Type = TYPES.uint8
        const totalBytes = n * TYPES.uint8.BYTES_PER_ELEMENT
        const buffer = new SharedArrayBuffer(totalBytes)
        maps[prop] = schema[prop]
        manager[prop] = new Type(buffer)
        manager[prop]._boolType = true

        // Enum Type
      } else if (Array.isArray(schema[prop]) && typeof schema[prop][0] === 'string') {
        const Type = TYPES.uint8
        const totalBytes = n * TYPES.uint8.BYTES_PER_ELEMENT
        const buffer = new SharedArrayBuffer(totalBytes)
        maps[prop] = schema[prop]
        manager[prop] = new Type(buffer)

        // Array Type
      } else if (Array.isArray(schema[prop]) && typeof schema[prop][0] === 'object') {
        const { index, type, length } = schema[prop][0]

        if (!length) throw new Error('❌ Must define a length for component array.')
        if (!TYPES[type]) throw new Error(`❌ Invalid component array property type ${type}.`)
        if (!TYPES[index]) throw new Error(`❌ Invalid component array index type ${index}.`)
        if (!UNSIGNED_MAX[index]) throw new Error(`❌ Index type for component array must be unsigned (non-negative), instead was ${index}.`)

        // create buffer for type if it does not already exist
        if (!subarrays[type]) {
          const relevantArrays = arrays.filter(p => schema[p][0].type === type)
          const summedBytesPerElement = relevantArrays.reduce((a, p) => a + TYPES[type].BYTES_PER_ELEMENT, 0)
          const summedLength = relevantArrays.reduce((a, p) => a + length, 0)
          const buffer = new SharedArrayBuffer(roundToPower4(summedBytesPerElement * summedLength * n))
          const array = new TYPES[type](buffer)
          array._indexType = index
          array._indexBytes = TYPES[index].BYTES_PER_ELEMENT
          subarrays[type] = array
        }

        // pre-generate subarrays for each eid
        manager[prop] = {}
        let end = 0
        for (let eid = 0; eid < n; eid++) {
          const from = cursors[type] + (eid * length)
          const to = from + length
          manager[prop][eid] = subarrays[type].subarray(from, to)
          end = to
        }

        cursors[type] = end

        manager[prop]._reset = eid => manager[prop][eid].fill(0)
        manager[prop]._set = (eid, values) => manager[prop][eid].set(values, 0)

        // Object Type
      } else if (typeof schema[prop] === 'object') {
        manager[prop] = Manager(n, schema[prop], false)

        // String Type
      } else if (typeof schema[prop] === 'string') {
        const type = schema[prop]
        const totalBytes = n * TYPES[type].BYTES_PER_ELEMENT
        const buffer = new SharedArrayBuffer(totalBytes)
        manager[prop] = new TYPES[type](buffer)

        // TypedArray Type
      } else if (typeof schema[prop] === 'function') {
        const Type = schema[prop]
        const totalBytes = n * Type.BYTES_PER_ELEMENT
        const buffer = new SharedArrayBuffer(totalBytes)
        manager[prop] = new Type(buffer)
      } else {
        throw new Error(`ECS Error: invalid property type ${schema[prop]}`)
      }
    })

    // methods
    Object.defineProperty(manager, '_schema', {
      value: schema
    })

    Object.defineProperty(manager, '_props', {
      value: Object.keys(schema)
    })

    Object.defineProperty(manager, '_mapping', {
      value: prop => maps[prop]
    })

    // Recursively set all values to 0
    Object.defineProperty(manager, '_reset', {
      value: eid => {
        for (const prop of manager._props) {
          if (ArrayBuffer.isView(manager[prop])) {
            if (ArrayBuffer.isView(manager[prop][eid])) {
              manager[prop][eid].fill(0)
            } else {
              manager[prop][eid] = 0
            }
          } else {
            manager[prop]._reset(eid)
          }
        }
      }
    })

    // Recursively set all values from a supplied object
    Object.defineProperty(manager, '_set', {
      value: (eid, values) => {
        for (const prop in values) {
          const mapping = manager._mapping(prop)
          if (mapping && typeof values[prop] === 'string') {
            manager.enum(prop, eid, values[prop])
          } else if (ArrayBuffer.isView(manager[prop])) {
            manager[prop][eid] = values[prop]
          } else if (Array.isArray(values[prop]) && ArrayBuffer.isView(manager[prop][eid])) {
            manager[prop][eid].set(values[prop], 0)
          } else if (typeof manager[prop] === 'object') {
            manager[prop]._set(eid, values[prop])
          }
        }
      }
    })

    Object.defineProperty(manager, '_get', {
      value: (eid) => {
        const obj = {}
        for (const prop of manager._props) {
          const mapping = manager._mapping(prop)
          if (mapping) {
            obj[prop] = manager.enum(prop, eid)
          } else if (ArrayBuffer.isView(manager[prop])) {
            obj[prop] = manager[prop][eid]
          } else if (typeof manager[prop] === 'object') {
            if (ArrayBuffer.isView(manager[prop][eid])) {
              obj[prop] = Array.from(manager[prop][eid])
            } else {
              obj[prop] = manager[prop]._get(eid)
            }
          }
        }
        return obj
      }
    })

    // Aggregate all typedArrays into single kvp array (memoized)
    let flattened
    Object.defineProperty(manager, '_flatten', {
      value: (flat = []) => {
        if (flattened) return flattened
        for (const prop of manager._props) {
          if (ArrayBuffer.isView(manager[prop])) {
            flat.push(manager[prop])
          } else if (typeof manager[prop] === 'object') {
            manager[prop]._flatten(flat)
          }
        }
        flattened = flat
        return flat
      }
    })

    Object.defineProperty(manager, '_bitflag', {
      value: globalBitflag
    })

    Object.defineProperty(manager, '_generationId', {
      value: generationId
    })

    Object.defineProperty(manager, 'check', {
      value: (mask) => (mask & manager._bitflag) === manager._bitflag
    })

    Object.defineProperty(manager, 'enum', {
      value: (prop, eid, value) => {
        const mapping = manager._mapping(prop)
        if (!mapping) {
          console.warn('Property is not an enum.')
          return undefined
        }
        if (value) {
          const index = mapping.indexOf(value)
          if (index === -1) {
            console.warn(`Value '${value}' is not part of enum.`)
            return undefined
          }
          manager[prop][eid] = index
        } else {
          return mapping[manager[prop][eid]]
        }
      }
    })

    // only increment bitflag for the base object
    if (base) {
      globalBitflag *= 2
      if (globalBitflag >= Math.pow(2, 32)) {
        globalBitflag = 1
        generationId += 1
      }
    }

    return manager
  }

  return Manager
}
