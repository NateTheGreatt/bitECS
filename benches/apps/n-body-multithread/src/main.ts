import './styles.css';
import * as THREE from 'three';
import {
	// CONSTANTS,
	bodyQuery,
	init,
	moveBodies,
	setInitial,
	updateColor,
	updateGravityMain,
	world,
	Position,
	Mass,
	Velocity,
	Acceleration,
	CONSTANTS,
} from '@sim/n-body-multithread';
import { initStats } from '@app/bench-tools';
import { scene } from './scene';
import { spawnThreeObjects } from './systems/spawnThreeObjects';
import { syncPosition } from './systems/syncPosition';
import { syncColor } from './systems/syncColor';
import { World } from '@sim/n-body-multithread/world';
import { updateTime } from '@sim/n-body-multithread/systems/time';

// Configure the simulation
// CONSTANTS.NBODIES = 2000;

// Renderer
const renderer = new THREE.WebGLRenderer({
	antialias: true,
	powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Camera
const frustumSize = 8000;
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

const updateGravity = updateGravityMain({
	queries: { bodyQuery },
	partitionQuery: bodyQuery,
	components: {
		// TODO: Fix types
		read: { Position, Mass },
		write: { Velocity, Acceleration },
	},
});

const pipeline = async (world: World) => {
	updateTime(world);
	setInitial(world);
	spawnThreeObjects(world);
	await updateGravity(world);
	moveBodies(world);
	updateColor(world);
	syncPosition(world);
	syncColor(world);
};

const { updateStats, measure } = initStats({
	Bodies: () => CONSTANTS.NBODIES,
	Threads: () => window.navigator.hardwareConcurrency,
});

// Run the simulation
const main = async () => {
	await measure(async () => {
		await pipeline(world);
		renderer.render(scene, camera);
		updateStats();
	});
	requestAnimationFrame(main);
};

// Initialize all entities
init(world);

main();
