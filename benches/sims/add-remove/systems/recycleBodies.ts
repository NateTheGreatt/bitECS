import { query, removeEntity } from '@bitecs/classic';
import { World } from '../world';
import { Position } from '../components/Position';
import { addBody } from './init';
import { CONSTANTS } from '../constants';

export const recycleBodies = (world: World) => {
	const eids = query(world, [Position]);

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];

		if (Position.y[eid] < CONSTANTS.FLOOR) {
			removeEntity(world, eid);
			addBody(world);
		}
	}

	return world;
};
