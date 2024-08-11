import { World, query } from '@bitecs/classic';
import { Transform, updateLocalMatrix, updateWorldMatrix } from '../components/Transform';
import { ChildOf } from '../relations/ChildOf';
import { Scene } from '../components/Scene';

export const updateTransformMatrices = (world: World) => {
	const traverse = (eid: number, parentEid?: number) => {
		updateLocalMatrix(eid);
		updateWorldMatrix(eid, parentEid);

		for (const childEid of query(world, [Transform, ChildOf(eid)])) {
			traverse(childEid, eid);
		}
	};

	for (const sceneEid of query(world, [Transform, Scene])) {
		traverse(sceneEid);
	}
};
