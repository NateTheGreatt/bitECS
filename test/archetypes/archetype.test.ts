import { test, assert } from "vitest"
import { createWorld, registerComponent, addEntity, addComponent, getComponent, removeComponent } from "../../src/archetypes/archetype"

test('archetypes', () => {
      
  const world = createWorld()

  const Vector3Schema = { x: Float32Array, y: Float32Array, z: Float32Array }
  const Position = registerComponent(world, Vector3Schema)
  const Velocity = registerComponent(world, Vector3Schema)

  const eid = addEntity(world)

  addComponent<typeof Vector3Schema>(world, Position, eid, (position, i) => {
    position.x[i] = 1
    position.y[i] = 2
    position.z[i] = 3
  })

  let a = world.entityToArchetype.get(eid)!
  assert.equal(a.id, "-0")
  assert.equal(a.components[0].x[0], 1)
  assert.equal(a.components[0].y[0], 2)
  assert.equal(a.components[0].z[0], 3)

  addComponent<typeof Vector3Schema>(world, Velocity, eid, (velocity, i) => {
    velocity.x[i] = 4
    velocity.y[i] = 5
    velocity.z[i] = 6
  })

  a = world.entityToArchetype.get(eid)!
  assert.equal(a.id, "-0-1")
  assert.equal(a.components[0].x[0], 1)
  assert.equal(a.components[0].y[0], 2)
  assert.equal(a.components[0].z[0], 3)
  assert.equal(a.components[1].x[0], 4)
  assert.equal(a.components[1].y[0], 5)
  assert.equal(a.components[1].z[0], 6)

  getComponent(world, Position, eid, (p, i) => {
    p.x[i]++
    p.y[i]++
    p.z[i]++
  })



  removeComponent(world, Velocity, eid)

  a = world.entityToArchetype.get(eid)!
  assert.equal(a.id, "-0")
  assert.equal(a.components[0].x[0], 2)
  assert.equal(a.components[0].y[0], 3)
  assert.equal(a.components[0].z[0], 4)

})