import assert, { strictEqual } from 'assert'
import { getDefaultSize } from '../../src/Entity.js'
import { Types } from '../../src/index.js'
import { createStore, resizeStore } from '../../src/Storage.js'
import { TYPES } from '../../src/Constants.js'

let defaultSize = getDefaultSize()

const arraysEqual = (a,b) => !!a && !!b && !(a<b || b<a)

describe('Storage Integration Tests', () => {
  it('should default to size of ' + defaultSize, () => {
    const store = createStore({ value: Types.i8 }, defaultSize)
    strictEqual(store.value.length, defaultSize)
  })
  it('should allow custom size', () => {
    const store = createStore({ value: Types.i8 }, 10)
    strictEqual(store.value.length, 10)
  })
  Object.keys(Types).forEach(type => {
    it('should create a store with ' + type, () => {
      const store = createStore({ value: type }, defaultSize)
      assert(store.value instanceof TYPES[type])
      strictEqual(store.value.length, defaultSize)
    })
  })
  Object.keys(Types).forEach(type => {
    it('should create a store with array of ' + type, () => {
      const store = createStore({ value: [type, 4] }, 10)
      assert(store.value instanceof Object)
      strictEqual(Object.keys(store.value).length, 10)
      assert(store.value[0] instanceof TYPES[type])
      strictEqual(store.value[0].length, 4)
    })
    it('should correctly set values on arrays of ' + type, () => {
      const store = createStore({ array: [type, 4] }, 3)
      store.array[0].set([1,2,3,4])
      store.array[1].set([5,6,7,8])
      store.array[2].set([9,10,11,12])
      assert(arraysEqual(Array.from(store.array[0]), [1,2,3,4]))
      assert(arraysEqual(Array.from(store.array[1]), [5,6,7,8]))
      assert(arraysEqual(Array.from(store.array[2]), [9,10,11,12]))
      strictEqual(store.array[3], undefined)
    })
    it('should resize arrays of ' + type, () => {
      const store = createStore({ array: [type, 4] }, 3)
      store.array[0].set([1,2,3,4])
      store.array[1].set([5,6,7,8])
      store.array[2].set([9,10,11,12])

      strictEqual(store.array[3], undefined)

      resizeStore(store, 6)

      assert(store.array[5] !== undefined)
      strictEqual(store.array[6], undefined)

      // console.log(store.array[0])
      assert(arraysEqual(Array.from(store.array[0]), [1,2,3,4]))
      assert(arraysEqual(Array.from(store.array[1]), [5,6,7,8]))
      assert(arraysEqual(Array.from(store.array[2]), [9,10,11,12]))
      
      assert(arraysEqual(Array.from(store.array[3]), [0,0,0,0]))
      assert(arraysEqual(Array.from(store.array[4]), [0,0,0,0]))
      assert(arraysEqual(Array.from(store.array[5]), [0,0,0,0]))

    })
  })
  it('should create flat stores', ()  => {
    const store = createStore({ value1: Types.i8, value2: Types.ui16, value3: Types.f32 }, defaultSize)
    assert(store.value1 != undefined)
    assert(store.value1 instanceof Int8Array)
    assert(store.value2 != undefined)
    assert(store.value2 instanceof Uint16Array)
    assert(store.value3 != undefined)
    assert(store.value3 instanceof Float32Array)
  })
  it('should create nested stores', ()  => {
    const store1 = createStore({ nest: { value: Types.i8 } }, defaultSize)
    const store2 = createStore({ nest: { nest: { value: Types.ui32 } } }, defaultSize)
    const store3 = createStore({ nest: { nest: { nest: { value: Types.i16 } } } }, defaultSize)
    assert(store1.nest.value instanceof Int8Array)
    assert(store2.nest.nest.value instanceof Uint32Array)
    assert(store3.nest.nest.nest.value instanceof Int16Array)
  })
})