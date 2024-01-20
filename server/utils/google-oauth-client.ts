import { google } from 'googleapis'

const { googleClientId, googleClientSecret, googleCallbackUrl } = useRuntimeConfig()

export const getGoogleOauthClient = () => {
  return new google.auth.OAuth2(
    googleClientId,
    googleClientSecret,
    googleCallbackUrl
  )
}

export const getUserDataByCode = async (code: string) => {
  const oauthClient = getGoogleOauthClient()

  const { tokens } = await oauthClient.getToken(code)
  oauthClient.setCredentials(tokens)

  const oauth2 = google.oauth2({ version: 'v2', auth: oauthClient })
  const { data } = await oauth2.userinfo.get()

  return data
}
