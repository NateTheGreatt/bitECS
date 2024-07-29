import { getStore } from '@bitecs/core';
import { Circle } from '../components/Circle';
import { Color } from '../components/Color';
import { Mass } from '../components/Mass';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';
import { World } from '../world';

export function deleteData(world: World, eid: number) {
	const position = getStore(world, Position);
	const velocity = getStore(world, Velocity);
	const circle = getStore(world, Circle);
	const mass = getStore(world, Mass);
	const color = getStore(world, Color);

	delete position.x[eid];
	delete position.y[eid];
	delete position.z[eid];
	delete circle.radius[eid];
	delete mass.value[eid];
	delete velocity.x[eid];
	delete velocity.y[eid];
	delete color.r[eid];
	delete color.g[eid];
	delete color.b[eid];
	delete color.a[eid];
}
