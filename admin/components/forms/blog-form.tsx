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
import { ImageUploader } from '@/components/shared/image-uploader'
import { TagInput } from '@/components/shared/tag-input'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import { saveBlogPost, deleteBlogPost, type BlogPost, type BlogFrontmatter } from '@/lib/actions/blog'
import { slugify, formatDate } from '@/lib/utils'
import { toDateString } from '@/lib/store/markdown'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alpinemar.com'

interface BlogFormProps {
  initial?: BlogPost
  tagSuggestions: string[]
}

const empty: BlogPost = {
  slug: '',
  title: '',
  excerpt: '',
  date: toDateString(new Date()),
  author: 'The Alpine Mar editorial team',
  cover: '',
  tags: [],
  status: 'published',
  seo: { title: '', description: '' },
  body: '',
}

export function BlogForm({ initial, tagSuggestions }: BlogFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [post, setPost] = useState<BlogPost>(initial ?? empty)
  const [slugTouched, setSlugTouched] = useState(!!initial)
  const [showPreview, setShowPreview] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dirty, setDirty] = useState(false)

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
          date: post.date || toDateString(new Date()),
          author: post.author?.trim() || undefined,
          cover: post.cover?.trim() || undefined,
          tags: post.tags,
          status: post.status,
          seo: post.seo,
        }
        const res = await saveBlogPost({ slug: post.slug, frontmatter: fm, body: post.body, sha: post.sha })
        toast.success(initial ? 'Saved' : 'Created')
        setDirty(false)
        if (!initial || res.slug !== initial.slug) {
          router.push(`/blog/${res.slug}`)
        } else {
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
        await deleteBlogPost(initial.slug, initial.sha)
        toast.success('Deleted')
        setDirty(false)
        router.push('/blog')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Delete failed')
      }
    })
  }

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
              <Label className="text-base font-semibold">Body *</Label>
              <span className="text-xs text-muted-foreground">
                Paste from Google Docs — formatting is preserved
              </span>
            </div>
            <RichTextEditor
              value={post.body}
              onChange={(html) => update('body', html)}
              placeholder="Start writing the article…"
              uploadDir="images/blog"
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

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label>Cover image</Label>
            <ImageUploader value={post.cover ?? ''} onChange={(url) => update('cover', url)} uploadDir="images/blog" />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label>Tags</Label>
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
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={post.author ?? ''}
                onChange={(e) => update('author', e.target.value)}
                placeholder="The Alpine Mar editorial team"
              />
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
                <a href={`${SITE_URL}/blog/${initial.slug}/`} target="_blank" rel="noopener noreferrer">
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
            <img src={post.cover} alt="" className="w-full max-h-[320px] object-cover" />
          )}
          <div className="px-8 py-8 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-scooter-dark mb-2">{formatDate(post.date)}</p>
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
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.body || '<p><em>No content yet</em></p>' }} />
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
