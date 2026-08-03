import type { MechanicDef } from './types'
import { valuesV1 } from './values-v1'

/**
 * Every mechanic the engine knows, listed once.
 *
 * Adding a key here is what forces the rest into place: the server registry and
 * the UI registry are both `Record<MechanicKey, …>`, so neither compiles until the
 * new mechanic is registered on both sides. That is the whole defence against a
 * mechanic existing on one side and not the other.
 */
export const MECHANIC_KEYS = ['values-v1'] as const

export type MechanicKey = typeof MECHANIC_KEYS[number]

export const MECHANICS: Record<MechanicKey, MechanicDef> = {
  'values-v1': valuesV1
}

/** The definition behind a stored `Mechanic.key`, or nothing if it is unknown. */
export function findMechanic(key: string): MechanicDef | undefined {
  return (MECHANIC_KEYS as readonly string[]).includes(key)
    ? MECHANICS[key as MechanicKey]
    : undefined
}

/** What the master picks from when adding a mechanic to a campaign. */
export function listMechanics() {
  return MECHANIC_KEYS.map(key => ({
    key,
    label: MECHANICS[key].label,
    description: MECHANICS[key].description
  }))
}
