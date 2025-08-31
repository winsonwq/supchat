import { Action, AsyncThunk } from './types'

export function createAsyncThunk<R>(
  name: string,
  fn: () => Promise<R>,
): () => AsyncThunk<unknown, Action<string, R>, R>
export function createAsyncThunk<T, R>(
  name: string,
  fn: (params: T) => Promise<R>,
): (params: T) => AsyncThunk<unknown, Action<string, R>, R>
export function createAsyncThunk<T, R>(
  name: string,
  fn: (params: T) => Promise<R>,
): (params: T) => AsyncThunk<unknown, Action<string, R>, R> {
  if (fn.length === 0) {
    // 无参数版本
    return () => {
      return async (dispatch) => {
        const result = await (fn as () => Promise<R>)()

        dispatch({
          type: name,
          payload: result,
        })

        return result
      }
    }
  } else {
    // 有参数版本
    return (params: T) => {
      return async (dispatch) => {
        const result = await fn(params)

        dispatch({
          type: name,
          payload: result,
        })

        return result
      }
    }
  }
}
