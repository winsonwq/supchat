const echo = {
  path: '/demo/echo',
  handler: async ({ data }) => {
    const message = (data && data.message) || ''
    return { echo: message, ts: Date.now() }
  },
}

const sum = {
  path: '/demo/sum',
  handler: async ({ data }) => {
    const a = Number((data && data.a) || 0)
    const b = Number((data && data.b) || 0)
    return { sum: a + b }
  },
}

export default [echo, sum]
