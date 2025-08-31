export type Action<Type extends string = string, Payload = unknown> = {
  type: Type
  payload: Payload
}

// 高级类型：从 reducer 映射中推断出 State 和 Action 类型
export type InferState<T> = T extends Record<string, infer R>
  ? R extends (state: infer S, action: any) => infer S
    ? S
    : never
  : never

export type InferAction<T> = T extends Record<string, infer R>
  ? R extends (state: any, action: infer A) => any
    ? A
    : never
  : never

// 改进的 Reducer 类型，支持联合类型的 action
export type Reducer<State, A extends Action = Action> = (
  state: State,
  action: A,
) => State

// 新的类型：支持每个 reducer 只处理自己关心的 action 类型
export type ReducerMap<
  State extends Record<string, any>,
  Actions extends Action,
> = {
  [K in keyof State]: (state: State[K], action: Actions) => State[K]
}

// 更精确的类型：支持每个 reducer 只处理自己关心的 action 类型
export type TypedReducerMap<
  State extends Record<string, any>,
  Actions extends Action,
> = {
  [K in keyof State]: (state: State[K], action: Actions) => State[K]
}

export type Thunk<State, A extends Action = Action, R = unknown> = (
  dispatch: (action: A | Thunk<State, A>) => unknown,
  getState: () => State,
) => R

export type AsyncThunk<State, A extends Action = Action, R = unknown> = (
  dispatch: (action: A | Thunk<State, A> | AsyncThunk<State, A, R>) => unknown,
  getState: () => State,
) => Promise<R>

export type Unsubscribe = () => void

export type ListenerCallback<Selected> = (selected: Selected) => void

export type Selector<State, Selected> = (state: State) => Selected

export type EqualityFn<T> = (a: T, b: T) => boolean

export interface Store<State, A extends Action = Action> {
  getState(): State
  dispatch<T>(
    action: T,
  ): T extends AsyncThunk<State, A, infer R>
    ? Promise<R>
    : T extends (dispatch: any, getState: any) => infer R
    ? R
    : T
  subscribe<Selected = State>(
    listener: ListenerCallback<Selected>,
    selector?: Selector<State, Selected>,
    isEqual?: EqualityFn<Selected>,
  ): Unsubscribe
  subscribeMany<Selected extends Record<string, unknown>>(
    listener: ListenerCallback<Selected>,
    selectors: { [K in keyof Selected]: Selector<State, Selected[K]> },
    isEqual?: EqualityFn<Selected>,
  ): Unsubscribe
  replaceReducer(next: Reducer<State, A>): void
  destroy(): void
}

export interface CreateStoreOptions<State, A extends Action = Action> {
  reducer: Reducer<State, A>
  preloadedState: State
  name?: string
  batchMs?: number
}

export type KeySelectorMap<State> = Record<string, Selector<State, unknown>>

export type ShallowComparable = Record<string, unknown> | unknown[]

export type AnyStore = Store<unknown, Action>
