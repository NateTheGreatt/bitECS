import { defineQuery, defineSystem, enterQuery } from '@bitecs/classic';
import { Circle, Mass, Position, Velocity } from '@sim/n-body';
import * as THREE from 'three';
import { scene } from '../scene';
import { ThreeObject } from '../components/ThreeObject';

// This can't reuse the same enter query as n-body-sim because
// it would be read twice a frame and clear each time, leaving no results.
const bodyQuery = defineQuery([Position, Velocity, Mass, Circle]);
const enterBodyQuery = enterQuery(bodyQuery);

export const spawnThreeObjects = defineSystem((world) => {
	const eids = enterBodyQuery(world);

	if (eids.length) {
		const maxInstances = eids.length;

		const geometry = new THREE.SphereGeometry(Circle.radius[0], 12, 12);
		const material = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(1, 1, 1) });
		const instancedMesh = new THREE.InstancedMesh(geometry, material, maxInstances);

		scene.add(instancedMesh);

		ThreeObject[0] = instancedMesh;
	}
});
