import type { EqualityFn, Selector, Store } from './types';
import { shallowEqual } from './utils';

export function subscribe<State, Result>(
	store: Store<State>,
	selector: Selector<State, Result>,
	changeHandler: (result: Result) => void,
	options?: { isEqual?: EqualityFn<Result> }
): () => void {
	let prev = selector(store.getState());

	const unsubscribe = store.subscribe<Result>(
		(next) => {
			changeHandler(next);
			prev = next;
		},
		selector,
		options?.isEqual ?? (shallowEqual as any)
	);

	// 首次同步
	changeHandler(prev);

	return unsubscribe;
}


