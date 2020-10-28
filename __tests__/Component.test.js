/* eslint-env jest */
import World from '../src/index.js'

describe('Components', () => {
  test('should register a component', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    expect(world.registry.components.POSITION).toBeDefined()
    expect(world.registry.components.POSITION.x).toBeDefined()
    expect(world.registry.components.POSITION.y).toBeDefined()
  })

  test('should throw if maxComponentTypes is reached', () => {
    const maxComponentTypes = 10
    const world = World({ maxEntities: 10, maxComponentTypes })
    for (let i = 0; i < maxComponentTypes; i++) {
      world.registerComponent(`COMPONENT-${i}`)
    }
    expect(() => world.registerComponent('COMPONENT')).toThrow()
  })

  test('should create a second component generation bitmask', () => {
    const maxComponentTypes = 64
    const world = World({ maxEntities: 10, maxComponentTypes })
    for (let i = 0; i < maxComponentTypes; i++) {
      world.registerComponent(`COMPONENT-${i + 1}`)
    }
    const eid = world.addEntity()
    world.addComponent('COMPONENT-1', eid)
    world.addComponent('COMPONENT-33', eid)
    expect(world.registry.entities[0][eid]).toBe(1)
    expect(world.registry.entities[1][eid]).toBe(1)
  })

  test('should register multiple components', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })
    expect(world.registry.components.POSITION).toBeDefined()
    expect(world.registry.components.POSITION.x).toBeDefined()
    expect(world.registry.components.POSITION.y).toBeDefined()
    expect(world.registry.components.VELOCITY).toBeDefined()
    expect(world.registry.components.VELOCITY.vx).toBeDefined()
    expect(world.registry.components.VELOCITY.vy).toBeDefined()
  })

  test('should not add an unregistered component', () => {
    const world = World({ maxEntities: 10 })
    const eid = world.addEntity()
    expect(() => world.addComponent('POSITION', eid)).toThrow()
  })

  test('should add component with no data', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    expect(world.registry.entities[0][eid]).toBe(1)
    expect(world.registry.components.POSITION.x[eid]).toBe(0)
    expect(world.registry.components.POSITION.y[eid]).toBe(0)
  })

  test('should add component with data', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    const eid = world.addEntity()
    world.addComponent('POSITION', eid, { x: 1, y: 1 })
    expect(world.registry.entities[0][eid]).toBe(1)
    expect(world.registry.components.POSITION.x[eid]).toBe(1)
    expect(world.registry.components.POSITION.y[eid]).toBe(1)
  })

  test('should remove component immediately', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    expect(world.registry.entities[0][eid]).toBe(1)
    expect(world.registry.components.POSITION.x[eid]).toBe(0)
    expect(world.registry.components.POSITION.y[eid]).toBe(0)

    world.removeComponent('POSITION', eid, true)
    expect(world.registry.entities[0][eid]).toBe(0)
  })

  test('should remove component deferred', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    expect(world.registry.entities[0][eid]).toBe(1)
    expect(world.registry.components.POSITION.x[eid]).toBe(0)
    expect(world.registry.components.POSITION.y[eid]).toBe(0)

    world.removeComponent('POSITION', eid)
    expect(world.registry.entities[0][eid]).toBe(1)

    world.step()
    expect(world.registry.entities[0][eid]).toBe(0)
  })

  test('should add remove all components immediately', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)

    expect(world.registry.entities[0][eid]).toBe(3)

    world.removeAllComponents(eid, true)
    expect(world.registry.entities[0][eid]).toBe(0)
  })

  test('should add remove all components deferred', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'uint8', vy: 'uint8' })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid)
    world.addComponent('VELOCITY', eid)

    expect(world.registry.entities[0][eid]).toBe(3)

    world.removeAllComponents(eid)
    expect(world.registry.entities[0][eid]).toBe(3)

    world.step()
    expect(world.registry.entities[0][eid]).toBe(0)
  })

  test('should check if an entity has a component', () => {
    const world = World({ maxEntities: 10 })
    world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
    world.registerComponent('VELOCITY', { vx: 'int8', vy: 'int8' })

    const eid = world.addEntity()
    world.addComponent('POSITION', eid, { x: 1, y: 1 })

    expect(world.hasComponent('POSITION', eid)).toBe(true)
    expect(world.hasComponent('VELOCITY', eid)).toBe(false)
  })
})
