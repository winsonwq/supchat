import type {
	Action,
	CreateStoreOptions,
	EqualityFn,
	ListenerCallback,
	Reducer,
	Selector,
	Store,
	Thunk,
	AsyncThunk,
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

	function dispatch<T>(action: T): T extends AsyncThunk<State, A, infer R>
		? Promise<R>
		: T extends (dispatch: any, getState: any) => infer R
		? R
		: T {
		if (destroyed) return action as any;
		if (typeof action === 'function') {
			const result = (action as Thunk<State, A> | AsyncThunk<State, A, unknown>)(dispatch, getState);
			// 如果返回的是 Promise，则返回该 Promise
			if (result && typeof result === 'object' && 'then' in result) {
				return result as any;
			}
			return result as any;
		}
		// 对于普通 action，检查是否为 Action 类型
		if (typeof action === 'object' && action !== null && 'type' in action) {
			const nextState = currentReducer(currentState, action as A);
			if (Object.is(nextState, currentState)) return action as any;
			currentState = nextState;
			enqueueNotify();
		}
		return action as any;
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

// 重新设计的 combineReducers，使用高级类型推断
export function combineReducers<State extends Record<string, any>, Actions extends Action>(
	reducers: {
		[K in keyof State]: (state: State[K], action: any) => State[K];
	}
): Reducer<State, Actions> {
	const keys = Object.keys(reducers) as (keyof State)[];
	return (state: State, action: Actions) => {
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


