'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'
import { uploadImage, getImageMetaByUrl } from '@/lib/actions/media'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn, previewSrc } from '@/lib/utils'

interface ImageUploaderProps {
  value: string
  onChange: (url: string) => void
  uploadDir?: string
  className?: string
  /** Current ALT text. Rendered as an input when `onAltChange` is provided. */
  alt?: string
  /**
   * When provided, an ALT text input renders below the uploader. Uploads save
   * the alt into the media manifest, and pasting a library URL that already
   * has a manifest alt pre-fills it.
   */
  onAltChange?: (alt: string) => void
  altLabel?: string
  /** Public root to upload into: 'public' (main site) or 'it-site/public' (IT site). */
  uploadRoot?: string
}

export function ImageUploader({ value, onChange, uploadDir, className, alt, onAltChange, altLabel = 'Alt text', uploadRoot }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  async function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { url } = await uploadImage(fd, { dir: uploadDir, alt: alt?.trim() || undefined, root: uploadRoot })
      onChange(url)
      toast.success('Image uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  /** Pasted a library URL? Pull its manifest alt if we don't have one yet. */
  async function handleUrlBlur() {
    if (!onAltChange || !value || alt?.trim()) return
    try {
      const meta = await getImageMetaByUrl(value)
      if (meta?.alt) onAltChange(meta.alt)
    } catch {
      // Lookup is best-effort; ignore failures.
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewSrc(value)} alt={alt ?? ''} className="max-h-56 rounded-md border bg-navy-50" />
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-md"
            title="Remove"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            handleFiles(e.dataTransfer.files)
          }}
          className={cn(
            'flex flex-col items-center justify-center rounded-md border-2 border-dashed bg-navy-50/50 px-6 py-10 text-center cursor-pointer transition-colors',
            'hover:border-scooter hover:bg-navy-50',
            dragging && 'border-scooter bg-navy-50',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          <Upload className="h-6 w-6 text-navy-400" />
          <p className="mt-2 text-sm font-medium text-navy-700">
            {uploading ? 'Uploading…' : 'Drop image here or click to upload'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, AVIF, GIF — up to 8MB</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      )}
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleUrlBlur}
          placeholder="Or paste an image URL (e.g. /images/blog/foo.jpg)"
          className="text-xs"
        />
      </div>
      {onAltChange && (
        <div className="space-y-1.5">
          <Label className="text-xs">{altLabel}</Label>
          <Input
            value={alt ?? ''}
            onChange={(e) => onAltChange(e.target.value)}
            placeholder="Describe the image for screen readers & SEO"
            className="text-xs"
          />
        </div>
      )}
    </div>
  )
}
