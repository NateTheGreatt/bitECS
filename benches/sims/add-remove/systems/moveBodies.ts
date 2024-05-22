import { query } from '@bitecs/classic';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';
import { World } from '../world';

export const moveBodies = (world: World) => {
	const { delta } = world.time;
	const eids = query(world, [Position, Velocity]);

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];

		// Update position based on velocity
		Position.x[eid] += Velocity.x[eid] * delta;
		Position.y[eid] += Velocity.y[eid] * delta;
	}

	return world;
};
