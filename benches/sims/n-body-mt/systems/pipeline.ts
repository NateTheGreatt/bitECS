import { setInitial } from './setInitial';
import { moveBodies } from './moveBodies';
import { updateColor } from './updateColor';
import { bodyQuery } from '../queries/bodyQuery';
import { Acceleration, Mass, Position, Velocity } from '../components';
import { updateGravityMain } from './updateGravity.main';
import { World } from '../world';
import { updateTime } from './time';

const updateGravity = updateGravityMain({
	queries: { bodyQuery },
	partitionQuery: bodyQuery,
	components: {
		read: { Position, Mass },
		write: { Velocity, Acceleration },
	},
});

export const pipeline = async (world: World) => {
	updateTime(world);
	setInitial(world);
	await updateGravity(world);
	moveBodies(world);
	updateColor(world);
};
