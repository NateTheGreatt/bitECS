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
Functional, minimal, <a href="https://www.dataorienteddesign.com/dodbook/">data-oriented</a> <a href="https://en.wikipedia.org/wiki/Entity_component_system">ECS</a> library for Typescript.
</p>

</center>

## ✨ Features

- 🔮 Simple, declarative API
- 🔍 Powerful & performant queries
- 💾 Serialization included
- 🧵 Thread friendly
- 🍃 Zero dependencies
- 🌐 Node or browser compatible
- 🤏 Tiny footprint (~3kb minzipped)
- ❤ Made with love

### 📈 Benchmarks

Microbenchmarks should be taken with a grain of salt.

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
  query,
  addEntity,
  addComponent,
  pipe,
} from 'bitecs'

const max = 1e5


const movementSystem = (world) => {
  const { 
    components: { Position, Velocity },
    time: { delta } 
  } = world
  const ents = query(world, [Position, Velocity])
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    Position.x[eid] += Velocity.x[eid] * delta
    Position.y[eid] += Velocity.y[eid] * delta
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

const world = createWorld(withContext({
  components: {
    // components can be anything
    Position: { x: [], y: [] },
    Velocity: { x: [], y: [] }
  },
  time: { 
    delta: 0, 
    elapsed: 0, 
    then: performance.now() 
  }
}))

const { Position, Velocity } = world.components

const eid = addEntity(world)
addComponent(world, eid, Position)
addComponent(world, eid, Velocity)
Position.x[eid] = 0
Position.y[eid] = 0
Velocity.x[eid] = 1.23
Velocity.y[eid] = 1.23

setInterval(() => {
  pipeline(world)
}, 16)
```


## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=NateTheGreatt/bitECS&type=Date)](https://star-history.com/#NateTheGreatt/bitECS&Date)


## Used by

- [iR Engine](https://github.com/ir-engine/ir-engine)
- [Third Room](https://github.com/thirdroom/thirdroom)
- [Hubs](https://github.com/Hubs-Foundation/hubs)
