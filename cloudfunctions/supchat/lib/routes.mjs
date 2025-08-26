import storageHandlers from './handlers/storage.mjs'
import userHandlers from './handlers/user.mjs'
import chatHandlers from './handlers/chat.mjs'
import messageHandlers from './handlers/message.mjs'
import authHandlers from './handlers/auth.mjs'
import profileHandlers from './handlers/profile.mjs'

export default [
  ...storageHandlers,
  ...userHandlers,
  ...chatHandlers,
  ...messageHandlers,
  ...authHandlers,
  ...profileHandlers
]
