import { test, assert } from "vitest"
import { createWorld, registerComponent, addEntity, addComponent } from "../../src/archetypes/archetype"
import { defineQuery, runQuery } from "../../src/archetypes/query"

test('queries', () => {
      
  const world = createWorld()
  
  const Vector3Schema = { x: Float32Array, y: Float32Array, z: Float32Array }
  const Position = registerComponent(world, Vector3Schema)
  const Velocity = registerComponent(world, Vector3Schema)

  const query = defineQuery([Position, Velocity])

  const eid = addEntity(world)

  addComponent(world, Position, eid)
  addComponent<typeof Vector3Schema>(world, Velocity, eid, (velocity, i) => {
    velocity.x[i]=1
    velocity.y[i]=1
    velocity.z[i]=1
  })

  const archetypes = query(world)

  assert.equal(archetypes.length, 1)

  runQuery(world, query, ([ents, [pos,vel]]) => {
    for (let i = 0; i < ents.length; i++) {
      pos.x[i] += vel.x[i]
      pos.y[i] += vel.y[i]
      pos.z[i] += vel.z[i]
    }
  })

  runQuery(world, query, ([ents, [pos]]) => {
    for (let i = 0; i < ents.length; i++) {
      assert.equal(pos.x[i], 1);
      assert.equal(pos.y[i], 1);
      assert.equal(pos.z[i], 1);
    }
  })

})