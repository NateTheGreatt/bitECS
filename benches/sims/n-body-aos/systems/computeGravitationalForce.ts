import { Position } from '../components/Position';
import { Mass } from '../components/Mass';
import { CONSTANTS } from '../constants';
import { World } from '../world';
import { query } from '@bitecs/classic';

export function computeGravitationalForce(
	world: World,
	meId: number
): { forceX: number; forceY: number } {
	const eids = query(world, [Position, Mass]);
	let forceX = 0;
	let forceY = 0;

	for (let i = 0; i < eids.length; i++) {
		const currentId = eids[i];
		if (meId === currentId) continue; // Skip self

		const dx = Position[currentId].x - Position[meId].x;
		const dy = Position[currentId].y - Position[meId].y;
		let distanceSquared = dx * dx + dy * dy;

		if (distanceSquared < CONSTANTS.STICKY) distanceSquared = CONSTANTS.STICKY; // Apply stickiness

		const distance = Math.sqrt(distanceSquared);
		const forceMagnitude = (Mass[meId].value * Mass[currentId].value) / distanceSquared;

		forceX += (dx / distance) * forceMagnitude;
		forceY += (dy / distance) * forceMagnitude;
	}

	return { forceX, forceY };
}
