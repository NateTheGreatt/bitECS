import { getStore, query } from '@bitecs/core';
import { Velocity } from '../components/Velocity';
import { Mass } from '../components/Mass';
import { World } from '../world';
import { Acceleration } from '../components/Acceleration';
import { Position } from '../components/Position';
import { CONSTANTS } from '../constants';

export const updateGravity = (world: World) => {
	const eids = query(world, [Position, Mass, Velocity]);
	const accelerations = getStore(world, Acceleration);
	const positions = getStore(world, Position);
	const masses = getStore(world, Mass);
	const velocities = getStore(world, Velocity);

	for (let j = 0; j < eids.length; j++) {
		const meId = eids[j];
		// Acceleration[meId].x = 0;
		// Acceleration[meId].y = 0;

		accelerations[meId].x = 0;
		accelerations[meId].y = 0;

		for (let i = 0; i < eids.length; i++) {
			const currentId = eids[i];
			if (meId === currentId) continue; // Skip self

			// const dx = +Position[currentId].x - +Position[meId].x;
			// const dy = +Position[currentId].y - +Position[meId].y;
			const dx = positions[currentId].x - positions[meId].x;
			const dy = positions[currentId].y - positions[meId].y;
			let distanceSquared = dx * dx + dy * dy;

			if (distanceSquared < CONSTANTS.STICKY) distanceSquared = CONSTANTS.STICKY; // Apply stickiness

			const distance = Math.sqrt(distanceSquared);
			// const forceMagnitude = (+Mass[meId].value * +Mass[currentId].value) / distanceSquared;
			const forceMagnitude = (masses[meId].value * masses[currentId].value) / distanceSquared;

			// Acceleration[meId].x += (dx / distance) * forceMagnitude;
			// Acceleration[meId].y += (dy / distance) * forceMagnitude;
			accelerations[meId].x += (dx / distance) * forceMagnitude;
			accelerations[meId].y += (dy / distance) * forceMagnitude;
		}

		// Apply computed force to entity's velocity, adjusting for its mass
		// Velocity[meId].x += (Acceleration[meId].x * world.time.delta) / Mass[meId].value;
		// Velocity[meId].y += (Acceleration[meId].y * world.time.delta) / Mass[meId].value;
		velocities[meId].x += (accelerations[meId].x * world.time.delta) / masses[meId].value;
		velocities[meId].y += (accelerations[meId].y * world.time.delta) / masses[meId].value;
	}
};
