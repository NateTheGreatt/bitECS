import { query } from '@bitecs/classic';
import { Circle, Color, Position, World } from '@sim/n-body-mt';
import { ThreeObject } from '../components/ThreeObject';
import * as THREE from 'three';

const normalize = (x: number, min: number, max: number) => (x - min) / (max - min);

const dummy = new THREE.Object3D();
const color = new THREE.Color();

export const syncThreeObjects = (world: World) => {
	const eids = query(world, [Position, Circle, Color]);
	const instancedMesh = ThreeObject[0];

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];
		dummy.position.set(Position.x[eid], Position.y[eid], 0);

		const radius = normalize(Circle.radius[eid], 0, 60);
		dummy.scale.set(radius, radius, radius);

		dummy.updateMatrix();

		instancedMesh.setMatrixAt(eid, dummy.matrix);

		const r = normalize(Color.r[eid], 0, 255);
		const g = normalize(Color.g[eid], 0, 255);
		const b = normalize(Color.b[eid], 0, 255);
		color.setRGB(r, g, b);
		instancedMesh.setColorAt(eid, color);
	}

	instancedMesh.instanceMatrix.needsUpdate = true;
	instancedMesh.instanceColor!.needsUpdate = true;
};
