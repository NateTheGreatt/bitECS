# 👾 bitECS 👾 [![npm](https://img.shields.io/npm/v/bitecs.svg)](https://www.npmjs.com/package/bitecs) [![Minzipped](https://badgen.net/bundlephobia/minzip/bitecs)](https://www.npmjs.com/package/bitecs) [![npm](https://img.shields.io/npm/dt/bitecs.svg)](https://www.npmjs.com/package/bitecs) [![License](https://badgen.net/npm/license/bitecs)](https://www.npmjs.com/package/bitecs)

Functional, minimal, [data-oriented](https://www.dataorienteddesign.com/dodbook/), ultra-high performance [ECS](https://en.wikipedia.org/wiki/Entity_component_system) library written using JavaScript TypedArrays.

</center>

## ✨ Features

|   |   |
| --------------------------------- | ---------------------------------------- |
| 🔮  Simple, declarative API       | 🔥  Blazing fast iteration               |
| 🔍  Powerful & performant queries | 💾  Serialization included              |
| 🍃  Zero dependencies             | 🌐  Node or browser                     |
| 🤏  `<5kb` minzipped              | 🏷  TypeScript support                   |
| ❤  Made with love                | 🔺 [glMatrix](https://github.com/toji/gl-matrix) support |

### 📈 Benchmarks

🚀 Unparalleled performance benchmarks

|                                                                 |                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [noctjs/ecs-benchmark](https://github.com/noctjs/ecs-benchmark) | [ddmills/js-ecs-benchmarks](https://github.com/ddmills/js-ecs-benchmarks) |

## 💿 Install
```
npm i bitecs
```

## 📘  Documentation
|                  |
| ---------------- |
| 🏁  [Getting Started](https://github.com/NateTheGreatt/bitECS/blob/master/docs/INTRO.md) |
| 📑  [API](https://github.com/NateTheGreatt/bitECS/blob/master/docs/API.md) |
| ❔  [FAQ](https://github.com/NateTheGreatt/bitECS/blob/master/docs/FAQ.md) |
| 🏛  [Tutorial](https://github.com/ourcade/phaser3-bitecs-getting-started) |

## 🕹 Example

```js
import {
  createWorld,
  Types,
  defineComponent,
  defineQuery,
  addEntity,
  addComponent,
  pipe,
} from 'bitecs'

const Vector3 = { x: Types.f32, y: Types.f32, z: Types.f32 }
const Position = defineComponent(Vector3)
const Velocity = defineComponent(Vector3)

const movementQuery = defineQuery([Position, Velocity])

const movementSystem = (world) => {
  const ents = movementQuery(world)
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    Position.x[eid] += Velocity.x[eid]
    Position.y[eid] += Velocity.y[eid]
    Position.z[eid] += Velocity.z[eid]
  }
}

const timeSystem = world => {
  const { time } = world
  const now = performance.now()
  const delta = now - time.then
  time.delta = delta
  time.elapsed += delta
  time.then = now
}

const pipeline = pipe(movementSystem, timeSystem)

const world = createWorld()
world.time = { delta: 0, elapsed: 0, then: performance.now() }

const eid = addEntity(world)
addComponent(world, Position, eid)
addComponent(world, Velocity, eid)

setInterval(() => {
  pipeline(world)
}, 16)
```

## 🔌 Powering

<a href="https://github.com/phaserjs/phaser"><img src="https://github.com/phaserjs/phaser/raw/main/logo.png" width="420"/></a>

<a href="https://github.com/XRFoundation/XREngine"><img src="https://github.com/XRFoundation/XREngine/raw/master/xrengine%20black.png" width="420"/></a>