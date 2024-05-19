import { isSabSupported } from './isSabSupported';

export function isGrowResizeSupported(): boolean {
	return isSabSupported()
		? 'grow' in SharedArrayBuffer.prototype
		: 'resize' in ArrayBuffer.prototype;
}
