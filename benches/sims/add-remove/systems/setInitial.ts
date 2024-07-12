import { CONSTANTS } from '../constants';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';
import { Mass } from '../components/Mass';
import { Circle } from '../components/Circle';
import { addComponent, defineEnterQueue, getEntityComponents, query } from '@bitecs/classic';
import { randInRange } from '../utils/randInRange';
import { Color } from '../components/Color';
import { DummyComponents } from '../components/Dummy';
import { World } from '../world';

const body = [Position, Velocity, Mass, Circle];
const enterBody = defineEnterQueue(body);

export const setInitial = (world: World) => {
	const eids = query(world, enterBody);

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];

		// Random positions
		Position.x[eid] = randInRange(-400, 400);
		Position.y[eid] = 100;
		// Jitter the z position to avoid z-fighting
		Position.z[eid] = randInRange(-50, 50);

		// Shoot the bodies up at random angles and velocities
		const angle = randInRange(0, Math.PI * 2);
		const speed = randInRange(0, 50);
		Velocity.x[eid] = Math.cos(angle) * speed;
		Velocity.y[eid] = Math.sin(angle) * speed;

		// Add a random number of components to the body
		const numComponents = Math.floor(Math.random() * CONSTANTS.MAX_COMPS_PER_ENTITY);
		for (let j = 0; j < numComponents; j++) {
			addComponent(
				world,
				eid,
				DummyComponents[Math.floor(Math.random() * DummyComponents.length)]
			);
		}

		// Set mass and radius based on the number of components
		Mass.value[eid] = getEntityComponents(world, eid).length;
		Circle.radius[eid] = Mass.value[eid];

		// Random colors
		Color.r[eid] = randInRange(0, 255);
		Color.g[eid] = randInRange(0, 255);
		Color.b[eid] = randInRange(0, 255);
	}
};
