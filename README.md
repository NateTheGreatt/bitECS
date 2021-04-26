# 👾 bitECS 👾

Functional, declarative, minimal, data-oriented, ultra-high performance [ECS](https://en.wikipedia.org/wiki/Entity_component_system) library written using JavaScript TypedArrays.


## Features

|   |   |
| --------------------------------- | ---------------------------------------- |
| 🔮 Simple & functional API        | 🔥 Blazing fast iteration                |
| 🔍 Powerful & performant queries  | 💾 Swift serialization                  |
| 🍃 Zero dependencies              | 🌐 Node or browser                      |
| 🤏 `~5kb` gzipped                 | 🚀 Unparalleled performance benchmarks  |

#### Benchmarks

|                                                                 |                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [noctjs/ecs-benchmark](https://github.com/noctjs/ecs-benchmark) | [ddmills/js-ecs-benchmarks](https://github.com/ddmills/js-ecs-benchmarks) |


#### In Development
|                  |
| ---------------- |
|🧵 Multithreading |


## Install
```
npm i bitecs
```

## API Overview

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

## World

A world represents a set of entities and the components that they each possess. Does NOT store actual component data.

Any number of worlds can be created. An empty object is returned which you can use as a context.

```js
const world = createWorld()

world.name = 'MyWorld'
```
## Entity

An entity is an integer, technically a pointer, which components can be associated with. Entities are accessed via queries, components of whom are mutated with systems.

Add entities to the world:
```js
const eid = addEntity(world)
const eid2 = addEntity(world)
```
Remove entities from the world:
```js
removeEntity(world, eid2)
```

## Component
 
Components are pure data and added to entities to give them state. 

The object returned from `defineComponent` is a SoA (Structure of Arrays). This is what actually stores the component data.

Define component stores:
```js
const Vector3 = { x: Types.f32, y: Types.f32, z: Types.f32 }
const Position = defineComponent(Vector3)
const Velocity = defineComponent(Vector3)
```

Add components to an entity in a world:
```js
addComponent(world, Position, eid)
addComponent(world, Velocity, eid)
```

Component data accessed directly via `eid`, there are no getters or setters:
```js
Velocity.x[eid] = 1
Velocity.y[eid] = 1
```

## Query

A query is defined with components and used to obtain a specific set of entities from a world.

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

Wrapping a component with the `Change` modifier creates a query which returns entities whose component's state has changed since last call of the function
```js
const changedPositionQuery = defineQuery([ Changed(Position) ])

let ents = changedPositionQuery(world)
console.log(ents) // => []

Position.x[eid]++

ents = changedPositionQuery(world)
console.log(ents) // => [0]
```


The enter-query hook is called when an entity's components match the query:
```js
enterQuery(world, movementQuery, eid => {})
```

The exit-query hook is called when an entity's components no longer match the query:
```js
exitQuery(world, movementQuery, eid => {})
```


## System

Systems are functions and are run against a world to update componenet state of entities, or anything else.

Queries are used inside of systems to obtain a relevant set of entities and perform operations on their component data.

While not required, it is greatly encouraged that you keep all component data mutations inside of systems, and all system-dependent state on the world.

```js
const movementSystem = defineSystem(world => {
  const ents = movementQuery(world)
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    Position.x[eid] += Velocity.x[eid]
    Position.y[eid] += Velocity.y[eid]
  }
})

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

## Serialization

Performant and highly customizable serialization is built-in. 

Any subset of data can be targeted and serialized/deserialized with great efficiency and ease.

Serializers and deserializers are defined much like queries.

Create a serializer/deserializer which will serialize all component stores of an entire world:
```js
const serialize = createSerializer()
const deserialize = createDeserializer()
```

Use the serializer and deserializer to serialize and restore state on a world:
* Note: creates entities and adds components if they do not exist
```js
const packet = serialize(world)
deserialize(world, packet)
```

Serialize and deserialize can be given a specific set of entities using queries:
```js
const ents = movementQuery(world)
const packet = serialize(ents)
deserialize(world, packet)
```

Create a serializer/deserializer which will serialize select component stores
```js
const serializePositions = createSerializer([Position])
const deserializePositions = createDeserializer([Position])
```

This will serialize and deserialize the Position data of entities which match the movementQuery:
```js
const packet = serializePositions(movementQuery(world))
deserializePositions(world, packet)
```

Create a serializer which will only serialize select component stores of entities
whose component state has changed since the last call of the function:
```js
const serializeOnlyChangedPositions = createSerializer([Changed(Position)])

let packet = serializeOnlyChangedPositions(movementQuery(world))
console.log(packet.byteLength) // => 0

Position.x[eid]++

packet = serializeOnlyChangedPositions(movementQuery(world))
console.log(packet.byteLength) // => 13
```