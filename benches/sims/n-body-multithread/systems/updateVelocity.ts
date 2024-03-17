import { defineSystem } from "@bitecs/classic";
import { World } from "../world";
import { bodyQuery } from "../queries/bodyQuery";
import { Acceleration, Mass, Velocity } from "../components";

export const updateVelocity = defineSystem((world: World) => {
  const eids = bodyQuery(world);

  for (let i = 0; i < eids.length; i++) {
    const eid = eids[i];
    Velocity.x[eid] += Acceleration.x[eid] / Mass.value[eid];
    Velocity.y[eid] += Acceleration.y[eid] / Mass.value[eid];
  }
});
