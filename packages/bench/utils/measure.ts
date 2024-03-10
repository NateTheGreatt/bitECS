let totalExecutionTime = 0;
let executionCount = 0;

export function measure(fn: (...args: any[]) => any) {
  const startTime = performance.now();

  const result = fn();

  const endTime = performance.now();
  const executionTime = endTime - startTime;

  // Update total execution time and count
  totalExecutionTime += executionTime;
  executionCount += 1;
  const averageTime = totalExecutionTime / executionCount;

  // Use process.stdout.write to update the same line and show average time
  process.stdout.write(
    `\rExecution time: ${executionTime.toFixed(
      3
    )} ms, Average time: ${averageTime.toFixed(3)} ms`
  );

  return result;
}
