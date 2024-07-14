import { setInitial } from './setInitial';
import { updateGravity } from './updateGravity';
import { moveBodies } from './moveBodies';
import { updateColor } from './updateColor';
import { updateTime } from './updateTime';
import { World } from '../world';

export const pipeline = (world: World) => {
	updateTime(world);
	setInitial(world);
	updateGravity(world);
	moveBodies(world);
	updateColor(world);
	// No need for this bench as we're not removing entities
	// flushRemovedEntities(world)
	return world;
};
