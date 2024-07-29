import { getStore, query } from '@bitecs/core';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';
import { World } from '../world';

export const moveBodies = (world: World) => {
	const { delta } = world.time;
	const eids = query(world, [Position, Velocity]);
	const position = getStore(world, Position);
	const velocity = getStore(world, Velocity);

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];

		// Update position based on velocity
		position.x[eid] += velocity.x[eid] * delta;
		position.y[eid] += velocity.y[eid] * delta;
	}

	return world;
};
