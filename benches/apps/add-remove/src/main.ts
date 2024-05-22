import './styles.css';
import * as THREE from 'three';
import {
	CONSTANTS,
	World,
	moveBodies,
	recycleBodies,
	setInitial,
	updateGravity,
	updateTime,
	world,
} from '@sim/add-remove';
import { initStats } from '@app/bench-tools';
import { scene } from './scene';
import { syncThreeObjects } from './systems/syncThreeObjects';
import { init } from './systems/init';

// Renderer
const renderer = new THREE.WebGLRenderer({
	antialias: true,
	powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Camera
const frustumSize = 500;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
	(-frustumSize * aspect) / 2,
	(frustumSize * aspect) / 2,
	frustumSize / 2,
	-frustumSize / 2,
	0.1,
	500
);

// Set the floor to the bottom of the screen
CONSTANTS.FLOOR = -frustumSize / 2;

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

const pipeline = (world: World) => {
	updateTime(world);
	recycleBodies(world);
	setInitial(world);
	updateGravity(world);
	moveBodies(world);
	syncThreeObjects(world);
	return world;
};

// Init stats
const { updateStats, measure } = initStats({
	Bodies: () => CONSTANTS.BODIES,
	'Max comps per entity': () => CONSTANTS.MAX_COMPS_PER_ENTITY,
});

// Run the simulation
const main = () => {
	measure(() => {
		pipeline(world);
		renderer.render(scene, camera);
		updateStats();
	});
	requestAnimationFrame(main);
};

// Initialize all entities
init(world);

requestAnimationFrame(main);
