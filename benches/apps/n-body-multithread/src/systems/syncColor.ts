import { defineSystem } from '@bitecs/classic';
import { Color, bodyQuery } from '@sim/n-body-multithread';
import * as THREE from 'three';
import { ThreeObject } from '../components/ThreeObject';

const normalize = (x: number, min: number, max: number) => (x - min) / (max - min);

export const syncColor = defineSystem((world) => {
	const eids = bodyQuery(world);

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];
		const sphere = ThreeObject[eid];

		const r = normalize(Color.r[eid], 0, 255);
		const g = normalize(Color.g[eid], 0, 255);
		const b = normalize(Color.b[eid], 0, 255);

		(sphere.material as THREE.MeshBasicMaterial).color.set(r,g,b);
	}
});
