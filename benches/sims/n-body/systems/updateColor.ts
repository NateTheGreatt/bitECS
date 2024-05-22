import { query } from '@bitecs/classic';
import { Velocity } from '../components/Velocity';
import { Color } from '../components/Color';
import { colorFromSpeed } from '../utils/colorFromSpeed';
import { World } from '../world';

export const updateColor = (world: World) => {
	const eids = query(world, [Velocity, Color]);

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];
		const speed = Math.sqrt(Velocity.x[eid] ** 2 + Velocity.y[eid] ** 2);
		const { r, g, b, a } = colorFromSpeed(speed);

		Color.r[eid] = r;
		Color.g[eid] = g;
		Color.b[eid] = b;
		Color.a[eid] = a;
	}

	return world;
};
