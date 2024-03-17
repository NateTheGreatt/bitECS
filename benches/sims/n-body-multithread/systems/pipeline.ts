import { setInitial } from "./setInitial";
import { moveBodies } from "./moveBodies";
import { updateColor } from "./updateColor";
import { bodyQuery } from "../queries/bodyQuery";
import { Acceleration, Mass, Position, Velocity } from "../components";
import { updateGravityMain } from "./updateGravity.main";
import { World } from "../world";

const updateGravity = updateGravityMain({
  queries: { bodyQuery },
  partitionQuery: bodyQuery,
  components: {
    // TODO: Fix types
    read: { Position, Mass },
    write: { Velocity, Acceleration }
  }
})

export const pipeline = async (world: World) => {
  setInitial(world)
  await updateGravity(world)
  moveBodies(world)
  updateColor(world)
}
