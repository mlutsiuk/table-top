import { SignJWT, jwtVerify } from 'jose'
import type { JWTPayload } from '~/types/jwt'

const getEncodedSecret = () => {
  const { secret } = useRuntimeConfig().jwt

  return new TextEncoder().encode(secret)
}

export const signUserJwt = async (payload: JWTPayload) => {
  const { alg, exp } = useRuntimeConfig().jwt

  const secret = getEncodedSecret()

  return await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secret)
}

export const verifyUserJwt = async (token: string) => {
  const secret = getEncodedSecret()

  const { payload, protectedHeader } = await jwtVerify<JWTPayload>(token, secret)

  return {
    payload,
    protectedHeader
  }
}
