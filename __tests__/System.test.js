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

  test('should call before/after on system', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const before = jest.fn()
    const after = jest.fn()
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      before,
      after
    })
    world.step()
    expect(before).toHaveBeenCalledTimes(1)
    expect(after).toHaveBeenCalledTimes(1)
    const { POSITION, VELOCITY } = world.registry.components
    expect(before).toHaveBeenCalledWith(POSITION, VELOCITY)
    expect(after).toHaveBeenCalledWith(POSITION, VELOCITY)
    world.step()
    expect(before).toHaveBeenCalledTimes(2)
    expect(after).toHaveBeenCalledTimes(2)
  })

  test('should call enter/exit on system', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const enter = jest.fn()
    const enterFn = jest.fn(() => enter)
    const exit = jest.fn()
    const exitFn = jest.fn(() => exit)
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      enter: enterFn,
      exit: exitFn
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)
    world.step()

    const { POSITION, VELOCITY } = world.registry.components
    expect(enterFn).toHaveBeenCalledTimes(1)
    expect(enterFn).toHaveBeenCalledWith(POSITION, VELOCITY)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(enter).toHaveBeenCalledWith(eid)

    world.removeEntity(eid)
    world.step()
    expect(exitFn).toHaveBeenCalledTimes(1)
    expect(exitFn).toHaveBeenCalledWith(POSITION, VELOCITY)
    expect(exit).toHaveBeenCalledTimes(1)
    expect(exit).toHaveBeenCalledWith(eid)
  })

  test('should call update on system', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const update = jest.fn()
    const updateFn = jest.fn(() => update)
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      update: updateFn
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)
    world.step()

    const { POSITION, VELOCITY } = world.registry.components
    expect(updateFn).toHaveBeenCalledTimes(1)
    expect(updateFn).toHaveBeenCalledWith(POSITION, VELOCITY)
    expect(update).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledWith(eid)
  })

  test('should call update on multiple entities', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const update = jest.fn()
    const updateFn = jest.fn(() => update)
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      update: updateFn
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)

    const eid2 = world.addEntity()
    world.addComponent('POSITION', eid2)
    world.addComponent('VELOCITY', eid2)
    world.step()

    const { POSITION, VELOCITY } = world.registry.components
    expect(updateFn).toHaveBeenCalledTimes(1)
    expect(updateFn).toHaveBeenCalledWith(POSITION, VELOCITY)
    expect(update).toHaveBeenCalledTimes(2)
    expect(update.mock.calls[0][0]).toBe(eid)
    expect(update.mock.calls[1][0]).toBe(eid2)
  })

  test('should call lifecycle methods with correct data', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'int8', vy: 'int8' })

    const enter = jest.fn()
    const enterFn = jest.fn(() => enter)
    const update = jest.fn()
    const updateFn = jest.fn(() => update)
    const exit = jest.fn()
    const exitFn = jest.fn(() => exit)
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      enter: enterFn,
      update: updateFn,
      exit: exitFn
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid, { x: 1, y: 1 })
    world.addComponent('VELOCITY', eid, { vx: -1, vy: 0 })
    world.step()

    const { POSITION, VELOCITY } = world.registry.components
    expect(enterFn).toHaveBeenCalledTimes(1)
    expect(enterFn).toHaveBeenCalledWith(POSITION, VELOCITY)
    expect(enterFn.mock.calls[0][0].x[eid]).toBe(1)
    expect(enterFn.mock.calls[0][0].y[eid]).toBe(1)
    expect(enterFn.mock.calls[0][1].vx[eid]).toBe(-1)
    expect(enterFn.mock.calls[0][1].vy[eid]).toBe(0)

    expect(updateFn).toHaveBeenCalledTimes(1)
    expect(updateFn).toHaveBeenCalledWith(POSITION, VELOCITY)
    expect(updateFn.mock.calls[0][0].x[eid]).toBe(1)
    expect(updateFn.mock.calls[0][0].y[eid]).toBe(1)
    expect(updateFn.mock.calls[0][1].vx[eid]).toBe(-1)
    expect(updateFn.mock.calls[0][1].vy[eid]).toBe(0)
  })

  test('should remove system when dependant components are removed', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const exit = jest.fn()
    const exitFn = jest.fn(() => exit)
    const update = jest.fn()
    const updateFn = jest.fn(() => update)
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      update: updateFn,
      exit: exitFn
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

  test('should remove system when dependant components are removed immediately', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const exit = jest.fn()
    const exitFn = jest.fn(() => exit)
    const update = jest.fn()
    const updateFn = jest.fn(() => update)
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      update: updateFn,
      exit: exitFn
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)
    world.step()

    expect(update).toHaveBeenCalledTimes(1)

    world.removeComponent('VELOCITY', eid, true)
    world.step()

    expect(exit).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
  })

  test('should remove system when entity is removed immediately', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const exit = jest.fn()
    const exitFn = jest.fn(() => exit)
    const update = jest.fn()
    const updateFn = jest.fn(() => update)
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      update: updateFn,
      exit: exitFn
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)
    world.step()

    expect(update).toHaveBeenCalledTimes(1)

    world.removeEntity(eid, true)
    world.step()

    expect(exit).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
  })

  test('should remove system when entity is removed', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const exit = jest.fn()
    const exitFn = jest.fn(() => exit)
    const update = jest.fn()
    const updateFn = jest.fn(() => update)
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      update: updateFn,
      exit: exitFn
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)
    world.step()

    expect(update).toHaveBeenCalledTimes(1)

    world.removeEntity(eid, true)
    world.step()

    expect(exit).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
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

    const before = jest.fn()
    const after = jest.fn()
    const enter = jest.fn()
    const enterFn = jest.fn(() => enter)
    const exit = jest.fn()
    const exitFn = jest.fn(() => exit)
    const update = jest.fn()
    const updateFn = jest.fn(() => update)
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      before,
      after,
      enter: enterFn,
      update: updateFn,
      exit: exitFn
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)
    world.step()

    expect(before).toHaveBeenCalledTimes(1)
    expect(after).toHaveBeenCalledTimes(1)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
    expect(exit).toHaveBeenCalledTimes(0)

    world.toggle()
    world.step()

    expect(world.enabled()).toBe(false)
    expect(before).toHaveBeenCalledTimes(1)
    expect(after).toHaveBeenCalledTimes(1)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
    expect(exit).toHaveBeenCalledTimes(0)
  })

  test('should force step a paused world', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const before = jest.fn()
    const after = jest.fn()
    const enter = jest.fn()
    const enterFn = jest.fn(() => enter)
    const update = jest.fn()
    const updateFn = jest.fn(() => update)
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      before,
      after,
      enter: enterFn,
      update: updateFn
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)
    world.step()

    expect(before).toHaveBeenCalledTimes(1)
    expect(after).toHaveBeenCalledTimes(1)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)

    world.toggle()
    world.step()

    expect(world.enabled()).toBe(false)
    expect(before).toHaveBeenCalledTimes(1)
    expect(after).toHaveBeenCalledTimes(1)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)

    world.step(true)
    expect(world.enabled()).toBe(false)
    expect(before).toHaveBeenCalledTimes(2)
    expect(after).toHaveBeenCalledTimes(2)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(2)
  })

  test('should toggle a named system execution', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const before = jest.fn()
    const after = jest.fn()
    const enter = jest.fn()
    const enterFn = jest.fn(() => enter)
    const update = jest.fn()
    const updateFn = jest.fn(() => update)
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      before,
      after,
      enter: enterFn,
      update: updateFn
    })

    const update2 = jest.fn()
    const updateFn2 = jest.fn(() => update2)
    world.registerSystem({
      name: 'RUNNER',
      components: ['POSITION'],
      update: updateFn2
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)
    world.step()

    expect(before).toHaveBeenCalledTimes(1)
    expect(after).toHaveBeenCalledTimes(1)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
    expect(update2).toHaveBeenCalledTimes(1)

    world.toggle('MOVEMENT')
    world.step()

    expect(world.registry.systems.MOVEMENT.enabled).toBe(false)
    expect(before).toHaveBeenCalledTimes(1)
    expect(after).toHaveBeenCalledTimes(1)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
    expect(update2).toHaveBeenCalledTimes(2)
  })

  test('should force step a named system', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const before = jest.fn()
    const after = jest.fn()
    const enter = jest.fn()
    const enterFn = jest.fn(() => enter)
    const update = jest.fn()
    const updateFn = jest.fn(() => update)
    world.registerSystem({
      name: 'MOVEMENT',
      components: ['POSITION', 'VELOCITY'],
      before,
      after,
      enter: enterFn,
      update: updateFn
    })

    const update2 = jest.fn()
    const updateFn2 = jest.fn(() => update2)
    world.registerSystem({
      name: 'RUNNER',
      components: ['POSITION'],
      update: updateFn2
    })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)
    world.step()

    expect(before).toHaveBeenCalledTimes(1)
    expect(after).toHaveBeenCalledTimes(1)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
    expect(update2).toHaveBeenCalledTimes(1)

    world.toggle('MOVEMENT')
    world.step()

    expect(world.registry.systems.MOVEMENT.enabled).toBe(false)
    expect(before).toHaveBeenCalledTimes(1)
    expect(after).toHaveBeenCalledTimes(1)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
    expect(update2).toHaveBeenCalledTimes(2)

    world.step('MOVEMENT', true)
    expect(before).toHaveBeenCalledTimes(2)
    expect(after).toHaveBeenCalledTimes(2)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(2)
    expect(update2).toHaveBeenCalledTimes(2)
  })
})
