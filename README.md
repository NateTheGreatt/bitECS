# 👾 bitECS 👾

[![npm](https://img.shields.io/npm/v/bitecs.svg)](https://www.npmjs.com/package/bitecs)
[![Minzipped](https://badgen.net/bundlephobia/minzip/bitecs)](https://www.npmjs.com/package/bitecs)
[![npm](https://img.shields.io/npm/dt/bitecs.svg)](https://www.npmjs.com/package/bitecs)
[![License](https://badgen.net/npm/license/bitecs)](https://www.npmjs.com/package/bitecs)

Functional, minimal, data-oriented, ultra-high performance [ECS](https://en.wikipedia.org/wiki/Entity_component_system) library written using JavaScript TypedArrays.


## ✨ Features

|   |   |
| --------------------------------- | ---------------------------------------- |
| 🔮  Simple, declarative API       | 🔥  Blazing fast iteration               |
| 🔍  Powerful & performant queries | 💾  Serialization included              |
| 🍃  Zero dependencies             | 🌐  Node or browser                     |
| 🤏  `~4kb` gzipped                | 🏷  TypeScript support                  |
| ❤  Made with love                | 🔺 [glMatrix](https://github.com/toji/gl-matrix) support |

### 📈 Benchmarks

🚀 Unparalleled performance benchmarks

|                                                                 |                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [noctjs/ecs-benchmark](https://github.com/noctjs/ecs-benchmark) | [ddmills/js-ecs-benchmarks](https://github.com/ddmills/js-ecs-benchmarks) |


### 👩‍💻 In Development
|                  |
| ---------------- |
|🧵 Multithreading |


## 💿 Install
```
npm i bitecs
```

## 🗺 Overview

This is the entire API:

```js
import {

  createWorld,
  addEntity,
  removeEntity,

  defineComponent,
  addComponent,
  removeComponent,
  hasComponent,
  
  defineQuery,
  Changed,
  Not,
  enterQuery,
  exitQuery,
  
  defineSystem,
  
  defineSerializer,
  defineDeserializer,

  pipe,

} from 'bitecs'
```

## 🌐 World

A world represents a set of entities and the components that they each possess. 

Worlds do not store actual component data, only their relationships with entities.

Any number of worlds can be created. An empty object is returned which you can use as a context.

```js
const world = createWorld()

world.name = 'MyWorld'
```
## 👾 Entity

An entity is an integer, technically a pointer, which components can be associated with.

Entities are accessed via queries, components of whom are mutated with systems.

Add entities to the world:
```js
const eid = addEntity(world)
const eid2 = addEntity(world)
```
Remove entities from the world:
```js
removeEntity(world, eid2)
```

## 📦 Component
 
Components are pure data and added to entities to give them state. 

The object returned from `defineComponent` is a SoA (Structure of Arrays). This is what actually stores the component data.

Define component stores:
```js
const Vector3 = { x: Types.f32, y: Types.f32, z: Types.f32 }
const Position = defineComponent(Vector3)
const Velocity = defineComponent(Vector3)
const List = defineComponent({ values: [Types.f32, 3] }) // [type, length]
const Tag = defineComponent()
```

Add components to an entity in a world:
```js
addComponent(world, Position, eid)
addComponent(world, Velocity, eid)
addComponent(world, List, eid)
addComponent(world, Tag, eid)
```

Component data is accessed directly via `eid`, there are no getters or setters:
* This is how high performance iteration is achieved
```js
Velocity.x[eid] = 1
Velocity.y[eid] = 1

List.values[eid].set([1,2,3])
```

## 🔍 Query

A query is defined with components and is used to obtain a specific set of entities from a world.

Define a query:
```js
const movementQuery = defineQuery([Position, Velocity])
```

Use the query on a world to obtain an array of entities with those components:
```js
const ents = movementQuery(world)
```

Wrapping a component with the `Not` modifier defines a query which returns entities who explicitly do not have the component:
```js
const positionWithoutVelocityQuery = defineQuery([ Position, Not(Velocity) ])
```

Wrapping a component with the `Change` modifier creates a query which returns entities whose component's state has changed since last call of the function:
```js
const changedPositionQuery = defineQuery([ Changed(Position) ])

let ents = changedPositionQuery(world)
console.log(ents) // => []

Position.x[eid]++

ents = changedPositionQuery(world)
console.log(ents) // => [0]
```


`enterQuery` returns a function which can be used to capture entities whose components match the query:
```js
const enteredMovementQuery = enterQuery(movementQuery)
const enteredEnts = enteredMovementQuery(world)
```

`exitQuery` returns a function which can be used to capture entities whose components no longer match the query:
```js
const exitedMovementQuery = exitQuery(movementQuery)
const enteredEnts = exitedMovementQuery(world)
```


## 🛸 System

Systems are functions and are run against a world to update componenet state of entities, or anything else.

Queries are used inside of systems to obtain a relevant set of entities and perform operations on their component data.

While not required, it is greatly encouraged that you keep all component data mutations inside of systems.

Define a system that moves entity positions based on their velocity:
```js
const movementSystem = defineSystem((world) => {
  // optionally apply logic to entities added to the query
  const entered = enteredMovementQuery(world)
  for (let i = 0; i < entered.length; i++) {
    const eid = ents[i]
    
  }

  // apply system logic
  const ents = movementQuery(world)
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    Position.x[eid] += Velocity.x[eid]
    Position.y[eid] += Velocity.y[eid]
  }

  // optionally apply logic to entities removed from the query
  const exited = exitedMovementQuery(world)
  for (let i = 0; i < exited.length; i++) {
    const eid = ents[i]
    
  }
})
```

Define a system which tracks time:
```js
world.time = { 
  delta: 0, 
  elapsed: 0,
  then: performance.now()
}
const timeSystem = defineSystem(world => {
  const now = performance.now()
  const delta = now - world.time.then
  world.time.delta = delta
  world.time.elapsed += delta
  world.time.then = now
})
```

Systems are used to update entities of a world:
```js
movementSystem(world)
```

Pipelines of systems should be created with the `pipe` function:
```js
const pipeline = pipe(
  movementSystem,
  timeSystem
)

pipeline(world)
```

## 💾 Serialization

Performant and highly customizable serialization is built-in. Any subset of data can be targeted and serialized/deserialized with great efficiency and ease.

Serializers and deserializers need the same configs in order to work properly. Any combination of components and component properties may be used as configs.

Serialization can take a world as a config and will serialize all component stores registered in that world:
```js
const serialize = defineSerializer(world)
const deserialize = defineDeserializer(world)
```

Serialize all of the world's entities and thier component data:
```js
const packet = serialize(world)
```

Use the deserializer to apply state onto the same or any other world:
* Note: serialized entities and components are automatically (re)created if they do not exist in the target world
```js
deserialize(world, packet)
```

Serialize a more specific set of entities using queries:
```js
const ents = movementQuery(world)
const packet = serialize(ents)
deserialize(world, packet)
```

Serialization for any mixture of components and component properties:
```js
const config = [Position, Velocity.x, Velocity.y]
const serializeMovement = defineSerializer(config)
const deserializeMovement = defineDeserializer(config)
```

Serialize Position data for entities matching the movementQuery, defined with pipe:
```js
const serializeMovementQueryPositions = pipe(movementQuery, serializePositions)
const packet = serializeMovementQueryPositions(world)
deserializePositions(world, packet)
```

Serialization which targets select component stores of entities
whose component state has changed since the last call of the function:
```js
const serializeOnlyChangedPositions = defineSerializer([Changed(Position)])

const serializeChangedMovementQuery = pipe(movementQuery, serializeOnlyChangedPositions)
let packet = serializeChangedMovementQuery(world)
console.log(packet) // => undefined

Position.x[eid]++

packet = serializeChangedMovementQuery(world)
console.log(packet.byteLength) // => 13
```
