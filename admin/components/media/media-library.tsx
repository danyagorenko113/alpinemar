'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Copy, Trash2, Upload, ChevronLeft, ChevronRight } from 'lucide-react'
import { uploadImage, deleteImage } from '@/lib/actions/media'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { cn } from '@/lib/utils'

interface MediaItem {
  url: string
  path: string
}

interface Props {
  initial: MediaItem[]
}

const PAGE_SIZE = 24

export function MediaLibrary({ initial }: Props) {
  const [items, setItems] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [q, setQ] = useState('')
  const [folderFilter, setFolderFilter] = useState('')
  const [toDelete, setToDelete] = useState<MediaItem | null>(null)
  const [dir, setDir] = useState('images/blog')
  const [page, setPage] = useState(1)

  // Extract top-level folders under public/images/ for the filter dropdown.
  // Path shape: public/images/<folder>/<year>/<file> — we surface the first
  // segment after `images/`.
  const folders = useMemo(() => {
    const set = new Set<string>()
    for (const it of items) {
      const rel = it.path.replace(/^public\/images\//, '')
      const seg = rel.split('/')[0]
      if (seg && !seg.includes('.')) set.add(seg)
    }
    return [...set].sort()
  }, [items])

  const filtered = useMemo(() => {
    const needle = q.toLowerCase()
    return items.filter((i) => {
      if (needle && !i.path.toLowerCase().includes(needle)) return false
      if (folderFilter && !i.path.startsWith(`public/images/${folderFilter}/`)) return false
      return true
    })
  }, [items, q, folderFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)

  function resetPage() {
    setPage(1)
  }

  async function handleUpload(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await uploadImage(fd, { dir })
        setItems((prev) => [{ url: res.url, path: res.path }, ...prev])
        toast.success('Uploaded')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Upload failed')
      }
    })
  }

  function copy(url: string) {
    navigator.clipboard.writeText(url)
    toast.success('URL copied')
  }

  function handleDelete(item: MediaItem) {
    startTransition(async () => {
      try {
        await deleteImage(item.path)
        setItems((prev) => prev.filter((i) => i.path !== item.path))
        toast.success('Deleted')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Delete failed')
      }
    })
  }

  return (
    <>
      <div className="rounded-lg border bg-card p-4 mb-4 space-y-3">
        <div className="grid sm:grid-cols-[1fr_auto] gap-2">
          <Input
            value={dir}
            onChange={(e) => setDir(e.target.value)}
            placeholder="Upload destination — e.g. images/blog"
          />
          <label className={cn(
            'inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:bg-scooter-dark transition-colors',
            pending && 'pointer-events-none opacity-60',
          )}>
            <Upload className="h-4 w-4" />
            {pending ? 'Uploading…' : 'Upload image'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
              className="sr-only"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </label>
        </div>
        <div className="grid sm:grid-cols-[1fr_auto] gap-2">
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); resetPage() }}
            placeholder="Search by filename or path…"
          />
          <select
            value={folderFilter}
            onChange={(e) => { setFolderFilter(e.target.value); resetPage() }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[160px]"
          >
            <option value="">All folders</option>
            {folders.map((f) => (
              <option key={f} value={f}>images/{f}/</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{filtered.length} images{filtered.length !== items.length && <> · filtered from {items.length}</>}</span>
          {totalPages > 1 && <span>Page {safePage} of {totalPages}</span>}
        </div>
      </div>

      {pageItems.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">No images.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {pageItems.map((item) => (
              <div key={item.path} className="rounded-lg border bg-card overflow-hidden group">
                <div className="aspect-square bg-navy-50 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-2.5 space-y-2">
                  <div className="text-[10px] font-mono text-muted-foreground line-clamp-2 break-all" title={item.path}>
                    {item.path.replace(/^public\//, '')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => copy(item.url)}>
                      <Copy className="h-3 w-3" />
                      Copy URL
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setToDelete(item)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                {safePage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete image?"
        description={toDelete ? `This removes ${toDelete.path} from the repo. Pages still referencing it will break.` : ''}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={() => {
          if (toDelete) handleDelete(toDelete)
        }}
      />
    </>
  )
}
