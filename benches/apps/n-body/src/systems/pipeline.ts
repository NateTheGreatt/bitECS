import { World, moveBodies, setInitial, updateColor, updateGravity, updateTime } from '@sim/n-body';
import { syncThreeObjects } from './syncThreeObjects';
import { render } from './render';

export const pipeline = (world: World) => {
	updateTime(world);
	setInitial(world);
	updateGravity(world);
	moveBodies(world);
	updateColor(world);
	syncThreeObjects(world);
	render(world);
	return world;
};
