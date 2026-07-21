'use client'

import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TableKit } from '@tiptap/extension-table'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback, useEffect, useState } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  ImagePlus,
  Quote,
  Undo2,
  Redo2,
  Code,
  Minus,
  Table as TableIcon,
  Captions,
} from 'lucide-react'
import { uploadImage } from '@/lib/actions/media'
import { cn, previewSrc } from '@/lib/utils'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  uploadDir?: string
  /** Public root for image uploads: 'public' (main) or 'it-site/public' (IT). */
  uploadRoot?: string
}

function ToolbarBtn({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'h-8 w-8 inline-flex items-center justify-center rounded text-navy-600 transition-colors',
        'hover:bg-navy-100 hover:text-navy-900',
        'disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed',
        active && 'bg-navy-900 text-white hover:bg-navy-900 hover:text-white',
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-navy-200" />
}

function TableCtl({ danger, onClick, children }: { danger?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded px-2 py-1 transition-colors',
        danger ? 'text-red-600 hover:bg-red-50' : 'text-navy-600 hover:bg-navy-100 hover:text-navy-900',
      )}
    >
      {children}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Link dialog — replaces window.prompt() with a proper modal.
// ─────────────────────────────────────────────────────────────────────────────

interface LinkDialogProps {
  open: boolean
  initialUrl: string
  initialNewTab: boolean
  onCancel: () => void
  onApply: (url: string, newTab: boolean) => void
  onRemove?: () => void
}

function LinkDialog({ open, initialUrl, initialNewTab, onCancel, onApply, onRemove }: LinkDialogProps) {
  const [url, setUrl] = useState(initialUrl)
  const [newTab, setNewTab] = useState(initialNewTab)

  useEffect(() => {
    if (open) {
      setUrl(initialUrl)
      setNewTab(initialNewTab)
    }
  }, [open, initialUrl, initialNewTab])

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialUrl ? 'Edit link' : 'Add link'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://alpinemar.com/…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); if (url.trim()) onApply(url.trim(), newTab) }
              }}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={newTab} onChange={(e) => setNewTab(e.target.checked)} />
            Open in new tab
          </label>
        </div>
        <DialogFooter className="gap-2">
          {onRemove && (
            <Button type="button" variant="destructive" onClick={onRemove}>
              Remove link
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="button" onClick={() => onApply(url.trim(), newTab)} disabled={!url.trim()}>
            {initialUrl ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Image alt-text dialog — asks for alt after upload succeeds.
// Blocks the insert until the user gives a description (or explicitly marks
// it decorative).
// ─────────────────────────────────────────────────────────────────────────────

interface AltDialogProps {
  open: boolean
  previewUrl: string
  suggestedAlt: string
  confirmLabel?: string
  onCancel: () => void
  onApply: (alt: string) => void
}

function AltDialog({ open, previewUrl, suggestedAlt, confirmLabel = 'Insert', onCancel, onApply }: AltDialogProps) {
  const [alt, setAlt] = useState(suggestedAlt)
  const [decorative, setDecorative] = useState(false)

  useEffect(() => {
    if (open) {
      setAlt(suggestedAlt)
      setDecorative(false)
    }
  }, [open, suggestedAlt])

  function apply() {
    onApply(decorative ? '' : alt.trim())
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Describe this image</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc(previewUrl)}
              alt=""
              className="max-h-40 w-full rounded-md object-contain border bg-navy-50"
            />
          )}
          <div className="space-y-1.5">
            <Label htmlFor="alt-text">Alt text</Label>
            <Input
              id="alt-text"
              autoFocus
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              disabled={decorative}
              placeholder="Short description for screen readers & SEO"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply() } }}
            />
            <p className="text-xs text-muted-foreground">
              Describe what the image shows, not "photo of…". Keep it under ~125 chars.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={decorative} onChange={(e) => setDecorative(e.target.checked)} />
            Decorative — screen readers can skip it
          </label>
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="button" onClick={apply} disabled={!decorative && !alt.trim()}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main editor
// ─────────────────────────────────────────────────────────────────────────────

export function RichTextEditor({ value, onChange, placeholder, uploadDir, uploadRoot }: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false)
  const [linkDialog, setLinkDialog] = useState<{ open: boolean; url: string; newTab: boolean } | null>(null)
  const [altDialog, setAltDialog] = useState<{ open: boolean; url: string; suggested: string; mode?: 'insert' | 'edit' } | null>(null)

  const insertUploadedImage = useCallback((editor: Editor, url: string, suggestedAlt: string) => {
    setAltDialog({ open: true, url, suggested: suggestedAlt })
    ;(insertUploadedImage as unknown as { pending?: Editor }).pending = editor
  }, [])

  const doUpload = useCallback(
    async (editor: Editor, file: File) => {
      if (!file.type.startsWith('image/')) return
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const { url } = await uploadImage(fd, { dir: uploadDir, root: uploadRoot })
        const base = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
        insertUploadedImage(editor, url, base)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed'
        const { toast } = await import('sonner')
        toast.error(msg)
      } finally {
        setUploading(false)
      }
    },
    [uploadDir, uploadRoot, insertUploadedImage],
  )

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // StarterKit (v3) bundles its own Link mark with openOnClick: true, which
      // would win the naming conflict and open links in a new tab on click.
      // Disable it so only our configured Link (openOnClick: false) is active.
      StarterKit.configure({ heading: { levels: [2, 3] }, link: false }),
      // resizable=false: column widths set in the editor would not survive on
      // the site anyway, and fixed widths break the responsive front-end table.
      TableKit.configure({ table: { resizable: false } }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener', class: 'text-scooter-dark underline' },
        // Explicitly enforce the protocol allowlist instead of relying on the
        // library default, so a `javascript:`/`data:` href can never be saved.
        isAllowedUri: (url, ctx) => ctx.defaultValidate(url),
      }),
      Image.configure({ HTMLAttributes: { class: 'rounded-md max-w-full' } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder ?? 'Start writing…' }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[320px] px-5 py-4 focus:outline-none',
      },
      // Drag-drop image support — table stakes.
      handleDrop(view, event, _slice, moved) {
        if (moved) return false
        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false
        const images = Array.from(files).filter((f) => f.type.startsWith('image/'))
        if (images.length === 0) return false
        event.preventDefault()
        const ed = (view as unknown as { editor?: Editor }).editor
        if (ed) {
          for (const f of images) void doUpload(ed, f)
        }
        return true
      },
      // Paste-image support: pastes from clipboard (screenshots).
      handlePaste(view, event) {
        const files = event.clipboardData?.files
        if (!files || files.length === 0) return false
        const images = Array.from(files).filter((f) => f.type.startsWith('image/'))
        if (images.length === 0) return false
        event.preventDefault()
        const ed = (view as unknown as { editor?: Editor }).editor
        if (ed) {
          for (const f of images) void doUpload(ed, f)
        }
        return true
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value === '' && editor?.isEmpty])

  const openLinkDialog = useCallback(() => {
    if (!editor) return
    const current = (editor.getAttributes('link').href as string | undefined) ?? ''
    const currentTarget = (editor.getAttributes('link').target as string | undefined) ?? ''
    setLinkDialog({ open: true, url: current, newTab: currentTarget === '_blank' })
  }, [editor])

  const openImagePicker = useCallback(() => {
    if (!editor) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/webp,image/gif,image/avif'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) void doUpload(editor, file)
    }
    input.click()
  }, [editor, doUpload])

  function applyLink(url: string, newTab: boolean) {
    if (!editor) return
    editor.chain().focus().extendMarkRange('link').setLink({
      href: url,
      target: newTab ? '_blank' : null,
      rel: newTab ? 'noopener noreferrer' : 'noopener',
    }).run()
    setLinkDialog(null)
  }

  function removeLink() {
    if (!editor) return
    editor.chain().focus().unsetLink().run()
    setLinkDialog(null)
  }

  function applyAlt(alt: string) {
    if (altDialog?.mode === 'edit') {
      editor?.chain().focus().updateAttributes('image', { alt }).run()
    } else {
      const pendingEditor = (insertUploadedImage as unknown as { pending?: Editor }).pending
      if (pendingEditor && altDialog) {
        pendingEditor.chain().focus().setImage({ src: altDialog.url, alt }).run()
      }
    }
    setAltDialog(null)
  }

  const openAltEditor = useCallback(() => {
    if (!editor || !editor.isActive('image')) return
    const attrs = editor.getAttributes('image')
    setAltDialog({
      open: true,
      url: (attrs.src as string) ?? '',
      suggested: (attrs.alt as string) ?? '',
      mode: 'edit',
    })
  }, [editor])

  if (!editor) return null

  return (
    <div className="rounded-md border bg-white">
      <div className="sticky top-14 md:top-0 z-20 flex flex-wrap items-center gap-0.5 rounded-t-md border-b bg-navy-50/95 backdrop-blur px-2 py-1.5">
        <ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (⌘B)">
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (⌘I)">
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (⌘U)">
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarBtn>
        <Divider />
        <ToolbarBtn
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarBtn>
        <Divider />
        <ToolbarBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
          <List className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote">
          <Quote className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block">
          <Code className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
          <Minus className="h-4 w-4" />
        </ToolbarBtn>
        <Divider />
        <ToolbarBtn
          active={editor.isActive('table')}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()}
          title="Insert table"
        >
          <TableIcon className="h-4 w-4" />
        </ToolbarBtn>
        <Divider />
        <ToolbarBtn active={editor.isActive('link')} onClick={openLinkDialog} title="Link (⌘K)">
          <LinkIcon className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          disabled={uploading}
          onClick={openImagePicker}
          title={uploading ? 'Uploading…' : 'Insert image (or drop / paste)'}
        >
          <ImagePlus className="h-4 w-4" />
        </ToolbarBtn>
        {editor.isActive('image') && (
          <ToolbarBtn onClick={openAltEditor} title="Edit image alt text">
            <Captions className="h-4 w-4" />
          </ToolbarBtn>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <ToolbarBtn disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} title="Undo (⌘Z)">
            <Undo2 className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} title="Redo (⌘⇧Z)">
            <Redo2 className="h-4 w-4" />
          </ToolbarBtn>
        </div>
      </div>
      {editor.isActive('table') && (
        <div className="flex flex-wrap items-center gap-1 border-b bg-navy-50/60 px-2 py-1 text-xs">
          <span className="mr-1 font-medium text-navy-500">Table:</span>
          <TableCtl onClick={() => editor.chain().focus().addRowAfter().run()}>+ Row</TableCtl>
          <TableCtl onClick={() => editor.chain().focus().deleteRow().run()}>− Row</TableCtl>
          <TableCtl onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Column</TableCtl>
          <TableCtl onClick={() => editor.chain().focus().deleteColumn().run()}>− Column</TableCtl>
          <TableCtl onClick={() => editor.chain().focus().toggleHeaderRow().run()}>Header row</TableCtl>
          <TableCtl danger onClick={() => editor.chain().focus().deleteTable().run()}>Delete table</TableCtl>
        </div>
      )}
      <EditorContent editor={editor} />

      <LinkDialog
        open={!!linkDialog?.open}
        initialUrl={linkDialog?.url ?? ''}
        initialNewTab={linkDialog?.newTab ?? false}
        onCancel={() => setLinkDialog(null)}
        onApply={applyLink}
        onRemove={linkDialog?.url ? removeLink : undefined}
      />

      <AltDialog
        open={!!altDialog?.open}
        previewUrl={altDialog?.url ?? ''}
        suggestedAlt={altDialog?.suggested ?? ''}
        confirmLabel={altDialog?.mode === 'edit' ? 'Save' : 'Insert'}
        onCancel={() => setAltDialog(null)}
        onApply={applyAlt}
      />
    </div>
  )
}
