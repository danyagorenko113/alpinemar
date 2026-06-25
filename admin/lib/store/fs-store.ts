import { promises as fs } from 'fs'
import path from 'path'
import type { ContentStore, ListResult, RepoFile, WriteOptions } from './types'

function repoRoot(): string {
  const root = process.env.CONTENT_REPO_ROOT ?? '..'
  return path.resolve(process.cwd(), root)
}

async function walk(dir: string, ext?: string): Promise<string[]> {
  const out: string[] = []
  let entries: import('fs').Dirent[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      out.push(...(await walk(full, ext)))
    } else if (!ext || e.name.endsWith(ext)) {
      out.push(full)
    }
  }
  return out
}

export const fsStore: ContentStore = {
  backend: 'fs',

  async list(dir: string, ext?: string): Promise<ListResult[]> {
    const root = repoRoot()
    const abs = path.join(root, dir)
    const files = await walk(abs, ext)
    return files.map((f) => ({ path: path.relative(root, f).split(path.sep).join('/') }))
  },

  async read(p: string): Promise<RepoFile | null> {
    const abs = path.join(repoRoot(), p)
    try {
      const content = await fs.readFile(abs, 'utf8')
      const stat = await fs.stat(abs)
      return { path: p, content, sha: String(stat.mtimeMs) }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw err
    }
  },

  async write(p: string, content: string | Buffer, _opts: WriteOptions): Promise<{ sha: string }> {
    const abs = path.join(repoRoot(), p)
    await fs.mkdir(path.dirname(abs), { recursive: true })
    if (typeof content === 'string') {
      await fs.writeFile(abs, content, 'utf8')
    } else {
      await fs.writeFile(abs, content)
    }
    const stat = await fs.stat(abs)
    return { sha: String(stat.mtimeMs) }
  },

  async remove(p: string): Promise<void> {
    const abs = path.join(repoRoot(), p)
    try {
      await fs.unlink(abs)
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
    }
  },
}
