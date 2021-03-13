# 👾 bitECS 👾

Tiny, data-driven, high performance [ECS](https://en.wikipedia.org/wiki/Entity_component_system) library written using JavaScript TypedArrays.

## Features
- `<3kb` gzipped
- Zero dependencies
- Node or Browser
- [_Blazing fast_](https://github.com/noctjs/ecs-benchmark)

## Install
```
npm i bitecs
```

## Example

```js
import World from 'bitecs'

// Create a world
const world = World()

// Register some components
world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
world.registerComponent('VELOCITY', { vx: 'int8', vy: 'int8', speed: 'uint16' })

// Register a system
world.registerSystem({
  name: 'MOVEMENT',
  components: ['POSITION', 'VELOCITY'],
  update: (POSITION, VELOCITY) => entities => {
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i]
      POSITION.x[eid] += VELOCITY.vx[eid] * VELOCITY.speed[eid]
      POSITION.y[eid] += VELOCITY.vy[eid] * VELOCITY.speed[eid]
    }
  }
})

// Create a query
const positions = world.createQuery(['POSITION']) // array will continuously update, no need to recreate

// Create an entity
const eid = world.addEntity()

// Add components to entity
world.addComponent('POSITION', eid, { x: 100, y: 100 })
world.addComponent('VELOCITY', eid, { vx: 1, vy: -1, speed: 100 })

// Create an event loop and step world
setInterval(() => {
  world.step()
}, 1000 / 30) // 30 tick on server

// For browser, use frame rate
const loop = () => {
  world.step()
  requestAnimationFrame(loop)
}
loop()
```

Full documentation and feature rich examples can be found [here](DOCS.md).
