import { CONSTANTS, World, init as initSim } from '@sim/n-body';
import { ThreeObject } from '../components/ThreeObject';
import * as THREE from 'three';
import { scene } from '../scene';

export function init(world: World) {
	// I'm not sure why it matters, but you can't set iniitial radius to 1 or everything is invisible.
	const geometry = new THREE.CircleGeometry(CONSTANTS.MAX_RADIUS / 1.5, 12);
	const material = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(1, 1, 1) });
	const instancedMesh = new THREE.InstancedMesh(geometry, material, CONSTANTS.NBODIES);

	scene.add(instancedMesh);

	ThreeObject[0] = instancedMesh;

	initSim(world);
}
