import { World } from '../world';
import { Query } from '@bitecs/classic';
import { UpdateGravityComponents } from './updateGravity.common';
import { getThreadCount } from '@sim/bench-tools';

export const updateGravityMain = ({
	queries: { bodyQuery },
	partitionQuery,
	components,
}: {
	queries: { bodyQuery: Query };
	partitionQuery: Query;
	components: UpdateGravityComponents;
}) => {
	const workerFile = 'updateGravity.worker.ts';
	return async (world: World) => {
		// initialize workers with components
		// TODO: initialize max workers once and select system in worker?
		if (!world.workers[workerFile]) {
			const workers = (world.workers[workerFile] = Array(getThreadCount())
				.fill(null)
				.map(() => new Worker(new URL(workerFile, import.meta.url))) as Worker[]);

			await Promise.all(
				workers.map(
					(worker) =>
						new Promise<void>((resolve) => {
							worker.onmessage = () => resolve();
							// TODO: somehow pass queries here too
							worker.postMessage(components);
						})
				)
			);
		}

		// run worker
		const workers = world.workers[workerFile];
		const bodyEntities = bodyQuery(world) as Uint32Array;
		const partitionEntities = partitionQuery(world) as Uint32Array;
		const numberOfPartitions = workers.length;
		const entitiesPerPartition = Math.ceil(bodyEntities.length / numberOfPartitions);
		// TODO: atomic wait/notify
		await Promise.all(
			workers.map(
				(worker, i) =>
					new Promise<void>((resolve) => {
						worker.onmessage = () => resolve();
						const start = i * entitiesPerPartition;
						const end = start + entitiesPerPartition;
						const workerEntities = partitionEntities.subarray(start, end);
						worker.postMessage({ bodyEntities, workerEntities, delta: world.time.delta });
					})
			)
		);

		return world;
	};
};
