import { initStats } from '@app/bench-tools';
import { CONSTANTS, world } from '@sim/n-body';
import * as THREE from 'three';
import './styles.css';
import { init } from './systems/init';
import { pipeline } from './systems/pipeline';

// Configure the simulation
CONSTANTS.NBODIES = 2000;

// Renderer
export const renderer = new THREE.WebGLRenderer({
	antialias: true,
	powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Camera
const frustumSize = 8000;
const aspect = window.innerWidth / window.innerHeight;
export const camera = new THREE.OrthographicCamera(
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

// Init stats
const { updateStats, measure } = initStats({ Bodies: () => CONSTANTS.NBODIES });

// Run the simulation
const main = () => {
	measure(() => {
		pipeline(world);
		updateStats();
	});
	requestAnimationFrame(main);
};

// Initialize all entities
init(world);

requestAnimationFrame(main);
