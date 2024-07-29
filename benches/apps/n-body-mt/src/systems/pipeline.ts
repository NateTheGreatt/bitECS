import {
	Acceleration,
	Mass,
	Position,
	Velocity,
	World,
	moveBodies,
	setInitial,
	updateColor,
	updateGravityMain,
	updateTime,
} from '@sim/n-body-mt';
import { render } from './render';
import { syncThreeObjects } from './syncThreeObjects';
import { defineQuery } from '@bitecs/core';

const bodyQuery = defineQuery([Position, Mass, Velocity, Acceleration]);

const updateGravity = updateGravityMain({
	queries: { bodyQuery },
	partitionQuery: bodyQuery,
	components: {
		read: { Position, Mass },
		write: { Velocity, Acceleration },
	},
});

export const pipeline = async (world: World) => {
	setInitial(world);
	await updateGravity.init(world);
	updateTime(world);
	await updateGravity.main(world);
	moveBodies(world);
	updateColor(world);
	syncThreeObjects(world);
	render(world);
	return world;
};
