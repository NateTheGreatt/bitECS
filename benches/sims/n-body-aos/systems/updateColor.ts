import { defineSystem } from "@bitecs/classic";
import { bodyQuery } from "../queries/queries";
import { Velocity } from "../components/Velocity";
import { Color } from "../components/Color";
import { colorFromSpeed } from "../utils/colorFromSpeed";

export const updateColor = defineSystem((world) => {
  const eids = bodyQuery(world);

  for (let i = 0; i < eids.length; i++) {
    const eid = eids[i];
    const speed = Math.sqrt(Velocity[eid].x ** 2 + Velocity[eid].y ** 2);
    const { r, g, b, a } = colorFromSpeed(speed);

    Color[eid].r = r;
    Color[eid].g = g;
    Color[eid].b = b;
    Color[eid].a = a;
  }

  return world;
});
