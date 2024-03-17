import { defineSystem } from '@bitecs/classic';
import { Position, bodyQuery } from '@sim/n-body-multithread';
import { ThreeObject } from '../components/ThreeObject';

export const syncPosition = defineSystem((world) => {
	const eids = bodyQuery(world);

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];
		const sphere = ThreeObject[eid];

		sphere.position.x = Position.x[eid];
		sphere.position.y = Position.y[eid];
	}
});
