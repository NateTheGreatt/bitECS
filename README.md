# 👾 bitECS 👾

Functional, tiny, data-oriented, high performance [ECS](https://en.wikipedia.org/wiki/Entity_component_system) library written using JavaScript TypedArrays.

## Features
- Functional
- `<3kb` gzipped
- Zero dependencies
- Node or Browser
- [_Killer performance_](https://github.com/noctjs/ecs-benchmark)

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

  registerComponent,
  registerComponents,
  defineComponent,
  addComponent,
  removeComponent,
  
  defineQuery,
  Changed,
  Not,
  enterQuery,
  exitQuery,
  
  defineSystem,
  
  defineSerializer,
  defineDeserializer,

} from 'bitecs'


/** createWorld
 * 
 * Creates a world which represents a set of entities and what components they possess.
 * Does NOT store actual component data.
 * Create as many worlds as you want.
**/

// returns an empty object which can be used to store miscellaneous state about the world
const world = createWorld()
const world2 = createWorld()


/** defineComponent
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
const Health = defineComponent(ui16)
const Alive = defineComponent() // "tag" component
const Mapping = defineComponent(new Map()) // can pass any data structure to use
const SetOfStuff = defineComponent(new Set())
const RegularObject = defineComponent({})

// register components with worlds
registerComponents(world, [Position, Velocity, Health]) // in groups
registerComponent(world, Alive) // or individually


/** defineQuery
 * 
 * Returns a query function which returns set of entities from a world that match the given components.
**/

// define a query using components
const movementQuery = defineQuery([Position, Velocity])

// use the query on a world
const ents = movementQuery(world)

// wrapping a component with the Change modifier creates a query which
// returns entities whose component's state has changed since last call of the function
const changedPositionQuery = defineQuery([ Changed(Position) ])

// wrapping a component with the Not modifier creates a query which
// returns entities who explicitly do not have the component
const notVelocityQuery = defineQuery([ Position, Not(Velocity) ])

// enter-query hook, called when an entity's components matches the query
enterQuery(world, movementQuery, eid => {})

// exit-query hook, called when an entity's components no longer matches the query
exitQuery(world, movementQuery, eid => {})


/** defineSystem
 * 
 * Creates a function which can be processed against a given world.
 * Use queries to access relevant entities for the system.
 * 
 * Note: Entity and component removals are deferred until the system has finished running.
**/

// define a system
const movementSystem = defineSystem(world => {
  const ents = movementQuery(world)
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    Position.x[eid] += Velocity.x[eid]
    Position.y[eid] += Velocity.y[eid]
  }
})


/** Entity
 * 
 * An entity is a single ID which components can be associated with.
 * Entities are accessed via queries, components of whom are mutated with systems.
**/

// add entities to the world
const eid = addEntity(world)
const eid2 = addEntity(world)

// remove entities from the world (deferred until any system runs)
removeEntity(world, eid2)

// add components to the new entities in the world
addComponent(world, Position, eid)
addComponent(world, Velocity, eid)

// remove components from entities in the world (deferred until any system runs)
removeComponent(world, Velocity, eid)

// there are no component getters or setters
// data is accessed directly by entity ID
Position.x[eid] = 1
Position.y[eid] = 2


/** Pipe
 * 
 * Creates a sequence of systems which are executed in serial.
**/

const pipeline = pipe(
  movementSystem,
  movementSystem,
  movementSystem,
)


/** 
 * Update worlds with systems or pipelines of systems.
**/

movementSystem(world) // executes movement system on world
pipeline(world) // executes a pipeline of systems on world

```

Full documentation and feature rich examples can be found [here](DOCS.md).
