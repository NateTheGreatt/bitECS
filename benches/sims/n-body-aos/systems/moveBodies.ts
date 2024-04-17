import { defineSystem, query } from '@bitecs/classic';
import { Position } from '../components/Position';
import { CONSTANTS } from '../constants';
import { Velocity } from '../components/Velocity';

export const moveBodies = defineSystem((world) => {
	const eids = query(world, [Position, Velocity]);

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];

		// Update position based on velocity and the global SPEED factor
		Position[eid].x += CONSTANTS.SPEED * Velocity[eid].x;
		Position[eid].y += CONSTANTS.SPEED * Velocity[eid].y;
	}

	return world;
});
