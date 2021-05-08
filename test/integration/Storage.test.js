import assert, { strictEqual } from 'assert'
import { Types } from '../../src/index.js'
import { createStore, TYPES } from '../../src/Storage.js'

describe('Storage Integration Tests', () => {
  it('should default to size of 1MM', () => {
    const store = createStore({ value: Types.i8 })
    strictEqual(store.value.length, 1_000_000)
  })
  it('should allow custom size', () => {
    const store = createStore({ value: Types.i8 }, 10)
    strictEqual(store.value.length, 10)
  })
  Object.keys(Types).forEach(type => {
    it('should create a store with ' + type, () => {
      const store = createStore({ value: type })
      assert(store.value instanceof TYPES[type])
      strictEqual(store.value.length, 1_000_000)
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
  })
  it('should create flat stores', ()  => {
    const store = createStore({ value1: Types.i8, value2: Types.ui16, value3: Types.f32 })
    assert(store.value1 != undefined)
    assert(store.value1 instanceof Int8Array)
    assert(store.value2 != undefined)
    assert(store.value2 instanceof Uint16Array)
    assert(store.value3 != undefined)
    assert(store.value3 instanceof Float32Array)
  })
  it('should create nested stores', ()  => {
    const store1 = createStore({ nest: { value: Types.i8 } })
    const store2 = createStore({ nest: { nest: { value: Types.ui32 } } })
    const store3 = createStore({ nest: { nest: { nest: { value: Types.i16 } } } })
    assert(store1.nest.value instanceof Int8Array)
    assert(store2.nest.nest.value instanceof Uint32Array)
    assert(store3.nest.nest.nest.value instanceof Int16Array)
  })
})