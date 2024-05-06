import WorkerConstruct from 'web-worker';

const isNode =
	typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

export const Worker = isNode ? WorkerConstruct.default : window.Worker;
