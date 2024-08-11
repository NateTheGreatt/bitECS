import { mat4, quat, vec3 } from 'gl-matrix';
import { World } from '../world';
import { addComponent } from '@bitecs/classic';

type TransformConfig = {
	translation?: vec3;
	rotation?: quat;
	scale?: vec3;
};

export const Transform = {
	translation: [] as vec3[],
	rotation: [] as quat[],
	scale: [] as vec3[],
	localMatrix: [] as mat4[],
	worldMatrix: [] as mat4[],
};

export const addTransform = (world: World, eid: number, config?: TransformConfig) => {
	addComponent(world, Transform, eid);
	Transform.translation[eid] = config?.translation || vec3.create();
	Transform.rotation[eid] = config?.rotation || quat.identity(quat.create());
	Transform.scale[eid] = config?.scale || vec3.fromValues(1, 1, 1);
	Transform.localMatrix[eid] = mat4.create();
	Transform.worldMatrix[eid] = mat4.create();
};

export const updateLocalMatrix = (eid: number) => {
	const t = mat4.fromTranslation(mat4.create(), Transform.translation[eid]);
	const r = mat4.fromQuat(mat4.create(), Transform.rotation[eid]);
	const s = mat4.fromScaling(mat4.create(), Transform.scale[eid]);
	mat4.multiply(Transform.localMatrix[eid], t, r);
	mat4.multiply(Transform.localMatrix[eid], Transform.localMatrix[eid], s);
};

export const updateWorldMatrix = (eid: number, parentEid?: number) => {
	if (parentEid) {
		mat4.multiply(
			Transform.worldMatrix[eid],
			Transform.localMatrix[eid],
			Transform.worldMatrix[parentEid]
		);
	} else {
		mat4.copy(Transform.worldMatrix[eid], Transform.localMatrix[eid]);
	}
};
