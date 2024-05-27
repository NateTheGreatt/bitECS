import { CONSTANTS, init as initSim } from '@sim/add-remove';
import { ThreeObject } from '../components/ThreeObject';
import * as THREE from 'three';
import { scene } from '../scene';
import { World } from '@bitecs/classic';

export function init(world: World) {
	const particleCount = CONSTANTS.BODIES;

	// Create BufferGeometry for particles
	const geometry = new THREE.BufferGeometry();
	const positions = new Float32Array(particleCount * 3); // x, y, z for each particle
	const colors = new Float32Array(particleCount * 4); // r, g, b, a for each particle
	const sizes = new Float32Array(particleCount); // size for each particle

	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4));
	geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

	const material = new THREE.ShaderMaterial({
		vertexShader: vertexShader(),
		fragmentShader: fragmentShader(),
		transparent: true,
	});

	const particles = new THREE.Points(geometry, material);

	scene.add(particles);

	ThreeObject[0] = particles;

	initSim(world);
}

function vertexShader() {
	return `
		attribute float size;
		attribute vec4 color;
		varying vec4 vColor;
		void main() {
			vColor = color;
			vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
			gl_PointSize = size * ( 250.0 / -mvPosition.z );
			gl_Position = projectionMatrix * mvPosition;
		}
	`;
}

function fragmentShader() {
	return `
		varying vec4 vColor;
		void main() {
			float distanceFromCenter = length(gl_PointCoord - vec2(0.5, 0.5));
			if (distanceFromCenter > 0.5) {
				discard;
			}
			gl_FragColor = vec4( vColor );
		}
	`;
}
