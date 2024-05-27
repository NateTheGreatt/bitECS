import { query } from '@bitecs/classic';
import { Position, Velocity } from '../components';
import { CONSTANTS } from '../constants';
import { World } from '../world';

export const moveBodies = (world: World) => {
	const { delta } = world.time;
	const eids = query(world, [Position, Velocity]);

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];

		// Update position based on velocity and the global SPEED factor
		Position.x[eid] += CONSTANTS.SPEED * Velocity.x[eid] * delta;
		Position.y[eid] += CONSTANTS.SPEED * Velocity.y[eid] * delta;
	}

	return world;
};
