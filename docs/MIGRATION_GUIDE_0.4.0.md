# Migration Guide: bitECS 0.3.x → 0.4.0

This guide will help you migrate your existing bitECS 0.3.x code to the new 0.4.0 API.

## 📋 Migration Checklist

- [ ] Update component definitions
- [ ] Replace defineQuery with query function
- [ ] Update world creation (if using custom contexts)
- [ ] Migrate enterQuery/exitQuery to observers
- [ ] Replace Changed() queries with observers or manual flags
- [ ] Migrate entity references to relations
- [ ] Update serialization imports

## 🔧 Step-by-Step Migration

### 1. Component Definitions

**Before (0.3.x):**
```js
import { Types, defineComponent } from 'bitecs'

const Position = defineComponent({ 
  x: Types.f32, 
  y: Types.f32, 
  z: Types.f32 
})
const Tag = defineComponent()
const Reference = defineComponent({ 
  entity: Types.eid 
})
```

**After (0.4.0):**
```ts
import { createRelation } from 'bitecs'

// Option 1: SoA with regular arrays (recommended for memory)
const Position = {
  x: [] as number[],
  y: [] as number[],
  z: [] as number[]
}

// Option 2: TypedArrays
const Position = {
  x: new Float32Array(10000),
  y: new Float32Array(10000),
  z: new Float32Array(10000)
}

// Option 3: AoS for compatability
const Position = [] as { x: number; y: number; z: number }[]

// Option 4: Array of arrays where each entity gets a full array value
const Position = Array.from({ length: 10000 }, () => new Float32Array(3))

// Tags are just empty objects
const Tag = {}

// References are now relations
const References = createRelation()
```

### 2. Adding Components to Entities

**Before (0.3.x):**
```js
addComponent(world, Position, eid)
Position.x[eid] = 10
Position.y[eid] = 20
```

**After (0.4.0):**
```ts
addComponent(world, eid, Position)  // Note: parameter order changed
Position.x[eid] = 10
Position.y[eid] = 20

// Or with the 'set' helper for object-style initialization (requires onSet observer)
addComponent(world, eid, set(Position, { x: 10, y: 20 }))

// For multiple components, use addComponents (plural)
addComponents(world, eid, 
  set(Position, { x: 10, y: 20 }),    // Requires onSet observer
  set(Velocity, { x: 1, y: 1 }),      // Requires onSet observer  
  Health
)

// For entity references, use relations instead of component data
addComponent(world, eid, References(targetEntityId))
```

### 3. Query System

**Before (0.3.x):**
```js
const movementQuery = defineQuery([Position, Velocity])
const taggedQuery = defineQuery([Position, Not(Velocity)])
const changedQuery = defineQuery([Changed(Position)])

// In your system
const entities = movementQuery(world)
const taggedEntities = taggedQuery(world)
const changedEntities = changedQuery(world)
```

**After (0.4.0):**
```ts
// Direct queries (no pre-definition needed)
const entities = query(world, [Position, Velocity])
const taggedEntities = query(world, [Position, Not(Velocity)])

// For "changed" behavior, use observers instead
const changedEntities: number[] = []
observe(world, onAdd(Position), (eid) => {
  changedEntities.push(eid)
})

// Or use manual dirty flags
const dirtyPositions = new Set<number>()
// Mark dirty when changing
Position.x[eid] = newValue
dirtyPositions.add(eid)

// Note: set() helper requires onSet observer to work
observe(world, onSet(Position), (eid, params) => {
  Position.x[eid] = params.x
  Position.y[eid] = params.y
})
```

### 4. Enter/Exit Queries → Queues with Observers

**Before (0.3.x):**
```js
const movementQuery = defineQuery([Position, Velocity])
const enteredMovementQuery = enterQuery(movementQuery)
const exitedMovementQuery = exitQuery(movementQuery)

// In your system
const entered = enteredMovementQuery(world)
const exited = exitedMovementQuery(world)

for (let i = 0; i < entered.length; i++) {
  const eid = entered[i]
  console.log(`Entity ${eid} started moving`)
}
```

**After (0.4.0):**
```ts
// Simple queues on world object
world.enteredMovers = []
world.exitedMovers = []

// Set up observers once
observe(world, onAdd(Position, Velocity), (eid) => world.enteredMovers.push(eid))
observe(world, onRemove(Position, Velocity), (eid) => world.exitedMovers.push(eid))

// In your system
const entered = world.enteredMovers.splice(0)  // Get and clear
const exited = world.exitedMovers.splice(0)   // Get and clear

for (const eid of entered) {
  console.log(`Entity ${eid} started moving`)
}

for (const eid of exited) {
  console.log(`Entity ${eid} stopped moving`)
}
```

### 5. Entity References → Relations

**Before (0.3.x):**
```js
const Reference = defineComponent({ entity: Types.eid })
addComponent(world, Reference, eid)
Reference.entity[eid] = targetEid
```

**After (0.4.0):**
```ts
const References = createRelation()
addComponent(world, eid, References(targetEid))
const targets = getRelationTargets(world, eid, References)
```

### 6. Serialization Module Migration

**Before (0.3.x):**
```js
import { defineSerializer, defineDeserializer } from 'bitecs'
const serialize = defineSerializer([Position, Velocity])
const entities = movementQuery(world)
const packet = serialize(entities)
```

**After (0.4.0):**
```ts
// New API in separate module
import { createSoASerializer } from 'bitecs/serialization'
const serialize = createSoASerializer([Position, Velocity])
const packet = serialize(entities)
```

### 7. Legacy Compatibility Module

For easier migration, a legacy compatibility module is available that provides the old 0.3.x API:

```ts
// Use the legacy module for gradual migration
import { 
  defineComponent, 
  defineQuery, 
  enterQuery, 
  exitQuery,
  Types,
  addComponent,
  removeComponent,
  hasComponent
} from 'bitecs/legacy'

// Works exactly like 0.3.x
const Position = defineComponent({ 
  x: Types.f32, 
  y: Types.f32 
})

const movementQuery = defineQuery([Position])
const entered = enterQuery(movementQuery)

// Legacy addComponent uses old parameter order
addComponent(world, Position, eid)
```

This allows you to:
- **Migrate gradually**: Update parts of your codebase over time
- **Mix APIs**: Use new features alongside legacy code
- **Reduce risk**: Keep existing systems working while learning new patterns
