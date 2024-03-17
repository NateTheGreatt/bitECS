import { getFPS } from '../get-fps';
import { Measurement, measure } from '../measure';
import './stats.css';

type Stats = Record<string, () => any>;

export function initStats(extras?: Stats) {
	const statsEle = document.createElement('div');
	document.body.appendChild(statsEle);
	statsEle.classList.add('stats');

	const measurementRef = { current: { delta: 0, average: 0 } as Measurement };
	const fpsRef = { current: 0 };

	const updates: (() => void)[] = [];

	const stats = {
		FPS: () => fpsRef.current.toFixed(3),
		'Frame time': () => `${measurementRef.current.average.toFixed(3)}ms`,
		...extras,
	};

	for (const [label, value] of Object.entries(stats)) {
		const { div, update } = createStat(label, value);
		statsEle.appendChild(div);
		updates.push(update);
	}

	function updateStats() {
		getFPS(fpsRef);
		for (const update of updates) {
			update();
		}
	}

	return {
		updateStats,
		measure: async (fn: (...args: any[]) => any) => await measure(fn, measurementRef),
	};
}

function createStat(label: string, getValue: () => any) {
	const div = document.createElement('div');
	div.classList.add('stat');
	div.innerHTML = `${label}: 0`;

	function update() {
		div.innerHTML = `${label}: ${getValue()}`;
	}

	return { div, update };
}
