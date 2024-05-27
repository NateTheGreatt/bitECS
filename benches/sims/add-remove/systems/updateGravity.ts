import { query } from '@bitecs/classic';
import { Velocity } from '../components/Velocity';
import { Mass } from '../components/Mass';
import { World } from '../world';
import { Position } from '../components/Position';
import { CONSTANTS } from '../constants';

export const updateGravity = (world: World) => {
	const eids = query(world, [Position, Mass, Velocity]);
	const { delta } = world.time;

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];

		// Apply gravity directly to the velocity
		Velocity.y[eid] += CONSTANTS.GRAVITY * delta;
	}
};
