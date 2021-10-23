import assert from 'assert'
import { resetGlobals } from '../../src/Entity.js'
import {
  Types,
  addComponent,
  addEntity,
  createWorld,
  defineComponent,
  defineSerializer,
  defineDeserializer,
  defineQuery,
  enterQuery,
  DESERIALIZE_MODE,
  Changed
} from '../../src/index.js'

function getLocalEid(world, eid) {
  const $localEntities = Object.getOwnPropertySymbols(world)[12]
  // @ts-ignore
  const localEntities = world[$localEntities]
  return localEntities.get(eid)
}

describe('adhoc deserialize enter query bug', () => {
  afterEach(() => {
    resetGlobals()
  })

  it('should', () => {
    const world = createWorld()

    const Component = defineComponent({
      x: Types.f32,
      y: [Types.f32,4],
      rotation: Types.f32
    })
    
    const Component2 = defineComponent({
      x: Types.f32,
      y: [Types.f32,4],
      rotation: Types.f32
    })
    
    const eid = addEntity(world)
    const x = 5.0
    const y = 3.0
    const rotation = 1
    
    addComponent(world, Component, eid)
    Component.x[eid] = x
    Component.y[eid].set([1,2,3,4])
    Component.rotation[eid] = rotation
    
    const serialize = defineSerializer([ Changed(Component) ])
    const deserialize = defineDeserializer([ Component2 ])
    
    const world2 = createWorld()
    const query = defineQuery([ Component2 ])
    const enter = enterQuery(query)
    
    deserialize(world2, serialize(world), DESERIALIZE_MODE.MAP)
    
    const lid = getLocalEid(world2, eid)
    
    assert.equal(enter(world2)[0], lid, 'World 2 Enter should be 1')
    assert.equal(Component2.x[lid], x, 'Should have x value')
    assert.deepEqual(Array.from(Component2.y[lid]), [1,2,3,4], 'Should have y value')
    assert.equal(Component2.rotation[lid], rotation, 'Should have rotation value')
  })
})