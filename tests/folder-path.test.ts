import { describe, expect, it } from 'vitest'
import { canMoveUnder, childPath, reparentedPath } from '~~/server/features/folders/domain/folder-path'

describe('childPath', () => {
  it('puts a root folder at the start of its own path', () => {
    expect(childPath([], 'a')).toEqual(['a'])
  })

  it('appends the child to its parent ancestry', () => {
    expect(childPath(['a', 'b'], 'c')).toEqual(['a', 'b', 'c'])
  })

  it('does not mutate the parent path', () => {
    const parent = ['a']
    childPath(parent, 'b')
    expect(parent).toEqual(['a'])
  })
})

describe('canMoveUnder', () => {
  it('allows a move to an unrelated folder', () => {
    expect(canMoveUnder('a', ['x', 'y'])).toBe(true)
  })

  it('rejects moving a folder under itself', () => {
    // Paths are self-inclusive, so the target's path ends with its own id.
    expect(canMoveUnder('a', ['a'])).toBe(false)
  })

  it('rejects moving a folder into its own descendant', () => {
    expect(canMoveUnder('a', ['a', 'b', 'c'])).toBe(false)
  })

  it('allows a move to the root', () => {
    expect(canMoveUnder('a', [])).toBe(true)
  })
})

describe('reparentedPath', () => {
  it('rebuilds the path under the new parent', () => {
    const { path } = reparentedPath(['x'], 'a', ['a'])
    expect(path).toEqual(['x', 'a'])
  })

  it('reports where a descendant ancestry resumes after the old prefix', () => {
    // Old path ['root','a'] is two segments, so a descendant keeps everything
    // from the third segment onwards.
    const { suffixStart } = reparentedPath(['x'], 'a', ['root', 'a'])
    expect(suffixStart).toBe(3)
  })

  it('produces a root path when moved out to the top level', () => {
    const { path } = reparentedPath([], 'a', ['root', 'a'])
    expect(path).toEqual(['a'])
  })
})
