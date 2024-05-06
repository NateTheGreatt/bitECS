import { defineSystem, query } from '@bitecs/classic';
import { Velocity } from '../components/Velocity';
import { Color } from '../components/Color';
import { colorFromSpeed } from '../utils/colorFromSpeed';

export const updateColor = defineSystem((world) => {
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
});
