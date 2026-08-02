/**
 * Pure array maths over materialised paths — no database, no Prisma, so it stays
 * trivially testable and can never hide a query.
 *
 * Every stored path is self-inclusive: it runs from the root down to and including
 * the folder's own id. That is what lets a single `includes` answer both "is this
 * folder inside that one" and "is this folder that one".
 */

/** Path a new child gets when created under a folder with `parentPath`. */
export function childPath(parentPath: string[], childId: string): string[] {
  return [...parentPath, childId]
}

/**
 * Can `folderId` become a child of the folder that carries `targetPath`?
 *
 * Because paths are self-inclusive, finding the folder inside the destination's
 * path covers both a cycle and the degenerate "move a folder under itself".
 */
export function canMoveUnder(folderId: string, targetPath: string[]): boolean {
  return !targetPath.includes(folderId)
}

/**
 * The path a moved folder takes on, and where each descendant's own ancestry
 * resumes once the old prefix is swapped out.
 */
export function reparentedPath(newParentPath: string[], folderId: string, oldPath: string[]) {
  return {
    path: [...newParentPath, folderId],
    suffixStart: oldPath.length + 1
  }
}
