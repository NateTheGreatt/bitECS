import { CONSTANTS } from '../constants';
import { addComponent, addEntity, getStore } from '@bitecs/core';
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

		// Position.push({ x: 0, y: 0 });
		// Velocity.push({ x: 0, y: 0 });
		// Mass.push({ value: 0 });
		// Circle.push({ radius: 0 });
		// Color.push({ r: 0, g: 0, b: 0, a: 0 });
		// Acceleration.push({ x: 0, y: 0 });

		const positions = getStore(world, Position);
		positions.push({ x: 0, y: 0 });

		const velocities = getStore(world, Velocity);
		velocities.push({ x: 0, y: 0 });

		const masses = getStore(world, Mass);
		masses.push({ value: 0 });

		const circles = getStore(world, Circle);
		circles.push({ radius: 0 });

		const colors = getStore(world, Color);
		colors.push({ r: 0, g: 0, b: 0, a: 0 });

		const accelerations = getStore(world, Acceleration);
		accelerations.push({ x: 0, y: 0 });

		if (i === 0) {
			// Make the first entity the central mass.
			addComponent(world, eid, IsCentralMass);
		}
	}
};
