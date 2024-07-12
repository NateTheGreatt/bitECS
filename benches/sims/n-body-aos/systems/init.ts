import { CONSTANTS } from '../constants';
import { addComponent, addEntity } from '@bitecs/classic';
import { IsCentralMass } from '../components/IsCentralMass';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';
import { Mass } from '../components/Mass';
import { Circle } from '../components/Circle';
import { Color } from '../components/Color';
import { World } from '../world';
import { Acceleration } from '../components/Acceleration';

export const init = (world: World) => {
	for (let i = 0; i < CONSTANTS.NBODIES; i++) {
		const eid = addEntity(world, Position, Velocity, Mass, Circle, Color, Acceleration);
		Position.push({ x: 0, y: 0 });
		Velocity.push({ x: 0, y: 0 });
		Mass.push({ value: 0 });
		Circle.push({ radius: 0 });
		Color.push({ r: 0, g: 0, b: 0, a: 0 });
		Acceleration.push({ x: 0, y: 0 });

		if (i === 0) {
			// Make the first entity the central mass.
			addComponent(world, eid, IsCentralMass);
		}
	}
};
