import { getStore, query } from '@bitecs/core';
import { Circle, Color, Position, World } from '@sim/n-body-aos';
import { ThreeObject } from '../components/ThreeObject';
import * as THREE from 'three';

const normalize = (x: number, min: number, max: number) => (x - min) / (max - min);

const dummy = new THREE.Object3D();
const colorTmp = new THREE.Color();

export const syncThreeObjects = (world: World) => {
	const eids = query(world, [Position, Circle, Color]);
	const instancedMesh = getStore(world, ThreeObject)[0];
	const position = getStore(world, Position);
	const color = getStore(world, Color);
	const circle = getStore(world, Circle);

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];
		// dummy.position.set(position.x[eid], position.y[eid], 0);
		dummy.position.set(position[eid].x, position[eid].y, 0);

		// const radius = normalize(circle.radius[eid], 0, 60);
		const radius = normalize(circle[eid].radius, 0, 60);
		dummy.scale.set(radius, radius, radius);

		dummy.updateMatrix();

		instancedMesh.setMatrixAt(eid, dummy.matrix);

		// const r = normalize(color.r[eid], 0, 255);
		// const g = normalize(color.g[eid], 0, 255);
		// const b = normalize(color.b[eid], 0, 255);
		const r = normalize(color[eid].r, 0, 255);
		const g = normalize(color[eid].g, 0, 255);
		const b = normalize(color[eid].b, 0, 255);
		colorTmp.setRGB(r, g, b);
		instancedMesh.setColorAt(eid, colorTmp);
	}

	instancedMesh.instanceMatrix.needsUpdate = true;
	instancedMesh.instanceColor!.needsUpdate = true;
};
