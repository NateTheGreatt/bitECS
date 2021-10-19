
## 🗺 Overview

Essentials of the API:

```js
import {

  createWorld,
  addEntity,
  removeEntity,

  Types,

  defineComponent,
  addComponent,
  removeComponent,
  hasComponent,
  
  defineQuery,
  Changed,
  Not,
  enterQuery,
  exitQuery,
  
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
const Reference = defineComponent({ entity: Types.eid }) // Types.eid is used as a reference type
```

Add components to an entity in a world:
```js
addComponent(world, Position, eid)
addComponent(world, Velocity, eid)
addComponent(world, List, eid)
addComponent(world, Tag, eid)
addComponent(world, Reference, eid)
```

Component data is accessed directly via `eid` which is how high performance iteration is achieved:
```js
Position.x[eid] = 1
Position.y[eid] = 1
```

References to other entities can be stored as such:
```js
Reference.entity[eid] = eid2
```

Array types are regular fixed-size TypedArrays:
```js
List.values[eid].set([1,2,3])
console.log(List.values[eid]) // => Float32Array(3) [ 1, 2, 3 ]
```

## 👥 Component Proxy

Component proxies are a way to interact with component data using regular objects while maintaining high performance iteration. Not to be confused with ES6 `Proxy`, but the behavior is basically identical with faster iteration speeds.

This enables cleaner syntax, component references, and enhanced interoperability with other libraries.

Comes at the cost of some boilerplate and a very slight performance hit (still faster than regular objects tho).

⚠ Proxy instances must be reused to maintain high performance iteration.

```js
class Vector3Proxy {
  constructor(store, eid) { 
    this.eid = eid
    this.store = store
  }
  get x ()    { return this.store.x[this.eid] }
  set x (val) { this.store.x[this.eid] = val }
  get y ()    { return this.store.y[this.eid] }
  set y (val) { this.store.y[this.eid] = val }
  get z ()    { return this.store.z[this.eid] }
  set z (val) { this.store.z[this.eid] = val }
}

class PositionProxy extends Vector3Proxy {
  constructor(eid) { super(Position, eid) }
}

class VelocityProxy extends Vector3Proxy {
  constructor(eid) { super(Velocity, eid) }
}

const position = new PositionProxy(eid)
const velocity = new VelocityProxy(eid)

position.x = 123

console.log(Position.x[eid]) // => 123

// reuse proxies simply by resetting the eid
position.eid = eid2

position.x = 456

console.log(Position.x[eid2]) // => 456
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

Wrapping a component with the `Change` modifier creates a query which returns entities who are marked as changed since last call of the function:

⚠ This performs an expensive diff. Use manual dirty flags for more performant mutation detection.
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

Systems are regular functions which are run against a world to update component state of entities, or anything else.

Queries should be used inside of system functions to obtain a relevant set of entities and perform operations on their component data.

While not required, it is greatly encouraged that you keep all component data mutations inside of systems.

Define a system that moves entity positions based on their velocity:
```js
const movementSystem = (world) => {
  // optionally apply logic to entities added to the query
  const entered = enteredMovementQuery(world)
  for (let i = 0; i < entered.length; i++) {
    const eid = ents[i]
    // ...
  }

  // apply system logic
  const ents = movementQuery(world)
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]

    // operate directly on SoA data
    Position.x[eid] += Velocity.x[eid]
    Position.y[eid] += Velocity.y[eid]
    
    // or reuse component proxies by resetting the eid for each proxy
    position.eid = velocity.eid = eid
    position.x += velocity.x
    position.y += velocity.y
  }

  // optionally apply logic to entities removed from the query
  const exited = exitedMovementQuery(world)
  for (let i = 0; i < exited.length; i++) {
    const eid = ents[i]
    // ...
  }

  return world
}
```

Define a system which tracks time:

```js
world.time = {
  delta: 0, 
  elapsed: 0,
  then: performance.now()
}
const timeSystem = world => {
  const { time } = world
  const now = performance.now()
  const delta = now - time.then
  time.delta = delta
  time.elapsed += delta
  time.then = now
  return world
}
```

Systems are used to update entities of a world:
```js
movementSystem(world)
```

Pipelines of functions can be composed with the `pipe` function:
```js
const pipeline = pipe(
  movementSystem,
  timeSystem,
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

Use the deserializer to apply state onto the same or any other world (returns deserialized entity IDs):
* Note: serialized entities and components are automatically (re)created if they do not exist in the target world
```js
const deserializedEnts = deserialize(world, packet)
```

Serialize a more specific set of entities using queries:
```js
const ents = movementQuery(world)
const packet = serialize(ents)
const deserializedEnts = deserialize(world, packet)
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
const deserializedEnts = deserializePositions(world, packet)
```

Serialization which targets select component stores of entities
whose component state has changed since the last call of the function:

ℹ Unlike queries, using `Changed` with serializers actually *improves* performance (less iterations).
```js
const serializeOnlyChangedPositions = defineSerializer([Changed(Position)])

const serializeChangedMovementQuery = pipe(movementQuery, serializeOnlyChangedPositions)
let packet = serializeChangedMovementQuery(world)
console.log(packet) // => undefined

Position.x[eid]++

packet = serializeChangedMovementQuery(world)
console.log(packet.byteLength) // => 13
```

### Deserialize Modes

There are 3 modes of deserilization, all of which are additive in nature. 

Deserialization will never remove entities, and will only add them.

 - `REPLACE` - (default) overwrites entity data, or creates new entities if the serialized EIDs don't exist in the target world.
 - `APPEND` - only creates new entities, never overwrites existing entity data.
 - `MAP` - acts like `REPLACE` but every serialized EID is assigned a local EID which is memorized for all subsequent deserializations onto the target world.
    - useful when deserializing server ECS state onto a client ECS world to avoid EID collisions but still maintain the server-side EID relationship
    - this maintains reference relationships made with `Types.eid`
    - returned entities are the locally mapped EIDs

```js
const mode = DESERIALIZE_MODE.MAP
const deserializedLocalEntities = deserialize(world, packet, mode)
```
