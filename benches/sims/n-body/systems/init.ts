import { World } from '@bitecs/core';
import { CONSTANTS } from '../constants';
import { addComponent, addEntity } from '@bitecs/core';
import { IsCentralMass } from '../components/IsCentralMass';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';
import { Mass } from '../components/Mass';
import { Circle } from '../components/Circle';
import { Color } from '../components/Color';
import { Acceleration } from '../components/Acceleration';

export const init = (world: World) => {
	for (let i = 0; i < CONSTANTS.NBODIES; i++) {
		const eid = addEntity(world, Position, Velocity, Mass, Circle, Color, Acceleration);

		if (i === 0) {
			// Make the first entity the central mass.
			addComponent(world, eid, IsCentralMass);
		}
	}
};
