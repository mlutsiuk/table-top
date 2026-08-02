import { TRPCClientError } from '@trpc/client'
import { toast } from 'vue-sonner'

/**
 * Surfaces a failed call to the user instead of swallowing it.
 *
 * Note the error class: the client throws `TRPCClientError`, never the server's
 * `TRPCError`. Checking for the latter silently discards every failure.
 *
 * Named `notifyError` rather than `reportError` because the latter is a DOM
 * global, and an auto-imported helper would be shadowed by it.
 *
 * @param error - Whatever was caught.
 * @param fallback - Shown when the error carries no usable message.
 */
export function notifyError(error: unknown, fallback = 'Something went wrong') {
  const message = error instanceof TRPCClientError && error.message
    ? error.message
    : fallback

  toast.error(message)

  if (import.meta.dev) {
    console.error(error)
  }
}

/** Was this rejection the server telling us the caller is not authenticated? */
export function isUnauthorized(error: unknown) {
  return error instanceof TRPCClientError && error.data?.code === 'UNAUTHORIZED'
}
