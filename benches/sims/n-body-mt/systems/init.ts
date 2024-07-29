import { World } from '../world';
import { CONSTANTS } from '../constants';
import { addComponent, addEntity } from '@bitecs/core';
import { Position, Velocity, Mass, Circle, Color, IsCentralMass, Acceleration } from '../components';

export const init = (world: World) => {
	for (let i = 0; i < CONSTANTS.NBODIES; i++) {
		const eid = addEntity(world, Position, Velocity, Mass, Circle, Color, Acceleration);

		if (i === 0) {
			// Make the first entity the central mass.
			addComponent(world, eid, IsCentralMass);
		}
	}
};
