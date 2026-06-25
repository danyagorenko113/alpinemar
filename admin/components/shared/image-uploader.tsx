'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'
import { uploadImage } from '@/lib/actions/media'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageUploaderProps {
  value: string
  onChange: (url: string) => void
  uploadDir?: string
  className?: string
}

export function ImageUploader({ value, onChange, uploadDir, className }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  async function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { url } = await uploadImage(fd, { dir: uploadDir })
      onChange(url)
      toast.success('Image uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="max-h-56 rounded-md border bg-navy-50" />
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
          placeholder="Or paste an image URL (e.g. /images/blog/foo.jpg)"
          className="text-xs"
        />
      </div>
    </div>
  )
}
