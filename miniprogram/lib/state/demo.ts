import { createStore, combineReducers, type Action } from './index';

// State Types
export interface CounterState { value: number }
export interface TodoItem { id: string; text: string; done: boolean }
export interface TodosState { items: TodoItem[] }
export interface DemoState { counter: CounterState; todos: TodosState }

// Actions
export type DemoAction =
	| { type: 'counter/increment'; payload?: number }
	| { type: 'counter/decrement'; payload?: number }
	| { type: 'todos/add'; payload: { id: string; text: string } }
	| { type: 'todos/toggle'; payload: { id: string } }
	| { type: 'todos/clearDone' };

// Reducers
const counterInitial: CounterState = { value: 0 };
function counterReducer(state: CounterState = counterInitial, action: Action): CounterState {
	if (action.type === 'counter/increment') {
		const step = typeof action.payload === 'number' ? action.payload : 1;
		return { value: state.value + step };
	}
	if (action.type === 'counter/decrement') {
		const step = typeof action.payload === 'number' ? action.payload : 1;
		return { value: state.value - step };
	}
	return state;
}

const todosInitial: TodosState = { items: [] };
function todosReducer(state: TodosState = todosInitial, action: Action): TodosState {
	if (action.type === 'todos/add' && action.payload && typeof action.payload === 'object') {
		const { id, text } = action.payload as { id: string; text: string };
		return { items: state.items.concat({ id, text, done: false }) };
	}
	if (action.type === 'todos/toggle' && action.payload && typeof action.payload === 'object') {
		const { id } = action.payload as { id: string };
		return { items: state.items.map(it => (it.id === id ? { ...it, done: !it.done } : it)) };
	}
	if (action.type === 'todos/clearDone') {
		return { items: state.items.filter(it => !it.done) };
	}
	return state;
}

export const demoReducer = combineReducers<DemoState, DemoAction>({
	counter: counterReducer,
	todos: todosReducer,
});

export const demoStore = createStore<DemoState, DemoAction>({
	reducer: demoReducer,
	preloadedState: { counter: counterInitial, todos: todosInitial },
	name: 'demo',
});

export const demoActions = {
	increment: (n = 1): DemoAction => ({ type: 'counter/increment', payload: n }),
	decrement: (n = 1): DemoAction => ({ type: 'counter/decrement', payload: n }),
	addTodo: (id: string, text: string): DemoAction => ({ type: 'todos/add', payload: { id, text } }),
	toggleTodo: (id: string): DemoAction => ({ type: 'todos/toggle', payload: { id } }),
	clearDone: (): DemoAction => ({ type: 'todos/clearDone' }),
};


