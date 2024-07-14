import { getStore, query, removeEntity } from '@bitecs/classic';
import { World } from '../world';
import { Position } from '../components/Position';
import { addBody } from './init';
import { CONSTANTS } from '../constants';
import { Circle } from '../components/Circle';
import { Mass } from '../components/Mass';
import { Velocity } from '../components/Velocity';
import { Color } from '../components/Color';
import { deleteData } from '../utils/deleteData';

let draining = true;

export const recycleBodies = (world: World) => {
	const eids = query(world, [Position, Circle, Mass, Velocity, Color]);
	const position = getStore(world, Position);

	if (eids.length === 0) draining = false;
	if (eids.length > CONSTANTS.BODIES * 0.95) draining = true;

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];

		if (position.y[eid] < CONSTANTS.FLOOR) {
			// Delete all data
			if (CONSTANTS.DELETE_DATA) deleteData(world, eid);

			// Remove entity
			removeEntity(world, eid);

			if (!CONSTANTS.DRAIN) addBody(world);
		}
	}

	if (!CONSTANTS.DRAIN) return world;

	const target = Math.min(
		Math.max(CONSTANTS.BODIES * 0.01, eids.length * 0.5),
		CONSTANTS.BODIES - eids.length
	);

	if (!draining) {
		for (let i = 0; i < target; i++) {
			addBody(world);
		}
	}

	return world;
};
