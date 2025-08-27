import type { EqualityFn } from './types'
import { defaultEquality } from './utils'

type AnyFn = (...args: any[]) => any

function areArgsShallowEqual(prev: unknown[], next: unknown[]): boolean {
	if (prev === next) return true
	if (prev.length !== next.length) return false
	for (let i = 0; i < prev.length; i++) {
		if (!Object.is(prev[i], next[i])) return false
	}
	return true
}

export interface CreateSelectorOptions<Result> {
	resultEqualityFn?: EqualityFn<Result>
}

type Selector<S, Result> = (state: S) => Result

// 简化实现：支持 1-4 个输入选择器的重载，足以覆盖常见场景
export function createSelector<S, R1, Result>(
	selectors: [Selector<S, R1>],
	resultFunc: (r1: R1) => Result,
	options?: CreateSelectorOptions<Result>
): Selector<S, Result>
export function createSelector<S, R1, R2, Result>(
	selectors: [Selector<S, R1>, Selector<S, R2>],
	resultFunc: (r1: R1, r2: R2) => Result,
	options?: CreateSelectorOptions<Result>
): Selector<S, Result>
export function createSelector<S, R1, R2, R3, Result>(
	selectors: [Selector<S, R1>, Selector<S, R2>, Selector<S, R3>],
	resultFunc: (r1: R1, r2: R2, r3: R3) => Result,
	options?: CreateSelectorOptions<Result>
): Selector<S, Result>
export function createSelector<S, R1, R2, R3, R4, Result>(
	selectors: [Selector<S, R1>, Selector<S, R2>, Selector<S, R3>, Selector<S, R4>],
	resultFunc: (r1: R1, r2: R2, r3: R3, r4: R4) => Result,
	options?: CreateSelectorOptions<Result>
): Selector<S, Result>
export function createSelector<S, R1, R2, R3, R4, R5, Result>(
	selectors: [Selector<S, R1>, Selector<S, R2>, Selector<S, R3>, Selector<S, R4>, Selector<S, R5>],
	resultFunc: (r1: R1, r2: R2, r3: R3, r4: R4, r5: R5) => Result,
	options?: CreateSelectorOptions<Result>
): Selector<S, Result>
export function createSelector<S, R1, R2, R3, R4, R5, R6, Result>(
	selectors: [Selector<S, R1>, Selector<S, R2>, Selector<S, R3>, Selector<S, R4>, Selector<S, R5>, Selector<S, R6>],
	resultFunc: (r1: R1, r2: R2, r3: R3, r4: R4, r5: R5, r6: R6) => Result,
	options?: CreateSelectorOptions<Result>
): Selector<S, Result>
export function createSelector<S>(
	selectors: Selector<S, unknown>[],
	resultFunc: AnyFn,
	options?: CreateSelectorOptions<unknown>
): Selector<S, unknown> {
	let lastArgs: unknown[] | null = null
	let lastResult: unknown
	const resultEqual = (options?.resultEqualityFn ?? (defaultEquality as EqualityFn<unknown>))

	return (state: S) => {
		const args = selectors.map((sel) => sel(state))
		if (lastArgs && areArgsShallowEqual(lastArgs, args)) {
			return lastResult
		}
		const next = resultFunc(...args)
		if (lastArgs && resultEqual(lastResult, next)) {
			// 结果相等则复用旧引用，避免无意义更新
			return lastResult
		}
		lastArgs = args
		lastResult = next
		return next
	}
}


