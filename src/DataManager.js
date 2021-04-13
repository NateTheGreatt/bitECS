export const TYPES_ENUM = {
  bool: 'bool',
  i8: 'i8',
  ui8: 'ui8',
  ui8c: 'ui8c',
  i16: 'i16',
  ui16: 'ui16',
  i32: 'i32',
  ui32: 'ui32',
  f32: 'f32',
  f64: 'f64'
}

export const TYPES = {
  bool: 'bool',
  i8: Int8Array,
  ui8: Uint8Array,
  ui8c: Uint8ClampedArray,
  i16: Int16Array,
  ui16: Uint16Array,
  i32: Int32Array,
  ui32: Uint32Array,
  f32: Float32Array,
  f64: Float64Array
}

const UNSIGNED_MAX = {
  uint8: 255,
  uint16: 65535,
  uint32: 4294967295
}

const roundToPower4 = x => Math.ceil(x / 4) * 4

const managers = {}

export const $managerRef = Symbol('managerRef')
export const $managerSize = Symbol('managerSize')
export const $managerMaps = Symbol('maps')
export const $managerSubarrays = Symbol('subarrays')
export const $managerCursor = Symbol('managerCursor')
export const $managerRemoved = Symbol('managerRemoved')

export const alloc = (schema, size=100000) => {
  const $manager = Symbol('manager')
  
  managers[$manager] = {
    [$managerSize]: size,
    [$managerMaps]: {},
    [$managerSubarrays]: {},
    [$managerRef]: $manager,
    [$managerCursor]: 0,
    [$managerRemoved]: []
  }

  const props = Object.keys(schema)

  let arrays = props.filter(p => Array.isArray(schema[p]) && typeof schema[p][0] === 'object')
  const cursors = Object.keys(TYPES).reduce((a, type) => ({ ...a, [type]: 0 }), {})

  if (typeof schema === 'string') {

    const type = schema
    const totalBytes = size * TYPES[type].BYTES_PER_ELEMENT
    const buffer = new ArrayBuffer(totalBytes)
    managers[$manager] = new TYPES[type](buffer)

  } else if (Array.isArray(schema)) {
    arrays = schema

    const { type, length } = schema[0]

    const indexType =
      length < UNSIGNED_MAX.uint8
        ? 'ui8'
        : length < UNSIGNED_MAX.uint16
          ? 'ui16'
          : 'ui32'

    if (!length) throw new Error('❌ Must define a length for component array.')
    if (!TYPES[type]) throw new Error(`❌ Invalid component array property type ${type}.`)

    // create buffer for type if it does not already exist
    if (!managers[$manager][$managerSubarrays][type]) {
      const relevantArrays = arrays
      const summedBytesPerElement = relevantArrays.reduce((a, p) => a + TYPES[type].BYTES_PER_ELEMENT, 0)
      const summedLength = relevantArrays.reduce((a, p) => a + length, 0)
      const buffer = new ArrayBuffer(roundToPower4(summedBytesPerElement * summedLength * size))
      const array = new TYPES[type](buffer)
      array._indexType = indexType
      array._indexBytes = TYPES[indexType].BYTES_PER_ELEMENT
      managers[$manager][$managerSubarrays][type] = array
    }

    // pre-generate subarrays for each eid
    let end = 0
    for (let eid = 0; eid < size; eid++) {
      const from = cursors[type] + (eid * length)
      const to = from + length
      managers[$manager][eid] = managers[$manager][$managerSubarrays][type].subarray(from, to)
      end = to
    }

    cursors[type] = end

    managers[$manager]._reset = eid => managers[$manager][eid].fill(0)
    managers[$manager]._set = (eid, values) => managers[$manager][eid].set(values, 0)


  } else props.forEach(prop => {
    // Boolean Type
    if (schema[prop] === 'bool') {
      const Type = TYPES.uint8
      const totalBytes = size * TYPES.uint8.BYTES_PER_ELEMENT
      const buffer = new ArrayBuffer(totalBytes)
      managers[$manager][$managerMaps][prop] = schema[prop]
      managers[$manager][prop] = new Type(buffer)
      managers[$manager][prop]._boolType = true

      // Enum Type
    } else if (Array.isArray(schema[prop]) && typeof schema[prop][0] === 'string') {
      const Type = TYPES.uint8
      const totalBytes = size * TYPES.uint8.BYTES_PER_ELEMENT
      const buffer = new ArrayBuffer(totalBytes)
      managers[$manager][$managerMaps][prop] = schema[prop]
      managers[$manager][prop] = new Type(buffer)

      // Array Type
    } else if (Array.isArray(schema[prop]) && typeof schema[prop][0] === 'object') {
      const { type, length } = schema[0]

      const indexType =
        length < UNSIGNED_MAX.uint8
          ? UNSIGNED_MAX.uint8
          : length < UNSIGNED_MAX.uint16
            ? UNSIGNED_MAX.uint16
            : UNSIGNED_MAX.uint32

      if (!length) throw new Error('❌ Must define a length for component array.')
      if (!TYPES[type]) throw new Error(`❌ Invalid component array property type ${type}.`)

      // create buffer for type if it does not already exist
      if (!managers[$manager][$managerSubarrays][type]) {
        const relevantArrays = arrays.filter(p => schema[p][0].type === type)
        const summedBytesPerElement = relevantArrays.reduce((a, p) => a + TYPES[type].BYTES_PER_ELEMENT, 0)
        const summedLength = relevantArrays.reduce((a, p) => a + length, 0)
        const buffer = new ArrayBuffer(roundToPower4(summedBytesPerElement * summedLength * size))
        const array = new TYPES[type](buffer)
        array._indexType = index
        array._indexBytes = TYPES[index].BYTES_PER_ELEMENT
        managers[$manager][$managerSubarrays][type] = array
      }

      // pre-generate subarrays for each eid
      managers[$manager][prop] = {}
      let end = 0
      for (let eid = 0; eid < size; eid++) {
        const from = cursors[type] + (eid * length)
        const to = from + length
        managers[$manager][prop][eid] = managers[$manager][$managerSubarrays][type].subarray(from, to)
        end = to
      }

      cursors[type] = end

      managers[$manager][prop]._reset = eid => managers[$manager][prop][eid].fill(0)
      managers[$manager][prop]._set = (eid, values) => managers[$manager][prop][eid].set(values, 0)

      // Object Type
    } else if (typeof schema[prop] === 'object') {
      managers[$manager][prop] = Manager(size, schema[prop], false)

      // String Type
    } else if (typeof schema[prop] === 'string') {
      const type = schema[prop]
      const totalBytes = size * TYPES[type].BYTES_PER_ELEMENT
      const buffer = new ArrayBuffer(totalBytes)
      managers[$manager][prop] = new TYPES[type](buffer)

      // TypedArray Type
    } else if (typeof schema[prop] === 'function') {
      const Type = schema[prop]
      const totalBytes = size * Type.BYTES_PER_ELEMENT
      const buffer = new ArrayBuffer(totalBytes)
      managers[$manager][prop] = new Type(buffer)
    } else {
      throw new Error(`ECS Error: invalid property type ${schema[prop]}`)
    }
  })

  // methods
  Object.defineProperty(managers[$manager], '_schema', {
    value: schema
  })

  Object.defineProperty(managers[$manager], '_mapping', {
    value: prop => managers[$manager][$managerMaps][prop]
  })

  // Recursively set all values to 0
  Object.defineProperty(managers[$manager], '_reset', {
    value: eid => {
      for (const prop of managers[$manager]._props) {
        if (ArrayBuffer.isView(managers[$manager][prop])) {
          if (ArrayBuffer.isView(managers[$manager][prop][eid])) {
            managers[$manager][prop][eid].fill(0)
          } else {
            managers[$manager][prop][eid] = 0
          }
        } else {
          managers[$manager][prop]._reset(eid)
        }
      }
    }
  })

  // Recursively set all values from a supplied object
  Object.defineProperty(managers[$manager], '_set', {
    value: (eid, values) => {
      for (const prop in values) {
        const mapping = managers[$manager]._mapping(prop)
        if (mapping && typeof values[prop] === 'string') {
          managers[$manager].enum(prop, eid, values[prop])
        } else if (ArrayBuffer.isView(managers[$manager][prop])) {
          managers[$manager][prop][eid] = values[prop]
        } else if (Array.isArray(values[prop]) && ArrayBuffer.isView(managers[$manager][prop][eid])) {
          managers[$manager][prop][eid].set(values[prop], 0)
        } else if (typeof managers[$manager][prop] === 'object') {
          managers[$manager][prop]._set(eid, values[prop])
        }
      }
    }
  })

  Object.defineProperty(managers[$manager], '_get', {
    value: (eid) => {
      const obj = {}
      for (const prop of managers[$manager]._props) {
        const mapping = managers[$manager]._mapping(prop)
        if (mapping) {
          obj[prop] = managers[$manager].enum(prop, eid)
        } else if (ArrayBuffer.isView(managers[$manager][prop])) {
          obj[prop] = managers[$manager][prop][eid]
        } else if (typeof managers[$manager][prop] === 'object') {
          if (ArrayBuffer.isView(managers[$manager][prop][eid])) {
            obj[prop] = Array.from(managers[$manager][prop][eid])
          } else {
            obj[prop] = managers[$manager][prop]._get(eid)
          }
        }
      }
      return obj
    }
  })

  // Aggregate all typedArrays into single kvp array (memoized)
  let flattened
  Object.defineProperty(managers[$manager], '_flatten', {
    value: (flat = []) => {
      if (flattened) return flattened
      for (const prop of managers[$manager]._props) {
        if (ArrayBuffer.isView(managers[$manager][prop])) {
          flat.push(managers[$manager][prop])
        } else if (typeof managers[$manager][prop] === 'object') {
          managers[$manager][prop]._flatten(flat)
        }
      }
      flattened = flat
      return flat
    }
  })

  Object.defineProperty(managers[$manager], 'enum', {
    value: (prop, eid, value) => {
      const mapping = managers[$manager]._mapping(prop)
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
        managers[$manager][prop][eid] = index
      } else {
        return mapping[managers[$manager][prop][eid]]
      }
    }
  })

  return managers[$manager]
}

// export const create = (manager) => {
//   const removed = manager[$managerRemoved]
//   const pointer = removed.length > 0 ? removed.pop() : manager[$managerCursor]++
//   if (pointer > manager[$managerSize]) {
//     throw new Error('❌ Maximum number of pointers reached.')
//   }
//   return pointer
// }

// export const remove = (manager, pointer) => {
//   manager[$managerRemoved].push(pointer)
// }

export const free = (manager) => {
  delete managers[manager[$managerRef]]
}