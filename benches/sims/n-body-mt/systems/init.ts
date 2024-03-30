import { World } from '../world';
import { CONSTANTS } from '../constants';
import { addComponent, addEntity } from '@bitecs/classic';
import { Position, Velocity, Mass, Circle, Color, IsCentralMass } from '../components';

export const init = (world: World) => {
	for (let i = 0; i < CONSTANTS.NBODIES; i++) {
		const eid = addEntity(world);
		addComponent(world, Position, eid);
		addComponent(world, Velocity, eid);
		addComponent(world, Mass, eid);
		addComponent(world, Circle, eid);
		addComponent(world, Color, eid);

		if (i === 0) {
			// Make the first entity the central mass.
			addComponent(world, IsCentralMass, eid);
		}
	}
};
