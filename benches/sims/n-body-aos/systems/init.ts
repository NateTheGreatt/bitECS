import { World } from "@bitecs/classic/dist/world/types";
import { CONSTANTS } from "../constants";
import { addComponent, addEntity } from "@bitecs/classic";
import { IsCentralMass } from "../components/IsCentralMass";
import { Position } from "../components/Position";
import { Velocity } from "../components/Velocity";
import { Mass } from "../components/Mass";
import { Circle } from "../components/Circle";
import { Color } from "../components/Color";

export const init = (world: World) => {
  for (let i = 0; i < CONSTANTS.NBODIES; i++) {
    const eid = addEntity(world);
    addComponent(world, Position, eid);
    Position.push({x: 0, y: 0})
    addComponent(world, Velocity, eid);
    Velocity.push({x: 0, y: 0})
    addComponent(world, Mass, eid);
    Mass.push({value: 0})
    addComponent(world, Circle, eid);
    Circle.push({radius: 0})
    addComponent(world, Color, eid);
    Color.push({r: 0, g: 0, b: 0, a: 0})

    if (i === 0) {
      // Make the first entity the central mass.
      addComponent(world, IsCentralMass, eid);
    }
  }
};
