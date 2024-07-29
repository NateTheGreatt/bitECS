import { query } from '@bitecs/core';
import { Position } from '../components/Position';
import { CONSTANTS } from '../constants';
import { Velocity } from '../components/Velocity';
import { World } from '../world';

export const moveBodies = (world: World) => {
	const eids = query(world, [Position, Velocity]);

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];

		// Update position based on velocity and the global SPEED factor
		Position[eid].x += CONSTANTS.SPEED * Velocity[eid].x;
		Position[eid].y += CONSTANTS.SPEED * Velocity[eid].y;
	}

	return world;
};
