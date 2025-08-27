export type Action<Type extends string = string, Payload = unknown> = {
	type: Type;
	payload?: Payload;
};

export type Reducer<State, A extends Action = Action> = (
	state: State,
	action: A
) => State;

export type Unsubscribe = () => void;

export type ListenerCallback<Selected> = (selected: Selected) => void;

export type Selector<State, Selected> = (state: State) => Selected;

export type EqualityFn<T> = (a: T, b: T) => boolean;

export interface Store<State, A extends Action = Action> {
	getState(): State;
	dispatch(action: A): void;
	subscribe<Selected = State>(
		listener: ListenerCallback<Selected>,
		selector?: Selector<State, Selected>,
		isEqual?: EqualityFn<Selected>
	): Unsubscribe;
	subscribeMany<Selected extends Record<string, unknown>>(
		listener: ListenerCallback<Selected>,
		selectors: { [K in keyof Selected]: Selector<State, Selected[K]> },
		isEqual?: EqualityFn<Selected>
	): Unsubscribe;
	replaceReducer(next: Reducer<State, A>): void;
	destroy(): void;
}

export interface CreateStoreOptions<State, A extends Action = Action> {
	reducer: Reducer<State, A>;
	preloadedState: State;
	name?: string;
	batchMs?: number;
}

export type KeySelectorMap<State> = Record<string, Selector<State, unknown>>;

export type ShallowComparable = Record<string, unknown> | unknown[];

export type AnyStore = Store<unknown, Action>;


