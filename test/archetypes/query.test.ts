import { test, assert } from "vitest"
import { createWorld, registerComponent, addEntity, addComponent, removeComponent } from "../../src/archetypes/archetype"
import { defineQuery, runQuery } from "../../src/archetypes/query"

test('queries', () => {
      
  const world = createWorld()
  
  const Vector3Schema = { x: Float32Array, y: Float32Array, z: Float32Array }
  const Position = registerComponent(world, Vector3Schema)
  const Velocity = registerComponent(world, Vector3Schema)

  const positionQuery = defineQuery([Position])
  const moveQuery = defineQuery([Position, Velocity])

  const eid = addEntity(world)

  addComponent<typeof Vector3Schema>(world, Position, eid, (pos,i) => {
    pos.x[i] = 1
    pos.y[i] = 1
    pos.z[i] = 1
  })

  let archetypes = positionQuery(world)

  assert.equal(archetypes.length, 1)

  runQuery(world, positionQuery, ([ents, [pos]]) => {
    assert.equal(ents.length, 1)
    for (let i = 0; i < ents.length; i++) {
      assert.equal(pos.x[i], 1);
      assert.equal(pos.y[i], 1);
      assert.equal(pos.z[i], 1);
    }
  })
  
  addComponent<typeof Vector3Schema>(world, Velocity, eid, (velocity, i) => {
    velocity.x[i]=1
    velocity.y[i]=1
    velocity.z[i]=1
  })

  archetypes = moveQuery(world)

  assert.equal(archetypes.length, 1)

  runQuery(world, moveQuery, ([ents, [pos,vel]]) => {
    for (let i = 0; i < ents.length; i++) {
      pos.x[i] += vel.x[i]
      pos.y[i] += vel.y[i]
      pos.z[i] += vel.z[i]
    }
  })

  removeComponent(world, Velocity, eid)

  runQuery(world, moveQuery, ([ents]) => {
    assert.equal(ents.length, 0)
  })

  archetypes = positionQuery(world)

  assert.equal(archetypes.length, 2)

  runQuery(world, positionQuery, ([ents, [pos]]) => {
    for (let i = 0; i < ents.length; i++) {
      assert.equal(pos.x[i], 2);
      assert.equal(pos.y[i], 2);
      assert.equal(pos.z[i], 2);
    }
  })
  

})