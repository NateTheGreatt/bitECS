import { CONSTANTS } from '../constants';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';
import { Mass } from '../components/Mass';
import { Circle } from '../components/Circle';
import { randInRange } from '../utils/randInRange';
import { defineEnterQueue, defineSystem, query } from '@bitecs/classic';
import { IsCentralMass } from '../components/IsCentralMass';

const body = [Position, Velocity, Mass, Circle];
const enterBody = defineEnterQueue(body);
const enterCentralMass = defineEnterQueue([...body, IsCentralMass]);

export const setInitial = defineSystem((world) => {
	const eids = query(world, enterBody);
	// We only allow there to be one central mass.
	const centralMassIds = query(world, enterCentralMass);

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];

		// Random positions
		Position[eid].x = randInRange(-4000, 4000);
		Position[eid].y = randInRange(-100, 100);
		Mass[eid].value = CONSTANTS.BASE_MASS + randInRange(0, CONSTANTS.VAR_MASS);

		// Calculate velocity for a stable orbit, assuming a circular orbit logic
		if (Position[eid].x !== 0 || Position[eid].y !== 0) {
			const radius = Math.sqrt(Position[eid].x ** 2 + Position[eid].y ** 2);
			const normX = Position[eid].x / radius;
			const normY = Position[eid].y / radius;

			// Perpendicular vector for circular orbit
			const vecRotX = -normY;
			const vecRotY = normX;

			const v = Math.sqrt(CONSTANTS.INITIAL_C / radius / Mass[eid].value / CONSTANTS.SPEED);
			Velocity[eid].x = vecRotX * v;
			Velocity[eid].y = vecRotY * v;
		}

		// Set circle radius based on mass
		Circle[eid].radius =
			CONSTANTS.MAX_RADIUS * (Mass[eid].value / (CONSTANTS.BASE_MASS + CONSTANTS.VAR_MASS)) + 1;
	}

	// Set the central mass properties.
	for (let i = 0; i < centralMassIds.length; i++) {
		const eid = centralMassIds[i];

		Position[eid].x = 0;
		Position[eid].y = 0;

		Velocity[eid].x = 0;
		Velocity[eid].y = 0;

		Mass[eid].value = CONSTANTS.CENTRAL_MASS;

		Circle[eid].radius = CONSTANTS.MAX_RADIUS / 1.5;
	}
});
