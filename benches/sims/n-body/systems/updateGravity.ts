import { defineSystem } from '@bitecs/classic';
import { bodyQuery } from '../queries/queries';
import { Velocity } from '../components/Velocity';
import { Mass } from '../components/Mass';
import { World } from '../world';
import { Acceleration } from '../components/Acceleration';
import { Position } from '../components/Position';
import { CONSTANTS } from '../constants';

export const updateGravity = defineSystem((world: World) => {
	const eids = bodyQuery(world);
	const { delta } = world.time;

	for (let j = 0; j < eids.length; j++) {
		const meId = eids[j];
		Acceleration.x[meId] = 0;
		Acceleration.y[meId] = 0;

		for (let i = 0; i < eids.length; i++) {
			const currentId = eids[i];
			if (meId === currentId) continue; // Skip self

			const dx = +Position.x[currentId] - +Position.x[meId];
			const dy = +Position.y[currentId] - +Position.y[meId];
			let distanceSquared = dx * dx + dy * dy;

			if (distanceSquared < CONSTANTS.STICKY) distanceSquared = CONSTANTS.STICKY; // Apply stickiness

			const distance = Math.sqrt(distanceSquared);
			const forceMagnitude = (+Mass.value[meId] * +Mass.value[currentId]) / distanceSquared;

			Acceleration.x[meId] += (dx / distance) * forceMagnitude;
			Acceleration.y[meId] += (dy / distance) * forceMagnitude;
		}

		// Apply computed force to entity's velocity, adjusting for its mass
		Velocity.x[meId] += (Acceleration.x[meId] * delta) / Mass.value[meId];
		Velocity.y[meId] += (Acceleration.y[meId] * delta) / Mass.value[meId];
	}
});
