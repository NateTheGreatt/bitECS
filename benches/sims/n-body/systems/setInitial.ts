import { CONSTANTS } from '../constants';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';
import { Mass } from '../components/Mass';
import { Circle } from '../components/Circle';
import { randInRange } from '../utils/randInRange';
import { defineEnterQueue, getStore, query } from '@bitecs/core';
import { IsCentralMass } from '../components/IsCentralMass';
import { World } from '../world';

const body = [Position, Velocity, Mass, Circle];
const enterBody = defineEnterQueue(body);
const enterCentralMass = defineEnterQueue([...body, IsCentralMass]);

export const setInitial = (world: World) => {
	const eids = query(world, enterBody);
	const centralMassIds = query(world, enterCentralMass);
	const position = getStore(world, Position);
	const velocity = getStore(world, Velocity);
	const mass = getStore(world, Mass);
	const circle = getStore(world, Circle);

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];

		// Random positions
		position.x[eid] = randInRange(-4000, 4000);
		position.y[eid] = randInRange(-100, 100);
		mass.value[eid] = CONSTANTS.BASE_MASS + randInRange(0, CONSTANTS.VAR_MASS);

		// Calculate velocity for a stable orbit, assuming a circular orbit logic
		if (position.x[eid] !== 0 || position.y[eid] !== 0) {
			const radius = Math.sqrt(position.x[eid] ** 2 + position.y[eid] ** 2);
			const normX = position.x[eid] / radius;
			const normY = position.y[eid] / radius;

			// Perpendicular vector for circular orbit
			const vecRotX = -normY;
			const vecRotY = normX;

			const v = Math.sqrt(CONSTANTS.INITIAL_C / radius / mass.value[eid] / CONSTANTS.SPEED);
			velocity.x[eid] = vecRotX * v;
			velocity.y[eid] = vecRotY * v;
		}

		// Set circle radius based on mass
		circle.radius[eid] =
			CONSTANTS.MAX_RADIUS * (mass.value[eid] / (CONSTANTS.BASE_MASS + CONSTANTS.VAR_MASS)) + 1;
	}

	// Set the central mass properties.
	for (let i = 0; i < centralMassIds.length; i++) {
		const eid = centralMassIds[i];

		position.x[eid] = 0;
		position.y[eid] = 0;

		velocity.x[eid] = 0;
		velocity.y[eid] = 0;

		mass.value[eid] = CONSTANTS.CENTRAL_MASS;

		circle.radius[eid] = CONSTANTS.MAX_RADIUS / 1.5;
	}
};
