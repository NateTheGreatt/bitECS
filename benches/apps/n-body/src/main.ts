import './styles.css';
import * as THREE from 'three';
import {
	CONSTANTS,
	init,
	moveBodies,
	setInitial,
	updateColor,
	updateGravity,
	world,
} from '@sim/n-body';
import { measure } from 'bench-tools';
import { scene } from './scene';
import { pipe } from '@bitecs/classic';
import { spawnThreeObjects } from './systems/spawnThreeObjects';
import { syncPosition } from './systems/syncPosition';
import { syncColor } from './systems/syncColor';

// Renderer
const renderer = new THREE.WebGLRenderer({
	antialias: true,
	powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Camera
const frustumSize = 10000;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
	(-frustumSize * aspect) / 2,
	(frustumSize * aspect) / 2,
	frustumSize / 2,
	-frustumSize / 2,
	0.1,
	500
);

function onWindowResize() {
	const aspect = window.innerWidth / window.innerHeight;

	camera.left = (-frustumSize * aspect) / 2;
	camera.right = (frustumSize * aspect) / 2;
	camera.top = frustumSize / 2;
	camera.bottom = -frustumSize / 2;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

// Camera position
camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);

// Configure the simulation
CONSTANTS.NBODIES = 100;

const pipeline = pipe(
	setInitial,
	spawnThreeObjects,
	updateGravity,
	moveBodies,
	updateColor,
	syncPosition,
	syncColor
);

// Run the simulation
const main = () => {
	measure(() => pipeline(world));
	renderer.render(scene, camera);
	requestAnimationFrame(main);
};

// Initialize all entities
init(world);

requestAnimationFrame(main);
