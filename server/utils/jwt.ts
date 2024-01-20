import { SignJWT } from 'jose'
import type { JWTPayload } from '~/types/jwt'

export const signUserJwt = async (payload: JWTPayload) => {
  const { secret, alg, exp } = useRuntimeConfig().jwt

  const encodedSecret = new TextEncoder().encode(secret)
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(encodedSecret)

  return token
}
