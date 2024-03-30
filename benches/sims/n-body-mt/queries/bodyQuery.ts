import { defineQuery, enterQuery } from "@bitecs/classic";
import { Position, Velocity, Mass } from "../components";

export const bodyQuery = defineQuery([Position, Velocity, Mass]);
export const enterBodyQuery = enterQuery(bodyQuery);
