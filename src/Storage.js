export const TYPES_ENUM = {
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

export const TYPES_NAMES = {
  i8: 'Int8',
  ui8: 'Uint8',
  ui8c: 'Uint8Clamped',
  i16: 'Int16',
  ui16: 'Uint16',
  i32: 'Int32',
  ui32: 'Uint32',
  f32: 'Float32',
  f64: 'Float64'
}

export const TYPES = {
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
  uint8: 2**8,
  uint16: 2**16,
  uint32: 2**32
}

const roundToMultiple4 = x => Math.ceil(x / 4) * 4

export const $storeRef = Symbol('storeRef')
export const $storeSize = Symbol('storeSize')
export const $storeMaps = Symbol('storeMaps')
export const $storeFlattened = Symbol('storeFlattened')
export const $storeBase = Symbol('storeBase')

export const $storeArrayCounts = Symbol('storeArrayCount')
export const $storeSubarrays = Symbol('storeSubarrays')
export const $storeCursor = Symbol('storeCursor')
export const $subarrayCursors = Symbol('subarrayCursors')
export const $subarray = Symbol('subarray')

export const $queryShadow = Symbol('queryShadow')
export const $serializeShadow = Symbol('serializeShadow')

export const $indexType = Symbol('indexType')
export const $indexBytes = Symbol('indexBytes')

const stores = {}

export const resize = (ta, size) => {
  const newBuffer = new ArrayBuffer(size * ta.BYTES_PER_ELEMENT)
  const newTa = new ta.constructor(newBuffer)
  newTa.set(ta, 0)
  return newTa
}

const resizeRecursive = (store, size) => {
  Object.keys(store).forEach(key => {
    const ta = store[key]
    if (ta[$subarray]) return
    else if (ArrayBuffer.isView(ta)) {
      store[key] = resize(ta, size)
      store[key][$queryShadow] = resize(ta[$queryShadow], size)
      store[key][$serializeShadow] = resize(ta[$serializeShadow], size)
    } else if (typeof ta === 'object') {
      resizeRecursive(store[key], size)
    }
  })
}

const resizeSubarrays = (metadata, size) => {
  Object.keys(metadata[$subarrayCursors]).forEach(k => {
    metadata[$subarrayCursors][k] = 0
  })
  const cursors = metadata[$subarrayCursors]
  metadata[$storeFlattened]
    .filter(store => !ArrayBuffer.isView(store))
    .forEach(store => {
      const type = store.type
      const length = store[0].length
      const arrayCount = metadata[$storeArrayCounts][type]
      const summedLength = Array(arrayCount).fill(0).reduce((a, p) => a + length, 0)
      
      // for threaded impl
      // const summedBytesPerElement = Array(arrayCount).fill(0).reduce((a, p) => a + TYPES[type].BYTES_PER_ELEMENT, 0)
      // const totalBytes = roundToMultiple4(summedBytesPerElement * summedLength * size)
      // const buffer = new ArrayBuffer(totalBytes)
  
      const array = new TYPES[type](summedLength * size)

      array.set(metadata[$storeSubarrays][type])
      
      metadata[$storeSubarrays][type] = array
      metadata[$storeSubarrays][type][$queryShadow] = array.slice(0)
      metadata[$storeSubarrays][type][$serializeShadow] = array.slice(0)

      let end = 0
      for (let eid = 0; eid < size; eid++) {
        const from = cursors[type] + (eid * length)
        const to = from + length

        store[eid] = metadata[$storeSubarrays][type].subarray(from, to)
        
        store[eid].from = from
        store[eid].to = to
        store[eid][$queryShadow] = metadata[$storeSubarrays][type][$queryShadow].subarray(from, to)
        store[eid][$serializeShadow] = metadata[$storeSubarrays][type][$serializeShadow].subarray(from, to)
        store[eid][$subarray] = true
        store[eid][$indexType] = array[$indexType]
        store[eid][$indexBytes] = array[$indexBytes]
        
        end = to
      }
    })
}

export const resizeStore = (store, size) => {
  store[$storeSize] = size
  resizeRecursive(store, size)
  resizeSubarrays(store, size)
}

export const resetStore = store => {
  store[$storeFlattened].forEach(ta => {
    ta.fill(0)
  })
  Object.keys(store[$storeSubarrays]).forEach(key => {
    store[$storeSubarrays][key].fill(0)
  })
}

export const resetStoreFor = (store, eid) => {
  store[$storeFlattened].forEach(ta => {
    if (ArrayBuffer.isView(ta)) ta[eid] = 0
    else ta[eid].fill(0)
  })
}

const createTypeStore = (type, length) => {
  const totalBytes = length * TYPES[type].BYTES_PER_ELEMENT
  const buffer = new ArrayBuffer(totalBytes)
  return new TYPES[type](buffer)
}

const createArrayStore = (metadata, type, length) => {
  const size = metadata[$storeSize]
  const store = Array(size).fill(0)
  store.type = type

  const cursors = metadata[$subarrayCursors]
  const indexType =
    length < UNSIGNED_MAX.uint8
      ? 'ui8'
      : length < UNSIGNED_MAX.uint16
        ? 'ui16'
        : 'ui32'

  if (!length) throw new Error('❌ Must define a length for component array.')
  if (!TYPES[type]) throw new Error(`❌ Invalid component array property type ${type}.`)

  // create buffer for type if it does not already exist
  if (!metadata[$storeSubarrays][type]) {
    const arrayCount = metadata[$storeArrayCounts][type]
    const summedLength = Array(arrayCount).fill(0).reduce((a, p) => a + length, 0)
    
    // for threaded impl
    // const summedBytesPerElement = Array(arrayCount).fill(0).reduce((a, p) => a + TYPES[type].BYTES_PER_ELEMENT, 0)
    // const totalBytes = roundToMultiple4(summedBytesPerElement * summedLength * size)
    // const buffer = new ArrayBuffer(totalBytes)

    const array = new TYPES[type](summedLength * size)

    metadata[$storeSubarrays][type] = array
    metadata[$storeSubarrays][type][$queryShadow] = array.slice(0)
    metadata[$storeSubarrays][type][$serializeShadow] = array.slice(0)
    
    array[$indexType] = TYPES_NAMES[indexType]
    array[$indexBytes] = TYPES[indexType].BYTES_PER_ELEMENT
  }

  // pre-generate subarrays for each eid
  let end = 0
  for (let eid = 0; eid < size; eid++) {
    const from = cursors[type] + (eid * length)
    const to = from + length

    store[eid] = metadata[$storeSubarrays][type].subarray(from, to)
    
    store[eid].from = from
    store[eid].to = to
    store[eid][$queryShadow] = metadata[$storeSubarrays][type][$queryShadow].subarray(from, to)
    store[eid][$serializeShadow] = metadata[$storeSubarrays][type][$serializeShadow].subarray(from, to)
    store[eid][$subarray] = true
    store[eid][$indexType] = TYPES_NAMES[indexType]
    store[eid][$indexBytes] = TYPES[indexType].BYTES_PER_ELEMENT

    end = to
  }

  cursors[type] = end

  return store
}

const createShadows = (store) => {
  store[$queryShadow] = store.slice(0)
  store[$serializeShadow] = store.slice(0)
}

const isArrayType = x => Array.isArray(x) && typeof x[0] === 'string' && typeof x[1] === 'number'

export const createStore = (schema, size=10000) => {
  const $store = Symbol('store')

  if (!schema) return {}

  schema = JSON.parse(JSON.stringify(schema))

  const arrayCounts = {}
  const collectArrayCounts = s => {
    const keys = Object.keys(s)
    for (const k of keys) {
      if (isArrayType(s[k])) {
        if (!arrayCounts[s[k][0]]) arrayCounts[s[k][0]] = 0
        arrayCounts[s[k][0]]++
      } else if (s[k] instanceof Object) {
        collectArrayCounts(s[k])
      }
    }
  }
  collectArrayCounts(schema)

  const metadata = {
    [$storeSize]: size,
    [$storeMaps]: {},
    [$storeSubarrays]: {},
    [$storeRef]: $store,
    [$storeCursor]: 0,
    [$subarrayCursors]: Object.keys(TYPES).reduce((a, type) => ({ ...a, [type]: 0 }), {}),
    [$storeArrayCounts]: arrayCounts,
    [$storeFlattened]: []
  }

  if (schema instanceof Object && Object.keys(schema).length) {

    const recursiveTransform = (a, k) => {

      if (typeof a[k] === 'string') {

        a[k] = createTypeStore(a[k], size)
        a[k][$storeBase] = () => stores[$store]
        metadata[$storeFlattened].push(a[k])
        createShadows(a[k])

      } else if (isArrayType(a[k])) {
        
        const [type, length] = a[k]
        a[k] = createArrayStore(metadata, type, length)
        a[k][$storeBase] = () => stores[$store]
        metadata[$storeFlattened].push(a[k])
        // Object.freeze(a[k])

      } else if (a[k] instanceof Object) {
        
        a[k] = Object.keys(a[k]).reduce(recursiveTransform, a[k])
        // Object.freeze(a[k])
        
      }

      return a
    }

    stores[$store] = Object.assign(Object.keys(schema).reduce(recursiveTransform, schema), metadata)
    stores[$store][$storeBase] = () => stores[$store]

    // Object.freeze(stores[$store])

    return stores[$store]

  }

  // tag component
  stores[$store] = metadata
  stores[$store][$storeBase] = () => stores[$store]

  return stores[$store]
}

export const free = (store) => {
  delete stores[store[$storeRef]]
}