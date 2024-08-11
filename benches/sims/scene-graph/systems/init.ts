import { addComponent, addEntity } from '@bitecs/classic';
import { Scene } from '../components/Scene';
import { Transform, addTransform } from '../components/Transform';
import { World } from '../world';
import { ChildOf } from '../relations/ChildOf';
import { quat, vec3 } from 'gl-matrix';

export const init = (world: World) => {
	const scene = addEntity(world);
	addComponent(world, Scene, scene);
	addTransform(world, scene);

	const eid = addEntity(world);
	addTransform(world, eid, {
		translation: [10, 10, 10],
	});
	addComponent(world, ChildOf(scene), eid);

	const childEid = addEntity(world);
	addTransform(world, childEid, {
		rotation: quat.fromEuler(quat.create(), Math.PI / 4, 0, 0),
	});
	vec3.set(Transform.translation[childEid], 3, 3, 3);
	addComponent(world, ChildOf(eid), childEid);
};
