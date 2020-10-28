/* eslint-env jest */
import { DataManager, TYPES } from '../src/utils/DataManager.js'

describe('DataManager', () => {
  test('should create DataManager with correct length', () => {
    const Manager = DataManager()
    const manager = Manager(10, { x: 'uint8' })
    expect(manager.x.length).toBe(10)
  })

  // Enum Type
  describe('Enums', () => {
    const ENUM = ['ONE', 'TWO', 'THREE']
    const createManager = () => DataManager()(5, { v: ENUM })

    test('should get/set enum', () => {
      const manager = createManager()
      manager._set(0, { v: 'TWO' })
      expect(manager.v[0]).toBe(1)
      expect(manager.enum('v', 0)).toBe('TWO')
    })

    test('should get/set nested enum', () => {
      const manager = DataManager()(5, { v: { w: ENUM } })
      manager._set(0, { v: { w: 'TWO' } })
      expect(manager.v.w[0]).toBe(1)
      expect(manager.v.w.length).toBe(5)
      const data = manager.v.enum('w', 0)
      expect(data).toStrictEqual('TWO')
      manager.v.enum('w', 0, 'THREE')
      expect(manager.v.w[0]).toBe(2)
    })

    test('should return schema', () => {
      const manager = createManager()
      expect(manager._schema).toStrictEqual({ v: ENUM })
    })

    test('should return props', () => {
      const manager = createManager()
      expect(manager._props).toStrictEqual(['v'])
    })

    test('should return mapping', () => {
      const manager = createManager()
      expect(manager._mapping('v')).toStrictEqual(ENUM)
    })

    test('should reset properties', () => {
      const manager = createManager()
      manager._set(0, { v: 'TWO' })
      expect(manager.v[0]).toBe(1)
      manager._reset(0)
      expect(manager.v[0]).toBe(0)
    })

    test('should flatten data', () => {
      const manager = DataManager()(5, { v: { y: ENUM }, w: ENUM })
      expect(manager._flatten().length).toBe(2)
    })
  })

  // Object Type
  describe('Nested Objects', () => {
    const count = 5
    const schema = { v: { x: 'uint8', y: 'uint8' } }
    const enumSchema = { v: ['ZERO', 'ONE', 'TWO'] }
    const createManager = () => DataManager()(count, schema)

    test('should create a nested manager', () => {
      const manager = createManager()
      expect(manager.v.x.length).toBe(count)
      expect(manager.v.y.length).toBe(count)
    })

    test('should get/set values', () => {
      const manager = createManager()
      manager.v.x[0] = 1
      expect(manager.v.x[0]).toBe(1)
      expect(manager.v.y[0]).toBe(0)
    })

    test('should internally set values', () => {
      const manager = createManager()
      manager._set(0, { v: { x: 1 } })
      expect(manager.v.x[0]).toBe(1)
      expect(manager.v.y[0]).toBe(0)
    })

    test('should reset values', () => {
      const manager = createManager()
      manager._set(0, { v: { x: 1, y: 1 } })
      manager._reset(0)
      expect(manager.v.x[0]).toBe(0)
      expect(manager.v.y[0]).toBe(0)
    })

    test('should flatten data', () => {
      const manager = createManager()
      manager._set(0, { v: { x: 1, y: 1 } })
      expect(manager._flatten().length).toBe(2)
    })

    test('should get data', () => {
      const manager = createManager()
      const data = { v: { x: 1, y: 1 } }
      manager._set(0, data)
      expect(manager._get(0)).toStrictEqual(data)
    })

    test('should get enum data', () => {
      const manager = DataManager()(count, enumSchema)
      const data = { v: 'ONE' }
      manager._set(0, data)
      expect(manager._get(0)).toStrictEqual(data)
    })
  })

  // String Type
  describe('String Types', () => {
    Object.keys(TYPES).forEach(type => {
      testType(type)
    })
  })

  // TypedArray Type
  describe('TypedArray Types', () => {
    Object.values(TYPES).forEach(type => {
      testType(type)
    })
  })
})

function testType (type) {
  const count = 5
  const schema = { v: type }
  const nestedSchema = { v: { x: type, y: type } }

  test(`should get/sets ${typeof type === 'string' ? type : type.constructor.name}`, () => {
    const manager = DataManager()(count, schema)
    manager._set(0, { v: 10 })
    expect(manager.v[0]).toBe(10)
  })

  test(`should get/sets nested ${typeof type === 'string' ? type : type.constructor.name}`, () => {
    const manager = DataManager()(count, nestedSchema)
    const data = { v: { x: 5, y: 5 } }
    manager._set(0, data)
    expect(manager.v.x[0]).toBe(5)
    expect(manager.v.y[0]).toBe(5)
    manager.v.x[0] = 1
    expect(manager.v.x[0]).toBe(1)
  })

  test(`should internally set ${typeof type === 'string' ? type : type.constructor.name}`, () => {
    const manager = DataManager()(count, schema)
    manager._set(0, { v: 10 })
    expect(manager.v[0]).toBe(10)
  })

  test(`should reset ${typeof type === 'string' ? type : type.constructor.name}`, () => {
    const manager = DataManager()(count, schema)
    manager._set(0, { v: 10 })
    expect(manager.v[0]).toBe(10)
    manager._reset(0)
    expect(manager.v[0]).toBe(0)
  })

  test(`should flatten ${typeof type === 'string' ? type : type.constructor.name}`, () => {
    const manager = DataManager()(count, schema)
    const nestedManager = DataManager()(count, nestedSchema)
    expect(manager._flatten().length).toBe(1)
    expect(nestedManager._flatten().length).toBe(2)
  })
}
