import { defineQuery } from '@bitecs/classic';
import { Acceleration, Mass, Position, Velocity } from '../components';
import { World } from '../world';
import { moveBodies } from './moveBodies';
import { setInitial } from './setInitial';
import { updateColor } from './updateColor';
import { updateGravityMain } from './updateGravity.main';
import { updateTime } from './updateTime';

const bodyQuery = defineQuery([Position, Mass]);

const updateGravity = updateGravityMain({
	queries: { bodyQuery },
	partitionQuery: bodyQuery,
	components: {
		read: { Position, Mass },
		write: { Velocity, Acceleration },
	},
});

export const pipeline = async (world: World) => {
	await updateGravity.init(world);
	setInitial(world);
	updateTime(world);
	await updateGravity.main(world);
	moveBodies(world);
	updateColor(world);
};
