import { defineSystem } from "@bitecs/classic";
import { World } from "@bitecs/classic/dist/world/types";
import { bodyQuery } from "../queries/queries";
import { Velocity } from "../components/Velocity";
import { Mass } from "../components/Mass";
import { computeGravitationalForce } from "./computeGravitationalForce";

export const updateGravity = defineSystem((world: World) => {
  const eids = bodyQuery(world);

  for (let i = 0; i < eids.length; i++) {
    const eid = eids[i];
    const { forceX, forceY } = computeGravitationalForce(world, eid);

    // Apply computed force to entity's velocity, adjusting for its mass
    Velocity.x[eid] += forceX / Mass.value[eid];
    Velocity.y[eid] += forceY / Mass.value[eid];
  }
});
