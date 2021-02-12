
<br><a name="module_World"></a>

## World
#### World ⇒ <code>World</code>
> Create a new ECS World.

**Returns**: <code>World</code> - Returns the ECS API for the created world instance.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| config | <code>Object</code> | <code>{}</code> | The world configuration. |
| config.maxEntities | <code>number</code> | <code>100000</code> | Maximum entities allowed in world. |
| config.maxComponentTypes | <code>number</code> | <code>128</code> | Maximum component registrations allowed in world. |

**Example** *(Create a new ECS World.)*  
```js
import World from 'bitecs'
const world = World({ maxEntities: 100000, maxComponentTypes: 128 })
```

* [World](#module_World) ⇒ <code>World</code>
    * [.registerComponent(name, schema)](#module_World.registerComponent) ⇒ <code>Object</code>
    * [.addComponent(name, eid, values, reset)](#module_World.addComponent)
    * [.removeComponent(name, eid, immediate)](#module_World.removeComponent)
    * [.removeAllComponents(eid, immediate)](#module_World.removeAllComponents)
    * [.hasComponent(name, eid)](#module_World.hasComponent) ⇒ <code>boolean</code>
    * [.entityCount()](#module_World.entityCount)
    * [.addEntity()](#module_World.addEntity) ⇒ <code>uint32</code>
    * [.removeEntity(eid, immediate)](#module_World.removeEntity)
    * [.enabled(name)](#module_World.enabled) ⇒ <code>boolean</code>
    * [.registerSystem(system)](#module_World.registerSystem)
    * [.toggle(name)](#module_World.toggle)
    * [.step(name, force)](#module_World.step)


<br><a name="module_World.registerComponent"></a>

### registerComponent
#### World.registerComponent(name, schema) ⇒ <code>Object</code>
> Register a new component with the world.

**Returns**: <code>Object</code> - DataManager for the component.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of component. |
| schema | <code>Object</code> | Data structure and types for component. |

**Example** *(Register a flat component.)*  
```js
import World from 'bitecs'

const world = World()
world.registerComponent('POSITION', {
  x: 'float32',
  y: 'float32'
})
```
**Example** *(Register a nested component.)*  
```js
import World from 'bitecs'

const world = World()
world.registerComponent('POSITION', {
  world: { x: 'float32', y: 'float32' }
})
```
**Example** *(Register an enum component.)*  
```js
import World from 'bitecs'

const world = World()
world.registerComponent('STATE', {
  animation: ['IDLE', 'WALK', 'RUN']
})
```
**Example** *(Register an array component.)*  
```js
import World from 'bitecs'

const world = World()
world.registerComponent('POLYGON', {
  points: {
   x: [{ index: 'uint8', type: 'float32', length: 8 }],
   y: [{ index: 'uint8', type: 'float32', length: 8 }]
 }
})

// The `length` param is optional and defaults to the max size of the `index` type.
```

<br><a name="module_World.addComponent"></a>

### addComponent
#### World.addComponent(name, eid, values, reset)
> Add a registered component to an entity.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | <code>string</code> |  | Name of the component, |
| eid | <code>uint32</code> |  | Entity id. |
| values | <code>object</code> |  | Optional values to set upon component initialization. |
| reset | <code>boolean</code> | <code>true</code> | Zero out the component values. |

**Example** *(Add a component to an entity.)*  
```js
import World from 'bitecs'

const world = World()
world.registerComponent('POSITION', {
  x: 'float32',
  y: 'float32'
})

const eid = world.addEntity()
world.addComponent('POSITION', eid)
```
**Example** *(Add a component to en entity with default values)*  
```js
import World from 'bitecs'

const world = World()
world.registerComponent('POSITION', {
  x: 'float32',
  y: 'float32'
})

const eid = world.addEntity()
world.addComponent('POSITION', eid, { x: 100, y: 100 })
```

<br><a name="module_World.removeComponent"></a>

### removeComponent
#### World.removeComponent(name, eid, immediate)
> Remove a component type from an entity.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | <code>string</code> |  | Name of the component. |
| eid | <code>uint32</code> |  | Entity id. |
| immediate | <code>boolean</code> | <code>false</code> | Remove immediately. If false, defer until end of tick. |

**Example** *(Remove a component deferred.)*  
```js
import World from 'bitecs'

const world = World()
world.registerComponent('POSITION', {
  x: 'float32',
  y: 'float32'
})

const eid = world.addEntity()
world.addComponent('POSITION', eid, { x: 100, y: 100 }) // Component added
world.step()

world.removeComponent('POSITION', eid)
world.step() // Component Removed
```
**Example** *(Remove a component immediately.)*  
```js
import World from 'bitecs'

const world = World()
world.registerComponent('POSITION', {
  x: 'float32',
  y: 'float32'
})

const eid = world.addEntity()
world.addComponent('POSITION', eid, { x: 100, y: 100 }) // Component added
world.step()

world.removeComponent('POSITION', eid, true) // Component removed
```

<br><a name="module_World.removeAllComponents"></a>

### removeAllComponents
#### World.removeAllComponents(eid, immediate)
> Removes all components from the given entity.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| eid | <code>uint32</code> |  | Entity id. |
| immediate | <code>boolean</code> | <code>false</code> | Remove immediately. If false, defer until end of tick. |

**Example** *(Remove all components from an entity deferred.)*  
```js
import World from 'bitecs'

const world = World()
world.registerComponent('POSITION', {
  x: 'float32',
  y: 'float32'
})
world.registerComponent('VELOCITY', {
  vx: 'int8',
  vy: 'int8,
})

const eid = world.addEntity()
world.addComponent('POSITION', eid, { x: 100, y: 100 }) // Component added
world.addComponent('VELOCITY', eid) // Component added

world.removeAllComponent(eid)
world.step() // All components Removed
```
**Example** *(Remove all components from an entity deferred.)*  
```js
import World from 'bitecs'

const world = World()
world.registerComponent('POSITION', {
  x: 'float32',
  y: 'float32'
})
world.registerComponent('VELOCITY', {
  vx: 'int8',
  vy: 'int8,
})

const eid = world.addEntity()
world.addComponent('POSITION', eid, { x: 100, y: 100 }) // Component added
world.addComponent('VELOCITY', eid) // Component added

world.removeAllComponent(eid, true) // All components Removed
```

<br><a name="module_World.hasComponent"></a>

### hasComponent
#### World.hasComponent(name, eid) ⇒ <code>boolean</code>
> Check if an entity has the specified component.

**Returns**: <code>boolean</code> - Wether or not the component exists on the entity.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Component name. |
| eid | <code>uint32</code> | Entity id. |

**Example** *(Check if entity has component.)*  
```js
import World from 'bitecs'

const world = World()
world.registerComponent('POSITION', {
  x: 'float32',
  y: 'float32'
})

const eid = world.addEntity()
world.hasComponent('POSITION', eid) // false

world.addComponent('POSITION', eid, { x: 100, y: 100 })
world.hasComponent('POSITION', eid) // true
```

<br><a name="module_World.entityCount"></a>

### entityCount
#### World.entityCount()
> Get the count of entities currently in the world.

**Example** *(Get the entity count)*  
```js
import World from 'bitecs'

const world = World()
world.addEntity()
world.addEntity()
world.entityCount() // 2
```

<br><a name="module_World.addEntity"></a>

### addEntity
#### World.addEntity() ⇒ <code>uint32</code>
> Add a new entity to the world.

**Returns**: <code>uint32</code> - The entity id.  
**Example** *(Add an entity to the world)*  
```js
import World from 'bitecs'

const world = World()
world.addEntity() // 0
world.addEntity() // 1
```

<br><a name="module_World.removeEntity"></a>

### removeEntity
#### World.removeEntity(eid, immediate)
> Remove an entity from the world.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| eid | <code>uint32</code> |  | The entity id to remove. |
| immediate | <code>boolean</code> | <code>false</code> | Remove immediately. If false, defer until end of tick. |

**Example** *(Remove an entity from the world deferred.)*  
```js
import World from 'bitecs'

const world = World()
const eid = world.addEntity() // 1
world.entityCount() // 1
world.removeEntity(eid)
world.step()
world.entityCount() // 0
```
**Example** *(Remove an entity from the world immediately.)*  
```js
import World from 'bitecs'

const world = World()
const eid = world.addEntity() // 1
world.entityCount() // 1
world.removeEntity(eid, true)
world.entityCount() // 0
```

<br><a name="module_World.enabled"></a>

### enabled
#### World.enabled(name) ⇒ <code>boolean</code>
> Returns if the World system execution is enabled.

**Returns**: <code>boolean</code> - World system execution enabled.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of a system. If not defined return world enabled state. |

**Example** *(Check if the world systems are enabled.)*  
```js
import World from 'bitecs'

const world = World()
world.enabled() // true

world.toggle()
world.enabled() // false
```
**Example** *(Check if a system is enabled.)*  
```js
import World from 'bitecs'

const world = World()
world.registerSystem({
  name: 'MOVEMENT',
  components: ['POSITION', 'VELOCITY'],
  update: (position, velocity) => eid => {
     position.x[eid] += velocity.vx[eid] * velocity.speed[eid]
     position.y[eid] += velocity.vy[eid] * velocity.speed[eid]
  }
})

world.enabled('MOVEMENT') // true
world.toggle('MOVEMENT')
world.enabled('MOVEMENT') // false
```

<br><a name="module_World.registerSystem"></a>

### registerSystem
#### World.registerSystem(system)
> Register a new system.


| Param | Type | Description |
| --- | --- | --- |
| system | <code>Object</code> | System configuration. |
| system.name | <code>string</code> | The name of the system. |
| system.components | <code>Array.&lt;string&gt;</code> | Component names the system queries. |
| system.before | <code>function</code> | Called once at the beginning of the tick. |
| system.enter | <code>function</code> | Called when an entity is added to the system. |
| system.update | <code>function</code> | Called every tick on all entities in the system. |
| system.exit | <code>function</code> | Called when an entity is removed from the system. |
| system.after | <code>function</code> | Called once at the end of every tick. |

**Example** *(Full system API.)*  
```js
import World from 'bitecs'

const world = World()
world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
world.registerComponent('VELOCITY', { vx: 'int8', vy: 'int8', speed: 'uint16' })

world.registerSystem({
  name: 'MOVEMENT',
  components: ['POSITION', 'VELOCITY'],
  before: (position, velocity) => {
    // Called once at the beginning of each tick.
  },
  enter: (position, velocity) => eid => {
    // Called once when an entity is added to system.
  },
  update: (position, velocity) => eid => {
    // Called every tick for every entity in the system.
  },
  exit: (position, velocity) => eid => {
    // Called once when an entity is removed from the system.
  },
  after: (position, velocity) => {
    // Called once at the end of each tick.
  }
})
```
**Example** *(A sample movement system.)*  
```js
import World from 'bitecs'

const world = World()
world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
world.registerComponent('VELOCITY', { vx: 'int8', vy: 'int8', speed: 'uint16' })

world.registerSystem({
  name: 'MOVEMENT',
  components: ['POSITION', 'VELOCITY'],
  update: (position, velocity) => eid => {
     position.x[eid] += velocity.vx[eid] * velocity.speed[eid]
     position.y[eid] += velocity.vy[eid] * velocity.speed[eid]
  }
})
```

<br><a name="module_World.toggle"></a>

### toggle
#### World.toggle(name)
> Toggle the world system execution.


| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of a system to toggle. If not defined toggle world system execution. |

**Example** *(Toggle the world system execution.)*  
```js
import World from 'bitecs'

const world = World()
world.enabled() // true
world.step() // executes systems

world.toggle()
world.enabled() // false
world.step() // does not execute systems
```
**Example** *(Toggle a single system&#x27;s execution.)*  
```js
import World from 'bitecs'

const world = World()
world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
world.registerComponent('VELOCITY', { vx: 'int8', vy: 'int8', speed: 'uint16' })

world.registerSystem({
  name: 'MOVEMENT',
  components: ['POSITION', 'VELOCITY'],
  update: (position, velocity) => eid => {
     position.x[eid] += velocity.vx[eid] * velocity.speed[eid]
     position.y[eid] += velocity.vy[eid] * velocity.speed[eid]
  }
})

world.step('MOVEMENT') // executes system
world.toggle('MOVEMENT') // enabled false
world.enabled('MOVEMENT') // false
world.step('MOVEMENT') // does not executes system
```

<br><a name="module_World.step"></a>

### step
#### World.step(name, force)
> Step the world or specific system forward.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | <code>string</code> |  | Name of a system to step. If not defined step the entire world. |
| force | <code>boolean</code> | <code>false</code> | Step the world even if it is not enabled. |

**Example** *(Create a server side update loop.)*  
```js
import { performance } from 'perf_hooks'
import World from 'bitecs'
import events from 'eventemitter3'

const TICK_RATE = 30
const world = World()

const time = {
  now: performance.now(),
  previous: performance.now(),
  delta: 0,
  tick: 0
}

const tickLengthMs = 1000 / TICK_RATE

const tick = () => {
  time.now = performance.now()

  if (previous + tickLengthMs <= time.now) {
    time.delta = (time.now - previous) / 1000
    time.previous = time.now
    time.tick++

    events.emit('update', time)
    world.step()
    events.emit('late-update', time)

    if (hrtimeMs() - previous < tickLengthMs - 4) {
      setTimeout(tick)
    } else {
      setImmediate(tick)
    }
  }
}

tick()
events.emit('start')
```
**Example** *(Create client side update loop.)*  
```js
import World from 'bitecs'
import events from 'eventemitter3'

const world = World()

const time = {
  now: performance.now(),
  previous: performance.now(),
  delta: 0,
  tick: 0
}

const tick = () => {
  time.now = performance.now()
  time.delta = (time.now - previous) / 1000
  time.previous = time.now
  time.tick++

  events.emit('update', time)
  world.step()
  events.emit('late-update', time)

  requestAnimationFrame(tick)
}

tick()
events.emit('start')
```
**Example** *(Force step a paused world.)*  
```js
import World from 'bitecs'

const world = World()
world.toggle()
world.enabled() // false
world.step() // executes systems once
world.step('system-name') // executes system-name once
```
**Example** *(Step a specific system.)*  
```js
import World from 'bitecs'

const world = World()
world.registerComponent('POSITION', { x: 'float32', y: 'float32' })
world.registerComponent('VELOCITY', { vx: 'int8', vy: 'int8', speed: 'uint16' })

world.registerSystem({
  name: 'MOVEMENT',
  components: ['POSITION', 'VELOCITY'],
  update: (position, velocity) => eid => {
     position.x[eid] += velocity.vx[eid] * velocity.speed[eid]
     position.y[eid] += velocity.vy[eid] * velocity.speed[eid]
  }
})

world.step('MOVEMENT') // executes system
world.toggle('MOVEMENT')
world.enabled('MOVEMENT') // false
world.step('MOVEMENT', true) // executes system
```
