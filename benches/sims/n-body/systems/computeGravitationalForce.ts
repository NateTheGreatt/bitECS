import { Position } from "../components/Position";
import { Mass } from "../components/Mass";
import { World } from "@bitecs/classic/dist/world/types";
import { CONSTANTS } from "../constants";
import { bodyQuery } from "../queries/queries";

export function computeGravitationalForce(
  world: World,
  meId: number
): { forceX: number; forceY: number } {
  const eids = bodyQuery(world);
  let forceX = 0;
  let forceY = 0;

  for (let i = 0; i < eids.length; i++) {
    const currentId = eids[i];
    if (meId === currentId) continue; // Skip self

    const dx = Position.x[currentId] - Position.x[meId];
    const dy = Position.y[currentId] - Position.y[meId];
    let distanceSquared = dx * dx + dy * dy;

    if (distanceSquared < CONSTANTS.STICKY) distanceSquared = CONSTANTS.STICKY; // Apply stickiness

    const distance = Math.sqrt(distanceSquared);
    const forceMagnitude =
      (Mass.value[meId] * Mass.value[currentId]) / distanceSquared;

    forceX += (dx / distance) * forceMagnitude;
    forceY += (dy / distance) * forceMagnitude;
  }

  return { forceX, forceY };
}
