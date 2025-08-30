import { Action, AsyncThunk } from './types'

export function createAsyncThunk<T, R>(
  name: string,
  fn: (params: T) => Promise<R>,
): (params: T) => AsyncThunk<any, Action<string, R>, R> {
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
