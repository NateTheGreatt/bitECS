import { CONSTANTS } from '../constants';
import { randInRange } from '../utils/randInRange';
import { defineEnterQueue, query } from '@bitecs/core';
import { Position, Mass, Velocity, Circle, IsCentralMass } from '../components';
import { World } from '../world';

const body = [Position, Velocity, Mass, Circle];
const enterBody = defineEnterQueue(body);
const enterCentralMass = defineEnterQueue([...body, IsCentralMass]);

export const setInitial = (world: World) => {
	const eids = query(world, enterBody);
	// We only allow there to be one central mass.
	const centralMassIds = query(world, enterCentralMass);

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];

		// Random positions
		Position.x[eid] = randInRange(-4000, 4000);
		Position.y[eid] = randInRange(-100, 100);
		Mass.value[eid] = CONSTANTS.BASE_MASS + randInRange(0, CONSTANTS.VAR_MASS);

		// Calculate velocity for a stable orbit, assuming a circular orbit logic
		if (Position.x[eid] !== 0 || Position.y[eid] !== 0) {
			const radius = Math.sqrt(Position.x[eid] ** 2 + Position.y[eid] ** 2);
			const normX = Position.x[eid] / radius;
			const normY = Position.y[eid] / radius;

			// Perpendicular vector for circular orbit
			const vecRotX = -normY;
			const vecRotY = normX;

			const v = Math.sqrt(CONSTANTS.INITIAL_C / radius / Mass.value[eid] / CONSTANTS.SPEED);
			Velocity.x[eid] = vecRotX * v;
			Velocity.y[eid] = vecRotY * v;
		}

		// Set circle radius based on mass
		Circle.radius[eid] =
			CONSTANTS.MAX_RADIUS * (Mass.value[eid] / (CONSTANTS.BASE_MASS + CONSTANTS.VAR_MASS)) + 1;
	}

	// Set the central mass properties.
	for (let i = 0; i < centralMassIds.length; i++) {
		const eid = centralMassIds[i];

		Position.x[eid] = 0;
		Position.y[eid] = 0;

		Velocity.x[eid] = 0;
		Velocity.y[eid] = 0;

		Mass.value[eid] = CONSTANTS.CENTRAL_MASS;

		Circle.radius[eid] = CONSTANTS.MAX_RADIUS / 1.5;
	}
};
