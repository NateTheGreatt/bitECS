let hasRun = false;
let supported = false;

export function isSabSupported(): boolean {
	if (hasRun) return supported;

	try {
		new SharedArrayBuffer(1);
		supported = true;
		hasRun = true;
		return true;
	} catch (e) {
		supported = false;
		hasRun = true;
		return false;
	}
}
