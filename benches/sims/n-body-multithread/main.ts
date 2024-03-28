// Based on Sander Mertens' ECS N-Body simulation for Flecs
// https://github.com/SanderMertens/ecs_nbody

import { measure, requestAnimationFrame } from '@sim/bench-tools';
import { init } from './systems/init';
import { pipeline } from './systems/pipeline';
import { world } from './world';
import { Position, Acceleration, Mass } from './components';

// Start the simulation.
const main = () => {
	measure(() => pipeline(world));
	requestAnimationFrame(main);
};

// Initialize all entities.
init(world);

// // Initialize workers
// const workers = Array(()=> {
//   const worker = new Worker('./worker.ts');

//   worker.postMessage({
//     components: {
//       Position,
//       Acceleration,
//       Mass,
//     },
//   })

//   return worker;
// }, { length: window.navigator.hardwareConcurrency })

requestAnimationFrame(main);
