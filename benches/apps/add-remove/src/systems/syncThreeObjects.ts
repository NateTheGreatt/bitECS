import { query } from '@bitecs/classic';
import { Circle, Color, Position, World } from '@sim/add-remove';
import { ThreeObject } from '../components/ThreeObject';

const normalize = (x: number, min: number, max: number) => (x - min) / (max - min);

export const syncThreeObjects = (world: World) => {
	const eids = query(world, [Position, Circle, Color]);
	const particles = ThreeObject[0];
	const positions = particles.geometry.attributes.position.array;
	const colors = particles.geometry.attributes.color.array;
	const sizes = particles.geometry.attributes.size.array;

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];

		// Update positions
		positions[eid * 3] = Position.x[eid];
		positions[eid * 3 + 1] = Position.y[eid];
		positions[eid * 3 + 2] = Position.z[eid];

		// Update sizes
		sizes[eid] = Circle.radius[eid] * 0.3;

		// Update colors
		const r = normalize(Color.r[eid], 0, 255);
		const g = normalize(Color.g[eid], 0, 255);
		const b = normalize(Color.b[eid], 0, 255);
		colors[eid * 3] = r;
		colors[eid * 3 + 1] = g;
		colors[eid * 3 + 2] = b;
	}

	particles.geometry.attributes.position.needsUpdate = true;
	particles.geometry.attributes.color.needsUpdate = true;
	particles.geometry.attributes.size.needsUpdate = true;
};
