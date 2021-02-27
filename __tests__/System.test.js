/* eslint-env jest */
import World from '../src/index.js'

describe('Systems', () => {
  test('should register a system', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION']
    })
    expect(world.registry.systems.MOVEMENT).toBeDefined()
  })

  test('should register multiple systems', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('FLAG')
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION']
    })
    world.registerSystem({
      name: 'TOGGLE',
      components: ['FLAG']
    })
    expect(world.registry.systems.MOVEMENT).toBeDefined()
    expect(world.registry.systems.TOGGLE).toBeDefined()
  })

  test('should call enter/exit on system', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const enter = jest.fn()
    const exit = jest.fn()
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      enter: () => enter,
      exit: () => exit
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)
    world.step()

    expect(enter).toHaveBeenCalledTimes(1)
    expect(enter).toHaveBeenCalledWith(eid)

    world.removeEntity(eid)
    world.step()
    expect(exit).toHaveBeenCalledTimes(1)
    expect(exit).toHaveBeenCalledWith(eid)
  })

  test('should call update on system', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const update = jest.fn()
    const movement = world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      update: () => update
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)
    world.step()

    expect(update).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledWith(movement.localEntities)
  })

  test('should call update on multiple entities', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const update = jest.fn()
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      update: () => update
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)

    const eid2 = world.addEntity()
    world.addComponent('POSITION', eid2)
    world.addComponent('VELOCITY', eid2)
    world.step()

    expect(update).toHaveBeenCalledTimes(1)
  })

  test('should call lifecycle methods with correct data', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'int8', vy: 'int8' })

    const enter = jest.fn()
    const update = jest.fn()
    const exit = jest.fn()
    const movement = world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      enter: () => enter,
      update: () => update,
      exit: () => exit
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid, { x: 1, y: 1 })
    world.addComponent('VELOCITY', eid, { vx: -1, vy: 0 })
    world.step()

    expect(enter).toHaveBeenCalledTimes(1)
    expect(enter).toHaveBeenCalledWith(eid)

    expect(update).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledWith(movement.localEntities)
  })

  test('should call system.exit when dependant components are removed', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const exit = jest.fn()
    const update = jest.fn()
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      update: () => update,
      exit
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)
    world.step()

    expect(update).toHaveBeenCalledTimes(1)

    world.removeComponent('VELOCITY', eid)
    world.step()

    expect(exit).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(2)
  })

  test('should not run system after entity is removed', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const exit = jest.fn()
    const update = jest.fn()
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      update: () => update,
      exit
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)
    world.step()

    expect(update).toHaveBeenCalledTimes(1)

    world.removeEntity(eid)
    world.step()

    expect(exit).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(2)
  })

  test('should return correct world enabled state', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION']
    })
    expect(world.enabled()).toBe(true)
  })

  test('should toggle world system execution', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const enter = jest.fn()
    const exit = jest.fn()
    const update = jest.fn()
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      enter: () => enter,
      update: () => update,
      exit: () => exit
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)
    world.step()

    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
    expect(exit).toHaveBeenCalledTimes(0)

    world.toggle()
    world.step()

    expect(world.enabled()).toBe(false)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
    expect(exit).toHaveBeenCalledTimes(0)
  })

  test('should force step a paused world', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const enter = jest.fn()
    const update = jest.fn()
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      enter,
      update: () => update
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)
    world.step()

    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)

    world.toggle()
    world.step()

    expect(world.enabled()).toBe(false)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)

    world.step(true)
    expect(world.enabled()).toBe(false)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(2)
  })

  test('should toggle a named system execution', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const enter = jest.fn()
    const update = jest.fn()
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      enter,
      update: () => update
    })

    const update2 = jest.fn()
    world.registerSystem({
      name: 'RUNNER',
      components: ['POSITION'],
      update: () => update2
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)
    world.step()

    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
    expect(update2).toHaveBeenCalledTimes(1)

    world.toggle('MOVEMENT')
    world.step()

    expect(world.registry.systems.MOVEMENT.enabled).toBe(false)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
    expect(update2).toHaveBeenCalledTimes(2)
  })

  test('should force step a named system', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const enter = jest.fn()
    const update = jest.fn()
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      enter,
      update: () => update
    })

    const update2 = jest.fn()
    world.registerSystem({
      name: 'RUNNER',
      components: ['POSITION'],
      update: () => update2
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)
    world.step()

    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
    expect(update2).toHaveBeenCalledTimes(1)

    world.toggle('MOVEMENT')
    world.step()

    expect(world.registry.systems.MOVEMENT.enabled).toBe(false)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
    expect(update2).toHaveBeenCalledTimes(2)

    world.step('MOVEMENT', true)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(2)
    expect(update2).toHaveBeenCalledTimes(2)
  })
})
