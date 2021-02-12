/* eslint-env jest */
import World from '../src/index.js'

describe('Entities', () => {
  test('should add an entity to world', () => {
    const world = World({ maxEntities: 10 })
    const eid = world.addEntity()
    expect(eid).toBe(1)
    expect(world.entityCount()).toBe(1)
    expect(world.registry.entities[0][eid]).toBe(0)
  })

  test('should add an recycled EID entity to world', () => {
    const world = World({ maxEntities: 10 })
    const eid = world.addEntity()
    world.removeEntity(eid, true)
    const eid2 = world.addEntity()
    expect(eid2).toBe(1)
    expect(world.entityCount()).toBe(1)
    expect(world.registry.entities[0][eid]).toBe(0)
  })

  test('should throw when adding too many entities', () => {
    const world = World({ maxEntities: 2 })
    world.addEntity()
    world.addEntity()
    expect(world.entityCount()).toBe(2)
    expect(world.addEntity()).toBe(undefined)
  })

  test('should immediately remove an entity', () => {
    const world = World({ maxEntities: 10 })
    const eid = world.addEntity()
    expect(world.entityCount()).toBe(1)
    expect(world.registry.entities[0][eid]).toBe(0)
    world.removeEntity(eid, true)
    expect(world.entityCount()).toBe(0)
    expect(world.registry.entities[0][eid]).toBe(0)
  })

  test('should not allow removal of removed entity', () => {
    const world = World({ maxEntities: 10 })
    const eid = world.addEntity()
    expect(world.entityCount()).toBe(1)
    expect(world.registry.entities[0][eid]).toBe(0)
    world.removeEntity(eid, true)
    world.removeEntity(eid, true)
    expect(world.entityCount()).toBe(0)
    expect(world.registry.entities[0][eid]).toBe(0)
  })

  test('should remove entity deferred', () => {
    const world = World({ maxEntities: 10 })
    const eid = world.addEntity()
    expect(world.entityCount()).toBe(1)
    world.removeEntity(eid)
    expect(world.entityCount()).toBe(1)
    world.step()
    expect(world.entityCount()).toBe(0)
  })

  test('should reuse entity ids', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })

    const enter = jest.fn()
    const exit = jest.fn()
    const update = jest.fn()

    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION'],
      enter: () => enter,
      update: () => update,
      exit: () => exit
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid, { x: 1, y: 1 })
    world.step()

    expect(world.registry.entities[0][eid]).toBe(1)
    expect(world.registry.components.POSITION.x[eid]).toBe(1)
    expect(world.registry.components.POSITION.y[eid]).toBe(1)

    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)

    world.removeEntity(eid)
    world.step()

    expect(exit).toHaveBeenCalledTimes(1)
    expect(world.registry.entities[0][eid]).toBe(0)

    const eid2 = world.addEntity()
    world.addComponent('POSITION', eid2)

    expect(eid2).toBe(eid)
    expect(world.registry.entities[0][eid2]).toBe(1)
    expect(world.registry.components.POSITION.x[eid]).toBe(0)
    expect(world.registry.components.POSITION.y[eid]).toBe(0)

    world.step()
    expect(enter).toHaveBeenCalledTimes(2)
    expect(update).toHaveBeenCalledTimes(3)
  })
})
