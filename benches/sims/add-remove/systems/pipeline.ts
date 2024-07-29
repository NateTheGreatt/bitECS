import { setInitial } from './setInitial';
import { updateGravity } from './updateGravity';
import { moveBodies } from './moveBodies';
import { updateTime } from './updateTime';
import { World } from '../world';
import { recycleBodies } from './recycleBodies';
import { flushRemovedEntities } from '@bitecs/core';

export const pipeline = (world: World) => {
	updateTime(world);
	setInitial(world);
	updateGravity(world);
	moveBodies(world);
	recycleBodies(world);
	flushRemovedEntities(world);
	return world;
};
