import { pipe } from "@bitecs/classic";
import { setInitial } from "./setInitial";
import { updateGravity } from "./updateGravity";
import { moveBodies } from "./moveBodies";
import { updateColor } from "./updateColor";

export const pipeline = pipe(
  setInitial,
  updateGravity,
  moveBodies,
  updateColor
);
