import { defineSystem } from '@bitecs/classic';
import { Color, Position, bodyQuery } from '@sim/n-body-multithread';
import { ThreeObject } from '../components/ThreeObject';
import * as THREE from 'three'

const normalize = (x: number, min: number, max: number) => (x - min) / (max - min);

export const syncThreeObjects = defineSystem((world) => {
	const eids = bodyQuery(world);
	const instancedMesh = ThreeObject[0]
	const matrix = new THREE.Matrix4();
	const color = new THREE.Color();

    for (let i = 0; i < eids.length; i++) {
        const eid = eids[i];
        matrix.setPosition(Position.x[eid], Position.y[eid], 0);
        instancedMesh.setMatrixAt(eid, matrix);

		const r = normalize(Color.r[eid], 0, 255);
		const g = normalize(Color.g[eid], 0, 255);
		const b = normalize(Color.b[eid], 0, 255);
		color.setRGB(r,g,b)
		instancedMesh.setColorAt(eid, color)
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.instanceColor!.needsUpdate = true;
});
