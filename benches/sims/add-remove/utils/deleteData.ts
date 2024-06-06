import { Circle } from '../components/Circle';
import { Color } from '../components/Color';
import { Mass } from '../components/Mass';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';

export function deleteData(eid: number) {
	delete Position.x[eid];
	delete Position.y[eid];
	delete Position.z[eid];
	delete Circle.radius[eid];
	delete Mass.value[eid];
	delete Velocity.x[eid];
	delete Velocity.y[eid];
	delete Color.r[eid];
	delete Color.g[eid];
	delete Color.b[eid];
	delete Color.a[eid];
}
