import type { EqualityFn, ShallowComparable } from './types';

export const isObject = (v: unknown): v is Record<string, unknown> =>
	v !== null && typeof v === 'object';

export const shallowEqual: EqualityFn<ShallowComparable> = (a, b) => {
	if (Object.is(a, b)) return true;
	if (!isObject(a) || !isObject(b)) return false;
	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);
	if (aKeys.length !== bKeys.length) return false;
	for (const key of aKeys) {
		if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (!Object.is((a as any)[key], (b as any)[key])) return false;
	}
	return true;
};

export const defaultEquality = <T>(x: T, y: T): boolean => Object.is(x, y);

export function scheduleMicrotask(cb: () => void): void {
	Promise.resolve().then(cb).catch(() => cb());
}


