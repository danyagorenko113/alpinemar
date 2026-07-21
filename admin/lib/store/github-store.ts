import { Octokit } from '@octokit/rest'
import type { CommitChange, ContentStore, ListResult, RepoFile, WriteOptions } from './types'

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
    if (tree.data.truncated) {
      // GitHub caps recursive trees at ~100k entries / 7MB and silently
      // truncates. Fail loudly rather than serve a partial listing (which
      // would hide files and let renames/deletes miss members).
      throw new Error(
        'Repository tree is too large to list in one request (GitHub truncated the response). ' +
          'The media/content folders need pagination — contact the developer.',
      )
    }
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

  async readManyText(paths: string[]): Promise<Map<string, { content: string; sha?: string }>> {
    const out = new Map<string, { content: string; sha?: string }>()
    if (paths.length === 0) return out
    const k = octo()
    const { owner, repo: r, branch } = repo()
    // One GraphQL request fetches every file's text + blob oid via aliases,
    // replacing N REST getContent calls. Chunked to keep the query reasonable.
    const CHUNK = 100
    for (let start = 0; start < paths.length; start += CHUNK) {
      const chunk = paths.slice(start, start + CHUNK)
      const fields = chunk
        .map((p, i) => `f${i}: object(expression: ${JSON.stringify(`${branch}:${p}`)}) { ... on Blob { text oid } }`)
        .join('\n')
      const query = `query($owner:String!,$name:String!){ repository(owner:$owner,name:$name){ ${fields} } }`
      const data = await k.graphql<{ repository: Record<string, { text?: string | null; oid?: string } | null> }>(
        query,
        { owner, name: r },
      )
      chunk.forEach((p, i) => {
        const node = data.repository?.[`f${i}`]
        if (node && typeof node.text === 'string') out.set(p, { content: node.text, sha: node.oid })
      })
    }
    return out
  },

  async readRaw(p: string, sha?: string): Promise<{ content: Buffer; sha?: string } | null> {
    const k = octo()
    const { owner, repo: r, branch } = repo()
    try {
      if (sha) {
        // Blobs API supports files up to 100MB (contents API caps at 1MB).
        const res = await k.git.getBlob({ owner, repo: r, file_sha: sha })
        return { content: Buffer.from(res.data.content, 'base64'), sha }
      }
      const res = await k.repos.getContent({ owner, repo: r, path: p, ref: branch })
      const data = res.data
      if (Array.isArray(data) || data.type !== 'file') return null
      return { content: Buffer.from(data.content, data.encoding as BufferEncoding), sha: data.sha }
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

    try {
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
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string }
      // 409 = sha conflict (someone else changed the file). 422 covers several
      // cases: a stale/mismatched sha (also a conflict) OR a genuine validation
      // error (e.g. path too long). Surface the real message for 422 so a
      // non-conflict validation failure isn't mislabeled as "changed by someone".
      if (e?.status === 409) {
        throw Object.assign(
          new Error(
            'This page was changed by someone else after you started editing. Refresh to load the latest version, then re-apply your changes.',
          ),
          { code: 'conflict' as const },
        )
      }
      if (e?.status === 422) {
        const detail = e?.message ? ` (${e.message})` : ''
        throw Object.assign(
          new Error(
            `GitHub rejected the save${detail}. If you have another tab open on this page, refresh and try again.`,
          ),
          { code: 'conflict' as const },
        )
      }
      if (e?.status === 403) {
        throw new Error('GitHub rate limit or permission denied. Try again in a minute.')
      }
      throw err
    }
  },

  async commit(changes: CommitChange[], opts: { message: string }): Promise<{ sha: string }> {
    const k = octo()
    const { owner, repo: r, branch } = repo()
    const author = commitAuthor()
    if (changes.length === 0) return { sha: '' }

    // Atomic: build one tree off the current commit that upserts + deletes, then
    // one commit + ref update. A rename never leaves the old + new file both present.
    const ref = await k.git.getRef({ owner, repo: r, ref: `heads/${branch}` })
    const baseCommitSha = ref.data.object.sha
    const baseCommit = await k.git.getCommit({ owner, repo: r, commit_sha: baseCommitSha })

    const tree = changes.map((c) =>
      c.delete
        ? { path: c.path, mode: '100644' as const, type: 'blob' as const, sha: null }
        : { path: c.path, mode: '100644' as const, type: 'blob' as const, content: c.content ?? '' },
    )

    try {
      const newTree = await k.git.createTree({ owner, repo: r, base_tree: baseCommit.data.tree.sha, tree })
      const newCommit = await k.git.createCommit({
        owner, repo: r, message: opts.message, tree: newTree.data.sha,
        parents: [baseCommitSha], author, committer: author,
      })
      await k.git.updateRef({ owner, repo: r, ref: `heads/${branch}`, sha: newCommit.data.sha })
      return { sha: newCommit.data.sha }
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string }
      if (e?.status === 422 || e?.status === 409) {
        throw Object.assign(
          new Error('The repository changed while saving (a rename could not be applied atomically). Refresh and try again.'),
          { code: 'conflict' as const },
        )
      }
      throw err
    }
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
    try {
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
    } catch (err: unknown) {
      const e = err as { status?: number }
      if (e?.status === 409 || e?.status === 422) {
        throw new Error(
          'This page was changed by someone else. Refresh the list and try again.',
        )
      }
      throw err
    }
  },
}
