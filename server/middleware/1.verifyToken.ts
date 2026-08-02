declare module 'h3' {
  interface H3EventContext {
    auth?: { id: string }
  }
}

export default eventHandler(async (event) => {
  const authorizationHeader = event.headers.get('authorization')
  if (!authorizationHeader) return

  const [scheme, token] = authorizationHeader.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return

  try {
    const decoded = await verifyUserJwt(token)

    event.context.auth = {
      id: decoded.payload.userId
    }
  }
  catch (e) {
    if (import.meta.dev) {
      console.warn('[auth] rejected token:', e instanceof Error ? e.message : e)
    }
  }
})
