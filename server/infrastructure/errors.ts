/**
 * Domain failures, deliberately unaware of transport.
 *
 * Services throw these; the single mapper in `server/trpc/trpc.ts` turns them into
 * tRPC codes. Anything else that escapes a service is a genuine bug and is left to
 * surface as a 500 rather than being dressed up as an expected outcome.
 */

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

/** Well-formed and authorised, but the current state of the data does not allow it. */
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BadRequestError'
  }
}
