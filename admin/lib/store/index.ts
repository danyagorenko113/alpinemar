import { fsStore } from './fs-store'
import { githubStore } from './github-store'
import type { ContentStore } from './types'

export function getStore(): ContentStore {
  const backend = (process.env.CONTENT_STORE ?? 'fs').toLowerCase()
  return backend === 'github' ? githubStore : fsStore
}

export type { ContentStore, RepoFile, ListResult, WriteOptions } from './types'
