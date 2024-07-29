import { getStore, query } from '@bitecs/core';
import { Velocity } from '../components/Velocity';
import { Mass } from '../components/Mass';
import { World } from '../world';
import { Acceleration } from '../components/Acceleration';
import { Position } from '../components/Position';
import { CONSTANTS } from '../constants';

export const updateGravity = (world: World) => {
	const eids = query(world, [Position, Mass, Velocity]);
	const { delta } = world.time;
	const position = getStore(world, Position);
	const velocity = getStore(world, Velocity);
	const mass = getStore(world, Mass);
	const acceleration = getStore(world, Acceleration);

	for (let j = 0; j < eids.length; j++) {
		const meId = eids[j];
		acceleration.x[meId] = 0;
		acceleration.y[meId] = 0;

		for (let i = 0; i < eids.length; i++) {
			const currentId = eids[i];
			if (meId === currentId) continue; // Skip self

			const dx = +position.x[currentId] - +position.x[meId];
			const dy = +position.y[currentId] - +position.y[meId];
			let distanceSquared = dx * dx + dy * dy;

			if (distanceSquared < CONSTANTS.STICKY) distanceSquared = CONSTANTS.STICKY; // Apply stickiness

			const distance = Math.sqrt(distanceSquared);
			const forceMagnitude = (+mass.value[meId] * +mass.value[currentId]) / distanceSquared;

			acceleration.x[meId] += (dx / distance) * forceMagnitude;
			acceleration.y[meId] += (dy / distance) * forceMagnitude;
		}

		// Apply computed force to entity's velocity, adjusting for its mass
		velocity.x[meId] += (acceleration.x[meId] * delta) / mass.value[meId];
		velocity.y[meId] += (acceleration.y[meId] * delta) / mass.value[meId];
	}
};
