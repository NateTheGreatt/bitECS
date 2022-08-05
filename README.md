<h1 align="center">
❤ ❤ ❤ <br />
bitECS
</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/bitecs">
    <img src="https://img.shields.io/npm/v/bitecs.svg" alt="Version" />
  </a>
  <a href="https://www.npmjs.com/package/bitecs">
    <img src="https://badgen.net/bundlephobia/minzip/bitecs" alt="Minzipped" />
  </a>
  <a href="https://www.npmjs.com/package/bitecs">
    <img src="https://img.shields.io/npm/dt/bitecs.svg" alt="Downloads" />
  </a>
  <a href="https://github.com/NateTheGreatt/bitECS/blob/master/LICENSE">
    <img src="https://badgen.net/npm/license/bitecs" alt="License" />
  </a>
</p>

<p align="center">
Functional, minimal, <a href="https://www.dataorienteddesign.com/dodbook/">data-oriented</a>, ultra-high performance <a href="https://en.wikipedia.org/wiki/Entity_component_system">ECS</a> library written using JavaScript TypedArrays.
</p>

</center>

## ✨ Features

|   |   |
| --------------------------------- | ---------------------------------------- |
| 🔮  Simple, declarative API       | 🔥  Blazing fast iteration               |
| 🔍  Powerful & performant queries | 💾  Serialization included              |
| 🍃  Zero dependencies             | 🌐  Node or browser                     |
| 🤏  `~5kb` minzipped              | 🏷  TypeScript support                   |
| ❤  Made with love                | 🔺 [glMatrix](https://github.com/toji/gl-matrix) support |

### 📈 Benchmarks

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
  const { time: { delta } } = world
  const ents = movementQuery(world)
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    Position.x[eid] += Velocity.x[eid] * delta
    Position.y[eid] += Velocity.y[eid] * delta
    Position.z[eid] += Velocity.z[eid] * delta
  }
  return world
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

const pipeline = pipe(movementSystem, timeSystem)

const world = createWorld()
world.time = { delta: 0, elapsed: 0, then: performance.now() }

const eid = addEntity(world)
addComponent(world, Position, eid)
addComponent(world, Velocity, eid)
Velocity.x[eid] = 1.23
Velocity.y[eid] = 1.23

setInterval(() => {
  pipeline(world)
}, 16)
```

## 🔌 Powering

<a href="https://github.com/phaserjs/phaser"><img src="https://github.com/phaserjs/phaser/raw/main/logo.png" width="420"/></a>

<a href="https://github.com/XRFoundation/XREngine"><img src="https://user-images.githubusercontent.com/5104160/181167947-2cf42b34-7dd6-4e71-b840-c25b8cf850e6.png" width="420"/></a>

<a href="https://github.com/thirdroom/thirdroom"><img src="https://github.com/thirdroom/thirdroom/raw/main/docs/assets/logo.png" width="420"/></a>

<a href="https://github.com/mozilla/hubs"><img src="https://github.com/NateTheGreatt/bitECS/blob/master/mozilla-hubs.png" width="420"/></a>


