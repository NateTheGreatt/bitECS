let totalExecutionTime = 0;
let executionCount = 0;

export async function measure(fn: (...args: any[]) => any) {
  const startTime = performance.now();

  const result = await fn();

  const endTime = performance.now();
  const executionTime = endTime - startTime;

  totalExecutionTime += executionTime;
  executionCount += 1;
  const averageTime = totalExecutionTime / executionCount;

  // @ts-expect-error
  if (typeof window !== "undefined") {
    // Browser environment: use console.log
    console.log(
      `Execution time: ${executionTime.toFixed(
        3
      )} ms, Average time: ${averageTime.toFixed(3)} ms`
    );
  } else if (
    typeof process !== "undefined" &&
    process.stdout &&
    process.stdout.write
  ) {
    // Node.js environment: use process.stdout.write to update the same line
    process.stdout.write(
      `\rExecution time: ${executionTime.toFixed(
        3
      )} ms, Average time: ${averageTime.toFixed(3)} ms`
    );
  }

  return result;
}
