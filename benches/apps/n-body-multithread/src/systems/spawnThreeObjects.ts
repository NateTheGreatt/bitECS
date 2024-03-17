import { defineQuery, defineSystem, enterQuery } from '@bitecs/classic';
import { Circle, Mass, Position, Velocity } from '@sim/n-body-multithread';
import * as THREE from 'three';
import { scene } from '../scene';
import { ThreeObject } from '../components/ThreeObject';

// This can't reuse the same enter query as n-body-sim because
// it would be read twice a frame and clear each time, leaving no results.
const bodyQuery = defineQuery([Position, Velocity, Mass, Circle]);
const enterBodyQuery = enterQuery(bodyQuery);

const normalize = (x: number, min: number, max: number) => (x - min) / (max - min);

export const spawnThreeObjects = defineSystem((world) => {
    const eids = enterBodyQuery(world);

	if (eids.length) {
		const maxInstances = eids.length;
	
		const geometry = new THREE.SphereGeometry(Circle.radius[0], 12, 12);
		const material = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(1,1,1) });
		const instancedMesh = new THREE.InstancedMesh(geometry, material, maxInstances);
		const dummy = new THREE.Object3D();
	
		for (let i = 0; i < eids.length; i++) {
			const eid = eids[i];
	
			dummy.position.set(
				Position.x[eid],
				Position.y[eid],
				0,
			);

			const r = normalize(Circle.radius[eid], 0, 100)
			dummy.scale.set(r,r,r);

			dummy.updateMatrix();

			instancedMesh.setMatrixAt(eid, dummy.matrix);
	
		}
		instancedMesh.instanceMatrix.needsUpdate = true;
		instancedMesh.computeBoundingSphere();
		scene.add(instancedMesh);
		
		ThreeObject[0] = instancedMesh;
	}
});
