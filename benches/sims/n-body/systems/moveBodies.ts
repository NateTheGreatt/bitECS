import { getStore, query } from '@bitecs/core';
import { Position } from '../components/Position';
import { CONSTANTS } from '../constants';
import { Velocity } from '../components/Velocity';
import { World } from '../world';

export const moveBodies = (world: World) => {
	const { delta } = world.time;
	const eids = query(world, [Position, Velocity]);
	const position = getStore(world, Position);
	const velocity = getStore(world, Velocity);

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];

		// Update position based on velocity and the global SPEED factor
		position.x[eid] += CONSTANTS.SPEED * velocity.x[eid] * delta;
		position.y[eid] += CONSTANTS.SPEED * velocity.y[eid] * delta;
	}

	return world;
};
