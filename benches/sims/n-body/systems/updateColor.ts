import { getStore, query } from '@bitecs/classic';
import { Velocity } from '../components/Velocity';
import { Color } from '../components/Color';
import { colorFromSpeed } from '../utils/colorFromSpeed';
import { World } from '../world';

export const updateColor = (world: World) => {
	const eids = query(world, [Velocity, Color]);
	const color = getStore(world, Color);
	const velocity = getStore(world, Velocity);

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];
		const speed = Math.sqrt(velocity.x[eid] ** 2 + velocity.y[eid] ** 2);
		const { r, g, b, a } = colorFromSpeed(speed);

		color.r[eid] = r;
		color.g[eid] = g;
		color.b[eid] = b;
		color.a[eid] = a;
	}

	return world;
};
