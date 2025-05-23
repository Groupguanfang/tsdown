import path from 'node:path'
import { glob } from 'tinyglobby'
import { lowestCommonAncestor } from '../utils/fs'
import { generateColor, logger, prettyName } from '../utils/logger'
import type { Options } from '../options'

export async function resolveEntry(
  entry: Options['entry'],
  cwd: string,
  name?: string,
): Promise<Record<string, string>> {
  const nameLabel = name ? `[${name}] ` : ''
  if (!entry || Object.keys(entry).length === 0) {
    // TODO auto find entry
    throw new Error(
      `${nameLabel}No input files, try "tsdown <your-file>" instead`,
    )
  }

  const entryMap = await toObjectEntry(entry, cwd)
  const entries = Object.values(entryMap)
  if (entries.length === 0) {
    throw new Error(`${nameLabel}Cannot find entry: ${JSON.stringify(entry)}`)
  }
  logger.info(
    prettyName(name),
    `entry: ${generateColor(name)(entries.map((entry) => path.relative(cwd, entry)).join(', '))}`,
  )
  return entryMap
}

export async function toObjectEntry(
  entry: string | string[] | Record<string, string>,
  cwd: string,
): Promise<Record<string, string>> {
  if (typeof entry === 'string') {
    entry = [entry]
  }
  if (!Array.isArray(entry)) {
    return entry
  }

  const resolvedEntry = await glob(entry, { cwd, absolute: true })
  const base = lowestCommonAncestor(...resolvedEntry)
  return Object.fromEntries(
    resolvedEntry.map((file) => {
      const relative = path.relative(base, file)
      return [
        relative.slice(0, relative.length - path.extname(relative).length),
        file,
      ]
    }),
  )
}
