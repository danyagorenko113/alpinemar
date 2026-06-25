'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Copy, Trash2, Upload } from 'lucide-react'
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

export function MediaLibrary({ initial }: Props) {
  const [items, setItems] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [q, setQ] = useState('')
  const [toDelete, setToDelete] = useState<MediaItem | null>(null)
  const [dir, setDir] = useState('images/blog')

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

  const filtered = items.filter((i) => i.path.toLowerCase().includes(q.toLowerCase()))

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
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by path…" />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">No images.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((item) => (
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
