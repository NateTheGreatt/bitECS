import { World } from "@bitecs/classic/dist/world/types";
import { NBODIES } from "../constants";
import { addComponent, addEntity } from "@bitecs/classic";
import { IsCentralMass } from "../components/IsCentralMass";
import { Position } from "../components/Position";
import { Velocity } from "../components/Velocity";
import { Mass } from "../components/Mass";
import { Circle } from "../components/Circle";

export const init = (world: World) => {
  for (let i = 0; i < NBODIES; i++) {
    const eid = addEntity(world);
    addComponent(world, Position, eid);
    addComponent(world, Velocity, eid);
    addComponent(world, Mass, eid);
    addComponent(world, Circle, eid);

    if (i === 0) {
      // Make the first entity the central mass.
      addComponent(world, IsCentralMass, eid);
    }
  }
};
