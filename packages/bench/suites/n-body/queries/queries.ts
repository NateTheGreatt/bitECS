import { defineQuery, enterQuery } from "@bitecs/classic";
import { Position } from "../components/Position";
import { Velocity } from "../components/Velocity";
import { Mass } from "../components/Mass";
import { IsCentralMass } from "../components/CentralMass";

export const bodyQuery = defineQuery([Position, Velocity, Mass]);
export const centralMassQuery = defineQuery([
  Mass,
  Position,
  Velocity,
  IsCentralMass,
]);
export const enterBodyQuery = enterQuery(bodyQuery);
