'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronDown, ExternalLink, Plus, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ImageUploader } from '@/components/shared/image-uploader'
import { StringList } from '@/components/shared/string-list'
import { HelpTip } from '@/components/shared/help-tip'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import {
  saveHomepage,
  type Homepage,
  type FeaturedService,
  type FeaturedIndustry,
  type PartnerLogo,
  type LatestPost,
  type ValueProp,
} from '@/lib/actions/homepage'
import { cn } from '@/lib/utils'

interface Props {
  initial: Homepage
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alpinemar.vercel.app'

const emptyFeaturedService: FeaturedService = {
  title: '',
  href: '',
  icon: '',
  image: '',
  summary: '',
}
const emptyFeaturedIndustry: FeaturedIndustry = {
  title: '',
  href: '',
  image: '',
  body: '',
}
const emptyPartnerLogo: PartnerLogo = { name: '', src: '' }
const emptyLatestPost: LatestPost = {
  title: '',
  href: '',
  cover: '',
  excerpt: '',
}
const emptyValueProp: ValueProp = { title: '', icon: '', body: '' }

export function HomepageForm({ initial }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [h, setH] = useState<Homepage>(initial)
  const [dirty, setDirty] = useState(false)

  useUnsavedChanges(dirty)

  function update<K extends keyof Homepage>(k: K, v: Homepage[K]) {
    setH((p) => ({ ...p, [k]: v }))
    setDirty(true)
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await saveHomepage(h)
        toast.success('Homepage saved')
        setDirty(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  return (
    <>
      <div className="space-y-5 pb-24 max-w-4xl">
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          <strong>Heads up:</strong> these curated lists are saved to the site&rsquo;s data file, but the live homepage
          currently renders its own fixed content — so edits here won&rsquo;t change the homepage yet. Wiring these lists into
          the homepage is a pending dev task. (The Services and Industries <em>menus</em> and hub pages are driven from the
          master service/industry lists, not from these fields.)
        </div>

        <Section
          title="Featured services"
          description="5 pinned service cards on the homepage. Order matters."
          count={h.featuredServices.length}
          defaultOpen
          help="The curated set of service cards for the homepage 'Our Services' strip. Each card links to a service detail page and shows an icon, a short summary, and a hover-preview thumbnail. List order is the display order, top to bottom."
        >
          <FeaturedServicesEditor
            value={h.featuredServices}
            onChange={(v) => update('featuredServices', v)}
          />
        </Section>

        <Section
          title="Featured industries"
          description="3 pinned industry cards on the homepage."
          count={h.featuredIndustries.length}
          help="The industry cards highlighted in the homepage 'Industries We Service' strip. Each card shows an image, a short blurb, and links to an industry page. Verbatim copy from the live site — keep it faithful."
        >
          <FeaturedIndustriesEditor
            value={h.featuredIndustries}
            onChange={(v) => update('featuredIndustries', v)}
          />
        </Section>

        <Section
          title="Value props"
          description="4 pillars shown on the homepage."
          count={h.valueProps.length}
          help="The 'why Alpine Mar' pillars — short title + body pairs that appear as feature points in the homepage About section. Each has an icon key and a one-line body."
        >
          <ValuePropsEditor value={h.valueProps} onChange={(v) => update('valueProps', v)} />
        </Section>

        <Section
          title="Latest posts"
          description="3 blog cards pinned to the homepage. Temporary until the insights collection is wired up."
          count={h.latestPosts.length}
          help="A manual fallback list of blog cards for the homepage 'Latest Insights' strip. The live homepage currently auto-pulls the newest posts from the insights collection; this list is a hand-curated stand-in used until that wiring is finalized."
        >
          <LatestPostsEditor
            value={h.latestPosts}
            onChange={(v) => update('latestPosts', v)}
          />
        </Section>

        <Section
          title="Partner logos"
          description="Logos rendered on the services page (also mirrored in the footer treatment)."
          count={h.partnerLogos.length}
          help="The software-platform logos shown in the 'Trusted Platforms We Work With' marquee (the scrolling logo row). Order sets the marquee sequence. Upload a transparent logo per row; the marquee sizes them to a fixed height."
        >
          <PartnerLogosEditor
            value={h.partnerLogos}
            onChange={(v) => update('partnerLogos', v)}
          />
        </Section>

        <Section
          title="Integrations"
          description="Software integrations shown across the site. Plain list of names."
          count={h.integrations.length}
          help="A plain list of software/tool names (e.g. QuickBooks, NetSuite) used as integration labels across the site. Text only — no images or links here; upload logos under Partner logos instead."
        >
          <StringList
            value={h.integrations}
            onChange={(v) => update('integrations', v)}
            placeholder="e.g. QuickBooks"
            addLabel="Add integration"
          />
        </Section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur md:pl-60">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="text-xs text-muted-foreground">
            Homepage taxonomy
            {dirty && <span className="ml-2 text-amber-600">• Unsaved changes</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <a href={SITE_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                View homepage
              </a>
            </Button>
            <Button onClick={handleSave} disabled={pending}>
              <Save className="h-4 w-4" />
              {pending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

// -----------------------------------------------------------------------------
// Section wrapper
// -----------------------------------------------------------------------------

interface SectionProps {
  title: string
  description?: string
  count?: number
  defaultOpen?: boolean
  /** Optional help popover rendered inline next to the section heading. */
  help?: ReactNode
  children: ReactNode
}

function Section({ title, description, count, defaultOpen = false, help, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="rounded-lg border bg-card">
      <div className="flex items-center px-5 py-4 hover:bg-navy-50/40 transition-colors">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold flex items-center">
              {title}
              {help && <HelpTip title={title}>{help}</HelpTip>}
            </h2>
            {typeof count === 'number' && (
              <span className="text-xs font-mono text-muted-foreground bg-navy-50 px-1.5 py-0.5 rounded">
                {count}
              </span>
            )}
          </div>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          className="shrink-0 pl-3 text-left"
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 text-navy-400 shrink-0 transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>
      </div>
      {open && <div className="px-5 pb-5 pt-1 border-t">{children}</div>}
    </section>
  )
}

// -----------------------------------------------------------------------------
// Reorderable card shell used by every struct editor below
// -----------------------------------------------------------------------------

interface ItemShellProps {
  index: number
  total: number
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
  children: ReactNode
}

function ItemShell({ index, total, onMove, onRemove, children }: ItemShellProps) {
  return (
    <div className="rounded-md border bg-navy-50/40 p-3 space-y-3 relative">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Item {index + 1}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="text-xs text-navy-400 hover:text-navy-700 disabled:opacity-30 px-1.5"
            title="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="text-xs text-navy-400 hover:text-navy-700 disabled:opacity-30 px-1.5"
            title="Move down"
          >
            ↓
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {children}
    </div>
  )
}

function useListOps<T>(value: T[], onChange: (next: T[]) => void) {
  return {
    setAt: (i: number, next: T) => {
      const arr = [...value]
      arr[i] = next
      onChange(arr)
    },
    removeAt: (i: number) => onChange(value.filter((_, idx) => idx !== i)),
    move: (i: number, dir: -1 | 1) => {
      const j = i + dir
      if (j < 0 || j >= value.length) return
      const arr = [...value]
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      onChange(arr)
    },
    add: (item: T) => onChange([...value, item]),
  }
}

const ICON_HINT = "lucide-style icon key (kebab-case, e.g. 'trending-up')."

const ICON_HELP = (
  <>
    A kebab-case icon key rendered by the site&apos;s <code>Icon.astro</code> component. Only names in that
    component&apos;s allowlist work (e.g. <code>trending-up</code>, <code>calculator</code>, <code>users</code>,{' '}
    <code>shield-check</code>, <code>award</code>) — an unknown name renders as a blank icon. To add a new one, a
    developer must define its SVG path in <code>src/components/Icon.astro</code>.
  </>
)

const HREF_HINT = (
  <>
    The link target for this card. Use an internal path starting with <code>/</code> and a trailing slash — e.g.{' '}
    <code>/services/tax-planning-services/</code>. Paths must match an existing page route.
  </>
)

const THUMB_HINT = (
  <>
    The image that appears as the hover-preview thumbnail on the card. Landscape crop works best. Uploaded to{' '}
    <code>images/home</code>.
  </>
)

// -----------------------------------------------------------------------------
// Featured services editor
// -----------------------------------------------------------------------------

interface FeaturedServicesEditorProps {
  value: FeaturedService[]
  onChange: (next: FeaturedService[]) => void
}

function FeaturedServicesEditor({ value, onChange }: FeaturedServicesEditorProps) {
  const ops = useListOps(value, onChange)
  return (
    <div className="space-y-3 pt-3">
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No items yet.</p>
      )}
      {value.map((item, i) => (
        <ItemShell
          key={i}
          index={i}
          total={value.length}
          onMove={(dir) => ops.move(i, dir)}
          onRemove={() => ops.removeAt(i)}
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={item.title}
                onChange={(e) => ops.setAt(i, { ...item, title: e.target.value })}
                placeholder="Tax Planning"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Href
                <HelpTip title="Where the card links">
                  {HREF_HINT}
                </HelpTip>
              </Label>
              <Input
                value={item.href}
                onChange={(e) => ops.setAt(i, { ...item, href: e.target.value })}
                placeholder="/services/tax-planning-services/"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>
              Icon
              <HelpTip title="Icon key">
                {ICON_HELP}
              </HelpTip>
            </Label>
            <Input
              value={item.icon}
              onChange={(e) => ops.setAt(i, { ...item, icon: e.target.value })}
              placeholder="trending-up"
            />
            <p className="text-[11px] text-muted-foreground">{ICON_HINT}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Summary</Label>
            <Textarea
              value={item.summary}
              onChange={(e) => ops.setAt(i, { ...item, summary: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Image
              <HelpTip title="Hover-preview thumbnail">
                {THUMB_HINT}
              </HelpTip>
            </Label>
            <ImageUploader
              value={item.image}
              onChange={(url) => ops.setAt(i, { ...item, image: url })}
              uploadDir="images/home"
            />
          </div>
        </ItemShell>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => ops.add({ ...emptyFeaturedService })}
      >
        <Plus className="h-4 w-4" />
        Add featured service
      </Button>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Featured industries editor
// -----------------------------------------------------------------------------

interface FeaturedIndustriesEditorProps {
  value: FeaturedIndustry[]
  onChange: (next: FeaturedIndustry[]) => void
}

function FeaturedIndustriesEditor({ value, onChange }: FeaturedIndustriesEditorProps) {
  const ops = useListOps(value, onChange)
  return (
    <div className="space-y-3 pt-3">
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No items yet.</p>
      )}
      {value.map((item, i) => (
        <ItemShell
          key={i}
          index={i}
          total={value.length}
          onMove={(dir) => ops.move(i, dir)}
          onRemove={() => ops.removeAt(i)}
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={item.title}
                onChange={(e) => ops.setAt(i, { ...item, title: e.target.value })}
                placeholder="Healthcare"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Href
                <HelpTip title="Where the card links">
                  {HREF_HINT}
                </HelpTip>
              </Label>
              <Input
                value={item.href}
                onChange={(e) => ops.setAt(i, { ...item, href: e.target.value })}
                placeholder="/industries/healthcare-accounting-services/"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Body</Label>
            <Textarea
              value={item.body}
              onChange={(e) => ops.setAt(i, { ...item, body: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Image
              <HelpTip title="Card image">
                The image on the industry card. It renders in a wide landscape crop (roughly 12:5, capped near 250px
                tall), so use a horizontal photo. Uploaded to <code>images/home</code>.
              </HelpTip>
            </Label>
            <ImageUploader
              value={item.image}
              onChange={(url) => ops.setAt(i, { ...item, image: url })}
              uploadDir="images/home"
            />
          </div>
        </ItemShell>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => ops.add({ ...emptyFeaturedIndustry })}
      >
        <Plus className="h-4 w-4" />
        Add featured industry
      </Button>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Value props editor
// -----------------------------------------------------------------------------

interface ValuePropsEditorProps {
  value: ValueProp[]
  onChange: (next: ValueProp[]) => void
}

function ValuePropsEditor({ value, onChange }: ValuePropsEditorProps) {
  const ops = useListOps(value, onChange)
  return (
    <div className="space-y-3 pt-3">
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No items yet.</p>
      )}
      {value.map((item, i) => (
        <ItemShell
          key={i}
          index={i}
          total={value.length}
          onMove={(dir) => ops.move(i, dir)}
          onRemove={() => ops.removeAt(i)}
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={item.title}
                onChange={(e) => ops.setAt(i, { ...item, title: e.target.value })}
                placeholder="Big-firm experience"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Icon
                <HelpTip title="Icon key">
                  {ICON_HELP}
                </HelpTip>
              </Label>
              <Input
                value={item.icon}
                onChange={(e) => ops.setAt(i, { ...item, icon: e.target.value })}
                placeholder="award"
              />
              <p className="text-[11px] text-muted-foreground">{ICON_HINT}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Body</Label>
            <Textarea
              value={item.body}
              onChange={(e) => ops.setAt(i, { ...item, body: e.target.value })}
              rows={3}
            />
          </div>
        </ItemShell>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => ops.add({ ...emptyValueProp })}
      >
        <Plus className="h-4 w-4" />
        Add value prop
      </Button>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Latest posts editor
// -----------------------------------------------------------------------------

interface LatestPostsEditorProps {
  value: LatestPost[]
  onChange: (next: LatestPost[]) => void
}

function LatestPostsEditor({ value, onChange }: LatestPostsEditorProps) {
  const ops = useListOps(value, onChange)
  return (
    <div className="space-y-3 pt-3">
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No items yet.</p>
      )}
      {value.map((item, i) => (
        <ItemShell
          key={i}
          index={i}
          total={value.length}
          onMove={(dir) => ops.move(i, dir)}
          onRemove={() => ops.removeAt(i)}
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={item.title}
                onChange={(e) => ops.setAt(i, { ...item, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Href
                <HelpTip title="Where the card links">
                  The link to the post. Use the internal blog path with a trailing slash, e.g.{' '}
                  <code>/blog/your-post-slug/</code>.
                </HelpTip>
              </Label>
              <Input
                value={item.href}
                onChange={(e) => ops.setAt(i, { ...item, href: e.target.value })}
                placeholder="/blog/…/"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Excerpt</Label>
            <Textarea
              value={item.excerpt}
              onChange={(e) => ops.setAt(i, { ...item, excerpt: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Cover image</Label>
            <ImageUploader
              value={item.cover}
              onChange={(url) => ops.setAt(i, { ...item, cover: url })}
              uploadDir="images/blog"
            />
          </div>
        </ItemShell>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => ops.add({ ...emptyLatestPost })}
      >
        <Plus className="h-4 w-4" />
        Add pinned post
      </Button>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Partner logos editor
// -----------------------------------------------------------------------------

interface PartnerLogosEditorProps {
  value: PartnerLogo[]
  onChange: (next: PartnerLogo[]) => void
}

function PartnerLogosEditor({ value, onChange }: PartnerLogosEditorProps) {
  const ops = useListOps(value, onChange)
  return (
    <div className="space-y-3 pt-3">
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No items yet.</p>
      )}
      {value.map((item, i) => (
        <ItemShell
          key={i}
          index={i}
          total={value.length}
          onMove={(dir) => ops.move(i, dir)}
          onRemove={() => ops.removeAt(i)}
        >
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={item.name}
              onChange={(e) => ops.setAt(i, { ...item, name: e.target.value })}
              placeholder="QuickBooks"
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Logo
              <HelpTip title="Logo image">
                The platform logo shown in the homepage marquee. Use a transparent PNG/WebP; the marquee renders it at a
                fixed small height (~28-32px) and auto-scales the width, so a wide, single-color/mono lockup reads best.
                Uploaded to <code>images</code>.
              </HelpTip>
            </Label>
            <ImageUploader
              value={item.src}
              onChange={(url) => ops.setAt(i, { ...item, src: url })}
              uploadDir="images"
            />
          </div>
        </ItemShell>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => ops.add({ ...emptyPartnerLogo })}
      >
        <Plus className="h-4 w-4" />
        Add logo
      </Button>
    </div>
  )
}
