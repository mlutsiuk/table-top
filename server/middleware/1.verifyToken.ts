declare module 'h3' {
  interface H3EventContext {
    auth?: { id: string }
  }
}

export default eventHandler(async (event) => {
  const authorizationHeader = event.headers.get('authorization')

  if (authorizationHeader) {
    const token = authorizationHeader.split(' ')[1]
    try {
      const decoded = await verifyUserJwt(token)

      event.context.auth = {
        id: decoded.payload.userId
      }
    }
    catch (e) {
      // TODO: log error
    }
  }
})
