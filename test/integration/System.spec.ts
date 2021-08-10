import { strictEqual } from 'assert'
import { createWorld } from '../../src/World'
import { addComponent, defineComponent } from '../../src/Component'
import { addEntity, resetGlobals } from '../../src/Entity'
import { defineSystem } from '../../src/System'
import { defineQuery, Types } from '../../src/index'

describe('System Integration Tests', () => {
  afterEach(() => {
    resetGlobals()
  })
  it('should run against a world and update state', () => {
    const world = createWorld()
    const TestComponent = defineComponent({ value: Types.f32 })

    const query = defineQuery([TestComponent])
    const eid = addEntity(world)
    addComponent(world, TestComponent, eid)

    const system = defineSystem(world => 
      query(world).forEach(eid => {
        TestComponent.value[eid]++
      })
    )

    system(world)

    strictEqual(TestComponent.value[eid], 1)
  })
})
