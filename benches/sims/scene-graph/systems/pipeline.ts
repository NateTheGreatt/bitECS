import { World } from '@bitecs/classic';
import { updateTransformMatrices } from './updateTransformMatrices';

export const pipeline = (world: World) => {
	updateTransformMatrices(world);
	return world;
};
