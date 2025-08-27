import type {
	Action,
	CreateStoreOptions,
	EqualityFn,
	ListenerCallback,
	Reducer,
	Selector,
	Store,
	Thunk,
} from './types';
import { defaultEquality, scheduleMicrotask, shallowEqual } from './utils';

export function createStore<State, A extends Action = Action>(
	options: CreateStoreOptions<State, A>
): Store<State, A> {
	let currentState = options.preloadedState;
	let currentReducer: Reducer<State, A> = options.reducer;
	let destroyed = false;

	const listeners = new Set<() => void>();
	let isNotifying = false;
	let pendingNotify = false;

	function getState(): State {
		return currentState;
	}

	function dispatch(action: A | Thunk<State, A>): unknown {
		if (destroyed) return;
		if (typeof action === 'function') {
			return (action as Thunk<State, A>)(dispatch, getState);
		}
		const nextState = currentReducer(currentState, action);
		if (Object.is(nextState, currentState)) return;
		currentState = nextState;
		enqueueNotify();
		return undefined;
	}

	function enqueueNotify(): void {
		if (isNotifying) {
			pendingNotify = true;
			return;
		}
		isNotifying = true;
		scheduleMicrotask(() => {
			try {
				for (const fn of Array.from(listeners)) fn();
			} finally {
				isNotifying = false;
				if (pendingNotify) {
					pendingNotify = false;
					enqueueNotify();
				}
			}
		});
	}

	function subscribeImpl<Selected>(
		listener: ListenerCallback<Selected>,
		computeSelected: () => Selected,
		isEqual: EqualityFn<Selected>
	) {
		let selected = computeSelected();
		const wrapped = () => {
			const next = computeSelected();
			if (!isEqual(selected, next)) {
				selected = next;
				listener(selected);
			}
		};
		listeners.add(wrapped);
		return () => listeners.delete(wrapped);
	}

	function subscribe<Selected = State>(
		listener: ListenerCallback<Selected>,
		selector?: Selector<State, Selected>,
		isEqual?: EqualityFn<Selected>
	) {
		const compute = () => (selector ? selector(currentState) : (currentState as unknown as Selected));
		return subscribeImpl(listener, compute, isEqual ?? (defaultEquality as EqualityFn<Selected>));
	}

	function subscribeMany<Selected extends Record<string, unknown>>(
		listener: ListenerCallback<Selected>,
		selectors: { [K in keyof Selected]: Selector<State, Selected[K]> },
		isEqual?: EqualityFn<Selected>
	) {
		const keys = Object.keys(selectors) as (keyof Selected)[];
		const compute = () => {
			const obj = {} as Selected;
			for (const k of keys) obj[k] = selectors[k](currentState);
			return obj;
		};
		return subscribeImpl(
			listener,
			compute,
			isEqual ?? (shallowEqual as unknown as EqualityFn<Selected>)
		);
	}

	function replaceReducer(next: Reducer<State, A>): void {
		currentReducer = next;
	}

	function destroy(): void {
		destroyed = true;
		listeners.clear();
	}

	return {
		getState,
		dispatch,
		subscribe,
		subscribeMany,
		replaceReducer,
		destroy,
	};
}

export function combineReducers<State, A extends Action = Action>(reducers: {
	[K in keyof State]: Reducer<State[K], A>;
}): Reducer<State, A> {
	const keys = Object.keys(reducers) as (keyof State)[];
	return (state: State, action: A) => {
		let hasChanged = false;
		const next = { ...state } as State;
		for (const k of keys) {
			const reducer = reducers[k];
			const prevSlice = state[k];
			const nextSlice = reducer(prevSlice, action);
			if (!Object.is(prevSlice, nextSlice)) {
				hasChanged = true;
				next[k] = nextSlice;
			}
		}
		return hasChanged ? next : state;
	};
}


