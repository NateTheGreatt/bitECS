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
  <a href="https://discord.gg/daUxSk5AwX">
    <img src="https://img.shields.io/discord/1212857060731912202?color=7289da&label=Discord&logo=discord&logoColor=white" alt="Discord" />
  </a>
</p>

<p align="center">
Flexible, minimal, <a href="https://www.dataorienteddesign.com/dodbook/">data-oriented</a> <a href="https://en.wikipedia.org/wiki/Entity_component_system">ECS</a> library for Typescript.
</p>

</center>

## ✨ Features

`bitECS` is a minimal, less opinionated, and powerful Entity Component System (ECS) library. It provides a lean API that enables developers to build their architecture to their liking, offering flexibility while maintaining efficiency where needed. Features include:
| | |
|---|---|
| 🔮 Simple, declarative API | 🍃 Lightweight (`<4kb` minzipped) |
| 🔍 Powerful querying | 📦 Zero dependencies |
| 🔗 Relational entity modeling | 🧵 Thread-friendly |
| 💾 Serialization included | 💖 Made with love |

## 💿 Install
```
npm i bitecs
```

## 📘  Documentation
|                  |
| ---------------- |
| 🏁  [Introduction](/docs/Intro.md) |
| 💾  [Serialization](/docs/Serialization.md) |
| 🧵  [Multithreading](/docs/Multithreading.md) |
| 📑  [API Docs](/docs/API.md) |

## 🕹 Example

```js
import {
  createWorld,
  query,
  addEntity,
  addComponent,
} from 'bitecs'

const world = createWorld({
  components: {
    Position: { x: [], y: [] },
    Velocity: { x: new Float32Array(1e5), y: new Float32Array(1e5) },
    Health: []
  },
  time: {
    delta: 0, 
    elapsed: 0, 
    then: performance.now()
  }
})

const { Position, Velocity, Health } = world.components

const eid = addEntity(world)
addComponent(world, eid, Position)
addComponent(world, eid, Velocity)
Position.x[eid] = 0
Position.y[eid] = 0
Velocity.x[eid] = 1.23
Velocity.y[eid] = 1.23
Health[eid] = 100

const movementSystem = ({
    components: { Position, Velocity },
    time: { delta } 
}) => {
  for (const eid of query(world, [Position, Velocity])) {
    Position.x[eid] += Velocity.x[eid] * delta
    Position.y[eid] += Velocity.y[eid] * delta
  }
}

const timeSystem = ({ time }) => {
  const now = performance.now()
  const delta = now - time.then
  time.delta = delta
  time.elapsed += delta
  time.then = now
}

const update = (world) => {
  movementSystem(world)
  timeSystem(world)
}

// Node environment
setInterval(() => {
  update(world)
}, 1000/60)

// Browser environment
requestAnimationFrame(function animate() {
  update(world)
  requestAnimationFrame(animate)
})
```

## 📈 Benchmarks

Microbenchmarks should be taken with a grain of salt. To get a feel for performance possibilities in real scenarios, see the [demos](https://github.com/NateTheGreatt/bitECS/tree/master/demos).

- [noctjs/ecs-benchmark](https://github.com/noctjs/ecs-benchmark) 
- [ddmills/js-ecs-benchmarks](https://github.com/ddmills/js-ecs-benchmarks)

## 🔌 Used by

- [iR Engine](https://github.com/ir-engine/ir-engine)
- [Third Room](https://github.com/thirdroom/thirdroom)
- [Hubs](https://github.com/Hubs-Foundation/hubs)

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=NateTheGreatt/bitECS&type=Date)](https://star-history.com/#NateTheGreatt/bitECS&Date)
