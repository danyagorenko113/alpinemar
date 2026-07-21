'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Copy,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  FolderPen,
  FolderX,
} from 'lucide-react'
import {
  uploadImage,
  deleteImage,
  setImageAlt,
  moveImage,
  createFolder,
  renameFolder,
  deleteFolder,
  type MediaItem,
} from '@/lib/actions/media'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { HelpTip } from '@/components/shared/help-tip'
import { cn, previewSrc, slugify, formatDate } from '@/lib/utils'

interface Props {
  initial: MediaItem[]
  initialFolders: string[]
}

const PAGE_SIZE = 24
const NEW_FOLDER = '__new__'

type SortOrder = 'newest' | 'oldest' | 'name-az' | 'name-za'

/**
 * Sortable timestamp for an image: manifest uploadedAt wins, then the /YYYY/
 * path segment, then nothing (sorts last for newest-first).
 */
function timeKey(item: MediaItem): string {
  if (item.uploadedAt) return item.uploadedAt
  const m = item.path.match(/\/((?:19|20)\d{2})\//)
  if (m) return `${m[1]}-01-01T00:00:00.000Z`
  return '0000-01-01T00:00:00.000Z'
}

/** Filename only, for A–Z sorting. */
function nameKey(item: MediaItem): string {
  return item.path.slice(item.path.lastIndexOf('/') + 1).toLowerCase()
}

export function MediaLibrary({ initial, initialFolders }: Props) {
  const [items, setItems] = useState(initial)
  const [folders, setFolders] = useState(initialFolders)
  const [pending, startTransition] = useTransition()
  const [q, setQ] = useState('')
  const [folderFilter, setFolderFilter] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [page, setPage] = useState(1)

  // Upload destination
  const [destFolder, setDestFolder] = useState(initialFolders.includes('blog') ? 'blog' : (initialFolders[0] ?? NEW_FOLDER))
  const [destNewName, setDestNewName] = useState('')

  // Detail panel
  const [detail, setDetail] = useState<MediaItem | null>(null)
  const [altDraft, setAltDraft] = useState('')
  const [toDelete, setToDelete] = useState<MediaItem | null>(null)

  // Folder management dialogs
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showRenameFolder, setShowRenameFolder] = useState(false)
  const [renameTo, setRenameTo] = useState('')
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState(false)

  const filtered = useMemo(() => {
    const needle = q.toLowerCase()
    const byName = sortOrder === 'name-az' || sortOrder === 'name-za'
    const dir = sortOrder === 'newest' || sortOrder === 'name-za' ? -1 : 1
    return items
      .filter((i) => {
        if (needle && !`${i.path} ${i.alt ?? ''}`.toLowerCase().includes(needle)) return false
        if (folderFilter && !i.path.startsWith(`public/images/${folderFilter}/`)) return false
        return true
      })
      .sort((a, b) => {
        if (byName) return dir * nameKey(a).localeCompare(nameKey(b))
        const cmp = timeKey(a).localeCompare(timeKey(b))
        if (cmp !== 0) return dir * cmp
        return dir * a.path.localeCompare(b.path)
      })
  }, [items, q, folderFilter, sortOrder])

  const folderFileCount = useMemo(
    () => (folderFilter ? items.filter((i) => i.path.startsWith(`public/images/${folderFilter}/`)).length : 0),
    [items, folderFilter],
  )

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
    const folder = destFolder === NEW_FOLDER ? slugify(destNewName) : destFolder
    if (!folder) {
      toast.error('Pick an upload folder (or name the new one)')
      return
    }
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await uploadImage(fd, { dir: `images/${folder}` })
        setItems((prev) => [{ url: res.url, path: res.path, uploadedAt: new Date().toISOString() }, ...prev])
        if (!folders.includes(folder)) {
          setFolders((prev) => [...prev, folder].sort())
          setDestFolder(folder)
          setDestNewName('')
        }
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
        setDetail((d) => (d?.path === item.path ? null : d))
        toast.success('Deleted')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Delete failed')
      }
    })
  }

  function openDetail(item: MediaItem) {
    setDetail(item)
    setAltDraft(item.alt ?? '')
  }

  function handleSaveAlt() {
    if (!detail) return
    const target = detail
    startTransition(async () => {
      try {
        await setImageAlt(target.path, altDraft)
        const alt = altDraft.trim() || undefined
        setItems((prev) => prev.map((i) => (i.path === target.path ? { ...i, alt } : i)))
        setDetail((d) => (d?.path === target.path ? { ...d, alt } : d))
        toast.success('Alt text saved')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  function handleMove(item: MediaItem, toFolder: string) {
    if (!toFolder) return
    startTransition(async () => {
      try {
        const res = await moveImage(item.path, toFolder)
        setItems((prev) => prev.map((i) => (i.path === item.path ? { ...i, path: res.path, url: res.url } : i)))
        setDetail((d) => (d?.path === item.path ? { ...d, path: res.path, url: res.url } : d))
        toast.success(`Moved to images/${toFolder}/`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Move failed')
      }
    })
  }

  function handleCreateFolder() {
    const name = slugify(newFolderName)
    if (!name) {
      toast.error('Folder name is required')
      return
    }
    startTransition(async () => {
      try {
        const created = await createFolder(name)
        if (!folders.includes(created)) setFolders((prev) => [...prev, created].sort())
        setShowNewFolder(false)
        setNewFolderName('')
        setDestFolder(created)
        toast.success(`Folder images/${created}/ created`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Create failed')
      }
    })
  }

  function handleRenameFolder() {
    const from = folderFilter
    const to = slugify(renameTo)
    if (!from || !to) {
      toast.error('New folder name is required')
      return
    }
    startTransition(async () => {
      try {
        const dest = await renameFolder(from, to)
        setItems((prev) =>
          prev.map((i) =>
            i.path.startsWith(`public/images/${from}/`)
              ? {
                  ...i,
                  path: i.path.replace(`public/images/${from}/`, `public/images/${dest}/`),
                  url: i.url.replace(`/images/${from}/`, `/images/${dest}/`),
                }
              : i,
          ),
        )
        setFolders((prev) => [...prev.filter((f) => f !== from), dest].sort())
        setFolderFilter(dest)
        if (destFolder === from) setDestFolder(dest)
        setShowRenameFolder(false)
        setRenameTo('')
        toast.success(`Renamed to images/${dest}/`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Rename failed')
      }
    })
  }

  function handleDeleteFolder() {
    const name = folderFilter
    if (!name) return
    startTransition(async () => {
      try {
        const count = await deleteFolder(name)
        setItems((prev) => prev.filter((i) => !i.path.startsWith(`public/images/${name}/`)))
        setFolders((prev) => prev.filter((f) => f !== name))
        setFolderFilter('')
        if (destFolder === name) setDestFolder(folders.find((f) => f !== name) ?? NEW_FOLDER)
        toast.success(`Folder images/${name}/ deleted (${count} files)`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Delete failed')
      }
    })
  }

  return (
    <>
      <div className="rounded-lg border bg-card p-4 mb-4 space-y-3">
        {/* Upload row */}
        <div className="flex items-center gap-1 text-xs font-medium text-navy-600">
          Upload destination
          <HelpTip title="Folders & uploads">
            Pick the folder new uploads go to — or choose &ldquo;New folder…&rdquo; to create
            one on the fly. Manage folders (create, rename, delete) with the buttons below;
            click any image to edit its ALT text or rename the file.
          </HelpTip>
        </div>
        <div className="grid sm:grid-cols-[1fr_auto] gap-2">
          <div className="flex gap-2">
            <select
              value={destFolder}
              onChange={(e) => setDestFolder(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm flex-1"
              title="Upload destination"
            >
              {folders.map((f) => (
                <option key={f} value={f}>images/{f}/</option>
              ))}
              <option value={NEW_FOLDER}>New folder…</option>
            </select>
            {destFolder === NEW_FOLDER && (
              <Input
                value={destNewName}
                onChange={(e) => setDestNewName(e.target.value)}
                placeholder="new-folder-name"
                className="flex-1"
              />
            )}
          </div>
          <label className={cn(
            'inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:bg-scooter-dark transition-colors',
            pending && 'pointer-events-none opacity-60',
          )}>
            <Upload className="h-4 w-4" />
            {pending ? 'Working…' : 'Upload image'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="sr-only"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </label>
        </div>

        {/* Filter row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); resetPage() }}
            placeholder="Search by filename, path or alt text…"
            className="flex-1"
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
          <select
            value={sortOrder}
            onChange={(e) => { setSortOrder(e.target.value as SortOrder); resetPage() }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            title="Sort order"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name-az">Name A–Z</option>
            <option value="name-za">Name Z–A</option>
          </select>
        </div>

        {/* Folder management + counters */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setShowNewFolder(true)} disabled={pending}>
              <FolderPlus className="h-3.5 w-3.5" />
              New folder
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setRenameTo(folderFilter); setShowRenameFolder(true) }}
              disabled={pending || !folderFilter}
              title={folderFilter ? `Rename images/${folderFilter}/` : 'Select a folder first'}
            >
              <FolderPen className="h-3.5 w-3.5" />
              Rename
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteFolder(true)}
              disabled={pending || !folderFilter}
              className="text-destructive hover:text-destructive"
              title={folderFilter ? `Delete images/${folderFilter}/` : 'Select a folder first'}
            >
              <FolderX className="h-3.5 w-3.5" />
              Delete folder
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            <span>{filtered.length} images{filtered.length !== items.length && <> · filtered from {items.length}</>}</span>
            {totalPages > 1 && <span> · Page {safePage} of {totalPages}</span>}
          </div>
        </div>
      </div>

      {pageItems.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">No images.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {pageItems.map((item) => (
              <div key={item.path} className="rounded-lg border bg-card overflow-hidden group">
                <button
                  type="button"
                  onClick={() => openDetail(item)}
                  className="aspect-square bg-navy-50 overflow-hidden block w-full cursor-pointer"
                  title="Open details"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewSrc(item.url)} alt={item.alt ?? ''} className="w-full h-full object-cover" loading="lazy" />
                </button>
                <div className="p-2.5 space-y-2">
                  <div className="text-[10px] font-mono text-muted-foreground line-clamp-2 break-all" title={item.path}>
                    {item.path.replace(/^public\//, '')}
                  </div>
                  {!item.alt && (
                    <div className="text-[10px] text-amber-600">Missing alt text</div>
                  )}
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

      {/* Image detail panel */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">Image details</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="rounded-md border bg-navy-50 overflow-hidden flex items-center justify-center max-h-[280px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewSrc(detail.url)} alt={detail.alt ?? ''} className="max-h-[280px] object-contain" />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-mono text-muted-foreground break-all">{detail.path}</div>
                {detail.uploadedAt && (
                  <div className="text-[11px] text-muted-foreground">Uploaded {formatDate(detail.uploadedAt)}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input value={detail.url} readOnly className="text-xs font-mono flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={() => copy(detail.url)}>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="detail-alt">
                  Alt text
                  <HelpTip title="One ALT, used everywhere">
                    Saved to the central media manifest — pages that embed this image pick
                    the ALT up automatically. Article covers and in-article images can still
                    override it in their own editors.
                  </HelpTip>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="detail-alt"
                    value={altDraft}
                    onChange={(e) => setAltDraft(e.target.value)}
                    placeholder="Describe the image for screen readers & SEO"
                    className="flex-1"
                  />
                  <Button type="button" size="sm" onClick={handleSaveAlt} disabled={pending || altDraft === (detail.alt ?? '')}>
                    {pending ? 'Saving…' : 'Save'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Stored in src/data/media-meta.json — pre-fills the alt field wherever this image is used.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-move">
                  Move to folder
                  <HelpTip title="Reorganize files">
                    Moves this image to another folder under public/images/. The file&rsquo;s
                    URL changes, so update any page that hard-codes the old URL. Alt text and
                    upload date move with it.
                  </HelpTip>
                </Label>
                <select
                  id="detail-move"
                  value={detail.path.replace(/^public\/images\/([^/]+)\/.*$/, '$1')}
                  onChange={(e) => handleMove(detail, e.target.value)}
                  disabled={pending}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {folders.map((f) => (
                    <option key={f} value={f}>images/{f}/</option>
                  ))}
                </select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setToDelete(detail)}
                  disabled={pending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete image
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New folder dialog */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">New folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="new-folder">Folder name</Label>
            <Input
              id="new-folder"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. case-studies"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Created as public/images/{slugify(newFolderName) || '…'}/ (held open by a .gitkeep).
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNewFolder(false)} disabled={pending}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={pending || !slugify(newFolderName)}>
              {pending ? 'Creating…' : 'Create folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename folder dialog */}
      <Dialog open={showRenameFolder} onOpenChange={setShowRenameFolder}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Rename images/{folderFilter}/</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rename-folder">New name</Label>
            <Input
              id="rename-folder"
              value={renameTo}
              onChange={(e) => setRenameTo(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Moves all {folderFileCount} file{folderFileCount === 1 ? '' : 's'} — pages referencing the old paths will need updating.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRenameFolder(false)} disabled={pending}>Cancel</Button>
            <Button onClick={handleRenameFolder} disabled={pending || !slugify(renameTo) || slugify(renameTo) === folderFilter}>
              {pending ? 'Renaming…' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <ConfirmDialog
        open={confirmDeleteFolder}
        onOpenChange={setConfirmDeleteFolder}
        title={`Delete folder images/${folderFilter}/?`}
        description={`This permanently deletes the folder and all ${folderFileCount} image${folderFileCount === 1 ? '' : 's'} inside it. Pages still referencing them will break.`}
        variant="destructive"
        confirmLabel={`Delete ${folderFileCount} file${folderFileCount === 1 ? '' : 's'}`}
        loadingLabel="Deleting…"
        onConfirm={handleDeleteFolder}
      />
    </>
  )
}
