/**
 * Abstraction layer over the alpinemar repo's content files.
 *
 * Two backends:
 *  - "fs"      → writes directly to the working tree (dev only; assumes admin/
 *                 lives inside the alpinemar repo and CONTENT_REPO_ROOT points
 *                 at the repo root).
 *  - "github"  → commits via the GitHub Contents API. Used in production where
 *                 the admin app is deployed on Vercel separate from the site.
 *
 * Both backends speak the same interface so server actions never branch.
 */

export interface RepoFile {
  /** Path relative to the repo root, e.g. `src/content/insights/foo.md`. */
  path: string
  /** UTF-8 contents. */
  content: string
  /** Opaque version pointer — git SHA for github backend, mtime for fs. */
  sha?: string
}

export interface ListResult {
  /** Path relative to the repo root. */
  path: string
  sha?: string
}

export interface WriteOptions {
  message: string
  /** Required for github backend to safely overwrite. */
  sha?: string
}

export interface ContentStore {
  /** Recursive list of all files under `dir` matching the optional extension. */
  list(dir: string, ext?: string): Promise<ListResult[]>
  /** Returns null when the file does not exist. */
  read(path: string): Promise<RepoFile | null>
  /**
   * Batch text read — fetches many files' contents in a single round-trip
   * (github backend uses one GraphQL query instead of N REST calls). Missing
   * files are simply absent from the returned map. Text files only.
   */
  readManyText(paths: string[]): Promise<Map<string, { content: string; sha?: string }>>
  /**
   * Binary-safe read (images etc.). Pass the blob sha when known (github
   * backend uses the blobs API which supports files > 1MB).
   */
  readRaw(path: string, sha?: string): Promise<{ content: Buffer; sha?: string } | null>
  /** Create or overwrite. Pass a string for text files (UTF-8) or a Buffer for binary (images). */
  write(path: string, content: string | Buffer, opts: WriteOptions): Promise<{ sha: string }>
  /** Delete a file. Idempotent. */
  remove(path: string, opts: { message: string; sha?: string }): Promise<void>
  /** Backend type, for diagnostics. */
  readonly backend: 'fs' | 'github'
}
