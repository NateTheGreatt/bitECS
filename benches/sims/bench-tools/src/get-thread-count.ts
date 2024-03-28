const isNode =
	typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
const os = isNode ? await import('os') : undefined;

// @ts-expect-error
const threadCount = isNode && os ? os.cpus().length : window.navigator.hardwareConcurrency;

export const getThreadCount = () => threadCount;
