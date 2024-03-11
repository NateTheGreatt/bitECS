// Based on Sander Mertens' ECS N-Body simulation for Flecs
// https://github.com/SanderMertens/ecs_nbody

import { createWorld, pipe } from "@bitecs/classic";
import { updateGravity } from "./systems/updateGravity";
import { moveBodies } from "./systems/moveBodies";
import { updateColor } from "./systems/updateColor";
import { measure } from "../../utils/measure";
import { init } from "./systems/init";
import { setInitial } from "./systems/setInitial";

const world = createWorld();

// Define the simulation pipeline.
const pipeline = pipe(setInitial, updateGravity, moveBodies, updateColor);

// Initialize all entities.
init(world);

// Run the simulation.
const main = () => {
  measure(() => pipeline(world));
  setImmediate(main);
};

setImmediate(main);
