import storageHandlers from './handlers/storage.mjs'
import userHandlers from './handlers/user.mjs'

export default [...storageHandlers, ...userHandlers]
