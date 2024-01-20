export default defineEventHandler(async () => {
  const redirectUrl = getGoogleOauthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['email', 'profile']
  })

  return {
    redirectUrl
  }
})
