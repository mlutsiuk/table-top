import { google } from 'googleapis'

const { googleClientId, googleClientSecret, googleCallbackUrl } = useRuntimeConfig()

export const getGoogleOauthClient = () => {
  return new google.auth.OAuth2(
    googleClientId,
    googleClientSecret,
    googleCallbackUrl
  )
}
