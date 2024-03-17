import { defineSystem } from "@bitecs/classic";
import { bodyQuery } from "../queries/bodyQuery";
import { Position, Velocity } from "../components";
import { CONSTANTS } from "../constants";

export const moveBodies = defineSystem((world) => {
  const eids = bodyQuery(world);

  for (let i = 0; i < eids.length; i++) {
    const eid = eids[i];

    // Update position based on velocity and the global SPEED factor
    Position.x[eid] += CONSTANTS.SPEED * Velocity.x[eid];
    Position.y[eid] += CONSTANTS.SPEED * Velocity.y[eid];
  }

  return world;
});
