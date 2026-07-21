'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ExternalLink, Eye, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RichTextEditor } from '@/components/editor/rich-text-editor'
import { HelpTip } from '@/components/shared/help-tip'
import { ImageUploader } from '@/components/shared/image-uploader'
import { TagInput } from '@/components/shared/tag-input'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import { saveBlogPost, deleteBlogPost, type BlogPost, type BlogFrontmatter } from '@/lib/actions/blog'
import { slugify, formatDate, previewSrc, rewriteRelativeUrls } from '@/lib/utils'
import { toDateString, todayDateString } from '@/lib/store/markdown'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alpinemar.vercel.app'

const NEW_CATEGORY = '__new__'
const CUSTOM_AUTHOR = '__custom__'

interface BlogFormProps {
  initial?: BlogPost
  tagSuggestions: string[]
  categorySuggestions: string[]
  /** Names from the authors collection. Empty → free-text author input. */
  authorOptions: string[]
  /**
   * Per-site overrides. Defaults target the MAIN site so existing callers are
   * unaffected; the IT admin passes its own base path, site URL, and actions.
   */
  basePath?: string
  siteUrl?: string
  saveAction?: typeof saveBlogPost
  deleteAction?: typeof deleteBlogPost
  /** Public root for image uploads: 'it-site/public' for the IT site. */
  uploadRoot?: string
  /** Show the "Featured on the blog home" toggle (IT site only). */
  showFeatured?: boolean
  /** Show the canonical-URL override (hidden on IT — no canonical in schema). */
  showCanonical?: boolean
}

const empty: BlogPost = {
  slug: '',
  title: '',
  excerpt: '',
  date: toDateString(new Date()),
  author: 'The Alpine Mar editorial team',
  cover: '',
  coverAlt: '',
  category: '',
  tags: [],
  status: 'published',
  seo: { title: '', description: '', canonical: '' },
  body: '',
}

export function BlogForm({
  initial,
  tagSuggestions,
  categorySuggestions,
  authorOptions,
  basePath = '/blog',
  siteUrl = SITE_URL,
  saveAction = saveBlogPost,
  deleteAction = deleteBlogPost,
  uploadRoot,
  showFeatured = false,
  showCanonical = true,
}: BlogFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [post, setPost] = useState<BlogPost>(initial ?? empty)
  const [slugTouched, setSlugTouched] = useState(!!initial)
  const [showPreview, setShowPreview] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dirty, setDirty] = useState(false)
  // Explicit `updated` override (YYYY-MM-DD). Empty = stamped on save.
  const [updatedOverride, setUpdatedOverride] = useState('')
  const [newCategory, setNewCategory] = useState(false)
  const [customAuthor, setCustomAuthor] = useState(
    () => !!initial?.author && authorOptions.length > 0 && !authorOptions.includes(initial.author),
  )

  useUnsavedChanges(dirty)

  function update<K extends keyof BlogPost>(key: K, value: BlogPost[K]) {
    setPost((p) => ({ ...p, [key]: value }))
    setDirty(true)
  }

  function updateSeo<K extends keyof NonNullable<BlogFrontmatter['seo']>>(
    key: K,
    value: NonNullable<BlogFrontmatter['seo']>[K],
  ) {
    setPost((p) => ({ ...p, seo: { ...(p.seo ?? {}), [key]: value } }))
    setDirty(true)
  }

  function handleTitleChange(v: string) {
    update('title', v)
    if (!slugTouched) update('slug', slugify(v))
  }

  function handleSave() {
    if (!post.title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!post.slug.trim()) {
      toast.error('Slug is required')
      return
    }
    startTransition(async () => {
      try {
        const fm: BlogFrontmatter = {
          title: post.title.trim(),
          excerpt: post.excerpt.trim(),
          date: post.date || todayDateString(),
          author: post.author?.trim() || undefined,
          cover: post.cover?.trim() || undefined,
          coverAlt: post.coverAlt?.trim() || undefined,
          category: post.category?.trim() || undefined,
          tags: post.tags,
          status: post.status,
          // Only sent when explicitly overridden; server stamps otherwise.
          // Bare YYYY-MM-DD — no local-time datetime round-trip (Astro coerces it).
          updated: updatedOverride || undefined,
          seo: post.seo,
          ...(showFeatured ? { featured: post.featured || undefined } : {}),
        }
        const res = await saveAction({ slug: post.slug, frontmatter: fm, body: post.body, sha: post.sha, originalSlug: initial?.slug })
        toast.success(initial ? 'Saved' : 'Created')
        setDirty(false)
        if (!initial || res.slug !== initial.slug) {
          router.push(`${basePath}/${res.slug}`)
        } else {
          // Adopt the new blob SHA so a second save in the same session doesn't
          // 422 against a stale SHA.
          setPost((p) => ({ ...p, sha: res.sha }))
          router.refresh()
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  function handleDelete() {
    if (!initial) return
    startTransition(async () => {
      try {
        await deleteAction(initial.slug, initial.sha)
        toast.success('Deleted')
        setDirty(false)
        router.push(basePath)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Delete failed')
      }
    })
  }

  // Current category may predate the suggestions list — keep it selectable.
  const categoryChoices = [...categorySuggestions]
  if (post.category && !categoryChoices.includes(post.category)) categoryChoices.push(post.category)
  categoryChoices.sort()

  const canonicalPlaceholder = `${siteUrl}/blog/${post.slug || '…'}/`

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 pb-24">
        {/* MAIN COLUMN */}
        <div className="space-y-5 min-w-0">
          <section className="rounded-lg border bg-card p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={post.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Article title"
                className="text-lg h-11"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={post.slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    update('slug', slugify(e.target.value))
                  }}
                  placeholder="my-article"
                />
                <p className="text-xs text-muted-foreground">URL: /blog/{post.slug || '…'}/</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={post.date}
                  onChange={(e) => update('date', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="excerpt">Excerpt *</Label>
              <Textarea
                id="excerpt"
                value={post.excerpt}
                onChange={(e) => update('excerpt', e.target.value)}
                placeholder="One-paragraph summary shown in listings & meta description."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{post.excerpt.length} chars</p>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Body *
                <HelpTip title="Tables, images & formatting">
                  Tables render here exactly like on the live site — insert one with the
                  table button; click inside a table for row/column/header controls. Images
                  ask for ALT text on upload, and clicking any image shows an &ldquo;Edit
                  alt&rdquo; button in the toolbar. Pasting from Google Docs keeps headings,
                  lists, links, and tables.
                </HelpTip>
              </Label>
              <span className="text-xs text-muted-foreground">
                Paste from Google Docs — formatting is preserved
              </span>
            </div>
            <RichTextEditor
              value={post.body}
              onChange={(html) => update('body', html)}
              placeholder="Start writing the article…"
              uploadDir="images/blog"
              uploadRoot={uploadRoot}
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-4">
            <h2 className="text-base font-semibold">SEO</h2>
            <p className="text-xs text-muted-foreground -mt-2">
              Optional overrides — leave blank to use Title / Excerpt.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="seo-title">SEO title</Label>
              <Input
                id="seo-title"
                value={post.seo?.title ?? ''}
                onChange={(e) => updateSeo('title', e.target.value)}
                placeholder="Falls back to article title"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seo-description">Meta description</Label>
              <Textarea
                id="seo-description"
                value={post.seo?.description ?? ''}
                onChange={(e) => updateSeo('description', e.target.value)}
                rows={2}
                placeholder="Falls back to excerpt"
              />
            </div>
            {showCanonical && (
              <div className="space-y-1.5">
                <Label htmlFor="seo-canonical">
                  Canonical URL
                  <HelpTip title="How canonical works">
                    Every page gets a self-referencing canonical tag automatically. Only fill
                    this to point search engines at a different URL (e.g. if this article was
                    first published elsewhere).
                  </HelpTip>
                </Label>
                <Input
                  id="seo-canonical"
                  value={post.seo?.canonical ?? ''}
                  onChange={(e) => updateSeo('canonical', e.target.value)}
                  placeholder={canonicalPlaceholder}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank for the self-referencing default shown above.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={post.status}
              onChange={(e) => update('status', e.target.value as BlogPost['status'])}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Drafts don't appear in blog listings on the live site.
            </p>
          </section>

          {showFeatured && (
            <section className="rounded-lg border bg-card p-5 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!post.featured}
                  onChange={(e) => update('featured', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-input"
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium">
                    Featured on the blog home
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Pins this post to the large Featured card at the top of /blog/.
                    If several are checked, the newest wins. Leave all off to fall
                    back to the newest Cybersecurity post.
                  </span>
                </span>
              </label>
            </section>
          )}

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label>
              Cover image
              <HelpTip title="Where this shows">
                The banner at the top of the article and the image used when the post is
                shared on social. Set its ALT text right below the upload — it also feeds
                the Media library.
              </HelpTip>
            </Label>
            <ImageUploader
              value={post.cover ?? ''}
              onChange={(url) => update('cover', url)}
              uploadDir="images/blog"
              uploadRoot={uploadRoot}
              alt={post.coverAlt ?? ''}
              onAltChange={(v) => update('coverAlt', v)}
              altLabel="Cover alt text"
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label htmlFor="category">
              Category
              <HelpTip title="One category per post">
                Mirrors the original site: each post belongs to exactly one category
                (imported from WordPress). Category is the primary way readers browse — it's
                the chip on every blog card, the filter bar on the blog home, and its own
                /blog/category/… page — and it drives the &ldquo;Read next&rdquo; sidebar.
                Tags below are a separate, optional layer shown at the bottom of the article.
              </HelpTip>
            </Label>
            <select
              id="category"
              value={newCategory ? NEW_CATEGORY : (post.category ?? '')}
              onChange={(e) => {
                if (e.target.value === NEW_CATEGORY) {
                  setNewCategory(true)
                  update('category', '')
                } else {
                  setNewCategory(false)
                  update('category', e.target.value)
                }
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— None —</option>
              {categoryChoices.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value={NEW_CATEGORY}>+ New category…</option>
            </select>
            {newCategory && (
              <Input
                value={post.category ?? ''}
                onChange={(e) => update('category', e.target.value)}
                placeholder="New category name"
                autoFocus
              />
            )}
            <p className="text-xs text-muted-foreground">
              One category per post — mirrors the original site's convention.
            </p>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label>
              Tags
              <HelpTip title="Tags vs category">
                Optional keywords rendered at the bottom of the article; each tag also gets
                a topic page. Use the single Category above for the primary classification.
              </HelpTip>
            </Label>
            <TagInput
              value={post.tags}
              onChange={(tags) => update('tags', tags)}
              suggestions={tagSuggestions}
              placeholder="Add tag and press Enter"
            />
            <p className="text-xs text-muted-foreground">
              Tags surface as topic pages at /blog/topic/&lt;tag&gt;/
            </p>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="author">
                Author
                <HelpTip title="Authors & bios">
                  Pick from the list managed under <strong>Authors</strong> in the sidebar —
                  the article automatically renders that author&rsquo;s photo and bio at the
                  bottom. Add or edit bios on the Authors page.
                </HelpTip>
              </Label>
              {authorOptions.length > 0 ? (
                <>
                  <select
                    id="author"
                    value={customAuthor ? CUSTOM_AUTHOR : (post.author ?? '')}
                    onChange={(e) => {
                      if (e.target.value === CUSTOM_AUTHOR) {
                        setCustomAuthor(true)
                        update('author', '')
                      } else {
                        setCustomAuthor(false)
                        update('author', e.target.value)
                      }
                    }}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">— None —</option>
                    {authorOptions.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                    <option value={CUSTOM_AUTHOR}>Custom…</option>
                  </select>
                  {customAuthor && (
                    <Input
                      value={post.author ?? ''}
                      onChange={(e) => update('author', e.target.value)}
                      placeholder="Custom byline"
                      autoFocus
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    Names come from the Authors collection.
                  </p>
                </>
              ) : (
                <Input
                  id="author"
                  value={post.author ?? ''}
                  onChange={(e) => update('author', e.target.value)}
                  placeholder="The Alpine Mar editorial team"
                />
              )}
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="updated-override">
                Updated date
                <HelpTip title="Publish vs updated dates">
                  The article shows both its publish date and &ldquo;Updated on&rdquo; date.
                  Updated is stamped automatically on every save; set a date here only to
                  control what displays instead.
                </HelpTip>
              </Label>
              <Input
                id="updated-override"
                type="date"
                value={updatedOverride}
                onChange={(e) => {
                  setUpdatedOverride(e.target.value)
                  setDirty(true)
                }}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to stamp the save time automatically.
                {initial?.updated && <> Currently {formatDate(initial.updated)}.</>}
              </p>
            </div>
          </section>

          {initial && (
            <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 space-y-2">
              <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
              <p className="text-xs text-muted-foreground">
                Removes the .md file and triggers a site rebuild.
              </p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                disabled={pending}
              >
                <Trash2 className="h-4 w-4" />
                Delete post
              </Button>
            </section>
          )}
        </aside>
      </div>

      {/* STICKY ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur md:pl-60">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="text-xs text-muted-foreground">
            {initial ? (
              <>
                Editing <span className="font-mono text-navy-700">{initial.slug}</span> · last saved{' '}
                {formatDate(initial.date)}
                {dirty && <span className="ml-2 text-amber-600">• Unsaved changes</span>}
              </>
            ) : (
              <>New post{dirty && <span className="ml-2 text-amber-600">• Unsaved changes</span>}</>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            {initial && (
              <Button asChild variant="outline">
                <a href={`${siteUrl}/blog/${initial.slug}/`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  View on site
                </a>
              </Button>
            )}
            <Button onClick={handleSave} disabled={pending}>
              <Save className="h-4 w-4" />
              {pending ? 'Saving…' : initial ? 'Save changes' : 'Publish'}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          {post.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc(post.cover)} alt={post.coverAlt ?? ''} className="w-full max-h-[320px] object-cover" />
          )}
          <div className="px-8 py-8 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-scooter-dark mb-2">
                {formatDate(post.date)}
                {post.category && <> · {post.category}</>}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight leading-tight">{post.title || 'Untitled'}</h1>
              {post.excerpt && <p className="mt-3 text-base text-navy-500">{post.excerpt}</p>}
            </div>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((t) => (
                  <Badge key={t} variant="muted">{t}</Badge>
                ))}
              </div>
            )}
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: rewriteRelativeUrls(post.body) || '<p><em>No content yet</em></p>' }} />
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${initial?.title}"?`}
        description="The .md file will be removed from the repo. This cannot be undone from the admin."
        variant="destructive"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        onConfirm={handleDelete}
      />
    </>
  )
}
