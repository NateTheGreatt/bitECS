/* eslint-env jest */
import World from '../src/index.js'

describe('World', () => {
  test('should export the necessary api', () => {
    const world = World({ maxEntities: 10 })
    const objects = [
      'TYPES',
      'config',
      'registry'
    ]
    const functions = [
      'entityCount',
      'addEntity',
      'removeEntity',
      'registerComponent',
      'removeComponent',
      'removeAllComponents',
      'addComponent',
      'hasComponent',
      'registerSystem',
      'enabled',
      'toggle',
      'step'
    ]

    objects.forEach(obj => {
      expect(world[obj]).toBeDefined()
      expect(world[obj]).toBeInstanceOf(Object)
    })

    functions.forEach(fn => {
      expect(world[fn]).toBeDefined()
      expect(world[fn]).toBeInstanceOf(Function)
    })
  })

  test('should create worlds with instanced registries', () => {
    const world1 = World({ maxEntities: 10 })
    const world2 = World({ maxEntities: 10 })

    world1.registerComponent('TEST', { key: 'int8' })
    expect(Object.keys(world1.registry.components).length).toBe(1)
    expect(Object.keys(world2.registry.components).length).toBe(0)
  })
})
