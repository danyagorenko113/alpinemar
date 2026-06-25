import { Octokit } from '@octokit/rest'
import type { ContentStore, ListResult, RepoFile, WriteOptions } from './types'

function octo() {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN is required for github content store')
  return new Octokit({ auth: token })
}

function repo() {
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO ?? 'alpinemar'
  const branch = process.env.GITHUB_BRANCH ?? 'main'
  if (!owner) throw new Error('GITHUB_OWNER is required for github content store')
  return { owner, repo, branch }
}

function commitAuthor() {
  return {
    name: process.env.GITHUB_COMMIT_NAME ?? 'Alpine Mar Admin',
    email: process.env.GITHUB_COMMIT_EMAIL ?? 'admin@alpinemar.com',
  }
}

export const githubStore: ContentStore = {
  backend: 'github',

  async list(dir: string, ext?: string): Promise<ListResult[]> {
    const k = octo()
    const { owner, repo: r, branch } = repo()
    /** Recursive tree pull — single request for a whole subtree. */
    const ref = await k.git.getRef({ owner, repo: r, ref: `heads/${branch}` })
    const commitSha = ref.data.object.sha
    const commit = await k.git.getCommit({ owner, repo: r, commit_sha: commitSha })
    const tree = await k.git.getTree({
      owner,
      repo: r,
      tree_sha: commit.data.tree.sha,
      recursive: 'true',
    })
    const prefix = dir.endsWith('/') ? dir : `${dir}/`
    return tree.data.tree
      .filter((n) => n.type === 'blob' && n.path?.startsWith(prefix))
      .filter((n) => !ext || n.path!.endsWith(ext))
      .map((n) => ({ path: n.path!, sha: n.sha! }))
  },

  async read(p: string): Promise<RepoFile | null> {
    const k = octo()
    const { owner, repo: r, branch } = repo()
    try {
      const res = await k.repos.getContent({ owner, repo: r, path: p, ref: branch })
      const data = res.data
      if (Array.isArray(data) || data.type !== 'file') return null
      const content = Buffer.from(data.content, data.encoding as BufferEncoding).toString('utf8')
      return { path: p, content, sha: data.sha }
    } catch (err: unknown) {
      const e = err as { status?: number }
      if (e?.status === 404) return null
      throw err
    }
  },

  async write(p: string, content: string | Buffer, opts: WriteOptions): Promise<{ sha: string }> {
    const k = octo()
    const { owner, repo: r, branch } = repo()
    const author = commitAuthor()
    const base64 =
      typeof content === 'string'
        ? Buffer.from(content, 'utf8').toString('base64')
        : content.toString('base64')

    // If we don't have a sha, look one up. Required when the file already
    // exists; harmless when it doesn't.
    let sha = opts.sha
    if (!sha) {
      const existing = await this.read(p)
      if (existing?.sha) sha = existing.sha
    }

    const res = await k.repos.createOrUpdateFileContents({
      owner,
      repo: r,
      path: p,
      message: opts.message,
      content: base64,
      branch,
      sha,
      committer: author,
      author,
    })
    return { sha: res.data.content?.sha ?? '' }
  },

  async remove(p: string, opts: { message: string; sha?: string }): Promise<void> {
    const k = octo()
    const { owner, repo: r, branch } = repo()
    let sha = opts.sha
    if (!sha) {
      const existing = await this.read(p)
      if (!existing) return
      sha = existing.sha
    }
    if (!sha) throw new Error(`Cannot delete ${p} — no sha`)
    const author = commitAuthor()
    await k.repos.deleteFile({
      owner,
      repo: r,
      path: p,
      message: opts.message,
      branch,
      sha,
      committer: author,
      author,
    })
  },
}
