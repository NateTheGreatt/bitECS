// Based on Sander Mertens' ECS N-Body simulation for Flecs
// https://github.com/SanderMertens/ecs_nbody

import { measure, requestAnimationFrame } from "bench-tools";
import { init } from "./systems/init";
import { pipeline } from "./systems/pipeline";
import { world } from "./world";

// Start the simulation.
const main = () => {
  measure(() => pipeline(world));
  requestAnimationFrame(main);
};

// Initialize all entities.
init(world);

requestAnimationFrame(main);
