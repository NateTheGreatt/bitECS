import { defineQuery, defineSystem, enterQuery } from '@bitecs/classic';
import { Circle, Mass, Position, Velocity } from '@sim/n-body-multithread';
import * as THREE from 'three';
import { scene } from '../scene';
import { ThreeObject } from '../components/ThreeObject';

// This can't reuse the same enter query as n-body-sim because
// it would be read twice a frame and clear each time, leaving no results.
const bodyQuery = defineQuery([Position, Velocity, Mass, Circle]);
const enterBodyQuery = enterQuery(bodyQuery);

export const spawnThreeObjects = defineSystem((world) => {
	const eids = enterBodyQuery(world);

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];

		const geometry = new THREE.SphereGeometry(Circle.radius[eid], 32, 32);
		const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
		const sphere = new THREE.Mesh(geometry, material);
		scene.add(sphere);

		ThreeObject[eid] = sphere;
	}
});
