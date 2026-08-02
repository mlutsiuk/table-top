import { describe, expect, it } from 'vitest'
import { CAMPAIGN_ABILITIES, abilitiesFor, hasAbility } from '#shared/permissions/campaign'

describe('abilitiesFor', () => {
  it('gives the master everything', () => {
    expect(abilitiesFor('master')).toEqual([...CAMPAIGN_ABILITIES])
  })

  it('gives a player reads but no writes', () => {
    const player = abilitiesFor('player')

    expect(player).toContain('campaign:read')
    expect(player).toContain('members:read')
    expect(player).toContain('materials:read')

    expect(player).not.toContain('campaign:update')
    expect(player).not.toContain('members:manage')
    expect(player).not.toContain('materials:write')
  })

  it('never grants a player something the master lacks', () => {
    const master = abilitiesFor('master')
    expect(abilitiesFor('player').every(ability => master.includes(ability))).toBe(true)
  })

  it('returns abilities in the declared order', () => {
    // Stable order keeps the shipped DTO byte-identical between requests, which
    // matters for caching and for diffing responses while debugging.
    const player = abilitiesFor('player')
    const declared = CAMPAIGN_ABILITIES.filter(a => player.includes(a))
    expect(player).toEqual(declared)
  })
})

describe('hasAbility', () => {
  it('finds a present ability', () => {
    expect(hasAbility(abilitiesFor('master'), 'members:manage')).toBe(true)
  })

  it('rejects an absent one', () => {
    expect(hasAbility(abilitiesFor('player'), 'members:manage')).toBe(false)
  })

  it('is false for an empty set', () => {
    expect(hasAbility([], 'campaign:read')).toBe(false)
  })
})
