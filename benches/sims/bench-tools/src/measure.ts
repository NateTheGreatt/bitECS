export type Measurement = {
	delta: number;
	average: number;
};

let totalExecutionTime = 0;
let executionCount = 0;

export async function measure(
	fn: (...args: any[]) => any,
	measurementRef?: { current: Measurement }
) {
	const startTime = performance.now();

	const result = await fn();

	const endTime = performance.now();
	const delta = endTime - startTime;

	totalExecutionTime += delta;
	executionCount += 1;
	const average = totalExecutionTime / executionCount;

	if (measurementRef) {
		measurementRef.current = {
			delta,
			average,
		};
	} else {
		if (typeof window !== 'undefined') {
			// Browser environment: use console.log
			console.log(
				`Execution time: ${delta.toFixed(3)} ms, Average time: ${average.toFixed(3)} ms`
			);
		} else if (typeof process !== 'undefined' && process.stdout && process.stdout.write) {
			// Node.js environment: use process.stdout.write to update the same line
			process.stdout.write(
				`\rExecution time: ${delta.toFixed(3)} ms, Average time: ${average.toFixed(3)} ms`
			);
		}
	}

	return result;
}
