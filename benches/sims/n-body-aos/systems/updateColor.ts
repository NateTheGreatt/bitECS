import { query } from '@bitecs/core';
import { Velocity } from '../components/Velocity';
import { Color } from '../components/Color';
import { colorFromSpeed } from '../utils/colorFromSpeed';
import { World } from '../world';

export const updateColor = (world: World) => {
	const eids = query(world, [Velocity, Color]);

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];
		const speed = Math.sqrt(Velocity[eid].x ** 2 + Velocity[eid].y ** 2);
		const { r, g, b, a } = colorFromSpeed(speed);

		Color[eid].r = r;
		Color[eid].g = g;
		Color[eid].b = b;
		Color[eid].a = a;
	}

	return world;
};
