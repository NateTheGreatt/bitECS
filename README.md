# 👾 bitECS 👾

Functional, tiny, data-driven, high performance [ECS](https://en.wikipedia.org/wiki/Entity_component_system) library written using JavaScript TypedArrays.

## Features
- `<3kb` gzipped
- Functional
- Zero dependencies
- Node or Browser
- [_Blazing fast_](https://github.com/noctjs/ecs-benchmark)

## Install
```
npm i bitecs
```

## Example

```js
import { 
  createWorld,
  registerComponent,
  registerComponents,
  defineComponent,
  defineQuery,
  defineSystem,
  addComponent,
  removeComponent,
  addEntity,
  removeEntity,
  pipe,
  Types,
} from './src/index.js'

// max entities (optional, defaults to 100,000)
const maxEntities = 1000000

const { f32, bool } = Types

// create a world
const world = createWorld(maxEntities)

// define component data stores
const Vector2 = { x: f32, y: f32 }
const Position = defineComponent(Vector2, maxEntities)
const Velocity = defineComponent(Vector2, maxEntities)
const Alive = defineComponent(bool, maxEntities)

// register in groups or individually
registerComponents(world, [Position, Velocity])
registerComponent(world, Alive)

// define a query using components
const movementQuery = defineQuery([Position, Velocity])
// define a movement system using the query
const movementSystem = defineSystem(movementQuery, ents => {
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    Position.x[eid] += Velocity.x[eid]
    Position.y[eid] += Velocity.y[eid]
  }
})

// add an entity to the world
const eid = addEntity(world)

// add components to the new EID in the world
addComponent(world, Position, eid)
addComponent(world, Velocity, eid)

// there are no component getters or setters
// data is accessed directly by EID
Velocity.x[eid] = 1
Velocity.y[eid] = 2

const pipeline = pipe(
  movementSystem,
  movementSystem,
  movementSystem,
)

movementSystem(world) // executes movement system on world
pipeline(world) // executes pipeline of systems on world
```

Full documentation and feature rich examples can be found [here](DOCS.md).
