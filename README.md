# 👾 bitECS 👾

Functional, small, data-oriented, ultra-high performance [ECS](https://en.wikipedia.org/wiki/Entity_component_system) library written using JavaScript TypedArrays.


## Features

🔮 Simple & functional API

🔥 Blazing fast iteration

🔍 Powerful & performant queries

💾 Swift serialization

🍃 Zero dependencies

🌐 Node or browser

🤏 `~5kb` gzipped

🚀 Unparalleled performance

- [noctjs/ecs-benchmark](https://github.com/noctjs/ecs-benchmark)
- [ddmills/js-ecs-benchmarks](https://github.com/ddmills/js-ecs-benchmarks)


### In Development

🧵 Multithreading


## Install
```
npm i bitecs
```


## Example

```js

// this is the entire API
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

} from 'bitecs'


/** 
 * createWorld
 * 
 * Creates a world which represents a set of entities and what components they possess.
 * Does NOT store actual component data.
 * Create as many worlds as you want.
**/

// creating worlds returns empty objects
const world = createWorld()
const world2 = createWorld()

// store whatever you need on the world object
world.time = { delta: 0, elapsed: 0 }

/** 
 * defineComponent
 * 
 * Returns a SoA (Structure of Arrays).
 * Store of component data.
**/

// available types
const { bool, i8, ui8, ui8c, i16, ui16, i32, ui32, f32, f64 } = Types

// schema for a component
const Vector2 = { x: f32, y: f32 }

// define components, which creates SoA data stores
const Position = defineComponent(Vector2)
const Velocity = defineComponent(Vector2)
const Health = defineComponent({ value: ui16 })
const Alive = defineComponent() // "tag" component
const Mapping = defineComponent(new Map()) // can use a map to associate regular JS objects with entities

/** 
 * defineQuery
 * 
 * Returns a query function which returns array of entities from a world that match the given components.
**/

// define a query using components
const movementQuery = defineQuery([Position, Velocity])

// use the query on a world
const ents = movementQuery(world)

// wrapping a component with the Not modifier creates a query which
// returns entities who explicitly do not have the component
const positionWithoutVelocityQuery = defineQuery([ Position, Not(Velocity) ])

// wrapping a component with the Change modifier creates a query which
// returns entities whose component's state has changed since last call of the function
const changedPositionQuery = defineQuery([ Changed(Position) ])

// enter-query hook, called when an entity's components matches the query
enterQuery(world, movementQuery, eid => {})

// exit-query hook, called when an entity's components no longer matches the query
exitQuery(world, movementQuery, eid => {})


/** 
 * defineSystem
 * 
 * Creates a function which can be processed against a given world.
 * Use queries to access relevant entities for the system.
**/

// movement system
const movementSystem = defineSystem(world => {
  const ents = movementQuery(world)
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    Position.x[eid] += Velocity.x[eid]
    Position.y[eid] += Velocity.y[eid]
  }
})

// delta time system
let then = performance.now()
const timeSystem = defineSystem(world => {
  const now = performance.now()
  const delta = now - then
  world.time.delta = delta
  world.time.elapsed += delta
  then = now
})


/** 
 * addEntity
 * 
 * An entity is a single ID which components can be associated with.
 * Entities are accessed via queries, components of whom are mutated with systems.
**/

// add entities to the world
const eid = addEntity(world)
const eid2 = addEntity(world)

// remove entities from the world
removeEntity(world, eid2)

// add components to the new entities in the world
addComponent(world, Position, eid)
addComponent(world, Velocity, eid)

// remove components from entities in the world
removeComponent(world, Velocity, eid)

// there are no component getters or setters
// data is accessed directly by entity ID
Position.x[eid] = 1
Position.y[eid] = 2


/** 
 * pipe
 * 
 * Creates a sequence of systems which are executed in serial.
**/

const pipeline = pipe(
  movementSystem,
  timeSystem,
)


/** 
 * Update worlds with systems or pipelines of systems.
**/

// execute movement system on world
movementSystem(world)

// executes a pipeline of systems on world
pipeline(world)


/** 
 * createSerializer / Deserializer
 * 
 * Creates a function which serializes the state of a world or array of entities.
**/

// creates a serializer/deserializer which will serialize all component stores
const serialize = createSerializer()
const deserialize = createDeserializer()

// serializes the entire world of entities
let packet = serialize(world)

// deserializes the state back onto the world
// note: creates entities and adds components if they do not exist
deserialize(world, packet)

// creates a serializer/deserializer which will serialize select component stores
const serializePositions = createSerializer([Position])
const deserializePositions = createDeserializer([Position])

// serializes the Position data of entities which match the movementQuery
packet = serializePositions(movementQuery(world))

// deserializes the Position data back onto the world
deserializePositions(world, packet)

// creates a serializer which will serialize select component stores of entities
// whose component state has changed since the last call of the function
const serializeOnlyChangedPositions = createSerializer([Changed(Position)])

// serializes the Position data of entities which match the movementQuery
// whose component values have changed since last call of the function
packet = serializeOnlyChangedPositions(movementQuery(world))

```
